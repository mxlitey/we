// 消息类型过滤

/**
 * 支持的消息类型
 * 用户消息: text, image, voice, video, shortvideo, location, link
 * 事件: subscribe, unsubscribe, click, view
 */
const ALL_MSG_TYPES = [
  'text', 'image', 'voice', 'video', 'shortvideo', 'location', 'link',
  'subscribe', 'unsubscribe', 'click', 'view'
];

/**
 * 解析配置的消息类型
 * @param {string} configStr - 配置字符串，如 "text,image,subscribe" 或 "all"
 * @returns {Set<string>} 允许的消息类型集合
 */
export function parseMsgTypes(configStr) {
  if (!configStr || configStr.toLowerCase() === 'all') {
    return new Set(ALL_MSG_TYPES);
  }

  const types = configStr
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(t => ALL_MSG_TYPES.includes(t));

  return new Set(types.length > 0 ? types : ALL_MSG_TYPES);
}

/**
 * 检查消息是否应该推送
 * @param {string} msgType - 消息类型
 * @param {object} msg - 消息对象
 * @param {Set<string>} allowedTypes - 允许的类型集合
 * @returns {boolean}
 */
export function shouldPush(msgType, msg, allowedTypes) {
  // 用户消息直接用 msgType
  if (msgType !== 'event') {
    return allowedTypes.has(msgType);
  }

  // 事件类型需要转换
  const eventType = msg.Event?.toLowerCase();
  const mappedType = eventType === 'click' || eventType === 'view' ? eventType : eventType;

  return allowedTypes.has(mappedType);
}
