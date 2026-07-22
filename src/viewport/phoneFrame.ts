import { DESIGN_HEIGHT, DESIGN_WIDTH, getDpr } from './design';

export type FrameLayout = {
  frameEl: HTMLElement;
  canvasHost: HTMLElement;
  /** CSS pixel size of the frame (after letterbox contain) */
  cssWidth: number;
  cssHeight: number;
  dpr: number;
};

export function getPhoneFrameEl(): HTMLElement {
  const el = document.getElementById('phone-frame');
  if (!el) throw new Error('#phone-frame missing');
  return el;
}

export function getCanvasHost(): HTMLElement {
  const el = document.getElementById('game-canvas');
  if (!el) throw new Error('#game-canvas missing');
  return el;
}

export function measureFrame(): FrameLayout {
  const frameEl = getPhoneFrameEl();
  const canvasHost = getCanvasHost();
  const rect = frameEl.getBoundingClientRect();
  return {
    frameEl,
    canvasHost,
    cssWidth: rect.width,
    cssHeight: rect.height,
    dpr: getDpr(),
  };
}

/** True if design point is inside the 393×852 board */
export function inDesignBounds(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x <= DESIGN_WIDTH && y <= DESIGN_HEIGHT;
}
