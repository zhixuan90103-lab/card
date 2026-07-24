/**
 * 内容策略（P1-B · 2026-07-22 定稿）：
 * **单关无限** — 只有 Level01 模板（固定几何），每局新 seed 换点数/锁/stock。
 * 难度：16 局循环 EEEH EEEH EEEH EEEX。
 */
import type { Level, Rank } from '../core/types';
import {
  buildLevel01,
  buildLevel01WithMeta,
  dealLevel01,
  difficultyForRun,
  LEVEL01_TEST_SEED,
  type DealDifficulty,
  type Level01DealMeta,
} from './level01';

export { difficultyForRun, type DealDifficulty };

/**
 * 目录仅 1 条：固定 seed 快照，供测试 / 默认对照。
 * 真人对局用 `startNewRun` / `replayRun`。
 */
export const LEVELS: Level[] = [buildLevel01(LEVEL01_TEST_SEED, 'hard')];

/** 内容模式：单关无限 seed（非多关推进） */
export const CONTENT_MODE = 'single-infinite' as const;

export function getLevelIndex(id: string): number {
  return LEVELS.findIndex((l) => l.id === id);
}

export function getLevelById(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

/** @deprecated 多关已取消；保留空实现避免旧调用炸掉 */
export function nextLevel(_id: string): Level | undefined {
  return undefined;
}

export function assertEvenRanks(level: Level): void {
  // D22：按 (rank, color) 偶数
  const m = new Map<string, number>();
  const bump = (rank: Rank, suit: string | undefined) => {
    const color = suit === 'H' ? 'red' : 'black';
    const k = `${rank}_${color}`;
    m.set(k, (m.get(k) ?? 0) + 1);
  };
  for (const c of level.cards) bump(c.rank, c.suit);
  for (const s of level.stock) bump(s.rank, s.suit);
  for (const [k, n] of m) {
    if (n % 2 !== 0) throw new Error(`${level.id} ${k} count ${n} odd`);
  }
}

export type RunDeal = {
  level: Level;
  meta: Level01DealMeta;
};

/** 新开一局（随机 seed + 难度档） */
export function startNewRun(
  seed?: number,
  difficulty: DealDifficulty = 'hard',
): RunDeal {
  return buildLevel01WithMeta(seed, difficulty);
}

/** 同一 seed 再打一局（重开）：强制单次 deal，保留难度 */
export function replayRun(
  seed: number,
  difficulty: DealDifficulty = 'hard',
): RunDeal {
  return dealLevel01(seed, 1, difficulty);
}

/** 从 level.insightNote 解析 meta（失败则 null） */
export function parseRunMeta(level: Level): Level01DealMeta | null {
  if (!level.insightNote) return null;
  try {
    const o = JSON.parse(level.insightNote) as Level01DealMeta;
    if (typeof o.seed === 'number') return o;
  } catch {
    /* ignore */
  }
  return null;
}

/** HUD 标题行：局号 · 难度 · 锁 · seed */
export function formatRunTitle(
  meta: Level01DealMeta | null,
  runIndex: number,
): string {
  if (!meta) return `第 ${runIndex} 局`;
  const diff =
    meta.difficulty === 'extreme'
      ? '极难'
      : meta.difficulty === 'hard'
        ? '困难'
        : '轻松';
  const lock =
    meta.lockCount === 0 ? '无锁' : `锁×${meta.lockCount}`;
  const parts = [`第 ${runIndex} 局`];
  if (diff) parts.push(diff);
  parts.push(lock, `#${meta.seed}`);
  return parts.join(' · ');
}

/** @deprecated 用 startNewRun */
export function dealNewLevel01(): Level {
  return buildLevel01();
}
