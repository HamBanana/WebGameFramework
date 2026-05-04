# Acca — 500-Turn Playtest Report

**Date:** 2026-05-03
**Configuration:** 4 players, $1,500 starting cash, $5,000 win target, $300 default property price
**Map:** `maps/denmark.json` (the default Acca map — 572 cells across 5 Danish regions)
**Driver:** Hot-seat console driver (see Methodology). The game itself was not modified.
**Outcome:** The game was still in `playing` state after 500 turns. No winner. All 4 players carried the `isBankrupt` flag. Player 3 owned 274 of the 333 built structures (≈82%) with a net worth of **$1,365,120**, yet sat at $800 cash on hand — far from the $5,000 cash win target.

---

## Methodology

A self-contained driver was injected into the page console (no game-code modifications) to drive 500 turns of hot-seat play. The driver:

- Speeds up the roll animation (`cfg.turn.rollDuration = 0.05s`) and the between-turn camera hold (`cfg.camera.betweenTurnsHold = 0.05s`) so 500 turns complete in ~38 seconds.
- Wraps `game.log` to capture every event into `window.__events` (uncapped — the game's own `eventLog` keeps only the last 30).
- Hooks `property:bought` to maintain a per-type build histogram.
- Polls every 5 ms and decides what to do based on `game.turn.stage` and `game.menu.visible`.

Decision rules (mirroring the project's "casual first-time player" reference strategy, with mid-session diversification):

- **Start menu** → always `Roll`.
- **Movement** → DFS over reachable cells exactly N steps away (capped at 6 for performance), no cycles within a single path. Score = empty-buildable plot (1000) > bank (600) > chance (400) > own structure (200) > untyped (100) > opponent structure (50). Step in the direction of the highest-scoring endpoint.
- **Empty plot** → diversify by picking the structure type the active player owns least of, breaking ties by lowest cost; `Skip` if nothing is affordable.
- **Owned/visited structure** → take the `Continue` option (no extra investment, no takeover).
- **Chance** → first option (would have been `OK` had any chance cells existed on the map).

Snapshots captured every 25 turns (20 snapshots total), plus a per-event log of 8,043 entries.

The driver also tracked the running game state in real time, surfacing several findings that wouldn't be visible to a casual one-game playtester.

---

## Final state after 500 turns

| Player | Cash | Structures | Net worth | Bankrupt flag | Mayors | Notes |
|--------|------|------------|-----------|---------------|--------|-------|
| Player 1 | $0 | 18 | $6,380 | true | 0 | Stuck since turn 212 |
| Player 2 | $0 | 15 | $5,280 | true | 0 | Stuck since turn 212 |
| Player 3 | **$800** | **274** | **$1,365,120** | true | 0 | Single-player runaway |
| Player 4 | $0 | 26 | $8,450 | true | 0 | Stuck since turn 262 |

333 of the 563 buildable cells (59%) ended up developed.

### Structure mix, all players combined

| Type | Cost | Count built |
|---|---|---|
| Shop | $250 | 65 |
| House | $300 | 58 |
| Toll Gate | $400 | 44 |
| Teleporter | $500 | 42 |
| Vault | $500 | 42 |
| Factory | $600 | 42 |
| Police Station | $700 | 40 |

Diversification worked — once each player owned one of every type, the rotation kept new builds spread across all seven categories. Total spend on structures across the run: **$146,450**.

### Where the money went

| Cash flow | $ over 500 turns |
|---|---|
| Build spend | $146,450 |
| Vault upkeep | **$142,275** |
| Toll-gate fees collected | $250 |
| Visit rents (shop / house / factory / vault) | $30 |
| Bank stops (+$200 each, 5 visits) | $1,000 |

Vault upkeep alone consumed nearly as much cash as every structure ever built.

### Structure-count divergence over time

```
turn   P1   P2   P3   P4
  37    4    4    4    4   - even land grab
 137   11   11   11   11   - still even
 212   18   15   22   21   - first divergence
 262   18   15   49   26   - P1/P2 frozen (bankrupt → can't afford)
 312   18   15   94   26   - P4 also frozen
 412   18   15  191   26   - only P3 still building, +1 per turn
 487   18   15  261   26   - runaway
 500   18   15  274   26
```

Players 1, 2 (turn 212) and Player 4 (turn 262) hit $0 cash and effectively retired from the build mechanic — the build menu only offers options the player can afford, and every option costs at least $250. From there forward, only Player 3 kept playing the actual game.

---

## Presentation notes

**The good.** The launcher is clean — every game has an obvious *Play* button and a settings cog with player count, starting money, win target, and property price selectors. Acca's HUD is well laid out: top bar (turn, current player, money, net worth, seven resource counters), left sidebar (district list with population / happiness / building counts / mayor), and right sidebar (notifications and a player roster colour-coded to the tokens). The Denmark map is a striking choice — far more atmospheric than a generic grid — and the camera zoom-in on the active player (then zoom-out between turns) is a thoughtful touch that makes 4-player hot-seat readable.

**Things a first-time player notices.**
- The start-menu hint at the bottom fades behind the chrome label "Claude is active in this tab group" in a Cowork window — likely fine for normal users, but worth knowing.
- The roll dice is animated and clear; the per-step die-face countdown is a nice "moves remaining" indicator.
- Tokens (red/blue/green/yellow pawns) read at a glance.
- Empty plots are visually identical to bank/market cells until you walk onto them. There's no preview of what type of cell you're about to land on.
- The right-sidebar "Notifications" panel is dominated by "Vault upkeep: -$25." spam in any game where vaults have been built (see Balance below). On the final screenshot eight of the ten visible notifications are vault-upkeep lines.
- "No mayor" appears under every district forever (see Balance).
- The five district headers display population, happiness, and building counts — but most of those numbers (population, happiness) never change for the player because nobody can interact with them without becoming mayor.

---

## Gameplay notes

The core loop is satisfying when the random walk lands on an empty plot: roll → move → choose a structure → see your money drop and the cell colour-shift to your team. The diversification rotation (build the type you own least) is fun strategy texture and the seven types feel meaningfully different on paper.

The friction shows up when the random walk *doesn't* land on an empty plot. With 563 buildable cells and a six-sided die, you very rarely path back to the same cell twice, but you also very rarely land on a particular opponent's shop. In 500 turns and 333 builds, only 30 actual visit-rent events fired ($30 total) and 9 toll-gate passes ($250 total). For a property game, the rent-extraction loop almost never engages.

The trade, sabotage, and market menus exist and are reachable from the start menu, but they would only be exercised by a player who actively chooses them. The driver — modelling a casual first-time player — never opened them, and the game played 500 turns without anyone ever interacting with the market, trading a resource, or sabotaging anything. Good news: the menus exist. Bad news: the default flow gives the player no nudge to try them.

A subtle thing the driver surfaced: every player except Player 3 spawned somewhere in the densely-connected northern half of the map (cells 0/450/454 in Region Nordjylland; Player 4 in nearby Midtjylland). For the first ~150 turns, the random-walk DFS kept everyone in Nordjylland (a 64-cell region with 58 buildable plots), and all 48 of the first 48 structures built were in Nordjylland or its immediate Midtjylland border. Hovedstaden, Sjælland, and Syddanmark — the southern 365 cells — saw zero development for the first third of the game. A casual player who only plays for ~30 minutes would never see most of the map.

---

## Balance issues

These are the issues most worth fixing first, ranked by how visibly they distort the game.

**1. Vault upkeep is a runaway negative-feedback loop.** Vault upkeep is $25 per vault, paid by the active player every end-of-turn. Across the run, vault upkeep alone removed $142,275 in cash — almost identical to all structure-purchase spending combined ($146,450). Vault interest pays out only when the owner actively *lands on* their own vault (so the rare-landing problem applies), and the per-turn upkeep accrues regardless. Once a player owns ~5 vaults, upkeep alone (-$125/turn) outpaces any plausible passive cash inflow. Two of the four players ended the run with no money and the game still tells them their vaults are losing money every turn — visible as the "Vault upkeep: -$25." flood in the notifications panel.

**2. The mayor mechanic is structurally unreachable in competitive 4-player.** From `DistrictSystem.recomputeMayor`, mayorship requires *every* buildable cell in a district to be owned by the *same* player. The smallest district (Nordjylland) has 58 buildable cells; the largest (Syddanmark) has 153. After 500 turns and 333 structures built — with Player 3 owning 76/87 cells in Hovedstaden — no district has ever had a mayor. That cascades:

- District tax collection (`collectTaxes`, `setTaxRate`) never fires.
- The Manage → Mayor controls submenu (festivals, investment grants, tax sliders) is never reachable in normal play.
- District happiness defaults to 0 mid-game (PopulationSystem decay) and nobody can run a festival to lift it.
- The "Mayor of X" announcement, which is presumably one of the more emotionally satisfying milestones, never fires.

The HTML hint label at the bottom of every district panel is "No mayor" — and in this 500-turn run that string was never anything else.

**3. The win condition is incompatible with the cash-flow design.** Win = $5,000 *cash on hand*. But cash continuously drains into builds and vault upkeep, and rent collection is event-rare (≈1 visit-rent every 17 turns). Player 3 ended with $1.36 *million* in net worth (mostly in 39 vaults × $500 each, plus 39 of every other building) and only $800 cash. The game has no win-by-net-worth, no win-by-monopoly, and no win-by-bankrupting-everyone-else, so a clearly dominant player just keeps playing.

**4. `isBankrupt` is sticky and toothless.** `Player.addMoney` sets `isBankrupt = true` whenever the balance would go negative, then clamps money to 0 — but the flag is never cleared. After 500 turns *all four players* show `isBankrupt = true` (the topbar even shows "Player 3 (ban..."). Bankruptcy doesn't end the game, doesn't free a player from the rotation, doesn't trigger an auction, doesn't surrender properties — it's purely cosmetic. From the player's perspective, going broke means the build menu only ever shows "Skip" and they spend the rest of the game pressing Pass.

**5. Bank cells are too sparse, especially given how cash-negative the late game is.** With four banks on a 572-cell map, a single player got 5 bank visits in 500 turns ($1,000 of net income). For a player whose only cash inflow is "land on a bank tile", that's ~one inflow every 100 of *their* turns.

**6. The Denmark map has zero `chance` cells.** The chance pool defines 18 events (Lucky Die, Boom Town, Plague, Stock Crash, Philanthropy, etc.), the system to draw and apply them is fully wired (`ChanceSystem`, `_handleChance`), and the framework supports a `chance` cell type — but `maps/denmark.json` doesn't include any. The result: in 500 turns, zero chance events fired. An entire system, including the "Lucky Die" mechanic that's already wired through the roll/override path, is dead code on the default map.

**7. Spawn-cluster trap.** Three of four players spawn within a few cells of each other in Region Nordjylland. The fourth spawns in adjacent Midtjylland. In an early game the random walk doesn't escape this cluster, so the first ~100 builds happen in 12% of the board. New players never see Sjælland, Hovedstaden, or Syddanmark unless they keep playing.

**8. Land-grab is the only viable strategy for a casual player.** Because rent collection is rare and the build menu drives almost all interesting decisions, the optimal naïve strategy is exactly what the bots converged on: build on every empty plot you land on. There's no reason to take an opponent's offer, sabotage them, or trade — you just need plots.

**9. Camera is right but the *visual* feedback for "you can't afford this" is missing.** The build menu silently drops options the player can't afford, leaving "Skip" as the only entry. A player who has just landed on a great plot with $50 in cash sees a "Skip" menu and may not realise *why*.

**10. Resource accumulation is cosmetic without market interaction.** Player 3 ended with **41,244 food** from 39 factories. The market is fully wired but, again, never gets used in a default play-through.

---

## Smaller things worth flagging

- The "Region X has no mayor" string appears under every district forever; consider promoting `Mayor: <player>` into the district header when one is elected, or hiding the line when it never applies.
- The DOM topbar truncates the player name when bankrupt — "Player 3 (ban..." — which loses the actual money/networth.
- `Save game` shows the option even if no slot exists; `Load game` is conditionally appended. The asymmetry is fine but might confuse first-time players who expect a Load slot to exist after their first save.
- `eventLog` is capped at the last 30 entries internally. Anything older is gone from in-game inspection.
- Build menu sorts catalog by enum order (shop, toll gate, teleporter, house, factory, police station, vault). A casual player would benefit from cost-ordered options, with what they can afford highlighted at the top.
- Pre-resolved cardinal slots on each cell mean the player can sometimes only reach a subset of a junction's neighbours (the docstring acknowledges this trade-off). In several junctions the DFS noticed dead-end cells that aren't actually dead-ends — their non-cardinal neighbours just weren't slotted.
- `MovementController._refreshCandidates` declares "dead-end → forfeit movement", which the driver hit a handful of times when paths terminated at corners. Forfeiting silently ends the move with no log line — consider logging "P1 reached a dead end with N moves remaining".

---

## Suggestions

These are ranked by how much they would improve a one-game first-impression.

**Tighten the win condition.**
- Either lower the cash target dramatically (≤$2,000, given the rent-poor reality), or add a parallel `MoneyOnHand` *or* `NetWorth` win, or add a "last player not bankrupt" win, or all three. Right now, the game can't end in a normal session.

**Make the mayor mechanic reachable.**
- Replace "owns every cell in district" with "owns the plurality of *built* cells", or add a "majority of buildable cells" path, or make the threshold scale with player count (`ceil(buildable / numPlayers + 1)`). Even a strict variant — "majority of built cells, minimum 5" — would give Player 3 mayorship in Hovedstaden / Sjælland and unlock the Mayor menu.

**Rebalance vault economics.**
- Either drop upkeep meaningfully (e.g. $5/vault), make interest passive (collected automatically each turn instead of only when the owner lands on their own vault), or both. Right now the vault is strictly the worst structure — its passive cash flow is negative for almost any owner.

**Add chance cells to the Denmark map.**
- Even 6–10 chance cells distributed across the regions would activate the entire chance event pool and Lucky Die mechanic. Current count: 0.

**Make rent more frequent or stronger.**
- Either bump shop visit rate (currently 8% of structure value), house rent rate (10%), and equivalents — or add "cell-pass" effects so rent fires every time someone passes through (not just lands), the way the toll gate already does. The shop rent loop barely engages on the current map.

**Bankruptcy needs a real consequence.**
- A bankrupt player should either (a) be eliminated and have their structures returned to the bank for re-sale at half-price, or (b) trigger a forced sell of properties to other players, or (c) at minimum be marked clearly in the HUD ("Player 1 — out") and skipped in turn rotation. Sticking around with $0 forever is a confusing way to play.

**Stagger spawn locations across districts.**
- Spawn each player in a different district's bank cell. The `bankCells` array already has one bank per region. Right now Player 1 starts on cell 450 (Nordjylland) instead of cell 0 (Nordjylland's bank), which means three players start in or near Nordjylland.

**Surface the unreachable affordances.**
- In the build menu, show the entries the player can't afford as greyed-out lines (so they see what they're missing).
- In the empty-plot hint, show the cheapest structure cost so a player at $200 knows immediately why they can't build.

