# FA-A1 · 配对点选 / 消牌反馈时长

**日期：** 2026-07-22  
**可信度：** 中–高（UX 时长权威 + 移动动画综述；缺本品类逐帧）  
**填入：** F1/F3 · H-match · E01/E03

## 源

| # | 源 | 类型 |
|---|-----|------|
| 1 | NN/g *Executing UX Animations*（已有 art-ux `r1_nng_animation_duration`） | 高权威 |
| 2 | [Mobile App Animation Guide · Appy Pie 2026](https://www.appypie.com/blog/mobile-app-animation-guide) | 综述/行业表 |
| 3 | [UX.SE · Optimal mobile tap feedback duration](https://ux.stackexchange.com/questions/90592/optimal-mobile-tap-feedback-animation-duration) | 讨论 |
| 4 | art-ux `r1_juice_dose_and_lock` | 内部交叉 |

## 观察（可迁移）

| 项 | 值 | 映射 |
|----|-----|------|
| 微反馈（点按确认） | **80–120ms**；≤100ms 体感「立即」 | E01 选中出态 |
| 标准运动 | **200–300ms** ease-out | E03 消牌主带 |
| 小位移元素 | 可更短（~100ms）；大位移 200–350ms | 抬升 4px 不必 200ms 动画 |
| 下界 | **&lt;80ms** 常「像没动」；上界常用 **&gt;400–500ms** 显慢 | 忌消牌 400ms+ 作默认 |
| 缓动默认 | **ease-out**（快起慢收） | 现状 `1-(1-t)²` 合格 |
| 成功消 | 短清脆 + 状态消失可读 | flyAway：位移+α+scale |
| 剂量 | 常用薄、完成略厚；阻塞动画应短 | L3 中、L5 仍 ≤1s CTA |

## 玩家/设计话术（消牌节奏）

- 「要感觉到消了」→ 需可感知运动（非 0ms 瞬删）  
- 「不要等动画才能再点」→ busy 窗口 ≈ 消牌时长；忌叠长庆祝  
- 炉石等（A4）证明：**长锁动画是高怒点**；本产品更应守 240–300ms

## 不可迁移

- 记忆翻牌 Memory 的「两张翻开再比」时序（本产品是层叠 free 配对）  
- 支付成功 500–800ms 庆祝 → 仅映射 E12 且可点跳过

## 对本产品建议

| 参数 | 建议 | 状态 |
|------|------|------|
| 选中 | ≤100ms 出态（即时 y-4 亦可） | ✅ 代码即时 |
| 消牌 H-match | **默认 280 保持**；A/B **240** | 区间有外部印证 |
| 缓动 | ease-out quad 保持 | ✅ |
| 点消 vs 拖消 | **同一 flyAway / 同 L3** | 见 A6 |
