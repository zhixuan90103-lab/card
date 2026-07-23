/**
 * Live puzzle-board layout (origin of the 5×4 group grid).
 * Tuned from trayTuner; shifts card.rect for current deal on change.
 *
 * - **originY** → 谜题区顶边（组顶 row0），默认 190（调参定稿）
 * - **originX** → 相对居中网格的水平偏移（0 = 保持 layout 居中）
 */

export type PuzzleLayoutParams = {
  /** Top of puzzle grid (design Y) */
  originY: number;
  /** Horizontal offset from centered GRID_ORIGIN_X */
  originX: number;
};

/** Defaults from trayTuner 2026-07-23: Y=190 · X=0 */
function computeDefault(): PuzzleLayoutParams {
  return {
    originY: 190,
    originX: 0,
  };
}

let params: PuzzleLayoutParams = computeDefault();

type Listener = () => void;
const listeners = new Set<Listener>();

export function onPuzzleLayoutChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(): void {
  for (const fn of listeners) fn();
}

export function defaultPuzzleLayoutParams(): PuzzleLayoutParams {
  return computeDefault();
}

export function getPuzzleLayoutParams(): PuzzleLayoutParams {
  return { ...params };
}

export function setPuzzleLayoutParams(
  partial: Partial<PuzzleLayoutParams>,
): void {
  const prev = { ...params };
  params = { ...params, ...partial };
  params.originY = Math.round(params.originY);
  params.originX = Math.round(params.originX);
  // Clamp to stay on 393×852 board with margin for 4-row grid
  params.originY = Math.max(40, Math.min(420, params.originY));
  params.originX = Math.max(-60, Math.min(60, params.originX));
  if (params.originY !== prev.originY || params.originX !== prev.originX) {
    emit();
  }
}

export function resetPuzzleLayoutParams(): void {
  params = computeDefault();
  emit();
}

export const PUZZLE_LAYOUT_LIMITS = {
  originY: { min: 40, max: 420, step: 1 },
  originX: { min: -60, max: 60, step: 1 },
} as const;
