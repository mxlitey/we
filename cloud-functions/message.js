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

// 格式化完整消息
export function formatMessage(msgType, msg, fromUser, createTime) {
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
