# T6-P4 · 内部项目可复用盘点

**日期：** 2026-07-21  
**范围：** `Threejs_Work` 下与视口/Pixi/安全区相关资产  

---

## 1. NewYaran_game / yaran-game（**高相关**）

| 项 | 发现 |
|----|------|
| 引擎 | 已用 **`pixi.js` ^8.14.1**（非 Three 主渲染） |
| 脚手架 | Vite + TS；`@assetpack/core` 做 **atlas**（`npm run atlas`） |
| Application | `resolution: window.devicePixelRatio \|\| 1`；`antialias: true`（移动端可改 false） |
| Capacitor iOS | 有 iOS 工程；音频生命周期参考价值高，**phone-frame 逻辑坐标未必直接可抄** |
| 教训 | 团队 **已有 Pixi v8 实战** → 原「熟悉度 Three 偏高」需修正为 **Three 生态熟 + Pixi 已在 Yaran 落地** |

**可复用：**

1. AssetPack 图集脚本流程（牌面量产时）  
2. `Application` 初始化模式（async `app.init`）  
3. Vitest/tsx 测试习惯  

**勿直接拷贝：** Planck 物理、React 全壳、Habby SDK 广告链。

---

## 2. Bag（**视口 / 安全区高相关**）

| 路径 | 内容 |
|------|------|
| `Bag/src/styles.css` | `env(safe-area-inset-*)` + `max()` 组合用于 HUD |
| `Bag/src/main.js` | `visualViewport` `resize`/`scroll` → `resize`；`viewportHeight` 读取 |

**可复用思路：** 真机 resize 监听与 safe-area padding 模式 → 对齐 `11_viewport_iphone15.md`。  
**注意：** Bag 是 Three 场景，不是 phone-frame 固定 393×852；**比例框仍按 11 自建**。

---

## 3. Pack / ThreeJS / Mycorner

- Pack：有 safe-area 痕迹，偏 Three 业务  
- ThreeJS：教学向  
- **无** 现成 `393×852 phone-frame` 可原样搬  

---

## 4. 建议落到 Card 的动作

| 优先级 | 动作 |
|--------|------|
| P0 | POC 直接 **Pixi 8.19**；不必从零学引擎（参考 Yaran） |
| P1 | HUD safe-area 抄 Bag 的 `max(N, env())` 模式 |
| P1 | `visualViewport` 监听抄 Bag |
| P2 | 牌图集接入时对齐 Yaran AssetPack |
| — | **不要** 为了熟悉度改回 Three 主渲染 |
