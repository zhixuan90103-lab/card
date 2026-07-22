/**
 * 关卡配点：pair-first + 同组互异
 * 见 docs/design/15_level_rank_design.md
 */
import { mulberry32, shuffleInPlace } from '../core/rng';
import type { Rank } from '../core/types';

export const ALL_RANKS: Rank[] = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
];

export type GroupSpec = {
  /** group key e.g. g00, c12, d01 */
  key: string;
  /** bottom → top ranks length */
  size: number;
  /**
   * Optional forced ranks by stack index (0=bottom … size-1=top).
   * null = free for assigner.
   */
  forced?: Array<Rank | null>;
};

/** Multiset bag of ranks (mutable counts). */
export type RankBag = Map<Rank, number>;

export function emptyBag(): RankBag {
  return new Map();
}

export function bagAdd(bag: RankBag, rank: Rank, n = 1): void {
  bag.set(rank, (bag.get(rank) ?? 0) + n);
}

export function bagTake(bag: RankBag, rank: Rank): boolean {
  const n = bag.get(rank) ?? 0;
  if (n <= 0) return false;
  if (n === 1) bag.delete(rank);
  else bag.set(rank, n - 1);
  return true;
}

export function bagTotal(bag: RankBag): number {
  let t = 0;
  for (const n of bag.values()) t += n;
  return t;
}

export function bagClone(bag: RankBag): RankBag {
  return new Map(bag);
}

/**
 * Build a pair-only bag totaling exactly `total` cards (must be even).
 * Ranks distributed as evenly as possible across ALL_RANKS.
 */
export function buildPairBag(total: number, seed = 42): RankBag {
  if (total % 2 !== 0) {
    throw new Error(`buildPairBag: total must be even, got ${total}`);
  }
  const pairs = total / 2;
  const bag = emptyBag();
  // Base 2 per rank cycling until pairs exhausted
  let remaining = pairs;
  let i = 0;
  while (remaining > 0) {
    const r = ALL_RANKS[i % ALL_RANKS.length]!;
    bagAdd(bag, r, 2);
    remaining -= 1;
    i += 1;
  }
  // Light shuffle of which ranks got extra pairs is already by cycle order;
  // deterministic for seed via later draws using mulberry32.
  void seed;
  return bag;
}

/**
 * Assign ranks to groups.
 * - R2: all ranks within a group **strictly** distinct
 * - Forced tops/bottoms honored when possible
 * - Retries with different group order if stuck
 * Returns map groupKey → ranks[bottom…top]
 * Leftover bag written back (usually empty if bag size == puzzle slots).
 */
