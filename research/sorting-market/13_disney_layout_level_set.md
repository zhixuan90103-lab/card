# Disney 系布局 · 关卡集 v1

**日期：** 2026-07-21  
**实现：** `src/data/levelFactory.ts` + `src/data/levels.ts`  
**规则：** 仍为同点配对（非 Disney ±1）；只借鉴 **摆放语法**。

## 模板

| ID | 对应调研 | 几何 |
|----|----------|------|
| `narrow` | 教学薄枕 | 2 free 腰带 + 浅 cascade |
| `pillow` | 主营销厚枕 | 3–4 free 横排腰带 + 密堆 + 压缝填缝 |
| `tripeaks` | TriPeaks 祖型 | 3 峰 tip free |
| `island` | 岛式 elaborate | 宽底感 + 中岛 free 腰带 |

## 约束（D18）

- 开局 free ∈ [2, 4]，**同一 y 腰带**
- 禁止 L 形 free
- 亮牌之上不再压更高层
- rank 偶数；中间填暗牌

## 12 关分配

| 关 | 模板 | free |
|----|------|------|
| 1–2 | narrow | 教学 |
| 3–4, 6, 8, 12 | pillow | 主路径 |
| 5, 9 | island | 变体 |
| 7, 10 | tripeaks | 变体 |
| 11 | narrow | 收紧 |

## 与 Disney 差异

- 消除：同点双选 vs ±1 接底牌  
- free 点数配置为成对优先  
- 无下注 / 无动物挡牌  
