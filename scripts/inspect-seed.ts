import { freeCardIds } from '../src/core/rules';
import { createStateFromLevel } from '../src/core/state';
import { matchKeyOf, SUIT_GLYPH } from '../src/core/types';
import { buildLevel01WithMeta } from '../src/data/level01';
import { canFullyClear, probeGreedyProgress } from '../src/data/levelSolve';

const seed = Number(process.argv[2] ?? 928408864) >>> 0;
const difficulty = (process.argv[3] ?? 'easy') as 'easy' | 'hard' | 'extreme';
const { level, meta } = buildLevel01WithMeta(seed, difficulty);
const state = createStateFromLevel(level);
const free = new Set(freeCardIds(state));
const probe = probeGreedyProgress(level, meta.seed + 1);

const label = (c: { rank: string; suit?: string; joker?: boolean }) =>
  c.joker ? 'Joker' : `${c.rank}${c.suit ? SUIT_GLYPH[c.suit as 'H' | 'S'] : '?'}`;

console.log(`requestSeed=${seed} dealSeed=${meta.seed} difficulty=${meta.difficulty}`);
console.log(`stock=${level.stock.length} clear=${canFullyClear(level, meta.seed + 1)}`);
console.log(
  `firstStall=${probe.matchesBeforeFirstStall} puzzleAtStall=${probe.puzzleAtFirstStall}`,
);
console.log(`jokers=${meta.jokerIds.join(',')} reveal=${meta.jokerReveal}`);

console.log('\ninitial free:');
for (const id of [...free].sort()) {
  const c = state.cards[id]!;
  console.log(`  ${id} ${label(c)} key=${matchKeyOf(c)} tier=${c.tier} layer=${c.layer}`);
}

console.log('\nall 4 black:');
for (const c of Object.values(state.cards)) {
  if (c.rank === '4' && c.suit === 'S') {
    console.log(
      `  ${c.id} ${label(c)} zone=${c.zone} free=${free.has(c.id)} tier=${c.tier} layer=${c.layer}`,
    );
  }
}

console.log('\nstock:');
for (const s of level.stock) console.log(`  ${s.id} ${label(s)} key=${matchKeyOf(s)}`);
