/**
 * 点数 + 红黑（D22）
 * 本局只使用两种花色：
 * - 红 = 仅红桃 ♥ (H)
 * - 黑 = 仅黑桃 ♠ (S)
 * 配对：同 rank 且同色（即同花色），异色不可消。
 */
export type Rank =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K';

/** 仅红桃 / 黑桃（方片、梅花不使用） */
export type Suit = 'H' | 'S';

export type CardColor = 'red' | 'black';

export type CardId = string;

export function suitColor(suit: Suit): CardColor {
  return suit === 'H' ? 'red' : 'black';
}

/** 配对键：点数+颜色（如 5_red） */
export function matchKey(rank: Rank, suit: Suit): string {
  return `${rank}_${suitColor(suit)}`;
}

export function matchKeyOf(card: {
  rank: Rank;
  suit?: Suit;
}): string | null {
  if (!card.suit) return null;
  return matchKey(card.rank, card.suit);
}

/** 两张可消：同点且同色（红桃配红桃 / 黑桃配黑桃） */
export function canMatchCards(
  a: { rank: Rank; suit?: Suit },
  b: { rank: Rank; suit?: Suit },
): boolean {
  if (a.rank !== b.rank) return false;
  if (!a.suit || !b.suit) return false;
  return a.suit === b.suit;
}

export const SUIT_GLYPH: Record<Suit, string> = {
  H: '♥',
  S: '♠',
};

export function pickSuitForColor(
  color: CardColor,
  _rand?: () => number,
): Suit {
  return color === 'red' ? 'H' : 'S';
}

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Card = {
  id: CardId;
  rank: Rank;
  /** 必填：红黑匹配依赖花色 */
  suit: Suit;
  /** Fine z within/across stacks (for isCovering + draw order) */
  layer: number;
  /**
   * Board tier (L0=0, L1=1, …).
   * Lower tier cannot flip/free while any higher tier still has alive cards.
   */
  tier: number;
  /** Placement AABB in design coordinates */
  rect: Rect;
  /** Still on board / stock / waste (false after match remove) */
  alive: boolean;
  /**
   * Where the card currently lives.
   * - puzzle: on the layered tableau
   * - stock: draw pile (order = array index)
   * - waste: face-up draw stack (only top free)
   */
  zone: 'puzzle' | 'stock' | 'waste';
};

export type LevelCardDef = {
  id: CardId;
  rank: Rank;
  /** 缺省按黑桃；Level01 deal 会写入真实花色 */
  suit?: Suit;
  layer: number;
  /** Board tier L0=0, L1=1, … (default 0) */
  tier?: number;
  /** Design rect; bottom layer typically snaps to 4×5 grid */
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Level = {
  id: string;
  name?: string;
  /** Short player-facing tip (teaching levels) */
  teachHint?: string;
  /** Optional designer note for insight levels (M1) */
  insightNote?: string;
  cards: LevelCardDef[];
  /** Stock from top-first: first element is drawn first */
  stock: Array<{ id: CardId; rank: Rank; suit?: Suit }>;
  /** Overlap area ratio threshold for covering (0–1 of smaller card) */
  coverThreshold?: number;
};

export type GameStatus = 'playing' | 'won';

export type GameState = {
  levelId: string;
  cards: Record<CardId, Card>;
  /** Draw pile ids, index 0 = next to draw (top of stock) */
  stock: CardId[];
  /** Waste pile ids, last = top (only free waste card) */
  waste: CardId[];
  selectedId: CardId | null;
  status: GameStatus;
  /** Fraction of smaller rect area that must overlap to count as covering */
  coverThreshold: number;
  /** Incremented each mutation for render sync */
  rev: number;
};

export type GameAction =
  | { type: 'TAP_CARD'; id: CardId }
  | { type: 'DRAW' }
  | { type: 'UNDO' }
  | { type: 'RESTART'; level: Level };
