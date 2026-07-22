# R2/R3 · 综合结论（一页 · v2）

**日期：** 2026-07-22  
**状态：** 规格可开工 · **参数为假设** · 见 `07` v2 + `08_impl_pins_r31`  
**检索：** 外搜 **停止**；真机/ms 校准归 R4–R5，不叫检索失败

---

## 1. 一句话

> 用 **程序化角标牌面 + 三态（亮/背/选中抬升）+ ~280ms 消牌 + 160ms 伪翻 + 降噪 HUD**，服务顿悟的「掀开/消掉」；**ms 与色值是 H-\* 假设**，以 `08` 为实现钉，POC 校准，不堆 juice、不改规则。

---

## 2. 四支柱（诚实版）

| 支柱 | 结论 | 证据 |
|------|------|------|
| **A 美术** | 角标+可试深红+统一背面；无图集 | 规格强 / 屏上弱 |
| **B UI/UE** | 顶栏分层 wire、短 tip、浮层卡片+safe-area | R3.1 才钉死 |
| **C 动画** | 补伪翻；消牌维持量级；抽瞬时 | 技法强 / 时长假设 |
| **D 手感** | busy 仅消牌；真机 R5 | 工程偏好 |

---

## 3. 实现优先级（R4）

```text
0.   读 08_impl_pins_r31（S1–S7 + H-*）
P0-1 牌面角标 + 红黑 + 背面
P0-2 选中：金边 + y-4 + zIndex
P0-3 E06 伪翻（S1–S3 时序）
P0-4 E03 保持 ~280；可选闪
P1-1 HUD 文案 + 顶栏层级 + 浮层卡片
P1-2 phone-frame 15–30s 补 R0 债
P2   挡牌 tip / 抽飞入 / 音效
R5   iPhone 15 · 11 §6 · 假设定稿列
```

---

## 4. 关键参数（POC 默认 = 假设）

```ts
export const ANIM = {
  selectMs: 80,
  matchMs: 280,      // H-match；A/B 试 240
  snapMs: 180,       // A-snap；A/B 140（handfeel B′）
  dragScale: 1.04,   // A-drag-scale
  flipMs: 160,       // H-flip
  drawMs: 0,         // H-draw
  selectLiftY: 4,    // H-sel；无 scale
  dragThresholdDesignPx: 8,
  selectStroke: 0xf0c14a,
  faceRed: 0xb71c1c, // H-red；可回退 0xc0392b
  faceBlack: 0x1a1a1a,
  faceFill: 0xf5f0e6,
  backFill: 0x1e3a5f,
} as const;
// busy = flyAway ∪ snapBack ∪ 拖中；flip 不锁 — art-ux/03 v1.2 · 08
```

---

## 5. 停止外搜（修订）

| 条件 | v1 声称 | v2 判定 |
|------|---------|---------|
| 事件表有推荐+时长 | ✅ | ✅ 时长=假设 |
| ≥3 参数卡 | ✅ | ✅ 但品类覆盖偏 |
| 视觉可执行 | ✅ | ✅ |
| 反模式 ≥8 | ✅ | ✅ |
| 无 🔴 阻塞规格 | ✅ | ✅ **开写**；真机是 R5 |

**下一动作：** R4 实现（钉 `08`）→ 自检 → changelog → R5。  
**不要：** 再开 R1 外搜周。

---

## 6. 证据索引

| 文件 | 用途 |
|------|------|
| `01` | 基线 |
| `sources/*` | 标杆（偏通用） |
| `02`–`05` | 规格 |
| **`07` v2** | 反查 |
| **`08_impl_pins_r31`** | 实现钉 |
