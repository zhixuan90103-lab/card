# 源卡 intent_c · 游戏/通用拖放意图（薄竞品）

**轮次：** C  
**日期：** 2026-07-23  
**等级：** 中（UX 指南级；非逐帧竞品）  
**计划：** `15` v0.2 · Q-F1  

---

## 1. 源

| # | 源 | 要点 |
|---|-----|------|
| 1 | NN/g, **Drag-and-Drop: How to Design for Ease of Use** (2020) https://www.nngroup.com/articles/drag-drop/ | 拖放本质不准；**磁吸/扩大有效落区**；全程 signifier + 反馈 |
| 2 | Smart Interface Design Patterns, **Drag-and-Drop UX** (2023) https://smart-interface-design-patterns.com/articles/drag-and-drop-ux/ | 落点 magnetism；短过渡 snap（~100ms）；elevation 表拖中 |
| 3 | Apple HIG / 通识 | 触控目标约 **44pt** 量级；本项目牌 52×72 design 已大于最小触控 |
| 4 | 既有手感源 | `fa_a5_snapback_soft_fail` · `fa_a6_dual_path_tap_drag`（仓库内） |

---

## 2. 可复述结论

1. **拖放天生不准**（Fitts：小目标费时）→ 有效落区可 **大于视觉框**。  
2. **磁吸**只应对 **合法目标** 给反馈；非法不应吸住当成功。  
3. **清晰阶段反馈**：抓取 / 拖中 / 可放 / 成功或取消。  
4. 失败应 **回到原位**（snap）并让用户理解，而非静默。  
5. 强磁吸若 **无跟手** 会毁控制感（本项目反模式已钉）。

---

## 3. 映射到本项目

| 指南 | 落地 |
|------|------|
| 扩大 drop zone | `τ_match` 对 **canMatch free** 松于精确 AABB |
| 磁吸 | score 高时 Match；**禁止**拖中坐标硬吸附 |
| 取消 | snapBack（已有）+ 可选轻 haptic |
| 拖中 elevation | CARD_Z.drag / scale（已有 14） |
| 合法优先 | DropDecoder：M·canMatch ≫ G·geom |

---

## 4. 不采纳

- 教学向「拖到框松手」多步确认。  
- 列表排序式连续磁吸重排（品类不符）。  
- 为拖放再引入物理引擎。

---

## 5. 关闭

Q-F1：**薄关闭** — 容差 + 合法磁吸边界已够；无需再开三消专题周。
