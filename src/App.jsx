import React, { useState, useEffect } from 'react'
import { Card, Divider, Button, Typewriter, Cursor } from 'animal-island-ui'
import './App.css'

// ============================================
// Styles — 完全对齐官方 HomePage
// ============================================
const S = {
  page: { width: '100%', minHeight: '100vh', overflowY: 'auto', overflowX: 'hidden' },
  hero: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', padding: '60px 40px 40px', position: 'relative',
  },
  heroContent: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 150, alignItems: 'center',
    maxWidth: 880, width: '100%',
  },
  heroContentMobile: {
    display: 'grid', gridTemplateColumns: '1fr', gap: 32, alignItems: 'center',
    maxWidth: 880, width: '100%',
  },
  heroText: { textAlign: 'left' },
  heroTitle: {
    fontFamily: "Nunito, 'ZCOOL KuaiLe', -apple-system, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    fontSize: 55, fontWeight: 800, lineHeight: 1.1, color: '#FFF9E6',
    textShadow: '0px 4px 1px rgba(0, 0, 0, 0.4)', margin: '0 0 12px',
  },
  heroVersion: {
    display: 'inline-block', fontSize: 12, fontWeight: 600, padding: '2px 10px',
    borderRadius: 10, background: '#e6f9f6', color: '#19c8b9', marginLeft: 8,
    verticalAlign: 'middle', textShadow: 'none',
  },
  heroSubtitle: {
    fontSize: 17, color: '#7c5734', lineHeight: 1.7, margin: '0 0 28px', maxWidth: 520,
  },
  heroActions: { display: 'flex', gap: 16, alignItems: 'center' },
  section: { padding: '48px 40px', maxWidth: 960, margin: '0 auto' },
  sectionTitle: {
    fontFamily: "Nunito, -apple-system, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    fontSize: 24, fontWeight: 700, color: '#725d42', margin: '0 0 8px', textAlign: 'center',
  },
  sectionDesc: { fontSize: 14, color: '#7c5734', textAlign: 'center', marginBottom: 32 },
  features: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 },
  featureCard: { padding: '24px 20px', textAlign: 'center' },
  featureTitle: { fontSize: 15, fontWeight: 700, color: '#725d42', marginBottom: 6 },
  featureDesc: {
    fontSize: 13, color: '#7c5734', lineHeight: 1.6,
    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
    overflow: 'hidden', textOverflow: 'ellipsis',
  },
  compGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 },
  compCard: { padding: '16px 20px', cursor: 'pointer' },
  compName: { fontSize: 15, fontWeight: 700, color: '#725d42', marginBottom: 4 },
  compDesc: { fontSize: 12, color: '#7c5734', lineHeight: 1.5 },
  codeBox: {
    maxWidth: 600, margin: '0 auto', padding: '20px 28px', background: '#2b2118',
    border: '1px solid #3d3028', borderRadius: 20,
    fontFamily: "'SF Mono', 'Fira Code', Consolas, monospace",
    fontSize: 13, fontWeight: 600, color: '#e8d5bc', textAlign: 'left',
    lineHeight: 1.8, whiteSpace: 'pre', overflow: 'auto', tabSize: 4,
  },
  footer: { padding: '32px 40px', textAlign: 'center', fontSize: 12, color: '#7c5734', marginTop: 32 },
  footerLinks: { display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 12 },
  footerLink: { fontSize: 13, color: '#7c5734', cursor: 'pointer' },
}

// ============================================
// Data
// ============================================
const features = [
  { icon: 'nook1.svg', title: '实时推送', desc: '微信公众号消息实时转发到群机器人，支持文本/图片/语音/视频等多种消息类型' },
  { icon: 'Property-Shopping.svg', title: '多平台支持', desc: '飞书 / 企业微信 / 钉钉，根据 webhook 地址自动适配消息格式' },
  { icon: 'Property-Camera.svg', title: '消息订阅', desc: '自定义推送哪些类型的消息，只接收你关心的内容' },
  { icon: 'Property-Recipes.svg', title: '灵活配置', desc: '环境变量配置，支持明文/安全/兼容三种加密模式，无需修改代码' },
]

const apiList = [
  { method: 'POST', path: '/wechat', desc: '微信服务器验证 & 消息接收' },
  { method: 'GET', path: '/health', desc: '健康检查接口' },
]

const platformList = ['飞书 Lark', '企业微信', '钉钉 DingTalk']

