# 有效来源 List · 进关发牌 / 开局 Deal 动画

**更新：** 2026-07-24 · **v1**  
**状态：** 现行（调研合成 · 尚未落地实现钉）  
**权威级：** L5 检索归档 → 落地后升 L1 钉  
**Notebook：** poker类手感调优 · `b0897377-3dc5-48c2-bc98-554cb380d352`  
**入口：** [`docs/CURRENT.md`](../../docs/CURRENT.md) · [`docs/NOTES_PACK.md`](../../docs/NOTES_PACK.md)  
**物理钉：** [`14_physical_impl_pins.md`](./14_physical_impl_pins.md)  
**物理有效源：** [`12_effective_sources_list.md`](./12_effective_sources_list.md)  
**动画原理源卡：** [`sources/pf_a_survival_kit_map.md`](./sources/pf_a_survival_kit_map.md) · [`sources/pf_c_card_animation.md`](./sources/pf_c_card_animation.md)

**产品滤镜：**

```text
场景 = 进入关卡时，谜题区（puzzle）铺台发牌
主卖 = 利落、干净、遮挡语义可读
不做 = 默认震屏 · 全屏粒子 · CRT 常驻晃动 · 表演级 >2s 开场
认序 = 代码/14 钉 > 本表合成建议 > 外源竞品
外源用途 = 顺序语义 + 动画原理 + juice 分层抽象；不定死 ms
```

**证据等级：**

| 级 | 含义 |
|----|------|
| **S** | 规则/权威方法文（维基规则、Survival Kit 原理、NN/g 级） |
| **A** | 可复现产品行为 / 成熟设计拆解 / 官方商店定位 |
| **B** | 社区复刻、二方指南、录屏观察 — **不单独定 ms** |
| **L** | 本项目钉 · 源卡 · 本表合成 |

**纪律：**

```text
POC 第一手仍认 L-PF-14（飞行 z / flip breath / busy / 无默认震屏）
抽/洗回节奏旁证认 pf_c（stagger 40ms 家族）
手册原理认 pf_a + 本表 S-DA-01
竞品只借「顺序语义 + 调性边界」，参数以落地钉为准
噪声：炉石对战全套、Disney 误写成 Klondike 的二方文当规则真理
```

**一句话：**

> 发牌 = **遮挡依赖顺序 cascade** + 手册 **timing/spacing** + 短 **stagger**；Balatro 只学 **分层 juice 结构**，开场不做计分秀。

---

## 0. 落地结论摘要（调研 → 建议方案）

### 0.1 品类 / 竞品借到什么

| 抽象 | 含义 | 本项目用法 |
|------|------|------------|
| 从库区飞出 | Stock / 屏底牌库为起点 | 谜题发牌起点 ≈ Stock（y≈600）或屏外 |
| 遮挡依赖顺序 | 被压的先发 / 底层先 | **底层→高层**（或行优先 + 深度） |
| Pyramid 建塔 | 顶→底行递增、后行压前行 | 语义对齐「先落被压、后落压上」 |
| TriPeaks / Disney | 内层背牌 → 外层明牌 → active 槽 | 若有背牌：内层先；可玩边后；底槽另段 |
| 短 cascade | 总开场约 1–2s | 单张 120–160ms · stagger 40–50ms |
| 直线 vs 弧 | 谜题铺台偏清爽 | **直线飞入、无上抛弧**（14 钉） |
| 飞行高 z | 不穿已落座 | FX 带 ~8500–9500 → 落稳回 puzzle 层 |
| Juice 分层 | 主/次/音/屏效可叠 | **开场只开主+极轻次**；震屏关 |
| 手册 Timing/Spacing | 时长 + 疏密 = 手感 | ease-in-out；可选 30–50ms antic |
| Follow-through | 位先到、角后稳 | 落座 breath 1.3 + ±3–8° 再收 |

### 0.2 建议流程（草案 · 待升钉）

```text
1. 可选 Anticipation ~40ms：Stock 微下沉 / 0.98 scale
2. Deal cascade：
   - 顺序：遮挡底层 → 顶层
   - 轨迹：Stock → 槽位，直线，ease-in-out
   - duration 120–160ms · stagger 40–50ms
   - flight z = FX；落稳 z = puzzle 静止层
3. Settle：可选 FlipToFace + 1.3 breath + 小随机角
4. Unlock：最后一张进入 settle/flip 时清 isBusy
5. 全程：无默认震屏 · 无复杂粒子 · SFX 极轻或仅 tick
```

### 0.3 与现有代码 / 钉的关系

| 能力 | 认谁 |
|------|------|
| 飞行 z / busy / flip breath / 无弧谜题飞入 | **L-PF-14** |
| 抽移 / 回库 stagger 量级 | **pf_c** · 14 抽洗回 |
| 缓动 / 预备 / 重叠原理 | **pf_a** · 本表 S-DA-* |
| 意图解码 | **无关**（发牌期 busy） |
| 实现 API | 现工程动画器 / tween（非每帧物理） |

### 0.4 明确缺口（需真机/落地钉）

