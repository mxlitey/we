# 微信公众号私信推送飞书 Webhook

将微信公众号收到的私信实时推送到飞书群机器人。

## 项目结构

```
wechat-feishu-webhook/
├── cloud-functions/
│   └── [[default]].js   # 云函数入口
├── index.html           # 首页
├── edgeone.json         # EdgeOne Pages 配置
├── package.json         # 项目依赖
└── README.md            # 项目文档
```

## 功能说明

- 微信公众号验证接口：`GET /wechat`
- 接收微信消息并推送飞书：`POST /wechat`
- 健康检查：`GET /health`

## 部署指南

### 1. 腾讯云 EO Pages

#### 准备工作

1. 在腾讯云控制台开通 EO Pages 服务并创建新项目
2. 在「项目设置 -> 环境变量」中配置以下环境变量：

| 变量名 | 说明 | 必填 |
| --- | --- | --- |
| `WX_TOKEN` | 微信公众号后台设置的 Token | 是 |
| `WX_ENCODING_AES_KEY` | 微信公众号消息加密密钥 | 是 |
| `WX_APP_ID` | 微信公众号 AppID | 是 |
| `FEISHU_WEBHOOK_URL` | 飞书机器人 Webhook 地址 | 是 |

#### 部署步骤

1. 连接项目到您的 Git 仓库（GitHub、Gitee 等）
2. 将代码推送到仓库
3. 控制台会自动触发构建和部署
4. 部署成功后会获得访问地址（如 `https://your-project.pages.dev`）

### 2. 本地开发

#### 安装 EdgeOne CLI

```bash
npm install -g edgeone
```

#### 本地运行

```bash
npm install
npm run dev
```

访问 http://localhost:8088 查看页面。

### 3. 微信公众号配置

在微信公众号后台「设置与开发 -> 基本配置」中：

- **服务器地址(URL)**：`https://your-domain/wechat`
- **Token**：与环境变量 `WX_TOKEN` 一致
- **EncodingAESKey**：与环境变量 `WX_ENCODING_AES_KEY` 一致
- **消息加解密方式**：安全模式

## 飞书消息格式

推送的消息格式如下：

```
【微信公众号私信】
发送者: oXXXXXX
时间: 2026/6/7 12:00:00
文本消息: 用户发送的内容
```

支持的消息类型：文本、图片、语音、视频、位置、链接、事件等。

## 注意事项

- 环境变量中的 Token、EncodingAESKey 等信息务必保密
- 所有环境变量都需要在 EO Pages 后台配置，**没有默认值**
