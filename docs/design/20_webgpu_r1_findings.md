# 20-R1 · WebGPU 第一轮检索结论

**日期：** 2026-07-23  
**状态：** ✅ R1 文献薄检索完成 · **未拍板** · **未改默认 preference**  
**计划：** [`20_webgpu_research_plan.md`](./20_webgpu_research_plan.md) **v0.5**  
**反查：** [`21_webgpu_gap_audit.md`](./21_webgpu_gap_audit.md) **v2**（R3 后现行；v1 已消化）  
**源卡：**

| 轨 | 文件 |
|----|------|
| B | [`wg_b_pixi_pref_and_fallback.md`](../../research/tech-stack/sources/wg_b_pixi_pref_and_fallback.md) |
| A | [`wg_a_ios_safari_webgpu.md`](../../research/tech-stack/sources/wg_a_ios_safari_webgpu.md) |
| A | [`wg_a_capacitor_wkwebview.md`](../../research/tech-stack/sources/wg_a_capacitor_wkwebview.md) |
| C | [`wg_c_device_lost_and_d28.md`](../../research/tech-stack/sources/wg_c_device_lost_and_d28.md) |

本仓依赖：**pixi.js@8.19.0**（与 package.json 一致）。

---

## 1. 一页结论（给决策用）

| 命题 | R1 结论 | 置信 |
|------|---------|------|
| 能否在 **不换引擎** 下试 WebGPU？ | **能**：`Application.init({ preference: 'webgpu' })` | 高 |
| 不可用时会否回退 WebGL？ | **会**（preference 为 **string** 时自动补全探测链） | 高（读源码） |
| 官方是否推荐生产默认 WebGPU？ | **否**：WebGL = Recommended；WebGPU = Experimental | 高 |
| 桌面 Chrome 可 POC？ | **是**（行业默认支持） | 高 |
| iOS Safari 何时「正式」？ | **Safari / iOS 26** shipping（WebKit 官方） | 高 |
| 更旧 iOS Safari？ | 多为无 / Feature Flag | 中 |
| **Capacitor WKWebView**？ | 历史 issue 称不支持；**iOS 26 后必须真机**；不能默认等于 Safari | 中（缺实测） |
| 效果能否保证？ | 文献 **无法** 保证 mask/Graphics 像素级；须 R3 基线对照 | — |
| D28 要不要改原则？ | **原则不变**；WebGPU 须补 **device.lost** 信号（今日只有 webglcontextlost） | 高 |
| R1 建议决策倾向 | **靠近 D-WG0 或 D-WG1**，**远离立即 D-WG2** | 中 |

**一句话：**  
技术上 Pixi 8.19 已具备「偏好 WebGPU + 回退 WebGL」的开关形态；平台上 **Safari 26 / iOS 26 才是正编故事**，**Capacitor 真机未证**；效果与生命周期必须靠 POC，不能文献结案。

---

## 2. 问题表初答（§4.1）

| Q | R1 答案 | 下一步 |
|---|---------|--------|
| **Q-A1** Pixi 8.19 WebGPU 状态 | 官方 **Experimental**；管道 feature complete；生产仍荐 WebGL | 保持 |
| **Q-A2** 回退 | `preference:'webgpu'` → 试 webgpu 后 **webgl → canvas**；**数组则不自动补** | POC 打日志验证 |
| **Q-A3** iOS Safari | **26+ 支持**；18.x 及以下不可当默认目标 | 定最低 iOS |
| **Q-A4** Capacitor | **未证实**；issue #8044 称 WebView 无 WebGPU（2025，not planned） | **R4 真机** |
| **Q-A5** Android | P2，不挡本轮 | 搁置 |
| **Q-A6** 选项语义 | antialias / powerPreference / resolution 文档称跨后端；可用 `webgl`/`webgpu` 分设 | R3 对照锯齿 |
| **Q-A7** device lost | 有 `GPUDevice.lost`；**无** canvas `webglcontextlost`；Pixi 未代管业务恢复 | 设计补钉 |

---

## 3. 假设表（§5.2）

