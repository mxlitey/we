import axios from 'axios';

// 根据 URL 判断平台类型
export function detectPlatform(url) {
  if (!url) return null;
  if (url.includes('qyapi.weixin.qq.com')) return 'wework';
  if (url.includes('feishu.cn') || url.includes('larksuite.com')) return 'feishu';
  if (url.includes('oapi.dingtalk.com')) return 'dingtalk';
  return 'unknown';
}

// 构建消息 payload
function buildPayload(platform, content) {
  switch (platform) {
    case 'feishu':
      return { msg_type: 'text', content: { text: content } };
    case 'wework':
    case 'dingtalk':
      return { msgtype: 'text', text: { content } };
    default:
      return { msg_type: 'text', content: { text: content } };
  }
}

// 推送消息到 Webhook
export async function sendToWebhook(webhookUrl, content) {
  if (!webhookUrl) return;

  const platform = detectPlatform(webhookUrl);
  const payload = buildPayload(platform, content);

  try {
    await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });
  } catch (error) {
    console.error(`${platform || 'webhook'}推送失败:`, error.message);
  }
}