1. 发牌顺序：逐行 vs 纯深度 vs 列扫 — **产品拍板**  
2. 初始牌面：全明 / 背飞再翻 / 仅内层背 — **规则+体验**  
3. 是否 tap-to-skip deal  
4. Disney / MSC 精确 ms — **仅录屏可钉，本表不定**

---

## 1. 入库优先级

| 批 | 内容 | Notebook |
|----|------|----------|
| **P0** | **本表** + 14 钉相关段 + pf_a + pf_c | **NLM 必收** |
| **P1** | 外源 URL 核心 6–8 条（规则 + 手册 + Balatro 拆解 + Steam） | 建议 |
| **P2** | 会话合成（已压进本表 0 节） | **不另灌长文** |
| **P3** | 竞品录屏逐帧笔记 | 有帧数据再补源卡 |
| — | 二方误导文（Disney=Klondike）全文 | **不入库** |

---

## 2. P0 · 本项目（L）

| ID | 路径 | 内容 |
|----|------|------|
| **L-DA-21** | `research/handfeel/21_deal_anim_effective_sources_list.md` | **本表** |
| **L-PF-14** | `research/handfeel/14_physical_impl_pins.md` | 飞行 z · flip · breath · busy · 直线飞入 · 无默认震屏 |
| **L-HF-12** | `research/handfeel/12_effective_sources_list.md` | 物理轨有效源总目录 |
| **L-PF-A** | `research/handfeel/sources/pf_a_survival_kit_map.md` | 生存手册 → 本产品 ms 映射 |
| **L-PF-C** | `research/handfeel/sources/pf_c_card_animation.md` | 抽/翻/洗回 stagger 范式 |
| **L-DZ-CL** | `docs/changelog/2026-07-23_drawzone_z_autodraw_dim.md` | 抽区 z · 静低动高 |
| **L-D03** | `docs/design/03_experience_and_innovation.md` | 干净 / 顿悟合同 |
| **L-CODE-P** | `src/render/phys.ts` | 现行参数（落地 deal 时扩展） |
| **L-CODE-C** | `src/render/cards.ts` · 布局/动画入口 | 发牌挂接候选 |

---

## 3. P1 · 外源 URL（S/A/B）

### 3.1 动画原理

