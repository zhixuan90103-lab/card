# 2026-07-22 · D22 红黑同点配对（默认全开）

## 规则

- **可消条件**：`rank` 相同 **且** 颜色相同  
  - 红：仅 **♥ 红桃**  
  - 黑：仅 **♠ 黑桃**  
  - （方片 / 梅花不使用）  
- 异色同点（如红桃 5 + 黑桃 5）→ **不可消**（改选）

## 难度

相对「仅同点」：**明显变难**（free 对更少、抽牌要撞颜色、配点维度 ×2）。已通过 L2 链/开局对/锁钥强制同色 + (rank,color) 偶数降低无解率。

## 代码

| 模块 | 改动 |
|------|------|
| `core/types.ts` | `suitColor` / `matchKey` / `canMatchCards` |
| `core/state.ts` | 配对用 `canMatchCards` |
| `core/stuck.ts` | 软/硬死局按 match key |
| `data/suitPaint.ts` | 上色 + 强制同色对 + 色偶补齐 |
| `data/level01Deal.ts` | deal 后 paint；L2/锁钥 forced |
| `data/levelSolve.ts` | 验收按 match key |
| `render/cards.ts` | 红黑字色 + 花色符号 |

## 教学文案

`teachHint`：同点且同花色才能消（红♥ 或 黑♠）。
