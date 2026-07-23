import type { Level, LevelCardDef, Rank } from '../core/types';
import {
  CARD_H,
  CARD_W,
  getGridOriginY,
  STEP_X,
  STEP_Y,
} from './layout';
import { DESIGN_WIDTH } from '../viewport/design';

const DEFAULT_COVER = 0.12;

const ALL_RANKS: Rank[] = [
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

/**
 * Disney / SGH-inspired board templates (geometry only; match stays same-rank).
 * - pillow: dense mass + single free belt (main marketing look)
 * - tripeaks: three peaks, free on tips
 * - island: wide base + free island
 * - narrow: slim teaching pillow
 */
export type BoardTemplate = 'pillow' | 'tripeaks' | 'island' | 'narrow';

export type LevelBuildOpts = {
  id: string;
  name: string;
  teachHint?: string;
  insightNote?: string;
  template?: BoardTemplate;
  /** Free belt ranks, length 2–4, same horizontal row; prefer pairs */
  freeRanks: Rank[];
  stockRanks?: Rank[];
  buriedPool?: Rank[];
  coverThreshold?: number;
  /** Buried depth under each free (2–4) */
  stackDepth?: number;
};

const FREE_LAYER = 20;

function rectOf(x: number, y: number) {
  return { x: +x.toFixed(1), y: +y.toFixed(1), w: CARD_W, h: CARD_H };
}

function push(
  cards: LevelCardDef[],
  id: string,
  rank: Rank,
  layer: number,
  x: number,
  y: number,
): void {
  cards.push({ id, rank, layer, ...rectOf(x, y) });
}

function take(pool: Rank[], i: { n: number }): Rank {
  const r = pool[i.n % pool.length]!;
  i.n += 1;
  return r;
}

function evenOutStock(
  cards: LevelCardDef[],
  stockRanks: Rank[],
  maxPad = 14,
): Array<{ id: string; rank: Rank }> {
  const stock = [...stockRanks];
  const counts = new Map<Rank, number>();
  for (const c of cards) counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1);
  for (const r of stock) counts.set(r, (counts.get(r) ?? 0) + 1);
  for (const [rank, n] of counts) {
    if (n % 2 === 1) stock.push(rank);
  }
  for (const r of ['A', 'K', 'Q', 'J', '10', '9'] as Rank[]) {
    if (stock.length >= maxPad) break;
    stock.push(r, r);
  }
  return stock.map((rank, i) => ({
    id: `s${String(i + 1).padStart(2, '0')}`,
    rank,
  }));
}

function freeXs(n: number, step = STEP_X * 0.9): number[] {
  const total = (n - 1) * step + CARD_W;
  const start = (DESIGN_WIDTH - total) / 2;
  return Array.from({ length: n }, (_, i) => start + i * step);
}

/**
 * Stack under a free card: lower layers share nearly the same rect so free covers them.
 * Cascade +y for visual thickness (still large AABB overlap).
 */
function stackUnderFree(
  cards: LevelCardDef[],
  id: string,
  x: number,
  freeY: number,
  freeRank: Rank,
  depth: number,
  pool: Rank[],
  idx: { n: number },
): void {
  for (let d = 0; d < depth; d++) {
    push(cards, `${id}_b${d}`, take(pool, idx), d, x, freeY + (depth - d) * 7);
  }
  // 压缝 under-plate
  push(cards, `${id}_p`, take(pool, idx), depth, x + 4, freeY + 6);
  push(cards, `${id}_free`, freeRank, FREE_LAYER, x, freeY);
}

/** Cards between free columns — under free belt y so left/right free cover them */
function betweenBelt(
  cards: LevelCardDef[],
  xs: number[],
  freeY: number,
  pool: Rank[],
  idx: { n: number },
): void {
  for (let i = 0; i < xs.length - 1; i++) {
    const x = (xs[i]! + xs[i + 1]!) / 2;
    push(cards, `bt_${i}_0`, take(pool, idx), 0, x, freeY + 22);
    push(cards, `bt_${i}_1`, take(pool, idx), 1, x, freeY + 10);
    push(cards, `bt_${i}_2`, take(pool, idx), 2, x + 2, freeY + 4);
  }
}

/**
 * Extra density around free belt — only within cover range of free tops.
 * Each satellite uses nearest free column x and y offset ≤ 36.
 */
function halo(
  cards: LevelCardDef[],
  xs: number[],
  freeY: number,
  pool: Rank[],
  idx: { n: number },
  thick: boolean,
): void {
  const dys = thick ? [-28, -14, 18, 32] : [-20, 22];
  xs.forEach((x, i) => {
    dys.forEach((dy, j) => {
      push(
        cards,
        `h_${i}_${j}`,
        take(pool, idx),
        j,
        x + (j % 2 === 0 ? -5 : 5),
        freeY + dy,
      );
    });
  });
}

