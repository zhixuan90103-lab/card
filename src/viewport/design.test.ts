import { describe, expect, it } from 'vitest';
import { DESIGN_HEIGHT, DESIGN_WIDTH, screenToDesign } from './design';

describe('screenToDesign', () => {
  it('maps frame corners to design bounds', () => {
    const frame = {
      left: 100,
      top: 50,
      width: 393,
      height: 852,
      right: 493,
      bottom: 902,
      x: 100,
      y: 50,
      toJSON: () => ({}),
    } as DOMRect;

    const tl = screenToDesign(100, 50, frame);
    expect(tl.x).toBeCloseTo(0, 5);
    expect(tl.y).toBeCloseTo(0, 5);

    const br = screenToDesign(100 + 393, 50 + 852, frame);
    expect(br.x).toBeCloseTo(DESIGN_WIDTH, 5);
    expect(br.y).toBeCloseTo(DESIGN_HEIGHT, 5);

    const mid = screenToDesign(100 + 393 / 2, 50 + 852 / 2, frame);
    expect(mid.x).toBeCloseTo(DESIGN_WIDTH / 2, 5);
    expect(mid.y).toBeCloseTo(DESIGN_HEIGHT / 2, 5);
  });
});