export function assignGroupRanks(
  groups: GroupSpec[],
  bag: RankBag,
  seed = 42,
): Map<string, Rank[]> {
  const source = bagClone(bag);
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < 48; attempt++) {
    try {
      const work = bagClone(source);
      const result = assignGroupRanksOnce(groups, work, seed + attempt * 17);
      bag.clear();
      for (const [r, n] of work) bag.set(r, n);
      return result;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr ?? new Error('assignGroupRanks: failed');
}

function assignGroupRanksOnce(
  groups: GroupSpec[],
  work: RankBag,
  seed: number,
): Map<string, Rank[]> {
  const rand = mulberry32(seed);
  const out = new Map<string, Array<Rank | null>>();

  // 1) Apply forced ranks first
  for (const g of groups) {
    const ranks: Array<Rank | null> = Array.from({ length: g.size }, () => null);
    if (g.forced) {
      for (let i = 0; i < g.size; i++) {
        const f = g.forced[i] ?? null;
        if (f == null) continue;
        if (!bagTake(work, f)) {
          throw new Error(
            `assignGroupRanks: forced rank ${f} missing in bag for ${g.key}`,
          );
        }
        if (ranks.includes(f)) {
          throw new Error(
            `assignGroupRanks: forced duplicate ${f} in group ${g.key}`,
          );
        }
        ranks[i] = f;
      }
    }
    out.set(g.key, ranks);
  }

  // 2) Fill remaining — shuffle group order for retries
  const order = [...groups];
  shuffleInPlace(order, rand);
  order.sort((a, b) => b.size - a.size); // still prefer larger first after shuffle of ties

  for (const g of order) {
    const ranks = out.get(g.key)!;
    for (let i = 0; i < g.size; i++) {
      if (ranks[i] != null) continue;
      const used = new Set(ranks.filter((r): r is Rank => r != null));
      const candidates: Rank[] = [];
      for (const [r, n] of work) {
        if (n > 0 && !used.has(r)) candidates.push(r);
      }
      if (candidates.length === 0) {
        throw new Error(
          `assignGroupRanks: no distinct rank for ${g.key}[${i}] used=${[...used].join(',')}`,
        );
      }
      // Prefer ranks with higher remaining count (keep diversity late)
      shuffleInPlace(candidates, rand);
      candidates.sort(
        (a, b) => (work.get(b) ?? 0) - (work.get(a) ?? 0),
      );
      const pick = candidates[0]!;
      bagTake(work, pick);
      ranks[i] = pick;
    }
    const final = ranks as Rank[];
    if (new Set(final).size !== final.length) {
      throw new Error(`assignGroupRanks: R2 fail ${g.key}: ${final.join(',')}`);
    }
    out.set(g.key, final);
  }

  return out as Map<string, Rank[]>;
}

/** Flush leftover bag into stock entries (order by rank then count). */
export function bagToStock(
  bag: RankBag,
): Array<{ id: string; rank: Rank }> {
  const stockRanks: Rank[] = [];
  for (const [r, n] of bag) {
    for (let i = 0; i < n; i++) stockRanks.push(r);
  }
  bag.clear();
  return stockRanks.map((rank, i) => ({
    id: `s${String(i + 1).padStart(2, '0')}`,
    rank,
  }));
}

/** Assert R2 for a list of group rank arrays. */
export function assertGroupsDistinct(groups: Map<string, Rank[]>): void {
  for (const [key, ranks] of groups) {
    if (new Set(ranks).size !== ranks.length) {
      throw new Error(`R2 violated in group ${key}: ${ranks.join(',')}`);
    }
  }
}

/** Count ranks in cards + stock; return odd ranks. */
export function oddRanks(
  cards: Array<{ rank: Rank }>,
  stock: Array<{ rank: Rank }>,
): Rank[] {
  const m = new Map<Rank, number>();
  for (const c of cards) m.set(c.rank, (m.get(c.rank) ?? 0) + 1);
  for (const s of stock) m.set(s.rank, (m.get(s.rank) ?? 0) + 1);
  const odds: Rank[] = [];
  for (const [r, n] of m) if (n % 2 === 1) odds.push(r);
  return odds;
}

/**
 * Fix parity by appending ranks to stock until all even.
 */
export function fixParityInStock(
  stock: Array<{ id: string; rank: Rank }>,
  cards: Array<{ rank: Rank }>,
): Array<{ id: string; rank: Rank }> {
  const m = new Map<Rank, number>();
  for (const c of cards) m.set(c.rank, (m.get(c.rank) ?? 0) + 1);
  for (const s of stock) m.set(s.rank, (m.get(s.rank) ?? 0) + 1);
  const out = [...stock];
  for (const [r, n] of m) {
    if (n % 2 === 1) {
      out.push({
        id: `s${String(out.length + 1).padStart(2, '0')}`,
        rank: r,
      });
    }
  }
  return out;
}

export type DiverseStockOpts = {
  /** Target stock size (will be at least parity fixes; may be slightly under if caps bind) */
  targetSize?: number;
  /** Max copies of one rank inside stock (default 2 — 避免库里同一点刷屏) */
  maxPerRank?: number;
  seed?: number;
};

/**
 * 独立生成抽牌区：
 * - 先补全局偶数（R1）
 * - 再扩到 targetSize，优先新 rank，**stock 内每 rank ≤ maxPerRank**
 * - 全程保持全局偶数
 * - 洗牌顺序可复现
 */
export function buildDiverseStock(
  cards: Array<{ rank: Rank }>,
  opts: DiverseStockOpts = {},
): Array<{ id: string; rank: Rank }> {
  const targetSize = opts.targetSize ?? 20;
  const maxPerRank = opts.maxPerRank ?? 2;
  const rand = mulberry32(opts.seed ?? 42);

  const global = new Map<Rank, number>();
  for (const c of cards) global.set(c.rank, (global.get(c.rank) ?? 0) + 1);

  const stockCounts = new Map<Rank, number>();
  const ranks: Rank[] = [];

  const push = (r: Rank) => {
    ranks.push(r);
    stockCounts.set(r, (stockCounts.get(r) ?? 0) + 1);
    global.set(r, (global.get(r) ?? 0) + 1);
  };

  // 1) 全局奇数 rank 各补 1 张（R1）
  for (const r of ALL_RANKS) {
    if ((global.get(r) ?? 0) % 2 === 1) {
      if ((stockCounts.get(r) ?? 0) < maxPerRank) push(r);
      else {
        // 极端：该 rank 已达 stock 上限仍奇数 — 仍强制补 1（破上限保可解）
        push(r);
      }
    }
  }

  // 2) 扩容：保持全局偶数 → 每次给某 rank 加 2，或给已有 1 张的 rank 再加 1
  const canTake = (r: Rank, n: number) =>
    (stockCounts.get(r) ?? 0) + n <= maxPerRank;

  let guard = 0;
  while (ranks.length < targetSize && guard++ < 200) {
    const need = targetSize - ranks.length;
    // 优先：stock 中尚无、可加 2 的 rank（多样性）
    let pool = ALL_RANKS.filter(
      (r) => (stockCounts.get(r) ?? 0) === 0 && canTake(r, 2),
    );
    if (pool.length === 0) {
      // 其次：已有 1 张、可再加 1（凑满 2 且全局仍偶）
      pool = ALL_RANKS.filter(
        (r) => (stockCounts.get(r) ?? 0) === 1 && canTake(r, 1),
      );
    }
    if (pool.length === 0) {
      // 再次：已有 0 但只能… 或已有且可加 2
      pool = ALL_RANKS.filter((r) => canTake(r, 2));
    }
    if (pool.length === 0) break;

    shuffleInPlace(pool, rand);
    const r = pool[0]!;
    const have = stockCounts.get(r) ?? 0;
    if (have === 0 && need >= 2 && canTake(r, 2)) {
      push(r);
      push(r);
    } else if (have === 1 && canTake(r, 1)) {
      push(r);
    } else if (canTake(r, 2) && need >= 2) {
      push(r);
      push(r);
    } else {
      break;
    }
  }

  // 3) 若仍差 1 且某 rank 可 +1 且全局变偶… 通常偶数目标，跳过
  shuffleInPlace(ranks, rand);

  return ranks.map((rank, i) => ({
    id: `s${String(i + 1).padStart(2, '0')}`,
    rank,
  }));
}
