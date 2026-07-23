# 拖动操作意图识别 · 检索计划 v0.2

**日期：** 2026-07-23  
**状态：** ✅ **薄检索已关** · 下一阶段 = **仅 POC P0a/b**（见 `19`）  

**范围：** **操作意图识别**（重点 **拖动松手解码 + 起拖**；点/抽为边界）  
**非范围：** 配对动效参数（`14`）、规则/配点/isFree 语义改写、引擎选型、滑词级全路径识别  

**权威链：**  
- 反查：[`16_drag_intent_gap_audit.md`](./16_drag_intent_gap_audit.md) **v1**  
- 手感钉：[`14_physical_impl_pins.md`](./14_physical_impl_pins.md) **v1.5**  
- 抽叠纪要：[`docs/changelog/2026-07-23_drawzone_z_autodraw_dim.md`](../../docs/changelog/2026-07-23_drawzone_z_autodraw_dim.md)  
- 拖消手感：[`docs/changelog/2026-07-23_drag_handfeel.md`](../../docs/changelog/2026-07-23_drag_handfeel.md)  
- 代码：`src/main.ts` · `rules.pickCard` · `PHYS.drag*` · `setMatchHints` · `canMatchCards`  

**NotebookLM：** `poker类手感调优` `b0897377-…`

---

## 修订说明（v0.1 → v0.2 · 反查驱动）

| 变更 | 原因（见 `16`） |
|------|----------------|
| 目标收缩为 **DropDecoder + 起拖** | 滑词/个性化/路径 DP 过满 |
| 现状表补 pick 语义、hints、stale、hardDead | v0.1 低估已有代码 |
| H2 升 P0；H3/H4 降级；H5 改写 | 可复现误 snap vs 假冲突 |
| Q-C1 拆 a/b；E2 关闭；E1′ | 点选 hints 已有 |
| Round A 限薄；B 缩短 | 防学术跑偏；反查已覆盖代码大部 |
| 文档号 16=反查，事件→17… | 避免撞车 |
| §6 正式 DropDecoder 伪代码 | `w_f` 冗余；可配必须大权重 |
| POC 缩 P0 集 | 可一周落地 |
| 允许 **P0 与薄检索并行** | 失败故事已在代码内，不必等源卡 |

---

## 0. 一句话目标

> 借 iOS/软键盘的 **抽象**（噪声观测 + 合法集先验 + 可恢复），不是复刻输入法：  
> 在本项目 **拖消主路径** 上，检索并 POC **松手「可配优先」目标解码** 与 **更稳的 tap/drag 分流**，降低「伙伴在旁边仍弹回」「微抖误拖」。

**产品滤镜（强制）：**

```text
主卖 = 顿悟 —— 意图服务决策，不替玩家猜规则外配对
输入 = 点选 + 拖放；拖消 skipMeet+exit 峰值已钉（不重开）
合法 = isFree + 同色同点；候选不得含非 free
重点 = ① 松手 DropDecoder ② 起拖阈值/特征 ③ miss 误抽边界
引擎 = 现有 pointer + design 坐标
剂量 = 合法易成功；非法 snapBack；不静默吞；不重罚犹豫
诚实 = 高准确 + 可恢复，不宣称「不出错」
```

---

## 1. 为何要检索 · 成功标准

### 1.1 现状缺口（代码钉 · 反查后）

| 现状 | 位置 | 意图问题 | 优先级 |
|------|------|----------|--------|
| 落点 `pickCard` 最近 free，**再** `canMatch` | `main.ts` up | 近处不可配 free 抢赢远处可配 → **误 snapBack** | **P0** |
| `pickCard` **仅 free** | `rules.ts` | 正确；score 勿再假装选非 free | 约束 |
| 拖/点单阈值 `dragThreshold: 8` | `PHYS` | 微抖误拖 / 慢拖黏着 | **P0** |
| sticky `dragging` | `main.ts` | 过阈不可回 tap | 默认保留 |
| 点选 `setMatchHints` | `cards.ts` | **已有**可配提示；`hintScale=1` | 非空白 |
| 拖中无随动 hints | 拖起 `hintIds` 清 | 产品可选，非 P0 | P2 |
| vel EMA + `dragVelStaleMs` → loft | 仅匹配成功后 | 不参与「是否匹配」 | 默认保持 |
| down：`pickCard` 先于 `hitStock` | `main.ts` | waste 顶优先已对；**miss 空隙误抽**仍在 | P1 |
| busy / flip / exit / hardDead | 多处 | 过滤噪声；exit 中可操作 | 对齐 14 |
| thr 用 client/scale，跟手 design | move | 文档写清坐标系 | 文档 |

