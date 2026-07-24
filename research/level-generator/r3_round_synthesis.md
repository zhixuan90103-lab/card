# 关卡生成器重构 · Round 3 定向检索整理

**日期：** 2026-07-24  
**目的：** 对 v3 计划中的三条窄查询做收束，判断是否还需要继续检索，或进入生成器规格。

---

## 1. 本轮产出

| 文档 | 查询目标 | 判定 |
|------|----------|------|
| [sources/r3_1_solitaire_streak_combo.md](./sources/r3_1_solitaire_streak_combo.md) | mobile solitaire streak / combo / stock | **弱补强** |
| [sources/r3_2_joker_booster_conservation.md](./sources/r3_2_joker_booster_conservation.md) | joker tile / booster / wildcard 守恒 | **弱补强** |
| [sources/r3_3_human_like_agents_hidden_info.md](./sources/r3_3_human_like_agents_hidden_info.md) | imperfect information / human-like agents | **有效补强** |

中途有一条 `wildcard matching puzzle...` 查询漂到了字符串 wildcard matching，已中止，未作为有效资料。

---

## 2. Q3-1：Solitaire streak / combo

**找到的有效内容：**

- TriPeaks / Fairway / Prospector 仍然主要回到“重叠牌 + stock + 可出牌序列”的结构。
- `mchung94/solitaire-player` 和 TriPeaks solver 继续证明，求最长/最优出牌序列是可计算的。
- Fairway Solitaire 在资料中多次被作为同类重叠牌、连出牌体验的代表，但未检索到可靠设计指标。

**没有找到的内容：**

- 没有找到“streak meter / combo 系统”的一手设计拆解。
- 没有找到“开局最少连消几对”或“抽牌打断频率”的数值标准。

**结论：**

这条只能作为结构类比，不能作为参数来源。  
本项目的 pacing 指标必须按产品目标自定义：

- easy 开局至少连续消除 N 对。
- 中期允许短卡点，但不能连续抽牌多次无反馈。
- 后期至少出现一次回到连消的释放段。

---

## 3. Q3-2：Joker / wildcard / booster 守恒

**找到的有效内容：**

- match-3 项目中有 joker / rocket / bomb / rainbow 等特殊牌，用于扩大消除、连锁和得分。
- word puzzle 资料中有 wildcard blank tile，用于替代合法目标。
- Unity Match-3 sample、match-3 engine 资料可作为特殊牌实现参考。

**没有找到的内容：**

- 没有找到“wildcard 与普通牌配对后，如何回补同牌以保持全局配对守恒”的直接资料。
- 没有找到“joker+joker 自动配对至少几对才不失望”的外部标准。
- 没有找到“从隐藏牌中找同牌、翻开并配对”的完全一致案例。

**结论：**

小丑机制不能再依赖外部资料。它是本游戏自定义规则，必须用内部 validator 证明安全：

- Joker + 普通牌：回补同牌后仍可清空。
- Joker + Joker：fever 必须达到最小消除目标或通关。
- Easy：禁用小丑也应可通关，避免“小丑是唯一救命牌”。

---

## 4. Q3-3：Human-like agents / hidden information

**找到的有效内容：**

- RLCard 明确面向 imperfect information card games，支持 RL / Deep Monte Carlo / CFR 等策略框架。
- Klondike solver 资料补强了隐藏牌场景下的 heuristic solver / minimal solver / tree search。
- MCTS 资料支持对部分可见状态进行 rollout，而不是只跑完整信息最优解。

**仍需内部定义的内容：**

- 外部资料不会给出本项目的“普通玩家”策略。
- 我们需要根据当前规则定义可见状态和合法动作。

**结论：**

Player Agent 模型可以落地为：

1. **Oracle agent**：完整信息，用于证明 seed 存在清空路径。
2. **Visible greedy agent**：只看当前 free 和 waste，优先自然配对。
3. **Unlock agent**：优先消除能释放最多覆盖牌的配对。
4. **Streak agent**：优先保持连续消除，减少抽牌。
5. **Noisy agent**：在多个可选配对中加入随机错误，用于评估 mistake cost。
6. **Joker-conservative agent**：easy 验证中尽量不用小丑，测试小丑是否只是爽感而不是唯一通路。

---

## 5. 最终补漏结论

| 缺口 | Round 3 后状态 | 处理 |
|------|----------------|------|
| Solitaire 连消数值 | 仍缺 | 内部指标假设 |
| Stock 打断频率 | 仍缺 | 内部指标假设 |
| Joker 回补守恒 | 外部无直接资料 | 内部 validator |
| Joker fever 保底 | 外部无直接资料 | 内部 validator |
| 隐藏信息代理 | 已补强 | 可写 agent model |
| 自动评级方法 | 已足够 | 可写 validation metrics |

---

## 6. 停止检索条件

本轮后不建议继续做大范围 Grok 检索。原因：

1. 反向生成、solver、依赖图、自动评级已经有足够资料支撑。
2. 小丑机制是本游戏独有，外部资料只能弱类比。
3. 连消爽感没有可迁移数值，必须通过内部生成器指标和实玩校准。

下一步应进入文档规格：

1. `07_generator_spec.md`
2. `08_validation_metrics.md`
3. `09_agent_model.md`

