/**
 * GPU loss → same D28 rehydrate path for the whole game.
 * WebGPU: device.lost · WebGL: webglcontextlost
 */

export type WireGpuLostOpts = {
  backend: string;
  canvas: HTMLCanvasElement;
  renderer: unknown;
  /** Skip if already tearing down / dead. */
  isDead: () => boolean;
  onLost: (reason: string) => void;
};

/**
 * Attach loss listeners. Returns dispose (call before Application.destroy).
 */
export function wireGpuLost(opts: WireGpuLostOpts): () => void {
  const cleanups: Array<() => void> = [];

  const onWebglLost = (e: Event) => {
    e.preventDefault();
    if (opts.isDead()) return;
    opts.onLost('WebGL context lost (compatibility path)');
  };
  opts.canvas.addEventListener('webglcontextlost', onWebglLost);
  cleanups.push(() =>
    opts.canvas.removeEventListener('webglcontextlost', onWebglLost),
  );

  if (opts.backend === 'webgpu') {
    try {
      const gpu = (
        opts.renderer as {
          gpu?: { device?: { lost: Promise<{ reason?: string; message?: string }> } };
        }
      ).gpu;
      const device = gpu?.device;
      if (device?.lost) {
        void device.lost.then((info) => {
          if (opts.isDead()) return;
          if (info.reason === 'destroyed') return;
          opts.onLost(
            `WebGPU device lost (${info.reason ?? 'unknown'}: ${info.message ?? ''})`,
          );
        });
      } else {
        console.warn('[gpu] WebGPU backend but device.lost unavailable');
      }
    } catch (e) {
      console.warn('[gpu] device.lost wire failed', e);
    }
  }

  return () => {
    for (const c of cleanups) {
      try {
        c();
      } catch {
        /* ignore */
      }
    }
  };
}
