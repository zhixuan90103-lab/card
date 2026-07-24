import { Container, Graphics, Sprite } from 'pixi.js';
import type { Card, CardId, GameState } from '../core/types';
import { canMatchCards } from '../core/types';
import { freeCardIds, isFree } from '../core/rules';
import { CARD_H, CARD_W, STOCK_STACK_MAX_VISIBLE } from '../data/layout';
import { getCardShadowParams } from '../data/cardShadowRuntime';
import {
  getStockRect,
  getStockStackDx,
  getWasteRect,
  stockStackOffset,
} from '../data/pileLayoutRuntime';
import {
  CARD_CORNER_RADIUS,
  getBackTexture,
  getFaceTexture,
  getShadowTexture,
} from './cardAssets';
import {
  easeInOutSmooth,
  easeOutQuad,
  PHYS,
  randJitter,
  type TickerLike,
} from './phys';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '../viewport/design';
import { Theme } from './theme';

const RADIUS = CARD_CORNER_RADIUS;

/**
 * Stacking bands on `CardRenderer.root` (sortableChildren).
 * Static piles stay low; any in-flight card uses FX bands so it cannot
 * slip under selected / waste / other UI cards.
 */
export const CARD_Z = {
  seatShadow: 3,
  seatPlate: 5,
  /** stock seat: stockBase + (n - idx) */
  stockBase: 50,
  /** waste seat: wasteBase + idx */
  wasteBase: 500,
  /** selected stock/waste float */
  selectSeat: 2000,
  /** selected puzzle: selectPuzzle + layer * 10 */
  selectPuzzle: 1000,
  /**
   * Dragged card — must stay above all static + most FX.
   * (Fast swipe was slipping under puzzle when sort didn't re-run.)
   */
  drag: 9900,
  /** remaining stock compact while another card draws */
  stockCompact: 8400,
  draw: 8500,
  flip: 8600,
  /** recycle queue at waste */
  recycleWait: 8700,
  recycleFly: 8800,
  matchStart: 9000,
  meetTarget: 9100,
  meetFlyer: 9200,
  exit: 9300,
} as const;

function stockZ(n: number, idx: number): number {
  return CARD_Z.stockBase + (n - idx);
}

function wasteZ(idx: number): number {
  return CARD_Z.wasteBase + idx;
}

type CardView = {
  root: Container;
  /** Shared baked soft shadow (no per-card Graphics redraw) */
  shadow: Sprite;
  /** Shared back art Card_B.png (corners baked in texture) */
  back: Sprite;
  /** Face art R_ / B_ rank PNGs (corners baked in texture) */
  face: Sprite;
  /** Selection / subtle rim */
  frame: Graphics;
  /** Darken overlay when another card flips on top of stack */
  dim: Graphics;
  cardId: CardId;
  baseY: number;
  /** Face rim already painted (static for CARD_W×CARD_H) */
  faceRimReady: boolean;
  /** Dim plate geometry ready */
  dimShapeReady: boolean;
};

/** Snapshot of a card's on-screen pose (parent-space center). */
export type CardPose = {
  id: CardId;
  cx: number;
  cy: number;
  scale: number;
  rotation: number;
};

/**
 * Convention (product): card rotation / scale / motion defaults to **card center**
 * as pivot. Only use top-left pivot when the product explicitly asks for it.
 * `dragPos` still stores layout top-left; display uses center pivot via helpers.
 */
export class CardRenderer {
  readonly root = new Container();
  private views = new Map<CardId, CardView>();
  /**
   * Display-object pool for eliminated / unused cards.
   * Acquire on need; release after exit animation or when !alive and idle.
   * Caps size so a bug cannot grow forever.
   */
  private readonly pool: CardView[] = [];
  private static readonly POOL_MAX = 80;
  /** meet / snap / draw-move / recycle — isBusy (blocks new input) */
  private animating = new Set<CardId>();
  /**
   * Pair flying off after match — NOT busy (input free once 上抛 starts).
   * Still skipped by sync so !alive cards stay visible mid-flight.
   */
  private exiting = new Set<CardId>();
  /** flip / draw-flip — NOT busy, but card itself not draggable */
  private flipping = new Set<CardId>();
  /**
   * Waste cards currently under a draw-flip dim overlay.
   * Only draw-path flips use this; puzzle reveal must not dim the draw zone.
   */
  private underFlipDimIds = new Set<CardId>();
  private drawMoving = false;
  private recycleAnimating = false;
  /** Level-enter puzzle deal cascade — blocks input via isBusy */
  private dealAnimating = false;
  /** open-deal onDone fired (prevent mid-cascade first-draw) */
  private dealFinished = false;
  private dealTickCleanups: Array<() => void> = [];
  /** Optional leftover intro root (cleaned on cancel) */
  private dealSourceRoot: Container | null = null;
  /** Intent highlight ids (free match partners) */
  private hintIds = new Set<CardId>();
  /** Active drag: design-space top-left (finger grab space) */
  private dragPos = new Map<CardId, { x: number; y: number }>();
  /**
   * Drag state: finger target (logical) vs visual top-left (tiny lag).
   * Drop/hit-test in main uses pointer, not visual lag.
   */
  private dragFollow = new Map<
    CardId,
    {
      /** finger top-left (operation / logical) */
      tx: number;
      ty: number;
      /** visual top-left (slight lag only) */
      vx: number;
      vy: number;
      lastMoveT: number;
      /** EMA finger horizontal velocity (design px/s) */
      fingerVelX: number;
      rot: number;
      rotVel: number;
      scaleFrom: number;
      scaleT: number;
    }
  >();
  private dragFollowTick: ((t: { deltaMS: number }) => void) | null = null;
  private dragFollowTicker: TickerLike | null = null;
  /** Selected card idle wobble (center pivot) */
  private selectIdle: {
    id: CardId;
    baseTLX: number;
    baseTLY: number;
    zIndex: number;
    t: number;
  } | null = null;
  private selectIdleTick: ((t: { deltaMS: number }) => void) | null = null;
  private selectIdleTicker: TickerLike | null = null;

  private readonly cardHx = CARD_W / 2;
  private readonly cardHy = CARD_H / 2;

  /**
   * Keep dragged card above every static seat (and re-sort children).
   * Call every drag frame — zIndex alone can lag if sortDirty never re-fires.
   */
  private raiseDragCard(view: CardView): void {
    view.root.visible = true;
    view.root.zIndex = CARD_Z.drag;
    view.root.alpha = 1;
    if (view.root.parent === this.root) {
      // Child-order tiebreak + mark dirty for sortableChildren
      this.root.addChild(view.root);
    }
    this.root.sortChildren();
  }

  /** Place card with center pivot from layout top-left + rotation. */
  private placeFromTopLeft(
    view: CardView,
    topLeftX: number,
    topLeftY: number,
    opts?: { rot?: number; scale?: number; zIndex?: number },
  ): void {
    const hx = this.cardHx;
    const hy = this.cardHy;
    view.root.pivot.set(hx, hy);
    view.root.x = topLeftX + hx;
    view.root.y = topLeftY + hy;
    view.root.rotation = opts?.rot ?? 0;
    view.root.scale.set(opts?.scale ?? 1);
    if (opts?.zIndex != null) view.root.zIndex = opts.zIndex;
    view.root.alpha = 1;
  }

  /** Reset to layout top-left pivot (resting seat on board). */
  private placeRestTopLeft(
    view: CardView,
    topLeftX: number,
    topLeftY: number,
    opts?: { scale?: number; zIndex?: number },
  ): void {
    view.root.pivot.set(0, 0);
    view.root.x = topLeftX;
    view.root.y = topLeftY;
    view.root.rotation = 0;
    view.root.scale.set(opts?.scale ?? 1);
    if (opts?.zIndex != null) view.root.zIndex = opts.zIndex;
    view.root.alpha = 1;
  }
  /**
   * Permanent drop-shadows under stock / waste seats.
   * Always painted — stay when piles empty or cards fly away.
   */
  private stockSeatShadow = new Graphics();
  private wasteSeatShadow = new Graphics();
  /** Empty stock / waste placeholders (same size as a card) */
  private stockSlot = new Graphics();
  private wasteSlot = new Graphics();
  /**
   * Stock plate/shadow footprint peeks: locked to peak this deal
   * (empty ghost frame uses this width; does not shrink as cards drawn).
   * Reset only on bootstrap / new run.
   */
  private stockFootprintPeakVis = 0;
  /** Skip seat Graphics rebuild when footprint unchanged */
  private lastStockSeatKey = '';
  private lastWasteSeatKey = '';
  private lastStockSlotKey = '';
  private lastWasteSlotKey = '';

  constructor() {
    this.root.label = 'cards';
    this.root.sortableChildren = true;
    this.stockSeatShadow.eventMode = 'none';
    this.wasteSeatShadow.eventMode = 'none';
    this.stockSlot.eventMode = 'none';
    this.wasteSlot.eventMode = 'none';
    // Shadows under ghost plates; cards sit above (z≥50)
    this.stockSeatShadow.zIndex = CARD_Z.seatShadow;
    this.wasteSeatShadow.zIndex = CARD_Z.seatShadow;
    this.stockSlot.zIndex = CARD_Z.seatPlate;
    this.wasteSlot.zIndex = CARD_Z.seatPlate;
    this.root.addChild(
      this.stockSeatShadow,
      this.wasteSeatShadow,
      this.stockSlot,
      this.wasteSlot,
    );
  }

  /** Call after `loadCardFaceAssets()`. */
  bootstrap(state: GameState): void {
    this.cancelLevelDeal();
    // Return all live views to pool, then re-acquire only alive cards
    for (const id of [...this.views.keys()]) {
      this.releaseView(id);
    }
    this.stockFootprintPeakVis = 0;
    this.animating.clear();
    this.exiting.clear();
    this.flipping.clear();
    this.underFlipDimIds.clear();
    this.drawMoving = false;
    this.recycleAnimating = false;
    this.hintIds.clear();
    this.dragPos.clear();
    this.dragFollow.clear();
    if (this.dragFollowTick && this.dragFollowTicker) {
      this.dragFollowTicker.remove(this.dragFollowTick);
      this.dragFollowTick = null;
      this.dragFollowTicker = null;
    }
    this.stopSelectIdle();

    for (const card of Object.values(state.cards)) {
      if (!card.alive) continue;
      this.acquireView(card);
    }
    this.sync(state);
  }

  private cancelLevelDeal(): void {
    for (const clean of this.dealTickCleanups) clean();
    this.dealTickCleanups = [];
    this.dealAnimating = false;
    this.dealFinished = false;
    this.hideDealSourceDeck();
  }

  private hideDealSourceDeck(): void {
    if (this.dealSourceRoot) {
      this.dealSourceRoot.visible = false;
    }
  }

