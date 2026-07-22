import { GameSession, pickCard } from './core';
import { isHardDead, isSoftStuck } from './core/stuck';
import type { CardId, Level } from './core/types';
import { canMatchCards } from './core/types';
import { STOCK_STACK_MAX_VISIBLE } from './data/layout';
import {
  getStockRect,
  getStockStackDx,
  getWasteRect,
  onDrawZoneChange,
} from './data/pileLayoutRuntime';
import {
  CONTENT_MODE,
  difficultyForRun,
  formatRunTitle,
  replayRun,
  startNewRun,
  type RunDeal,
} from './data/levels';
import { createPixiApp } from './render/app';
import { loadCardFaceAssets } from './render/cardAssets';
import { CardRenderer } from './render/cards';
import { PileTray } from './render/pileTray';
import { Hud } from './ui/hud';
import { mountTrayTuner } from './ui/trayTuner';
import { screenToDesign } from './viewport/design';
import { getPhoneFrameEl } from './viewport/phoneFrame';

/** Keep stock/waste card rects aligned for logical pickCard (D17). */
function syncPileRects(session: GameSession): void {
  const stock = getStockRect();
  const waste = getWasteRect();
  const st = session.getState();
  for (const id of st.stock) {
    const c = st.cards[id];
    if (c) c.rect = { ...stock };
  }
  for (const id of st.waste) {
    const c = st.cards[id];
    if (c) c.rect = { ...waste };
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
  await loadCardFaceAssets();
  // Tray under draw piles, then cards on top
  const pileTray = new PileTray();
  world.addChild(pileTray.root);
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

  const softTipText = (st: ReturnType<typeof session.getState>): string | null => {
    // 硬死局走结算浮层，不再贴软提示
    if (isHardDead(st)) return null;
    // 仅在仍属软卡时展示（曾触发过阈值）；有立即对则收回
    if (softTipShown && isSoftStuck(st)) {
      return '试试撤销或重开 · 或继续抽牌洗回';
    }
    if (softTipShown && !isSoftStuck(st)) {
      softTipShown = false;
    }
    return null;
  };

  const refresh = () => {
    syncPileRects(session);
    cards.sync(session.getState());
    const st = session.getState();
    const hard = isHardDead(st);
    hud.layoutPiles();
    hud.sync(st, {
      canUndo: session.canUndo(),
      levelName: formatRunTitle(run.meta, runIndex),
      teachHint: level.teachHint,
      softTip: softTipText(st),
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

  // Live tuner: 抽牌区 + 牌阴影
  mountTrayTuner({
    onShadowChange: () => cards.sync(session.getState()),
  });
  onDrawZoneChange(() => {
    syncPileRects(session);
    cards.sync(session.getState());
    hud.layoutPiles();
  });

  refresh();

  const frame = getPhoneFrameEl();
  const canvas = app.canvas as HTMLCanvasElement;

  const DRAG_THRESHOLD = 8; // design px before drag starts

  type DragState = {
    id: CardId;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    grabDx: number;
    grabDy: number;
    home: { x: number; y: number; w: number; h: number };
    dragging: boolean;
  };
  let activeDrag: DragState | null = null;

  const hitStock = (p: { x: number; y: number }): boolean => {
    const stockR = getStockRect();
    const stockVis = Math.min(
      session.getState().stock.length,
      STOCK_STACK_MAX_VISIBLE,
    );
    const stockExtra = Math.max(0, stockVis - 1);
    const stockLeft = stockR.x + stockExtra * getStockStackDx();
    const stockRight = stockR.x + stockR.w;
    return (
      p.x >= stockLeft &&
      p.x <= stockRight &&
      p.y >= stockR.y &&
      p.y <= stockR.y + stockR.h
    );
  };

  const doDraw = () => {
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
  };

  const doTapCard = (id: CardId) => {
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

  const onPointerDown = (e: PointerEvent) => {
    if (cards.isBusy() || session.getState().status === 'won') return;
    if (isHardDead(session.getState())) return;
    e.preventDefault();

    const rect = frame.getBoundingClientRect();
    const p = screenToDesign(e.clientX, e.clientY, rect);

    // Prefer free cards (including waste top). Stock backs are not free → fall through to draw.
    syncPileRects(session);
    const id = pickCard(session.getState(), p);
    if (id) {
      const home = cards.getHomePosition(session.getState(), id);
      if (!home) return;
      activeDrag = {
        id,
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        grabDx: p.x - home.x,
        grabDy: p.y - home.y,
        home,
        dragging: false,
      };
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      return;
    }

    if (hitStock(p)) {
      doDraw();
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!activeDrag || e.pointerId !== activeDrag.pointerId) return;
    e.preventDefault();

    const rect = frame.getBoundingClientRect();
    const p = screenToDesign(e.clientX, e.clientY, rect);

    if (!activeDrag.dragging) {
      const dx = e.clientX - activeDrag.startClientX;
      const dy = e.clientY - activeDrag.startClientY;
      // Approximate design distance via frame scale
      const scale = rect.width / 393;
      const distDesign = Math.hypot(dx, dy) / Math.max(scale, 1e-6);
      if (distDesign < DRAG_THRESHOLD) return;
      activeDrag.dragging = true;
    }

    cards.setDragPosition(
      activeDrag.id,
      p.x - activeDrag.grabDx,
      p.y - activeDrag.grabDy,
    );
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!activeDrag || e.pointerId !== activeDrag.pointerId) return;
    e.preventDefault();
    const drag = activeDrag;
    activeDrag = null;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    const rect = frame.getBoundingClientRect();
    const p = screenToDesign(e.clientX, e.clientY, rect);

    // Tap (no real drag)
    if (!drag.dragging) {
      doTapCard(drag.id);
      return;
    }

    // Drop: use dragged card center for hit (more reliable than finger tip alone)
    syncPileRects(session);
    const st = session.getState();
    const dropX = p.x - drag.grabDx + drag.home.w / 2;
    const dropY = p.y - drag.grabDy + drag.home.h / 2;
    // Prefer center; fall back to pointer if center misses (edge of board)
    let targetId =
      pickCard(st, { x: dropX, y: dropY }, { excludeId: drag.id }) ??
      pickCard(st, p, { excludeId: drag.id });
    const a = st.cards[drag.id];
    const b = targetId ? st.cards[targetId] : null;

    if (targetId && a && b && canMatchCards(a, b)) {
      const { matched } = session.tryMatchPair(drag.id, targetId);
      if (matched) {
        drawsWithoutMatch = 0;
        softTipShown = false;
        cards.clearDrag(drag.id);
        const pair = [drag.id, targetId];
        cards.sync(session.getState(), pair);
        refresh();
        cards.flyAway(pair, () => refresh(), app.ticker);
        return;
      }
    }

    // Different card / empty: animate back to original seat
    cards.snapBack(
      drag.id,
      { x: drag.home.x, y: drag.home.y },
      () => {
        cards.clearDrag(drag.id);
        refresh();
      },
      app.ticker,
    );
  };

  const onPointerCancel = (e: PointerEvent) => {
    if (!activeDrag || e.pointerId !== activeDrag.pointerId) return;
    const drag = activeDrag;
    activeDrag = null;
    if (drag.dragging) {
      cards.snapBack(
        drag.id,
        { x: drag.home.x, y: drag.home.y },
        () => {
          cards.clearDrag(drag.id);
          refresh();
        },
        app.ticker,
      );
    } else {
      cards.clearDrag(drag.id);
    }
  };

  canvas.addEventListener('pointerdown', onPointerDown, { passive: false });
  canvas.addEventListener('pointermove', onPointerMove, { passive: false });
  canvas.addEventListener('pointerup', onPointerUp, { passive: false });
  canvas.addEventListener('pointercancel', onPointerCancel, { passive: false });
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
