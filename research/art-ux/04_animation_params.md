# R2 · 动画参数表 v0.2

**状态：** 假设默认（H-\*）→ Round C / R5 后填「定稿」列  
**原则：** 服务顿悟扫视；常用 ≤300ms；默认无震屏  
**拍板：** `08_impl_pins_r31` · handfeel B′ 合流 · UE 唯一源 `03` v1.2

---

## 1. 时间与缓动

| ID | 动画 | 代码现状 | POC 默认（假设） | 可接受区间 | 缓动 | 锁输入 | 定稿 |
|----|------|----------|------------------|------------|------|--------|------|
| A-sel | 选中抬升 | y-4 即时 | **y-4 即时**（可选 80ms） | 0–100ms | ease-out / 无 | 否 | |
| A-desel | 取消 | 即时 | 同左 | 0–100ms | ease-out / 无 | 否 | |
| A-match | 消牌飞走 | **280ms** | **280ms（H-match）** | **240–300**（**硬顶 300**） | ease-out quad | **是** | |
| A-match-flash | 消前闪 | 无 | 可选 40ms α/tint | 0–50ms | linear | 含在 match busy | |
| A-snap | 弹回 | **180ms** | **180ms** | 140–200ms | ease-out quad | **短** | |
| A-drag-scale | 拖起放大 | **1.04** | **1.04** | 1.0–1.08 | — | 拖中 busy | |
| A-flip | 背→面 | **0 瞬时** | **160ms（H-flip）** | 120–200ms | ease-in-out | **否** | |
| A-draw | 抽飞入 | 0 | **0（H-draw）** | 0–180ms | ease-out | 可选 | |
| A-undo | 回位 | 瞬时 | 瞬时；**不播 flip** | — | — | busy 禁 | |
| A-win | 浮层 | 瞬时 | 可选 150ms fade | 0–200ms | ease-out | 遮罩 | |
| A-shake | 震屏 | 无 | **禁止默认** | — | — | — | **关** |

### 建议代码常量（I2 / Round C A/B）

```ts
export const ANIM = {
  selectLiftY: 4,
  matchMs: 280,      // H-match；A/B 240
  snapMs: 180,       // A-snap；A/B 140
  dragScale: 1.04,   // A-drag-scale；A/B 1.0 / 1.08
  flipMs: 160,       // H-flip；A/B 120
  drawMs: 0,
  dragThresholdDesignPx: 8,
} as const;
```

---

## 2. 运动曲线细节

### A-match（flyAway）

```text
t: 0 → 1 over matchMs
ease = 1 - (1-t)^2
y: 持续上浮 ~1.0–1.2 px/frame@60fps 等效
alpha: 1 → 0
scale: 1 → 0.65
结束: visible=false；reset alpha/scale；onDone → E06 或 sync
说明: E03b 时拖牌可从拖中坐标起飞；目标牌多从座位起飞（FA10 体感待 C）
```

### A-snap（snapBack）

```text
t: 0 → 1 over snapMs
ease = 1 - (1-t)^2
x,y: 当前位置 → home
scale: dragScale → 1
无红闪、无惩罚音
用于: E04b 不配/空地 · E-drag-cancel
```

### A-drag（跟手 · 非 tween）

```text
pointermove → 直接写 root.x/y
scale = A-drag-scale（1.04）
zIndex 抬升；牌自带 shadow
选中金边在拖中关闭（selected && !drag）
```

### A-flip（伪翻 · 待实现）

```text
phase1 (0–50%): scale.x 1 → 0.05，背面
mid: 切换正面
phase2 (50–100%): scale.x 0.05 → 1
总时长 flipMs；pivot 牌中心；不进 isBusy
```

### A-sel（已拍板）

```text
selected: root.y = baseY - 4；scale 保持 1
描边 3px 金；zIndex = baseZ + 1000
禁止默认 scale 1.06（挡邻牌扫视）
```

---

## 3. busy 策略（v0.2 · 与代码对齐）

| 状态 | isBusy | 输入 |
|------|--------|------|
| A-match（flyAway） | **是** | 禁点牌 / 抽 / 撤 |
| A-snap（snapBack） | **是** | 同上（短窗） |
| 拖中（dragPos） | **是** | 禁第二路操作 |
| A-flip | **否** | 可点下一手 |
| 选中静置 | 否 | 正常 |
| 胜/负浮层 | 桌面无效 | 按钮可点 |
| 输入缓冲 | **本轮不做** | 高手嫌肉再开 |

```text
isBusy = animating（flyAway ∪ snapBack）∨ 正在拖
```

---

## 4. A/B 候选（Round C / 真机）

| 题 | A | B | 选判 |
|----|---|---|------|
| 消牌时长 | 240 | 280 | 不拖沓且读得清 |
| 弹回时长 | 140 | 180 | 纠正感、不罚、不肉 |
| 拖 scale | 1.0 / 1.04 / 1.08 | — | 跟手且不挡扫视 |
| 翻面 | 120 | 160 | 可感知且不打断连点 |
| 选中 | 仅描边 | 描边+抬升 | 误触邻牌（现状抬升） |

---

## 5. 音/触（后置 · 表位预留）

| 事件 | 音 | Haptic |
|------|-----|--------|
| E01 | 可选 tick | 无 |
| E03a/b | 可选 soft pop | light（仅原生后） |
| E12 | 可选短和弦 | 无 |
| E04 / E04b / E05 | 无或极轻 | **无** |

本轮 **可不实现**。

---

## 版本

| 版本 | 日期 | 变更 |
|------|------|------|
| v0.1 | 2026-07-22 | 初版 |
| **v0.2** | 2026-07-22 | **B′**：A-snap、A-drag-scale；busy 含 snap/拖；硬顶 300；ANIM 草案；FA10 注 |
