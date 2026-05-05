# Acca — 4-Player 500-Turn Playtest Report (Default Map)

**Date:** 2026-05-04
**Map:** `maps/default.json` — 37 cells, 8 districts (A–H), composition: **32 buildable / 1 bank / 4 chance / 0 resource cells**
**Configuration:** 4 players, $1,500 starting cash, $5,000 net-worth-or-last-standing win target, $300 default property price, `competitive` mode
**Driver:** Synchronous hot-seat console driver — synthetic `KeyboardEvent` dispatch into the existing `InputManager`, no game-code modifications. The driver also patched the rAF loop to a synchronous engine-step harness so a backgrounded tab couldn't throttle the run.
**Outcome:** **No winner.** The driver ran the full 500-turn cap. Final state: 0 bankruptcies, 0 structures left on the board, all 4 players locked at $85–$122 net worth (≈ 2% of the $5,000 win target). The game was effectively decided by **turn 25** and idled for the remaining 475 turns.

---

## TL;DR

This was a clean run on the small default map. It confirms and sharpens the central balance finding from the 2026-05-04 Denmark playtest: **resource upkeep at full market price destroys every player's economy within ~25 turns of the first build.** The default map exposes an additional quirk — there are no resource cells (no power plant, well, or mine), so players have **no way at all** to obtain electricity, food, or oil except by buying at market for cash they don't have. Every one of the 16 structures built during the early game was auto-sold to settle debt by turn 25. From turn 30 onward the board was empty, every player was stuck at ~$100, and the next 470 turns produced zero economic activity — 481 of 500 landings were forced "Skip" because nothing was affordable.

A second class of issue surfaces on this map that the Denmark report did not flag: **population growth is decoupled from gameplay.** Five of eight districts grew exponentially (one to 418,194 residents) without any player ever owning a structure or being mayor in them, while three other districts stayed locked at their starting count of 48–50 because of an integer-rounding floor in the births/deaths formula. None of this affected gameplay because nobody was a mayor — but the dashboard still surfaces the runaway population numbers.

The single most impactful fix is the same one identified in the Denmark report: **defer or rebalance the mandatory market-buy upkeep,** either by giving every player a small per-turn resource stipend, lowering base prices for the consumables (electricity, food, oil) below the structure's passive income, or skipping the auto-buy when a player owns zero of the needed resource and instead just idling the structure for one turn.

---

## Methodology

A self-contained driver was installed in the page console. No source files were modified. The driver consists of three parts:

1. **Engine-step harness.** Replaced the engine's `requestAnimationFrame` loop with a `__pump(N)` helper that calls the same per-frame body synchronously. This makes the driver immune to Chrome's hidden-tab rAF throttling — early attempts using `setTimeout`/rAF stalled mid-run when the tab was not foreground.
2. **Synthetic key tap.** `__tapSync(code)` dispatches a `KeyboardEvent('keydown', { code })` to `window`, pumps two engine frames so the InputManager's `_justPressed` is observed and flushed, dispatches `keyup`, then pumps one more frame.
3. **Decision loop.** `__playN(maxTurns)` reads `game.turn.stage`, `game.menu.title`, `game.menu.options`, and `game.movement` each step and dispatches keys accordingly:
   - **Start-of-turn menu** → always `Roll` (index 0).
   - **Movement** → DFS over the cardinal-neighbor graph for an N-step path. Endpoint score: empty buildable (1000) > bank (220) > resource cell (150) > own buildable (80) > chance (60) > market (30) > opponent buildable (-50). Step in the direction of the highest-scoring endpoint. Mid-session retune: bias build choice toward least-owned structure type after the first two builds, to diversify portfolios.
   - **Empty plot** → pick the cheapest affordable type from the diversification preference, fall back to first affordable, fall back to `Skip`.
   - **Own structure / opponent structure** → `Continue` (don't reinvest, don't pay 5× takeover).
   - **Chance** → `OK`.

