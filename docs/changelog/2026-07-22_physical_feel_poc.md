# Changelog · 物理手感 POC（按 14 实现钉）

**日期：** 2026-07-22  
**依据：** `research/handfeel/14_physical_impl_pins.md` · `10`/`11` v0.2

## 做了什么

| 能力 | 说明 |
|------|------|
| **选中浮动** | y-10 · scale 1.06 · 金边（替 y-4 only） |
| **意图高亮** | 同色同点 free 最多 4 张 scale 1.05 |
| **合法消** | 对撞 meet 120ms → **共抛** exit 260ms（点/拖同一套） |
| **拖消** | 中心已近则 skip meet |
| **S3** | match 后 `sync(skip)` + 仅 HUD；exit 后 flip 新 free |
| **翻牌** | 伪翻 + 呼吸 scale 1.08 · **不 busy** |
| **抽** | 先 stock→waste 位移再翻面 |
| **洗回** | 扣背表现 + stock 依次落位（N 大加速） |
| **常量** | `src/render/phys.ts` · `PHYS` |

## 文件

- `src/render/phys.ts`（新）
- `src/render/cards.ts`（meet / exitPairShared / flip / draw / recycle / hints）
- `src/main.ts`（playMatchClear · doDraw 两段 · 无 full refresh 冲动画）

## 验收（手动）

- [ ] 点选浮起；同 key free 放大  
- [ ] 点消：撞→抛旋出屏  
- [ ] 拖消：同档出场  
- [ ] 抽：飞到抽出叠再翻  
- [ ] 洗回：多张依次回库不太拖  
- [ ] 消后新 free 有翻牌感  
- [ ] busy 中不能乱点/撤  

## 未做 / 后续

- 参数未回写 art-ux/03 升格（仍草案）  
- 真机 A/B  
- 连消跳过动画  
