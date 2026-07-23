# 拖动操作意图识别 · 检索计划 v0.1

**日期：** 2026-07-23  
**状态：** 📋 **检索待开** · 锚点 = 本项目现行拖/点管线 + iOS 软键盘/滑行输入范式  
**范围：** **操作意图识别**（重点 **拖动**；含点/拖分流、松手目标解码、抽区误触）  
**非范围：** 配对动效参数（已见 `14`）、规则/配点/isFree、引擎选型  

**权威链：**  
- 现行手感钉：[`14_physical_impl_pins.md`](./14_physical_impl_pins.md) **v1.5**  
- 抽叠/层级纪要：[`docs/changelog/2026-07-23_drawzone_z_autodraw_dim.md`](../../docs/changelog/2026-07-23_drawzone_z_autodraw_dim.md)  
- 拖消手感：[`docs/changelog/2026-07-23_drag_handfeel.md`](../../docs/changelog/2026-07-23_drag_handfeel.md)  
- 代码：`src/main.ts` 指针管线 · `PHYS.drag*` · `pickCard` · `isFree`/`canMatchCards`  

**NotebookLM：** `poker类手感调优` `b0897377-…`（可入库本计划与源卡）

---

## 0. 一句话目标

> 把 iOS 输入法「**噪声触点/轨迹 → 词典与上下文解码 → 可恢复纠错**」的范式，映射到本项目的 **点选 / 拖配 / 抽牌** 管线，检索出 **可填表的意图特征、评分公式、反模式与 POC 验收**，让拖动成为**主舒适路径**且少误触、少误消。

**产品滤镜（强制）：**

```text
主卖 = 顿悟（消序 / 抽不抽 / 掀哪条线）—— 意图识别服务决策，不抢戏
输入 = 点选 + 拖放；拖消峰值与点消同级（已钉 skipMeet + exit）
合法 = isFree + 同色同点（D17/D22 不改）
重点 = 拖动：起拖判定、跟手、松手目标、甩速→抛力（已有雏形）
引擎 = Pixi 指针 + design 坐标；禁止为意图再开输入引擎选型
剂量 = 合法拖轻松成功；非法 snapBack 纠正不重罚；不静默吞操作
```

---

## 1. 为何要检索 · 成功标准

### 1.1 现状缺口（代码钉 · 非臆测）

| 现状 | 文件/常量 | 意图问题 |
|------|-----------|----------|
| 拖/点硬阈值 | `PHYS.dragThreshold: 8` design px | 单阈值：快点微抖易误拖、慢拖易仍算 tap |
| 起拖后不可回 tap | `activeDrag.dragging`  sticky | 一旦超阈，整次只能拖语义 |
| 落点 hit | 牌心优先 + 指针 fallback · AABB `pickCard` | 纯几何；**无** canMatch 先验加权 |
| 匹配判定 | 命中目标后 `canMatchCards` 二元 | 不匹配 → snapBack；无 top-k / 近邻提示 |
| 抽区 | `hitStock` 足迹加宽 | 与拖废牌顶、点抽的分流靠命中顺序，缺意图分 |
| 速度 | EMA vel → `throwForceK` / approachDir | **仅成功匹配后**影响出场；不参与「是否匹配意图」 |
| 锁 | busy / flipping / exiting | 已过滤部分噪声；未形成统一「观测可信度」 |

### 1.2 检索要交付什么

| 交付物 | 用途 | 目标路径 |
|--------|------|----------|
| **意图事件表** | down/move/up 各阶段输出什么意图 | `research/handfeel/16_intent_event_table.md`（拟定） |
| **特征与阈值表** | 可调 PHYS / 调试 HUD | `17_intent_features_params.md`（拟定） |
| **目标评分钉** | 松手解码公式 + 合法先验 | 写入实现钉 `18` 或升格进 `14` |
| **源卡** | iOS/软键盘/拖放游戏可溯源 | `sources/intent_*` |
| **反查** | 防过拟合键盘、防改规则 | `19_intent_gap_audit.md`（拟定） |
| **POC 清单** | 可一周内改 `main.ts` 的最小实验 | 本文 §8 |

