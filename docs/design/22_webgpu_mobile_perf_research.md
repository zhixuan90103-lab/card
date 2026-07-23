# 22 · 手机端 WebGPU 卡顿调研（为何别的项目流畅、本项目曾卡）

**日期：** 2026-07-23  
**结论优先级：** 默认 **仍用 WebGPU**；卡顿归因 **本仓用法 + Pixi 层**，不是「WebGPU 在手机上不能用」。

---

## 0. 一句话

> 你在手机上做过 **流畅 WebGPU** 是可信的；本项目一度极卡，主因是 **Pixi 场景成本 + 每帧/频繁 resize + MSAA**，在 **Capacitor WKWebView** 里被放大，而不是 WebGPU API 本身比 WebGL 慢。

---

## 1. 官方 / 社区证据

| 来源 | 要点 |
|------|------|
| [Pixi v8 发布](https://pixijs.com/blog/pixi-v8-launches) | **WebGPU 不保证处处比 WebGL 快**；Pixi 常见瓶颈在 **CPU 侧**（场景图、合批打断）。过滤器 / mask / blend 多时 WebGPU 才更有优势。 |
| [Pixi Performance Tips](https://pixijs.com/8.x/guides/concepts/performance-tips) | 移动端：`antialias: false`；控制分辨率与纹理大小。 |
| [Pixi #10413](https://github.com/pixijs/pixijs/issues/10413) | **`antialias=true` 在 WebGPU 上比 WebGL 更伤性能**（当时建议关 AA 或改 WebGL）。 |
| 本仓 R3 日志 | 真机曾 `backend=webgpu` 且「完全不正常」卡 → 与上列一致可复现路径。 |

---

## 2. 你以前的 WebGPU 项目 vs 本仓

| 维度 | 常见流畅 WebGPU 项目 | 本仓（配对牌） |
|------|----------------------|----------------|
| 引擎 | 自研 / Three WebGPU / 精简管线 | **Pixi 8 全场景图** |
| 每帧 | 少量 draw / 固定 mesh | 大量 **Sprite + Graphics** |
| 遮罩 | 少或预烘焙 | **每张牌 Graphics mask**（合批打断） |
| 阴影/线框 | 贴图烘焙 | **每牌 Graphics 阴影 + frame** |
| 缓冲尺寸 | 接近屏幕 | **393×852 + FX 出血** ≈ 585×1292 逻辑，再 × DPR |
| 布局 | 固定 canvas | **visualViewport 滚动触发 resize**（曾未防抖） |
| 生命周期 | 少销毁 | **D28 整视图 rehydrate**（恢复时重载） |
| 容器 | 多为 Safari / 原生 GL 壳 | **Capacitor WKWebView**（与 Safari 同内核，但进程/合成路径仍不同） |

→ 「我别的 WebGPU 游戏不卡」**不能**直接推出「Pixi 默认 WebGPU + 本场景结构也不卡」。

---

## 3. 本仓最伤帧的几项（按嫌疑排序）

1. **MSAA `antialias: true` + WebGPU**（官方 issue 点名）  
2. **频繁 `renderer.resize` / 改 `resolution`**（iOS VV scroll 曾无防抖）  
3. **每卡 mask + 多层 Graphics**（打断 batch，CPU 侧贵）  
4. **过大 framebuffer**（FX_PAD + 高 DPR）  
5. **恢复路径多次 forcePresent + 全量 rebuild**（短时卡顿，不是全程）  
6. 贴图 3× 烘焙（次要）

层级问题（白屏但有震动）是 **另一 bug**（canvas CSS 0 尺寸）；与「一直卡」可并存但机制不同。

---

## 4. 策略（与产品对齐）

| 决策 | 内容 |
|------|------|
| **默认后端** | **WebGPU 优先**（含真机）；不可用再 WebGL |
| **真机优化** | 关 MSAA；限制 DPR；resize 防抖 + 仅尺寸变化才 resize |
| **不默认** | 因卡顿永久改成 WebGL-only（与「以前 WebGPU 很流畅」经验冲突） |
| **可选后续** | 圆角预烘焙进贴图、减 per-card Graphics（大改，另开） |

---

## 5. 验收

真机顶栏 **当前渲染：WebGPU**，操作应明显比「未防抖 + 开 AA」顺。  
若仍卡：用 Safari 远程调试看是 CPU（长帧脚本）还是 GPU；再考虑减 mask/Graphics。
