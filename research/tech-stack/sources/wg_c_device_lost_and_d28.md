# wg_c · WebGPU device lost 与本仓 D28

- **日期：** 2026-07-23（R1）
- **可信度：** ✅ 规范实践文 / MDN · ✅ 本仓 Pixi 8.19 源码 · L2 design 19
- **映射：** Q-A7 · H3 · S01–S04 · design/19

---

## 来源

| # | URL / 路径 | 类型 |
|---|------------|------|
| 1 | https://toji.dev/webgpu-best-practices/device-loss.html | ✅ 社区权威实践（Toji / Chrome 生态，2024-10） |
| 2 | https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/lost | ✅ MDN |
| 3 | https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/uncapturederror_event | ✅ MDN |
| 4 | `node_modules/pixi.js/.../GpuDeviceSystem.mjs` | L0 |
| 5 | `docs/design/19_ios_renderer_lifecycle.md` · `src/render/app.ts` | L2 / L0 |

---

## 可迁移句

### 1. Device loss ≈ WebGL context loss（更彻底）

Toji：

- Device loss 时 **`GPUDevice` 及其创建的全部资源不可用**（buffers、textures、pipelines…）。  
- 必须 **新 device + 重新上传资源**。  
- 用户可见：canvas 黑屏 / 冻在最后一帧。

MDN `GPUDevice.lost`：

- 应优雅处理；多数原因是瞬时的，**应尝试新 device**（除非自己 `destroy()`）。  
- 旧 device 上创建的资源必须用新 device **重建**。

→ **与 D28 原则同构：**  
`GameState` 存活 · GPU 视图丢弃 · resume 全量 rehydrate。  
**禁止** soft ticker 当恢复。

### 2. 监听方式（WebGPU）

```js
device.lost.then((info) => {
  // info.reason: 'destroyed' | 'unknown'
  // info.message: 仅调试，勿解析
});
```

- **不要** `await device.lost` 堵死主流程。  
- 主动 `device.destroy()` 也会 resolve lost（reason `destroyed`）——rehydrate tearDown 时需区分，避免递归重入。

**没有** DOM 级的 `webglcontextlost` 等价事件绑在 canvas 上；信号在 **device** 上。

### 3. 恢复策略（Toji 三档）

| 档 | 做法 | 本仓对应 |
|----|------|----------|
| 最低 | 提示用户刷新 | 不接受为唯一方案 |
| 中 | 只重建 GPU 内容 | ≈ rehydrate 视图 |
| 高 | 保留 app 状态再挂回 GPU | **已是 D28：Session 权威** |

WebGPU 相对 WebGL 的优势（Toji）：device **不绑死** canvas；可新 device 再 `context.configure`。  
Pixi 封装下我们仍走 **destroy Application + createPixiApp** 更简单、与现网一致。

### 4. 恢复失败

`requestAdapter()` 返回 null 时可能无法再开 WebGPU（驱动/浏览器熔断）。  
应 **回退非 WebGPU 路径** 或提示——**不可**建议「没 WebGPU 就重启手机」。

→ 强化 **D-WG1**：`preference: 'webgpu'` 字符串回退链含 WebGL（wg_b）。

### 5. Pixi 8.19 现状（L0）

`GpuDeviceSystem`：

- `requestAdapter` + `requestDevice`  
- **未** 看到对 `device.lost` 的默认业务回调接到 Application  
- `destroy` 仅清空引用  

本仓 `app.ts`：

- 仅 `canvas.addEventListener('webglcontextlost', …)`  
- **WebGPU 路径下该监听无效**

→ **H3 修正：**  
仅靠现有 appState + visibility **仍然必要且正确**（iOS 后台）；  
但若只跑 WebGPU，**还应**在拿到 device 后挂 `lost`（若 Pixi 暴露）或在 rehydrate 失败时强制重建。  
R3 POC：确认 Pixi 是否把 device 挂在 `renderer.gpu.device` 等字段。

### 6. `uncapturederror`

用于未进 error scope 的 GPU 错误日志；**不是** device lost 的主路径。  
POC 可选 `device.addEventListener('uncapturederror', …)` 便于抓 mask/贴图问题。

---

## 对本仓设计的钉（R1 不改代码，只定方向）

```text
S01–S04 在 WebGPU 下：
  ✅ 仍：suspend 停 ticker；resume → rehydrate 全量
  ✅ 仍：CPU Image 缓存 + GPU 纹理重烘焙
  ✅ 仍：pointer rebind 新 canvas
  ⚠️ 增：WebGPU 时 webglcontextlost 不足
       → 补 device.lost → 调度同一 rehydrate（与 context lost 合流）
  ⚠️ 增：init 失败 / adapter null → 明确 fallback WebGL 或报错 HUD
```

**不弱化 D28。** WebGPU 不是「可以 soft resume」的许可证。

---

## 测试建议（Toji）

- 调用 `device.destroy()` 模拟（不完全等于真 lost）。  
- Chrome：`about:gpucrash`（更狠；注意浏览器熔断规则）。  
- 本仓：进后台 / 多任务杀 GPU（iOS 真机仍是金标准）。
