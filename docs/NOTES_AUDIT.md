# 笔记有效性审查报告

**日期：** 2026-07-23 · **v3（已执行删除）**  
**范围：** `docs/` · `research/*` 五轨 · 源卡 · 与代码对照  
**结论入口：** [`NOTES_PACK.md`](./NOTES_PACK.md) · [`CURRENT.md`](./CURRENT.md)

---

## 0. 总判（一页）

| 维度 | 结论 |
|------|------|
| **清理** | **已删** fa_*、handfeel 01–11/13、art-ux 03/04/08、过程/分条 changelog（见 **§8 清单**） |
| **健康** | 入口三件套 + L1 钉 + design 现行；噪声源已出库 |
| **仍留 L5** | path-lock / market / tech-stack / 部分 art-ux 对照 / pf_* intent_* |
| **外源** | Goodman/NN DnD 原则不老；已删 fa ms 源 |
| **NLM** | 同步删掉本机笔记本里对应旧源，避免幽灵标题 |

**日常只认：**

```text
代码 (L0) > handfeel/14 · 19 · design/02·04·05·19 > CURRENT > session_bugs > 专项 L4
其余 = 考古
```

---

## 1. 现行有效（保留 / 优先）

### 1.1 导航与规范

| 文档 | 判定 |
|------|------|
| `CURRENT` · `NOTES_PACK` · `DOC_CONVENTIONS` · `00_INDEX` | ✅ 现行 |
| `HANDOFF_IMPLEMENTATION` · `HANDOFF_ART_UX` | ✅ 交接（须跟 CURRENT） |
| 本报告 `NOTES_AUDIT` | ✅ 元审查 |

### 1.2 L2 设计

| 文档 | 判定 |
|------|------|
| `design/02` 规则 · `04` 决策 **D01–D30** · `05` 几何 | ✅ |
| `design/19` 渲染生命周期 **D28 / D30** | ✅ |
| `design/11` 视口 · `10` 技术拍板 · `18` 美术方向锁 | ✅ 仍有效 |
| `design/07` 术语 · `08` 范围 · `15` 配点不变量 | ✅ 按需 |
| `design/01` · `03` | ✅ 定位/体验合同 |

### 1.3 L1 钉 + L0

| 文档 / 代码 | 判定 |
|-------------|------|
| `handfeel/14` v1.5 · `19` 意图钉 | ✅ **行为规格** |
| `phys.ts` · `cards.ts` · `rules.ts` · `gameView.ts` · `main.ts` | ✅ **最高** |
| `session_bugs` B1–B15 | ✅ L3 问题总表 |

### 1.4 L4 仍有用（按需，不当唯一真理）

| 文档 | 判定 |
|------|------|
| `renderer_rehydrate` · `ios_roundup` · `iphone_checklist` · `native_shell` · `capacitor_ios` | ✅ iOS |
| `drag_intent_drop_decode` · `drawzone_z_autodraw_dim` | ✅ 实现细节 |
| `full_roundup` · `d27_fair_keys` · `near_miss_p0` | ✅ **规则/发局** 史，仍有用（非手感真理） |
| `handfeel/12` v3 · `20` · 各轨 `12_effective_sources_list` | ✅ **目录级** 有效源表 |

### 1.5 外源 · 仍有效（抽象旁证）

| 源 | 判定 | 红线 |
|----|------|------|
| Goodman soft keyboard (AAAI 2002) | ✅ 范式 | 不定 ms、不改 canMatch |
| NN/g Drag-and-Drop 容差 | ✅ | 禁止非法磁吸 |
| Apple HIG 触控量级 | ✅ 旁证 | 牌已够大 |
| Pixi 官方 Events / Perf | ✅ | 选型已结案，查 API 用 |
| ShapeWriter / SHARK | ⚠️ 弱 | 仅「路径≠命中」 |

---

## 2. 已过时 / 无效作「现行」（可留档 · 勿当真）

### 2.1 手感轨 · 高危误导

| 文档 | 问题 | 认谁 |
|------|------|------|
| **`handfeel/10` UE 草案** | 事件名/busy 旧；状态写 Round D 假设 | **14 + phys** |
| **`handfeel/11` 参数草案** | 曾对齐 v1.4；`exitMs` 等易与 phys 漂移 | **phys.ts** |
| `handfeel/01`–`08` · `00_gap` · `09` · `13` | 更早轮次；flyAway/仅点选/旧六维混杂 | 归档 |
| `handfeel/05_feel_spec` | 旧规格 | 14 |
| `sources/fa_*`（约 14 张） | 早期反馈轮；ms **对 phys 无效** | 归档 |
| `sources/pf_*` | 原则可考古；参数勿盖 | 14 |
| `sources/intent_*` | ✅ 仍支撑 19/20（**有效源卡**） | 19 |

**实测冲突例：** `11` 写 `exitMs: 260`，`phys.ts` 为 **`exitMs: 280`** → 证明 11 **不能**当默认。

