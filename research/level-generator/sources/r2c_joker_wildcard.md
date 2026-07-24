---
title: Research Notes
date: 2026-07-24 16:35
query: "solitaire wildcard joker card matching puzzle mechanic match puzzle wildcard booster level design solvability combo chain auto match joker"
type: tech
sources: 22
model: grok-4-1-fast
generated_by: grok-search
---
**Open-Source Solitaire, Puzzle, Card Games, and Balatro Mod Projects: Key Information Compilation**

**Table of Contents**

- [Solitaire Cipher (Ruby Quiz #1)](https://github.com/mathie/solitaire_cipher)
- [PySolFC Main Repository](https://github.com/shlomif/PySolFC)
- [PySolFC 3.0? Issue #296](https://github.com/shlomif/PySolFC/issues/296)
- [awesome-balatro](https://github.com/jie65535/awesome-balatro)
- [NDP-Township-Game](https://github.com/mtgsoftworks/NDP-Township-Game)
- [game-a-day-games](https://github.com/potnoodledev/game-a-day-games)
- [SERAP-KEREM Profile (Match-3 Projects)](https://github.com/SERAP-KEREM)
- [Where to suggest new games for Pysol](https://sourceforge.net/p/pysolfc/discussion/503708/thread/7fe11e76c9/)
- [PySolFC-Cardsets](https://github.com/shlomif/PySolFC-Cardsets)
- [Cardset Customization - PySolFC](https://pysolfc.sourceforge.io/doc/cardset_customization.html)
- [PySolFC Solitaire Home Page](https://pysolfc.sourceforge.io/)
- Summary and Additional Sources

### Solitaire Cipher Encoder and Decoder (Ruby Quiz #1)
**URL:** https://github.com/mathie/solitaire_cipher

**Main topic and thesis:** Implementation of Bruce Schneier’s Solitaire cipher (from *Cryptonomicon*) in Ruby as Ruby Quiz #1.

**Key points and arguments:** Provides encoder/decoder using a standard deck + two jokers. Details keystream generation via joker moves, triple cuts, and count cuts. Supports encryption/decryption with examples (e.g., “Code in Ruby, live longer!” → “GLNCQ MJAFF FVOMB JIYCB”).

**Important data, statistics, quotes:** Unkeyed deck first 10 outputs: D W J (skip) X H Y R F D G. MIT license; ~25 commits.

**Conclusions:** Simple Ruby script for hand-cipher simulation; extensible for keying.

### PySolFC
**URL:** https://github.com/shlomif/PySolFC

**Main topic and thesis:** Comprehensive open-source portable collection of >1,200 solitaire/patience games in Python (fork of original PySol).

**Key points and arguments:** Supports French, Tarock, Ganjifa, Hanafuda, Mahjongg, matching, puzzle, and Ishido games. Features modern UI (TTK), sounds, solvers (Freecell/Black Hole), Android/Kivy support, statistics, hints, and plugins. Call for contributors noted.

**Important data, statistics, quotes:** 556 stars, 118 forks; requires Python 3.7+ + Tkinter; v3.6.1 (July 2026) includes Python 3.14 improvements.

**Conclusions:** Highly extensible solitaire platform with active development and broad game support.

### PySolFC 3.0? Issue #296
**URL:** https://github.com/shlomif/PySolFC/issues/296

**Main topic and thesis:** Brief question about PySolFC versioning (minimal content).

**Key points and arguments:** Labeled as a “question” with no substantive discussion.

**Important data, statistics, quotes:** None.

**Conclusions:** Placeholder issue; development focuses on major releases like 3.0+.

### awesome-balatro
**URL:** https://github.com/jie65535/awesome-balatro

**Main topic and thesis:** Curated list of Balatro mods, tools, and mod loaders.

**Key points and arguments:** Categorized lists: Tools (calculators, seed searchers like Immolate), mod loaders (Steamodded, Lovely, Balamod), and hundreds of mods (jokers, decks, challenges, API extensions).

**Important data, statistics, quotes:** 148 commits; extensive categories for jokers, decks, vouchers, etc.

**Conclusions:** Central hub for Balatro modding ecosystem.

### NDP-Township-Game
**URL:** https://github.com/mtgsoftworks/NDP-Township-Game

**Main topic and thesis:** C# Windows Forms match-3 puzzle game on 8x8 grid with joker tiles.

**Key points and arguments:** Match ≥3 same-color tiles; special jokers (rocket, helicopter, bomb, rainbow). Features scoring, high scores, pause, cascading.

**Important data, statistics, quotes:** OOP design with Tile inheritance; supports Windows 7+.

**Conclusions:** Educational match-3 implementation with strategic depth via jokers.

### game-a-day-games
**URL:** https://github.com/potnoodledev/game-a-day-games

**Main topic and thesis:** Daily AI-generated GameMaker projects from Reddit community votes.

**Key points and arguments:** 30+ short games (idle clicker, 2048 variant, Balatro-style match-3 “Gem Forge”, roguelikes, city builders). Includes devlogs on mechanics.

**Important data, statistics, quotes:** Games from Feb–Mar 2026; procedural generation emphasis.

**Conclusions:** Showcase of rapid prototyping and variety in small-scope games.

### SERAP-KEREM Profile (Match-3 Projects)
**URL:** https://github.com/SERAP-KEREM

**Main topic and thesis:** Unity/C# game developer portfolio focused on puzzle and match-3 titles.

**Key points and arguments:** Projects include ColorBlockJam, Thread Roller, Tiny Merge, Color Chains (match-3/puzzle mechanics with DOTween, pooling, shaders).

**Important data, statistics, quotes:** 40 followers; multiple App Store releases.

**Conclusions:** Professional collection of polished mobile/desktop puzzle games.

### Where to suggest new games for Pysol
**URL:** https://sourceforge.net/p/pysolfc/discussion/503708/thread/7fe11e76c9/

**Main topic and thesis:** Community discussion on adding games (e.g., Ricochet, Clear the Dungeon, Grid Cannon) and cardset customization.

**Key points and arguments:** Suggestions via GitHub issues; licensing concerns (CC-BY-NC-ND incompatible with GPL); joker deck config updates (version 7, subtype 1); Clear the Dungeon added in v3.0.

**Important data, statistics, quotes:** Thread spans 2023–2025; detailed config.txt examples provided.

**Conclusions:** Active feedback loop drives PySolFC expansions and cardset support.

### PySolFC-Cardsets
**URL:** https://github.com/shlomif/PySolFC-Cardsets

**Main topic and thesis:** Repository of hundreds of cardsets for PySolFC (French, Mahjongg, Tarock, etc.).

**Key points and arguments:** Organized folders with images and config files; supports custom styles and origins.

**Important data, statistics, quotes:** 56 commits; v3.0+ releases tied to PySolFC.

**Conclusions:** Essential companion for visual customization.

### Cardset Customization - PySolFC
**URL:** https://pysolfc.sourceforge.io/doc/cardset_customization.html

**Main topic and thesis:** Tutorial for creating/editing cardsets.

**Key points and arguments:** Requires config.txt, card images, backs, copyright; details version numbers, types (1–12), styles, origins, subtypes (e.g., jokers = subtype 1).

**Important data, statistics, quotes:** Template provided; supports PNG/GIF/etc.

**Conclusions:** Enables user-generated content integration.

### PySolFC Solitaire Home Page
**URL:** https://pysolfc.sourceforge.io/

**Main topic and thesis:** Official site for PySolFC with downloads, news, and game count.

**Key points and arguments:** >1,200 games; releases up to v3.6.1 (2026); features accessibility, new game types, cardset manager.

**Important data, statistics, quotes:** 20+ new games in recent releases; Flathub availability.

**Conclusions:** Mature, actively maintained solitaire suite.

**Summary**  
These sources collectively document a vibrant ecosystem of open-source card/puzzle games centered on PySolFC (extensible solitaire platform) alongside Balatro modding tools, match-3 prototypes, and cipher implementations. Key themes include community-driven additions, customization (especially cardsets/jokers), licensing compatibility, and rapid prototyping. PySolFC stands out for scale (>1,200 games) and ongoing releases.

**All URLs Cited**  
- https://github.com/mathie/solitaire_cipher  
- https://github.com/shlomif/PySolFC  
- https://github.com/shlomif/PySolFC/issues/296  
- https://github.com/jie65535/awesome-balatro  
- https://github.com/mtgsoftworks/NDP-Township-Game  
- https://github.com/potnoodledev/game-a-day-games  
- https://github.com/SERAP-KEREM  
- https://sourceforge.net/p/pysolfc/discussion/503708/thread/7fe11e76c9/  
- https://github.com/shlomif/PySolFC-Cardsets  
- https://pysolfc.sourceforge.io/doc/cardset_customization.html  
- https://pysolfc.sourceforge.io/  
(Additional listed sources follow similar patterns in the ecosystem.)