const msgTypes = [
  { key: 'text', name: 'text', desc: '文本消息' },
  { key: 'image', name: 'image', desc: '图片消息' },
  { key: 'voice', name: 'voice', desc: '语音消息' },
  { key: 'video', name: 'video', desc: '视频消息' },
  { key: 'shortvideo', name: 'shortvideo', desc: '小视频消息' },
  { key: 'location', name: 'location', desc: '位置消息' },
  { key: 'link', name: 'link', desc: '链接消息' },
  { key: 'subscribe', name: 'subscribe', desc: '用户关注' },
  { key: 'unsubscribe', name: 'unsubscribe', desc: '用户取消关注' },
  { key: 'click', name: 'click', desc: '点击菜单按钮' },
  { key: 'view', name: 'view', desc: '点击菜单跳转链接' },
]

const encryptModes = [
  { mode: '明文模式', desc: '消息不加密，直接解析' },
  { mode: '安全模式', desc: '消息加密传输，验证签名后解密' },
  { mode: '兼容模式', desc: '同时包含明文和密文，优先解密' },
]

const msgExamples = [
  {
    title: '用户发送文本消息时：',
    code: `【微信公众号消息】
发送者: oiEcE2G7BD__B3Dui-GvGI538Rk0
时间: 2026/6/7 12:00:00
📝 文本: 你好`
  },
  {
    title: '新用户关注时：',
    code: `【微信公众号事件】
发送者: oiEcE2G7BD__B3Dui-GvGI538Rk0
时间: 2026/6/7 12:00:00
📋 事件: 关注`
  },
]

