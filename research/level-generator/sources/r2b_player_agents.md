---
title: Research Notes
date: 2026-07-24 16:33
query: "solitaire solver human like heuristic greedy random player model automated playtesting puzzle games difficulty rating solution path branching factor mistake cost"
type: tech
sources: 23
model: grok-4-1-fast
generated_by: grok-search
---
**Solitaire and Puzzle Solvers: A Compilation of GitHub Repositories and Related Resources**

# Table of Contents
- [Introduction](#introduction)
- [Solitaire Solvers](#solitaire-solvers)
  - [mayhewsw/SolitaireSolver](#mayhewswsolitairesolver)
  - [shlomif/KlondikeSolver](#shlomifklondikesolver)
  - [hickford/shenzhen-solitaire-solver](#hickfordshenzhen-solitaire-solver)
  - [K-Konstantinidis/Freecell-Solitaire-Solver](#k-konstantinidisfreecell-solitaire-solver)
  - [Additional Solitaire and Puzzle Solver Repos](#additional-solitaire-and-puzzle-solver-repos)
- [Related Puzzle Solvers and Algorithms](#related-puzzle-solvers-and-algorithms)
- [Broader AI and Game Development Resources](#broader-ai-and-game-development-resources)
- [Summary](#summary)
- [References](#references)

## Introduction
This document compiles key information from GitHub repositories and online resources focused on solvers for solitaire variants (Klondike, FreeCell, Pyramid, etc.) and other puzzles (8-puzzle, peg solitaire, Mahjong solitaire). Sources emphasize algorithmic approaches like backtracking, A*, IDA*, image recognition, and AI methods. Extracted details cover main topics, key features, findings, and conclusions where available.

## Solitaire Solvers

### mayhewsw/SolitaireSolver
**Main topic and thesis**: Python-based Klondike solitaire solver that uses computer vision (OpenCV) and OCR (Tesseract/pytesser) for real-time image recognition from screen captures to detect cards and automate moves.[[1]](https://github.com/mayhewsw/SolitaireSolver)

**Key points and arguments**:
- Integrates screenshot processing (`processCards.py`), move decision logic (`SolitaireSolver.py`), and mouse automation (`runner.py`).
- Runs against AisleRiot solitaire in fullscreen on Ubuntu.
- Dependencies include OpenCV, PyMouse, XLib, and Tesseract.

**Important data, statistics, quotes**: "This solitaire solver is a Python program that will solve a Klondike solitaire game using OpenCV." Known issues include infinite loops on recurring moves and occasional missed clicks on deep piles. Screen resolution (1920x1200) affects hard-coded mouse logic.

**Conclusions**: A functional but hacky proof-of-concept for vision-based game automation; not maintained for modern OpenCV versions.

### shlomif/KlondikeSolver
**Main topic and thesis**: C++ implementation of a Klondike solitaire solver using IDA* for minimal-length solutions (older version; points to an improved fork).

**Key points and arguments**:
- Focuses on finding optimal or near-optimal solutions.
- Newer fork adds support for variable draw counts (1 or 3), reduced RAM usage, faster performance, and a "fast" non-optimal mode.

**Important data, statistics, quotes**: Links to https://github.com/ShootMe/Klondike-Solver for updates.

**Conclusions**: Provides a foundation for optimal Klondike solving; superseded by improved implementations.

### hickford/shenzhen-solitaire-solver
**Main topic and thesis**: Backtracking solver for the solitaire minigame in Shenzhen I/O (Zachtronics), using piles, foundations, and free cells.

**Key points and arguments**:
- Models game state with notation (e.g., `r8` for red 8, `RR` for red dragon).
- Solves by searching moves between tableau piles and cells.

**Important data, statistics, quotes**: "Around 98% were soluble" across 1000 generated games. Median solve time: 0.1 seconds; 95th percentile: 6 seconds on 2015 hardware. Includes an example insoluble game layout.

**Conclusions**: Highly effective for this constrained solitaire variant; most deals are solvable quickly via backtracking.

### K-Konstantinidis/Freecell-Solitaire-Solver
**Main topic and thesis**: Java implementation solving any FreeCell puzzle using four pathfinding algorithms: BFS, DFS, Best-First Search, and A*.

**Key points and arguments**:
- Includes a C generator for random puzzles.
- Outputs step-by-step move sequences (freecell, stack, source, newstack operations).
- Supports compilation and batch execution.

**Important data, statistics, quotes**: Example puzzle files and detailed solution traces provided; algorithms handle standard 52-card FreeCell layouts.

**Conclusions**: Demonstrates practical comparison of search algorithms for constraint-satisfaction problems like FreeCell.

### Additional Solitaire and Puzzle Solver Repos
- **EbanEscott/Solitaire-Odds**: AI engine comparing multiple algorithms for Klondike odds and performance.
- **ComicSansMS/kabufuda-solver**: Backtracking solver for Kabufuda solitaire (Zachtronics game).
- **dbry/peg-solitaire**: English peg solitaire solver using random move generation.
- **supat-roong/puzzle-solver-project**: Intelligent Klondike solver using AI/search techniques.
- **danielrcollins1/SolitaireSolver**: General solitaire solving implementation.
- **mchung94/pyramid-solver**: Solver for Pyramid solitaire.
- **Starwort/NEA** and **chiamp/skill-expression-game-analysis**: Educational or analysis-focused solitaire/game projects.

## Related Puzzle Solvers and Algorithms
- **adamp87/MCTS**: Monte Carlo Tree Search framework applicable to puzzles.
- **vagnervjs/8-puzzle-js**: JavaScript solver for the 8-puzzle using search algorithms.
- **NhanPhamThanh-IT/AI-Search-Problem**: Pygame-based Rush Hour puzzle solver with AI search.
- Stack Overflow threads discuss "Face-up" solitaire algorithms, Mahjong solitaire optimization (speed-ups needed), and DFS for 8-puzzle.

## Broader AI and Game Development Resources
- Medium and Dev.to articles cover generative AI for game prototyping, DRL (Deep Reinforcement Learning) disruption in gaming, test automation challenges/benefits, and curated game datasets (leomaurodesenv/game-datasets).

## Summary
These resources collectively illustrate a range of algorithmic techniques—backtracking, A*/IDA*, computer vision, and search—for solving solitaire and logic puzzles. Solubility rates are often high (e.g., ~98% for Shenzhen solitaire), with performance varying by method and hardware. Many serve as educational examples or foundations for AI/game AI development. Vision-based automation and optimal pathfinding remain active areas.

## References
All URLs from the original query are cited inline or via the listed repositories (e.g., https://github.com/mayhewsw/SolitaireSolver, https://stackoverflow.com/questions/4845737/face-up-solitaire-algorithm, etc.).