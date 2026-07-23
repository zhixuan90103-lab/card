import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PREFERENCE,
  FALLBACK_BACKEND,
  getRendererBackendName,
  isPlayerBackend,
  PRIMARY_BACKEND,
  resolveRendererPreference,
} from './preference';

describe('gpu preference (WebGPU-first)', () => {
  it('defaults to webgpu → webgl chain', () => {
    const r = resolveRendererPreference();
    expect(PRIMARY_BACKEND).toBe('webgpu');
    expect(FALLBACK_BACKEND).toBe('webgl');
    expect(r.preference).toEqual(DEFAULT_PREFERENCE);
    expect(r.preference[0]).toBe('webgpu');
    expect(r.prefersWebGpu).toBe(true);
  });

  it('classifies player backends', () => {
    expect(isPlayerBackend('webgpu')).toBe(true);
    expect(isPlayerBackend('webgl')).toBe(true);
    expect(isPlayerBackend('canvas')).toBe(false);
  });

  it('reads renderer.name', () => {
    expect(getRendererBackendName({ name: 'webgpu' })).toBe('webgpu');
    expect(getRendererBackendName({ name: 'webgl' })).toBe('webgl');
    expect(getRendererBackendName({})).toBe('unknown');
  });
});
