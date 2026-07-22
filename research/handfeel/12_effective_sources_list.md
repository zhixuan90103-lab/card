# 有效来源 List · Poker 类手感调优

**整理日期：** 2026-07-22 · **v2**  
**Notebook：** poker类手感调优  
**ID：** `b0897377-3dc5-48c2-bc98-554cb380d352`  
**索引：** `research/handfeel/00_INDEX.md`

**产品滤镜：**

```text
纸牌皮 · 层叠配对 · 同色同点 · 点选+拖放
主卖 = 顿悟 · 非法不重罚 · 无默认震屏
引擎 = Pixi 8 · 393×852
手感方向 = 物理升级（浮动/意图/对撞抛物线/抽洗回）+ 旧轨克制规格对照
```

**证据等级：**

| 级 | 含义 |
|----|------|
| **S** | 官方 / 权威方法文（NN/g、MDN） |
| **A** | 可复现工程 / 成熟 UX 指南 |
| **B** | 社区 / 商业博客 — 不单独定 ms |
| **L** | 本项目本地合成 |

**纪律：**

```text
POC 第一手：L-PF-14（14_physical_impl_pins）
线上旧 UE 仍认：L-AX-03（未升格前）
物理草案：L-HF-10 / L-HF-11
结论优先 L + S + A；B 旁证；H-* 未真机定稿
噪声：ACT 震屏、真 3D 翻、炉石对战全套、全屏粒子 → 不入库
```

**一句话：**  
调优时 **新物理 POC 认 14→10→11**；对照旧实现认 **03/04/08**；外源只撑时长/DnD/触控量级。

---

## 入库优先级

| 批 | 类型 | Notebook |
|----|------|----------|
| **P0** | 物理钉 + 事件/参数草案 + 旧 UE/S3 | **必收** |
| **P1** | 计划/反查/自洽/体验合同 | 必收 |
| **P2** | 检索源卡 pf_* / fa_c* / r1_* | 核心已收；fa_a/b 可选 |
| **P3** | S/A URL | 已收 NN + DnD |
| **P4** | B URL | 默认不入库（表内保留） |

---

## P0 · 规格与实现钉（L）— 必收

### 物理轨（现行 POC）

| ID | 路径 | 内容 |
|----|------|------|
| **L-PF-14** | `research/handfeel/14_physical_impl_pins.md` | **POC 第一手**：共抛/S3/抽洗回/busy/PHYS |
| **L-HF-10** | `research/handfeel/10_physical_ue_events.md` | 物理 UE 草案 v0.2（P-sel…P-rec） |
| **L-HF-11** | `research/handfeel/11_physical_anim_params.md` | 物理参数 v0.2（120+260=380） |
| **L-HF-09** | `research/handfeel/09_physical_feel_research_plan.md` | 检索计划 v1.2（检索关） |
| **L-HF-13** | `research/handfeel/13_physical_gap_audit.md` | 物理轨反查 |
| **L-HF-12** | `research/handfeel/12_effective_sources_list.md` | **本表** |

### 旧轨 / 线上对照（未升格前仍有效）

| ID | 路径 | 内容 |
|----|------|------|
| **L-AX-03** | `research/art-ux/03_ue_event_table.md` | 线上 UE 唯一源（flyAway 版） |
| **L-AX-04** | `research/art-ux/04_animation_params.md` | 旧 H-match 280 等 |
| **L-AX-08** | `research/art-ux/08_impl_pins_r31.md` | freeBefore · S3 · H-busy |
| **L-AX-05** | `research/art-ux/05_antipatterns.md` | X04/X05/X06 |
| **L-HF-05** | `research/handfeel/05_feel_spec.md` | 六维验收（旧轨勾选） |
| **L-HF-08** | `research/handfeel/08_self_consistency_audit.md` | 自洽 4.0 · E06/S3 代码债 |
| **L-D03** | `docs/design/03_experience_and_innovation.md` | 顿悟合同 |
| **L-HO-ART** | `docs/HANDOFF_ART_UX.md` | 实现边界 · 拖放 |

---

## P1 · 过程与检索终态（L）

