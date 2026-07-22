# R3.1 · 实现钉（无外搜补漏）

**日期：** 2026-07-22  
**状态：** 拍板 · 实现必遵  
**来源：** `07_gap_audit.md` v2 §6  
**关联：** `02` `03` `04` · `HANDOFF_ART_UX`

---

## 1. 假设默认值（POC 起点）

| ID | 默认 | A/B 备选 |
|----|------|----------|
| H-match | **280ms**（少改现状） | 240ms |
| H-flip | **160ms** | 120 / 200 |
| H-sel | 描边 3px 金 + **y -= 4**；**不** scale | 仅描边 |
| H-red | 先试 `0xb71c1c`；糊则回 `0xc0392b` | — |
| H-corner | 角标字号 **12**；挤则 11 | 退回居中单行仅作 fallback |
| H-free | free = 亮面；**无**常驻外发光 | — |
| H-busy | 仅 `flyAway` 进 busy | 不通过再评估缓冲 |
| H-draw | 瞬时 | 150ms 飞入 |
| H-label | **保留**「抽牌区/抽出叠」+ 剩余 N | 外放再删标签 |

---

## 2. S1 · newly-free 检测

```text
before = freeIdSet(stateBefore)   // isFree && alive
// commit match / draw / undo...
after  = freeIdSet(stateAfter)

newlyFace = after \ before
// E06 P0 只播：zone===puzzle 且由非 free→free（背→面）
// stock 顶 free / waste：瞬时 sync 亮面即可，不进 flipToFace（避免与 E06 范围漂移）

撤销（E09）：不播 A-flip，直接 sync 瞬时
```

伪代码落点建议：`main` 在 `tapCard` 匹配成功路径：

```text
1. freeBefore = freeIdSet(state)   // match 前
2. session.tapCard → matched commit
3. cards.sync(skip=pair)          // 勿对 pair 立刻 visible=false 冲掉动画
4. 更新 HUD（勿全量 cards.sync 无 skip）
5. flyAway(pair)  [busy]
6. onDone:
     toFlip = puzzleNewlyFree(freeBefore, freeAfter) - pair
     flipToFace(toFlip)
     full refresh()
```

**基线债（自洽评估 3.2）：** 现状 `refresh()` 会无 skip 全量 `sync`，可能在 flyAway 前藏牌；R4 必须拆 HUD / skip。  
waste / stock：**不**走 E06 伪翻。

---

## 3. S2 · 多牌同翻

| 规则 | 值 |
|------|-----|
| 并行 | 同一 `toFlip` 集合 **并行** 播（共享 160ms） |
| 上限 | 建议 **≤12**；超出则瞬时 sync 剩余（极端掀开） |
| 交错 | **不做** 30ms cascade（噪音、拖节奏） |
| busy | 翻面 **不** `isBusy` |

---

## 4. S3 · 与 flyAway 时序

```text
match 确认
  → 逻辑已消 pair（alive=false）
  → sync 跳过 pair 位置（或已隐藏准备）
  → flyAway(pair)  [busy=true]
  → onDone: busy=false
  → 计算 toFlip（新 free）
  → flipToFace(toFlip)  [busy=false]
  → 全量 sync
```

**禁止：** 在 flyAway 中途对未死牌全量 sync 冲掉动画。  
**禁止：** 对 pair 播 flip。

---

## 5. S4 · 选中层级

| 项 | 值 |
|----|-----|
| 抬升 | `root.y = baseY - 4`（baseY 来自 layout/rect） |
| zIndex | 选中时 `baseZ + 1000`；取消恢复 |
| 命中 | 仍逻辑 AABB；抬升不改 hit 矩形（D17） |

---

## 6. S5 · 顶栏信息层级（wire）

```text
L1（主 · 12–13px · #c8d4e8 或略亮）
  第 N 局 · 困难|极难

L2（次 · 11–12px · #8fa3c1）
  锁×k · #seed

L3（教学/状态 · 12–13px · #c8d4e8）
  teachHint 或默认规则句
  若 softTip 出现：softTip 优先占 L3 位（黄字），暂隐 teach
```

实现可不拆两个 DOM，但 **视觉上 seed 不得比局号/难度更抢**。

---

## 7. S6 · 浮层 safe-area

```text
.overlay-card {
  max-width: 86%;
  border-radius: 16px;
  padding: 20px 20px max(20px, env(safe-area-inset-bottom, 20px));
}
主 CTA 在上；次按钮在下
遮罩全屏 pointer-events；卡片内按钮可点
```

---

## 8. S7 · 撤销与翻面

- 撤销：**瞬时** `sync`，**不**播 E06  
- 重开/新局：bootstrap，无翻  

---

## 9. E05 / 文案钉

| 项 | 拍板 |
|----|------|
| E05 点非 free | **P0 = 静默**（无选中变化） |
| E05 tip「被挡住」 | **P1** 可选；默认关 |
| E04 异色 | 改选中；**不做** 弹/nudge（P2 再加） |
| 硬死标题 | `暂时卡住了`（替代「游戏失败」） |
| 软 tip | `试试撤销 · 或继续抽牌` |
| 默认 status | `同色同点配对 · 盖住的点不到 · 清桌即胜` |

---

## 10. 验收钩（R4 自检 15s）

1. 开局 5s 能指认 free  
2. 选中抬升可辨、邻牌仍可读  
3. 消一对有飞走；busy 中点不动  
4. 消后下层/组内有翻面感  
5. 硬死/胜利能点到主按钮（phone-frame）  
