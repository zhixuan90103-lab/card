/**
 * Physical handfeel POC constants.
 * Meet: short accelerate-into-impact.
 * Exit: split-apart parabola; end when off-screen (exitMs = soft ref only).
 *
 * Pivot convention: card rotation / scale / motion default to **card center**.
 * Only use another pivot when product explicitly requests it.
 */
export const PHYS = {
  floatMs: 100,
  floatY: 10,
  /**
   * Selected card scale — same as dragScale (product: 选中与拖动放大一致).
   * Only the selected card enlarges; match-intent partners stay scale 1.
   */
  floatScale: 1.1,
  /** Selected idle wobble (about card center), very subtle */
  selectWobbleAmpX: 0.35,
  selectWobbleAmpY: 0.45,
  selectWobbleAmpRotDeg: 0.55,
  /** Period of primary bob (ms); secondary uses ~0.73× */
  selectWobblePeriodMs: 2000,
  /** @deprecated intent partners no longer scale; kept for compat */
  hintScale: 1,
  hintMaxCards: 4,
  /**
   * Meet (A1 → A2): ease-in-out + slight arc (natural, still crisp).
   */
  meetMs: 120,
  meetMsPerPx: 0.18,
  meetMsMax: 160,
  /** No mid-path arc (product: straight fly to target) */
  meetArcPx: 0,
  /** Flyer tilt into flight, settles to 0 on land (deg) */
  meetFlyerTiltDeg: 10,
  /** How much meet residual velocity blends into exit (0–1) */
  exitResidualBlend: 0.35,
  /**
   * Throw angle ↔ approach (fly-in / drag vel) link.
   * shared boost along approach unit vector, then still split L/R.
   */
  exitApproachBias: 0.34,
  /** design px/s of approach-aligned velocity add (scaled by loftK) */
  exitApproachSpeed: 320,
  /** Soft ref for main flight; actual end = off-screen or exitHardMs */
  exitMs: 280,
  /** Hard cap so busy never sticks */
  exitHardMs: 700,
  /** rotation during meet (deg, each card opposite) */
  meetRotDeg: 18,
  /** horizontal split velocity (design px / s) */
  exitVx: 420,
  /** initial upward velocity (design px / s, screen y down) — slightly softer loft */
  exitVy0: -1650,
  /** gravity (design px / s^2) — heavy fall after apex */
  exitG: 7000,
  /** base spin (deg/s) at nominal throw force; scales with |v| */
  exitSpinDegPerSec: 900,
  /** per-exit jitter (± fraction of base), keeps feel alive without chaos */
  exitJitterVx: 0.18,
  exitJitterVy: 0.12,
  exitJitterG: 0.08,
  /** residual spin jitter after force coupling (keep small so force dominates) */
  exitJitterSpin: 0.08,
  /** clamp spin force scale: spin = base * clamp(forceK, min, max) */
  exitSpinForceMin: 0.72,
  exitSpinForceMax: 1.38,
  /** padding outside design box before count as off-screen */
  exitOffPad: 40,
  /** Match success pop: cards enlarge at clear (meet peak / exit punch) */
  matchPopScale: 1.26,
  /** Drag / skip-meet: ms to ramp into pop */
  matchPopMs: 55,
  /** After peak, ease scale back toward 1 while flying */
  matchPopSettleMs: 200,
  clearBusyMaxMs: 450,
  clearBusyHardMs: 800,
  /** Lifted card while dragging */
  dragScale: 1.16,
  /** Pickup scale ramp duration (ms) */
  dragScaleMs: 100,
  /**
   * Visual-only position lag toward finger (per ~16ms, 0–1).
   * Higher = snappier. ~0.55 = very slight trail; does NOT affect drop hit-test.
   */
  dragVisualFollow: 0.55,
  /** Max tilt from horizontal swipe speed (deg), about card center */
  dragTiltMaxDeg: 26,
  /** Horizontal speed (design px/s) that reaches full tilt amplitude */
  dragTiltRefSpeed: 520,
  /** Spring-damper tilt (回正时略过冲晃动) */
  dragTiltSpring: 240,
  dragTiltDamp: 12,
  snapMs: 160,
  /** Snap-back rotation wobble (cycles of cos while settling) */
  snapRotWobble: 2.4,
  drawMoveMs: 150,
  drawFlipMs: 160,
  flipMs: 180,
  /** Peak uniform scale during flip */
  flipBreath: 1.3,
  /** Max random Z tilt during flip (deg); settles to 0 at end */
  flipTiltMaxDeg: 8,
  recBackMs: 120,
  recGapMs: 40,
  recCapMs: 700,
  dragThreshold: 8,
  /** drag drop: skip meet if centers closer than this (design px) */
  meetSkipDist: 24,
  /**
   * Drag speed → throw loft (design px/s).
   * At ~ref speed forceK≈ mid of min..max; faster flicks loft harder.
   */
  /** higher ref → same speed counts as milder flick */
  dragThrowRefSpeed: 1200,
  dragThrowMinK: 1,
  /** cap boost for fast drag loft */
  dragThrowMaxK: 1.3,
  /** if pointer stopped this long before up, damp measured speed */
  dragVelStaleMs: 90,
} as const;

/** Meet + soft exit ref ≤ clearBusy target (actual exit may run to off-screen ≤ hard) */
export const PHYS_CLEAR_OK: true =
  PHYS.meetMs + PHYS.exitMs <= PHYS.clearBusyMaxMs
    ? true
    : (false as never);

export type TickerLike = {
  add: (fn: (t: { deltaMS: number }) => void) => void;
  remove: (fn: (t: { deltaMS: number }) => void) => void;
};

export function easeOutQuad(u: number): number {
  return 1 - (1 - u) * (1 - u);
}

export function easeInOutSmooth(u: number): number {
  return u * u * (3 - 2 * u);
}

/** Accelerate into impact — peak speed at contact */
export function easeInCubic(u: number): number {
  return u * u * u;
}

/**
 * Meet path: accelerate for most of the way, ease-out into contact.
 * Avoids easeInCubic's max-speed-at-end → dead-stop hitch before exit.
 */
export function easeMeet(u: number): number {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const split = 0.7;
  const mid = 0.86;
  if (u < split) {
    const t = u / split;
    return mid * t * t;
  }
  const t = (u - split) / (1 - split);
  const o = 1 - (1 - t) * (1 - t);
  return mid + (1 - mid) * o;
}

/** Numerical d(easeMeet)/du near end — for residual velocity into exit */
export function easeMeetDerivNearEnd(): number {
  const u0 = 0.9;
  const u1 = 1;
  return (easeMeet(u1) - easeMeet(u0)) / (u1 - u0);
}

/** Uniform random in [lo, hi] */
export function randRange(lo: number, hi: number): number {
  return lo + Math.random() * (hi - lo);
}

/** Multiply base by (1 ± jitterFraction) */
export function randJitter(base: number, jitterFraction: number): number {
  const j = Math.max(0, jitterFraction);
  return base * randRange(1 - j, 1 + j);
}
