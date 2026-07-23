/**
 * Game GPU surface — WebGPU-first for the entire card game (D29).
 *
 * Import from here (or `../app` re-exports) for mount / rehydrate.
 */
export {
  createPixiApp,
  type CreatePixiOpts,
  type PixiBundle,
} from './createApp';
export {
  DEFAULT_PREFERENCE,
  FALLBACK_BACKEND,
  getRendererBackendName,
  isPlayerBackend,
  PRIMARY_BACKEND,
  resolveRendererPreference,
  type PixiPreference,
  type RendererChoice,
  type ResolvedRendererPreference,
} from './preference';