| ID | 级 | 源 | 用于 |
|----|-----|-----|------|
| **S-DA-01** | S | Richard Williams, *The Animator's Survival Kit*（中译：动画师生存手册） | **Timing / Spacing** 总纲；预备、跟随、缓入缓出、重叠 |
| **S-DA-02** | A | Animation Mentor, *Anticipation: 12 Basic Principles* · [文](https://www.animationmentor.com/blog/anticipation-the-12-basic-principles-of-animation/) | 预备动作：主动作前蓄力；与结果「算得上」 |
| **S-DA-03** | A | 迪士尼 12 原则通识（Squash/Ease/Arc/Staging/Overlap…）· 多教材转述 | 原则清单；**本产品默认关强 squash** |
| **S-DA-04** | A | 中文导读：时间点与空间幅度 · 例 [知乎导读](https://zhuanlan.zhihu.com/p/279139825) | 中文速查 Timing≠Spacing |

### 3.2 Pyramid / 布局规则

| ID | 级 | 源 | 用于 |
|----|-----|-----|------|
| **S-DA-05** | S | Wikipedia, *Pyramid (solitaire)* · [文](https://en.wikipedia.org/wiki/Pyramid_(solitaire)) | 1→7 行建塔、后行压前行、28 张 + stock |
| **S-DA-06** | A | MobilityWare, *How to Play Pyramid Solitaire* · [文](https://www.mobilityware.com/how-to-play-pyramid-solitaire/) | 商业产品规则叙述；重叠行语义 |
| **S-DA-07** | A | Microsoft / 商店系 Pyramid 产品页（含 deal animation 卖点） | 「发牌动画」是品类默认体验 |

### 3.3 TriPeaks / Disney Solitaire

| ID | 级 | 源 | 用于 |
|----|-----|-----|------|
| **S-DA-08** | S | Wikipedia, *Tri Peaks (game)* · [文](https://en.wikipedia.org/wiki/Tri_Peaks_(game)) | 三峰建台：内层背 → 底行明 → stock/waste |
| **S-DA-09** | A | D23 / 官方叙事 · [3 Fun Facts…](https://d23.com/3-fun-facts-about-the-new-disney-solitaire-game/) | Disney Solitaire = **TriPeaks** 变体 + 主题包装 |
| **S-DA-10** | A | Google Play · Disney Solitaire · [页](https://play.google.com/store/apps/details?id=com.superplaystudios.disneysolitairedreams) | 产品定位：tripeaks + Disney 场景 |
| **S-DA-11** | B | BlueStacks 入门文 · [文](https://www.bluestacks.com/blog/game-guides/disney-solitaire/ds-beginners-guide-en.html) | 仅借「三区：桌面/库/底槽」结构；**规则名有误（写 Klondike）→ 不采信玩法** |

### 3.4 Balatro（小丑牌）· Steam + 反馈设计

| ID | 级 | 源 | 用于 |
|----|-----|-----|------|
| **S-DA-12** | A | Steam · *Balatro* · [店](https://store.steampowered.com/app/2379780/Balatro/) | 官方定位：hypnotically satisfying；CRT 像素；deckbuilder poker |
| **S-DA-13** | A | Blake Crosley, *Balatro: Juicy Feedback in a Poker Roguelike* · [文](https://blakecrosley.com/guides/design/balatro) | **Juice 分层栈**；±3°；滚分 stagger；震屏作信息；手牌微动 |
| **S-DA-14** | B | LocalThunk AMA · [r/Games](https://www.reddit.com/r/Games/comments/1bdtmlg/ama_i_am_localthunk_developer_and_artist_for/) | juice 开发乐趣；CRT/震动可关（无障碍） |
| **S-DA-15** | B | Mix and Jam / Godot 复刻 *Recreating Balatro's Game Feel* 等视频 | 抽牌、扇形曲线、hover punch 的工程观察 |

### 3.5 已有本库交叉（勿重复灌）

| ID | 源 | 关系 |
|----|-----|------|
| **S-IT-03** | NN/g Drag-and-Drop | 意图轨已收；发牌期 busy 不冲突 |
| **S-IT-04** | Smart Interface DnD UX | 同上 |
| **L-PF-A / L-PF-C** | 见 §2 | 原理与纸牌范式主源 |

**不入库 / 旁证噪声：**

- 仅营销无行为细节的 offer 帖  
- 把 Disney 当 Klondike 的二方全文当真  
- 要求逐帧抄 Balatro CRT / 强震屏的教程  
- 炉石全套对战 juice  

---

## 4. 可迁移对照表（定稿方向）

| 外源概念 | 迁移 | 本项目 |
|----------|------|--------|
| Pyramid 顶→底建塔 | ✅ 顺序语义 | 底层先发、后发压上 |
| TriPeaks 内→外 + active | ✅ 分段 | 谜题 cascade →（可选）waste 就绪 |
| Stock 起点 | ✅ | 库区 / 屏底 |
| 短 stagger cascade | ✅ | 40–50ms 家族（对齐洗回） |
| 直线飞入谜题 | ✅（14） | 无上抛弧 |
| Survival Kit Timing | ✅ | 120–160ms 轻快标准短 |
| Survival Kit Spacing / Ease | ✅ | ease-in-out |
| Anticipation | ⚠️ 极短 | 可选 30–50ms；禁止 200ms 蓄力 |
| Follow-through | ✅ | breath + 小角后稳 |
| Overlap stagger | ✅ | 发牌阶梯；N 大可加速（未钉） |
| Balatro juice stack | ⚠️ 结构 | 开场只主层；结果高光再叠 |
| Balatro ±3° / spring | ⚠️ | 角可用；spring 偏结果事件 |
| Balatro 常驻晃动 / 强震 | ❌ 默认 | 干净差异化；可选设置未来再议 |
| Staging 一次一事 | ✅ | 发牌时不抢计分/粒子 |
| Squash 牌面 | ❌ | 默认关 |

---

## 5. 反模式（有效源共识 + 产品钉）

1. 开场发牌 >2s 表演拖死节奏  
2. 匀速 linear 滑轨感、无 spacing  
3. 谜题飞入大弧/上抛（与 14 直线清爽冲突）  
4. 飞行 z 过低穿插已落座牌  
5. 落稳不回静止层 / 全程卡 FX 层  
6. 默认震屏、CRT 晃、满粒子盖牌面  
7. 发牌中可点正在飞的牌导致状态错乱  
8. 用 Balatro 计分秀节奏做铺台  
9. 忽略遮挡顺序导致「先压后底」物理撒谎  
10. 用二方错误规则文覆盖产品规则  

---

## 6. Notebook 建议入库顺序

```text
1. research/handfeel/21_deal_anim_effective_sources_list.md  （本表 · 必）
2. 已有则跳过：14 / 12 / pf_a / pf_c
3. 可选 URL（各 1 条即可，省配额）：
   - S-DA-05 Pyramid wiki
   - S-DA-08 TriPeaks wiki
   - S-DA-12 Steam Balatro
   - S-DA-13 Balatro juice 拆解
   - S-DA-02 Anticipation（或仅依赖 pf_a 文字）
```

**本批会话建议立即收：** 本表 markdown + 下列 URL（若尚未在库）：

| 优先 | URL |
|------|-----|
| 1 | https://en.wikipedia.org/wiki/Pyramid_(solitaire) |
| 2 | https://en.wikipedia.org/wiki/Tri_Peaks_(game) |
| 3 | https://store.steampowered.com/app/2379780/Balatro/ |
| 4 | https://blakecrosley.com/guides/design/balatro |
| 5 | https://d23.com/3-fun-facts-about-the-new-disney-solitaire-game/ |
| 6 | https://www.animationmentor.com/blog/anticipation-the-12-basic-principles-of-animation/ |

---

## 7. 版本

| 版本 | 日期 | 变更 |
|------|------|------|
| **v1** | **2026-07-24** | 初版：进关发牌调研有效源（Pyramid / Disney·TriPeaks / Survival Kit / Balatro）+ 合成方案 + 反模式 |
