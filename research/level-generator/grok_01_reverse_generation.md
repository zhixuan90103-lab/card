---
title: Research Notes
date: 2026-07-24 16:15
query: "Mahjong Solitaire solvable generator reverse generation"
type: tech
sources: 21
model: grok-4-1-fast
generated_by: grok-search
---
# Mahjong Solitaire Algorithms, Solvers, and Puzzle Generation

## Table of Contents
- [acvrp-lab/mahjong-solitaire-algorithm](#acvrp-labmahjong-solitaire-algorithm)
- [hardik-vala/mahjong-solitaire (Board.java)](#hardik-valamahjong-solitaire-boardjava)
- [Stack Overflow: Mahjong Solitaire Tile Arrangement](#stackoverflow-mahjong-solitaire-arrange-tiles-to-ensure-at-least-one-path-to-victory-regard)
- [Mahjong Solitaire Online](#mahjongsolitairegithubio)
- [caioross/FatimaGames](#caiorossfatimagames)
- [GitHub Topics: mahjong (Rust)](#github-topics-mahjonglrust)
- [Show HN: Mahjong Browser Game](#newsycombinatorcomitemid25246179)
- [Steam Discussion: Solitaire Minigame Solvability](#steamcommunitycomapp504210discussions0348292787747304983)
- [CS106B Tile Matching Solver](#webstanfordeduclassarchivecscs106bcs106b1216assignments4-backtrackingtilematch)
- [Solving Edge-Match Puzzles](#wwwrightocom201012solving-edge-match-puzzles-with-arc-andhtml)
- [Pattern Puzzles](#wwwrobspuzzlepagecompatternhtm)
- [Chapter 12 - Sliding-Tile Solver](#inventwithpythoncomrecursionchapter12html)
- [Procedural Level Generation via Program Inversion](#ceur-wsorgvol-4090short4pdf)
- [Sliding-Block Puzzle and Permutation Inversions](#jonathan-kuomediumcomdata-structures-at-play-sliding-block-puzzle-and-permutation-inversions-c2e1a5494d52)
- [Reddit: Designing Puzzle Game Levels](#redditcomrgamedesigncommentskck042how_people_usually_design_lots_of_levels_for_a)
- [cchaiyatad/mahjong-solitaire-solver](#cchaiyatadmahjong-solitaire-solver)
- [hardik-vala/mahjong-solitaire](#hardik-valamahjong-solitaire)
- [jakubmatyszewski/mahjong](#jakubmatyszewskimahjong)
- [ffalt/mah](#ffaltmah)
- [Mahjong Solitaire Solving Algorithm Notes](#elonenkifi codemisc-notesno-alg-mahj-solit)
- [How I Created a Mahjong Solitaire Game](#vocalmediagam ershow-i-created-a-mahjong-solitaire-game)
- [Summary](#summary)
- [All Cited URLs](#all-cited-urls)

## acvrp-lab/mahjong-solitaire-algorithm
**Main topic and thesis**: Engine-independent C++ game logic for Mahjong Solitaire, focusing on a shuffle function that generates random yet solvable boards using depth-first search (DFS).[[1]](https://github.com/acvrp-lab/mahjong-solitaire-algorithm)

**Key points and arguments**: 
- Shuffle must be random while ensuring at least one solution exists without further shuffles.
- DFS approach: Start with current board as root; list exposed tiles, shuffle array, detach pairs recursively; backtrack on dead ends (one exposed tile left).

**Important data, statistics, quotes**: "there're 2 conditions for a shuffle function: 1. arrange the board as random as you can 2. make it solvable without further shuffle if there's one solution." Uses simulator for testing.

**Conclusions**: Provides a practical DFS-based method for generating guaranteed-solvable initial layouts in C++.

## hardik-vala/mahjong-solitaire (Board.java)
**Main topic and thesis**: Java implementation of the game board logic for Mahjong Solitaire (limited details extracted due to file-specific access).

**Key points and arguments**: Focuses on board representation and tile management.

**Important data, statistics, quotes**: N/A (minimal content retrieved).

**Conclusions**: Part of a larger Java-based Mahjong Solitaire project.

## Stack Overflow: Mahjong Solitaire Arrange Tiles to Ensure at Least One Path to Victory
**Main topic and thesis**: Methods to generate tile layouts guaranteeing at least one winning path, despite player errors potentially blocking solutions.[[2]](https://stackoverflow.com/questions/159547/mahjong-solitaire-arrange-tiles-to-ensure-at-least-one-path-to-victory-regard)

**Key points and arguments**: 
- Preferred approach: Generate a valid solution first (forward or reverse play), then build the board around it.
- Reverse play: Lay out tiles pair-by-pair in reverse order from a solved state.
- Forward solving with backtracking: Remove pairs, use stacks or DAG traversal on board states; retry on dead ends.
- Hybrid strategies and heuristics discussed; references a 2007 BSc paper with pseudocode.

**Important data, statistics, quotes**: "Play the game in reverse." "Solve the board (forward, not backward) with unmarked tiles." "I have found I usually don't hit dead ends, and have so far have a max retry count of 3."

**Conclusions**: Reverse generation or forward backtracking reliably produces solvable puzzles; complete-information solvers exist but random placement does not guarantee solvability.

## Mahjong Solitaire Online
**Main topic and thesis**: Free, ad-free online playable Mahjong Solitaire game.

**Key points and arguments**: Simple browser-based implementation.

**Important data, statistics, quotes**: N/A (loading screen only).

**Conclusions**: Demonstrates accessible web implementation of the game.

## caioross/FatimaGames
**Main topic and thesis**: Collection of games including Mahjong Solitaire implementations (details limited from overview).

**Key points and arguments**: Repository for multiple game projects.

**Important data, statistics, quotes**: N/A.

**Conclusions**: Contributes to open-source game collections featuring Mahjong variants.

## GitHub Topics: mahjong (Rust)
**Main topic and thesis**: Rust-language projects and libraries related to Mahjong (including solitaire variants).

**Key points and arguments**: Community-curated list of Rust implementations.

**Important data, statistics, quotes**: N/A.

**Conclusions**: Highlights Rust ecosystem for Mahjong game development.

## Show HN: I Made a Mahjong Browser Game
**Main topic and thesis**: Announcement and discussion of a new browser-based Mahjong game on Hacker News.

**Key points and arguments**: Focus on web tech implementation and player feedback.

**Important data, statistics, quotes**: N/A.

**Conclusions**: Example of modern web Mahjong development and community interest.

## Steam Discussion: Is the Solitaire Minigame 100% Solve-able?
**Main topic and thesis**: Player discussion on solvability of a specific game's Mahjong Solitaire minigame.

**Key points and arguments**: Debates whether layouts are always solvable or require specific generation methods.

**Important data, statistics, quotes**: N/A.

**Conclusions**: Reinforces importance of solvable layout generation in commercial games.

## CS106B Tile Matching - The Pattern Puzzle Solver
**Main topic and thesis**: Stanford assignment teaching recursive backtracking to solve edge-matching tile puzzles (analogous to Mahjong tile constraints).[[3]](https://web.stanford.edu/class/archive/cs/cs106b/cs106b.1216/assignments/4-backtracking/tilematch)

**Key points and arguments**: 
- 3x3 grids with rotatable tiles having matching edges (e.g., bottle tops/bottoms or animal parts).
- Search space: 9! × 4^9 ≈ 95 billion positions; backtracking solves efficiently.
- Implementation: Tile class with orientation/sides; recursive solver function.

**Important data, statistics, quotes**: "your program will be able to completely solve these puzzles in mere milliseconds."

**Conclusions**: Backtracking is effective for constraint-satisfaction tile puzzles; provides educational framework for similar solvers.

## Solving Edge-Match Puzzles with Arc and Backtracking
**Main topic and thesis**: Techniques using arc consistency and backtracking for edge-matching puzzles.

**Key points and arguments**: Optimizations for constraint propagation in puzzle solving.

**Important data, statistics, quotes**: N/A.

**Conclusions**: Enhances efficiency of backtracking solvers for pattern-matching games.

## Pattern Puzzles
**Main topic and thesis**: Overview of various pattern and edge-matching puzzles.

**Key points and arguments**: Historical and mechanical descriptions of tile-based puzzles.

**Important data, statistics, quotes**: N/A.

**Conclusions**: Context for Mahjong Solitaire as a type of matching puzzle.

## Chapter 12 - Sliding-Tile Solver
**Main topic and thesis**: Recursive solver for sliding-tile puzzles (related permutation and search problems).

**Key points and arguments**: Backtracking and recursion techniques.

**Important data, statistics, quotes**: N/A.

**Conclusions**: Applicable principles to Mahjong layout and solvability.

## Procedural Level Generation via Program Inversion
**Main topic and thesis**: Academic paper on generating puzzle levels by inverting solvers/programs.

**Key points and arguments**: Uses program inversion for guaranteed-solvable procedural content.

**Important data, statistics, quotes**: N/A.

**Conclusions**: Advanced method for puzzle level design.

## Sliding-Block Puzzle and Permutation Inversions
**Main topic and thesis**: Data structures and inversion counting for analyzing sliding-block solvability.

**Key points and arguments**: Mathematical analysis of puzzle states.

**Important data, statistics, quotes**: N/A.

**Conclusions**: Insights into permutation-based puzzle guarantees.

## Reddit: How People Usually Design Lots of Levels for a Puzzle Game?
**Main topic and thesis**: Community discussion on procedural vs. manual level design for puzzles.

**Key points and arguments**: Strategies including solvers for validation and generation.

**Important data, statistics, quotes**: N/A.

**Conclusions**: Solvers are key tools for scalable puzzle level creation.

## cchaiyatad/mahjong-solitaire-solver
**Main topic and thesis**: Go-based REST API solver implementing heuristics (Random, MaxBlock) and strategies from T. Stam's paper on solving Mahjong Solitaire.[[4]](https://github.com/cchaiyatad/mahjong-solitaire-solver)

**Key points and arguments**: 
- Generates solvable boards for layouts like turtle, small-pyramid.
- Supports custom layouts via XML; returns board + solution steps.
- API endpoints for layouts and solving with parameters.

**Important data, statistics, quotes**: "The purpose of this work is to generate a solvable mahjong solitaire board and solve it by implementing from T. Stam's paper."

**Conclusions**: Practical, extensible solver with multiple heuristics for board generation and solving.

## hardik-vala/mahjong-solitaire
**Main topic and thesis**: Full Java implementation of Mahjong Solitaire game.

**Key points and arguments**: Board and game logic classes.

**Important data, statistics, quotes**: N/A.

**Conclusions**: Complete open-source game example.

## jakubmatyszewski/mahjong
**Main topic and thesis**: Another Mahjong (likely solitaire) implementation on GitHub.

**Key points and arguments**: Game project repository.

**Important data, statistics, quotes**: N/A.

**Conclusions**: Contributes to open-source Mahjong variants.

## ffalt/mah
**Main topic and thesis**: Mahjong-related project (details limited).

**Key points and arguments**: Likely a solver or game implementation.

**Important data, statistics, quotes**: N/A.

**Conclusions**: Additional open-source resource.

## Mahjong Solitaire Solving Algorithm - Notes
**Main topic and thesis**: Proof that no deterministic algorithm exists for incomplete-information Mahjong Solitaire due to hidden tile stacks; solvable with complete information.[[5]](https://elonen.iki.fi/code/misc-notes/no-alg-mahj-solit/)

**Key points and arguments**: 
- Elementary counterexample shows guessing is required without peeking.
- References complete-info solvers (C program, 2007 paper).

**Important data, statistics, quotes**: "it is impossible to come up with an algorithm that could *always* solve them." Notes NP nature but verifiable in O(N) with oracle.

**Conclusions**: Distinguishes incomplete vs. complete information variants; practical solvers require full visibility or generation tricks.

## How I Created a Mahjong Solitaire Game
**Main topic and thesis**: Personal account of developing a Mahjong Solitaire game, covering design and implementation choices.

**Key points and arguments**: Practical development insights.

**Important data, statistics, quotes**: N/A.

**Conclusions**: Real-world example of applying algorithmic principles.

## Summary
Sources collectively emphasize two core challenges in Mahjong Solitaire: (1) generating initial layouts guaranteed to have at least one solution (via reverse play, forward DFS/backtracking, or heuristics from academic papers), and (2) solving existing boards (possible only with complete information; backtracking or specialized heuristics otherwise). Common techniques include DFS, DAG traversal of states, arc consistency, and program inversion. Repositories provide practical C++, Java, Go, and Rust implementations, while academic/educational resources (Stanford, papers) highlight backtracking for related tile-matching puzzles. No single deterministic solver works for hidden-information cases, but generation methods ensure playability.

## All Cited URLs
- https://github.com/acvrp-lab/mahjong-solitaire-algorithm
- https://github.com/hardik-vala/mahjong-solitaire/blob/master/src/mahjong/Board.java
- https://stackoverflow.com/questions/159547/mahjong-solitaire-arrange-tiles-to-ensure-at-least-one-path-to-victory-regard
- https://mahjongsolitaire.github.io/
- https://github.com/caioross/FatimaGames
- https://github.com/topics/mahjong?l=rust
- https://news.ycombinator.com/item?id=25246179
- https://steamcommunity.com/app/504210/discussions/0/348292787747304983/
- https://web.stanford.edu/class/archive/cs/cs106b/cs106b.1216/assignments/4-backtracking/tilematch
- http://www.righto.com/2010/12/solving-edge-match-puzzles-with-arc-and.html
- https://www.robspuzzlepage.com/pattern.htm
- https://inventwithpython.com/recursion/chapter12.html
- https://ceur-ws.org/Vol-4090/short4.pdf
- https://jonathan-kuo.medium.com/data-structures-at-play-sliding-block-puzzle-and-permutation-inversions-c2e1a5494d52
- https://www.reddit.com/r/gamedesign/comments/kck042/how_people_usually_design_lots_of_levels_for_a/
- https://github.com/cchaiyatad/mahjong-solitaire-solver
- https://github.com/hardik-vala/mahjong-solitaire
- https://github.com/jakubmatyszewski/mahjong
- https://github.com/ffalt/mah
- https://elonen.iki.fi/code/misc-notes/no-alg-mahj-solit/
- https://vocal.media/gamers/how-i-created-a-mahjong-solitaire-game