### 1.3 成功标准（检索关闭条件）

- [ ] 每个子问题 Q 有 **证据等级**（高/中/假设）与 **关闭方式**  
- [ ] 拖动路径有 **端到端状态机**（与现 pointer 管线可对齐）  
- [ ] 松手目标解码有 **可实现公式**（几何 + 规则先验），非散文  
- [ ] 明确 **不做什么**（反模式）  
- [ ] 真机/桌面 POC 项 ≤ 8 条，可勾选  

---

## 2. 项目操作方式 · 现行地图（检索对象）

### 2.1 用户可见操作

| 操作 | 触发（现行） | 成功结果 | 失败/取消 |
|------|--------------|----------|-----------|
| **点选** | down→up，位移 &lt; threshold | 选中 / 再点配对 / 取消 | 非法 free 忽略 |
| **点消** | 已选 A1，点 free 可配 A2 | meet→exit（或并行 flip） | 改选 / 无匹配 |
| **拖消** | 位移 ≥ threshold，松在可配目标上 | **skipMeet** → exit；loft∝速 | snapBack |
| **拖空** | 松在空白/不可配 | snapBack | — |
| **点抽** | 未点中牌，命中 stock 足迹 | draw / recycle→draw 动画 | busy/won 忽略 |
| **拖废牌顶** | free waste 顶可拖 | 同拖消 | 同拖空 |

### 2.2 拖动阶段拆解（重点）

```text
P0  pointerdown
    → pickCard? → 建立 activeDrag{home, grab, vel=0, dragging=false}
    → else hitStock? → doDraw（无 drag 会话）

P1  pointermove（未过阈值）
    → 仍算「点按预备」；不跟手放大？现行：未 dragging 不 setDragPosition

P2  过阈值 → dragging=true
    → setDragPosition + 速度 EMA + 倾角/放大
    → 意图已提交为「拖」

P3  pointermove（拖中）
    → 跟手；可选：意图高亮可配目标（产品曾提，实现以 14/代码为准）

P4  pointerup / cancel
    → !dragging → doTapCard
    → dragging → 牌心 hit → canMatch? match : snapBack
    → cancel+dragging → snapBack
```

### 2.3 与动效层的边界

| 层 | 负责 | 本检索 |
|----|------|--------|
| **意图层** | 这是 tap 还是 drag？松手想消谁？ | ✅ 主战场 |
| **表现层** | meet/exit/snap/draw 动画、CARD_Z | ❌ 已钉 `14`，只引用 |
| **规则层** | isFree / canMatch / draw 状态 | ❌ 只读先验，不改规则 |

---

## 3. iOS 输入法范式 · 映射表（检索锚）

> 细节见会话调研；此处只钉 **可迁移抽象**。证据需 Round A 源卡补强。

| iOS / 软键盘概念 | 抽象 | 映射到本项目（拖重点） |
|------------------|------|------------------------|
| Fat-finger / 动态热区 | 热区 ≠ 绘制；随预测伸缩 | 松手目标 AABB + **可匹配则加权扩大**；stock 足迹已是热区放大 |
| 触点空间似然 \(P(t\|key)\) | 高斯/距离，非二元 in/out | \(P(drop\|card)\)：牌心距离、重叠面积、指尖 vs 牌心 |
| 词典 | 合法 token | **合法操作集**：free 牌、可配 pair、stock hit、空操作 |
| 语言模型 \(P(w\|ctx)\) | 上下文消歧 | **局面先验**：canMatch、selectedId、waste 顶、busy/flip |
| 滑行路径模板 | 轨迹 ≈ 词形 | 拖路径：home→目标的 **方向一致性**、是否扫过可配牌 |
| 自动更正 | 噪声观测→正确词 | 偏一点仍认目标；**禁止**改规则上的非法消 |
| 预测条 / 多候选 | top-k + 用户确认 | 可选：近邻可配高亮；**默认仍 auto top-1** |
| 删除/撤销 | 纠错通道 | snapBack、undo（已有）= 失败可恢复 |
| 个性化词典 | 用户频率 | 后期：个人 tap/drag 阈值；**POC 不做** |

