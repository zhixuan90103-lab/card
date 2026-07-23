# 问题与 Bug 整理 · 调整说明（2026-07-23）

**更新：** 2026-07-23  
**状态：** 现行 · 已落地  
**权威级：** **L3** 会话总表（见 [`DOC_CONVENTIONS`](../DOC_CONVENTIONS.md)）  
**现行入口：** [`CURRENT.md`](../CURRENT.md) · [`NOTES_PACK.md`](../NOTES_PACK.md)  
**范围：** 抽叠 UI、层级、洗抽、自动抽、拖意图、z、谜题调参、**后台 rehydrate（B15→D28）**  
**关联钉 / 设计：**  
- 手感 L1：`research/handfeel/14` v1.5 · `19` · 源 `20`  
- 抽叠 L4：`2026-07-23_drawzone_z_autodraw_dim.md`  
- 意图 L4：`2026-07-23_drag_intent_drop_decode.md`  
- 生命周期 L2：[`design/19`](../design/19_ios_renderer_lifecycle.md) · L4：`renderer_rehydrate.md`

---

## 0. 一句话

本阶段主线：**抽叠表现**、**动态层级**、**拖消到位判定**、**布局默认可调**，以及将 **后台空白升格为 D28 生命周期设计**。  
规则（isFree / canMatch）未改；行为细节以 L0 代码 + L1 钉为准。

---

## 1. 问题总表

| # | 现象（玩家/产品） | 根因摘要 | 调整方向 | 状态 |
|---|-------------------|----------|----------|------|
| B1 | 空库「阴影框」理解混乱 | 把**底板/座位影**当成牌阴影 | 明确结构；座位影有牌才显 | ✅ |
| B2 | 抽叠座位影「溢」出线框 | seat shadow 用 scale/offset | 影与线框同足迹；有牌才画 | ✅ |
| B3 | 每张库牌各一层阴影 | 落座仍 paint 单卡影 | **共用**座位影，宽随张数 | ✅ |
| B4 | 库空仍有座位影 | 座位影 always on | **无牌隐藏** | ✅ |
| B5 | stock/waste 底板有时隐藏 | waste 有牌 hideSlot | **两侧底板常显** | ✅ |
| B6 | 消废牌后自动补抽无动画 | `ensureWasteHasCard` 瞬移 | `autoDrewId` + `playDrawMoveFlip` | ✅ |
| B7 | 拖牌时抽叠蒙黑闪烁 | 任意 flip 都 dim 全 waste | **仅抽牌翻面** `dimWasteUnder` | ✅ |
| B8 | 动态牌钻到静态牌下 | z 带乱；compact=50；sync 改拖牌 | `CARD_Z` + 拖动 9900 置顶 | ✅ |
| B9 | 快滑时拖牌仍可能在静态下 | 只设 z 不 sort；sync 干扰 | `raiseDragCard` 每帧置顶+sort | ✅ |
| B10 | 拖到附近却配对失败 | pick 最近 free 再 canMatch | **DropDecoder 可配优先** | ✅ |
| B11 | 手机点错牌 | AABB+高层优先 | **扩热区 + 最近牌心** | ✅ |
| B12 | 视觉已到 A2 仍弹回 | 无趋势/重叠/画面探针 | 多探针+重叠+方向趋势 | ✅ |
| B13 | 洗→抽间隔偏长 | recPause 100ms | **50ms** | ✅ |
| B14 | 谜题区高度要自调 | 写死 GRID_ORIGIN_Y | **trayTuner 谜题顶Y/X** | ✅ |
| B15 | 切后台再回只见米色底 | WebGL context 失 + soft resume + 旧 canvas 指针 | **升格 D28**：整视图 rehydrate | ✅ 设计 |

> **B15** 不当零散补丁：权威 [`design/19`](../design/19_ios_renderer_lifecycle.md) · 实现 [`renderer_rehydrate`](./2026-07-23_renderer_rehydrate.md)。

---

## 2. 分题详解

### 2.1 抽牌区结构与阴影（B1–B5）

**组成（现行）：**

```text
Tray 托盘
  seat shadow（有牌才显示；stock 宽=当前可见张数足迹）
  seat plate 线框（stock/waste 常显；stock 宽=本局峰值足迹）
  卡牌 stock / waste
```

| 调整 | 说明 |
|------|------|
| 共用影 | 落座 `shadow:false`；拖时单卡影 |
| stock 影宽 | 随 `min(n, MAX_VISIBLE)` 增减 |
| 线框宽 | peak 足迹不缩 |
| 空叠 | 影隐藏，线框保留 |

**文件：** `src/render/cards.ts`（seat shadow / plate / footprint）

---

### 2.2 洗牌后停顿（B13）

| 参数 | 旧 | 新 |
|------|-----|-----|
| `PHYS.recPauseBeforeDrawMs` | 100 | **50** |

流程：recycle 全部落库 → pause → `drawOnly` + 抽动画。

---

### 2.3 配对后自动抽无动画（B6）

