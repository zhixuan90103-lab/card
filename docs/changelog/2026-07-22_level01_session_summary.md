# 2026-07-22 · Level01 会话改动总整理

**状态：** 关卡体验已确认正确  
**范围：** 平行剥层禁令 · 胜利/抽牌区职责 · 精简 stock · 相关测试与设计定稿  
**关联代码：** `src/data/level01Deal.ts` · `src/data/levelSolve.ts` · `src/core/rules.ts` · `src/core/state.ts` · `src/main.ts` · `src/core/stuck.ts`  
**关联设计：** `15_level_rank_design.md` · `02_game_rules.md` · `04_decisions_log.md`  
**分项 changelog：**  
- `2026-07-22_win_puzzle_only_stock_tool.md`  
- 本文（总表）

---

## 1. 玩家反馈 → 设计定稿（三条主线）

| # | 现象 | 根因 | 定稿 |
|---|------|------|------|
| A | A/B 两组同时消 5，下面都是 Q，再消又是同点 | 填点自下而上 + 修复只扫一遍，同顶次顶又撞车 | **R15 禁平行剥**：同顶 ⇒ 次顶必须互异 |
| B | 桌面清空，抽牌区还有牌，还要库内收尾配对 | `isWon` 误做成「全牌 dead」；与 D10 冲突 | **D10 回归**：清桌即胜；**D10b** 库=工具，清桌回收 |
| C | 桌面只剩 2 张，库里还剩 7+ 张 | stock **pad 到 ~16** 填料对；桌面自配对时库不动 | **R7 精简 stock**：奇点补齐 + 至多 2 组 L1 伙伴对，禁止 pad |

---

## 2. 规则 / 决策（写入笔记）

### 2.1 胜利与抽牌区（D10 / D10b）

| 项 | 内容 |
|----|------|
| 胜利 | **仅清谜题区**（`puzzleAlive.length === 0`） |
| 抽牌区 | **辅助工具**（帮桌上单点 / 容错），**不是**第二谜题 |
| 清桌瞬间 | `reclaimUnusedDeck`：未用 stock/waste → `alive=false`，队列清空 |
| stock 可点性 | **永远不可点**；只能抽到 waste，再与桌面 free 配 |
| 否决 | 「清桌后 stock 顶与 waste 顶收尾配对」「全清库才算赢」 |

### 2.2 配点不变量（R 系列增量）

| ID | 规则 |
|----|------|
| **R7** | stock = 奇点补齐 + **至多 2 组** L1 抽牌伙伴对；**禁止 pad 到 16**；通常 ≤14 |
| **R15** | 任意两组**组顶相同** ⇒ **次顶不得相同**（跨层） |

### 2.3 Level01 几何与谜题（保持）

| 项 | 内容 |
|----|------|
| 几何 | **固定满槽** L0 5×4×3 + L1 4×3×3 + L2 3×2×2（重开不改坐标） |
| 随机 | seed → 点数 / 开局对落位 / 锁数·锁位·钥匙·拓扑 / stock |
| 锁 | 仅 **L1 组顶**；`independent` 或 `chain`（DAG） |
| L2 | 桌面自洽挖掘链；开局 free **恰好一对** |
| 失败 | 硬死局 UI（无步可消）+ 撤销/重开 |

---

## 3. 实现改动清单

### 3.1 `src/data/level01Deal.ts`（配点核心）

| 改动 | 说明 |
|------|------|
| 填点 **自上而下** | 填次顶时组顶已就绪，可禁平行 |
| `depthBannedRanks` | depth=1 且组顶已知时，禁止与「同顶」组已占用的次顶相同 |
| `repairParallelPeels` | 按顶点分桶 + 多轮收敛 + 终检；修 size=2 改底时不破坏次顶互异 |
| `buildLeanStock` | 替代 pad-to-16：L1 伙伴（桌上已偶数的 rank 才加 1，再 parity 成对，**最多 2 组**）+ 全局奇点各 1 |
| L2 bots | 互异（含 F），避免消顶后两底又平行成对 |
| `dealLevel01` | `canFullyClear` 过滤；失败则 fallback 最后一局 |

### 3.2 `src/core/rules.ts` / `state.ts` / `main.ts`

| 文件 | 改动 |
|------|------|
| `rules.ts` | `isWon` = 谜题空；`reclaimUnusedDeck`；stock `isFree` 恒 false |
| `state.ts` | 配对后若桌空 → 回收库，再 commit；否则 waste 空则 auto-flip |
| `main.ts` | 去掉「桌空点库 = 选牌收尾」；点库只 `draw()` |
| `stuck.ts` | hardDead 与「清桌即胜」对齐（无 free 时看谜题是否还活） |

### 3.3 `src/data/levelSolve.ts`

| 改动 | 说明 |
|------|------|
| 验收目标 | 清**谜题区**即可（不要求抽光 stock） |
| 策略 | 优先 free 对（含 waste）→ 库内有 free 需要的点则 `drawToward` → 盲抽 |
| 防空转 | 连续空抽超过约 2 个库周长 → 失败，加快 deal 过滤 |

### 3.4 测试

| 文件 | 覆盖 |
|------|------|
| `level01.test.ts` | 满槽、几何固定、seed 改点、开局一对、锁、R1/R2、可清、**禁平行剥**、**stock ≤14** |
| `rules.test.ts` | 清桌即胜 + 库回收；stock 不可点 |
| `rules.cover.test.ts` / `stuck.test.ts` | 遮挡与死局（回归） |

---

## 4. 玩家体验对照

| 之前 | 现在 |
|------|------|
| 两堆同顶同下，像复制粘贴 | 同顶必不同次顶 |
| 清桌后还要配库，像没打完 | 清桌直接胜利，未用库回收 |
| 残局桌面 2 张、库 7～10 张废对 | 库只含奇点 + 少量 L1 伙伴，开局通常 ≤14 |

---

## 5. 关键代码入口（速查）

```text
src/data/level01Deal.ts   # dealOnce / buildLeanStock / repairParallelPeels
src/data/levelLayout.ts   # 固定几何 materialize
src/data/levelSolve.ts    # canFullyClear
src/core/rules.ts         # isFree / isWon / reclaimUnusedDeck
src/core/state.ts         # GameSession 配对 / 抽洗 / 清桌回收
src/main.ts               # 输入：点库=抽；点牌=选消
src/ui/hud.ts             # 胜利 / 失败 overlay
```

---

## 6. 验证

```bash
npx vitest run
# 期望：全部通过（约 43 tests）
```

本地：`npm run dev` → http://127.0.0.1:5173/ → 重开数局确认：

1. 无「双 5 下双 Q」平行剥  
2. 桌面空 → 立刻胜利  
3. 库不会无故灌到 16+；残局库不会明显厚过桌面需求  

---

## 7. 文档同步清单（本会话）

| 文档 | 动作 |
|------|------|
| `docs/changelog/2026-07-22_level01_session_summary.md` | **新建**（本文 · 总整理） |
| `docs/changelog/2026-07-22_win_puzzle_only_stock_tool.md` | 已有；含 D10 + stock 精简续记 |
| `docs/design/15_level_rank_design.md` | R7 / R15 / §8 stock·胜利 |
| `docs/design/02_game_rules.md` | 胜利 + 抽牌区工具 |
| `docs/design/04_decisions_log.md` | D10 / D10b（+ 本整理补 D19 平行剥） |
| `docs/00_INDEX.md` | 索引链到 15 与本 changelog |
| `docs/changelog/2026-07-22_gap_vs_notes.md` | **笔记 vs 实现缺口**（M1 未做清单） |
