# Changelog · 翻牌时机 / 翻牌动态 / 输入解锁（2026-07-23）

**钉文：** `research/handfeel/14_physical_impl_pins.md` **v1.4**  
**代码：** `src/main.ts` · `src/render/cards.ts` · `src/render/phys.ts`

---

## 1. 翻牌时机

| 之前 | 现在 |
|------|------|
| 配对 **exit 飞出结束** 后翻新 free | **上抛（exit）一开始** 就翻 |
| | 与上抛 **并行**；exit + flip 都结束后才 full refresh |

**仍翻谁：** 消牌后 puzzle 区 **新 free** 的牌（不含刚消那对）。  
**抽牌翻：** 仍是 stock→waste **到位后再翻**（本批未改）。

---

## 2. 翻牌动态

| 项 | 定稿 |
|----|------|
| 放大峰值 | `flipBreath: **1.3**` |
| Z 倾角 | 每张随机 ±(40%～100%)×`flipTiltMaxDeg(8°)`，方向随机 |
| 节奏 | 中段倾角最大，结束归 0 |
| 轴 | **牌心** |
| busy | 翻牌 **不进** 全局 busy |

---

## 3. 配对后何时可操作下一张

| 阶段 | 可操作？ |
|------|----------|
| meet（A1 飞 A2） | **否**（`animating`） |
| **上抛开始起** | **是**（exit 用 `exiting`，**不**进 isBusy） |
| 某张正在翻 | **该张不可拖**；其它可操作 |
| 上抛中的已消对 | 不可点（!alive + exiting） |

### isBusy 包含
- `animating`（meet / snap / 抽移 / 洗回相关）
- `dragPos` / `drawMoving` / `recycleAnimating`

### isBusy **不**包含
- `exiting`（上抛飞出）
- `flipping`（全局不锁；单卡禁拖）

---

## 4. 文件

| 文件 | 说明 |
|------|------|
| `14` | **v1.4** |
| `11` | 参数同步 |
| 本文 | 本批纪要 |
