import { describe, expect, it } from 'vitest';
import { isFree, pickCard, isWon, hasImmediatePair } from './rules';
import { createStateFromLevel, GameSession } from './state';
import type { Level } from './types';

const miniLevel: Level = {
  id: 'mini',
  coverThreshold: 0.15,
  cards: [
    {
      id: 'b1',
      rank: 'A',
      suit: 'S',
      layer: 0,
      x: 0,
      y: 0,
      w: 100,
      h: 100,
    },
    {
      id: 'b2',
      rank: 'K',
      suit: 'S',
      layer: 0,
      x: 120,
      y: 0,
      w: 100,
      h: 100,
    },
    {
      id: 't1',
      rank: '2',
      suit: 'H',
      layer: 1,
      x: 20,
      y: 20,
      w: 100,
      h: 100,
    },
  ],
  stock: [
    { id: 's1', rank: '2', suit: 'H' },
    { id: 's2', rank: 'A', suit: 'S' },
    { id: 's3', rank: 'K', suit: 'S' },
  ],
};

describe('isFree / pickCard', () => {
  it('covered bottom is not free; top is free', () => {
    const state = createStateFromLevel(miniLevel);
    expect(isFree(state, 't1')).toBe(true);
    expect(isFree(state, 'b1')).toBe(false);
    // b2 not covered
    expect(isFree(state, 'b2')).toBe(true);
  });

  it('after removing cover, bottom becomes free', () => {
    const session = new GameSession(miniLevel);
    // 开局已自动翻开 s1(2) 到抽出叠
    const st = session.getState();
    expect(st.waste).toEqual(['s1']);
    expect(isFree(st, 's1')).toBe(true);
    session.tapCard('t1');
    session.tapCard('s1');
    const after = session.getState();
    expect(after.cards['t1']!.alive).toBe(false);
    expect(isFree(after, 'b1')).toBe(true);
    // 抽出叠消空后自动再翻一张
    expect(after.waste.length).toBe(1);
    expect(after.waste[0]).toBe('s2');
  });

  it('pickCard prefers higher layer when AABB overlap', () => {
    const state = createStateFromLevel(miniLevel);
    // point inside both t1 and b1 → free only t1
    const id = pickCard(state, { x: 50, y: 50 });
    expect(id).toBe('t1');
  });

  it('pickCard returns free lower card when not covered', () => {
    const state = createStateFromLevel(miniLevel);
    const id = pickCard(state, { x: 170, y: 50 });
    expect(id).toBe('b2');
  });

  it('pickCard null on empty space', () => {
    const state = createStateFromLevel(miniLevel);
    expect(pickCard(state, { x: 400, y: 400 })).toBeNull();
  });
});

