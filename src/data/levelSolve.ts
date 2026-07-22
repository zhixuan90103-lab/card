/**
 * 配点验收：清谜题区（用于 deal 过滤）
 * D22：配对键 = 点数 + 红黑
 */
import { freeCardIds, isWon, puzzleAlive } from '../core/rules';
import { createStateFromLevel } from '../core/state';
import { mulberry32, shuffleInPlace } from '../core/rng';
import type { CardId, GameState, Level } from '../core/types';
import { matchKeyOf } from '../core/types';

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

function deckHasKey(state: GameState, key: string): boolean {
  for (const id of state.stock) {
    const k = matchKeyOf(state.cards[id]!);
    if (k === key) return true;
  }
  for (const id of state.waste) {
    const k = matchKeyOf(state.cards[id]!);
    if (k === key) return true;
  }
  return false;
}

function drawToward(
  state: GameState,
  want: Set<string>,
  rand: () => number,
): boolean {
  const limit = state.stock.length + state.waste.length + 2;
  for (let i = 0; i < limit; i++) {
    if (state.waste.length > 0) {
      const top = state.cards[state.waste[state.waste.length - 1]!]!;
      const k = matchKeyOf(top);
      if (k && want.has(k)) return true;
    }
    if (state.stock.length === 0) {
      if (state.waste.length === 0) return false;
      const buried = state.waste.some((id) => {
        const k = matchKeyOf(state.cards[id]!);
        return k != null && want.has(k);
      });
      if (!buried) return false;
      recycle(state, rand);
    }
    if (!flipStock(state)) return false;
  }
  if (state.waste.length === 0) return false;
  const k = matchKeyOf(state.cards[state.waste[state.waste.length - 1]!]!);
  return k != null && want.has(k);
}

function freeByMatchKey(state: GameState): Map<string, CardId[]> {
  const by = new Map<string, CardId[]>();
  for (const id of freeCardIds(state)) {
    const k = matchKeyOf(state.cards[id]!);
    if (!k) continue;
    if (!by.has(k)) by.set(k, []);
    by.get(k)!.push(id);
  }
  return by;
}

export type GreedyProgressProbe = {
  /** 贪心能否清桌 */
  clearable: boolean;
  /** 第一次「无 free 对、只能抽」前已消的配对数 */
  matchesBeforeFirstStall: number;
  /** 第一次 stall 时谜题区存活张数 */
  puzzleAtFirstStall: number;
  /** 开局谜题区张数 */
  initialPuzzle: number;
};

/**
 * 贪心路径探针：用于发局筛「开局就旱 / 过早卡死」。
 * 与 canFullyClear 同一套消法。
 */
export function probeGreedyProgress(
  level: Level,
  solveSeed = 1,
): GreedyProgressProbe {
  const state = createStateFromLevel(level);
  ensureWaste(state);
  const rand = mulberry32(solveSeed);
  const initialPuzzle = puzzleAlive(state).length;

  let matches = 0;
  let matchesBeforeFirstStall = -1;
  let puzzleAtFirstStall = initialPuzzle;
  let idleDraws = 0;

  for (let step = 0; step < MAX_STEPS; step++) {
    if (isWon(state) || puzzleAlive(state).length === 0) {
      if (matchesBeforeFirstStall < 0) {
        matchesBeforeFirstStall = matches;
        puzzleAtFirstStall = 0;
      }
      return {
        clearable: true,
        matchesBeforeFirstStall:
          matchesBeforeFirstStall < 0 ? matches : matchesBeforeFirstStall,
        puzzleAtFirstStall,
        initialPuzzle,
      };
    }

    const byKey = freeByMatchKey(state);

    let pair: [CardId, CardId] | null = null;
    for (const ids of byKey.values()) {
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
      matches += 1;
      idleDraws = 0;
      continue;
    }

    // 第一次无 free 对 → 记 stall
    if (matchesBeforeFirstStall < 0) {
      matchesBeforeFirstStall = matches;
      puzzleAtFirstStall = puzzleAlive(state).length;
    }

    const need = new Set<string>();
    for (const [k, ids] of byKey) {
      if (ids.length === 1 && deckHasKey(state, k)) need.add(k);
    }
    if (need.size > 0) {
      if (drawToward(state, need, rand)) {
        const by2 = freeByMatchKey(state);
        let did = false;
        for (const ids of by2.values()) {
          if (ids.length >= 2) {
            removePair(state, ids[0]!, ids[1]!);
            ensureWaste(state);
            matches += 1;
            did = true;
            idleDraws = 0;
            break;
          }
        }
        if (did) continue;
      }
    }

    idleDraws += 1;
    const deckN = state.stock.length + state.waste.length;
    if (deckN === 0 || idleDraws > Math.max(deckN * 2, 6)) {
      return {
        clearable: false,
        matchesBeforeFirstStall:
          matchesBeforeFirstStall < 0 ? matches : matchesBeforeFirstStall,
        puzzleAtFirstStall:
          matchesBeforeFirstStall < 0
            ? puzzleAlive(state).length
            : puzzleAtFirstStall,
        initialPuzzle,
      };
    }

    if (state.stock.length === 0) {
      if (state.waste.length === 0) {
        return {
          clearable: false,
          matchesBeforeFirstStall:
            matchesBeforeFirstStall < 0 ? matches : matchesBeforeFirstStall,
          puzzleAtFirstStall:
            matchesBeforeFirstStall < 0
              ? puzzleAlive(state).length
              : puzzleAtFirstStall,
          initialPuzzle,
        };
      }
      recycle(state, rand);
    }
    if (!flipStock(state)) {
      return {
        clearable: false,
        matchesBeforeFirstStall:
          matchesBeforeFirstStall < 0 ? matches : matchesBeforeFirstStall,
        puzzleAtFirstStall:
          matchesBeforeFirstStall < 0
            ? puzzleAlive(state).length
            : puzzleAtFirstStall,
        initialPuzzle,
      };
    }
  }

  const won = isWon(state) || puzzleAlive(state).length === 0;
  return {
    clearable: won,
    matchesBeforeFirstStall:
      matchesBeforeFirstStall < 0 ? matches : matchesBeforeFirstStall,
    puzzleAtFirstStall,
    initialPuzzle,
  };
}

export function canFullyClear(level: Level, solveSeed = 1): boolean {
  return probeGreedyProgress(level, solveSeed).clearable;
}
