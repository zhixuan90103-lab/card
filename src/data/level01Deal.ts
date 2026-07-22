/**
 * Level01 主方案生成
 *
 * 固定：全部槽位/组始终存在，坐标不变
 * 随机：点数、开局对落在哪两个 L2 顶、锁数/锁位/钥匙、stock
 * 禁止：槽在但为空
 */
import { mulberry32, shuffleInPlace } from '../core/rng';
import type { Level, Rank } from '../core/types';
import { ALL_RANKS, fixParityInStock } from './rankDesign';
import { canFullyClear } from './levelSolve';
import { generateLayout, materializeCards, type GeoGroup } from './levelLayout';

/**
 * 抽牌区不再「灌到固定张数」。
 * 仅放：桌面全局奇数 rank 各 1 张（R1 偶数）+ 可选少量节奏伙伴。
 * 上限只作安全阀，正常局远低于此。
 */
export const LEVEL01_DEAL_STOCK_TARGET = 12;
export const LEVEL01_MAX_LOCKS = 3;

export type Level01DealMeta = {
  seed: number;
  layoutId: string;
  lockCount: number;
  topology: 'independent' | 'chain';
  lockIds: string[];
  keyIds: string[];
  lockRanks: Rank[];
  openingPairRank: Rank;
  /** 开局对所在 L2 组 */
  openingPairGroups: [string, string];
  l0Count: number;
  l1Count: number;
  l2Count: number;
};

function pickLockCount(rand: () => number): number {
  const x = rand();
  if (x < 0.12) return 0;
  if (x < 0.48) return 1;
  if (x < 0.82) return 2;
  return 3;
}

