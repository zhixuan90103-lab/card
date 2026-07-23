/** Design resolution (D16): iPhone 15 CSS logical pixels — layout / hit-test */
export const DESIGN_WIDTH = 393;
export const DESIGN_HEIGHT = 852;

/**
 * FX bleed around design so match exit / drag / flip aren't clipped by
 * the GPU canvas edge (WebGPU-first / WebGL fallback). Layout & pickCard stay in 0..DESIGN_*.
 * World is offset by (FX_PAD_X, FX_PAD_Y) inside a larger renderer buffer.
 */
export const FX_PAD_X = 96;
export const FX_PAD_Y = 220;

export const BUFFER_WIDTH = DESIGN_WIDTH + FX_PAD_X * 2;
export const BUFFER_HEIGHT = DESIGN_HEIGHT + FX_PAD_Y * 2;

/**
 * Cap devicePixelRatio.
 * 3 ≈ iPhone retina；过高(4K 桌面)才截断。
 */
export const MAX_DPR = 3;

export type Vec2 = { x: number; y: number };

/**
 * Map browser client coordinates into design space (393×852).
 * Uses the phone-frame DOMRect (layout box, not FX bleed).
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
