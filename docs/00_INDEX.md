# 项目文档索引

**更新：** 2026-07-23  
**规范：** [`DOC_CONVENTIONS.md`](./DOC_CONVENTIONS.md)  
**现行一页纸：** [`CURRENT.md`](./CURRENT.md)  
**有效笔记白名单：** [`NOTES_PACK.md`](./NOTES_PACK.md) ← **读什么认这里**

> 本页只做导航，不堆长文。现行结论：`CURRENT` + 钉 + 代码。

---

## 开工入口

| 角色 | 路径 |
|------|------|
| **任何人 / 新会话** | [`CURRENT.md`](./CURRENT.md) → [`NOTES_PACK.md`](./NOTES_PACK.md) |
| **有效性审查** | [`NOTES_AUDIT.md`](./NOTES_AUDIT.md) |
| 文档怎么写 | [`DOC_CONVENTIONS.md`](./DOC_CONVENTIONS.md) |
| 实现交接 | [`HANDOFF_IMPLEMENTATION.md`](./HANDOFF_IMPLEMENTATION.md) |
| 美术·体验 | [`HANDOFF_ART_UX.md`](./HANDOFF_ART_UX.md) |

---

## A. 产品设计（L2 · 稳定）

### A1 · 现行必读

| 文档 | 说明 |
|------|------|
| [02_game_rules](./design/02_game_rules.md) | **规则** |
| [04_decisions_log](./design/04_decisions_log.md) | 决策 **D01–D28** |
| [05_board_layout_consensus](./design/05_board_layout_consensus.md) | 牌阵几何 |
| [19_ios_renderer_lifecycle](./design/19_ios_renderer_lifecycle.md) | **D28** 渲染生命周期 |

### A2 · 常用设计

| 文档 | 说明 |
|------|------|
| [01_vision](./design/01_vision_and_positioning.md) | 定位 / 题材 |
| [03_experience](./design/03_experience_and_innovation.md) | 顿悟 / 雷区 |
| [07_glossary](./design/07_glossary.md) | 术语 |
| [08_prototype_scope](./design/08_prototype_scope.md) | 原型范围 |
| [10_tech_decision](./design/10_tech_decision.md) | Pixi 8 方案 |
| [11_viewport_iphone15](./design/11_viewport_iphone15.md) | 393×852 |
| [13_mvp_plan](./design/13_mvp_plan_and_todolist.md) | MVP Todo |
| [15_level_rank](./design/15_level_rank_design.md) | 配点不变量 |
| [18_art_direction_lock](./design/18_art_direction_lock_v20.md) | 美术方向锁 |

### A3 · 反查 / 检索计划（归档向）

| 文档 | 说明 |
|------|------|
| 06_doc_gap_audit · 09_tech_research · 12_tech_gap | 反查 / 技术检索史 |
| 16_path_lock_research · 17_art_* | 路径锁 / 美术检索计划 |

---

## B. 手感与操作（L1）

入口：[`research/handfeel/00_INDEX.md`](../research/handfeel/00_INDEX.md)

| 优先级 | 文档 | 说明 |
|--------|------|------|
| ★ | [14_physical_impl_pins](../research/handfeel/14_physical_impl_pins.md) | 物理手感钉 v1.5 |
| ★ | [19_intent_impl_pins](../research/handfeel/19_intent_impl_pins.md) | 拖意图钉 |
| ★ | [session_bugs](./changelog/2026-07-23_session_bugs_and_fixes.md) | 问题总表 B1–B15 |
| | [18_intent_features_params](../research/handfeel/18_intent_features_params.md) | 参数表（phys 覆盖） |
| | [20 · 12 有效源](../research/handfeel/20_intent_effective_sources_list.md) | 意图 / 物理源 List |

Art/UX：[`research/art-ux/00_INDEX.md`](../research/art-ux/00_INDEX.md)  
路径锁：[`research/path-lock/00_INDEX.md`](../research/path-lock/00_INDEX.md)

---

## C. Changelog（L4 · 实现史）

> **只追加。** 现行结论以 CURRENT + 钉 + 代码为准。完整白名单见 NOTES_PACK。

### C1 · 优先（2026-07-23）

| 文档 | 说明 |
|------|------|
| [session_bugs_and_fixes](./changelog/2026-07-23_session_bugs_and_fixes.md) | **L3 问题全集** |
| [renderer_rehydrate](./changelog/2026-07-23_renderer_rehydrate.md) | D28 实现 |
| [ios_roundup](./changelog/2026-07-23_ios_roundup.md) | iOS 总整理 |
| [ios_iphone_checklist](./changelog/2026-07-23_ios_iphone_checklist.md) | 打包清单 |
| [native_shell_layout](./changelog/2026-07-23_native_shell_layout.md) · [capacitor_ios](./changelog/2026-07-23_capacitor_ios.md) | 壳 / Cap |
| [drag_intent_drop_decode](./changelog/2026-07-23_drag_intent_drop_decode.md) | 松手解码 |
| [drawzone_z_autodraw_dim](./changelog/2026-07-23_drawzone_z_autodraw_dim.md) | 抽叠 / z / dim |

### C2 · 2026-07-22 及规则史

| 文档 | 说明 |
|------|------|
| [full_roundup](./changelog/2026-07-22_full_roundup.md) | Level01 规则向总表 |
| [d27_fair_keys](./changelog/2026-07-22_d27_fair_keys.md) · [near_miss_p0](./changelog/2026-07-22_near_miss_p0.md) | 钥匙 / near-miss |
| 其余见 [`changelog/README.md`](./changelog/README.md) | 已删过程/分条见该 README |

**手感分条与 fa_*/10–11 草案已删除** → 认 **handfeel/14** + session_bugs。

---

## D. 调研库（L5）

| 轨 | 入口 |
|----|------|
| 市场 | [`sorting-market/00_RESEARCH_INDEX`](../research/sorting-market/00_RESEARCH_INDEX.md) |
| 技术栈 | [`tech-stack/00_RESEARCH_INDEX`](../research/tech-stack/00_RESEARCH_INDEX.md) |
| 手感 | [`handfeel/00_INDEX`](../research/handfeel/00_INDEX.md) |
| Art/UX | [`art-ux/00_INDEX`](../research/art-ux/00_INDEX.md) |
| 路径锁 | [`path-lock/00_INDEX`](../research/path-lock/00_INDEX.md) |

---

## E. NotebookLM

| 笔记本 | ID | 入库 |
|--------|-----|------|
| poker类手感调优 | `b0897377-3dc5-48c2-bc98-554cb380d352` | 见 NOTES_PACK §6 |
| 配对牌项目笔记 | `8accbc6d-2100-42dd-b94f-54be4a93740b` | CURRENT · 规则 · design19 · 大表 |