| 假设 | R1 判定 | 说明 |
|------|---------|------|
| **H1** 只改 preference 即可跑通 | 🟡 文献倾向真 · **未测** | API 面够；卡在平台与像素 |
| **H2** mask/半透明等价 | ⚪ 未测 | WebGPU mask pipes 存在 ≠ 观感一致 |
| **H3** 只靠 appState 即可 | 🟡 **部分真** | 后台信号仍要；**device.lost 需加** |
| **H4** Capacitor 短期不可用 | 🟡 **倾向真至真机打脸** | 推动 D-WG0/1 |
| **H5** 有性能收益 | ⚪ 未测 | 本仓牌少，收益可能不明显 |

---

## 4. 对「保全部效果」的含义（R1）

文献 **不能** 替 V01–V10 / A01–A12 打勾。  
R1 仅确认：

- 迁移 **不必** 为 WebGPU 重写 PHYS / core。  
- 高风险面仍是：**Graphics mask、半透明叠层、Canvas2D→Texture、antialias、后台恢复**。  
- 官方明确：浏览器实现不一致 → unexpected behavior。

---

## 5. POC 最小规格（建议进入 R3，可与 R2 反查并行）

### 5.1 代码（示意 · 勿直接改默认）

```ts
// app.ts 概念：仅 flag
const pref =
  new URLSearchParams(location.search).get('gpu') === '1'
    ? 'webgpu'   // string → 自动回退 webgl
    : 'webgl';

await app.init({
  // ...existing
  preference: pref,
  hello: true, // 开发期打印后端
});

console.info('[pixi]', app.renderer?.name ?? app.renderer);
// WebGPU 时：尝试挂 device.lost → 与 onContextLost 合流（若 API 可及）
```

### 5.2 验收脚本（桌面先）

1. `?gpu=1` Chrome：开局 + 消一对 + 拖消 + 抽/洗 + 翻面  
2. 同脚本无 query：确认仍为 WebGL、观感不变  
3. 截图 diff 重点：圆角 mask、阴影 alpha、dim 蒙黑  
4. （可选）Safari 26 macOS  

**Capacitor / iPhone 列入 R4，不阻塞桌面 POC。**

---

## 6. 决策预演（非正式）

| 选项 | R1 倾向 | 条件 |
|------|---------|------|
| **D-WG0 维持 webgl** | 强 | Capacitor 测不通或效果 🔴 |
| **D-WG1 双偏好 auto** | 中强 | 桌面 POC 绿 + 真机稳定回退；默认仍可 webgl 或 webgpu-first |
| **D-WG2 默认 WebGPU** | **弱** | 需 iOS 26+ 为底线 + Capacitor 绿 + 效果无 🔴 + device.lost 进 D28 |

当前 **禁止** 合并改 `preference: 'webgpu'` 为仓库默认。

---

## 7. R1 关闭勾选（对照计划 §1.2 / §9）

| 项 | 状态 |
|----|------|
| 效果基线表 | ✅ 计划 §3 已有；R1 **未** 填实测列 |
| 兼容矩阵文献列 | ✅ 初填（真机空） |
| API / 生命周期映射 | ✅ 源卡 B+C |
| POC diff 清单 | ✅ §5 |
| 决策三选一有证据 | 🟡 倾向明确，**未结案** |
| 反查 `21` | ⏳ R2 |
| 有效源 List `21_…` | ⏳ R5 / 可与 R2 并行草稿 |

**R1 检索轨：** 文献目标完成 → **可进入 R2 反查 + R3 薄 POC**。

---

## 8. 下一动作（排序）

1. **R2** 写 `21_webgpu_gap_audit.md`（对照计划查空：最低 iOS、Pixi device 句柄、效果表谁签字）  
2. **R3** 本地 `?gpu=1` POC + WebGL 基线录屏  
3. **R4** Capacitor 真机 `navigator.gpu` + 一局 + 后台  
4. 再选 D-WG0/1/2  

---

## 附录 · 关键源码锚点（8.19.0）

```text
autoDetectRenderer: preference string → [pref, ...rest of webgl/webgpu/canvas]
isWebGPUSupported: navigator.gpu + adapter + device
GpuDeviceSystem: requestAdapter(powerPreference) + requestDevice；无 lost 业务钩子
本仓 app.ts: preference:'webgl'；仅 webglcontextlost
```
