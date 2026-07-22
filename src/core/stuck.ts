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

/** stock ∪ waste 中每个配对键的张数 */
export function deckMatchMultiset(state: GameState): Map<string, number> {
  const m = new Map<string, number>();
  for (const id of [...state.stock, ...state.waste]) {
    const c = state.cards[id];
    if (!c?.alive) continue;
    const k = matchKeyOf(c);
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

/** stock ∪ waste 中的配对键集合 */
export function deckMatchKeys(state: GameState): Set<string> {
  return new Set(deckMatchMultiset(state).keys());
}

/** @deprecated */
export function deckRanks(state: GameState): Set<string> {
  return deckMatchKeys(state);
}

/**
 * 库（stock∪waste）能否再给 free 键 k 提供一张**配对手**。
 *
 * 注意：抽出叠顶既是 free 又在 waste 里。若 free 对该键只靠抽出叠顶，
 * 必须从 deck 计数中去掉自身，否则永远误判「库里还有」→ 硬死局不触发。
 */
export function deckCanSupplyPartner(
  state: GameState,
  key: string,
  freeCountForKey: number,
): boolean {
  if (freeCountForKey >= 2) return true;

  const deckN = deckMatchMultiset(state).get(key) ?? 0;
  if (deckN <= 0) return false;

  const wasteTopId = state.waste[state.waste.length - 1];
  const wasteTop = wasteTopId ? state.cards[wasteTopId] : undefined;
  const wasteTopKey = wasteTop?.alive ? matchKeyOf(wasteTop) : null;
  // 抽出叠顶是 free 且键相同 → deck 计数含自己，需 ≥2 才算另有一张
  if (wasteTopKey === key && freeCountForKey >= 1) {
    return deckN >= 2;
  }
  // free 全在谜题区：库中任意 1 张同键即可
  return deckN >= 1;
}

/** 软卡：无立即对，但某 free 键仍可从库补一张配对手 */
export function isSoftStuck(state: GameState): boolean {
  if (state.status === 'won') return false;
  if (hasImmediatePair(state)) return false;
  if (isHardDead(state)) return false;

  const F = freeMatchMultiset(state);
  if (F.size === 0) return false;

  for (const [k, n] of F) {
    if (n < 2 && deckCanSupplyPartner(state, k, n)) return true;
  }
  return false;
}

/**
 * 硬死局：无同色同点 free 对，且库无法再帮任何 free 键凑对。
 */
export function isHardDead(state: GameState): boolean {
  if (state.status === 'won') return false;
  if (hasImmediatePair(state)) return false;

  const F = freeMatchMultiset(state);
  const canDraw = state.stock.length > 0 || state.waste.length > 0;

  if (F.size === 0) {
    // 没有 free：还能抽/洗则未死；谜题还有被盖的牌且无库 → 死
    if (canDraw) return false;
    return Object.values(state.cards).some(
      (c) => c.alive && c.zone === 'puzzle',
    );
  }

  for (const [k, n] of F) {
    if (n >= 2) return false;
    if (deckCanSupplyPartner(state, k, n)) return false;
  }
  return true;
}

export function stockCycleLength(state: GameState): number {
  return state.stock.length + state.waste.length;
}
