# FA-B1 · 消牌后翻面 / 露出时序

**日期：** 2026-07-22  
**可信度：** 高（本仓库 `08_impl_pins` 已钉；外部仅原则印证）  
**填入：** FA4 · E06 · S3

## 源

| # | 源 | 要点 |
|---|-----|------|
| 1 | `research/art-ux/08_impl_pins_r31.md` S1–S3 | **唯一时序钉** |
| 2 | juice/时长源卡 | 消中等、露出弱于消；翻面不锁输入 |
| 3 | 本代码 | flyAway 后 refresh；**伪翻 160ms 未统一落地** |

## 定稿时序（检索确认 · 不改钉）

```text
match 确认
  → 逻辑已消 pair
  → sync(skip=pair) 保留飞走表现
  → flyAway(pair)          [busy=true]
  → onDone: busy=false
  → toFlip = puzzle newly-free（不含 pair）
  → flipToFace(toFlip)     [busy=false · 并行 · ≤12]
  → full sync
```

| 规则 | 值 | 理由 |
|------|-----|------|
| 消与掀 | **串行：先消完再掀** | 避免同时抢注意；顿悟「打开」在兑现后 |
| 多牌掀 | 并行同 160ms | 交错 cascade 噪音（08 禁止） |
| 翻面 busy | **否** | 连点/连拖不被 160ms 卡住 |
| 撤销 | 不播 flip | 悔棋要快 |
| stock/waste | 不伪翻 | 仅 puzzle 背→面 |

## 代码债（实现向 · 非再检索）

| 债 | 说明 |
|----|------|
| flipToFace | H-flip 160 规格有，表现可能仍瞬时 |
| match 后 freeBefore | 需在 commit 前采样（08 S1） |
| refresh 冲动画 | flyAway 前勿无 skip 全量 sync |

## 对本产品

时序 **关闭检索**；下一动作为 **R4 实现钉**，不是外搜。
