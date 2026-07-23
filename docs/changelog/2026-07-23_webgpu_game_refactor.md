# 2026-07-23 · 整局 WebGPU-first 重构

**决策：** D29  
**范围：** 渲染层重构（玩法 core 未改）

## 做了什么

- 抽出 `src/render/gpu/`：`preference` · `createApp` · `lost` · `index`
- **整局**默认 `['webgpu','webgl']`；`PRIMARY_BACKEND = webgpu`
- `GameView` / `main` 走 gpu 模块；`document.documentElement.dataset.gpuBackend`
- WebGPU 不可用时明确 warn「compatibility WebGL」
- 删除旧 `rendererPreference.ts`

## 未改

- `core/` 规则、关卡、手感 PHYS 数值  
- 玩家可见玩法

## 验证

- `tsc` ✅ · gpu + rules 单测 ✅  
