# 交接文档 · 配对牌实现开工

**更新：** 2026-07-23  
**状态：** 现行  
**权威级：** L1 交接  
**交接目的：** 新窗口 **只做实现**，不再做选型检索与产品发散。  
**仓库：** `/Users/wangzhixuan/Documents/Threejs_Work/Card`（根即 app）

> **强制顺序：**  
> 1. [`CURRENT.md`](./CURRENT.md)  
> 2. [`NOTES_PACK.md`](./NOTES_PACK.md)  
> 3. 相关钉 / design → 代码  
>
> 手感：[`handfeel/14`](../research/handfeel/14_physical_impl_pins.md) · [`19`](../research/handfeel/19_intent_impl_pins.md)  
> 问题：[`session_bugs`](./changelog/2026-07-23_session_bugs_and_fixes.md)  
> 后台：[`design/19`](./design/19_ios_renderer_lifecycle.md)（**D28**）

---

## 1. 一句话项目

欧美手机、机制向纸牌皮：**4×5 底层 + 向上层叠遮盖**（类羊了个羊，**不是**三角 Pyramid）+ **同点同色手动配对**（点选+拖放）+ **随时抽牌压栈** + 洗回 + **清谜题区胜利**；体验主轴 **顿悟**。

---

## 2. 已拍板（禁止回滚）

| ID | 内容 |
|----|------|
| D04 | 谜题区 = 4×5 底 + 分层遮盖 |
| D05–D09 | 同点配对；改选；随时抽；抽出叠仅顶可配；洗回 |
| D10 / D10b / D26 | 清桌胜；库=工具；清桌回收；残局 trim |
| D12 | **无默认 timer** |
| D15–D17 | Pixi8 单引擎 + DOM HUD；393×852；逻辑 isFree 拾取 |
| D19–D25 | 禁平行剥；精简 stock；单关无限；红黑；难度档；钥匙稀缺 |
| **D27 / D27b** | 公平钥匙 + Near-miss 发局 |
| **D28** | **渲染生命周期**：回前台 **整视图 rehydrate**（非 soft ticker） |

全文：[`design/04_decisions_log.md`](./design/04_decisions_log.md)

**否决：** Three 主渲染、双引擎、Chrome Device Mode 当验收、默认 timer、接龙核心。

---

## 3. 新窗口该读什么（按序）

| 顺序 | 路径 | 为什么 |
|------|------|--------|
| **1** | [`CURRENT.md`](./CURRENT.md) | 现行一页纸 |
| **2** | [`NOTES_PACK.md`](./NOTES_PACK.md) | 有效笔记白名单 |
| 3 | [`design/02`](./design/02_game_rules.md) · [`04`](./design/04_decisions_log.md) · [`05`](./design/05_board_layout_consensus.md) | 规则 / 决策 / 几何 |
| 4 | handfeel **14** · **19** · session_bugs | 手感与近期问题 |
| 5 | [`design/19`](./design/19_ios_renderer_lifecycle.md) | iOS 后台恢复（若动壳/渲染） |
| 6 | [`design/13`](./design/13_mvp_plan_and_todolist.md) | MVP 勾选（历史 Phase 仍可参考） |
| 7 | 代码 `src/` | L0 真相 |

**不必再读：** market 全库、tech-stack 噪声、已归档 changelog 过程条。

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

- [x] **内容 D21：单关无限 seed**（再来一局 / 重打 seed）  
- [ ] iPhone 15 关键清单（build 体积已有记录）  
- [ ] 2～3 人外放话术达标  
- [~] 教学/顿悟引导加强（可选）  

**缺口对齐：** 以 [`CURRENT`](./CURRENT.md) · [`session_bugs`](./changelog/2026-07-23_session_bugs_and_fixes.md) · 代码为准（旧 gap_vs_notes 已删）
**内容定稿：** `docs/changelog/2026-07-22_content_single_infinite.md`  

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
