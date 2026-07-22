# 渲染清晰度 / 矢量感 · 技术方案调研

**日期：** 2026-07-22  
**范围：** 在 **已定栈**（PixiJS v8 · WebGL 主路径 · 393×852 设计坐标 · DOM HUD · 程序化牌 · ≪200 张）下，怎样更清晰、更有「矢量感」  
**不重开：** Three 主引擎、换 Canvas 全栈、真 SVG 场景图  
**关联：** D15–D17 · `10_tech_decision` · 官方 [Performance Tips](https://pixijs.com/8.x/guides/concepts/performance-tips) · 当前 `app.ts` / `cards.ts`

---

## 0. 一句话结论

```text
真·矢量（无限缩放不糊）在 Web 游戏主循环里几乎不存在「免费午餐」。
我们要的是观感上的矢量感 = 高 DPR 缓冲 + MSAA 圆角 + 少 1px 毛刺 + 高分辨率字形。

主路径仍应用 Pixi WebGL：
  ① 已做：antialias + MAX_DPR=3 + Text.resolution
  ② 推荐下一刀：牌面 bake 成高分辨率纹理（Graphics→Texture / 离屏高分 Canvas）
  ③ 可选增强：BitmapText 点数、轻微 CSS 不参与牌桌
  ④ 不推荐：为清晰度换 SVG 主场景 / 纯 Canvas2D 主循环 / 关 WebGL
```

**产品侧定义「矢量感」：**

| 观感 | 技术含义 |
|------|----------|
| 圆角顺 | MSAA 或超采样后的边 |
| 描边不毛 | 线宽 ≥1.5 设计像素 + 高 resolution 缓冲 |
| 字像印刷 | 字形以 ≥2–3× 栅格上传，或 Bitmap |
| 缩放不糊 | 设计坐标 1:1 映射到 CSS 框，且 buffer = CSS × dpr |

---

## 1. 我们栈里实际在发生什么

```text
逻辑/布局     393×852 设计像素
     ↓
Pixi Stage    世界单位 = 设计像素
     ↓
WebGL 缓冲    宽×高 × resolution(dpr≤3)   ← 真正决定「锯齿密度」
     ↓
Canvas CSS    被 phone-frame 拉伸到屏幕
     ↓
DOM HUD       原生矢量字体/CSS（按钮已相对清晰）
```

| 组件 | 渲染介质 | 是否矢量 |
|------|----------|----------|
| 牌体圆角/描边 | **WebGL 三角形 + 栅格** | 否，可 MSAA |
| 点数 Text | **离屏 Canvas 栅格 → 纹理** | 否，靠 resolution |
| 背面纹样 | Graphics 路径栅格化 | 否 |
| 底栏按钮 | **DOM/CSS** | 是（浏览器字体+圆角） |
| 背景色 | 清屏色 / CSS | — |

**关键事实：**  
Pixi `Graphics` / `Text` **最终都是像素**。所谓矢量感 = **在目标物理像素上足够密的采样 + 抗锯齿**，不是保留贝塞尔到显示瞬间。

官方也写明：老旧手机可关 `antialias` 换性能；我们目标机（iPhone 15）**应优先开 MSAA**。

---

## 2. 路径对比（在「不换主引擎」前提下）

### 路径 A · 调参 WebGL（当前主线）✅ 必做 / 已部分做

| 手段 | 作用 | 成本 | 状态 |
|------|------|------|------|
| `antialias: true` | 圆角/斜线 MSAA | GPU 中；iPhone 可接受 | ✅ 已开 |
| `resolution = min(dpr, 3)` + `autoDensity` | 缓冲更密 | 显存 ∝ dpr² | ✅ MAX_DPR=3 |
| `Text.resolution ≥ 2` | 点数更锐 | 每字纹理更大 | ✅ 已做 |
| 线宽 ≥1.5–2、少 1px 斜线 | 减少「毛刺感」 | 画风微调 | ✅ 部分 |
| `preference: 'webgl'` 保持 | 稳定 MSAA 行为 | — | ✅ |
| 每 renderer 选项 `webgl: { antialias: true }` | 与 WebGPU 分支解耦 | 低 | 可补 |

**局限：** MSAA 对 **非常细的线**、**旋转后的文字** 仍不如超采样；Graphics 每帧 `clear+redraw` 不吃 MSAA 以外的「矢量缓存」。

---

### 路径 B · 高分辨率 Bake（推荐作为「矢量感」主增强）⭐

**思想：** 在 **2×～3× 设计尺寸** 画一张牌（Graphics 或 Canvas2D），生成 `Texture`，游戏里用 **Sprite** 显示并 `scale` 回 52×72。

```text
离屏：156×216 (3×) 画圆角牌 + 字
  → Texture
  → Sprite(52×72)  scale=1/3 或 texture 分辨率标记
显示：双线性缩小 → 边更圆、字更润（超采样）
```

| 做法 | 说明 |
|------|------|
| **B1 Graphics → RenderTexture** | 全程 Pixi；静态牌 bak 一次；选中只换描边纹理或叠一层 stroke sprite |
| **B2 离屏 Canvas2D → Texture** | `roundRect` + `fillText` 浏览器路径 AA 往往很顺；上传 GPU |
| **B3 预烘焙 PNG/WebP 图集** | 最稳；包体↑；仅♥/♠×13 rank 体量可控（约 26 面 + 2 背） |

| 优劣 | |
|------|--|
| 优点 | **观感最接近矢量插画**；运行时几乎是精灵合批；飞走/选中便宜 |
| 缺点 | 选中态/主题换色要多套纹理或着色器；首次 bake 耗时 |
| 与规则 | 零冲突；hit 仍逻辑 AABB |

**适用：** 牌面样式已定稿后（当前暖休闲）→ **优先 POC B1/B2**。

官方性能提示也写：复杂 Graphics 多时 **改用 Sprite/纹理** 更快。

---

### 路径 C · 文字专项

| 方案 | 清晰度 | 动态改字 | 建议 |
|------|--------|----------|------|
| Canvas `Text` + 高 resolution | 好 | 每改一次重栅格 | **现状够用**（rank 不每帧变） |
| **BitmapText / 位图字体** | 极好（若字号匹配） | 快 | 可选；需生成 `A–10,J,Q,K` + ♥♠ |
| DOM 叠字在牌上 | 真矢量字 | 布局同步难 | **不推荐**（层叠/飞走/缩放痛苦） |

官方：动态字用 BitmapText 更省；我们 rank 基本静态 → **高 res Text 或 bake 进牌面纹理** 即可。

---

### 路径 D · Pixi Canvas2D Renderer（备选，非默认）

Pixi 可走 Canvas 后端（若构建包含）。

| | |
|--|--|
| 可能收益 | 部分浏览器上路径 AA 观感不同 |
| 风险 | 飞牌/层叠/滤镜性能通常 **差于 WebGL**；官方移动端更推 WebGL；与「开 antialias 换质量」的 WebGL 路线重复 |
| 结论 | **仅当 WebGL MSAA 在目标 Safari 异常时** 做 A/B，不作主方案 |

社区经验：Canvas AA 与 WebGL MSAA **谁更顺因机而异**；不能假设 Canvas 更「矢量」。

---

### 路径 E · 真 SVG / HTML 牌（否决作主路径）

| | |
|--|--|
| 真矢量 | ✅ |
| 与层叠 z、抽牌飞走、统一 ticker、逻辑 hit | 同步成本高 |
| 百张 SVG DOM | 移动端布局/合成压力大 |
| 结论 | **可做单张导出设计稿**，不进主循环 |

---

### 路径 F · 后处理「假清晰」（慎用）

| 手段 | 评价 |
|------|------|
| FXAA/SMAA 全屏滤镜 | 可糊字；贵；本局对象少不值当 |
| 锐化 filter | 易起环；破坏暖休闲气质 |
| CSS `filter` 在 canvas 上 | 不可控，验收难 |

**不推荐**作为主手段。

---

## 3. 与「官方性能纪律」的对齐

| 官方建议 | 我们清晰度策略 |
|----------|----------------|
| 老机可 `antialias: false` | **新机开 true**；可用能力探测降级 |
| Graphics 少改路径 | bake 后运行时几乎不改路径 ✅ |
| 多复杂 Graphics → Sprite | **路径 B** 正是此意 |
| Text 勿每帧改 | rank 仅在 sync 时改 ✅ |
| 合批精灵 | bake 后同图集更容易合批 |

牌数 ≪200：**清晰度优先不会成为瓶颈**（除非每帧重建全部 Graphics）。

---

## 4. 推荐决策树

```text
要更清晰？
  ├─ 仍锯齿圆角 → 确认 antialias + dpr≥2 真机生效（路径 A）
  ├─ 字糊边毛 → Text.resolution 或 bake 字进纹理（A/C/B）
  ├─ 要「插画级」顺滑 → 高分 bake 牌面纹理（路径 B）⭐
  ├─ 主题多套/选中描边多变 → 图集 + 九宫/着色（B3）
  └─ 仍不满意且愿改架构 → 再评估 DOM/SVG 混合（高成本，非 MVP）
```

### 落地优先级（建议）

| 序 | 动作 | 预期 | 工程量 |
|----|------|------|--------|
| **P0** | 保持 A：MSAA + dpr3 + 文高分；真机截图对比 | 基线可读 | 已做 |
| **P1** | **POC：单张牌 2×/3× bake → Sprite** | 圆角/字质感跃升 | 0.5–1d |
| **P1b** | 选中：第二套描边纹理或外圈 Graphics 仅选中时画 | 不毁掉 bake | 小 |
| **P2** | 背面/正面进小图集（26+2） | 稳定发版观感 | 1–2d |
| **P3** | BitmapText 仅当 bake 不采用 | — | 可选 |
| **🚫** | SVG 主场景 / 关 WebGL 换 Canvas 主路径 | — | 不做 |

---

## 5. POC 草图（路径 B1 · 仍全 Pixi）

```text
function bakeCardFace(rank, suit, scale = 3): Texture {
  const w = CARD_W * scale, h = CARD_H * scale
  const g = new Graphics()
  // 用 scale 倍坐标画 roundRect / 字（Text resolution = scale）
  const rt = RenderTexture.create({ width: w, height: h, resolution: 1 })
  renderer.render({ container: g, target: rt })
  return rt
}
// 显示：
const spr = new Sprite(tex)
spr.width = CARD_W; spr.height = CARD_H  // 缩小采样
```

缓存键：`(rank, suit, face|back, selected?)`  
库存背共用一张 mist-blue 纹理即可。

---

## 6. 验收标准（清晰度）

| 检查 | 方法 |
|------|------|
| 圆角 | phone-frame 放大截图，无「楼梯」 |
| 红黑字 | 5 秒扫 free 不费眼 |
| 选中金边 | 连续不碎 |
| 动效 | flyAway 时不突然糊一圈（纹理过滤 linear） |
| 真机 | iPhone 15 Safari；对比 PC 2×/3× |
| 性能 | 开局 bake &lt; 100ms 可接受；局中 60fps |

---

## 7. 明确不做什么（本调研）

- 不为清晰度重开 Three  
- 不用全屏锐化滤镜当方案  
- 不把 HUD 也画进 WebGL「追求统一」  
- 不在未 bake 前盲目加复杂背面矢量花纹（越细越锯）

---

## 8. 总结表

| 渲染手段 | 矢量感 | 性能 | 与现架构契合 | 建议 |
|----------|--------|------|--------------|------|
| WebGL + MSAA + 高 DPR | 中高 | 优 | 完美 | **基线** |
| Graphics 实时画 | 中 | 中（张数少 OK） | 现状 | 样式未定时方便 |
| **高分 bake → Sprite** | **高** | **优** | **完美** | **下一刀** |
| 预烘焙图集 | 高 | 优 | 好 | 定稿后 |
| BitmapText | 字高 | 优 | 好 | 可选 |
| Canvas2D 主渲染 | 中～高 | 中低 | 差 | 备胎 A/B |
| SVG/DOM 牌 | 真矢量 | 差 | 差 | 否 |

**给产品的话：**  
在 Pixi 方案下，**没有比「高分辨率栅格化后当精灵用」更划算的矢量感**；实时 Graphics 再调参也只是逼近。建议样式锁定后做 **3× bake POC**，用截图决定是否进主线。

---

## 9. 参考

- Pixi v8 Performance Tips（Graphics→Sprite、antialias、Text resolution）  
- Pixi Application：`antialias` / `resolution` / `autoDensity`；按 renderer 分 `webgl.antialias`  
- 本仓 `docs/design/10_tech_decision.md` D15  
- 本仓 `research/tech-stack/sources/t6_pixi_mobile_perf.md`  
