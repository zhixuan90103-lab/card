import { Application, Container, Graphics } from 'pixi.js';
import {
  BUFFER_HEIGHT,
  BUFFER_WIDTH,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  FX_PAD_X,
  FX_PAD_Y,
  getDpr,
} from '../viewport/design';
import { applyShellLayout, watchShellLayout } from '../viewport/shellLayout';
import { getCanvasHost, getPhoneFrameEl } from '../viewport/phoneFrame';
import { Theme } from './theme';

export type PixiBundle = {
  app: Application;
  world: Container;
  resize: () => void;
  destroy: () => void;
};

export type CreatePixiOpts = {
  /**
   * Called when WebGL reports context lost.
   * Caller should schedule GameView.rehydrate (soft resume is forbidden).
   */
  onContextLost?: () => void;
};

/**
 * Mount a fresh Pixi Application into #game-canvas.
 *
 * One Application = one WebGL context lifetime.
 * After suspend / context loss, do not patch this instance — destroy and create again.
 */
export async function createPixiApp(
  opts: CreatePixiOpts = {},
): Promise<PixiBundle> {
  applyShellLayout();

  const host = getCanvasHost();
  const frame = getPhoneFrameEl();
  // Always start from a clean host (previous canvas may be dead/orphaned)
  host.innerHTML = '';

  const app = new Application();

  const layoutScale = (): number => {
    const r = frame.getBoundingClientRect();
    const w = r.width > 2 ? r.width : DESIGN_WIDTH;
    const h = r.height > 2 ? r.height : DESIGN_HEIGHT;
    return Math.max(Math.min(w / DESIGN_WIDTH, h / DESIGN_HEIGHT), 1e-6);
  };

  const frameResolution = (): number => {
    const s = layoutScale();
    return Math.min(Math.max(s * (window.devicePixelRatio || 1), getDpr()), 3);
  };

  await app.init({
    width: BUFFER_WIDTH,
    height: BUFFER_HEIGHT,
    backgroundAlpha: 0,
    antialias: true,
    resolution: frameResolution(),
    autoDensity: true,
    preference: 'webgl',
    powerPreference: 'high-performance',
    canvas: undefined,
  });

  const canvas = app.canvas as HTMLCanvasElement;
  host.appendChild(canvas);
  canvas.style.display = 'block';
  canvas.style.position = 'absolute';
  canvas.style.touchAction = 'none';
  canvas.style.imageRendering = 'auto';

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

  const resize = () => {
    if (dead) return;
    applyShellLayout();
    const r = frame.getBoundingClientRect();
    // Skip collapsing resize while backgrounded (0-size frame)
    if (r.width < 2 || r.height < 2) return;

    const scale = layoutScale();
    const nextRes = frameResolution();
    try {
      app.renderer.resolution = nextRes;
      app.renderer.resize(BUFFER_WIDTH, BUFFER_HEIGHT);
    } catch (e) {
      console.warn('[pixi] resize failed', e);
    }

    const cssW = BUFFER_WIDTH * scale;
    const cssH = BUFFER_HEIGHT * scale;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.style.left = `${(r.width - cssW) / 2}px`;
    canvas.style.top = `${(r.height - cssH) / 2}px`;

    host.style.width = '100%';
    host.style.height = '100%';
    host.style.overflow = 'visible';
  };

  resize();

  const stopWatch = watchShellLayout(() => {
    resize();
  });

  const onLost = (e: Event) => {
    // Allow browser to restore slot; we still rehydrate fully on resume
    e.preventDefault();
    dead = true;
    console.warn('[pixi] WebGL context lost — expect rehydrate');
    try {
      opts.onContextLost?.();
    } catch {
      /* ignore */
    }
  };
  canvas.addEventListener('webglcontextlost', onLost);
  // contextrestored is intentionally NOT a soft-resume path (design 19):
  // textures and programs are unreliable; GameView rehydrate owns recovery.

  const destroy = () => {
    dead = true;
    stopWatch();
    canvas.removeEventListener('webglcontextlost', onLost);
    try {
      app.destroy(true, { children: true });
    } catch (e) {
      console.warn('[pixi] destroy', e);
    }
    // Orphaned canvas if destroy failed
    if (canvas.parentElement === host) {
      try {
        host.removeChild(canvas);
      } catch {
        /* ignore */
      }
    }
  };

  return { app, world, resize, destroy };
}
