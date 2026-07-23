# 排序 / 归位 / 整理类 · 欧美手游体验调研

**范围：** 机制向 · 可千关 · 欧美手机 · 体验优先（暂不谈商业化）  
**方法：** 机制主轴 × E 感受 × L 脚本 × C 认知核 · 四层拆解 · 真/半/假  
**检索：** Grok Search · 首轮 + 三轮补漏 · 2026-07-20  
**产品设计文档（玩法现行案）：** 见仓库 [`docs/`](../../docs/00_INDEX.md)

---

## 先读

| 优先级 | 文件 | 说明 |
|--------|------|------|
| **P0** | `08_round_synthesis_final.md` | 三轮终稿：缺口、修订、决策地图 |
| **P0** | `09_self_consistency_audit.md` | 自洽评估 + 使用纪律 |
| **P0** | `12_effective_sources_list.md` | 有效来源 List（S/A/B 分级） |
| P1 | `07_gap_audit_and_plan_v2.md` | 反查与检索计划 |
| P1 | `01_sample_frame_v1.md` | 抽样表 v2（文件名遗留 v1） |
| P1 | `02_cross_family_commonalities.md` | 共性 v2（含 H11–H13） |
| P2 | `03_template_C1_parking_jam.md` | C1 样板 |
| P2 | `10_template_E1_screw.md` | E1 Screw 样板 |
| P2 | `11_anchor_observation_notes.md` | A1/C1/E1 观察笔记 |
| P2 | `04_hooks_comfort_churn.md` | 钩子表 v2 |
| P2 | `05_handfeel_chapter.md` | 手感 v3 |
| P3 | `sources/` | 原始 Grok 检索 md |
| **P0 实现** | `14_board_placement_rules.md` | **牌阵摆放/层级摘要**（全文见 `docs/design/05`） |

---

## 交付状态

| 文件 | 状态 |
|------|------|
| ① 抽样表 | ✅ v2 |
| ② 真共性 | ✅ v2（H 附条件 + H11–13） |
| ③ C1 / E1 样板 | ✅ |
| ④ 钩子表 | ✅ v2 |
| ⑤ 手感 | ✅ v3（真机仍待） |
| 三轮闭环 | ✅ |
| 自洽评估 | ✅ · 修复后约 4.0/5 |
| 有效来源 + NotebookLM 入库 | ✅ |

---

## 战略锚点（调研）

1. **A1** Water / Ball — 空位核 · 假皮  
2. **C1** Parking Jam — 反推核 · 半真  
3. **E1** Screw — 拆除+分色 · 半真  
4. **R1** Goods 三消 — 对照勿混  
5. **边界** ALTTL / Perfect Tidy / Unpacking  

---

## 关键结论（一句话）

> 千关机制战场在空位规划 / 依赖反推 / 螺丝阻塞拆除（A/C/E）；R1 三消可千关但非整理核；**默认无 timer + 可解性信任** 是碎片放松向非谈判项；纯归位非三消参数化千关是 **OP-1 待验假设**。  
> 本仓库产品玩法现行案见 **`docs/design/02_game_rules.md`**（**4×5 层叠**同点配对，非经典三角 Pyramid、非接龙）。
