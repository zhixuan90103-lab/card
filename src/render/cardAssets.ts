import { Texture } from 'pixi.js';
import type { Rank, Suit } from '../core/types';
import { CARD_H, CARD_W } from '../data/layout';
import { isNativeApp } from '../native/haptics';

/**
 * Poker pack bake pipeline (perf / design 22):
 * - Cover-resize PNG → design card size × bake resolution
 * - **Round-rect clip baked into texture** → no per-card GPU mask at runtime
 * - Shared soft shadow texture (one upload, many Sprites)
 */

const RANKS: Rank[] = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
];

/** Design-space corner radius (matches CardRenderer rim). */
export const CARD_CORNER_RADIUS = 8;

export const CARD_BACK_KEY = 'card-back';
export const CARD_SHADOW_KEY = 'card-shadow';
export const CARD_JOKER_KEY = 'card-joker';

function filePrefix(suit: Suit): 'R' | 'B' {
  return suit === 'H' ? 'R' : 'B';
}

export function faceAssetKey(suit: Suit, rank: Rank): string {
  return `card-face-${suit}-${rank}`;
}

const ASSET_VER = String(Date.now());

function faceAssetUrl(suit: Suit, rank: Rank): string {
  return `/cards/${filePrefix(suit)}_${rank}.png?v=${ASSET_VER}`;
}

const BACK_URL = `/cards/Card_B.png?v=${ASSET_VER}`;
const JOKER_URL = `/cards/Joker.png?v=${ASSET_VER}`;

const textureCache = new Map<string, Texture>();
const imageCache = new Map<string, HTMLImageElement>();
let loaded = false;
let bakeResolution = 2;

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

function destroyGpuTextures(): void {
  for (const tex of textureCache.values()) {
    try {
      tex.destroy(true);
    } catch {
      /* already invalid after context loss */
    }
  }
  textureCache.clear();
  loaded = false;
}

function textureFromCanvas(
  canvas: HTMLCanvasElement,
  resolution: number,
): Texture {
  return Texture.from(
    {
      resource: canvas,
      resolution,
      scaleMode: 'linear' as const,
      autoGenerateMipmaps: false,
    },
    true,
  );
}

/**
 * Cover-fit image into designW×designH, clipped to rounded rect (pre-multiplied alpha).
 * Eliminates runtime `sprite.mask` batch breaks on WebGPU/WebGL.
 */
function bakeCardTexture(
  image: HTMLImageElement,
  designW: number,
  designH: number,
  resolution: number,
  cornerRadiusDesign: number,
): Texture {
  const pixelW = Math.max(1, Math.round(designW * resolution));
  const pixelH = Math.max(1, Math.round(designH * resolution));
  const rPx = Math.max(1, cornerRadiusDesign * resolution);

  const canvas = document.createElement('canvas');
  canvas.width = pixelW;
  canvas.height = pixelH;
  const ctx =
    canvas.getContext('2d', {
      alpha: true,
      colorSpace: 'srgb',
    } as CanvasRenderingContext2DSettings) ??
    canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    return Texture.from(image);
  }

  ctx.clearRect(0, 0, pixelW, pixelH);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Clip to card silhouette before drawing art
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(0, 0, pixelW, pixelH, rPx);
  } else {
    // Fallback path for older WebViews
    const r = Math.min(rPx, pixelW / 2, pixelH / 2);
    ctx.moveTo(r, 0);
    ctx.arcTo(pixelW, 0, pixelW, pixelH, r);
    ctx.arcTo(pixelW, pixelH, 0, pixelH, r);
    ctx.arcTo(0, pixelH, 0, 0, r);
    ctx.arcTo(0, 0, pixelW, 0, r);
    ctx.closePath();
  }
  ctx.clip();

  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  const scale = Math.max(pixelW / iw, pixelH / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const ox = (pixelW - dw) / 2;
  const oy = (pixelH - dh) / 2;
  ctx.drawImage(image, ox, oy, dw, dh);

  return textureFromCanvas(canvas, resolution);
}

