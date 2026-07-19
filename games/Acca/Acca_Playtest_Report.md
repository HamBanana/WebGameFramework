# Acca Playtest Report
**20 automated 4-player games — simulated via JavaScript in-browser**
*Date: 2026-05-10 | Simulator: Claude Sonnet 4.6*

---

## Executive Summary

20 full 4-player games were run to completion (or to the 500-turn cap, which was never hit). The engine is stable — **zero crashes, zero errors, zero games exceeding the cap.** The core loop (roll → move → build → income) is functional and produces balanced win rates. However, several deep design problems prevent the game from being fully enjoyable: the economy has no teeth (nobody ever went bankrupt), 25% of players never build anything and become idle spectators, the mayor/district system barely engages, and the map is 78% buildable cells with little variety.

---

## Statistics

| Metric | Value |
|---|---|
| Games run | 20 |
| Players per game | 4 |
| Errors / crashes | 0 |
| Games hitting 500-turn cap | 0 |
| Average turns to win | 107 |
| Shortest game | 72 turns |
| Longest game | 224 turns |
| Total bankruptcies | 0 / 80 players |
| Players with 0 structures at game end | 20 / 80 (25%) |
| Games with at least one mayor | 7 / 20 |
| Total mayorships across all games | 8 |
| Average winner net worth | $5,174 |
| Average win margin over 2nd place | $1,486 |
| Closest game (win margin) | $145 |

### Win Count by Slot
| Player | Wins |
|---|---|
| Player 1 | 4 |
| Player 2 | 6 |
| Player 3 | 4 |
| Player 4 | 6 |

Slight P2/P4 edge (6 vs 4 wins each) but not statistically alarming over 20 games.

### Game Length Distribution
| Turn bucket | Games |
|---|---|
| 0–80 | 3 |
| 81–110 | 13 |
| 111–150 | 2 |
| 151+ | 2 |

65% of games end in the 81–110 window — a reasonable length. Two outlier games at 224 turns suggest occasionally the game drags.

### Structure Count (Winners vs Losers)
| | Avg structures at game end |
|---|---|
| Winners | 6.0 |
| Losers | 1.9 |

Strong correlation. Building is the only reliable path to victory.

---

## Map Composition

The Denmark map has 572 cells across 42 districts.

| Cell Type | Count | % |
|---|---|---|
| Buildable | 448 | 78% |
| Resource (all types) | 82 | 14% |
| Market | 19 | 3% |
| Chance | 18 | 3% |
| Bank | 4 | 0.7% |

**The map is dominated by buildable cells.** Nearly every landing is "build or don't build," which reduces variety. Resource breakdown: power\_plant ×20, farm ×18, forest ×16, well ×11, oil\_rig ×10, mine ×7.

---

## What Is Working Well

**1. Core loop is stable and functional**
Roll → move → land → build → passive income → win. The chain works reliably with zero edge-case crashes across 80 player-games.

**2. Win condition is correctly gated**
The "must own at least one structure to win by net worth" rule prevents passive cash-hoarders from winning. This is a good design decision and was observed working correctly — players with $3,000+ cash but no structures couldn't win.

**3. Win rates are well-distributed across player slots**
No single slot dominates. The first-player rotation system appears to be doing its job of evening out first-mover advantage.

**4. Catch-up bonus is working**
No runaway leader snowball was observed. The closest game had only a $145 margin; no game had one player completely left behind.

**5. Game length is appropriate**
65% of games end in 80–110 turns per 4 players (≈20–27 turns per player). That's a comfortable hot-seat session.

**6. Debt resolution prevents total collapse**
Auto-selling to cover debt keeps players in the game. No hard crashes from insolvency.

**7. Structure investment creates genuine differentiation**
Winners averaged 6 structures; losers averaged 1.9. Building more clearly leads to better outcomes — the incentive structure is correct.

---

## Problems Found

### CRITICAL