### 1.2 检索 / 规格交付

| 交付物 | 路径 |
|--------|------|
| 计划反查 | ✅ `16_drag_intent_gap_audit.md` |
| 意图事件表 | `17_intent_event_table.md`（待） |
| 特征与阈值 | `18_intent_features_params.md`（待） |
| 实现钉 | `19_intent_impl_pins.md` 或 `14` 附录（待） |
| 源卡（薄） | `sources/intent_a_*.md` · `intent_c_*.md` |
| POC changelog | 实现后 `docs/changelog/…_intent_drop.md` |

### 1.3 关闭条件

**检索轨可关当：**

- [x] 计划反查完成（`16`）  
- [x] 薄 A：源卡 intent_a_* + 可迁移表  
- [x] 误触故事 ≥8（`intent_b`）  
- [x] DropDecoder + 起拖 写入 `17`–`19`  
- [x] 反模式无规则污染  

**检索轨状态（2026-07-23）：** ✅ **已关** · 禁止再开外搜周。

---

## 2. 项目操作地图（检索对象）

### 2.1 用户操作

| 操作 | 触发（现行） | 成功 | 失败 |
|------|--------------|------|------|
| 点选/点消 | up 且 !dragging | tapCard / meet+exit | 改选/忽略 |
| 拖消 | dragging + 可配目标 | skipMeet exit；loft∝速 | snapBack |
| 拖空/不可配 | dragging + 否 | — | snapBack |
| 点抽 | 无牌 hit + stock 足迹 | draw 动画 | busy 等 |
| 拖废顶 | free waste | 同拖消 | 同拖空 |

### 2.2 拖阶段（与代码对齐）

```text
P0 down（!busy !hardDead !won）
   pickCard(free)? → Armed{activeDrag, dragging=false}
                 （isFlipping/isExiting → return）
   else hitStock? → doDraw（无 Armed）

P1 move，!dragging
   Δs_design < thr → 不 setDragPosition
   Δs ≥ thr → dragging=true，开始跟手+vel

P2 move，dragging
   setDragPosition；vel EMA；无 Drop 判定

P3 up
   !dragging → doTapCard（+ setMatchHints）
   dragging → Drop（牌心 pick ?? 指尖 pick）→ canMatch? match : snapBack
   目标 isFlipping → 当无目标

P4 cancel + dragging → snapBack
```

### 2.3 分层

| 层 | 本轨 |
|----|------|
| 意图 | ✅ tap/drag/drop 目标 |
| 表现 | ❌ 引用 `14` only |
| 规则 | ❌ 只读 isFree/canMatch |

---

## 3. iOS 范式 · 薄映射（证据：会话 + 待源卡）

| 概念 | 用 | 不用 |
|------|----|------|
| 触点噪声 + 似然 | 松手距离 score | 要求点准键心 |
| 词典 = 合法 token | 候选 ⊆ free | 非 free 进候选 |
| 上下文先验 | **canMatch 大权重** | 用「常消历史」改规则 |
| 动态热区 | 可配容差 τ 略松 | 放大锁牌可点 |
| 可恢复 | snapBack / undo | 静默失败 |
| 滑词路径模板 | **不作为默认架构** | 整词 DP/大词表 |
| 预测条 top-k | 可选高亮 | 强制多步确认伤流暢 |

### 3.1 命题（反查后）

