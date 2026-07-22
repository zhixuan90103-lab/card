# 变更记录 · 布局分区 / L2 双张 / 抽牌堆叠与自动翻开

**日期：** 2026-07-22（含 07-21 晚间续改）  
**Notebook：** 配对牌项目笔记  
**关联代码：** `src/data/layout.ts` · `src/data/level01.ts` · `src/core/state.ts` · `src/render/cards.ts` · `src/ui/hud.ts` · `src/main.ts`

---

## 1. 竖向布局分区（参考牌类手游节奏）

### 1.1 目标

- 游戏区不要贴顶（方便拇指操作）
- 抽牌区在谜题区**下方**，与谜题有明显间隔
- 抽牌区靠底栏上方，不与底栏按钮重叠

### 1.2 定稿参数（设计坐标 393×852）

| 常量 | 值 | 说明 |
|------|-----|------|
| `GRID_ORIGIN_Y` | **155** | 谜题区顶 |
| `PUZZLE_BOTTOM_Y` | ~527 | L0 底边 |
| `PILE_GAP_FROM_PUZZLE` | **72** | 与抽牌最小间隔 |
| `PILE_Y` | **688** | 贴底栏上方 |
| `HUD_BAR_RESERVE` | 92 | 底栏预留 |
| `STOCK_RECT` / `WASTE_RECT` | y=688，水平居中 | 抽牌 / 抽出叠 |

竖向节奏：

```text
顶栏文案
  ↓
游戏区（约 y=155～527）
  ↓ 间隔约 161px
抽牌区（y=688～760）
  ↓
底栏按钮
```

HUD 标签（「抽牌区 / 抽出叠 / 剩余」）按 `STOCK_RECT`/`WASTE_RECT` 用设计坐标百分比定位。

---

## 2. L2 每组改为 2 张

| 层 | 每组张数 | 组顶 id | layer |
|----|----------|---------|-------|
| L0 / L1 | 3 | `*_2` | 0–2 / 3–5 |
| **L2** | **2** | **`*_1`** | **6–7** |

- L2 组数仍 3×2 = 6  
- 全关总牌 **108**（L0+L1×3 + L2×2）  
- 开局 free = 6 张 L2 组顶 `d00_1` … `d12_1`  
- 实现：`pushStackAt` 通用叠牌；`L2_PER_GROUP = 2`  
- 规范：`docs/design/05_board_layout_consensus.md` 已同步

---

## 3. 抽牌区堆叠视觉

### 3.1 牌库（未抽出 · stock）

- `stock[0]` = 下一张可抽 = 视觉最前  
- **仅 X 轴** 漏边：`STOCK_STACK_DX = -5`（向左每层 5px），Y 不变  
- 最多显示 **10** 层  
- 点击区覆盖整摞横向 footprint  

### 3.2 抽出叠（waste）

- **无漏边**；只显示顶牌，同位置覆盖  
- 逻辑可点仍仅 waste 顶  

---

## 4. 自动翻开机制（帮助玩家）

| 时机 | 行为 |
|------|------|
| **开局 / 重开** | 自动 stock→waste 翻 1 张 |
| **玩家点抽牌区** | 再抽 1 张盖到 waste 顶（可覆盖） |
| **配对后 waste 为空** | 若 stock 仍有牌，自动再翻 1 张 |
| **两边皆空** | 不动作 |

实现要点（`GameSession`）：

- `ensureWasteHasCard` / `flipStockToWaste`  
- 自动翻与配对在**同一次 commit**，撤销一并回退  
- 开局自动翻**不进** undo 历史  

提示文案示例：`同点配对 · 抽出叠默认翻一张；点牌库可覆盖`

---

## 5. 文件清单

| 文件 | 变更 |
|------|------|
| `src/data/layout.ts` | 竖向分区、STOCK/WASTE 位置、stock 横向堆叠常量 |
| `src/data/level01.ts` | L2×2、teach 组顶 `_1`、提示文案 |
| `src/core/state.ts` | 开局/重开/消空后自动翻开 |
| `src/render/cards.ts` | stock 多层背面；waste 仅顶牌 |
| `src/main.ts` | stock 横向点击区 |
| `src/ui/hud.ts` | 标签跟随抽牌区坐标 |
| `src/core/rules.test.ts` 等 | 自动翻开 / L2 双张回归 |
| `docs/design/05_board_layout_consensus.md` | L2 每组 2 张 |

---

## 6. 验证

- 全量测试通过（约 39）  
- 开局抽出叠应已有 1 张可点  
- L2 每摞 2 张、组顶 free  
- 牌库向左叠厚；抽出叠单牌覆盖  

---

## 7. 与上一则笔记的关系

- **isFree v1.1**（任意重叠遮挡）：仍有效，未改 free 几何  
- 本则专注 **摆放分区 + L2 厚度 + 抽牌 UX**  