### 3.1 核心命题（检索要证实或证伪）

| ID | 命题 | 若真则 POC |
|----|------|------------|
| H1 | 单位移阈值不足以稳健区分 tap/drag | 多特征分类（位移+时长+峰速） |
| H2 | 松手命中应 **规则先验 × 几何**，非纯 AABB | score 公式进 `pick` 或后处理 |
| H3 | 拖路径方向/扫过目标可提升「想消谁」准确率 | 路径积分或途经 free 可配加权 |
| H4 | 甩速应参与「提交匹配 vs 犹豫取消」而不只 loft | 低速松在弱命中→倾向 snap 或二次确认？需慎 |
| H5 | 抽区与拖废牌冲突可用意图类解决 | down 在 waste 优先牌；stock 仅无牌会话 |

---

## 4. 检索支柱与子问题矩阵

### 4.1 支柱

| 支柱 | 问题 | 落点 |
|------|------|------|
| **A 范式** | iOS/软键盘/Shape writing 哪些可迁移、哪些不能 | 源卡 + 映射表升格 |
| **B 起拖** | 如何稳健判定 tap vs drag vs flick | 特征表 + PHYS |
| **C 拖中** | 跟手噪声、意图高亮、跨牌扫过 | UE + 可选高亮钉 |
| **D 松手解码** | 目标评分、阈值、歧义 | 公式 + 伪代码 |
| **E 抽区冲突** | 点抽 / 拖废 / 误触 stock | hit 序 + 意图 |
| **F 竞品与游戏** | 纸牌/三消/solitaire 拖放意图 | 源卡；防抄规则 |
| **G 真机** | 拇指、延迟、系统手势 | R5 清单 |

### 4.2 子问题（开检清单）

| ID | 问题 | 证据目标 | 关闭方式 |
|----|------|----------|----------|
| Q-A1 | QuickPath/Slide-to-type 公开技术边界？ | 中：论文+专利摘要+产品行为 | 源卡 intent_ios_* |
| Q-A2 | 软键盘 statistical decoder 标准形式？ | 高：Goodman/业界综述 | 公式模板 |
| Q-A3 | 动态 hit-target 在游戏 UI 的适用边界？ | 中 | 反模式：不可放大非法目标 |
| Q-B1 | tap/drag 特征集最小充分集？ | 中：移动端指南+本项目日志 | 特征表 ≤6 维 |
| Q-B2 |  sticky drag 是否应允许「回到 tap」？ | 假设 | A/B 或产品拍板 |
| Q-B3 | 与系统 10px/系统手势冲突？ | 中 | iOS 人机指南 + 真机 |
| Q-C1 | 拖中是否显示可配目标（意图高亮）？ | 已有产品意向；证据补剂量 | 钉 alpha/scale 上限 |
| Q-C2 | 路径经过多枚可配时如何累计证据？ | 假设 | POC 路径加权 vs 仅终点 |
| Q-D1 | 松手 score 公式与拒绝阈值？ | **高优先** | 伪代码 + 参数默认 |
| Q-D2 | 牌心 vs 触点 vs 二者融合？ | 中：现行牌心优先 | 对照实验 |
| Q-D3 | 重叠牌/高层牌 z 是否进 score？ | 中 | 与 pickCard 层级一致 |
| Q-E1 | waste 顶与 stock 足迹重叠策略？ | 中：现行 pick 优先牌 | 状态机钉死 |
| Q-E2 | 自动抽动画 busy 时指针策略？ | 低：已有 isBusy | 引用即可 |
| Q-F1 | 同类休闲拖放「磁吸/合法优先」案例？ | 中 | 源卡 3–5 个 |
| Q-G1 | 真机拇指区拖精度基线？ | 假设→真机 | R5 10 人级可选 |

