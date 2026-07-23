# Changelog · 抽牌区整理 / 层级 / 自动抽 / 蒙黑（2026-07-23）

**钉文：** `research/handfeel/14_physical_impl_pins.md` **v1.5**  
**代码：** `src/render/cards.ts` · `src/render/phys.ts` · `src/main.ts` · `src/core/state.ts`

---

## 0. 一句话

整理抽牌区座位表现（底板常显、共用阴影随张数变化）；统一 `CARD_Z` 避免动态牌钻静止牌下；废牌配对后自动补抽补上 `playDrawMoveFlip`；蒙黑仅抽牌翻面。

---

## 1. 抽牌区结构（现行）

```text
Tray 托盘底板 (PileTray)
  └ seat shadow（有牌才显示；stock 宽随张数；waste 单牌宽）
  └ seat plate 线框底板（stock / waste **始终显示**）
  └ 卡牌层 stock / waste
```

| 部件 | 有牌 | 无牌 |
|------|------|------|
| stock / waste **线框底板** | 显示 | 显示 |
| stock **共用座位阴影** | 显示，宽 = 当前可见张数足迹 | **隐藏** |
| waste **共用座位阴影** | 显示，单牌宽 | **隐藏** |
| 落座牌 **单卡阴影** | **无**（共用座位影） | — |
| 拖中牌 **单卡阴影** | **有** | — |

- stock 线框宽度：本局 **峰值**足迹（不随抽牌变窄）。  
- stock 阴影宽度：随 **当前** `min(stock.length, MAX_VISIBLE)` 增减。  
- 座位影参数：offset/scale/alpha 走 `cardShadowRuntime`（共用一块，不是每张一张）。

### 曾混淆的「阴影框」

| 误解 | 实际 |
|------|------|
| 用户指空库「阴影框」 | 多为 **空槽底板** / 座位软影，不是谜题牌 drop-shadow |
| 中间一度关掉座位影、只留线框 | 已恢复：**有牌共用座位影 + 常显底板** |

---

## 2. 洗牌 → 第一张抽

| 项 | 值 |
|----|-----|
| `recPauseBeforeDrawMs` | **50**（原 100） |
| 流程 | recycle 全部落库 settle → pause → `drawOnly` + `playDrawMoveFlip` |

---

## 3. 显示层级 `CARD_Z`（`cards.ts`）

静止低、动效高，避免 compact/recycle 用库叠 z=50 钻到废牌/选中下：

| 带 | 约值 | 用途 |
|----|------|------|
| seatShadow / plate | 3 / 5 | 座位装饰 |
| stockBase / wasteBase | 50+ / 500+ | 落座库/废 |
| select | 1000+ / 2000 | 选中 |
| **drag** | 8000 | 拖 + snapBack |
| **stockCompact** | 8400 | 抽时库叠收拢动画中 |
| **draw** | 8500 | 抽飞/落稳 |
| **flip** | 8600 | 翻面 |
| **recycle** | 8700–8800 | 洗回等待/飞行 |
| **match** | 9000–9300 | 起始 / meet / exit |

规则：**动画过程中**用 FX 带；**落稳后** `sync` / `stockZ` 回静止带。

---

## 4. 配对后自动抽（动画）

| 旧 | 新 |
|----|-----|
| `ensureWasteHasCard` 逻辑翻 stock→waste，sync 瞬移 | 仍写状态，返回 `autoDrewId` |
| 无 `playDrawMoveFlip` | 上抛开始时与 exit 并行播抽牌动画 |

- `tryMatchPair` / `tapCard` → `{ autoDrewId? }`  
- `playMatchClear`：sync **skip** pair + autoDrew + remaining stock → `doExit` 时 `playDrawMoveFlip`  
- 拖消 / 点消 均适用（废牌被消导致 waste 空时）

---

## 5. 蒙黑 dim

| 场景 | 蒙黑 |
|------|------|
| **抽牌翻面** `dimWasteUnder: true` | 下层 waste 短暂 dim |
| 配对后 **谜题 reveal flip** | **不**蒙抽叠 |
| 拖动 / 落座 sync | 清残留 dim（`clearDimUnlessUnderFlip`） |
| 开始拖某张 | 强制 `setCardDim(false)` |

根因：原 `flipToFace` 对任意翻牌都 dim 全 waste；上抛后可操作 → 拖牌时废牌闪蒙黑。

---

## 6. 文件

| 文件 | 说明 |
|------|------|
| `src/render/cards.ts` | CARD_Z、座位影/底板、dim、draw/recycle z |
| `src/render/phys.ts` | `recPauseBeforeDrawMs: 50` |
| `src/main.ts` | autoDrew 抽动画 |
| `src/core/state.ts` | `autoDrewId` / flip 返回 id |
| `research/handfeel/14_physical_impl_pins.md` | **v1.5** |
| 本文 | 本批纪要 |

---

## 7. 验收勾选

- [x] stock/waste 线框常显  
- [x] 有牌才有共用座位影；stock 影宽随张数  
- [x] 动态牌不钻静止牌下（compact/recycle/snap/draw）  
- [x] 消废牌后自动抽有飞出+翻面  
- [x] 仅抽牌翻面蒙废牌下层；拖动不闪蒙黑  
- [x] 洗→抽间隔 50ms  