function dealOnce(
  seed: number,
): { level: Level; meta: Level01DealMeta } | null {
  const rand = mulberry32(seed);
  // 几何固定（忽略 seed）
  const layout = generateLayout();
  const groups = layout.groups;
  const byKey = new Map(groups.map((g) => [g.key, g]));

  // 开局 free = 全部 6 个 L2 组顶；从中随机选 2 个做「上手对」
  const freeKeys = [...layout.freeGroupKeys];
  shuffleInPlace(freeKeys, rand);
  const pairG0 = freeKeys[0]!;
  const pairG1 = freeKeys[1]!;

  const l1Groups = groups.filter((g) => g.tier === 1);
  const lockCount = Math.min(pickLockCount(rand), l1Groups.length);
  const topology: 'independent' | 'chain' =
    lockCount >= 2 && rand() < 0.5 ? 'chain' : 'independent';

  const l1Shuf = [...l1Groups];
  shuffleInPlace(l1Shuf, rand);
  const lockGroups = l1Shuf.slice(0, lockCount);
  const lockIds = lockGroups.map((g) => `${g.key}_${g.size - 1}`);

  const pool = [...ALL_RANKS];
  shuffleInPlace(pool, rand);
  let pi = 0;
  const take = (): Rank => {
    const r = pool[pi % pool.length]!;
    pi += 1;
    return r;
  };

  const openingPairRank = take();
  // L2 桌面自洽挖掘链用到的点（互不相同）
  const A = take();
  const B = take();
  const C = take();
  const D = take();
  const E = take();
  const lockRanks: Rank[] = [];
  for (let i = 0; i < lockCount; i++) lockRanks.push(take());
  // 第一把锁钥匙：放 L2 挖开链上（桌面可得），也可再在 stock 放备份
  const firstKeyRank = lockCount > 0 ? lockRanks[0]! : B;

  // ranks[group] = bottom..top
  const ranks = new Map<string, Array<Rank | null>>();
  for (const g of groups) {
    ranks.set(
      g.key,
      Array.from({ length: g.size }, () => null),
    );
  }

  const setTop = (g: GeoGroup, rank: Rank) => {
    ranks.get(g.key)![g.size - 1] = rank;
  };
  const setBot = (g: GeoGroup, rank: Rank) => {
    ranks.get(g.key)![0] = rank;
  };
  const setIdx = (g: GeoGroup, i: number, rank: Rank) => {
    if (i >= 0 && i < g.size) ranks.get(g.key)![i] = rank;
  };

  /**
   * —— L2：桌面自洽挖掘链（基本不需抽牌）——
   * 6 组固定 [bot, top] 拓扑（点数随机）：
   *   开局顶：P,P,A,B,C,D  仅一对 P
   *   底：    A,B,C,E,D,E  消后与场上 free 连消
   * 若有锁：B 位改用 firstKeyRank（钥匙在挖开后出现）
   */
  const l2Keys = layout.freeGroupKeys; // d00,d01,d02,d10,d11,d12
  const P = openingPairRank;
  // 拓扑槽：0,1 = 开局对；其余按序
  const restL2 = l2Keys.filter((k) => k !== pairG0 && k !== pairG1);
  const topo = [pairG0, pairG1, ...restL2];
  while (topo.length < 6) topo.push(l2Keys[topo.length]!);
  const T = topo.slice(0, 6);
  /**
   * 桌面挖开链（禁止「两组同顶同底」平行叠）：
   * tops: P,P,A,Bb,C,D  — depth0 仅 P 成对
   * bots: A,Bb,C,D,E,F  — depth1 全互异；与顶交叉配对挖开
   * （不再使用 bots 双 E，避免消完顶后两底又是一对平行）
   */
  const Bb = lockCount > 0 ? firstKeyRank : B;
  const F = take(); // 第 6 组底，与 E 不同
  const topsArr: Rank[] = [P, P, A, Bb, C, D];
  const botsArr: Rank[] = [A, Bb, C, D, E, F];

  const keyIds: string[] = [];
  for (let i = 0; i < 6; i++) {
    const g = byKey.get(T[i]!)!;
    setBot(g, botsArr[i]!);
    setTop(g, topsArr[i]!);
  }
  if (lockCount > 0) {
    keyIds.push(`${T[1]!}_0`);
  }

  // —— L1：锁 + 「需抽牌」面 —— 
  // 组顶：至多 0 对桌面对（全单点），对子在 stock
  for (let i = 0; i < lockCount; i++) {
    setTop(lockGroups[i]!, lockRanks[i]!);
  }

  if (topology === 'chain' && lockCount >= 2) {
    for (let i = 1; i < lockCount; i++) {
      const prev = lockGroups[i - 1]!;
      setIdx(prev, 1, lockRanks[i]!);
      keyIds.push(`${prev.key}_1`);
    }
  }

  // L1 非锁顶：全部单点（互不相同）。部分点进 stock 作中段抽牌伙伴（有上限，不灌库）
  const l1NeedStock: Rank[] = [];
  const usedL1Tops = new Set<Rank>(lockRanks);
  for (const g of l1Groups) {
    const arr = ranks.get(g.key)!;
    if (arr[g.size - 1] != null) continue;
    let r = take();
    let guard = 0;
    while (usedL1Tops.has(r) && guard++ < 50) r = take();
    if (usedL1Tops.has(r)) {
      r = ALL_RANKS.find((x) => !usedL1Tops.has(x)) ?? r;
    }
    setTop(g, r);
    usedL1Tops.add(r);
    if (!lockRanks.includes(r)) l1NeedStock.push(r);
  }
  // 锁点备 1 张进库即可（钥匙主要在桌面）
  if (lockCount > 0) l1NeedStock.push(lockRanks[0]!);

  // independent 额外钥匙位：非锁 L1 的 mid 放锁点（可挖到），不放顶以免桌面成对
  if (topology === 'independent' && lockCount >= 1) {
    const freeL1 = l1Shuf.filter((g) => !lockGroups.includes(g));
    for (let i = 0; i < lockCount && i < freeL1.length; i++) {
      const g = freeL1[i]!;
      // mid = 钥匙备份（同锁点）
      if (g.size >= 2) {
        setIdx(g, 1, lockRanks[i]!);
        keyIds.push(`${g.key}_1`);
      }
    }
  }

  // 填满剩余 null：自上而下，这样填次顶时组顶已就绪，可禁平行叠
  for (const g of groups) {
    const arr = ranks.get(g.key)!;
    if (arr.every((x) => x != null)) continue;

    const used = new Set(arr.filter((x): x is Rank => x != null));
    for (let i = g.size - 1; i >= 0; i--) {
      if (arr[i] != null) {
        used.add(arr[i] as Rank);
        continue;
      }
      const depthFromTop = g.size - 1 - i;
      const myTop = arr[g.size - 1] as Rank | null;
      const banned = depthBannedRanks(
        ranks,
        groups,
        depthFromTop,
        g.key,
        myTop,
      );
      let r = take();
      let guard = 0;
      while ((used.has(r) || banned.has(r)) && guard++ < 80) r = take();
      if (used.has(r) || banned.has(r)) {
        r =
          ALL_RANKS.find((x) => !used.has(x) && !banned.has(x)) ??
          ALL_RANKS.find((x) => !used.has(x)) ??
          r;
      }
      arr[i] = r;
      used.add(r);
    }
    if (new Set(arr as Rank[]).size !== arr.length) return null;
  }

  // 修复：任意两组同顶 ⇒ 强制次顶互异（杜绝「两个 5 下都是 Q」）
  if (!repairParallelPeels(ranks, groups, openingPairRank, take)) return null;

  const rankMap = new Map<string, Rank[]>();
  for (const [k, v] of ranks) rankMap.set(k, v as Rank[]);

  let cards;
  try {
    cards = materializeCards(groups, rankMap);
  } catch {
    return null;
  }

  const expected = 20 * 3 + 12 * 3 + 6 * 2;
  if (cards.length !== expected) return null;

  // stock = 工具区：L1 伙伴（封顶）+ 奇点补齐；禁止 pad 到固定张数
  const openTopRanks = new Set<Rank>([P, A, Bb, C, D]);
  let stock = buildLeanStock(cards, l1NeedStock, rand);
  stock = fixParityInStock(stock, cards);
  stock = orderStock(stock, openTopRanks, rand);

  const level: Level = {
    id: 'level-01',
    name: lockCount === 0 ? '1 · 先易后难' : `1 · 锁×${lockCount}`,
    teachHint:
      '前段桌上连消即可；到中层后请抽牌配对。无步可消时会判定失败',
    coverThreshold: 0.12,
    cards,
    stock,
  };

  const meta: Level01DealMeta = {
    seed,
    layoutId: layout.id,
    lockCount,
    topology: lockCount >= 2 ? topology : 'independent',
    lockIds,
    keyIds,
    lockRanks,
    openingPairRank,
    openingPairGroups: [pairG0, pairG1],
    l0Count: layout.l0Count,
    l1Count: layout.l1Count,
    l2Count: layout.l2Count,
  };

  return {
    level: { ...level, insightNote: JSON.stringify(meta) },
    meta,
  };
}