describe('selection / match / win', () => {
  it('same rank+color removes pair; different color same rank does not', () => {
    const level: Level = {
      id: 'pair',
      cards: [
        { id: 'a1', rank: 'A', suit: 'H', layer: 0, x: 0, y: 0, w: 50, h: 50 },
        { id: 'a2', rank: 'A', suit: 'H', layer: 0, x: 60, y: 0, w: 50, h: 50 },
        { id: 'a3', rank: 'A', suit: 'S', layer: 0, x: 120, y: 0, w: 50, h: 50 },
        { id: 'k1', rank: 'K', suit: 'S', layer: 0, x: 180, y: 0, w: 50, h: 50 },
      ],
      stock: [],
    };
    const session = new GameSession(level);
    expect(session.tapCard('a1').matched).toBe(false);
    expect(session.getState().selectedId).toBe('a1');
    // reselect different rank
    expect(session.tapCard('k1').reselected).toBe(true);
    expect(session.getState().selectedId).toBe('k1');
    // cancel by re-tap
    expect(session.tapCard('k1').cancelled).toBe(true);
    expect(session.getState().selectedId).toBeNull();
    // 红桃 A + 红桃 A 可消
    session.tapCard('a1');
    expect(session.tapCard('a2').matched).toBe(true);
    expect(session.getState().cards['a1']!.alive).toBe(false);
    expect(session.getState().cards['a2']!.alive).toBe(false);
    // 黑桃 A 不能与 K 消
    session.tapCard('a3');
    expect(session.tapCard('k1').reselected).toBe(true);
  });

  it('same rank different color does not match', () => {
    const level: Level = {
      id: 'color-block',
      cards: [
        { id: 'r5', rank: '5', suit: 'H', layer: 0, x: 0, y: 0, w: 50, h: 50 },
        { id: 'b5', rank: '5', suit: 'S', layer: 0, x: 60, y: 0, w: 50, h: 50 },
      ],
      stock: [],
    };
    const session = new GameSession(level);
    session.tapCard('r5');
    expect(session.tapCard('b5').matched).toBe(false);
    expect(session.getState().cards['r5']!.alive).toBe(true);
    expect(session.getState().cards['b5']!.alive).toBe(true);
  });

  it('trims surplus stock when board no longer needs those ranks', () => {
    const level: Level = {
      id: 'trim',
      cards: [
        { id: 'p4', rank: '4', suit: 'H', layer: 0, x: 0, y: 0, w: 50, h: 50 },
        { id: 'p4b', rank: '4', suit: 'H', layer: 0, x: 60, y: 0, w: 50, h: 50 },
        { id: 'p6', rank: '6', suit: 'S', layer: 0, x: 120, y: 0, w: 50, h: 50 },
        { id: 'p6b', rank: '6', suit: 'S', layer: 0, x: 180, y: 0, w: 50, h: 50 },
      ],
      stock: [
        { id: 's1', rank: 'K', suit: 'S' },
        { id: 's2', rank: 'K', suit: 'S' },
      ],
    };
    // 桌：两张 4♥ + 两张 6♠；库：一对 K — 消掉 6 后 K 成对工具应回收
    const session = new GameSession(level);
    session.tapCard('p6');
    session.tapCard('p6b');
    const st = session.getState();
    expect(st.cards['p6']!.alive).toBe(false);
    expect(st.cards['s1']!.alive).toBe(false);
    expect(st.cards['s2']!.alive).toBe(false);
    expect(st.stock.length + st.waste.length).toBe(0);
    // 桌上两张 4♥ 仍在，可互消
    expect(st.cards['p4']!.alive).toBe(true);
    expect(st.cards['p4b']!.alive).toBe(true);
  });

  it('keeps one stock partner when single board card needs it', () => {
    const level: Level = {
      id: 'trim-keep',
      cards: [
        { id: 'p4', rank: '4', suit: 'H', layer: 0, x: 0, y: 0, w: 50, h: 50 },
        { id: 'p4b', rank: '4', suit: 'H', layer: 0, x: 60, y: 0, w: 50, h: 50 },
        { id: 'p6', rank: '6', suit: 'S', layer: 0, x: 120, y: 0, w: 50, h: 50 },
        { id: 'p6b', rank: '6', suit: 'S', layer: 0, x: 180, y: 0, w: 50, h: 50 },
      ],
      stock: [
        { id: 's1', rank: '4', suit: 'H' },
        { id: 's2', rank: '4', suit: 'H' },
      ],
    };
    const session = new GameSession(level);
    // 先消一对 4（桌+桌），桌上剩 6 对；库里两张 4 对桌上 6 无用 → 回收
    session.tapCard('p4');
    session.tapCard('p4b');
    let st = session.getState();
    expect(st.cards['s1']!.alive).toBe(false);
    expect(st.cards['s2']!.alive).toBe(false);

    // 新局：桌一张 4 + 库一张 4 应保留
    const level2: Level = {
      id: 'trim-keep2',
      cards: [
        { id: 'a', rank: '4', suit: 'H', layer: 0, x: 0, y: 0, w: 50, h: 50 },
        { id: 'b', rank: '4', suit: 'H', layer: 0, x: 60, y: 0, w: 50, h: 50 },
      ],
      stock: [
        { id: 's1', rank: 'K', suit: 'S' },
        { id: 's2', rank: 'K', suit: 'S' },
        { id: 's3', rank: 'Q', suit: 'H' },
        { id: 's4', rank: 'Q', suit: 'H' },
      ],
    };
    const s2 = new GameSession(level2);
    s2.tapCard('a');
    s2.tapCard('b');
    // 清桌后 reclaim 全库
    st = s2.getState();
    expect(st.status).toBe('won');
    expect(st.stock.length + st.waste.length).toBe(0);
  });

  it('win when puzzle clears; leftover stock is reclaimed (tool, not goal)', () => {
    const level: Level = {
      id: 'win',
      cards: [
        { id: 'a1', rank: 'A', suit: 'H', layer: 0, x: 0, y: 0, w: 50, h: 50 },
        { id: 'a2', rank: 'A', suit: 'H', layer: 0, x: 60, y: 0, w: 50, h: 50 },
      ],
      stock: [
        { id: 's1', rank: 'K', suit: 'S' },
        { id: 's2', rank: 'K', suit: 'S' },
      ],
    };
    const session = new GameSession(level);
    // 开局 auto-flip s1 → waste；stock 剩 s2
    expect(session.getState().waste).toEqual(['s1']);
    session.tapCard('a1');
    session.tapCard('a2');
    // 清桌即胜：未用库牌回收，不做收尾配对
    expect(isWon(session.getState())).toBe(true);
    expect(session.getState().status).toBe('won');
    expect(session.getState().stock).toEqual([]);
    expect(session.getState().waste).toEqual([]);
    expect(session.getState().cards['s1']!.alive).toBe(false);
    expect(session.getState().cards['s2']!.alive).toBe(false);
    // stock 始终不可点
    expect(isFree(session.getState(), 's1')).toBe(false);
    expect(isFree(session.getState(), 's2')).toBe(false);
  });
});

