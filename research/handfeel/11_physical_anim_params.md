# 物理手感 · 动画参数表草案 v0.1

**日期：** 2026-07-22  
**状态：** 假设默认（检索合成）→ POC/真机填「定稿」列  
**事件：** `10_physical_ue_events.md`  
**原理：** `pf_a_survival_kit_map` · `pf_b` · `pf_c`

---

## 1. 时间与运动

| ID | 动画 | 默认假设 | 区间 | 缓动 | 锁 | 定稿 |
|----|------|----------|------|------|-----|------|
| A-float | 选中浮动出态 | **100ms** | 80–120 | ease-out | 否 | |
| A-float-y | 抬升 | **10px** | 8–12 | — | — | |
| A-float-s | 选中 scale | **1.06** | 1.05–1.08 | — | — | |
| A-hint-s | 意图 scale | **1.05** | 1.04–1.06 | ≤80ms 出 | 否 | |
| A-meet | 对撞汇合 | **120ms**（反查修订） | 100–160 | ease-in-out | 是 | |
| A-exit | 抛物线出场 | **260ms**（反查修订） | 220–320 | 离 ease-in 感 | 是 | |
| A-exit-rot | 旋转 | **±30°** | ±15～±45 | — | — | |
| A-exit-arc | 弧高 | **40～80px** 量级 | POC | — | — | |
| **A-clear** | **成功总长** meet+exit | **380ms 默认**（≤400 目标） | 硬顶 **450** | — | 是 | |
| A-drag-s | 拖 scale | **1.08** | 1.06–1.10 | — | 拖中 | |
| A-snap | 弹回 | **160ms** | 140–180 | ease-out² | 短 | |
| A-draw-move | 抽位移 | **150ms** | 120–180 | ease-out | 短 | |
| A-draw-flip | 抽后翻 | **160ms** | 140–180 | in-out | 否 | |
| A-flip | 新 free 翻+呼吸 | **180ms** | 160–200 | in-out | **否** | |
| A-flip-breath | 呼吸峰 scale | **1.08** | 1.06–1.10 | — | — | |
| A-rec-back | 扣背 | **120ms 并行** | ≤150 | ease-out | 短锁 | |
| A-rec-gap | 回库间隔 | **40ms** | 20–60 | — | 短锁 | |
| A-rec-cap | 洗回总长 | **≤700ms 理想** | 硬顶 **900** | — | 短锁 | |
| A-shake | 震屏 | **关** | — | — | — | 关 |

### 加速规则（洗回）

```text
N = 需动画回库张数
gap = 40ms
if N > 8:  gap = 20ms
if N > 16: 仅顶 8 张逐张，其余瞬移到 stock 深位
或：成组 2–3 张共路径
总时长 clamp 到 A-rec-cap
```

### 与旧 H-match 280 · 反查钉（`13` §3.1）

| 旧 | 新 |
|----|-----|
| 单段 flyAway 280 | **meet 120 + exit 260 = 380** ≤ 400 目标 |
| 禁止 | 默认 130+280=410 却写 clear≤400（算术不自洽） |
| 硬顶 | **成功消 busy ≤450ms**（替代「单段 300」唯一顶） |
| 双牌 exit | **汇合后共抛**（同参同步）或 skip meet 直接共抛；见 10 PF10 |

---

## 2. 曲线细节（POC 伪代码）

### A-exit 抛物线（单牌或双牌共享）

```text
t: 0→1 over exitMs
// 简化
x = x0 + vx * t
y = y0 + vy0 * t + 0.5 * g * t * t   // vy0 向上为负（屏坐标）
rot = rot0 + ω * t                     // clamp 总转角
alpha = 1 - easeIn(t)                  // 后半加速淡
scale 可选 1→0.85
出屏或 alpha<0.05 → recycle view
```

### A-meet

```text
两牌 center → mid
mid.y -= 10..20
ease-in-out；结束 scale 可同至 1.0
```

### A-flip + breath（叠在 scale.x 伪翻上）

```text
u 0→1
sx_card: 1→edge→1  （伪翻）
s_uni: 1 → 1.08 @0.5 → 1   （呼吸，smoothstep）
mid: 换面
```

### 抽两段

```text
move 完成 → 再 start flip
禁止 move 中途换面（产品钉）
```

---

## 3. busy 矩阵

| 状态 | isBusy |
|------|--------|
| P-meet / P-exit | **是** |
| P-snap / 洗回 | **是**（短） |
| P-draw-move | 可选短 **是** |
| P-drag | **是**（拖中） |
| P-sel / P-hint / P-flip / P-draw-flip | **否** |
| 输入缓冲 | POC 后置 |

---

## 4. A/B 候选（真机）

| 题 | A | B | 选判 |
|----|---|---|------|
| 成功总长 | 360 | 420 | 不拖且读得清对撞 |
| 选中 float scale | 1.05 | 1.08 | 不挡邻牌 |
| 意图 hint | 开 | 关 | 是否更准/更吵 |
| 洗回 gap | 40 | 20 | 多张不腻 |
| 翻呼吸 | 1.06 | 1.10 | 可感不糊 |

---

## 5. 反模式增量（建议并入 art-ux/05）

| ID | 禁止 |
|----|------|
| XP1 | 成功消 busy **>450ms** 且不可跳 |
| XP2 | 意图高亮 **非 free** |
| XP3 | 洗回无加速导致 **>1.2s** |
| XP4 | 牌面 **squash** 毁识别 |
| XP5 | 抽 **先翻后飞** 或瞬切 waste |
| XP6 | 点消抛物线、拖消仍旧淡出（峰值分叉） |
| XP7 | 对撞未完成就播下一对叠乱 |

---

## 6. 建议代码常量（POC）

```ts
export const PHYS = {
  floatMs: 100,
  floatY: 10,
  floatScale: 1.06,
  hintScale: 1.05,
  meetMs: 120,
  exitMs: 260,
  exitRotDeg: 30,
  clearBusyMaxMs: 400, // hard 450
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

---

## 版本

| 版本 | 日期 | 变更 |
|------|------|------|
| v0.1 | 2026-07-22 | Round D 参数草案 |
| **v0.2** | 2026-07-22 | 反查：meet/exit 默认 120+260；双牌共抛注 |
