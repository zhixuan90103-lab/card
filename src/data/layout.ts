import { DESIGN_HEIGHT, DESIGN_WIDTH } from '../viewport/design';

/**
 * 牌面尺寸 · 2026-07-22 对齐 Poker 资源比例
 * 资源 188×248 ≈ 47:62；槽位 56×74（同比例，避免拉伸发糊）
 * 5 组：5*56 + 4*8 = 312 → 两侧约 40.5
 * 见 docs/design/05_board_layout_consensus.md §2
 *
 * 竖向分区（上→下）：
 *   顶栏文案 → 谜题区 → 抽牌区（stock/waste）→ 底栏按钮
 */
export const CARD_W = 56;
export const CARD_H = 74;

/** Puzzle grid: 横 5 组 × 竖 4 组 */
export const GRID_COLS = 5;
export const GRID_ROWS = 4;

/** Gap between group anchors */
export const GRID_GAP_X = 8;
/** 竖排组间距 */
export const GRID_GAP_Y = 28;

/** 左右留白下限（设计坐标） */
export const GRID_SIDE_MARGIN_MIN = 18;

export const STEP_X = CARD_W + GRID_GAP_X;
export const STEP_Y = CARD_H + GRID_GAP_Y;

const gridContentWidth =
  GRID_COLS * CARD_W + (GRID_COLS - 1) * GRID_GAP_X;

export const GRID_ORIGIN_X = Math.max(
  GRID_SIDE_MARGIN_MIN,
  (DESIGN_WIDTH - gridContentWidth) / 2,
);

/**
 * 谜题区顶边（推荐一档 · 对齐参考图节奏）：
 * 顶栏文案下方略留白，牌阵整体偏中，拇指好够。
 */
export const GRID_ORIGIN_Y = 155;

/** 同槽上漏边：d = round(CARD_H * ratio)，现行 d=9（已定稿） */
export const STACK_OFFSET_RATIO = 0.13;

export function stackOffsetY(): number {
  return Math.round(CARD_H * STACK_OFFSET_RATIO);
}

export function cellRect(col: number, row: number) {
  return {
    x: GRID_ORIGIN_X + col * STEP_X,
    y: GRID_ORIGIN_Y + row * STEP_Y,
    w: CARD_W,
    h: CARD_H,
  };
}

export function hSeamRect(col: number, row: number) {
  const a = cellRect(col, row);
  const b = cellRect(col + 1, row);
  return {
    x: (a.x + b.x) / 2,
    y: a.y,
    w: CARD_W,
    h: CARD_H,
  };
}

export function vSeamRect(col: number, row: number) {
  const a = cellRect(col, row);
  const b = cellRect(col, row + 1);
  return {
    x: a.x,
    y: (a.y + b.y) / 2,
    w: CARD_W,
    h: CARD_H,
  };
}

export function crossSeamRect(col: number, row: number) {
  const a = cellRect(col, row);
  const b = cellRect(col + 1, row + 1);
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    w: CARD_W,
    h: CARD_H,
  };
}

/**
 * Same-slot stack (Q1): top card at baseY; lower cards higher on screen.
 */
export function stackCardY(baseY: number, depthFromTop: number): number {
  return baseY - depthFromTop * stackOffsetY();
}

// ---------------------------------------------------------------------------
// Stock / waste · 置于谜题区下方
// ---------------------------------------------------------------------------

/** L0 最底一行组顶下边缘（同槽上漏边只向上伸，不越过此线） */
export const PUZZLE_BOTTOM_Y =
  GRID_ORIGIN_Y + (GRID_ROWS - 1) * STEP_Y + CARD_H;

/**
 * 谜题区与抽牌区之间的「最小」空隙（约一牌高）。
 * 抽牌靠底栏时，实际间隔会更大，见 PILE_Y。
 */
export const PILE_GAP_FROM_PUZZLE = 72;

/** 底栏按钮预留（设计坐标）；抽牌区不得压进此带 */
export const HUD_BAR_RESERVE = 92;

const pilePairW = CARD_W * 2 + 16;
/** 谜题底 + 最小间隔 → 抽牌不得高于此线（y 更小） */
const pileYMin = PUZZLE_BOTTOM_Y + PILE_GAP_FROM_PUZZLE;
/** 底栏上方 → 抽牌不得低于此线（y 更大） */
const pileYMax = DESIGN_HEIGHT - HUD_BAR_RESERVE - CARD_H;
/**
 * 抽牌区 y：优先贴底栏上方（参考图 E 区偏下），
 * 同时保证与谜题至少 PILE_GAP_FROM_PUZZLE，且不压底栏。
 */
export const PILE_Y = Math.min(Math.max(pileYMin, pileYMax), pileYMax);

/** 抽牌 + 抽出叠水平居中（STOCK_RECT = 组顶/下一张可抽的位置） */
export const STOCK_RECT = {
  x: Math.round((DESIGN_WIDTH - pilePairW) / 2),
  y: PILE_Y,
  w: CARD_W,
  h: CARD_H,
};

export const WASTE_RECT = {
  x: STOCK_RECT.x + CARD_W + 16,
  y: PILE_Y,
  w: CARD_W,
  h: CARD_H,
};

/**
 * 牌库堆叠漏边（未抽出的牌）
 * stock[0] = 下一张可抽 = 视觉最前；index 越大越靠后
 * **仅 X 轴** 向左漏边（负方向），Y 不变
 */
export const STOCK_STACK_DX = -5;
export const STOCK_STACK_DY = 0;
/** 最多画出的漏边层数（再多只加厚感，避免无限延伸） */
export const STOCK_STACK_MAX_VISIBLE = 10;

/** stock 中第 index 张相对 STOCK_RECT 的绘制偏移（0=顶） */
export function stockStackOffset(indexFromTop: number): { x: number; y: number } {
  const d = Math.min(indexFromTop, STOCK_STACK_MAX_VISIBLE - 1);
  return {
    x: d * STOCK_STACK_DX,
    y: 0,
  };
}

/* 抽出叠：仅显示顶牌，同位置覆盖，无漏边偏移 */
