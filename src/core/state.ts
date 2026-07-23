import { mulberry32, shuffleInPlace } from './rng';
import {
  isFree,
  isWon,
  puzzleAlive,
  reclaimUnusedDeck,
  trimSurplusDeck,
} from './rules';
import type {
  Card,
  CardId,
  GameState,
  Level,
  Rank,
  Suit,
} from './types';
import { canMatchCards } from './types';

const DEFAULT_COVER = 0.15;

export type CreateStateOptions = {
  /** Seed used when recycling waste → stock */
  shuffleSeed?: number;
};

function cloneState(state: GameState): GameState {
  const cards: Record<CardId, Card> = {};
  for (const [id, c] of Object.entries(state.cards)) {
    cards[id] = {
      ...c,
      rect: { ...c.rect },
    };
  }
  return {
    levelId: state.levelId,
    cards,
    stock: [...state.stock],
    waste: [...state.waste],
    selectedId: state.selectedId,
    status: state.status,
    coverThreshold: state.coverThreshold,
    rev: state.rev,
  };
}

export function createStateFromLevel(
  level: Level,
  _opts: CreateStateOptions = {},
): GameState {
  const cards: Record<CardId, Card> = {};

  for (const def of level.cards) {
    cards[def.id] = {
      id: def.id,
      rank: def.rank,
      suit: def.suit ?? ('S' as Suit),
      layer: def.layer,
      tier: def.tier ?? 0,
      rect: { x: def.x, y: def.y, w: def.w, h: def.h },
      alive: true,
      zone: 'puzzle',
    };
  }

  const stock: CardId[] = [];
  for (const s of level.stock) {
    cards[s.id] = {
      id: s.id,
      rank: s.rank,
      suit: s.suit ?? ('S' as Suit),
      layer: 0,
      tier: 0,
      // Stock/waste rects filled by layout helper in render; logical hit uses synced rect
      rect: { x: 0, y: 0, w: 0, h: 0 },
      alive: true,
      zone: 'stock',
    };
    stock.push(s.id);
  }

  return {
    levelId: level.id,
    cards,
    stock,
    waste: [],
    selectedId: null,
    status: 'playing',
    coverThreshold: level.coverThreshold ?? DEFAULT_COVER,
    rev: 0,
  };
}

/**
 * Apply waste/stock design rects so pickCard works for draw pile top.
 * Call after create / draw / recycle when layout known.
 */
export function applyPileLayout(
  state: GameState,
  stockRect: { x: number; y: number; w: number; h: number },
  wasteRect: { x: number; y: number; w: number; h: number },
): GameState {
  const next = cloneState(state);
  for (const id of next.stock) {
    const c = next.cards[id];
    if (c) c.rect = { ...stockRect };
  }
  for (const id of next.waste) {
    const c = next.cards[id];
    if (c) c.rect = { ...wasteRect };
  }
  next.rev += 1;
  return next;
}

export class GameSession {
  private state: GameState;
  private history: GameState[] = [];
  private initialLevel: Level;
  private shuffleSeed: number;
  private rand: () => number;

  constructor(level: Level, opts: CreateStateOptions = {}) {
    this.initialLevel = level;
    this.shuffleSeed = opts.shuffleSeed ?? 42;
    this.rand = mulberry32(this.shuffleSeed);
    this.state = createStateFromLevel(level, opts);
    // 开局默认帮玩家翻开一张到抽出叠
    this.ensureWasteHasCard(this.state);
  }

  getState(): GameState {
    return this.state;
  }

  /** Snapshot for undo */
  private pushHistory(): void {
    this.history.push(cloneState(this.state));
    // Keep last 30 for later O10 step caps
    if (this.history.length > 30) this.history.shift();
  }

  private commit(next: GameState): void {
    next.rev = this.state.rev + 1;
    if (isWon(next)) next.status = 'won';
    this.state = next;
  }

  /**
   * stock[0] → waste 顶（无历史快照，供自动翻开 / 内部用）
   */
  private flipStockToWaste(state: GameState): boolean {
    if (state.stock.length === 0) return false;
    const id = state.stock.shift()!;
    const c = state.cards[id];
    if (!c) return false;
    c.zone = 'waste';
    state.waste.push(id);
    return true;
  }

  /**
   * 抽出叠为空且牌库仍有牌时，自动翻开一张（帮助玩家）。
   * @returns 是否发生了自动翻开
   */
  private ensureWasteHasCard(state: GameState): boolean {
    if (state.waste.length > 0) return false;
    if (state.status === 'won') return false;
    return this.flipStockToWaste(state);
  }

  restart(): void {
    this.history = [];
    this.rand = mulberry32(this.shuffleSeed);
    this.state = createStateFromLevel(this.initialLevel);
    this.ensureWasteHasCard(this.state);
  }

  undo(): boolean {
    const prev = this.history.pop();
    if (!prev) return false;
    this.state = prev;
    return true;
  }

  canUndo(): boolean {
    return this.history.length > 0;
  }

