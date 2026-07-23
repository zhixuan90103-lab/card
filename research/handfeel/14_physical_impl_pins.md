# 物理手感 · 实现钉 v1.5

**更新：** 2026-07-23  
**状态：** 现行 · **L1 实现钉**  
**权威级：** L1（冲突时 **代码** `phys.ts` / `cards.ts` / `CARD_Z` 优先）  
**入口：** [`docs/CURRENT.md`](../../docs/CURRENT.md) · [`docs/NOTES_PACK.md`](../../docs/NOTES_PACK.md)  
**规范：** [`docs/DOC_CONVENTIONS.md`](../../docs/DOC_CONVENTIONS.md)  
**关联：** 意图钉 [`19`](./19_intent_impl_pins.md) · 问题总表 [`session_bugs`](../../docs/changelog/2026-07-23_session_bugs_and_fixes.md)  
**纪要：** [`drawzone_z_autodraw_dim`](../../docs/changelog/2026-07-23_drawzone_z_autodraw_dim.md) · [`session_bugs`](../../docs/changelog/2026-07-23_session_bugs_and_fixes.md)  

> **以本文 + `phys.ts` / `cards.ts` 为准。** 旧 art-ux 03/08 与 fa_* 源卡已删。

---

## 0. 旋转 / 动画 pivot 共识

> **默认：一切牌的旋转、缩放、运动绕牌心（`CARD_W/2, CARD_H/2`）。**  
> 仅当产品**明确说**不用中心时，才改用其它轴。  
> 静止落位可用左上角 layout 坐标（`placeRestTopLeft`）。

---

## 0.1 产品钉总表（v1.1–v1.4）

| 主题 | 定稿 |
|------|------|
| **点消** | 选 A1 → 点 A2：**A1 直线飞到 A2**（A2 不动）→ 叠好后 **与拖消同一套 exit** |
| **拖消** | **永远 skipMeet**；松手 pose 直接 exit |
| **exit** | 左右分抛 · 恒定 ω · 无淡出 · 出屏结束 · ω∝抛力 · **抛角∝飞入/拖速方向** |
| **飞入** | ease-in-out · **无上抛弧** · 飞牌 z≈9500 · 时长 ~120–160ms |
| **选中** | 仅选中牌放大 **1.1**（牌心）· 轻晃 · 意图伙伴 **不放大** |
| **拖拽** | 100ms 放大到 1.16 · 极小视觉滞后 · 倾斜∝速度 · 拖速→上抛 1～1.3 |
| **翻牌时机** | 配对 **上抛开始** 即翻新 free（与 exit 并行） |
| **翻牌动态** | breath **1.3** · 每张随机 Z 倾 ±~3–8° · 牌心 |
| **输入解锁** | **上抛开始即可**点/拖下一张；**正在翻的牌不可拖** |
| **抽牌区底板** | stock / waste **线框常显**（stock 宽=本局峰值足迹） |
| **抽牌区阴影** | **有牌**才显示**共用**座位影；stock 宽随**当前**张数；落座无单卡影 |
| **洗→抽间隔** | `recPauseBeforeDrawMs` = **50** |
| **消废后补抽** | 状态 `autoDrewId` + 上抛时 `playDrawMoveFlip`（禁止瞬移） |
| **蒙黑** | **仅抽牌翻面** `dimWasteUnder`；谜题翻 / 拖动 **不**蒙抽叠 |
| **层级** | 动效用 `CARD_Z` FX 带（≥8000）；落座 stock/waste/select 更低 |

---

## 1. PHYS 摘要（对齐 `phys.ts`）

