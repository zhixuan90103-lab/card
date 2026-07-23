import { GameSession, pickCard } from './core';
import { freeCardIds } from './core/rules';
import { isHardDead, isSoftStuck } from './core/stuck';
import type { CardId, GameState, Level } from './core/types';
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
import { PHYS } from './render/phys';
import { PileTray } from './render/pileTray';
import { Hud } from './ui/hud';
import { mountTrayTuner } from './ui/trayTuner';
import {
  hapticHeavy,
  hapticLight,
  hapticMedium,
  hapticSuccess,
  isNativeApp,
} from './native/haptics';
import { screenToDesign } from './viewport/design';
import { getPhoneFrameEl } from './viewport/phoneFrame';

function freeIdSet(state: GameState): Set<CardId> {
  return new Set(freeCardIds(state));
}

function puzzleNewlyFree(
  freeBefore: Set<CardId>,
  freeAfter: Set<CardId>,
  state: GameState,
  pair: CardId[],
): CardId[] {
  const pairSet = new Set(pair);
  const out: CardId[] = [];
  for (const id of freeAfter) {
    if (freeBefore.has(id) || pairSet.has(id)) continue;
    const c = state.cards[id];
    if (!c || !c.alive || c.zone !== 'puzzle') continue;
    out.push(id);
  }
  return out.slice(0, 12);
}

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
  // Capacitor：真机全屏布局 + 状态栏安全区
  if (isNativeApp()) {
    document.body.classList.add('native-app');
  }

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

  let lastWon = false;
  const refreshHud = () => {
    const st = session.getState();
    const hard = isHardDead(st);
    if (st.status === 'won' && !lastWon) {
      lastWon = true;
      hapticSuccess();
    }
    if (st.status !== 'won') lastWon = false;
    hud.layoutPiles();
    hud.sync(st, {
      canUndo: session.canUndo(),
      levelName: formatRunTitle(run.meta, runIndex),
      teachHint: level.teachHint,
      softTip: softTipText(st),
      hardDead: hard,
    });
  };

  const refresh = () => {
    syncPileRects(session);
    const st = session.getState();
    cards.sync(st);
    cards.syncSelectIdle(st, app.ticker);
    refreshHud();
  };

  /**
   * Physical clear: meet → exitPairShared → flip newly free (14 S2/S3).
   * No full refresh between sync(skip) and exit.
   */
  const playMatchClear = (
    pair: CardId[],
    freeBefore: Set<CardId>,
    opts?: {
      skipMeet?: boolean;
      meetMs?: number;
      /** Release / second-tap poses — animation MUST start here */
      startPoses?: import('./render/cards').CardPose[];
      /** Drag: gather at this card (drop pose), not geometric mid */
      clusterAtId?: CardId;
      /** Drag flick → loft multiplier (1 = nominal; faster drag > 1) */
      throwForceK?: number;
      /** Unit approach dir for throw angle (drag vel); meet uses flyer path */
      approachDir?: { nx: number; ny: number };
      /**
       * Match emptied waste → stock auto-flip already in state.
       * Play normal draw anim (do not teleport onto waste).
       */
      autoDrewId?: CardId | null;
    },
  ) => {
    hapticHeavy();
    const startPoses = opts?.startPoses ?? cards.capturePoses(pair);
    const throwForceK = opts?.throwForceK ?? 1;
    const autoDrewId = opts?.autoDrewId ?? null;
    // Lock pair before sync so !alive cannot hide them mid-frame
    cards.applyMatchStartPoses(startPoses);
    cards.clearHints();
    syncPileRects(session);
    const st = session.getState();
    const freeAfter = freeIdSet(st);
    const toFlip = puzzleNewlyFree(freeBefore, freeAfter, st, pair);
    // Skip pair + auto-drew (and rest of stock) so draw/compact animate from current seats
    const skipSync = [
      ...pair,
      ...(autoDrewId ? [autoDrewId, ...st.stock] : []),
    ];
    cards.sync(st, skipSync, { holdBackIds: toFlip });
    // Re-apply after sync (sync skips pair, but belt-and-suspenders)
    cards.applyMatchStartPoses(startPoses);
    refreshHud();

    // Flip newly-free + optional auto-draw when exit (上抛) starts
    let exitDone = false;
    let flipDone = toFlip.length === 0;
    let autoDrawDone = !autoDrewId;
    const tryFinishClear = () => {
      if (exitDone && flipDone && autoDrawDone) refresh();
    };

    const afterExit = () => {
      exitDone = true;
      tryFinishClear();
    };

    const doExit = (
      carry?: {
        id: CardId;
        vx: number;
        vy: number;
        scale: number;
        approachNx?: number;
        approachNy?: number;
      }[],
      approachDir?: { nx: number; ny: number },
    ) => {
      const after = session.getState();
      // Start reveal flip at the same moment as pair throw
      if (toFlip.length > 0) {
        cards.flipToFace(
          toFlip,
          after,
          () => {
            flipDone = true;
            tryFinishClear();
          },
          app.ticker,
          true,
        );
      }
      // Waste emptied by match → animate auto-draw like player draw
      if (autoDrewId) {
        cards.playDrawMoveFlip(
          autoDrewId,
          after,
          () => {
            autoDrawDone = true;
            tryFinishClear();
          },
          app.ticker,
        );
      }
      // After meet, carry is set → exit must NOT snap back to release poses
      cards.exitPairShared(
        pair,
        afterExit,
        app.ticker,
        carry,
        startPoses,
        throwForceK,
        approachDir ?? opts?.approachDir,
      );
    };

    if (opts?.skipMeet) {
      // Exit launches from release poses directly
      doExit(undefined, opts?.approachDir);
      return;
    }
    cards.meetPair(
      pair,
      doExit,
      app.ticker,
      opts?.meetMs ?? PHYS.meetMs,
      startPoses,
      { clusterAtId: opts?.clusterAtId },
    );
  };

  hud = new Hud(hudHost, {
    onDraw: () => {
      if (cards.isBusy() || session.getState().status === 'won') return;
      doDraw();
    },
    onUndo: () => {
      if (cards.isBusy()) return;
      if (session.undo()) {
        drawsWithoutMatch = Math.max(0, drawsWithoutMatch - 1);
        cards.clearHints();
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

  const DRAG_THRESHOLD = PHYS.dragThreshold;

  type DragState = {
    id: CardId;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    grabDx: number;
    grabDy: number;
    home: { x: number; y: number; w: number; h: number };
    dragging: boolean;
    /** last card top-left in design space (for velocity) */
    lastX: number;
    lastY: number;
    lastT: number;
    /** smoothed design-space velocity of card (px/s) */
    velX: number;
    velY: number;
  };
  let activeDrag: DragState | null = null;

  /** Map measured drag speed → throw loft multiplier */
  const throwForceFromDragSpeed = (speedPxPerSec: number): number => {
    const ref = PHYS.dragThrowRefSpeed;
    // Need very fast flick to approach max (was ref*1.55 → too easy to top out)
    const t = Math.min(1, Math.max(0, speedPxPerSec / (ref * 2.2)));
    // ease-in so only clear flicks push the top end
    const e = t * t;
    return (
      PHYS.dragThrowMinK +
      (PHYS.dragThrowMaxK - PHYS.dragThrowMinK) * e
    );
  };

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
    if (cards.isBusy() || session.getState().status === 'won') return;
    const before = session.getState();
    const stockBefore = before.stock.length + before.waste.length;
    const willRecycle = before.stock.length === 0 && before.waste.length > 0;

    const finish = () => refresh();
    const noteDraw = () => {
      hapticMedium();
      drawsWithoutMatch += 1;
      const st = session.getState();
      if (
        isSoftStuck(st) &&
        drawsWithoutMatch >= Math.max(3, Math.min(stockBefore, 8))
      ) {
        softTipShown = true;
      }
    };

    // Recycle path: ALL waste → stock (anim) → pause → then draw first card
    // so waste is empty during pause (no leftover card in 叠牌区)
    if (willRecycle) {
      const { recycled } = session.draw({ phase: 'recycleOnly' });
      if (!recycled) return;

      cards.clearHints();
      syncPileRects(session);
      const st = session.getState();
      const stockIds = [...st.stock]; // all recycled cards, waste empty
      cards.sync(st, stockIds);
      refreshHud();
      cards.playRecycleSettle(stockIds, st, () => {
        // After all at stock + pause: draw one; avoid full sync thrash (卡顿)
        const { drew } = session.draw({ phase: 'drawOnly' });
        if (!drew) {
          finish();
          return;
        }
        noteDraw();
        syncPileRects(session);
        const after = session.getState();
        const wasteTop = after.waste[after.waste.length - 1];
        if (wasteTop) {
          // Skip flyer + remaining stock — compact anim handles new peeks (no jump)
          cards.sync(after, after.stock.concat(wasteTop));
          refreshHud();
          cards.playDrawMoveFlip(wasteTop, after, finish, app.ticker);
        } else {
          finish();
        }
      }, app.ticker);
      return;
    }

    const { drew, recycled } = session.draw();
    if (!drew && !recycled) return;

    if (drew) noteDraw();

    cards.clearHints();
    syncPileRects(session);
    const st = session.getState();

    if (drew) {
      const wasteTop = st.waste[st.waste.length - 1];
      if (wasteTop) {
        // Skip wasteTop + stock so compact can ease from current peeks
        cards.sync(st, st.stock.concat(wasteTop));
        refreshHud();
        cards.playDrawMoveFlip(wasteTop, st, finish, app.ticker);
        return;
      }
    }
    refresh();
  };

  const doTapCard = (id: CardId) => {
    const freeBefore = freeIdSet(session.getState());
    const selectedBefore = session.getState().selectedId;
    // Capture float/home poses before match mutates selection / alive
    const tapPoses =
      selectedBefore != null
        ? cards.capturePoses([selectedBefore, id])
        : undefined;
    const result = session.tapCard(id);
    if (result.matched && selectedBefore) {
      drawsWithoutMatch = 0;
      softTipShown = false;
      // Tap: A1 (selected) flies to A2 (second tap), then same exit as drag match
      playMatchClear([selectedBefore, id], freeBefore, {
        startPoses: tapPoses,
        clusterAtId: id,
        throwForceK: 1,
        autoDrewId: result.autoDrewId,
      });
      return;
    }
    // Select / reselect / cancel → float + hints
    if (result.cancelled) hapticLight();
    else if (!result.matched) hapticLight();
    const st = session.getState();
    cards.setMatchHints(st, st.selectedId);
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
      // Flipping cards must not be dragged; exiting matched pair not pickable
      if (cards.isFlipping(id) || cards.isExiting(id)) return;
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
        lastX: home.x,
        lastY: home.y,
        lastT: performance.now(),
        velX: 0,
        velY: 0,
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
      const x0 = p.x - activeDrag.grabDx;
      const y0 = p.y - activeDrag.grabDy;
      activeDrag.lastX = x0;
      activeDrag.lastY = y0;
      activeDrag.lastT = performance.now();
      activeDrag.velX = 0;
      activeDrag.velY = 0;
    }

    const cardX = p.x - activeDrag.grabDx;
    const cardY = p.y - activeDrag.grabDy;
    const now = performance.now();
    const dt = (now - activeDrag.lastT) / 1000;
    // Sample drag velocity in design px/s (EMA); ignore huge gaps
    if (dt > 0.002 && dt < 0.08) {
      const ix = (cardX - activeDrag.lastX) / dt;
      const iy = (cardY - activeDrag.lastY) / dt;
      const a = 0.4;
      activeDrag.velX = activeDrag.velX * (1 - a) + ix * a;
      activeDrag.velY = activeDrag.velY * (1 - a) + iy * a;
    }
    activeDrag.lastX = cardX;
    activeDrag.lastY = cardY;
    activeDrag.lastT = now;

    cards.setDragPosition(activeDrag.id, cardX, cardY, app.ticker);
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
    // Cannot drop-match onto a card that is flipping
    if (targetId && cards.isFlipping(targetId)) targetId = null;
    const a = st.cards[drag.id];
    const b = targetId ? st.cards[targetId] : null;

    if (targetId && a && b && canMatchCards(a, b)) {
      const freeBefore = freeIdSet(session.getState());
      // Capture BEFORE clearDrag / match — release finger pose is the start
      const startPoses = cards.capturePoses([drag.id, targetId]);
      const { matched, autoDrewId } = session.tryMatchPair(drag.id, targetId);
      if (matched) {
        drawsWithoutMatch = 0;
        softTipShown = false;
        cards.clearDrag(drag.id);
        // Keep dragged card at release coords (clearDrag only drops drag map)
        cards.applyMatchStartPoses(startPoses);
        // Drag success: NEVER run meet gather.
        // Cross-side (A1 past A2 right / A2 past A1 left) made target slide a long
        // way to cluster — felt like a hitch. Industry pattern: fly out from the
        // exact release poses (finger-up), no second-phase travel.
        // Flick speed → loft: stale if finger paused before release
        let speed = Math.hypot(drag.velX, drag.velY);
        const staleMs = performance.now() - drag.lastT;
        if (staleMs > PHYS.dragVelStaleMs) {
          const damp = Math.max(
            0,
            1 - (staleMs - PHYS.dragVelStaleMs) / 120,
          );
          speed *= damp;
        }
        const throwForceK = throwForceFromDragSpeed(speed);
        // Flick direction → exit throw angle (same idea as A1→A2 fly-in)
        let approachDir: { nx: number; ny: number } | undefined;
        if (speed > 8) {
          approachDir = {
            nx: drag.velX / speed,
            ny: drag.velY / speed,
          };
        }
        playMatchClear([drag.id, targetId], freeBefore, {
          skipMeet: true,
          meetMs: 0,
          startPoses,
          throwForceK,
          approachDir,
          autoDrewId,
        });
        return;
      }
    }

    // Different card / empty: animate back to original seat
    hapticLight();
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
