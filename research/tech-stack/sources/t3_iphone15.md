---
title: Research Notes
date: 2026-07-21 15:16
query: "iPhone 15 CSS viewport 393x852 safe-area-inset visualViewport web game canvas"
type: tech
sources: 8
model: grok-4-1-fast
generated_by: grok-search
---
**iOS PWA and Web Game Development: Safe Areas, Viewports, Device Emulation, and Layout Fixes**

## Table of Contents
- [Source 1: iOS Game UI for Web & PWA Developer Guide](#source-1-ios-game-ui-for-web--pwa-developer-guide)
- [Source 2: Custom Device Emulation for Chrome DevTools](#source-2-custom-device-emulation-for-chrome-devtools)
- [Source 3: Vaadin AppLayout Margins Issue on iPhone 15](#source-3-vaadin-applayout-margins-issue-on-iphone-15)
- [Source 4: iOS PWA Viewport & Safe Area Reference (piclaw)](#source-4-ios-pwa-viewport--safe-area-reference-piclaw)
- [Source 5: iPhone 15 Screen Sizes](#source-5-iphone-15-screen-sizes)
- [Source 6: Make Your PWAs Look Handsome on iOS](#source-6-make-your-pwas-look-handsome-on-ios)
- [Source 7: Safe Area Inset Calculator Tool](#source-7-safe-area-inset-calculator-tool)
- [Summary](#summary)
- [Cited URLs](#cited-urls)

## Source 1: iOS Game UI for Web & PWA Developer Guide
**Main topic and thesis**: Comprehensive guide to fullscreen web games/PWAs on iPhone, addressing safe-area insets, Dynamic Island/notch handling, canvas sizing, and iOS WebKit limitations/bugs.

**Key points and arguments**:
- Requires `<meta name="viewport" content="... viewport-fit=cover">` + `apple-mobile-web-app-capable` and `black-translucent` for edge-to-edge content and non-zero `env(safe-area-inset-*)` values.
- Use `height: 100vh` on `html/body` (not 100% or 100dvh) for reliable fullscreen from PWA cold start.
- JavaScript probing for `env()` values via DOM elements due to WebKit bugs; multi-strategy timeouts and viewport meta toggle workaround for cold-start issues.
- Detailed portrait/landscape safe-area tables by device category (no notch, notch gen 1/2, Dynamic Island).
- Undocumented top touch dead zone in landscape (recommend 20px buffer).
- Dynamic Island expands for Live Activities (fixed `env()` values).
- iOS limitations: No Fullscreen API on iPhone; no orientation lock; standalone PWA mode required.

**Important data, statistics, quotes**:
- Portrait insets (examples): Dynamic Island 59/34/0/0; large 62/34/0/0 (CSS points).
- Landscape: Symmetric side insets (e.g., 59/59 for standard Dynamic Island).
- "height: 100vh is the ONLY value that works from cold start."
- WebKit bugs referenced (#274773, #191872).

**Conclusions**: Follow specific CSS/JS patterns and probe strategies to avoid common gotchas; test with Live Activities and rotations.

## Source 2: Custom Device Emulation for Chrome DevTools
**Main topic and thesis**: Repository providing JSON presets and instructions for adding custom devices (including many iPhones) to Chrome DevTools device emulation.

**Key points and arguments**:
- Tables of desktop, tablet, and mobile devices with viewport width/height, DPR, and user agents.
- Includes iPhone 15 series (e.g., iPhone 15 / 15 Pro: 393×852 @3x; 15 Plus/Pro Max: 430×932 @3x) plus older models.
- Plugin and device.json for easy import.

**Important data, statistics, quotes**: Extensive lists (e.g., iPhone 15 Pro: 393×852, DPR 3; many Samsung, Xiaomi, etc.).

**Conclusions**: Useful for consistent testing of responsive/PWA layouts across exact device specs.

## Source 3: Vaadin AppLayout Margins Issue on iPhone 15
**Main topic and thesis**: Bug report highlighting broken marginals/layout in Vaadin AppLayout component specifically on iPhone 15 (likely related to safe-area or viewport handling).

**Key points and arguments**: Issue tagged with high impact, needs research; fixed in later Vaadin releases.

**Important data, statistics, quotes**: Limited content; focuses on iPhone 15-specific rendering problems.

**Conclusions**: Safe-area and viewport meta handling must be considered in UI component libraries for modern iPhones.

## Source 4: iOS PWA Viewport & Safe Area Reference (piclaw)
**Main topic and thesis**: Exhaustive reference documenting iOS standalone PWA viewport bugs, cold-start discrepancies, and proven fixes for height and safe areas.

**Key points and arguments**:
- Standalone mode differs from Safari (no toolbar, different `env()` values, separate WKWebView).
- Core bug: `100dvh`/`window.innerHeight` under-reports by `env(safe-area-inset-top)` (e.g., 59px on iPhone 14 Pro) on cold start.
- `100vh` is correct in standalone; self-corrects on scroll/rotate/foreground.
- Recommended fix: CSS variable with `100dvh` default + JS override to `100vh` when `navigator.standalone`.
- Required metas: `viewport-fit=cover`, `apple-mobile-web-app-capable`, `black-translucent`.
- Safe-area padding via `env()`; keyboard and orientation handling.

**Important data, statistics, quotes**:
- Measured deltas exactly match safe-area-top (e.g., 59px on Dynamic Island models).
- "The `100dvh` unit... introduces a new bug in standalone mode."
- Validated on iPhone 15 Pro / iOS 17–18/26.

**Conclusions**: Use hybrid viewport strategy and specific metas; avoid `position:fixed` on root in some cases.

## Source 5: iPhone 15 Screen Sizes
**Main topic and thesis**: Detailed specs for iPhone 15 family screen resolutions, pixel densities, size classes, and safe-area insets.

**Key points and arguments**:
- All models now use Dynamic Island; two main sizes (6.1" and 6.7").
- Resolutions: 393×852 (base/Pro) and 430×932 (Plus/Pro Max) points @3x.
- Safe-area insets identical across 15 series: portrait 59/34/0/0; landscape 0/21/59/59.

**Important data, statistics, quotes**:
- iPhone 15: 6.1" Super Retina XDR, 393×852 points, 1179×2556 pixels (460 ppi).
- Complete list of 11 historical iPhone sizes.
- "All four models now have the dynamic island."

**Conclusions**: Use consistent insets for iPhone 15+ layouts; reference for App Store screenshots.

## Source 6: Make Your PWAs Look Handsome on iOS
**Main topic and thesis**: Practical guide to achieving edge-to-edge fullscreen PWAs on iOS by embracing the notch/Dynamic Island via viewport meta and safe-area padding.

**Key points and arguments**:
- Default behavior letterboxes content; fix with `viewport-fit=cover` + specific apple metas.
- Hack: `min-height: calc(100% + env(safe-area-inset-top))` + padding on `html`.
- Apply `env(safe-area-inset-*)` padding to containers, fixed elements, headers.
- Bonus for fixed-position elements.

**Important data, statistics, quotes**: Before/after visuals described; status bar becomes translucent.

**Conclusions**: Simple meta + CSS changes enable full-screen PWAs; safe areas are the app's responsibility.

## Source 7: Safe Area Inset Calculator Tool
**Main topic and thesis**: Interactive web tool generating precise `env(safe-area-inset-*)` CSS (including max() patterns, Tailwind support) with live device previews for notches/Dynamic Island.

**Key points and arguments**:
- Supports iPhone 15/16, older models, iPads, Android; portrait/landscape.
- Outputs: plain classes, @supports, max(Npx, env()), Tailwind plugins, recipes for nav/header/FAB.
- Reminds about `viewport-fit=cover`; shows usable viewport stats and red/green preview.

**Important data, statistics, quotes**: Example: iPhone 16 Pro portrait usable height 759px (89.1%); recommended `max(16px, env(...))`.

**Conclusions**: Essential utility for generating device-specific safe-area CSS without manual calculation.

## Summary
These sources collectively provide a complete toolkit for iOS PWA and web game development: mandatory viewport meta tags (`viewport-fit=cover`, black-translucent), reliable height strategies (`100vh` in standalone), `env(safe-area-inset-*)` padding with probing/workarounds, exact iPhone 15 insets (59pt top portrait), Chrome emulation presets, and automated CSS generators. Common themes include cold-start bugs, Dynamic Island handling, and the need for testing rotations/Live Activities. Following these patterns ensures edge-to-edge, notch-safe experiences without layout breakage.

## Cited URLs
- https://gist.github.com/fozzedout/5e77925381991a9570151550992baf14
- https://github.com/amirshnll/custom-device-emulation-chrome
- https://github.com/vaadin/web-components/issues/8449
- https://github.com/rcarmo/piclaw/blob/main/docs/PWA.md
- https://useyourloaf.com/blog/iphone-15-screen-sizes/
- https://karmasakshi.medium.com/make-your-pwas-look-handsome-on-ios-fd8fdfcd5777
- https://www.consolelog.tools/tools/safe-area-calculator