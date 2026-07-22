---
title: Research Notes
date: 2026-07-21 15:16
query: "PixiJS card game OR solitaire github layered sprite click match"
type: tech,community
sources: 6
model: grok-4-1-fast
generated_by: grok-search
---
# PixiJS Game Development: Solitaire, Match-3, and Slot Game Examples

## Table of Contents
- [PixiJS-Solitaire GitHub Repository](#pixijs-solitaire-github-repository)
- [PixiJS Open Games Repository](#pixijs-open-games-repository)
- [Match 3 Game in Pixi.js 101: Sprite Basics (dev.to)](#match-3-game-in-pixijs-101-sprite-basics-devto)
- [Match3 Game with PixiJS GitHub Repository](#match3-game-with-pixijs-github-repository)
- [Reddit Post: Rebuilt Solitaire Game Using Pixi.js](#reddit-post-rebuilt-solitaire-game-using-pixijs)
- [Stack Overflow: Pixi JS Slot Game Count Specific Sprite](#stack-overflow-pixi-js-slot-game-count-specific-sprite)
- [Summary](#summary)

## PixiJS-Solitaire GitHub Repository
**Source:** https://github.com/s2031215/PixiJS-Solitaire

**1. Main topic and thesis**  
A web-based solitaire card game built with PixiJS v4, demonstrating offline/PWA capabilities for mobile play.

**2. Key points and arguments**  
- Implements core solitaire mechanics including double-click card placement and win detection.  
- Supports Progressive Web App (PWA) features and offline play (requires SSL).  
- Includes score board and multi-touch support.  
- Uses Pixel Plebes Digital Card Deck assets.  
- Written primarily in JavaScript (53.2%) and HTML (46.8%).

**3. Important data, statistics, quotes**  
- 10 stars, 3 watchers, 1 fork.  
- Latest release: v1.0.0 (August 1, 2020).  
- "A Web solitaire game using PixiJsV4."  
- Playable demo: https://s2031215.github.io/PixiJS-Solitaire/index.html

**4. Conclusions**  
Provides a lightweight, installable solitaire example showcasing PixiJS for 2D card games with mobile-friendly features.

## PixiJS Open Games Repository
**Source:** https://github.com/pixijs/open-games

**1. Main topic and thesis**  
Official collection of open-source games built with PixiJS to serve as learning resources for professional game development.

**2. Key points and arguments**  
- Features complete games: Bubbo Bubbo and Puzzling Potions (each with dedicated READMEs and playable links).  
- Highlights PixiJS ecosystem tools: PixiJS core, Sound, UI, AssetPack, and Spine.  
- Emphasizes TypeScript (99.6%) usage for maintainable code.  
- Goal: Enable developers to study real-world implementations.

**3. Important data, statistics, quotes**  
- 440 stars, 9 watchers, 85 forks.  
- "The goal of this project is to provide a collection of games that can be used to learn how to make professional games."  
- Playable links: https://pixijs.io/open-games/bubbo-bubbo and https://pixijs.io/open-games/puzzling-potions.

**4. Conclusions**  
Serves as a high-quality reference repository for building polished PixiJS games using modern tools and best practices.

## Match 3 Game in Pixi.js 101: Sprite Basics (dev.to)
**Source:** https://dev.to/roman_guivan_17680f142e28/match-3-game-in-pixi-js-36hm

**1. Main topic and thesis**  
Introductory tutorial on building a match-3 game foundation in PixiJS, focusing on sprites, the stage, and the update loop.

**2. Key points and arguments**  
- Explains core PixiJS concepts: PIXI.Application, Sprite, Loader, Ticker (update loop at ~60 FPS via requestAnimationFrame).  
- Demonstrates loading assets, creating a grid of randomized sprites (e.g., 6x4 animal tiles), anchoring, positioning, and basic animation (pulsing scale via sine wave).  
- Uses Kenney.nl animal assets; recommends cloning a starter repo with webpack.  
- Emphasizes performance advantages of WebGL rendering over DOM.

**3. Important data, statistics, quotes**  
- "Match 3 games are on average at least 80% more exciting to develop compared to what you're actually paid for..."  
- Code examples include 30+ animal types in a randomized grid and ticker-driven scaling animation: `scale = 1 + 0.1 * Math.sin(Date.now() / (400 + index * 10))`.  
- Part 1 of a series; teaser for selection/swapping in part 2.

**4. Conclusions**  
Provides a practical, beginner-friendly starting point for match-3 mechanics with fluid 2D animations in PixiJS.

## Match3 Game with PixiJS GitHub Repository
**Source:** https://github.com/gamedevland/match3

**1. Main topic and thesis**  
A complete match-3 game implementation using PixiJS, accompanied by a tutorial.

**2. Key points and arguments**  
- Includes source code in `src/`, webpack configuration, and a live demo.  
- Tutorial available at https://gamedev.land/match3/.  
- Demo: https://gamedevland.github.io/match3/.  
- Primarily JavaScript (96.7%) with HTML.

**3. Important data, statistics, quotes**  
- 17 stars, 1 watcher, 7 forks.  
- "Match3 game with PixiJS".

**4. Conclusions**  
Offers a ready-to-run match-3 example and tutorial for developers seeking a full game implementation beyond basic sprites.

## Reddit Post: Rebuilt Solitaire Game Using Pixi.js
**Source:** https://www.reddit.com/r/pixijs/comments/1ffbpuq/i_rebuilt_my_solitaire_game_using_pixijs/

(Note: Page content retrieval encountered an error; limited extraction based on title and context from other sources. The post discusses rebuilding a solitaire game in PixiJS, likely sharing implementation insights or code improvements.)

**1. Main topic and thesis**  
Personal account of rebuilding a solitaire game using PixiJS.

**2. Key points and arguments**  
- Focuses on transitioning or improving an existing solitaire project with PixiJS features.

**3. Important data, statistics, quotes**  
- Title indicates a rebuild effort in the PixiJS subreddit community.

**4. Conclusions**  
Highlights community interest in applying PixiJS to card games like solitaire.

## Stack Overflow: Pixi JS Slot Game Count Specific Sprite
**Source:** https://stackoverflow.com/questions/53728725/pixi-js-slot-game-count-specific-sprite

**1. Main topic and thesis**  
Question about counting instances of a specific sprite (e.g., "flowerTop.png") in a PixiJS slot game demo for win detection or logging.

**2. Key points and arguments**  
- References the official PixiJS slots demo.  
- Issue: Loading assets with `.add()` does not directly allow counting rendered sprites; need to assign textures to variables.  
- Answer suggests referencing rows 18/48 (texture creation) and 54 (adding to screen) from the demo for counting.

**3. Important data, statistics, quotes**  
- "if i spin him 2 times in the same reel i want to console.log him saying 'FlowerTop: 2'".  
- Viewed ~1k times; asked Dec 2018, answered Feb 2019.

**4. Conclusions**  
Illustrates practical sprite management challenges in reel-based games and the need for proper variable assignment when using PixiJS loaders.

## Summary
These sources collectively demonstrate PixiJS applications in classic games: solitaire (card mechanics, PWA/offline support), match-3 (sprite grids, animation loops), and slot-style games (sprite counting). Key themes include efficient sprite handling, the Ticker update loop, asset loading, and ecosystem tools. Official and community examples provide both beginner tutorials and production-ready references for 2D web game development. All URLs are directly cited in their respective sections.