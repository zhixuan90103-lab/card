import { freeCardIds, hasImmediatePair } from './rules';
import type { GameState, Rank } from './types';

/** Free ranks multiset (puzzle free + waste top). */
export function freeRankMultiset(state: GameState): Map<Rank, number> {
  const m = new Map<Rank, number>();
  for (const id of freeCardIds(state)) {
    const c = state.cards[id];
    if (!c) continue;
    m.set(c.rank, (m.get(c.rank) ?? 0) + 1);
  }
  return m;
}

/** Ranks still in stock ∪ waste (including buried waste). */
export function deckRanks(state: GameState): Set<Rank> {
  const s = new Set<Rank>();
  for (const id of [...state.stock, ...state.waste]) {
    const c = state.cards[id];
    if (c?.alive) s.add(c.rank);
  }
  return s;
}

/** F = free ranks set; D = deck ranks. Soft: no immediate pair but F∩D ≠ ∅ */
export function isSoftStuck(state: GameState): boolean {
  if (state.status === 'won') return false;
  if (hasImmediatePair(state)) return false;
  const F = new Set(freeRankMultiset(state).keys());
  if (F.size === 0) return false;
  const D = deckRanks(state);
  for (const r of F) {
    if (D.has(r)) return true;
  }
  return false;
}

/**
 * 游戏失败：当前没有任何可配对手段
 * - free 中无同点两张，且
 * - 抽牌区/抽出叠里也没有能配上 free 的点，且
 * - 无法再抽（库与抽出叠皆空，或 free 为空且库也空）
 */
export function isHardDead(state: GameState): boolean {
  if (state.status === 'won') return false;
  if (hasImmediatePair(state)) return false;

  const F = freeRankMultiset(state);
  for (const n of F.values()) {
    if (n >= 2) return false;
  }

  const freeSet = new Set(F.keys());
  const canDraw = state.stock.length > 0 || state.waste.length > 0;

  if (freeSet.size === 0) {
    // 无 free：还能抽则未死；两边皆空 → 若谜题已空应已 isWon，否则失败
    if (canDraw) return false;
    return Object.values(state.cards).some(
      (c) => c.alive && c.zone === 'puzzle',
    );
  }

  // 有 free 但不成对：库里是否还能提供同点？
  const D = deckRanks(state);
  for (const r of freeSet) {
    if (D.has(r)) return false;
  }
  // 可以洗回再抽？waste 有牌 stock 空 → 仍 canDraw，但 D 已含 waste 全部点
  // 若 free 点与 D 无交 → 抽什么都配不上
  return true;
}

/** Count how many draws until stock empty (one cycle); for soft-tip trigger. */
export function stockCycleLength(state: GameState): number {
  return state.stock.length + state.waste.length;
}
