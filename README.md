<div align="center">
  <img src="public/img/animal_icon.png" alt="公众号私信转发 Logo" width="120" height="75">
  <h1>公众号私信转发 · 实时通知</h1>
  <p>将微信公众号收到的消息和事件实时推送到飞书 / 企业微信 / 钉钉群机器人</p>
  <p>多平台支持 · 全消息类型 · 三种加解密模式</p>
</div>

***

## ✨ 功能特性

- 🚀 **实时推送**：公众号消息实时转发到群机器人，零延迟通知
- 📦 **多平台支持**：飞书 / 企业微信 / 钉钉，根据 webhook 地址自动适配
- 📝 **全消息类型**：文本 / 图片 / 语音 / 视频 / 位置 / 链接，全覆盖
- 📋 **事件通知**：关注 / 取消关注 / 菜单点击 / 链接跳转，全捕获
- 🔐 **三种加密**：明文 / 安全 / 兼容模式，自动识别并解密
- 🎯 **消息订阅**：自定义推送哪些类型，只接收你关心的内容
- ⚙️ **零代码配置**：环境变量配置，无需修改任何代码
- 💬 **自动回复**：可选回复用户文本内容
- 🌐 **全球加速**：腾讯云 EdgeOne Pages 全球边缘网络
- 🎨 **动物森友会风**：前端 UI 采用 animal-island-ui，温暖治愈

***

## 🚀 部署指南

> **只需 5 个环境变量，推送代码即自动部署，无需服务器。**

### 第一步：准备代码