/** Soft rounded drop-shadow plate (logical CARD_W×CARD_H, alpha in tex). */
function bakeShadowTexture(resolution: number): Texture {
  const designW = CARD_W;
  const designH = CARD_H;
  const pixelW = Math.max(1, Math.round(designW * resolution));
  const pixelH = Math.max(1, Math.round(designH * resolution));
  const rPx = Math.max(1, CARD_CORNER_RADIUS * resolution);

  const canvas = document.createElement('canvas');
  canvas.width = pixelW;
  canvas.height = pixelH;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return Texture.WHITE;

  ctx.clearRect(0, 0, pixelW, pixelH);
  ctx.fillStyle = 'rgba(44, 53, 64, 1)';
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(0, 0, pixelW, pixelH, rPx);
  } else {
    const r = Math.min(rPx, pixelW / 2, pixelH / 2);
    ctx.moveTo(r, 0);
    ctx.arcTo(pixelW, 0, pixelW, pixelH, r);
    ctx.arcTo(pixelW, pixelH, 0, pixelH, r);
    ctx.arcTo(0, pixelH, 0, 0, r);
    ctx.arcTo(0, 0, pixelW, 0, r);
    ctx.closePath();
  }
  ctx.fill();

  return textureFromCanvas(canvas, resolution);
}

function assetJobs(): { key: string; url: string }[] {
  const jobs: { key: string; url: string }[] = [
    { key: CARD_BACK_KEY, url: BACK_URL },
    { key: CARD_JOKER_KEY, url: JOKER_URL },
  ];
  for (const suit of ['H', 'S'] as Suit[]) {
    for (const rank of RANKS) {
      jobs.push({
        key: faceAssetKey(suit, rank),
        url: faceAssetUrl(suit, rank),
      });
    }
  }
  return jobs;
}

/**
 * Load HTML images (CPU) + bake GPU textures.
 * Idempotent while `loaded`; use `reloadCardFaceAssets` after GPU loss.
 */
export async function loadCardFaceAssets(): Promise<void> {
  if (loaded) return;

  bakeResolution = isNativeApp() ? 2 : 3;
  const jobs = assetJobs();

  await Promise.all(
    jobs.map(async ({ key, url }) => {
      let img = imageCache.get(key);
      if (!img) {
        img = await loadHtmlImage(url);
        imageCache.set(key, img);
      }
      const tex = bakeCardTexture(
        img,
        CARD_W,
        CARD_H,
        bakeResolution,
        CARD_CORNER_RADIUS,
      );
      textureCache.set(key, tex);
    }),
  );

  textureCache.set(CARD_SHADOW_KEY, bakeShadowTexture(bakeResolution));
  loaded = true;
}

export async function reloadCardFaceAssets(): Promise<void> {
  destroyGpuTextures();
  await loadCardFaceAssets();
}

export function getFaceTexture(suit: Suit, rank: Rank): Texture {
  const key = faceAssetKey(suit, rank);
  const tex = textureCache.get(key);
  if (!tex) {
    console.warn(`[cardAssets] missing texture ${key}`);
    return Texture.WHITE;
  }
  return tex;
}

export function getJokerTexture(): Texture {
  const tex = textureCache.get(CARD_JOKER_KEY);
  if (!tex) {
    console.warn(`[cardAssets] missing texture ${CARD_JOKER_KEY}`);
    return Texture.WHITE;
  }
  return tex;
}

export function getBackTexture(): Texture {
  const tex = textureCache.get(CARD_BACK_KEY);
  if (!tex) {
    console.warn(`[cardAssets] missing texture ${CARD_BACK_KEY}`);
    return Texture.WHITE;
  }
  return tex;
}

/** Shared rounded soft shadow (tint/alpha applied on Sprite). */
export function getShadowTexture(): Texture {
  const tex = textureCache.get(CARD_SHADOW_KEY);
  if (!tex) {
    console.warn(`[cardAssets] missing texture ${CARD_SHADOW_KEY}`);
    return Texture.WHITE;
  }
  return tex;
}

export function cardAssetsReady(): boolean {
  return loaded;
}

export function getCardBakeResolution(): number {
  return bakeResolution;
}
