/**
 * Game-wide GPU backend policy (D29).
 *
 * Default everywhere: **WebGPU first**, WebGL fallback only.
 * Mobile jank is addressed by renderer settings (no MSAA, resize debounce),
 * not by abandoning WebGPU — see design/22_webgpu_mobile_perf_research.md.
 *
 * Override: ?renderer=webgpu|webgl|auto · localStorage.card_renderer
 */

export type RendererChoice = 'webgpu' | 'webgl' | 'auto';

export type PixiPreference = 'webgl' | 'webgpu' | Array<'webgl' | 'webgpu'>;

export type ResolvedRendererPreference = {
  choice: RendererChoice;
  preference: PixiPreference;
  source: 'query' | 'localStorage' | 'default';
  raw: string;
  prefersWebGpu: boolean;
};

export const PRIMARY_BACKEND = 'webgpu' as const;
export const FALLBACK_BACKEND = 'webgl' as const;

export const DEFAULT_PREFERENCE: PixiPreference = [
  PRIMARY_BACKEND,
  FALLBACK_BACKEND,
];

const STORAGE_KEY = 'card_renderer';

function normalize(raw: string | null | undefined): RendererChoice | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (v === 'webgl' || v === 'gl') return 'webgl';
  if (v === 'webgpu' || v === 'gpu') return 'webgpu';
  if (v === 'auto') return 'auto';
  return null;
}

function preferenceFor(choice: RendererChoice): PixiPreference {
  if (choice === 'webgl') return [FALLBACK_BACKEND];
  return [PRIMARY_BACKEND, FALLBACK_BACKEND];
}

/**
 * Resolve backend preference. Product default: WebGPU-first on all platforms.
 */
export function resolveRendererPreference(): ResolvedRendererPreference {
  const desktopDefault = (): ResolvedRendererPreference => ({
    choice: 'webgpu',
    preference: DEFAULT_PREFERENCE,
    source: 'default',
    raw: PRIMARY_BACKEND,
    prefersWebGpu: true,
  });

  if (typeof window === 'undefined') return desktopDefault();

  try {
    const q = new URLSearchParams(window.location.search).get('renderer');
    const fromQuery = normalize(q);
    if (fromQuery) {
      return {
        choice: fromQuery,
        preference: preferenceFor(fromQuery),
        source: 'query',
        raw: q ?? fromQuery,
        prefersWebGpu: fromQuery !== 'webgl',
      };
    }

    const stored = normalize(
      window.localStorage?.getItem(STORAGE_KEY) ?? undefined,
    );
    if (stored) {
      return {
        choice: stored,
        preference: preferenceFor(stored),
        source: 'localStorage',
        raw: stored,
        prefersWebGpu: stored !== 'webgl',
      };
    }

    return desktopDefault();
  } catch {
    return desktopDefault();
  }
}

export function getRendererBackendName(renderer: {
  name?: string;
}): string {
  return renderer?.name ?? 'unknown';
}

export function isPlayerBackend(name: string): boolean {
  return name === PRIMARY_BACKEND || name === FALLBACK_BACKEND;
}