  /**
   * Level enter open deal (no center-deck intro):
   * 1) Puzzle cards fly from below screen → seats (back → free flip)
   * 2) Remaining stock cards fly from below → stock seats
   * 3) onDone → first waste flip (main)
   */
  playLevelDeal(
    state: GameState,
    ticker: TickerLike,
    onDone: () => void,
  ): void {
    this.cancelLevelDeal();

    const puzzle = Object.values(state.cards).filter(
      (c) => c.alive && c.zone === 'puzzle',
    );
    puzzle.sort((a, b) => {
      if (a.layer !== b.layer) return a.layer - b.layer;
      if (a.rect.y !== b.rect.y) return a.rect.y - b.rect.y;
      return a.rect.x - b.rect.x;
    });

    const stockIds = [...state.stock];
    const stockCards = stockIds
      .map((id) => state.cards[id])
      .filter((c): c is Card => !!c && c.alive);

    if (puzzle.length === 0 && stockCards.length === 0) {
      onDone();
      return;
    }

    const stockR = getStockRect();
    const hx = this.cardHx;
    const hy = this.cardHy;
    const moveMs = Math.max(80, PHYS.dealMoveMs);
    const settleMs = Math.max(60, PHYS.dealSettleMs);
    const toStockMs = Math.max(60, PHYS.dealToStockMs);
    const staggerStart = Math.max(20, PHYS.dealStaggerStartMs);
    const staggerEnd = Math.max(12, Math.min(staggerStart, PHYS.dealStaggerEndMs));
    const sStagger = Math.max(12, PHYS.dealToStockStaggerMs);
    /**
     * Cumulative launch delay: early gaps long, later gaps short (前慢后快).
     * easeInQuad on progress so acceleration of the cascade is clear.
     */
    const launchDelayAt = (i: number, n: number): number => {
      if (i <= 0 || n <= 1) return 0;
      let delay = 0;
      const last = n - 1;
      for (let k = 0; k < i; k++) {
        const t = last <= 1 ? 1 : k / last;
        const ease = t * t; // ease-in: stay slow longer, then speed up
        delay += staggerStart + (staggerEnd - staggerStart) * ease;
      }
      return delay;
    };
    const pauseBeforeDraw = Math.max(0, PHYS.dealPauseBeforeFirstDrawMs);
    const spawnY = DESIGN_HEIGHT + PHYS.dealIntroSpawnBelow;
    /** Single deal origin under screen center — not a bottom line */
    const spawnCx = DESIGN_WIDTH / 2;
    const spawnJitterX = PHYS.dealIntroSpawnJitterX;
    const fromScale = PHYS.dealIntroFromScale;
    const approachScale = PHYS.dealApproachScale;
    const flightTiltMax = (PHYS.dealIntroTiltMaxDeg * Math.PI) / 180;
    const landTiltMin = (PHYS.dealLandTiltMinDeg * Math.PI) / 180;
    const landTiltMax = (PHYS.dealLandTiltMaxDeg * Math.PI) / 180;
    const overshootPx = PHYS.dealOvershootPx;
    const overshootScaleBoost = PHYS.dealOvershootScaleBoost;
    const flightStretch = Math.max(0, Math.min(0.4, PHYS.dealFlightStretch));

    this.dealAnimating = true;
    this.hideDealSourceDeck();

    const allAnimIds = new Set<CardId>([
      ...puzzle.map((c) => c.id),
      ...stockIds,
    ]);
    this.sync(state, allAnimIds);

    // Pre-create views at single bottom origin (hidden until launch)
    for (const card of [...puzzle, ...stockCards]) {
      let view = this.views.get(card.id);
      if (!view) view = this.acquireView(card);
      this.animating.add(card.id);
      view.root.visible = false;
      view.root.pivot.set(hx, hy);
      view.root.x = spawnCx;
      view.root.y = spawnY;
      view.root.scale.set(fromScale);
      this.showBack(view, CARD_W, CARD_H, { shadow: false });
    }

    const schedule = (delayMs: number, fn: () => void) => {
      if (delayMs <= 0) {
        fn();
        return;
      }
      let waited = 0;
      const tick = (a: { deltaMS: number }) => {
        waited += a.deltaMS;
        if (waited < delayMs) return;
        ticker.remove(tick);
        fn();
      };
      ticker.add(tick);
      this.dealTickCleanups.push(() => ticker.remove(tick));
    };

    const puzzlePending = new Set(puzzle.map((c) => c.id));
    const stockPending = new Set(stockIds);
    let phase: 'wait' | 'puzzle' | 'stock' | 'done' = 'wait';

    /** All cards leave from one bottom-center point (fan to targets). */
    const spawnFromBottom = () => {
      const jx = (Math.random() * 2 - 1) * spawnJitterX;
      return {
        x: spawnCx + jx,
        y: spawnY,
        scale: fromScale,
      };
    };

    /**
     * Fly: ease-out + varied spin → approach with residual angle.
     * Settle: overshoot past seat + scale punch, then snap back, shrink, straighten.
     */
    const flyTo = (
      id: CardId,
      from: { x: number; y: number; scale: number },
      to: {
        x: number;
        y: number;
        scale: number;
        restTL?: { x: number; y: number };
        restZ?: number;
      },
      duration: number,
      zBase: number,
      onArrive: () => void,
    ) => {
      const view = this.views.get(id);
      if (!view) {
        onArrive();
        return;
      }
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        onArrive();
      };

      // Independent peak vs land tilt so cards don't all look the same
      const peakSign = Math.random() < 0.5 ? -1 : 1;
      const landSign =
        Math.random() < 0.35 ? -peakSign : peakSign; // sometimes reverse on land
      const tiltPeak =
        peakSign * flightTiltMax * (0.4 + Math.random() * 0.6);
      const landTilt =
        landSign *
        (landTiltMin + Math.random() * (landTiltMax - landTiltMin));
      const sApproach = approachScale * (0.92 + Math.random() * 0.16);
      // Flight direction for overshoot
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = dx / len;
      const ny = dy / len;
      const oPx = overshootPx * (0.75 + Math.random() * 0.5);
      const overX = to.x + nx * oPx;
      const overY = to.y + ny * oPx;
      const sOver =
        sApproach + overshootScaleBoost * (0.7 + Math.random() * 0.6);
      // Per-card spin phase (fixed for this flight)
      const spinPhase = 0.72 + Math.random() * 0.4;

      this.animating.add(id);
      view.root.visible = true;
      view.root.pivot.set(hx, hy);
      view.root.x = from.x;
      view.root.y = from.y;
      view.root.scale.set(from.scale);
      view.root.rotation = 0;
      view.root.zIndex = zBase;
      this.showBack(view, CARD_W, CARD_H, { shadow: true });

      let t = 0;
      const tickFly = (arg: { deltaMS: number }) => {
        t += arg.deltaMS;
        const u = Math.min(1, t / duration);
        const e = easeOutQuad(u);
        view.root.x = from.x + (to.x - from.x) * e;
        view.root.y = from.y + (to.y - from.y) * e;
        const s = from.scale + (sApproach - from.scale) * e;
        // Mid-flight stretch along local Y (拉长), slight X squash
        const stretchWave = Math.sin(Math.PI * u); // 0→1→0
        const sy = s * (1 + flightStretch * stretchWave);
        const sx = s * (1 - flightStretch * stretchWave * 0.45);
        view.root.scale.set(sx, sy);
        const spinShape = Math.sin(Math.PI * Math.min(1, u * spinPhase));
        view.root.rotation =
          tiltPeak * spinShape * (1 - e * 0.25) + landTilt * e;
        view.root.zIndex = zBase;
        if (u >= 1) {
          ticker.remove(tickFly);
          // Settle: light pos overshoot + smooth scale shrink + angle correct
          // Scale uses one continuous easeInOut over full settle (no abrupt drop)
          const xA = to.x;
          const yA = to.y;
          const rA = landTilt;
          const sA = sApproach;
          let ts = 0;
          const tickSettle = (a: { deltaMS: number }) => {
            ts += a.deltaMS;
            const u2 = Math.min(1, ts / settleMs);
            // Position: soft overshoot then return (smoothstep, not back-ease snap)
            let px: number;
            let py: number;
            if (u2 < 0.38) {
              const p = easeOutQuad(u2 / 0.38);
              px = xA + (overX - xA) * p;
              py = yA + (overY - yA) * p;
            } else {
              const p = easeInOutSmooth((u2 - 0.38) / 0.62);
              px = overX + (to.x - overX) * p;
              py = overY + (to.y - overY) * p;
            }
            // Scale: continuous big→1 (uniform), stretch already gone at land
            const sEase = easeInOutSmooth(u2);
            const base = sA + (1 - sA) * sEase;
            const bump =
              (sOver - sA) * Math.sin(Math.PI * Math.min(1, u2 * 1.1)) * 0.45;
            const sNow = base + bump * (1 - sEase);
            const rNow = rA * (1 - sEase);
            view.root.x = px;
            view.root.y = py;
            view.root.scale.set(sNow, sNow);
            view.root.rotation = rNow;
            view.root.zIndex = zBase;
            if (u2 >= 1) {
              ticker.remove(tickSettle);
              view.root.rotation = 0;
              view.root.scale.set(1);
              if (to.restTL != null && to.restZ != null) {
                this.placeRestTopLeft(view, to.restTL.x, to.restTL.y, {
                  scale: 1,
                  zIndex: to.restZ,
                });
              } else {
                view.root.x = to.x;
                view.root.y = to.y;
              }
              finish();
            }
          };
          ticker.add(tickSettle);
          this.dealTickCleanups.push(() => ticker.remove(tickSettle));
        }
      };
      ticker.add(tickFly);
      this.dealTickCleanups.push(() => {
        ticker.remove(tickFly);
        this.animating.delete(id);
      });
    };

    const seatPuzzleCard = (card: Card, restZ: number, faceUp: boolean) => {
      const v = this.views.get(card.id);
      if (!v) return;
      this.placeRestTopLeft(v, card.rect.x, card.rect.y, {
        scale: 1,
        zIndex: restZ,
      });
      if (faceUp) this.showFace(v, card, CARD_W, CARD_H, false, { shadow: true });
      else this.showBack(v, CARD_W, CARD_H, { shadow: true });
    };

    const handOffToFirstDraw = () => {
      if (this.dealFinished) return;
      if (phase !== 'stock') return;
      if (puzzlePending.size > 0 || stockPending.size > 0) return;
      this.dealFinished = true;
      phase = 'done';
      for (const clean of this.dealTickCleanups) clean();
      this.dealTickCleanups = [];
      this.hideDealSourceDeck();
      this.dealAnimating = false;
      onDone();
    };

    const runStockReturn = () => {
      if (phase !== 'puzzle') return;
      if (puzzlePending.size > 0) return;
      phase = 'stock';
      if (stockIds.length === 0) {
        schedule(pauseBeforeDraw, handOffToFirstDraw);
        return;
      }
      // Deep first so stock[0] (top) lands last
      const order = [...stockIds].reverse();
      for (let i = 0; i < order.length; i++) {
        const id = order[i]!;
        const stockIndex = stockIds.indexOf(id);
        const off = stockStackOffset(
          Math.min(stockIndex, STOCK_STACK_MAX_VISIBLE - 1),
        );
        const endTLX = stockR.x + off.x;
        const endTLY = stockR.y + off.y;
        const n = stockIds.length;
        const endCx = endTLX + hx;
        schedule(i * sStagger, () => {
          if (phase !== 'stock') return;
          const from = spawnFromBottom();
          flyTo(
            id,
            from,
            {
              x: endCx,
              y: endTLY + hy,
              scale: 1,
              restTL: { x: endTLX, y: endTLY },
              restZ: stockZ(n, stockIndex),
            },
            toStockMs,
            CARD_Z.draw + i,
            () => {
              this.animating.delete(id);
              const v = this.views.get(id);
              if (v) {
                this.placeRestTopLeft(v, endTLX, endTLY, {
                  scale: 1,
                  zIndex: stockZ(n, stockIndex),
                });
                this.showBack(v, CARD_W, CARD_H, { shadow: false });
                if (stockIndex >= STOCK_STACK_MAX_VISIBLE) {
                  v.root.visible = false;
                }
              }
              if (!stockPending.delete(id)) return;
              if (stockPending.size === 0) {
                schedule(pauseBeforeDraw, handOffToFirstDraw);
              }
            },
          );
        });
      }
    };

    const markPuzzleDone = (id: CardId) => {
      if (phase !== 'puzzle') return;
      if (!puzzlePending.delete(id)) return;
      if (puzzlePending.size === 0) runStockReturn();
    };

