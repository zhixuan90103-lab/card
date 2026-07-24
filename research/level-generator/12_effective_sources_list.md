# 匹配牌关卡设计 · 有效来源 List

**日期：** 2026-07-24  
**用途：** 添加到 NotebookLM「匹配牌关卡设计」，作为后续生成器规格、验证指标、玩家代理模型的有效资料索引。  
**筛选原则：** 只保留能直接支撑“反向生成、固定布局依赖图、自动验证、玩家代理、小丑安全”的来源；商业评论和漂题资料降权或剔除。

---

## 1. 本地综合文档（最高优先级）

| 文档 | 价值 | 用法 |
|------|------|------|
| `research/level-generator/00_INDEX.md` | 总索引 | Notebook 入口 |
| `research/level-generator/06_gap_audit_plan_v2.md` | 两轮反查 + v3 计划 | 判断哪些资料有效、哪些是内部假设 |
| `research/level-generator/r3_round_synthesis.md` | 第三轮收束 | 停止泛检索、进入规格阶段的依据 |

---

## 2. 反向生成 / 保证可解

| 来源 | 文件 | 可信度 | 有效结论 |
|------|------|--------|----------|
| Mahjong reverse generation / DFS / backtracking | `grok_01_reverse_generation.md` | 高 | 先构造解法路径，再反向摆牌；随机发牌后补救不稳定 |
| Stack Overflow Mahjong solvable arrangement | `grok_01_reverse_generation.md` | 中 | “play in reverse” 是配对消可解生成的核心思路 |
| acvrp-lab Mahjong solitaire algorithm | `grok_01_reverse_generation.md` | 中-高 | 暴露牌 DFS / backtracking 可用于保证 solvable |
| cchaiyatad Mahjong solver | `grok_01_reverse_generation.md`、`grok_05_solver_heuristics.md` | 高 | MaxBlock、Random 等策略可转为玩家代理启发式 |

---

## 3. TriPeaks / Pyramid / Stock 资源

| 来源 | 文件 | 可信度 | 有效结论 |
|------|------|--------|----------|
| mchung94 solitaire-player | `grok_02_tripeaks_pacing.md`、`grok_03_pyramid_stock_strict_win.md`、`r2a_card_pacing.md` | 高 | TriPeaks / Pyramid 可实时求解；stock 是解法路径的一部分 |
| Pyramid solver / service | `grok_03_pyramid_stock_strict_win.md` | 高 | 很多 solver 只清桌面牌；我们的 validator 必须额外清 stock/waste |
| TriPeaks overlapping cards algorithm discussion | `grok_02_tripeaks_pacing.md`、`r2a_card_pacing.md`、`r3_1_solitaire_streak_combo.md` | 中 | 固定层叠布局可以建依赖图和状态搜索 |
| Black Hole / Golf solver | `r2a_card_pacing.md` | 中 | 连续出牌序列可求解；可作为 streak 路径模型参考 |

---

## 4. 自动难度评级 / 玩家代理

| 来源 | 文件 | 可信度 | 有效结论 |
|------|------|--------|----------|
| Sokoban MCTS / automated difficulty | `grok_04_auto_difficulty_playtesting.md` | 中 | 自动 playtest 可把可解关卡再分难度 |
| Solitaire solver heuristic repositories | `r2b_player_agents.md` | 高 | greedy、beam、A*、random rollout 可用于多代理评级 |
| FreeCell / Klondike solver comparisons | `r2b_player_agents.md` | 中-高 | 不同搜索策略可对应不同玩家能力 |
| RLCard / imperfect information card games | `r3_3_human_like_agents_hidden_info.md` | 高 | 隐藏信息代理应只看可见状态；MCTS/rollout 可评估不确定性 |
| Klondike hidden-card solvers | `r3_3_human_like_agents_hidden_info.md` | 中 | 支撑 player agent 与 oracle agent 分离 |

---

## 5. 小丑 / Wildcard / Booster

| 来源 | 文件 | 可信度 | 有效结论 |
|------|------|--------|----------|
| PySolFC Joker Deck / cardset support | `r2c_joker_wildcard.md` | 中 | 传统 patience 平台支持 Joker，但不解决本游戏守恒 |
| Match-3 joker / special tile implementations | `r2c_joker_wildcard.md`、`r3_2_joker_booster_conservation.md` | 低-中 | 可作为特效和 combo 弱类比 |
| Word puzzle wildcard blank tile | `r3_2_joker_booster_conservation.md` | 低-中 | wildcard 可替代目标，但没有配对回补逻辑 |

**结论：**  
小丑规则没有找到强外部对应案例。Joker + 普通牌回补同牌、Joker + Joker fever 保底必须作为本游戏内部规则，由 validator 验证。

---

## 6. 明确降权 / 不作为依据

| 类型 | 原因 |
|------|------|
| Medium 商业评论 / App Store 数据 | 只能说明市场存在，不能支撑生成参数 |
| Balatro mod 资料 | Joker 语义相似，但玩法不同，不支撑配对关卡可解性 |
| match-3 特效教程 | 可参考动画/特殊牌实现，不支撑固定牌阵生成 |
| 字符串 wildcard matching 查询 | 漂题，已中止，不纳入有效来源 |
| solitaire streak/combo 检索中的产品列表 | 没有给出设计指标，不能当数值来源 |

---

## 7. 可直接转成规格的结论

1. 生成器主路线：**解法路径优先 + 反向填牌**。
2. 固定布局：每个槽位要计算 `depth`、`cover count`、`unlock value`。
3. 通关验证：桌面、stock、waste 必须全部清空。
4. 难度评级：先 Oracle 证明可解，再 Player Agents 跑 10 次。
5. Easy：应支持“禁用小丑仍可通关”的验证。
6. 小丑：所有安全性由内部 validator 保证，外部资料只做弱参考。
7. Pacing：开局连消、中期短卡点、后期释放段是内部体验指标，不再等待外部数值。

