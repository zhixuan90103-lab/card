# 有效来源 List · 拖动意图识别（× iOS 输入法范式）

**整理日期：** 2026-07-23 · **v1**  
**Notebook：** poker类手感调优 · `b0897377-3dc5-48c2-bc98-554cb380d352`  
**索引：** `research/handfeel/00_INDEX.md`  
**关联总表：** [`12_effective_sources_list.md`](./12_effective_sources_list.md)（物理/旧轨手感）

**产品滤镜：**

```text
重点 = 拖消更容易「到位就触发」+ 手机少选错
不做 = 改 canMatch 规则 · 滑词全路径 DP · 远处乱吸 · 重开 meet/exit 参数
引擎 = Pixi pointer + design 坐标 · 393×852
代码第一手 = dropMatchTarget / pickCard(nearest) · main.ts 松手/点选
```

**证据等级：**

| 级 | 含义 |
|----|------|
| **S** | 公开论文 / 权威 UX 方法文 |
| **A** | 成熟 UX 指南 / 可复现产品行为摘要 |
| **L** | 本项目计划·反查·源卡·实现钉·代码 |
| **C** | 会话调研合成（已沉淀进 L 源卡） |

**纪律：**

```text
POC/实现认序：L-IT-19 → L-IT-18 → L-IT-17 → 代码 rules/main/phys
外源只撑「噪声触点 + 合法先验 + 容差/磁吸边界」
禁止：苹果键盘破解、用历史改规则、非 free 放大可点
噪声：整词 ShapeWriter 复现、预测条多步确认打断拖消
```

**一句话：**  
意图轨外源借 **软键盘 decoder + DnD 容差** 的抽象；落地认 **L-IT-19 + `dropMatchTarget`**。

---

## 0. 落地结论摘要（调研 → 方案 → 代码）

### 0.1 从 iOS / 软键盘借到什么

| 抽象 | 含义 | 本项目用法 |
|------|------|------------|
| 触点是噪声 | 胖手指、中心≠瞄准 | 不靠像素级对准 |
| 空间似然 × 合法集 | Goodman soft keyboard | free 候选 + geom score |
| 上下文先验 | LM / 词典 | **硬** `canMatch`（非统计猜规则） |
| 动态热区 | 预测伸缩键位 | **仅对可配** 放宽 τ；禁放大非 free |
| 滑词路径 | QuickPath / SHARK 谱系 | **仅弱用** 方向趋势；不做全词 DP |
| 可恢复 | 删除/更正 | snapBack / undo |

### 0.2 玩家痛点 → 对策

