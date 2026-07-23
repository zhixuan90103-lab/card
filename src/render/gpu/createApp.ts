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

  const layoutScale = (): number => {
    const r = frame.getBoundingClientRect();
    const w = r.width > 2 ? r.width : DESIGN_WIDTH;
    const h = r.height > 2 ? r.height : DESIGN_HEIGHT;
    return Math.max(Math.min(w / DESIGN_WIDTH, h / DESIGN_HEIGHT), 1e-6);
  };

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

  const frameResolution = (): number => {
    const s = layoutScale();
    return Math.min(
      Math.max(s * (window.devicePixelRatio || 1), getDpr()),
      maxRes,
    );
  };

  await app.init({
    width: BUFFER_WIDTH,
    height: BUFFER_HEIGHT,
    backgroundAlpha: 0,
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
  canvas.dataset.gpuBackend = backend;

  const stageBg = new Graphics();
  stageBg.label = 'design-bg';
  stageBg.rect(FX_PAD_X, FX_PAD_Y, DESIGN_WIDTH, DESIGN_HEIGHT);
  stageBg.fill({ color: Theme.bg });
  app.stage.addChild(stageBg);

  const world = new Container();
  world.label = 'world';
  world.position.set(FX_PAD_X, FX_PAD_Y);
  app.stage.addChild(world);

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
    const nextRes = Math.min(
      Math.max(scale * (window.devicePixelRatio || 1), getDpr()),
      maxRes,
    );

    const cssW = BUFFER_WIDTH * scale;
    const cssH = BUFFER_HEIGHT * scale;
    const cssKey = `${frameW | 0}x${frameH | 0}:${cssW | 0}x${cssH | 0}:r${nextRes.toFixed(2)}`;
    if (cssKey === lastCssKey) return;
    lastCssKey = cssKey;

    try {
      if (Math.abs(app.renderer.resolution - nextRes) > 0.01) {
        app.renderer.resolution = nextRes;
      }
      app.renderer.resize(BUFFER_WIDTH, BUFFER_HEIGHT);
    } catch (e) {
      console.warn('[gpu] resize failed', e);
    }

    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.style.left = `${(frameW - cssW) / 2}px`;
    canvas.style.top = `${(frameH - cssH) / 2}px`;
    canvas.style.visibility = 'visible';
    canvas.style.opacity = '1';

    host.style.width = '100%';
    host.style.height = '100%';
    host.style.overflow = 'visible';
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
