# 2026-07-23 · 后台回前台空白但可震动

**性质：** 老 D28 问题（非 WebGPU 专属）  
**症状：** 回前台只见浅色底、无牌面；点按仍有逻辑/震动  

## 原因判断

- 输入走 **逻辑 AABB**（`pickCard`），不依赖 GPU 像素 → **能震**  
- 画布 `resize` 在 `frame.getBoundingClientRect()` 为 **0×0** 时直接 return → **CSS 尺寸未设 → 看不见牌**  
- iOS 回前台常见 VV/frame 暂为 0  

## 修复

| 文件 | 改动 |
|------|------|
| `gpu/createApp.ts` | resize 用 lastGood / design 兜底，始终设 canvas CSS |
| `gameView.ts` | rehydrate 前 `waitForFrameLayout`；多帧 forcePresent |
| `main.ts` | afterRehydrate 强制 render + refresh |
| `appLifecycle.ts` | native resume delay 48→80ms |

## 验收

玩几手 → 后台 ≥5s → 回前台：应见牌 + HUD；Console 有 `rehydrate done` 与非 0 的 `canvasCss` / `client`。
