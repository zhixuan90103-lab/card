import { Container, Graphics } from 'pixi.js';
import {
  getDrawZoneParams,
  getTrayRect,
  onDrawZoneChange,
  type DrawZoneParams,
} from '../data/pileLayoutRuntime';
import { Theme } from './theme';

/**
 * Soft rounded tray behind stock + waste.
 * Geometry comes from pileLayoutRuntime (tuner-driven).
 */
export class PileTray {
  readonly root = new Container();
  private g = new Graphics();
  private unsub: (() => void) | null = null;

  constructor() {
    this.root.label = 'pile-tray';
    this.root.eventMode = 'none';
    this.root.addChild(this.g);
    this.redraw();
    this.unsub = onDrawZoneChange(() => this.redraw());
  }

  getParams(): DrawZoneParams {
    return getDrawZoneParams();
  }

  redraw(): void {
    const { x, y, w, h, radius } = getTrayRect();
    const r = Math.min(radius, w * 0.5, h * 0.5);

    this.g.clear();
    this.g.roundRect(x + 1, y + 2, w, h, r);
    this.g.fill({ color: 0x3a4038, alpha: 0.04 });
    this.g.roundRect(x, y, w, h, r);
    this.g.fill({ color: Theme.tray });
  }

  destroy(): void {
    this.unsub?.();
    this.unsub = null;
  }
}
