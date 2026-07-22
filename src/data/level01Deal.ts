/**
 * Level01 主方案生成
 *
 * 固定：全部槽位/组始终存在，坐标不变
 * 随机：点数、开局对落在哪两个 L2 顶、锁数/锁位/钥匙、stock
 * 禁止：槽在但为空
 */
import { mulberry32, shuffleInPlace } from '../core/rng';
import type { Level, Rank, Suit } from '../core/types';
import { matchKey } from '../core/types';
import { ALL_RANKS, fixParityInStock } from './rankDesign';
import { generateLayout, materializeCards, type GeoGroup } from './levelLayout';
import { paintSuitsOnLevel } from './suitPaint';
import {
  enforceLockKeyScarcity,
  KEY_SCARCITY_HARD_HI,
  KEY_SCARCITY_HARD_LO,
  KEY_SCARCITY_HI,
  KEY_SCARCITY_LO,
  passClearGreedy,
  passEarlyProgress,
  passKeyOnBoard,
  passKeyScarcity,
  passNoCrossLockKeyBurial,
} from './pathLockMetrics';

/**
 * 抽牌区不再「灌到固定张数」。
 * 仅放：桌面全局奇数 rank 各 1 张（R1 偶数）+ 可选少量节奏伙伴。
 * 上限只作安全阀，正常局远低于此。
 */
export const LEVEL01_DEAL_STOCK_TARGET = 12;
export const LEVEL01_MAX_LOCKS = 3;

/** 常规局已抬高难度；每 3 局一轮「极难」 */
export type DealDifficulty = 'hard' | 'extreme';

