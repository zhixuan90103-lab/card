/**
 * Level 01 入口：固定几何 + 随机配点（见 level01Deal.ts）
 */
export {
  buildLevel01,
  buildLevel01WithMeta,
  dealLevel01,
  LEVEL01_DEAL_STOCK_TARGET,
  LEVEL01_MAX_LOCKS,
  type Level01DealMeta,
} from './level01Deal';

/** 布局计数（几何固定，与 seed 无关） */
export const LEVEL01_LAYOUT = {
  cols: 5,
  rows: 4,
  perGroup: 3,
  l2PerGroup: 2,
  l0Groups: 20,
  l1Groups: 12,
  l2Groups: 6,
  l3Groups: 0,
  get totalCards() {
    return (
      (this.l0Groups + this.l1Groups) * this.perGroup +
      this.l2Groups * this.l2PerGroup
    );
  },
} as const;

export const LEVEL01_BOTTOM = {
  cols: 5,
  rows: 4,
  perGroup: 3,
  totalCards: LEVEL01_LAYOUT.totalCards,
} as const;

/** 测试用固定 seed */
export const LEVEL01_TEST_SEED = 20260722;