  tapCard(id: CardId): { matched: boolean; cancelled: boolean; reselected: boolean } {
    if (this.state.status === 'won') {
      return { matched: false, cancelled: false, reselected: false };
    }
    const card = this.state.cards[id];
    if (!card || !card.alive || !isFree(this.state, id)) {
      return { matched: false, cancelled: false, reselected: false };
    }

    this.pushHistory();
    const next = cloneState(this.state);

    // Re-tap selected → cancel
    if (next.selectedId === id) {
      next.selectedId = null;
      this.commit(next);
      return { matched: false, cancelled: true, reselected: false };
    }

    if (next.selectedId === null) {
      next.selectedId = id;
      this.commit(next);
      return { matched: false, cancelled: false, reselected: false };
    }

    const first = next.cards[next.selectedId];
    if (!first || !first.alive) {
      next.selectedId = id;
      this.commit(next);
      return { matched: false, cancelled: false, reselected: true };
    }

    if (canMatchCards(first, card)) {
      this.applyMatch(next, first.id, id);
      this.commit(next);
      return { matched: true, cancelled: false, reselected: false };
    }

    // Different rank → reselect
    next.selectedId = id;
    this.commit(next);
    return { matched: false, cancelled: false, reselected: true };
  }

  /**
   * Drag-drop / explicit pair match. One history step.
   * Both cards must be free and match (same rank+suit).
   */
  tryMatchPair(
    a: CardId,
    b: CardId,
  ): { matched: boolean } {
    if (this.state.status === 'won' || a === b) {
      return { matched: false };
    }
    const ca = this.state.cards[a];
    const cb = this.state.cards[b];
    if (
      !ca ||
      !cb ||
      !ca.alive ||
      !cb.alive ||
      !isFree(this.state, a) ||
      !isFree(this.state, b) ||
      !canMatchCards(ca, cb)
    ) {
      return { matched: false };
    }

    this.pushHistory();
    const next = cloneState(this.state);
    this.applyMatch(next, a, b);
    this.commit(next);
    return { matched: true };
  }

  private applyMatch(state: GameState, a: CardId, b: CardId): void {
    this.removePair(state, a, b);
    state.selectedId = null;
    if (puzzleAlive(state).length === 0) {
      reclaimUnusedDeck(state);
    } else {
      trimSurplusDeck(state);
      this.ensureWasteHasCard(state);
    }
  }

  private removePair(state: GameState, a: CardId, b: CardId): void {
    for (const id of [a, b]) {
      const c = state.cards[id];
      if (!c) continue;
      c.alive = false;
      if (c.zone === 'waste') {
        state.waste = state.waste.filter((x) => x !== id);
      } else if (c.zone === 'stock') {
        state.stock = state.stock.filter((x) => x !== id);
      }
      // puzzle: zone stays, alive false
    }
  }

  /**
   * 玩家点抽牌区：stock 顶 → waste 顶（覆盖当前抽出叠顶）。
   * 若 stock 空且 waste 非空 → 洗回 stock 再抽。
   * 两边皆空 → no-op。
   *
   * phase:
   * - full（默认）：洗回（若需要）+ 抽一张
   * - recycleOnly：只洗回，waste 清空；供动画「全部回库后再停顿再抽」
   * - drawOnly：只从 stock 抽一张（不写新 history，接在 recycleOnly 之后）
   */
  draw(opts?: {
    phase?: 'full' | 'recycleOnly' | 'drawOnly';
  }): { drew: boolean; recycled: boolean } {
    if (this.state.status === 'won') return { drew: false, recycled: false };
    const phase = opts?.phase ?? 'full';

    if (phase !== 'drawOnly') {
      this.pushHistory();
    }
    const next = cloneState(this.state);
    let recycled = false;

    if (phase === 'recycleOnly' || phase === 'full') {
      if (next.stock.length === 0) {
        if (next.waste.length === 0) {
          this.history.pop();
          return { drew: false, recycled: false };
        }
        this.recycleWaste(next);
        recycled = true;
      }
    }

    if (phase === 'recycleOnly') {
      if (!recycled) {
        this.history.pop();
        return { drew: false, recycled: false };
      }
      next.selectedId = null;
      this.commit(next);
      return { drew: false, recycled: true };
    }

    // full | drawOnly → flip one stock → waste
    if (next.stock.length === 0) {
      if (phase === 'full') this.history.pop();
      return { drew: false, recycled };
    }

    this.flipStockToWaste(next);
    next.selectedId = null;
    this.commit(next);
    return { drew: true, recycled };
  }

  private recycleWaste(state: GameState): void {
    const ids = [...state.waste];
    state.waste = [];
    shuffleInPlace(ids, this.rand);
    for (const id of ids) {
      const c = state.cards[id];
      if (c) c.zone = 'stock';
    }
    state.stock = ids;
  }

  /** Test helper: force recycle without draw */
  recycleOnlyForTest(): CardId[] {
    this.pushHistory();
    const next = cloneState(this.state);
    this.recycleWaste(next);
    this.commit(next);
    return [...next.stock];
  }
}

/** Convenience for pure tests without session history */
export function ranksOf(ids: CardId[], state: GameState): Rank[] {
  return ids.map((id) => state.cards[id]!.rank);
}
