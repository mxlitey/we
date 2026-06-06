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

// PKCS7 编码
function pkcs7Encode(data, k) {
  const blockSize = 32;
  const buffer = Buffer.alloc(blockSize);
  const length = data.length;
  const needed = blockSize - (length % blockSize);
  for (let i = 0; i < needed; i++) {
    buffer[i] = needed;
  }
  return Buffer.concat([data, buffer.slice(0, needed)]);
}

// PKCS7 解码
function pkcs7Decode(data) {
  const pad = data[data.length - 1];
  if (pad < 1 || pad > 32) {
    return data;
  }
  return data.slice(0, data.length - pad);
}

// AES 解密
function decrypt(encrypted, encodingAesKey) {
  const aesKey = Buffer.from(encodingAesKey + '=', 'base64');
  const iv = aesKey.slice(0, 16);
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
  decipher.setAutoPadding(false);
  
  let decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  decrypted = pkcs7Decode(decrypted);
  
  const msgLen = decrypted.readUInt32BE(16);
  const msg = decrypted.slice(20, 20 + msgLen).toString('utf8');
  const fromAppid = decrypted.slice(20 + msgLen).toString('utf8');
  
  return msg;
}

// 验证签名
function verifySignature(token, timestamp, nonce, encrypt) {
  const sortArr = [token, timestamp, nonce, encrypt].sort();
  const sortStr = sortArr.join('');
  const hash = crypto.createHash('sha1').update(sortStr).digest('hex');
  return hash;
}

app.use(express.json());
app.use(express.text({ type: 'text/xml' }));

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
  const rawBody = req.body;
  
  console.log('=== POST /wechat received ===');
  console.log('Content-Type:', req.get('Content-Type'));
  console.log('rawBody type:', typeof rawBody);
  console.log('rawBody keys:', typeof rawBody === 'object' ? Object.keys(rawBody) : 'not an object');
  console.log('rawBody:', JSON.stringify(rawBody));
  
  let xmlData = rawBody;
  
  // 检查是否为加密消息（安全模式）
  if (typeof rawBody === 'object' && rawBody.encrypt) {
    console.log('✓ Detected encrypted message (安全模式)');
    const { encrypt, msg_signature, timestamp, nonce } = rawBody;
    
    // 验证签名
    const calcSignature = verifySignature(config.token, timestamp, nonce, encrypt);
    console.log('Signature verification:', {
      calculated: calcSignature,
      received: msg_signature,
      match: calcSignature === msg_signature
    });
    
    if (calcSignature !== msg_signature) {
      console.error('✗ Signature verification failed!');
      return res.send('Signature verification failed');
    }
    
    // 解密消息
    try {
      xmlData = decrypt(encrypt, config.encodingAESKey);
      console.log('✓ Decrypted message:', xmlData);
    } catch (error) {
      console.error('✗ Decryption error:', error);
      return res.send('Decryption failed');
    }
  } else if (typeof rawBody === 'string' && rawBody.includes('<xml>')) {
    // 明文消息（明文模式或兼容模式）
    console.log('✓ Detected plaintext message (明文模式)');
    xmlData = rawBody;
  } else {
    console.log('✗ Unknown message format, treating as plaintext');
    xmlData = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
  }

  parseString(xmlData, { explicitArray: false }, async (err, result) => {
    if (err) {
      console.error('✗ XML parse error:', err);
      return res.send('');
    }

    const msg = result.xml;
    if (!msg) {
      console.error('✗ Invalid XML structure:', JSON.stringify(result));
      return res.send('');
    }
    
    const msgType = msg.MsgType || 'unknown';
    const fromUser = msg.FromUserName || 'unknown';
    const toUser = msg.ToUserName || 'unknown';
    const createTime = msg.CreateTime || 0;

    console.log('✓ Parsed message successfully');
    console.log('Message details:', {
      msgType,
      fromUser,
      toUser,
      createTime,
      fullMsg: JSON.stringify(msg)
    });

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
    console.log('Feishu message:', feishuMsg);
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