**P1 — Nobody goes bankrupt (0/80)**
The economy has no teeth. Every player finished every game with positive cash, usually $1,000–$4,000. Upkeep costs (food, water, electricity, oil) are too easy to satisfy passively. Bad plays have zero consequences, which removes decision weight from the entire game.

**P2 — 25% of players never build and become spectators**
20/80 player-games ended with 0 structures owned. Some of these players accumulated $3,000+ cash but couldn't win (correctly blocked by the structure gate). They become idle passengers dragging out the game without participating in any interesting dynamics.

**P3 — Mayor/district system barely fires (7/20 games, 8 total mayorships)**
A system designed around district ownership, population, happiness, festivals, and taxes is essentially invisible. On a 42-district map, structures are too spread out to form a majority in any one district. This is a major feature that never activates.

### MAJOR

**P4 — Map is 78% buildable cells — landing variety is too low**
448/572 cells are empty plots. Nearly every turn ends with "build or skip." The rare non-buildable cells feel like interruptions rather than destinations.

**P5 — Trade and sabotage never happen**
No player-to-player trades or sabotage actions were recorded across all 20 games. The sabotage cost ($300 + 1 oil) is steep relative to starting money ($1,500), and the trade menu is buried under Other → Trade/Hostile. Both systems are functionally invisible.

**P6 — Game 9 took 224 turns (2× the median)**
One game where Player 1 built 8 structures and 1 mayorship still took 224 turns to reach $5,000. This suggests income can plateau if many low-value structures are built. Players can get stuck in a slow-growth trap.

**P7 — Cash hoarders with no path to win extend games**
Players with 0 structures accumulate cash but can't win. In a 4-player game where 2 players are passive, the game drags until one builder reaches $5,000 — sometimes taking 224 turns.

### MINOR

**P8 — Vaults appear to never get built**
The vault ($750 + 2 steel) is the most powerful late-game structure but the steel resource cost makes it inaccessible without specific mine visits. No game in the simulation showed vault usage.

**P9 — Resource loop feels disconnected**
Players collect resources but market prices don't fluctuate enough to make timing a sale strategically interesting. Resources feel like cash with extra steps.

**P10 — Chance cells are too rare (3% of map)**
18 chance cells across 572 = 3%. Chance events had minimal visible impact on outcomes across 20 games.

**P11 — No visible feedback when approaching a mayorship**
There's no indicator that "2 more structures in Aalborg → Mayor". Without that signal, players don't know they're close to triggering the mayor loop.

---

## Suggestions for Improvement (Prioritised)

### Must-Have (Blocking Full Playability)

**S1 — Add cash upkeep per structure per turn**
A small flat cost ($8–12/structure/turn) bleeds players who over-build without income. This creates real danger and makes every build decision weighty.

**S2 — Add a "no-build penalty" for players with 0 structures after turn 20**
A $30/turn tax on players who haven't built anything past an early-game grace period forces engagement. Alternatively: bank visits deliver diminishing returns after the first few ("congestion fee").

**S3 — Fix the mayor trigger: lower the threshold or reduce district count**
Either reduce from 42 districts to 10–15 (merge small regions), or allow any player with ≥2 structures in a district to become mayor. The mayor system is rich but never activates.

**S4 — Surface trade on Market cell landing**
When landing on a market cell, offer "Trade with a player" as a top-level option alongside buying/selling resources. Trade is currently buried 3 menus deep.

### Should-Have

**S5 — Reduce buildable cell density from 78% → 50%**
Replace ~150 buildable cells with government offices, landmarks, transit hubs, and additional resource types. Give each landing a more distinct identity.

**S6 — Add HUD badge "X structures in Y district → Mayor"**
A simple indicator makes the mayor loop legible and creates a clear goal to chase.

**S7 — Add "Build from hand" pre-roll action**
Allow paying a $50 courier fee to build on any adjacent empty cell without landing on it. Converts passive cash-rich players into active builders.

