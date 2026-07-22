/**
 * 配点验收：清谜题区（用于 deal 过滤）
 * 胜利 = 桌面清空；stock 是工具，不要求抽光。
 *
 * 策略：优先消 free 对；否则若库/抽出叠里有 free 需要的点，向该点抽；
 * 否则盲抽。比纯盲抽更贴近「会用抽牌区」的玩家。
 */
import { freeCardIds, isWon, puzzleAlive } from '../core/rules';
import { createStateFromLevel } from '../core/state';
import { mulberry32, shuffleInPlace } from '../core/rng';
import type { CardId, GameState, Level, Rank } from '../core/types';

const MAX_STEPS = 220;

function removePair(state: GameState, a: CardId, b: CardId): void {
  for (const id of [a, b]) {
    const c = state.cards[id];
    if (!c) continue;
    c.alive = false;
    if (c.zone === 'waste') state.waste = state.waste.filter((x) => x !== id);
    else if (c.zone === 'stock')
      state.stock = state.stock.filter((x) => x !== id);
  }
  if (isWon(state)) state.status = 'won';
}

function flipStock(state: GameState): boolean {
  if (state.stock.length === 0) return false;
  const id = state.stock.shift()!;
  state.cards[id]!.zone = 'waste';
  state.waste.push(id);
  return true;
}

function recycle(state: GameState, rand: () => number): void {
  const ids = [...state.waste];
  state.waste = [];
  shuffleInPlace(ids, rand);
  for (const id of ids) {
    const c = state.cards[id];
    if (c) c.zone = 'stock';
  }
  state.stock = ids;
}

function ensureWaste(state: GameState): void {
  if (state.waste.length === 0) flipStock(state);
}

function deckHasRank(state: GameState, rank: Rank): boolean {
  for (const id of state.stock) {
    if (state.cards[id]?.rank === rank) return true;
  }
  for (const id of state.waste) {
    if (state.cards[id]?.rank === rank) return true;
  }
  return false;
}

/** 抽/洗直到 waste 顶为 want，或库循环一轮仍没有 */
function drawToward(
  state: GameState,
  want: Set<Rank>,
  rand: () => number,
): boolean {
  const limit = state.stock.length + state.waste.length + 2;
  for (let i = 0; i < limit; i++) {
    if (state.waste.length > 0) {
      const top = state.cards[state.waste[state.waste.length - 1]!]!;
      if (want.has(top.rank)) return true;
    }
    if (state.stock.length === 0) {
      if (state.waste.length === 0) return false;
      // 抽出叠里是否还有目标（非顶）
      const buried = state.waste.some((id) =>
        want.has(state.cards[id]!.rank),
      );
      if (!buried) return false;
      recycle(state, rand);
    }
    if (!flipStock(state)) return false;
  }
  return state.waste.length > 0 &&
    want.has(state.cards[state.waste[state.waste.length - 1]!]!.rank);
}

function freeByRank(state: GameState): Map<Rank, CardId[]> {
  const byRank = new Map<Rank, CardId[]>();
  for (const id of freeCardIds(state)) {
    const r = state.cards[id]!.rank;
    if (!byRank.has(r)) byRank.set(r, []);
    byRank.get(r)!.push(id);
  }
  return byRank;
}

/**
 * 验收：能否清完谜题区（允许残留 stock，清桌即胜）
 */
export function canFullyClear(level: Level, solveSeed = 1): boolean {
  const state = createStateFromLevel(level);
  ensureWaste(state);
  const rand = mulberry32(solveSeed);

  let idleDraws = 0;
  for (let step = 0; step < MAX_STEPS; step++) {
    if (isWon(state)) return true;
    if (puzzleAlive(state).length === 0) return true;

    const byRank = freeByRank(state);

    // 1) 场上 free 成对 → 消（优先带 waste 的对，少打乱抽出叠）
    let pair: [CardId, CardId] | null = null;
    for (const ids of byRank.values()) {
      if (ids.length < 2) continue;
      const wasteId = ids.find((id) => state.cards[id]!.zone === 'waste');
      if (wasteId) {
        const other = ids.find((id) => id !== wasteId)!;
        pair = [wasteId, other];
        break;
      }
      if (!pair) pair = [ids[0]!, ids[1]!];
    }
    if (pair) {
      removePair(state, pair[0], pair[1]);
      ensureWaste(state);
      idleDraws = 0;
      continue;
    }

    // 2) free 单点 ∩ 库内有同点 → 抽到 waste 顶再配
    const need = new Set<Rank>();
    for (const [r, ids] of byRank) {
      if (ids.length === 1 && deckHasRank(state, r)) need.add(r);
    }
    if (need.size > 0) {
      if (drawToward(state, need, rand)) {
        const by2 = freeByRank(state);
        let did = false;
        for (const ids of by2.values()) {
          if (ids.length >= 2) {
            removePair(state, ids[0]!, ids[1]!);
            ensureWaste(state);
            did = true;
            idleDraws = 0;
            break;
          }
        }
        if (did) continue;
      }
    }

    // 3) 盲抽；连续空抽过多 → 判失败（避免洗回空转）
    idleDraws += 1;
    const deckN = state.stock.length + state.waste.length;
    if (deckN === 0 || idleDraws > Math.max(deckN * 2, 6)) return false;

    if (state.stock.length === 0) {
      if (state.waste.length === 0) return false;
      recycle(state, rand);
    }
    if (!flipStock(state)) return false;
  }
  return isWon(state);
}
