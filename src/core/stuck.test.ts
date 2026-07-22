import { describe, expect, it } from 'vitest';
import { createStateFromLevel, GameSession } from './state';
import { isHardDead, isSoftStuck, deckCanSupplyPartner } from './stuck';
import type { Level } from './types';

const simple: Level = {
  id: 's',
  cards: [
    { id: 'a1', rank: 'A', suit: 'S', layer: 0, x: 0, y: 0, w: 40, h: 40 },
    { id: 'k1', rank: 'K', suit: 'S', layer: 0, x: 50, y: 0, w: 40, h: 40 },
  ],
  stock: [
    { id: 's1', rank: 'A', suit: 'S' },
    { id: 's2', rank: 'Q', suit: 'S' },
  ],
};

describe('stuck detection', () => {
  it('soft stuck when free needs deck match', () => {
    const st = createStateFromLevel(simple);
    // free A,K different; stock has A → soft
    expect(isSoftStuck(st)).toBe(true);
    expect(isHardDead(st)).toBe(false);
  });

  it('hard dead when deck cannot help', () => {
    const level: Level = {
      id: 'dead',
      cards: [
        { id: 'a1', rank: 'A', suit: 'S', layer: 0, x: 0, y: 0, w: 40, h: 40 },
        { id: 'k1', rank: 'K', suit: 'S', layer: 0, x: 50, y: 0, w: 40, h: 40 },
      ],
      stock: [
        { id: 's1', rank: 'Q', suit: 'H' },
        { id: 's2', rank: 'Q', suit: 'H' },
      ],
    };
    const st = createStateFromLevel(level);
    expect(isHardDead(st)).toBe(true);
    expect(isSoftStuck(st)).toBe(false);
  });

  it('not stuck when immediate pair (same rank+color)', () => {
    const level: Level = {
      id: 'pair',
      cards: [
        { id: 'a1', rank: 'A', suit: 'H', layer: 0, x: 0, y: 0, w: 40, h: 40 },
        { id: 'a2', rank: 'A', suit: 'H', layer: 0, x: 50, y: 0, w: 40, h: 40 },
      ],
      stock: [],
    };
    expect(isSoftStuck(createStateFromLevel(level))).toBe(false);
    expect(isHardDead(createStateFromLevel(level))).toBe(false);
  });

  it('hard dead when only waste/stock keys are self-counted (user bug)', () => {
    // 桌面 free：A♠ K♠（互不配）
    // 库：仅 5♠ + 10♠ — 抽出叠顶 5♠ 自己是 free，旧逻辑会把「自己在库里」当可救
    const level: Level = {
      id: 'waste-self',
      cards: [
        { id: 'a1', rank: 'A', suit: 'S', layer: 0, x: 0, y: 0, w: 40, h: 40 },
        { id: 'k1', rank: 'K', suit: 'S', layer: 0, x: 50, y: 0, w: 40, h: 40 },
      ],
      stock: [
        { id: 's5', rank: '5', suit: 'S' },
        { id: 's10', rank: '10', suit: 'S' },
      ],
    };
    const session = new GameSession(level);
    // 开局 auto-flip 一张到 waste
    const st0 = session.getState();
    expect(st0.waste.length).toBe(1);
    expect(isHardDead(st0)).toBe(true);
    expect(isSoftStuck(st0)).toBe(false);

    // 再抽一张，仍是无用黑点
    session.draw();
    const st1 = session.getState();
    expect(isHardDead(st1)).toBe(true);
    expect(isSoftStuck(st1)).toBe(false);
  });

  it('not hard dead when waste top matches a free puzzle card', () => {
    const level: Level = {
      id: 'waste-match',
      cards: [
        { id: 'a1', rank: 'A', suit: 'S', layer: 0, x: 0, y: 0, w: 40, h: 40 },
        { id: 'k1', rank: 'K', suit: 'S', layer: 0, x: 50, y: 0, w: 40, h: 40 },
      ],
      stock: [{ id: 'sA', rank: 'A', suit: 'S' }],
    };
    const session = new GameSession(level);
    // waste 顶 A♠ 与桌 A♠ 立即对
    const st = session.getState();
    expect(st.waste.length).toBe(1);
    expect(isHardDead(st)).toBe(false);
    expect(isSoftStuck(st)).toBe(false);
  });

  it('soft stuck when stock still holds partner for free (not waste self)', () => {
    const level: Level = {
      id: 'soft-stock',
      cards: [
        { id: 'a1', rank: 'A', suit: 'S', layer: 0, x: 0, y: 0, w: 40, h: 40 },
        { id: 'k1', rank: 'K', suit: 'S', layer: 0, x: 50, y: 0, w: 40, h: 40 },
      ],
      stock: [
        { id: 'sJunk', rank: '2', suit: 'H' },
        { id: 'sA', rank: 'A', suit: 'S' },
      ],
    };
    const session = new GameSession(level);
    // waste=2♥ 无用；stock 仍有 A♠ 可救桌面 A
    const st = session.getState();
    expect(isSoftStuck(st)).toBe(true);
    expect(isHardDead(st)).toBe(false);
    expect(deckCanSupplyPartner(st, 'A_black', 1)).toBe(true);
  });
});
