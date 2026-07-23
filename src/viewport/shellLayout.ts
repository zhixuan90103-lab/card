/**
 * Root layout for game shell (#letterbox + #phone-frame).
 *
 * Desktop: CSS letterbox is fine.
 * Native: JS uniform contain of 393×852 against full visualViewport.
 * Guard: ignore 0×0 viewport while backgrounded (iOS reports empty VV).
 */
import { DESIGN_HEIGHT, DESIGN_WIDTH } from './design';
import { isNativeApp } from '../native/haptics';

export type ShellMetrics = {
  shellW: number;
  shellH: number;
  frameW: number;
  frameH: number;
  scale: number;
};

let lastGood: ShellMetrics = {
  shellW: DESIGN_WIDTH,
  shellH: DESIGN_HEIGHT,
  frameW: DESIGN_WIDTH,
  frameH: DESIGN_HEIGHT,
  scale: 1,
};

function readViewportSize(): { w: number; h: number } {
  const vv = window.visualViewport;
  if (vv && vv.width > 2 && vv.height > 2) {
    return { w: vv.width, h: vv.height };
  }
  const iw = window.innerWidth || document.documentElement.clientWidth || 0;
  const ih = window.innerHeight || document.documentElement.clientHeight || 0;
  if (iw > 2 && ih > 2) return { w: iw, h: ih };
  // Background / transitional: keep last good so frame doesn't collapse to 0
  return { w: lastGood.shellW, h: lastGood.shellH };
}

/**
 * Apply shell geometry. Safe to call every resize / resume.
 */
export function applyShellLayout(): ShellMetrics {
  const letterbox = document.getElementById('letterbox');
  const frame = document.getElementById('phone-frame');
  if (!letterbox || !frame) {
    return lastGood;
  }

  if (!isNativeApp()) {
    letterbox.style.width = '';
    letterbox.style.height = '';
    letterbox.style.padding = '';
    frame.style.width = '';
    frame.style.height = '';
    frame.style.maxWidth = '';
    frame.style.maxHeight = '';
    const r = frame.getBoundingClientRect();
    if (r.width > 2 && r.height > 2) {
      const scale = Math.min(
        r.width / DESIGN_WIDTH || 1,
        r.height / DESIGN_HEIGHT || 1,
      );
      lastGood = {
        shellW: letterbox.getBoundingClientRect().width || lastGood.shellW,
        shellH: letterbox.getBoundingClientRect().height || lastGood.shellH,
        frameW: r.width,
        frameH: r.height,
        scale,
      };
    }
    return lastGood;
  }

  const { w, h } = readViewportSize();
  if (w < 2 || h < 2) {
    return lastGood;
  }

  letterbox.style.boxSizing = 'border-box';
  letterbox.style.width = `${w}px`;
  letterbox.style.height = `${h}px`;
  letterbox.style.padding = '0';
  letterbox.style.margin = '0';
  letterbox.style.display = 'flex';
  letterbox.style.alignItems = 'center';
  letterbox.style.justifyContent = 'center';

  // Full-viewport contain (HUD owns safe-area, not the board scale)
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

  lastGood = { shellW: w, shellH: h, frameW, frameH, scale };
  return lastGood;
}

export function getLastShellMetrics(): ShellMetrics {
  return lastGood;
}

/** Subscribe to viewport changes; returns dispose. */
export function watchShellLayout(onChange: (m: ShellMetrics) => void): () => void {
  /** iOS VV scroll/resize fires very often — must debounce or GPU resize thrash freezes the game. */
  let timer: ReturnType<typeof setTimeout> | null = null;
  const runNow = () => onChange(applyShellLayout());
  const runDebounced = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      runNow();
    }, 80);
  };

  runNow();
  window.addEventListener('resize', runDebounced);
  window.visualViewport?.addEventListener('resize', runDebounced);
  // scroll: only debounce; do not resize GPU every rubber-band pixel
  window.visualViewport?.addEventListener('scroll', runDebounced);
  window.addEventListener('orientationchange', runDebounced);
  window.addEventListener('pageshow', runNow);
  window.addEventListener('focus', runDebounced);
  requestAnimationFrame(runNow);
  setTimeout(runNow, 100);
  setTimeout(runNow, 400);
  return () => {
    if (timer) clearTimeout(timer);
    window.removeEventListener('resize', runDebounced);
    window.visualViewport?.removeEventListener('resize', runDebounced);
    window.visualViewport?.removeEventListener('scroll', runDebounced);
    window.removeEventListener('orientationchange', runDebounced);
    window.removeEventListener('pageshow', runNow);
    window.removeEventListener('focus', runDebounced);
  };
}
