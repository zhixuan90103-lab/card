/**
 * 路径锁指标（H1）：锁 match-key 稀缺度、桌面钥匙率、发局门槛
 */
import type { Level, LevelCardDef, Rank, Suit } from '../core/types';
import { matchKey, pickSuitForColor, suitColor } from '../core/types';
import { canFullyClear, probeGreedyProgress } from './levelSolve';
import type { StockEntry } from './suitPaint';

/** 硬门槛：稀缺不得越界 */
export const KEY_SCARCITY_HARD_LO = 2;
export const KEY_SCARCITY_HARD_HI = 4;
/** 偏好：near-miss 优先 3～4（锁+约两钥） */
export const KEY_SCARCITY_LO = 3;
export const KEY_SCARCITY_HI = 4;

/** 开局至少消几对再允许 stall（near-miss：先有进度） */
export const EARLY_MIN_MATCHES_BEFORE_STALL = 3;

export type MatchKey = string;

/** 避免与 level01Deal 循环依赖 */
export type LockMetaSlice = { lockIds: string[]; seed?: number };

export function countMatchKey(
  cards: Array<{ rank: Rank; suit?: Suit }>,
  stock: Array<{ rank: Rank; suit?: Suit }>,
  key: MatchKey,
): { board: number; stock: number; total: number } {
  let board = 0;
  let stockN = 0;
  for (const c of cards) {
    if (c.suit && matchKey(c.rank, c.suit) === key) board++;
  }
  for (const s of stock) {
    if (s.suit && matchKey(s.rank, s.suit) === key) stockN++;
  }
  return { board, stock: stockN, total: board + stockN };
}

export function keyScarcityByLock(
  level: Level,
  meta: LockMetaSlice,
): Array<{ lockId: string; key: MatchKey; total: number; board: number }> {
  return meta.lockIds.map((lockId) => {
    const card = level.cards.find((c) => c.id === lockId);
    if (!card?.suit) {
      return { lockId, key: '?', total: 0, board: 0 };
    }
    const key = matchKey(card.rank, card.suit);
    const { total, board } = countMatchKey(level.cards, level.stock, key);
    return { lockId, key, total, board };
  });
}

export function passKeyScarcity(
  level: Level,
  meta: LockMetaSlice,
  lo = 2,
  hi = 4,
): boolean {
  if (meta.lockIds.length === 0) return true;
  return keyScarcityByLock(level, meta).every(
    (r) => r.total >= lo && r.total <= hi,
  );
}

export function keyOnBoardRatio(
  level: Level,
  meta: LockMetaSlice,
): number {
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
  meta: LockMetaSlice,
  minRatio: number,
): boolean {
  if (meta.lockIds.length === 0) return true;
  return keyOnBoardRatio(level, meta) >= minRatio;
}

/** 组 id：`c12_2` → `c12` */
function groupKeyOfCardId(id: string): string {
  const i = id.lastIndexOf('_');
  return i >= 0 ? id.slice(0, i) : id;
}

/**
 * D27：禁止跨锁埋钥
 * 任一锁堆内（除锁顶本身）不得出现 **另一把锁** 的 match-key。
 * （允许同锁自己的钥匙压在无关组下；禁止「A 锁下塞 B 钥匙」）
 */
export function passNoCrossLockKeyBurial(
  level: Level,
  meta: LockMetaSlice,
): boolean {
  if (meta.lockIds.length < 2) return true;

  const lockKeyById = new Map<string, MatchKey>();
  for (const lockId of meta.lockIds) {
    const card = level.cards.find((c) => c.id === lockId);
    if (!card?.suit) continue;
    lockKeyById.set(lockId, matchKey(card.rank, card.suit));
  }

  for (const lockId of meta.lockIds) {
    const gKey = groupKeyOfCardId(lockId);
    for (const c of level.cards) {
      if (groupKeyOfCardId(c.id) !== gKey) continue;
      if (c.id === lockId) continue;
      if (!c.suit) continue;
      const k = matchKey(c.rank, c.suit);
      for (const [otherId, otherKey] of lockKeyById) {
        if (otherId === lockId) continue;
        if (k === otherKey) return false;
      }
    }
  }
  return true;
}

