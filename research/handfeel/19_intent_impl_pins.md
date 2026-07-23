# 操作意图 · 实现钉 v0.1（POC 必遵草案）

**日期：** 2026-07-23  
**状态：** 可开 P0 POC · 检索轨 **规格已齐**（薄 A/B/C 已关）  
**依据：** `15` v0.2 · `16` · `17` · `18` · 源卡 intent_*  
**代码落点：** `src/main.ts` 为主；可选 `rules.ts` 导出 score 辅助  

---

## 0. 一句话

> **松手在 free 候选上用「可配优先 + 距离阈值」解码；起拖暂保持 thr，记下 t0。**  
> 不重开 meet/exit；不改 canMatch 规则；非 free 永不进候选。

---

## 1. DropDecoder（P0a · 必做）

**替换** `onPointerUp` 中：

```text
target = pickCard(center) ?? pickCard(pointer)
if target && canMatch → match else snapBack
```

**为：**

```text
function dropDecode(state, dragId, dropCenter, pointer?): CardId | null {
  const cands = freeCardIds(state).filter(id => id !== dragId)
  if (cands.length === 0) return null

  const scoreAt = (pt) => {
    let best: { id, score, dist, match } | null = null
    for (const id of cands) {
      const c = state.cards[id]!
      const cx = c.rect.x + c.rect.w/2, cy = c.rect.y + c.rect.h/2
      const dist = hypot(pt.x-cx, pt.y-cy)
      const geom = 1 / (1 + dist / CARD_W)
      const match = canMatchCards(state.cards[dragId]!, c) ? 1 : 0
      const tie = /* same order key as pickCard, normalized small */
      const s = G*geom + M*match + eps*tie
      if (!best || s > best.score) best = { id, score: s, dist, match }
    }
    return best
  }

  const b1 = scoreAt(dropCenter)
  const b2 = pointer ? scoreAt(pointer) : null
  const best = (!b2 || b1.score >= b2.score) ? b1 : b2

  if (best && best.match === 1 && best.dist <= TAU_MATCH) return best.id
  return null
}

// up:
const targetId = dropDecode(...)
if (targetId && !isFlipping(targetId)) → tryMatchPair ...
else → snapBack
```

**常量初值：** 见 `18`（G=1, M=2.5, τ=0.55×CARD_W）。

**验收：** 故事 **S1 过**；S2/S3/S7/S8 不回归。

---

## 2. 起拖（P0b · 必做最小）

```text
// 保持
if (distDesign >= PHYS.dragThreshold) dragging = true
// 增加
armedAt = performance.now()  // 写入 DragState，供日志/后续特征
// sticky 保持 true
```

**可选 P1a（默认关）：**  
`dragging ||= distDesign >= s_min && speed >= v0`（参数见 18）。

---

## 3. 点抽 / 误抽（P1b · 非阻塞）

- 保持：`pickCard` 先于 `hitStock`。  
- 可选：waste 座位 hit 矩形外扩 4–8 design px **仅用于**「无 free AABB 时」的二次测试，避免 S6；**不要**把非 free 当 free。

---

## 4. 已有能力 · 勿重复造

| 能力 | 处理 |
|------|------|
| setMatchHints | 点选后保留；拖起可 clear（现行） |
| drag vel → loft | 仅 Match 后 |
| isBusy / flip / exit | 对齐 14 |
| skipMeet 拖消 | **不改** |

---

## 5. 反模式（硬）

见 `15` §7 · `intent_a_ios` §4 · `intent_c` §4。摘要：

- 非 canMatch 不消除  
- 非 free 不进候选  
- 无跟手强磁吸  
- 无滑词 DP  
- 不重开 14 动效参数战  

---

## 6. 文件改动清单（POC）

| 文件 | 改动 |
|------|------|
| `main.ts` | `dropDecode`；DragState.t0；up 分支 |
| `phys.ts` | 可选 `dropMatchTauScale` `dropScoreM` 等 |
| 单测 | 可选：纯函数 score 表驱动 S1 |

---

## 7. 检索关闭声明

| 项 | 状态 |
|----|------|
| Round A 薄源卡 | ✅ intent_a_* |
| Round B 故事 | ✅ intent_b |
| Round C 薄竞品 | ✅ intent_c |
| 17/18/19 | ✅ 本页 |
| 外搜 | **停** |
| 下一阶段 | **仅 POC P0a/b + 校准 18 数字** |

---

## 8. 版本

| 版本 | 变更 |
|------|------|
| v0.1 | 初钉；P0 可执行 |
