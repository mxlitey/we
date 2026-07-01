import express from "express";
import { Builder } from 'xml2js';
import { config } from './config.js';
import { decryptMessage, calcSignature } from './crypto.js';
import { sendToWebhook } from './webhook.js';
import { formatMessage } from './message.js';
import { parseXml } from './xml.js';
import { parseMsgTypes, shouldPush } from './filter.js';

const app = express();

// 解析允许的消息类型
const allowedMsgTypes = parseMsgTypes(config.msgTypes);

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

    // 检查是否需要推送该消息类型
    if (shouldPush(msgType, msg, allowedMsgTypes)) {
      const formattedMsg = formatMessage(msgType, msg, fromUser, createTime);
      sendToWebhook(config.webhookUrl, formattedMsg).catch(err => console.error('Webhook推送异常:', err.message));
    }

    // 回复微信（设置了 WX_REPLY_CONTENT 才回复，否则返回空串让微信不展示）
    if (config.replyContent) {
      const builder = new Builder({ rootName: 'xml', headless: true });
      const replyMsg = builder.buildObject({
        ToUserName: fromUser,
        FromUserName: toUser,
        CreateTime: Math.floor(Date.now() / 1000),
        MsgType: 'text',
        Content: config.replyContent
      });
      res.type('application/xml').send(replyMsg);
    } else {
      res.send('');
    }
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