    const runPuzzleDeal = () => {
      if (phase !== 'wait') return;
      phase = 'puzzle';
      if (puzzle.length === 0) {
        runStockReturn();
        return;
      }

      const nP = puzzle.length;
      for (let i = 0; i < nP; i++) {
        const card = puzzle[i]!;
        schedule(launchDelayAt(i, nP), () => {
          if (phase !== 'puzzle') return;
          const endX = card.rect.x + hx;
          const endY = card.rect.y + hy;
          const restZ = card.layer * 10;
          const from = spawnFromBottom();
          flyTo(
            card.id,
            from,
            {
              x: endX,
              y: endY,
              scale: 1,
              restTL: { x: card.rect.x, y: card.rect.y },
              restZ,
            },
            moveMs,
            CARD_Z.meetFlyer + 40 + i,
            () => {
              this.animating.delete(card.id);
              const free = isFree(state, card.id);
              if (free) {
                this.animating.add(card.id);
                this.flipToFace(
                  [card.id],
                  state,
                  () => {
                    this.animating.delete(card.id);
                    seatPuzzleCard(card, restZ, true);
                    markPuzzleDone(card.id);
                  },
                  ticker,
                  true,
                  {
                    hingeXRatio: 0.5,
                    breathPeak: PHYS.flipBreath,
                    dimWasteUnder: false,
                  },
                );
              } else {
                seatPuzzleCard(card, restZ, false);
                markPuzzleDone(card.id);
              }
            },
          );
        });
      }
    };

