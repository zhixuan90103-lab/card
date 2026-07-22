# R2 · 动画参数表 v0.1

**状态：** 假设默认（H-\*）→ R4 POC 后填「定稿」列  
**原则：** 服务顿悟扫视；常用 ≤300ms；默认无震屏  
**拍板来源：** `08_impl_pins_r31.md`（反查 v2）

---

## 1. 时间与缓动

| ID | 动画 | 现状 | POC 默认（假设） | 可接受区间 | 缓动 | 锁输入 | 定稿 |
|----|------|------|------------------|------------|------|--------|------|
| A-sel | 选中抬升 | 0（仅描边） | **80ms → y-4**（**无 scale**） | 0–100ms | ease-out | 否 | |
| A-desel | 取消 | 0 | 80ms | 0–100ms | ease-out | 否 | |
| A-match | 消牌飞走 | **280ms** | **280ms（H-match）** | 240–300ms | ease-out quad | 是 | |
| A-match-flash | 消前闪 | 无 | 可选 40ms α 或 tint | 0–50ms | linear | 含在 busy | |
| A-flip | 背→面 | **0 瞬时** | **160ms（H-flip）** | 120–200ms | ease-in-out | **否** | |
| A-draw | 抽飞入 | 0 | **0（H-draw）** | 0–180ms | ease-out | 可选 | |
| A-undo | 回位 | 瞬时 | 瞬时；**不播 flip** | — | — | busy 禁 | |
| A-win | 浮层出现 | 瞬时 display | 可选 150ms fade | 0–200ms | ease-out | 遮罩 | |
| A-shake | 震屏 | 无 | **禁止默认** | — | — | — | 关 |

---

## 2. 运动曲线细节

### A-match（flyAway）

```text
t: 0 → 1 over duration
ease = 1 - (1-t)^2
y: 持续上浮 ~1.0–1.2 px/frame@60fps 等效
alpha: 1 → 0
scale: 1 → 0.65
结束: visible=false；reset alpha/scale；onDone → sync
```

### A-flip（伪翻 · 新建）

```text
phase1 (0–50%): scale.x 1 → 0.05，背面绘制
mid: 切换为正面绘制（face label on）
phase2 (50–100%): scale.x 0.05 → 1
总时长 160ms；pivot 在牌中心
```

### A-sel（已拍板）

```text
selected: root.y = baseY - 4；scale 保持 1
描边 3px 金；zIndex = baseZ + 1000
（禁止 scale 1.06 作为默认，防挡邻牌扫视）
```

---

## 3. busy 策略

| 状态 | 输入 |
|------|------|
| A-match 进行中 | 禁点牌 / 抽 / 撤（现状） |
| A-flip | **不**进 isBusy（推荐） |
| 胜/负浮层 | 桌面点无效；按钮可点 |
| 未来连消 | 可评估「完成即接受下一选」缓冲；本轮不强制 |

---

## 4. A/B 候选（真机时）

| 题 | A | B | 选判 |
|----|---|---|------|
| 消牌时长 | 240 | 280 | 不拖沓且读得清 |
| 翻面 | 120 | 160 | 可感知且不打断连点 |
| 选中 | 仅描边 | 描边+抬升 | 误触邻牌是否上升 |

---

## 5. 音/触（后置 · 表位预留）

| 事件 | 音 | Haptic |
|------|-----|--------|
| E01 | 可选 tick | 无 |
| E03 | 可选 soft pop | light（仅原生后） |
| E12 | 可选短和弦 | 无 |
| E04/E05 | 无或极轻 | **无** |

本轮 **可不实现**；列在此避免二次检索。
