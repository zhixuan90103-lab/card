# R4 · 生成路线选型

## 三路线对比

| 路线 | 做法 | 优点 | 风险 | 工期 |
|------|------|------|------|------|
| **A 约束后处理** | 现 `dealOnce` + paint 后 **拒绝/重 roll** 不满足 M2/M3；必要时对锁 key **重上色/挪 rank** | 改动小、快验证锁感 | 重 roll 增耗；极端 seed 失败率升 | **短** |
| **B 关键路径优先** | 先选锁位 → 写开锁所需上层清空序 → 放 1～2 把钥匙 → 再填其余 | 锁感与 tempo 可控 | 实现重；与 L2 链要协调 | 中 |
| **C 全逆向** | 从空桌反向落对至满几何 | 可解性强 | 与固定 108 槽+层叠约束难；工期长 | 长 |

## 决定

| 项 | 选择 |
|----|------|
| **主路线** | **A** |
| **备路线** | 若 A 在密度 2–4 下通关率崩或重 roll 爆炸 → 上 **B** 只对锁局部 |
| **不做** | 短期不上 C |

## 推荐实现顺序（R5）

### 实验 H1（钥匙密度）— 先做

```text
deal 完成后：
  for each lockId:
    k = matchKey(lock)
    if count(k) < 2 or count(k) > 4: reject / recolor / reroll
  hard: 必须 canFullyClear，禁止 fallback
```

可选增强：

- 保证 ≥1 张同 k 在 L2 链或非锁 L1 可挖路径  
- stock 中该 k ≤1  

### 实验 H2（extreme 差异化）— 次做

```text
extreme:
  lockCount=3, chain 高
  key_scarcity 贴 2
  key 更深（不与锁同层过早双 free）
  accessPairCap=0
```

### 文案（可并行）

- 对玩家：瓶颈 / 通路；弱化「钥匙」唯一感  
- 对内：仍称路径锁  

## 回滚条件

- H1 后内测通关率过低且撤销爆表 → 放宽到 **2–6** 或仅 extreme 用 2–4  
- 重 roll >50ms 可感卡顿 → 改为局部 recolor 而非全 deal 重来  