export type Level01DealMeta = {
  seed: number;
  layoutId: string;
  difficulty: DealDifficulty;
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

/** 第 3、6、9… 局为极难，其余为抬高后的 hard */
export function difficultyForRun(runIndex: number): DealDifficulty {
  if (runIndex > 0 && runIndex % 3 === 0) return 'extreme';
  return 'hard';
}

/** hard：几乎总有锁；extreme：满锁 */
function pickLockCount(rand: () => number, diff: DealDifficulty): number {
  if (diff === 'extreme') return 3;
  const x = rand();
  // 无 0 锁；约 20% 一锁、45% 两锁、35% 三锁
  if (x < 0.2) return 1;
  if (x < 0.65) return 2;
  return 3;
}

function chainChance(diff: DealDifficulty): number {
  return diff === 'extreme' ? 0.92 : 0.72;
}

/** L1 抽牌伙伴对：hard 至多 1 组，extreme 不给（库更瘦） */
function accessPairCap(diff: DealDifficulty): number {
  return diff === 'extreme' ? 0 : 1;
}

/** @internal exported for diagnostics / tests */
export function dealOnce(
  seed: number,
  difficulty: DealDifficulty = 'hard',
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
  const lockCount = Math.min(
    pickLockCount(rand, difficulty),
    l1Groups.length,
  );
  const topology: 'independent' | 'chain' =
    lockCount >= 2 && rand() < chainChance(difficulty)
      ? 'chain'
      : 'independent';

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

  /**
   * D27 钥匙几何（禁止跨锁埋钥）：
   * - 禁止：锁 A 堆内放锁 B 的钥匙（旧 chain 写法）
   * - 允许：每把锁的钥匙放在 **独立可挖位**（非锁 L1 mid / 桌面链）
   * - chain 仅表示「多锁串联节奏 / 多锁并立」，**不再**用埋钥表达顺序
   * - 玩家把两把钥匙互消 → 可归因误用（难度保留）
   */
  const freeL1 = l1Shuf.filter((g) => !lockGroups.includes(g));
  // 每把锁一枚桌面钥匙在独立 mid（C/D 位）；额外钥由 L2 dig 链 / stock / enforce 补
  for (let i = 0; i < lockCount && i < freeL1.length; i++) {
    const g = freeL1[i]!;
    if (g.size >= 2) {
      setIdx(g, 1, lockRanks[i]!);
      keyIds.push(`${g.key}_1`);
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

  // 填满剩余 null：自上而下，这样填次顶时组顶已就绪，可禁平行叠
  // D27：锁堆非顶位禁止再塞任何「锁点」（含本锁钥匙与他锁钥匙）——钥匙只在独立位
  const lockRankSet = new Set(lockRanks);
  const lockGroupKeys = new Set(lockGroups.map((g) => g.key));

  for (const g of groups) {
    const arr = ranks.get(g.key)!;
    if (arr.every((x) => x != null)) continue;

    const used = new Set(arr.filter((x): x is Rank => x != null));
    const isLockGroup = lockGroupKeys.has(g.key);
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
      // D27：锁堆内禁止出现 **其他锁** 的点（可与本锁同点填缝，由上色/稀缺再调）
      if (isLockGroup) {
        const myTopRank = arr[g.size - 1] as Rank | null;
        for (const lr of lockRankSet) {
          if (lr !== myTopRank) banned.add(lr);
        }
      }
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

  let cards: import('../core/types').LevelCardDef[];
  try {
    cards = materializeCards(groups, rankMap);
  } catch {
    return null;
  }

  const expected = 20 * 3 + 12 * 3 + 6 * 2;
  if (cards.length !== expected) return null;

  // stock = 工具区：L1 伙伴（按难度封顶）+ 奇点补齐；禁止 pad
  // 顺序在上色+锁 key 确定后再排（钥匙靠前）
  const openTopRanks = new Set<Rank>([P, A, Bb, C, D]);
  let stock = buildLeanStock(
    cards,
    l1NeedStock,
    rand,
    accessPairCap(difficulty),
  );
  stock = fixParityInStock(stock, cards);

  // D22：上色（红黑同点可消）；L2 链 / 开局对 / 锁钥强制同色
  const forcedColor: Array<[string, string]> = [];
  const l2Top = (k: string) => `${k}_1`;
  const l2Bot = (k: string) => `${k}_0`;
  // T = [pair0, pair1, rest…] 与 tops/bots 拓扑一致
  if (T.length >= 6) {
    forcedColor.push([l2Top(T[0]!), l2Top(T[1]!)]); // 开局 P
    forcedColor.push([l2Bot(T[0]!), l2Top(T[2]!)]); // A
    forcedColor.push([l2Bot(T[1]!), l2Top(T[3]!)]); // Bb
    forcedColor.push([l2Bot(T[2]!), l2Top(T[4]!)]); // C
    forcedColor.push([l2Bot(T[3]!), l2Top(T[5]!)]); // D
  }
  // 锁顶与钥匙位同色（同 rank）
  for (let i = 0; i < lockIds.length; i++) {
    const lid = lockIds[i]!;
    for (const kid of keyIds) {
      const lr = cards.find((c) => c.id === lid)?.rank;
      const kr = cards.find((c) => c.id === kid)?.rank;
      if (lr && kr && lr === kr) forcedColor.push([lid, kid]);
    }
  }

  const painted = paintSuitsOnLevel(cards, stock, forcedColor, rand);
  // H1：稀缺硬门槛 2～4；发局循环再优先 3～4（near-miss）
  const enforced = enforceLockKeyScarcity(
    painted.cards,
    painted.stock,
    lockIds,
    forcedColor,
    rand,
    KEY_SCARCITY_HARD_LO,
    KEY_SCARCITY_HARD_HI,
  );
  if (!enforced.ok) return null;
  cards = enforced.cards;
  stock = enforced.stock;

  // 库内钥匙靠前：早抽到 → 可被盖住 → 洗回再现；避免钉在最后一张
  stock = orderStockKeysFront(stock, cards, lockIds, openTopRanks, rand);

  const diffLabel = difficulty === 'extreme' ? '极难' : '困难';
  const level: Level = {
    id: 'level-01',
    name:
      lockCount === 0
        ? `1 · ${diffLabel}`
        : `1 · ${diffLabel}·锁×${lockCount}`,
    teachHint:
      difficulty === 'extreme'
        ? '极难局：满锁+薄库，钥匙很少。同点同花色（♥/♠）才能消'
        : '同点且同花色才能消（红♥ 或 黑♠）。清桌即胜；每 3 局一极难',
    coverThreshold: 0.12,
    cards,
    stock,
  };

  const meta: Level01DealMeta = {
    seed,
    layoutId: layout.id,
    difficulty,
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
  accessCap = 1,
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
  const uniqNeed = [...new Set(l1NeedStock)];
  shuffleInPlace(uniqNeed, rand);
  let accessPairs = 0;
  for (const r of uniqNeed) {
    if (accessPairs >= accessCap) break;
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

type StockItem = { id: string; rank: Rank; suit?: Suit };

/**
 * 抽牌区排序：
 * - stock[0] = 下一张可抽
 * - 锁的同色同点（钥匙）尽量靠前，便于早进抽出叠、被后续翻牌盖住、洗回再显
 * - 避免钥匙钉在队列末尾（玩家会觉得故意藏到最后）
 * - 开局第一张尽量避开 L2 free 顶点数（少狂抽成对）
 */
function orderStockKeysFront(
  stock: StockItem[],
  board: Array<{ id: string; rank: Rank; suit?: Suit }>,
  lockIds: string[],
  avoidOpenRanks: Set<Rank>,
  rand: () => number,
): StockItem[] {
  if (stock.length === 0) return stock;

  const lockKeys = new Set<string>();
  for (const lid of lockIds) {
    const c = board.find((x) => x.id === lid);
    if (c?.suit) lockKeys.add(matchKey(c.rank, c.suit));
  }

  const isKey = (s: StockItem) =>
    !!s.suit && lockKeys.has(matchKey(s.rank, s.suit));

  const keys = stock.filter(isKey);
  const rest = stock.filter((s) => !isKey(s));
  shuffleInPlace(keys, rand);
  shuffleInPlace(rest, rand);

  const out: StockItem[] = [];

  // 第一张：优先非钥匙、且避开开局 free 顶
  const firstIdx = rest.findIndex((s) => !avoidOpenRanks.has(s.rank));
  if (firstIdx >= 0) {
    out.push(rest.splice(firstIdx, 1)[0]!);
  } else if (rest.length > 0) {
    out.push(rest.shift()!);
  } else if (keys.length > 0) {
    // 库几乎全是钥匙：仍把钥匙放前，但尽量不拿 avoid 的
    const kIdx = keys.findIndex((s) => !avoidOpenRanks.has(s.rank));
    out.push(keys.splice(kIdx >= 0 ? kIdx : 0, 1)[0]!);
  }

  // 其余钥匙紧随其后（靠前区）
  out.push(...keys);
  // 非钥匙垫后
  out.push(...rest);

  // 保险：若唯一一张钥匙落在最后且库长≥3，与前半交换
  if (out.length >= 3) {
    const keyPositions = out
      .map((s, i) => (isKey(s) ? i : -1))
      .filter((i) => i >= 0);
    if (keyPositions.length > 0) {
      const lastKeyAt = keyPositions[keyPositions.length - 1]!;
      if (lastKeyAt === out.length - 1) {
        const swapAt = Math.max(1, Math.floor(out.length / 3));
        const tmp = out[swapAt]!;
        out[swapAt] = out[lastKeyAt]!;
        out[lastKeyAt] = tmp;
      }
    }
  }

  return out.map((s, i) => ({
    id: `s${String(i + 1).padStart(2, '0')}`,
    rank: s.rank,
    suit: s.suit,
  }));
}

export function dealLevel01(
  seed: number,
  maxAttempts = 40,
  difficulty: DealDifficulty = 'hard',
): { level: Level; meta: Level01DealMeta } {
  /**
   * H1b + D27 + near-miss P0（轻量）：
   * 1) 先找可清局（快路径，同旧逻辑）
   * 2) 理想形（稀缺3～4 + 前半进度）立刻返回
   * 3) 否则在找到首个可清后再多搜 polishN 局，取更高分
   * hard 禁止不可清 density；extreme 最后才密度兜底
   */
  type Cand = { level: Level; meta: Level01DealMeta };
  let densityOk: Cand | null = null;
  let best: { score: number; dealt: Cand } | null = null;
  let foundClear = false;
  let polishLeft = 0;
  const polishN = 12; // 找到可清后再优选的尝试数（控制耗时）

  const hardExtra = 40;
  const extremeExtra = 40;
  const totalAttempts =
    difficulty === 'hard' ? maxAttempts + hardExtra : maxAttempts + extremeExtra;

  const baseOk = (dealt: Cand): boolean => {
    if (!passNoCrossLockKeyBurial(dealt.level, dealt.meta)) return false;
    if (
      !passKeyScarcity(
        dealt.level,
        dealt.meta,
        KEY_SCARCITY_HARD_LO,
        KEY_SCARCITY_HARD_HI,
      )
    ) {
      return false;
    }
    const minBoard = difficulty === 'extreme' ? 0.75 : 0.65;
    return passKeyOnBoard(dealt.level, dealt.meta, minBoard);
  };

  const scoreClearable = (dealt: Cand, s: number): number => {
    const preferScarce = passKeyScarcity(
      dealt.level,
      dealt.meta,
      KEY_SCARCITY_LO,
      KEY_SCARCITY_HI,
    );
    const early = passEarlyProgress(dealt.level, s);
    if (preferScarce && early) return 4;
    if (preferScarce) return 3;
    if (early) return 2;
    return 1;
  };

  for (let a = 0; a < totalAttempts; a++) {
    const s = (seed + a * 9973) >>> 0;
    const dealt = dealOnce(s, difficulty);
    if (!dealt) continue;
    if (!baseOk(dealt)) continue;
    densityOk = dealt;

    if (!passClearGreedy(dealt.level, s)) continue;

    const sc = scoreClearable(dealt, s);
    if (sc >= 4) return dealt; // 理想 near-miss 形

    if (!best || sc > best.score) best = { score: sc, dealt };

    if (!foundClear) {
      foundClear = true;
      polishLeft = polishN;
    } else {
      polishLeft -= 1;
      if (polishLeft <= 0 && best) return best.dealt;
    }
  }

  if (best) return best.dealt;

  // hard：再短搜一轮（换盐），仍只要可清
  if (difficulty === 'hard') {
    for (let a = 0; a < 60; a++) {
      const s = (seed + a * 9973 + 0x9e3779b9) >>> 0;
      const dealt = dealOnce(s, difficulty);
      if (!dealt || !baseOk(dealt)) continue;
      if (passClearGreedy(dealt.level, s)) return dealt;
    }
    throw new Error(
      `dealLevel01: hard seed ${seed} failed to find clearable deal (D27/H1b)`,
    );
  }

  if (densityOk && passNoCrossLockKeyBurial(densityOk.level, densityOk.meta)) {
    return densityOk;
  }
  throw new Error('dealLevel01: failed to generate');
}

export function buildLevel01(
  seed?: number,
  difficulty: DealDifficulty = 'hard',
): Level {
  const s =
    seed ??
    (typeof crypto !== 'undefined' && 'getRandomValues' in crypto
      ? crypto.getRandomValues(new Uint32Array(1))[0]!
      : (Date.now() ^ (Math.random() * 1e9)) >>> 0);
  return dealLevel01(s, 40, difficulty).level;
}

export function buildLevel01WithMeta(
  seed?: number,
  difficulty: DealDifficulty = 'hard',
): {
  level: Level;
  meta: Level01DealMeta;
} {
  const s =
    seed ??
    (typeof crypto !== 'undefined' && 'getRandomValues' in crypto
      ? crypto.getRandomValues(new Uint32Array(1))[0]!
      : (Date.now() ^ (Math.random() * 1e9)) >>> 0);
  return dealLevel01(s, 40, difficulty);
}