---

## 5. 检索轮次计划

### Round A · 范式锚定（0.5–1 天）

**目标：** 把 iOS/软键盘抽象变成 **可引用源卡**，避免空口映射。

| 动作 | 产出 |
|------|------|
| 收 SHARK² / Shape writing / soft keyboard decoder 要点 | `sources/intent_a_shape_softkey.md` |
| 收 iOS Slide to Type / 动态键盘热区 **产品行为**（非破解） | `sources/intent_a_ios_behavior.md` |
| 写 **可迁移 / 不可迁移** 对照表 | 并入本文 §3 升 v0.2 |

**禁止：** 深挖苹果闭源实现、破解键盘；不改为改 iOS。

### Round B · 本项目拖管线对照（0.5 天）

**目标：** 代码级差表：现行 vs 目标状态机。

| 动作 | 产出 |
|------|------|
| 逐行标注 `main.ts` pointer 分支 | `sources/intent_b_code_map.md` |
| 列出误触场景 8 条（故事） | 场景表 → POC 用例 |
| 与 `14` busy/flip/exit 交叉 | 避免与动效锁冲突 |

### Round C · 竞品与游戏拖放（0.5–1 天）

**目标：** 休闲/纸牌/三消的 **意图** 而非美术。

| Query 方向 | 例 |
|------------|-----|
| drag drop snap magnetic legal target | 合法目标磁吸 |
| card game drag release accuracy | 松手容差 |
| touch dead zone vs drag threshold mobile game | 阈值设计 |
| cancel drag gesture restore | snapBack 范式 |

产出：`sources/intent_c_game_drag.md`（3–8 源）

### Round D · 合成钉（0.5 天）

**目标：** 可 POC 的规格，不是长文。

| 文档 | 内容 |
|------|------|
| `16_intent_event_table.md` | 事件：IntentTap / IntentDragStart / IntentDropMatch / IntentDropMiss / IntentDraw… |
| `17_intent_features_params.md` | 特征、默认阈值、建议 PHYS 名 |
| 更新 `14` 或新 `18_intent_impl_pins.md` | 状态机 + score 伪代码 |

### Round E · 反查（固定）

| 检查 | 失败则 |
|------|--------|
| 是否改了 D17/D22？ | 删改 |
| 是否要求像素级完美拖？ | 改为 score |
| 是否与 skipMeet/exit 矛盾？ | 对齐 `14` |
| 参数是否不可测？ | 改成 design px / ms |
| 是否键盘术语堆砌无落点？ | 删 |

---

## 6. 拟定意图状态机（检索假设 · 待 Round D 钉死）

```text
                    ┌─────────────┐
 pointerdown        │  Idle       │
 命中 free 牌 ──────►│  Armed     │  activeDrag 建立，dragging=false
                    └──────┬──────┘
           move 特征累积    │
           (Δs, t, v_peak)  │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
         IntentTap     IntentDrag     （取消/出界）
         (up 未过阈)   (过 thr 或      up 无会话
              │         峰速+位移)         │
              ▼             │             ▼
          doTapCard         │         no-op / draw?
                            ▼
                      Dragging
                  （跟手·可选高亮）
                            │
                      pointerup
                            ▼
                   DropDecoder(score)
                      │           │
                      ▼           ▼
                 DropMatch    DropMiss
                 tryMatch+    snapBack
                 exit         refresh
```

**假设默认（待证据）：**

- thr 不再唯一：`drag if (Δs > s0) OR (v_peak > v0 AND Δs > s_min)`  
- Drop score：  
  `score(c) = w_g * geom(drop, c) + w_m * 1[canMatch(drag,c)] + w_f * 1[isFree(c)]`  
  仅 `score ≥ τ` 且 canMatch 才提交匹配。  
- **非法目标绝不因「热区放大」变合法**（键盘词典外词不应强行更正成非法消）。

---

## 7. 反模式（检索中途即可追加）

