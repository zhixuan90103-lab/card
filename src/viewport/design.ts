/** Design resolution (D16): iPhone 15 CSS logical pixels */
export const DESIGN_WIDTH = 393;
export const DESIGN_HEIGHT = 852;

/**
 * Cap devicePixelRatio.
 * 3 ≈ iPhone retina；过高(4K 桌面)才截断。锯齿敏感：牌圆角/描边需足够缓冲像素。
 */
export const MAX_DPR = 3;

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
