# 物理手感 · 实现钉 v1（第二轮补漏产出）

**日期：** 2026-07-22  
**状态：** 拍板 · **POC 必遵** · 参数仍为 H-\* 假设  
**权威链：** 需求钉 `09` §1 → 事件 `10` v0.2 → 参数 `11` v0.2 → **本文** → 代码  
**反查：** `13` · 补漏源 `pf_e_round2_gap_close`

> 未升格前：线上 art-ux/03 仍描述旧 flyAway；**新 POC 以本文+10/11 为准**。

---

## 1. 默认常量（与 11 v0.2 对齐）

```ts
export const PHYS = {
  floatMs: 100,
  floatY: 10,
  floatScale: 1.06,
  hintScale: 1.05,
  hintMaxCards: 4,
  meetMs: 120,
  exitMs: 260,
  exitRotDeg: 30,
  clearBusyMaxMs: 400,
  clearBusyHardMs: 450,
  dragScale: 1.08,
  snapMs: 160,
  drawMoveMs: 150,
  drawFlipMs: 160,
  flipMs: 180,
  flipBreath: 1.08,
  recBackMs: 120,
  recGapMs: 40,
  recCapMs: 700,
  dragThreshold: 8,
} as const;
```

**断言（测试/自检）：** `meetMs + exitMs <= clearBusyMaxMs`（120+260=380 ✅）

---

## 2. S0 · 输入与 busy

```text
isBusy =
  clearAnimating     // P-meet | P-exit
  ∨ snapAnimating
  ∨ recycleAnimating
  ∨ dragPos 非空
  ∨ drawMoving       // 仅位移段；drawFlip 默认 false

// 永不进 busy: P-sel, P-hint, P-flip, P-draw-flip
busy 时: 丢弃 pointer 开新手 / draw / undo
```

---

## 3. S1 · 选中浮动 + 意图高亮

```text
onSelect(A):
  apply float to A (y-floatY, scale floatScale, shadow+)
  hints = free ∩ canMatch(A) ∩ alive
  if hints.length > hintMaxCards:
    hints = nearest K by distance to A
  for h in hints: scale hintScale
onDeselect / match end:
  clear all floats and hints
```

**非 free 永不 hint。**

---

## 4. S2 · 合法消（点）

```text
freeBefore = freeIdSet(state)
tap second match B:
  applyMatch(A,B)                    // 逻辑即时
  pair = [A,B]
  sync(skip=pair)                    // 禁止紧接 full refresh
  refreshHud only
  await meet(pair, meetMs)           // busy
  await exitPairShared(pair, exitMs) // busy；共抛
  toFlip = puzzleNewlyFree(freeBefore, freeAfter) - pair
  flipToFace(toFlip)                 // !busy
  full refresh()
```

**时长：** meet+exit 墙钟 ≤450；默认 380。

---

## 5. S3 · 合法消（拖）

```text
freeBefore = freeIdSet
onDrop match:
  applyMatch
  clearDrag
  sync(skip=pair); refreshHud
  if centers already close (< 24px): skip meet
  else: meet ≤ min(meetMs, 100)
  exitPairShared
  flip newly free
  full refresh
```

**禁止：** 拖消用旧 flyAway、点消用抛物线。

---

## 6. S4 · exitPairShared（PF10）

```text
// 单时钟驱动两张牌同一 pos/vel/rot/alpha
t=0..1 over exitMs
pos: 抛物线（共用）
rot: ±exitRotDeg * t   // 同向
alpha: 1 → 0
结束: visible=false; 重置 transform
```

---

## 7. S5 · 抽两段

```text
draw commit 逻辑即时
view: move stock→waste seat (drawMoveMs, busy optional)
then: flip face (drawFlipMs, !busy)
// 禁止先翻后飞、禁止瞬切
```

---

## 8. S6 · 洗回两段

```text
recycle commit 逻辑即时（或锁输入至动画完，二选一；推荐逻辑即时+busy）
1) 所有需表现的 waste 牌 → 背 (recBackMs 并行)
2) for i, card in order:
     fly to stock seat
     gap = N>8 ? 20 : 40
     if N>16 && i>=8: snap rest instantly
   wall clock clamp recCapMs
```

---

## 9. S7 · 翻 + 呼吸

```text
scale.x 伪翻 + uniform scale 1→flipBreath→1
总 flipMs；!busy
仅 puzzle newly-free；撤销不播
```

---

## 10. POC 验收勾选

- [ ] `meetMs+exitMs <= 400` 默认  
- [ ] 点消/拖消同一 exitPairShared  
- [ ] 选中浮动可见；同 key free 高亮 ≤4  
- [ ] 非 free 无高亮  
- [ ] 抽：先到位再翻  
- [ ] 洗回：扣背+依次；20 张不超 ~1s  
- [ ] match 路径无「full refresh 冲 pair」  
- [ ] busy 中无法撤销/抽/开下一消  

---

## 11. 升格检查表（PF14 · 产品确认后）

| 步 | 动作 |
|----|------|
| 1 | 10 事件并入 art-ux/03（E01→P-sel 等） |
| 2 | 11 并入 art-ux/04；废止唯一「单段 280」顶 |
| 3 | XP1–7 并入 art-ux/05 |
| 4 | 08 增 S 物理钉或链到本文 |
| 5 | changelog + Notebook 更新 |

---

## 版本

| 版本 | 日期 | 变更 |
|------|------|------|
| **v1** | 2026-07-22 | 第二轮补漏：共抛/S3/抽洗回/busy 钉 |
