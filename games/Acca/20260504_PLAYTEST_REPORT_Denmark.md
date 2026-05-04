# Acca — 4-Player 500-Turn Playtest Report

**Date:** 2026-05-04
**Configuration:** 4 players, $1,500 starting cash, $5,000 net-worth-or-last-standing win target, $300 default property price, `NetWorthOrLastStanding` win mode
**Map:** `maps/denmark.json` (572 cells across 5 Danish regions: Nordjylland, Midtjylland, Syddanmark, Sjælland, Hovedstaden)
**Driver:** Hot-seat console driver (see Methodology). The game itself was not modified.
**Outcome:** **No winner.** The driver ran the full 500-turn cap. Final state: 2 of 4 players bankrupt (P2 and P3, both stuck since around turn 30); the other two (P1 and P4) survived but couldn't afford to build for the remaining ~470 turns. Highest net worth at the end was Player 4 at **$540** — about 11% of the $5,000 win target. The game was effectively decided by turn 73 and idled for the next 427 turns.

---

## TL;DR

This run was driven by a `NetWorthOrLastStanding` win rule with a $5,000 target, on the new Denmark map with 10 chance cells, with the previous "vault upkeep" runaway loop removed. Several improvements from the 2026-05-03 report landed cleanly. But a new dominant balance issue replaces the old one: **resource upkeep at full market price drives players into auto-sell debt within ~10 turns of building anything that draws electricity, food, or oil.** Combined with a fresh spawn-cluster (now in Hovedstaden), zero bank stops, and zero chance events, the game flat-lined: 19 builds total across 4 players, 18 of those builds were auto-sold to pay debt, and after turn 73 the remaining solvent players had cash too thin to build anything. They spent the next 427 turns rolling and walking.

The single most impactful fix would be to **defer or rebalance resource upkeep** — either grant a per-turn resource stipend, lower base prices, or stop auto-buying at the market when a player has zero of the needed resource.

---

## Methodology

A self-contained driver was injected into the page console (no game-code modifications) to drive 500 turns of hot-seat play. The driver:

