# Changelog · 拖动意图：松手解码 / 少选错 / 趋势与重叠（2026-07-23）

**状态：** 已实现  
**钉文：** `research/handfeel/19_intent_impl_pins.md` · 有效源 `20_intent_effective_sources_list.md`  
**代码：** `src/core/rules.ts` · `src/main.ts` · `src/render/phys.ts` · `src/core/rules.test.ts`

---

## 0. 一句话

**拖消松手：可配优先 + 多探针（含画面牌心）+ 牌重叠即到位 + 滑动方向趋势；点选：扩热区 + 最近牌心。**  
解决「觉得已经滑到 A2 却不触发」与手机点错/认错邻居。

---

## 1. 玩家向

| 场景 | 改前 | 改后 |
|------|------|------|
| 牌视觉已盖到可配 A2 | 可能弹回 | 更容易成功 |
| 近旁不能配 free 更近 | 认错→弹回 | 认可配伙伴 |
| 两 free 贴边点选 | 易点高层错牌 | 认最近牌心 |
| 离可配很远 | 不应消 | 仍 snapBack |

---

## 2. 技术

| API / 参数 | 说明 |
|------------|------|
| `pickCard` | hitSlop + nearest center |
| `dropMatchTarget` | G/M/T score · probes · origin/vel · overlap · τ |
| `PHYS.pickHitSlop` | 12 |
| `PHYS.dropMatchTauScale` | 0.72 |
| `PHYS.dropScoreG/M/T` | 1 / 2.5 / 0.85 |

---

## 3. 文档

| 路径 | 角色 |
|------|------|
| `20_intent_effective_sources_list.md` | **有效源 List** |
| `15`–`19` | 计划/反查/事件/参数/钉 |
| `sources/intent_*` | A/B/C 源卡 |

---

## 4. 测试

`rules.test.ts`：可配优先、重叠接受、趋势放宽、点选最近中心等。