/**
 * 精简抽牌区：
 * - L1 伙伴：每个需要的点至多 1 张（中段抽牌用）
 * - 奇点补齐到全局偶数
 * - **禁止** pad 填料对到固定张数（旧版 ~16 就是这样堆出来的）
 *
 * 上界：伙伴 + 补齐通常 8～14，远小于「桌面 2 张、库 7+ 废对」的观感问题根源。
 */
function buildLeanStock(
  cards: { rank: Rank }[],
  l1NeedStock: Rank[],
  rand: () => number,
): Array<{ id: string; rank: Rank }> {
  const count = new Map<Rank, number>();
  for (const c of cards) count.set(c.rank, (count.get(c.rank) ?? 0) + 1);

  const stockRanks: Rank[] = [];
  const stockCount = new Map<Rank, number>();
  const push = (r: Rank) => {
    stockRanks.push(r);
    stockCount.set(r, (stockCount.get(r) ?? 0) + 1);
    count.set(r, (count.get(r) ?? 0) + 1);
  };

  // 只对「桌上已是偶数」的 L1 点加 1 张伙伴（会变成奇数，下一步补齐再 +1 → 库内一对）
  // 桌上已是奇数的点：parity 会给 1 张，不必再预加
  const uniqNeed = [...new Set(l1NeedStock)];
  shuffleInPlace(uniqNeed, rand);
  let accessPairs = 0;
  const ACCESS_PAIR_CAP = 2; // 最多 2 组「库内对」= +4 张；再加奇点补齐
  for (const r of uniqNeed) {
    if (accessPairs >= ACCESS_PAIR_CAP) break;
    if ((count.get(r) ?? 0) % 2 === 1) continue; // 交给 parity 单张
    if ((stockCount.get(r) ?? 0) > 0) continue;
    push(r);
    accessPairs += 1;
  }

  // 全局奇数 → 各补 1
  for (const r of ALL_RANKS) {
    if ((count.get(r) ?? 0) % 2 === 1) {
      if ((stockCount.get(r) ?? 0) < 2) push(r);
    }
  }

  shuffleInPlace(stockRanks, rand);
  return stockRanks.map((rank, i) => ({
    id: `s${String(i + 1).padStart(2, '0')}`,
    rank,
  }));
}