| ID | 路径 | 内容 |
|----|------|------|
| L-HF-00IX | `research/handfeel/00_INDEX.md` | 目录 |
| L-HF-01 | `research/handfeel/01_feedback_animation_research_plan.md` | 旧实现与校准计划 |
| L-HF-07 | `research/handfeel/07_round3_desk_research.md` | 旧轨参数外搜封口 |
| L-HF-04 | `research/handfeel/04_gap_audit_v1.md` | A/B 反查 |
| L-HF-06 | `research/handfeel/06_gap_audit_bp_v1.md` | B′ 反查 |
| L-CL-DRAG | `docs/changelog/2026-07-22_drag_match_pile_shadow.md` | 拖放实现说明 |
| L-D11 | `docs/design/11_viewport_iphone15.md` | 真机清单（仓库） |
| L-D17 | `docs/design/17_art_ux_research_plan.md` | 总计划（仓库） |

---

## P2 · 检索源卡（L）

根：`research/handfeel/sources/` · `research/art-ux/sources/`

### 物理轨 pf_*

| ID | 文件 | 主题 |
|----|------|------|
| L-PF-A | `pf_a_survival_kit_map.md` | 生存手册→ms/事件 |
| L-PF-B | `pf_b_uiue_intent.md` | 浮动/意图/对撞 |
| L-PF-C | `pf_c_card_animation.md` | 抽翻洗回/抛物线 |
| L-PF-E | `pf_e_round2_gap_close.md` | **二轮补漏** 共抛/busy/S3 |

### 旧轨 fa_* / r1_*（摘要已入 07/08；全文按需）

| ID | 文件 | 主题 |
|----|------|------|
| L-FA-C1…C4 | `fa_c1`…`fa_c4` | 时长/双路径/弹回/掀开封口 |
| L-FA-A1…A6 | `fa_a1`…`fa_a6` | 品类原则（可选入库） |
| L-FA-B1…B4 | `fa_b1`…`fa_b4` | 工程（可选；busy 以 08/14 为准） |
| L-R1-NNG | `r1_nng_animation_duration.md` | NN 时长映射 |
| L-R1-FLIP | `r1_fake_card_flip.md` | 伪翻 scale.x |
| L-R1-JUICE | `r1_juice_dose_and_lock.md` | 剂量 |
| L-R1-WEB | `r1_web_touch_viewport.md` | 触控视口（可选） |

---

## P3 · 官方 / 权威（S）— URL

| ID | URL | 支撑 |
|----|-----|------|
| **S-NNG-ANIM** | https://www.nngroup.com/articles/animation-duration/ | 微交互/一般时长 |
| **S-NNG-DND** | https://www.nngroup.com/articles/drag-drop/ | 拖状态、归位量级 |
| **S-MDN-VP** | https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/CSSOM_view/Viewport_concepts | visualViewport |
| **S-MDN-META** | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport | safe-area 提示 |

---

## P4 · 工程共识 / 旁证（A · B）— URL

| ID | URL | 级 | 支撑 |
|----|-----|-----|------|
| **A-DND-SID** | https://smart-interface-design-patterns.com/articles/drag-and-drop-ux/ | A | lift/success/error |
| **A-FLIP-H5** | https://www.html5gamedevs.com/topic/5419-3d-rotation-of-sprites-card-flip-animation/ | A | scale.x 伪翻 |
| **A-FLIP-DF** | https://forum.defold.com/t/easy-card-flip-effect-with-animation-in-y-axis/74343 | A | 中点换面 |
| **A-JUICE-EA** | https://www.gameanalytics.com/blog/squeezing-more-juice-out-of-your-game-design | A | ease 与重量感 |
| **B-APPY-ANIM** | https://www.appypie.com/blog/mobile-app-animation-guide | B | 200–300 折中 |
| **B-HS-SLOW** | https://eu.forums.blizzard.com/en/hearthstone/t/animations-are-so-slow-its-painful/5411 | B | 过长怒（仅借原则） |
| **B-SOL-SPEED** | https://www.reddit.com/r/solitaire/comments/1evdein/solitaire_wfaster_animation/ | B | 接龙要加速动画 |
| **B-GDEV-MOB** | https://gdevelop.io/blog/mobile-ux-mistakes | B | 触控/真机 |
| **B-CURSA-TOUCH** | https://cursa.app/en/page/touch-controls-for-mobile-games-input-patterns-and-feedback | B | 触控反馈 |
| **B-MAHJ-FREE** | https://classic-mahjong.com/ | B | free 高亮 |

---

