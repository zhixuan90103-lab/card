import { freeCardIds, hasImmediatePair } from './rules';
import type { GameState } from './types';
import { matchKeyOf } from './types';

/** Free match-key multiset（点数+颜色；puzzle free + waste 顶等） */
export function freeMatchMultiset(state: GameState): Map<string, number> {
  const m = new Map<string, number>();
  for (const id of freeCardIds(state)) {
    const c = state.cards[id];
    if (!c) continue;
    const k = matchKeyOf(c);
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

/** @deprecated 用 freeMatchMultiset；保留 rank 视图仅调试 */
export function freeRankMultiset(state: GameState): Map<string, number> {
  return freeMatchMultiset(state);
}

/** stock ∪ waste 中的配对键 */
export function deckMatchKeys(state: GameState): Set<string> {
  const s = new Set<string>();
  for (const id of [...state.stock, ...state.waste]) {
    const c = state.cards[id];
    if (!c?.alive) continue;
    const k = matchKeyOf(c);
    if (k) s.add(k);
  }
  return s;
}

/** @deprecated */
export function deckRanks(state: GameState): Set<string> {
  return deckMatchKeys(state);
}

/** 软卡：无立即对，但 free 的某键在库里还有 */
export function isSoftStuck(state: GameState): boolean {
  if (state.status === 'won') return false;
  if (hasImmediatePair(state)) return false;
  const F = freeMatchMultiset(state);
  if (F.size === 0) return false;
  const D = deckMatchKeys(state);
  for (const k of F.keys()) {
    if (D.has(k)) return true;
  }
  return false;
}

/**
 * 硬死局：无同色同点 free 对，且库无法提供 free 需要的键
 */
export function isHardDead(state: GameState): boolean {
  if (state.status === 'won') return false;
  if (hasImmediatePair(state)) return false;

  const F = freeMatchMultiset(state);
  for (const n of F.values()) {
    if (n >= 2) return false;
  }

  const freeSet = new Set(F.keys());
  const canDraw = state.stock.length > 0 || state.waste.length > 0;

  if (freeSet.size === 0) {
    if (canDraw) return false;
    return Object.values(state.cards).some(
      (c) => c.alive && c.zone === 'puzzle',
    );
  }

  const D = deckMatchKeys(state);
  for (const k of freeSet) {
    if (D.has(k)) return false;
  }
  return true;
}

export function stockCycleLength(state: GameState): number {
  return state.stock.length + state.waste.length;
}
