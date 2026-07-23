# 交接文案 · 美术优化 + 体验优化

**更新：** 2026-07-23  
**状态：** 现行  
**权威级：** L1 交接  
**用途：** 新窗口 **只做观感与手感**，不要重做规则与配点。  
**仓库：** `/Users/wangzhixuan/Documents/Threejs_Work/Card`  
**预览：** `npm run dev`

**美术方向：** [`design/18_art_direction_lock_v20.md`](./design/18_art_direction_lock_v20.md)  
主参考：`images/20.jpg`（奶油青绿 · 柔和扁平休闲）

> 全局入口：[`CURRENT.md`](./CURRENT.md) · [`NOTES_PACK.md`](./NOTES_PACK.md)

---

## 1. 一句话产品（已定稿）

手机框内 **层叠同点配对**（非接龙）：  
同点同色（仅♥/♠）+ 抽牌压栈 + **清桌即胜** + **单关无限 seed**；  
路径锁（钥匙稀缺）；难度困难 / 每 3 局极难。  
体验主轴 **顿悟**；美术服务可读与反馈，不抢规则。

---

## 2. 必读文档（按序）

| 顺序 | 路径 | 为什么 |
|------|------|--------|
| **1** | [`CURRENT.md`](./CURRENT.md) · [`NOTES_PACK.md`](./NOTES_PACK.md) | 现行入口 / 白名单 |
| **2** | [`design/18`](./design/18_art_direction_lock_v20.md) | **美术方向锁** |
| 3 | [`handfeel/14`](../research/handfeel/14_physical_impl_pins.md) · [`19`](../research/handfeel/19_intent_impl_pins.md) | 手感 / 意图钉 |
| 4 | [`design/03`](./design/03_experience_and_innovation.md) | 顿悟 / 雷区 |
| 5 | [`design/05`](./design/05_board_layout_consensus.md) | 牌尺寸、漏边、层级 |
| 6 | [`design/11`](./design/11_viewport_iphone15.md) | 393×852 |
| 7 | [`art-ux/00_INDEX`](../research/art-ux/00_INDEX.md) | 检索成果（规格史） |
| 8 | [`full_roundup`](./changelog/2026-07-22_full_roundup.md) | 规则向总表（按需） |

**路径锁 UI 文案时：** `research/path-lock/00_INDEX.md`  
**不必重读：** 技术选型、配点生成长文、已归档 handfeel 过程 changelog。

> **实现必读：** [`handfeel/14`](../research/handfeel/14_physical_impl_pins.md) · [`19`](../research/handfeel/19_intent_impl_pins.md) + `phys.ts`（旧 art-ux 03/04/08 已删）。  
> 美术方向：[`design/18`](./design/18_art_direction_lock_v20.md)。

---

## 3. 规则红线（美术/体验也不得违反）

| ID | 内容 |
|----|------|
| D10 | 胜利 = **只清谜题区**；清桌后库回收 |
| D10b / D26 | 库是工具；残局会 trim 多余库牌 |
| D15 | **Pixi 主渲染**；HUD 用 **DOM** |
| D16 | 逻辑坐标 **393×852**；PC **phone-frame letterbox** |
| D17 | 可点集 = **逻辑 isFree + AABB**（渲染不能另定「能不能点」） |
| D18 / I5 | **Free ⇔ 亮面**；非 Free ⇔ 背面 |
| D22 | 配对 **同点同色**；红♥ 黑♠ only |
| D12 | **无默认 timer** |

牌面尺寸（实现）：`CARD_W=56` `CARD_H=74`（与 Poker 188×248 同比例；改前先改 `05` + `layout.ts`），同槽 `d=9`。

---

## 4. 当前实现速览（美术会碰到的）

```text
src/
  render/cards.ts     # Poker Sprite 正/背；拖/弹回；飞走；座位常驻影
  render/cardAssets.ts# bake PNG → texture（DPR）
  render/pileTray.ts  # 抽牌区托盘
  render/app.ts       # Pixi 应用、resize、context lost 钩子
  ui/hud.ts           # DOM：顶栏、抽牌/撤销/重开/新局、胜/负浮层
  ui/trayTuner.ts     # 托盘/阴影 live 调参
  styles.css          # phone-frame、letterbox、bg #efe5d9
  data/layout.ts      # STOCK/WASTE、牌尺寸
  data/pileLayoutRuntime.ts / cardShadowRuntime.ts
  main.ts             # 点选 + 拖放输入、局号/难度、会话
  core/rules.ts       # isFree / pickCard / 胜负（勿改判定语义）
  public/cards/       # R_*/B_* 正面 + Card_B.png 背面
```

**现状观感：** Poker 贴图牌面 + 灰蓝皇冠背面；抽牌托盘；拖放/点选双通道。

**玩法入口：** 单关无限；顶栏 `第 N 局 · 困难|极难 · 锁×k · #seed`。

**近期 changelog：** [`session_bugs`](./changelog/2026-07-23_session_bugs_and_fixes.md) · [`drawzone_z`](./changelog/2026-07-23_drawzone_z_autodraw_dim.md)

---

## 5. 本窗口目标范围

### 5.1 建议做（美术）