## 不入库 / 噪声

| 类 | 原因 |
|----|------|
| ACT hitstop / 重震屏 | X04 |
| 真 3D 翻主路径 | D15 |
| 炉石对战拖放全套 | 输入模型不同 |
| 超休闲全屏粒子 | 定位干净 |
| 配对竞品未逐帧库 | 不伪造成源 |
| 生存手册全书逐页 | 已有 pf_a 映射 |

---

## 参数速查（双轨）

### 物理 POC（认 14 / 11）

| 参数 | 默认 | 纪律 |
|------|------|------|
| meet + exit | **120 + 260 = 380** | busy 目标 ≤400 · 硬顶 450 |
| 选中浮动 | y10 · scale 1.06 · 100ms | |
| 意图高亮 | scale 1.05 · 最多 4 张 free | 非 free 不亮 |
| 拖 scale | 1.08 | |
| 弹回 | 160ms | 无红闪 |
| 抽移→翻 | 150 + 160 | 先到位再翻 |
| 洗回 | 扣背 120 并行；gap 40 加速 | 总理想 ≤700 |
| 翻+呼吸 | 180 · 峰 1.08 | **不 busy** |
| 双牌 exit | **共抛同步** | 见 14 S4 |

### 旧轨对照（认 03/04 · 未升格）

| 参数 | 默认 |
|------|------|
| H-match flyAway | 280（单段） |
| 选中 | y-4 无 scale |
| 抽/洗回 | 多瞬时 |
| busy | flyAway ∪ snap ∪ 拖 |

---

## 调优问题 → 优先读

| 问题 | 优先源 |
|------|--------|
| **按新物理做 POC** | **L-PF-14** → L-HF-10 → L-HF-11 |
| 对撞+抛物线总长 | L-HF-11 · L-PF-A · S-NNG-ANIM |
| 意图高亮规则 | L-HF-10 · L-PF-B · L-PF-14 §3 |
| 抽移再翻 / 洗回 | L-HF-10 · L-PF-C · L-PF-14 §7–8 |
| 双牌怎么抛 | L-PF-E · L-PF-14 §6 |
| match 冲动画债 | L-HF-08 · L-AX-08 · L-PF-14 §5 |
| 旧 flyAway 行为 | L-AX-03 · L-AX-04 |
| 非法/静默 | L-AX-05 · L-D03 |
| 触控/真机 | L-FA-B3 · L-D11 · S-MDN-* |

---

## NotebookLM 入库状态

**标题：** poker类手感调优  
**ID：** `b0897377-3dc5-48c2-bc98-554cb380d352`  
**更新：** 2026-07-22 · **v2 整理后**  
**统计：** **35 sources · 全部 ready**（含本表重传；可有旧版 12 重复标题）

### 已入库 ready

| 类别 | 源（标题关键词） |
|------|------------------|
| **物理 P0** | 12 本表 · 09 · 10 · 11 · **14** · **13** · pf_a/b/c/**e** |
| **旧轨 P0** | art-ux 03/04/05/08 · feel_spec · 自洽 08 · design/03 · HANDOFF · drag changelog · 01 计划 |
| **源卡** | fa_c1–c4 · r1_nng / flip / juice |
| **外链 S/A** | NN/g Animation Duration · NN/g Drag-Drop · Smart Interface DnD · HTML5 伪翻 · Defold 翻牌 · GameAnalytics juice |

### 可选未入库

| 项 | 说明 |
|----|------|
| fa_a* / fa_b* 全文 | 要点已渗入 07/10/14 |
| 其余 B 级 URL | 表内 P4 保留 |
| MDN viewport | 用仓库 L-D11 |

### 操作

```bash
notebooklm use b0897377-3dc5-48c2-bc98-554cb380d352
```

与 **配对牌项目笔记** `8accbc6d-…` 互补：本笔记专 **手感 / 反馈 / 物理 POC**。  
POC 问答优先引用：**14_physical_impl_pins**。

---

## 版本

| 版本 | 日期 | 变更 |
|------|------|------|
| v1 | 2026-07-22 | 初版 + 首批入库 |
| v1.1 | 2026-07-22 | 物理 09/10/11 + pf_a/b/c |
| **v2** | 2026-07-22 | **双轨重排**；P0=14；补 13/e；35 源 ready；伪翻/juice 外链 |