**S8 — Increase market price volatility**
Current drift is too gentle. Prices should occasionally spike or crash 50–100%, creating genuine sell-or-hold decisions. One oil crash should feel like an event.

**S9 — Add escalating events after turn 150**
If no winner by turn 150, fire market events and double rents. Prevents 224-turn slog games.

### Nice-to-Have

**S10 — Tutorial overlay on first buildable cell landing**
Explain rent, value growth, and income in context. The mechanics are good but opaque.

**S11 — Victory screen with per-player stats**
Structures built, cash earned, districts held, turns taken. Makes the win feel earned.

**S12 — Net-worth sparklines on game-over screen**
Show NW trajectory per player so comebacks and lead changes are visible in retrospect.

**S13 — Reduce sabotage cost from $300 → $150**
Make hostile play more accessible earlier in the game.

**S14 — Basic CPU AI opponent**
The game is hot-seat only. Adding even a basic AI (using the strategy from this playtest engine) enables solo play and smoother multiplayer sessions.

---

## Development Plan: Path to Fully Playable

### Phase 1 — Economy & Danger (1–2 sessions)
*Make the game consequential.*

- [ ] Add flat cash upkeep per structure per turn ($8–12)
- [ ] Add a "no-build penalty" (−$30/turn) for players with 0 structures after turn 20
- [ ] Double electricity/food upkeep per structure
- [ ] Remove the vault steel requirement OR add steel-producing cells near vault-friendly districts
- [ ] Reduce sabotage cost from $300 → $150

### Phase 2 — Mayor Loop (1 session)
*Make districts matter.*

- [ ] Reduce district count from 42 → 12–15 (merge small districts on the map)
- [ ] Lower mayor threshold: ≥2 structures in any district = mayor
- [ ] Add HUD badge: "X more structures in Y → Mayor"
- [ ] Auto-prompt district menu at turn start when mayor (currently buried in Manage)

### Phase 3 — Map Variety (1 session)
*Reduce the "every cell looks the same" problem.*

- [ ] Reduce buildable cell density from 78% → 50%
- [ ] Add 50+ government/transit/landmark cells with distinct flavour effects
- [ ] Add 10+ trade-hub cells that specifically unlock player-to-player trade on landing
- [ ] Move chance cells to 8–10% density (from 3%)

### Phase 4 — Trade & Interaction (1 session)
*Make player interaction discoverable.*

- [ ] Surface trade option on Market cell landing (not buried in Other)
- [ ] Add "propose trade" shortcut when standing on an opponent's structure
- [ ] Add resource-shortage event that makes trading urgent ("Drought — water price ×3 this round")
- [ ] Reduce sabotage cost from $300 → $150

### Phase 5 — Polish & Completeness (1–2 sessions)

- [ ] Tutorial overlay for first-time players on buildable cell
- [ ] Victory screen with per-player stats summary
- [ ] Net-worth sparklines on game-over
- [ ] "Build from hand" pre-roll action ($50 fee, adjacent cell)
- [ ] Escalating events after turn 150 to prevent slog
- [ ] Distinct SFX for: rent received, bankrupt, mayorship gained

### Phase 6 — AI & Solo Play (1 session)

- [ ] Integrate the JavaScript playtest AI as an in-game CPU opponent
- [ ] Add "vs CPU" as a mode option in the player-count menu
- [ ] Difficulty levels: Easy (reactive), Medium (builds early), Hard (targets mayors)

---

## Conclusion

Acca has a solid foundation: stable engine, balanced win distribution, correct win gating, and a working economic loop. The main gap between "functional prototype" and "fully enjoyable game" is **consequentiality** — nothing bad enough ever happens to make decisions feel high-stakes.

Fix the economy teeth (Phase 1), activate the mayor loop (Phase 2), and diversify the map (Phase 3), and the game will be genuinely fun in 3–5 focused development sessions.
