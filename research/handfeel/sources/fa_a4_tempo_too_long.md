# FA-A4 · 「动画太长」怒点与时长上限

**日期：** 2026-07-22  
**可信度：** 高（社区抱怨一致 + UX 上限）  
**填入：** F5 · H-match 上限 · busy · E12

## 源

| # | 源 | 要点 |
|---|-----|------|
| 1 | [HS 论坛 · Animations are so slow it's painful](https://eu.forums.blizzard.com/en/hearthstone/t/animations-are-so-slow-its-painful/5411) | 要求砍半或可关；长动画 = 痛苦 |
| 2 | [HS · Please fix animation times on mobile](https://us.forums.blizzard.com/en/hearthstone/t/please-fix-animation-times-on-mobile/118155) | 移动端动画「不可接受」 |
| 3 | Appy Pie / NN 时长表 | 常用 &gt;400–500ms 显慢；阻塞动画应 &lt;300ms |
| 4 | art-ux juice 卡 · 反模式 X06 | 消牌/过关 &gt;1s 锁死高怒 |

## 观察

| 模式 | 玩家感受 | 对本产品 |
|------|----------|----------|
| 不可跳过的长演出 | 剥夺控制感 | 消牌默认 ≤300ms |
| 移动端更慢/更锁 | 手机更敏感 | R5 必测 |
| 重复动作上的长动画 | 疲劳倍增 | 每对消是高频 → 必须短 |
| 庆祝过长 | 点穿动画 | E12 ≤1s 可点 CTA |

## 可迁移阈值

```text
常用消牌：  240–300ms  ✅ 安全带
警戒线：    ≥400ms     仅稀有/可跳过
禁止默认：  ≥1000ms 锁输入且无 CTA
```

## 对本产品

| 决策 | 结论 |
|------|------|
| H-match | **上限钉 300ms**；默认 280 不超线 |
| A/B | 240 若「读不清」再回 280；**不试 350+** |
| busy | 仅匹配消牌（+短 snap 可选）；翻面不锁 |
| 连消缓冲 | P2：若高手嫌肉再开；非本轮必须 |
