# 文档规范

**更新：** 2026-07-23  
**状态：** 现行  
**权威级：** L1 规范  
**目的：** 统一「写什么、放哪、谁优先」，避免 changelog / 检索 / 钉 混成一张大表。

**有效笔记白名单：** [`NOTES_PACK.md`](./NOTES_PACK.md)  
**现行一页纸：** [`CURRENT.md`](./CURRENT.md)

---

## 1. 权威层级（冲突时认上面）

| 级 | 含义 | 典型路径 |
|----|------|----------|
| **L0 现行实现** | 以代码为准 | `src/**` · `PHYS` · `CARD_Z` · `*Runtime.ts` |
| **L1 实现钉 / 导航** | 与代码同步的规格 + 入口 | handfeel `14`·`19` · `CURRENT` · `NOTES_PACK` |
| **L2 产品·系统设计** | 玩法 / 架构不变量 | `design/02`·`04`·`05`·**`19`(D28)** |
| **L3 问题/会话总表** | 近期改了什么、为何改 | `changelog/2026-07-23_session_bugs_and_fixes.md` |
| **L4 Changelog** | 按日追加的实现纪要 | `changelog/YYYY-MM-DD_*.md` · 见 `changelog/README.md` |
| **L5 检索归档** | 计划/反查/源卡；**检索关后只读** | `research/**` · `sources/` |

> **禁止**用 L4/L5 覆盖 L0/L1/L2。参数以 `src/render/phys.ts` 与 `*Runtime` 默认为准。

---

## 2. 目录职责

```text
docs/
  CURRENT.md               # ★ 现行一页纸（先读）
  NOTES_PACK.md            # ★ 有效笔记白名单与认序
  DOC_CONVENTIONS.md       # 本规范
  00_INDEX.md              # 总索引（只导航）
  HANDOFF_IMPLEMENTATION.md
  HANDOFF_ART_UX.md
  design/                  # L2 产品·规则·决策·生命周期
  changelog/               # L4 实现史（README 分层）
  changelog/README.md      # changelog 怎么读
research/
  handfeel/                # L1 钉 + L5 检索
  art-ux/ · path-lock/ · …
src/                       # L0 唯一运行真相
```

---

## 3. 命名

| 类型 | 模式 | 例 |
|------|------|-----|
| 设计文 | `NN_snake_topic.md` | `02_game_rules.md` |
| 实现钉 | `NN_topic_impl_pins.md` 或 `NN_physical_impl_pins.md` | `14` · `19` |
| 检索计划 | `NN_topic_research_plan.md` | `15_drag_intent_research_plan.md` |
| 反查 | `NN_topic_gap_audit.md` | `16_drag_intent_gap_audit.md` |
| 有效源 | `NN_topic_effective_sources_list.md` 或 `12_effective_sources_list.md` | `20` |
| Changelog | `YYYY-MM-DD_short_topic.md` | `2026-07-23_session_bugs_and_fixes.md` |
| 源卡 | `sources/{轨前缀}_{id}_{slug}.md` | `intent_a_softkey_decoder.md` |

**Changelog 主题建议短横线小写英文或清晰中文拼音主题，一事一文。**

---

## 4. 文档头部模板

每篇正文开头建议：

```markdown
# 标题

**更新：** YYYY-MM-DD  
**状态：** 现行 | 检索关 | 归档 | 草案  
**权威级：** L0–L5（见 DOC_CONVENTIONS）  
**关联：** 链接到钉 / 代码路径 / 上一篇 changelog
```

---

## 5. 何时写哪一类

| 场景 | 写 |
|------|-----|
| 改了可玩行为/参数 | 改代码 + **必要时**更新 L1 钉 + 一条 L4 changelog |
| 修了一串相关 bug | L3 总表增补 **或** 独立 changelog，并链到 `CURRENT.md` |
| **系统级故障升格** | **禁止**只堆 changelog：升为 L2 `design/NN` + `04` 决策号 + L4 实现笔记（例：D28 后台空白 → design 19） |
| 新开检索 | L5 计划 → 源卡 → 反查 → 钉；关检索后 `CURRENT` 只链钉 |
| 产品规则变更 | L2 design + decisions_log；**禁止**只写在 changelog |

---

## 6. 索引维护

- **入口三件套：** `CURRENT.md` · `NOTES_PACK.md` · `00_INDEX.md`  
- 白名单变更 → 先改 `NOTES_PACK`，再改 `CURRENT` / `00_INDEX`  
- 各 research 轨维护自己的 `00_INDEX`，总索引只链入口  
- 过时文：**不删**，在 NOTES_PACK / changelog/README **标归档**  

---

## 7. NotebookLM

| 笔记本 | 用途 | 注意 |
|--------|------|------|
| poker类手感调优 | 手感/意图钉与有效源 | **约 50 source 上限**；优先 L1+L3 |
| 配对牌项目笔记 | 产品+规则+D28+实现总览 | CURRENT · design · 大表 |

入库清单以 [`NOTES_PACK` §6](./NOTES_PACK.md) 为准。

---

## 8. 版本

| 版本 | 日期 | 说明 |
|------|------|------|
| v1 | 2026-07-23 | 初版规范 |
| v2 | 2026-07-23 | NOTES_PACK 中枢 · D28 入 L2 · changelog 分层 |
