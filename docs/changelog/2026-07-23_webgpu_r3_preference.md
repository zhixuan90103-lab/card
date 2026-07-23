# 2026-07-23 · WebGPU R3：优先后端 + device.lost

**轨：** T-WG · design `20` v0.3 · 反查 `21`  
**状态：** R3 代码落地；**桌面/真机效果对照表仍待人工填**

---

## 做了什么

| 项 | 内容 |
|----|------|
| 默认后端 | **`preference: ['webgpu','webgl']`**（优先 WebGPU，回退 WebGL，**不含 canvas**） |
| 开关 | `?renderer=webgpu\|webgl\|auto` 或 `localStorage.card_renderer` |
| 日志 | `[pixi] backend=… choice=… source=…`；`[card-mvp] … backend` |
| D28 | WebGPU 挂 **`device.lost`**（`reason!=='destroyed'`）；与 `webglcontextlost` 共用 rehydrate |
| 接线 | `GameView.mount({ onContextLost })` → `main` `runResumeRehydrate` |

## 文件

- `src/render/rendererPreference.ts`（新建）
- `src/render/app.ts`
- `src/render/gameView.ts`
- `src/main.ts`
- `src/render/rendererPreference.test.ts`

## 怎么验收（人工 · P0）

```bash
npm run dev
# Console 应见 [pixi] backend=webgpu 或 webgl（视机器）
# 强制 WebGL：  ?renderer=webgl
# 强制优先 GPU：?renderer=webgpu   （默认已是）
```

对照 design `20` §3.0：开局 / 选中 / mask / dim / 拖消 / 后台回前台。

## 未关

- Capacitor 真机矩阵（R4）
- P0 截图填表
- 正式拍板 D-WG1b（产品已倾向优先 WebGPU，工程已默认 1b 行为）
