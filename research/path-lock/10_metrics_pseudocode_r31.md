# R3.1 · 指标可算式（伪代码）

语言：TypeScript 风格，可直接落 `src/data/pathLockMetrics.ts`。

```typescript
import type { Level, LevelCardDef, Rank, Suit } from '../core/types';
import { matchKey, matchKeyOf, suitColor } from '../core/types';
import type { Level01DealMeta } from './level01Deal';
import { canFullyClear } from './levelSolve';

export type MatchKey = string; // `${rank}_${red|black}`

/** 全场（puzzle+stock）某 match-key 张数 */
export function countMatchKey(level: Level, key: MatchKey): {
  board: number;
  stock: number;
  total: number;
} {
  let board = 0;
  let stock = 0;
  for (const c of level.cards) {
    if (matchKeyOf(c) === key) board++;
  }
  for (const s of level.stock) {
    if (s.suit && matchKey(s.rank, s.suit) === key) stock++;
  }
  return { board, stock, total: board + stock };
}

/** M2: 每把锁的 scarcity */
export function keyScarcityByLock(
  level: Level,
  meta: Level01DealMeta,
): Array<{ lockId: string; key: MatchKey; total: number; board: number }> {
  return meta.lockIds.map((lockId) => {
    const card = level.cards.find((c) => c.id === lockId);
    if (!card?.suit) throw new Error(`lock ${lockId} missing`);
    const key = matchKey(card.rank, card.suit);
    const { total, board } = countMatchKey(level, key);
    return { lockId, key, total, board };
  });
}

/** M2 发局门槛：每把锁 total ∈ [lo, hi] */
export function passKeyScarcity(
  level: Level,
  meta: Level01DealMeta,
  lo = 2,
  hi = 4,
): boolean {
  if (meta.lockIds.length === 0) return true;
  return keyScarcityByLock(level, meta).every(
    (r) => r.total >= lo && r.total <= hi,
  );
}

/** M3: 钥匙桌面率（所有锁 key 合计） */
export function keyOnBoardRatio(level: Level, meta: Level01DealMeta): number {
  let board = 0;
  let total = 0;
  for (const row of keyScarcityByLock(level, meta)) {
    board += row.board;
    total += row.total;
  }
  return total === 0 ? 1 : board / total;
}

export function passKeyOnBoard(
  level: Level,
  meta: Level01DealMeta,
  minRatio: number,
): boolean {
  return keyOnBoardRatio(level, meta) >= minRatio;
}

/** M1: 贪心可清 */
export function passClearGreedy(level: Level, seed: number): boolean {
  return canFullyClear(level, seed + 1);
}

/**
 * M6 近似：锁被几层「更高 tier 且 footprint 可能压住」的组顶压着
 * 粗糙：统计 id 同列邻域更高 tier 存活组数 — 完整版应用 isFree 反事实
 * 发局可选，不强制
 */
export function lockCoverProxy(
  level: Level,
  lockId: string,
): number {
  const lock = level.cards.find((c) => c.id === lockId);
  if (!lock) return 0;
  const lockTier = lock.tier ?? 0;
  // 简化：比锁 tier 高的牌数量 / 3 作层数代理
  const higher = level.cards.filter(
    (c) => (c.tier ?? 0) > lockTier,
  ).length;
  return Math.ceil(higher / 12); // 粗：每约 12 张上层算 1「压层」
}

/**
 * M7 近似需要模拟，发局可不卡：
 * 在「假设锁已 free」时，统计其它 free 同 key 数
 * 完整实现应挂 rules.freeCardIds；此处仅定义意图
 */
export function redundantKeyAtExposeIntent(): string {
  return `
  state = createStateFromLevel(level)
  // 暴力：移除所有 layer 高于锁的、且 rect 与锁相交的牌（近似掀开）
  // 或运行 solver 直到 isFree(lock)
  // n = count free cards with same matchKey as lock, excluding lock
  // healthy: n <= 1
  `;
}

/** 发局总门槛 hard */
export function passDealHard(
  level: Level,
  meta: Level01DealMeta,
): boolean {
  if (!passClearGreedy(level, meta.seed)) return false;
  if (!passKeyScarcity(level, meta, 2, 4)) return false;
  if (!passKeyOnBoard(level, meta, 0.7)) return false;
  return true;
}

/** 发局总门槛 extreme（可略松 clear 重试次数，但密度仍卡） */
export function passDealExtreme(
  level: Level,
  meta: Level01DealMeta,
): boolean {
  if (!passKeyScarcity(level, meta, 2, 4)) return false;
  if (!passKeyOnBoard(level, meta, 0.85)) return false;
  // clear：优先 true；实现时可允许多 roll
  return passClearGreedy(level, meta.seed);
}
```

## 发局 vs Dashboard

| 指标 | 卡发局 hard | 卡发局 extreme | 仅统计 |
|------|:-----------:|:--------------:|:------:|
| M1 clear_greedy | ✅ | ✅（多 roll） | |
| M2 scarcity 2–4 | ✅ H1 | ✅ | |
| M3 board ratio | ✅ 0.7 | ✅ 0.85 | |
| M6 cover proxy | | | ✅ |
| M7 redundant | | | ✅ 需模拟 |
| M8 dead_rate | | | ✅ Monte Carlo |

## 单测挂钩（R5 时）

```typescript
it('hard deal: each lock match-key count in 2..4', () => {
  for (const s of [1, 2, 7, 11, 42]) {
    const { level, meta } = dealLevel01(s, 24, 'hard');
    expect(passKeyScarcity(level, meta, 2, 4)).toBe(true);
    expect(passClearGreedy(level, meta.seed)).toBe(true);
  }
});
```
