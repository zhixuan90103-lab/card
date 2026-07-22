# 2026-07-22 · 拖拽配对 + 牌背资源 + 抽牌区常驻阴影

**状态：** 已实现（工作区改动，见文末文件清单）  
**范围：** 输入 / 表现层为主；规则侧仅增加显式配对 API  
**未改：** 配点 / 路径锁 / 胜负 / isFree 语义  

---

## 0. 一句话

**可拖 free 牌到同点同色另一张上松手消除；拖到不同牌或空白则弹回。**  
点选两张配对仍保留。抽牌区 / 抽出叠座位阴影常驻。牌背换为灰蓝皇冠 `Card_B.png`。

---

## 1. 拖拽配对（操作）

| 操作 | 结果 |
|------|------|
| **短按不拖**（移动 &lt; 8 design px） | 原逻辑：点选 / 再点配对 / 改选 / 取消 |
| **拖到匹配牌**（同 rank + 同 suit ♥/♠）松手 | `tryMatchPair` → 飞走消除 |
| **拖到不同牌 / 空白** 松手 | `snapBack` 回原座位 |
| **pointercancel** | 若已在拖 → snapBack；否则清拖拽态 |
| 抽牌区背面 | **不可拖**（stock 非 free）；点空库区仍抽牌 |

### 命中

- 落点优先用**被拖牌中心**做 `pickCard`；中心未中再试指针点。  
- `pickCard(state, p, { excludeId })` 排除自身，避免盖住目标时误命中自己。  
- 可点集仍 = **isFree + AABB**（D17）。

### 动画 / busy

| 状态 | 表现 |
|------|------|
| 拖中 | zIndex 抬高、scale 1.04、跟手 |
| 匹配 | `flyAway`（约 280ms） |
| 不匹配 | `snapBack`（约 180ms ease-out） |
| `isBusy` | `animating` **或** `dragPos` 非空 → 禁止新输入 |

### 核心 API

| API | 位置 | 说明 |
|-----|------|------|
| `pickCard(..., { excludeId? })` | `core/rules.ts` | 拖放落点排除自己 |
| `GameSession.tryMatchPair(a,b)` | `core/state.ts` | 显式一对 free 匹配；与 tap 共用 `applyMatch` |
| `CardRenderer.setDragPosition` | `render/cards.ts` | 跟手 + 拖时牌影 |
| `CardRenderer.snapBack` | 同上 | 弹回原位 |
| `CardRenderer.getHomePosition` | 同上 | 抓取偏移 / 回弹目标 |
| pointer 管线 | `main.ts` | down / move / up / cancel + capture |

### 单测增量

- `pickCard` + `excludeId`  
- `tryMatchPair` 成功消对 / 拒绝不同色点 / 拒绝同 id  

---

## 2. 牌背资源

| 项 | 内容 |
|----|------|
| 路径 | `public/cards/Card_B.png` |
| 尺寸 | 188×248 RGBA |
| 视觉 | 灰蓝底 + 中央皇冠剪影 + 圆角浅边 |
| 加载 | `cardAssets.ts` → `Card_B.png`（`ASSET_VER=Date.now()` 缓存戳） |

正面 `R_*` / `B_*` 未改。

---

## 3. 抽牌区 / 抽出叠 · 座位阴影常驻

| 问题 | 旧行为 | 新行为 |
|------|--------|--------|
| 空堆 | 幽灵框，阴影随牌消失 | **座位阴影常驻**（与卡牌阴影同参） |
| 有牌 | 牌自带阴影 | 座位阴影固定；牌在座上**不叠第二层影** |
| 拖走 | 阴影跟走，座位变空 | 座位影留在原位；拖牌自带影 |

实现：`stockSeatShadow` / `wasteSeatShadow`（zIndex 3），`syncPileSeatShadows()` 每次 `syncEmptySlots` 重绘；参数走 `cardShadowRuntime`（调参面板仍生效）。

空堆幽灵框（虚位描边）逻辑不变，叠在座位影之上。

---

## 4. 文件清单

| 文件 | 改动 |
|------|------|
| `src/main.ts` | 拖拽输入管线；短按→tap；松手匹配/弹回 |
| `src/render/cards.ts` | drag/snapBack；座位常驻影；pile 在座免叠影 |
| `src/core/rules.ts` | `pickCard` excludeId |
| `src/core/state.ts` | `tryMatchPair` + `applyMatch` 抽取 |
| `src/core/rules.test.ts` | excludeId / tryMatchPair 用例 |
| `public/cards/Card_B.png` | 新牌背 |

---

## 5. 验证

```bash
npx vitest run src/core/rules.test.ts
npm run dev
# 1) 拖两张同色同点 free → 消除
# 2) 拖到不同牌 → 弹回
# 3) 短按仍可点选配对
# 4) 抽光 / 抽出叠消空后座位阴影仍在
# 5) 牌背为皇冠灰蓝
```

---

## 6. 与既有文档关系

| 文档 | 关系 |
|------|------|
| `full_roundup` | 规则权威；本文补 **操作通道（拖）** 与表现 |
| `poker_assets` | 正面包；本文更新背面迭代 |
| `HANDOFF_ART_UX` | 体验窗口；勾选拖/影/背相关项 |
| `02_game_rules` §5 | 操作改为 **点选 + 拖放** 双通道 |

**未新增决策 ID**（D17/D22 仍约束合法集与匹配条件；拖只是操作通道）。
