# 操作意图 · 特征与参数表 v0.1

**日期：** 2026-07-23  
**状态：** 假设可 POC · 以实现校准为准  
**单位：** design px（393 宽）· ms · 无量纲权重  
**PHYS：** 建议新增名；未进代码前为 H-*  

---

## 1. 特征（最小集）

| 特征 | 符号 | 定义 | 用于 |
|------|------|------|------|
| 位移 | Δs | down→当前 指针 design 位移 | 起拖 |
| 时长 | t | now−t0 | 记录；可选 thr |
| 峰速 | v_peak | 拖中 \|vel\| 最大 | 可选起拖；loft 另用松手 vel |
| 松手中心 | dropC | 被拖牌中心 | DropDecoder |
| 指尖 | p | up 时 design 点 | 可选融合 |
| 距离 | dist(c) | \|dropC−cardCenter(c)\| | geom |
| 可配 | m(c) | canMatch(drag,c)?1:0 | 先验 |

**不做（默认）：** 全路径积分、曲率、多指。

---

## 2. 起拖参数

| 名 | 假设默认 | 说明 |
|----|----------|------|
| `dragThreshold` / s0 | **8**（现行） | design px；主通道 |
| `dragStartMinS` / s_min | **4** H | 峰速通道最小位移 |
| `dragStartPeakV` / v0 | **400** H px/s | 可选 OR 起拖 |
| sticky | **true** | 过阈不回 tap |

```text
// 默认 POC 实现
dragging ||= (Δs >= s0)
// 可选 P1a:
// dragging ||= (Δs >= s_min && v_inst >= v0)
```

---

## 3. DropDecoder 参数

| 名 | 假设默认 | 说明 |
|----|----------|------|
| G | **1.0** | 几何权重 |
| M | **2.5** | 可配权重（须 > 近距不可配优势） |
| ε | **0.01** | tie-break 量级 |
| τ_match | **0.55 × CARD_W** | 可配提交最大中心距；约 28.6 @52 |
| geom | `1/(1+dist/CARD_W)` | (0,1] |
| 双探针 | **先 dropC，若 Miss 再试 p** 或 max(score_C,score_p) | POC 二选一；初值：**max 融合** |

```text
score(c) = G*geom(c) + M*m(c) + ε*tie(c)
// tie: 与 pickCard 相同 waste/layer 序映射为小加分

Match iff m(best)==1 AND dist(best) <= τ_match
```

**敏感性：**  
若 S1 仍失败 → 提高 M 或 τ；若误消近旁可配 → 降 τ（规则仍要求 canMatch，误消仅几何过松时的「想消另一对」——仍须 canMatch 该对）。

---

## 4. 抽区（P1b 假设）

| 名 | 假设 | 说明 |
|----|------|------|
| stock 足迹 hit | 现行 | 仅当 pickCard==null |
| waste 热区扩大 | **可选** 外扩 4–8 px | 降 S6；勿盖住 puzzle free |

---

## 5. 与表现参数边界

| 属 | 文档 |
|----|------|
| dragScale / tilt / loft / staleMs | `14` / `phys.ts` **不改名义** |
| 意图只读 vel 作 loft | 匹配成功后 |

---

## 6. 调试（dev）

| 开关 | 作用 |
|------|------|
| `intentDebug` | 绘 dropC、τ 圆、top-3 score |

---

## 7. 版本

| 版本 | 变更 |
|------|------|
| v0.1 | 初值假设；待 POC 校准 |
