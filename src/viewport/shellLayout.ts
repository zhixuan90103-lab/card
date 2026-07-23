/**
 * Root layout for game shell (#letterbox + #phone-frame).
 *
 * Desktop: CSS letterbox is fine.
 * Native (Capacitor iOS/Android): CSS 100dvh / safe-area / contentInset fight
 * and stretch 393×852 non-uniformly. We size the frame in JS with **uniform
 * contain** so the Pixi world never squashes, and the letterbox fills the
 * true visual viewport with felt cream (no system black strips).
 */
import { DESIGN_HEIGHT, DESIGN_WIDTH } from './design';
import { isNativeApp } from '../native/haptics';

export type ShellMetrics = {
  /** Letterbox CSS px (full usable viewport) */
  shellW: number;
  shellH: number;
  /** Phone-frame CSS px (uniform 393:852) */
  frameW: number;
  frameH: number;
  /** frame / design uniform scale */
  scale: number;
};

function readViewportSize(): { w: number; h: number } {
  // visualViewport is the ground truth inside WKWebView after insets
  const vv = window.visualViewport;
  if (vv && vv.width > 0 && vv.height > 0) {
    return { w: vv.width, h: vv.height };
  }
  return {
    w: window.innerWidth || document.documentElement.clientWidth || DESIGN_WIDTH,
    h:
      window.innerHeight ||
      document.documentElement.clientHeight ||
      DESIGN_HEIGHT,
  };
}

/**
 * Apply shell geometry. Safe to call every resize.
 * On non-native, clears inline sizes so CSS desktop rules apply.
 */
export function applyShellLayout(): ShellMetrics {
  const letterbox = document.getElementById('letterbox');
  const frame = document.getElementById('phone-frame');
  if (!letterbox || !frame) {
    return {
      shellW: DESIGN_WIDTH,
      shellH: DESIGN_HEIGHT,
      frameW: DESIGN_WIDTH,
      frameH: DESIGN_HEIGHT,
      scale: 1,
    };
  }

  if (!isNativeApp()) {
    // Desktop / mobile browser: let CSS own layout
    letterbox.style.width = '';
    letterbox.style.height = '';
    letterbox.style.padding = '';
    frame.style.width = '';
    frame.style.height = '';
    frame.style.maxWidth = '';
    frame.style.maxHeight = '';
    const r = frame.getBoundingClientRect();
    const scale = Math.min(
      r.width / DESIGN_WIDTH || 1,
      r.height / DESIGN_HEIGHT || 1,
    );
    return {
      shellW: letterbox.getBoundingClientRect().width,
      shellH: letterbox.getBoundingClientRect().height,
      frameW: r.width,
      frameH: r.height,
      scale,
    };
  }

  const { w, h } = readViewportSize();
  // Full-bleed shell — cream covers entire WebView (including island / home bar)
  letterbox.style.boxSizing = 'border-box';
  letterbox.style.width = `${w}px`;
  letterbox.style.height = `${h}px`;
  letterbox.style.padding = '0';
  letterbox.style.margin = '0';
  letterbox.style.display = 'flex';
  letterbox.style.alignItems = 'center';
  letterbox.style.justifyContent = 'center';

  /**
   * iPhone product choice: maximize board size.
   * Do NOT subtract full safe-area from the game frame (that left large cream
   * bands on 15 Pro). Scale 393×852 with uniform contain against the **full**
   * visualViewport; HUD uses env(safe-area-inset-*) so text/buttons stay clear
   * of Dynamic Island and Home Indicator.
   */
  const scale = Math.min(w / DESIGN_WIDTH, h / DESIGN_HEIGHT);
  const frameW = DESIGN_WIDTH * scale;
  const frameH = DESIGN_HEIGHT * scale;

  frame.style.width = `${frameW}px`;
  frame.style.height = `${frameH}px`;
  frame.style.maxWidth = 'none';
  frame.style.maxHeight = 'none';
  frame.style.aspectRatio = 'auto';
  frame.style.borderRadius = '0';
  frame.style.boxShadow = 'none';

  return { shellW: w, shellH: h, frameW, frameH, scale };
}

/** Subscribe to viewport changes; returns dispose. */
export function watchShellLayout(onChange: (m: ShellMetrics) => void): () => void {
  const run = () => onChange(applyShellLayout());
  run();
  window.addEventListener('resize', run);
  window.visualViewport?.addEventListener('resize', run);
  window.visualViewport?.addEventListener('scroll', run);
  window.addEventListener('orientationchange', run);
  // iOS sometimes settles insets one frame late
  requestAnimationFrame(run);
  setTimeout(run, 100);
  setTimeout(run, 400);
  return () => {
    window.removeEventListener('resize', run);
    window.visualViewport?.removeEventListener('resize', run);
    window.visualViewport?.removeEventListener('scroll', run);
    window.removeEventListener('orientationchange', run);
  };
}
