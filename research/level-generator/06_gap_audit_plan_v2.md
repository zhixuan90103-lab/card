# 关卡生成器重构 · 反查补漏 + 修订检索计划 v2

**日期：** 2026-07-24  
**对照：** 第一轮 Grok 五份资料 + 第二轮三份补搜 vs 当前产品需求  
**目的：** 明确哪些结论已足够支撑重构，哪些仍是推断，后续检索如何改成更贴近本游戏规则。

---

## 1. 已完成资料对照

| 主题 | 已有资料 | 可用结论 | 缺口等级 |
|------|----------|----------|----------|
| 保证可解生成 | Mahjong reverse generation / DFS / backtracking | 先生成解法路径，再反向摆牌，比随机补救可靠 | 低 |
| 重叠牌结构 | TriPeaks / Pyramid / Mahjong solver | 固定层叠布局可表示为依赖图，求解可做状态搜索 | 低 |
| stock/waste | Pyramid / TriPeaks solver | stock 是解法路径资源，不应只是兜底池 | 中 |
| 难度评级 | MCTS / puzzle playtest / RL agents | 可用模拟玩家做批量评级 | 中 |
| 启发式策略 | MaxBlock / Random / MultipleFirst | 多代理比单一最优解更接近玩家风险 | 中 |
| 小丑机制 | 无直接外部资料 | 只能基于本游戏规则自定义验证 | 高 |
| 爽感节奏 | TriPeaks solver 有间接支持 | 缺对“连消-卡点-再连消”的直接量化 | 高 |

---

## 2. 反查：当前资料的偏差

### 已强，可以进入设计

- **反向生成是主路线。** Mahjong 资料多次指向“先有解，再摆局”。
- **solver 必须和生成器绑定。** 只发随机局再判断，会浪费种子且难控制节奏。
- **stock/waste 要进入终局验证。** 许多 Pyramid solver 只要求清桌面牌，我们的规则更严格，不能照搬。
- **难度不能只看是否可解。** 10/10 通关只是 easy 的必要条件，不是充分条件。

### 已弱，需要补漏

| 缺口 | 说明 | 不补的风险 |
|------|------|------------|
| 小丑 + 普通牌回补 | 外部纸牌资料没有对应机制 | 可能生成“玩家用了小丑就破坏偶数配对”的局 |
| 小丑 + 小丑魔法 | 目前是本游戏独有规则 | 可能出现玩家期待连击但只消一两对 |
| easy 体验边界 | 外部 solver 不关心“轻松关不应死亡” | easy 仍会被机器判可解但玩家觉得困难 |
| 开局连消指标 | 检索没有直接回答“开局几对才舒服” | 生成器可能继续出现开局 1 对就抽牌 |
| 挖宝循环量化 | “连续消除后翻出新配对”还未变成指标 | 关卡可能只有解法，没有局内节奏 |
| 固定布局适配 | 外部资料多是标准牌阵 | 需要把方法转译到本项目 5x4/4x3/3x2 固定几何 |

### 已偏，后续检索要规避

1. TriPeaks 检索偏实现和 solver，缺少关卡节奏设计。
2. Pyramid 检索偏清桌面牌，和我们“stock/waste 也必须清空”不完全一致。
3. 自动难度检索偏 Sokoban/MCTS，方法可借鉴，但不能直接套数值。
4. Mahjong 检索强调完全信息 solver，而玩家实际面对隐藏信息。

---

## 3. 修订后的检索目标

后续检索不再泛搜“关卡生成器”，改成四个更窄的问题：

1. **怎么生成可解且有节奏的 deal？**  
   关注反向生成时如何安插 early/mid/late pacing。

2. **怎么模拟普通玩家，而不是最优玩家？**  
   关注 greedy、random、heuristic、mistake-tolerant agents。

3. **怎么把爽感变成指标？**  
   关注 streak length、dead draw、reveal reward、resource pressure。

