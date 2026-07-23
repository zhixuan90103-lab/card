# Changelog · 拖拽与旋转手感（2026-07-23）

**范围：** 拖拽放大/滞后/倾斜、牌心 pivot 共识、拖速→上抛、exit 转速耦合、配对 pop  
**钉文：** `research/handfeel/14_physical_impl_pins.md` **v1.2**  
**代码：** `src/render/phys.ts` · `src/render/cards.ts` · `src/main.ts`

---

## 1. Pivot 共识（产品）

- **默认：一切旋转 / 缩放 / 运动绕牌心。**  
- 仅当产品明确要求时才用其他轴。  
- 静止落位可用左上角 layout 坐标；有旋转时必须中心 pivot。

---

## 2. 拖拽过程

| 项 | 定稿 |
|----|------|
| 拿起放大 | **100ms** ease-out → `dragScale 1.16`（非瞬切） |
| 位置 | 手指 = 操作逻辑；画面 **极小滞后**（`dragVisualFollow: 0.55`） |
| 命中/松手 | **不读**视觉滞后，用 pointer |
| 倾斜 | 幅度 ∝ 水平滑动速度，满 ±26° @ ~520 px/s |
| 回正 | 弹簧阻尼，略过冲；snapBack 带余弦晃动 |
| 轴 | **牌心** |

---

## 3. 拖消飞出（承接 v1.1）

| 项 | 定稿 |
|----|------|
| meet | **永不**（skipMeet） |
| 起点 | 松手 pose |
| 上抛 | `throwForceK` **1.0～1.3** 由拖速映射 |
| 转速 | `ω ∝ |抛速|`（再加小抖动） |
| 配对 pop | scale **1.26** |

---

## 4. 关键 PHYS（摘要）

```text
dragScale 1.16 · dragScaleMs 100 · dragVisualFollow 0.55
dragTiltMaxDeg 26 · dragTiltRefSpeed 520
dragThrowMinK 1 · dragThrowMaxK 1.3
matchPopScale 1.26 · exitSpinDegPerSec 900
```

---

## 5. 文件

| 文件 | 说明 |
|------|------|
| `research/handfeel/14_physical_impl_pins.md` | **v1.2** |
| `research/handfeel/11_physical_anim_params.md` | 补拖拽行 |
| `docs/changelog/2026-07-23_match_exit_feel.md` | 飞出/跨侧（同日） |
| 本文 | 拖拽与 pivot |
