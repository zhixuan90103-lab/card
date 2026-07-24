# 有效笔记包 · Effective Notes Pack

**更新：** 2026-07-24  
**状态：** 现行  
**权威级：** L1 导航  
**规范：** [`DOC_CONVENTIONS.md`](./DOC_CONVENTIONS.md)  
**用途：** 规定「读什么、认谁、入库什么」；未列入的笔记默认可归档，不当真理。

---

## 0. 30 秒读法

```text
1. CURRENT.md          ← 现行一页纸
2. 本页 NOTES_PACK     ← 白名单与认序
3. 需要改什么再下钻钉 / design / 代码
```

**冲突认序（强制）：**

```text
L0 代码  >  L1 钉 / design 现行  >  CURRENT  >  L3 问题总表  >  L4 专项 changelog  >  L5 检索归档
```

---

## 1. 核心白名单（每日 / 新会话）

| 序 | 文档 | 级 | 一句 |
|----|------|-----|------|
| 1 | [`CURRENT.md`](./CURRENT.md) | 导航 | 现行系统一页纸 |
| 2 | [`DOC_CONVENTIONS.md`](./DOC_CONVENTIONS.md) | 规范 | L0–L5 与写法 |
| 3 | [`design/02_game_rules.md`](./design/02_game_rules.md) | L2 | 玩法规则 |
| 4 | [`design/04_decisions_log.md`](./design/04_decisions_log.md) | L2 | 决策 **D01–D29**（含 **D29 WebGPU 优先**） |
| 5 | [`design/05_board_layout_consensus.md`](./design/05_board_layout_consensus.md) | L2 | 牌阵几何 |
| 6 | [`design/19_ios_renderer_lifecycle.md`](./design/19_ios_renderer_lifecycle.md) | L2 | **D28 / D30** 状态权威；iOS WebView 可丢弃 |
| 7 | [`../research/handfeel/14_physical_impl_pins.md`](../research/handfeel/14_physical_impl_pins.md) | **L1** | 物理手感钉 v1.5 |
| 8 | [`../research/handfeel/19_intent_impl_pins.md`](../research/handfeel/19_intent_impl_pins.md) | **L1** | 拖意图钉（已落地） |
| 9 | [`changelog/2026-07-23_session_bugs_and_fixes.md`](./changelog/2026-07-23_session_bugs_and_fixes.md) | **L3** | 问题总表 B1–B15 |

**L0 代码（高于一切笔记）：**

```text
src/core/          规则 · GameSession
src/render/        cards · phys · gameView · cardAssets · app · **gpu/**（WebGPU-first）
src/native/        appLifecycle · haptics
src/main.ts        输入 · rebind · 局循环
src/data/*Runtime  布局/阴影运行时默认
```

---

## 2. 按主题深挖（有效 · 非每日必读）

| 主题 | 读 | 级 |
|------|-----|-----|
| 拖消松手 | [`changelog/2026-07-23_drag_intent_drop_decode.md`](./changelog/2026-07-23_drag_intent_drop_decode.md) | L4 |
| 抽叠 / z / 自动抽 / dim | [`changelog/2026-07-23_drawzone_z_autodraw_dim.md`](./changelog/2026-07-23_drawzone_z_autodraw_dim.md) | L4 |
| 意图参数表 | [`handfeel/18`](../research/handfeel/18_intent_features_params.md)（以 `phys.ts` 为准） | L1 辅 |
| iOS 真机总整理 | [`changelog/2026-07-23_ios_roundup.md`](./changelog/2026-07-23_ios_roundup.md) | L4 |
| iOS 回前台白屏根治 | [`changelog/2026-07-24_ios_scene_bridge_rebuild.md`](./changelog/2026-07-24_ios_scene_bridge_rebuild.md) | L4 |
| iOS rehydrate 实现 | [`changelog/2026-07-23_renderer_rehydrate.md`](./changelog/2026-07-23_renderer_rehydrate.md) | L4 |
| **WebGPU 后端** | **D29** · [`20` 结案](./design/20_webgpu_research_plan.md) · L0 `src/render/gpu/` | L2/L0 |
| iPhone 打包清单 | [`changelog/2026-07-23_ios_iphone_checklist.md`](./changelog/2026-07-23_ios_iphone_checklist.md) | L4 |
| 视口 393×852 | [`design/11_viewport_iphone15.md`](./design/11_viewport_iphone15.md) | L2 |
| Level01 规则向总表 | [`changelog/2026-07-22_full_roundup.md`](./changelog/2026-07-22_full_roundup.md) | L4 |
| 钥匙 / near-miss | [`d27_fair_keys`](./changelog/2026-07-22_d27_fair_keys.md) · [`near_miss_p0`](./changelog/2026-07-22_near_miss_p0.md) | L4 |
| 有效源 · 意图 | [`handfeel/20`](../research/handfeel/20_intent_effective_sources_list.md) | 源 |
| 有效源 · 物理手感 | [`handfeel/12`](../research/handfeel/12_effective_sources_list.md) | 源 |
| 有效源 · 进关发牌 | [`handfeel/21`](../research/handfeel/21_deal_anim_effective_sources_list.md) | 源 |
| 动画优化建议 | [`handfeel/22`](../research/handfeel/22_animation_optimization_guide.md) | 建议稿 |