4. **怎么验证特殊牌不破坏可解性？**  
   关注 wildcard / joker / substitute / booster 类机制，若找不到外部资料，就转为内部规则验证。

---

## 4. 修订后的 Grok 检索计划

### Round 2A — 纸牌关卡节奏与连消

| Q# | 目标 | Query | 成功标准 |
|----|------|-------|----------|
| 2A-1 | TriPeaks 节奏 | `TriPeaks Solitaire level design streak stock pacing player retention` | 找到 streak、stock、连消奖励的设计解释 |
| 2A-2 | Golf / Fairway | `Golf Solitaire Fairway Solitaire streak level design stock cards difficulty` | 找到长连消和抽牌资源的商业化休闲纸牌案例 |
| 2A-3 | Pyramid 节奏 | `Pyramid Solitaire deal generator difficulty stock waste pacing` | 找到 stock/waste 对难度和节奏的影响 |

### Round 2B — 自动玩家与难度评级

| Q# | 目标 | Query | 成功标准 |
|----|------|-------|----------|
| 2B-1 | 人类近似策略 | `solitaire solver human like heuristic greedy random player model` | 至少 3 类代理策略 |
| 2B-2 | 难度指标 | `puzzle game procedural generation difficulty metrics solution path branching factor` | 找到 path length、branching、mistake cost 等指标 |
| 2B-3 | 批量 playtest | `automated playtesting puzzle games difficulty rating agents` | 支撑“10 次模拟评级”的方法来源 |

### Round 2C — 小丑 / wildcard / booster 机制

| Q# | 目标 | Query | 成功标准 |
|----|------|-------|----------|
| 2C-1 | wildcard 配对 | `solitaire wildcard joker card matching puzzle mechanic` | 找到 wildcard 如何避免破坏配对守恒 |
| 2C-2 | booster 兜底 | `match puzzle wildcard booster level design solvability` | 找到 booster 对难度和可解性的设计约束 |
| 2C-3 | 连锁清除 | `card puzzle combo chain auto match design joker` | 找到 combo 爽感和自动消除的设计参考 |

### Round 2D — 本游戏规则反推，不依赖外部

| Q# | 目标 | 方法 | 成功标准 |
|----|------|------|----------|
| 2D-1 | 固定布局可算依赖图 | 读取 `src/data/levelLayout.ts` 等布局代码 | 输出每个槽位的 depth、cover count、unlock value |
| 2D-2 | 现有坏 seed 复盘 | 用用户截图和当前 seed 规则复盘 | 形成 easy 死亡原因分类 |
| 2D-3 | 指标伪代码 | 基于规则写 validator 指标表 | 每个需求都有可自动断言的指标 |

---

## 5. 更新后的生成器设计假设

| 假设 | 状态 | 后续验证 |
|------|------|----------|
| easy 必须 10/10 模拟通关 | 已定 | 代码验证 |
| hard 允许 1-2/10 失败 | 已定 | 代码验证 |
| extreme 允许 3-5/10 失败 | 已定 | 代码验证 |
| easy 开局至少连续消除 3 对 | 假设 | 需要 playtest，可先作为生成阈值 |
| easy 中期最多连续抽牌 2 次仍无配对 | 假设 | 需要模拟指标 |
| 后期应至少有一次 3+ 连消 | 假设 | 需要模拟指标 |
| 小丑不能作为 easy 唯一通路 | 强需求 | validator 必须支持禁用小丑测试 |
| 小丑 + 普通牌必须回补同牌到 stock | 强需求 | 规则测试 |
| 小丑 + 小丑应产生明显 combo | 强需求 | fever 最小消除数指标 |

---

## 6. 下一步交付物

