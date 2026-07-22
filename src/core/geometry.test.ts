import { describe, expect, it } from 'vitest';
import {
  aabbContains,
  footprintBlocks,
  intersectArea,
  isCovering,
  rectsOverlap,
  unionRects,
} from './geometry';

describe('geometry', () => {
  it('aabbContains includes edges', () => {
    const r = { x: 10, y: 20, w: 30, h: 40 };
    expect(aabbContains(r, 10, 20)).toBe(true);
    expect(aabbContains(r, 40, 60)).toBe(true);
    expect(aabbContains(r, 9, 20)).toBe(false);
  });

  it('intersectArea of overlapping rects', () => {
    const a = { x: 0, y: 0, w: 100, h: 100 };
    const b = { x: 50, y: 50, w: 100, h: 100 };
    expect(intersectArea(a, b)).toBe(50 * 50);
  });

  it('unionRects builds footprint', () => {
    const u = unionRects([
      { x: 0, y: 0, w: 50, h: 50 },
      { x: 10, y: 40, w: 50, h: 50 },
    ])!;
    expect(u.x).toBe(0);
    expect(u.y).toBe(0);
    expect(u.w).toBe(60);
    expect(u.h).toBe(90);
  });

  it('footprintBlocks by center', () => {
    const foot = { x: 0, y: 0, w: 100, h: 100 };
    const under = { x: 30, y: 30, w: 40, h: 40 };
    expect(footprintBlocks(foot, under)).toBe(true);
    const outside = { x: 200, y: 200, w: 40, h: 40 };
    expect(footprintBlocks(foot, outside)).toBe(false);
  });

  it('rectsOverlap is true for any positive area', () => {
    const a = { x: 0, y: 0, w: 52, h: 72 };
    const corner = { x: 50, y: 70, w: 52, h: 72 };
    expect(rectsOverlap(a, corner)).toBe(true);
    const far = { x: 100, y: 100, w: 52, h: 72 };
    expect(rectsOverlap(a, far)).toBe(false);
  });

  it('isCovering higher tier / layer', () => {
    const bottom = { layer: 0, tier: 0, rect: { x: 0, y: 0, w: 100, h: 100 } };
    const top = { layer: 1, tier: 0, rect: { x: 10, y: 10, w: 100, h: 100 } };
    expect(isCovering(top, bottom)).toBe(true);
    expect(isCovering(bottom, top)).toBe(false);
  });
});
