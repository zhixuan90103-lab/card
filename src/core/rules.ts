import {
  aabbContains,
  rectCenter,
  rectsOverlap,
  unionRects,
} from './geometry';
import type { Card, CardId, GameState, Rank, Rect } from './types';
import { canMatchCards, matchKeyOf } from './types';

export function getCard(state: GameState, id: CardId): Card | undefined {
  return state.cards[id];
}

export function puzzleAlive(state: GameState): Card[] {
  return Object.values(state.cards).filter(
    (c) => c.alive && c.zone === 'puzzle',
  );
}

/** Group id: `g00_2` → `g00`, `d12_0` → `d12` */
export function groupKey(id: CardId): string {
  const i = id.lastIndexOf('_');
  return i >= 0 ? id.slice(0, i) : id;
}

export function maxAliveTier(state: GameState): number {
  let max = 0;
  for (const c of puzzleAlive(state)) {
    if (c.tier > max) max = c.tier;
  }
  return max;
}

type GroupInfo = {
  key: string;
  tier: number;
  /** Max layer among alive members (group top while full) */
  topLayer: number;
  topId: CardId;
  foot: Rect;
};

function buildGroups(state: GameState): GroupInfo[] {
  const map = new Map<string, Card[]>();
  for (const c of puzzleAlive(state)) {
    const k = groupKey(c.id);
    let arr = map.get(k);
    if (!arr) {
      arr = [];
      map.set(k, arr);
    }
    arr.push(c);
  }
  const out: GroupInfo[] = [];
  for (const [key, members] of map) {
    let top = members[0]!;
    for (const m of members) {
      if (m.layer > top.layer) top = m;
    }
    const foot = unionRects(members.map((m) => m.rect));
    if (!foot) continue;
    out.push({
      key,
      tier: top.tier,
      topLayer: top.layer,
      topId: top.id,
      foot,
    });
  }
  return out;
}

/**
 * Free / 翻面 — **组 footprint + 分层几何**（根因修复 v2）
 *
 * ## 根因
 * 旧逻辑对所有遮挡统一用 `coverThreshold≈0.12` 比例重叠：
 * 上层只剩中/底时，对角邻接下层只剩 **2%～8%** 角部重叠 → 误判 free。
 *
 * ## 几何策略（按高度分层）
 * | 关系 | 几何 |
 * |------|------|
 * | 更高 tier / 更高 topLayer | **任意 ≥1px 重叠** 即挡（I1：可见遮挡 ⇒ 不可 free） |
 * | 同 tier 且 topLayer 相等 | 仅当 **C 的中心落入 G.footprint** 时挡（不对称：压在别人牌堆下） |
 *
 * ## 遮挡单元
 * 组 = 存活成员 rect 并集 + 组顶 layer/tier。组中/组底 layer 虽低，
 * 整摞 footprint + 组顶高度仍能挡住压在堆下的牌。
 */
export function isFree(state: GameState, id: CardId): boolean {
  const card = state.cards[id];
  if (!card || !card.alive) return false;

  if (card.zone === 'stock') {
    // 抽牌区只是工具：背面不可点，只能抽到抽出叠
    return false;
  }

  if (card.zone === 'waste') {
    if (state.waste.length === 0) return false;
    return state.waste[state.waste.length - 1] === id;
  }

  const myKey = groupKey(id);

  // 同组：更高 layer 且任意重叠 → 压住
  for (const o of puzzleAlive(state)) {
    if (o.id === id) continue;
    if (groupKey(o.id) !== myKey) continue;
    if (o.layer > card.layer && rectsOverlap(o.rect, card.rect)) return false;
  }

  const groups = buildGroups(state);
  const myCenter = rectCenter(card.rect);

  for (const g of groups) {
    if (g.key === myKey) continue;

    // --- height: is G above C? ---
    if (g.tier < card.tier) continue;
    if (g.tier > card.tier) {
      // 更高板层：任意重叠即挡
      if (rectsOverlap(g.foot, card.rect)) return false;
      continue;
    }

    // same tier
    if (g.topLayer > card.layer) {
      // 组顶更高：任意重叠即挡
      if (rectsOverlap(g.foot, card.rect)) return false;
      continue;
    }
    if (g.topLayer < card.layer) continue;

    // same tier + same topLayer：仅中心落入对方 footprint 才算压在堆下
    // （避免两 free 顶边缘轻碰时互相锁死；中心在堆下则明确被盖）
    if (g.topId !== id && aabbContains(g.foot, myCenter.x, myCenter.y)) {
      return false;
    }
  }

  return true;
}

export function freeCardIds(state: GameState): CardId[] {
  const ids: CardId[] = [];
  for (const c of Object.values(state.cards)) {
    if (c.alive && isFree(state, c.id)) ids.push(c.id);
  }
  return ids;
}

