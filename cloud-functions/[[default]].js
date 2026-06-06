import express from "express";
import { parseString, Builder } from 'xml2js';
import axios from 'axios';
import crypto from 'crypto';

const app = express();

const config = {
  token: process.env.WX_TOKEN,
  encodingAESKey: process.env.WX_ENCODING_AES_KEY,
  appId: process.env.WX_APP_ID,
  feishuWebhookUrl: process.env.FEISHU_WEBHOOK_URL
};

// 启动时校验必要配置
const requiredConfigs = ['token', 'encodingAESKey', 'appId', 'feishuWebhookUrl'];
const missingConfigs = requiredConfigs.filter(key => !config[key]);
if (missingConfigs.length > 0) {
  console.error(`缺少必要环境变量: ${missingConfigs.map(k => `WX_${k.toUpperCase()}`).join(', ')}`);
}

// PKCS7 解码
function pkcs7Decode(data) {
  const pad = data[data.length - 1];
  if (pad < 1 || pad > 32) {
    return data;
  }
  return data.slice(0, data.length - pad);
}

// AES-256-CBC 解密
function decryptMessage(encrypted, encodingAesKey) {
  const aesKey = Buffer.from(encodingAesKey + '=', 'base64');
  const iv = aesKey.slice(0, 16);
  const encryptedBuffer = Buffer.from(encrypted, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
  decipher.setAutoPadding(false);

  const decrypted = pkcs7Decode(Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]));
  const msgLen = decrypted.readUInt32BE(16);
  return decrypted.slice(20, 20 + msgLen).toString('utf8');
}

// 计算签名
function calcSignature(...parts) {
  return crypto.createHash('sha1').update(parts.sort().join('')).digest('hex');
}

app.use(express.json());
app.use(express.text({ type: 'text/xml' }));

// 微信公众号验证
app.get("/wechat", (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query;

  if (!config.token || !signature || !timestamp || !nonce || !echostr) {
    return res.status(400).send('Bad request');
  }

  if (calcSignature(config.token, timestamp, nonce) === signature) {
    res.send(echostr);
  } else {
    res.status(403).send('Forbidden');
  }
});

// 推送消息到飞书
async function sendToFeishu(content) {
  try {
    await axios.post(config.feishuWebhookUrl, {
      msg_type: 'text',
      content: { text: content }
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });
  } catch (error) {
    console.error('飞书推送失败:', error.message);
  }
}

// 格式化消息内容
function extractContent(msgType, msg) {
  switch (msgType) {
    case 'text':
      return msg.Content || '';
    case 'image':
      return '[图片]';
    case 'voice':
      return msg.Recognition || '[语音]';
    case 'video':
    case 'shortvideo':
      return '[视频]';
    case 'location':
      return `[位置] ${msg.Label || ''}`;
    case 'link':
      return `[链接] ${msg.Title || ''}`;
    case 'event':
      return formatEventContent(msg.Event, msg.EventKey);
    default:
      return `[${msgType}]`;
  }
}

function formatEventContent(eventType, eventKey) {
  switch (eventType) {
    case 'subscribe':
      return eventKey ? `扫码关注` : '关注';
    case 'unsubscribe':
      return '取消关注';
    case 'CLICK':
      return `点击菜单: ${eventKey || ''}`;
    case 'VIEW':
      return `点击链接: ${eventKey || ''}`;
    default:
      return eventType;
  }
}

function formatMessage(msgType, msg, fromUser, createTime) {
  const time = new Date(createTime * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  const isEvent = msgType === 'event';
  const title = isEvent ? '【微信公众号事件】' : '【微信公众号消息】';
  const content = extractContent(msgType, msg);
  const typeLabel = {
    text: '📝 文本', image: '🖼️ 图片', voice: '🎵 语音',
    video: '🎬 视频', shortvideo: '🎬 小视频', location: '📍 位置',
    link: '🔗 链接', event: '📋 事件'
  }[msgType] || '📦 其他';

  return `${title}\n发送者: ${fromUser}\n时间: ${time}\n${typeLabel}: ${content}`;
}

// 解析 XML（Promise 封装）
function parseXml(xml) {
  return new Promise((resolve, reject) => {
    parseString(xml, { explicitArray: false }, (err, result) => {
      if (err) reject(err);
      else resolve(result.xml || {});
    });
  });
}

// 接收微信公众号消息
app.post("/wechat", async (req, res) => {
  try {
    const rawBody = req.body;
    let xmlData = rawBody;

    // 解析初始 XML，判断是否加密
    const initialMsg = await parseXml(rawBody);

    if (initialMsg.Encrypt) {
      // 安全模式：验证签名并解密
      const { msg_signature, timestamp, nonce } = req.query;
      if (calcSignature(config.token, timestamp, nonce, initialMsg.Encrypt) !== msg_signature) {
        return res.status(403).send('Forbidden');
      }
      try {
        xmlData = decryptMessage(initialMsg.Encrypt, config.encodingAESKey);
      } catch {
        return res.status(500).send('Decryption failed');
      }
    }

    // 解析最终消息
    const msg = await parseXml(xmlData);
    const msgType = msg.MsgType || 'unknown';
    const fromUser = msg.FromUserName || 'unknown';
    const toUser = msg.ToUserName || 'unknown';
    const createTime = msg.CreateTime || 0;

    // 推送到飞书（不等待结果，避免阻塞回复）
    const feishuMsg = formatMessage(msgType, msg, fromUser, createTime);
    sendToFeishu(feishuMsg).catch(err => console.error('飞书推送异常:', err.message));

    // 回复微信
    const builder = new Builder({ rootName: 'xml', headless: true });
    const replyMsg = builder.buildObject({
      ToUserName: fromUser,
      FromUserName: toUser,
      CreateTime: Math.floor(Date.now() / 1000),
      MsgType: 'text',
      Content: '消息已收到，我们会尽快处理！'
    });

    res.type('application/xml').send(replyMsg);
  } catch (error) {
    console.error('消息处理异常:', error.message);
    res.send('');
  }
});

// 健康检查
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;
