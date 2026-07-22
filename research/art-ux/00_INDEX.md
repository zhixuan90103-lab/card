# Art / UI·UE / 动画 / 手感 · 检索成果索引

**状态：** ✅ 规格结案（可 R4）· ⚠️ 参数=假设 · 真机 R5  
**计划：** [`docs/design/17_art_ux_research_plan.md`](../../docs/design/17_art_ux_research_plan.md) **v1.2**  
**反查权威：** [`07_gap_audit.md`](./07_gap_audit.md) **v2**  
**实现钉：** [`08_impl_pins_r31.md`](./08_impl_pins_r31.md)  
**一页结论：** [`06_synthesis.md`](./06_synthesis.md) v2  
**实现交接：** [`docs/HANDOFF_ART_UX.md`](../../docs/HANDOFF_ART_UX.md)

---

## 进度

| 阶段 | 文档 | 状态 |
|------|------|------|
| 计划 | `docs/design/17` v1.2 | ✅ 修订 |
| R0 基线 | `01_baseline_notes.md` | ✅ 半（无录屏→R4 补） |
| R1 源卡 | `sources/` ×5 | ✅ 偏（品类薄，不补搜） |
| R2 视觉 | `02_visual_spec.md` v0.1 | ✅ |
| R2 UE | `03_ue_event_table.md` **v1.2**（B′ 拖放合流） | ✅ |
| R2 动画 | `04_animation_params.md` **v0.2**（snap/drag/busy） | ✅ |
| R2 反模式 | `05_antipatterns.md` | ✅ |
| 综合 | `06_synthesis.md` v2 | ✅ |
| R3 反查 | `07_gap_audit.md` v2 | ✅ |
| R3.1 钉 | `08_impl_pins_r31.md` | ✅ |
| 自洽评估 | [`09_self_consistency_audit.md`](./09_self_consistency_audit.md) | ✅ 4.0/5 |
| 有效来源 | [`12_effective_sources_list.md`](./12_effective_sources_list.md) | ✅ 已入项目笔记 |
| 清晰度/矢量感 | [`10_render_clarity_vector_feel.md`](./10_render_clarity_vector_feel.md) | ✅ 调研（推荐 bake） |
| R4 实现 | 代码 + changelog | ⬜ |
| R5 真机 | `11` §6 | ⬜ |

---

## 实现必读序

1. `09` 自洽评估（使用纪律 + 代码债）  
2. `07` v2（知假设与坑）  
3. `08`（S1–S7 + H-\* 默认）  
4. `06` → `02` `03` `04` `05`  
5. `HANDOFF_ART_UX` §9  

---

## R1 参数卡（可信度）

| 文件 | 主题 | 可信度 |
|------|------|--------|
| `r1_nng_animation_duration` | 100–300ms UI | 高（非牌类） |
| `r1_fake_card_flip` | scale.x 伪翻 | 高 |
| `r1_card_readability_a11y` | 角标/对比 | 中–高 |
| `r1_juice_dose_and_lock` | 剂量/锁输入 | 中 |
| `r1_web_touch_viewport` | Safari/safe-area | 高 |

**缺独立卡（已用拍板关闭）：** 背面竞品、麻将 free glow、配对消逐帧、HUD 浮层竞品、选中抬升竞品、抽牌飞入。见 `07` §3。
