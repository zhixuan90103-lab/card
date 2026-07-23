# 2026-07-23 · 真机适配根治（黑边 + 压扁）

## 根因（调研结论）

| 现象 | 根因 |
|------|------|
| 底部黑条 | Capacitor `ios.contentInset: 'automatic'` 把 WebView **内缩**，外侧露系统黑底；再叠 CSS `env(safe-area)` 双重内缩 |
| 画面压扁 | `#phone-frame` 曾被设为 `width/height:100%` + `aspect-ratio:auto`，CSS 尺寸比 ≠ **393:852**，Pixi 设计画布被 **非等比拉伸** |
| CSS 难修稳 | iOS `100dvh` / `visualViewport` / safe-area 与 contentInset 互相打架 |

## 根治方案

1. **`contentInset: 'never'`** — WebView 全铺；安全区只在内容层处理  
2. **`shellLayout.ts`** — 用 `visualViewport` 量宽高，**JS 等比 contain** 设 frame 的 px  
3. **Pixi `frameResolution` 用 `Math.min`**（contain），与 frame 一致  
4. **窗口 / Launch 背景 `#efe5d9`** — 杜绝系统黑条  
5. **仅竖屏** — 避免横屏破坏 shell  

## 文件

- `capacitor.config.ts`
- `src/viewport/shellLayout.ts`（新）
- `src/render/app.ts`
- `src/styles.css`
- `ios/App/App/AppDelegate.swift`
- `ios/App/App/Info.plist`
- `index.html`（尽早加 `native-app` class）

---

## 动画裁切补丁

**根因：** Pixi 画布严格 393×852，消牌上抛/分飞坐标超出即被 WebGL 裁掉（CSS overflow 救不了）。

**修法：**
- `FX_PAD_X/Y` 扩大渲染缓冲；`world` 偏移，布局仍用设计坐标
- canvas CSS 大于 `#phone-frame` 并居中，`overflow: visible`
- `exitOffPad` 加大，飞出过程在 bleed 里可见

