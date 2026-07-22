---
title: Research Notes
date: 2026-07-21 15:17
query: "CSS aspect-ratio phone frame letterbox canvas game PC simulate mobile viewport"
type: tech
sources: 6
model: grok-4-1-fast
generated_by: grok-search
---
```markdown
# Game Development Resources Compilation: Space Invaders Clone Prompt, Kaplay Framework, Retro BASIC Interpreter, and 2D Aspect Ratio & Coordinate Techniques

## Table of Contents
- [Space Invaders Clone Prompt](#space-invaders-clone-prompt)
- [Kaplay CHANGELOG.md](#kaplay-changelogmd)
- [omiq/rgc-basic](#omiqrgc-basic)
- [2D Game Development: Coordinates for Game Logic and for Drawing](#2d-game-development-coordinates-for-game-logic-and-for-drawing)
- [Responsively Resize HTML Div Within Parent, Both Letterbox and Pillarbox CSS](#responsively-resize-html-div-within-parent-both-letterbox-and-pillarbox-css)
- [Keep the Aspect Ratio in libGDX](#keep-the-aspect-ratio-in-libgdx)
- [Summary](#summary)
- [Cited URLs](#cited-urls)

## Space Invaders Clone Prompt
**Source:** https://gist.github.com/ivanfioravanti/48e0fa5ce618b332db8cd72b8d4b7183

**1. Main topic and thesis**  
Detailed prompt for building a pixel-perfect, self-contained HTML/JS clone of the 1978 Taito Space Invaders arcade game, replicating original rules, sprites, mechanics, audio, and CRT aesthetics in a single file.

**2. Key points and arguments**  
- Canvas: 800×600px (or 2× scaled from 224×256 logical), black background with phosphor-green/white pixels, scanline overlay, fixed aspect ratio with letterboxing.  
- Sprites: All drawn programmatically from pixel arrays (invaders in 3 types with 2-frame animations, player ship, UFO, bunkers as erodible 2D boolean arrays, bullets). Colors vary by row.  
- Gameplay: 55 invaders (5×11 grid) with marching movement (step right/left, drop 8px), increasing speed; UFO mystery ship; player/invader shooting limits; bunker erosion; scoring, lives, levels.  
- Audio: Procedural Web Audio API sounds (march tones, shoots, explosions, UFO loop).  
- Architecture: Classes for Game, InvaderGrid, Player, Bullet, Bunker, UFO, Renderer, AudioEngine, InputHandler; requestAnimationFrame loop at 60fps; state machine.  
- Requirements: Vanilla JS, no dependencies (except optional Google Font), pixel-perfect rendering (`imageSmoothingEnabled = false`), localStorage for hi-score, full playability.

**3. Important data, statistics, quotes**  
- "Build a pixel-perfect Space Invaders arcade game in a single self-contained HTML file with inline CSS and JS."  
- Invader counts/speeds: 55 invaders at ~0.5 steps/sec down to 1 invader at ~15 steps/sec.  
- Scoring: Bottom 10pts, middle 20pts, top 30pts; UFO 50–300pts (deterministic).  
- "Replicate the original 1978 Taito arcade cabinet experience with full fidelity to the original rules, sprite designs, and mechanics."

**4. Conclusions**  
Provides a complete blueprint for a faithful, dependency-free arcade recreation emphasizing authenticity, performance, and modern web compatibility.

## Kaplay CHANGELOG.md
**Source:** https://github.com/kaplayjs/kaplay/blob/master/CHANGELOG.md

**1. Main topic and thesis**  
Ongoing changelog documenting additions, changes, fixes, and breaking changes for Kaplay (formerly Kaboom.js), a JavaScript game development library focused on 2D games, with emphasis on performance, features, and API evolution up to v4000 alphas.

**2. Key points and arguments**  
- Recent additions: Configurable RNG (xorshift32, Alea), `nextFrame()`, `fill()` component, curve helpers, tile modes, font filtering, grapheme support, sensors, quadtrees, lifetime scopes.  
- Breaking changes: RNG config objects, sprite data format (frames on different textures), UV coordinates for primitives, removal of `onClick()`.  
- Fixes: Mouse coordinates on resized canvas, transforms, input focus, aspect ratio in `drawSprite`, collision enumeration, canvas fullscreen.  
- Performance: Texture packing, broadphase rewrites, transform recalculation only when needed.  
- Other: Music/streaming support in related contexts, but primarily engine internals.

**3. Important data, statistics, quotes**  
- Multiple alpha releases in 2025–2026 (e.g., 4000.0.0-alpha.27.1 on 2026-05-12).  
- "Fixed the unexpected behavior of not preserving the aspect ratio in drawSprite."  
- RNG and random functions now accept optional `rng` parameter; new `setRNG()`.

**4. Conclusions**  
Kaplay continues rapid iteration with focus on modern web game dev needs (performance, internationalization, input flexibility) while maintaining backward compatibility where possible; users should review breaking changes for upgrades.

## omiq/rgc-basic
**Source:** https://github.com/omiq/rgc-basic

**1. Main topic and thesis**  
RGC-BASIC (Retro Game Coders BASIC): A modern cross-platform BASIC interpreter written in C, compatible with classic Commodore V2 syntax but extended with structured programming, graphics (Raylib-based PETSCII/40×25), music streaming, file I/O, JSON/HTTP, WASM targets, and retro game development features.

**2. Key points and arguments**  
- Core: Terminal + graphical interpreters (`basic`, `basic-gfx`); supports GOTO but encourages structured flow (`ELSE IF`, user functions).  
- Graphics 1.0+: Full 2D primitives, tilemaps, sprites, images, scrolling zones/lines, multi-plane buffers, PETSCII tokens in `DRAWTEXT`, overlay HUD.  
- Audio: Tracker modules (MOD/XM/S3M/IT), OGG/MP3 streaming with metadata, volume/loop controls.  
- Modern: Big strings (refcounted, unlimited via option), `MAPLOAD`/`MAPSAVE` for JSON maps, `HTTP$()`/`JSON$()`, file I/O, mouse/keyboard intrinsics.  
- Targets: Native (Win/Mac/Linux), WASM (modular, canvas, raylib); 9 bundled MOD examples.

**3. Important data, statistics, quotes**  
- Current release: 2.1.1 (2026-05-19) — "big strings + level data milestone."  
- "RGC-BASIC is inspired by CBM BASIC v2 as found on classic Commodore machines, extended with modern features."  
- String handling: From 4KB cap to unlimited; 157 KB JSON demo via `INSTR`/`MID$`/`JSON$`.  
- "Unlike emulators, this is a BASIC interpreter that can already do real work."

**4. Conclusions**  
Enables authentic retro BASIC coding for games and utilities with contemporary capabilities; suitable for education, demoscene, and cross-platform retro-style development.

## 2D Game Development: Coordinates for Game Logic and for Drawing
**Source:** https://stackoverflow.com/questions/60990606/2d-game-development-coordinates-for-game-logic-and-for-drawing

**1. Main topic and thesis**  
Discussion on separating logical game coordinates from screen drawing coordinates in 2D games (using SFML example) to support resizing, adaptability, and avoid hard-coded positions.

**2. Key points and arguments**  
- Problem: Hard-coded coordinates hinder resizability and multi-screen adaptability.  
- Proposed solution: "Screen_promille" class using promille (0–999) fractions of screen area, converted to pixels before draw; letterbox view recommended.  
- Answer consensus: Letterbox view (preserves aspect ratio) is preferable to custom promille systems for most cases; hard-coding often simplest for certain genres (e.g., platformers).  
- Trade-offs: Promille adds abstraction but may complicate with letterboxing; depends on game type (interface-heavy vs. world-based).

**3. Important data, statistics, quotes**  
- "The best solution to the concerns you raised is implementing a letterbox view."  
- Comment: "the letterbox view is about placing the whole picture in the center of the window... to prevent game objects from appearing stretched."

**4. Conclusions**  
Letterbox views + viewport management are standard for responsive 2D games; custom normalized coordinate systems are viable but often unnecessary overhead.

## Responsively Resize HTML Div Within Parent, Both Letterbox and Pillarbox CSS
**Source:** https://stackoverflow.com/questions/53935670/responsively-resize-html-div-within-parent-both-letterbox-and-pillarbox-css-on

**1. Main topic and thesis**  
CSS-only techniques to responsively scale a child div to maintain a fixed aspect ratio (e.g., 16:9) inside a resizable parent, handling both letterboxing (wider parent) and pillarboxing (taller parent) with centering.

**2. Key points and arguments**  
- Modern solution (2022+): `container-type: size` + `aspect-ratio` + `@container` queries to switch between `width:100%`/`height:auto` and vice versa.  
- Alternative approaches: `vw`/`vh` + `calc()` with `max-width`/`max-height` and absolute centering; em-based with media queries on aspect-ratio; canvas placeholder + media queries; `object-fit: contain` (for images/videos).  
- Challenges: Pure CSS for arbitrary parents (not just viewport); avoiding JS.  
- Multiple working examples provided with CodePen/Svelte links.

**3. Important data, statistics, quotes**  
- "Nearly four years later, `@container` queries and `aspect-ratio` provide a very nice solution!"  
- Example: `@container (min-aspect-ratio: 16 / 9) { .maintain-aspect-ratio { width: auto; height: 100%; } }`

**4. Conclusions**  
Container queries offer the cleanest modern CSS solution for parent-responsive aspect-ratio boxes; fallback techniques using viewport units or media queries work in older browsers.

## Keep the Aspect Ratio in libGDX
**Source:** https://stackoverflow.com/questions/37671710/keep-the-aspect-ratio-in-libgdx

**1. Main topic and thesis**  
How to maintain consistent visual proportions and game experience across different Android screen resolutions in libGDX using viewports and cameras.

**2. Key points and arguments**  
- Issue: Using actual screen dimensions in `FitViewport` causes varying visible world size on different devices.  
- Solution: Pass constant world units (e.g., `new FitViewport(9, 16)`) instead of screen pixels; viewport handles scaling.  
- `FitViewport` for letter/pillarboxing (consistent experience); `ExtendViewport` to avoid bars but extend world.  
- Assets remain fixed size; focus on logical units, not pixels.

**3. Important data, statistics, quotes**  
- "forget about pixels, unless they want a pixel perfect game... pass only constants into the Viewport constructor."  
- "If you don't want black bars... use ExtendViewport instead of FitViewport."

**4. Conclusions**  
Use fixed logical dimensions in viewports (FitViewport for strict aspect preservation) rather than device pixels for consistent cross-device rendering in libGDX.

## Summary
These resources collectively address core challenges in 2D/retro game development: faithful arcade recreation (Space Invaders prompt), modern JS game engines (Kaplay), retro BASIC tooling (rgc-basic), and robust handling of screen coordinates, resizing, and aspect ratios across HTML/CSS, SFML, and libGDX. Emphasis on pixel-perfect fidelity, procedural assets/audio, viewport management, and CSS/container techniques enables responsive, cross-platform experiences without external dependencies where possible. Common themes include letterboxing/pillarboxing for aspect preservation and separation of logical vs. display coordinates.

## Cited URLs
- https://gist.github.com/ivanfioravanti/48e0fa5ce618b332db8cd72b8d4b7183
- https://github.com/kaplayjs/kaplay/blob/master/CHANGELOG.md
- https://github.com/omiq/rgc-basic
- https://stackoverflow.com/questions/60990606/2d-game-development-coordinates-for-game-logic-and-for-drawing
- https://stackoverflow.com/questions/53935670/responsively-resize-html-div-within-parent-both-letterbox-and-pillarbox-css-on
- https://stackoverflow.com/questions/37671710/keep-the-aspect-ratio-in-libgdx
```