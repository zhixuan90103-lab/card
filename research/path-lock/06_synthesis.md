# 综合结论与决策建议

## 1. 检索回答 §0 问题

| Q | 结论 |
|---|------|
| Q1 行业怎么叫 | Free tile / bottleneck / soft lock；可解生成是标配 |
| Q2 钥匙密度 | 现状 4–12 **偏多**（强）；目标 **2–4 为 H1 假设**（待实验） |
| Q3 几何 vs 信息 | **两者都要**：几何挡住锁 + 同 key 稀缺；抽牌只作补，不作主钥匙源 |
| Q4 chain | chain = 串联 critical path，适合 extreme；hard 保持部分 independent 旁路 |
| Q5 顿悟验收 | 可清是底线；另加 scarcity、露出时冗余 key、进度带 |
| Q6 生成 | 先 **A 后处理约束**，再考虑 B 关键路径 |
| Q7 红黑 | 锁钥同色硬约束；少量异色同点作诱饵，不堆 |
| Q8 hard/extreme 差 | 不只锁数：scarcity 更紧 + chain + 钥匙更深 + 库更瘦 |

## 2. 对「钥匙太多没锁感」的正式回答

是的。路径锁在 **L-match 密度失控** 时退化为普通配对。  
**优先修复 match-key 密度**，收益大于再加锁。

## 3. 决策建议（请拍板）

| # | 建议 | 优先级 |
|---|------|--------|
| D-a | **H1：锁 match-key 全场 2–4 张（实验假设）** | P0 实现 |
| D-b | **hard 发局禁止 canFullyClear fallback** | P0 |
| D-c | extreme 强化「深度+chain+密度2」而非只锁×3 | P1 |
| D-d | 指标 M2/M3 进 deal 或测试 | P1 |
| D-e | 玩家文案弱化「唯一钥匙」 | P2 |

## 4. 与体验主轴（顿悟）对齐

```text
好路径锁关：
  扫视 → 试探桌上链 → 卡在 L1 瓶颈
  → 顿悟「要先挖哪条 / 留哪张同色」
  → 开锁连锁 → 清场

坏关：
  钥匙遍地 / 纯赌库 / 无解 fallback
```

## 5. 下一步

**检索补段已完成**（`08` seed 表 · `09` 源补强 · `10` 伪代码）。

**实现 R5-H1**（改 `level01Deal` / `suitPaint`，可粘 `10_metrics_pseudocode_r31`）：

1. 每锁 `matchKey` 计数 ∈ [2,4]（H1 假设，用数据验收）  
2. hard：禁止 `canFullyClear` fallback（H1b，对齐 H12）  
3. 单测 + 密度直方图回归  
4. 更新 `15` / changelog  

**R0.1 强化理由：** 现网 36 局中 0 局自然「≤4 且可清」→ 约束必要。  

---

## 6. 引用

- Wikipedia Mahjong solitaire（free、复杂度、可解惯例）  
- 行业 always-solvable / undo 惯例  
- GameDeveloper critical path / cyclic generation 思路  
- 本项目实测与 D22/D23  
