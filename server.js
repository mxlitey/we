const express = require('express');
const { parseString, Builder } = require('xml2js');
const axios = require('axios');
const crypto = require('crypto');

const app = express();

// 配置
const config = {
  token: process.env.WX_TOKEN,
  encodingAESKey: process.env.WX_ENCODING_AES_KEY,
  appId: process.env.WX_APP_ID,
  feishuWebhookUrl: process.env.FEISHU_WEBHOOK_URL,
  port: process.env.PORT || 9000
};

// 解析原始XML请求体
app.use(express.text({ type: 'text/xml' }));
app.use(express.json());

// 微信公众号验证接口（GET请求）
app.get('/wechat', (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query;

  if (!signature || !timestamp || !nonce || !echostr) {
    return res.status(400).send('Missing parameters');
  }

  // 验证签名
  const tmpArr = [config.token, timestamp, nonce].sort();
  const tmpStr = tmpArr.join('');
  const hash = crypto.createHash('sha1').update(tmpStr).digest('hex');

  if (hash === signature) {
    res.send(echostr);
  } else {
    res.status(403).send('Invalid signature');
  }
});

// 推送消息到飞书
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

    if (response.data && response.data.code === 0) {
      console.log('飞书推送成功:', response.data.msg);
    } else {
      console.error('飞书推送失败:', JSON.stringify(response.data));
    }
  } catch (error) {
    console.error('飞书推送异常:', error.message);
  }
}

// 格式化消息内容
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

// 接收微信公众号消息（POST请求）
app.post('/wechat', (req, res) => {
  const xmlData = req.body;

  parseString(xmlData, { explicitArray: false }, async (err, result) => {
    if (err) {
      console.error('XML解析失败:', err);
      return res.send('');
    }

    const msg = result.xml;
    const msgType = msg.MsgType;
    const fromUser = msg.FromUserName;
    const toUser = msg.ToUserName;
    const createTime = msg.CreateTime;

    let content = '';

    // 根据消息类型提取内容
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

    // 格式化并推送到飞书
    const feishuMsg = formatMessage(msgType, content, fromUser, createTime);
    console.log('收到微信消息:', feishuMsg);
    await sendToFeishu(feishuMsg);

    // 回复微信服务器（被动回复）
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

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(config.port, () => {
  console.log(`服务已启动，监听端口: ${config.port}`);
  console.log(`微信消息接口: GET/POST /wechat`);
  console.log(`健康检查接口: GET /health`);
});