```ts
// 选中
floatScale: 1.1, floatY: 10,
selectWobbleAmpX: 0.35, selectWobbleAmpY: 0.45, selectWobbleAmpRotDeg: 0.55,
selectWobblePeriodMs: 2000,
hintScale: 1, // 意图伙伴不放大

// 点消 meet（A1→A2）
meetMs: 120, meetMsPerPx: 0.18, meetMsMax: 160,
meetArcPx: 0,           // 禁止飞入上抛弧
meetFlyerTiltDeg: 10,

// exit 关联飞入
exitApproachBias: 0.34, exitApproachSpeed: 320,
exitVx: 420, exitVy0: -1650, exitG: 7000,
exitSpinDegPerSec: 900, exitSpinForceMin/Max: 0.72/1.38,
matchPopScale: 1.26,
exitHardMs: 700,
flipMs: 180, flipBreath: 1.3, flipTiltMaxDeg: 8,

// 拖拽
dragScale: 1.16, dragScaleMs: 100, dragVisualFollow: 0.55,
dragTiltMaxDeg: 26, dragTiltRefSpeed: 520,
dragThrowMinK: 1, dragThrowMaxK: 1.3,

// 抽 / 洗
recPauseBeforeDrawMs: 50,
drawMoveMs / drawSettleMs / drawFlipBreath / stockCompactMs … 见 phys.ts
```

### 1.1 `CARD_Z` 摘要（`cards.ts`）

```text
seat 3–5 | stockBase 50+ | wasteBase 500+ | select 1k–2k
drag 8000 | stockCompact 8400 | draw 8500 | flip 8600
recycle 8700–8800 | matchStart/meet/exit 9000–9300
```

动画中保持 FX 带；落稳回 `stockZ` / `wasteZ` / puzzle layer。

---

## 2. S0 · busy / 输入

```text
isBusy =
  animating   // meet、snap、抽移、洗回等（不含 exit）
  ∨ dragPos ∨ drawMoving ∨ recycleAnimating

// 不进 isBusy：
exiting   // 配对上抛飞出（sync 仍 skip，防 !alive 被藏）
flipping  // 翻牌全局不锁；单卡 isFlipping → 禁拖

// 产品直白：
// - meet（A1 飞 A2）期间：不可操作
// - 上抛一开始：可操作下一张
// - 正在翻的那张：不能拖；其它可操作
```

match：`applyMatchStartPoses` → 短暂 animating；exit 开始转入 `exiting` 并清 animating。

---

## 3. S1 · 选中

```text
仅 selectedId：
  scale = floatScale(1.1)  绕牌心
  y -= floatY
  syncSelectIdle：轻晃（位移+旋转，牌心，周期 2s）
意图伙伴 / 其它牌：scale = 1（不放大）
拖起 / 配对 / 取消选中：停 idle
```

---

## 4. S2 · 点消（v1.3+）

```text
选中 A1 后点 A2：
  startPoses = capture([A1,A2])
  applyMatch; sync(skip=pair, holdBack=toFlip)
  meetPair(clusterAtId=A2): …（同 v1.3）
  // 上抛开始：
  flipToFace(toFlip)     // ★ 与 exit 同时，非 exit 结束后
  exitPairShared → exiting（不 busy）
  两者都结束 → refresh()
```

---

## 5. S3 · 拖消

```text
松手前 capturePoses
skipMeet: true
throwForceK = map(dragSpeed) ∈ [1, 1.3]
approachDir = normalize(dragVel)  // 抛角关联
exitPairShared 直接飞出
```

### 拖中

| 项 | 行为 |
|----|------|
| 逻辑位 | 手指 top-left（命中用 pointer） |
| 画面位 | 极小滞后 follow |
| 放大 | 100ms → 1.16，牌心 |
| 倾斜 | ∝ 水平速度，满 ±26°，回正弹簧晃 |

---

## 6. S4 · exit（抛角关联）

```text
base: 左右 ±vx，vy0 上抛，g，ω∝|v|
approach: 飞入或拖速单位向量
  vx += approach.nx * exitApproachSpeed * bias * loftK
  vy0 += approach.ny * …（仍保底上抛）
α=1；出屏或 hard 结束
```

