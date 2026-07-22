import { describe, expect, it } from 'vitest';
import { LEVELS, assertEvenRanks } from './levels';
import { LEVEL01_LAYOUT } from './level01';

describe('level catalog', () => {
  it('level-01 only: bottom + cover layer', () => {
    expect(LEVELS.length).toBe(1);
    expect(LEVELS[0]!.id).toBe('level-01');
    expect(LEVELS[0]!.cards.length).toBe(LEVEL01_LAYOUT.totalCards);
    assertEvenRanks(LEVELS[0]!);
  });
});
