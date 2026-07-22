# 变更记录 · isFree 遮挡判定 v1.1

**日期：** 2026-07-21  
**Notebook：** 配对牌项目笔记  
**主题：** 被盖住的牌仍翻开（free/亮面）——根因修复  
**规范版本：** `docs/design/05_board_layout_consensus.md` → **v1.1**

---

## 1. 现象

对局过程中（尤其消掉上层组顶后），仍有**被上层牌角/堆叠压住**的牌显示为**亮面可点**（`isFree === true`）。多轮调参（阈值、整层门禁、组 footprint）后问题仍复现。

---

## 2. 根因

### 2.1 已正确的部分（v1.0）

- 遮挡单元必须是 **组 (group)**：存活成员 rect 的并集 footprint + 组顶 layer/tier。
- 单卡比较 layer 无法挡住「压在别人牌堆下的邻组组顶」（组中/组底 layer 更低）。

### 2.2 真正漏洞（v1.1 修复点）

`isFree` 对**所有**遮挡统一使用 `coverThreshold ≈ 0.12` 的**比例重叠**：

```
重叠面积 > 0.12 × min(面积)
```

上层组顶消掉后只剩中/底时，对角邻接下层往往只剩 **2%～8% 角部重叠**，中心也不在 footprint 内 → 比例阈值判 free → **被盖住却亮面**。

**复现数据（Level01）：**

| 局面 | 旧逻辑 free | 问题 |
|------|-------------|------|
| 开局 | 6 张 L2 组顶 | 正确 |
| 去掉全部 L2 组顶 | 10 张（含 c20/c21/c22/c23 等边缘 L1） | 错误：L1 仍与 L2 中/底有 2%～8% 重叠 |
| 同上 + 任意像素重叠 | 仅 6 张 L2 中牌 | 正确 |

---

## 3. 修复方案（设计 + 实现）

### 3.1 分层几何策略

| 高度关系 | 几何条件 | 原因 |
|----------|----------|------|
| **更高 tier / 更高 topLayer** | **任意 ≥1px 轴对齐重叠** 即挡 | I1：可见遮挡 ⇒ 不可 free |
| **同 tier 且 topLayer 相等** | 仅当 **C 的中心 ∈ G.footprint** 才挡 | 避免两 free 顶边缘轻碰互锁；中心在堆下则明确被盖 |

### 3.2 伪代码（规范 §5.2 v1.1）

```text
isFree(C):
  同组：更高 layer 且 rectsOverlap → false
  其它组 G：
    if G.tier > C.tier 或 G.topLayer > C.layer:
      if rectsOverlap(G.foot, C) → false
    if 同 tier 且 topLayer 相等 且 center(C) ∈ G.foot:
      → false
```

### 3.3 明确禁止

- **`coverThreshold` 不再参与 `isFree`**
- 仅保留给软几何 / 旧 `isCovering` 测试

---

## 4. 代码改动清单

| 文件 | 变更 |
|------|------|
| `src/core/rules.ts` | 重写 `isFree`：更高层 any-overlap；同高 center-in-footprint |
| `src/core/geometry.ts` | 新增 `rectsOverlap` |
| `src/core/rules.cover.test.ts` | 回归：角部重叠挡 free；L2 组顶清空后仅 6 张 mid free |
| `src/core/geometry.test.ts` | `rectsOverlap` 单测 |
| `docs/design/05_board_layout_consensus.md` | 升至 **v1.1**，§5.2/5.3 与实现对齐 |

---

## 5. 验证结果

- 全量测试：**37/37 通过**
- 不变量检查：各消牌阶段 free 牌均无「更高 layer 仍有像素重叠却 free」
- 开局 free = `d00_2 … d12_2`（6 张 L2 组顶）
- 无 L2 组顶后 free = 6 张 L2 中牌 only

---

## 6. 设计不变量（回顾）

| ID | 不变式 |
|----|--------|
| I1 | 被上层**组**压住的牌，不得亮面、不得可点 |
| I2 | 同组内只有组顶可能 free |
| I3 | 同 tier 不同组不靠 layer 互压；靠 footprint + 分层几何 |
| I4 | 局部揭开：压住本牌的上层消掉后即可翻 |
| I5 | Free ⇔ 亮面；渲染唯一依据 `isFree` |

---

## 7. 后续注意

- 硬刷新 / 重开本关后再验手感。
- 若仍有异常，记录牌 id / tier / 截图，针对该帧做定点几何诊断。
- 新关卡摆放须保证：同层 free 顶中心互不落入对方 footprint；上层对下层允许任意重叠遮挡。
