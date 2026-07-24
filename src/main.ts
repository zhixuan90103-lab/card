import { GameSession, pickCard, type GameSessionSnapshot } from './core';
import { dropMatchTarget, freeCardIds } from './core/rules';
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
  getPuzzleLayoutParams,
  onPuzzleLayoutChange,
} from './data/puzzleLayoutRuntime';
import {
  CONTENT_MODE,
  difficultyForRun,
  formatRunTitle,
  replayRun,
  startNewRun,
  type RunDeal,
} from './data/levels';
import { GameView } from './render/gameView';
import { PHYS } from './render/phys';
import { Hud } from './ui/hud';
import { mountTrayTuner } from './ui/trayTuner';
import {
  hapticHeavy,
  hapticLight,
  hapticMedium,
  hapticSuccess,
  isNativeApp,
} from './native/haptics';
import { waitForForegroundReady, watchAppLifecycle } from './native/appLifecycle';
import { screenToDesign } from './viewport/design';
import { getPhoneFrameEl } from './viewport/phoneFrame';
import { applyShellLayout } from './viewport/shellLayout';

const NATIVE_RESUME_STORAGE_KEY = 'card.nativeResumeSnapshot.v1';

type NativeResumeSnapshot = {
  version: 1;
  savedAt: number;
  runIndex: number;
  runSeed: number;
  difficulty: RunDeal['meta']['difficulty'];
  drawsWithoutMatch: number;
  softTipShown: boolean;
  lastWon: boolean;
  session: GameSessionSnapshot;
};

