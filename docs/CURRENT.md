# 现行系统 · 一页纸

**更新：** 2026-07-23  
**状态：** 现行  
**权威级：** L1 导航（细节以 **L0 代码** + 钉 / design 为准）  
**规范：** [`DOC_CONVENTIONS.md`](./DOC_CONVENTIONS.md) · **白名单：** [`NOTES_PACK.md`](./NOTES_PACK.md)

> 新会话：**先读本页 → NOTES_PACK → 再下钻。** 不要从 changelog 大海捞针。

---

## 1. 产品一句话

**4×5 层叠遮盖 + 同点同色手动配对 + 随时抽牌/洗回 + 清谜题区胜利。**  
体验主轴：**顿悟**（消序/抽序），不是接龙、不是默认 timer。

| 必读 | 路径 |
|------|------|
| 玩法 | [`design/02_game_rules.md`](./design/02_game_rules.md) |
| 决策 D01–D28 | [`design/04_decisions_log.md`](./design/04_decisions_log.md) |
| 牌阵几何 | [`design/05_board_layout_consensus.md`](./design/05_board_layout_consensus.md) |

---

## 2. 工程

```bash
npm install && npm run dev    # 桌面 393×852 phone-frame
npm test
npm run build
npm run cap:ios               # 打包 = build + sync + 开 Xcode
```

| 模块 | 路径 |
|------|------|
| 规则 | `src/core/` |
| 渲染 / 手感 | `src/render/cards.ts` · `phys.ts` |
| **视图生命周期** | `src/render/gameView.ts` · `src/native/appLifecycle.ts`（**D28**） |
| 贴图 | `src/render/cardAssets.ts`（CPU 缓存 + GPU 重烘焙） |
| 布局运行时 | `src/data/*Runtime.ts` |
| 输入 | `src/main.ts`（pointer · dropMatch · **rehydrate 后 rebind**） |
| 调参（仅桌面） | `src/ui/trayTuner.ts` |

### 2.1 后台恢复（D28）

| 原则 | 内容 |
|------|------|
| 权威 | `GameSession` / `GameState` 跨后台存活 |
| 易失 | Pixi + GPU 贴图 + CardRenderer **可整毁重建** |
| 回前台 | **必须** `GameView.rehydrate(state)`，禁止 soft render 当恢复 |
| 信号 | Capacitor `appStateChange` + visibility + pageshow |
| 全文 | [`design/19_ios_renderer_lifecycle.md`](./design/19_ios_renderer_lifecycle.md) |

---

## 3. 手感与操作（L1 钉）

| 主题 | 钉 | 说明 |
|------|-----|------|
| 物理手感 | [`handfeel/14`](../research/handfeel/14_physical_impl_pins.md) **v1.5** | meet/exit/选中/翻/抽洗 · pivot · busy |
| 拖动意图 | [`handfeel/19`](../research/handfeel/19_intent_impl_pins.md) | DropDecoder · 点选最近中心 |
| 参数表 | [`handfeel/18`](../research/handfeel/18_intent_features_params.md) | **以 `phys.ts` 覆盖为准** |
| 问题总表 | [`session_bugs`](./changelog/2026-07-23_session_bugs_and_fixes.md) | **B1–B15** |

**玩家向摘要**

- **拖消：** 可配优先 + 多探针 + 重叠 + 方向趋势；拖中 z=9900  
- **点选：** 扩热区 + 最近 free 牌心  
- **抽叠：** 线框常显；座位影有牌才显；消废自动补抽有动画；蒙黑仅抽牌翻面  

**布局默认（调参定稿）**

| 区 | 默认 |
|----|------|
| 谜题顶 Y | **190** |
| 抽牌托盘 | y=600 · w=325 · h=150 · gap=50 · peek=8 |
| 牌阴影 | offsetY=-2 · scale=1.02 · alpha=0.15 |

---

## 4. 近期纪要（L4 · 按需）

| 文档 | 何时打开 |
|------|----------|
| [session_bugs](./changelog/2026-07-23_session_bugs_and_fixes.md) | 查「改过什么问题」 |
| [renderer_rehydrate](./changelog/2026-07-23_renderer_rehydrate.md) | D28 实现细节 |
| [ios_roundup](./changelog/2026-07-23_ios_roundup.md) | 真机壳 / 打包 |
| [drag_intent_drop_decode](./changelog/2026-07-23_drag_intent_drop_decode.md) | 松手解码 |
| [drawzone_z_autodraw_dim](./changelog/2026-07-23_drawzone_z_autodraw_dim.md) | 抽叠 / z / dim |
| [full_roundup 07-22](./changelog/2026-07-22_full_roundup.md) | Level01 规则向 |

其余 changelog = 实现史，见 [`NOTES_PACK` §4 归档](./NOTES_PACK.md)。

---

## 5. 检索归档（L5 · 只读）

| 轨 | 入口 |
|----|------|
| 手感 | [`handfeel/00_INDEX`](../research/handfeel/00_INDEX.md) |
| Art/UX | [`art-ux/00_INDEX`](../research/art-ux/00_INDEX.md) |
| 路径锁 | [`path-lock/00_INDEX`](../research/path-lock/00_INDEX.md) |
| 技术栈 | [`tech-stack/00_RESEARCH_INDEX`](../research/tech-stack/00_RESEARCH_INDEX.md) |
| 市场 | [`sorting-market/00_RESEARCH_INDEX`](../research/sorting-market/00_RESEARCH_INDEX.md) |

---

## 6. 导航

| 文档 | 用途 |
|------|------|
| [`NOTES_PACK.md`](./NOTES_PACK.md) | **有效笔记白名单** |
| [`NOTES_AUDIT.md`](./NOTES_AUDIT.md) | **过时 / 重复 / 老源审查** |
| [`00_INDEX.md`](./00_INDEX.md) | 全库索引 |
| [`HANDOFF_IMPLEMENTATION.md`](./HANDOFF_IMPLEMENTATION.md) | 实现交接 |
| [`HANDOFF_ART_UX.md`](./HANDOFF_ART_UX.md) | 美术体验交接 |
| [`DOC_CONVENTIONS.md`](./DOC_CONVENTIONS.md) | 怎么写文档 |

---

## 7. NotebookLM

| 笔记本 | ID |
|--------|-----|
| poker类手感调优 | `b0897377-3dc5-48c2-bc98-554cb380d352` |
| 配对牌项目笔记 | `8accbc6d-2100-42dd-b94f-54be4a93740b` |

入库清单见 [`NOTES_PACK` §6](./NOTES_PACK.md)（约 50 源上限）。
