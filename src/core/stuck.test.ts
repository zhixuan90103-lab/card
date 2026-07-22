import { describe, expect, it } from 'vitest';
import { createStateFromLevel } from './state';
import { isHardDead, isSoftStuck } from './stuck';
import type { Level } from './types';

const simple: Level = {
  id: 's',
  cards: [
    { id: 'a1', rank: 'A', layer: 0, x: 0, y: 0, w: 40, h: 40 },
    { id: 'k1', rank: 'K', layer: 0, x: 50, y: 0, w: 40, h: 40 },
  ],
  stock: [
    { id: 's1', rank: 'A' },
    { id: 's2', rank: 'Q' },
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
        { id: 'a1', rank: 'A', layer: 0, x: 0, y: 0, w: 40, h: 40 },
        { id: 'k1', rank: 'K', layer: 0, x: 50, y: 0, w: 40, h: 40 },
      ],
      stock: [{ id: 's1', rank: 'Q' }, { id: 's2', rank: 'Q' }],
    };
    const st = createStateFromLevel(level);
    expect(isHardDead(st)).toBe(true);
  });

  it('not stuck when immediate pair', () => {
    const level: Level = {
      id: 'pair',
      cards: [
        { id: 'a1', rank: 'A', layer: 0, x: 0, y: 0, w: 40, h: 40 },
        { id: 'a2', rank: 'A', layer: 0, x: 50, y: 0, w: 40, h: 40 },
      ],
      stock: [],
    };
    expect(isSoftStuck(createStateFromLevel(level))).toBe(false);
    expect(isHardDead(createStateFromLevel(level))).toBe(false);
  });
});
