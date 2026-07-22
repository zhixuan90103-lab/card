import { describe, expect, it } from 'vitest';
import {
  buildLevel01,
  buildLevel01WithMeta,
  LEVEL01_LAYOUT,
  LEVEL01_TEST_SEED,
} from '../data/level01';
import { createStateFromLevel } from './state';
import { freeCardIds, isFree } from './rules';
import { canFullyClear } from '../data/levelSolve';

describe('level-01 main scheme: fixed full slots, random puzzle', () => {
  const level = buildLevel01(LEVEL01_TEST_SEED);

  it('always full 108 puzzle cards (no empty slots)', () => {
    expect(level.cards.length).toBe(LEVEL01_LAYOUT.totalCards);
    expect(LEVEL01_LAYOUT.totalCards).toBe(108);
  });

  it('same geometry ids for every seed', () => {
    const a = buildLevel01(11);
    const b = buildLevel01(99);
    expect(a.cards.map((c) => c.id).sort().join()).toBe(
      b.cards.map((c) => c.id).sort().join(),
    );
    expect(a.cards.map((c) => `${c.id}@${c.x},${c.y}`).sort().join()).toBe(
      b.cards.map((c) => `${c.id}@${c.x},${c.y}`).sort().join(),
    );
  }, 20000);

  it('different seeds change ranks', () => {
    const a = buildLevel01(11);
    const b = buildLevel01(99);
    expect(a.cards.map((c) => c.rank).join()).not.toBe(
      b.cards.map((c) => c.rank).join(),
    );
  }, 20000);

  it('stock is lean: parity + few access pairs, no pad-to-16 filler', () => {
    for (const s of [1, 2, 7, 11, 42, LEVEL01_TEST_SEED]) {
      const lv = buildLevel01(s);
      // 旧版固定灌到 16+；精简后应明显更短
      expect(lv.stock.length, `seed ${s}`).toBeLessThanOrEqual(14);
      expect(lv.stock.length, `seed ${s}`).toBeGreaterThanOrEqual(2);
    }
  }, 30000);

  it('opening: exactly one free pair on puzzle', () => {
    const st = createStateFromLevel(level);
    const free = freeCardIds(st).filter((id) => st.cards[id]!.zone === 'puzzle');
    // 6 L2 tops
    expect(free.length).toBe(6);
    expect(free.every((id) => id.match(/^d\d+_1$/))).toBe(true);
    const counts = new Map<string, number>();
    for (const id of free) {
      const r = st.cards[id]!.rank;
      counts.set(r, (counts.get(r) ?? 0) + 1);
    }
    const pairs = [...counts.values()].filter((n) => n >= 2);
    expect(pairs.length).toBe(1);
    expect(pairs[0]).toBe(2);
  });

  it('locks are L1 tops; not free at open', () => {
    const { meta } = buildLevel01WithMeta(LEVEL01_TEST_SEED);
    const st = createStateFromLevel(buildLevel01(LEVEL01_TEST_SEED));
    for (const id of meta.lockIds) {
      expect(id.startsWith('c')).toBe(true);
      expect(isFree(st, id)).toBe(false);
    }
  });

  it('R1 even ranks', () => {
    const counts = new Map<string, number>();
    for (const c of level.cards) counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1);
    for (const s of level.stock) counts.set(s.rank, (counts.get(s.rank) ?? 0) + 1);
    for (const [r, n] of counts) expect(n % 2, r).toBe(0);
  });

  it('R2 within groups', () => {
    const by = new Map<string, string[]>();
    for (const c of level.cards) {
      const k = c.id.replace(/_\d+$/, '');
      if (!by.has(k)) by.set(k, []);
      by.get(k)!.push(c.rank);
    }
    for (const [k, ranks] of by) {
      expect(new Set(ranks).size, k).toBe(ranks.length);
    }
  });

  it('some seed fully clears', () => {
    let any = false;
    for (const s of [1, 2, 3, 7, 11, 42, LEVEL01_TEST_SEED]) {
      if (canFullyClear(buildLevel01(s), s)) {
        any = true;
        break;
      }
    }
    expect(any).toBe(true);
  }, 30000);

  it('no parallel peels: same tops must not share same next card', () => {
    for (const seed of [LEVEL01_TEST_SEED, 1, 2, 3, 7, 11, 42, 100, 999]) {
      const level = buildLevel01(seed);
      const by = new Map<string, typeof level.cards>();
      for (const c of level.cards) {
        const k = c.id.replace(/_\d+$/, '');
        if (!by.has(k)) by.set(k, []);
        by.get(k)!.push(c);
      }
      const stacks: Array<{ top: string; next: string | null; key: string }> =
        [];
      for (const [key, mem] of by) {
        mem.sort((a, b) => a.layer - b.layer);
        const top = mem[mem.length - 1]!;
        const next = mem.length >= 2 ? mem[mem.length - 2]! : null;
        stacks.push({
          key,
          top: top.rank,
          next: next?.rank ?? null,
        });
      }
      for (let i = 0; i < stacks.length; i++) {
        for (let j = i + 1; j < stacks.length; j++) {
          const a = stacks[i]!;
          const b = stacks[j]!;
          if (a.top !== b.top) continue;
          if (a.next != null && b.next != null) {
            expect(
              a.next,
              `seed=${seed} ${a.key}||${b.key} top=${a.top}`,
            ).not.toBe(b.next);
          }
        }
      }
    }
  }, 40000);
});