    runPuzzleDeal();
  }

  /**
   * Ghost frame when pile is empty — same size as a card (no own shadow;
   * seat shadows are painted separately and always stay).
   */
  private paintEmptySlot(
    g: Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    which: 'stock' | 'waste',
  ): void {
    const key = `${x | 0},${y | 0},${w | 0},${h | 0}`;
    if (which === 'stock' && key === this.lastStockSlotKey && g.visible) return;
    if (which === 'waste' && key === this.lastWasteSlotKey && g.visible) return;
    if (which === 'stock') this.lastStockSlotKey = key;
    else this.lastWasteSlotKey = key;

    g.clear();
    g.visible = true;
    g.zIndex = CARD_Z.seatPlate;
    g.roundRect(x, y, w, h, RADIUS);
    g.fill({ color: 0x2c3540, alpha: 0.1 });
    g.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, RADIUS - 0.5);
    g.stroke({
      width: 1.5,
      color: 0x2c3540,
      alpha: 0.18,
      alignment: 0.5,
    });
  }

  /**
   * Shared seat drop-shadow under stock/waste piles.
   * Base rect = stack footprint; applies card-shadow offset/scale/alpha once
   * (not per-card).
   */
  private paintSeatShadow(
    g: Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    which: 'stock' | 'waste',
  ): void {
    const { offsetX, offsetY, scale, alpha } = getCardShadowParams();
    const key = `${x | 0},${y | 0},${w | 0},${h | 0},${scale},${alpha},${offsetX},${offsetY}`;
    if (which === 'stock' && key === this.lastStockSeatKey && g.visible) return;
    if (which === 'waste' && key === this.lastWasteSeatKey && g.visible) return;
    if (which === 'stock') this.lastStockSeatKey = key;
    else this.lastWasteSeatKey = key;

    g.clear();
    g.visible = true;
    const sw = w * scale;
    const sh = h * scale;
    const sx = x + (w - sw) / 2 + offsetX;
    const sy = y + (h - sh) / 2 + offsetY;
    const r = RADIUS * scale;
    g.roundRect(sx, sy, sw, sh, r);
    g.fill({ color: 0x2c3540, alpha });
  }

  /** Update peak visible stock count for plate width (never shrink mid-deal). */
  private noteStockFootprint(state: GameState): void {
    const n = state.stock.length;
    if (n <= 0) return;
    const cur = Math.min(n, STOCK_STACK_MAX_VISIBLE);
    this.stockFootprintPeakVis = Math.max(this.stockFootprintPeakVis, cur);
  }

  /**
   * Left-expanded stock rect for `vis` cards (peek stack).
   * `vis` 0 → single-card seat (empty); otherwise min(vis, max visible).
   */
  private stockFootprintForVis(
    stock: { x: number; y: number; w: number; h: number },
    vis: number,
  ): { x: number; y: number; w: number; h: number } {
    const n = Math.max(1, Math.min(Math.max(0, vis), STOCK_STACK_MAX_VISIBLE));
    const peeks = Math.max(0, n - 1);
    const peekPx = Math.abs(getStockStackDx());
    return {
      x: stock.x - peeks * peekPx,
      y: stock.y,
      w: stock.w + peeks * peekPx,
      h: stock.h,
    };
  }

  /** Plate uses peak width this deal (does not shrink as cards drawn). */
  private stockPlateFootprint(stock: {
    x: number;
    y: number;
    w: number;
    h: number;
  }): { x: number; y: number; w: number; h: number } {
    return this.stockFootprintForVis(stock, Math.max(this.stockFootprintPeakVis, 1));
  }

  /**
   * Shared stock/waste shadows — only while the pile has cards.
   * Stock width tracks current visible count (grows & shrinks).
   */
  private syncPileSeatShadows(state: GameState): void {
    this.noteStockFootprint(state);
    const stock = getStockRect();
    const waste = getWasteRect();

    if (state.stock.length > 0) {
      const stockVis = Math.min(state.stock.length, STOCK_STACK_MAX_VISIBLE);
      const stockFp = this.stockFootprintForVis(stock, stockVis);
      this.paintSeatShadow(
        this.stockSeatShadow,
        stockFp.x,
        stockFp.y,
        stockFp.w,
        stockFp.h,
        'stock',
      );
    } else {
      this.stockSeatShadow.clear();
      this.stockSeatShadow.visible = false;
      this.lastStockSeatKey = '';
    }

    if (state.waste.length > 0) {
      this.paintSeatShadow(
        this.wasteSeatShadow,
        waste.x,
        waste.y,
        waste.w,
        waste.h,
        'waste',
      );
    } else {
      this.wasteSeatShadow.clear();
      this.wasteSeatShadow.visible = false;
      this.lastWasteSeatKey = '';
    }
  }

  private syncEmptySlots(state: GameState): void {
    // Shared seat shadows first (width tracks live stock count)
    this.syncPileSeatShadows(state);

    const stock = getStockRect();
    const waste = getWasteRect();

    // Always show seat plates (with or without cards)
    const plateFp = this.stockPlateFootprint(stock);
    this.paintEmptySlot(
      this.stockSlot,
      plateFp.x,
      plateFp.y,
      plateFp.w,
      plateFp.h,
      'stock',
    );
    this.paintEmptySlot(
      this.wasteSlot,
      waste.x,
      waste.y,
      waste.w,
      waste.h,
      'waste',
    );
  }

  /** Create a fresh display shell (not yet in `views`). */
  private createViewShell(): CardView {
    const root = new Container();
    root.eventMode = 'none';

    const shadow = new Sprite(getShadowTexture());
    shadow.roundPixels = false;
    shadow.anchor.set(0.5);
    shadow.tint = 0x2c3540;
    shadow.eventMode = 'none';

    const back = new Sprite(getBackTexture());
    back.roundPixels = false;
    const face = new Sprite(getFaceTexture('H', 'A'));
    face.roundPixels = false;
    const frame = new Graphics();
    frame.eventMode = 'none';
    const dim = new Graphics();
    dim.visible = false;
    dim.eventMode = 'none';

    root.addChild(shadow, back, face, frame, dim);
    return {
      root,
      shadow,
      back,
      face,
      frame,
      dim,
      cardId: '' as CardId,
      baseY: 0,
      faceRimReady: false,
      dimShapeReady: false,
    };
  }

  /** Bind shell to a logical card and register in `views`. */
  private acquireView(card: Card): CardView {
    const view = this.pool.pop() ?? this.createViewShell();
    view.cardId = card.id;
    view.root.label = card.id;
    view.baseY = 0;
    view.face.texture = getFaceTexture(card.suit, card.rank);
    view.back.texture = getBackTexture();
    view.shadow.texture = getShadowTexture();
    view.shadow.visible = false;
    view.face.visible = false;
    view.back.visible = false;
    view.frame.visible = false;
    view.dim.visible = false;
    view.dim.alpha = 1;
    view.root.visible = true;
    view.root.alpha = 1;
    view.root.scale.set(1);
    view.root.rotation = 0;
    view.root.pivot.set(0, 0);
    view.root.x = 0;
    view.root.y = 0;
    view.root.zIndex = 0;
    if (view.root.parent !== this.root) {
      this.root.addChild(view.root);
    }
    this.views.set(card.id, view);
    return view;
  }

  /**
   * Detach view from active map and return to pool (or destroy if pool full).
   * Safe if id already released.
   */
  private releaseView(id: CardId): void {
    const view = this.views.get(id);
    if (!view) return;

    this.views.delete(id);
    this.animating.delete(id);
    this.exiting.delete(id);
    this.flipping.delete(id);
    this.underFlipDimIds.delete(id);
    this.hintIds.delete(id);
    this.dragPos.delete(id);
    this.dragFollow.delete(id);
    if (this.selectIdle?.id === id) this.stopSelectIdle();

    view.root.visible = false;
    view.root.alpha = 1;
    view.root.scale.set(1);
    view.root.rotation = 0;
    view.root.pivot.set(0, 0);
    view.root.x = 0;
    view.root.y = 0;
    view.shadow.visible = false;
    view.face.visible = false;
    view.back.visible = false;
    view.frame.visible = false;
    view.dim.visible = false;
    view.dim.alpha = 1;
    view.cardId = '' as CardId;
    view.root.label = 'pooled';

    if (view.root.parent) {
      view.root.parent.removeChild(view.root);
    }

    if (this.pool.length < CardRenderer.POOL_MAX) {
      this.pool.push(view);
    } else {
      try {
        view.root.destroy({ children: true });
      } catch {
        /* ignore */
      }
    }
  }

  /** Debug / tests */
  get activeViewCount(): number {
    return this.views.size;
  }

  get pooledViewCount(): number {
    return this.pool.length;
  }

  /** Place shared shadow sprite from cardShadowRuntime params. */
  private layoutCardShadow(
    view: CardView,
    w: number,
    h: number,
    show: boolean,
  ): void {
    if (!show) {
      view.shadow.visible = false;
      return;
    }
    const { offsetX, offsetY, scale, alpha } = getCardShadowParams();
    view.shadow.visible = true;
    view.shadow.texture = getShadowTexture();
    view.shadow.width = w * scale;
    view.shadow.height = h * scale;
    view.shadow.x = w / 2 + offsetX;
    view.shadow.y = h / 2 + offsetY;
    view.shadow.alpha = alpha;
  }

  /** Dim geometry with fill alpha 1; fade via dim.alpha */
  private ensureCardDimShape(view: CardView): void {
    if (!view.dimShapeReady) {
      view.dim.clear();
      view.dim.roundRect(0, 0, CARD_W, CARD_H, RADIUS);
      view.dim.fill({ color: 0x000000, alpha: 1 });
      view.dimShapeReady = true;
    }
    view.dim.visible = true;
  }

  private setCardDim(view: CardView, on: boolean, alpha?: number): void {
    if (!on) {
      this.underFlipDimIds.delete(view.cardId);
      view.dim.alpha = 1;
      view.dim.visible = false;
      return;
    }
    this.underFlipDimIds.add(view.cardId);
    this.ensureCardDimShape(view);
    view.dim.alpha = alpha ?? PHYS.flipUnderDimAlpha;
  }

  /** Clear residual dim unless this card is actively under a draw-flip overlay. */
  private clearDimUnlessUnderFlip(view: CardView): void {
    if (this.underFlipDimIds.has(view.cardId)) return;
    if (!view.dim.visible && view.dim.alpha === 1) return;
    view.dim.alpha = 1;
    view.dim.visible = false;
  }

  /**
   * Baked textures are already CARD_W×CARD_H logical size (see cardAssets).
   * Assign 1:1 to the slot — no extra GPU stretch.
   */
  private layoutSprite(spr: Sprite, w: number, h: number): void {
    spr.x = 0;
    spr.y = 0;
    spr.width = w;
    spr.height = h;
    spr.tint = 0xffffff;
    spr.alpha = 1;
  }

  private ensureFaceRim(view: CardView, w: number, h: number): void {
    if (view.faceRimReady) return;
    view.frame.clear();
    view.frame.roundRect(0.5, 0.5, w - 1, h - 1, RADIUS - 0.5);
    view.frame.stroke({
      width: 1.1,
      color: Theme.faceStroke,
      alpha: 0.4,
      alignment: 0.5,
    });
    view.faceRimReady = true;
  }

  private showFace(
    view: CardView,
    card: Card,
    w: number,
    h: number,
    _selected: boolean,
    opts?: { shadow?: boolean },
  ): void {
    this.layoutCardShadow(view, w, h, opts?.shadow !== false);
    this.clearDimUnlessUnderFlip(view);
    view.back.visible = false;
    view.face.visible = true;
    view.face.texture = getFaceTexture(card.suit, card.rank);
    this.layoutSprite(view.face, w, h);
    this.ensureFaceRim(view, w, h);
    view.frame.visible = true;
  }

  private showBack(
    view: CardView,
    w: number,
    h: number,
    opts?: { shadow?: boolean },
  ): void {
    this.layoutCardShadow(view, w, h, opts?.shadow !== false);
    this.clearDimUnlessUnderFlip(view);
    view.face.visible = false;
    view.back.visible = true;
    view.back.texture = getBackTexture();
    this.layoutSprite(view.back, w, h);
    view.frame.visible = false;
  }

  /** Home (layout) top-left for a card after last sync, or from state. */
  getHomePosition(
    state: GameState,
    id: CardId,
  ): { x: number; y: number; w: number; h: number } | null {
    const card = state.cards[id];
    if (!card || !card.alive) return null;
    if (card.zone === 'stock') {
      const idx = state.stock.indexOf(id);
      if (idx < 0 || idx >= STOCK_STACK_MAX_VISIBLE) return null;
      const stock = getStockRect();
      const off = stockStackOffset(idx);
      return {
        x: stock.x + off.x,
        y: stock.y + off.y,
        w: stock.w,
        h: stock.h,
      };
    }
    if (card.zone === 'waste') {
      const waste = getWasteRect();
      const top = state.waste[state.waste.length - 1];
      if (id !== top) return null;
      return { x: waste.x, y: waste.y, w: waste.w, h: waste.h };
    }
    return {
      x: card.rect.x,
      y: card.rect.y,
      w: card.rect.w,
      h: card.rect.h,
    };
  }

  /**
   * Drag: finger target updates immediately (operation).
   * Visual top-left has tiny lag; rotation about **card center**, amplitude ∝ swipe speed.
   */
  setDragPosition(
    id: CardId,
    x: number,
    y: number,
    ticker?: TickerLike,
  ): void {
    this.hintIds.delete(id);
    // Dragging overrides select idle
    if (this.selectIdle?.id === id) this.stopSelectIdle();
    const view = this.views.get(id);
    if (!view) return;
    // Never keep flip-under dim on a dragged card
    this.setCardDim(view, false);

    const now = performance.now();
    let st = this.dragFollow.get(id);
    if (!st) {
      const scaleFrom = view.root.scale.x || 1;
      st = {
        tx: x,
        ty: y,
        vx: x,
        vy: y,
        lastMoveT: now,
        fingerVelX: 0,
        rot: 0,
        rotVel: 0,
        scaleFrom,
        scaleT: 0,
      };
      this.dragFollow.set(id, st);
      this.placeFromTopLeft(view, x, y, {
        rot: 0,
        scale: scaleFrom,
        zIndex: CARD_Z.drag,
      });
      this.raiseDragCard(view);
      this.layoutCardShadow(view, CARD_W, CARD_H, true);
      // Logical pos = finger (sync/hit paths that read dragPos stay operational)
      this.dragPos.set(id, { x, y });
      if (ticker) this.ensureDragFollowTick(ticker);
      return;
    }
    const moveDt = (now - st.lastMoveT) / 1000;
    if (moveDt > 0.002 && moveDt < 0.08) {
      const instVx = (x - st.tx) / moveDt;
      const a = 0.45;
      st.fingerVelX = st.fingerVelX * (1 - a) + instVx * a;
    }
    st.lastMoveT = now;
    st.tx = x;
    st.ty = y;
    this.dragPos.set(id, { x, y });
    // Pointer moves can outrun ticker for a frame — keep z on top immediately
    this.raiseDragCard(view);
    if (ticker) this.ensureDragFollowTick(ticker);
  }

  private dragScaleAt(st: {
    scaleFrom: number;
    scaleT: number;
  }): number {
    const dur = Math.max(1, PHYS.dragScaleMs);
    const u = Math.min(1, st.scaleT / dur);
    const ease = 1 - (1 - u) * (1 - u); // ease-out
    return st.scaleFrom + (PHYS.dragScale - st.scaleFrom) * ease;
  }

  private ensureDragFollowTick(ticker: TickerLike): void {
    if (this.dragFollowTick) return;
    this.dragFollowTicker = ticker;
    const tick = (arg: { deltaMS: number }) => {
      if (this.dragFollow.size === 0) {
        ticker.remove(tick);
        this.dragFollowTick = null;
        this.dragFollowTicker = null;
        return;
      }
      const dtSec = Math.min(0.05, Math.max(0.001, arg.deltaMS / 1000));
      const steps = Math.min(3, Math.max(0.5, arg.deltaMS / 16.67));
      const posA = 1 - Math.pow(1 - PHYS.dragVisualFollow, steps);
      const maxTilt = (PHYS.dragTiltMaxDeg * Math.PI) / 180;
      const k = PHYS.dragTiltSpring;
      const c = PHYS.dragTiltDamp;
      const refSpd = Math.max(1, PHYS.dragTiltRefSpeed);

      for (const [id, st] of this.dragFollow) {
        const view = this.views.get(id);
        if (!view) continue;

        st.scaleT += arg.deltaMS;

        // Decay finger vel if no recent move samples (stop → 回正)
        const stale = performance.now() - st.lastMoveT;
        if (stale > 32) {
          st.fingerVelX *= Math.pow(0.88, steps);
        }

        // Very slight visual lag (display only)
        st.vx += (st.tx - st.vx) * posA;
        st.vy += (st.ty - st.vy) * posA;

        // Amplitude scales with |speed|: slow → small tilt, fast → up to max
        const speed = Math.abs(st.fingerVelX);
        const t = Math.min(1, speed / refSpd);
        const amp01 = t * t * (3 - 2 * t);
        const sign =
          st.fingerVelX === 0 ? 0 : st.fingerVelX > 0 ? 1 : -1;
        const targetRot = sign * maxTilt * amp01;

        const err = targetRot - st.rot;
        st.rotVel += (err * k - st.rotVel * c) * dtSec;
        st.rot += st.rotVel * dtSec;
        if (st.rot > maxTilt * 1.12) {
          st.rot = maxTilt * 1.12;
          st.rotVel *= 0.35;
        } else if (st.rot < -maxTilt * 1.12) {
          st.rot = -maxTilt * 1.12;
          st.rotVel *= 0.35;
        }

        this.placeFromTopLeft(view, st.vx, st.vy, {
          rot: st.rot,
          scale: this.dragScaleAt(st),
          zIndex: CARD_Z.drag,
        });
        this.raiseDragCard(view);
        // Keep dragPos on finger so any reader of dragPos stays operational
        this.dragPos.set(id, { x: st.tx, y: st.ty });
      }
    };
    this.dragFollowTick = tick;
    ticker.add(tick);
  }

  clearDrag(id: CardId): void {
    this.dragPos.delete(id);
    this.dragFollow.delete(id);
    if (this.dragFollow.size === 0 && this.dragFollowTick && this.dragFollowTicker) {
      this.dragFollowTicker.remove(this.dragFollowTick);
      this.dragFollowTick = null;
      this.dragFollowTicker = null;
    }
    // Do not hard-zero rotation here — snapBack / match capture keep tilt
  }

  isDragging(id?: CardId): boolean {
    if (id != null) return this.dragPos.has(id);
    return this.dragPos.size > 0;
  }

  /** Clear intent highlights (call after match / deselect). */
  clearHints(): void {
    this.hintIds.clear();
    this.stopSelectIdle();
  }

  /**
   * Keep a gentle idle wobble on the selected card (center pivot).
   * Call after sync/refresh. Stops when no selection / dragging / busy.
   */
  syncSelectIdle(state: GameState, ticker: TickerLike): void {
    const id = state.selectedId;
    if (
      id == null ||
      this.dragPos.has(id) ||
      this.animating.has(id) ||
      this.flipping.has(id)
    ) {
      this.stopSelectIdle();
      return;
    }
    const view = this.views.get(id);
    const card = state.cards[id];
    if (!view || !card?.alive || !isFree(state, id)) {
      this.stopSelectIdle();
      return;
    }

    let baseTLX: number;
    let baseTLY: number;
    let zIndex: number;

    if (card.zone === 'stock') {
      const idx = state.stock.indexOf(id);
      if (idx !== 0) {
        this.stopSelectIdle();
        return;
      }
      const stock = getStockRect();
      const off = stockStackOffset(0);
      baseTLX = stock.x + off.x;
      baseTLY = stock.y + off.y - PHYS.floatY;
      zIndex = CARD_Z.selectSeat;
    } else if (card.zone === 'waste') {
      const waste = getWasteRect();
      const top = state.waste[state.waste.length - 1];
      if (id !== top) {
        this.stopSelectIdle();
        return;
      }
      baseTLX = waste.x;
      baseTLY = waste.y - PHYS.floatY;
      zIndex = CARD_Z.selectSeat;
    } else {
      baseTLX = card.rect.x;
      baseTLY = card.rect.y - PHYS.floatY;
      zIndex = CARD_Z.selectPuzzle + card.layer * 10;
    }

    if (!this.selectIdle || this.selectIdle.id !== id) {
      this.selectIdle = {
        id,
        baseTLX,
        baseTLY,
        zIndex,
        t: 0,
      };
    } else {
      this.selectIdle.baseTLX = baseTLX;
      this.selectIdle.baseTLY = baseTLY;
      this.selectIdle.zIndex = zIndex;
    }
    this.ensureSelectIdleTick(ticker);
  }

  private stopSelectIdle(): void {
    if (this.selectIdleTick && this.selectIdleTicker) {
      this.selectIdleTicker.remove(this.selectIdleTick);
    }
    this.selectIdleTick = null;
    this.selectIdleTicker = null;
    this.selectIdle = null;
  }

  private ensureSelectIdleTick(ticker: TickerLike): void {
    if (this.selectIdleTick) return;
    this.selectIdleTicker = ticker;
    const tick = (arg: { deltaMS: number }) => {
      const idle = this.selectIdle;
      if (!idle) {
        ticker.remove(tick);
        this.selectIdleTick = null;
        this.selectIdleTicker = null;
        return;
      }
      if (
        this.dragPos.has(idle.id) ||
        this.animating.has(idle.id) ||
        this.flipping.has(idle.id)
      ) {
        this.stopSelectIdle();
        return;
      }
      const view = this.views.get(idle.id);
      if (!view) {
        this.stopSelectIdle();
        return;
      }
      idle.t += arg.deltaMS;
      const t = idle.t / 1000;
      const period = PHYS.selectWobblePeriodMs / 1000;
      const w1 = (Math.PI * 2) / period;
      const w2 = w1 * 1.37;
      const w3 = w1 * 0.73;
      const dx = PHYS.selectWobbleAmpX * Math.sin(w1 * t);
      const dy = PHYS.selectWobbleAmpY * Math.sin(w2 * t + 0.7);
      const rot =
        ((PHYS.selectWobbleAmpRotDeg * Math.PI) / 180) *
        Math.sin(w3 * t + 1.1);
      this.placeFromTopLeft(
        view,
        idle.baseTLX + dx,
        idle.baseTLY + dy,
        {
          rot,
          scale: PHYS.floatScale,
          zIndex: idle.zIndex,
        },
      );
    };
    this.selectIdleTick = tick;
    ticker.add(tick);
  }

  /**
   * Intent highlight: free partners that can match `selectedId`.
   * At most PHYS.hintMaxCards, nearest first.
   */
  setMatchHints(state: GameState, selectedId: CardId | null): void {
    this.hintIds.clear();
    if (selectedId == null) return;
    const sel = state.cards[selectedId];
    if (!sel || !sel.alive) return;
    const cx = sel.rect.x + sel.rect.w / 2;
    const cy = sel.rect.y + sel.rect.h / 2;
    const candidates: { id: CardId; d: number }[] = [];
    for (const id of freeCardIds(state)) {
      if (id === selectedId) continue;
      const c = state.cards[id];
      if (!c || !canMatchCards(sel, c)) continue;
      const dx = c.rect.x + c.rect.w / 2 - cx;
      const dy = c.rect.y + c.rect.h / 2 - cy;
      candidates.push({ id, d: dx * dx + dy * dy });
    }
    candidates.sort((a, b) => a.d - b.d);
    for (const c of candidates.slice(0, PHYS.hintMaxCards)) {
      this.hintIds.add(c.id);
    }
  }

  /**
   * Animate card back to home layout position, then clear drag.
   */
  snapBack(
    id: CardId,
    home: { x: number; y: number },
    onDone: () => void,
    ticker: TickerLike,
  ): void {
    const view = this.views.get(id);
    if (!view) {
      this.dragPos.delete(id);
      onDone();
      return;
    }
    this.animating.add(id);
    this.dragFollow.delete(id);
    // Animate in center-space (convention: rot about card mid)
    const c0 = this.viewCenterOf(view);
    const hx = this.cardHx;
    const hy = this.cardHy;
    view.root.pivot.set(hx, hy);
    view.root.x = c0.x;
    view.root.y = c0.y;
    this.raiseDragCard(view);
    const startX = c0.x;
    const startY = c0.y;
    const endX = home.x + hx;
    const endY = home.y + hy;
    const startS = view.root.scale.x || PHYS.dragScale;
    const startR = view.root.rotation;
    let t = 0;
    const duration = PHYS.snapMs;
    const tick = (arg: { deltaMS: number }) => {
      t += arg.deltaMS;
      const u = Math.min(1, t / duration);
      const ease = easeOutQuad(u);
      view.root.x = startX + (endX - startX) * ease;
      view.root.y = startY + (endY - startY) * ease;
      view.root.scale.set(startS + (1 - startS) * ease);
      this.raiseDragCard(view);
      // 回正带轻微晃动：衰减 × 余弦过冲
      const decay = Math.exp(-3.4 * u);
      const wobble = Math.cos(u * Math.PI * PHYS.snapRotWobble);
      view.root.rotation = startR * decay * wobble;
      if (u >= 1) {
        ticker.remove(tick);
        this.animating.delete(id);
        this.dragPos.delete(id);
        this.placeRestTopLeft(view, home.x, home.y, { scale: 1 });
        onDone();
      }
    };
    ticker.add(tick);
  }

  /** Card visual center in design px (pivot + scale aware). */
  getViewCenter(id: CardId): { x: number; y: number } | null {
    const view = this.views.get(id);
    if (!view) return null;
    return this.viewCenterOf(view);
  }

  /** Parent-space center of a card view (accounts for pivot + scale). */
  private viewCenterOf(view: CardView): { x: number; y: number } {
    const sx = view.root.scale.x || 1;
    const sy = view.root.scale.y || 1;
    return {
      x: view.root.x + (CARD_W / 2 - view.root.pivot.x) * sx,
      y: view.root.y + (CARD_H / 2 - view.root.pivot.y) * sy,
    };
  }

  /**
   * Freeze current on-screen poses (call at pointer-up / second tap BEFORE
   * clearDrag / sync — this is the animation start).
   */
  capturePoses(ids: CardId[]): CardPose[] {
    const out: CardPose[] = [];
    for (const id of ids) {
      const view = this.views.get(id);
      if (!view || !view.root.visible) continue;
      const c = this.viewCenterOf(view);
      out.push({
        id,
        cx: c.x,
        cy: c.y,
        scale: view.root.scale.x || 1,
        rotation: view.root.rotation,
      });
    }
    return out;
  }

  /**
   * Force cards to captured poses with center pivot (no visual jump).
   * Also marks them animating so sync cannot hide/move them.
   */
  applyMatchStartPoses(poses: CardPose[]): void {
    for (const p of poses) {
      const view = this.views.get(p.id);
      if (!view) continue;
      this.animating.add(p.id);
      view.root.visible = true;
      view.root.alpha = 1;
      view.root.pivot.set(CARD_W / 2, CARD_H / 2);
      view.root.x = p.cx;
      view.root.y = p.cy;
      view.root.scale.set(p.scale);
      view.root.rotation = p.rotation;
      view.root.zIndex = CARD_Z.matchStart;
    }
  }

  /**
   * Rebase to center pivot without visual jump (needed before rotate/path).
   * Returns center in parent space.
   */
  private rebasePivotCenter(view: CardView): { x: number; y: number } {
    const c = this.viewCenterOf(view);
    view.root.pivot.set(CARD_W / 2, CARD_H / 2);
    view.root.x = c.x;
    view.root.y = c.y;
    return c;
  }

  /**
   * P-meet: flyer moves to target, then soft-land (center pivot).
   * - Tap: clusterAtId = A2 → A1 flies to A2; then exit same as drag.
   * - Optional geometric mid only if no clusterAtId.
   */
  meetPair(
    ids: CardId[],
    onDone: (
      carry?: {
        id: CardId;
        vx: number;
        vy: number;
        scale: number;
        /** unit fly-in dir (screen y down); shared by pair */
        approachNx?: number;
        approachNy?: number;
      }[],
    ) => void,
    ticker: TickerLike,
    durationMs: number = PHYS.meetMs,
    startPoses?: CardPose[],
    opts?: { clusterAtId?: CardId },
  ): void {
    if (startPoses && startPoses.length > 0) {
      this.applyMatchStartPoses(startPoses);
    }

    const poseById = new Map((startPoses ?? []).map((p) => [p.id, p]));
    const raw = ids
      .map((id) => ({ id, view: this.views.get(id) }))
      .filter((x): x is { id: CardId; view: CardView } => !!x.view);
    if (raw.length < 2 || durationMs <= 0) {
      onDone();
      return;
    }

    raw.sort((a, b) => {
      const pa = poseById.get(a.id);
      const pb = poseById.get(b.id);
      const ax = pa ? pa.cx : this.viewCenterOf(a.view).x;
      const bx = pb ? pb.cx : this.viewCenterOf(b.view).x;
      return ax - bx;
    });
    const views = raw.map((r) => r.view);
    const orderedIds = raw.map((r) => r.id);
    for (const id of orderedIds) this.animating.add(id);

    const starts = views.map((v, i) => {
      const id = orderedIds[i]!;
      const pose = poseById.get(id);
      if (pose) {
        v.root.pivot.set(CARD_W / 2, CARD_H / 2);
        v.root.x = pose.cx;
        v.root.y = pose.cy;
        v.root.scale.set(pose.scale);
        v.root.rotation = pose.rotation;
        return {
          x: pose.cx,
          y: pose.cy,
          s: pose.scale,
          r: pose.rotation,
        };
      }
      const c = this.rebasePivotCenter(v);
      return {
        x: c.x,
        y: c.y,
        s: v.root.scale.x || 1,
        r: v.root.rotation,
      };
    });

    // Cluster: A2 stays put; A1 flies to A2 (product: tap match like drag stack)
    const clusterId = opts?.clusterAtId;
    const clusterPose = clusterId ? poseById.get(clusterId) : undefined;
    const clusterMode = !!clusterPose;

    let mcx: number;
    let mcy: number;
    if (clusterPose) {
      mcx = clusterPose.cx;
      mcy = clusterPose.cy;
    } else {
      mcx = (starts[0]!.x + starts[1]!.x) / 2;
      mcy = (starts[0]!.y + starts[1]!.y) / 2 - 12;
    }

    // Target freezes at start; flyer ends on target center
    const ends = orderedIds.map((id, i) => {
      if (clusterMode) {
        if (id === clusterId) {
          return { x: starts[i]!.x, y: starts[i]!.y };
        }
        return { x: mcx, y: mcy };
      }
      return { x: mcx + (i === 0 ? -6 : 6), y: mcy };
    });

    let maxDist = 0;
    let flyerIndex = 0;
    for (let i = 0; i < starts.length; i++) {
      const s = starts[i]!;
      const e = ends[i]!;
      const d = Math.hypot(e.x - s.x, e.y - s.y);
      if (d > maxDist) {
        maxDist = d;
        flyerIndex = i;
      }
    }

    const baseMs = Math.min(durationMs, PHYS.meetMs);
    const stretched =
      baseMs + Math.max(0, maxDist - 40) * PHYS.meetMsPerPx;
    const duration = Math.max(16, Math.min(PHYS.meetMsMax, stretched));

    const flyerZ = CARD_Z.meetFlyer;
    const targetZ = CARD_Z.meetTarget;
    views.forEach((v, i) => {
      const id = orderedIds[i]!;
      const isFlyer = clusterMode ? id !== clusterId : i === flyerIndex;
      v.root.zIndex = isFlyer ? flyerZ + i : targetZ + i;
    });

    const tiltMax = (PHYS.meetFlyerTiltDeg * Math.PI) / 180;

    let t = 0;
    const tick = (arg: { deltaMS: number }) => {
      t += arg.deltaMS;
      const u = Math.min(1, t / duration);
      // Natural accelerate + decelerate; straight path (no mid-flight arc)
      const ease = easeInOutSmooth(u);
      // Lean into flight, settle flat on land
      const tiltShape = Math.sin(Math.PI * u);

      views.forEach((v, i) => {
        const id = orderedIds[i]!;
        const s = starts[i]!;
        const e = ends[i]!;
        const isFlyer = clusterMode ? id !== clusterId : i === flyerIndex;

        if (clusterMode && !isFlyer) {
          // A2 stays put (only z / scale touch)
          v.root.x = s.x;
          v.root.y = s.y;
          v.root.rotation = s.r;
          v.root.scale.set(s.s);
          v.root.zIndex = targetZ + i;
          v.root.alpha = 1;
          return;
        }

        const x = s.x + (e.x - s.x) * ease;
        const y = s.y + (e.y - s.y) * ease;
        // Keep select scale in flight; pop only in last 25% (contact)
        let scale = s.s;
        if (u > 0.75) {
          const k = (u - 0.75) / 0.25;
          scale = s.s + (PHYS.matchPopScale - s.s) * easeOutQuad(k);
        }
        // Tilt toward travel direction, back to 0 at end
        const dir = Math.sign(e.x - s.x) || 1;
        const rot =
          s.r + (isFlyer ? dir * tiltMax * tiltShape : 0);

        v.root.x = x;
        v.root.y = y;
        v.root.scale.set(scale);
        v.root.rotation = rot;
        v.root.zIndex = isFlyer ? flyerZ + i : targetZ + i;
        v.root.alpha = 1;
      });

      if (u >= 1) {
        ticker.remove(tick);
        // Nudge ±4 on land for stable exit L/R without mid-flight A2 jump
        orderedIds.forEach((_id, i) => {
          const v = views[i]!;
          const side = i === 0 ? -4 : 4;
          v.root.x = mcx + side;
          v.root.y = mcy;
          v.root.rotation = 0;
          v.root.scale.set(PHYS.matchPopScale);
          v.root.zIndex = flyerZ + i;
        });
        // Fly-in unit dir (A1 → A2) → biases exit throw angle
        let approachNx = 0;
        let approachNy = 0;
        const fi = flyerIndex;
        const fdx = ends[fi]!.x - starts[fi]!.x;
        const fdy = ends[fi]!.y - starts[fi]!.y;
        const flen = Math.hypot(fdx, fdy);
        if (flen > 1) {
          approachNx = fdx / flen;
          approachNy = fdy / flen;
        }
        // Release input lock before exit (上抛) — exit uses `exiting`, not busy
        for (const id of orderedIds) this.animating.delete(id);
        const carry = orderedIds.map((cid) => ({
          id: cid,
          vx: 0,
          vy: 0,
          scale: PHYS.matchPopScale,
          approachNx,
          approachNy,
        }));
        onDone(carry);
      }
    };
    ticker.add(tick);
  }

  /**
   * P-exit: split-apart parabola.
   * IMPORTANT: do NOT re-apply release startPoses after a successful meet
   * (that snapped cards back and caused the cross-side hitch). Only apply
   * startPoses when exiting without meet (skipMeet / no carry).
   * Throw angle lightly follows approach (meet fly-in or drag velocity).
   */
  exitPairShared(
    ids: CardId[],
    onDone: () => void,
    ticker: TickerLike,
    carry?: {
      id: CardId;
      vx: number;
      vy: number;
      scale: number;
      approachNx?: number;
      approachNy?: number;
    }[],
    startPoses?: CardPose[],
    /** Multiplier on upward throw (and slight |vx|); from drag flick speed */
    throwForceK: number = 1,
    /** Explicit approach unit vector (drag path); else from carry */
    approachDir?: { nx: number; ny: number },
  ): void {
    const fromMeet = !!(carry && carry.length > 0);
    const loftK = Math.min(
      PHYS.dragThrowMaxK,
      Math.max(PHYS.dragThrowMinK, throwForceK),
    );
    // Skip-meet (drag): lock to release poses. After meet: keep current centers.
    if (!fromMeet && startPoses && startPoses.length > 0) {
      this.applyMatchStartPoses(startPoses);
    }

    const poseById = new Map((startPoses ?? []).map((p) => [p.id, p] as const));
    const raw = ids
      .map((id) => ({ id, view: this.views.get(id) }))
      .filter((x): x is { id: CardId; view: CardView } => !!x.view);
    if (raw.length === 0) {
      onDone();
      return;
    }
    const hx = CARD_W / 2;
    const hy = CARD_H / 2;
    // Sort by release pose x when available (stable left/right for split)
    raw.sort((a, b) => {
      const pa = poseById.get(a.id);
      const pb = poseById.get(b.id);
      const ax = pa ? pa.cx : this.viewCenterOf(a.view).x;
      const bx = pb ? pb.cx : this.viewCenterOf(b.view).x;
      return ax - bx;
    });
    const views = raw.map((r) => r.view);
    const orderedIds = raw.map((r) => r.id);
    // Exit does NOT block input (product: 上抛开始即可操作下一张)
    for (const id of orderedIds) {
      this.animating.delete(id);
      this.exiting.add(id);
    }

    const carryById = new Map((carry ?? []).map((c) => [c.id, c] as const));
    const blend = fromMeet ? PHYS.exitResidualBlend : 0;
    const pad = PHYS.exitOffPad;

    // Approach dir: explicit (drag vel) or from meet carry (A1→A2)
    const c0 = carry?.[0];
    let apNx = approachDir?.nx ?? c0?.approachNx ?? 0;
    let apNy = approachDir?.ny ?? c0?.approachNy ?? 0;
    const apLen = Math.hypot(apNx, apNy);
    if (apLen > 1e-6) {
      apNx /= apLen;
      apNy /= apLen;
    } else {
      apNx = 0;
      apNy = 0;
    }
    const apBias = PHYS.exitApproachBias;
    const apBoost = PHYS.exitApproachSpeed * loftK;

    const bodies = views.map((v, i) => {
      const sign = views.length === 1 ? 1 : i === 0 ? -1 : 1;
      const id = orderedIds[i]!;
      const pose = !fromMeet ? poseById.get(id) : undefined;
      let cx: number;
      let cy: number;
      let r0: number;
      let s0: number;
      if (pose) {
        // Explicit release start — no pivot math drift
        v.root.visible = true;
        v.root.pivot.set(hx, hy);
        v.root.x = pose.cx;
        v.root.y = pose.cy;
        v.root.scale.set(pose.scale);
        v.root.rotation = pose.rotation;
        cx = pose.cx;
        cy = pose.cy;
        r0 = pose.rotation;
        s0 = pose.scale;
      } else {
        const c = this.rebasePivotCenter(v);
        cx = c.x;
        cy = c.y;
        r0 = v.root.rotation;
        s0 = v.root.scale.x || 1;
      }
      const res = carryById.get(id);
      // Base split + loft, then blend shared approach (fly-in / drag) for throw angle
      const baseVx =
        sign *
        randJitter(PHYS.exitVx, PHYS.exitJitterVx) *
        (0.92 + 0.08 * loftK);
      const baseVy = randJitter(PHYS.exitVy0, PHYS.exitJitterVy) * loftK;
      const g = randJitter(PHYS.exitG, PHYS.exitJitterG);
      const resVx = res ? res.vx : 0;
      const resVy = res ? res.vy : 0;
      let addVx = -resVx * blend;
      if (addVx * sign < 0) addVx = 0;
      let addVy = resVy * blend * 0.5;
      if (addVy > 0) addVy = 0;
      // Shared approach bias: throw leans with fly-in / flick direction
      const apx = apNx * apBoost * apBias;
      const apy = apNy * apBoost * apBias;
      const vx = baseVx * (1 - apBias * 0.35) + addVx + apx;
      let vy0 = baseVy + addVy + apy;
      // Keep a real loft (never go fully downward from approach alone)
      const minUp = PHYS.exitVy0 * loftK * 0.55;
      if (vy0 > minUp) vy0 = minUp;
      // Spin tracks throw force: harder throw → faster ω (plus tiny residual jitter)
      const forceRef = Math.hypot(PHYS.exitVx, Math.abs(PHYS.exitVy0));
      const force = Math.hypot(Math.abs(vx), Math.abs(vy0));
      let forceK = forceRef > 1e-6 ? force / forceRef : 1;
      forceK = Math.min(
        PHYS.exitSpinForceMax,
        Math.max(PHYS.exitSpinForceMin, forceK),
      );
      const spinDeg =
        PHYS.exitSpinDegPerSec *
        forceK *
        randJitter(1, PHYS.exitJitterSpin);
      // Start scale: keep release/meet scale; exit will punch to matchPopScale
      const startS = res?.scale ?? s0;
      return {
        view: v,
        x0: cx,
        y0: cy,
        r0,
        s0: startS,
        vx,
        vy0,
        g,
        omega: sign * ((spinDeg * Math.PI) / 180),
      };
    });

    const isOffScreen = (cx: number, cy: number): boolean => {
      return (
        cy > DESIGN_HEIGHT + hy + pad ||
        cy < -hy - pad ||
        cx < -hx - pad ||
        cx > DESIGN_WIDTH + hx + pad
      );
    };

    /** Match pop: ramp to peak then ease back toward 1 while flying. */
    const matchScaleAt = (tMs: number, s0: number): number => {
      const peak = PHYS.matchPopScale;
      const popMs = PHYS.matchPopMs;
      const settleMs = PHYS.matchPopSettleMs;
      // Already at/above peak (after meet) → hold then settle
      if (s0 >= peak - 0.01) {
        if (tMs < popMs * 0.4) return peak;
        const k = Math.min(1, (tMs - popMs * 0.4) / settleMs);
        const e = 1 - (1 - k) * (1 - k);
        return peak + (1 - peak) * e;
      }
      // Drag skip-meet: punch up then settle
      if (tMs < popMs) {
        const k = tMs / popMs;
        const e = 1 - (1 - k) * (1 - k);
        return s0 + (peak - s0) * e;
      }
      const k = Math.min(1, (tMs - popMs) / settleMs);
      const e = k * k;
      return peak + (1 - peak) * e;
    };

    let t = 0;
    const hardMs = PHYS.exitHardMs;
    const tick = (arg: { deltaMS: number }) => {
      t += arg.deltaMS;
      const sec = t / 1000;
      let allOff = true;
      bodies.forEach((b, i) => {
        const cx = b.x0 + b.vx * sec;
        const cy = b.y0 + b.vy0 * sec + 0.5 * b.g * sec * sec;
        b.view.root.x = cx;
        b.view.root.y = cy;
        b.view.root.rotation = b.r0 + b.omega * sec;
        b.view.root.scale.set(matchScaleAt(t, b.s0));
        b.view.root.alpha = 1;
        b.view.root.zIndex = CARD_Z.exit + i;
        if (!isOffScreen(cx, cy)) allOff = false;
      });
      if (allOff || t >= hardMs) {
        ticker.remove(tick);
        for (const id of orderedIds) this.exiting.delete(id);
        // Return display objects to pool (not just hide)
        for (const id of orderedIds) {
          this.releaseView(id);
        }
        onDone();
      }
    };
    ticker.add(tick);
  }

  /**
   * P-flip: scale.x fake flip + breath + slight random Z tilt (NOT busy).
   * Never use negative scale.x (mirrors art). Rightish hinge = 从右向左观感.
   * Face is shown only after scale is near 0; orientation is corrected first.
   */
  flipToFace(
    ids: CardId[],
    state: GameState,
    onDone: () => void,
    ticker: TickerLike,
    toFace: boolean = true,
    opts?: {
      /** 0–1 along card width; default 0.5 center; draw uses ~0.68 */
      hingeXRatio?: number;
      /** Peak breath scale; default PHYS.flipBreath; draw uses drawFlipBreath */
      breathPeak?: number;
      /**
       * Dim other waste cards under the flipping card.
       * Only for draw-zone flip; puzzle reveal must stay undimmed (product).
       */
      dimWasteUnder?: boolean;
    },
  ): void {
    const list = ids.slice(0, 12);
    const hingeXRatio = opts?.hingeXRatio ?? 0.5;
    const breathPeak = opts?.breathPeak ?? PHYS.flipBreath;
    const dimWasteUnder = opts?.dimWasteUnder === true;
    const targets: {
      id: CardId;
      view: CardView;
      card: Card;
      tiltPeak: number;
      pivotX: number;
      pivotY: number;
    }[] = [];
    for (const id of list) {
      const view = this.views.get(id);
      const card = state.cards[id];
      if (!view || !card) continue;
      const amp =
        ((PHYS.flipTiltMaxDeg * Math.PI) / 180) *
        (0.4 + Math.random() * 0.6);
      const tiltPeak = (Math.random() < 0.5 ? -1 : 1) * amp;
      targets.push({
        id,
        view,
        card,
        tiltPeak,
        pivotX: CARD_W * hingeXRatio,
        pivotY: CARD_H / 2,
      });
    }
    if (targets.length === 0) {
      onDone();
      return;
    }
    const w = CARD_W;
    const h = CARD_H;
    const flipIds = new Set(targets.map((t) => t.id));
    // Only draw-path flips dim waste underlay (not puzzle reveal / drag time)
    const dimmed: CardView[] = [];
    if (dimWasteUnder) {
      for (const wid of state.waste) {
        if (flipIds.has(wid)) continue;
        const v = this.views.get(wid);
        if (!v || !v.root.visible) continue;
        this.underFlipDimIds.add(wid);
        this.ensureCardDimShape(v);
        v.dim.alpha = 0;
        dimmed.push(v);
      }
    }
    const dimPeak = PHYS.flipUnderDimAlpha;
    const dimFadeMs = Math.max(1, PHYS.flipUnderDimFadeMs);
    const clearDim = () => {
      for (const v of dimmed) this.setCardDim(v, false);
    };

    for (const { id, view, card, pivotX, pivotY } of targets) {
      this.flipping.add(id);
      if (toFace) this.showBack(view, w, h);
      else this.showFace(view, card, w, h, false);
      // Hinge fixed in world when changing pivot
      const c = this.viewCenterOf(view);
      const hingeWorldX = c.x + (pivotX - w / 2);
      const hingeWorldY = c.y + (pivotY - h / 2);
      view.root.pivot.set(pivotX, pivotY);
      view.root.x = hingeWorldX;
      view.root.y = hingeWorldY;
      view.root.scale.set(1, 1);
      view.root.alpha = 1;
      view.root.visible = true;
      view.root.rotation = 0;
      // Flipping card above dimmed stack
      view.root.zIndex = Math.max(view.root.zIndex, CARD_Z.flip);
    }
    let t = 0;
    const duration = PHYS.flipMs;
    const edge = 0.05;
    let swapped = false;
    const tick = (arg: { deltaMS: number }) => {
      t += arg.deltaMS;
      const u = Math.min(1, t / duration);
      // Under-stack dim (draw flip only): ease-in over flipUnderDimFadeMs
      if (dimmed.length > 0) {
        const du = Math.min(1, t / dimFadeMs);
        const da = easeOutQuad(du) * dimPeak;
        for (const v of dimmed) {
          if (!v.dim.visible) this.ensureCardDimShape(v);
          v.dim.alpha = da;
        }
      }
      let sx: number;
      let breath: number;
      if (u < 0.5) {
        const p = easeInOutSmooth(u / 0.5);
        // Collapse toward hinge (rightish → free edge swings in)
        sx = 1 - p * (1 - edge);
        breath = 1 + (breathPeak - 1) * p;
      } else {
        if (!swapped) {
          swapped = true;
          // Before face shows: force upright scale sign + clean orientation
          for (const { view, card } of targets) {
            view.root.scale.set(edge, view.root.scale.y || 1);
            // Keep mid-tilt continuous; face art itself is never mirrored
            if (toFace) this.showFace(view, card, w, h, false);
            else this.showBack(view, w, h);
          }
        }
        const p = easeInOutSmooth((u - 0.5) / 0.5);
        // Always expand with positive scale.x — correct face, no mirror
        sx = edge + p * (1 - edge);
        breath = breathPeak + (1 - breathPeak) * p;
      }
      const tiltShape = Math.sin(Math.PI * u);
      for (const { view, tiltPeak } of targets) {
        view.root.scale.set(sx * breath, breath);
        view.root.rotation = tiltPeak * tiltShape;
      }
      if (u >= 1) {
        ticker.remove(tick);
        clearDim();
        for (const { id, view, pivotX, pivotY } of targets) {
          this.flipping.delete(id);
          view.root.scale.set(1, 1);
          view.root.rotation = 0;
          view.root.x -= pivotX;
          view.root.y -= pivotY;
          view.root.pivot.set(0, 0);
        }
        onDone();
      }
    };
    ticker.add(tick);
  }

  /**
   * After stock top is drawn: remaining cards ease into new stack offsets
   * (no teleport / jump toward deal seat).
   */
  playStockCompact(state: GameState, ticker: TickerLike): void {
    const stock = getStockRect();
    const n = state.stock.length;
    if (n === 0) return;
    const dur = Math.max(40, PHYS.stockCompactMs);
    for (let i = 0; i < n; i++) {
      const id = state.stock[i]!;
      if (this.exiting.has(id) || this.flipping.has(id)) continue;
      const view = this.views.get(id);
      const card = state.cards[id];
      if (!view || !card?.alive) continue;
      // Visual top-left now (pivot-aware)
      const c = this.viewCenterOf(view);
      const startX = c.x - this.cardHx;
      const startY = c.y - this.cardHy;
      const off = stockStackOffset(Math.min(i, STOCK_STACK_MAX_VISIBLE - 1));
      const endX = stock.x + off.x;
      const endY = stock.y + off.y;
      if (Math.hypot(endX - startX, endY - startY) < 0.5) {
        this.placeRestTopLeft(view, endX, endY, {
          scale: 1,
          zIndex: stockZ(n, i),
        });
        this.showBack(view, CARD_W, CARD_H, { shadow: false });
        continue;
      }
      this.animating.add(id);
      view.root.visible = i < STOCK_STACK_MAX_VISIBLE;
      this.showBack(view, CARD_W, CARD_H, { shadow: false });
      // Animate in top-left space, pivot 0 — FX band so compact stays above waste/select
      view.root.pivot.set(0, 0);
      view.root.x = startX;
      view.root.y = startY;
      view.root.scale.set(1);
      view.root.rotation = 0;
      view.root.zIndex = CARD_Z.stockCompact + (n - i);
      let t = 0;
      const tick = (arg: { deltaMS: number }) => {
        t += arg.deltaMS;
        const u = Math.min(1, t / dur);
        const e = easeOutQuad(u);
        view.root.x = startX + (endX - startX) * e;
        view.root.y = startY + (endY - startY) * e;
        view.root.zIndex = CARD_Z.stockCompact + (n - i);
        if (u >= 1) {
          ticker.remove(tick);
          this.animating.delete(id);
          this.placeRestTopLeft(view, endX, endY, {
            scale: 1,
            zIndex: stockZ(n, i),
          });
          if (i >= STOCK_STACK_MAX_VISIBLE) view.root.visible = false;
        }
      };
      ticker.add(tick);
    }
  }

  /**
   * Draw: stock → past waste (small overshoot) → flip there → settle to waste.
   * Horizontal only, ease-out (fast then slow). Random Z tilt settles by flip end.
   * Remaining stock compact in parallel (no seat jump).
   */
  playDrawMoveFlip(
    id: CardId,
    state: GameState,
    onDone: () => void,
    ticker: TickerLike,
  ): void {
    const view = this.views.get(id);
    const card = state.cards[id];
    if (!view || !card) {
      onDone();
      return;
    }
    const waste = getWasteRect();
    this.recycleAnimating = false;
    this.drawMoving = true;
    this.animating.add(id);
    // Compact remaining stock seats smoothly while this card flies out
    this.playStockCompact(state, ticker);
    const hx = this.cardHx;
    const hy = this.cardHy;
    // Start from **current** visual center (after recycle seat) — no snap to frame
    const cur = this.viewCenterOf(view);
    const x0 = cur.x;
    const y0 = cur.y;
    const xWaste = waste.x + hx;
    const yWaste = waste.y + hy;
    const dir = Math.sign(xWaste - x0) || 1;
    // End slide past waste — flip here, do NOT pull back first
    const xOver = xWaste + dir * PHYS.drawOvershootPx;
    // Random tilt: ±(40%–100%) of max
    const tiltAmp =
      ((PHYS.drawTiltMaxDeg * Math.PI) / 180) *
      (0.4 + Math.random() * 0.6);
    const tiltPeak = (Math.random() < 0.5 ? -1 : 1) * tiltAmp;

    view.root.visible = true;
    view.root.pivot.set(hx, hy);
    view.root.x = x0;
    view.root.y = y0;
    view.root.zIndex = CARD_Z.draw;
    view.root.alpha = 1;
    view.root.scale.set(1);
    view.root.rotation = 0;
    this.showBack(view, CARD_W, CARD_H, { shadow: true });

    const settleToWaste = () => {
      // After flip: pivot is top-left; ease into exact waste seat
      // Keep busy until settle completes (product: 落稳后才可再抽)
      this.animating.add(id);
      this.drawMoving = true;
      view.root.zIndex = CARD_Z.draw;
      const sx = view.root.x;
      const sy = view.root.y;
      const sRot = view.root.rotation;
      let ts = 0;
      const settleMs = Math.max(16, PHYS.drawSettleMs);
      const tickSettle = (arg: { deltaMS: number }) => {
        ts += arg.deltaMS;
        const u = Math.min(1, ts / settleMs);
        const e = easeOutQuad(u);
        view.root.x = sx + (waste.x - sx) * e;
        view.root.y = sy + (waste.y - sy) * e;
        view.root.rotation = sRot * (1 - e);
        view.root.zIndex = CARD_Z.draw;
        if (u >= 1) {
          ticker.remove(tickSettle);
          this.animating.delete(id);
          this.drawMoving = false;
          view.root.rotation = 0;
          view.root.pivot.set(0, 0);
          view.root.x = waste.x;
          view.root.y = waste.y;
          onDone();
        }
      };
      ticker.add(tickSettle);
    };

    let t = 0;
    const moveMs = PHYS.drawMoveMs;
    const tickMove = (arg: { deltaMS: number }) => {
      t += arg.deltaMS;
      const u = Math.min(1, t / moveMs);
      // 先快后慢 → 停在过冲点（不回拉）；y 也可微移到 waste 高度
      const e = easeOutQuad(u);
      view.root.x = x0 + (xOver - x0) * e;
      view.root.y = y0 + (yWaste - y0) * e;
      // Tilt mid-slide; nearly flat by overshoot (flip prefers near-zero)
      view.root.rotation = tiltPeak * Math.sin(Math.PI * u);
      if (u >= 1) {
        ticker.remove(tickMove);
        // Stay busy through flip + settle (do not clear drawMoving here)
        view.root.x = xOver;
        view.root.y = yWaste;
        this.flipToFace(
          [id],
          state,
          () => {
            settleToWaste();
          },
          ticker,
          true,
          {
            hingeXRatio: PHYS.drawFlipHingeX,
            breathPeak: PHYS.drawFlipBreath,
            dimWasteUnder: true,
          },
        );
      }
    };
    ticker.add(tickMove);
  }

  /**
   * Recycle: face-up at waste → fly to stock **frame** while flipping to back
   * → then slide **left** into stack peek. Sequential (deep first, top last).
   */
  playRecycleSettle(
    stockIds: CardId[],
    state: GameState,
    onDone: () => void,
    ticker: TickerLike,
  ): void {
    const n = stockIds.length;
    if (n === 0) {
      onDone();
      return;
    }
    this.recycleAnimating = true;
    const waste = getWasteRect();
    const stock = getStockRect();
    const maxAnimate = n > 16 ? 8 : n;
    // Keep wall clock ~recCapMs (0.3s): T ≈ k*move + (k-1)*stack
    const moveMs = Math.min(
      PHYS.recMoveMs,
      Math.max(18, Math.floor((PHYS.recCapMs * 0.72) / Math.max(maxAnimate, 1))),
    );
    const stackMs = Math.max(8, PHYS.recStackMs);
    const gap = PHYS.recGapMs;
    const w = CARD_W;
    const h = CARD_H;
    const hx = this.cardHx;
    const hy = this.cardHy;
    const edge = 0.06;

    // Place all at waste, face-up, same seat
    for (let i = 0; i < n; i++) {
      const id = stockIds[i]!;
      const view = this.views.get(id);
      const card = state.cards[id];
      if (!view || !card) continue;
      this.animating.add(id);
      view.root.visible = true;
      view.root.pivot.set(0, 0);
      view.root.x = waste.x;
      view.root.y = waste.y;
      view.root.zIndex = CARD_Z.recycleWait + i;
      view.root.alpha = 1;
      view.root.scale.set(1);
      view.root.rotation = 0;
      this.showFace(view, card, w, h, false, { shadow: i === n - 1 });
    }

    // Deep seats first; stock top (i=0) last
    const order: number[] = [];
    for (let i = maxAnimate - 1; i >= 0; i--) order.push(i);

    const finishAll = () => {
      for (let i = maxAnimate; i < n; i++) {
        const id = stockIds[i]!;
        const view = this.views.get(id);
        if (!view) continue;
        this.animating.delete(id);
        const off = stockStackOffset(Math.min(i, STOCK_STACK_MAX_VISIBLE - 1));
        view.root.pivot.set(0, 0);
        view.root.x = stock.x + off.x;
        view.root.y = stock.y + off.y;
        view.root.scale.set(1);
        view.root.rotation = 0;
        view.root.visible = i < STOCK_STACK_MAX_VISIBLE;
        view.root.zIndex = stockZ(n, i);
        this.showBack(view, w, h, { shadow: false });
      }
      // Hold busy for a beat, then continue (keep busy until onDone starts next anim)
      const pauseMs = PHYS.recPauseBeforeDrawMs;
      if (pauseMs <= 0) {
        onDone();
        // Caller should start draw (busy) before we clear; clear next frame if still set
        this.recycleAnimating = false;
        return;
      }
      let waited = 0;
      const tickPause = (arg: { deltaMS: number }) => {
        waited += arg.deltaMS;
        if (waited >= pauseMs) {
          ticker.remove(tickPause);
          // onDone first so draw can take over busy without a free frame (卡顿)
          onDone();
          this.recycleAnimating = false;
        }
      };
      ticker.add(tickPause);
    };

    const nextStep = (step: number) => {
      if (gap > 0 && step < order.length) {
        let wait = 0;
        const tickGap = (a: { deltaMS: number }) => {
          wait += a.deltaMS;
          if (wait >= gap) {
            ticker.remove(tickGap);
            runStep(step);
          }
        };
        ticker.add(tickGap);
      } else {
        runStep(step);
      }
    };

    const runStep = (step: number) => {
      if (step >= order.length) {
        finishAll();
        return;
      }
      const i = order[step]!;
      const id = stockIds[i]!;
      const view = this.views.get(id);
      const card = state.cards[id];
      if (!view || !card) {
        runStep(step + 1);
        return;
      }

      const off = stockStackOffset(Math.min(i, STOCK_STACK_MAX_VISIBLE - 1));
      // Phase 1 end: stock **frame** (no peek)
      const x0 = waste.x + hx;
      const y0 = waste.y + hy;
      const xFrame = stock.x + hx;
      const yFrame = stock.y + hy;
      // Phase 2 end: left stack peek
      const xStack = stock.x + off.x + hx;
      const yStack = stock.y + off.y + hy;

      this.showFace(view, card, w, h, false, { shadow: true });
      view.root.pivot.set(hx, hy);
      view.root.x = x0;
      view.root.y = y0;
      view.root.zIndex = CARD_Z.recycleFly;
      view.root.scale.set(1);
      view.root.rotation = 0;
      view.root.visible = true;

      // Random spin while flying (peak mid-path, 0 at frame)
      const tiltAmp =
        ((PHYS.recTiltMaxDeg * Math.PI) / 180) *
        (0.4 + Math.random() * 0.6);
      const tiltPeak = (Math.random() < 0.5 ? -1 : 1) * tiltAmp;

      // —— Phase 1: waste → stock frame, flip face→back mid-flight ——
      let t = 0;
      let swapped = false;
      const tickFly = (arg: { deltaMS: number }) => {
        t += arg.deltaMS;
        const u = Math.min(1, t / moveMs);
        const e = easeOutQuad(u);
        view.root.x = x0 + (xFrame - x0) * e;
        view.root.y = y0 + (yFrame - y0) * e;
        view.root.zIndex = CARD_Z.recycleFly;
        // Random Z tilt during fly-back
        view.root.rotation = tiltPeak * Math.sin(Math.PI * u);

        let sx: number;
        if (u < 0.5) {
          const p = easeInOutSmooth(u / 0.5);
          sx = 1 - p * (1 - edge);
        } else {
          if (!swapped) {
            swapped = true;
            this.showBack(view, w, h, { shadow: true });
          }
          const p = easeInOutSmooth((u - 0.5) / 0.5);
          sx = edge + p * (1 - edge);
        }
        view.root.scale.set(sx, 1);

        if (u >= 1) {
          ticker.remove(tickFly);
          view.root.x = xFrame;
          view.root.y = yFrame;
          view.root.scale.set(1);
          view.root.rotation = 0;
          this.showBack(view, w, h, { shadow: true });

          // —— Phase 2: frame → left stack peek ——
          if (Math.abs(off.x) < 0.5 && Math.abs(off.y) < 0.5) {
            this.animating.delete(id);
            view.root.pivot.set(0, 0);
            view.root.x = stock.x + off.x;
            view.root.y = stock.y + off.y;
            view.root.zIndex = stockZ(n, i);
            if (i >= STOCK_STACK_MAX_VISIBLE) view.root.visible = false;
            this.showBack(view, w, h, { shadow: false });
            nextStep(step + 1);
            return;
          }

          let ts = 0;
          const tickStack = (a: { deltaMS: number }) => {
            ts += a.deltaMS;
            const u2 = Math.min(1, ts / stackMs);
            const e2 = easeOutQuad(u2);
            view.root.x = xFrame + (xStack - xFrame) * e2;
            view.root.y = yFrame + (yStack - yFrame) * e2;
            view.root.rotation = 0;
            // Stay in FX band until fully seated
            view.root.zIndex = CARD_Z.recycleFly;
            if (u2 >= 1) {
              ticker.remove(tickStack);
              this.animating.delete(id);
              view.root.pivot.set(0, 0);
              view.root.x = stock.x + off.x;
              view.root.y = stock.y + off.y;
              view.root.scale.set(1);
              view.root.rotation = 0;
              view.root.zIndex = stockZ(n, i);
              if (i >= STOCK_STACK_MAX_VISIBLE) view.root.visible = false;
              this.showBack(view, w, h, { shadow: false });
              nextStep(step + 1);
            }
          };
          ticker.add(tickStack);
        }
      };
      ticker.add(tickFly);
    };

    runStep(0);
  }

  sync(
    state: GameState,
    skipIds: Iterable<CardId> = [],
    opts?: { holdBackIds?: Iterable<CardId> },
  ): void {
    this.syncEmptySlots(state);
    const skip = new Set(skipIds);
    const holdBack = new Set(opts?.holdBackIds ?? []);
    /** !alive / missing — release after idle (exit path releases itself) */
    const toRelease: CardId[] = [];

    for (const [id, view] of this.views) {
      if (
        skip.has(id) ||
        this.animating.has(id) ||
        this.exiting.has(id) ||
        this.flipping.has(id)
      )
        continue;
      // Drag visual is owned by dragFollow tick — never demote z / snap seat mid-swipe
      if (this.dragPos.has(id) || this.dragFollow.has(id)) {
        this.raiseDragCard(view);
        continue;
      }
      const card = state.cards[id];
      if (!card || !card.alive) {
        toRelease.push(id);
        continue;
      }

      if (card.zone === 'stock') {
        const idx = state.stock.indexOf(id);
        if (idx < 0) {
          view.root.visible = false;
          continue;
        }
        const n = state.stock.length;
        if (idx >= STOCK_STACK_MAX_VISIBLE) {
          view.root.visible = false;
          continue;
        }
        const stock = getStockRect();
        const off = stockStackOffset(idx);
        view.root.visible = true;
        view.baseY = stock.y + off.y;
        const drag = this.dragPos.get(id);
        if (drag) {
          this.placeFromTopLeft(view, drag.x, drag.y, {
            scale: PHYS.dragScale,
            zIndex: CARD_Z.drag,
          });
        } else {
          this.placeRestTopLeft(view, stock.x + off.x, view.baseY, {
            scale: 1,
            zIndex: stockZ(n, idx),
          });
        }

        // Shared stock seat shadow only; per-card shadow while dragging
        const free = isFree(state, id);
        if (free && idx === 0) {
          const selected = state.selectedId === id && !drag;
          this.showFace(view, card, stock.w, stock.h, selected, {
            shadow: !!drag,
          });
          if (selected && !drag) {
            // Selected: scale about card center (same amp as drag)
            this.placeFromTopLeft(view, stock.x + off.x, view.baseY - PHYS.floatY, {
              scale: PHYS.floatScale,
              zIndex: CARD_Z.selectSeat,
            });
          }
        } else if (!drag) {
          this.showBack(view, stock.w, stock.h, { shadow: false });
        } else {
          this.showFace(view, card, stock.w, stock.h, false, { shadow: true });
        }
        continue;
      }

      if (card.zone === 'waste') {
        const waste = getWasteRect();
        const top = state.waste[state.waste.length - 1];
        const idx = state.waste.indexOf(id);
        if (idx < 0) {
          view.root.visible = false;
          continue;
        }
        // All waste cards visible, same seat (no offset stack) — top has highest z
        view.root.visible = true;
        view.baseY = waste.y;
        const drag = this.dragPos.get(id);
        const isTop = id === top;
        // z: deeper cards lower; top above; drag/selected still on top
        const baseZ = wasteZ(idx);
        if (drag) {
          this.placeFromTopLeft(view, drag.x, drag.y, {
            scale: PHYS.dragScale,
            zIndex: CARD_Z.drag,
          });
        } else {
          this.placeRestTopLeft(view, waste.x, view.baseY, {
            scale: 1,
            zIndex: baseZ,
          });
        }
        const free = isFree(state, id);
        const selected = free && state.selectedId === id && !drag;
        // Shared waste seat shadow; per-card only while dragging
        this.showFace(view, card, waste.w, waste.h, selected, {
          shadow: !!drag,
        });
        if (selected && !drag && isTop) {
          this.placeFromTopLeft(view, waste.x, view.baseY - PHYS.floatY, {
            scale: PHYS.floatScale,
            zIndex: CARD_Z.selectSeat,
          });
        }
        continue;
      }

      // puzzle
      const free = isFree(state, id);
      const holdAsBack = holdBack.has(id);
      const selected = free && state.selectedId === id && !holdAsBack;
      view.root.visible = true;
      view.baseY = card.rect.y;
      const drag = this.dragPos.get(id);
      if (drag) {
        this.placeFromTopLeft(view, drag.x, drag.y, {
          scale: PHYS.dragScale,
          zIndex: CARD_Z.drag,
        });
      } else if (selected) {
        // Selected only: enlarge about card center (convention)
        this.placeFromTopLeft(view, card.rect.x, view.baseY - PHYS.floatY, {
          scale: PHYS.floatScale,
          zIndex: CARD_Z.selectPuzzle + card.layer * 10,
        });
      } else {
        this.placeRestTopLeft(view, card.rect.x, view.baseY, {
          scale: 1,
          zIndex: card.layer * 10,
        });
      }

      if (drag) {
        this.showFace(view, card, card.rect.w, card.rect.h, false);
      } else if (holdAsBack || !free) {
        this.showBack(view, card.rect.w, card.rect.h);
      } else {
        this.showFace(view, card, card.rect.w, card.rect.h, selected);
      }
    }

    for (const id of toRelease) {
      this.releaseView(id);
    }
  }

  /** @deprecated use meetPair + exitPairShared */
  flyAway(ids: CardId[], onDone: () => void, ticker: TickerLike): void {
    this.exitPairShared(ids, onDone, ticker);
  }

  /**
   * Blocks new pointer / draw / undo.
   * Does NOT include exit fly-away or flip (product: 上抛开始即可操作).
   */
  isBusy(): boolean {
    return (
      this.dealAnimating ||
      this.animating.size > 0 ||
      this.dragPos.size > 0 ||
      this.drawMoving ||
      this.recycleAnimating
    );
  }

  /** Card mid flip-to-face — not busy globally, but not draggable. */
  isFlipping(id: CardId): boolean {
    return this.flipping.has(id);
  }

  /** Matched pair still on exit trajectory (not pickable). */
  isExiting(id: CardId): boolean {
    return this.exiting.has(id);
  }
}