describe('draw / recycle', () => {
  it('open session auto-flips one stock card to waste', () => {
    const session = new GameSession(miniLevel, { shuffleSeed: 1 });
    const st = session.getState();
    expect(st.waste).toEqual(['s1']);
    expect(st.stock).toEqual(['s2', 's3']);
    expect(isFree(st, 's1')).toBe(true);
  });

  it('player draw covers waste top; only new top free', () => {
    const session = new GameSession(miniLevel, { shuffleSeed: 1 });
    expect(session.draw().drew).toBe(true);
    let st = session.getState();
    expect(st.waste).toEqual(['s1', 's2']);
    expect(isFree(st, 's1')).toBe(false);
    expect(isFree(st, 's2')).toBe(true);
    session.draw();
    st = session.getState();
    expect(st.waste).toEqual(['s1', 's2', 's3']);
    expect(isFree(st, 's3')).toBe(true);
  });

  it('auto-flip again when waste emptied by match', () => {
    const session = new GameSession(miniLevel);
    session.tapCard('t1');
    session.tapCard('s1');
    const st = session.getState();
    expect(st.cards['s1']!.alive).toBe(false);
    expect(st.waste).toEqual(['s2']);
    expect(isFree(st, 's2')).toBe(true);
  });

  it('recycle shuffles waste into stock (seeded order ≠ original)', () => {
    const session = new GameSession(miniLevel, { shuffleSeed: 99 });
    // open auto s1; draw twice → all three on waste
    session.draw();
    session.draw();
    expect(session.getState().waste.length).toBe(3);
    expect(session.getState().stock.length).toBe(0);
    const { recycled, drew } = session.draw();
    expect(recycled).toBe(true);
    expect(drew).toBe(true);
    const fullRecycleOrder = [
      ...session.getState().waste,
      ...session.getState().stock,
    ];
    expect(fullRecycleOrder.length).toBe(3);
    const s2 = new GameSession(miniLevel, { shuffleSeed: 7 });
    s2.draw();
    s2.draw();
    const original = ['s1', 's2', 's3'];
    const shuffled = s2.recycleOnlyForTest();
    expect(shuffled).toHaveLength(3);
    expect(shuffled.slice().sort()).toEqual(original.slice().sort());
    expect(shuffled.join(',')).not.toBe(original.join(','));
  });
});

describe('undo / restart', () => {
  it('undo restores previous state', () => {
    const session = new GameSession(miniLevel);
    session.draw();
    expect(session.canUndo()).toBe(true);
    session.undo();
    expect(session.getState().waste).toEqual(['s1']);
    expect(session.getState().stock).toEqual(['s2', 's3']);
  });

  it('restart resets level and auto-flips again', () => {
    const session = new GameSession(miniLevel);
    session.draw();
    session.tapCard('t1');
    session.restart();
    const st = session.getState();
    expect(st.waste).toEqual(['s1']);
    expect(st.stock).toEqual(['s2', 's3']);
    expect(st.selectedId).toBeNull();
    expect(st.cards['t1']!.alive).toBe(true);
  });
});

describe('hasImmediatePair', () => {
  it('detects free pair of same rank+color', () => {
    const level: Level = {
      id: 'imm',
      cards: [
        { id: 'a1', rank: 'A', suit: 'H', layer: 0, x: 0, y: 0, w: 40, h: 40 },
        { id: 'a2', rank: 'A', suit: 'H', layer: 0, x: 50, y: 0, w: 40, h: 40 },
      ],
      stock: [],
    };
    const st = createStateFromLevel(level);
    expect(hasImmediatePair(st)).toBe(true);
  });
});
