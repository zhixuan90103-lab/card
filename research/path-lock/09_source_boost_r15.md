# R1.5 · 源补强 + 内部交叉

**可信度：** A 学术/强事实 · B 设计综合 · C 社区/产品 · I 内部仓库  

---

## 1. 外部补强

### 1.1 Mahjong solitaire（A）

- **源：** [Wikipedia: Mahjong solitaire](https://en.wikipedia.org/wiki/Mahjong_solitaire)  
- **要点：**  
  - free = 左右可移出的暴露牌  
  - 完美信息可清判定 **NP-complete**；最优策略 PSPACE-complete  
  - Turtle 随机约 **3%** 透视仍无解  
  - 商业实现常：**不生成无解盘** + undo  
- **映射路径锁：**  
  - 发局可清 = 基础设施（对齐 H12）  
  - 不做完备最优 solver；用贪心+约束  
- **可信度：** A  

### 1.2 可解生成惯例（B/C）

- 多款商店文案 / 社区：always solvable、avoid fake dead ends  
- **反例（C 强）：** Water Sort / Screw 等用 **假死局 + 广告道具** → 玩家背叛感  
- **源：** 内部已摘 `sorting-market/sources/r3_difficulty_scaling.md`  
- **映射：** hard **禁止** 不可清 fallback；难度尖刺不能靠骗关  

### 1.3 Critical path / 过程生成（B）

- GameDeveloper 等：先定 critical path 再填装饰内容  
- Cyclic dungeon：多环 vs 单线  
- **映射：**  
  - chain ≈ 单线 critical path（锁序）  
  - independent ≈ 多瓶颈旁路  
  - **降权：** 地牢 ≠ 牌桌，只借节奏语言  
- **可信度：** B（类比）  

### 1.4 仍弱的外部项（登记，不装完成）

| 项 | 状态 |
|----|------|
| Mahjong 开源生成器源码精读 | 未做 |
| 国内羊类/叠层节奏专篇 | 未做 |
| Golf Solitaire 库资源设计 | 未做 |
| GDC puzzle aha 原文 | 未做 |

---

## 2. 内部交叉：`research/sorting-market`

| 内部结论 | 路径锁含义 | 动作 |
|----------|------------|------|
| **H12 可解性信任** | 玩家忍难不忍骗 | **H1b 禁 hard fallback** |
| **假死局/难度尖刺 = 流失** | extreme 不能靠无解 | extreme 也尽量可清；尖刺=结构不是骗 |
| **E5 顿悟**（C 停车依赖链） | 「先动谁」= 开锁序 | 锁应用 **依赖/路径** 表达，不是堆 key |
| **难度单位 = 链深度×岔路×可逆** | 不是仿真细节 | 旋钮：depth、chain、scarcity、undo |
| **无 timer 非谈判** | 已遵守 | 保持 |
| **OP 故意难逼道具** | 禁止 | 我们无 IAP，更要可解 |

摘自：`08_round_synthesis_final.md`、`03_template_C1_parking_jam.md`、`10_template_E1_screw.md`、`r3_difficulty_scaling.md`。

---

## 3. 内部交叉：`docs/design/03` 体验

| 原则 | 路径锁 |
|------|--------|
| 主卖顿悟 E5 | 卡点应可想通，非随机撞 key |
| 要避免狂抽唯一解 | 钥匙桌面率↑、stock 不藏主 key |
| 撤销敢试 | 保留撤销；路径锁鼓励试探 |
| 消后掀开反馈 | 开锁后连锁 = 兑现 |

---

## 4. 模式卡修订（R1.5）

| 原结论 | 修订 |
|--------|------|
| 密度 2–4「才有锁感」 | 改为 **H1 假设**；R0.1 显示现网几乎抽不到 ≤4 可清 |
| 地牢 cyclic 直接迁移 | 仅保留 multi-path vs chain 隐喻 |
| 可解标配 | **升级为强**（内部 H12 + Mahjong 惯例） |

### 新增模式卡 · 假死局流失（反例）

- **源：** sorting-market R3 / 社区 Water·Screw  
- **机制：** 不可清或必须看广告 → 背叛  
- **与路径锁：** 直接反例  
- **旋钮：** 禁 fallback；尖刺用 scarcity/depth  
- **优先级：** P0  
- **可信度：** I + C  

### 新增模式卡 · 依赖链深度（停车类比）

- **源：** sorting-market C1 模板  
- **机制：** 难度 = 依赖链 × 岔路 × 可逆空间  
- **与路径锁：** 类比 — 压住锁的层数 × 旁路 × 撤销  
- **旋钮：** key_min_depth、chain、undo  
- **优先级：** P1  
- **可信度：** I  

---

## 5. R1.5 小结

1. **可解信任** 从「行业感觉」升为 **内部 H12 + 外部惯例双证** → H1b 必做。  
2. **密度 2–4** 仍是假设，但 R0.1 证明 **不约束则达不到**。  
3. 假死局是明确红线。  
4. 外部学术生成细节仍欠，**不挡 H1 实现**。  