| ID | 命题 | 优先级 | 默认 |
|----|------|--------|------|
| **H2** | 松手应在 free 上 **可配优先** 解码 | **P0** | 采纳伪代码 §6 |
| **H1** | 单 thr 不足 | **P0** | 先可调 thr + 记 t；再 OR 峰速 |
| H5′ | miss 牌 + stock 足迹 → 误抽 | P1 | 热区/条件 draw |
| H3 | 路径扫过加权 | P2 | **默认关** |
| H4 | 低速取消匹配 | — | **默认不做** |

---

## 4. 支柱与子问题

### 4.1 支柱（权重）

| 支柱 | 权重 | 说明 |
|------|------|------|
| **D 松手解码** | ★★★ | 主交付 |
| **B 起拖** | ★★★ | 主交付 |
| **E 抽区 miss** | ★★ | 边界 |
| **C 拖中高亮** | ★ | C1a 已有；C1b 可选 |
| **A 范式** | ★ | 薄，防空口 |
| **F 竞品** | ★ | 薄，容差/磁吸边界 |
| **G 真机** | ☆ | 不挡检索关 |

### 4.2 子问题

| ID | 问题 | 证据 | 关闭 |
|----|------|------|------|
| Q-D1 | score 与 τ_match | **代码失败故事** | §6 + POC |
| Q-D2 | 牌心/指尖/融合 | 现行双试 | 可选对照 |
| Q-D3 | layer tie-break | pick 已有 | 沿用 |
| Q-B1 | 特征最小集 | Δs 主；t/v 辅 | ≤4 维进 18 |
| Q-B2 | sticky 回 tap | 产品 | **默认 sticky** |
| Q-B3 | 系统手势 | 真机 | R5 |
| Q-C1a | 点选 hints 剂量 | 已实现 | 是否 scale 产品拍 |
| Q-C1b | 拖中 hints | 未做 | P2 |
| Q-C2 | 路径加权 | 弱 | 默认关 |
| Q-E1′ | miss→误抽 | 故事 | P1 |
| Q-E2 | busy | 14 | **关闭** |
| Q-A1/A2 | iOS/decoder 边界 | 薄源卡 | ≤0.5d |
| Q-A3 | 热区反模式 | 高 | 写入钉 |
| Q-F1 | 拖放容差案例 | 2–3 源 | 禁强磁吸 |
| Q-G1 | 拇指基线 | 真机 | 可选 |

---

## 5. 检索轮次（瘦身）

| Round | 时长 | 产出 | 禁止 |
|-------|------|------|------|
| **A 薄范式** | ≤0.5d | `intent_a_*` ×2 + 可迁移表定稿 | 专利深挖、破解 |
| **B 故事** | ≤0.25d | 误触 8 故事（含可配被近旁抢） | 重复贴代码 |
| **C 薄竞品** | ≤0.5d | `intent_c_game_drag` | 滑词专题、改规则灵感 |
| **D 合成** | 0.5d | `17` `18` `19` | 长文 |
| **E** | — | 规格自检；计划反查已由 `16` 完成 | — |

**并行：** P0 DropDecoder POC 可在 A/B 同时改 `main.ts`（用 §6 假设参数）。

---

## 6. 意图状态机与 DropDecoder（P0 规格假设）

### 6.1 状态机

```text
Idle
  down free → Armed（dragging=false）
  down stock足迹且无 free 命中 → Draw（doDraw）
Armed
  up → Tap（doTapCard）
  Δs≥s0 → Dragging
Dragging
  move → 跟手（表现层）
  up → DropDecoder
  cancel → snapBack
DropDecoder
  Match → tryMatchPair + playMatchClear(skipMeet)
  Miss → snapBack
```

### 6.2 DropDecoder（取代「pick 再 canMatch」）

```text
dropCenter = 被拖牌中心（现行 grab 公式）
// 可选：also evaluate pointer p，取两者较好 score —— POC 再定

candidates = freeCardIds(state) \ { dragId }

score(c) =
    G * geom(dropCenter, c)           // geom∈(0,1]，距牌心或 rect
  + M * I[canMatch(drag, c)]          // M ≥ 2, G ≤ 1（可配必须压过近距不可配）
  + ε * tieBreak(c)                   // waste/layer 同 pickCard 序

best = argmax_c score(c)

if canMatch(drag, best) AND dist(dropCenter, best) ≤ τ_match:
  → Match
else:
  → Miss

τ_match 初值假设：0.55 * CARD_W 或 半对角（写入 18 后可调）
```

