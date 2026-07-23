import { CARD_H, CARD_W, STOCK_STACK_MAX_VISIBLE } from './layout';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '../viewport/design';

/**
 * Live draw-zone layout (tray + stock/waste).
 *
 * - **x = 0** → tray and piles **horizontally centered**
 * - **y** → tray top; cards vertically centered in tray
 * - **gapStockWaste** → 抽牌区与抽出叠水平间距
 * - **stockPeek** → 库叠每张向左漏边像素（正数）
 */

export type DrawZoneParams = {
  /** Horizontal offset from center (0 = 居中) */
  x: number;
  /** Tray top Y (design) */
  y: number;
  w: number;
  h: number;
  radius: number;
  /** Gap between stock front and waste (px) */
  gapStockWaste: number;
  /** Per-card left peek in stock stack (px, positive = left) */
  stockPeek: number;
  /** Stock count label offset from (stock.x, stock.y + stock.h) */
  stockLabelDx: number;
  stockLabelDy: number;
  /** Stock count font size (px) */
  stockLabelFontSize: number;
};

/**
 * Tuned defaults from panel 2026-07-23:
 * x=0 · y=600 · w=325 · h=150 · r=15 · gap=50 · peek=8
 * label dx=-53 · dy=12 · font=15
 */
function computeDefault(): DrawZoneParams {
  return {
    x: 0,
    y: 600,
    w: 325,
    h: 150,
    radius: 15,
    gapStockWaste: 50,
    stockPeek: 8,
    stockLabelDx: -53,
    stockLabelDy: 12,
    stockLabelFontSize: 15,
  };
}

let params: DrawZoneParams = computeDefault();

type Listener = () => void;
const listeners = new Set<Listener>();

export function onDrawZoneChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(): void {
  for (const fn of listeners) fn();
}

export function defaultDrawZoneParams(): DrawZoneParams {
  return computeDefault();
}

export function getDrawZoneParams(): DrawZoneParams {
  return { ...params };
}

export function setDrawZoneParams(partial: Partial<DrawZoneParams>): void {
  params = {
    ...params,
    ...partial,
  };
  params.x = Math.round(params.x);
  params.y = Math.round(params.y);
  params.w = Math.max(40, Math.round(params.w));
  params.h = Math.max(40, Math.round(params.h));
  params.radius = Math.max(0, Math.round(params.radius));
  params.gapStockWaste = Math.max(0, Math.round(params.gapStockWaste));
  params.stockPeek = Math.max(0, Math.round(params.stockPeek));
  params.stockLabelDx = Math.round(params.stockLabelDx);
  params.stockLabelDy = Math.round(params.stockLabelDy);
  params.stockLabelFontSize = Math.max(
    10,
    Math.min(28, Math.round(params.stockLabelFontSize)),
  );
  emit();
}

export function resetDrawZoneParams(): void {
  params = computeDefault();
  emit();
}

function pilePairW(): number {
  return CARD_W * 2 + params.gapStockWaste;
}

/** Absolute tray rect (x = center-offset). */
export function getTrayRect(): {
  x: number;
  y: number;
  w: number;
  h: number;
  radius: number;
} {
  const { x: xOff, y, w, h, radius } = params;
  const x = Math.round((DESIGN_WIDTH - w) / 2 + xOff);
  return { x, y, w, h, radius };
}

/** Stock front card rect. */
export function getStockRect(): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  const tray = getTrayRect();
  const pairLeft = tray.x + (tray.w - pilePairW()) / 2;
  const stockX = Math.round(pairLeft);
  const cardY = Math.round(tray.y + (tray.h - CARD_H) / 2);
  return { x: stockX, y: cardY, w: CARD_W, h: CARD_H };
}

/** Waste top card rect. */
export function getWasteRect(): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  const stock = getStockRect();
  return {
    x: stock.x + CARD_W + params.gapStockWaste,
    y: stock.y,
    w: CARD_W,
    h: CARD_H,
  };
}

/**
 * Offset for stock[index] from front (0).
 * Deeper cards peek left by stockPeek each.
 */
export function stockStackOffset(indexFromTop: number): {
  x: number;
  y: number;
} {
  const d = Math.min(indexFromTop, STOCK_STACK_MAX_VISIBLE - 1);
  return {
    x: -d * params.stockPeek,
    y: 0,
  };
}

/** Stock stack dx for hit-test (negative). */
export function getStockStackDx(): number {
  return -params.stockPeek;
}

export const DRAW_ZONE_LIMITS = {
  x: { min: -120, max: 120 },
  y: { min: 0, max: DESIGN_HEIGHT - 40 },
  w: { min: 80, max: DESIGN_WIDTH + 40 },
  h: { min: 50, max: 220 },
  radius: { min: 0, max: 80 },
  gapStockWaste: { min: 0, max: 120 },
  stockPeek: { min: 0, max: 24 },
  stockLabelDx: { min: -80, max: 80 },
  stockLabelDy: { min: -40, max: 60 },
  stockLabelFontSize: { min: 10, max: 28 },
} as const;
