# R1 · 模式卡与源列表

检索日期：2026-07-22。每条含可迁移旋钮。

---

### 模式卡 · Free 守恒 / 保持开放匹配数
- **源：** Arkadium Mahjong 策略；社群「tall stacks first」共识  
- **机制：** 随机消 open 对易后期死；策略是 **维持尽可能多的 open matches**  
- **峰值：** 「先清高塔/角，别贪眼前」→ 顿悟  
- **与路径锁：** 直接类比 — 锁 free 前应少浪费同 key  
- **旋钮：** 不要在锁露出前把同 key 消光；生成可保证「关键路径上的 key 不被结构逼着先废」  
- **验收：** 弱 AI 随机消 vs 保 open 策略通关率差  
- **风险：** 过强提示会削弱发现感  
- **优先级：** P0  

### 模式卡 · 可解生成 / 拒绝不可清盘
- **源：** Wikipedia Mahjong solitaire；多款宣称 always solvable  
- **机制：** 多数实现 **不生成无解盘**；允许 undo；少数可 shuffle 救局  
- **数据：** Turtle 布局约 **3%** 即使透视仍无解（随机落子）  
- **与路径锁：** 我们已有贪心过滤 + fallback；路径锁实验应 **优先可清**  
- **旋钮：** hard 禁止 fallback；extreme 可保留少量「刁但可清」  
- **验收：** `canFullyClear` 通过率 100% 发局  
- **优先级：** P0  

### 模式卡 · 复杂度警告（勿追求最优求解）
- **源：** Eppstein / 计算复杂性综述（Mahjong NP/PSPACE）  
- **机制：** 完美信息下「能否清完」已 NP-complete  
- **与路径锁：** 验收用 **贪心 / 有限深度**，不做最优 solver  
- **旋钮：** 指标用 proxy（密度、深度），不靠完备证明  
- **优先级：** P1（工程约束）  

### 模式卡 · 难度 = 布局层数 + 排布，而非只加牌
- **源：** Microsoft Mahjong / 各版 difficulty levels 描述  
- **机制：** Easy→Hard 常改 **层叠与布局名**，不是只加计时  
- **与路径锁：** 我们几何固定 → 难度应改 **锁路径与密度**，不是改格子  
- **旋钮：** lockCount、key depth、chain、key scarcity  
- **优先级：** P0  

### 模式卡 · Soft lock / Bottleneck（非硬锁）
- **源：** 关卡设计通用语 soft lock；puzzle bottleneck  
- **机制：** Soft lock = 未死但无法推进；Bottleneck = 必经决策点  
- **与路径锁：** 我们要的是 **Bottleneck 体验**，避免 **无解 soft lock**  
- **旋钮：** 锁露出步数落在关卡中段；保证 ≥1 合法开锁路径  
- **验收：** `lock_exposure_step` 在 [20%, 70%] 进度带  
- **优先级：** P0  

### 模式卡 · Critical path 先于装饰内容
- **源：** GameDeveloper 过程生成文（critical path 再铺内容）  
- **机制：** 先定必经路径与节奏，再填非关键内容  
- **与路径锁：** 先定「开锁路径」（压住锁的上层序列 + 钥匙位置），再填其余 rank  
- **旋钮：** 路线 B 关键路径优先  
- **优先级：** P1（中期）  

### 模式卡 · Cyclic / 多环路径（可选）
- **源：** Unexplored Cyclic Dungeon Generation（Dormans）  
- **机制：** 不止一条直线 critical path，有环与回流  
- **与路径锁：** multi-lock independent ≈ 多瓶颈；chain ≈ 串联 critical path  
- **旋钮：** independent 给旁路感；chain 给顺序顿悟  
- **风险：** 全 chain 易怒；全 independent 锁感弱  
- **优先级：** P1  

### 模式卡 · 副属性（颜色）= 维度而非噪音
- **源：** 配对游戏 shape+color 教学设计；匹配难度讨论  
- **机制：** 第二属性应 **可扫描、可预期**；若只增加误点则是噪音  
- **与路径锁：** D22 ♥/♠ 应让「开锁」更需确认，而非随机翻倍死局  
- **旋钮：** 锁与钥匙强制同色（已有）；异色同点 free 可作 **诱饵**（有意放 1 对）  
- **验收：** 诱饵存在时撤销率上升但通关率不崩  
- **优先级：** P1  

### 模式卡 · 资源型抽牌，不是唯一解 RNG
- **源：** 纸牌类 draw pile 设计常识；本项目 D10b stock=工具  
- **机制：** 库应补路径，不应成为唯一钥匙堆  
- **与路径锁：** extreme 已去 L1 伙伴对；钥匙应 **优先在桌面路径**  
- **旋钮：** 钥匙桌面率 ≥70%；stock 同 key ≤1  
- **优先级：** P0  

### 模式卡 · Spike 难度（每 N 关一尖刺）
- **源：** 手游关卡 pacing（spike level）；本项目 D23 每 3 局 extreme  
- **机制：** 常规略难 + 周期性尖刺，避免线性疲劳  
- **与路径锁：** extreme 应用 **更深钥匙 + 满锁 chain**，不是只锁×3  
- **旋钮：** extreme：key_scarcity 更紧、key 更深  
- **优先级：** P0  

### 模式卡 · Undo 作为设计部件
- **源：** Wikipedia：多数实现提供 undo；可解生成配合  
- **机制：** Undo 降低怒点，允许探索路径锁  
- **与路径锁：** 已有撤销；文案可强调「可试探」  
- **优先级：** P2  

---

## 源列表（精简）

| # | 源 | 用途 |
|---|-----|------|
| 1 | [Wikipedia: Mahjong solitaire](https://en.wikipedia.org/wiki/Mahjong_solitaire) | free 定义、复杂度、可解比例、实现惯例 |
| 2 | Arkadium / 通用 Mahjong 策略（keep open matches） | Free 守恒 |
| 3 | Microsoft Mahjong 等难度分层描述 | 布局层数控难度 |
| 4 | GameDeveloper: critical path in procgen | 关键路径先于填充 |
| 5 | Unexplored cyclic dungeon generation | 多环/回流 vs 单线 chain |
| 6 | 本项目 `15` / 实测 key 密度 4–12 | 内部基线 |
| 7 | 本项目 D22/D23 | 红黑 + 每 3 局极难 |

---

## R1 小结

行业共识对齐：

1. **可解优先**，随机落子会有不可清盘  
2. **难度来自遮挡拓扑与开放度**，不是堆内容  
3. **Bottleneck ≠ Soft lock 无解**  
4. **Critical path 先设计**  
5. **第二属性要可控**  
6. **尖刺关** 用结构差异，不只用数字加大  
