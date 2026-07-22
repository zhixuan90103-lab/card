import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Card, CardId, GameState } from '../core/types';
import { isFree } from '../core/rules';
import {
  STOCK_RECT,
  STOCK_STACK_MAX_VISIBLE,
  WASTE_RECT,
  stockStackOffset,
} from '../data/layout';

const faceStyle = new TextStyle({
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 20,
  fontWeight: '700',
  fill: 0x1a1a1a,
  align: 'center',
});

const backStyle = new TextStyle({
  fontFamily: 'system-ui, sans-serif',
  fontSize: 16,
  fontWeight: '600',
  fill: 0x9bb0d0,
  align: 'center',
});

type CardView = {
  root: Container;
  body: Graphics;
  label: Text;
  cardId: CardId;
};

export class CardRenderer {
  readonly root = new Container();
  private views = new Map<CardId, CardView>();
  private animating = new Set<CardId>();

  constructor() {
    this.root.label = 'cards';
    this.root.sortableChildren = true;
  }

  /** Build views for all cards once */
  bootstrap(state: GameState): void {
    this.root.removeChildren();
    this.views.clear();
    for (const card of Object.values(state.cards)) {
      const view = this.makeView(card);
      this.views.set(card.id, view);
      this.root.addChild(view.root);
    }
    this.sync(state);
  }

  private makeView(card: Card): CardView {
    const root = new Container();
    root.label = card.id;
    // Logic hit-test only — no engine eventMode for legality
    root.eventMode = 'none';

    const body = new Graphics();
    const label = new Text({ text: card.rank, style: faceStyle });
    label.anchor.set(0.5);
    root.addChild(body, label);
    return { root, body, label, cardId: card.id };
  }

  private drawBody(
    body: Graphics,
    w: number,
    h: number,
    opts: { faceUp: boolean; selected: boolean; free: boolean },
  ): void {
    body.clear();
    const radius = 8;
    if (!opts.faceUp) {
      body.roundRect(0, 0, w, h, radius);
      body.fill({ color: 0x1e3a5f });
      body.stroke({ width: 2, color: 0x3d5a80 });
      // simple back pattern
      body.roundRect(6, 6, w - 12, h - 12, 4);
      body.stroke({ width: 1, color: 0x4a6fa5 });
    } else {
      const fill = opts.free ? 0xf5f0e6 : 0xb0a898;
      body.roundRect(0, 0, w, h, radius);
      body.fill({ color: fill });
      body.stroke({
        width: opts.selected ? 3 : 1.5,
        color: opts.selected ? 0xf0c14a : 0x2a2a2a,
      });
    }
  }

  /**
   * Sync sprites to pure state. Call after every commit.
   * Does not animate — use flyAway for match juice.
   */
  sync(state: GameState, skipIds: Iterable<CardId> = []): void {
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
        // stock[0] = 下一张可抽 = 视觉最前；整摞背面按序漏边
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
        const off = stockStackOffset(idx);
        view.root.visible = true;
        view.root.x = STOCK_RECT.x + off.x;
        view.root.y = STOCK_RECT.y + off.y;
        view.root.zIndex = 50 + (n - idx);
        view.root.alpha = 1;
        view.root.scale.set(1);
        // 谜题清空后牌库顶可 free：亮面便于与抽出叠配对收尾
        const free = isFree(state, id);
        if (free && idx === 0) {
          this.drawBody(view.body, STOCK_RECT.w, STOCK_RECT.h, {
            faceUp: true,
            selected: state.selectedId === id,
            free: true,
          });
          view.label.text = card.rank;
          view.label.style = faceStyle;
          view.label.x = STOCK_RECT.w / 2;
          view.label.y = STOCK_RECT.h / 2;
        } else {
          this.drawBody(view.body, STOCK_RECT.w, STOCK_RECT.h, {
            faceUp: false,
            selected: false,
            free: false,
          });
          view.label.text = '';
          view.label.style = backStyle;
        }
        continue;
      }

      if (card.zone === 'waste') {
        // 抽出叠：只显示顶牌，同位置覆盖（无漏边）
        const top = state.waste[state.waste.length - 1];
        const idx = state.waste.indexOf(id);
        view.root.visible = id === top;
        if (id !== top) continue;
        view.root.x = WASTE_RECT.x;
        view.root.y = WASTE_RECT.y;
        view.root.zIndex = 500 + idx;
        view.root.alpha = 1;
        view.root.scale.set(1);
        const free = isFree(state, id);
        this.drawBody(view.body, WASTE_RECT.w, WASTE_RECT.h, {
          faceUp: true,
          selected: state.selectedId === id,
          free,
        });
        view.label.text = card.rank;
        view.label.style = faceStyle;
        view.label.x = WASTE_RECT.w / 2;
        view.label.y = WASTE_RECT.h / 2;
        continue;
      }

      // puzzle
      const free = isFree(state, id);
      view.root.visible = true;
      view.root.x = card.rect.x;
      view.root.y = card.rect.y;
      view.root.zIndex = card.layer * 10;
      view.root.alpha = 1;
      view.root.scale.set(1);
      this.drawBody(view.body, card.rect.w, card.rect.h, {
        faceUp: free,
        selected: state.selectedId === id,
        free,
      });
      if (free) {
        view.label.text = card.rank;
        view.label.style = faceStyle;
        view.label.x = card.rect.w / 2;
        view.label.y = card.rect.h / 2;
      } else {
        view.label.text = '';
        this.drawBody(view.body, card.rect.w, card.rect.h, {
          faceUp: false,
          selected: false,
          free: false,
        });
      }
    }
  }

  /** Match fly-away animation (presentation only). */
  flyAway(
    ids: CardId[],
    onDone: () => void,
    ticker: { add: (fn: (t: { deltaMS: number }) => void) => void; remove: (fn: (t: { deltaMS: number }) => void) => void },
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
    return this.animating.size > 0;
  }
}
