# 物理手感 · 动画参数表草案 v0.6

**日期：** 2026-07-23（v0.6 翻牌/输入）  
**状态：** POC 实机定稿（对齐 `phys.ts` + `14` **v1.4**）  
**事件：** `10_physical_ue_events.md`  
**实现钉：** `14_physical_impl_pins.md` **v1.4**  
**原理：** `pf_a_survival_kit_map` · `pf_b` · `pf_c`

---

## 0. 路径 / 共识钉

| 路径 | 流程 | 定稿 |
|------|------|------|
| **点消** | A1 **直线→A2** → 同拖 exit | ✅ |
| **拖消** | **skipMeet** → exit | ✅ |
| 抛角 | ∝ 飞入 / 拖速（bias 0.34） | ✅ |
| 飞入弧 | **关** | ✅ |
| 配对后翻牌 | **上抛开始** 并行 | ✅ v1.4 |
| 输入解锁 | **上抛开始**；翻中牌禁拖 | ✅ v1.4 |
| flip 动态 | breath **1.3** + 随机 Z 倾 | ✅ |
| pivot | **默认牌心** | ✅ |
| 选中 | 仅自己 **1.1** + 轻晃 2s | ✅ |
| 拖过程 | 100ms→1.16 · 小滞后 · 倾斜∝速度 | ✅ |

---

## 1. 时间与运动

| ID | 动画 | 默认假设 | 区间 | 缓动 | 锁 | 定稿 |
|----|------|----------|------|------|-----|------|
| A-float | 选中浮动出态 | **100ms** | 80–120 | ease-out | 否 | 100 |
| A-float-y | 抬升 | **10px** | 8–12 | — | — | 10 |
| A-float-s | 选中 scale | **1.06** | 1.05–1.08 | — | — | 1.06 |
| A-hint-s | 意图 scale | **1.05** | 1.04–1.06 | ≤80ms 出 | 否 | 1.05 |
| A-meet | A1→A2 飞入（**仅点消**） | **120ms** | ≤160 | ease-in-out **直线** | 是 | **120** |
| A-meet-arc | 飞入上抛弧 | **0** | — | — | — | **关** |
| A-meet-z | 飞牌层级 | **9500** | — | — | 是 | 防穿层 |
| A-exit-approach | 抛角∝飞入/拖速 | bias **0.34** | speed 320 | — | 消 | ✅ |
| A-sel-s | 选中 scale | **1.1** | 牌心 | — | 选中 | **仅自己** |
| A-sel-wobble | 选中轻晃 | ±0.35/0.45px ±0.55° | 2s | 牌心 | 选中 | 很轻 |
| A-flip | 新 free 翻 | **180ms** | 上抛**开始**时 | 伪翻+breath | **!busy** | 并行 exit |
| A-flip-breath | 翻牌放大 | **1.3** | — | 中段峰 | 翻 | ✅ |
| A-flip-tilt | 翻牌随机倾 | max **±8°** | 每卡随机 | sin 中段峰 | 翻 | 牌心 |
| A-input | 配对后可操作 | **上抛开始** | meet 仍锁 | — | — | exiting !busy |
| A-exit | 抛物线出场 | 参考 **280ms** | 出屏为准 | 物理积分 | 是 | 出屏/`700` hard |
| A-exit-rot | 旋转 | **ω≈900°/s** | jitter ±20% | 恒定 ω | — | **900°/s** |
| A-exit-vx | 水平分离 | **±420** px/s | ±18% | — | — | 420 |
| A-exit-vy0 | 上抛 | **−1650** px/s | ±12% | — | — | −1650 |
| A-exit-g | 重力 | **7000** px/s² | ±8% | — | — | 7000 |
| A-exit-arc | 弧高 | 由 vy0/g 决定 | POC 手调 | — | — | 实机 |
| **A-clear-tap** | 点消 meet+exit | meet+出屏 | busy 目标 ≤450 参考 | — | 是 | 点消 |
| **A-clear-drag** | 拖消 | **仅 exit** | 同 exit | — | 是 | **skipMeet** |
| A-drag-s | 拖 scale | **1.16** | 1.12–1.20 | 100ms ease-out 拿起 | 拖中 | **1.16** |
| A-drag-lag | 视觉滞后 | **0.55**/16ms | 仅画面 | — | 拖中 | **不影响命中** |
| A-drag-tilt | 速度倾斜 | **max ±26°** | @520px/s 满 | spring | 拖中 | 牌心 |
| A-drag-throw | 拖速→上抛 | **K 1～1.3** | — | — | 拖消 exit | ✅ |
| A-match-pop | 配对放大 | **1.26** | — | pop+settle | 消 | ✅ |
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
