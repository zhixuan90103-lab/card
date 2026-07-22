/**
 * Level01 固定几何骨架（主方案）
 *
 * - 所有槽位、组始终存在，**不挖空**
 * - 坐标固定，重开不变
 * - 谜题变化只通过 rank / 锁钥 / stock（见 level01Deal）
 */
import type { LevelCardDef, Rank, Suit } from '../core/types';
import {
  CARD_W,
  CARD_H,
  GRID_COLS,
  GRID_ROWS,
  cellRect,
  crossSeamRect,
  stackCardY,
} from './layout';

export type GeoGroup = {
  key: string;
  size: number;
  x: number;
  topY: number;
  layerBase: number;
  tier: number;
};

export type LayoutVariant = {
  id: string;
  groups: GeoGroup[];
  /** 开局 free 候选组 = 全部 L2 */
  freeGroupKeys: string[];
  l0Count: number;
  l1Count: number;
  l2Count: number;
};

const L0_SIZE = 3;
const L1_SIZE = 3;
const L2_SIZE = 2;

function l1Anchor(col: number, row: number) {
  return crossSeamRect(col, row);
}

function l2Anchor(col: number, row: number) {
  const a = l1Anchor(col, row);
  const b = l1Anchor(col + 1, row + 1);
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

/**
 * 固定满槽布局（与 seed 无关）
 */
export function generateLayout(_seed?: number): LayoutVariant {
  const groups: GeoGroup[] = [];
  const freeGroupKeys: string[] = [];

  // L0：5×4 全满 ×3
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const { x, y } = cellRect(col, row);
      groups.push({
        key: `g${row}${col}`,
        size: L0_SIZE,
        x,
        topY: y,
        layerBase: 0,
        tier: 0,
      });
    }
  }

  // L1：4×3 全满 ×3
  for (let row = 0; row < GRID_ROWS - 1; row++) {
    for (let col = 0; col < GRID_COLS - 1; col++) {
      const s = l1Anchor(col, row);
      groups.push({
        key: `c${row}${col}`,
        size: L1_SIZE,
        x: s.x,
        topY: s.y,
        layerBase: 3,
        tier: 1,
      });
    }
  }

  // L2：3×2 全满 ×2
  for (let row = 0; row < GRID_ROWS - 2; row++) {
    for (let col = 0; col < GRID_COLS - 2; col++) {
      const s = l2Anchor(col, row);
      const key = `d${row}${col}`;
      freeGroupKeys.push(key);
      groups.push({
        key,
        size: L2_SIZE,
        x: s.x,
        topY: s.y,
        layerBase: 6,
        tier: 2,
      });
    }
  }

  return {
    id: 'fixed-full',
    groups,
    freeGroupKeys,
    l0Count: GRID_COLS * GRID_ROWS,
    l1Count: (GRID_COLS - 1) * (GRID_ROWS - 1),
    l2Count: (GRID_COLS - 2) * (GRID_ROWS - 2),
  };
}

export function materializeCards(
  groups: GeoGroup[],
  ranks: Map<string, Rank[]>,
): LevelCardDef[] {
  const cards: LevelCardDef[] = [];
  for (const g of groups) {
    const rs = ranks.get(g.key);
    if (!rs || rs.length !== g.size) {
      throw new Error(`rank mismatch ${g.key}`);
    }
    for (let i = 0; i < g.size; i++) {
      const depthFromTop = g.size - 1 - i;
      cards.push({
        id: `${g.key}_${i}`,
        rank: rs[i]!,
        /** 占位；level01Deal.paintSuits 会按红黑规则重写 */
        suit: 'S' as Suit,
        layer: g.layerBase + i,
        tier: g.tier,
        x: +g.x.toFixed(1),
        y: +stackCardY(g.topY, depthFromTop).toFixed(1),
        w: CARD_W,
        h: CARD_H,
      });
    }
  }
  return cards;
}