**硬约束：**

- 候选 ⊆ free  
- `!canMatch` **永不** Match  
- 不修改 D17/D22  

### 6.3 起拖（默认）

```text
// 默认保持 sticky，不回 Tap
s0 = dragThreshold（现 8 design px，经 client/scale 换算路径保持现行）
可选 POC：if (v_peak > v0 && Δs > s_min) 亦起拖
记录 t0 = down 时间戳（供特征，即使默认不用时长）
```

---

## 7. 反模式

| 禁止 | 原因 |
|------|------|
| 非 free / 不可配因「更近」被消 | 毁规则 |
| 热区放大锁牌可点 | 毁 free 语义 |
| 拖中无跟手强磁吸 | 毁控制 |
| 滑词级路径 DP 做消牌 | 过重、延迟、架构不符 |
| thr 调到拖不动 | 毁主路径 |
| 静默忽略 up | 须 snap 或反馈 |
| 低速强制取消可配命中 | 重罚犹豫 |
| 重开 meet/exit/CARD_Z 战 | 已钉 14 |
| 用玩家历史改 canMatch | 毁顿悟公平 |

---

## 8. POC 清单（收缩）

| # | 优先级 | 实验 | 通过（草案） |
|---|--------|------|----------------|
| **P0a** | 必做 | DropDecoder 可配优先 | 近旁不可配 + 稍远可配 → 仍 Match；故事 3+ |
| **P0b** | 必做 | thr 可调 + t0 记录 | 不回归点选 |
| **P1a** | 建议 | Δs OR 峰速起拖 | 误拖/误点自测改善 |
| **P1b** | 建议 | miss 误抽缓解 | 瞄 waste 不中时少进 stock |
| **P2a** | 可选 | 路径加权 | 不增误消才留 |
| **P2b** | 可选 | 拖中 hints | 剂量≤点选 |
| **P2c** | dev | score 调试绘 | — |
| **R** | 回归 | busy/autoDrew/flip 目标 | 无双提交 |
| **R5** | 真机 | 拇指/手势 | 列表化问题 |

---

## 9. Query 池（限薄）

```text
soft keyboard touch model decoder language model overview
mobile game drag drop snap tolerance legal target
touch drag threshold vs tap mobile UX
# 禁止主检索：SHARK 全实现复现、iOS 键盘破解
```

**停止：** A/C 各够 2–3 源或标假设；禁止外搜周。

---

## 10. 文档关系

| 文档 | 关系 |
|------|------|
| `16` 反查 | **本版修订依据** |
| `14` | 动效/busy；意图钉可附录或 `19` |
| `09` 意图高亮 | C1a 已落地线索；不重复检索剂量理论 |
| art-ux「仅点选」 | **过时**；以代码+本计划为准 |

---

## 11. 里程碑

| 阶段 | 产出 | 状态 |
|------|------|------|
| M0 | 计划 v0.1 | ✅ |
| M0.5 | 反查 `16` + 计划 v0.2 | ✅ |
| M1 | 薄 A+B+C + `17`–`19` | ✅ |
| M2 | **P0a/b POC** | 待 |
| M3 | POC changelog + 校准 `18` | 待 |

---

## 12. 验收勾选

- [x] 反查补漏并修订计划  
- [x] P0 公式与代码失败故事对齐  
- [x] 砍滑词默认架构 / H4 默认关  
- [x] 编号与 hints/pick 现实对齐  
- [x] 薄源卡 A/B/C  
- [x] `17`–`19`  
- [x] 检索轨关闭声明  
- [ ] P0 POC  


---

## 版本

| 版本 | 日期 | 变更 |
|------|------|------|
| v0.1 | 2026-07-23 | 初版 |
| v0.2 | 2026-07-23 | 反查 `16`：收缩范围、DropDecoder、命题/轮次/POC 重排 |
| **v0.3** | **2026-07-23** | **执行 A–D：源卡+17/18/19；检索轨关闭** |
