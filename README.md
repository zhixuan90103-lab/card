# Card · 配对牌项目说明

欧美手机、机制向、重体验。  
当前产品：**纸牌题材 + 4×5 层叠遮盖（类羊了个羊）+ 同点手动配对**（非接龙、非经典三角纸牌塔）。

---

## 文档从哪读

```text
docs/CURRENT.md     → 现行一页纸（先读）
docs/NOTES_PACK.md  → 有效笔记白名单与认序
docs/00_INDEX.md    → 全库导航
```

| 优先级 | 路径 | 内容 |
|--------|------|------|
| **P0** | [`docs/CURRENT.md`](docs/CURRENT.md) | **现行系统一页纸** |
| **P0** | [`docs/NOTES_PACK.md`](docs/NOTES_PACK.md) | **哪些笔记算有效** |
| **P0** | [`docs/DOC_CONVENTIONS.md`](docs/DOC_CONVENTIONS.md) | 文档层级 L0–L5 |
| **P0** | [`docs/design/02_game_rules.md`](docs/design/02_game_rules.md) · [`04`](docs/design/04_decisions_log.md) | 规则 / 决策 D01–D28 |
| **P0** | [`research/handfeel/14`](research/handfeel/14_physical_impl_pins.md) · [`19`](research/handfeel/19_intent_impl_pins.md) | 手感钉 |
| **P0** | [`docs/design/19_ios_renderer_lifecycle.md`](docs/design/19_ios_renderer_lifecycle.md) | **D28** 后台 rehydrate |
| P1 | [`docs/HANDOFF_IMPLEMENTATION.md`](docs/HANDOFF_IMPLEMENTATION.md) · [`HANDOFF_ART_UX`](docs/HANDOFF_ART_UX.md) | 交接 |
| P1 | [`docs/changelog/2026-07-23_session_bugs_and_fixes.md`](docs/changelog/2026-07-23_session_bugs_and_fixes.md) | 问题总表 |
| P2 | `docs/changelog/**` · `research/**` | 实现史 / 检索归档 |

---

## 当前产品一句话

> **4×5 底层 + 向上分层遮盖**（类《羊了个羊》）；**手动点两张同点数**消除；**随时抽牌**，抽出叠仅顶张可用；抽完洗回；**清空谜题区即胜利**。

---

## 工程（仓库根即 app）

脚手架在 **`Card/` 根目录**（非 `Card/app/`）：

```bash
npm install
npm run dev      # phone-frame 内可玩
npm test         # core 规则单测
npm run build
npm run cap:ios  # 真机：build + sync + 开 Xcode
```

技术硬约束：PixiJS **8.19.x** · **393×852** · 逻辑 hit-test · `core/` 零 Pixi · **D28** 后台 rehydrate · **D29** 优先 WebGPU / 回退 WebGL（`?renderer=webgl` 可强制）。

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
