# 拖动意图检索计划 · 反查补漏 v1

**日期：** 2026-07-23  
**对照：** 计划 `15` v0.1 · 代码 `main.ts` / `rules.pickCard` / `PHYS` / `setMatchHints` · 钉 `14` v1.5 · 物理检索 `09`/`13`  
**目的：** 计划是否过满、证据是否空心、与代码/已钉矛盾、如何改成可执行检索。  
**跟进：** 计划已升 **`15` v0.2**（本报告驱动）。

---

## 0. 一句话总判

> **方向对：拖为主、松手解码优先、iOS 只借抽象不借闭源。**  
> v0.1 **过宽**（Shape writing / 全路径识别 / 个性化词典）且 **低估已有代码**（`pickCard` 仅 free、点选 hints、stock 后于牌、vel stale）。  
> **P0 应收缩为：起拖多特征 + 松手「可配优先」评分**；路径滑词级解码降为 **可选/低优先**。  
> 检索 **可开但须薄 A、重 B/D**；**不可**写成「复刻 iOS 输入法」。

---

## 1. 计划产出 vs 现实

| # | v0.1 声称 | 现实 | 判定 |
|---|-----------|------|------|
| 现状缺口表 | 7 行代码钉 | 大体对；漏 hints / pick 语义 / staleMs | 🟡 半 |
| 操作地图 P0–P4 | 对齐 main | 基本对齐；漏 hardDead、haptic、capture | 🟡 半 |
| iOS 映射 | 可迁移表 | **会话调研级**，无源卡 | 🔴 证据空 |
| H1–H5 | 可证伪命题 | H5 **大半已被代码关闭**；H3/H4 过猛 | 🟡 需降级 |
| 轮次 A–E | 2–3.5 天 | A 易学术跑偏；B 可被本反查部分预做 | 🟡 重排 |
| 交付 16–19 | 事件/参数/钉/反查 | 编号与「计划反查」冲突 | 🔴 编号 |
| POC P1–P8 | 可一周 | P3 路径、P6 overlay 非最小 | 🟡 砍到 P0 集 |

---

## 2. 与代码对照 · 关键补漏

### 2.1 🔴 松手解码的真实 bug 形（计划说对了，但公式写浅了）

现行：

```text
target = pickCard(牌心) ?? pickCard(指尖)
if target && canMatch → match else snapBack
```

`pickCard` **只收集 isFree**，按 layer/waste 排序，**与 canMatch 无关**。

| 场景 | 结果 |
|------|------|
| 牌心更近 **不可配 free**，稍远 **可配 free** | 命中不可配 → **snapBack**（伙伴在旁边仍失败） |
| 仅可配 free 在容差外 | null → snapBack |
| 可配且最近 | 成功 |

**补钉：** DropDecoder 的候选集 = **全体 free（exclude 自己）**，score 必须含 **大权重 canMatch**（或两段：先在 canMatch 子集取最近，若距离 &lt; τ 则中；否则再论）。  
v0.1 的 `w_f * isFree` **冗余**（候选已是 free）。

### 2.2 🟡「意图高亮」已有一半

| 项 | 代码 |
|----|------|
| 点选后 | `setMatchHints(selectedId)`：可配 free，最近 ≤`hintMaxCards` |
| `hintScale` | **1**（不放大，仅 hintIds 集） |
| 拖中 | **无** 随拖更新的可配高亮（拖起清 hint） |

**补钉：** Q-C1 拆成  
- C1a：点选 hints（**已实现**，只定剂量/是否 scale）  
- C1b：拖中 hints（**未做**，POC 可选，非 P0）

`09` 产品钉「拖起意图高亮」≠ 未检索；避免当空白重搜。

### 2.3 🟡 H5 抽区冲突 · 高估问题

```text
down: pickCard(free) 先 → 有 id 则武装拖；否则 hitStock → draw
```

| 已解决 | 仍在的故事 |
|--------|------------|
| waste 顶 free 优先于 stock | 指尖落在 **空隙**（未中 waste AABB）却中 stock 足迹 → **误抽** |
| stock 背面不可拖 | 拖出 waste 后松在 stock 上：已是 drag 会话，**不会** draw |

**补钉：** H5 改为 **「miss 牌 + hitStock 误抽」**；不是 waste/stock 抢 down。POC：扩大 waste 热区或 stock 仅在「无 active 可能」时。