1. 将本项目代码推送到 GitHub 仓库
2. 在 [EO Pages 控制台](https://console.cloud.tencent.com/edgeone/pages) 创建项目，连接该仓库

### 第二步：配置环境变量

在腾讯云 EO Pages「项目设置 → 环境变量」中配置：

#### 必填环境变量

| 变量名 | 说明 | 从哪来 |
|--------|------|--------|
| `WX_TOKEN` | 微信公众号后台设置的 Token | 微信公众平台「基本配置」 |
| `WX_ENCODING_AES_KEY` | 微信公众号消息加密密钥 | 微信公众平台「基本配置」 |
| `WX_APP_ID` | 微信公众号 AppID | 微信公众平台「基本配置」 |
| `WEBHOOK_URL` | 群机器人 Webhook 地址 | 见下方「Webhook 配置」 |

#### 可选环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `WEBHOOK_MSG_TYPES` | `all`（全部推送） | 订阅的消息类型，逗号分隔，不设置则推送全部 |
| `WX_REPLY_CONTENT` | 不回复 | 回复用户的文本内容，不设置则不回复 |

### 第三步：配置微信公众号

在微信公众平台「设置与开发 → 基本配置」中：

| 配置项 | 填写内容 |
|--------|----------|
| 服务器地址(URL) | `https://你的域名/wechat` |
| Token | 与 `WX_TOKEN` 一致 |
| EncodingAESKey | 与 `WX_ENCODING_AES_KEY` 一致 |
| 消息加解密方式 | 建议选择「安全模式」 |

### 第四步：部署完成

推送代码后自动构建部署，获得访问地址。微信端发送消息即可在群机器人收到通知。

***

## 📡 API 文档

所有接口的 Base URL 为你的部署地址（如 `https://your-app.edgeone.app`）。

### 微信服务器验证

```bash
curl "https://your-app.edgeone.app/wechat?signature=xxx&timestamp=123&nonce=xxx&echostr=xxx"
```

微信服务器在「基本配置」保存时调用，验证 Token 一致性，返回 `echostr`。

### 接收微信消息

```bash
curl -X POST "https://your-app.edgeone.app/wechat" \
  -H "Content-Type: text/xml" \
  -d '<xml>
        <ToUserName><![CDATA[gh_xxx]]></ToUserName>
        <FromUserName><![CDATA[oiEcE2G7BD__B3Dui-GvGI538Rk0]]></FromUserName>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[你好]]></Content>
      </xml>'
```

接收后自动推送到 `WEBHOOK_URL`，并按 `WX_REPLY_CONTENT` 配置回复。

**推送格式示例**：

```text
【微信公众号消息】
发送者: oiEcE2G7BD__B3Dui-GvGI538Rk0
时间: 2026/6/7 12:00:00
📝 文本: 你好
```

**事件推送示例**：

```text
【微信公众号事件】
发送者: oiEcE2G7BD__B3Dui-GvGI538Rk0
时间: 2026/6/7 12:00:00
📋 事件: 关注
```

### 健康检查

```bash
curl https://your-app.edgeone.app/health
```

**响应**：

```json
{
  "status": "ok",
  "timestamp": "2026-07-01T12:00:00.000Z"
}
```

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/wechat` | 微信服务器验证 |
| POST | `/wechat` | 接收微信消息并推送到 Webhook |
| GET | `/health` | 健康检查 |

***

## ⚙️ 配置说明

### 消息类型订阅

通过 `WEBHOOK_MSG_TYPES` 环境变量控制推送哪些消息类型，多个类型用逗号分隔：

```bash
# 只推送文本消息和关注事件
WEBHOOK_MSG_TYPES=text,subscribe

# 只推送用户消息
WEBHOOK_MSG_TYPES=text,image,voice,video,location,link

# 推送全部（默认行为，无需设置）
WEBHOOK_MSG_TYPES=all
```

<details>
<summary>📋 支持的消息类型完整列表</summary>

**用户消息**：

| 类型 | 说明 | 显示 |
|------|------|------|
| `text` | 文本消息 | 📝 文本：消息内容 |
| `image` | 图片消息 | 🖼️ 图片 |
| `voice` | 语音消息 | 🎵 语音（含识别结果） |
| `video` | 视频消息 | 🎬 视频 |
| `shortvideo` | 小视频消息 | 🎬 小视频 |
| `location` | 位置消息 | 📍 位置：位置名称 |
| `link` | 链接消息 | 🔗 链接：链接标题 |

**事件通知**：

| 类型 | 说明 | 显示 |
|------|------|------|
| `subscribe` | 用户关注 | 📋 事件：关注 / 扫码关注 |
| `unsubscribe` | 用户取消关注 | 📋 事件：取消关注 |
| `click` | 点击菜单按钮 | 📋 事件：点击菜单 |
| `view` | 点击菜单跳转链接 | 📋 事件：点击链接 |

</details>

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

### 加解密模式

| 模式 | 说明 |
|------|------|
| 明文模式 | 消息不加密，直接解析 |
| 安全模式 | 消息加密传输，验证签名后解密 |
| 兼容模式 | 同时包含明文和密文，优先解密 |

***

## 🏗️ 架构

```
微信公众号 ──POST /wechat──▶ EdgeOne Cloud Function
                                    │
                                    ├──▶ 验证签名 / AES 解密
                                    │
                                    ├──▶ 解析 XML / 格式化消息
                                    │
                                    └──▶ 推送到 Webhook
                                            │
                                            ├──▶ 飞书群机器人
                                            ├──▶ 企业微信群机器人
                                            └──▶ 钉钉群机器人
```

- **运行时**：腾讯云 EO Pages Cloud Functions（Node.js 22）
- **框架**：Express
- **入口**：`node-functions/[[default]].js` 处理路由
- **加解密**：AES-256-CBC / SHA1 签名验证
- **前端**：animal-island-ui 渲染展示页

***

## 📁 项目结构

```
├── node-functions/
│   ├── [[default]].js   # 云函数入口（路由处理）
│   ├── config.js        # 配置管理
│   ├── crypto.js        # 加解密（AES-256-CBC、签名验证）
│   ├── webhook.js       # Webhook 推送（平台检测 + 发送）
│   ├── message.js       # 消息格式化
│   ├── filter.js        # 消息类型过滤
│   └── xml.js           # XML 解析
├── public/
│   ├── img/             # 图标与背景资源
│   └── fonts/           # 字体文件
├── src/
│   ├── App.jsx          # 前端展示页
│   ├── App.css          # 全局样式
│   └── main.jsx         # 入口
├── index.html           # HTML 模板
├── edgeone.json         # EdgeOne Pages 配置
├── vite.config.js       # 前端构建配置
├── package.json         # 项目依赖
└── README.md
```

***

## 🔧 本地开发

```bash
npm install -g edgeone
npm install
edgeone login
edgeone pages dev
```

访问 http://localhost:8088

> 前端开发模式：`npm run dev` 启动 Vite，访问 http://localhost:3000，已配置代理转发 `/wechat` 和 `/health` 到本地 8080。

***

## ❓ 常见问题

### 部署后微信验证失败？

1. 确认 `WX_TOKEN` 与公众号后台一致
2. 确认服务器地址为 `https://你的域名/wechat`（注意带 `/wechat` 路径）
3. 确认域名已通过备案且 HTTPS 可访问

### 消息没有推送到群？

1. 确认 `WEBHOOK_URL` 已正确配置且机器人未禁用
2. 查看云函数日志中的 `Webhook推送异常` 信息
3. 确认 `WEBHOOK_MSG_TYPES` 是否过滤掉了该消息类型

### 加密消息解密失败？

1. 确认 `WX_ENCODING_AES_KEY` 与公众号后台一致（43 位）
2. 确认 `WX_APP_ID` 配置正确
3. 建议公众号后台选择「安全模式」并保持三方配置一致

### 如何只推送关注事件？

```bash
WEBHOOK_MSG_TYPES=subscribe
```

### 如何给用户回复消息？

设置 `WX_REPLY_CONTENT` 环境变量即可，用户每次发消息都会收到该回复内容。

***

## 许可证

MIT License

***

如果你觉得这个项目有用，请点个 Star ⭐
