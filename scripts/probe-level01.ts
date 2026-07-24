import { buildLevel01WithMeta } from '../src/data/level01';

const rows: Array<[number, 'easy' | 'hard' | 'extreme']> = [
  [20260722, 'hard'],
  [11, 'hard'],
  [99, 'hard'],
  [2679703075, 'easy'],
  [1223601648, 'easy'],
];

for (const [seed, difficulty] of rows) {
  const t0 = Date.now();
  try {
    const { level, meta } = buildLevel01WithMeta(seed, difficulty);
    console.log(
      [
        seed,
        difficulty,
        `${Date.now() - t0}ms`,
        `dealSeed=${meta.seed}`,
        `locks=${meta.lockCount}`,
        `stock=${level.stock.length}`,
        `jokers=${meta.jokerIds.length}`,
      ].join(' '),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`${seed} ${difficulty} ${Date.now() - t0}ms ERROR ${msg}`);
  }
}
