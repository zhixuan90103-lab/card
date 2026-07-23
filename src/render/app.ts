/**
 * Compatibility re-export — prefer `./gpu` for new code.
 * Entire game GPU policy: WebGPU-first (D29).
 */
export {
  createPixiApp,
  type CreatePixiOpts,
  type PixiBundle,
} from './gpu';