function readNativeResumeSnapshot(): NativeResumeSnapshot | null {
  if (!isNativeApp()) return null;
  try {
    const raw = window.localStorage.getItem(NATIVE_RESUME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<NativeResumeSnapshot>;
    if (
      parsed.version !== 1 ||
      typeof parsed.runIndex !== 'number' ||
      typeof parsed.runSeed !== 'number' ||
      !parsed.session
    ) {
      return null;
    }
    return parsed as NativeResumeSnapshot;
  } catch (e) {
    console.warn('[lifecycle] failed to read native resume snapshot', e);
    return null;
  }
}

function writeNativeResumeSnapshot(snapshot: NativeResumeSnapshot): void {
  if (!isNativeApp()) return;
  try {
    window.localStorage.setItem(
      NATIVE_RESUME_STORAGE_KEY,
      JSON.stringify(snapshot),
    );
  } catch (e) {
    console.warn('[lifecycle] failed to persist native resume snapshot', e);
  }
}

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
  // Capacitor：真机等比布局 + 米色铺满（避免黑边 / 压扁）
  if (isNativeApp()) {
    document.documentElement.classList.add('native-app');
    document.body.classList.add('native-app');
  }

  // D29: WebGPU-first everywhere; mobile uses no-MSAA + resize debounce (design/22)
  console.info('[card] render policy: WebGPU-first (D29)');

  const restored = readNativeResumeSnapshot();

  /** 单关无限：局号 + seed；第 3/6/9… 局极难 */
  let runIndex = restored?.runIndex ?? 1;
  let run: RunDeal = restored
    ? replayRun(restored.runSeed, restored.difficulty ?? difficultyForRun(runIndex))
    : startNewRun(undefined, difficultyForRun(1));
  let level: Level = run.level;
  let session = restored
    ? GameSession.fromSnapshot(level, restored.session)
    : new GameSession(level, {
        shuffleSeed: Math.floor(Math.random() * 1e9),
        // Cold start plays open-deal; first waste card after cascade
        autoOpenWaste: false,
      });
  let drawsWithoutMatch = restored?.drawsWithoutMatch ?? 0;
  let softTipShown = restored?.softTipShown ?? false;
  let jokerFeverActive = false;

  syncPileRects(session);

  /**
   * D28: view is disposable; GPU lost + resume → full rehydrate.
   * Entire board / trays / juice share one WebGPU-first Application.
   */
  let onGpuLost: () => void = () => {
    console.warn('[lifecycle] GPU lost before handler bound');
  };
  let view = await GameView.mount(session.getState(), {
    onContextLost: () => onGpuLost(),
  });
  let cards = view.cards;
  let app = view.app;
  let canvas = view.canvas;

  const rebindView = () => {
    cards = view.cards;
    app = view.app;
    canvas = view.canvas;
  };

  const hudHost = document.getElementById('hud');
  if (!hudHost) throw new Error('#hud missing');

  let hud!: Hud;

  const applyRun = (
    next: RunDeal,
    opts: { bumpIndex: boolean; skipDeal?: boolean },
  ) => {
    run = next;
    level = next.level;
    if (opts.bumpIndex) runIndex += 1;
    session = new GameSession(level, {
      shuffleSeed: Math.floor(Math.random() * 1e9),
      // Open-deal owns the first waste flip; keep waste empty until anim ends
      autoOpenWaste: opts.skipDeal ? true : false,
    });
    drawsWithoutMatch = 0;
    softTipShown = false;
    syncPileRects(session);
    cards.bootstrap(session.getState());
    cards.clearHints();
    if (opts.skipDeal) {
      refresh();
      return;
    }
    startOpenDeal();
  };

  /** Center-deck deal → stock return → first waste flip (only then waste has a card) */
  const startOpenDeal = () => {
    syncPileRects(session);
    const st = session.getState();
    // Waste must be empty during cascade — red-box seat is blank until handoff
    if (st.waste.length > 0) {
      console.warn('[deal] waste not empty at open-deal start; forcing empty visual');
    }
    const skip = Object.values(st.cards)
      .filter((c) => c.alive && (c.zone === 'puzzle' || c.zone === 'stock'))
      .map((c) => c.id);
    cards.sync(st, skip);
    refreshHud();
    cards.playLevelDeal(st, app.ticker, () => {
      // Strict order: puzzle + stock return finished → then first waste
      const cur = session.getState();
      if (cur.waste.length > 0) {
        refresh();
        return;
      }
      if (cur.stock.length === 0) {
        refresh();
        return;
      }
      const { drew } = session.draw({ phase: 'full' });
      if (!drew) {
        refresh();
        return;
      }
      syncPileRects(session);
      const after = session.getState();
      const wasteTop = after.waste[after.waste.length - 1];
      if (!wasteTop) {
        refresh();
        return;
      }
      cards.sync(after, after.stock.concat(wasteTop));
      refreshHud();
      cards.playDrawMoveFlip(wasteTop, after, () => refresh(), app.ticker);
    });
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
    if (!jokerFeverActive && isHardDead(st)) return null;
    // 仅在仍属软卡时展示（曾触发过阈值）；有立即对则收回
    if (softTipShown && isSoftStuck(st)) {
      return '试试撤销或重开 · 或继续抽牌洗回';
    }
    if (softTipShown && !isSoftStuck(st)) {
      softTipShown = false;
    }
    return null;
  };

  let lastWon = restored?.lastWon ?? false;
  const persistNativeSnapshot = () => {
    writeNativeResumeSnapshot({
      version: 1,
      savedAt: Date.now(),
      runIndex,
      runSeed: run.meta.seed,
      difficulty: run.meta.difficulty ?? difficultyForRun(runIndex),
      drawsWithoutMatch,
      softTipShown,
      lastWon,
      session: session.snapshot(),
    });
  };

  const refreshHud = () => {
    const st = session.getState();
    const hard = !jokerFeverActive && isHardDead(st);
    if (st.status === 'won' && !lastWon) {
      lastWon = true;
      hapticSuccess();
    }
    if (st.status !== 'won') lastWon = false;
    hud.layoutPiles();
    hud.sync(st, {
      canUndo: session.canUndo(),
      levelName: formatRunTitle(run.meta, runIndex),
      gpuBackend: view.backend,
      teachHint: level.teachHint,
      softTip: softTipText(st),
      hardDead: hard,
    });
    persistNativeSnapshot();
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
      onDone?: () => void;
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
      if (exitDone && flipDone && autoDrawDone) {
        refresh();
        opts?.onDone?.();
      }
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

  // Live tuner: 仅桌面调试；真机 / 手机视口不挂载
  const showDevTuner =
    !isNativeApp() &&
    !(
      typeof window !== 'undefined' &&
      (window.matchMedia('(max-width: 520px)').matches ||
        (window.matchMedia('(pointer: coarse)').matches &&
          window.innerWidth < 900))
    );
  // Live shift of puzzle card rects when tuner changes origin
  let puzzleLayoutSnap = getPuzzleLayoutParams();
  const applyPuzzleLayoutDelta = () => {
    const next = getPuzzleLayoutParams();
    const dx = next.originX - puzzleLayoutSnap.originX;
    const dy = next.originY - puzzleLayoutSnap.originY;
    puzzleLayoutSnap = { ...next };
    if (dx === 0 && dy === 0) return;
    const st = session.getState();
    for (const c of Object.values(st.cards)) {
      if (c.zone !== 'puzzle') continue;
      c.rect.x += dx;
      c.rect.y += dy;
    }
    cards.sync(st);
  };

  if (showDevTuner) {
    mountTrayTuner({
      onShadowChange: () => cards.sync(session.getState()),
    });
  }
  // Tuner set/reset emits here → shift live puzzle rects + resync
  onPuzzleLayoutChange(() => applyPuzzleLayoutDelta());
  onDrawZoneChange(() => {
    syncPileRects(session);
    cards.sync(session.getState());
    hud.layoutPiles();
  });

  if (restored) {
    refresh();
  } else {
    startOpenDeal();
  }

  const frame = getPhoneFrameEl();

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
    /** pointerdown time (ms) — intent features / future thr */
    t0: number;
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

  const findJokerFeverPair = (
    st: GameState,
  ): { pair: [CardId, CardId]; magic: boolean } | null => {
    const byKey = new Map<string, CardId[]>();
    const freeOrdinary: CardId[] = [];
    for (const id of freeCardIds(st)) {
      const c = st.cards[id];
      if (!c || !c.alive || c.zone !== 'puzzle' || c.joker) continue;
      freeOrdinary.push(id);
      const key = `${c.rank}_${c.suit}`;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(id);
    }
    for (const ids of byKey.values()) {
      if (ids.length >= 2) {
        return { pair: [ids[0]!, ids[1]!], magic: false };
      }
    }
    for (const id of freeOrdinary) {
      const c = st.cards[id]!;
      const partner = Object.values(st.cards).find(
        (other) =>
          other.id !== id &&
          other.alive &&
          !other.joker &&
          other.zone === 'puzzle' &&
          other.rank === c.rank &&
          other.suit === c.suit,
      );
      if (partner) return { pair: [id, partner.id], magic: true };
    }
    return null;
  };

  const runJokerFever = () => {
    jokerFeverActive = true;
    let chain = 0;
    const maxPairs = 40;

    const finishFever = () => {
      jokerFeverActive = false;
      refresh();
    };

    const step = () => {
      if (cards.isBusy()) {
        setTimeout(step, 60);
        return;
      }
      const st = session.getState();
      if (st.status === 'won' || chain >= maxPairs) {
        finishFever();
        return;
      }
      const found = findJokerFeverPair(st);
      if (!found) {
        finishFever();
        return;
      }
      const { pair, magic } = found;

      const freeBefore = freeIdSet(st);
      if (magic) cards.forceFaceUpForMatch(pair, st);
      const poses = cards.capturePoses(pair);
      const result = magic
        ? session.tryFeverMagicPair(pair[0], pair[1])
        : session.tryMatchPair(pair[0], pair[1]);
      if (!result.matched) {
        finishFever();
        return;
      }
      chain += 1;
      hapticMedium();
      playMatchClear(pair, freeBefore, {
        skipMeet: chain > 1,
        meetMs: Math.max(90, PHYS.meetMs - chain * 8),
        startPoses: poses,
        throwForceK: 1 + Math.min(0.45, chain * 0.035),
        autoDrewId: result.autoDrewId,
        onDone: () => {
          setTimeout(step, Math.max(70, 170 - chain * 8));
        },
      });
    };

    hapticSuccess();
    setTimeout(step, 120);
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
      if (result.jokerFever) jokerFeverActive = true;
      // Tap: A1 (selected) flies to A2 (second tap), then same exit as drag match
      playMatchClear([selectedBefore, id], freeBefore, {
        startPoses: tapPoses,
        clusterAtId: id,
        throwForceK: 1,
        autoDrewId: result.autoDrewId,
        onDone: result.jokerFever ? () => runJokerFever() : undefined,
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
    // pickCard: fat-finger slop + nearest center (fewer wrong taps on mobile).
    syncPileRects(session);
    const id = pickCard(session.getState(), p, {
      hitSlop: PHYS.pickHitSlop,
    });
    if (id) {
      // Flipping cards must not be dragged; exiting matched pair not pickable
      if (cards.isFlipping(id) || cards.isExiting(id)) return;
      const home = cards.getHomePosition(session.getState(), id);
      if (!home) return;
      const now0 = performance.now();
      activeDrag = {
        id,
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        grabDx: p.x - home.x,
        grabDy: p.y - home.y,
        home,
        dragging: false,
        t0: now0,
        lastX: home.x,
        lastY: home.y,
        lastT: now0,
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

    // Drop: multi-probe + canMatch + approach trend + overlap
    // (visual lag can put the card on A2 while finger math alone misses)
    syncPileRects(session);
    const st = session.getState();
    const dropX = p.x - drag.grabDx + drag.home.w / 2;
    const dropY = p.y - drag.grabDy + drag.home.h / 2;
    const visual = cards.getViewCenter(drag.id);
    const origin = {
      x: drag.home.x + drag.home.w / 2,
      y: drag.home.y + drag.home.h / 2,
    };
    const probes: { x: number; y: number }[] = [{ x: dropX, y: dropY }, p];
    if (visual) probes.push(visual);
    let targetId = dropMatchTarget(
      st,
      drag.id,
      { x: dropX, y: dropY },
      {
        probes,
        origin,
        vel: { x: drag.velX, y: drag.velY },
        dragSize: { w: drag.home.w, h: drag.home.h },
        tauScale: PHYS.dropMatchTauScale,
        scoreG: PHYS.dropScoreG,
        scoreM: PHYS.dropScoreM,
        scoreT: PHYS.dropScoreT,
      },
    );
    // Cannot drop-match onto a card that is flipping
    if (targetId && cards.isFlipping(targetId)) targetId = null;
    const a = st.cards[drag.id];
    const b = targetId ? st.cards[targetId] : null;

    if (targetId && a && b && canMatchCards(a, b)) {
      const freeBefore = freeIdSet(session.getState());
      // Capture BEFORE clearDrag / match — release finger pose is the start
      const startPoses = cards.capturePoses([drag.id, targetId]);
      const { matched, jokerFever, autoDrewId } = session.tryMatchPair(drag.id, targetId);
      if (matched) {
        drawsWithoutMatch = 0;
        softTipShown = false;
        if (jokerFever) jokerFeverActive = true;
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
          onDone: jokerFever ? () => runJokerFever() : undefined,
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

  /** Pointer must re-bind after every rehydrate (new GPU canvas / backend). */
  let unbindPointer: (() => void) | null = null;
  const bindPointer = (el: HTMLCanvasElement) => {
    unbindPointer?.();
    const onTouchMove = (e: TouchEvent) => e.preventDefault();
    el.addEventListener('pointerdown', onPointerDown, { passive: false });
    el.addEventListener('pointermove', onPointerMove, { passive: false });
    el.addEventListener('pointerup', onPointerUp, { passive: false });
    el.addEventListener('pointercancel', onPointerCancel, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    unbindPointer = () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerCancel);
      el.removeEventListener('touchmove', onTouchMove);
    };
  };
  bindPointer(canvas);

  /**
   * D28 / design 19 — renderer lifecycle:
   * suspend → stop ticker; drop in-flight drag; never trust GPU
   * resume / GPU lost → FULL rehydrate (WebGPU-first Application + textures) + rebind
   * Soft re-render forbidden (D28).
   */
  let resumeBusy = false;
  let resumeQueued: 'present' | 'rehydrate' | null = null;
  let resumeRetryTimer: ReturnType<typeof setTimeout> | null = null;

  const afterViewReady = () => {
    rebindView();
    bindPointer(canvas);
    applyShellLayout();
    activeDrag = null;
    refresh();
  };

  const afterRehydrate = () => {
    afterViewReady();
    try {
      app.ticker.start();
      app.renderer.render(app.stage);
    } catch (e) {
      console.warn('[lifecycle] post-rehydrate render', e);
    }
  };

  const afterResumePresent = () => {
    afterViewReady();
    view.present();
  };

  const runQueuedResume = () => {
    const mode = resumeQueued;
    resumeQueued = null;
    if (mode === 'rehydrate') runResumeRehydrate();
    else if (mode === 'present') runResumePresent();
  };

  const scheduleResumeRetry = (
    mode: 'present' | 'rehydrate',
    delayMs = 300,
  ) => {
    if (resumeRetryTimer) clearTimeout(resumeRetryTimer);
    resumeRetryTimer = setTimeout(() => {
      resumeRetryTimer = null;
      if (mode === 'rehydrate') runResumeRehydrate();
      else runResumePresent();
    }, delayMs);
  };

  const runResumeRehydrate = () => {
    if (resumeRetryTimer) {
      clearTimeout(resumeRetryTimer);
      resumeRetryTimer = null;
    }
    // Native may call resume while document.hidden is still true for one frame —
    // do not gate on document.hidden here (appLifecycle already decided foreground).
    if (resumeBusy) {
      resumeQueued = 'rehydrate';
      return;
    }
    resumeBusy = true;
    resumeQueued = null;
    void (async () => {
      try {
        if (!(await waitForForegroundReady())) {
          console.warn('[lifecycle] foreground not ready; retry rehydrate');
          scheduleResumeRetry('rehydrate', 300);
          return;
        }
        applyShellLayout();
        syncPileRects(session);
        await view.rehydrate(session.getState());
        afterRehydrate();
      } catch (e) {
        console.error('[lifecycle] rehydrate failed', e);
        try {
          await new Promise((r) => setTimeout(r, 200));
          if (!(await waitForForegroundReady())) {
            console.warn('[lifecycle] foreground not ready after failure; retry');
            scheduleResumeRetry('rehydrate', 500);
            return;
          }
          applyShellLayout();
          await view.rehydrate(session.getState());
          afterRehydrate();
        } catch (e2) {
          console.error('[lifecycle] rehydrate retry failed', e2);
        }
      } finally {
        resumeBusy = false;
        runQueuedResume();
      }
    })();
  };

  const runResumePresent = () => {
    if (resumeRetryTimer) {
      clearTimeout(resumeRetryTimer);
      resumeRetryTimer = null;
    }
    if (resumeBusy) {
      if (resumeQueued !== 'rehydrate') resumeQueued = 'present';
      return;
    }
    resumeBusy = true;
    resumeQueued = null;
    void (async () => {
      try {
        if (!(await waitForForegroundReady())) {
          console.warn('[lifecycle] foreground not ready; retry present');
          scheduleResumeRetry('present', 300);
          return;
        }
        applyShellLayout();
        syncPileRects(session);
        afterResumePresent();
      } catch (e) {
        console.error('[lifecycle] present resume failed', e);
        runResumeRehydrate();
      } finally {
        resumeBusy = false;
        runQueuedResume();
      }
    })();
  };

  onGpuLost = () => {
    // Same path as resume: tear down + rebuild (device.lost / webglcontextlost)
    runResumeRehydrate();
  };

  const lifecycle = watchAppLifecycle({
    onSuspend: () => {
      if (resumeRetryTimer) {
        clearTimeout(resumeRetryTimer);
        resumeRetryTimer = null;
      }
      activeDrag = null;
      persistNativeSnapshot();
      view.suspend();
    },
    onResume: () => {
      if (isNativeApp()) {
        persistNativeSnapshot();
        console.info('[lifecycle] native resume handled by bridge rebuild');
        return;
      }
      runResumeRehydrate();
    },
  });

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      if (resumeRetryTimer) clearTimeout(resumeRetryTimer);
      lifecycle.dispose();
      unbindPointer?.();
      view.destroy();
    });
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
    'gpu',
    view.backend,
    view.prefersWebGpu ? 'policy=webgpu-first' : 'policy=webgl-forced',
    restored ? 'restored=native-snapshot' : 'restored=fresh',
  );
}

main().catch((err) => {
  console.error(err);
  document.body.innerHTML = `<pre style="color:#f88;padding:16px">${String(err)}</pre>`;
});