**Cool the vault-upkeep notification spam.**
- Either suppress the per-turn "Vault upkeep: -$25" line and replace it with an aggregate "Vault upkeep: -$250 (10 vaults)" line, or only log it when the upkeep crosses a threshold.

**Add a "build everywhere visited" auto-mode for streamlining.**
- The casual player ends up Pass-ing for hundreds of turns once broke. A "skip all when broke" or "auto-pass empty turns" toggle would help.

---

## What worked well

- Framework architecture cleanly separates the engine (movement, menu, input) from Acca-specific systems (district, market, trade, chance). Driving the game from the console and observing internals was straightforward — `window._accaGame` exposes everything you need.
- The build-and-rotate loop is fundamentally fun. Once an opponent's shop is in your path, you have a real "do I land here on purpose?" decision.
- Performance is excellent. 500 turns in 38 seconds with the animations sped up — the engine has no memory leaks across that many state transitions, no stuck timers, no corrupted state.
- The Denmark map is more interesting than a generic grid and the regional theming is charming. With a few chance cells added and the spawn-cluster fixed, this map could carry the game.
- Save/Load is wired into the start menu and visible from the first turn — first-time players will discover it organically.
- The notifications sidebar is the right pattern for surfacing per-turn outcomes; with the vault-upkeep spam fixed it would be even more useful.

---

## Reproduction

The driver code, the captured event stream (8,043 events), and the 20 turn-snapshots are all available on `window.__events`, `window.__snapshots`, `window.__buildHistogram` and `window.__notes` of the open Acca tab as long as the tab stays open. The game is paused in `playing` state at turn 500 with `window.__driverStop = true`. Re-running with `window.__driverStop = false; window.__runUntilTurn(700)` will continue from there.

The key non-obvious driver tweaks that made 500 turns tractable: setting `g.cfg.turn.rollDuration = 0.05` and `g.cfg.camera.betweenTurnsHold = 0.05`. With defaults (1.4s + 0.6s per turn), 500 turns would take ~17 minutes of wall clock.
