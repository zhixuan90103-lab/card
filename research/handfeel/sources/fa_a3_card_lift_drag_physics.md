# FA-A3 · 纸牌/卡片抬升 · 拖拽物理语言

**日期：** 2026-07-22  
**可信度：** 中–高（DnD UX 指南 + 移动触控；非逐帧牌桌）  
**填入：** E-drag · A-sel · A-drag-scale

## 源

| # | 源 | 要点 |
|---|-----|------|
| 1 | [Drag-and-Drop UX · Smart Interface Design Patterns](https://smart-interface-design-patterns.com/articles/drag-and-drop-ux/) | 抬升：阴影 + outline + 微倾；可留 ghost 原位 |
| 2 | [Touch Controls · Cursa](https://cursa.app/en/page/touch-controls-for-mobile-games-input-patterns-and-feedback) | 按下即反馈；拖每帧更新；物体略偏移防挡指 |
| 3 | [UX Planet · Game Design UX](https://uxplanet.org/game-design-ux-best-practices-the-ultimate-guide-4a3078c32099) | 拖拽锚点偏移，防手指挡住牌 |
| 4 | 本代码 `cards.setDragPosition` | scale 1.04 + z=5000 + 牌影 |

## 观察（Physicality 语言）

| 手法 | 业界 | 本产品现状 | 建议 |
|------|------|------------|------|
| 选中抬升 | 微抬 / 描边 | **y-4 + 金边**，无 scale | ✅ 保持（防挡邻牌扫视） |
| 拖起放大 | 常见 略 scale | **1.04** | ✅ 保持；C5 试 1.0/1.08 |
| 拖起阴影 | 几乎标配 | 拖时 paintShadow | ✅ |
| 倾斜 tilt | Trello 等有 | 无 | **不做**（W02 挡扫视） |
| 原位 ghost | 可选 | 无（空位即走） | 可选 P2；非必须 |
| 指下偏移 | 推荐 | grabDx/Dy 有 | 可评估「上偏 8–12px」真机 |

## 选中 vs 拖：两套 Physicality 是否冲突？

- **选中：** 静态意图「我锁定这张」→ 描边 + 微抬足够  
- **拖中：** 动态意图「我拿在手里」→ 需要 **离层感**（z + scale + 影）  
- **结论：** **允许不同**；成功消统一用 flyAway，不要求选中也 1.04

## 对本产品

| 决策 | 结论 |
|------|------|
| A-sel | y-4，无 scale（维持 `04`） |
| A-drag-scale | 默认 **1.04**；区间 1.0–1.08 |
| 禁止 | 大倾斜、拖中长轨迹特效 |
| 跟手 | 0 延迟感 = pointermove 直接写 transform（已是） |
