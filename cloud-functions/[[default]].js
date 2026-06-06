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

app.use(express.text({ type: 'text/xml' }));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/wechat", (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query;

  console.log('WeChat verify request:', {
    signature,
    timestamp,
    nonce,
    echostr,
    hasToken: !!config.token
  });

  if (!config.token) {
    console.error('WX_TOKEN is not configured!');
    return res.status(500).send('Server configuration error');
  }

  if (!signature || !timestamp || !nonce || !echostr) {
    console.error('Missing parameters');
    return res.status(400).send('Missing parameters');
  }

  const tmpArr = [config.token, timestamp, nonce].sort();
  const tmpStr = tmpArr.join('');
  const hash = crypto.createHash('sha1').update(tmpStr).digest('hex');

  console.log('Verification:', {
    tmpArr,
    tmpStr,
    calculatedHash: hash,
    receivedSignature: signature,
    match: hash === signature
  });

  if (hash === signature) {
    console.log('Verification success, returning echostr:', echostr);
    res.send(echostr);
  } else {
    console.error('Verification failed');
    res.status(403).send('Invalid signature');
  }
});

async function sendToFeishu(content) {
  try {
    const response = await axios.post(config.feishuWebhookUrl, {
      msg_type: 'text',
      content: {
        text: content
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Feishu response:', response.data);
  } catch (error) {
    console.error('Feishu error:', error.message);
  }
}

function formatMessage(msgType, content, fromUser, createTime) {
  const time = new Date(createTime * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  let contentText = '';

  switch (msgType) {
    case 'text':
      contentText = `文本消息: ${content}`;
      break;
    case 'image':
      contentText = `图片消息: [图片]`;
      break;
    case 'voice':
      contentText = `语音消息: [语音]`;
      break;
    case 'video':
      contentText = `视频消息: [视频]`;
      break;
    case 'location':
      contentText = `位置消息: [位置]`;
      break;
    case 'link':
      contentText = `链接消息: [链接]`;
      break;
    case 'event':
      contentText = `事件消息: ${content}`;
      break;
    default:
      contentText = `其他消息(${msgType}): ${content}`;
  }

  return `【微信公众号私信】\n发送者: ${fromUser}\n时间: ${time}\n${contentText}`;
}

app.post("/wechat", async (req, res) => {
  const xmlData = req.body;

  parseString(xmlData, { explicitArray: false }, async (err, result) => {
    if (err) {
      console.error('XML parse error:', err);
      return res.send('');
    }

    const msg = result.xml;
    const msgType = msg.MsgType;
    const fromUser = msg.FromUserName;
    const toUser = msg.ToUserName;
    const createTime = msg.CreateTime;

    let content = '';

    if (msgType === 'text') {
      content = msg.Content;
    } else if (msgType === 'image') {
      content = `PicUrl: ${msg.PicUrl}`;
    } else if (msgType === 'voice') {
      content = `Recognition: ${msg.Recognition || '[语音]'}`;
    } else if (msgType === 'video' || msgType === 'shortvideo') {
      content = `[视频]`;
    } else if (msgType === 'location') {
      content = `Location_X: ${msg.Location_X}, Location_Y: ${msg.Location_Y}, Label: ${msg.Label}`;
    } else if (msgType === 'link') {
      content = `Title: ${msg.Title}, Description: ${msg.Description}, Url: ${msg.Url}`;
    } else if (msgType === 'event') {
      const eventType = msg.Event;
      content = `Event: ${eventType}`;
      if (eventType === 'subscribe') {
        content += `, EventKey: ${msg.EventKey || ''}`;
      } else if (eventType === 'unsubscribe') {
        content = '取消关注';
      } else if (eventType === 'CLICK') {
        content += `, EventKey: ${msg.EventKey}`;
      }
    }

    const feishuMsg = formatMessage(msgType, content, fromUser, createTime);
    console.log('WeChat message:', feishuMsg);
    await sendToFeishu(feishuMsg);

    const builder = new Builder({ rootName: 'xml', headless: true });
    const replyMsg = builder.buildObject({
      ToUserName: fromUser,
      FromUserName: toUser,
      CreateTime: Math.floor(Date.now() / 1000),
      MsgType: 'text',
      Content: '消息已收到，我们会尽快处理！'
    });

    res.type('application/xml').send(replyMsg);
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    config: {
      hasToken: !!config.token,
      hasEncodingAESKey: !!config.encodingAESKey,
      hasAppId: !!config.appId,
      hasFeishuWebhook: !!config.feishuWebhookUrl
    }
  });
});

export default app;
