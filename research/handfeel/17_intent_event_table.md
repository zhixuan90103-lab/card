# 操作意图 · 事件表 v0.1

**日期：** 2026-07-23  
**状态：** 草案 · 可 POC  
**依据：** `15` v0.2 · `16` 反查 · 源卡 intent_a/b/c · 代码 `main.ts`  
**钉：** 与 `19_intent_impl_pins` 同步；动效事件仍归 `14` / art-ux `03`

---

## 0. 分层

| 层 | 内容 | 文档 |
|----|------|------|
| **意图** | 识别 tap/drag/drop/draw | **本文** |
| **表现** | meet/exit/snap/draw 动画 | `14` |
| **规则** | isFree / canMatch / draw | `core/*` |

---

## 1. 意图事件一览

| ID | 事件 | 触发（现行→目标） | 输出 | 失败 |
|----|------|-------------------|------|------|
| **I-DownFree** | 武装 | down 命中 free，!flip/!exit | `Armed{id}` | hardDead/busy/won 忽略 |
| **I-DownStock** | 点抽意图 | down 无 free 命中且 hitStock | `doDraw` | busy 等 |
| **I-Tap** | 点选语义 | up 且 !dragging | `doTapCard` | — |
| **I-DragStart** | 起拖 | Δs≥s0（可选峰速） | dragging=true，跟手 | — |
| **I-DragMove** | 拖中 | move+dragging | 位置/vel；可选 hints P2 | — |
| **I-DropMatch** | 松手匹配 | DropDecoder Match | tryMatch+exit | — |
| **I-DropMiss** | 松手未匹配 | DropDecoder Miss | snapBack | — |
| **I-DragCancel** | 取消拖 | cancel+dragging | snapBack | — |
| **I-Reject** | 拒输入 | busy/hardDead/won | no-op | — |

---

## 2. 时序（拖消成功）

```text
I-DownFree → (I-DragStart → I-DragMove*) → I-DropMatch
                                              ↓
                                    表现: skipMeet exit (+ autoDrew 等)
```

## 3. 时序（点消）

```text
I-DownFree → I-Tap → (选中 | 点消 meet+exit | 取消)
```

## 4. 时序（点抽）

```text
I-DownStock → draw/recycle 表现（14）
```

## 5. 与锁的交叉

| 状态 | 意图 |
|------|------|
| isBusy | 拒 I-Down* / 新拖 |
| isFlipping(id) | 拒武装该 id；松手目标若 flip→当 Miss |
| isExiting(id) | 拒武装该 id |
| exiting 全局 | **不** busy → 可 I-Down 其它牌（14） |

## 6. 验收故事（intent_b）

| 事件 | 故事 |
|------|------|
| I-DropMatch | S1（P0a 后）、S2 |
| I-DropMiss | S3、S8 |
| I-DragStart | S4/S5 |
| I-DownStock | S6（P1b）/ S7 不触发 |

## 7. 版本

| 版本 | 变更 |
|------|------|
| v0.1 | 初版；对齐 DropDecoder |
