---
title: T6 官方精炼 · 性能 / 资源 / 图集
date: 2026-07-21
type: tech
generated_by: manual-curation
---

# T6 · 官方与一手摘录（性能 + Assets）

## 1. PixiJS Performance Tips

**URL:** https://pixijs.com/8.x/guides/concepts/performance-tips

与本案相关的硬建议：

| 主题 | 官方要点 | 对本项目 |
|------|----------|----------|
| 过早优化 | 先能跑再优化 | ≪200 张牌，默认够用 |
| 绘制顺序 | 同类相邻合批（sprite 连排优于 sprite/graphic 交错） | 牌用 Sprite 同层排序 |
| 移动端 | `antialias: false`；旧选项 `useContextAlpha: false` 可助性能 | POC 默认关抗锯齿 |
| Culling | 默认关；CPU 紧时应用层剔除 | 全屏牌桌可不 cull |
| **Spritesheet** | **尽量图集**；单批最多约 **16 纹理**（硬件相关） | 52 点牌面应进 1～2 张 atlas |
| 低端机 | `@0.5x` 图集自动视觉加倍 | 可选二期 |
| Graphics | 频繁改形状慢；静态小图形可接近 Sprite | 选中框可用 Graphics 或九宫格 |
| Text | 勿每帧改；动态用 BitmapText | HUD 尽量 DOM |
| Mask / Filter | 上百 mask/filter 会慢 | 盖牌用逻辑+暗色 tint，少用 mask |
| BlendMode | 混用打断合批 | 统一 normal |
| Events | `interactiveChildren=false`；`hitArea` 矩形加速 | **与 D17 一致：盖牌不 interactive** |

## 2. PixiJS Assets

**URL:** https://pixijs.com/8.x/guides/components/assets

- `Assets.load` Promise / 缓存 / alias  
- **Sprite sheet：`.json` + `spritesheetAsset`**  
- Manifest / bundles / background loading  
- 压缩纹理：`.basis` / `.ktx2` 等（二期）  

**POC 路径：** 先单图或简单 JSON 图集；量产对齐 NewYaran 的 **AssetPack**（见 `t6_internal_reuse.md`）。

## 3. 纹理尺寸（社区共识）

- 移动端 WebGL 常见 **`MAX_TEXTURE_SIZE = 4096`**（iOS 亦然）。  
- 单张图集边长建议 **≤ 2048 或 4096**，并查询 `gl.getParameter(MAX_TEXTURE_SIZE)`。  
- 扑克 52+ 背图：一张 2048 图集通常足够。

## 4. 版本（npm 2026-07-21）

| 包 | 版本 |
|----|------|
| `pixi.js` latest | **8.19.0** |
| `three` latest | 0.185.1 |

## 5. 包体粗测（bundlephobia API，非本项目 build）

| 包 | min≈ | gzip≈ |
|----|------|-------|
| `pixi.js@8.19.0` main | ~881 KB | **~251 KB** |
| `three@0.185.1` main | ~726 KB | **~182 KB** |

> **解读：** 全量 three 主包 gzip 可略小于全量 pixi；**不等于游戏更轻**（Three 做 2D 牌还要正交/拾取样板代码）。本案以玩法贴合选 Pixi；**项目真实包体仍以 Vite production 为准（T6-M4）**。
