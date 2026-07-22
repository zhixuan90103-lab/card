---
title: Research Notes
date: 2026-07-21 15:19
query: "PixiJS v8 eventMode hitArea nested sprite click topmost only interaction"
type: tech
sources: 8
model: grok-4-1-fast
generated_by: grok-search
---
**PixiJS v8 Core Components: Events, Scene Objects, Migration, APIs, and Hit Detection**

**Table of Contents**

- [Events / Interaction](#events--interaction)
- [Scene Objects](#scene-objects)
- [v8 Migration Guide](#v8-migration-guide)
- [Sprite API Documentation](#sprite-api-documentation)
- [Container API Documentation](#container-api-documentation)
- [GitHub Issue #8132: HitArea Inaccuracy in Fullscreen](#github-issue-8132-hitareainaccuracy-in-fullscreen)
- [PixiJS v8 Migration Guide (Japanese Summary)](#pixijs-v8-migration-guide-japanese-summary)
- [Simple Hit Detection with PixiJS for Hostile Shapes](#simple-hit-detection-with-pixijs-for-hostile-shapes)
- [Summary](#summary)
- [Cited Sources](#cited-sources)

## Events / Interaction
**Source:** https://pixijs.com/8.x/guides/components/events

**Main topic and thesis:**  
PixiJS v8 provides a flexible, performant, DOM-like federated event system for mouse, touch, and pointer input, replacing the legacy InteractionManager.

**Key points and arguments:**  
- Set `eventMode` (`none`, `passive` (default), `auto`, `static`, `dynamic`) on Containers/Sprites to control interactivity.  
- Supports rich pointer, mouse, touch, and global events (e.g., `pointerdown`, `globalpointermove`).  
- Hit testing walks the display tree; `hitArea` overrides bounds; `interactiveChildren` controls recursion.  
- Listeners via `on()`/`off()`, `addEventListener()`, or callbacks; `isInteractive()` and `cursor` properties available.

**Important data, statistics, quotes:**  
- "This system replaces the legacy `InteractionManager` from previous versions with a unified, DOM-like federated event model."  
- Example: `sprite.eventMode = 'static'; sprite.on('pointerdown', () => console.log('Sprite clicked!'));`

**Conclusions:**  
The event system is performant and flexible for interactive scenes; use `hitArea` for custom collision and global events for legacy behavior.

## Scene Objects
**Source:** https://pixijs.com/8.x/guides/components/scene-objects

**Main topic and thesis:**  
Scene objects form the display hierarchy (scene graph) in PixiJS v8; Container is the base class, with leaf nodes (Sprite, Text, etc.) for rendering.

**Key points and arguments:**  
- Containers hold children and apply transforms; only Containers should have children (leaf nodes must be wrapped).  
- Transforms: `position`, `rotation`/`angle`, `scale`, `pivot`, `anchor` (Sprites only), `alpha`, `skew`.  
- Bounds via `getLocalBounds()`/`getBounds()`; masking and filters supported.  
- Tinting, blend modes, `onRender` callback, and interaction basics.

**Important data, statistics, quotes:**  
- "In v8, only containers should have children."  
- Anchor (normalized 0-1) vs. Pivot (pixels).

**Conclusions:**  
Use Containers for grouping and transforms; leverage masking, filters, and `onRender` for advanced scenes.

## v8 Migration Guide
**Source:** https://pixijs.com/8.x/guides/migrations/v8

**Main topic and thesis:**  
Comprehensive guide for migrating from v7 to v8, highlighting breaking changes, performance improvements (including WebGPU), and new patterns.

**Key points and arguments:**  
- Single package (`pixi.js`); async `app.init()`; new TextureSources replace BaseTexture.  
- Graphics API overhaul: shape-then-fill/stroke (e.g., `.rect().fill()`); new method names and options.  
- Container replaces DisplayObject; `onRender` replaces `updateTransform`; render groups, culling changes.  
- Shader resources, filter updates, and many deprecations.

**Important data, statistics, quotes:**  
- "PixiJS v8 introduces several exciting changes and improvements that dramatically enhance the performance of the renderer."  
- Extensive code comparison examples for Graphics, shaders, etc.

**Conclusions:**  
Migration requires updates to package imports, initialization, Graphics, and event/transform patterns; test for plugin compatibility.

## Sprite API Documentation
**Source:** https://pixijs.download/v8.9.2/docs/scene.Sprite.html

**Main topic and thesis:**  
Detailed reference for the Sprite class, a key renderable leaf node extending Container.

**Key points and arguments:**  
- Created via `Sprite.from(source)` or constructor with texture.  
- Properties: `texture`, `anchor`, `width`/`height` (scale-based), `tint`, `blendMode`.  
- Methods: `destroy(options)`, `getSize`/`setSize`, inherited Container features.

**Important data, statistics, quotes:**  
- "The Sprite object is one of the most important objects in PixiJS."  
- Anchor default `(0,0)`; supports `hitArea` and events via inheritance.

**Conclusions:**  
Sprites are efficient for textured display; use with spritesheets and manage via `destroy` options.

## Container API Documentation
**Source:** https://pixijs.download/dev/docs/scene.Container.html

**Main topic and thesis:**  
Container is the foundational class for all display objects that hold children, supporting transforms, masking, filtering, and events.

**Key points and arguments:**  
- Children management, transforms (local/group/world), alpha, visibility vs. renderable.  
- Render groups for optimized rendering passes; culling, hit testing, event modes.  
- Masking, filters, sorting, and extensive inherited event properties.

**Important data, statistics, quotes:**  
- "Container is a general-purpose display object that holds children. It also adds built-in support for advanced rendering features like masking and filtering."  
- Three transform levels: local, group, world.

**Conclusions:**  
Core building block for scene graphs; use render groups judiciously for performance.

## GitHub Issue #8132: HitArea Inaccuracy in Fullscreen
**Source:** https://github.com/pixijs/pixijs/issues/8132

**Main topic and thesis:**  
Report of slightly inaccurate `hitArea` collision detection (longer to left/right) when using fullscreen display.

**Key points and arguments:**  
- Issue affects hit testing precision in fullscreen mode.  
- Related to bounds/hitArea calculation under certain display conditions.

**Important data, statistics, quotes:**  
Title: "In full screen display, the hitArea collision detection is slightly longer to the left and right."

**Conclusions:**  
Potential bug in fullscreen hitArea accuracy; may require workarounds or future fixes.

## PixiJS v8 Migration Guide (Japanese Summary)
**Source:** https://zenn.dev/chiietc/articles/2e9295eca42843

**Main topic and thesis:**  
Personal notes/summary of the official v8 migration guide, focusing on practical breaking changes for Japanese developers.

**Key points and arguments:**  
- Package unification, async init, TextureSources, Graphics rewrite, shader resources.  
- Container as new base, `onRender`, culling changes, Assets deprecations.  
- Warnings about ParticleContainer and un-migrated plugins.

**Important data, statistics, quotes:**  
- Detailed Japanese translations and code diffs of official examples.  
- "全部書き直すのめんどくせ～～～～～～～" (Everything needs rewriting—it's a pain).

**Conclusions:**  
Helpful reference for migration; emphasizes rewriting Graphics and handling async initialization.

## Simple Hit Detection with PixiJS for Hostile Shapes
**Source:** https://www.pathuku.com/blog/simple-hit-detection-with-pixijs/

**Main topic and thesis:**  
Demonstrates simple distance-based hit/collision detection between sprites for a game ("Hostile Shapes").

**Key points and arguments:**  
- Use bounding boxes or proximity (`calculateDistanceBetweenTwoPoints`).  
- Ticker-driven animation with velocity; tint on collision.  
- Suitable for performance on low-spec devices.

**Important data, statistics, quotes:**  
- "Sprite hit detection and collision detection are essential elements of game development."  
- Example uses `app.ticker.add()` for updates and pairwise distance checks.

**Conclusions:**  
Simple proximity checks are effective and performant for basic sprite interactions.

## Summary
These sources collectively cover PixiJS v8's event system, scene graph fundamentals (Containers/Sprites), major migration changes from v7, core API details, a known hitArea fullscreen issue, a community migration summary, and practical hit detection implementation. Key themes include performance gains (WebGPU, render groups), API modernizations (Graphics, events, transforms), and the need for careful migration of interactive and rendering code. Use `eventMode`/`hitArea` for interactions and `onRender`/`render groups` for efficiency.

## Cited Sources
- https://pixijs.com/8.x/guides/components/events  
- https://pixijs.com/8.x/guides/components/scene-objects  
- https://pixijs.com/8.x/guides/migrations/v8  
- https://pixijs.download/v8.9.2/docs/scene.Sprite.html  
- https://pixijs.download/dev/docs/scene.Container.html  
- https://github.com/pixijs/pixijs/issues/8132  
- https://zenn.dev/chiietc/articles/2e9295eca42843  
- https://www.pathuku.com/blog/simple-hit-detection-with-pixijs/