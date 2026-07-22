# 路径锁关卡设计 · 检索成果索引

**执行：** 2026-07-22  
**计划：** `docs/design/16_path_lock_research_plan.md`  
**状态：** 检索完成 · **R5-H1 已实现**（`pathLockMetrics` + deal 约束）· H2 可选  
**计划：** `docs/design/16_path_lock_research_plan.md`（v1.1）

| 文档 | 内容 |
|------|------|
| [01_problem_frame.md](./01_problem_frame.md) | R0 定义 + seed 附录入口 |
| [02_pattern_cards.md](./02_pattern_cards.md) | R1 模式卡 |
| [03_parameter_map.md](./03_parameter_map.md) | R2 旋钮表 |
| [04_metrics.md](./04_metrics.md) | R3 指标名单 |
| [05_generation_route.md](./05_generation_route.md) | R4 选型 |
| [06_synthesis.md](./06_synthesis.md) | 综合结论 |
| [07_gap_audit.md](./07_gap_audit.md) | 反查补漏 |
| [08_seed_table_r01.md](./08_seed_table_r01.md) | **R0.1 结构 seed 表（36 局）** |
| [09_source_boost_r15.md](./09_source_boost_r15.md) | **R1.5 源补强 + 内部交叉** |
| [10_metrics_pseudocode_r31.md](./10_metrics_pseudocode_r31.md) | **R3.1 指标伪代码** |

**一句话结论：**  
路径锁优先 **稀缺 + 深度 + 露出**；主路线 **A**。  
R0.1：**72% 局钥匙过密，0 局自然达到「≤4 且可清」** → H1 必须做约束，不能靠抽 seed。
