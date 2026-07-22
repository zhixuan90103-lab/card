import type { Rect } from './types';

export function aabbContains(rect: Rect, x: number, y: number): boolean {
  return (
    x >= rect.x &&
    x <= rect.x + rect.w &&
    y >= rect.y &&
    y <= rect.y + rect.h
  );
}

export function intersectArea(a: Rect, b: Rect): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const w = x2 - x1;
  const h = y2 - y1;
  if (w <= 0 || h <= 0) return 0;
  return w * h;
}

export function rectArea(r: Rect): number {
  return r.w * r.h;
}

export function rectCenter(r: Rect): { x: number; y: number } {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

/** Axis-aligned union of rects (group footprint). */
export function unionRects(rects: Rect[]): Rect | null {
  if (rects.length === 0) return null;
  let x1 = rects[0]!.x;
  let y1 = rects[0]!.y;
  let x2 = rects[0]!.x + rects[0]!.w;
  let y2 = rects[0]!.y + rects[0]!.h;
  for (let i = 1; i < rects.length; i++) {
    const r = rects[i]!;
    x1 = Math.min(x1, r.x);
    y1 = Math.min(y1, r.y);
    x2 = Math.max(x2, r.x + r.w);
    y2 = Math.max(y2, r.y + r.h);
  }
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

/**
 * Any non-trivial axis-aligned overlap (pixel area ≥ minArea).
 * Used for free/cover: **any visual cover blocks**.
 */
export function rectsOverlap(a: Rect, b: Rect, minArea = 1): boolean {
  return intersectArea(a, b) >= minArea;
}

/**
 * Does footprint F block card rect C?
 * - C's center inside F, or
 * - overlap area > threshold × min(area)
 *
 * Prefer `rectsOverlap` for gameplay free checks (covered ⇒ not free).
 * This ratio helper remains for soft geometry tests / isCovering.
 */
export function footprintBlocks(
  foot: Rect,
  card: Rect,
  threshold = 0.08,
): boolean {
  const c = rectCenter(card);
  if (aabbContains(foot, c.x, c.y)) return true;
  const area = intersectArea(foot, card);
  if (area <= 0) return false;
  return area > threshold * Math.min(rectArea(foot), rectArea(card));
}

export type Coverable = {
  layer: number;
  tier?: number;
  rect: Rect;
};

/**
 * Pairwise card cover (used for tests / simple cases).
 * Prefer groupFootprintBlocks for gameplay free checks.
 */
export function isCovering(
  a: Coverable,
  b: Coverable,
  threshold = 0.12,
): boolean {
  const ta = a.tier ?? 0;
  const tb = b.tier ?? 0;
  if (ta !== tb) {
    if (ta < tb) return false;
  } else if (a.layer <= b.layer) {
    return false;
  }
  return footprintBlocks(a.rect, b.rect, ta > tb ? 0.06 : threshold);
}
