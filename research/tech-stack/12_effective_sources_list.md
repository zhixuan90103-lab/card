# 有效来源 List · 技术选型 / 配对牌项目

**整理日期：** 2026-07-21  
**Notebook：** 配对牌项目笔记  
**ID：** `8accbc6d-2100-42dd-b94f-54be4a93740b`  

**证据等级：**  
| 级 | 含义 |
|----|------|
| **S** | 官方文档 / npm / 权威规格 |
| **A** | 高质量开源模板 / 社区可复现 |
| **B** | 旁证（issue、通用教程）— 不单独拍板 |
| **L** | 本项目本地合成（决策与计划） |

**纪律：** 结论优先 **L + S + A**；B 仅作风险提示；噪声源（见附录）**不入库**。

**拍板一句：** PixiJS **8.19.0** + 设计分辨率 **393×852** phone-frame + **逻辑 AABB hit-test**（D15–D17）。

---

## 入库优先级

| 批 | 类型 | 说明 |
|----|------|------|
| **P0** | L 本地决策/规范 md | 规则、选型、视口、反查 — NotebookLM **必收** |
| **P1** | S 官方 URL | Pixi Events/性能/Assets；iPhone 规格；Three Raycaster（否决依据） |
| **P2** | A 开源模板 URL | open-games、Solitaire、Match3、麻将层叠 |
| **P3** | L 检索精炼 notes | T6 综合、内部复用、官方摘录 |
| — | B / 噪声 | **默认不入库**（附录列出） |

---

## P0 · 本地产品与决策（L）— 路径

根：`docs/design/` 与 `docs/`

| ID | 文件 | 内容 |
|----|------|------|
| L-D00 | `docs/00_INDEX.md` | 文档总索引 |
| L-D02 | `docs/design/02_game_rules.md` | 规则 v0.3 |
| L-D04 | `docs/design/04_decisions_log.md` | D01–D17 / 否决项 |
| L-D05 | `docs/design/05_board_layout_consensus.md` | 4×5 层叠共识 |
| L-D08 | `docs/design/08_prototype_scope.md` | 原型范围 + 技术硬约束 |
| L-D09 | `docs/design/09_tech_research_plan.md` | **检索计划 v3 结案** |
| L-D10 | `docs/design/10_tech_decision.md` | **技术方案拍板** |
| L-D11 | `docs/design/11_viewport_iphone15.md` | **视口与真机清单** |
| L-D12 | `docs/design/12_tech_gap_audit.md` | 技术反查第二轮 |
| L-D07 | `docs/design/07_glossary.md` | 术语（含工程词） |

可选（体验/定位，非技术主源）：`01` `03` `06`

---

## P0b · 本地技术检索合成（L）

根：`research/tech-stack/`

| ID | 文件 | 内容 |
|----|------|------|
| L-T00 | `00_RESEARCH_INDEX.md` | 技术检索索引与可信度 |
| L-T12 | `12_effective_sources_list.md` | **本表** |
| L-T-syn | `notes/t6_round_synthesis.md` | T6-P 综合结论 |
| L-T-reuse | `notes/t6_internal_reuse.md` | Yaran=Pixi / Bag 视口 |
| L-T-off4 | `sources/t4_official_hit.md` | Events + Raycaster 精炼 |
| L-T-off6 | `sources/t6_official_perf_atlas.md` | 性能/Assets/版本/包体旁证 |

---

## P1 · 官方（S）— URL

### PixiJS v8（主引擎）

| ID | URL | 支撑 |
|----|-----|------|
| S-PX-E | https://pixijs.com/8.x/guides/components/events | eventMode、顶层 hit、hitArea |
| S-PX-P | https://pixijs.com/8.x/guides/concepts/performance-tips | 图集合批、移动端、事件优化 |
| S-PX-A | https://pixijs.com/8.x/guides/components/assets | Assets / spritesheet |
| S-PX-M | https://pixijs.com/8.x/guides/migrations/v8 | v8 API 与默认 eventMode |
| S-PX-NPM | https://www.npmjs.com/package/pixi.js | 版本 **8.19.0**（检索日） |
| S-PX-REL | https://github.com/pixijs/pixijs/releases | 发布与安装 |

### 视口 / iPhone 15

| ID | URL | 支撑 |
|----|-----|------|
| S-IP15 | https://useyourloaf.com/blog/iphone-15-screen-sizes/ | 393×852 @3x |
| S-PWA | https://karmasakshi.medium.com/make-your-pwas-look-handsome-on-ios-fd8fdfcd5777 | viewport-fit / safe-area |
| S-PIC | https://github.com/rcarmo/piclaw/blob/main/docs/PWA.md | PWA 视口坑（旁证偏强，可入库） |
| S-SAFE | https://www.consolelog.tools/tools/safe-area-calculator | safe-area 计算参考 |

### Three.js（否决主渲染的证据，非实现依赖）

| ID | URL | 支撑 |
|----|-----|------|
| S-TH-R | https://threejs.org/docs/#api/en/core/Raycaster.intersectObject | 交点按 distance 排序 |
| S-TH-O | https://dustinpfister.github.io/2018/05/17/threejs-camera-orthographic/ | 正交相机基线 |

### 包体旁证（非本仓 build）

| ID | URL | 支撑 |
|----|-----|------|
| S-BP-PX | https://bundlephobia.com/package/pixi.js@8.19.0 | gzip 量级旁证 |
| S-BP-TH | https://bundlephobia.com/package/three@0.185.1 | 对照；**不因包体改引擎** |

---

## P2 · 开源模板（A）— URL

