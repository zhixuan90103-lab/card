import { GameSession, pickCard } from './core';
import { isHardDead, isSoftStuck } from './core/stuck';
import type { Level } from './core/types';
import {
  STOCK_RECT,
  STOCK_STACK_DX,
  STOCK_STACK_MAX_VISIBLE,
  WASTE_RECT,
} from './data/layout';
import {
  CONTENT_MODE,
  difficultyForRun,
  formatRunTitle,
  replayRun,
  startNewRun,
  type RunDeal,
} from './data/levels';
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
  /** 单关无限：局号 + seed；第 3/6/9… 局极难 */
  let runIndex = 1;
  let run: RunDeal = startNewRun(undefined, difficultyForRun(1));
  let level: Level = run.level;
  let session = new GameSession(level, {
    shuffleSeed: Math.floor(Math.random() * 1e9),
  });
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

  const applyRun = (next: RunDeal, opts: { bumpIndex: boolean }) => {
    run = next;
    level = next.level;
    if (opts.bumpIndex) runIndex += 1;
    session = new GameSession(level, {
      shuffleSeed: Math.floor(Math.random() * 1e9),
    });
    drawsWithoutMatch = 0;
    softTipShown = false;
    syncPileRects(session);
    cards.bootstrap(session.getState());
    refresh();
  };

  /** 新 seed 新局（按新局号取难度） */
  const newRun = () => {
    const nextIdx = runIndex + 1;
    applyRun(startNewRun(undefined, difficultyForRun(nextIdx)), {
      bumpIndex: true,
    });
  };

  /** 同一 seed 重打（保留难度档） */
  const replaySameSeed = () => {
    applyRun(
      replayRun(run.meta.seed, run.meta.difficulty ?? 'hard'),
      { bumpIndex: false },
    );
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
      levelName: formatRunTitle(run.meta, runIndex),
      teachHint: level.teachHint,
      softTip: softTipText(),
      hardDead: hard,
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
      // 重开 = 同 seed 再打
      replaySameSeed();
    },
    onNewRun: () => {
      newRun();
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

    const stockVis = Math.min(
      session.getState().stock.length,
      STOCK_STACK_MAX_VISIBLE,
    );
    const stockExtra = Math.max(0, stockVis - 1);
    const stockLeft = STOCK_RECT.x + stockExtra * STOCK_STACK_DX;
    const stockRight = STOCK_RECT.x + STOCK_RECT.w;
    if (
      p.x >= stockLeft &&
      p.x <= stockRight &&
      p.y >= STOCK_RECT.y &&
      p.y <= STOCK_RECT.y + STOCK_RECT.h
    ) {
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
    'pointerdown',
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
    '[card-mvp]',
    CONTENT_MODE,
    'run',
    runIndex,
    run.meta.difficulty,
    'seed',
    run.meta.seed,
    'locks',
    run.meta.lockCount,
  );
}

main().catch((err) => {
  console.error(err);
  document.body.innerHTML = `<pre style="color:#f88;padding:16px">${String(err)}</pre>`;
});