| 来源 | approach |
|------|----------|
| 点消 | A1 飞向 A2 的位移方向 |
| 拖消 | 松手前速度方向 |

---

## 7–9 · 抽 / 洗回 / 翻（v1.5）

### 抽牌区座位（表现）

```text
stockSlot / wasteSlot：始终 paintEmptySlot（线框+软填）
stock 足迹：peak 锁宽（本局不缩）；阴影用 current 张数
seatShadow：stock/waste 仅 length>0 时 paint；落座牌 shadow:false
拖中：该牌 shadow:true
```

### 抽 / 洗回

```text
抽：stock → 过冲 → flip(dimWasteUnder) → settle waste + stockCompact(FX z)
洗：waste 序飞回 frame→peek；落稳 z→stockZ
洗完全部落库后 recPauseBeforeDrawMs(50) → drawOnly + 抽动画
```

### 配对后新 free 翻（P-flip）

```text
toFlip = freeAfter − freeBefore − pair（puzzle，≤12）
holdBack 直到上抛开始
doExit 时：
  flipToFace(toFlip)           // 并行；dimWasteUnder 默认 false
  [若 autoDrewId] playDrawMoveFlip  // 并行；抽路径 flip 才 dim waste
  exitPairShared(pair)
// flip: scale.x 伪翻 + breath 1.3 + 每卡随机 Z 倾
// 轴：牌心；!busy 全局；isFlipping(id) 禁拖该卡
```

### 消废牌 → 自动补抽

```text
applyMatch → ensureWasteHasCard → autoDrewId
playMatchClear sync skip = pair ∪ autoDrew ∪ stock
上抛开始：playDrawMoveFlip(autoDrewId)  // 与手动抽同管线
```

### 蒙黑

```text
仅 opts.dimWasteUnder === true（抽牌翻面）
谜题 reveal / 拖动 / showFace|showBack：清残留 dim
```

---

## 10. 验收勾选（v1.5）

- [x] 点消：A1→A2 直线飞入，A2 不动，飞牌最上层  
- [x] 无飞入上抛弧；抛角∝飞入/拖速  
- [x] 选中仅自己 1.1 + 轻晃  
- [x] 拖：100ms 放大、小滞后、速度倾斜、拖速上抛  
- [x] **上抛开始即翻新 free**；breath 1.3 + 随机倾角  
- [x] **上抛开始即可操作**；**翻牌中的牌不可拖**  
- [x] 抽叠线框常显；有牌共用影；stock 影宽随张数  
- [x] CARD_Z：动态 ≥ drag 带，不钻静止牌  
- [x] 消废后自动抽有完整抽动画  
- [x] 蒙黑仅抽牌翻面  
- [x] 洗→抽 50ms  
- [ ] 升格 art-ux 03/04  

---

## 11. 代码映射

| 能力 | 文件 |
|------|------|
| PHYS | `src/render/phys.ts` |
| CARD_Z / 座位 / dim / meet·exit·flip·draw·recycle | `src/render/cards.ts` |
| playMatchClear：flip + autoDraw + exit | `src/main.ts` |
| autoDrewId / ensureWasteHasCard | `src/core/state.ts` |
| isFlipping / isExiting 禁拖 | `src/main.ts` pointerdown / drop |

---

## 版本

| 版本 | 日期 | 变更 |
|------|------|------|
| v1 | 2026-07-22 | 初版共抛钉 |
| v1.1 | 2026-07-23 | 分抛、skipMeet、跨侧 |
| v1.2 | 2026-07-23 | 拖拽手感、牌心共识 |
| v1.3 | 2026-07-23 | 点消 A1→A2、无弧、抛角∝飞入、选中 1.1/轻晃 |
| v1.4 | 2026-07-23 | 上抛始翻牌；flip 1.3+随机倾；上抛始可操作；翻中禁拖 |
| **v1.5** | **2026-07-23** | **抽叠座位/共用影；CARD_Z；autoDrew 动画；蒙黑仅抽翻；recPause 50** |
