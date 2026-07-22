import type { GameState } from '../core/types';
import {
  getDrawZoneParams,
  getStockRect,
  getWasteRect,
} from '../data/pileLayoutRuntime';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '../viewport/design';

/** Design coords → % of phone-frame (HUD is overlaid on the same box). */
function designPct(x: number, y: number): { left: string; top: string } {
  return {
    left: `${(x / DESIGN_WIDTH) * 100}%`,
    top: `${(y / DESIGN_HEIGHT) * 100}%`,
  };
}

export type HudHandlers = {
  onDraw: () => void;
  onUndo: () => void;
  /** 同 seed 重打 */
  onRestart: () => void;
  /** 新 seed 再来一局（单关无限） */
  onNewRun: () => void;
};

export type HudSyncOpts = {
  canUndo: boolean;
  /** 顶栏：第 N 局 · 锁 · seed */
  levelName: string;
  teachHint?: string;
  softTip?: string | null;
  hardDead?: boolean;
};

export class Hud {
  private stockLabel: HTMLElement;
  private statusLabel: HTMLElement;
  private levelLabel: HTMLElement;
  private tipLabel: HTMLElement;
  private winOverlay: HTMLElement;
  private deadOverlay: HTMLElement;
  private undoBtn: HTMLButtonElement;
  private winNewRunBtn: HTMLButtonElement;
  private winTitle: HTMLElement;
  private winSub: HTMLElement;
  private deadTitle: HTMLElement;
  constructor(host: HTMLElement, handlers: HudHandlers) {
    host.innerHTML = '';

    const mkBtn = (
      label: string,
      onClick: () => void,
      variant: 'draw' | 'undo' | 'restart' | 'new' | 'primary' | 'muted',
    ) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.className = `interactive hud-btn hud-btn--${variant}`;
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
      });
      return b;
    };

    const bar = document.createElement('div');
    bar.className = 'hud-bar interactive';

    const drawBtn = mkBtn('抽牌', handlers.onDraw, 'draw');
    this.undoBtn = mkBtn('撤销', handlers.onUndo, 'undo');
    const restartBtn = mkBtn('重开', handlers.onRestart, 'restart');
    const newRunBtn = mkBtn('新局', handlers.onNewRun, 'new');
    bar.append(drawBtn, this.undoBtn, restartBtn, newRunBtn);

    this.levelLabel = document.createElement('div');
    this.levelLabel.className = 'hud-level';

    this.statusLabel = document.createElement('div');
    this.statusLabel.className = 'hud-status';

    this.tipLabel = document.createElement('div');
    this.tipLabel.className = 'hud-tip';

    this.stockLabel = document.createElement('div');
    this.stockLabel.className = 'hud-stock-count';

    this.winOverlay = document.createElement('div');
    this.winOverlay.className = 'hud-overlay';
    this.winOverlay.style.zIndex = '5';
    const winCard = document.createElement('div');
    winCard.className = 'hud-overlay-card';
    this.winTitle = document.createElement('div');
    this.winTitle.className = 'hud-overlay-title';
    this.winTitle.textContent = '胜利！';
    this.winSub = document.createElement('div');
    this.winSub.className = 'hud-overlay-sub';
    this.winSub.textContent = '再来一局换新配点';
    this.winNewRunBtn = mkBtn('再来一局', handlers.onNewRun, 'primary');
    const winReplay = mkBtn('重打本 seed', handlers.onRestart, 'muted');
    winCard.append(this.winTitle, this.winSub, this.winNewRunBtn, winReplay);
    this.winOverlay.append(winCard);

    this.deadOverlay = document.createElement('div');
    this.deadOverlay.className = 'hud-overlay';
    this.deadOverlay.style.zIndex = '6';
    const deadCard = document.createElement('div');
    deadCard.className = 'hud-overlay-card';
    this.deadTitle = document.createElement('div');
    this.deadTitle.className = 'hud-overlay-title';
    this.deadTitle.textContent = '暂时卡住了';
    const deadSub = document.createElement('div');
    deadSub.className = 'hud-overlay-sub';
    deadSub.textContent = '没有可配对的牌了';
    const deadSub2 = document.createElement('div');
    deadSub2.className = 'hud-overlay-sub';
    deadSub2.textContent = '可撤销、重打本局，或开新局';
    const deadUndo = mkBtn('撤销', handlers.onUndo, 'undo');
    const deadReplay = mkBtn('重打本 seed', handlers.onRestart, 'muted');
    const deadNew = mkBtn('新局', handlers.onNewRun, 'new');
    deadCard.append(
      this.deadTitle,
      deadSub,
      deadSub2,
      deadUndo,
      deadReplay,
      deadNew,
    );
    this.deadOverlay.append(deadCard);

    host.append(
      this.levelLabel,
      this.statusLabel,
      this.stockLabel,
      this.tipLabel,
      bar,
      this.winOverlay,
      this.deadOverlay,
    );

    this.layoutPiles();
  }

  /** Reposition stock count after draw-zone tuner moves piles. */
  layoutPiles(): void {
    const stock = getStockRect();
    const waste = getWasteRect();
    const { stockLabelDx, stockLabelDy, stockLabelFontSize } =
      getDrawZoneParams();
    const pairW = waste.x + waste.w - stock.x;

    // Anchor: below stock pile top-left; dx/dy/size tunable in panel
    const stockCountPos = designPct(
      stock.x + stockLabelDx,
      stock.y + stock.h + stockLabelDy,
    );
    this.stockLabel.style.left = stockCountPos.left;
    this.stockLabel.style.top = stockCountPos.top;
    this.stockLabel.style.width = `${(pairW / DESIGN_WIDTH) * 100}%`;
    this.stockLabel.style.fontSize = `${stockLabelFontSize}px`;
  }

  sync(state: GameState, opts: HudSyncOpts): void {
    const stockN = state.stock.length;
    const wasteN = state.waste.length;
    this.stockLabel.textContent =
      stockN > 0
        ? `剩余 ${stockN}`
        : wasteN > 0
          ? '点抽牌洗回'
          : '牌库空';

    this.undoBtn.disabled = !opts.canUndo;

    this.levelLabel.textContent = opts.levelName;

    if (state.status === 'won') {
      this.winOverlay.style.display = 'flex';
      this.deadOverlay.style.display = 'none';
      this.statusLabel.textContent = '胜利';
      this.tipLabel.style.display = 'none';
      this.winTitle.textContent = '胜利！谜题区已清空';
      this.winSub.textContent = '单关无限 · 再来一局换新配点';
      return;
    }

    this.winOverlay.style.display = 'none';

    if (opts.hardDead) {
      this.deadOverlay.style.display = 'flex';
      this.statusLabel.textContent = '卡住了';
      this.tipLabel.style.display = 'none';
      this.deadTitle.textContent = '暂时卡住了';
      return;
    }
    this.deadOverlay.style.display = 'none';

    if (opts.softTip) {
      this.tipLabel.style.display = 'block';
      this.tipLabel.textContent = opts.softTip;
    } else {
      this.tipLabel.style.display = 'none';
    }

    this.statusLabel.textContent =
      opts.teachHint ?? '同色同点配对 · 盖住的点不到 · 清桌即胜';
  }
}
