---
title: Research Notes
date: 2026-07-24 16:19
query: "Pyramid Solitaire solver stock waste all cards clear guaranteed solvable deal generator difficulty"
type: tech
sources: 16
model: grok-4-1-fast
generated_by: grok-search
---
**Pyramid Solitaire Solvers, Implementations, and Related Resources: A Compilation of GitHub Projects, Web Tools, and Articles**

## Table of Contents
- [mchung94/pyramid-solver](#mchung94pyramid-solver)
- [Pyramid Solitaire solving web service (mchung94/pyramid-service)](#pyramid-solitaire-solving-web-service-mchung94pyramid-service)
- [mchung94/solitaire-player](#mchung94solitaire-player)
- [IgniparousTempest/javascript-pyramid-solitaire-solver](#igniparoustempestjavascript-pyramid-solitaire-solver)
- [Pyramid Solitaire Solver Web Demo](#pyramid-solitaire-solver-web-demo)
- [Stack Overflow: Making a Pyramids card game](#stackoverflow-making-a-pyramids-card-game)
- [Medium: From Patience to Solitaire](#medium-from-patience-to-solitaire)
- [Other Related Repositories](#other-related-repositories)
- [Summary](#summary)
- [All Cited URLs](#all-cited-urls)

## mchung94/pyramid-solver
**Source:** https://github.com/mchung94/pyramid-solver (and README)

**1. Main topic and thesis**  
A Common Lisp program that finds optimal (shortest) solutions to Pyramid Solitaire board challenges under Microsoft Solitaire Collection rules, or correctly determines when no solution exists.

**2. Key points and arguments**  
- Uses A* search with precomputed pyramid states (only 1,430 valid pyramid configurations) and compact 52-bit state representation for speed and low memory use.  
- Handles stock/waste piles with up to 3 cycles (2 recycles).  
- Tracks visited states and prunes impossible positions (e.g., permanently blocked pyramid cards).  
- Performance on 1,500 random decks: mean ~754 ms; solvable decks faster (~354 ms mean).

**3. Important data, statistics, quotes**  
- “pyramid-solver searches for optimal length solutions to Pyramid Solitaire according to Microsoft Solitaire Collection rules.”  
- Performance table: 998 solvable decks (mean 354 ms), 502 unsolvable (mean 1,550 ms). Slowest unsolvable case: 44 seconds.  
- Card representation: two-letter strings (e.g., “Th”, “2h”).

**4. Conclusions**  
The solver prioritizes correctness, speed, and limited scope (board clearing only). A downloadable Windows executable and full source (SBCL/LispWorks) are provided for practical use in solving stuck games.

## Pyramid Solitaire solving web service (mchung94/pyramid-service)
**Source:** https://github.com/mchung94/pyramid-service

**1. Main topic and thesis**  
A Spring Boot web service exposing the Pyramid Solitaire solver via REST endpoints for board, score, and card challenges, with support for long-running jobs.

**2. Key points and arguments**  
- Endpoints: `/solver/board`, `/solver/score`, `/solver/card`.  
- Uses PostgreSQL + RabbitMQ for job queuing; returns JSON solutions with step-by-step actions.  
- Supports full Microsoft Solitaire Collection challenge types.  
- Deck input format: concatenated two-letter card strings.

**3. Important data, statistics, quotes**  
- Online demo: https://secondthorn.com/pyramid-solitaire/solver.  
- Example JSON output includes score, boardCleared flag, and numbered steps (e.g., “Remove 4s and 9s”, “Draw”, “Recycle”).  
- “I’ve improved the performance about 50x compared to straightforward implementations of Breadth-First Search and A*.”

**4. Conclusions**  
The service makes the solver accessible without local installation, handling computationally intensive solves asynchronously while validating decks and returning detailed solutions.

## mchung94/solitaire-player
**Source:** https://github.com/mchung94/solitaire-player

**1. Main topic and thesis**  
A Java application that solves Pyramid and TriPeaks Solitaire (board/score/card challenges) and can automatically play them in Microsoft Solitaire Collection on Windows 10 via screen interaction.

**2. Key points and arguments**  
- Supports all three challenge types; guarantees fewest steps for board challenges.  
- Automatically scans cards; handles unknown cards in TriPeaks by playing to reveal them.  
- Requires 64-bit JRE; works only with classic theme and 100% scaling.

**3. Important data, statistics, quotes**  
- Pyramid board challenges on 1,500 decks: mean 598 ms (solvable ~296 ms).  
- TriPeaks board challenges much faster (mean 111 ms).  
- “Always finds a solution with the fewest possible number of steps, if there exists any solution at all.”

**4. Conclusions**  
Combines solving power with automation for hands-free play; maintained in “maintenance mode” with ongoing interest in improvements like better OpenCV integration.

## IgniparousTempest/javascript-pyramid-solitaire-solver
**Source:** https://github.com/IgniparousTempest/javascript-pyramid-solitaire-solver

**1. Main topic and thesis**  
A simple brute-force Pyramid Solitaire solver implemented in JavaScript (with minor heuristics).

**2. Key points and arguments**  
- Runs client-side; accepts card strings for pyramid + stock.  
- Notes limitations of brute-force approach on unsolvable or complex deals.  
- Companion web interface for interactive use.

**3. Important data, statistics, quotes**  
- “This is probably quite a poor implementation. Please don’t fault me, I am teaching myself javascript.”  
- Example input deck provided for testing.

**4. Conclusions**  
A lightweight, educational JavaScript implementation suitable for quick browser-based solving, though not optimized for performance on hard instances.

## Pyramid Solitaire Solver Web Demo
**Source:** https://igniparoustempest.github.io/pyramid-solitaire-solver/

**1. Main topic and thesis**  
Interactive web front-end to the JavaScript solver for entering and solving Pyramid Solitaire deals.

**2. Key points and arguments**  
- Users click pyramid positions or paste space-separated cards.  
- Visual feedback (maroon background for duplicates).  
- Mobile-friendly text input option.

**3. Important data, statistics, quotes**  
- “The mysteries of the pyramids solved!”  
- Algorithm: “brute force with some minor heuristic tweaks.”

**4. Conclusions**  
Provides an accessible, no-install demo of the JS solver for experimentation.

## Stack Overflow: Making a Pyramids card game
**Source:** https://stackoverflow.com/questions/25071301/making-a-pyramids-card-game-unsure-of-how-to-setup-the-pyramid

**1. Main topic and thesis**  
Question about implementing the initial pyramid layout and reveal logic for a PHP-based Pyramid Solitaire game.

**2. Key points and arguments**  
- Uses for-loops to place cards in rows; uncertainty about handling uncovering of covered cards.  
- Answer suggests OOP Game class + jQuery for clicks, AJAX for validation, and cover-tracking logic.

**3. Important data, statistics, quotes**  
- Example loop for bottom row of 10 cards.  
- “two cards have to equal 13 and then they remove.”

**4. Conclusions**  
Highlights common challenges in implementing Pyramid Solitaire UI/logic; recommends separating game state (PHP) from interaction (jQuery).

## Medium: From Patience to Solitaire
**Source:** https://medium.com/@playsolitaireseo/from-patience-to-solitaire-how-the-game-changed-its-name-across-the-world-a997324bc771

**1. Main topic and thesis**  
Historical overview of how the solo card game acquired different names (Patience, Réussite, Kabale, Solitaire) as it spread across cultures.

**2. Key points and arguments**  
- Origins in late-1700s Northern Europe; names reflect cultural values (patience/virtue vs. success/outcome vs. solitary play).  
- Microsoft Windows popularization made “Solitaire” the global default.  
- Variants (Pyramid, Spider, etc.) and cognitive benefits discussed.

**3. Important data, statistics, quotes**  
- “Roughly 80% of standard Klondike deals are winnable with optimal play.”  
- “The name you use for the game reflects, in a subtle way, which side of that [luck vs. skill] debate your culture leaned toward.”

**4. Conclusions**  
The game’s enduring appeal transcends names and formats; it remains a mentally engaging, accessible pastime worldwide.

## Other Related Repositories
- **Edwin-ntu/Pyramid-Solitaire**, **alex-berson/pyramid**, **jasonbrianhall/solitaire**, **pharrington/Solitairey**, **jasperangl/Pyramid-Solitaire**, **zzymyn/SolitaireLib**, **Nichathan-Gaming/Nichathans-Solitaire-Pack**: Additional open-source implementations or libraries for Pyramid/TriPeaks Solitaire in various languages (focus on game logic, UI, or solvers).  
- Medium article on popular Solitaire types provides broader context on variants.

## Summary
This compilation centers on open-source tools for solving and playing Pyramid Solitaire, with the mchung94 projects standing out for their optimized A* solvers, performance data, and automation capabilities. Complementary JavaScript and web demos offer accessible alternatives, while historical and implementation-discussion sources provide context on rules, naming, and development challenges. All emphasize correctness, efficiency, and practical usability for a classic pairing-to-13 solitaire variant.

## All Cited URLs
- https://github.com/mchung94/pyramid-solver  
- https://github.com/mchung94/pyramid-solver/blob/master/README.md  
- https://github.com/mchung94/pyramid-service  
- https://github.com/mchung94/solitaire-player  
- https://github.com/IgniparousTempest/javascript-pyramid-solitaire-solver  
- https://igniparoustempest.github.io/pyramid-solitaire-solver/  
- https://stackoverflow.com/questions/25071301/making-a-pyramids-card-game-unsure-of-how-to-setup-the-pyramid  
- https://medium.com/@playsolitaireseo/from-patience-to-solitaire-how-the-game-changed-its-name-across-the-world-a997324bc771  
- https://github.com/Edwin-ntu/Pyramid-Solitaire (and others listed above)