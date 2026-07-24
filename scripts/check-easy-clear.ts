import { buildLevel01WithMeta } from '../src/data/level01';
import { canFullyClear, probeGreedyProgress } from '../src/data/levelSolve';

const seeds = [1, 2, 3, 11, 42, 1223601648, 2679703075];

for (const seed of seeds) {
  const { level, meta } = buildLevel01WithMeta(seed, 'easy');
  const probe = probeGreedyProgress(level, seed + 1);
  console.log(
    [
      `seed=${seed}`,
      `dealSeed=${meta.seed}`,
      `clear=${canFullyClear(level, seed + 1)}`,
      `firstStall=${probe.matchesBeforeFirstStall}`,
      `puzzleAtStall=${probe.puzzleAtFirstStall}`,
      `stock=${level.stock.length}`,
      `jokers=${meta.jokerIds.length}`,
    ].join(' '),
  );
}
