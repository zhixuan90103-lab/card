/**
 * GameView — ephemeral GPU view over durable GameState (design 19 / D28).
 *
 * LIVE → SUSPENDED → REHYDRATE → LIVE
 *
 * Contract:
 * - GameSession / GameState is never owned here.
 * - rehydrate() always tears down Pixi + GPU textures and rebuilds from state.
 * - Soft resume is not a recovery path on iOS; do not call it after context loss.
 */
import type { GameState } from '../core/types';
import { createPixiApp, type PixiBundle } from './app';
import { loadCardFaceAssets, reloadCardFaceAssets } from './cardAssets';
import { CardRenderer } from './cards';
import { PileTray } from './pileTray';
import { getCanvasHost } from '../viewport/phoneFrame';
import { applyShellLayout } from '../viewport/shellLayout';

export class GameView {
  private bundle: PixiBundle;
  private pileTray: PileTray;
  cards: CardRenderer;
  private destroyed = false;
  /** Monotonic; concurrent rehydrate calls only the latest wins. */
  private gen = 0;
  /** Serialized rehydrate chain (no overlapping teardown/rebuild). */
  private chain: Promise<void> = Promise.resolve();

  private constructor(
    bundle: PixiBundle,
    pileTray: PileTray,
    cards: CardRenderer,
  ) {
    this.bundle = bundle;
    this.pileTray = pileTray;
    this.cards = cards;
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

  static async mount(state: GameState): Promise<GameView> {
    applyShellLayout();
    await loadCardFaceAssets();
    const bundle = await createPixiApp();
    const pileTray = new PileTray();
    const cards = new CardRenderer();
    bundle.world.addChild(pileTray.root);
    bundle.world.addChild(cards.root);
    cards.bootstrap(state);
    GameView.forcePresent(bundle);
    return new GameView(bundle, pileTray, cards);
  }

  private static forcePresent(bundle: PixiBundle): void {
    try {
      applyShellLayout();
      bundle.resize();
      if (!bundle.app.ticker.started) bundle.app.ticker.start();
      bundle.app.renderer.render(bundle.app.stage);
    } catch (e) {
      console.warn('[GameView] forcePresent', e);
    }
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
    // Guarantee empty host even if Application.destroy failed mid-context-loss
    try {
      const host = getCanvasHost();
      host.innerHTML = '';
    } catch {
      /* ignore */
    }
  }

  /**
   * Full view rebuild from authoritative state.
   * Safe to call repeatedly; calls are serialized; only latest gen is kept.
   */
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

    // CPU images kept; GPU textures re-baked for new GL context
    await reloadCardFaceAssets();
    if (this.destroyed || myGen !== this.gen) return;

    applyShellLayout();
    const bundle = await createPixiApp();
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
    cards.bootstrap(state);

    this.bundle = bundle;
    this.pileTray = pileTray;
    this.cards = cards;

    GameView.forcePresent(bundle);
    // iOS VV / safe-area often settles one frame later
    requestAnimationFrame(() => {
      if (this.destroyed || myGen !== this.gen) return;
      GameView.forcePresent(this.bundle);
    });
    setTimeout(() => {
      if (this.destroyed || myGen !== this.gen) return;
      GameView.forcePresent(this.bundle);
    }, 80);
    setTimeout(() => {
      if (this.destroyed || myGen !== this.gen) return;
      GameView.forcePresent(this.bundle);
    }, 280);

    console.info('[lifecycle] rehydrate done gen=', myGen);
  }

  /** Stop GPU work while backgrounded. Never trust the context after this. */
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
    this.gen += 1; // cancel in-flight rehydrate
    this.tearDownGpu();
  }
}