| ID | URL | 可抄 |
|----|-----|------|
| A-OG | https://github.com/pixijs/open-games | TS 工程、资源管线 |
| A-SOL | https://github.com/s2031215/PixiJS-Solitaire | 纸牌点击（v4 API 仅参考） |
| A-M3 | https://github.com/gamedevland/match3 | 网格精灵 / 输入 |
| A-M3t | https://gamedev.land/match3/ | 教程 |
| A-MJ | https://github.com/danbeck/green-mahjong | 层叠可点思路（HTML） |
| A-SOL2 | https://stackoverflow.com/questions/159547/mahjong-solitaire-arrange-tiles-to-ensure-at-least-one-path-to-victory-regard | 可解布局（关卡二期） |

次优先（可选入库）：

| ID | URL | 备注 |
|----|-----|------|
| A-MEM | https://github.com/MiguelGregorio/Three.js-MemoryGame | 证明 Three 能做牌，非推荐路径 |
| A-DEV | https://dev.to/itxtoledo/getting-started-with-pixijs-v8-quick-start-guide-26fm | v8 上手 |

---

## P3 · 社区/规格旁证（B · 精选可入库）

| ID | URL | 用途 |
|----|-----|------|
| B-CSS | https://stackoverflow.com/questions/53935670/responsively-resize-html-div-within-parent-both-letterbox-and-pillarbox-css-on | letterbox CSS |
| B-EMU | https://github.com/amirshnll/custom-device-emulation-chrome | Chrome 设备 393×852 |
| B-TEX | https://stackoverflow.com/questions/41977621/three-js-4k-video-texture-mobile-no | 移动端纹理 4096 共识 |
| B-PH1 | https://github.com/raydian/html5-device-frame | phone 框皮肤（非必须） |
| B-PH2 | https://github.com/DevManSam777/device-mockup | 同上 |

Three 正交坑（支持 X08，可选）：

| ID | URL |
|----|-----|
| B-TH1 | https://stackoverflow.com/questions/63083684/how-to-use-three-js-raycaster-with-orthographiccamera-with-negative-near-plane |
| B-TH2 | https://github.com/mrdoob/three.js/issues/13751 |
| B-TH3 | https://discourse.threejs.org/t/raycaster-with-orthographic-camera-and-z-position/43881 |

---

## 内部资产（不进 NotebookLM 外链，本地笔记已摘要）

| 路径 | 可复用 |
|------|--------|
| `Threejs_Work/NewYaran_game/yaran-game` | **pixi.js ^8.14** + AssetPack |
| `Threejs_Work/Bag` | safe-area + visualViewport resize |

详见 `notes/t6_internal_reuse.md`（已在 P0b）。

---

## 附录 · 噪声 / 弱源 — **不入库**

| 本地笔记 | 原因 |
|----------|------|
| `sources/t1_pixi.md` 主体 | issue 堆，非能力基线 |
| `sources/t3_phone_frame.md` | 混入 Kaplay / 无关游戏 |
| `sources/t4_logic_hit.md` | 通用物理，非牌 |
| `sources/t6_atlas.md` | 检索跑偏 Phaser 等 |
| `sources/t6_pixi_mobile_perf.md` 中纯 bug 列表 | 风险提示用，不单独入库 |

对应远端若仅为「awesome list / 无关 changelog」——跳过。

---

## NotebookLM 建议导入批次

### 批 1 · 本地 L（优先）

```text
docs/design/10_tech_decision.md
docs/design/11_viewport_iphone15.md
docs/design/09_tech_research_plan.md
docs/design/12_tech_gap_audit.md
docs/design/04_decisions_log.md
docs/design/02_game_rules.md
docs/design/08_prototype_scope.md
docs/design/05_board_layout_consensus.md
research/tech-stack/00_RESEARCH_INDEX.md
research/tech-stack/12_effective_sources_list.md
research/tech-stack/notes/t6_round_synthesis.md
research/tech-stack/notes/t6_internal_reuse.md
research/tech-stack/sources/t4_official_hit.md
research/tech-stack/sources/t6_official_perf_atlas.md
```

### 批 2 · 官方 S URL

```text
S-PX-E, S-PX-P, S-PX-A, S-PX-M, S-IP15, S-PWA, S-TH-R
```

### 批 3 · 模板 A URL

```text
A-OG, A-SOL, A-M3, A-MJ
```

---

## 与市场调研 notebook 分工

| Notebook | ID | 内容 |
|----------|-----|------|
| 配对牌项目笔记 | `8accbc6d-2100-42dd-b94f-54be4a93740b` | **本表** + 产品/技术决策 |
| 排序归位整理调研 | `c4153ca3-4bce-43da-9c56-0ae6d3f367c2` | 品类调研；见 `sorting-market/12_effective_sources_list.md` |

---

## NotebookLM 入库记录（2026-07-21）

**目标本：** 配对牌项目笔记 `8accbc6d-2100-42dd-b94f-54be4a93740b`

| 批次 | 结果 |
|------|------|
| 本地 L（15 个 md） | ✅ 已 `source add`；含 10/11/09/12 反查、规则、本表、T6 精炼 |
| 官方 S URL（7） | ✅ Pixi Events/性能/Assets/v8 迁移；iPhone15；PWA；Three Raycaster |
| 模板 A URL（4） | ✅ open-games、Solitaire、match3、green-mahjong |
| npmjs pixi.js | ⚠️ 抓取可能被 Cloudflare（标题 “Just a moment...”）；版本以 L 文档 **8.19.0** 为准 |

说明：笔记本中若已有旧版 `02`/`04` 等，可能出现**同名双份**；以时间较新的技术拍板文（10/11/09 v3）为准。
