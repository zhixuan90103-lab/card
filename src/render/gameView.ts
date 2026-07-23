/**
 * GameView — ephemeral GPU view over durable GameState (D28 / D29).
 *
 * LIVE → SUSPENDED → REHYDRATE → LIVE
 *
 * Entire game renders via WebGPU-first Pixi (see `./gpu`).
 * Soft resume is not a recovery path; always full rehydrate after GPU loss.
 */
import type { GameState } from '../core/types';
import { createPixiApp, type PixiBundle } from './gpu';
import { loadCardFaceAssets, reloadCardFaceAssets } from './cardAssets';
import { CardRenderer } from './cards';
import { PileTray } from './pileTray';
import { getCanvasHost } from '../viewport/phoneFrame';
import { applyShellLayout } from '../viewport/shellLayout';

export type GameViewMountOpts = {
  /** GPU lost — must full-rehydrate (never soft resume). */
  onContextLost?: () => void;
};

export class GameView {
  private bundle: PixiBundle;
  private pileTray: PileTray;
  cards: CardRenderer;
  private destroyed = false;
  private gen = 0;
  private chain: Promise<void> = Promise.resolve();
  private onContextLost?: () => void;

  private constructor(
    bundle: PixiBundle,
    pileTray: PileTray,
    cards: CardRenderer,
    onContextLost?: () => void,
  ) {
    this.bundle = bundle;
    this.pileTray = pileTray;
    this.cards = cards;
    this.onContextLost = onContextLost;
  }

  get app() {
    return this.bundle.app;
  }

  get world() {
    return this.bundle.world;
  }

  get ticker() {
    return this.bundle.app.ticker;
  }

  get canvas(): HTMLCanvasElement {
    return this.bundle.app.canvas as HTMLCanvasElement;
  }

  /** Live backend: `webgpu` (preferred) or `webgl` (fallback). */
  get backend(): string {
    return this.bundle.backend;
  }

  get prefersWebGpu(): boolean {
    return this.bundle.prefersWebGpu;
  }

  private createOpts() {
    return { onContextLost: this.onContextLost };
  }

  static async mount(
    state: GameState,
    opts: GameViewMountOpts = {},
  ): Promise<GameView> {
    applyShellLayout();
    await loadCardFaceAssets();
    const bundle = await createPixiApp({ onContextLost: opts.onContextLost });
    const pileTray = new PileTray();
    const cards = new CardRenderer();
    bundle.world.addChild(pileTray.root);
    bundle.world.addChild(cards.root);
    cards.bootstrap(state);
    GameView.forcePresent(bundle);
    return new GameView(bundle, pileTray, cards, opts.onContextLost);
  }

  private static forcePresent(bundle: PixiBundle): void {
    try {
      applyShellLayout();
      bundle.resize();
      // Ensure continuous render (suspend may have stopped prior ticker; new app should run)
      try {
        bundle.app.start?.();
      } catch {
        /* older typings */
      }
      if (!bundle.app.ticker.started) bundle.app.ticker.start();
      bundle.app.ticker.speed = 1;
      bundle.app.renderer.render(bundle.app.stage);
    } catch (e) {
      console.warn('[GameView] forcePresent', e);
    }
  }

  /** Wait until phone-frame has a real layout box (iOS VV often 0 on first resume tick). */
  private static async waitForFrameLayout(maxMs = 600): Promise<void> {
    const t0 = performance.now();
    while (performance.now() - t0 < maxMs) {
      applyShellLayout();
      const host = getCanvasHost();
      const frame = host.parentElement;
      const r = frame?.getBoundingClientRect();
      if (r && r.width > 2 && r.height > 2) return;
      await new Promise((r) => setTimeout(r, 32));
    }
    // Proceed with lastGood / design fallback inside resize()
    applyShellLayout();
  }

  private tearDownGpu(): void {
    try {
      this.pileTray.destroy();
    } catch {
      /* ignore */
    }
    try {
      this.bundle.destroy();
    } catch {
      /* ignore */
    }
    try {
      const host = getCanvasHost();
      host.innerHTML = '';
    } catch {
      /* ignore */
    }
  }

  rehydrate(state: GameState): Promise<void> {
    if (this.destroyed) return Promise.resolve();
    const myGen = ++this.gen;
    this.chain = this.chain
      .catch(() => {
        /* previous failure must not block next rehydrate */
      })
      .then(() => this.runRehydrate(state, myGen));
    return this.chain;
  }

  private async runRehydrate(state: GameState, myGen: number): Promise<void> {
    if (this.destroyed || myGen !== this.gen) return;

    console.info('[lifecycle] rehydrate start gen=', myGen);
    this.tearDownGpu();

    if (myGen !== this.gen) return;

    // Let visualViewport / shell settle before allocating GPU (avoids 0×0 canvas)
    await GameView.waitForFrameLayout(640);
    if (this.destroyed || myGen !== this.gen) return;

    await reloadCardFaceAssets();
    if (this.destroyed || myGen !== this.gen) return;

    applyShellLayout();
    let bundle: PixiBundle;
    try {
      bundle = await createPixiApp(this.createOpts());
    } catch (e) {
      console.error('[lifecycle] createPixiApp failed', e);
      throw e;
    }
    if (this.destroyed || myGen !== this.gen) {
      try {
        bundle.destroy();
      } catch {
        /* ignore */
      }
      return;
    }

    const pileTray = new PileTray();
    const cards = new CardRenderer();
    bundle.world.addChild(pileTray.root);
    bundle.world.addChild(cards.root);
    // Full rebuild of card sprites from authoritative state (not a soft sync)
    cards.bootstrap(state);

    this.bundle = bundle;
    this.pileTray = pileTray;
    this.cards = cards;

    console.info('[lifecycle] rehydrate backend=', bundle.backend);
    // Few present passes only (many passes + resize thrash felt like permanent jank)
    for (const gap of [0, 50, 200]) {
      if (gap > 0) await new Promise((r) => setTimeout(r, gap));
      if (this.destroyed || myGen !== this.gen) return;
      GameView.forcePresent(this.bundle);
    }

    const c = this.bundle.app.canvas as HTMLCanvasElement;
    console.info(
      '[lifecycle] rehydrate done gen=',
      myGen,
      'canvasCss=',
      c.style.width,
      c.style.height,
      'client=',
      c.clientWidth,
      c.clientHeight,
    );
  }

  suspend(): void {
    if (this.destroyed) return;
    try {
      this.app.ticker.stop();
    } catch {
      /* ignore */
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.gen += 1;
    this.tearDownGpu();
  }
}
