import { Application, Container, Graphics } from 'pixi.js';
import {
  BUFFER_HEIGHT,
  BUFFER_WIDTH,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  FX_PAD_X,
  FX_PAD_Y,
  getDpr,
} from '../../viewport/design';
import {
  applyShellLayout,
  getLastShellMetrics,
  watchShellLayout,
} from '../../viewport/shellLayout';
import { getCanvasHost, getPhoneFrameEl } from '../../viewport/phoneFrame';
import { isNativeApp } from '../../native/haptics';
import { Theme } from '../theme';
import {
  FALLBACK_BACKEND,
  getRendererBackendName,
  isPlayerBackend,
  PRIMARY_BACKEND,
  resolveRendererPreference,
} from './preference';
import { wireGpuLost } from './lost';

export type PixiBundle = {
  app: Application;
  world: Container;
  /** Actual backend after detect (`webgpu` preferred, else `webgl`). */
  backend: string;
  /** Resolved policy used for this Application. */
  prefersWebGpu: boolean;
  resize: () => void;
  destroy: () => void;
};

export type CreatePixiOpts = {
  /**
   * GPU lost (WebGPU device or WebGL context).
   * Caller must full-rehydrate (D28) — soft resume forbidden.
   */
  onContextLost?: () => void;
};

type DisplayMetrics = {
  rendererW: number;
  rendererH: number;
  cssW: number;
  cssH: number;
  cssLeft: number;
  cssTop: number;
  scale: number;
  originX: number;
  originY: number;
  nativeViewport: boolean;
};

/**
 * Mount Pixi for the whole game — **WebGPU-first** (D29).
 *
 * One Application = one GPU lifetime. After suspend / loss: destroy + recreate.
 * WebGL only when WebGPU cannot init; never canvas as player path.
 */
