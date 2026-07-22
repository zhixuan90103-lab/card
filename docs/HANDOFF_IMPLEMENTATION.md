# 交接文档 · 配对牌实现开工

**日期：** 2026-07-21  
**交接目的：** 新窗口 / 新会话 **只做实现**，不再做选型检索与产品发散。  
**仓库根目录：** `/Users/wangzhixuan/Documents/Threejs_Work/Card`  
（当前几乎只有 `docs/` + `research/`，**尚无业务 `src/` 工程**。）

---

## 1. 一句话项目

欧美手机、机制向纸牌皮：**4×5 底层 + 向上层叠遮盖**（类羊了个羊，**不是**三角 Pyramid Solitaire）+ **同点数手动点两张消** + **随时抽牌压栈** + 抽出叠洗回 + **清谜题区胜利**；体验主轴 **顿悟**（要想消序/抽序，不是狂抽、不是接龙）。

---

## 2. 已拍板（禁止回滚）

| ID | 内容 |
|----|------|
| D04 | 谜题区 = 4×5 底 + 分层遮盖 |
| D05–D09 | 同点配对；改选；随时抽；抽出叠仅顶可配；洗回 |
| D10 / D10b | 胜利 = 只清谜题区；抽牌区 = 工具，清桌回收未用库 |
| D12 | **无默认 timer** |
| D19 / D20 | 禁平行剥（同顶次顶互异）；stock 精简（禁 pad-16） |
| **D15** | 主渲染 **PixiJS 8.19.x** 单引擎；HUD 用 **DOM** |
| **D16** | 设计分辨率 **393×852**；PC **phone-frame letterbox** |
| **D17** | 可点集 = **逻辑 isFree + AABB**（引擎不单独决定合法性） |

**否决：** Three 作主渲染、双引擎、仅靠 Chrome Device Mode 当验收、默认 timer、接龙核心。

全文：`docs/design/04_decisions_log.md`

---

## 3. 新窗口该读什么（按序）

| 顺序 | 路径 | 为什么 |
|------|------|--------|
| **1** | **`docs/design/13_mvp_plan_and_todolist.md`** | **执行圣经：M0/M1 + Phase A～E Todo** |
| 2 | `docs/design/08_prototype_scope.md` | 范围边界 |
| 3 | `docs/design/02_game_rules.md` | 规则 v0.3 |
| 4 | `docs/design/10_tech_decision.md` | 架构 / 目录 / 依赖 |
| 5 | `docs/design/11_viewport_iphone15.md` | 视口 CSS / 真机清单 |
| 6 | `docs/design/03_experience_and_innovation.md` | 顿悟验收话术 |
| 7 | `docs/design/07_glossary.md` | 禁用「三角塔/接龙」等词 |

索引：`docs/00_INDEX.md` · 根说明：`README.md`

**不必再读：** 完整 market 调研全库、tech-stack 噪声 notes（选型已结案）。  
若卡引擎细节：优先 Pixi 官方 Events / Performance Tips（见 `research/tech-stack/12_effective_sources_list.md`）。

---

## 4. MVP 怎么切

| 档 | 含义 | 门禁 |
|----|------|------|
| **M0** | 垂直切片：phone-frame + **1 关**完整规则循环 | 消/抽/洗/胜 + 遮挡正确 + core 单测 |
| **M1** | 10～15 关 + 教学 + ≥3 顿悟关 + 真机关键项 | 外放话术达标 |

**纪律：未过 M0 前，不铺 15 关美术与文案。**

详细勾选表：`13` 全文（含 NotebookLM 审查补丁：E2b visualViewport、E2c WebGL context lost、B7 洗回打乱、D3 insightNote）。

---

## 5. 第一步（从这里动手）

打开 `13` → **Phase A**：

1. **A1** Vite + TypeScript 工程（建议 monorepo 根即 `Card/`，或 `Card/app/`，二选一并在 README 写清）  
2. **A2** `pixi.js@8.19.0`（或 `^8.19.0`）  
3. **A3** 目录：

