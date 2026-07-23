# 技术栈检索索引

**状态：**  
- T1–T6 选型：✅ **文献检索结案**（2026-07-21 第二轮反查）  
- **T-WG WebGPU：✅ 检索结案**（R3 实测 + **D29**）· 剩余 Capacitor **真机跟踪**

**下一动作（选型轨）：** 已结案。  
**下一动作（WebGPU）：** 仅 R4 真机观察；认 [`20` v0.6](../../docs/design/20_webgpu_research_plan.md) · [R3 findings](../../docs/design/20_webgpu_r3_findings.md)

| 文档 | 路径 |
|------|------|
| 计划 v3（选型结案） | [`docs/design/09_tech_research_plan.md`](../../docs/design/09_tech_research_plan.md) |
| 拍板 | [`docs/design/10_tech_decision.md`](../../docs/design/10_tech_decision.md) |
| 视口 | [`docs/design/11_viewport_iphone15.md`](../../docs/design/11_viewport_iphone15.md) |
| 反查第二轮 | [`docs/design/12_tech_gap_audit.md`](../../docs/design/12_tech_gap_audit.md) |
| **T-WG 计划 v0.6 结案** | [`docs/design/20_webgpu_research_plan.md`](../../docs/design/20_webgpu_research_plan.md) |
| **T-WG R3 实测结论** | [`docs/design/20_webgpu_r3_findings.md`](../../docs/design/20_webgpu_r3_findings.md) |
| **T-WG 反查 v2** | [`docs/design/21_webgpu_gap_audit.md`](../../docs/design/21_webgpu_gap_audit.md) |
| **T-WG 有效源** | [`21_webgpu_effective_sources_list.md`](./21_webgpu_effective_sources_list.md) |
| **T-WG R3 changelog** | [`docs/changelog/2026-07-23_webgpu_r3_preference.md`](../../docs/changelog/2026-07-23_webgpu_r3_preference.md) |
| T-WG 有效源 | `21_webgpu_effective_sources_list.md`（待写） |
| T-WG 源卡 | `sources/wg_b_pixi_pref_and_fallback.md` · `wg_a_ios_safari_webgpu.md` · `wg_a_capacitor_wkwebview.md` · `wg_c_device_lost_and_d28.md` |
| T6 综合 | [`notes/t6_round_synthesis.md`](./notes/t6_round_synthesis.md) |
| 内部复用 | [`notes/t6_internal_reuse.md`](./notes/t6_internal_reuse.md) |
| **有效来源 List（选型）** | [`12_effective_sources_list.md`](./12_effective_sources_list.md) |
| NotebookLM | **配对牌项目笔记** `8accbc6d-2100-42dd-b94f-54be4a93740b`（2026-07-21 已入库 P0+P1+P2 核心） |

---

## 结论

**PixiJS 8.19.0 + 393×852 phone-frame + 逻辑 AABB hit-test。**  
现行后端：`preference: 'webgl'`（`src/render/app.ts`）。  
**WebGPU：** 增量检索中——**保全部效果**；引擎不重选；结案选项 D-WG0/1/2 见 `20`。

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
