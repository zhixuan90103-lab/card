import {
  CARD_SHADOW_LIMITS,
  getCardShadowParams,
  resetCardShadowParams,
  setCardShadowParams,
  type CardShadowParams,
} from '../data/cardShadowRuntime';
import {
  DRAW_ZONE_LIMITS,
  getDrawZoneParams,
  getTrayRect,
  resetDrawZoneParams,
  setDrawZoneParams,
  type DrawZoneParams,
} from '../data/pileLayoutRuntime';
import {
  getPuzzleLayoutParams,
  PUZZLE_LAYOUT_LIMITS,
  resetPuzzleLayoutParams,
  setPuzzleLayoutParams,
  type PuzzleLayoutParams,
} from '../data/puzzleLayoutRuntime';

type ZoneKey = keyof DrawZoneParams;
type ShadowKey = keyof CardShadowParams;
type PuzzleKey = keyof PuzzleLayoutParams;

const ZONE_FIELDS: { key: ZoneKey; label: string }[] = [
  { key: 'x', label: 'X偏移(0居中)' },
  { key: 'y', label: 'Y托盘顶' },
  { key: 'w', label: '托盘宽W' },
  { key: 'h', label: '托盘高H' },
  { key: 'radius', label: '圆角R' },
  { key: 'gapStockWaste', label: '两堆间距' },
  { key: 'stockPeek', label: '库叠漏边' },
  { key: 'stockLabelDx', label: '剩余数X' },
  { key: 'stockLabelDy', label: '剩余数Y' },
  { key: 'stockLabelFontSize', label: '剩余数字号' },
];

const PUZZLE_FIELDS: { key: PuzzleKey; label: string }[] = [
  { key: 'originY', label: '谜题顶Y' },
  { key: 'originX', label: '谜题X偏移' },
];

const SHADOW_FIELDS: { key: ShadowKey; label: string }[] = [
  { key: 'offsetX', label: '阴影X' },
  { key: 'offsetY', label: '阴影Y' },
  { key: 'scale', label: '阴影大小' },
  { key: 'alpha', label: '阴影透明' },
];

function addNumberRow(
  body: HTMLElement,
  label: string,
  lim: { min: number; max: number; step?: number },
  getValue: () => number,
  onChange: (v: number) => void,
): { sync: () => void } {
  const step = lim.step ?? 1;
  const row = document.createElement('label');
  row.className = 'tray-tuner__row';
  row.innerHTML = `
    <span class="tray-tuner__label">${label}</span>
    <input type="range" min="${lim.min}" max="${lim.max}" step="${step}" />
    <input type="number" min="${lim.min}" max="${lim.max}" step="${step}" class="tray-tuner__num" />
  `;
  const range = row.querySelector('input[type="range"]') as HTMLInputElement;
  const num = row.querySelector('input[type="number"]') as HTMLInputElement;

  const apply = (v: number) => {
    onChange(v);
    range.value = String(v);
    num.value = String(v);
  };

  range.addEventListener('input', () => apply(Number(range.value)));
  num.addEventListener('change', () => apply(Number(num.value)));
  body.appendChild(row);

  return {
    sync: () => {
      const v = getValue();
      range.value = String(v);
      num.value = String(v);
    },
  };
}

/**
 * Floating panel: puzzle + draw-zone layout + card shadow.
 */
