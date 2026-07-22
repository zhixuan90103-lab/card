import { Container, Graphics, Sprite } from 'pixi.js';
import type { Card, CardId, GameState } from '../core/types';
import { isFree } from '../core/rules';
import { CARD_H, CARD_W, STOCK_STACK_MAX_VISIBLE } from '../data/layout';
import { getCardShadowParams } from '../data/cardShadowRuntime';
import {
  getStockRect,
  getWasteRect,
  stockStackOffset,
} from '../data/pileLayoutRuntime';
import { getBackTexture, getFaceTexture } from './cardAssets';
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

export class CardRenderer {
  readonly root = new Container();
  private views = new Map<CardId, CardView>();
  private animating = new Set<CardId>();
  /** Active drag: design-space top-left of card */
  private dragPos = new Map<CardId, { x: number; y: number }>();
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
    selected: boolean,
    faceUp: boolean,
  ): void {
    g.clear();
    if (selected) {
      g.roundRect(0, 0, w, h, RADIUS);
      g.stroke({
        width: 2.75,
        color: Theme.faceStrokeSelected,
        alignment: 0.5,
      });
      return;
    }
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

  setDragPosition(id: CardId, x: number, y: number): void {
    this.dragPos.set(id, { x, y });
    const view = this.views.get(id);
    if (!view) return;
    view.root.x = x;
    view.root.y = y;
    view.root.zIndex = 5000;
    view.root.alpha = 1;
    view.root.scale.set(1.04);
    // Card carries its own shadow while dragged; pile seat shadow stays put
    this.paintShadow(view.shadow, CARD_W, CARD_H);
  }

  clearDrag(id: CardId): void {
    this.dragPos.delete(id);
  }

  isDragging(id?: CardId): boolean {
    if (id != null) return this.dragPos.has(id);
    return this.dragPos.size > 0;
  }

  /**
   * Animate card back to home layout position, then clear drag.
   */
  snapBack(
    id: CardId,
    home: { x: number; y: number },
    onDone: () => void,
    ticker: {
      add: (fn: (t: { deltaMS: number }) => void) => void;
      remove: (fn: (t: { deltaMS: number }) => void) => void;
    },
  ): void {
    const view = this.views.get(id);
    if (!view) {
      this.dragPos.delete(id);
      onDone();
      return;
    }
    this.animating.add(id);
    const startX = view.root.x;
    const startY = view.root.y;
    let t = 0;
    const duration = 180;
    const tick = (arg: { deltaMS: number }) => {
      t += arg.deltaMS;
      const u = Math.min(1, t / duration);
      const ease = 1 - (1 - u) * (1 - u);
      view.root.x = startX + (home.x - startX) * ease;
      view.root.y = startY + (home.y - startY) * ease;
      view.root.scale.set(1.04 - 0.04 * ease);
      if (u >= 1) {
        ticker.remove(tick);
        this.animating.delete(id);
        this.dragPos.delete(id);
        view.root.scale.set(1);
        onDone();
      }
    };
    ticker.add(tick);
  }

  sync(state: GameState, skipIds: Iterable<CardId> = []): void {
    this.syncEmptySlots(state);
    const skip = new Set(skipIds);
    for (const [id, view] of this.views) {
      if (skip.has(id) || this.animating.has(id)) continue;
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
          view.root.x = drag.x;
          view.root.y = drag.y;
          view.root.zIndex = 5000;
          view.root.scale.set(1.04);
        } else {
          view.root.x = stock.x + off.x;
          view.root.y = view.baseY;
          view.root.zIndex = 50 + (n - idx);
          view.root.scale.set(1);
        }
        view.root.alpha = 1;

        // Seat shadow is permanent under stock; only drag needs per-card shadow
        const pileShadow = !!drag;
        const free = isFree(state, id);
        if (free && idx === 0) {
          const selected = state.selectedId === id && !drag;
          this.showFace(view, card, stock.w, stock.h, selected, {
            shadow: pileShadow,
          });
          if (selected && !drag) {
            view.root.y = view.baseY - 4;
            view.root.zIndex = 2000;
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
          view.root.x = drag.x;
          view.root.y = drag.y;
          view.root.zIndex = 5000;
          view.root.scale.set(1.04);
        } else {
          view.root.x = waste.x;
          view.root.y = view.baseY;
          view.root.zIndex = 500 + idx;
          view.root.scale.set(1);
        }
        view.root.alpha = 1;
        const free = isFree(state, id);
        const selected = free && state.selectedId === id && !drag;
        // Permanent waste seat shadow; card shadow only while dragging
        this.showFace(view, card, waste.w, waste.h, selected, {
          shadow: !!drag,
        });
        if (selected && !drag) {
          view.root.y = view.baseY - 4;
          view.root.zIndex = 2000;
        }
        continue;
      }

      // puzzle
      const free = isFree(state, id);
      const selected = free && state.selectedId === id;
      view.root.visible = true;
      view.baseY = card.rect.y;
      const drag = this.dragPos.get(id);
      if (drag) {
        view.root.x = drag.x;
        view.root.y = drag.y;
        view.root.zIndex = 5000;
        view.root.scale.set(1.04);
      } else {
        view.root.x = card.rect.x;
        view.root.y = selected ? view.baseY - 4 : view.baseY;
        view.root.zIndex = selected ? 1000 + card.layer * 10 : card.layer * 10;
        view.root.scale.set(1);
      }
      view.root.alpha = 1;

      if (free || drag) {
        this.showFace(view, card, card.rect.w, card.rect.h, selected && !drag);
      } else {
        this.showBack(view, card.rect.w, card.rect.h);
      }
    }
  }

  flyAway(
    ids: CardId[],
    onDone: () => void,
    ticker: {
      add: (fn: (t: { deltaMS: number }) => void) => void;
      remove: (fn: (t: { deltaMS: number }) => void) => void;
    },
  ): void {
    const targets = ids
      .map((id) => this.views.get(id))
      .filter((v): v is CardView => !!v);
    if (targets.length === 0) {
      onDone();
      return;
    }
    for (const id of ids) this.animating.add(id);

    let t = 0;
    const duration = 280;
    const tick = (arg: { deltaMS: number }) => {
      t += arg.deltaMS;
      const u = Math.min(1, t / duration);
      const ease = 1 - (1 - u) * (1 - u);
      for (const view of targets) {
        view.root.y -= 1.2 * (arg.deltaMS / 16);
        view.root.alpha = 1 - ease;
        view.root.scale.set(1 - ease * 0.35);
      }
      if (u >= 1) {
        ticker.remove(tick);
        for (const id of ids) this.animating.delete(id);
        for (const view of targets) {
          view.root.visible = false;
          view.root.alpha = 1;
          view.root.scale.set(1);
        }
        onDone();
      }
    };
    ticker.add(tick);
  }

  isBusy(): boolean {
    return this.animating.size > 0 || this.dragPos.size > 0;
  }
}