export function passClearGreedy(level: Level, seed: number): boolean {
  try {
    return canFullyClear(level, seed + 1);
  } catch {
    return false;
  }
}

/**
 * Near-miss 前半节奏：贪心路径上，第一次「无 free 对」前至少消过若干对。
 * 拒绝「开局消一对就只能干抽」的旱局。
 */
export function passEarlyProgress(
  level: Level,
  seed: number,
  minMatches = EARLY_MIN_MATCHES_BEFORE_STALL,
): boolean {
  try {
    const p = probeGreedyProgress(level, seed + 1);
    // 一路消到赢、中途无 stall：也算前半有推进
    if (p.clearable && p.matchesBeforeFirstStall >= minMatches) return true;
    if (p.clearable && p.puzzleAtFirstStall === 0) return true;
    return p.matchesBeforeFirstStall >= minMatches;
  } catch {
    return false;
  }
}

/**
 * 发局后处理：把每把锁的同色同点张数压到 [lo, hi]
 * - 过多：翻转未冻结的同色牌到异色（成对，保偶数）
 * - 过少：从异色翻成同色，或补 stock
 * frozen = 与锁经 forced 同色连通的牌（含钥匙），不能改色
 */
export function enforceLockKeyScarcity(
  cards: LevelCardDef[],
  stock: StockEntry[],
  lockIds: string[],
  forcedSameColorPairs: Array<[string, string]>,
  rand: () => number,
  lo = 2,
  hi = 4,
): { cards: LevelCardDef[]; stock: StockEntry[]; ok: boolean } {
  if (lockIds.length === 0) {
    return { cards, stock, ok: true };
  }

  const cardMap = new Map(cards.map((c) => [c.id, { ...c }]));
  let stockList = stock.map((s) => ({ ...s }));

  const getSuit = (id: string): Suit | undefined => {
    const c = cardMap.get(id);
    if (c) return c.suit;
    return stockList.find((s) => s.id === id)?.suit;
  };
  const getRank = (id: string): Rank | undefined => {
    const c = cardMap.get(id);
    if (c) return c.rank;
    return stockList.find((s) => s.id === id)?.rank;
  };
  const setSuit = (id: string, suit: Suit) => {
    const c = cardMap.get(id);
    if (c) {
      c.suit = suit;
      return;
    }
    const s = stockList.find((x) => x.id === id);
    if (s) s.suit = suit;
  };

  // 连通：forced 同色
  const adj = new Map<string, string[]>();
  const addEdge = (a: string, b: string) => {
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  };
  for (const [a, b] of forcedSameColorPairs) addEdge(a, b);

  const componentOf = (start: string): Set<string> => {
    const seen = new Set<string>();
    const q = [start];
    seen.add(start);
    while (q.length) {
      const u = q.pop()!;
      for (const v of adj.get(u) ?? []) {
        if (seen.has(v)) continue;
        // 只连同 rank
        if (getRank(v) !== getRank(start)) continue;
        seen.add(v);
        q.push(v);
      }
    }
    return seen;
  };

  const allIdsForRank = (rank: Rank): string[] => {
    const ids: string[] = [];
    for (const c of cardMap.values()) if (c.rank === rank) ids.push(c.id);
    for (const s of stockList) if (s.rank === rank) ids.push(s.id);
    return ids;
  };

  const countKey = (rank: Rank, color: 'red' | 'black') => {
    let n = 0;
    for (const id of allIdsForRank(rank)) {
      const su = getSuit(id);
      if (su && suitColor(su) === color) n++;
    }
    return n;
  };

  for (const lockId of lockIds) {
    const rank = getRank(lockId);
    const suit = getSuit(lockId);
    if (!rank || !suit) return { cards, stock, ok: false };
    const color = suitColor(suit);
    const other: 'red' | 'black' = color === 'red' ? 'black' : 'red';
    const frozen = componentOf(lockId);

    // 过多：翻非冻结的同色 → 异色（成对）
    let guard = 0;
    while (countKey(rank, color) > hi && guard++ < 40) {
      const flippable = allIdsForRank(rank).filter((id) => {
        if (frozen.has(id)) return false;
        const su = getSuit(id);
        return su != null && suitColor(su) === color;
      });
      if (flippable.length < 2) break;
      // 洗一下顺序
      for (let i = flippable.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [flippable[i], flippable[j]] = [flippable[j]!, flippable[i]!];
      }
      setSuit(flippable[0]!, pickSuitForColor(other, rand));
      setSuit(flippable[1]!, pickSuitForColor(other, rand));
    }

    // 过少：翻异色非冻结 → 同色（成对），或补 stock
    guard = 0;
    while (countKey(rank, color) < lo && guard++ < 40) {
      const need = lo - countKey(rank, color);
      if (need <= 0) break;
      const flippable = allIdsForRank(rank).filter((id) => {
        if (frozen.has(id)) return false;
        const su = getSuit(id);
        return su != null && suitColor(su) === other;
      });
      if (flippable.length >= 2 && need >= 1) {
        for (let i = flippable.length - 1; i > 0; i--) {
          const j = Math.floor(rand() * (i + 1));
          [flippable[i], flippable[j]] = [flippable[j]!, flippable[i]!];
        }
        // 一次翻 2 张保偶数
        setSuit(flippable[0]!, pickSuitForColor(color, rand));
        setSuit(flippable[1]!, pickSuitForColor(color, rand));
        continue;
      }
      // 补 stock：若当前为奇数缺 1，补 1；若为 0 且 lo=2，补 2
      const cur = countKey(rank, color);
      const add = cur % 2 === 1 ? 1 : 2;
      for (let i = 0; i < add; i++) {
        stockList.push({
          id: `s${String(stockList.length + 1).padStart(2, '0')}`,
          rank,
          suit: pickSuitForColor(color, rand),
        });
      }
    }

    if (countKey(rank, color) < lo || countKey(rank, color) > hi) {
      return { cards, stock, ok: false };
    }
  }

  // 全局 (rank,color) 偶数兜底
  const parity = new Map<string, number>();
  for (const c of cardMap.values()) {
    if (!c.suit) continue;
    const k = matchKey(c.rank, c.suit);
    parity.set(k, (parity.get(k) ?? 0) + 1);
  }
  for (const s of stockList) {
    const k = matchKey(s.rank, s.suit);
    parity.set(k, (parity.get(k) ?? 0) + 1);
  }
  for (const [k, n] of parity) {
    if (n % 2 === 0) continue;
    const [rank, col] = k.split('_') as [Rank, 'red' | 'black'];
    stockList.push({
      id: `s${String(stockList.length + 1).padStart(2, '0')}`,
      rank,
      suit: pickSuitForColor(col, rand),
    });
  }

  // 补 stock 后可能又把某锁 key 顶破 hi → 再检查
  const outCards = [...cardMap.values()];
  stockList = stockList.map((s, i) => ({
    ...s,
    id: `s${String(i + 1).padStart(2, '0')}`,
  }));

  for (const lockId of lockIds) {
    const card = cardMap.get(lockId);
    if (!card?.suit) return { cards: outCards, stock: stockList, ok: false };
    const key = matchKey(card.rank, card.suit);
    const { total } = countMatchKey(outCards, stockList, key);
    if (total < lo || total > hi) {
      return { cards: outCards, stock: stockList, ok: false };
    }
  }

  return { cards: outCards, stock: stockList, ok: true };
}

export function passDealHard(
  level: Level,
  meta: LockMetaSlice,
  seed: number,
): boolean {
  if (!passClearGreedy(level, seed)) return false;
  if (
    !passKeyScarcity(
      level,
      meta,
      KEY_SCARCITY_HARD_LO,
      KEY_SCARCITY_HARD_HI,
    )
  ) {
    return false;
  }
  if (!passKeyOnBoard(level, meta, 0.65)) return false;
  return true;
}
