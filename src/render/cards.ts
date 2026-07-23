import { Container, Graphics, Sprite } from 'pixi.js';
import type { Card, CardId, GameState } from '../core/types';
import { canMatchCards } from '../core/types';
import { freeCardIds, isFree } from '../core/rules';
import { CARD_H, CARD_W, STOCK_STACK_MAX_VISIBLE } from '../data/layout';
import { getCardShadowParams } from '../data/cardShadowRuntime';
import {
  getStockRect,
  getWasteRect,
  stockStackOffset,
} from '../data/pileLayoutRuntime';
import { getBackTexture, getFaceTexture } from './cardAssets';
import {
  easeInOutSmooth,
  easeOutQuad,
  PHYS,
  randJitter,
  type TickerLike,
} from './phys';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '../viewport/design';
import { Theme } from './theme';

const RADIUS = 8;

type CardView = {
  root: Container;
  shadow: Graphics;
  /** Shared back art Card_B.png */
  back: Sprite;
  /** Face art R_ / B_ rank PNGs */
  face: Sprite;
  /** Rounds sprites to card corners */
  cardMask: Graphics;
  /** Selection / subtle rim */
  frame: Graphics;
  cardId: CardId;
  baseY: number;
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
  /** meet / exit / snap / draw-move / recycle — isBusy */
  private animating = new Set<CardId>();
  /** flip / draw-flip — NOT busy */
  private flipping = new Set<CardId>();
  private drawMoving = false;
  private recycleAnimating = false;
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

  constructor() {
    this.root.label = 'cards';
    this.root.sortableChildren = true;
    this.stockSeatShadow.eventMode = 'none';
    this.wasteSeatShadow.eventMode = 'none';
    this.stockSlot.eventMode = 'none';
    this.wasteSlot.eventMode = 'none';
    // Shadows under ghost plates; cards sit above (z≥50)
    this.stockSeatShadow.zIndex = 3;
    this.wasteSeatShadow.zIndex = 3;
    this.stockSlot.zIndex = 5;
    this.wasteSlot.zIndex = 5;
    this.root.addChild(
      this.stockSeatShadow,
      this.wasteSeatShadow,
      this.stockSlot,
      this.wasteSlot,
    );
  }

  /** Call after `loadCardFaceAssets()`. */
  bootstrap(state: GameState): void {
    // Keep empty-slot graphics; rebuild card views only
    for (const view of this.views.values()) {
      this.root.removeChild(view.root);
    }
    this.views.clear();
    for (const card of Object.values(state.cards)) {
      const view = this.makeView(card);
      this.views.set(card.id, view);
      this.root.addChild(view.root);
    }
    this.sync(state);
  }

  /**
   * Ghost frame when pile is empty — same size as a card (no own shadow;
   * seat shadows are painted separately and always stay).
   */
  private paintEmptySlot(g: Graphics, x: number, y: number, w: number, h: number): void {
    g.clear();
    g.visible = true;
    g.zIndex = 5;
    // Soft fill plate
    g.roundRect(x, y, w, h, RADIUS);
    g.fill({ color: 0x2c3540, alpha: 0.1 });
    // Soft rim
    g.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, RADIUS - 0.5);
    g.stroke({
      width: 1.5,
      color: 0x2c3540,
      alpha: 0.18,
      alignment: 0.5,
    });
  }

  private hideSlot(g: Graphics): void {
    g.clear();
    g.visible = false;
  }

  /** Permanent seat shadows for stock + waste (same params as card shadow). */
  private paintSeatShadow(g: Graphics, x: number, y: number, w: number, h: number): void {
    g.clear();
    g.visible = true;
    const { offsetX, offsetY, scale, alpha } = getCardShadowParams();
    const sw = w * scale;
    const sh = h * scale;
    const sx = x + (w - sw) / 2 + offsetX;
    const sy = y + (h - sh) / 2 + offsetY;
    const r = RADIUS * scale;
    g.roundRect(sx, sy, sw, sh, r);
    g.fill({ color: 0x2c3540, alpha });
  }

  private syncPileSeatShadows(): void {
    const stock = getStockRect();
    const waste = getWasteRect();
    this.paintSeatShadow(
      this.stockSeatShadow,
      stock.x,
      stock.y,
      stock.w,
      stock.h,
    );
    this.paintSeatShadow(
      this.wasteSeatShadow,
      waste.x,
      waste.y,
      waste.w,
      waste.h,
    );
  }

  private syncEmptySlots(state: GameState): void {
    // Seat shadows first — always on for stock + waste
    this.syncPileSeatShadows();

    const stock = getStockRect();
    const waste = getWasteRect();

    if (state.stock.length === 0) {
      this.paintEmptySlot(
        this.stockSlot,
        stock.x,
        stock.y,
        stock.w,
        stock.h,
      );
    } else {
      this.hideSlot(this.stockSlot);
    }

    if (state.waste.length === 0) {
      this.paintEmptySlot(
        this.wasteSlot,
        waste.x,
        waste.y,
        waste.w,
        waste.h,
      );
    } else {
      this.hideSlot(this.wasteSlot);
    }
  }

  private makeView(card: Card): CardView {
    const root = new Container();
    root.label = card.id;
    root.eventMode = 'none';

    const shadow = new Graphics();
    const back = new Sprite(getBackTexture());
    back.roundPixels = false;
    const face = new Sprite(getFaceTexture(card.suit, card.rank));
    face.roundPixels = false;
    const cardMask = new Graphics();
    // Shared mask for whichever side is visible
    back.mask = cardMask;
    face.mask = cardMask;
    const frame = new Graphics();

    root.addChild(shadow, back, face, cardMask, frame);
    return {
      root,
      shadow,
      back,
      face,
      cardMask,
      frame,
      cardId: card.id,
      baseY: 0,
    };
  }

  /**
   * Full card-sized shadow. Size/offset/alpha from cardShadowRuntime (tuner).
   */
  private paintShadow(g: Graphics, w: number, h: number): void {
    g.clear();
    const { offsetX, offsetY, scale, alpha } = getCardShadowParams();
    const sw = w * scale;
    const sh = h * scale;
    // Center scaled shadow on card, then apply offset
    const sx = (w - sw) / 2 + offsetX;
    const sy = (h - sh) / 2 + offsetY;
    const r = RADIUS * scale;

    // Single layer — same proportions as card (no outer halo)
    g.roundRect(sx, sy, sw, sh, r);
    g.fill({ color: 0x2c3540, alpha });
  }

  private setMask(view: CardView, w: number, h: number): void {
    view.cardMask.clear();
    view.cardMask.roundRect(0, 0, w, h, RADIUS);
    view.cardMask.fill({ color: 0xffffff });
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
    // Never tint art — default must stay pure white multiply
    spr.tint = 0xffffff;
    spr.alpha = 1;
  }

  private paintFrame(
    g: Graphics,
    w: number,
    h: number,
    _selected: boolean,
    faceUp: boolean,
  ): void {
    g.clear();
    // Selection uses float/scale only — no yellow/gold outline (product request).
    // Light rim so art edges stay readable on felt
    if (faceUp) {
      g.roundRect(0.5, 0.5, w - 1, h - 1, RADIUS - 0.5);
      g.stroke({
        width: 1.1,
        color: Theme.faceStroke,
        alpha: 0.4,
        alignment: 0.5,
      });
    }
  }

  private showFace(
    view: CardView,
    card: Card,
    w: number,
    h: number,
    selected: boolean,
    opts?: { shadow?: boolean },
  ): void {
    // Stock/waste seats own a permanent shadow; skip duplicate when seated
    if (opts?.shadow === false) {
      view.shadow.clear();
    } else {
      this.paintShadow(view.shadow, w, h);
    }
    view.back.visible = false;
    view.face.visible = true;
    view.face.texture = getFaceTexture(card.suit, card.rank);
    this.layoutSprite(view.face, w, h);
    this.setMask(view, w, h);
    this.paintFrame(view.frame, w, h, selected, true);
  }

  private showBack(
    view: CardView,
    w: number,
    h: number,
    opts?: { shadow?: boolean },
  ): void {
    if (opts?.shadow === false) {
      view.shadow.clear();
    } else {
      this.paintShadow(view.shadow, w, h);
    }
    view.face.visible = false;
    view.back.visible = true;
    view.back.texture = getBackTexture();
    this.layoutSprite(view.back, w, h);
    this.setMask(view, w, h);
    // No extra frame on back — art already has light border
    view.frame.clear();
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
        zIndex: 5000,
      });
      this.paintShadow(view.shadow, CARD_W, CARD_H);
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
          zIndex: 5000,
        });
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
      zIndex = 2000;
    } else if (card.zone === 'waste') {
      const waste = getWasteRect();
      const top = state.waste[state.waste.length - 1];
      if (id !== top) {
        this.stopSelectIdle();
        return;
      }
      baseTLX = waste.x;
      baseTLY = waste.y - PHYS.floatY;
      zIndex = 2000;
    } else {
      baseTLX = card.rect.x;
      baseTLY = card.rect.y - PHYS.floatY;
      zIndex = 1000 + card.layer * 10;
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
      view.root.zIndex = 6000;
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

    const flyerZ = 9500;
    const targetZ = 9000;
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
    for (const id of orderedIds) this.animating.add(id);

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
        b.view.root.zIndex = 7000 + i;
        if (!isOffScreen(cx, cy)) allOff = false;
      });
      if (allOff || t >= hardMs) {
        ticker.remove(tick);
        for (const id of orderedIds) this.animating.delete(id);
        for (const b of bodies) {
          b.view.root.visible = false;
          b.view.root.alpha = 1;
          b.view.root.scale.set(1);
          b.view.root.rotation = 0;
          b.view.root.pivot.set(0, 0);
        }
        onDone();
      }
    };
    ticker.add(tick);
  }

  /**
   * P-flip / draw-flip: scale.x fake flip + breath + slight random Z tilt (NOT busy).
   * Rotation about card center (product convention).
   */
  flipToFace(
    ids: CardId[],
    state: GameState,
    onDone: () => void,
    ticker: TickerLike,
    toFace: boolean = true,
  ): void {
    const list = ids.slice(0, 12);
    const targets: {
      id: CardId;
      view: CardView;
      card: Card;
      /** peak random Z tilt (rad), unique per card */
      tiltPeak: number;
    }[] = [];
    for (const id of list) {
      const view = this.views.get(id);
      const card = state.cards[id];
      if (!view || !card) continue;
      // Random angle: ±(40%–100%) of max, random sign
      const amp =
        ((PHYS.flipTiltMaxDeg * Math.PI) / 180) *
        (0.4 + Math.random() * 0.6);
      const tiltPeak = (Math.random() < 0.5 ? -1 : 1) * amp;
      targets.push({ id, view, card, tiltPeak });
    }
    if (targets.length === 0) {
      onDone();
      return;
    }
    const w = CARD_W;
    const h = CARD_H;
    for (const { id, view, card } of targets) {
      this.flipping.add(id);
      if (toFace) this.showBack(view, w, h);
      else this.showFace(view, card, w, h, false);
      // Center pivot for flip + tilt
      const c = this.viewCenterOf(view);
      view.root.pivot.set(w / 2, h / 2);
      view.root.x = c.x;
      view.root.y = c.y;
      view.root.scale.set(1, 1);
      view.root.alpha = 1;
      view.root.visible = true;
      view.root.rotation = 0;
    }
    let t = 0;
    const duration = PHYS.flipMs;
    const edge = 0.05;
    let swapped = false;
    const tick = (arg: { deltaMS: number }) => {
      t += arg.deltaMS;
      const u = Math.min(1, t / duration);
      let sx: number;
      let breath: number;
      if (u < 0.5) {
        const p = easeInOutSmooth(u / 0.5);
        sx = 1 - p * (1 - edge);
        breath = 1 + (PHYS.flipBreath - 1) * p;
      } else {
        if (!swapped) {
          swapped = true;
          for (const { view, card } of targets) {
            if (toFace) this.showFace(view, card, w, h, false);
            else this.showBack(view, w, h);
          }
        }
        const p = easeInOutSmooth((u - 0.5) / 0.5);
        sx = edge + p * (1 - edge);
        breath = PHYS.flipBreath + (1 - PHYS.flipBreath) * p;
      }
      // Z tilt peaks mid-flip (sin), settles 0 — slight random angle per card
      const tiltShape = Math.sin(Math.PI * u);
      for (const { view, tiltPeak } of targets) {
        view.root.scale.set(sx * breath, breath);
        view.root.rotation = tiltPeak * tiltShape;
      }
      if (u >= 1) {
        ticker.remove(tick);
        for (const { id, view } of targets) {
          this.flipping.delete(id);
          view.root.scale.set(1, 1);
          view.root.rotation = 0;
          // Restore top-left layout pivot
          view.root.x -= w / 2;
          view.root.y -= h / 2;
          view.root.pivot.set(0, 0);
        }
        onDone();
      }
    };
    ticker.add(tick);
  }

  /** Draw: fly from stock rect to waste then flip face. */
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
    const stock = getStockRect();
    const waste = getWasteRect();
    this.drawMoving = true;
    this.animating.add(id);
    view.root.visible = true;
    view.root.x = stock.x;
    view.root.y = stock.y;
    view.root.zIndex = 5500;
    view.root.alpha = 1;
    view.root.scale.set(1);
    view.root.rotation = 0;
    this.showBack(view, CARD_W, CARD_H, { shadow: true });
    let t = 0;
    const moveMs = PHYS.drawMoveMs;
    const tickMove = (arg: { deltaMS: number }) => {
      t += arg.deltaMS;
      const u = Math.min(1, t / moveMs);
      const e = easeOutQuad(u);
      view.root.x = stock.x + (waste.x - stock.x) * e;
      view.root.y = stock.y + (waste.y - stock.y) * e - 20 * Math.sin(Math.PI * u);
      if (u >= 1) {
        ticker.remove(tickMove);
        this.animating.delete(id);
        this.drawMoving = false;
        view.root.x = waste.x;
        view.root.y = waste.y;
        this.flipToFace([id], state, onDone, ticker, true);
      }
    };
    ticker.add(tickMove);
  }

  /**
   * After recycle+draw commit: stagger former waste cards to stock seats as backs,
   * waste top already handled separately or included.
   */
  playRecycleSettle(
    stockIds: CardId[],
    _state: GameState,
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
    const gap = n > 8 ? 20 : PHYS.recGapMs;
    const maxAnimate = n > 16 ? 8 : n;
    let finished = 0;
    const total = maxAnimate;
    const doneOne = () => {
      finished += 1;
      if (finished >= total) {
        this.recycleAnimating = false;
        // snap rest
        for (let i = maxAnimate; i < n; i++) {
          const id = stockIds[i]!;
          const view = this.views.get(id);
          if (!view) continue;
          const off = stockStackOffset(Math.min(i, STOCK_STACK_MAX_VISIBLE - 1));
          view.root.x = stock.x + off.x;
          view.root.y = stock.y + off.y;
          view.root.visible = i < STOCK_STACK_MAX_VISIBLE;
          this.showBack(view, CARD_W, CARD_H, { shadow: false });
        }
        onDone();
      }
    };
    for (let i = 0; i < maxAnimate; i++) {
      const id = stockIds[i]!;
      const view = this.views.get(id);
      if (!view) {
        doneOne();
        continue;
      }
      this.animating.add(id);
      view.root.visible = true;
      view.root.x = waste.x + i * 2;
      view.root.y = waste.y;
      view.root.zIndex = 4000 - i;
      view.root.alpha = 1;
      view.root.scale.set(1);
      this.showBack(view, CARD_W, CARD_H, { shadow: true });
      const off = stockStackOffset(Math.min(i, STOCK_STACK_MAX_VISIBLE - 1));
      const ex = stock.x + off.x;
      const ey = stock.y + off.y;
      const delay = i * gap;
      const startX = view.root.x;
      const startY = view.root.y;
      let t = -delay;
      const moveMs = Math.min(180, PHYS.recCapMs / Math.max(maxAnimate, 1));
      const tick = (arg: { deltaMS: number }) => {
        t += arg.deltaMS;
        if (t < 0) return;
        const u = Math.min(1, t / moveMs);
        const e = easeOutQuad(u);
        view.root.x = startX + (ex - startX) * e;
        view.root.y = startY + (ey - startY) * e;
        if (u >= 1) {
          ticker.remove(tick);
          this.animating.delete(id);
          view.root.x = ex;
          view.root.y = ey;
          if (i >= STOCK_STACK_MAX_VISIBLE) view.root.visible = false;
          this.showBack(view, CARD_W, CARD_H, { shadow: false });
          doneOne();
        }
      };
      ticker.add(tick);
    }
  }

  sync(
    state: GameState,
    skipIds: Iterable<CardId> = [],
    opts?: { holdBackIds?: Iterable<CardId> },
  ): void {
    this.syncEmptySlots(state);
    const skip = new Set(skipIds);
    const holdBack = new Set(opts?.holdBackIds ?? []);
    for (const [id, view] of this.views) {
      if (skip.has(id) || this.animating.has(id) || this.flipping.has(id))
        continue;
      const card = state.cards[id];
      if (!card) {
        view.root.visible = false;
        continue;
      }
      if (!card.alive) {
        view.root.visible = false;
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
            zIndex: 5000,
          });
        } else {
          this.placeRestTopLeft(view, stock.x + off.x, view.baseY, {
            scale: 1,
            zIndex: 50 + (n - idx),
          });
        }

        // Seat shadow is permanent under stock; only drag needs per-card shadow
        const pileShadow = !!drag;
        const free = isFree(state, id);
        if (free && idx === 0) {
          const selected = state.selectedId === id && !drag;
          this.showFace(view, card, stock.w, stock.h, selected, {
            shadow: pileShadow,
          });
          if (selected && !drag) {
            // Selected: scale about card center (same amp as drag)
            this.placeFromTopLeft(view, stock.x + off.x, view.baseY - PHYS.floatY, {
              scale: PHYS.floatScale,
              zIndex: 2000,
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
        view.root.visible = id === top;
        if (id !== top) continue;
        view.baseY = waste.y;
        const drag = this.dragPos.get(id);
        if (drag) {
          this.placeFromTopLeft(view, drag.x, drag.y, {
            scale: PHYS.dragScale,
            zIndex: 5000,
          });
        } else {
          this.placeRestTopLeft(view, waste.x, view.baseY, {
            scale: 1,
            zIndex: 500 + idx,
          });
        }
        const free = isFree(state, id);
        const selected = free && state.selectedId === id && !drag;
        // Permanent waste seat shadow; card shadow only while dragging
        this.showFace(view, card, waste.w, waste.h, selected, {
          shadow: !!drag,
        });
        if (selected && !drag) {
          this.placeFromTopLeft(view, waste.x, view.baseY - PHYS.floatY, {
            scale: PHYS.floatScale,
            zIndex: 2000,
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
          zIndex: 5000,
        });
      } else if (selected) {
        // Selected only: enlarge about card center (convention)
        this.placeFromTopLeft(view, card.rect.x, view.baseY - PHYS.floatY, {
          scale: PHYS.floatScale,
          zIndex: 1000 + card.layer * 10,
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
  }

  /** @deprecated use meetPair + exitPairShared */
  flyAway(ids: CardId[], onDone: () => void, ticker: TickerLike): void {
    this.exitPairShared(ids, onDone, ticker);
  }

  isBusy(): boolean {
    return (
      this.animating.size > 0 ||
      this.dragPos.size > 0 ||
      this.drawMoving ||
      this.recycleAnimating
    );
  }
}
