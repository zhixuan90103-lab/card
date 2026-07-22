# R3 · 验收指标草案

全部应对 deal 结果或轻量模拟可算。不做完备 NP 求解。

## 1. 发局门槛（建议）

| ID | 指标 | 定义 | hard | extreme |
|----|------|------|------|---------|
| M1 | `clear_greedy` | 现有 `canFullyClear` | **必须 true** | 优先 true；失败可重 roll 更多次 |
| M2 | `key_scarcity[lock]` | 每个锁 rank+color 全场张数 | ∈ **[2,4]** | ∈ **[2,4]**，优先 2 |
| M3 | `key_on_board` | 该 key 在 puzzle 的比例 | ≥ **0.7** | ≥ **0.85** |
| M4 | `open_pair` | 开局 free 恰 1 对同 key | 必须 | 必须 |
| M5 | `no_parallel_peel` | 同顶不同次顶 | 必须 | 必须 |

## 2. 品质 / 顿悟代理（用于调参，非必须卡发局）

| ID | 指标 | 定义 | 健康带 |
|----|------|------|--------|
| M6 | `lock_exposure_proxy` | 粗算：压住锁的上层组数量 / 或 BFS 最少消对数 | 不要 0；不要全盘最深到几乎结束才露 |
| M7 | `redundant_key_at_expose` | 锁刚 free 时，场上已有同 key free 数（模拟） | 理想 **0–1**；≥3 锁感差 |
| M8 | `dead_rate_random` | 随机合法着法 N 次死亡率 | hard 中等；extreme 更高但仍 <1 |
| M9 | `undo_pressure` | 内测：撤销次数 / 通关 | 有撤销说明在试路径，过高=怒 |
| M10 | `color_bait_count` | free 上同 rank 异色对数 | 0–1 |

## 3. hard vs extreme 可感知差（选 3 个主指标）

| 玩家应感到 | 对应指标 |
|------------|----------|
| 「钥匙更难等到」 | M2 更贴 2；M3 桌面但更深 |
| 「要按顺序开锁」 | chain + M6 |
| 「库帮不上忙」 | access cap 0 + M3 高桌面率 |

**不要** 只让玩家感到「锁从 2 变成 3」而无路径差。

## 4. 实现优先级

1. **P0：** M1、M2、M4、M5（发局）  
2. **P1：** M3、M7（锁感）  
3. **P2：** M6、M8（调参仪表盘）  

## 5. 与现测数据对齐

- 现状 M2 实测约 **4–12**（均 8.3）→ 明确超标，H1 要压到 2–4  
- M1 现状约六成贪心过、其余 fallback → hard 应消灭 fallback  
