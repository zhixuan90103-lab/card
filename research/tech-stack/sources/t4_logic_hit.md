---
title: Research Notes
date: 2026-07-21 15:22
query: "game architecture separate logic hit testing from rendering AABB pointer pick top card"
type: tech
sources: 6
model: grok-4-1-fast
generated_by: grok-search
---
**Game Development Insights: Handmade Engines, 2D Physics, Collision Systems, and AI-Assisted Projects**

## Table of Contents
- [Source 1: cj1128/handmade-hero](#source-1-cj1128handmade-hero)
- [Source 2: breakout-retro Overview](#source-2-breakout-retro-overview)
- [Source 3: JoltPhysics Architecture](#source-3-joltphysics-architecture)
- [Source 4: Vibecoding a Highway Jumper Game with Antigravity](#source-4-vibecoding-a-highway-jumper-game-with-antigravity)
- [Source 5: Zelda-style Tilemap Collision](#source-5-zelda-style-tilemap-collision)
- [Source 6: My Portfolio Is a Playable Game](#source-6-my-portfolio-is-a-playable-game)
- [Summary](#summary)
- [Sources](#sources)

## Source 1: cj1128/handmade-hero
**Main topic and thesis**: Personal study notes and code for Casey Muratori's *Handmade Hero* project, which teaches building a professional-quality 2D game from scratch in C without engines or libraries. The thesis emphasizes learning low-level systems programming, platform APIs (especially Win32), and game architecture through deliberate, day-by-day implementation.

**Key points and arguments**:
- Focus on custom memory allocation via macros for easier debugging.
- Graphics topics include premultiplied alpha, gamma correction, normal mapping, and push-buffer rendering.
- World representation evolves from tilemaps to entity-based systems with spatial partitioning and simulation regions.
- Detailed day-by-day roadmap covering input, sound (DirectSound), math (vectors, motion equations), collision (Minkowski sums, line segments), 3D positioning, lighting, and performance (SIMD, optimization).
- Code style preferences: snake_case for types, camelCase for variables, etc.

**Important data, statistics, quotes**:
- Showcase on Day 85: jumping, shooting, stairs, large world with procedural ground.
- Extensive roadmap listing 100+ days of topics (e.g., "Day 29: Basic Tilemap Collision Checking", "Day 63-66: Major Refactoring with Simulation Region").
- Quote: "If you think writing a professional-quality game from scratch on your own (no engine no library) is interesting and challenging, I highly recommend this project. In my opinion, it's the best I can find."

**Conclusions**: A comprehensive, self-contained learning resource for understanding game internals; requires purchasing Handmade Hero assets for full builds. Highlights trade-offs in custom vs. engine-based development.

## Source 2: breakout-retro Overview
**Main topic and thesis**: Overview of building a classic Breakout game in Python that runs in web browsers via WebAssembly, using modern tooling (uv, pygame, pygbag) to recreate retro mechanics with contemporary deployment.

**Key points and arguments**:
- Technology stack: Python 3.13, uv for fast dependency management, pygame for core logic, pygbag for WASM compilation.
- Architecture: Game loop (init, events, update, render, 60 FPS), entities (paddle, ball, bricks), states (menu, playing, paused, game over, victory).
- Physics: Ball velocity/acceleration, AABB and circle-rectangle collisions, spatial partitioning.
- Web integration: Async game loop with `asyncio.sleep(0)` for WASM compatibility; build/deploy via `pygbag`.
- Features: Power-ups, special bricks, particles, retro visuals/sounds, progressive difficulty.

**Important data, statistics, quotes**:
- Project structure includes `src/breakout/` with entities, utils, assets; `web/` for deployment.
- Pseudo-code examples for ball movement and wall bouncing.
- Deployment targets: GitHub Pages, Netlify, Vercel, itch.io.
- Conclusion quote: "This project combines modern Python tooling with classic game development to create a web-deployable Breakout game."

**Conclusions**: Demonstrates a streamlined workflow for retro-style games with web reach; modular design supports easy extension while maintaining performance on browsers.

## Source 3: JoltPhysics Architecture
**Main topic and thesis**: Detailed architecture of the Jolt Physics engine, focusing on bodies, shapes, multithreading, and simulation concepts for efficient rigid-body dynamics in games and simulations.

**Key points and arguments**:
- Bodies: Static, dynamic, or kinematic; created/added/removed via `BodyInterface`; batch operations for performance.
- Mass/inertia: Auto-calculated or overridden; degrees of freedom (e.g., `Plane2D` preset); friction/restitution with custom combiners.
- Damping, multithreaded access (locking vs. non-locking `BodyInterface`, `BodyLockRead/Write`).
- Shapes ordered by complexity; integration with `PhysicsSystem::Update`.

**Important data, statistics, quotes**:
- Life cycle: `CreateBody` → `AddBody` → `RemoveBody` → `DestroyBody`.
- Friction combine default: geometric mean; restitution: maximum.
- Damping: `dv/dt = -c * v` (linear/angular).
- Quote/example: "Always use the batch adding functions when possible! Adding many bodies, one at a time, results in a really inefficient broadphase."

**Conclusions**: Jolt emphasizes performance through batching, careful multithreading, and flexible body configuration; suitable for real-time applications with clear separation of creation and simulation.

## Source 4: Vibecoding a Highway Jumper Game with Antigravity
**Main topic and thesis**: A Rust developer's experiment using Google Antigravity (AI coding assistant) to rapidly prototype a highway jumper/racing game with Dioxus (Rust web/desktop framework) in ~3 hours.

**Key points and arguments**:
- Skepticism turned to positive results: AI handles boilerplate effectively, allowing focus on architecture.
- Achieved functional desktop and web builds; Android noted as future work.
- Emphasis on AI's role in accelerating familiar tasks for experienced developers.

**Important data, statistics, quotes**:
- "I’ve been writing Rust for years... So when I heard about Google Antigravity, I was... skeptical. Turns out? A lot."
- "I got a fully functional game on desktop and web."

**Conclusions**: AI tools like Antigravity can significantly speed up prototyping even for seasoned Rust developers, particularly for UI/game boilerplate, though full cross-platform (e.g., Android) requires additional effort.

## Source 5: Zelda-style Tilemap Collision
**Main topic and thesis**: A practical, lightweight model for Zelda-like 2D top-down tilemap collision using separate collision flags, AABB rectangles, and axis-separated resolution to achieve predictable, readable movement without a full physics engine.

**Key points and arguments**:
- Separate art from collision via a flag grid (`TileFlags`: Solid, Water, Door, etc.).
- Entity as AABB (x, y, w, h, velocity); local grid sampling for overlaps.
- Resolve X then Y to prevent tunneling/corner issues; snap to tile edges.
- Fixed timestep (`DT = 1/60`) for consistency; extendable to doors, one-way tiles, stairs via flags.
- Works in engines (Godot/Unity) by using colliders only for authoring.

**Important data, statistics, quotes**:
- Tile size example: 16px; one byte per tile for cache-friendly lookups.
- Code for `OverlapsSolid`, `MoveAndCollide`, and `Tick`.
- "Resolve one axis at a time to avoid corner tunneling and to make the code easy to reason about."

**Conclusions**: This flag + AABB + axis-separated approach reproduces classic Zelda feel reliably, remains stable under art changes, and scales to simple entities/projectiles while avoiding physics overhead.

## Source 6: My Portfolio Is a Playable Game
**Main topic and thesis**: A frontend engineer's journey building an interactive 2D platformer portfolio (Hollow Knight-inspired) in Next.js/Canvas 2D, learning immediate-mode rendering, delta-time physics, sprite animation, parallax, and room-based camera from scratch.

**Key points and arguments**:
- Canvas is immediate-mode (erase + redraw every frame) vs. React's retained mode.
- Core loop via `requestAnimationFrame`; delta time for frame-rate independence.
- Simple Euler physics: gravity + velocity integration; AABB collision for platforms.
- Sprite sheets, state-machine animation, painter's algorithm for layering.
- Parallax layers, room snapping for larger worlds.

**Important data, statistics, quotes**:
- Character: 32×48 px rectangle initially.
- Gravity example: 1800 px/s²; jump velocity: -920 px/s.
- "There is no 'move'. There is only 'erase and redraw'."
- "Every value in the game... is expressed per second and multiplied by delta."

**Conclusions**: Canvas 2D enables lightweight, fully custom game-like portfolios; the project taught fundamental rendering/physics concepts and demonstrated that a game can serve as engaging navigation.

## Summary
These sources collectively cover foundational to advanced 2D game development: low-level handmade approaches (Handmade Hero, JoltPhysics), practical collision and entity systems (Zelda tilemaps, portfolio platformer), retro remakes with modern deployment (Breakout), and AI-assisted rapid prototyping (Highway Jumper). Common themes include explicit control over memory/rendering/physics loops, separation of concerns (art vs. collision, immediate vs. retained mode), and performance considerations for web/real-time use. They provide both theoretical architecture and concrete code patterns for building engaging 2D experiences.

## Sources
- https://github.com/cj1128/handmade-hero
- https://github.com/kaumnen/breakout-retro/blob/main/overview.md
- https://github.com/jrouwe/JoltPhysics/blob/master/Docs/Architecture.md
- https://medium.com/solo-devs/vibecoding-a-highway-jumper-game-with-antigravity-a-rust-developers-perspective-a69860614a7f
- https://medium.com/@abachi_45654/zelda-style-tilemap-collision-for-2d-top-down-games-a63a7555a03b
- https://medium.com/@jjmayank98/my-portfolio-is-a-playable-game-and-i-had-no-idea-how-any-of-this-worked-2ae635b432a3