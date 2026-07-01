// 配置管理
export const config = {
  token: process.env.WX_TOKEN,
  encodingAESKey: process.env.WX_ENCODING_AES_KEY,
  appId: process.env.WX_APP_ID,
  webhookUrl: process.env.WEBHOOK_URL,
  replyContent: process.env.WX_REPLY_CONTENT,
  msgTypes: process.env.WEBHOOK_MSG_TYPES
};

// 启动时校验必要配置
const requiredConfigs = ['token', 'encodingAESKey', 'appId'];
const missingConfigs = requiredConfigs.filter(key => !config[key]);
if (missingConfigs.length > 0) {
  console.error(`缺少必要环境变量: ${missingConfigs.map(k => `WX_${k.toUpperCase()}`).join(', ')}`);
}
if (!config.webhookUrl) {
  console.warn('警告: 未配置 WEBHOOK_URL，消息将不会被推送');
}
