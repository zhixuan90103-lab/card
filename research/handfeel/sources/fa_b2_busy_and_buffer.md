# FA-B2 · busy 范围与动画中输入

**日期：** 2026-07-22  
**可信度：** 中（游戏输入缓冲通识 + 本产品实现）  
**填入：** Q7 · `04` §3 · H-busy

## 源

| # | 源 | 要点 |
|---|-----|------|
| 1 | Cursa touch · Graceful buffering | 动画中可短缓冲下一输入，并显示「已接住」 |
| 2 | art-ux juice · H-busy | 本轮仅 match 锁；嫌肉再缓冲 |
| 3 | 代码 `cards.isBusy` | `animating.size > 0 \|\| dragPos.size > 0` |
| 4 | main.ts | busy 时禁 draw/undo/pointerdown |

## 现状矩阵

| 状态 | 是否 busy | 输入 |
|------|-----------|------|
| flyAway 280ms | ✅ animating | 全锁 |
| snapBack 180ms | ✅ animating | 全锁 |
| 拖中 | ✅ dragPos | 全锁其它 |
| 选中 y-4 | ❌ | 可继续 |
| 伪翻（规划） | ❌ 规格 | 可点 |
| 抽瞬时 | ❌ | 可继续 |

## 建议（本轮定稿意向）

```text
H-busy v1（保持简单）:
  · match flyAway → 锁
  · snapBack → 锁（短，可接受）
  · 拖中 → 锁（必然）
  · flip → 不锁
  · 不做输入队列（P2）

何时升级缓冲:
  · 真机 10 连操作主观「必须等消完才能点下一对」且烦
  · 再开：busy 期间 pointerdown 缓存 1 次合法 free 目标
```

## 与 F5 的关系

- 280ms 锁对休闲配对可接受（&lt;300ms 阻塞原则）  
- **危险是叠锁**：消 + 翻 + 抽 若全 busy 会肉 → 已拆开  

## 对本产品

| 决策 | 结论 |
|------|------|
| 默认 | **维持现状 isBusy 定义** |
| 文档 | 明确 snap 也占 busy（代码已是） |
| 缓冲 | **后置**；停止本轮检索 |
