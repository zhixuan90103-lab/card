/** Card rank — pair match is rank-only (suit is cosmetic). */
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

export type Suit = 'S' | 'H' | 'D' | 'C';

export type CardId = string;

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Card = {
  id: CardId;
  rank: Rank;
  suit?: Suit;
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
