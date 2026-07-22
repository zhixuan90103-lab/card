# FA-B3 · Web/Safari 触控工程 checklist（复核）

**日期：** 2026-07-22  
**可信度：** 高（对照代码 + 既有 art-ux web 卡）  
**填入：** Q8 · 工程手感 · R5 前清单

## 源

- art-ux `r1_web_touch_viewport.md`
- `docs/design/11_viewport_iphone15.md`
- 代码：`main.ts` pointer · `styles.css` touch-action · `app.ts`

## Checklist

| # | 项 | 应有 | 代码 | 状态 |
|---|-----|------|------|------|
| 1 | 用 Pointer 而非依赖 click | 避免 300ms | `pointerdown/move/up` | ✅ |
| 2 | `touch-action: none` 游戏画布 | 防滚/缩放抢势 | `#game` / canvas 系 | ✅ |
| 3 | passive: false + preventDefault | 可调滚动 | 监听 `{ passive: false }` | ✅ |
| 4 | setPointerCapture | 拖出界仍跟手 | down 时 capture | ✅ |
| 5 |  tap vs drag 阈值 | 消歧 | `DRAG_THRESHOLD = 8` design px | ✅ |
| 6 | 合法性不靠视觉 hit | D17 | `pickCard` + isFree | ✅ |
| 7 | 按下即意图采样 | 即时 | down 建 activeDrag | ✅ |
| 8 | visualViewport / resize | 地址栏 | 钩子有；**真机未勾** | ⬜ R5 |
| 9 | safe-area HUD | 底栏可点 | env() 有；浮层细调 | 🟡 |
| 10 | 命中盒 edge pad | 可选 Support | **未做** | ⬜ 可选 |
| 11 | 减动效 | prefers-reduced-motion | **未做** | ⬜ P2 |
| 12 | 真机点→高亮同帧感 | 主观 | **未测** | ⬜ R5 |

## 结论

- **工程骨架已够，停止再搜 Safari 300ms 理论。**  
- 剩余全是 **验收与可选增强**，不是检索缺口。  
- 手感「肉」若出现，优先查：掉帧 / busy 叠 / 消牌过长，而非缺 pointer API。