### 2.2 Art-UX 轨 · 曾自称「唯一源」

| 文档 | 问题 | 认谁 |
|------|------|------|
| **`art-ux/03_ue_event_table`** | 标题曾写「**产品唯一源**」；flyAway / H-match 280 时代 | **14 + phys + cards** |
| **`art-ux/04_animation_params`** | H-\* 假设表 | phys |
| **`art-ux/08_impl_pins_r31`** | 写「实现必遵」；S3/busy 债多已还 | **handfeel/14** 取代实现钉角色 |
| `art-ux/00_INDEX` | 「实现必读序」仍指向 08/03 | 应改指向 CURRENT + 14 |
| `art-ux/r1_*` 源卡 | 通用 UI 时长旁证 | 可留，不定牌 ms |
| `design/17_art_ux_research_plan` | 计划结案；细表仍飞 flyAway 叙事 | 检索史 |
| `design/17_art_direction_research` | **另一篇 17**（方向调研） | 方向以 **18** 为准 |

### 2.3 Changelog · 结论已吸收

| 类型 | 例 | 处理 |
|------|-----|------|
| 07-23 手感分条 | `match_exit` · `drag_handfeel` · `tap_meet` · `flip_input` | → **14 + session_bugs**（归档史） |
| 07-22 过程噪声 | `gap_vs_notes` · `handfeel_gap_*` · `handfeel_round_*` · `level01_session_summary` · `poker_handfeel_notebook` · `handfeel_sources_v2` | 过程；结论看 full_roundup/钉 |
| `drag_match_pile_shadow` | 座位影「常驻」等 **已被 07-23 抽叠改写** | 起点史；现行 cards + session_bugs |
| `isFree_cover_v1.1` · 早间 layout 条 | 已被规则/几何吸收 | 归档 |

### 2.4 Design 反查 / 检索计划

| 文档 | 判定 |
|------|------|
| `06_doc_gap_audit` | 反查史；写「POC 未起」等 **已过时** |
| `09_tech_research` · `12_tech_gap` | 选型结案史 |
| `13_mvp_plan` | Todo 史；**工程已远超 M0**，勿当进度板 |
| `16_path_lock_research_plan` | 计划；实现看 D27 + full_roundup + 代码 |

### 2.5 其他轨

| 轨 | 现行 | 归档/只读 |
|----|------|-----------|
| **path-lock** | 结论在 D24–D27b + `level01Deal`；`00_INDEX` 一句话仍有效 | 01–10 检索交付物 |
| **tech-stack** | `10_tech_decision` + Pixi 官方 | `t1_three*` 等 **否决证据** 非实现依赖；notes 噪声 |
| **sorting-market** | 立项旁证；**玩法不听它** | 全轨 L5；索引有「金字塔」笔误（已修） |
| **tech 有效源表** | 选型史 | P0 列表停在 D17 时代，**缺 D28/CURRENT**（目录老化，不扩也可） |

---

## 3. 重复矩阵（同内容多文）

| 重复组 | 成员 | **只认** |
|--------|------|----------|
| 手感参数/事件 | art-ux 03/04/08 · handfeel 10/11/14 · phys | **phys + 14** |
| 拖意图 | 15/16/17/18/19/20 · drag_intent changelog · intent_* 卡 | **19 + rules + phys** |
| 问题故事 | session_bugs · 多条 07-23 handfeel changelog | **session_bugs** |
| 导航 | CURRENT · NOTES_PACK · 00_INDEX · 各轨 00 · 多份 12_effective | CURRENT 读 / PACK 白名单 / INDEX 全库 |
| 规则总表 | full_roundup · 04 · 02 · 多条 07-22 决策 changelog | **02 + 04**；full_roundup 作 Level01 史 |
| 编号撞车 | **design/17** 两篇（art_direction vs art_ux plan） | 方向→**18**；计划→art-ux 归档 |
| 有效源表 | handfeel/12 · handfeel/20 · art-ux/12 · tech/12 · market/12 | **分轨保留**；交叉链，勿重复入库全文 |

### NotebookLM（poker · 约 50 上限）

| 问题 | 建议 |
|------|------|
| `14_physical_impl_pins` 可能 **2 份** | 只留最新 1 |
| fa_* / 旧 10/11 / 分条 handfeel changelog | **可删** 腾配额 |
| art-ux 03/04/08 全文 | **可删**（认 14） |
| 保留 | CURRENT · PACK · 02/04/19 · 14 · 19 · 20 · session_bugs · ios_roundup（可选） |

---

## 4. 「老叙述」风险句（引用前先查钉）

旧文中仍可能出现、**已否定** 的说法：

