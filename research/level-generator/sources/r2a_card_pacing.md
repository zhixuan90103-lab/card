---
title: Research Notes
date: 2026-07-24 16:31
query: "TriPeaks Solitaire level design streak stock pacing player retention Golf Solitaire Fairway Solitaire combo chain difficulty"
type: tech
sources: 22
model: grok-4-1-fast
generated_by: grok-search
---
# Solitaire Games, Solvers, and Design: Compilation of Sources

## Table of Contents
- [GitHub Repositories for Solitaire Implementations and Solvers](#github-repositories-for-solitaire-implementations-and-solvers)
  - [shlomif/black-hole-solitaire](#shlomifblack-hole-solitaire)
  - [mimoguz/tripeaks-gdx](#mimoguztripeaks-gdx)
  - [mimoguz/tripeaks_neue](#mimoguztripeaks_neue)
  - [machineboy2045/html5-golf-solitaire](#machineboy2045html5-golf-solitaire)
  - [besnoi/golf](#besnoigolf)
  - [sedrehman/Solitaire-Golf](#sedrehmansolitaire-golf)
  - [ziadisalma/Golf-Solitaire](#ziadisalmagolf-solitaire)
  - [mchung94/solitaire-player](#mchung94solitaire-player)
  - [IgniparousTempest/javascript-tri-peaks-solitaire-solver](#igniparoustempestjavascript-tri-peaks-solitaire-solver)
- [Stack Overflow and Algorithm Discussions](#stack-overflow-and-algorithm-discussions)
  - [Structure/algorithm for solving game with overlapping cards](#structurealgorithm-for-solving-game-with-overlapping-cards)
- [Additional Resources (Titles and Links)](#additional-resources-titles-and-links)
- [Summary](#summary)

## GitHub Repositories for Solitaire Implementations and Solvers

### shlomif/black-hole-solitaire
**Main topic and thesis**: Repository providing solvers and statistics for Golf, Black Hole, All in a Row, and related patience card games.  
**Key points and arguments**: Features a C-based solver in `black-hole-solitaire/c-solver/` for efficiency; Perl prototype code; links to Freecell Solver and other patience solvers. Includes videos and CI testing.  
**Important data, statistics, quotes**: "Solvers and statistics for “Golf” solitaire, “Black Hole” solitaire, “All in a Row” solitaire and related card patience games."  
**Conclusions**: Focuses on automated solving and analysis of specific solitaire variants; related to broader open-source solitaire projects.  
**URL**: https://github.com/shlomif/black-hole-solitaire

### mimoguz/tripeaks-gdx
**Main topic and thesis**: A simple Tri Peaks solitaire game implemented with libGDX for cross-platform (Android, desktop) play.  
**Key points and arguments**: Supports multiple layouts, options, statistics; includes wiki, releases, and translation support. Note on ongoing re-implementation in TriPeaks NEUE.  
**Important data, statistics, quotes**: Screenshots of start/game screens, statistics; available in multiple languages (English, German, Spanish, etc.).  
**Conclusions**: Provides a feature-rich, open-source Tri Peaks implementation with ongoing improvements.  
**URL**: https://github.com/mimoguz/tripeaks-gdx

### mimoguz/tripeaks_neue
**Main topic and thesis**: Remake of Tri Peaks solitaire using Flutter, with enhanced features over the libGDX version.  
**Key points and arguments**: Supports four board layouts, face-down card visibility option, empty discard start, solvable game generation, statistics, portrait/landscape modes. AGPL license with font exceptions.  
**Important data, statistics, quotes**: "An option to ensure the created games are solvable (developed by Lykae)"; play online link available.  
**Conclusions**: Improved, cross-platform (including web, mobile, desktop) Tri Peaks game emphasizing playability and solvability options.  
**URL**: https://github.com/mimoguz/tripeaks_neue

### machineboy2045/html5-golf-solitaire
**Main topic and thesis**: HTML5/CSS3/jQuery implementation of Golf Solitaire with 3D animations and touch support.  
**Key points and arguments**: Webkit-compatible; uses vectorized card artwork; simple demo via Plnkr.  
**Important data, statistics, quotes**: "Currently Webkit compatible with touch support for IOS devices."  
**Conclusions**: Lightweight web-based Golf Solitaire demo suitable for browser play and code reuse.  
**URL**: https://github.com/machineboy2045/html5-golf-solitaire

### besnoi/golf
**Main topic and thesis**: Golf Solitaire with AI, hints, undo/redo features in Lua.  
**Key points and arguments**: Simple AI algorithm scores ~30/35; rules emphasize intellect over luck; controls for hints (H), AI (A), undo/redo.  
**Important data, statistics, quotes**: "My algorithm is very simple but it's still pretty good I'd say! It cannot score 35 out of 35 but still around 30"; max score 35.  
**Conclusions**: Demonstrates basic AI for Golf Solitaire with practical gameplay enhancements.  
**URL**: https://github.com/besnoi/golf

### sedrehman/Solitaire-Golf
**Main topic and thesis**: Java implementation of Solitaire Golf (MVC structure).  
**Key points and arguments**: Standard GPL license; includes model, view, control packages and executable JAR.  
**Important data, statistics, quotes**: Full GPL v3 text included; screenshot provided.  
**Conclusions**: Basic Java Golf Solitaire with standard project structure.  
**URL**: https://github.com/sedrehman/Solitaire-Golf

### ziadisalma/Golf-Solitaire
**Main topic and thesis**: Python implementation of Golf Solitaire (minimal repo).  
**Key points and arguments**: Core files for Card, Deck, and main game logic.  
**Important data, statistics, quotes**: No description provided.  
**Conclusions**: Simple Python-based Golf Solitaire.  
**URL**: https://github.com/ziadisalma/Golf-Solitaire

### mchung94/solitaire-player
**Main topic and thesis**: Java tool to solve and auto-play Pyramid and TriPeaks Solitaire in Microsoft Solitaire Collection, with optimal pathfinding.  
**Key points and arguments**: Supports board/card/score challenges; scans cards automatically; performance benchmarks provided; handles unknown cards in TriPeaks.  
**Important data, statistics, quotes**: Extensive timing tables (e.g., TriPeaks board challenges: mean 111ms on 1500 decks); "Always finds a solution with the fewest possible number of steps."  
**Conclusions**: Robust solver and player for specific Microsoft Solitaire variants with detailed performance data.  
**URL**: https://github.com/mchung94/solitaire-player

### IgniparousTempest/javascript-tri-peaks-solitaire-solver
**Main topic and thesis**: Brute-force JavaScript solver for Microsoft Tri-Peaks Solitaire.  
**Key points and arguments**: Web demo available; accepts deck string input; notes on implementation simplicity.  
**Important data, statistics, quotes**: Example deck string and usage steps provided.  
**Conclusions**: Lightweight JS solver for Tri-Peaks with online demo.  
**URL**: https://github.com/IgniparousTempest/javascript-tri-peaks-solitaire-solver

## Stack Overflow and Algorithm Discussions

### Structure/algorithm for solving game with overlapping cards
**Main topic and thesis**: Discussion on data structures and algorithms for solving overlapping-card solitaire variants (e.g., Tri Peaks) to find longest playable sequences.  
**Key points and arguments**: Represent board as directed graph (overlaps as edges); longest path challenges due to potential cycles; suggestions include state-graph DFS, dynamic programming, or brute-force.  
**Important data, statistics, quotes**: Example layout and optimal play sequence provided; "finding the longest path in a graph is NP-complete if the graph contains cycles."  
**Conclusions**: Graph-based or state-space search approaches recommended; practical brute-force viable for small instances.  
**URL**: https://stackoverflow.com/questions/2004012/structure-algorithm-for-solving-game-with-overlapping-cards

## Additional Resources (Titles and Links)
- tripeaks-solitaire-solver-js-73k: https://github.com/apiontek/tripeaks-solitaire-solver-js-73k
- Tripeaks Solitaire Solver in JavaScript - 73k: https://73k.us/blog/tripeaks-solitaire-solver-in-javascript/
- Tri Peaks Solitaire Solver: https://igniparoustempest.github.io/tri-peaks-solitaire-solver/
- solitaire-solver: https://github.com/naoyat/solitaire-solver
- A Solitaire-y Success in Gaming: https://medium.com/@mokshacb/a-solitaire-y-success-in-gaming-519ce6163833
- Main Street Mobile Arcade: Disney Solitaire: https://mainstreetelectricalarcade.medium.com/main-street-mobile-arcade-disney-solitaire-6f03bc6dc550
- 10 Reasons Why People Play Solitaire Board/Card Games: https://medium.com/@ThatCowboyGuy/10-reasons-why-people-play-solitaire-board-card-games-414f9ffd92b2
- No-Nonsense Rules for Engaging Game Design: https://medium.com/@JohnTeasdale/no-nonsense-rules-for-board-game-design-fef83e6d187f
- Level as a Story: Designing Levels for Puzzle Games: https://pratama-naufal.medium.com/level-as-a-story-designing-levels-for-puzzle-games-41eaa5261a12
- Solitaire game design: https://stackoverflow.com/questions/1772791/solitaire-game-design
- Learning to write a solitaire game: https://gamedev.stackexchange.com/questions/5708/learning-to-write-a-solitaire-game
- Mastering Card Game Development: Build Your Own Solitaire Game in Java: https://www.youtube.com/watch?v=vYsG2gToAzM

## Summary
This compilation covers open-source implementations of Golf and Tri Peaks solitaire (with solvers, AI, and cross-platform support), algorithmic discussions for overlapping-card puzzles, and related design/articles. Key themes include efficient solvers (brute-force, graph-based, optimal pathfinding), gameplay enhancements (hints, statistics, solvability options), and practical development insights. Performance data from solvers highlights feasibility for real-time use. All sources focus on patience/solitaire variants emphasizing strategy over pure luck.