import { Application, Container } from 'pixi.js';
import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  getDpr,
} from '../viewport/design';
import { getCanvasHost, getPhoneFrameEl } from '../viewport/phoneFrame';

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

  const dpr = getDpr();
  const rect = frame.getBoundingClientRect();

  await app.init({
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    background: 0x0d1117,
    antialias: false,
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

  const world = new Container();
  world.label = 'world';
  app.stage.addChild(world);

  // Stage is design-sized; renderer buffer matches CSS * dpr via resize
  const resize = () => {
    const r = frame.getBoundingClientRect();
    const nextDpr = getDpr();
    app.renderer.resolution = nextDpr;
    app.renderer.resize(DESIGN_WIDTH, DESIGN_HEIGHT);
    // CSS size controlled by host (100%); keep design world 1:1
    canvas.style.width = `${r.width}px`;
    canvas.style.height = `${r.height}px`;
    void rect; // measured once at init; live size via CSS
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