| 禁止 | 原因 |
|------|------|
| 用 LM「猜玩家想消哪一对」改规则 | 破坏顿悟公平 |
| 热区放大到盖住不可点的锁牌并允许点 | 误导 free 语义 |
| 拖中强磁吸跳变（无跟手） | 损控制感 |
| 完全复制滑词路径识别做消牌 | 过重、延迟、与 skipMeet 模型不符 |
| 为降误触提高 threshold 到「拖不动」 | 牺牲主路径 |
| 静默忽略松手 | 须 snapBack 或明确反馈 |
| 与系统返回手势死锁 | 真机必测 |

---

## 8. POC 清单（检索关闭后执行 · 非本阶段必做）

| # | 实验 | 观测 | 通过标准（草案） |
|---|------|------|------------------|
| P1 | 多特征 tap/drag | 误拖率、误点率 | 优于单 thr=8 的自测 20 次 |
| P2 | score 松手（几何+canMatch） | 偏一点仍中；非法不中 | 故事用例 8/8 |
| P3 | 仅终点 vs 终点+路径加权 | 拖过错误牌 | 不增加误消 |
| P4 | 牌心 vs 触点 | 大拇指遮挡 | 选定默认写进钉 |
| P5 | waste/stock 分流 | 拖废不误抽 | 10/10 |
| P6 | 调试 overlay：score 热力 | 研发效率 | 可选 dev flag |
| P7 | 真机 393 框 + 实机 | 延迟、误触 | 记录问题列表 |
| P8 | 与 autoDrew/busy 并发 | 动画中指针 | 无死锁、无双提交 |

---

## 9. Query 池（Round A/C 用）

```text
# 范式
soft keyboard statistical decoder touch model language model
SHARK2 shape writing gesture keyboard path recognition
iOS slide to type QuickPath how it works
dynamic hit target soft keyboard fat finger

# 游戏拖放
mobile game drag drop release tolerance snap to target
solitaire freecell drag card drop accuracy
match-3 drag vs swipe intent classification
touch deadzone drag threshold milliseconds mobile UX

# 人机
Apple HIG touch targets gestures
Fitts law mobile touch imprecision
cancel drag restore position UX
```

**停止条件：** 每个支柱有 ≥1 源卡或明确「仅假设+POC」登记；禁止无限外搜周。

---

## 10. 与现有文档关系

| 文档 | 关系 |
|------|------|
| `14_physical_impl_pins` | 动效/busy/拖消表现 **已钉**；本计划 **不重开** meet/exit 参数 |
| art-ux `17` / `03` | 旧文或写「仅点选」；意图层以本计划 + 现行代码为准 |
| `09_physical_feel_research_plan` | 物理手感检索 **已关**；本计划为 **新轨：意图** |
| changelog drag/drawzone | 实现史；意图 POC 成功后写新 changelog |

---

## 11. 里程碑

| 阶段 | 产出 | 预估 |
|------|------|------|
| M0 | 本文 v0.1 入库索引 | ✅ 本次 |
| M1 | Round A+B 源卡 + 代码差表 | 1 天 |
| M2 | Round C 竞品源卡 | 0.5–1 天 |
| M3 | `16`+`17`+实现钉草案 | 0.5 天 |
| M4 | 反查 → 状态「可 POC」 | 0.5 天 |
| M5 | POC P1–P5 + changelog | 另轨 |

---

## 12. 验收勾选（计划本身）

- [x] 目标/滤镜/非范围清晰  
- [x] 现行拖管线 P0–P4 与代码对齐  
- [x] iOS 映射表 + 可迁移命题 H1–H5  
- [x] 子问题矩阵与轮次  
- [x] 反模式与 POC 清单  
- [ ] Round A–D 执行  
- [ ] 反查通过  
- [ ] 升格实现钉并改 `main.ts`  

---

## 版本

| 版本 | 日期 | 变更 |
|------|------|------|
| **v0.1** | **2026-07-23** | 初版：项目拖操作 × iOS 输入法范式检索计划 |
