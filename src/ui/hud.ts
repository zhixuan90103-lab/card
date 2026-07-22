import type { GameState } from '../core/types';
import { STOCK_RECT, WASTE_RECT } from '../data/layout';
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

  constructor(host: HTMLElement, handlers: HudHandlers) {
    host.innerHTML = '';

    const mkBtn = (label: string, onClick: () => void, bg = '#2f6fed') => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.className = 'interactive';
      b.style.cssText = `
        pointer-events: auto;
        border: none;
        border-radius: 10px;
        padding: 10px 14px;
        font-size: 14px;
        font-weight: 600;
        color: #f0f0f0;
        background: ${bg};
        cursor: pointer;
        touch-action: manipulation;
      `;
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
      });
      return b;
    };

    const bar = document.createElement('div');
    bar.className = 'hud-bar interactive';
    bar.style.cssText = `
      position: absolute;
      left: 0; right: 0; bottom: 0;
      padding: max(12px, env(safe-area-inset-bottom, 12px)) 12px 14px;
      display: flex;
      gap: 8px;
      justify-content: center;
      align-items: center;
      background: linear-gradient(transparent, rgba(0,0,0,0.55));
      pointer-events: none;
    `;

    const drawBtn = mkBtn('抽牌', handlers.onDraw);
    this.undoBtn = mkBtn('撤销', handlers.onUndo);
    const restartBtn = mkBtn('重开', handlers.onRestart, '#555');
    const newRunBtn = mkBtn('新局', handlers.onNewRun, '#3d6b4f');
    bar.append(drawBtn, this.undoBtn, restartBtn, newRunBtn);

    this.levelLabel = document.createElement('div');
    this.levelLabel.style.cssText = `
      position: absolute;
      top: max(10px, env(safe-area-inset-top, 10px));
      left: 12px; right: 12px;
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      color: #8fa3c1;
      pointer-events: none;
    `;

    this.statusLabel = document.createElement('div');
    this.statusLabel.style.cssText = `
      position: absolute;
      top: max(28px, calc(env(safe-area-inset-top, 12px) + 16px));
      left: 12px; right: 12px;
      text-align: center;
      font-size: 13px;
      color: #c8d4e8;
      pointer-events: none;
      letter-spacing: 0.02em;
    `;

    this.tipLabel = document.createElement('div');
    this.tipLabel.style.cssText = `
      position: absolute;
      left: 16px; right: 16px;
      bottom: 72px;
      text-align: center;
      font-size: 12px;
      color: #e8c878;
      pointer-events: none;
      display: none;
      text-shadow: 0 1px 2px #000;
    `;

    const pilePairW = WASTE_RECT.x + WASTE_RECT.w - STOCK_RECT.x;
    const stockPos = designPct(STOCK_RECT.x, STOCK_RECT.y + STOCK_RECT.h + 4);
    this.stockLabel = document.createElement('div');
    this.stockLabel.style.cssText = `
      position: absolute;
      left: ${stockPos.left};
      top: ${stockPos.top};
      width: ${(pilePairW / DESIGN_WIDTH) * 100}%;
      font-size: 12px;
      color: #9bb0d0;
      pointer-events: none;
      text-align: center;
    `;

    this.winOverlay = document.createElement('div');
    this.winOverlay.style.cssText = `
      display: none;
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.55);
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 12px;
      pointer-events: auto;
      z-index: 5;
    `;
    this.winTitle = document.createElement('div');
    this.winTitle.textContent = '胜利！';
    this.winTitle.style.cssText = 'color:#fff;font-size:22px;font-weight:700;';
    this.winSub = document.createElement('div');
    this.winSub.textContent = '几何不变 · 再来一局换新配点';
    this.winSub.style.cssText =
      'color:#c8d4e8;font-size:13px;text-align:center;padding:0 24px;';
    this.winNewRunBtn = mkBtn('再来一局', handlers.onNewRun);
    const winReplay = mkBtn('重打本 seed', handlers.onRestart, '#555');
    this.winOverlay.append(
      this.winTitle,
      this.winSub,
      this.winNewRunBtn,
      winReplay,
    );

    this.deadOverlay = document.createElement('div');
    this.deadOverlay.style.cssText = `
      display: none;
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.6);
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 12px;
      pointer-events: auto;
      z-index: 6;
    `;
    const deadTitle = document.createElement('div');
    deadTitle.textContent = '游戏失败';
    deadTitle.style.cssText = 'color:#fff;font-size:22px;font-weight:700;';
    const deadSub = document.createElement('div');
    deadSub.textContent = '当前没有可配对的牌了';
    deadSub.style.cssText =
      'color:#c8d4e8;font-size:14px;text-align:center;padding:0 24px;';
    const deadSub2 = document.createElement('div');
    deadSub2.textContent = '可撤销、重打本 seed，或开新局';
    deadSub2.style.cssText = 'color:#8fa3c1;font-size:13px;';
    const deadUndo = mkBtn('撤销', handlers.onUndo);
    const deadReplay = mkBtn('重打本 seed', handlers.onRestart, '#555');
    const deadNew = mkBtn('新局', handlers.onNewRun, '#3d6b4f');
    this.deadOverlay.append(
      deadTitle,
      deadSub,
      deadSub2,
      deadUndo,
      deadReplay,
      deadNew,
    );

    const pileHintPos = designPct(STOCK_RECT.x, STOCK_RECT.y - 18);
    const pileHint = document.createElement('div');
    pileHint.style.cssText = `
      position: absolute;
      left: ${pileHintPos.left};
      top: ${pileHintPos.top};
      width: ${(STOCK_RECT.w / DESIGN_WIDTH) * 100}%;
      font-size: 11px;
      color: #6a7a90;
      pointer-events: none;
      text-align: center;
    `;
    pileHint.textContent = '抽牌区';

    const wasteHintPos = designPct(WASTE_RECT.x, WASTE_RECT.y - 18);
    const wasteHint = document.createElement('div');
    wasteHint.style.cssText = `
      position: absolute;
      left: ${wasteHintPos.left};
      top: ${wasteHintPos.top};
      width: ${(WASTE_RECT.w / DESIGN_WIDTH) * 100}%;
      font-size: 11px;
      color: #6a7a90;
      pointer-events: none;
      text-align: center;
    `;
    wasteHint.textContent = '抽出叠';

    host.append(
      this.levelLabel,
      this.statusLabel,
      pileHint,
      wasteHint,
      this.stockLabel,
      this.tipLabel,
      bar,
      this.winOverlay,
      this.deadOverlay,
    );
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
    this.undoBtn.style.opacity = opts.canUndo ? '1' : '0.45';

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
      this.statusLabel.textContent = '失败';
      this.tipLabel.style.display = 'none';
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
      opts.teachHint ?? '同点配对 · 盖住的点不到 · 清桌即胜';
  }
}
