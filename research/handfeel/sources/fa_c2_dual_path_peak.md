# FA-C2 · 点选/拖放成功峰值一致性（Round 3）

**日期：** 2026-07-22  
**轮次：** 第三轮检索 · FA2 / FA10  
**可信度：** 中–高（NN/g + DnD 状态机 + 多输入 UX）  
**填入：** E03a≡E03b · FA10 起姿

## 源

| # | 源 | 要点 |
|---|-----|------|
| 1 | [NN/g Drag-and-Drop](https://www.nngroup.com/articles/drag-drop/) | 触屏缺 hover；需分清 tap / 拖；**抓取后全阶段要有清晰反馈**；松手后邻项重排动画约 **100ms** 量级给物理感 |
| 2 | [Smart Interface · DnD states](https://smart-interface-design-patterns.com/articles/drag-and-drop-ux/) | 状态：resting / lifted / in transit / dropped / **erroneous** / **successful** — **成功与错误必须可辨** |
| 3 | [Multi-input game UX](https://medium.com/@assencio84/touch-vs-controller-designing-ux-for-multiple-inputs-in-one-game-build-6beebbbd25d4) | **parity ≠ 过程 UI 完全相同**；要的是「输入被认出」的 **一致反馈语言** |
| 4 | 既有 fa_a6 | 结果等价、过程可分叉 |

## 观察（可迁移）

### 1. 「同峰值」指什么

| 层 | 要求 | 本产品 |
|----|------|--------|
| **结果语义** | 成功 = 同一类确认 | 同 flyAway / 同 L3 ✅ 规格 |
| **时长/锁** | 成功路径 busy 窗口同级 | 同 matchMs |
| **过程** | 允许不同 | 点：y-4；拖：scale+跟手 |
| **起姿（FA10）** | 可不同，但 **结束可读性** 要同 | 拖中起飞 vs 座位起飞 **可接受**，若「消没了」的可读性一致 |

### 2. 行业并不要求过程像素同轨

多输入共识：**不要为了「看起来一样」牺牲触控清晰**；要的是玩家事后说「两种都能消、手感同一档」。

### 3. 成功态 vs 错误态必须分叉剂量

| 态 | 剂量 | 本产品 |
|----|------|--------|
| successful drop/match | L3 兑现 | flyAway |
| erroneous drop | L2 纠正、不重罚 | snapBack |
| 若成功与错误同轨迹同长度 | 易糊 | 故 **snap &lt; match** 纪律加强 |

### 4. 触屏抓取反馈（过程）

NN：手指易挡牌 → 抬升/偏移/阴影；与本产品 drag scale+影一致。  
**成功瞬间**应比「还在拖」多一档（离开手指 → 飞走），不能只靠松手无动画。

## 对本产品（FA10 检索结论）

```text
允许：E03b 从拖中坐标起飞，E03a 从座位起飞
必须：同 duration、同 ease 家族、同 α/scale 收束、同 busy
验收：旁观录像「消的感觉一样」— 真机 C8，非再搜
禁止：拖消加粒子/震屏而点消没有
```

**外搜可停于 FA10 原则层；起姿是否「略怪」只靠录屏。**
