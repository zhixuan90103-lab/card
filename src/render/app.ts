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

/**
 * Mount Pixi into #game-canvas.
 *
 * Layout contract:
 * - #phone-frame = design 393×852 (hit-test / HUD)
 * - Renderer = BUFFER (design + FX pads) so exit throws aren't clipped
 * - `world` offset by FX_PAD so cards still use design coordinates
 * - Canvas CSS is larger than the frame and centered (overflow visible)
 */
export async function createPixiApp(): Promise<PixiBundle> {
  applyShellLayout();

  const host = getCanvasHost();
  const frame = getPhoneFrameEl();
  const app = new Application();

  /** Uniform scale from layout frame (not buffer) → design */
  const layoutScale = (): number => {
    const r = frame.getBoundingClientRect();
    return Math.max(
      Math.min(r.width / DESIGN_WIDTH, r.height / DESIGN_HEIGHT),
      1e-6,
    );
  };

  const frameResolution = (): number => {
    const s = layoutScale();
    return Math.min(Math.max(s * (window.devicePixelRatio || 1), getDpr()), 3);
  };

  await app.init({
    width: BUFFER_WIDTH,
    height: BUFFER_HEIGHT,
    // Transparent outside design so letterbox cream shows through FX margins
    backgroundAlpha: 0,
    antialias: true,
    resolution: frameResolution(),
    autoDensity: true,
    preference: 'webgl',
    canvas: undefined,
  });

  const canvas = app.canvas as HTMLCanvasElement;
  host.innerHTML = '';
  host.appendChild(canvas);
  canvas.style.display = 'block';
  canvas.style.position = 'absolute';
  canvas.style.touchAction = 'none';
  canvas.style.imageRendering = 'auto';

  // Felt under design rect only (FX margins stay transparent)
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
    const scale = layoutScale();
    const nextRes = frameResolution();
    app.renderer.resolution = nextRes;
    app.renderer.resize(BUFFER_WIDTH, BUFFER_HEIGHT);

    // Canvas covers design + FX bleed, centered on the layout frame
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

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    console.warn('[pixi] WebGL context lost');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    console.warn('[pixi] WebGL context restored');
    resize();
  });

  const destroy = () => {
    stopWatch();
    app.destroy(true, { children: true });
  };

  return { app, world, resize, destroy };
}