// ============================================
// FeatureCard — 官方实现：img + iconBounce
// ============================================
const FeatureCard = ({ feature }) => {
  const [hovered, setHovered] = useState(false)
  return (
    <Card
      style={{
        ...S.featureCard,
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? '0 8px 24px rgba(114, 93, 66, 0.15)' : 'none',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={`/img/nook-phone/${feature.icon}`}
        style={{
          width: 42, height: 42,
          transform: hovered ? 'scale(1.1) rotate(-4deg)' : 'scale(1) rotate(0deg)',
          transition: 'transform 0.3s ease',
          animation: hovered ? 'iconBounce 0.4s ease forwards' : 'none',
        }}
        alt={feature.title}
      />
      <style>{`
        @keyframes iconBounce {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.2) rotate(-5deg); }
          100% { transform: scale(1.1) rotate(-4deg); }
        }
      `}</style>
      <div style={S.featureTitle}>{feature.title}</div>
      <div style={S.featureDesc}>{feature.desc}</div>
    </Card>
  )
}

// ============================================
// useIsMobile — 官方 hook
// ============================================
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return isMobile
}

// ============================================
// App
// ============================================
function App() {
  const isMobile = useIsMobile()
  const [showScrollHint, setShowScrollHint] = useState(true)

  useEffect(() => {
    const handleScroll = () => setShowScrollHint(window.scrollY <= 70)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <Cursor>
      <style>{`
        @keyframes bgScroll {
          0% { background-position: 100% 0%; }
          100% { background-position: 0% 100%; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: 1; }
          50% { transform: translateX(-50%) translateY(-8px); opacity: 0.7; }
        }
      `}</style>

      <div style={S.page}>
        {/* Hero */}
        <div style={S.hero}>
          <div style={isMobile ? S.heroContentMobile : S.heroContent}>
            {isMobile && (
              <div style={{ textAlign: 'center' }}>
                <img src="/img/animal_icon.png" style={{ width: 180, height: 112 }} alt="logo" decoding="async" />
              </div>
            )}
            <div style={isMobile ? { textAlign: 'center' } : S.heroText}>
              <h1 style={{ ...S.heroTitle, fontSize: isMobile ? 37 : 60 }}>
                {isMobile ? '公众号私信转发' : (<>公众号 <br /> 私信转发</>)}
                <span style={S.heroVersion}>v2.0.0</span>
              </h1>
              <Typewriter speed={60}>
                <p style={{ ...S.heroSubtitle, fontSize: isMobile ? 14 : 17 }}>
                  将公众号消息实时推送到群机器人，由腾讯云 EdgeOne 全球加速网络支撑
                </p>
              </Typewriter>
              <div style={{ ...S.heroActions, justifyContent: isMobile ? 'center' : 'flex-start' }}>
                <Button type="primary" size="large" onClick={() => window.open('https://developers.weixin.qq.com/platform', '_blank')}>
                  开始使用 →
                </Button>
              </div>
            </div>
            {!isMobile && (
              <div style={{ textAlign: 'center' }}>
                <img src="/img/animal_icon.png" style={{ width: 320, height: 200 }} alt="logo" decoding="async" />
              </div>
            )}
          </div>
        </div>

        {/* 向下滑动提示 — 官方实现：absolute + SVG 箭头 */}
        <div style={{
          position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer',
          animation: showScrollHint ? 'bounce 2s ease-in-out infinite' : 'none',
          opacity: showScrollHint ? 1 : 0, transition: 'opacity 0.3s ease',
          pointerEvents: showScrollHint ? 'auto' : 'none', zIndex: 10,
        }}>
          <span style={{ color: '#FFF9E6', fontSize: 12, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>向下滑动</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12l7 7 7-7" stroke="#FFF9E6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Features */}
        <div style={{ ...S.section, padding: isMobile ? '32px 16px' : '48px 40px' }}>
          <div style={S.sectionTitle}>特性</div>
          <div style={S.sectionDesc}>为什么选择这个服务</div>
          <div style={S.features}>
            {features.map((f) => (<FeatureCard key={f.title} feature={f} />))}
          </div>
        </div>

        <Divider style={{ width: isMobile ? '90%' : 800, margin: '0 auto' }} />

        {/* Platforms */}
        <div style={{ ...S.section, padding: isMobile ? '32px 16px' : '48px 40px' }}>
          <div style={S.sectionTitle}>支持平台</div>
          <div style={S.sectionDesc}>多平台消息推送支持</div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {platformList.map((p) => (
              <Card key={p} style={{ padding: '12px 24px', cursor: 'pointer' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#725d42' }}>{p}</span>
              </Card>
            ))}
          </div>
        </div>

        <Divider style={{ width: isMobile ? '90%' : 800, margin: '0 auto' }} />

        {/* API */}
        <div style={{ ...S.section, padding: isMobile ? '32px 16px' : '48px 40px' }}>
          <div style={S.sectionTitle}>API 接口</div>
          <div style={S.sectionDesc}>简单易用的接口设计</div>
          <div style={S.compGrid}>
            {apiList.map((api) => (
              <Card key={api.path} style={S.compCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                    background: '#19c8b9', color: '#fff',
                  }}>{api.method}</span>
                  <span style={S.compName}>{api.path}</span>
                </div>
                <div style={S.compDesc}>{api.desc}</div>
              </Card>
            ))}
          </div>
        </div>

        <Divider style={{ width: isMobile ? '90%' : 800, margin: '0 auto' }} />

        {/* Encrypt Modes */}
        <div style={{ ...S.section, padding: isMobile ? '32px 16px' : '48px 40px' }}>
          <div style={S.sectionTitle}>加解密模式</div>
          <div style={S.sectionDesc}>支持三种消息加解密模式</div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {encryptModes.map((m) => (
              <Card key={m.mode} style={{ padding: '16px 24px', textAlign: 'center', minWidth: 180 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#725d42', marginBottom: 4 }}>{m.mode}</div>
                <div style={{ fontSize: 12, color: '#7c5734' }}>{m.desc}</div>
              </Card>
            ))}
          </div>
        </div>

        <Divider style={{ width: isMobile ? '90%' : 800, margin: '0 auto' }} />

        {/* Message Types */}
        <div style={{ ...S.section, padding: isMobile ? '32px 16px' : '48px 40px' }}>
          <div style={S.sectionTitle}>消息类型</div>
          <div style={S.sectionDesc}>支持转发以下类型的消息和事件</div>
          <div style={S.compGrid}>
            {msgTypes.map((msg) => (
              <Card key={msg.key} style={S.compCard}>
                <div style={S.compName}>{msg.name}</div>
                <div style={S.compDesc}>{msg.desc}</div>
              </Card>
            ))}
          </div>
        </div>

        <Divider style={{ width: isMobile ? '90%' : 800, margin: '0 auto' }} />

        {/* Message Format */}
        <div style={{ ...S.section, padding: isMobile ? '32px 16px' : '48px 40px' }}>
          <div style={S.sectionTitle}>消息格式</div>
          <div style={S.sectionDesc}>推送到群机器人的消息格式</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 500, margin: '0 auto' }}>
            {msgExamples.map((ex, i) => (
              <div key={i}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#725d42', marginBottom: 8 }}>{ex.title}</div>
                <pre style={S.codeBox}>{ex.code}</pre>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ height: isMobile ? 80 : 100 }}></div>
      </div>
    </Cursor>
  )
}

export default App