# 项目文档索引

**更新：** 2026-07-22（Level01 配点 / 胜利 / stock 定稿）

> **新窗口开工：** 先读 [`HANDOFF_IMPLEMENTATION.md`](./HANDOFF_IMPLEMENTATION.md) → [`design/13_mvp_plan_and_todolist.md`](./design/13_mvp_plan_and_todolist.md)  
> **Level01 现行规则总整理：** [`changelog/2026-07-22_level01_session_summary.md`](./changelog/2026-07-22_level01_session_summary.md)  
> **笔记 vs 实现缺口：** [`changelog/2026-07-22_gap_vs_notes.md`](./changelog/2026-07-22_gap_vs_notes.md)

---

## 一、产品设计

| 文档 | 说明 |
|------|------|
| [design/01_vision_and_positioning.md](./design/01_vision_and_positioning.md) | 定位 / 题材边界 |
| [design/02_game_rules.md](./design/02_game_rules.md) | **规则**（含 D10 清桌胜利、抽牌区工具） |
| [design/03_experience_and_innovation.md](./design/03_experience_and_innovation.md) | 顿悟 / 雷区 / 验收 |
| [design/04_decisions_log.md](./design/04_decisions_log.md) | 已定·待定·否决（**D10/D10b/D19/D20** 等） |
| [design/05_board_layout_consensus.md](./design/05_board_layout_consensus.md) | **牌阵摆放 / 层级 / tier 门禁（现行）** |
| [design/06_doc_gap_audit.md](./design/06_doc_gap_audit.md) | **文档反查补漏报告** |
| [design/07_glossary.md](./design/07_glossary.md) | 术语表 |
| [design/08_prototype_scope.md](./design/08_prototype_scope.md) | 原型最小范围 |
| [design/09_tech_research_plan.md](./design/09_tech_research_plan.md) | 技术检索计划 **v3 结案** + POC 清单 |
| [design/10_tech_decision.md](./design/10_tech_decision.md) | **技术方案拍板（Pixi 8.19）** |
| [design/11_viewport_iphone15.md](./design/11_viewport_iphone15.md) | **393×852 + PC 手机框 + 真机清单** |
| [design/12_tech_gap_audit.md](./design/12_tech_gap_audit.md) | **技术反查（第二轮 · 检索结案）** |
| [design/13_mvp_plan_and_todolist.md](./design/13_mvp_plan_and_todolist.md) | **MVP 计划 + Todo List** |
| [design/15_level_rank_design.md](./design/15_level_rank_design.md) | **Level01 配点不变量 R1–R15**（平行剥 / 精简 stock / 锁钥） |

---

## 一-b、Changelog（实现笔记）

| 文档 | 说明 |
|------|------|
| [changelog/2026-07-22_level01_session_summary.md](./changelog/2026-07-22_level01_session_summary.md) | **2026-07-22 Level01 会话总整理**（优先读） |
| [changelog/2026-07-22_win_puzzle_only_stock_tool.md](./changelog/2026-07-22_win_puzzle_only_stock_tool.md) | 清桌胜利 + stock 工具 + 精简续记 |
| [changelog/2026-07-22_layout_draw_autoflip.md](./changelog/2026-07-22_layout_draw_autoflip.md) | 抽牌区布局 / 自动翻 |
| [changelog/2026-07-21_isFree_cover_v1.1.md](./changelog/2026-07-21_isFree_cover_v1.1.md) | isFree 遮挡 v1.1 |

---

## 二、市场调研

入口：[`../research/sorting-market/00_RESEARCH_INDEX.md`](../research/sorting-market/00_RESEARCH_INDEX.md)

## 二-b、技术栈检索

入口：[`../research/tech-stack/00_RESEARCH_INDEX.md`](../research/tech-stack/00_RESEARCH_INDEX.md)

---

## 三、NotebookLM

| 笔记本 | ID | 说明 |
|--------|-----|------|
| 配对牌项目笔记 | `8accbc6d-2100-42dd-b94f-54be4a93740b` | 产品+技术；有效源见 `research/tech-stack/12_effective_sources_list.md` |
| 排序，归位，整理类游戏调研 | `c4153ca3-4bce-43da-9c56-0ae6d3f367c2` | 品类调研 |

---

## 四、阅读路径

| 角色 | 路径 |
|------|------|
| 对齐玩法 | 05 → 02 → 04 |
| 反查文档 | **06** |
| 开原型 | **13 → 10 → 11 → 08 → 02** |
| 查调研 | research/sorting-market/00 → 08 → 02 |
| 查技术检索 | research/tech-stack/00 → **10** / **11** |
| 技术反查 | **12**（第二轮）→ **09 v3** → **POC-1～6** |
