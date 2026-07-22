# 牌阵摆放规则笔记（实现对照）

**日期：** 2026-07-21  
**权威全文：** [`docs/design/05_board_layout_consensus.md`](../../docs/design/05_board_layout_consensus.md)  
**代码：** `src/data/level01.ts` · `src/data/layout.ts` · `src/core/rules.ts`

---

## 核心三条

1. **同槽 3 张上漏边** — 能数清层数；组顶才可能亮。  
2. **上层落在下层十字缝** — 同层组间不互压。  
3. **几何揭开** — 盖住本牌的上层组消掉后才翻；**非整层锁死**。

---

## 牌面与间距（已定稿）

| 项 | 值 |
|----|-----|
| `CARD_W` × `CARD_H` | **52 × 72** |
| 同槽错位 `d` | **9**（`0.13 × 72`） |
| 组间距 | 横 **8** / 竖 **28** |
| Level01 网格 | 横 **5** × 竖 **4** 组 |
| 内容宽 / 左右空白 | 292 / 各约 50.5 |

代码：`src/data/layout.ts` · 全文：`docs/design/05_board_layout_consensus.md` §2

---

## Level 01 数量快查

| tier | 组网格 | 组数 | 张/组 | layer |
|------|--------|------|-------|-------|
| L0 | 5×4 | 20 | 3 | 0–2 |
| L1 | 4×3 | 12 | 3 | 3–5 |
| L2 | 3×2 | 6 | 3 | 6–8 |

开局 free = L2 六个组顶。（Level01 无 L3）

---

## Free 伪代码

```text
isFree(card):
  if not puzzle or not alive → false
  if any higher-layer alive card isCovering(card) → false
  return true
// 局部揭开：某 L2 组消完 → 其下 L1 可翻；其它 L2 仍在不挡
```

---

## 与竞品

- 视觉层叠类似 Disney Solitaire / 羊了个羊。  
- 消除是 **同点配对**，不是 ±1 接龙。  
