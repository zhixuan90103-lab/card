/** Design resolution (D16): iPhone 15 CSS logical pixels */
export const DESIGN_WIDTH = 393;
export const DESIGN_HEIGHT = 852;

/** Cap devicePixelRatio to avoid 4K overdraw */
export const MAX_DPR = 2;

export type Vec2 = { x: number; y: number };

/**
 * Map browser client coordinates into design space (393×852).
 * Uses the phone-frame DOMRect so letterbox black bars stay outside hit-test.
 */
export function screenToDesign(
  clientX: number,
  clientY: number,
  frame: DOMRect,
): Vec2 {
  const x = ((clientX - frame.left) / frame.width) * DESIGN_WIDTH;
  const y = ((clientY - frame.top) / frame.height) * DESIGN_HEIGHT;
  return { x, y };
}

export function getDpr(): number {
  return Math.min(window.devicePixelRatio || 1, MAX_DPR);
}