| 优先级 | 交付物 | 说明 |
|--------|--------|------|
| P0 | `07_generator_spec.md` | 生成器重构规格：模块、数据结构、流程 |
| P0 | `08_validation_metrics.md` | 自动验证指标：可解、难度、节奏、小丑安全 |
| P1 | `sources/r2a_card_pacing.md` | 纸牌节奏补搜 |
| P1 | `sources/r2b_player_agents.md` | 自动玩家补搜 |
| P1 | `sources/r2c_joker_wildcard.md` | 小丑/wildcard 补搜 |
| P1 | `09_bad_seed_audit.md` | 当前坏局与截图复盘 |

---

## 7. 计划修正结论

原计划“收集外部 Solitaire / Mahjong / Pyramid 资料”已经足够证明重构方向，但不足以直接写生成器。  
修订后，检索重点改为：

1. 外部资料只负责支撑方法。
2. 本游戏规则负责定义指标。
3. 生成器以指标验收，而不是以资料里的通用 solver 验收。

因此下一阶段应先写 `07_generator_spec.md` 和 `08_validation_metrics.md`，再决定是否继续补搜 Round 2A–2C。

---

## 8. Round 2 补搜反查

**资料：**

| 文档 | 主题 | 判定 |
|------|------|------|
| `sources/r2a_card_pacing.md` | TriPeaks / Golf / Fairway 节奏与 solver | **中等可用** |
| `sources/r2b_player_agents.md` | solver、启发式、自动玩家 | **高可用** |
| `sources/r2c_joker_wildcard.md` | joker / wildcard / booster | **弱可用** |

### 8.1 2A 纸牌节奏：补到结构，没补到数值

**补上的：**

- TriPeaks / Golf / Black Hole 都支持“可用牌 + stock + 连续出牌”的结构类比。
- `mchung94/solitaire-player`、TriPeaks JS solver、Black Hole solver 证明实时求解/批量验证是可行的。
- 重叠牌可表示为依赖图，适合转译到本项目固定布局。

**没补上的：**

- 没找到可信资料直接回答“开局连消几对才舒服”。
- 没找到商业 solitaire 对 early/mid/late pacing 的硬指标。
- Disney Solitaire 资料偏评论/体验，不足以作为生成器参数来源。

**处理：**

开局连消、抽牌打断、后期回连消全部进入 **内部假设指标**，先用生成器阈值跑，再用实玩修正。

### 8.2 2B 自动玩家：足够进入实现规格

**补上的：**

- 可用策略族：DFS/backtracking、A*/IDA*、Best First、beam search、greedy、random rollout。
- 可用评价维度：solution path length、branching factor、expanded nodes、mistake cost、win rate。
- 多策略代理比单一最优解更适合本项目难度评级。

**没补上的：**

- “人类近似玩家”没有统一标准，需要我们定义。
- 外部 solver 多数知道完整信息，而玩家面对隐藏信息。

**处理：**

验证器应分两类代理：

1. **Oracle agent**：知道完整布局，用于证明存在解。
2. **Player agents**：只看当前 free / waste / stock 状态，用于 10 次难度评级。

### 8.3 2C 小丑 / wildcard：外部支撑不足

**补上的：**

- PySolFC 证明传统 patience 平台支持 Joker Deck / joker cardset。
- match-3 资料提供了 wildcard、cascade、booster 的弱类比。
- Balatro 资料只能说明“joker 可承载特殊机制”，不能支撑本游戏配对规则。

**没补上的：**

- 没找到“wildcard 与普通牌配对后如何回补守恒”的直接案例。
- 没找到“joker+joker 自动连锁到多少才不失望”的可引用标准。
- 没找到与“隐藏牌中找同牌并翻开配对”完全一致的机制。

**处理：**

小丑机制必须由本游戏自己的 validator 兜住：

- Joker + 普通牌后，必须验证回补同牌后仍可清空。
- Joker + Joker 后，必须验证 fever 至少达到目标消除数或通关。
- Easy 评级必须支持“禁用小丑仍可通关”的测试。

---

## 9. 结论可靠性更新

