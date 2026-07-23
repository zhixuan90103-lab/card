/**
 * Unified foreground / background signals for web + Capacitor iOS.
 *
 * Design 19 / D28: GameView must rehydrate on every return to foreground.
 * Relying only on `visibilitychange` is insufficient on WKWebView —
 * Capacitor `appStateChange` is the authoritative native signal.
 */
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export type LifecycleHandlers = {
  /** App left foreground (or tab hidden). Stop GPU work; keep GameSession. */
  onSuspend: () => void;
  /** App became active again. Caller must rehydrate the view. */
  onResume: () => void;
};

export type LifecycleHandle = {
  dispose: () => void;
};

/**
 * Subscribe once. Dedupes rapid multi-source resume (visibility + appState + pageshow).
 */
export function watchAppLifecycle(handlers: LifecycleHandlers): LifecycleHandle {
  let suspended = false;
  /** Native app isActive; may lead document.visibility by a few frames. */
  let nativeActive = true;
  let resumeTimer: ReturnType<typeof setTimeout> | null = null;
  const cleanups: Array<() => void> = [];

  const isForeground = () => {
    if (Capacitor.isNativePlatform()) {
      // Trust Cap when it says active even if document.hidden still true briefly
      if (nativeActive) return true;
      return !document.hidden;
    }
    return !document.hidden;
  };

  const suspend = () => {
    if (suspended) return;
    suspended = true;
    if (resumeTimer) {
      clearTimeout(resumeTimer);
      resumeTimer = null;
    }
    try {
      handlers.onSuspend();
    } catch (e) {
      console.warn('[lifecycle] onSuspend error', e);
    }
  };

  /**
   * Coalesce resume to one pulse after layout settles.
   * @param force — native appState active: do not require !document.hidden up front
   */
  const resume = (delayMs = 0, force = false) => {
    if (!force && !isForeground()) return;
    if (resumeTimer) clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      resumeTimer = null;
      if (!force && !isForeground()) return;
      // Native force: still skip if user already backgrounded again
      if (force && Capacitor.isNativePlatform() && !nativeActive) return;
      if (!force && document.hidden && !nativeActive) return;
      suspended = false;
      try {
        handlers.onResume();
      } catch (e) {
        console.warn('[lifecycle] onResume error', e);
      }
    }, delayMs);
  };

  const onVisibility = () => {
    if (document.hidden) {
      // On native, Cap appState may already own suspend; still stop GPU if web-hidden
      if (!Capacitor.isNativePlatform() || !nativeActive) suspend();
    } else {
      resume(16, false);
    }
  };
  document.addEventListener('visibilitychange', onVisibility);
  cleanups.push(() =>
    document.removeEventListener('visibilitychange', onVisibility),
  );

  const onPageShow = (e: PageTransitionEvent) => {
    if (e.persisted || !document.hidden) resume(0, false);
  };
  window.addEventListener('pageshow', onPageShow);
  cleanups.push(() => window.removeEventListener('pageshow', onPageShow));

  const onPageHide = () => {
    if (!Capacitor.isNativePlatform()) suspend();
  };
  window.addEventListener('pagehide', onPageHide);
  cleanups.push(() => window.removeEventListener('pagehide', onPageHide));

  if (Capacitor.isNativePlatform()) {
    let appListener: { remove: () => Promise<void> } | null = null;
    void App.addListener('appStateChange', ({ isActive }) => {
      nativeActive = isActive;
      if (isActive) {
        // Authoritative foreground; document.hidden may still be true for a beat
        resume(48, true);
      } else {
        suspend();
      }
    }).then((h) => {
      appListener = h;
    });
    cleanups.push(() => {
      void appListener?.remove();
    });
  }

  return {
    dispose: () => {
      if (resumeTimer) clearTimeout(resumeTimer);
      for (const c of cleanups) {
        try {
          c();
        } catch {
          /* ignore */
        }
      }
    },
  };
}
