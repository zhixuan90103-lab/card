/**
 * Live card drop-shadow params (full card silhouette).
 * - offsetX / offsetY: shift relative to card top-left (design px)
 * - scale: 1 = same size as card; >1 larger, <1 smaller
 * - alpha: 0–1 fill opacity
 */

export type CardShadowParams = {
  offsetX: number;
  offsetY: number;
  scale: number;
  alpha: number;
};

/** Tuned from panel: Y=-2 · scale=1.02 · alpha=0.15 */
function computeDefault(): CardShadowParams {
  return {
    offsetX: 0,
    offsetY: -2,
    scale: 1.02,
    alpha: 0.15,
  };
}

let params: CardShadowParams = computeDefault();

type Listener = () => void;
const listeners = new Set<Listener>();

export function onCardShadowChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(): void {
  for (const fn of listeners) fn();
}

export function defaultCardShadowParams(): CardShadowParams {
  return computeDefault();
}

export function getCardShadowParams(): CardShadowParams {
  return { ...params };
}

export function setCardShadowParams(partial: Partial<CardShadowParams>): void {
  params = { ...params, ...partial };
  params.offsetX = Math.round(params.offsetX * 10) / 10;
  params.offsetY = Math.round(params.offsetY * 10) / 10;
  params.scale = Math.max(0.5, Math.min(1.5, Math.round(params.scale * 100) / 100));
  params.alpha = Math.max(0, Math.min(1, Math.round(params.alpha * 100) / 100));
  emit();
}

export function resetCardShadowParams(): void {
  params = computeDefault();
  emit();
}

export const CARD_SHADOW_LIMITS = {
  offsetX: { min: -20, max: 20, step: 0.5 },
  offsetY: { min: -30, max: 30, step: 0.5 },
  scale: { min: 0.7, max: 1.3, step: 0.01 },
  alpha: { min: 0, max: 0.5, step: 0.01 },
} as const;