```text
src/
  core/       # 纯 TS 规则，零 Pixi，Vitest
  render/     # Pixi 镜像 state
  ui/         # DOM HUD
  viewport/   # 393×852、phone-frame、screenToDesign
  data/       # level JSON
  main.ts
```

4. **A4–A6** phone-frame + design 坐标 + Pixi 挂载  
5. **Phase B** 规则 core + 单测  
6. **Phase C** 渲染/输入 → **M0 门禁**

单人参考节奏：`13` §6（约 Day1 框+点选逻辑，Day2～3 M0）。

---

## 6. 技术约束速查

```text
DESIGN_WIDTH  = 393
DESIGN_HEIGHT = 852
主引擎         = pixi.js 8.19.x
UI            = DOM 叠在 #phone-frame 内
点击          = screen → design → pickCard(isFree ∩ AABB, z desc)
PC 预览       = letterbox contain，禁止 cover 裁切玩法区
MAX_DPR       = 2 或 3
真机验收      = iPhone 15 Safari（见 11 §6）
```

**可复用内部参考（只抄模式，勿整仓拷贝）：**

- `Threejs_Work/NewYaran_game/yaran-game`：已是 **Pixi ^8.14** + AssetPack  
- `Threejs_Work/Bag`：`safe-area` + `visualViewport` resize  

---

## 7. 明确不要做

- 再开 Three vs Pixi 选型 / 双引擎 POC  
- **千关**生成器、广告、IAP、锁钥**特殊皮肤**、进槽三消  
  （Level01 的 seed 配点 + 无皮肤硬锁 **已做，属允许范围**）  
- 默认 timer  
- 把「金字塔」做成三角接龙塔  
- 未过 M0 就上完整图集管线 / 性能压测周  
- 改写已定规则去「创新」机制（除非用户明确改 D 表）

---

## 8. 验收话术（外放时对照）

合格玩家应能说出类：

- 「要想一下消哪对 / 要不要抽」  
- 「消了会掀开」  
- 「不是接龙」  

失败信号：全员狂抽无脑过关；被当成 FreeCell/蜘蛛；频繁「点不了」。

---

## 9. NotebookLM（可选）

| 本 | ID |
|----|-----|
| 配对牌项目笔记 | `8accbc6d-2100-42dd-b94f-54be4a93740b` |
| 品类调研本 | `c4153ca3-4bce-43da-9c56-0ae6d3f367c2`（实现可不打开） |

`13` 已入库（ready）；实现阶段以 **仓库 md + 代码** 为准，笔记仅辅助问答。

---

## 10. 完成定义（交给新窗口的「Done」）

### M0 Done

- [x] `npm run dev` 在 phone-frame 内可玩 **1 关**  
- [x] 规则：遮挡 / 同点消 / 抽洗 / 胜利 / 无 timer / 撤销或重开  
- [x] `core` 关键路径有 Vitest  
- [x] 未引入 `three`  
- [x] `13` 中 Phase A～C 与 M0 门禁可勾  

### M1 Done（可第二段再开）

- [ ] 10～15 关 + 教学 + 顿悟关 **（现仅 Level01 单模板 + seed）**  
- [ ] iPhone 15 关键清单（build 体积已有记录）  
- [ ] 2～3 人外放话术达标  

**缺口对齐：** `docs/changelog/2026-07-22_gap_vs_notes.md`  

---

## 11. 给执行 Agent 的开场提示（可直接粘贴）

```text
你在仓库 Card（Threejs_Work/Card）做配对牌 MVP 实现。

先读 docs/HANDOFF_IMPLEMENTATION.md 与 docs/design/13_mvp_plan_and_todolist.md。
严格遵守 D15 Pixi 8.19、D16 393×852 phone-frame、D17 逻辑 hit-test；core 与渲染分离。

从 13 的 Phase A1 开始：Vite+TS 脚手架 → phone-frame → core 规则单测 → 1 关可玩（M0）。
未过 M0 不做 15 关与美术膨胀。不要重做技术选型。
每完成一个 Phase 勾选 13 的 Todo，并简短汇报。
```

---

## 12. 变更

| 日期 | 说明 |
|------|------|
| 2026-07-21 | 首建实现交接；选型/文档阶段结束，进入编码 |
