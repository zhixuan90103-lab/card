import { describe, expect, it } from 'vitest';
import {
  LEVELS,
  CONTENT_MODE,
  assertEvenRanks,
  difficultyForRun,
  formatRunTitle,
  startNewRun,
  replayRun,
  nextLevel,
} from './levels';
import { LEVEL01_LAYOUT } from './level01';

describe('level catalog — single infinite', () => {
  it('content mode is single-infinite (not multi-level campaign)', () => {
    expect(CONTENT_MODE).toBe('single-infinite');
    expect(LEVELS.length).toBe(1);
    expect(nextLevel('level-01')).toBeUndefined();
  });

  it('every 3rd run is extreme', () => {
    expect(difficultyForRun(1)).toBe('hard');
    expect(difficultyForRun(2)).toBe('hard');
    expect(difficultyForRun(3)).toBe('extreme');
    expect(difficultyForRun(6)).toBe('extreme');
    expect(difficultyForRun(7)).toBe('hard');
  });

  it('extreme deals max locks', () => {
    const { meta } = startNewRun(42, 'extreme');
    expect(meta.difficulty).toBe('extreme');
    expect(meta.lockCount).toBe(3);
  }, 20000);

  it('template snapshot has full board + even ranks', () => {
    expect(LEVELS[0]!.id).toBe('level-01');
    expect(LEVELS[0]!.cards.length).toBe(LEVEL01_LAYOUT.totalCards);
    assertEvenRanks(LEVELS[0]!);
  });

  it('startNewRun and replayRun share geometry; different seeds differ ranks', () => {
    const a = startNewRun(11, 'hard');
    const b = startNewRun(99, 'hard');
    expect(a.level.cards.map((c) => c.id).sort().join()).toBe(
      b.level.cards.map((c) => c.id).sort().join(),
    );
    expect(a.meta.seed).not.toBe(b.meta.seed);
    const again = replayRun(a.meta.seed, a.meta.difficulty);
    expect(again.meta.seed).toBe(a.meta.seed);
    expect(again.level.cards.map((c) => c.rank).join()).toBe(
      a.level.cards.map((c) => c.rank).join(),
    );
  }, 20000);

  it('formatRunTitle includes difficulty and seed', () => {
    const { meta } = startNewRun(1, 'extreme');
    const t = formatRunTitle(meta, 3);
    expect(t).toContain('第 3 局');
    expect(t).toContain('极难');
    expect(t).toContain(`#${meta.seed}`);
  }, 15000);
});