| 结论 | 可靠性 | 说明 |
|------|--------|------|
| 反向生成主路线 | 强 | 多个 Mahjong / solitaire solver 资料支持 |
| 固定布局依赖图建模 | 强 | TriPeaks / Pyramid / Mahjong 都可转译 |
| 生成器必须内置 solver | 强 | 外部资料一致支持批量求解 |
| 难度评级用多代理 | 强 | 2B 资料足够支撑 |
| easy 开局至少 3 对连消 | 假设 | 外部无硬数值，来自产品需求 |
| 中期允许短卡点 | 假设 | 需要内部指标和实玩校准 |
| 后期必须回到连消 | 假设 | 需要内部指标和实玩校准 |
| Joker + 普通回补同牌 | 产品规则 | 外部无直接支撑，必须内部验证 |
| Joker + Joker fever 保底 | 产品规则 | 外部无直接支撑，必须内部验证 |

---

## 10. 修订检索计划 v3

### 总原则

继续检索的收益已经下降。下一阶段不应再大面积搜资料，而应先产出规格和指标；只对缺口做小范围定向补搜。

```text
Phase A  写生成器规格和验证指标
Phase B  根据规格缺口做 2-3 条定向补搜
Phase C  回读代码，设计重构模块
Phase D  执行实现
```

### Phase A — 先写规格（P0）

| 交付 | 目标 |
|------|------|
| `07_generator_spec.md` | 生成器模块、数据结构、生成流程、难度循环 |
| `08_validation_metrics.md` | 可解性、难度、节奏、小丑安全、失败分类 |
| `09_agent_model.md` | Oracle agent + Player agents 策略定义 |

### Phase B — 仅做定向补搜（P1）

| Q# | 目标 | Query | 成功标准 |
|----|------|-------|----------|
| 3-1 | solitaire 商业节奏 | `mobile solitaire tripeaks streak bonus combo design stock cards` | 若能找到 streak bonus / combo 的设计解释则补入 |
| 3-2 | wildcard 守恒 | `wildcard matching puzzle solvability substitute tile generator` | 若能找到“万能牌消耗后补偿”的案例则补入 |
| 3-3 | human-like agents | `human-like game playing agents solitaire heuristic imperfect information` | 若能找到隐藏信息玩家模型则补入 |

**停止条件：**  
若这三条仍无直接资料，不再继续搜。直接把对应规则标为内部设计假设，进入实现。

### Phase C — 本项目反查（P0）

| 交付 | 方法 | 成功标准 |
|------|------|----------|
| 固定槽位依赖表 | 读取 `src/data/levelLayout.ts`、`layout.ts` | 每个槽位有 depth / cover count / unlock value |
| 当前坏局分类 | 根据截图和 seed 复盘 | 形成死亡原因：开局断流、stock 断流、小丑破坏守恒、后期残局 |
| 现有生成器拆除点 | 读取 `level01Deal.ts`、`levelSolve.ts` | 明确哪些保留，哪些废弃 |

### Phase D — 实现路线（P0）

| 模块 | 职责 |
|------|------|
| `layoutGraph` | 固定布局依赖图、free 计算、unlock value |
| `solutionPathBuilder` | 生成 early/mid/late 解法脚本 |
| `dealAssembler` | 按解法脚本反向填牌到 puzzle / stock |
| `jokerPlanner` | 小丑位置、明暗、回补安全、fever 保底 |
| `oracleSolver` | 完整信息可解验证 |
| `playerSimulator` | 多代理 10 次难度评级 |
| `pacingScorer` | 开局连消、中期卡点、后期连消、抽牌压力 |

---

## 11. 更新后的下一步

不要继续泛检索。  
下一步应执行：

1. 写 `07_generator_spec.md`。
2. 写 `08_validation_metrics.md`。
3. 写 `09_agent_model.md`。
4. 然后回读代码，进入生成器重构设计。
