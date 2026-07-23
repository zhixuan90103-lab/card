# wg_a · iOS / Safari WebGPU 平台矩阵

- **日期：** 2026-07-23（R1）
- **可信度：** ✅ Apple / WebKit 官方 · 🟡 CanIUse / web.dev 旁证 · 真机本仓 **未测**
- **映射：** Q-A3 · Q-A4 · Q-A5 · H4 · 矩阵 §4.2

---

## 来源

| # | URL | 类型 |
|---|-----|------|
| 1 | https://webkit.org/blog/17333/webkit-features-in-safari-26-0/ | ✅ WebKit 官方（2025-09-15） |
| 2 | https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/ | ✅ WWDC25 beta 说明 |
| 3 | https://caniuse.com/webgpu | 🟡 聚合表（2026-07 抓取口径） |
| 4 | https://web.dev/blog/webgpu-supported-major-browsers | 🟡 Google（2025-11） |
| 5 | https://github.com/gpuweb/gpuweb/wiki/Implementation-Status | 🟡 工作组 wiki |

---

## 可迁移句

### Safari / iOS 正式支持（权威）

WebKit（Safari 26.0 特性文）：

> WebKit for Safari 26.0 adds support for WebGPU.  
> … shipping in Safari 26.0 for **macOS, iOS, iPadOS, and visionOS**.  
> WebGPU **supersedes WebGL** on these platforms and is **preferred for new sites and web apps**.

WWDC25 beta 文同样：Safari 26 beta 起 WebGPU；此前 STP 已开一年以上。

**产品含义：**

| 系统 / 浏览器 | WebGPU（文献） |
|---------------|----------------|
| **iOS 26 + Safari 26** | ✅ 默认可用（官方 shipping） |
| **iPadOS 26 / macOS 26 Safari** | ✅ 同上 |
| **iOS 17.x–18.x Safari** | 多为 **未支持或需 Feature Flag**（CanIUse：17.4–18.7 disabled by default） |
| 更早 iOS | ❌ |

CanIUse（抓取时口径）：Safari on iOS **26.0+ Supported**；此前 17.4–18.7 Disabled by default。

### 与「iOS 18.2 默认开启」社区说法

2024 末–2025 有 HN/论坛称 iOS 18.2 默认开启 WebGPU；同时有人在 18.4 仍关闭。  
**本轨认源优先级：** WebKit **Safari 26 shipping** 文 > 零散 18.x 见闻。  
POC 验收：**以 `navigator.gpu` + Pixi init 实测** 为准，不写死 18.2。

### 桌面 Chrome / 其它

| 环境 | 文献状态 |
|------|----------|
| Chrome / Edge 桌面 | 长期默认支持（Chrome 113+ 量级） |
| Chrome Android | 有条件支持（Android 12+ 等，见 web.dev） |
| Firefox | 分平台；部分仍 flag（低权，本仓主路径非 Firefox） |

### 框架举例（WebKit 文）

Babylon / Three / Unity / PlayCanvas / Transformers.js / ONNX 等在 Safari 26 beta 称 “work great”。  
**未点名 PixiJS** → 对本仓无直接担保，仅说明 Apple 鼓励框架层接入。

---

## 对本仓矩阵的初填（R1 · 未 POC）

| 环境 | WebGPU 可用？ | Pixi 预期 | 建议默认 | 证据 |
|------|---------------|-----------|----------|------|
| macOS Chrome 最新 | 高概率 ✅ | webgpu 可 init | 实验可 | 行业通用 + 源码 isWebGPUSupported |
| macOS Safari 26 | ✅ 文献 | 可试 webgpu | 实验 | WebKit |
| macOS Safari ≤18 | 低/flag | 应回退 webgl | webgl | CanIUse |
| iOS Safari 26 | ✅ 文献 | 可试 | 实验 | WebKit |
| iOS Safari ≤18 | 多为否/flag | **应回退 webgl** | **webgl** | CanIUse |
| Capacitor iOS | **见 wg_a_capacitor** | 可能长期 webgl | **webgl 直至真机** | issue 旁证 |
| Android | P2 | — | 不挡 iOS 决策 | — |

---

## 不可迁移

- Apple「preferred for new sites」是 **平台立场**，不自动覆盖本仓 **保效果 + Capacitor** 约束。  
- 不把 Reddit「iOS 26 WebGPU 很乱」当结案；可作 R4 真机风险提示（低权）。

---

## 开放问题（交给 R3/R4）

1. 目标最低 iOS 版本是多少？若含 17/18，则 **D-WG2 不可能**。  
2. Safari 26 上 Pixi mask + Graphics 是否有 WebKit 专属 bug？  
3. 与 WebGL 同页切换 / 后台恢复是否更差？