### 2.4 🟡 速度链路已比计划完整

| 已有 | 用途 |
|------|------|
| vel EMA | 0.4 |
| `dragVelStaleMs` | 停指衰减再算 loft |
| `throwForceFromDragSpeed` | 仅 **匹配成功** 后 |
| approachDir | speed&gt;8 |

H4「甩速参与是否提交匹配」与产品「非法不重罚」张力大 → **默认否**；仅作可选假设，POC 不进 P0。

### 2.5 漏列操作 / 边界

| 漏项 | 影响 |
|------|------|
| `isHardDead` 时 pointer 全拒 | 意图层要尊重 |
| `isBusy` 拒 down（exit/flip 不 busy） | 与 14 一致；drop 时目标 isFlipping 清空 |
| 多指 / 第二 pointer | 未处理；反模式：忽略或拒 |
| threshold：client 位移 / scale≈393 | 与 design 混用，文档应写清 |
| 未过阈 move **不** `setDragPosition` | 点按预备无跟手（正确）；微抖过阈会突然放大 |
| stock free？ | `isFree(stock)=false` 恒成立 → 只能抽不能拖库 |
| 已选 A 时拖 B | tryMatchPair(B,target) **不依赖** selectedId |
| autoDrew / draw busy | 动画中 isBusy → 无法新拖（P8） |

### 2.6 iOS 映射 · 证据与边界

| 风险 | 补漏 |
|------|------|
| 无源卡却写「范式」 | Round A **薄**：2 源卡 + 可迁移表即可关 |
| 滑词路径 ≈ 拖消 | **弱类比**：滑词=整词模板；拖消=**单终点目标**。路径加权非必须 |
| 「不出错」 | 改为 **高 top-1 + snapBack 可恢复** |
| 动态热区放大非法键 | 游戏侧 **禁止** 放大非 free / 不可配为可点 |

---

## 3. 命题重估（H）

| ID | v0.1 | **重估** | 处置 |
|----|------|----------|------|
| H1 单 thr 不足 | 中 | **中–高**（合理） | **P0** 多特征 |
| H2 规则×几何松手 | 高 | **高**（代码可复现失败故事） | **P0** DropDecoder |
| H3 路径扫过加权 | 假设 | **低–中**；易过拟合 | **P2 可选**；默认真终点 |
| H4 速决定提交/取消 | 慎 | **低**；与不重罚冲突 | **默认不做** |
| H5 抽/拖意图类 | 中 | **低**（down 序已对）；改 miss 误抽 | **缩 scope** |

---

## 4. 子问题矩阵重估（Q）

| ID | v0.1 | **重估** | 改法 |
|----|------|----------|------|
| Q-A1/A2 | 中/高 | A1 **薄中**；A2 公式模板 **够用即停** | 限时 0.5d，禁论文深挖 |
| Q-A3 | 中 | **高**（反模式已够） | 写进钉即可 |
| Q-B1 | 中 | **高优先** | 与 H1 合并 POC |
| Q-B2 sticky 回 tap | 假设 | 产品拍板 | 默认 **保持 sticky**（少状态） |
| Q-B3 系统手势 | 中 | 真机 | 不挡检索关闭 |
| Q-C1 高亮 | 混 | **拆 C1a 已有 / C1b 可选** | |
| Q-C2 路径 | 假设 | **降优先** | |
| Q-D1 score | 高 | **最高** | 伪代码进 v0.2 §6 |
| Q-D2 牌心/指尖 | 中 | **中**；现行双试 | POC 对比可选 |
| Q-D3 z/layer | 中 | pick 已 layer | score 沿用 pick 序作 tie-break |
| Q-E1 | 中 | **改 E1′ miss→stock** | |
| Q-E2 busy | 低 | **关闭**（引用 14） | 不检索 |
| Q-F1 竞品 | 中 | **薄** 2–3 源 | 防磁吸毁跟手 |
| Q-G1 真机 | 假设 | POC 后 | |

---

## 5. 轮次与文档编号修订

### 5.1 轮次

