# 2026-07-23 · WebGPU 默认 + 手机性能优化

**依据：** `design/22_webgpu_mobile_perf_research.md`  
**默认：** 仍 **WebGPU 优先**（真机不改回 WebGL-only）

## 本轮优化

| 项 | 改动 |
|----|------|
| 圆角 | **烘焙进贴图**，去掉每牌 `mask`（最大合批收益） |
| 牌阴影 | **共享 shadow 贴图 + Sprite**，不再每帧 Graphics 重画 |
| 座位影/槽 | 参数未变则 **跳过 clear/redraw** |
| 面框 | face rim **只画一次** |
| dim | 形状缓存，关时只改 visible |
| resize | 尺寸未变 **不 GPU resize**（此前已防抖） |
| 真机 | 仍关 MSAA、DPR≤2、贴图 2× bake |

## 文件

- `src/render/cardAssets.ts`
- `src/render/cards.ts`
- `src/render/gpu/*`（默认链已 WebGPU-first）
