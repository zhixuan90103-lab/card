# 操作意图 · 实现钉 v0.2

**更新：** 2026-07-23  
**状态：** 现行 · **L1 已落地**  
**权威级：** L1（冲突时 **代码** `rules.dropMatchTarget` / `pickCard` / `main.ts` / `phys.ts` 优先）  
**入口：** [`docs/CURRENT.md`](../../docs/CURRENT.md) · [`docs/NOTES_PACK.md`](../../docs/NOTES_PACK.md)  
**规范：** [`docs/DOC_CONVENTIONS.md`](../../docs/DOC_CONVENTIONS.md)  
**有效源：** [`20_intent_effective_sources_list.md`](./20_intent_effective_sources_list.md)  
**问题总表：** [`session_bugs_and_fixes`](../../docs/changelog/2026-07-23_session_bugs_and_fixes.md) B10–B12  

---

## 0. 一句话

> **拖消松手：可配优先 + 多探针 + 重叠即到位 + 滑动趋势；点选：扩热区 + 最近牌心。**  
> 不改 canMatch；非 free 不进候选；不做滑词 DP / 全屏磁吸。

---

## 1. 点选 / 按下 · `pickCard`

```text
free 候选 ∩ 扩 AABB(hitSlop)
→ 按到牌心距离升序，同距再比 layer/waste
```

| 参数 | 默认 | 文件 |
|------|------|------|
| `pickHitSlop` | 12 | `phys.ts` |

---

## 2. 松手 · `dropMatchTarget`

### 2.1 探针（多点取最优）

1. 逻辑牌心（手指 − grab + 半牌）  
2. 手指点  
3. **画面牌心** `getViewCenter`（消除跟手滞后导致的「看着在 A2 却失败」）

### 2.2 打分

```text
score =
  G * geom(dist/牌宽)
+ M * I[canMatch]
+ T * trend          // 从 origin 朝向目标的 cos+，仅可配
+ 0.35 * I[可配且矩形重叠]
+ ε * layerTie
```

### 2.3 接受条件（满足其一，且 canMatch）

| 条件 | 含义 |
|------|------|
| `dist ≤ τ` | τ = `dropMatchTauScale * CARD_W` |
| **矩形重叠** | 拖牌 AABB 与目标座位相交 |
| **趋势放宽** | trend≥0.55 且 dist ≤ 1.2τ |

### 2.4 参数（以 phys 为准）

| 参数 | 默认 |
|------|------|
| `dropMatchTauScale` | 0.72 |
| `dropScoreG` | 1 |
| `dropScoreM` | 2.5 |
| `dropScoreT` | 0.85 |

### 2.5 接入

`main.ts` pointerup：构造 probes / origin / vel / dragSize → `dropMatchTarget` → 成功则 skipMeet exit，否则 snapBack。  
目标 `isFlipping` → 当无目标。

---

## 3. 起拖

- 主通道：`Δs ≥ dragThreshold`（8 design px，经 scale 换算）  
- 记录 `t0`  
- sticky：过阈不回 tap  

---

## 4. 拖中层级

- `CARD_Z.drag = 9900`  
- 每帧 `raiseDragCard`（z + addChild + sortChildren）  
- `sync` 跳过正在拖的牌  

---

## 5. 反模式（硬）

- 非 canMatch 消除  
- 非 free 进候选  
- 无跟手强磁吸  
- 滑词路径 DP  
- 用历史改规则  
- 静默吞松手  

---

## 6. 测试

`src/core/rules.test.ts`：可配优先、过远 null、重叠、趋势、点选最近中心。

---

## 7. 版本

| 版本 | 说明 |
|------|------|
| v0.1 | 初钉 DropDecoder |
| **v0.2** | 对齐已落地：多探针/重叠/趋势/置顶；规范头 |