export function pickCard(
  state: GameState,
  p: { x: number; y: number },
): CardId | null {
  const candidates: Card[] = [];
  for (const id of freeCardIds(state)) {
    const c = state.cards[id];
    if (!c) continue;
    const { rect } = c;
    if (
      p.x >= rect.x &&
      p.x <= rect.x + rect.w &&
      p.y >= rect.y &&
      p.y <= rect.y + rect.h
    ) {
      candidates.push(c);
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const za = a.zone === 'waste' ? 1000 + a.layer : a.layer;
    const zb = b.zone === 'waste' ? 1000 + b.layer : b.layer;
    if (zb !== za) return zb - za;
    return a.id < b.id ? 1 : -1;
  });
  return candidates[0].id;
}

/**
 * 胜利 = 谜题区清空（D10 / 02_game_rules）
 *
 * 抽牌区·抽出叠是**辅助工具**：过关时允许仍有剩余。
 * 清桌后由 session 回收未用库牌，避免「桌面空了还要收尾配库」的伪终局。
 */
export function isWon(state: GameState): boolean {
  return puzzleAlive(state).length === 0;
}

/** 谜题已空：回收未使用的 stock/waste（alive=false，清空队列） */
export function reclaimUnusedDeck(state: GameState): void {
  if (puzzleAlive(state).length > 0) return;
  for (const id of [...state.stock, ...state.waste]) {
    const c = state.cards[id];
    if (c?.alive) c.alive = false;
  }
  state.stock = [];
  state.waste = [];
}

/**
 * 残局收库：桌上已不再需要的同色同点，从 stock/waste 成对回收。
 * 例：桌只剩 1 张 4♥ 时，库里成对的 6♠ 等工具牌撤掉，避免「桌 1 张、库还剩一摞」。
 * 桌上每个 key 保留最少伙伴数 = boardCount % 2（保证全局偶数可收尾）。
 */
export function trimSurplusDeck(state: GameState): void {
  if (state.status === 'won') return;
  if (puzzleAlive(state).length === 0) {
    reclaimUnusedDeck(state);
    return;
  }

  const boardCount = new Map<string, number>();
  for (const c of puzzleAlive(state)) {
    const k = matchKeyOf(c);
    if (!k) continue;
    boardCount.set(k, (boardCount.get(k) ?? 0) + 1);
  }

  const deckByKey = new Map<string, CardId[]>();
  for (const id of [...state.stock, ...state.waste]) {
    const c = state.cards[id];
    if (!c?.alive) continue;
    const k = matchKeyOf(c);
    if (!k) continue;
    if (!deckByKey.has(k)) deckByKey.set(k, []);
    deckByKey.get(k)!.push(id);
  }

  const toKill = new Set<CardId>();

  for (const [k, ids] of deckByKey) {
    const b = boardCount.get(k) ?? 0;
    const d = ids.length;
    // 桌上能自相配对，多余 singles 需要库里最少 b%2 张
    const needKeep = b % 2;
    if (d <= needKeep) continue;
    let removeN = d - needKeep;
    // 只成对移除，保持该 key 总偶数（b+d 本应偶数 → removeN 偶数）
    if (removeN % 2 === 1) removeN -= 1;
    if (removeN <= 0) continue;

    // 优先回收：waste 底层 → stock 尾部（后抽的）；尽量保留 waste 顶若它是 needKeep
    const wasteTop =
      state.waste.length > 0 ? state.waste[state.waste.length - 1]! : null;
    const ordered = [...ids].sort((a, bId) => {
      const aWaste = state.waste.indexOf(a);
      const bWaste = state.waste.indexOf(bId);
      const aStock = state.stock.indexOf(a);
      const bStock = state.stock.indexOf(bId);
      // waste 非顶优先杀
      if (a === wasteTop && needKeep > 0) return 1;
      if (bId === wasteTop && needKeep > 0) return -1;
      if (aWaste >= 0 && bWaste >= 0) return aWaste - bWaste; // 底层先
      if (aWaste >= 0) return -1;
      if (bWaste >= 0) return 1;
      // stock：index 大的后抽，先杀后抽的
      return bStock - aStock;
    });

    for (let i = 0; i < removeN; i++) {
      const id = ordered[i];
      if (id) toKill.add(id);
    }
  }

  if (toKill.size === 0) return;

  for (const id of toKill) {
    const c = state.cards[id];
    if (c) c.alive = false;
  }
  state.stock = state.stock.filter((id) => !toKill.has(id));
  state.waste = state.waste.filter((id) => !toKill.has(id));
}

/** 场上 free 是否存在可消对（同点同色） */
export function hasImmediatePair(state: GameState): boolean {
  const keys = new Map<string, number>();
  for (const id of freeCardIds(state)) {
    const c = state.cards[id];
    if (!c) continue;
    const k = matchKeyOf(c);
    if (!k) continue;
    keys.set(k, (keys.get(k) ?? 0) + 1);
  }
  for (const n of keys.values()) {
    if (n >= 2) return true;
  }
  return false;
}

export { canMatchCards, matchKeyOf };
