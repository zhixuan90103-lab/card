# 有效来源 List · 美术 / UI·UE / 纸牌动画 / 操作手感

**整理日期：** 2026-07-22  
**Notebook：** 配对牌项目笔记  
**ID：** `8accbc6d-2100-42dd-b94f-54be4a93740b`  
**计划：** `docs/design/17_art_ux_research_plan.md` v1.2+  
**索引：** `research/art-ux/00_INDEX.md`

**证据等级：**

| 级 | 含义 |
|----|------|
| **S** | 官方 / 权威方法文（NN/g、MDN、WebAIM） |
| **A** | 可复现工程共识（多引擎伪翻帖等） |
| **B** | 旁证 / 社区 / 二手 — 不单独定 ms |
| **L** | 本项目本地合成（规格、反查、钉、自洽） |

**纪律：**

```text
结论优先 L + S + A
B 只作剂量/风险旁证
H-* 假设未验证前不当「已测数据」
噪声（ACT juice、真 3D 翻、引擎再选型）不入库
```

**一句话：** 规格以 **L（02–05 + 08）** 为准；外源只支撑 **时长量级 / 伪翻技法 / 可读对比 / 触控视口**。

---

## 入库优先级

| 批 | 类型 | 说明 |
|----|------|------|
| **P0** | L 规格与钉 | NotebookLM **必收**；实现第一手 |
| **P1** | L 计划/反查/自洽/基线 | 过程与纪律 |
| **P2** | S 官方 URL | 时长、a11y、视口 |
| **P3** | A 工程帖 URL | 伪翻 scale.x |
| **P4** | L 参数卡 + 相关产品 md | 检索摘录与体验合同 |
| — | B / 噪声 | 附录列出，**默认不入库** |

---

## P0 · 本地规格与实现钉（L）— 必收

根：`research/art-ux/` · `docs/`

| ID | 路径 | 内容 |
|----|------|------|
| **L-AX-08** | `research/art-ux/08_impl_pins_r31.md` | **实现钉** S1–S7、H-\* 默认、文案 |
| **L-AX-03** | `research/art-ux/03_ue_event_table.md` | **UE 事件表** E01–E12（产品唯一细表） |
| **L-AX-02** | `research/art-ux/02_visual_spec.md` | 牌面/三态/背面/浮层色板 |
| **L-AX-04** | `research/art-ux/04_animation_params.md` | 动画 ms / 缓动 / busy |
| **L-AX-05** | `research/art-ux/05_antipatterns.md` | 禁止与慎用 |
| **L-AX-06** | `research/art-ux/06_synthesis.md` | 一页实现序 + 常量 |
| **L-HO-ART** | `docs/HANDOFF_ART_UX.md` | 实现交接与 §9 验收 |
| **L-D17** | `docs/design/17_art_ux_research_plan.md` | 检索计划 v1.2+ |

---

## P1 · 本地过程与纪律（L）

| ID | 路径 | 内容 |
|----|------|------|
| L-AX-00 | `research/art-ux/00_INDEX.md` | 进度与阅读序 |
| L-AX-01 | `research/art-ux/01_baseline_notes.md` | R0 代码基线参数 |
| L-AX-07 | `research/art-ux/07_gap_audit.md` | 反查 v2（假设登记） |
| L-AX-09 | `research/art-ux/09_self_consistency_audit.md` | 自洽 4.0/5、代码债 |
| **L-AX-12** | `research/art-ux/12_effective_sources_list.md` | **本表** |

---

## P2 · 官方 / 权威（S）— URL

| ID | URL | 支撑 | 可信度 |
|----|-----|------|--------|
| **S-NNG-ANIM** | https://www.nngroup.com/articles/animation-duration/ | 微交互 100ms；一般 100–500；modal 200–300 | 高 |
| **S-WEBAIM-C** | https://webaim.org/articles/contrast/ | WCAG 对比比；红对白临界 | 高 |
| **S-MDN-VP** | https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/CSSOM_view/Viewport_concepts | layout vs visual viewport | 高 |
| **S-MDN-META** | https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport | viewport-fit、safe-area 提示 | 高 |
| **S-A11Y-CARD** | https://veroniiiica.com/playing-cards-and-low-vision/ | 牌面可读、轮廓、配色策略 | 中–高 |

本地权威（已在产品笔记中者可复用，不必重复强调外链）：

| ID | 路径 | 支撑 |
|----|------|------|
| L-D03 | `docs/design/03_experience_and_innovation.md` | 顿悟合同、无 timer、非法不重罚 |
| L-D05 | `docs/design/05_board_layout_consensus.md` | CARD 52×72、I5 free=亮面 |
| L-D11 | `docs/design/11_viewport_iphone15.md` | 393×852、safe-area、真机清单 |
| L-D07 | `docs/design/07_glossary.md` | 术语（含 D22 同色同点） |
| L-FULL | `docs/changelog/2026-07-22_full_roundup.md` | 规则总表 D10–D26 |

---

## P3 · 工程共识（A）— URL

