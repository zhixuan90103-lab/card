# FA-B4 · 缓动语言统一

**日期：** 2026-07-22  
**可信度：** 高（Material / 移动指南 + 代码一致）  
**填入：** `04` 缓动列

## 源

- Material ease-out 默认；Appy Pie：进入/反馈用 ease-out  
- 代码：`flyAway` / `snapBack` 皆 `ease = 1 - (1-u)²`（quad out）

## 建议统一表

| 动画 | 缓动 | 时长 | 备注 |
|------|------|------|------|
| 选中/取消 | 即时或 ease-out | 0–80ms | 位移 4px 可瞬时 |
| 消牌 flyAway | **ease-out quad** | 240–300 | ✅ 现状 |
| 弹回 snapBack | **ease-out quad** | 140–180 | ✅ 现状；可略短 |
| 伪翻 | ease-in-out | 120–200 | 中点换面 |
| 抽飞入（若做） | ease-out | ≤180 | P1 |
| 庆祝 | 可选 spring | ≤800 可点 | E12；非默认牌桌 |

## 不做

- 常规操作 spring 过冲（显飘）  
- 线性消牌（机械）  
- 多属性乱叠（scale+rotate+α+粒子）

## 结论

缓动 **已统一够用**；检索关闭。POC 只调 **ms 与 scale**，不换曲线家族。
