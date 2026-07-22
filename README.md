# Card · 配对牌项目说明

欧美手机、机制向、重体验。  
当前产品：**纸牌题材 + 4×5 层叠遮盖（类羊了个羊）+ 同点手动配对**（非接龙、非经典三角纸牌塔）。

---

## 文档从哪读

| 优先级 | 路径 | 内容 |
|--------|------|------|
| **P0** | [`docs/00_INDEX.md`](docs/00_INDEX.md) | 文档总索引 |
| **P0** | [`docs/design/02_game_rules.md`](docs/design/02_game_rules.md) | **现行玩法规则 v0.3** |
| **P0** | [`docs/design/05_board_layout_consensus.md`](docs/design/05_board_layout_consensus.md) | 牌阵几何共识（防混淆） |
| **P0** | [`docs/design/01_vision_and_positioning.md`](docs/design/01_vision_and_positioning.md) | 体验定位 |
| P1 | [`docs/design/03_experience_and_innovation.md`](docs/design/03_experience_and_innovation.md) | 顿悟 / 雷区 |
| P1 | [`docs/design/04_decisions_log.md`](docs/design/04_decisions_log.md) | 已定·待定·否决 |
| P1 | [`docs/design/06_doc_gap_audit.md`](docs/design/06_doc_gap_audit.md) | **文档反查补漏** |
| P1 | [`docs/design/08_prototype_scope.md`](docs/design/08_prototype_scope.md) | 原型最小范围 |
| **P0** | [`docs/HANDOFF_IMPLEMENTATION.md`](docs/HANDOFF_IMPLEMENTATION.md) | **实现交接（新窗口请先读）** |
| **P0** | [`docs/design/13_mvp_plan_and_todolist.md`](docs/design/13_mvp_plan_and_todolist.md) | **MVP 计划 + Todo List** |
| P1 | [`docs/design/10_tech_decision.md`](docs/design/10_tech_decision.md) | **技术方案拍板：PixiJS v8** |
| P1 | [`docs/design/11_viewport_iphone15.md`](docs/design/11_viewport_iphone15.md) | **393×852 + PC 手机框** |
| P1 | [`docs/design/12_tech_gap_audit.md`](docs/design/12_tech_gap_audit.md) | **技术反查（检索结案）** |
| P1 | [`docs/design/09_tech_research_plan.md`](docs/design/09_tech_research_plan.md) | 技术检索计划 **v3** + POC 清单 |
| P1 | [`research/sorting-market/00_RESEARCH_INDEX.md`](research/sorting-market/00_RESEARCH_INDEX.md) | 市场调研 |
| P1 | [`research/tech-stack/00_RESEARCH_INDEX.md`](research/tech-stack/00_RESEARCH_INDEX.md) | 技术栈检索源 |
| P1 | [`research/tech-stack/12_effective_sources_list.md`](research/tech-stack/12_effective_sources_list.md) | **技术有效来源 List（已入配对牌笔记）** |
| P2 | NotebookLM `配对牌项目笔记` | 设计+调研入库 |
| P2 | NotebookLM `排序，归位，整理类游戏调研` | 调研 URL 源库 |

---

## 当前产品一句话

> **4×5 底层 + 向上分层遮盖**（类《羊了个羊》）；**手动点两张同点数**消除；**随时抽牌**，抽出叠仅顶张可用；抽完洗回；**清空谜题区即胜利**。

---

## 工程（仓库根即 app）

脚手架在 **`Card/` 根目录**（非 `Card/app/`）：

```bash
npm install
npm run dev      # phone-frame 内可玩 M0
npm test         # core 规则单测
npm run build
```

技术硬约束：PixiJS **8.19.x** · 设计分辨率 **393×852** · 逻辑 hit-test · `core/` 零 Pixi。

## 目录结构

```text
Card/
├── package.json / vite.config.ts / index.html
├── src/
│   ├── core/        # 纯 TS 规则（Vitest）
│   ├── render/      # Pixi 镜像
│   ├── ui/          # DOM HUD
│   ├── viewport/    # 393×852 · phone-frame
│   ├── data/        # level JSON
│   └── main.ts
├── docs/
│   ├── HANDOFF_IMPLEMENTATION.md
│   └── design/      # 01～13
└── research/
```

---

## 状态摘要

| 模块 | 状态 |
|------|------|
| 品类调研 | ✅ |
| 体验主轴：顿悟 | ✅ |
| 规则主干 v0.3 | ✅ |
| 几何：4×5 层叠（非三角塔） | ✅ |
| 文档反查补漏 | ✅ 见 `06` |
| **M0 垂直切片** | ✅ Phase A～C：1 关可玩 + core 单测 |
| **M1 多关演示** | ✅ Phase D：12 关 + 教学/顿悟 + 下一关 + 软卡/死局（E 真机/外放待做） |
| 钥匙特殊规则 | ⏸ 第一版不做 |

---

## NotebookLM

| 笔记本 | ID |
|--------|-----|
| **配对牌项目笔记** | `8accbc6d-2100-42dd-b94f-54be4a93740b` |
| 排序，归位，整理类游戏调研 | `c4153ca3-4bce-43da-9c56-0ae6d3f367c2` |