export function mountTrayTuner(opts?: {
  onShadowChange?: () => void;
  onPuzzleChange?: () => void;
}): { destroy: () => void } {
  const host = document.createElement('div');
  host.id = 'tray-tuner';
  host.className = 'tray-tuner';
  host.innerHTML = `
    <div class="tray-tuner__head">
      <strong>美术调参</strong>
      <button type="button" class="tray-tuner__toggle" title="折叠">−</button>
    </div>
    <div class="tray-tuner__scroll">
      <p class="tray-tuner__section">谜题区</p>
      <p class="tray-tuner__hint">顶Y=牌阵最上沿 · X偏移=相对居中 · 默认Y=190</p>
      <div class="tray-tuner__body" data-puzzle></div>
      <p class="tray-tuner__section">抽牌区</p>
      <p class="tray-tuner__hint">X=0 居中 · Y 托盘+牌一起动</p>
      <div class="tray-tuner__body" data-zone></div>
      <p class="tray-tuner__section">牌阴影</p>
      <p class="tray-tuner__hint">大小=相对牌缩放 · XY=相对牌中心偏移 · 透明0~1</p>
      <div class="tray-tuner__body" data-shadow></div>
      <div class="tray-tuner__foot">
        <button type="button" class="tray-tuner__btn" data-act="reset">重置全部</button>
        <button type="button" class="tray-tuner__btn" data-act="copy">复制参数</button>
      </div>
      <pre class="tray-tuner__out"></pre>
    </div>
  `;
  document.body.appendChild(host);

  const puzzleBody = host.querySelector('[data-puzzle]') as HTMLElement;
  const zoneBody = host.querySelector('[data-zone]') as HTMLElement;
  const shadowBody = host.querySelector('[data-shadow]') as HTMLElement;
  const out = host.querySelector('.tray-tuner__out') as HTMLElement;
  const toggleBtn = host.querySelector(
    '.tray-tuner__toggle',
  ) as HTMLButtonElement;

  const syncers: Array<{ sync: () => void }> = [];

  for (const f of PUZZLE_FIELDS) {
    const lim = PUZZLE_LAYOUT_LIMITS[f.key];
    syncers.push(
      addNumberRow(
        puzzleBody,
        f.label,
        lim,
        () => getPuzzleLayoutParams()[f.key],
        (v) => {
          setPuzzleLayoutParams({ [f.key]: v });
          opts?.onPuzzleChange?.();
          dump();
        },
      ),
    );
  }

  for (const f of ZONE_FIELDS) {
    const lim = DRAW_ZONE_LIMITS[f.key];
    syncers.push(
      addNumberRow(
        zoneBody,
        f.label,
        lim,
        () => getDrawZoneParams()[f.key],
        (v) => {
          setDrawZoneParams({ [f.key]: v });
          dump();
        },
      ),
    );
  }

  for (const f of SHADOW_FIELDS) {
    const lim = CARD_SHADOW_LIMITS[f.key];
    syncers.push(
      addNumberRow(
        shadowBody,
        f.label,
        lim,
        () => getCardShadowParams()[f.key],
        (v) => {
          setCardShadowParams({ [f.key]: v });
          opts?.onShadowChange?.();
          dump();
        },
      ),
    );
  }

  const dump = () => {
    for (const s of syncers) s.sync();
    const zone = getDrawZoneParams();
    const shadow = getCardShadowParams();
    const puzzle = getPuzzleLayoutParams();
    const abs = getTrayRect();
    out.textContent = JSON.stringify(
      { puzzle, drawZone: zone, trayAbs: abs, cardShadow: shadow },
      null,
      2,
    );
  };

  dump();

  host.querySelector('[data-act="reset"]')!.addEventListener('click', () => {
    resetPuzzleLayoutParams();
    resetDrawZoneParams();
    resetCardShadowParams();
    opts?.onPuzzleChange?.();
    opts?.onShadowChange?.();
    dump();
  });

  host.querySelector('[data-act="copy"]')!.addEventListener('click', async () => {
    const text = JSON.stringify(
      {
        puzzle: getPuzzleLayoutParams(),
        drawZone: getDrawZoneParams(),
        trayAbs: getTrayRect(),
        cardShadow: getCardShadowParams(),
      },
      null,
      2,
    );
    try {
      await navigator.clipboard.writeText(text);
      out.textContent = text + '\n\n// 已复制';
    } catch {
      out.textContent = text + '\n\n// 复制失败';
    }
  });

  let collapsed = false;
  toggleBtn.addEventListener('click', () => {
    collapsed = !collapsed;
    host.classList.toggle('tray-tuner--collapsed', collapsed);
    toggleBtn.textContent = collapsed ? '+' : '−';
  });

  host.addEventListener(
    'pointerdown',
    (e) => e.stopPropagation(),
    { capture: true },
  );

  return {
    destroy: () => host.remove(),
  };
}