| 优先级 | 项 | 验收 |
|--------|-----|------|
| P0 | 牌面视觉：正面（点数+花色可读、红黑分明）、背面统一风格 | 5 秒内能扫清 free 牌 |
| P0 | free / 非 free / 选中 三态清晰 | 与 isFree 一致，不误导可点 |
| P1 | 抽牌区多层背面、抽出叠顶牌层次 | 仍符合 layout 常量 |
| P1 | 胜利 / 失败浮层视觉 | 不挡主按钮；safe-area 友好 |
| P2 | 简单牌背纹样 / 轻阴影 / 圆角统一 | 不糊成一团 |
| P2 | 可选：轻量图集或程序化绘制（仍 Pixi） | 控制包体；见 `research/tech-stack/notes/bundle_size.md` |

### 5.2 建议做（体验）

| 优先级 | 项 | 验收 |
|--------|-----|------|
| P0 | 消牌反馈：飞走/闪一下/音效可选 | 消了有「兑现感」 |
| P0 | 翻面：从背到面可感知 | 与 free 同步 |
| P1 | 选中高亮、错误点（异色同点）反馈 | 少「点了没反应」 |
| P1 | 软卡 / 硬死 提示文案更短更清楚 | 对齐路径锁口径：瓶颈不是「找唯一钥匙」 |
| P1 | 顶栏信息层级：局号/难度/提示不抢牌桌 | 小屏仍可读 |
| P2 | 手感：动画时长、缓动、忙时禁连点（`cards.isBusy`） | 不拖沓、不误触 |
| P2 | 真机：safe-area、visualViewport、点按偏移 | 勾 `11` §6 关键项 |

### 5.3 明确不要做（本窗口）

- 重做配点 / 锁算法 / seed 难度公式（除非纯文案）  
- 加 timer、广告、IAP、多关战役  
- 上 Three、换引擎  
- 改 5×4 几何骨架或 cover 规则「为了好看」  
- 把 free 画成亮面但逻辑仍不可点（破坏 I5）  

---

## 6. 体验文案口径（路径锁）

| 对内 | 对玩家建议 |
|------|------------|
| 路径锁、match-key、稀缺 2～4 | 「中层瓶颈」「同色同点才能消」 |
| 钥匙 | 少说「唯一钥匙」；可说需要同花色点数 |
| 极难局 | 「更难、锁更多」即可 |

规则细节以 `full_roundup` 为准，**文案不要发明新规则**。

---

## 7. 建议工作切分（可并行）

```text
A. 牌面视觉系统（cards.ts + 可选资源）
B. HUD / 浮层视觉（hud.ts + styles.css）
C. 动效手感（flyAway、翻面、选中）
D. 真机与无障碍点按（viewport + 11 清单）
```

每完成一块：真机或 phone-frame 录 15～30s；对照 `03` 体验合同自检。

---

## 8. 技术约束速查

- 设计分辨率：**393 × 852**  
- 牌：**56 × 74**，同组上漏边 **d=9**  
- 渲染：**Pixi v8**；UI：**DOM #hud**  
- 输入：`screenToDesign` → `pickCard`（isFree）；**短按点选 / 拖放配对**  
- 拖放：匹配 `tryMatchPair`；不匹配 `snapBack`；阈值 ~8 design px  
- 抽牌区/抽出叠：**座位阴影常驻**（`stockSeatShadow` / `wasteSeatShadow`）  
- 动画：表现层，**不改配对合法性**；`isBusy` = 动画中 **或** 拖拽中  
- 构建：改资源后 `vite build` 可记一笔体积  

---

## 9. 验收清单（本窗口 Done）

- [x] 牌面红黑 / 花色扫读清晰（Poker `R_*`/`B_*`）  
- [x] free 亮、非 free 背、选中可辨  
- [x] 消牌 / 翻面有反馈，不卡逻辑（点选 + 拖放）  
- [x] 拖到同色同点消除 / 不同弹回  
- [x] 抽牌区·抽出叠座位阴影常驻  
- [x] 牌背 `Card_B.png` 灰蓝皇冠  
- [ ] 胜负浮层与软硬提示不挡操作（既有，未本轮重验）  
- [ ] phone-frame 下无裁切、无严重点偏  
- [ ] （目标）iPhone 15 Safari 勾 `11` §6 若干关键项  
- [x] 未改坏：`npx vitest run` core 规则测绿  
- [x] changelog：结论见 `session_bugs` / `drawzone_z`（旧 drag_match 条已删）


---

## 10. 给执行 Agent 的开场提示（可粘贴）

```text
你在仓库 Card 做「美术优化 + 体验优化」。

先读 docs/HANDOFF_ART_UX.md 与 docs/changelog/2026-07-22_full_roundup.md。
不要改配点/锁算法/胜负规则；遵守 D15 Pixi、D16 393×852、D17 逻辑 hit-test、Free=亮面。

优先：牌面可读（红♥黑♠）→ free/选中/背面三态 → 消牌与翻面反馈 → HUD/胜负浮层 → 真机 safe-area。
动效只在 render/ui，core 规则保持单测通过。
完成后写 docs/changelog 一条并勾选 HANDOFF_ART_UX §9。
```

---

## 11. 相关已定玩法（避免误改）

- 单关无限：新局 / 再来一局 = 新 seed；重开 = 同 seed  
- 第 3/6/9… 局极难  
- 路径锁钥匙全场 2～4 张；库内钥匙靠前  
- 残局会自动收掉桌上不需要的库牌  

若美术需要更大牌面或改间距：**先改 `05` 设计文档再动 `layout.ts` 常量。**