| 旧 | 新 |
|----|-----|
| `applyMatch` 内 `ensureWasteHasCard` 直接改 zone | 返回 `autoDrewId` |
| sync 瞬移到 waste | skip 该牌+库叠，上抛时 `playDrawMoveFlip` |

**文件：** `state.ts` · `main.ts` `playMatchClear`

---

### 2.4 蒙黑 dim（B7）

| 旧 | 新 |
|----|-----|
| `flipToFace` 总是 dim 下层 waste | 仅 `dimWasteUnder: true`（抽牌翻） |
| 拖动/谜题翻也闪蒙黑 | showFace/Back 清残留；拖起强制清 dim |

---

### 2.5 层级 CARD_Z（B8–B9）

| 带 | 约值 | 用途 |
|----|------|------|
| 静态 stock/waste/select | 50+ / 500+ / 1k–2k | 落座 |
| **drag** | **9900** | 拖动（强制最高常用带） |
| draw/flip/recycle/match | 8400–9300 | 动效 |

**拖动防穿帮：**

- `raiseDragCard`：z + `addChild` + `sortChildren` 每帧  
- `sync` **跳过** `dragPos`/`dragFollow` 牌（只保置顶）

---

### 2.6 拖动意图 / 松手判定（B10–B12）

**痛点对齐：**

1. **易配对：** 觉得滑到位置了要触发  
2. **少选错：** 别认错邻居、别乱吸远处  

**松手 `dropMatchTarget`：**

```text
候选 = free \ {drag}
score = G·geom + M·canMatch + T·趋势 + 重叠加分
探针 = 逻辑牌心 + 手指 + 画面牌心
接受 = canMatch 且 (中心距≤τ | 矩形重叠 | 趋势清晰且略远)
```

| 参数 | 现行默认 |
|------|----------|
| `dropMatchTauScale` | 0.72 |
| `dropScoreG/M/T` | 1 / 2.5 / 0.85 |
| `pickHitSlop` | 12 |

**点选 `pickCard`：** 扩 slop + **最近 free 牌心**（同距再比 layer）。

**不做：** 改规则猜消、滑词 DP、非 free 可点、全屏磁吸。

**文件：** `rules.ts` · `main.ts` · `phys.ts` · 测试 `rules.test.ts`  
**笔记：** `handfeel/15`–`20` · changelog `drag_intent_drop_decode`

---

### 2.7 谜题区位置（B14）

| 项 | 内容 |
|----|------|
| 调参 | 桌面「美术调参」→ **谜题顶Y / 谜题X偏移** |
| 运行时 | `puzzleLayoutRuntime`；局中平移 `puzzle` 的 rect |
| **定稿默认** | originY=**190** · originX=**0** |
| 抽牌区默认 | y=600 · w=**325** · h=**150** · r=15 · gap=50 · peek=8 |
| 阴影默认 | 0 / -2 / 1.02 / 0.15（未改） |

**文件：** `puzzleLayoutRuntime.ts` · `layout.ts` · `pileLayoutRuntime.ts` · `trayTuner.ts` · `main.ts`

---

## 3. 调整方法速查（以后怎么拧）

| 想改 | 哪里 |
|------|------|
| 谜题高低/左右 | 调参「谜题顶Y / X偏移」→ 定稿改 `puzzleLayoutRuntime` 默认 |
| 抽叠托盘 | 调参「抽牌区」→ `pileLayoutRuntime` |
| 牌阴影 | 调参「牌阴影」→ `cardShadowRuntime` |
| 松手多「好消」 | `dropMatchTauScale` ↑（如 0.8）；或 `dropScoreM` |
| 松手防远吸 | `dropMatchTauScale` ↓ |
| 点选热区 | `pickHitSlop` |
| 洗后停顿 | `recPauseBeforeDrawMs` |
| 拖牌层级 | `CARD_Z.drag`（现行 9900） |

---

## 4. 文件清单

| 区域 | 主要文件 |
|------|----------|
| 抽叠影/底板/dim/z | `src/render/cards.ts` · `phys.ts` |
| 自动抽动画 | `src/core/state.ts` · `src/main.ts` |
| 意图解码 | `src/core/rules.ts` · `main.ts` · `phys.ts` |
| 布局默认 | `puzzleLayoutRuntime` · `pileLayoutRuntime` · `layout.ts` |
| 调参 UI | `src/ui/trayTuner.ts` |
| 笔记 | 本文 · `drawzone_z_autodraw_dim` · `drag_intent_drop_decode` · handfeel `14`–`20` |

---

## 5. 验收印象（产品向）

- [x] 空叠有线框、无多余座位影  
- [x] 库影随张数；有牌才有影  
- [x] 消废后有抽牌动画  
- [x] 拖/点谜题翻不乱蒙抽叠  
- [x] 快滑拖牌在静态之上  
- [x] 附近可配易触发；近旁不可配少抢  
- [x] 谜题 Y 默认可调且已定 190  

---

## 6. 版本

| 版本 | 日期 | 说明 |
|------|------|------|
| **v1** | **2026-07-23** | 全日问题/调整总表，供笔记与复盘 |