| ID | URL | 支撑 | 可信度 |
|----|-----|------|--------|
| **A-FLIP-H5** | https://www.html5gamedevs.com/topic/5419-3d-rotation-of-sprites-card-flip-animation/ | scale.x 伪翻经典描述 | 高 |
| **A-FLIP-DF** | https://forum.defold.com/t/easy-card-flip-effect-with-animation-in-y-axis/74343 | scale→换面→scale；50% 切换 | 高 |

---

## P4 · 本地参数卡与相关合成（L）

### 4.1 Art/UX R1 参数卡

根：`research/art-ux/sources/`

| ID | 文件 | 主题 |
|----|------|------|
| L-R1-NNG | `r1_nng_animation_duration.md` | 时长映射 E01/E03/E06 |
| L-R1-FLIP | `r1_fake_card_flip.md` | 伪翻技法 |
| L-R1-READ | `r1_card_readability_a11y.md` | 角标 / 红黑 |
| L-R1-JUICE | `r1_juice_dose_and_lock.md` | 剂量、busy、非法 |
| L-R1-WEB | `r1_web_touch_viewport.md` | Safari / safe-area |

### 4.2 相关产品内合成（交叉引用，非重复发明）

| ID | 路径 | 用途 |
|----|------|------|
| L-HF-00 | `research/handfeel/00_gap_audit_and_plan_v1.md` | 手感祖先；**细表让位 art-ux/03** |
| L-SM-05 | `research/sorting-market/05_handfeel_chapter.md` | 合法反馈、完成分级、勿锁死（输入模型勿照搬） |
| L-TS-BUNDLE | `research/tech-stack/notes/bundle_size.md` | 程序化优先、包体旁证 |
| L-TS-12 | `research/tech-stack/12_effective_sources_list.md` | 技术栈有效源（Pixi/视口） |

---

## 不入库 / 噪声（附录）

| 类 | 例 | 原因 |
|----|-----|------|
| ACT / 强震屏 juice 大全 | 各类 hitstop 教程 | 与顿悟扫视冲突；X04 |
| 真 3D 翻牌主路径 | Three 卡牌模拟 | D15 已定 Pixi 伪翻 |
| 炉石全套拖放 | 对战拖拽 | 输入模型不同 |
| 单条商店「手感很好」 | 无 ms | 不可证伪 |
| 配对/接龙竞品未逐帧源 | 检索缺口 | 用 H-match，不伪造成源 |
| 超休闲全屏粒子 | — | 定位干净 |

---

## NotebookLM 入库状态（配对牌项目笔记）

**Notebook ID：** `8accbc6d-2100-42dd-b94f-54be4a93740b`  
**入库日：** 2026-07-22  
**说明：** 账号源上限约 **50 ready**；已清重复/失败项后写入下列 **ArtUX ·** 标题源（`PASTED_TEXT`）。

### 已入库 ready（✅）

| 标题 | 对应文件 |
|------|----------|
| ArtUX · 12_effective_sources_list.md | 本表 |
| ArtUX · 08_impl_pins_r31.md | 实现钉 |
| ArtUX · 06_synthesis.md | 综合 |
| ArtUX · 03_ue_event_table.md | UE 表 |
| ArtUX · 02_visual_spec.md | 视觉规格 |
| ArtUX · 04_animation_params.md | 动画参数 |
| ArtUX · 09_self_consistency_audit.md | 自洽评估 |
| ArtUX · 07_gap_audit.md | 反查 v2 |

### 未入库 / 占位不足（⬜）

| 项 | 原因 | 替代 |
|----|------|------|
| 全文 `17` / `HANDOFF_ART_UX` | 满额 50；大文件 add 失败 | 读本表 + 06/08；仓库全文 |
| `05_antipatterns` · `00/01` · `r1_*` | 配额 | 内容已渗入 02–09 / 本表 URL 节 |
| 外链 S/A 直抓 | 抓取失败或配额 | **URL 保留在本表 P2/P3**；参数卡在仓库 `sources/` |

### 操作备注

- 再入库前：删废弃源或升级额度  
- 勿重复导入 sorting/tech 已有的 `03`/`05`/`11`（笔记中通常已有）  
- 外链以本表 URL 为准，不必强求 NotebookLM 索引网页

---

## 与实现的对应（速查）

| 实现问题 | 优先读源 |
|----------|----------|
| 消/翻/选中 ms | L-AX-08 · L-AX-04 · S-NNG-ANIM |
| 伪翻怎么做 | L-R1-FLIP · A-FLIP-* · L-AX-04 |
| 角标与红黑 | L-AX-02 · L-R1-READ · S-A11Y-CARD · S-WEBAIM-C |
| 事件与文案 | L-AX-03 · L-AX-08 §9 |
| 触控/safe-area | L-R1-WEB · L-D11 · S-MDN-* |
| 勿改规则 | L-FULL · L-D05 · L-HO-ART 红线 |
| 已知代码债 | L-AX-09 §3.2（refresh/flyAway） |

---

## 版本

| 版本 | 日期 | 变更 |
|------|------|------|
| **v1.0** | 2026-07-22 | 首版：Art/UX R0–R3.1 有效源；Notebook 配对牌项目笔记 |
