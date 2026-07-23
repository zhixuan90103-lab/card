import { describe, expect, it } from 'vitest';
import { isFree, groupKey, freeCardIds } from './rules';
import { createStateFromLevel } from './state';
import { buildLevel01, LEVEL01_TEST_SEED } from '../data/level01';
import type { Card, GameState } from './types';

function makeCard(
  partial: Partial<Card> & Pick<Card, 'id' | 'rank' | 'layer' | 'tier' | 'rect'>,
): Card {
  return {
    suit: 'S',
    alive: true,
    zone: 'puzzle',
    ...partial,
  };
}

function stateFrom(cards: Card[]): GameState {
  const map: Record<string, Card> = {};
  for (const c of cards) map[c.id] = c;
  return {
    levelId: 't',
    cards: map,
    stock: [],
    waste: [],
    selectedId: null,
    status: 'playing',
    coverThreshold: 0.12,
    rev: 0,
  };
}

describe('group footprint free rules', () => {
  it('groupKey strips stack index', () => {
    expect(groupKey('d10_2')).toBe('d10');
    expect(groupKey('g03_0')).toBe('g03');
  });

  it('lower card under upper stack footprint is not free', () => {
    const upperTop = makeCard({
      id: 'd00_2',
      rank: '3',
      layer: 8,
      tier: 2,
      rect: { x: 100, y: 100, w: 52, h: 72 },
    });
    const upperMid = makeCard({
      id: 'd00_1',
      rank: 'A',
      layer: 7,
      tier: 2,
      rect: { x: 100, y: 91, w: 52, h: 72 },
    });
    const upperBot = makeCard({
      id: 'd00_0',
      rank: 'A',
      layer: 6,
      tier: 2,
      rect: { x: 100, y: 82, w: 52, h: 72 },
    });
    const under = makeCard({
      id: 'c00_2',
      rank: '9',
      layer: 5,
      tier: 1,
      rect: { x: 110, y: 120, w: 52, h: 72 },
    });
    const st = stateFrom([upperTop, upperMid, upperBot, under]);
    expect(isFree(st, 'd00_2')).toBe(true);
    expect(isFree(st, 'c00_2')).toBe(false);
  });

  it('same-tier free top under another stack is not free', () => {
    const aTop = makeCard({
      id: 'd00_2',
      rank: '3',
      layer: 8,
      tier: 2,
      rect: { x: 100, y: 100, w: 52, h: 72 },
    });
    const aMid = makeCard({
      id: 'd00_1',
      rank: 'K',
      layer: 7,
      tier: 2,
      rect: { x: 100, y: 91, w: 52, h: 72 },
    });
    const aBot = makeCard({
      id: 'd00_0',
      rank: 'A',
      layer: 6,
      tier: 2,
      rect: { x: 100, y: 82, w: 52, h: 72 },
    });
    const bTop = makeCard({
      id: 'd01_2',
      rank: '9',
      layer: 8,
      tier: 2,
      rect: { x: 110, y: 115, w: 52, h: 72 },
    });
    const st = stateFrom([aTop, aMid, aBot, bTop]);
    expect(isFree(st, 'd01_2')).toBe(false);
  });

  it('same-tier free tops with no center-in-footprint can both be free', () => {
    const a = makeCard({
      id: 'd00_2',
      rank: '7',
      layer: 8,
      tier: 2,
      rect: { x: 100, y: 100, w: 52, h: 72 },
    });
    const b = makeCard({
      id: 'd01_2',
      rank: '8',
      layer: 8,
      tier: 2,
      rect: { x: 170, y: 100, w: 52, h: 72 },
    });
    const st = stateFrom([a, b]);
    expect(isFree(st, 'd00_2')).toBe(true);
    expect(isFree(st, 'd01_2')).toBe(true);
  });

  it('after upper group fully removed, under card can free', () => {
    const under = makeCard({
      id: 'c00_2',
      rank: '9',
      layer: 5,
      tier: 1,
      rect: { x: 100, y: 100, w: 52, h: 72 },
    });
    const st = stateFrom([under]);
    expect(isFree(st, 'c00_2')).toBe(true);
  });

  it('any pixel overlap from higher group blocks', () => {
    const upperMid = makeCard({
      id: 'd10_1',
      rank: '3',
      layer: 7,
      tier: 2,
      rect: { x: 100, y: 100, w: 52, h: 72 },
    });
    const lower = makeCard({
      id: 'c20_2',
      rank: '9',
      layer: 5,
      tier: 1,
      rect: { x: 140, y: 160, w: 52, h: 72 },
    });
    const st = stateFrom([upperMid, lower]);
    expect(isFree(st, 'd10_1')).toBe(true);
    expect(isFree(st, 'c20_2')).toBe(false);
  });
});

describe('level-01 fixed full geometry free', () => {
  it('open board: exactly 6 L2 tops free', () => {
    const state = createStateFromLevel(buildLevel01(LEVEL01_TEST_SEED));
    const free = freeCardIds(state).filter(
      (id) => state.cards[id]?.zone === 'puzzle',
    );
    expect(free.sort()).toEqual(
      ['d00_1', 'd01_1', 'd02_1', 'd10_1', 'd11_1', 'd12_1'].sort(),
    );
  });

  it('after all L2 tops removed, L2 bottoms free', () => {
    const state = createStateFromLevel(buildLevel01(LEVEL01_TEST_SEED));
    for (const c of Object.values(state.cards)) {
      if (c.id.startsWith('d') && c.id.endsWith('_1')) c.alive = false;
    }
    const free = freeCardIds(state).filter(
      (id) => state.cards[id]?.zone === 'puzzle',
    );
    // 至少 6 个 L2 底应 free；边缘 L1 可能仍被压
    for (const id of [
      'd00_0',
      'd01_0',
      'd02_0',
      'd10_0',
      'd11_0',
      'd12_0',
    ]) {
      expect(free).toContain(id);
    }
  });
});
