---
title: Research Notes
date: 2026-07-24 16:21
query: "procedural puzzle level generation automatic difficulty rating playtesting Monte Carlo solver human-like agents"
type: tech
sources: 23
model: grok-4-1-fast
generated_by: grok-search
---
**Procedural Puzzle Generation: Sokoban MCTS, Related Algorithms, and AI-Driven Difficulty Adaptation**

**Table of Contents**

1. [Main Sokoban MCTS Paper and Implementations](#main-sokoban-mcts-paper-and-implementations)
2. [Other Procedural Puzzle Generators](#other-procedural-puzzle-generators)
3. [Related Research Papers](#related-research-papers)
4. [AI/ML Tools and Game Dev Resources](#aiml-tools-and-game-dev-resources)
5. [Summary](#summary)
6. [All Cited URLs](#all-cited-urls)

## Main Sokoban MCTS Paper and Implementations

### Data Driven Sokoban Puzzle Generation with Monte Carlo Tree Search (AAAI AIIDE 2016)

**Main topic and thesis**: Proposes an MCTS-based approach for procedurally generating solvable Sokoban puzzles. Puzzles are created via simulated gameplay with a data-driven evaluation function derived from user studies on perceived difficulty.[[1]](https://ojs.aaai.org/index.php/AIIDE/article/view/12859)

**Key points and arguments**:
- Generates puzzles through simulated play, guaranteeing solvability.
- User study identifies computable features highly correlated with difficulty.
- Combines features into an MCTS evaluation function for anytime generation of varied, challenging puzzles.
- Second user study validates high correlation between generated scores and perceived difficulty.[[2]](https://motion.cs.umn.edu/pub/SokobanMCTS/DataDrivenSokobanMCTS.pdf)

**Important data, statistics, quotes**:
- "Our method generates puzzles through simulated game play, guaranteeing solvability in all generated puzzles."
- "showing a high correlation between increasing puzzle scores and perceived difficulty."
- Supports on-demand generation with controlled difficulty for diverse players.

**Conclusions**: The system is efficient, anytime-capable, and produces a variety of challenging, solvable puzzles. It is the first to combine simulated gameplay and level optimization in a single stochastic tree search for puzzle generation.[[3]](https://motion.cs.umn.edu/r/sokoban-pcg/)

**lkseg/sokoban-level-generator-mcts** (C++ implementation based on the above paper)

**Main topic and thesis**: Enhanced C++ implementation of the MCTS Sokoban generator using raylib for GUI, producing multiple highly evaluated levels quickly (~1s for high results).

**Key points and arguments**:
- Builds on the 2016 paper with many enhancements.
- Adjustable settings in `settings.h` (size, start position, cutoffs).
- GUI for playing generated levels; supports loading/saving.

**Important data, statistics, quotes**: "The level generator manages to produce multiple highly evaluated levels in a short amount of time. Very high results are already being produced at ~1s."

**Conclusions**: Practical, performant tool for real-time Sokoban level generation.

**Related project page**: https://motion.cs.umn.edu/r/sokoban-pcg/ (project site with visuals of generated levels and user study interface).

## Other Procedural Puzzle Generators

### mpewsey/Aycblok
**Main topic and thesis**: Procedural generation of sliding ice block puzzles (push blocks slide until stopped; player pushes them to goals).

**Key points and arguments**: Pipeline-based generation with steps for goals, moves, garbage/obstacles; supports multiple blocks, voids, break/stop blocks; customizable parameters for difficulty.

**Important data, statistics, quotes**: Includes move-by-move reports and JSON/XML persistence.

**Conclusions**: Flexible system for creating interactive sliding puzzles with adjustable challenge.

### Dagobah0/ProceduralSokoban
**Main topic and thesis**: C# template-based procedural Sokoban level generator inspired by Taylor & Parberry (2011).

**Key points and arguments**:
- Places random rotated 3x3 templates, optimizes (removes dead cells/useless rooms/alone walls), places crates/goals/player.
- Exports levels compatible with JSoko; Unity port available.

**Important data, statistics, quotes**: Sources include Parberry's template paper.

**Conclusions**: Simple, template-driven approach with optimization for playable levels; notes areas for improvement (e.g., smarter goal/player placement).

### PanaMour/KakuroAI, Abd-Abdullah83/Sudoku, d0r1h/infinite-path-puzzle
- **KakuroAI** (Unity/C#): RL (ML-Agents) for adaptive difficulty based on player performance; procedural Kakuro generation.
- **Sudoku** (C++/SFML): Backtracking solver + procedural generation with 3 difficulty levels, hints, mistake highlighting.
- **infinite-path-puzzle** (React/TS): Progressive path-connecting puzzles with procedural grid expansion and increasing waypoints.

These demonstrate broader applications of procedural generation and AI for puzzle variety/difficulty control.

## Related Research Papers

### Tree Search vs Optimization Approaches for Map Generation (arXiv 1903.11678)
**Main topic and thesis**: Systematic comparison of tree search (BFS, DFS, GBFS, MCTS) vs optimization (HC, SA, ES, GA) on level generation for Binary, Zelda, and Sokoban problems. Introduces representations (Narrow, Turtle, Wide) to aid tree search.

**Key points and arguments**: Optimization generally outperforms tree search, but MCTS can perform competitively or surprisingly well with good representations.

**Conclusions**: Choice of algorithm and representation matters significantly for PCG performance.[[4]](https://arxiv.org/pdf/1903.11678)

### Procedural Content Generation in Games: A Survey (arXiv 2410.15644v1)
Broad survey on PCG methods, including search-based and data-driven approaches relevant to puzzle generation.

## AI/ML Tools and Game Dev Resources
- **Unity ML-Agents Toolkit**: Framework for training agents with RL; used in KakuroAI for difficulty adaptation. Issues discuss automatic difficulty adjustment via RL and curriculum learning.
- **Other**: Game Dev Digest, Medium articles on AI in game development, and general game AI repos highlight trends in procedural content and adaptive experiences.

## Summary
The core contribution is the 2016 MCTS-based Sokoban generator, which uses simulated play and data-driven difficulty modeling for fast, solvable, varied puzzle creation. Implementations (C++, etc.) make it practical, while related works extend similar ideas to ice blocks, Kakuro, Sudoku, and path puzzles. Comparisons show MCTS can rival optimization methods under suitable representations. RL integration (e.g., ML-Agents) enables dynamic difficulty adjustment. Overall, these resources illustrate effective techniques for automated, player-adaptive puzzle content generation.

## All Cited URLs
- https://github.com/lkseg/sokoban-level-generator-mcts
- https://github.com/mpewsey/Aycblok
- https://github.com/Dagobah0/ProceduralSokoban
- https://github.com/PanaMour/KakuroAI
- https://github.com/Abd-Abdullah83/Sudoku
- https://github.com/d0r1h/infinite-path-puzzle
- https://ojs.aaai.org/index.php/AIIDE/article/view/12859
- https://motion.cs.umn.edu/pub/SokobanMCTS/DataDrivenSokobanMCTS.pdf
- https://arxiv.org/pdf/1903.11678
- https://motion.cs.umn.edu/r/sokoban-pcg/
- (Additional sources as listed in query for completeness)