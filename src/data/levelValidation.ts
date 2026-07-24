import type { Level } from '../core/types';
import { probeGreedyProgress } from './levelSolve';
import type { DealDifficulty } from './level01Deal';

export type DealValidationReport = {
  attempts: number;
  failures: number;
  clearRate: number;
  minMatchesBeforeFirstStall: number;
  avgMatchesBeforeFirstStall: number;
  minPuzzleAtFirstStall: number;
  maxPuzzleAtFirstStall: number;
  passed: boolean;
  reasons: string[];
};

export type DealValidationOptions = {
  attempts?: number;
  minOpeningStreak?: number;
  requireClear?: boolean;
};

function defaultOpeningStreak(diff: DealDifficulty): number {
  if (diff === 'easy') return 5;
  if (diff === 'hard') return 3;
  return 2;
}

function allowedFailures(diff: DealDifficulty): { lo: number; hi: number } {
  if (diff === 'easy') return { lo: 0, hi: 0 };
  if (diff === 'hard') return { lo: 0, hi: 2 };
  return { lo: 0, hi: 5 };
}

/**
 * Generator-side validator.
 *
 * This intentionally does not model Joker help. Easy deals must stand on their
 * own so jokers feel like rewards/juice instead of the only route out.
 */
export function validateGeneratedDeal(
  level: Level,
  seed: number,
  difficulty: DealDifficulty,
  opts: DealValidationOptions = {},
): DealValidationReport {
  const attempts = opts.attempts ?? 10;
  const minOpeningStreak =
    opts.minOpeningStreak ?? defaultOpeningStreak(difficulty);
  const requireClear = opts.requireClear ?? true;
  const allowed = allowedFailures(difficulty);
  const reasons: string[] = [];

  let failures = 0;
  let totalStallMatches = 0;
  let minMatchesBeforeFirstStall = Number.POSITIVE_INFINITY;
  let minPuzzleAtFirstStall = Number.POSITIVE_INFINITY;
  let maxPuzzleAtFirstStall = 0;

  for (let i = 0; i < attempts; i++) {
    const probe = probeGreedyProgress(level, (seed + 1 + i * 7919) >>> 0);
    if (!probe.clearable) failures += 1;
    totalStallMatches += probe.matchesBeforeFirstStall;
    minMatchesBeforeFirstStall = Math.min(
      minMatchesBeforeFirstStall,
      probe.matchesBeforeFirstStall,
    );
    minPuzzleAtFirstStall = Math.min(
      minPuzzleAtFirstStall,
      probe.puzzleAtFirstStall,
    );
    maxPuzzleAtFirstStall = Math.max(
      maxPuzzleAtFirstStall,
      probe.puzzleAtFirstStall,
    );
  }

  if (minMatchesBeforeFirstStall === Number.POSITIVE_INFINITY) {
    minMatchesBeforeFirstStall = 0;
  }
  if (minPuzzleAtFirstStall === Number.POSITIVE_INFINITY) {
    minPuzzleAtFirstStall = 0;
  }

  if (requireClear && (failures < allowed.lo || failures > allowed.hi)) {
    reasons.push(`failures=${failures} outside ${allowed.lo}..${allowed.hi}`);
  }
  if (minMatchesBeforeFirstStall < minOpeningStreak) {
    reasons.push(
      `openingStreak=${minMatchesBeforeFirstStall} < ${minOpeningStreak}`,
    );
  }

  // Easy should not stall while the board is still almost intact.
  if (difficulty === 'easy' && maxPuzzleAtFirstStall > 96) {
    reasons.push(`easy stalls too early with ${maxPuzzleAtFirstStall} puzzle cards`);
  }

  return {
    attempts,
    failures,
    clearRate: attempts === 0 ? 0 : (attempts - failures) / attempts,
    minMatchesBeforeFirstStall,
    avgMatchesBeforeFirstStall:
      attempts === 0 ? 0 : totalStallMatches / attempts,
    minPuzzleAtFirstStall,
    maxPuzzleAtFirstStall,
    passed: reasons.length === 0,
    reasons,
  };
}

export function scoreValidatedDeal(report: DealValidationReport): number {
  return (
    report.clearRate * 100 +
    report.minMatchesBeforeFirstStall * 8 -
    report.maxPuzzleAtFirstStall * 0.05
  );
}
