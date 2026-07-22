---
title: Research Notes
date: 2026-07-21 15:35
query: "WebGL MAX_TEXTURE_SIZE iOS Safari 4096 texture atlas spritesheet best practice"
type: tech
sources: 5
model: grok-4-1-fast
generated_by: grok-search
---
# WebGL Texture Size Limitations, Mobile Issues, and Three.js Workarounds

## Table of Contents
- [Source 1: Is it possible to use WebGL max texture size?](https://stackoverflow.com/questions/29975743/is-it-possible-to-use-webgl-max-texture-size)
- [Source 2: THREE.JS + 4K VIDEO TEXTURE + MOBILE = NO](https://stackoverflow.com/questions/41977621/three-js-4k-video-texture-mobile-no)
- [Source 3: texture atlas · Issue #303 · mrdoob/three.js](https://github.com/mrdoob/three.js/issues/303)
- [Source 4: phaser/changelog/3.8/CHANGELOG-v3.8.md](https://github.com/phaserjs/phaser/blob/master/changelog/3.8/CHANGELOG-v3.8.md)
- [Source 5: Webgl image texture failure on Safari iOS 8](https://stackoverflow.com/questions/28658208/webgl-image-texture-failure-on-safari-ios-8)
- [Summary](#summary)

## Source 1: Is it possible to use WebGL max texture size?
**URL:** https://stackoverflow.com/questions/29975743/is-it-possible-to-use-webgl-max-texture-size

### 1. Main topic and thesis
WebGL texture size limits (`MAX_TEXTURE_SIZE`) and practical usability, especially memory constraints causing crashes for large textures.

### 2. Key points and arguments
- `gl.getParameter(gl.MAX_TEXTURE_SIZE)` reports the maximum *dimension* (e.g., 16384), not guaranteed usable area.
- MAX×MAX textures (e.g., 16384×16384 RGBA) require ~1GB+ VRAM (more with overhead, mipmaps, browser/OS limits), often exceeding available memory.
- Crashes (CONTEXT_LOST_WEBGL, GL_INVALID_ENUM) occur at or near max sizes; half-size works but wastes potential.
- No reliable way to detect per-device memory limits due to sandboxing and variable GPU/memory usage.

### 3. Important data, statistics, quotes
- Example calculation: `16384 * 16384 * 4 (RGBA) * UNSIGNED_BYTE = 1GB`; FLOAT variant = 4GB.
- "MAXxMAX, well, in your case 16384 * 16384 * 4 (RGBA) * UNSIGNED_BYTE = 1073741824 or 1GIG!!!"
- "Most likely your browser is running out of memory which is why it's crashing."

### 4. Conclusions
Use textures well below reported MAX to avoid memory issues; progressively test sizes or offer quality options. No perfect cross-device detection method exists.

## Source 2: THREE.JS + 4K VIDEO TEXTURE + MOBILE = NO
**URL:** https://stackoverflow.com/questions/41977621/three-js-4k-video-texture-mobile-no

### 1. Main topic and thesis
Failure of 4K (4096×2048) video textures in Three.js on iOS/Android mobile devices despite reported WebGL max texture size support.

### 2. Key points and arguments
- 4K video textures fail to render