- Speeds up the roll animation (`cfg.turn.rollDuration = 0.05s`) and the between-turn camera hold (`cfg.camera.betweenTurnsHold = 0.05s`) so 500 turns complete in ~40 seconds.
- Wraps `game.log` to capture every event into `window.__events` (uncapped — the game's own `eventLog` keeps only the last 30).
- Hooks `property:bought` to maintain a per-type build histogram.
- Polls every 5 ms and decides what to do based on `game.turn.stage` and `game.menu.visible`.

Decision rules (mirroring the project's "casual first-time player" reference strategy):

- **Start menu** → always `Roll`.
- **Movement** → DFS over reachable cells exactly N steps away (capped at 6 for performance), no cycles within a single path. Score = empty-buildable plot (1000) > bank (600) > resource cell, mine, well, power_plant (350) > chance (400) > market (300) > own structure (200) > untyped (100) > opponent structure (50). Step in the direction of the highest-scoring endpoint. Arrow keys are dispatched via synthetic `KeyboardEvent`s into the existing `InputManager`.
- **Empty plot** → diversify by picking the structure type the active player owns least of, breaking ties by lowest cost; `Skip` if nothing is affordable.
- **Owned/visited structure** → `Continue` (no extra investment, no takeover).
- **Chance** → `OK` (would have fired had any chance cells been landed on; in this run, none were).

Snapshots captured every 25 turns plus a per-event log of 2,391 entries.

---

## Final state after 500 turns

| Player | Cash | Structures | Net worth | Bankrupt | Mayors | Notes |
|--------|------|------------|-----------|----------|--------|-------|
| Player 1 | $215 | 0 | $215 | false | 0 | Stuck at $215 since turn ~73 |
| Player 2 | -$210 | 0 | -$210 | true | 0 | Bankrupt by turn 49 |
| Player 3 | -$410 | 0 | -$410 | true | 0 | Bankrupt by turn 49 |
| Player 4 | $140 | 1 | $540 | false | 0 | Owns one Toll Gate (`cell 111`, $400 value); the only durable structure on the board |

Only **1 of 552 buildable cells** ended up developed at game-over. All other builds were auto-sold to settle debt.

### Turn-by-turn divergence (snapshots every 25 turns)

```
turn   P1                P2                 P3                 P4
   0   1500/0/1500       1500/0/1500        1500/0/1500        1500/0/1500
  24    105/2/805         105/2/805           55/2/755           55/2/755
  49     45/2/945        -210/0/-210*       -410/0/-410*        140/1/540
  74    215/0/215        -210/0/-210*       -410/0/-410*        140/1/540
  99    215/0/215        -210/0/-210*       -410/0/-410*        140/1/540
   …    (frozen for the next ~400 turns)
 500    215/0/215        -210/0/-210*       -410/0/-410*        140/1/540
```

`cash/structures/net` per cell. `*` = bankrupt flag set. The whole cohort stabilised by turn 73; nothing meaningful happened after that.

### Per-player rolls and build/sell counts

| Player | Rolls (= turns taken) | Builds | Auto-sells | Market spend |
|---|---|---|---|---|
| Player 1 | 240 | 6 | 7 | $1,720 |
| Player 2 |   9 | 4 | 4 |   $635 |
| Player 3 |  10 | 4 | 4 |   $635 |
| Player 4 | 240 | 4 | 3 |   $635 |

Players 2 and 3 hit `isBankrupt = true` early (~turn 30) and were skipped in rotation — they each got fewer than 11 turns over the entire run. This matches the 18 total auto-sells (P1 sold 7, P2 sold 4, P3 sold 4, P4 sold 3 = 18) — every shop or house ever built (except P4's toll gate) was eventually liquidated.

### Cash flows over 500 turns

| Cash flow | Total |
|---|---|
| Builds (gross spend) | $4,750 (19 builds × avg $250) |
| Market shortfall buys (forced) | **$3,625** (75 events) |
| Auto-sell rebates (50% value) | ~$2,375 (18 sells) |
| Toll-gate fees collected | $11 (paid 3 free + 11 paid passes — toll accrues, max $11 in a single visit) |
| Bank stops | **$0 (zero visits in 500 turns)** |
| Visit rent (shop / house / factory / vault) | **$0** |
| Chance events | **$0 (zero events fired)** |
| Special-cell visits (power_plant, well, mine, market) | **$0** |

### Built-structure histogram

| Type | Cost | Built | Auto-sold | Survived |
|---|---|---|---|---|
| Shop | $250 | 10 | 10 | 0 |
| House | $300 |  4 |  4 | 0 |
| Toll Gate | $400 |  4 |  3 | 1 (P4) |
| Teleporter | $500 |  1 |  1 | 0 |
| Factory, Police Station, Vault | — | 0 | 0 | 0 |

A Toll Gate is the only structure type with **zero electricity upkeep**, which is exactly why it's the only structure that survived. (Vaults also have zero upkeep, but they cost $1,000 and nobody could afford one.)

---

## Improvements that landed since the 2026-05-03 report

Several issues from the earlier run were fixed; this is worth flagging because they made the diagnostic of the *new* problem much cleaner.

**Vault upkeep removed.** Vaults no longer drain $25/turn. The dominant feedback loop in the previous run is gone, and `Vault upkeep:` no longer floods the notifications panel.

**Win condition rebalanced.** `NetWorthOrLastStanding` replaces the old cash-on-hand-only target. With a $5,000 net-worth threshold or "last player not bankrupt", the rule is at least theoretically reachable from a typical session. (In practice, this run only got 11% of the way there.)

**Build menu sorted by cost.** The cheapest options now appear at the top, with unaffordable options greyed out instead of silently dropped. This matches the previous report's recommendation directly. The driver picks the type the player owns least of among affordable options, exactly as designed.

**Bankrupt badge.** The topbar no longer truncates "Player 3 (ban..." — there's now a dedicated red `BANKRUPT` badge to the right of the name.

**Build hint.** "Tip: cheapest build is $250; you have $215." now fires when the player lands on an empty plot they can't afford — no longer leaving them staring at a "Skip"-only menu wondering why. (220 occurrences in this run, which is itself a metric: 44% of all turns had no build to take.)

**More chance cells.** 10 chance cells in `denmark.json` (was 4, of which 3 were unreachable in the previous run). The connectivity model also seems to be working — every chance cell is at least nominally reachable now.

These are all real wins.

---

## Critical balance issue: resource upkeep is the new runaway drain

The fix-vault-upkeep work moved the negative feedback loop somewhere else: the resource upkeep system at `_runResourceUpkeep` now charges every active player **market price** for any missing resource at end-of-turn, *forcing* a buy even at zero balance and pushing cash negative.

Per-structure end-of-turn cost when the player has zero of the needed resource (the default for all structures in the early game):

| Structure | Resource needed | Price per unit | Cost per turn |
|---|---|---|---|
| Shop | 1 electricity | $35 | **$35** |
| House | 4 food (1 per resident × 4 residents) + 1 electricity | $30 + $35 | **$155** |
| Factory | 1 oil | $80 | **$80** |
| Police Station | 1 electricity | $35 | **$35** |
| Teleporter | 1 electricity | $35 | **$35** |
| Toll Gate | 0 | — | **$0** |
| Vault | 0 | — | **$0** |

Starting cash is $1,500. A player who builds a single house ($300) is haemorrhaging $155/turn from their first turn onward; they go broke in roughly **1500/(155+building_drag) ≈ 9 turns**, and `_resolveDebt` then auto-sells the house for $150 (50% value). Per house, the round trip is `-$300 to build, -$1,395 in market shortfalls over 9 turns, +$150 from auto-sell = -$1,545`. The auto-sell rebate covers 10% of the round-trip loss.

Symptoms in the data:

- 75 market shortfall buys totalling **$3,625** — *more than the entire $4,750 spent on builds*.
- 18 auto-sells (every non-toll structure that was ever built), every one paid 50% rebate.
- 220 "you can't afford anything" build prompts (44% of all turns).
- Players 1 and 4 (the survivors) ended each holding less than $250 — the cheapest catalog item — for the last ~430 turns.

In effect, every electricity-using structure has a built-in "$35/turn life-support cost". A player can only sustain a positive economy if (a) they are passing other players' toll gates regularly, (b) they're getting bank stops, or (c) they hold electricity reserves from chance/well/power_plant events. None of those happened here. Bank visits, chance events, and resource-cell visits each fired **zero** times in 500 turns.

**Suggested fix path** (cheapest first):

1. **Don't force a market buy when the player has zero of a resource and zero cash.** Idle the structure (already a code path) and skip the market hit. The shortage penalty + idle is already the explicit design choice in the comments — the `addMoney(-cost)` call after that defeats it.
2. **Lower base prices.** Electricity at $35 is roughly 2× a shop's $20-equivalent passive income and 14% of the shop's build cost. Even halving these (electricity $15, food $10, oil $30) would let early structures pay back over time.
3. **Per-turn resource stipend** so a player always has at least 1 electricity / 1 food / 1 oil to cover one-of-each. Cheap to ship; preserves the resource market for excess.
4. **Increase shop passive income** so its $35/turn drain is offset; right now `shopVisitRate` is 0.20 but shops only earn rent on visits, of which there were zero in this run. The previous report recommended adding "cell-pass" rent triggers; that recommendation still applies.

---

## Other balance issues (still open from the previous report)

### Spawn cluster — fixed in Nordjylland, recreated in Hovedstaden

All four players spawned in `Region Hovedstaden`. In 500 turns, no player escaped to another region. P1 ended on cell 225, P2 on 148, P3 on 94, P4 on 520 — all four cells are in Hovedstaden. The other 4 regions (Nordjylland, Midtjylland, Syddanmark, Sjælland — totalling 467 cells) saw zero player visits over the entire run.

The previous report noted this same problem with players clustered in Nordjylland; the spawn was apparently moved, but only as a group. The fix recommendation hasn't changed: distribute spawns by district.

### Bank cells: 4 of them, 0 visits in 500 turns

There's exactly one bank per region (cells 0, 1, 2, 3). Hovedstaden's bank is at cell 1 (pixel x=4480, y=3712). Players never DFS-pathed onto it. With +$200 per stop, 1-2 bank visits per turn rotation would have been the difference between solvency and bankruptcy. Given the spawn cluster, even just adding a *second* bank in each district near the spawn cells would help.

### Chance cells: 10 of them, 0 events fired in 500 turns

This is an improvement on the previous run (4 chance cells, of which 3 were unreachable due to a directional-edge bug). The chance cells in Hovedstaden are at cells 13 and 14. But in the actual play, the random-walk DFS never reached them. Same issue — they're scattered around the map far from where the players cluster. The full 19-event chance pool, including Lucky Die, Boom Town, Plague, Stock Crash, Philanthropy, etc., remains dead code in default play.

### Mayor mechanic: still requires *every* buildable cell in a district

`DistrictSystem.recomputeMayor` still gates mayorship on 100% district ownership. Hovedstaden has 88 buildable cells; only 1 ended up built. After 500 turns, every district in this run has `mayorIndex: -1`. As in the previous report, the "Mayor controls" submenu, festivals, investment grants, taxation, and house tax-if-mayor are all unreachable.

The fix recommendation also hasn't changed: switch to a plurality or majority rule, or make the threshold scale with player count. With 1 structure on the entire board, even a "majority of *built* cells" rule would have given P4 mayorship of Hovedstaden by turn 49.

### District happiness / population are cosmetic

Districts show enormous population numbers that never change in any direction visible to the player: Hovedstaden 4,773,228; Sjælland 7,571,478; Syddanmark 9,499,112; Midtjylland 8,804,482; Nordjylland 3,934,927. Happiness sits at 47 across all five districts for the whole run. Without a mayor or chance events, no system that affects district state ever fires.

The current numbers also don't *feel* like district-level values — they look like nation-level inputs (these match Denmark's actual regional populations). It's a stylistic bonus that hints at scale, but for a player it's noise.

### Bankruptcy is sticky — but at least properly skipped this time

`_advanceToNextPlayer` now correctly skips bankrupt players. P2 and P3 only got 9 and 10 turns respectively — that's a real improvement on the "dead but still rotating" behaviour the previous report flagged. But the bankruptcy state itself is still permanent; once a player hits $-X, they're never coming back.

The 2-out-of-4-bankrupt outcome is bad for `LastManStanding`'s safety net: the win condition only fires when *one* player remains. With two players holding small stable balances and never touching each other, the game never resolves.

---

## Presentation notes

The HUD continues to feel polished. The new bankrupt badge is much cleaner than the truncated name; the players panel correctly strikes through bankrupt players (`P2`, `P3`); and the per-district sidebar shows population, happiness, tax rate, building count, and "No mayor" cleanly. The end-of-run screenshot shows the start menu (`Roll / Manage / Trade / Market / Save / Load / Game log / Pass turn`) overlaid on the camera-zoomed-in view of the surviving players' cluster — readable, with the colour-coded tokens visible under the menu.

A few cosmetic things noticed during the run:

- Districts now show a coloured *resource specialty tag* in the corner — `ELECTRICITY` on Hovedstaden, `WOOD` on Midtjylland, `WATER` on Nordjylland, `FOOD` on Sjælland, `OIL` on Syddanmark. This is new, helpful, and ties to the market system. But because the market never gets used in default play (zero visits, no resources accumulated past upkeep), the specialty bonuses are dead code in this run.
- The notifications panel now shows the latest few turn lines (`— Player 4's turn —`, `Rolled a 2.`, `Move 2 step(s)…`). This is much cleaner than the vault-upkeep flood of the previous run.
- "Tip: cheapest build is $250; you have $X" is in the notifications panel and on the build menu — a clear, helpful improvement.
- The `Pass turn` option in the start menu is what 220 of the 500 turns ended on. There's no "auto-pass when broke" toggle, which the previous report suggested; in this build the player just keeps clicking past identical menus.

---

## Gameplay notes

The core loop ("roll → move → land → build or skip") works, but **after the first 5–10 turns of each player it loses interactivity entirely**. Once the cash is gone:

- The build menu has only `Skip`.
- Every other tile is empty buildable — no choice to make there either.
- Toll gates and vaults exist but cost too much.
- Bank tiles, chance tiles, and resource tiles are too far from the spawn cluster to reach by random walk.

The driver, modelling a casual first-time player who just builds and passes, surfaced this as **220 turns where the player landed on an empty buildable plot they couldn't afford**. From the player's perspective, that's "I rolled, I moved 5 squares, the menu had nothing for me, I clicked pass." The game offers them no recovery mechanism.

The trade, sabotage, and market menus are still reachable from the start menu but the casual player never opens them. Even the directed driver from this run wouldn't have found them useful — they all cost cash, and there's no cash.

---

## Suggestions, ranked by impact

1. **Soften the resource upkeep penalty.** The forced market buy on zero stockpile is the single biggest balance issue in this build. Idle the structure instead of buying, or grant a small per-turn resource baseline, or halve base market prices. Without this, the casual player can never break even.

2. **Add an alternate, low-water-mark win.** "Last player still able to build" or "first to 5 surviving structures" or "highest net worth at turn 100" — anything that doesn't require $5,000 net worth on the current cash-flow model. This would be a small change that ends games rather than letting them limp to the cap.

3. **Distribute spawns across districts.** Spawn each player in or near a different region's bank cell. The four banks are already conveniently one-per-region. The spawn cluster was the dominant *strategic* problem in the previous run too; it just moved venues.

4. **Lower the mayor threshold.** Plurality of built cells (or majority of built cells, with a 5-cell minimum) would unlock the entire mayor/festival/grant/tax-rate machinery. With *one* structure on the board, even the most generous rule wouldn't trigger here, but normal sessions should.

5. **Rebalance bank stops upward, or add more banks.** With 4 banks on a 572-cell map and the spawn cluster driving traffic away from them, a player can go 200+ turns without ever stopping at one. Either add more banks or have banks pay out on pass-through (like toll gates already do).

6. **Activate the chance pool.** The 10 chance cells exist but are never landed on. Either move 2-3 closer to the spawn region, or make chance cells "active" — fire on pass-through, or trigger automatically every K turns rather than gating on landing. The Lucky Die alone would prevent the long stretches of low-roll stagnation we see in the data.

7. **Auto-pass-when-broke toggle.** Once a player has $0 cash and no rentable income, every turn is a 1-click no-decision walk. A quality-of-life toggle ("auto-pass empty turns") would compress the dead time in cases like this run, where 427 of 500 turns were no-decision turns.

8. **Reset bankrupt state on a positive cash event.** Currently `isBankrupt` is sticky once set. If a bankrupt player lands on a bank cell or wins a chance lottery, they should rejoin the game proper. Right now the flag is one-way.

9. **Surface district resource specialty in the build menu.** "Hovedstaden specialises in ELECTRICITY (-X% on shop upkeep)" or similar would tie the new specialty mechanic into the player's actual decisions.

10. **Cap or scale the district population display.** Showing "Pop 9,499,112" alongside "0 buildings" reads as cosmetic decoration. Either let player actions move that number meaningfully (post-mayor-rule fix), or use a smaller scale that matches what builds actually contribute (e.g. one house = +4 pop, scaled accordingly).

---

## What worked well

- The framework architecture continues to make this kind of headless playtest trivial. `window._accaGame` exposes everything; `g.cells`, `g.players`, `g.menu.options`, `g.movement.adjacent` are all directly inspectable.
- Animation speed-up via config (`g.cfg.turn.rollDuration`, `g.cfg.camera.betweenTurnsHold`) lets 500 turns finish in ~40 seconds on the user's machine.
- The build menu's affordability ordering and greyed-out display are exactly the right UX response to the previous report. The build hint (`Tip: cheapest build is $250; you have $215`) is the kind of fix that costs nothing and helps a lot.
- The bankrupt badge replaces the awful name truncation and reads cleanly in the topbar and players panel.
- Toll gates and vaults having zero upkeep cleanly differentiates them from the electricity-drinking structures. P4's toll gate surviving the entire run is a small testament — it is the *only* structure type a casual player could "build and forget".
- Chance cells went from 4 (3 unreachable) to 10 (all reachable in principle). The framework's connectivity model fix landed.
- Bankrupt-skipping in `_advanceToNextPlayer` is doing what the previous report asked for; P2 and P3 each only got ~10 turns of the 500.
- Performance is excellent; no memory leaks, no stuck timers, no corrupted state across 2,391 logged events.

---

## Reproduction

The driver code, the captured event stream (2,391 events), and the 21 turn-snapshots are all on `window.__events`, `window.__snapshots`, `window.__buildHistogram` of the open Acca tab as long as the tab stays open. The game is paused in `playing` state at turn 500 with `window.__driverStop = true`. Setting `window.__driverStop = false; window.__driverMaxRound = 800` and re-running the install snippet would continue the test. The key non-obvious driver tweaks remain `g.cfg.turn.rollDuration = 0.05` and `g.cfg.camera.betweenTurnsHold = 0.05`; without them, 500 turns at default animation speeds would take ~17 minutes of wall clock instead of 40 seconds.