| 痛点 | 对策（已实现） |
|------|----------------|
| 觉得已滑到 A2 却不触发 | 多探针（逻辑/手指/**画面牌心**）+ **牌矩形重叠**即算到位 + τ≈0.72 牌宽 + 朝向 A2 的趋势加分 |
| 近旁不能配 free 抢走可配 | score：`M·canMatch ≫ G·geom` |
| 手机点错牌 | `pickCard`：扩 hitSlop + **最近牌心** |
| 乱吸远处可配 | 仍要 dist≤τ / 重叠 / 趋势放宽；过远 null→snapBack |

### 0.3 代码映射

| 能力 | 位置 |
|------|------|
| 点选/按下命中 | `rules.pickCard` · `PHYS.pickHitSlop` |
| 松手解码 | `rules.dropMatchTarget` · `PHYS.dropMatch*` / `dropScore*` |
| 接入 | `main.ts` pointerdown / pointerup |
| 参数 | `src/render/phys.ts` |

### 0.4 参数现行（以代码为准）

| 参数 | 值 | 作用 |
|------|-----|------|
| `pickHitSlop` | 12 | 点选扩框 |
| `dropMatchTauScale` | 0.72 | 中心距上限 × 牌宽 |
| `dropScoreG` | 1 | 几何 |
| `dropScoreM` | 2.5 | 可配 |
| `dropScoreT` | 0.85 | 趋势/朝向 |
| 重叠 | 布尔 | 可配且矩形相交 → 接受 |
| 趋势放宽 | τ×1.2 | 朝向清晰时略松 |

---

## 1. 入库优先级（本轨）

| 批 | 内容 | Notebook |
|----|------|----------|
| **P0** | 实现钉 19 + 参数 18 + 事件 17 + 本表 | **必收** |
| **P1** | 计划 15 · 反查 16 · changelog | 必收 |
| **P2** | 源卡 intent_a/b/c | 必收 |
| **P3** | 外源 URL（Goodman / NN DnD） | 建议收 |
| **P4** | 会话长文 | 不入库；已压进源卡 |

---

## 2. P0 · 本项目规格与实现（L）

| ID | 路径 | 内容 |
|----|------|------|
| **L-IT-19** | `research/handfeel/19_intent_impl_pins.md` | **实现钉**：DropDecoder 伪代码 · P0 已落地 |
| **L-IT-18** | `research/handfeel/18_intent_features_params.md` | 特征/阈值表（假设→以 phys 为准） |
| **L-IT-17** | `research/handfeel/17_intent_event_table.md` | 意图事件 I-Down/Tap/Drag/Drop* |
| **L-IT-20** | `research/handfeel/20_intent_effective_sources_list.md` | **本表** |
| **L-IT-15** | `research/handfeel/15_drag_intent_research_plan.md` | 检索计划 v0.3（检索关） |
| **L-IT-16** | `research/handfeel/16_drag_intent_gap_audit.md` | 计划反查补漏 |
| **L-IT-CL** | `docs/changelog/2026-07-23_drag_intent_drop_decode.md` | 实现纪要 changelog |
| **L-CODE-R** | `src/core/rules.ts` | `pickCard` · `dropMatchTarget` |
| **L-CODE-M** | `src/main.ts` | 松手多探针 + origin/vel |
| **L-CODE-P** | `src/render/phys.ts` | 意图相关 PHYS |
| **L-TEST** | `src/core/rules.test.ts` | 可配优先 / 重叠 / 趋势 / 点选最近 |

**交叉（表现层，不重开）：**

| ID | 路径 | 关系 |
|----|------|------|
| **L-PF-14** | `14_physical_impl_pins.md` | skipMeet/exit/busy；意图不改动效峰值 |
| **L-DZ-CL** | `docs/changelog/2026-07-23_drawzone_z_autodraw_dim.md` | 抽叠/自动抽并行；松手锁 isFlipping |

---

## 3. P2 · 检索源卡（L）

| ID | 路径 | 轮次 | 要点 |
|----|------|------|------|
| **L-IT-A1** | `sources/intent_a_softkey_decoder.md` | A | Goodman 软键盘：触点模型 × LM；映射 free/canMatch |
| **L-IT-A2** | `sources/intent_a_ios_behavior.md` | A | iOS 点按/滑词**行为**；可迁移/禁滑词 DP |
| **L-IT-B1** | `sources/intent_b_fail_stories.md` | B | S1–S8 失败故事；S1=近旁抢可配 |
| **L-IT-C1** | `sources/intent_c_game_drag.md` | C | DnD 容差/磁吸边界；失败 snap |

---

## 4. P3 · 外源 URL（S/A）

| ID | 级 | 源 | 用于 |
|----|-----|-----|------|
| **S-IT-01** | S | Goodman et al., *Language Modeling for Soft Keyboards*, AAAI 2002 · [PDF](https://cdn.aaai.org/AAAI/2002/AAAI02-064.pdf) | 噪声触点 + 语言模型解码范式 |
| **S-IT-02** | A | Shape writing / SHARK 谱系 · [ShapeWriter 维基](https://en.wikipedia.org/wiki/ShapeWriter) | 滑词=路径模板；本项目仅弱趋势 |
| **S-IT-03** | S | NN/g, *Drag-and-Drop: How to Design for Ease of Use* · [文](https://www.nngroup.com/articles/drag-drop/) | 拖放不准 → 合法落区放大/磁吸感 |
| **S-IT-04** | A | Smart Interface Design Patterns, *Drag-and-Drop UX* · [文](https://smart-interface-design-patterns.com/articles/drag-and-drop-ux/) | 落点 magnetism、短 snap 反馈 |
| **S-IT-05** | A | 触控目标量级（Apple HIG 约 44pt 通识 / NN touch target） | 牌 52×72 已够大；问题在叠压与松手解码 |

**不入库（旁证/噪声）：** iOS 键盘吐槽帖、破解热区、全量 SHARK 实现复现教程。

---

## 5. 可迁移对照表（定稿）

| 外源概念 | 迁移 | 本项目落地 |
|----------|------|------------|
| \(P(t\|key)\) | ✅ | geom(drop, cardCenter) |
| 词典/合法 token | ✅ | 候选 ⊆ free |
| LM 上下文 | ✅ 规则硬约束 | `I[canMatch]` 大权重 M |
| 动态热区 | ✅ 受限 | τ + 重叠；**禁止**非 free |
| 滑词形状匹配 | ⚠️ 弱 | origin→drop 方向 cos 趋势 |
| 多候选预测条 | ❌ 默认 | 自动 top-1；hints 点选另轨 |
| 零错误 | ❌ | 高召回 + snapBack 可恢复 |

---

## 6. 反模式（有效源共识 + 产品钉）

1. 非 free / 不可配因「更近」被消除  
2. 热区放大锁牌可点  
3. 拖中无跟手强磁吸跳变  
4. 滑词级路径 DP 做消牌  
5. 用玩家历史改 canMatch  
6. 静默忽略松手（须 snap 或反馈）  
7. 全屏磁吸远处可配  

---

## 7. Notebook 建议入库顺序

```text
1. 20_intent_effective_sources_list.md  （本表）
2. 19_intent_impl_pins.md
3. 18 + 17
4. 15 + 16
5. sources/intent_a_* / intent_b_* / intent_c_*
6. docs/changelog/2026-07-23_drag_intent_drop_decode.md
7. 可选 URL：S-IT-01 PDF、S-IT-03 NN/g
```

---

## 8. 版本

| 版本 | 日期 | 变更 |
|------|------|------|
| **v1** | **2026-07-23** | 初版：调研+落地 DropDecoder/点选最近/趋势重叠 有效源总表 |