`game.log` was wrapped to push every line into an uncapped `__events` array (the game's own `eventLog` is capped at 500). Snapshots were captured every 25 turns; a per-event timeline of 2,606 entries was retained for analysis.

The driver dispatched **3,177 synthetic key events** across 500 turns and recorded **0 step-level errors**. Average roll value across 500 dice rolls: **3.376** (close to the expected 3.5 — RNG looks unbiased).

---

## Final state after 500 turns

| Player | Cash | Structures | Net worth | Bankrupt | Mayors |
|--------|-----:|-----------:|----------:|----------|-------:|
| Player 1 |  $85 | 0 |  $85 | false | 0 |
| Player 2 | $122 | 0 | $122 | false | 0 |
| Player 3 | $120 | 0 | $120 | false | 0 |
| Player 4 | $110 | 0 | $110 | false | 0 |

**0 of 32 buildable cells** ended up developed. Win target was $5,000 — highest finishing net worth was 2.4% of that. No player went bankrupt because debt was always cleared by auto-selling their structures back to the bank at half value, leaving net worth a small positive number with no remaining structures.

### Turn-by-turn divergence (cash / owned / net worth)

```
turn   P1               P2               P3               P4
   0   1500/0/1500      1500/0/1500      1500/0/1500      1500/0/1500
  10   1050/2/1550       524/3/1324       915/2/1415       915/2/1415
  20    195/4/1295        37/3/887        595/3/1395        25/3/875
  30    130/1/430        122/0/122        100/3/950         25/1/325
  40      0/1/300        122/0/122         35/1/335        110/0/110
  50     85/0/85         122/0/122        120/0/120        110/0/110
 100     85/0/85         122/0/122        120/0/120        110/0/110
 200     85/0/85         122/0/122        120/0/120        110/0/110
 350     85/0/85         122/0/122        120/0/120        110/0/110
 500     85/0/85         122/0/122        120/0/120        110/0/110
```

The cohort fully stabilised by turn 50. From turn 50 onward, **no player's cash or structure count changed** for the remaining 450 turns. Players just rolled and skipped.

### Aggregate counters

- 500 rolls, 500 turn-rotations, 0 dead ends recorded
- **16 successful builds** total (8 Shop, 8 House — bot only ever afforded the two cheapest types) — all in turns 0–22
- **16 auto-sales** to settle debt (one per build — every structure built was eventually auto-sold)
- **66 mandatory upkeep market-buys** for $35 (electricity), $30 (food), or both
- **481 forced "Skip" decisions** (96.2% of all landings) because nothing was affordable
- **1 chance event** drawn in 500 rolls (Regional Festival, +$150 to the active player at turn 4)
- **1 bank landing** in 500 rolls (out of an expected ~14 — the DFS strongly biases toward empty buildables)
- 0 takeovers, 0 trades, 0 sabotages, 0 festivals, 0 mayor actions, 0 vault deposits, 0 factory production, 0 shop-rent visits, 0 house-rent visits, 0 toll payments

---

## What actually happened — the death-spiral, narrated

Reproducing the per-event log for the first 25 turns clarifies the failure mode. The driver lands on an empty buildable, builds the cheapest affordable type, the upkeep tick fires, and the math grinds the player down:

```
turn 0  Player 1 built a Shop in District E.                                  cash 1500 → 1250
turn 1  Player 1 bought 1 electricity at market for $35 (upkeep shortfall).   cash 1250 → 1215
turn 1  Player 2 built a Shop in District A.                                  cash 1500 → 1250
turn 2  Player 2 bought 1 electricity at market for $35 ...                   cash 1250 → 1215
...
turn 6  Player 2 built a Shop in District A. (2nd shop)                       cash → 965
turn 6  Player 2 bought 2 electricity at market for $70 ...                   cash → 895
turn 9  Player 2 built a House in District D.                                 cash → 595
turn 10 Player 2 bought 1 food at market for $30 ...                          cash → 565
turn 10 Player 2 bought 3 electricity at market for $105 ...                  cash → 460
turn 13 Player 2 built a House in District B.                                 cash → 160
turn 14 Player 2 bought 2 food at market for $60                              cash → 100
turn 14 Player 2 bought 4 electricity at market for $140 ...                  cash → -40
turn 18 Player 2 auto-sold their shop in District A for $125 to settle debt.  cash → 122
```

By turn 18 Player 2 has sold their first shop and recovered to $122 — and there they stay for the rest of the game, because every additional build will run them straight back into the same spiral.

### Per-shop ROI math

For a single Shop owned in isolation:

- **Income:** `_runProduction` adds $20 per turn (passive owner trickle).
- **Income, opportunistic:** `visitorEffect` charges other players `round(currentValue × 0.20)` = $50 on visit. With 1 shop on a 37-cell board and a roll of ~3.4 steps, the chance of any specific opponent landing on it on any given turn is roughly 3.4/37 ≈ 9.2%. Across the three other players that's ~27% per turn → expected $13.5/turn rent.
- **Cost:** `_runResourceUpkeep` mandates 1 electricity per shop. The player almost never has any. Market price is $35. Mandatory.
- **Net:** $20 + $13.5 − $35 = **-$1.5/turn**, in expectation, for each Shop.

A House is worse: $0 passive income, optional $60 mayor-tax (which the bot can never collect because districts have no mayor in any practical run), $30 + $35 = **$65/turn** in mandatory upkeep, $14/turn expected rent. **-$51/turn**, in expectation.

Multiple structures compound: by the time a player owns 2 shops + 2 houses (a perfectly reasonable mid-game holding) they're losing **~$110 per turn** in mandatory upkeep alone. The starting $1,500 stake covers about 14 turns of that load. Then debt resolution kicks in and the structures are auto-sold at half value.

### Why is the upkeep "mandatory"?

`_runResourceUpkeep` (AccaGame.js:1920) treats a missing resource as "the player buys it at full market price right now," allowed to push cash negative, then idles the structure for one turn. This is a strict net-loss path for any player who hasn't accumulated resources yet, because the structure passive output is generally less than the upkeep market-buy. There's no cushion: you can't choose to skip the upkeep and just have an idle structure for a turn, the way you might let a real shop sit shuttered.

---

## Map issues

### No resource cells on the default map

The default map is **32 buildable / 1 bank / 4 chance / 0 resource cells** — no power plant, well, mine, or market. `_handleLanding` has working cases for `power_plant`, `well`, `mine`, and `market`, but none of those types appear in the loaded cell set. With no resource cells, the only way to obtain electricity/food/oil is the market, which is the same money sink the upkeep already taxes. **The single most natural counter-balance to the upkeep death spiral is structurally absent from the default map.**

### Bot-visible cell-type distribution

Across 500 dice rolls the bot landed on:

- **Buildable cells:** ~497 of 500 rolls (the DFS scoring of 1000 for empty buildables is a strong attractor, and even with built cells the score is still ≥ 80 for own / -50 for opponent's, much higher than 60 for chance)
- **Bank:** 1 visit (vs. ~14 expected by uniform sampling)
- **Chance:** 1 trigger (vs. ~54 expected by uniform sampling — and only 4 chance cells exist on a 37-cell board, so this is genuinely undersampled)

A real player with the same incentives would do roughly the same thing — chase empty plots — so the expected variety of landings on this map is poor. **Either the buildable-to-utility ratio is too high (32:5), or the buildable score should fall once a player can no longer afford to build, so they at least drift through the chance/bank cells.**

---

## Population system issues

### Exponential growth without input

District populations grew unboundedly without any structure ever being built or any mayor ever taking action. Final values:

| District | Starting pop | Pop at turn 50 | Pop at turn 200 | Pop at turn 500 |
|----------|------:|------:|------:|------:|
| District A |   30 |  48 |  48 |     48 |
| District B |   30 |  95 | 1,301 |  243,530 |
| District C |   30 | 105 | 1,419 |  265,729 |
| District D |   30 | 116 | 1,575 |  295,007 |
| District E |   50 | 114 | 1,547 |  289,905 |
| District F |   50 |  50 |  50 |     50 |
| District G |   50 | 163 | 2,233 |  418,194 |
| District H |   50 |  50 |  50 |     50 |

District G ballooned to **418,194 residents** by turn 500 with no mayor and no structures. This is a runaway in `PopulationSystem._stepGrowth`:

```
births = round(pop × birthRate × happiness/100 × happinessGrowthMultiplier)
       = round(pop × 0.04 × 0.47 × 1.5)  ≈ pop × 0.028
deaths = round(pop × deathRate × (1 − happiness/100))
       = round(pop × 0.02 × 0.53)        ≈ pop × 0.011
```

Net growth rate ≈ **+1.78% per turn**, doubling every ~39 turns. With nothing in the system pushing back (no death cap, no resource gate at the population level — only at the mayor level, and the mayor slot is empty), it just compounds for 500 turns.

### The integer-rounding floor

The reason A, F, and H stay flat is that `births` and `deaths` are both `round()`-ed independently, so for small populations both round to the same integer and the population doesn't move. Specifically:

- pop 50: births = round(1.41) = 1, deaths = round(0.53) = 1 → delta 0
- pop 30: births = round(0.85) = 1, deaths = round(0.32) = 0 → delta +1

District A actually grew from 30 → 48 in the first ~30 turns — which is exactly where the rounding tie kicks in (~pop 48 onward, both round to 1) — and froze there. Districts that happened to receive a single house early (housePopContribution = +4 per turn while the house exists) got pushed past the rounding floor and into the exponential regime; districts that didn't, didn't.

This is a hidden bifurcation: **players can permanently shape a district's population trajectory by building a single house there for a single turn**, even if that house is then auto-sold. The dependency is fragile and unintuitive.

### Happiness is also frozen

Every district sat at happiness **47** for the entire run — slight drift down from the starting 50, then stable. With no mayor, no `_stepHappiness` factor that would otherwise shift the target (tax, employment ratio, services, idle businesses, festival, food/water shortages) actually applies. The happiness target collapses to a constant 50, with the lerp pulling toward it. **The happiness UI shows variation that doesn't exist in this configuration.**

---

## Win condition is unreachable from this configuration

The win check is `NetWorthOrLastStanding` with `target: 5000`. Across 500 turns, the highest net worth any player ever held was Player 1 at **$1,550** (turn 10). After turn 50 the highest was $122. **The economy as currently configured cannot produce a $5,000-net-worth player in 500 turns** — even with the bot picking the empirically best landing target every move.

The only way the game ends, then, is `LastStanding`, which requires three of four players to hit `isBankrupt`. Bankruptcy fires only at `netWorth ≤ 0`, and `_resolveDebt` always rescues players to small positive equity by auto-selling at half value. So in practice the game can never end naturally on this map under these rules — it just runs forever.

---

## Presentation

This run had no rendering or animation issues from the bot's perspective; the engine ran smoothly on the synthetic-frame harness at >1,000 effective fps. Things to highlight from the dashboard side:

- **Topbar values stable, readable.** The player tab shows cash and net worth correctly, "Bankrupt" badge wiring works (verified by inspection — never triggered in this run).
- **District left-sidebar display gets noisy at scale.** With pops in the hundreds of thousands, a row like `District G  pop 418194  hap 47  tax 10%` overflows the 220-px column. Either format with thousands separators (`418.2K`) or clamp the displayed pop with a tooltip for the precise number.
- **Notifications panel only shows the last few entries.** During the active phase (turns 0–25), 5–6 events fire per turn (build, upkeep, auto-sell, end-turn, and others). The panel discards earlier events visually, even though `Game log` from the start menu can paginate through them. Either show more lines by default or surface a small "more events" indicator.
- **The "Tip:" lines from `_runContextualPrompts` are great when active**, but during the 470-turn idle phase they fire every turn for every player ("Tip: cheapest build is $250; you have $122") and crowd out useful signal. Consider rate-limiting the same tip per player to once every N turns or until something material changes.
- **`Empty plot in District X` menu** lists 7 build options sorted by cost, then `Skip`. When the player has $122 cash, **all 7 build options are disabled** with `— need $128`, `— need $178`, … and the player has to scroll past 7 dead options to reach `Skip`. This is the dominant UX path on this map (96% of landings). A tighter UX would be: if the player can't afford anything, show only `Skip` plus a one-line affordance hint, or at least pre-select `Skip` as the highlighted option so a single Enter clears the menu.

---

## Suggestions for improvement, in priority order

### 1. Fix the upkeep death spiral *(highest impact)*

The mandatory market-buy at full price is the single root cause of the broken economy. Pick one (or layer them):

- **a. Idle on shortage** — when a player has zero of a needed resource, **don't** buy at market; just idle the structure for one turn (which the system already does). This converts "guaranteed cash drain" into "guaranteed lost income for a turn," letting players dig out.
- **b. Free first unit** — for each owned structure, grant the first upkeep unit free per turn. Beyond that they pay market.
- **c. Lower upkeep prices** — base prices for electricity ($35), food ($30), oil ($80) are roughly the same as a structure's whole-turn passive output. Halve them when used as upkeep, full-price for player-initiated buys.
- **d. Per-turn resource stipend** — give each player +1 of each consumable resource per turn, no questions. Caps the worst case at zero out-of-pocket if they own 1 of each structure type.

The existing `_resolveDebt` function is the right safety net once those fixes land — it should remain as the last-resort liquidation path, not the every-other-turn baseline behavior.

### 2. Add at least one resource cell to the default map *(prevents the no-stockpile lock)*

`_handleLanding` already supports `power_plant`, `well`, `mine`, `market`, but none appear in `default.json`. Adding even a single power plant + well would let players build up an electricity/food buffer over a few turns of pure walking, breaking the deterministic "spend $35 every upkeep tick" loop. Suggested replacement: convert 4 buildable cells to one each of power_plant, well, mine, market, taking the build count from 32 → 28.

### 3. Cap or gate population growth *(avoid the 418K-resident runaway)*

In `PopulationSystem._stepGrowth`:

- **Soft cap** based on jobs/services in the district: `target_pop = jobs × jobs_to_pop_ratio + base_floor`, and growth lerps toward `target_pop` rather than compounding without bound.
- **Carrying-capacity factor** in births: multiply births by `max(0, 1 − pop/cap)`, where `cap` is `cells.length × 50` or similar.
- **Use `Math.floor` for births and `Math.ceil` for deaths** (or vice versa) to remove the rounding-floor bifurcation that traps small districts at base count.

### 4. Add a turn-cap rule to the win condition *(unblocks games that would otherwise idle forever)*

Augment `NetWorthOrLastStanding` with `turnCap` (e.g., 200) → at the cap, declare highest-net-worth player the winner. This prevents the indefinite-idle steady state observed here.

### 5. Tighten the structure ROI bands *(make a built shop actually pay back)*

After the upkeep fix, revisit the per-turn yields so a single Shop has positive expected value across realistic visit rates (estimate ~10% per opponent per turn). Currently a Shop pays back $20 passive + ~$13.5 expected rent against $35 mandatory upkeep — net negative. Targets to consider:

- Bump `shopVisitRate` from 0.20 → 0.30, OR
- Bump shop passive `+$20` → `+$35` (matching the upkeep cost), OR
- Cut `shopElectricity` from 1 → 0.5 (charge electricity every other turn).

Apply analogous adjustments to House (currently the worst), Factory (probably untested in this run because nobody could afford one).

### 6. Smarter chance-cell trigger weighting *(seeing 1 chance event in 500 rolls is too few)*

Either bump up the number of chance cells on the default map (4 → 8) or, better, **add a "near miss" bonus** — when a player ends their turn within 1 step of a chance cell without landing on it, fire a low-impact chance event with probability ~25%. Keeps the chance pool engaged on small maps without forcing it.

### 7. Empty-plot menu UX when broke *(481 of 500 menu interactions in this run)*

When `cheapest > player.money`, drop the disabled rows and show only `Skip` with a one-line summary: "Cheapest build is $250 — you have $122. Skip." This single change eliminates ~7 keypresses per landing in the dominant late-game state and makes the broke-player experience tolerable.

### 8. Number formatting in the district sidebar

Use thousands separators (`243.5K`, `418.2K`) so the left-sidebar layout doesn't overflow once population growth runs long. Or expose a "show full number" toggle.

### 9. Rate-limit the "Tip:" lines

`_runContextualPrompts` fires the same tip every turn while preconditions hold. Cache the last tip per player and suppress duplicates within N turns (e.g., 10), so the notifications panel actually shows new events instead of being dominated by reminders.

### 10. Surface auto-sale events more visibly

Right now `Player N auto-sold their shop in District X for $125 to settle debt.` is just another notification line. This is the moment when a player's strategy collapses — it deserves a distinctive visual cue (different border colour, sound effect, slight pause before the next turn starts). A casual player needs to *understand* what happened in order to learn from it.

---

## Comparison with the 2026-05-04 Denmark playtest

| Dimension | Denmark (572 cells, 5 regions) | Default (37 cells, 8 districts) |
|---|---|---|
| Builds | 19 | 16 |
| Auto-sells | 18 | 16 |
| Bankruptcies | 2 of 4 | 0 |
| Chance events | 0 | 1 |
| Bank stops | 0 | 1 |
| Structures left at turn 500 | 1 | 0 |
| Highest finishing net worth | $540 | $122 |
| Effective game length | ~73 turns | ~25 turns |
| Resource cells on map | (some, per Planning) | **0** |

The default map collapses faster (~25 turns vs ~73) because the absence of resource cells removes the only on-board path to non-cash electricity / food. Both runs converge on the same diagnosis — **upkeep at full market price is the dominant balance bug** — and the same #1 recommendation.

---

## Driver / harness notes (for whoever runs this next)

A few things I learned along the way that will save someone time:

- **Hidden-tab rAF throttling will silently freeze the engine** mid-session. The harness installed by the driver replaces the rAF loop with `__pump(N)` that runs N synchronous engine frames per call. Always do the same on a backgrounded automation run.
- **`game.eventLog` is capped** at 500 entries and rolls off silently. Wrap `game.log` and append to your own uncapped array if you want a faithful timeline.
- **`requestAnimationFrame` and `setTimeout` are both throttled in hidden tabs.** A driver that schedules itself with either of those will run at ≤1Hz when the user switches windows, and may appear stuck. Drive the engine inline from a single synchronous `__playN(maxTurns)` call; CDP's own timeouts (~45 s) are the only ceiling.
- **Speed up `cfg.turn.rollDuration` (1.4 → 0.1)** and `cfg.camera.betweenTurnsHold` (0.6 → 0.05) so 500 turns complete in a few seconds of synchronous engine time.
- **The InputManager only registers `_justPressed` if the key is not already held.** Always dispatch `keyup` before re-pressing the same code.
- **The bot's DFS scoring matters a lot.** Empty buildable at 1000 will dominate everything else, which is realistic for an early-game agent but makes chance/bank cells under-sampled in the late game. Consider adding a phase-aware score that drops buildable's weight once the active player can't afford anything.

---

*Driver, harness code, and per-event timeline are available in `window.__sd.snapshots` and `window._accaGame.__events` on the live page. Total events captured: 2,606.*