/**
 * 填「距组顶 depth」时禁止的点（跨层）：
 * - 若本张是次顶（depth=1）且组顶已知：禁止任何「同顶」组已占用的次顶点
 *   → 杜绝两堆同时消 5 后下面都是 Q
 */
function depthBannedRanks(
  ranks: Map<string, Array<Rank | null>>,
  groups: GeoGroup[],
  depthFromTop: number,
  exceptKey: string,
  myTop: Rank | null,
): Set<Rank> {
  const banned = new Set<Rank>();
  if (depthFromTop !== 1 || myTop == null) return banned;

  for (const g of groups) {
    if (g.key === exceptKey || g.size < 2) continue;
    const theirTop = ranks.get(g.key)![g.size - 1];
    const theirNext = ranks.get(g.key)![g.size - 2];
    if (theirTop === myTop && theirNext != null) {
      banned.add(theirNext);
    }
  }
  return banned;
}

/**
 * 修复平行剥开：任意两组组顶相同 ⇒ 次顶必须互异
 * （单次两两扫描会「修好后面、弄坏前面」，故按顶点分桶 + 多轮收敛）
 */
function repairParallelPeels(
  ranks: Map<string, Array<Rank | null>>,
  groups: GeoGroup[],
  openingPair: Rank,
  take: () => Rank,
): boolean {
  // L2 顶除开局对外不得再成对
  const l2 = groups.filter((g) => g.tier === 2);
  const l2ByTop = new Map<Rank, GeoGroup[]>();
  for (const g of l2) {
    const top = ranks.get(g.key)![g.size - 1] as Rank;
    if (!l2ByTop.has(top)) l2ByTop.set(top, []);
    l2ByTop.get(top)!.push(g);
  }
  for (const [r, gs] of l2ByTop) {
    if (r === openingPair) {
      if (gs.length !== 2) return false;
    } else if (gs.length > 1) {
      return false;
    }
  }

  // 多轮：同顶组的次顶全部互异
  for (let pass = 0; pass < 24; pass++) {
    let changed = false;
    const byTop = new Map<Rank, GeoGroup[]>();
    for (const g of groups) {
      if (g.size < 2) continue;
      const top = ranks.get(g.key)![g.size - 1] as Rank;
      if (!byTop.has(top)) byTop.set(top, []);
      byTop.get(top)!.push(g);
    }

    for (const [, gs] of byTop) {
      if (gs.length < 2) continue;
      const claimedNext = new Set<Rank>();
      for (const g of gs) {
        const arr = ranks.get(g.key)! as Rank[];
        const top = arr[arr.length - 1]!;
        const iNext = arr.length - 2;
        let next = arr[iNext]!;

        if (!claimedNext.has(next)) {
          claimedNext.add(next);
          continue;
        }

        // 与同顶其它组的次顶冲突 → 换一个未占用且栈内不重复的点
        const stackUsed = new Set(arr.filter((_, idx) => idx !== iNext));
        const pick = (): Rank | null => {
          let r = take();
          let guard = 0;
          while (
            (stackUsed.has(r) || claimedNext.has(r) || r === top) &&
            guard++ < 60
          ) {
            r = take();
          }
          if (!stackUsed.has(r) && !claimedNext.has(r) && r !== top) return r;
          return (
            ALL_RANKS.find(
              (x) => !stackUsed.has(x) && !claimedNext.has(x) && x !== top,
            ) ?? null
          );
        };

        const nr = pick();
        if (nr == null) return false;
        arr[iNext] = nr;
        claimedNext.add(nr);
        changed = true;
      }
    }
    if (!changed) break;
  }

  // 整组序列重复：改其中一组的底（size=2 时底=次顶，需避开同顶已占次顶）
  const sigMap = new Map<string, string>();
  for (const g of groups) {
    const arr = ranks.get(g.key)! as Rank[];
    const sig = arr.join(',');
    const prev = sigMap.get(sig);
    if (!prev) {
      sigMap.set(sig, g.key);
      continue;
    }
    const top = arr[arr.length - 1]!;
    const used = new Set(arr.slice(1)); // 保留顶及中段
    // 同顶其它组已占用的次顶（含本栈当前次顶，避免无意义改回）
    const bannedNext = new Set<Rank>();
    for (const h of groups) {
      if (h.key === g.key || h.size < 2) continue;
      const other = ranks.get(h.key)! as Rank[];
      if (other[other.length - 1] === top) {
        bannedNext.add(other[other.length - 2]!);
      }
    }
    let nr = take();
    let guard = 0;
    const blocked = (r: Rank) =>
      used.has(r) || (g.size === 2 && bannedNext.has(r));
    while (blocked(nr) && guard++ < 40) nr = take();
    if (blocked(nr)) {
      nr =
        ALL_RANKS.find((x) => !blocked(x)) ??
        ALL_RANKS.find((x) => !used.has(x)) ??
        nr;
    }
    if (used.has(nr)) return false;
    if (g.size === 2 && bannedNext.has(nr)) return false;
    arr[0] = nr;
    sigMap.set(arr.join(','), g.key);
  }

  // 终检：同顶不得再共次顶
  {
    const byTop = new Map<Rank, Rank[]>();
    for (const g of groups) {
      if (g.size < 2) continue;
      const arr = ranks.get(g.key)! as Rank[];
      const top = arr[arr.length - 1]!;
      const next = arr[arr.length - 2]!;
      const list = byTop.get(top) ?? [];
      if (list.includes(next)) return false;
      list.push(next);
      byTop.set(top, list);
    }
  }

  return true;
}

