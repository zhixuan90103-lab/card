# 手感轨 · 目录

**更新：** 2026-07-23  
**状态：** 现行（钉）/ 检索关（意图计划）  
**规范：** [`docs/DOC_CONVENTIONS.md`](../../docs/DOC_CONVENTIONS.md)  
**项目入口：** [`docs/CURRENT.md`](../../docs/CURRENT.md) · [`docs/NOTES_PACK.md`](../../docs/NOTES_PACK.md)  
**清理：** 2026-07-23 已删 fa_* 源卡、01–11/13 旧草案（见 [`NOTES_AUDIT`](../../docs/NOTES_AUDIT.md)）

**NotebookLM：** poker类手感调优 · `b0897377-3dc5-48c2-bc98-554cb380d352`

---

## ★ 现行（先读这些）

项目级白名单：[`docs/NOTES_PACK.md`](../../docs/NOTES_PACK.md)

| 文档 | 状态 | 说明 |
|------|------|------|
| [14_physical_impl_pins.md](./14_physical_impl_pins.md) | ✅ v1.5 **L1** | 物理手感钉 |
| [19_intent_impl_pins.md](./19_intent_impl_pins.md) | ✅ **L1 已落地** | 拖松手 + 点选 |
| [20_intent_effective_sources_list.md](./20_intent_effective_sources_list.md) | ✅ | 意图有效源 |
| [12_effective_sources_list.md](./12_effective_sources_list.md) | ✅ v3 | 物理有效源目录 |
| [session_bugs](../../docs/changelog/2026-07-23_session_bugs_and_fixes.md) | ✅ **L3** | 问题/调整总表 |
| [18](./18_intent_features_params.md) · [17](./17_intent_event_table.md) | 辅 | 以 phys / 19 为准 |

**代码第一手：** `src/render/cards.ts` · `phys.ts` · `src/core/rules.ts` · `src/main.ts`

---

## 意图检索（关 · 只读）

| 文档 | 说明 |
|------|------|
| [15_drag_intent_research_plan.md](./15_drag_intent_research_plan.md) | 拖意图计划 v0.3 **检索关** |
| [16_drag_intent_gap_audit.md](./16_drag_intent_gap_audit.md) | 意图计划反查 |

---

## 源卡 `sources/`（精简后）

| 前缀 | 含义 | 状态 |
|------|------|------|
| `intent_*` | 拖意图 A/B/C | ✅ 支撑 19/20 |
| `pf_*` | 物理检索史 | ⚠️ 原则可考古；参数认 phys |

**已删除：** 全部 `fa_*`（早期反馈轮，ms 对 phys 无效）

---

## 相关 changelog（仍在）

| 文档 | 说明 |
|------|------|
| [drawzone_z_autodraw_dim](../../docs/changelog/2026-07-23_drawzone_z_autodraw_dim.md) | 抽叠 / z / 自动抽 / dim |
| [drag_intent_drop_decode](../../docs/changelog/2026-07-23_drag_intent_drop_decode.md) | 松手解码 |

（原 match_exit / drag_handfeel / tap_meet / flip 分条 **已删**，结论在 **14** + session_bugs。）