| 老说法 | 现行 |
|--------|------|
| 主路径 flyAway 单段 280 | meet + exit；拖 **skipMeet** |
| 输入 = 仅点选 | 点选 + 拖放 |
| 座位影 always on / 每牌一影 | 有牌才显 · 共用座位影 |
| 后台只 `ticker.start` / soft render | **D28 rehydrate** |
| 谜题 = 经典三角 Pyramid | **4×5 + 层叠** |
| Three 主渲染 / 双引擎 | **D15 Pixi only** |
| busy 仅 match | busy 含 snap/拖/exit 等（以 cards 为准） |
| art-ux/03「产品唯一源」 | **已降权为归档对照** |

---

## 5. 按目录的「源」清单摘要

### 5.1 `research/handfeel/sources/`（22）

| 前缀 | 数量 | 有效性 |
|------|------|--------|
| `intent_*` | 4 | ✅ 支撑意图钉 |
| `pf_*` | 4 | ⚠️ 原则可用，参数归档 |
| `fa_*` | 14 | ❌ 对 phys **无效**；NLM 可删 |

### 5.2 `research/art-ux/sources/`（5）

| 卡 | 有效性 |
|----|--------|
| `r1_nng_*` · `r1_fake_card_flip` · `r1_web_touch_*` | ⚠️ 旁证 |
| `r1_juice_*` · `r1_card_readability_*` | ⚠️ 旁证 |
| 全体 | 不定稿 ms；实现认 14 |

### 5.3 `research/tech-stack/sources/`（16）

| 类 | 有效性 |
|----|--------|
| `t*_pixi*` · 官方 perf/hit | ✅ API 旁证 |
| `t*_three*` · Three MemoryGame | 📦 **否决用证据**，非实现源 |
| `t3_iphone*` · phone_frame | ✅ 视口史 |
| 纹理限制类 | ⚠️ 通用风险 |

### 5.4 `research/sorting-market/sources/`（24）

| 判定 | 说明 |
|------|------|
| 📦 全轨 L5 | 品类立项用；**不定义** 本玩法规则 |

### 5.5 path-lock

| 判定 | 说明 |
|------|------|
| 无独立 sources/ | 模式卡在 01–10；**实现认 D27 + 代码** |

---

## 6. 建议执行清单

| # | 动作 | 仓库 | NLM |
|---|------|------|-----|
| 1 | 日常只改 NOTES_PACK 白名单内文档 + 钉 | ✅ | — |
| 2 | art-ux 03/08/00 头降权为「归档对照」 | ✅ 本轮 | 可删全文 |
| 3 | handfeel/12：分条 changelog 标归档 | ✅ 本轮 | 分条可删 |
| 4 | 删 NLM 重复 14；删 fa_* / 旧 10/11 | — | **建议** |
| 5 | 勿再入库 15/16 全文、market 全库 | 纪律 | ✅ |
| 6 | 新系统故障升格 design+D 号，不堆源卡 | 纪律 | — |

---

## 7. NLM 清理执行记录（已执行）

**笔记本：** poker类手感调优 `b0897377-3dc5-48c2-bc98-554cb380d352`  
**时间：** 2026-07-23  

| 项 | 结果 |
|----|------|
| 清理前 | ~48 源 |
| 删除 | **33** 条（归档草案 / fa·pf·r1 / 分条 handfeel changelog / 噪声外链等） |
| 清理后 | **15** 源 |
| 仓库文件 | **未删** |

**保留清单：**

```text
CURRENT.md · DOC_CONVENTIONS.md · NOTES_PACK.md · NOTES_AUDIT.md
14_physical_impl_pins.md · 19_intent_impl_pins.md
12_effective_sources_list.md · 20_intent_effective_sources_list.md
15_drag_intent_research_plan.md
2026-07-23_session_bugs_and_fixes.md
2026-07-23_drag_intent_drop_decode.md
2026-07-23_drawzone_z_autodraw_dim.md
03_experience_and_innovation.md
NN/g Drag-and-Drop · Smart Interface DnD UX
```

---

## 8. 已删除文件清单（仓库 v3）

### handfeel
- 全部 `sources/fa_*.md`
- `00_gap` · `01`–`08` · `09` · `10` · `11` · `13`

### art-ux
- `03_ue_event_table` · `04_animation_params` · `08_impl_pins_r31`

### changelog
- 07-23：`match_exit` · `drag_handfeel` · `tap_meet` · `flip_input`
- 07-22：`gap_vs_notes` · 全部 `handfeel_*` 过程条 · `level01_session_summary` · `poker_handfeel_notebook` · `physical_feel_poc` · `drag_match_pile_shadow`
- 07-21：`isFree_cover_v1.1`

### 有意保留
- 钉 14/19 · design 02/04/05/19 · CURRENT/PACK · intent_*/pf_* · 规则向 changelog · path-lock/market/tech

---

## 9. 版本

| 版本 | 说明 |
|------|------|
| v1 | 首轮 handfeel + NLM |
| v2 | 全库审查 |
| v2.1 | NLM 批量清理（若已做） |
| **v3** | **仓库物理删除** + 索引回写 |
