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
  /** Call when app returns from background (iOS WebGL blank fix) */
  resume: () => void;
  destroy: () => void;
};

/**
 * Mount Pixi into #game-canvas.
 *
 * Layout: #phone-frame = 393×852; renderer = design + FX pads.
 * Resume: iOS often clears GL buffer or reports 0×0 VV while backgrounded —
 * `resume()` re-layouts, restarts ticker, and force-renders.
 */
export async function createPixiApp(): Promise<PixiBundle> {
  applyShellLayout();

  const host = getCanvasHost();
  const frame = getPhoneFrameEl();
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
    // Keep last frame when possible (helps some GPUs after brief suspend)
    powerPreference: 'high-performance',
    canvas: undefined,
  });

  const canvas = app.canvas as HTMLCanvasElement;
  host.innerHTML = '';
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

  const resize = () => {
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

  const forceRender = () => {
    try {
      // Ensure ticker not stuck stopped mid-frame
      if (!app.ticker.started) app.ticker.start();
      app.renderer.render(app.stage);
    } catch (e) {
      console.warn('[pixi] forceRender failed', e);
    }
  };

  /** Full recovery path after background / context restore */
  const resume = () => {
    applyShellLayout();
    resize();
    forceRender();
    requestAnimationFrame(() => {
      applyShellLayout();
      resize();
      forceRender();
    });
    // iOS often settles viewport a beat later
    setTimeout(() => {
      applyShellLayout();
      resize();
      forceRender();
    }, 50);
    setTimeout(() => {
      applyShellLayout();
      resize();
      forceRender();
    }, 250);
  };

  resize();

  const stopWatch = watchShellLayout(() => {
    resize();
  });

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    console.warn('[pixi] WebGL context lost');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    console.warn('[pixi] WebGL context restored — full resume');
    resume();
  });

  const destroy = () => {
    stopWatch();
    app.destroy(true, { children: true });
  };

  return { app, world, resize, resume, destroy };
}
