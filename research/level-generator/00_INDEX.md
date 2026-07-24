# 关卡生成器重构 · 检索索引

**执行：** 2026-07-24  
**目标：** 为固定摆放、随机种子、含小丑机制的配对纸牌生成器重构提供外部依据。  
**当前状态：** 第一轮 Grok 完成；已反查补漏；下一步进入针对性补搜或设计规格。

| 文档 | 内容 |
|------|------|
| [grok_01_reverse_generation.md](./grok_01_reverse_generation.md) | Mahjong / 配对消的反向生成、DFS、保证可解 |
| [grok_02_tripeaks_pacing.md](./grok_02_tripeaks_pacing.md) | TriPeaks 重叠牌、stock、连消与 solver |
| [grok_03_pyramid_stock_strict_win.md](./grok_03_pyramid_stock_strict_win.md) | Pyramid stock/waste、严格通关与 solver |
| [grok_04_auto_difficulty_playtesting.md](./grok_04_auto_difficulty_playtesting.md) | 自动 playtest、MCTS、难度模型 |
| [grok_05_solver_heuristics.md](./grok_05_solver_heuristics.md) | Mahjong solver 启发式、MaxBlock、DFS |
| [06_gap_audit_plan_v2.md](./06_gap_audit_plan_v2.md) | 反查补漏 + 修订检索计划 v3 |
| [sources/r2a_card_pacing.md](./sources/r2a_card_pacing.md) | Round 2A：纸牌节奏补搜 |
| [sources/r2b_player_agents.md](./sources/r2b_player_agents.md) | Round 2B：自动玩家与难度评级补搜 |
| [sources/r2c_joker_wildcard.md](./sources/r2c_joker_wildcard.md) | Round 2C：小丑 / wildcard / booster 补搜 |
| [sources/r3_1_solitaire_streak_combo.md](./sources/r3_1_solitaire_streak_combo.md) | Round 3-1：solitaire streak / combo 定向补搜 |
| [sources/r3_2_joker_booster_conservation.md](./sources/r3_2_joker_booster_conservation.md) | Round 3-2：joker / booster 守恒定向补搜 |
| [sources/r3_3_human_like_agents_hidden_info.md](./sources/r3_3_human_like_agents_hidden_info.md) | Round 3-3：隐藏信息玩家代理定向补搜 |
| [r3_round_synthesis.md](./r3_round_synthesis.md) | Round 3 定向检索整理 |

**一句话结论：**  
生成器应采用“解法路径优先”的反向构造，再用本游戏终局条件和多策略玩家代理验证；不能只靠随机发牌后补救。

**当前计划：**  
继续大范围检索的收益已下降。下一阶段先写 `07_generator_spec.md`、`08_validation_metrics.md`、`09_agent_model.md`，只在规格缺口明确时做 2-3 条定向补搜。

**Round 3 结论：**  
隐藏信息玩家代理资料有效补强；solitaire streak 和 joker 守恒仍只能弱类比。停止大范围检索，进入规格编写。