function orderStock(
  stock: Array<{ id: string; rank: Rank }>,
  avoid: Set<Rank>,
  rand: () => number,
): Array<{ id: string; rank: Rank }> {
  if (stock.length === 0) return stock;
  const ranks = stock.map((s) => s.rank);
  shuffleInPlace(ranks, rand);
  const idx = ranks.findIndex((r) => !avoid.has(r));
  if (idx > 0) {
    const [r] = ranks.splice(idx, 1);
    ranks.unshift(r!);
  }
  return ranks.map((rank, i) => ({
    id: `s${String(i + 1).padStart(2, '0')}`,
    rank,
  }));
}

export function dealLevel01(
  seed: number,
  maxAttempts = 16,
): { level: Level; meta: Level01DealMeta } {
  let fallback: { level: Level; meta: Level01DealMeta } | null = null;
  for (let a = 0; a < maxAttempts; a++) {
    const s = (seed + a * 9973) >>> 0;
    const dealt = dealOnce(s);
    if (!dealt) continue;
    fallback = dealt;
    try {
      if (canFullyClear(dealt.level, s + 1)) return dealt;
    } catch {
      /* retry */
    }
  }
  // 过滤全失败时仍返回最后一局（可玩；验收贪心非完备）
  if (fallback) return fallback;
  throw new Error('dealLevel01: failed to generate');
}

export function buildLevel01(seed?: number): Level {
  const s =
    seed ??
    (typeof crypto !== 'undefined' && 'getRandomValues' in crypto
      ? crypto.getRandomValues(new Uint32Array(1))[0]!
      : (Date.now() ^ (Math.random() * 1e9)) >>> 0);
  return dealLevel01(s).level;
}

export function buildLevel01WithMeta(seed?: number): {
  level: Level;
  meta: Level01DealMeta;
} {
  const s =
    seed ??
    (typeof crypto !== 'undefined' && 'getRandomValues' in crypto
      ? crypto.getRandomValues(new Uint32Array(1))[0]!
      : (Date.now() ^ (Math.random() * 1e9)) >>> 0);
  return dealLevel01(s);
}
