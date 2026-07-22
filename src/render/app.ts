import { Application, Container } from 'pixi.js';
import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  getDpr,
} from '../viewport/design';
import { getCanvasHost, getPhoneFrameEl } from '../viewport/phoneFrame';
import { Theme } from './theme';

export type PixiBundle = {
  app: Application;
  world: Container;
  resize: () => void;
  destroy: () => void;
};

/**
 * Mount Pixi into #game-canvas. World units = design pixels (393×852).
 * Canvas CSS size follows phone-frame; resolution capped by MAX_DPR.
 */
export async function createPixiApp(): Promise<PixiBundle> {
  const host = getCanvasHost();
  const frame = getPhoneFrameEl();
  const app = new Application();

  /**
   * Resolution must track phone-frame CSS size × devicePixelRatio,
   * not only window.devicePixelRatio. Otherwise a large desktop frame
   * upscales a small buffer and the whole board (esp. cards) looks soft.
   */
  const frameResolution = (): number => {
    const r = frame.getBoundingClientRect();
    const cssScale = Math.max(
      r.width / DESIGN_WIDTH,
      r.height / DESIGN_HEIGHT,
      1e-6,
    );
    // Cap to avoid 4K overkill; floor at getDpr() for retina min quality
    return Math.min(Math.max(cssScale * (window.devicePixelRatio || 1), getDpr()), 3);
  };

  const dpr = frameResolution();

  await app.init({
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    background: Theme.bg,
    /** MSAA — 圆角/斜线更接近矢量 */
    antialias: true,
    resolution: dpr,
    autoDensity: true,
    preference: 'webgl',
    canvas: undefined,
  });

  // Force canvas into host and stretch to frame CSS size
  const canvas = app.canvas as HTMLCanvasElement;
  host.innerHTML = '';
  host.appendChild(canvas);
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  canvas.style.touchAction = 'none';
  // 双线性缩放，禁止像素风最近邻
  canvas.style.imageRendering = 'auto';

  const world = new Container();
  world.label = 'world';
  app.stage.addChild(world);

  // Stage is design-sized; buffer = design × frameResolution
  const resize = () => {
    const r = frame.getBoundingClientRect();
    const nextRes = frameResolution();
    app.renderer.resolution = nextRes;
    app.renderer.resize(DESIGN_WIDTH, DESIGN_HEIGHT);
    canvas.style.width = `${r.width}px`;
    canvas.style.height = `${r.height}px`;
  };

  resize();

  const onWinResize = () => resize();
  window.addEventListener('resize', onWinResize);
  window.visualViewport?.addEventListener('resize', onWinResize);
  window.visualViewport?.addEventListener('scroll', onWinResize);

  // WebGL context loss (E2c early hook for M0)
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    console.warn('[pixi] WebGL context lost');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    console.warn('[pixi] WebGL context restored — consider refresh if board broken');
    resize();
  });

  const destroy = () => {
    window.removeEventListener('resize', onWinResize);
    window.visualViewport?.removeEventListener('resize', onWinResize);
    window.visualViewport?.removeEventListener('scroll', onWinResize);
    app.destroy(true, { children: true });
  };

  return { app, world, resize, destroy };
}
