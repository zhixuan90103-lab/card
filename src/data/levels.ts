import type { Level, Rank } from '../core/types';
import { buildLevel01, LEVEL01_TEST_SEED } from './level01';

/**
 * Catalog — Level 01 模板；实际对局用 buildLevel01(seed) 重开换点。
 * 列表里放一关固定 seed 供测试/默认入口。
 */
export const LEVELS: Level[] = [buildLevel01(LEVEL01_TEST_SEED)];

export function getLevelIndex(id: string): number {
  return LEVELS.findIndex((l) => l.id === id);
}

export function getLevelById(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function nextLevel(id: string): Level | undefined {
  const i = getLevelIndex(id);
  if (i < 0 || i >= LEVELS.length - 1) return undefined;
  return LEVELS[i + 1];
}

export function assertEvenRanks(level: Level): void {
  const m = new Map<Rank, number>();
  for (const c of level.cards) m.set(c.rank, (m.get(c.rank) ?? 0) + 1);
  for (const s of level.stock) m.set(s.rank, (m.get(s.rank) ?? 0) + 1);
  for (const [r, n] of m) {
    if (n % 2 !== 0) throw new Error(`${level.id} rank ${r} count ${n} odd`);
  }
}

/** 新开一局（随机 seed） */
export function dealNewLevel01(): Level {
  return buildLevel01();
}
