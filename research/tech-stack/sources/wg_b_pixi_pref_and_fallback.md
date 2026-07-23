# wg_b · PixiJS 8 WebGPU preference 与自动回退

- **日期：** 2026-07-23（R1）
- **可信度：** ✅ 官方文档 + **本仓 L0** `pixi.js@8.19.0` 源码
- **映射：** Q-A1 · Q-A2 · Q-A6 · H1 · §7 POC

---

## 来源

| # | URL / 路径 | 类型 |
|---|------------|------|
| 1 | https://pixijs.com/8.x/guides/components/renderers | 官方 Guides |
| 2 | https://pixijs.com/8.x/guides/components/application | 官方 Guides |
| 3 | https://pixijs.com/blog/june-2026 | 官方 changelog（v8.18 / 8.19） |
| 4 | `node_modules/pixi.js/lib/rendering/renderers/autoDetectRenderer.mjs` | L0 源码 |
| 5 | `node_modules/pixi.js/lib/utils/browser/isWebGPUSupported.mjs` | L0 源码 |
| 6 | `node_modules/pixi.js/lib/rendering/renderers/gpu/GpuDeviceSystem.mjs` | L0 源码 |

---

## 可迁移句（精炼）

### 1. 官方定位（Renderers 页）

- **WebGLRenderer**：**Recommended** · well supported and stable  
- **WebGPURenderer**：**Experimental** · “more performant, still maturing”  
- 说明：WebGPU 路径 **feature complete**，但浏览器实现不一致可能导致 unexpected behavior；**生产仍推荐 WebGL**

→ 对本仓：**可以 POC / 实验默认，但官方尚未把 WebGPU 标成生产首选。**

### 2. `preference` API（Application 页）

| 选项 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `preference` | `'webgl' \| 'webgpu'`（文档表） | `webgl` | Preferred renderer type |
| `powerPreference` | high-performance / low-power | — | **WebGL & WebGPU** |
| `antialias` | boolean | — | 两端共用 |
| `forceFallbackAdapter` | boolean | false | **WebGPU only** |
| `webgl` / `webgpu` | 对象 | — | 按后端覆盖选项（如 antialias 分设） |

文档示例可写：`preference: 'webgpu'`。

### 3. Preference **数组**（June 2026 / 8.18+）

`autoDetectRenderer` 与 `Application.init` 的 `preference` 可接受 **数组**，用于**限制**回退链，而非只重排。  
例：`['webgl', 'canvas']` 可排除 WebGPU。

本仓 8.19.0 类型定义：

```ts
// autoDetectRenderer.d.ts（摘要）
// string：优先该后端，再尝试其余
// array：仅尝试列出的后端
preference?: RendererPreference | RendererPreference[];
// RendererPreference = 'webgl' | 'webgpu' | 'canvas'
```

### 4. 回退真实行为（L0 源码 · 关键）

`autoDetectRenderer.mjs`：

```text
默认 renderPriority = ["webgl", "webgpu", "canvas"]

若 preference 为 string S：
  preferredOrder = [S, ...其余 priority 项]
  → preference:'webgpu' ⇒ 尝试 webgpu → webgl → canvas

若 preference 为 array：
  preferredOrder = 该数组（不再自动补其余）

对每个候选：
  webgpu：await isWebGPUSupported() 则用 WebGPURenderer
  webgl：isWebGLSupported(...) 则用 WebGLRenderer
  canvas：CanvasRenderer

全部失败 → throw "No available renderer for the current environment"
```

`isWebGPUSupported`：

```text
无 navigator.gpu → false
requestAdapter + requestDevice 成功 → true
catch → false
结果缓存到模块级 _isWebGPUSupported
```

**结论 Q-A2：**  
- `preference: 'webgpu'`（字符串）时，**会**在 WebGPU 不可用时继续尝试 WebGL（再 canvas）。  
- **不是**「静默忽略 preference」；是 **有序探测**。  
- `preference: ['webgpu']` 仅一项时 **不会** 回退 WebGL（POC 勿用单元素数组当 auto）。  
- 本仓今日硬编码 `preference: 'webgl'` → **永远不会** 选到 WebGPU。

### 5. 与本仓选项对齐

| 本仓 `app.init` | WebGPU 路径 |
|-----------------|-------------|
| `antialias: true` | 官方允许；可用 `webgpu: { antialias: … }` 分设 |
| `resolution` / `autoDensity` | Shared 选项，应两边可用（R3 POC 验证） |
| `backgroundAlpha: 0` | Shared |
| `powerPreference: 'high-performance'` | GpuDeviceSystem 传给 `requestAdapter` |
| `webglcontextlost` | **仅 WebGL**；GpuDeviceSystem **未** 订阅 `device.lost`（见 wg_c） |

### 6. Mask / Graphics 管道存在性（旁证 · 非实测）

本仓 `pixi.js@8.19.0` 含 WebGPU pipes：

- `AlphaMaskPipe` / `StencilMaskPipe` / `ColorMaskPipe` 均注册 `ExtensionType.WebGPUPipes`  
- `GpuGraphicsAdaptor`、`GpuBatchAdaptor` 存在  

→ **API 面存在** ≠ 像素与 WebGL 一致；V02/V03 仍须 R3 截图对照。  
本仓几乎无 Filter，降低 filters 差异面（filters 仓库有 WebGPU 与 preference 交互 issue，低权）。

### 7. 8.19 与 WebGPU 相关的维护信号

June 2026 笔记：

- **Transient MSAA attachments (WebGPU)**：texture `transient` 标志，减移动端 MSAA 带宽  
- iOS 18.0–18.1 纹理 mip 相关 WebKit bug 有 workaround（WebGL 路径修复为主）  
- Lost contexts：shader compile logging 崩溃修复（偏 WebGL context）

---

## 不可迁移 / 风险

| 点 | 说明 |
|----|------|
| 官方仍标 Experimental | 不宜因文档「feature complete」就 D-WG2 |
| Canvas 文档写 Coming-soon | 源码已有 CanvasRenderer；本仓不依赖 canvas 回退 |
| `isWebGPUSupported` 缓存 | 首次失败后模块内可能一直 false（热切换环境边缘情况） |
| 无 device.lost 挂钩 | 不能指望 Pixi 自动 rehydrate；继续 D28 |

---

## 对本仓 POC 的直接建议（R1）

```ts
// 实验（保效果 + 自动回退）
preference: 'webgpu'  // 或 ['webgpu','webgl'] 禁止落到 canvas

// 生产默认（今日）
preference: 'webgl'

// 强制仅 WebGPU（仅测可用性，禁止当玩家路径）
preference: ['webgpu']
```

日志：`app.renderer.name` / `app.renderer.type`（以 8.19 实际字段为准，POC 打印）。