function buildPillow(
  opts: LevelBuildOpts,
  pool: Rank[],
  idx: { n: number },
  thick: boolean,
): LevelCardDef[] {
  const cards: LevelCardDef[] = [];
  const ranks = opts.freeRanks.slice(0, 4);
  const n = Math.min(4, Math.max(2, ranks.length));
  const depth = opts.stackDepth ?? (thick ? 3 : 2);
  const freeY = getGridOriginY() + STEP_Y * 1.55;
  const xs = freeXs(n, thick ? STEP_X * 0.86 : STEP_X * 0.95);

  for (let i = 0; i < n; i++) {
    stackUnderFree(
      cards,
      `c${i}`,
      xs[i]!,
      freeY,
      ranks[i] ?? ranks[0]!,
      depth,
      pool,
      idx,
    );
  }
  betweenBelt(cards, xs, freeY, pool, idx);
  halo(cards, xs, freeY, pool, idx, thick);

  // second row of density slightly lower (still coverable)
  if (thick) {
    xs.forEach((x, i) => {
      push(cards, `row2_${i}`, take(pool, idx), 0, x, freeY + 48);
      // local cover plate under free
      push(cards, `row2c_${i}`, take(pool, idx), FREE_LAYER - 1, x, freeY + 8);
    });
  }
  return cards;
}

function buildTripeaks(
  opts: LevelBuildOpts,
  pool: Rank[],
  idx: { n: number },
): LevelCardDef[] {
  const cards: LevelCardDef[] = [];
  const ranks = [...opts.freeRanks];
  while (ranks.length < 3) ranks.push(ranks[0] ?? 'A');
  const freeY = getGridOriginY() + STEP_Y * 1.2;
  const peakXs = freeXs(3, STEP_X * 1.1);
  const depth = opts.stackDepth ?? 3;

  for (let p = 0; p < 3; p++) {
    const px = peakXs[p]!;
    // wings close enough to free peak
    push(cards, `pk${p}_wL`, take(pool, idx), 0, px - STEP_X * 0.4, freeY + 28);
    push(cards, `pk${p}_wR`, take(pool, idx), 0, px + STEP_X * 0.4, freeY + 28);
    push(cards, `pk${p}_wLc`, take(pool, idx), FREE_LAYER - 1, px, freeY + 8);
    stackUnderFree(cards, `pk${p}`, px, freeY, ranks[p]!, depth, pool, idx);
  }
  for (let i = 0; i < 2; i++) {
    const x = (peakXs[i]! + peakXs[i + 1]!) / 2;
    push(cards, `v${i}`, take(pool, idx), 0, x, freeY + 36);
    push(cards, `vc${i}`, take(pool, idx), FREE_LAYER - 1, x, freeY + 6);
  }
  return cards;
}

function buildIsland(
  opts: LevelBuildOpts,
  pool: Rank[],
  idx: { n: number },
): LevelCardDef[] {
  const cards: LevelCardDef[] = [];
  const ranks = opts.freeRanks;
  const n = Math.min(4, Math.max(2, ranks.length));
  const freeY = getGridOriginY() + STEP_Y * 1.35;
  const depth = opts.stackDepth ?? 2;
  const xs = freeXs(n);

  // Wide look: only under free columns + between (so free tops fully cover base)
  xs.forEach((x, i) => {
    push(cards, `base_${i}`, take(pool, idx), 0, x, freeY + 48);
    push(cards, `baseM_${i}`, take(pool, idx), 1, x, freeY + 28);
    push(cards, `baseC_${i}`, take(pool, idx), FREE_LAYER - 1, x, freeY + 10);
  });
  // extend base one step outside, each capped by nearest free
  if (xs.length >= 2) {
    const left = xs[0]! - STEP_X * 0.5;
    const right = xs[xs.length - 1]! + STEP_X * 0.5;
    push(cards, 'base_L', take(pool, idx), 0, left, freeY + 48);
    push(cards, 'base_Lc', take(pool, idx), FREE_LAYER - 1, xs[0]!, freeY + 10);
    push(cards, 'base_R', take(pool, idx), 0, right, freeY + 48);
    push(
      cards,
      'base_Rc',
      take(pool, idx),
      FREE_LAYER - 1,
      xs[xs.length - 1]!,
      freeY + 10,
    );
  }

  for (let i = 0; i < n; i++) {
    stackUnderFree(
      cards,
      `isl${i}`,
      xs[i]!,
      freeY,
      ranks[i]!,
      depth,
      pool,
      idx,
    );
  }
  betweenBelt(cards, xs, freeY, pool, idx);
  return cards;
}

export function buildLevel(opts: LevelBuildOpts): Level {
  const template = opts.template ?? 'pillow';
  const coverThreshold = opts.coverThreshold ?? DEFAULT_COVER;
  const pool: Rank[] =
    opts.buriedPool ??
    ALL_RANKS.filter((r) => !opts.freeRanks.includes(r)).concat(opts.freeRanks);
  const idx = { n: 0 };

  let cards: LevelCardDef[];
  switch (template) {
    case 'tripeaks':
      cards = buildTripeaks(opts, pool, idx);
      break;
    case 'island':
      cards = buildIsland(opts, pool, idx);
      break;
    case 'narrow':
      cards = buildPillow(opts, pool, idx, false);
      break;
    case 'pillow':
    default:
      cards = buildPillow(opts, pool, idx, true);
      break;
  }

  return {
    id: opts.id,
    name: opts.name,
    teachHint: opts.teachHint,
    insightNote: opts.insightNote,
    coverThreshold,
    cards,
    stock: evenOutStock(cards, opts.stockRanks ?? []),
  };
}