| 轮 | v0.1 | **v0.2** |
|----|------|----------|
| A 范式 | 0.5–1d 深 | **≤0.5d 薄**；可迁移表 + 2 源卡 |
| B 代码 | 0.5d | **0.25d**：本反查 §2 已覆盖大部；只补误触故事 8 条 |
| C 竞品 | 0.5–1d | **≤0.5d**；合法优先/容差，**禁**滑词专题 |
| D 合成 | 0.5d | **0.5d** 事件+参数+钉 |
| E 反查 | 固定 | 本文件 = **计划反查**；规格反查另开短页 |

### 5.2 文档编号（避免撞车）

| 原 v0.1 | **v0.2** |
|---------|----------|
| （无计划反查号） | **`16_drag_intent_gap_audit.md`** ← 本文 |
| 16 事件表 | → **`17_intent_event_table.md`** |
| 17 特征参数 | → **`18_intent_features_params.md`** |
| 18 实现钉 | → **`19_intent_impl_pins.md`**（或升格进 14 附录） |
| 19 反查 | → 规格反查并入 19 末节或 `20` 仅当需要 |

---

## 6. 状态机 / 公式补钉（写入计划 v0.2）

### 6.1 DropDecoder（P0 默认假设）

```text
candidates = freeCardIds \ {dragId}
// 几何：牌心距离或到 rect 的距离（design px）
geom(c) = 1 / (1 + dist(dropCenter, cardCenter) / CARD_W)   // 或 clamp

score(c) =
    G * geom(c)
  + M * (canMatch(drag, c) ? 1 : 0)     // M >> G，建议 M≥2, G≤1
  + ε * layerTieBreak(c)                 // 同 score 时高 layer / waste 优先

// 提交：
best = argmax score
if canMatch(drag, best) AND dist(best) ≤ τ_match:   // τ 如 0.55*CARD_W 或半对角
  → DropMatch
else
  → DropMiss (snapBack)

// 禁止：
// - 对 !canMatch 因 geom 高而「更正」成消除
// - 对 !isFree 建候选
```

### 6.2 起拖（P0）

```text
// 保持 sticky；默认不回 tap
dragStart if:
  Δs_design ≥ s0          // 现行 8，可调
  OR (v_inst ≥ v0 AND Δs ≥ s_min)   // 可选第二通道，POC 验证后才进默认
// 记录 t_down 便于后续特征，即使 v0.2 默认仍主用 Δs
```

### 6.3 明确不做（加强反模式）

- 每帧全词表/全路径 DP（滑词级）  
- 用历史「常消哪对」改 canMatch  
- 拖中无跟手的强磁吸跳变  
- 低速强制取消匹配（H4 默认关）  
- 重开 meet/exit/CARD_Z 参数战  

---

## 7. POC 收缩

| 优先级 | 项 | 原 | 处置 |
|--------|----|-----|------|
| **P0** | 可配优先 DropDecoder | P2 | **必做** |
| **P0** | thr 可调 + 记录时长（多特征预备） | P1 简化 | **必做** |
| **P1** | 双特征起拖 OR 峰速 | P1 全 | 可选 |
| **P1** | waste miss 不误抽（足迹/优先级） | P5 重写 | 可选 |
| **P2** | 路径加权 | P3 | 默关 |
| **P2** | 拖中 hints | C1b | 默关 |
| **P2** | score 热力 overlay | P6 | dev only |
| **R5** | 真机 | P7 | 检索不挡 |
| **P1** | busy 并发 | P8 | 回归即可 |

---

## 8. 对计划 `15` 的修改清单（已落实 v0.2）

1. 状态改为 **反查后可开薄检索 / P0 可并行 POC**  
2. §1.1 补 pickCard 语义、hints、staleMs、hardDead  
3. §3 标「会话级证据」；滑词映射降权  
4. H 重估；H5 改写；H3/H4 降级  
5. Q 拆 C1；关 E2；E1′  
6. 轮次时序与文档编号  
7. §6 换 DropDecoder 正式伪代码  
8. 反模式 + POC 收缩  
9. 验收：计划反查 ✅  

---

## 9. 总判勾选

- [x] 与 `main.ts` / `pickCard` / hints 交叉  
- [x] 与 `14` busy/skipMeet 无冲突要求  
- [x] P0 问题可复述为可测故事  
- [x] 砍掉过满学术与危险命题默认  
- [x] 驱动 `15` → v0.2  

**阶段诚实：** 计划 **可执行**；意图规格 **未定稿**；**P0 POC 可不完备检索先做**（DropDecoder 证据已在代码失败故事中）。
