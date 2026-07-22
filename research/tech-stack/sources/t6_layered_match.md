---
title: Research Notes
date: 2026-07-21 15:34
query: "layered tile match mahjong solitaire web canvas OR pixi OR three github sheep"
type: tech
sources: 6
model: grok-4-1-fast
generated_by: grok-search
---
**Mahjong Solitaire: Modern Implementations, Algorithms, and Development Insights**

# Table of Contents
- [fmahjongg: Tauri + Three.js Mahjong Solitaire](#fmahjongg-tauri--threejs-mahjong-solitaire)
- [mahjong-3d: 3D Taiwanese Mahjong Simulator and Screen Saver](#mahjong-3d-3d-taiwanese-mahjong-simulator-and-screen-saver)
- [green-mahjong: HTML5 Solitaire Mahjong with Themes and Layouts](#green-mahjong-html5-solitaire-mahjong-with-themes-and-layouts)
- [Stack Overflow: Generating Solvable Mahjong Solitaire Layouts](#stack-overflow-generating-solvable-mahjong-solitaire-layouts)
- [Modern Libraries with Classic Games: PixiJS Optimization for Web Games](#modern-libraries-with-classic-games-pixijs-optimization-for-web-games)
- [Pixi.js Showcase: Mahjong Solitaire with Pixi V6](#pixijs-showcase-mahjong-solitaire-with-pixi-v6)
- [Summary](#summary)

## fmahjongg: Tauri + Three.js Mahjong Solitaire
**Source:** [https://github.com/JoeriKaiser/fmahjongg](https://github.com/JoeriKaiser/fmahjongg)

**Main topic and thesis:** An open-source desktop mahjong solitaire game built as a cross-platform Tauri app using modern web technologies for 3D rendering and UI.

**Key points and arguments:**
- Tech stack combines TypeScript/React frontend with Rust/Tauri backend, Three.js (via React Three Fiber and Drei) for 3D, shadcn/ui + Tailwind for UI, Zustand for state, Vite bundler, and Bun runtime.
- Features include interactive 3D board, responsive/accessible UI, animated elements, persistent state, and desktop packaging (Windows/macOS/Linux planned).

**Important data, statistics, quotes:**
- "This is an open source mahjong solitaire game app built using the following technologies."
- Roadmap: v1 focuses on release + leaderboards/customization; v2 adds online multiplayer, achievements, mobile, and accessibility.
- Languages: TypeScript (87.2%), CSS (9.5%), Rust (2.7%).

**Conclusions:** The project demonstrates a production-ready approach to bringing classic mahjong solitaire to desktop with performant 3D graphics and modern tooling. It remains early-stage with 0 stars and no releases yet.

## mahjong-3d: 3D Taiwanese Mahjong Simulator and Screen Saver
**Source:** [https://github.com/elh/mahjong-3d](https://github.com/elh/mahjong-3d)

**Main topic and thesis:** A React Three Fiber-based 3D simulator for Taiwanese 16-tile Mahjong, also packaged as a macOS screen saver.

**Key points and arguments:**
- Simulates tile handling with animations and between-game transitions; includes debug replay by seed.
- Scope limitations: Taiwanese variant only, simple bot AI, unoptimized performance, non-playable client.
- Project structure separates simulation/rules (src/sim), bots, and UI/Three.js rendering; uses SVG tile assets.

**Important data, statistics, quotes:**
- "Infinite 3D Taiwanese Mahjong made with React Three Fiber."
- "Simulates Taiwanese 16-tile Mahjong. Renders a 3D scene with animated tile handling..."
- macOS screen saver requires macOS 14+; MIT licensed with attributions.

**Conclusions:** Focuses on visual simulation and idle entertainment rather than gameplay. Provides a reusable 3D engine foundation and easy screen-saver packaging via native wrappers.

## green-mahjong: HTML5 Solitaire Mahjong with Themes and Layouts
**Source:** [https://github.com/danbeck/green-mahjong](https://github.com/danbeck/green-mahjong)

**Main topic and thesis:** A pure HTML5/CSS/JS (jQuery) solitaire mahjong game supporting multiple themes, layouts, and cross-platform deployment including mobile apps.

**Key points and arguments:**
- Three themes (classic, fruits, high-visibility) and six layouts; works in desktop and mobile browsers.
- Originally packaged via PhoneGap Build; migrated to Capacitor for ongoing Android/iOS support.
- Artwork under CC-BY-NC; code GPLv3.

**Important data, statistics, quotes:**
- "Green Mahjong is a HTML5 based GPLv3 solitaire mahjong game. It features three nice themes, six different layouts..."
- Playable online at greenmahjong.daniel-beck.org; available on Google Play and Apple App Store.
- 102 stars, 61 forks; last release 2014 (v2.2.0), with Capacitor migration for modern stores.

**Conclusions:** A mature, lightweight browser-first implementation emphasizing accessibility across devices and easy theming, with clear migration guidance for native distribution.

## Stack Overflow: Generating Solvable Mahjong Solitaire Layouts
**Source:** [https://stackoverflow.com/questions/159547/mahjong-solitaire-arrange-tiles-to-ensure-at-least-one-path-to-victory-regard](https://stackoverflow.com/questions/159547/mahjong-solitaire-arrange-tiles-to-ensure-at-least-one-path-to-victory-regard)

**Main topic and thesis:** Algorithmic methods to guarantee at least one solvable path in mahjong solitaire tile arrangements, regardless of layout.

**Key points and arguments:**
- Core approaches: generate a valid solution first then build the board around it; play the game in reverse by placing matching pairs in legal positions; forward solving with backtracking or DAG traversal.
- Reverse placement ensures solvability but requires rules to avoid self-blocking pairs.
- Forward methods can retry on dead ends or use graph theory for exhaustive search.

**Important data, statistics, quotes:**
- "The usual way is to generate a valid solution first and then build the puzzle around it."
- "Play the game in reverse. Randomly lay out pieces pair by pair, in places where you could slide them into the heap."
- Detailed forward algorithm using pair-removal stacks and DAG traversal; references a 2007 research paper on the topic.

**Conclusions:** Reverse generation or forward solving with retries/backtracking reliably produces winnable boards while allowing player errors to create unsolvable states. Multiple complementary techniques exist for different layout complexities.

## Modern Libraries with Classic Games: PixiJS Optimization for Web Games
**Source:** [https://dev.to/stoyan_shopov_8c720357846/modern-libraries-with-classic-games-3a7g](https://dev.to/stoyan_shopov_8c720357846/modern-libraries-with-classic-games-3a7g)

**Main topic and thesis:** Using PixiJS for smooth 2D web games (including mentions of Mahjong) while optimizing Core Web Vitals by deferring the render loop until user interaction.

**Key points and arguments:**
- PixiJS advantages: GPU-accelerated WebGL, scene graph, pointer handling, resolution scaling, and ecosystem.
- PageSpeed fix: set `autoStart: false`, stop ticker initially, start only on first pointer/touch/keydown, pause on tab hide.
- Responsive handling via ResizeObserver with single-frame renders; lazy filters and texture atlases recommended.

**Important data, statistics, quotes:**
- "don’t start the ticker until the user interacts."
- "Lighthouse penalizes background work. A running ticker is *work*."
- Pattern yields better LCP, TBT, INP, and battery life without changing gameplay.

**Conclusions:** PixiJS is ideal for classic card/puzzle games like Mahjong when paired with interaction-gated rendering to satisfy modern web performance standards.

## Pixi.js Showcase: Mahjong Solitaire with Pixi V6
**Source:** [https://www.html5gamedevs.com/topic/494-pixijs-showcase/page/5/](https://www.html5gamedevs.com/topic/494-pixijs-showcase/page/5/)

**Main topic and thesis:** Community showcase of projects built with Pixi.js, including a Mahjong Solitaire implementation using version 6.

**Key points and arguments:**
- Simple puzzle game built with Pixi V6 emphasizing straightforward gameplay and graphics.
- Broader context: numerous other Pixi demos (platformers, physics, animations, etc.) demonstrating the library’s versatility.

**Important data, statistics, quotes:**
- "Hey guys. Shameless plug for a game I am working on - Mahjong Solitaire. Made with Pixi V6."
- Forum thread active since 2013 with hundreds of replies showcasing diverse Pixi.js uses.

**Conclusions:** Pixi.js V6 (and later) supports clean, performant 2D mahjong solitaire implementations suitable for browser deployment, as evidenced by real community projects.

## Summary
These sources collectively illustrate the diversity of mahjong solitaire development: from lightweight HTML5 games and 3D desktop apps to algorithmic solvability guarantees and modern rendering optimizations with PixiJS or Three.js. Common themes include cross-platform reach, performant graphics, and ensuring fair (solvable) puzzles. All projects emphasize open-source practices and modern web/native tooling. 

**Cited URLs:**
- https://github.com/JoeriKaiser/fmahjongg
- https://github.com/elh/mahjong-3d
- https://github.com/danbeck/green-mahjong
- https://stackoverflow.com/questions/159547/mahjong-solitaire-arrange-tiles-to-ensure-at-least-one-path-to-victory-regard
- https://dev.to/stoyan_shopov_8c720357846/modern-libraries-with-classic-games-3a7g
- https://www.html5gamedevs.com/topic/494-pixijs-showcase/page/5/