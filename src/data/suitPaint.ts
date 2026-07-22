/**
 * 给已定 rank 的牌上色（花色），保证：
 * - 强制同色对（开局对、L2 挖掘链、锁钥）
 * - 每个 (rank, color) 全局偶数（R1 色版）
 */
import type { LevelCardDef, Rank, Suit } from '../core/types';
import {
  pickSuitForColor,
  suitColor,
  type CardColor,
} from '../core/types';

export type StockEntry = { id: string; rank: Rank; suit: Suit };

type Uf = { parent: Map<string, string> };

function ufMake(): Uf {
  return { parent: new Map() };
}
function ufFind(uf: Uf, x: string): string {
  if (!uf.parent.has(x)) uf.parent.set(x, x);
  let p = uf.parent.get(x)!;
  if (p !== x) {
    p = ufFind(uf, p);
    uf.parent.set(x, p);
  }
  return p;
}
function ufUnion(uf: Uf, a: string, b: string): void {
  const ra = ufFind(uf, a);
  const rb = ufFind(uf, b);
  if (ra !== rb) uf.parent.set(ra, rb);
}

/**
 * 为 board + stock 上色。
 * forcedSameColorPairs: 必须同色的牌 id 对（须同 rank）
 */
export function paintSuitsOnLevel(
  cards: LevelCardDef[],
  stock: Array<{ id: string; rank: Rank; suit?: Suit }>,
  forcedSameColorPairs: Array<[string, string]>,
  rand: () => number,
): { cards: LevelCardDef[]; stock: StockEntry[] } {
  const idRank = new Map<string, Rank>();
  for (const c of cards) idRank.set(c.id, c.rank);
  for (const s of stock) idRank.set(s.id, s.rank);

  const uf = ufMake();
  for (const id of idRank.keys()) ufFind(uf, id);

  for (const [a, b] of forcedSameColorPairs) {
    if (!idRank.has(a) || !idRank.has(b)) continue;
    if (idRank.get(a) !== idRank.get(b)) continue;
    ufUnion(uf, a, b);
  }

  const suitById = new Map<string, Suit>();

  // 按 rank 分组
  const byRank = new Map<Rank, string[]>();
  for (const [id, r] of idRank) {
    if (!byRank.has(r)) byRank.set(r, []);
    byRank.get(r)!.push(id);
  }

  for (const [, ids] of byRank) {
    // 连通分量
    const comps = new Map<string, string[]>();
    for (const id of ids) {
      const root = ufFind(uf, id);
      if (!comps.has(root)) comps.set(root, []);
      comps.get(root)!.push(id);
    }

    type Comp = { ids: string[]; size: number };
    const list: Comp[] = [...comps.values()].map((cids) => ({
      ids: cids,
      size: cids.length,
    }));

    const odd = list.filter((c) => c.size % 2 === 1);
    const even = list.filter((c) => c.size % 2 === 0);
    const colorOfComp = new Map<Comp, CardColor>();

    // 奇数分量成对涂同色，保证贡献为偶
    for (let i = 0; i + 1 < odd.length; i += 2) {
      const col: CardColor = rand() < 0.5 ? 'red' : 'black';
      colorOfComp.set(odd[i]!, col);
      colorOfComp.set(odd[i + 1]!, col);
    }
    // 偶分量可任选
    for (const c of even) {
      colorOfComp.set(c, rand() < 0.5 ? 'red' : 'black');
    }
    // 理论上 n 偶 ⇒ 奇数分量个数为偶，不会剩 1 个；兜底
    if (odd.length % 2 === 1) {
      const last = odd[odd.length - 1]!;
      colorOfComp.set(last, 'red');
    }

    for (const c of list) {
      const col = colorOfComp.get(c) ?? 'red';
      for (const id of c.ids) {
        suitById.set(id, pickSuitForColor(col, rand));
      }
    }

    // 校验并修正：(rank,color) 计数应为偶——若某色奇，翻转一个 size=1 的牌
    const fixParity = () => {
      let red = 0;
      for (const id of ids) {
        if (suitColor(suitById.get(id)!) === 'red') red += 1;
      }
      const black = ids.length - red;
      if (red % 2 === 0 && black % 2 === 0) return;
      // 找单张分量翻转
      for (const c of list) {
        if (c.size !== 1) continue;
        const id = c.ids[0]!;
        const cur = suitColor(suitById.get(id)!);
        const next: CardColor = cur === 'red' ? 'black' : 'red';
        suitById.set(id, pickSuitForColor(next, rand));
        return;
      }
      // 无单张：翻转整个最小分量（可能破坏「全偶」若 size 偶则翻转后该色 ±even 仍偶）
      // size 偶的分量翻转：red -= size, black += size，parity of red changes by size%2=0，不变！
      // 所以只能靠加 stock 修；此处若仍奇说明 n 奇
    };
    fixParity();
  }

  const outCards = cards.map((c) => ({
    ...c,
    suit: suitById.get(c.id) ?? pickSuitForColor('black', rand),
  }));
  const outStock: StockEntry[] = stock.map((s) => ({
    id: s.id,
    rank: s.rank,
    suit: suitById.get(s.id) ?? pickSuitForColor('red', rand),
  }));

  // 全局再扫：奇 (rank,color) 往 stock 补一张
  const count = new Map<string, number>();
  const bump = (rank: Rank, suit: Suit) => {
    const k = `${rank}_${suitColor(suit)}`;
    count.set(k, (count.get(k) ?? 0) + 1);
  };
  for (const c of outCards) bump(c.rank, c.suit);
  for (const s of outStock) bump(s.rank, s.suit);

  for (const [k, n] of [...count]) {
    if (n % 2 === 0) continue;
    const [rank, color] = k.split('_') as [Rank, CardColor];
    const suit = pickSuitForColor(color, rand);
    outStock.push({
      id: `s${String(outStock.length + 1).padStart(2, '0')}`,
      rank,
      suit,
    });
    count.set(k, n + 1);
  }

  // 重编号 stock id 保持整齐
  const stockFinal = outStock.map((s, i) => ({
    ...s,
    id: `s${String(i + 1).padStart(2, '0')}`,
  }));

  return { cards: outCards, stock: stockFinal };
}
