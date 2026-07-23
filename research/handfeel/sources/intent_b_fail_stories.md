# 源卡 intent_b · 误触 / 失败故事 8 则（代码可复现）

**轮次：** B  
**日期：** 2026-07-23  
**等级：** 高（对照 `main.ts` / `pickCard` / `14`）  
**计划：** `15` v0.2  

---

## 约定

- 坐标：design 393 空间；`CARD_W×CARD_H` 牌。  
- 现行：`dragThreshold=8`；落点 `pickCard(牌心)??pickCard(指尖)` 再 `canMatch`。  
- **期望** 列为 DropDecoder / 意图 P0 目标，非已实现。

---

## 故事表

| # | 故事 | 现行结果 | 根因 | 期望（P0/P1） |
|---|------|----------|------|----------------|
| **S1** | 拖 A，松手牌心更近 **不可配 free B**，稍远 **可配 free C** | snapBack | pick 只认最近 free | **Match C**（可配优先） |
| **S2** | 拖 A，牌心落在 C 容差内且 canMatch | Match | 正常路径 | 保持 |
| **S3** | 拖 A，松在空白，最近 free 不可配且 dist&gt;τ | snapBack | 无目标/不可配 | snapBack（可加轻反馈） |
| **S4** | 点选意图，手指微抖 Δs≥8 | 进入拖，松空 snapBack | 单 thr sticky | P0b/P1a：少误拖或 thr 可调 |
| **S5** | 慢拖启动，前几帧 &lt;8 无跟手，过 thr 突然放大 | 可接受/略跳 | !dragging 不 setDrag | 可接受；勿强行回 tap |
| **S6** | 指尖想点 waste 顶，落在 **两叠空隙**，命中 stock 足迹 | **误抽** | pick null→hitStock | P1b：收紧/条件 draw |
| **S7** | down 在 waste 顶（free）再拖走 | 拖会话，不 draw | pick 优先 free | 保持 |
| **S8** | 拖向可配目标，目标正在 flip | 当无目标→snapBack | isFlipping 清空 target | 保持（防脏匹配） |

### 补充边角（非 8 主故事，回归用）

| # | 故事 | 现行 | 备注 |
|---|------|------|------|
| S9 | hardDead 时 down | 全拒 | 保持 |
| S10 | busy（抽/洗/meet）时 down | 全拒；exit 不 busy | 对齐 14 |
| S11 | 已选 A，拖 B 到 C | tryMatchPair(B,C)，与 selected 无关 | 正确 |
| S12 | 松手 vel 大，匹配成功 | loft 高 | 表现层；不改是否匹配 |

---

## 与命题对应

| 故事 | 命题 |
|------|------|
| S1 | **H2 P0** |
| S4–S5 | **H1** |
| S6 | **H5′** |
| S8 | 与 flip 锁交叉 |
| S2/S7 | 回归不破坏 |

---

## POC 验收映射

| POC | 故事 |
|-----|------|
| P0a DropDecoder | **S1** 必过；S2/S3 不回归 |
| P0b thr | S4 可测 |
| P1b 误抽 | S6 |
| R 回归 | S7–S12 |
