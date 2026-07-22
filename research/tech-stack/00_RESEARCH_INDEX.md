# 技术栈检索索引

**状态：** ✅ **文献检索结案**（2026-07-21 第二轮反查）  
**下一动作：** POC-1～6（见 `docs/design/09` §7），不是再检索  

| 文档 | 路径 |
|------|------|
| 计划 v3 | [`docs/design/09_tech_research_plan.md`](../../docs/design/09_tech_research_plan.md) |
| 拍板 | [`docs/design/10_tech_decision.md`](../../docs/design/10_tech_decision.md) |
| 视口 | [`docs/design/11_viewport_iphone15.md`](../../docs/design/11_viewport_iphone15.md) |
| 反查第二轮 | [`docs/design/12_tech_gap_audit.md`](../../docs/design/12_tech_gap_audit.md) |
| T6 综合 | [`notes/t6_round_synthesis.md`](./notes/t6_round_synthesis.md) |
| 内部复用 | [`notes/t6_internal_reuse.md`](./notes/t6_internal_reuse.md) |
| **有效来源 List** | [`12_effective_sources_list.md`](./12_effective_sources_list.md) |
| NotebookLM | **配对牌项目笔记** `8accbc6d-2100-42dd-b94f-54be4a93740b`（2026-07-21 已入库 P0+P1+P2 核心） |

---

## 结论

**PixiJS 8.19.0 + 393×852 phone-frame + 逻辑 AABB hit-test。**  
Yaran 已用 Pixi v8。真机帧率 / 本仓包体 / 可运行页 → **POC**。

---

## sources/ 可信度

| 优先 | 文件 |
|------|------|
| ✅ 优先 | `t4_official_hit.md`, `t6_official_perf_atlas.md`, `t1_three.md`, `t2_pixi_templates.md`, `t3_iphone15.md`, t4 pixi/three |
| 🟡 旁证 | `t1_pixi`, `t3_phone_frame`, `t4_logic_hit`, `t6_atlas`, `t6_pixi_mobile_perf`（bug 列表）, `t6_layered_match`, `t6_phone_frame_lib`, `t6_texture_limit`, `t2_three_cards` |

## notes/

| 文件 | 用途 |
|------|------|
| t6_round_synthesis.md | T6-P 综合 |
| t6_internal_reuse.md | Yaran / Bag |
| bundle_size.md | **POC-4 待建** |

引用：官方 → 10/11 → official 精炼 → 旁证。
