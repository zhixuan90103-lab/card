import { GameSession, pickCard } from './core';
import { isHardDead, isSoftStuck } from './core/stuck';
import type { Level } from './core/types';
import {
  STOCK_RECT,
  STOCK_STACK_DX,
  STOCK_STACK_MAX_VISIBLE,
  WASTE_RECT,
} from './data/layout';
import { LEVELS, nextLevel, dealNewLevel01 } from './data/levels';
import { createPixiApp } from './render/app';
import { CardRenderer } from './render/cards';
import { Hud } from './ui/hud';
import { screenToDesign } from './viewport/design';
import { getPhoneFrameEl } from './viewport/phoneFrame';

/** Keep stock/waste card rects aligned for logical pickCard (D17). */
function syncPileRects(session: GameSession): void {
  const st = session.getState();
  for (const id of st.stock) {
    const c = st.cards[id];
    if (c) c.rect = { ...STOCK_RECT };
  }
  for (const id of st.waste) {
    const c = st.cards[id];
    if (c) c.rect = { ...WASTE_RECT };
  }
}

async function main(): Promise<void> {
  /** 每局独立 seed：布局骨架同，点数/锁位随机 */
  let level: Level = dealNewLevel01();
  let session = new GameSession(level, {
    shuffleSeed: Math.floor(Math.random() * 1e9),
  });
  /** Draws without a match since last soft-tip reset (for soft stuck). */
  let drawsWithoutMatch = 0;
  let softTipShown = false;

  syncPileRects(session);

  const { app, world, destroy } = await createPixiApp();
  const cards = new CardRenderer();
  world.addChild(cards.root);
  cards.bootstrap(session.getState());

  const hudHost = document.getElementById('hud');
  if (!hudHost) throw new Error('#hud missing');

  let hud!: Hud;

  const loadLevel = (next: Level) => {
    level = next;
    session = new GameSession(level, {
      shuffleSeed: Math.floor(Math.random() * 1e9),
    });
    drawsWithoutMatch = 0;
    softTipShown = false;
    syncPileRects(session);
    cards.bootstrap(session.getState());
    refresh();
  };

  const restartFreshDeal = () => {
    level = dealNewLevel01();
    session = new GameSession(level, {
      shuffleSeed: Math.floor(Math.random() * 1e9),
    });
    drawsWithoutMatch = 0;
    softTipShown = false;
    syncPileRects(session);
    cards.bootstrap(session.getState());
    refresh();
  };

  const softTipText = (): string | null => {
    if (softTipShown) return '试试撤销或重开 · 或继续抽牌洗回';
    return null;
  };

  const refresh = () => {
    syncPileRects(session);
    cards.sync(session.getState());
    const st = session.getState();
    const hard = isHardDead(st);
    hud.sync(st, {
      canUndo: session.canUndo(),
      levelName: level.name ?? level.id,
      teachHint: level.teachHint,
      softTip: softTipText(),
      hardDead: hard,
      hasNextLevel: !!nextLevel(level.id),
    });
  };

  hud = new Hud(hudHost, {
    onDraw: () => {
      if (cards.isBusy() || session.getState().status === 'won') return;
      const before = session.getState();
      const stockBefore = before.stock.length + before.waste.length;
      const { drew } = session.draw();
      if (drew) {
        drawsWithoutMatch += 1;
        // Soft tip: no immediate pair path and drew roughly a full cycle
        const st = session.getState();
        if (
          isSoftStuck(st) &&
          drawsWithoutMatch >= Math.max(3, Math.min(stockBefore, 8))
        ) {
          softTipShown = true;
        }
      }
      refresh();
    },
    onUndo: () => {
      if (cards.isBusy()) return;
      if (session.undo()) {
        drawsWithoutMatch = Math.max(0, drawsWithoutMatch - 1);
        refresh();
      }
    },
    onRestart: () => {
      // 重开：同几何骨架，重新 deal（锁/钥匙/点数随机）
      restartFreshDeal();
    },
    onNextLevel: () => {
      const n = nextLevel(level.id);
      if (n) loadLevel(n);
    },
  });

  refresh();

  const frame = getPhoneFrameEl();
  const canvas = app.canvas as HTMLCanvasElement;

  const onPointer = (clientX: number, clientY: number) => {
    if (cards.isBusy() || session.getState().status === 'won') return;
    if (isHardDead(session.getState())) return;

    const rect = frame.getBoundingClientRect();
    const p = screenToDesign(clientX, clientY, rect);

    // Hit full stock stack footprint (top + leftward horizontal peek)
    const stockVis = Math.min(
      session.getState().stock.length,
      STOCK_STACK_MAX_VISIBLE,
    );
    const stockExtra = Math.max(0, stockVis - 1);
    const stockLeft = STOCK_RECT.x + stockExtra * STOCK_STACK_DX; // DX < 0
    const stockRight = STOCK_RECT.x + STOCK_RECT.w;
    if (
      p.x >= stockLeft &&
      p.x <= stockRight &&
      p.y >= STOCK_RECT.y &&
      p.y <= STOCK_RECT.y + STOCK_RECT.h
    ) {
      // 抽牌区只抽牌，不参与「清桌后收尾配对」
      const stockBefore =
        session.getState().stock.length + session.getState().waste.length;
      const { drew } = session.draw();
      if (drew) {
        drawsWithoutMatch += 1;
        const st = session.getState();
        if (
          isSoftStuck(st) &&
          drawsWithoutMatch >= Math.max(3, Math.min(stockBefore, 8))
        ) {
          softTipShown = true;
        }
      }
      refresh();
      return;
    }

    syncPileRects(session);
    const id = pickCard(session.getState(), p);
    if (!id) return;

    const selectedBefore = session.getState().selectedId;
    const result = session.tapCard(id);

    if (result.matched && selectedBefore) {
      drawsWithoutMatch = 0;
      softTipShown = false;
      const pair = [selectedBefore, id];
      cards.sync(session.getState(), pair);
      refresh();
      cards.flyAway(pair, () => refresh(), app.ticker);
      return;
    }

    refresh();
  };

  canvas.addEventListener(
    'pointerup',
    (e) => {
      e.preventDefault();
      onPointer(e.clientX, e.clientY);
    },
    { passive: false },
  );

  canvas.addEventListener(
    'touchmove',
    (e) => e.preventDefault(),
    { passive: false },
  );

  if (import.meta.hot) {
    import.meta.hot.dispose(() => destroy());
  }

  console.info(
    '[card-mvp] M1 —',
    LEVELS.length,
    'levels, start',
    level.id,
  );
}

main().catch((err) => {
  console.error(err);
  document.body.innerHTML = `<pre style="color:#f88;padding:16px">${String(err)}</pre>`;
});
