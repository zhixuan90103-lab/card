/**
 * Level01 挖掘链 + 软锁/钥匙（外观与普通牌相同）
 *
 * ## 结构
 * 1. **开局（L2）**：仅一对 7，无锁、无抉择
 * 2. **挖掘**：消后新翻与场上 free 再连
 * 3. **锁在 L1**：L2 挖开后 L1 多 free，锁混在其中易被忽略
 * 4. **钥匙 ≥2（简单关）**：一把在 L2 挖开链上，一把也在 L1 侧路
 * 5. 开锁变顺；不解锁仍可外围推进
 *
 * 见 docs/design/15_level_rank_design.md
 */
import { mulberry32, shuffleInPlace } from '../core/rng';
import type { Rank } from '../core/types';
import { ALL_RANKS } from './rankDesign';

export type StackSpec = {
  key: string;
  size: number;
};

/**
 * 软锁 / 钥匙（仅数据角色；渲染不区分）
 *
 * 锁放在 **L1 组顶**，等 L2 揭开后才 free ——
 * 此时场上 free 选择多，玩家更容易忽略锁。
 */
export const LEVEL01_LOCK_KEY = {
  /** 锁：L1 中部组顶，L2 清开后 free */
  lockId: 'c11_2',
  lockRank: 'J' as Rank,
  /**
   * 钥匙（同点 J）
   * - d01_0：消开局 7 后翻出（主钥匙，较早）
   * - c20_2：L1 侧路组顶（第二把；与锁同层，多 free 时易漏）
   */
  keyIds: ['d01_0', 'c20_2'] as const,
  keyRank: 'J' as Rank,
  openingPairRank: '7' as Rank,
} as const;

/**
 * L2 [bottom, top] — 开局无锁
 *
 * 开局 free 顶：7, 7, 5, A, Q, K（仅 7-7）
 * 消 7 → 翻 5 与 J(钥匙1)，与场上 5 连；钥匙暂无锁可配（锁还在 L1 下）
 *
 * 路径：
 * 1. 7-7
 * 2. 5-5
 * 3. A-A
 * 4. Q-Q
 * 5. K-K
 * 6. 3-3
 * 期间钥匙 J 可能已 free，等 L1 锁出现再开锁
 */
export const LEVEL01_L2_CHAIN: Record<string, [Rank, Rank]> = {
  d00: ['5', '7'],
  d01: ['J', '7'], // 钥匙1 在 7 下
  d02: ['A', '5'],
  d10: ['3', 'A'],
  d11: ['K', 'Q'],
  d12: ['3', 'K'],
};

/**
 * L1 [bot, mid, top]
 * - c11_2 = 锁 J（中部，L2 打开后与多张 free 并存）
 * - c20_2 = 钥匙2 J（侧路）
 * - 其余 tops 约 1 对上手 + 单点挖 mid
 */
export function buildL1DigRanks(_seed: number): Map<string, Rank[]> {
  // c{r}{c} r0-2 c0-3，index = r*4+c
  //          c0   c1   c2   c3
  // r0       0    1    2    3
  // r1       4    5    6    7
  // r2       8    9   10   11
  const tops: Rank[] = [
    '2',
    '2', // c00 c01 一对
    '4',
    '5', // c02 c03
    '6',
    'J', // c10 c11 ← 锁 top J
    '8',
    '9', // c12 c13
    'J', // c20 ← 钥匙2 top J（侧路）
    'Q', // c21
    'K', // c22
    '4', // c23
  ];

  const mids: Rank[] = [
    '4',
    '5',
    '6',
    '8',
    '9',
    '10', // c11 mid，≠ J
    'A',
    'Q',
    '6', // c20 mid ≠ J
    '8',
    '9',
    '10',
  ];

  const bots: Rank[] = [
    '8',
    '9',
    '10',
    'A',
    '2',
    '5', // c11 bot ≠ J
    'Q',
    'K',
    'A', // c20 bot
    '2',
    '5',
    '6',
  ];

  // 强制角色
  tops[5] = LEVEL01_LOCK_KEY.lockRank; // c11_2
  tops[8] = LEVEL01_LOCK_KEY.keyRank; // c20_2

  const keys: string[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) keys.push(`c${r}${c}`);
  }

  const out = new Map<string, Rank[]>();
  for (let i = 0; i < keys.length; i++) {
    let bot = bots[i]!;
    let mid = mids[i]!;
    const top = tops[i]!;
    if (mid === top) {
      mid = ALL_RANKS.find((r) => r !== top && r !== bot) ?? 'A';
    }
    if (bot === top || bot === mid) {
      bot = ALL_RANKS.find((r) => r !== top && r !== mid) ?? '2';
    }
    out.set(keys[i]!, [bot, mid, top]);
  }
  return out;
}

export function fillRemainingGroups(
  forced: Map<string, Rank[]>,
  groups: StackSpec[],
  seed: number,
): Map<string, Rank[]> {
  const rand = mulberry32(seed);
  const out = new Map<string, Rank[]>();
  const usedGlobal = new Map<Rank, number>();

  for (const [k, ranks] of forced) {
    out.set(k, [...ranks]);
    for (const r of ranks) usedGlobal.set(r, (usedGlobal.get(r) ?? 0) + 1);
  }

  for (const g of groups) {
    if (out.has(g.key)) continue;
    const ranks: Rank[] = [];
    const local = new Set<Rank>();
    for (let i = 0; i < g.size; i++) {
      const candidates = ALL_RANKS.filter((r) => !local.has(r));
      shuffleInPlace(candidates, rand);
      candidates.sort(
        (a, b) => (usedGlobal.get(a) ?? 0) - (usedGlobal.get(b) ?? 0),
      );
      const pick = candidates[0] ?? ALL_RANKS[0]!;
      ranks.push(pick);
      local.add(pick);
      usedGlobal.set(pick, (usedGlobal.get(pick) ?? 0) + 1);
    }
    out.set(g.key, ranks);
  }
  return out;
}
