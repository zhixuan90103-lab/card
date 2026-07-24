---
title: Research Notes
date: 2026-07-24 16:42
query: "joker tile power-up match puzzle level solvability booster wildcard tile consumes pair replacement level design"
type: tech
sources: 12
model: grok-4-1-fast
generated_by: grok-search
---
**Compilation of Game Development Resources: Match-3 Games, Word Puzzles, Therapy Applications, and Related Projects**

## Table of Contents
- [NDP-Township-Game (mtgsoftworks)](#ndp-township-game-mtgsoftworks)
- [awesome-stars (SagXD)](#awesome-stars-sagxd)
- [game-a-day-games (potnoodledev)](#game-a-day-games-potnoodledev)
- [Building a Scrabble-like Word Puzzle Generator](#building-a-scrabble-like-word-puzzle-generator)
- [Ranking All 51 Clubhouse Games for Nintendo Switch](#ranking-all-51-clubhouse-games-for-nintendo-switch)
- [Aphasia Therapy Can Be Fun — Games for Speech Therapy](#aphasia-therapy-can-be-fun-games-for-speech-therapy)
- [MatchThreeGame (dgkanatsios)](#matchthreegame-dgkanatsios)
- [Game-Simulation-Match-3-Sample (Unity Technologies)](#game-simulation-match-3-sample-unity-technologies)
- [Match3-algorithm-TS-Cocos-creator (AlexKutepov)](#match3-algorithm-ts-cocos-creator-alexkutepov)
- [Match3-game-with-RL (maomao0819)](#match3-game-with-rl-maomao0819)
- [Flutter Crush: How to build a Match-3 game](#flutter-crush-how-to-build-a-match-3-game)
- [Creating a 'Match 3' game in Pygame](#creating-a-match-3-game-in-pygame)
- [Summary](#summary)
- [Sources](#sources)

## NDP-Township-Game (mtgsoftworks)
**Main topic and thesis**: A Windows desktop match-3 puzzle game built in C# with Windows Forms, featuring an 8x8 grid, special joker tiles, scoring, and persistence.[[1]](https://github.com/mtgsoftworks/NDP-Township-Game)

**Key points and arguments**: Implements core match-3 mechanics (align 3+ same-color tiles), cascading falls, four joker types (Rocket, Helicopter, Bomb, Rainbow) with unique effects, timed gameplay, high-score tracking (top 5 persisted to file), pause/resume, and OOP design with abstract Tile base class and inheritance/polymorphism for jokers. Supports mouse/keyboard input.

**Important data, statistics, quotes**: "10 points per match"; system requirements include Windows 7+, .NET 4.7.2+, 512 MB RAM; high scores saved locally.[[1]](https://github.com/mtgsoftworks/NDP-Township-Game)

**Conclusions**: Demonstrates practical OOP implementation of a feature-rich match-3 game suitable for desktop play, with emphasis on strategic depth via special tiles and persistence.

## awesome-stars (SagXD)
**Main topic and thesis**: A personal "Awesome List" repository tracking starred GitHub repositories across topics.

**Key points and arguments**: Minimal README focused on curation of starred repos; includes topics like awesome, awesome-list, awesome-stars, starred.

**Important data, statistics, quotes**: 29 stars, 1,036 commits noted in metadata.

**Conclusions**: Serves as a lightweight personal curation tool rather than a detailed project.

## game-a-day-games (potnoodledev)
**Main topic and thesis**: Collection of 30+ GameMaker projects from a daily AI-generated game jam on Reddit (r/game_a_day_dev), one game per day.

**Key points and arguments**: Each day features a complete HTML5-targeted GameMaker project based on community votes. Examples include match-3 variants (Dungeon Merge, Gem Forge), word games (Word Chain with 97k-word dictionary), physics puzzles, city builders, and roguelikes. Detailed devlogs cover iterations, mechanics, and token usage.

**Important data, statistics, quotes**: Games span Feb–Mar 2026; Word Chain uses ds_map for O(1) lookups, chain multipliers (2x at 3-chain); many use procedural generation and zero sprites.[[2]](https://github.com/potnoodledev/game-a-day-games)

**Conclusions**: Showcases rapid prototyping of diverse game mechanics, including multiple match-3 and word-puzzle entries, via AI-assisted daily development.

## Building a Scrabble-like Word Puzzle Generator
**Main topic and thesis**: Step-by-step Python implementation of a Scrabble-style tile generator, word validator, and scorer using letter distributions, dictionaries, and combinatorial checks.[[3]](https://dev.to/amro_7da41d53b6e597b5aa38/building-a-scrabble-like-word-puzzle-generator-from-concept-to-code-2kao)

**Key points and arguments**: Covers tile bag generation from frequency-based distribution, `can_form_word` with blank-tile support, scoring by letter values, and `find_possible_words` against a dictionary. Includes pseudocode, full code, and enhancements (memoization, Trie, GUI, multiplayer).

**Important data, statistics, quotes**: Example distribution: A=9 tiles/1 pt, Z=1 tile/10 pts; generates 7 tiles by default.

**Conclusions**: Provides a reusable foundation for word-puzzle mechanics that can integrate with games or apps.

## Ranking All 51 Clubhouse Games for Nintendo Switch
**Main topic and thesis**: Subjective ranking of all 51 games in *Clubhouse Games: 51 Worldwide Classics*, evaluating quality, digital implementation, AI, and playability.[[4]](https://medium.com/@dch3315/ranking-all-51-clubhouse-games-for-nintendo-switch-fc51106ff660)

**Key points and arguments**: Ranks from worst (War, Takoyaki, Pig’s Tail — pure RNG) to better entries; critiques AI consistency, physics, depth, and digital adaptations of classics (poker, solitaire, board games). Praises tutorials and global variety but notes uneven execution.

**Important data, statistics, quotes**: "51 Worldwide Classics"; author mastered all but one; detailed critiques of each game.

**Conclusions**: Highlights strengths of digital board/card game collections while underscoring variability in translation quality and AI design.

## Aphasia Therapy Can Be Fun — Games for Speech Therapy
**Main topic and thesis**: Using adapted board games in speech therapy to improve engagement, socialization, and quality of life for people with aphasia.[[5]](https://medium.com/tlc-speech-therapy/aphasia-therapy-can-be-fun-games-for-speech-therapy-ca59ad6db8d5)

**Key points and arguments**: Aphasia (post-stroke/brain injury) affects speaking, reading, writing, and comprehension. Games promote fun, family involvement, and LPAA (Lifestyle Participation Approach). Details adaptations for Uno, Pictionary, Qwirkle, Blank Slate, and Taboo (card holders, timers, visual supports, supported communication).

**Important data, statistics, quotes**: Quote: “Community activities of people with aphasia (PWA) were very limited, and depression was highly associated with decreased community integration and quality of life (QOL).” Games support skills like turn-taking, word-finding, and categorization.

**Conclusions**: Board games are accessible, adaptable tools that enhance therapy outcomes and social participation beyond clinical settings.

## MatchThreeGame (dgkanatsios)
**Main topic and thesis**: Open-source Unity match-3 game (Candy Crush/Bejeweled style) with tutorial and commented source.[[6]](https://github.com/dgkanatsios/matchthreegame)

**Key points and arguments**: Implements classic swapping, matching, gravity, and special effects; uses open assets for graphics/sounds. Links to a detailed 2015 blog tutorial.

**Important data, statistics, quotes**: 617 stars, 192 forks.

**Conclusions**: Popular educational resource demonstrating Unity implementation of match-3 mechanics.

## Game-Simulation-Match-3-Sample (Unity Technologies)
**Main topic and thesis**: Unity sample project demonstrating Game Simulation for automated playtesting and balancing of a match-3 game.[[7]](https://github.com/Unity-Technologies/Game-Simulation-Match-3-Sample)

**Key points and arguments**: Includes bot (`Match3Bot`), configurable levels (gem types, board size, goals, moves, target score), and integration with cloud simulations for metrics (win rate, moves to win). Workshop exercises cover parameter sweeps and result analysis.

**Important data, statistics, quotes**: 5 predefined levels (A–E); supports grid search on parameters like move amount and target score.

**Conclusions**: Illustrates scalable, data-driven game balancing using simulation for match-3 titles.

## Match3-algorithm-TS-Cocos-creator (AlexKutepov)
**Main topic and thesis**: Modular TypeScript match-3 engine for Cocos Creator 3.8.8 featuring optimized detection, gravity, bonuses, and configurability.[[8]](https://github.com/AlexKutepov/Match3-algorithm-TS-Cocos-creator)

**Key points and arguments**: Single-pass O(n²) match detection, vertical/diagonal gravity, cascading animations, auto-shuffle, object pooling, state machine, and bonuses (line clears, rainbow, bomb). Supports custom boards, blocked/void cells, and event-driven architecture.

**Important data, statistics, quotes**: Board defaults: 8×8, 20 moves, 1000 target score; animation timings configurable.

**Conclusions**: Production-ready, extensible engine emphasizing performance and clean architecture for match-3 games.

## Match3-game-with-RL (maomao0819)
**Main topic and thesis**: Exploration of deep reinforcement learning (DQN, DDQN, PPO, A3C) on a customizable match-3 environment packaged as Gym, comparing against random/greedy baselines.[[9]](https://github.com/maomao0819/Match3-game-with-RL)

**Key points and arguments**: 6×6/8×8 boards, 4–5 shapes, scoring by match size; legal vs. normal actions; CNN models; experiments track score over time/steps. Results show models underperform baselines due to state space size and luck factor.

**Important data, statistics, quotes**: “All of the deep reinforcement learning models don’t reach our expectation”; references prior work on MCTS/DNN for match-3.

**Conclusions**: Highlights challenges of applying DRL to high-randomness match-3 games; suggests stronger models, restricted actions, and tuned configurations for future work.

## Flutter Crush: How to build a Match-3 game
**Main topic and thesis**: Detailed Flutter implementation of a Candy Crush-style match-3 game using BLoC architecture, custom animation sequencing, and level definitions.[[10]](https://medium.com/flutter-community/flutter-crush-debee5f389c3)

**Key points and arguments**: Covers chains/combos, special bombs (TNT, wrapped, rocket), objectives, move limits, tile shuffling without initial matches, swap validation, and complex falling/refill animation timing. Uses Provider for state and JSON for levels.

**Important data, statistics, quotes**: Built in one week as proof-of-concept; full source on GitHub.

**Conclusions**: Practical guide to Flutter game development, emphasizing smooth animations and modular state management for match-3 titles.

## Creating a 'Match 3' game in Pygame
**Main topic and thesis**: Implementation of a wrapping, row/column-shifting match-3 component in Pygame inspired by games like *You Must Build a Boat*, with detailed architecture separating frontend, backend, and gem logic.[[11]](https://johnscolaro.xyz/blog/pygame-match-3)

**Key points and arguments**: Draggable rows/columns with wrapping, combo handling during interaction, particle explosions, hypothetical match preview, and tweening via RowColTransforms. Backend handles pure logic (matches, replacements); frontend manages rendering/states (idle/falling/exploding). ~1500 lines core + tests; runs >200 fps.

**Important data, statistics, quotes**: “the devil lies in the details”; wrapping requires rendering gems multiple times in idle state.

**Conclusions**: Demonstrates robust, testable architecture for non-traditional match-3 mechanics in a lightweight Python environment.

## Summary
These sources collectively cover practical implementations, architectural patterns, balancing techniques, and therapeutic applications of match-3 and word-puzzle games. Common themes include OOP/modular design, animation handling, AI/simulation for testing, and accessibility adaptations. They provide reusable codebases, tutorials, and insights for developers building similar experiences across Unity, Flutter, Cocos Creator, Pygame, and GameMaker.

## Sources
- https://github.com/mtgsoftworks/NDP-Township-Game
- https://github.com/SagXD/awesome-stars
- https://github.com/potnoodledev/game-a-day-games
- https://dev.to/amro_7da41d53b6e597b5aa38/building-a-scrabble-like-word-puzzle-generator-from-concept-to-code-2kao
- https://medium.com/@dch3315/ranking-all-51-clubhouse-games-for-nintendo-switch-fc51106ff660
- https://medium.com/tlc-speech-therapy/aphasia-therapy-can-be-fun-games-for-speech-therapy-ca59ad6db8d5
- https://github.com/dgkanatsios/matchthreegame
- https://github.com/Unity-Technologies/Game-Simulation-Match-3-Sample
- https://github.com/AlexKutepov/Match3-algorithm-TS-Cocos-creator
- https://github.com/maomao0819/Match3-game-with-RL
- https://medium.com/flutter-community/flutter-crush-debee5f389c3
- https://johnscolaro.xyz/blog/pygame-match-3