---

## 3. 角色阅读路径

| 角色 | 路径 |
|------|------|
| **新会话 / 任意开工** | CURRENT → 本页 → 相关钉/design → 代码 |
| **改玩法** | 02 · 04 · 05 → core |
| **改手感/拖消** | 14 · 19 · session_bugs → phys / cards / main |
| **改 iOS / 后台空白** | **design/19 · D30** → SceneDelegate · AppViewController · main snapshot → ios_scene_bridge_rebuild |
| **改渲染后端 WebGPU** | **D29** · `src/render/gpu/` · design/19 |
| **打包真机** | ios_roundup · iphone_checklist · `npm run cap:ios` |
| **美术** | HANDOFF_ART_UX · design/18 · art-ux 钉 |
| **查历史** | changelog 目录（L4，不当现行） |

交接入口：[`HANDOFF_IMPLEMENTATION.md`](./HANDOFF_IMPLEMENTATION.md) · [`HANDOFF_ART_UX.md`](./HANDOFF_ART_UX.md)  
全库导航：[`00_INDEX.md`](./00_INDEX.md)

---

## 4. 清理策略（2026-07-23 **已执行删除**）

| 已删 | 认谁 |
|------|------|
| 07-23 手感分条 changelog | **14** + session_bugs |
| 07-22 过程噪声 / 误导座位影条 | full_roundup + 钉 |
| handfeel `01–11/13` · 全部 `fa_*` | **14** + phys |
| art-ux `03` / `04` / `08` | **14** + phys · design **18** |

| 仍留（不当真） | 说明 |
|----------------|------|
| design/06·09·12·16·17 | 反查 / 计划史 |
| path-lock · market · tech-stack | L5 |
| `pf_*` · `intent_*` | 旁证源卡 |

**禁止**用旧 H-* 覆盖 `phys.ts`。

---

## 5. 有效 vs 无效（纪律）

| ✅ 有效 | ❌ 无效 |
|--------|---------|
| §1 白名单 + §2 深挖 | 已删文件的残留链接 / 旧 NLM 源 |
| L1 钉 + phys | 用计划参数覆盖 phys |
| D28 / D30 design/19 | soft ticker 当恢复；iOS native 只 reload 旧页面 |

---

## 6. NotebookLM 入库白名单（省配额）

单本约 **50 source**。优先只收：

```text
CURRENT.md
DOC_CONVENTIONS.md
NOTES_PACK.md
design/02_game_rules.md
design/04_decisions_log.md
design/19_ios_renderer_lifecycle.md
research/handfeel/14_physical_impl_pins.md
research/handfeel/19_intent_impl_pins.md
research/handfeel/20_intent_effective_sources_list.md
research/handfeel/21_deal_anim_effective_sources_list.md
research/handfeel/22_animation_optimization_guide.md
changelog/2026-07-23_session_bugs_and_fixes.md
changelog/2026-07-24_ios_scene_bridge_rebuild.md
changelog/2026-07-23_ios_roundup.md          （真机本可选）
```

**不要**批量灌：fa_* 全套、每一条历史 changelog、重复 11/14 旧版。

| 笔记本 | ID |
|--------|-----|
| poker类手感调优 | `b0897377-3dc5-48c2-bc98-554cb380d352` |
| 配对牌项目笔记 | `8accbc6d-2100-42dd-b94f-54be4a93740b` |

---

## 7. 写新笔记时（检查清单）

1. 能改钉 / design 就不只写 changelog  
2. 系统级故障 → **升格 design + 决策号**（例 D28），changelog 只记实现  
3. 更新 `CURRENT` / 本页白名单若入口变了  
4. 头部带：**更新 / 状态 / 权威级 / 关联**  
5. 旧文不删，标归档  

---

## 8. 有效性审查

全库/NLM 老化与重复审查见：

→ **[`NOTES_AUDIT.md`](./NOTES_AUDIT.md)**（2026-07-23）

**v2+：** 审查结论已**物理删除** fa_*、01–11/13、art-ux 03/04/08、过程/分条 changelog。详见 NOTES_AUDIT。

---

## 9. 版本

| 版本 | 日期 | 说明 |
|------|------|------|
| v1 | 2026-07-23 | 初版白名单 |
| v2 | 2026-07-23 | 纳入 D28/design19 · 主题深挖 · 归档策略 · NLM 清单对齐 |
| v3 | 2026-07-23 | 链 NOTES_AUDIT 审查报告 |
| v4 | 2026-07-23 | NOTES_AUDIT v2 全库；art-ux/handfeel 旧源降权 |
| v5 | 2026-07-24 | 纳入 D30 iOS SceneDelegate Bridge rebuild 根治方案 |
