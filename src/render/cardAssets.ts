import { Texture } from 'pixi.js';
import type { Rank, Suit } from '../core/types';
import { CARD_H, CARD_W } from '../data/layout';

/**
 * Poker pack:
 *   R_{rank}.png  → hearts (H)
 *   B_{rank}.png  → spades (S)
 *   Card_B.png    → back
 *
 * Clarity: bake each PNG into a canvas at (CARD × device DPR) with
 * high-quality downscale, so GPU samples ~1 texel per framebuffer pixel.
 * Displaying raw 188×248 forced into 56×74 looks soft/muddy.
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

export const CARD_BACK_KEY = 'card-back';

function filePrefix(suit: Suit): 'R' | 'B' {
  return suit === 'H' ? 'R' : 'B';
}

export function faceAssetKey(suit: Suit, rank: Rank): string {
  return `card-face-${suit}-${rank}`;
}

/** Stable per-session bust so replaced assets reload on full page refresh. */
const ASSET_VER = String(Date.now());

function faceAssetUrl(suit: Suit, rank: Rank): string {
  return `/cards/${filePrefix(suit)}_${rank}.png?v=${ASSET_VER}`;
}

const BACK_URL = `/cards/Card_B.png?v=${ASSET_VER}`;

const textureCache = new Map<string, Texture>();
/** CPU-side images survive WebGL context loss; GPU textures do not. */
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

/**
 * High-quality cover resize into designW×designH at `resolution` buffer scale.
 * Texture logical size = designW×designH (via source.resolution).
 */
function bakeCardTexture(
  image: HTMLImageElement,
  designW: number,
  designH: number,
  resolution: number,
): Texture {
  const pixelW = Math.max(1, Math.round(designW * resolution));
  const pixelH = Math.max(1, Math.round(designH * resolution));

  const canvas = document.createElement('canvas');
  canvas.width = pixelW;
  canvas.height = pixelH;
  // Prefer sRGB so baked colors match Preview / design tools
  const ctx =
    canvas.getContext('2d', { alpha: true, colorSpace: 'srgb' } as CanvasRenderingContext2DSettings) ??
    canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    return Texture.from(image);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, pixelW, pixelH);

  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  // cover
  const scale = Math.max(pixelW / iw, pixelH / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const ox = (pixelW - dw) / 2;
  const oy = (pixelH - dh) / 2;
  ctx.drawImage(image, ox, oy, dw, dh);

  // resolution makes logical size = pixel/resolution = designW×designH
  // skipCache=true so each card gets its own texture entry
  const texture = Texture.from(
    {
      resource: canvas,
      resolution,
      scaleMode: 'linear' as const,
      autoGenerateMipmaps: false,
    },
    true,
  );
  return texture;
}

function assetJobs(): { key: string; url: string }[] {
  const jobs: { key: string; url: string }[] = [
    { key: CARD_BACK_KEY, url: BACK_URL },
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
 * Idempotent while `loaded`; use `reloadCardFaceAssets` after GL context loss.
 */
export async function loadCardFaceAssets(): Promise<void> {
  if (loaded) return;

  // Always bake at 3× design pixels (56×74 → 168×222).
  bakeResolution = 3;
  const jobs = assetJobs();

  await Promise.all(
    jobs.map(async ({ key, url }) => {
      let img = imageCache.get(key);
      if (!img) {
        img = await loadHtmlImage(url);
        imageCache.set(key, img);
      }
      const tex = bakeCardTexture(img, CARD_W, CARD_H, bakeResolution);
      textureCache.set(key, tex);
    }),
  );

  loaded = true;
}

/**
 * Design 19: after WebGL context loss, GPU textures are dead.
 * Drop them and re-bake from CPU image cache (no network if warm).
 */
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

export function getBackTexture(): Texture {
  const tex = textureCache.get(CARD_BACK_KEY);
  if (!tex) {
    console.warn(`[cardAssets] missing texture ${CARD_BACK_KEY}`);
    return Texture.WHITE;
  }
  return tex;
}

export function cardAssetsReady(): boolean {
  return loaded;
}

/** Bake resolution used (for debug). */
export function getCardBakeResolution(): number {
  return bakeResolution;
}