export async function createPixiApp(
  opts: CreatePixiOpts = {},
): Promise<PixiBundle> {
  applyShellLayout();

  const host = getCanvasHost();
  const frame = getPhoneFrameEl();
  host.innerHTML = '';

  const resolved = resolveRendererPreference();
  const app = new Application();

  const native = isNativeApp();
  /**
   * Perf (design/22):
   * - WebGPU + MSAA is known-heavy in Pixi (#10413) → antialias off on native.
   * - Cap resolution on phone; keep WebGPU as default backend (D29).
   * - high-performance: matches smooth native WebGPU titles; low-power can feel capped.
   */
  const maxRes = native ? 2 : 3;
  const useAa = !native;
  const power = 'high-performance' as const;

  const readDisplayMetrics = (): DisplayMetrics => {
    applyShellLayout();
    const r = frame.getBoundingClientRect();
    const last = getLastShellMetrics();
    const frameW =
      r.width > 2 ? r.width : last.frameW > 2 ? last.frameW : DESIGN_WIDTH;
    const frameH =
      r.height > 2 ? r.height : last.frameH > 2 ? last.frameH : DESIGN_HEIGHT;
    const scale = Math.max(
      Math.min(frameW / DESIGN_WIDTH, frameH / DESIGN_HEIGHT),
      1e-6,
    );

    if (native) {
      const shellW = last.shellW > 2 ? last.shellW : frameW;
      const shellH = last.shellH > 2 ? last.shellH : frameH;
      const rendererW = Math.max(DESIGN_WIDTH, shellW / scale);
      const rendererH = Math.max(DESIGN_HEIGHT, shellH / scale);
      return {
        rendererW,
        rendererH,
        cssW: shellW,
        cssH: shellH,
        cssLeft: 0,
        cssTop: 0,
        scale,
        originX: (rendererW - DESIGN_WIDTH) / 2,
        originY: (rendererH - DESIGN_HEIGHT) / 2,
        nativeViewport: true,
      };
    }

    return {
      rendererW: BUFFER_WIDTH,
      rendererH: BUFFER_HEIGHT,
      cssW: BUFFER_WIDTH * scale,
      cssH: BUFFER_HEIGHT * scale,
      cssLeft: (frameW - BUFFER_WIDTH * scale) / 2,
      cssTop: (frameH - BUFFER_HEIGHT * scale) / 2,
      scale,
      originX: FX_PAD_X,
      originY: FX_PAD_Y,
      nativeViewport: false,
    };
  };

  const frameResolution = (): number => {
    const s = readDisplayMetrics().scale;
    return Math.min(
      Math.max(s * (window.devicePixelRatio || 1), getDpr()),
      maxRes,
    );
  };
  const initialDisplay = readDisplayMetrics();

  await app.init({
    width: initialDisplay.rendererW,
    height: initialDisplay.rendererH,
    background: Theme.bg,
    backgroundAlpha: 1,
    antialias: useAa,
    resolution: frameResolution(),
    autoDensity: true,
    preference: resolved.preference,
    powerPreference: power,
    webgpu: {
      antialias: useAa,
      powerPreference: power,
    },
    webgl: {
      antialias: useAa,
      powerPreference: power,
    },
    canvas: undefined,
  });

  const backend = getRendererBackendName(app.renderer);
  if (!isPlayerBackend(backend)) {
    console.error(
      '[gpu] unexpected backend (player path must be webgpu|webgl):',
      backend,
      resolved,
    );
  } else if (resolved.prefersWebGpu && backend === FALLBACK_BACKEND) {
    console.warn(
      '[gpu] WebGPU unavailable — entire game on compatibility WebGL',
      { choice: resolved.choice, source: resolved.source },
    );
  } else {
    console.info('[gpu] backend=', backend, {
      choice: resolved.choice,
      source: resolved.source,
      preference: resolved.preference,
      primary: PRIMARY_BACKEND,
    });
  }

  // Expose for support / HUD debug without importing Pixi internals
  try {
    document.documentElement.dataset.gpuBackend = backend;
    document.documentElement.dataset.gpuPolicy = resolved.prefersWebGpu
      ? 'webgpu-first'
      : 'webgl-forced';
  } catch {
    /* ignore */
  }

  const canvas = app.canvas as HTMLCanvasElement;
  host.appendChild(canvas);
  canvas.style.display = 'block';
  canvas.style.position = 'absolute';
  canvas.style.touchAction = 'none';
  canvas.style.imageRendering = 'auto';
  canvas.style.backgroundColor = Theme.bgCss;
  canvas.style.transform = 'translateZ(0)';
  canvas.style.backfaceVisibility = 'hidden';
  canvas.style.willChange = 'transform';
  canvas.style.zIndex = '0';
  canvas.dataset.gpuBackend = backend;

  const stageBg = new Graphics();
  stageBg.label = 'design-bg';
  app.stage.addChild(stageBg);

  const world = new Container();
  world.label = 'world';
  app.stage.addChild(world);

  const placeWorld = (m: DisplayMetrics) => {
    stageBg.clear();
    stageBg.rect(m.originX, m.originY, DESIGN_WIDTH, DESIGN_HEIGHT);
    stageBg.fill({ color: Theme.bg });
    world.position.set(m.originX, m.originY);
  };

  let dead = false;
  let destroying = false;

  const signalLost = (reason: string) => {
    if (dead || destroying) return;
    dead = true;
    console.warn(`[gpu] ${reason} — expect rehydrate (D28)`);
    try {
      opts.onContextLost?.();
    } catch {
      /* ignore */
    }
  };

  /** Skip redundant GPU resize when layout barely moved (VV scroll thrash). */
  let lastCssKey = '';

  /**
   * Size the GPU canvas for display.
   * Critical on iOS resume: getBoundingClientRect can be 0×0 for a few frames.
   * Never leave canvas without CSS size (invisible board + haptics-only).
   */
  const resize = () => {
    if (dead) return;
    const m = readDisplayMetrics();
    const nextRes = Math.min(
      Math.max(m.scale * (window.devicePixelRatio || 1), getDpr()),
      maxRes,
    );
    const cssKey = `${m.nativeViewport ? 'native' : 'buffer'}:${m.rendererW | 0}x${m.rendererH | 0}:${m.cssW | 0}x${m.cssH | 0}:${m.cssLeft | 0},${m.cssTop | 0}:r${nextRes.toFixed(2)}`;
    if (cssKey === lastCssKey) return;
    lastCssKey = cssKey;

    try {
      if (Math.abs(app.renderer.resolution - nextRes) > 0.01) {
        app.renderer.resolution = nextRes;
      }
      app.renderer.resize(m.rendererW, m.rendererH);
    } catch (e) {
      console.warn('[gpu] resize failed', e);
    }

    canvas.style.position = m.nativeViewport ? 'fixed' : 'absolute';
    canvas.style.width = `${m.cssW}px`;
    canvas.style.height = `${m.cssH}px`;
    canvas.style.left = `${m.cssLeft}px`;
    canvas.style.top = `${m.cssTop}px`;
    canvas.style.visibility = 'visible';
    canvas.style.opacity = '1';
    canvas.style.contain = 'strict';

    host.style.width = '100%';
    host.style.height = '100%';
    host.style.backgroundColor = Theme.bgCss;
    host.style.transform = 'translateZ(0)';
    host.style.overflow = m.nativeViewport ? 'hidden' : 'visible';
    placeWorld(m);
  };

  resize();
  const stopWatch = watchShellLayout(() => resize());

  const unwireLost = wireGpuLost({
    backend,
    canvas,
    renderer: app.renderer,
    isDead: () => dead || destroying,
    onLost: signalLost,
  });

  const destroy = () => {
    destroying = true;
    dead = true;
    stopWatch();
    unwireLost();
    try {
      app.destroy(true, { children: true });
    } catch (e) {
      console.warn('[gpu] destroy', e);
    }
    if (canvas.parentElement === host) {
      try {
        host.removeChild(canvas);
      } catch {
        /* ignore */
      }
    }
  };

  return {
    app,
    world,
    backend,
    prefersWebGpu: resolved.prefersWebGpu,
    resize,
    destroy,
  };
}
