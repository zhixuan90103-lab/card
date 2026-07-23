# wg_a · Capacitor / WKWebView 与 WebGPU

- **日期：** 2026-07-23（R1）
- **可信度：** 🟡 社区 issue / 架构常识 · ⚠️ **无本仓真机实测** · 非 Capacitor 官方「已支持」文档
- **映射：** Q-A4 · H4 · S01–S04 · D-WG0/1 倾向

---

## 来源

| # | URL | 类型 |
|---|-----|------|
| 1 | https://github.com/ionic-team/capacitor/issues/8044 | 🟡 Feature request（2025-07 开，**Closed as not planned**） |
| 2 | Capacitor 架构常识：iOS = **WKWebView**（非 SFSafariViewController 主壳） | 已知 |
| 3 | 本仓：`@capacitor/ios` ^8.4、`npm run cap:ios` | L0 |

---

## 可迁移句

### Issue #8044（2025-07）

诉求：在 Capacitor App 中启用 WebGPU，以便 web-llm 等本地推理。

报告者称（issue 正文）：

> currently Capacitor’s WebView (**both Android and iOS**) **does not support WebGPU**

状态：**Closed as not planned**（抓取时；无官方「我们已在 X 版本打开」结论文）。

**解读（谨慎）：**

1. 2025 中仍有开发者认为 **Capacitor WebView ≠ Safari 功能全集**。  
2. 「Closed as not planned」**不等于** WebKit 永远不给 WKWebView WebGPU；更可能是 **Ionic 不会单独做一层开关**，能力跟系统 WebView 走。  
3. **iOS 26 + 新 WebKit** 之后，WKWebView 是否与 Safari 26 对齐 WebGPU，**必须本仓真机验证**（R4），不能靠此 issue 单独否决或放行。

### 架构含义（对本仓）

```text
本仓分发路径：
  Vite build → cap sync → Xcode → WKWebView 加载本地 dist

玩家主路径（iOS App）= WKWebView
浏览器次路径 = 桌面 dev / 可能的 Safari 打开

WebGPU 决策必须以 WKWebView 真机为准，
不能以 macOS Chrome POC 成功宣称「已上 WebGPU」。
```

### 与 D28 关系

- 今日空白屏根因与 **WebGL context loss in WKWebView** 强相关（design 19）。  
- 若 WebGPU 在 WKWebView 可用：device lost 语义不同，但仍需 **整视图 rehydrate**（见 wg_c）。  
- 若 WebGPU 不可用：`preference: 'webgpu'` 字符串应 **回退 WebGL**（wg_b）→ 玩家仍可玩；**默认 preference 仍建议 webgl** 直到 R4 证明稳定。

---

## 初答 Q-A4

| 问题 | R1 答案 |
|------|---------|
| Capacitor iOS 是否暴露 WebGPU？ | **未知 / 历史报不支持**；iOS 26 后 **待真机** |
| 与 Safari 是否同策略？ | **不保证**；历史上 Feature Flag / 能力常不同步 |
| 建议默认 | **维持 `webgl`**；实验 flag 可试 webgpu；**禁止**未测改 D-WG2 |

---

## 不可迁移

- 不把「AI 推理需要 WebGPU」的动机写成我们迁移理由。  
- 不把 closed issue 当成「Capacitor 官方永久禁用 WebGPU」。

---

## R4 真机检查单（预写）

在 **本仓** Capacitor iOS 注入临时 HUD 或 `console`：

```js
!!navigator.gpu
await navigator.gpu?.requestAdapter()
// 再：app.init({ preference: 'webgpu', hello: true })
// 打印 renderer.name
```

设备至少：① 系统 **&lt; iOS 26** 一台 ② **iOS 26+** 一台（若可得）。  
记录：init 成功后端、一局可玩、后台 10s 回前台是否空白。
