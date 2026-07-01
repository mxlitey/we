# 微信公众号私信推送 Webhook

将微信公众号收到的消息和事件实时推送到飞书、企业微信、钉钉等群机器人。

## 支持的平台

根据 `WEBHOOK_URL` 地址自动识别平台：

| 平台 | URL 特征 |
|------|----------|
| 飞书 | `feishu.cn` / `larksuite.com` |
| 企业微信 | `qyapi.weixin.qq.com` |
| 钉钉 | `oapi.dingtalk.com` |

## 项目结构

```
├── node-functions/
│   ├── [[default]].js   # 云函数入口（路由处理）
│   ├── config.js        # 配置管理
│   ├── crypto.js        # 加解密（AES-256-CBC、签名验证）
│   ├── webhook.js       # Webhook 推送（平台检测+发送）
│   ├── message.js       # 消息格式化
│   ├── filter.js        # 消息类型过滤
│   └── xml.js           # XML 解析
├── index.html            # 首页
├── edgeone.json          # EdgeOne Pages 配置
├── package.json          # 项目依赖
└── README.md
```

## 支持的消息类型

### 用户消息

| 类型 | 说明 | 显示 |
|------|------|------|
| text | 文本消息 | 📝 文本：消息内容 |
| image | 图片消息 | 🖼️ 图片 |
| voice | 语音消息 | 🎵 语音（含语音识别结果） |
| video | 视频消息 | 🎬 视频 |
| shortvideo | 小视频消息 | 🎬 小视频 |
| location | 位置消息 | 📍 位置：位置名称 |
| link | 链接消息 | 🔗 链接：链接标题 |

### 事件通知

| 类型 | 说明 | 显示 |
|------|------|------|
| subscribe | 用户关注 | 📋 事件：关注 / 扫码关注 |
| unsubscribe | 用户取消关注 | 📋 事件：取消关注 |
| CLICK | 点击菜单按钮 | 📋 事件：点击菜单 |
| VIEW | 点击菜单跳转链接 | 📋 事件：点击链接 |

### 支持的加解密模式

| 模式 | 说明 |
|------|------|
| 明文模式 | 消息不加密，直接解析 |
| 安全模式 | 消息加密传输，验证签名后解密 |
| 兼容模式 | 同时包含明文和密文，优先解密 |

## 消息格式示例

用户发送文本消息时：

```
【微信公众号消息】
发送者: oiEcE2G7BD__B3Dui-GvGI538Rk0
时间: 2026/6/7 12:00:00
📝 文本: 你好
```

新用户关注时：

```
【微信公众号事件】
发送者: oiEcE2G7BD__B3Dui-GvGI538Rk0
时间: 2026/6/7 12:00:00
📋 事件: 关注
```

## 部署指南

### 环境变量

在腾讯云 EO Pages「项目设置 -> 环境变量」中配置：

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `WX_TOKEN` | 微信公众号后台设置的 Token | 是 |
| `WX_ENCODING_AES_KEY` | 微信公众号消息加密密钥 | 是 |
| `WX_APP_ID` | 微信公众号 AppID | 是 |
| `WEBHOOK_URL` | 机器人 Webhook 地址 | 是 |
| `WEBHOOK_MSG_TYPES` | 订阅的消息类型，不设置则推送全部 | 否 |
| `WX_REPLY_CONTENT` | 回复用户的文本内容，不设置则不回复 | 否 |

#### 消息类型订阅

通过 `WEBHOOK_MSG_TYPES` 环境变量控制推送哪些消息类型，多个类型用逗号分隔：

```
# 只推送文本消息和关注事件
WEBHOOK_MSG_TYPES=text,subscribe

# 只推送用户消息
WEBHOOK_MSG_TYPES=text,image,voice,video,location,link

# 推送全部（默认行为，无需设置）
WEBHOOK_MSG_TYPES=all
```

**支持的消息类型**：
- 用户消息：`text`, `image`, `voice`, `video`, `shortvideo`, `location`, `link`
- 事件：`subscribe`, `unsubscribe`, `click`, `view`

### 部署步骤

1. 将代码推送到 GitHub 仓库
2. 在 [EO Pages 控制台](https://console.cloud.tencent.com/edgeone/pages) 创建项目，连接仓库
3. 在项目设置中配置上述环境变量
4. 推送代码后自动构建部署，获得访问地址

### 微信公众号配置

在微信公众平台「设置与开发 -> 基本配置」中：

- **服务器地址(URL)**：`https://你的域名/wechat`
- **Token**：与 `WX_TOKEN` 一致
- **EncodingAESKey**：与 `WX_ENCODING_AES_KEY` 一致
- **消息加解密方式**：建议选择「安全模式」

### Webhook 配置

#### 飞书机器人

1. 在飞书群中添加「自定义机器人」
2. 获取 Webhook 地址（格式：`https://open.feishu.cn/open-apis/bot/v2/hook/xxx`）
3. 将地址填入 `WEBHOOK_URL` 环境变量

#### 企业微信机器人

1. 在企业微信群中添加「机器人」
2. 获取 Webhook 地址（格式：`https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx`）
3. 将地址填入 `WEBHOOK_URL` 环境变量

#### 钉钉机器人

1. 在钉钉群中添加「自定义机器人」
2. 获取 Webhook 地址（格式：`https://oapi.dingtalk.com/robot/send?access_token=xxx`）
3. 将地址填入 `WEBHOOK_URL` 环境变量

## 接口说明

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/wechat` | 微信服务器验证 |
| POST | `/wechat` | 接收微信消息并推送到 Webhook |
| GET | `/health` | 健康检查 |

## 本地开发

```bash
npm install -g edgeone
npm install
edgeone login
edgeone pages dev
```

访问 http://localhost:8088

## 技术栈

- **运行时**：Node.js (腾讯云 EO Pages Cloud Functions)
- **框架**：Express
- **依赖**：xml2js（XML 解析）、axios（HTTP 请求）
- **加解密**：AES-256-CBC / SHA1 签名验证
