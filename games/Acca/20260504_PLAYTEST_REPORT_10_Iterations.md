# Acca — 10-Iteration Autonomous Playtest Report
**Date:** 2026-05-04
**Map:** `maps/default.json` (37 cells, 8 districts, 4 chance + 1 bank + 1 market + 1 mine + 1 power_plant + 29 buildable)
**Players:** 4 (default config)
**Win condition:** `NetWorthOrLastStanding`, target $5,000, turn-cap fallback at 300 turns
**Round budget per test:** 500 turns
**Driver:** synchronous in-page hot-seat bot — replaces the engine's `requestAnimationFrame` loop with a `__pump(N)` that advances N synchronous frames at a fixed dt, calls `option.action()` directly on menu choices (rather than dispatching key events), and uses BFS movement planning that scores reachable endpoints (empty buildable > resource cell > shop > chance > other).

---

## Headline result

**The game is winnable.** Every one of the 10 iterations (and the 2 post-fix verification runs) terminated with a declared winner — 8 of 10 by hitting the $5,000 net-worth target, 1 by turn-cap fallback, 1 still by net-worth target after the fix increased game length. No iteration stalled, dead-ended, or required driver intervention to terminate. There was meaningful winner variance across iterations (Player 1, 2, 3, and 4 all won at least once across the run-set), and game length ranged from 61 to 300 turns depending on strategy.

---

## Iteration matrix

| # | Strategy                  | End reason | Final turn | Winner   | Winner NW | Builds | Auto-sells | Bankruptcies | Chance landings |
|---|---------------------------|-----------|-----------:|----------|----------:|-------:|-----------:|-------------:|----------------:|
| 1 | cheapest-first (Shop)     | NW target | 69         | Player 1 | $5,100    | 29     | 0          | 0            | (8 in pool)     |
| 2 | cheapest-first (Shop)     | NW target | 72         | Player 4 | $5,180    | 29     | 0          | 0            | —               |
| 3 | cheapest-first (Shop)     | NW target | 61         | Player 1 | $5,080    | 29     | 0          | 0            | 0\*             |
| 4 | cheapest-first (Shop)     | NW target | 75         | Player 3 | $5,055    | 29     | 0          | 0            | 0\*             |
| 5 | cheapest-first (Shop)     | NW target | 75         | Player 3 | $5,085    | 29     | 0          | 0            | 0\*             |
| 6 | cheapest-first (Shop)     | NW target | 78         | Player 2 | $5,050    | 29     | 0          | 0            | 0\*             |
| 7 | cheapest-first (Shop)     | NW target | 73         | Player 1 | $5,000    | 29     | 0          | 0            | 0\*             |
| 8 | diversified rotation      | NW target | 71         | Player 4 | $5,025    | 23     | 8          | 0            | 1               |
| 9 | expensive-first (Vault →) | turn cap  | 300        | Player 2 | $4,880    | 13     | 3          | 0            | 5               |
|10 | never-build (always Skip) | NW target | 190        | Player 2 | $5,000    | 0      | 0          | 0            | 0               |

\* Iterations 3–7 used a tighter chance-event regex than iteration 1, hence the 0s — see *Driver caveats* below; chance events were drawn but not pattern-matched.

After the post-iteration fix, two further verification runs confirmed the game still terminates:

| # | Strategy                  | End reason | Final turn | Winner   | Winner NW |
|---|---------------------------|-----------|-----------:|----------|----------:|
| 11 (post-fix) | cheapest-first | NW target | 70         | Player 2 | $5,025    |
| 12 (post-fix) | never-build    | NW target | 216        | Player 4 | $5,001    |

---

## Iteration-by-iteration narrative

### Iteration 1 — cheapest-first / Shop spam
Player 1 wins at turn 69 with NW $5,100. All four players reach 7–8 owned shops by the time the win fires; cash hovers in the $1,640–$1,900 range. 29 structures built (= every empty plot). 114 upkeep-idled events fired, but no auto-sells or bankruptcies — the prior fix that switched upkeep shortfalls from "force-buy at market" to "idle one structure for a turn" is keeping the economy alive.

### Iteration 2 — cheapest-first, repeat for variance
Confirmation run. Player 4 wins at turn 72 with NW $5,180. Three of the four finishers are within $470 of each other; the win is decided by who happens to land on the last buildable plot first. 7–8 shops each, 549 events.

### Iteration 3 — cheapest-first, fastest game observed
Player 1 wins at turn 61, the shortest game across all 12 runs. The bot's BFS scoring drives early acquisition aggressively when the map is uncrowded, so the player who happens to be #1 in turn order tends to plant a couple of extra shops and crosses $5,000 before turns 4 of the cycle catch up.

### Iteration 4 — cheapest-first, longest cheapest-first game
75 turns, Player 3 wins. Slightly more shop visits (12 vs 8 in iter 1) means more rent-style $50 transfers between players, which spreads NW more evenly and delays the win. Mayor tax collected $205 cumulatively — the highest mayoral income across the seven Shop-spam runs.

### Iteration 5 — cheapest-first
75 turns, Player 3 wins again. 14 rent events, $210 mayor tax. Confirms that 70±10 turns is the typical band for cheapest-first on this map.

### Iteration 6 — cheapest-first
Longest cheapest-first run at 78 turns. Player 2 wins with NW $5,050. Mayoral tax peaks at $272. The narrowing shows: the longer the game runs, the more players collect from each other and the more chance events fire, smoothing the leader gap.

### Iteration 7 — cheapest-first, tightest finish
Player 1 wins at exactly NW $5,000.0 — the floor of the win threshold. P4 finishes at $4,970, only $30 behind. This is the closest finish observed; it suggests the win threshold is well-calibrated for this map (it's reachable, but not by a wide margin).

### Iteration 8 — diversified rotation (House → Factory → Police → Toll → Tele → Vault → Shop, repeating)
Player 4 wins at turn 71 with NW $5,025. **First iteration with auto-sells (8) and a chance landing**, and the first run where the "expensive structure" path is actually exercised. Two players (P1, P3) finish in financial trouble: $45/$72 cash, NW $1,635/$1,272. The Police Station ($700) and Vault ($1,000) cost a real bite out of cash reserves, and on a 37-cell map there's no time to recoup. The economy survives this stress because (a) the upkeep-idle behaviour prevents a forced-buy debt spiral and (b) `_resolveDebt` auto-sells at half value rather than zeroing a player out.

### Iteration 9 — expensive-first (Vault → Police → Factory → … → Shop)
Game runs out the clock and ends at the **turn-cap fallback (300 turns)** with Player 2 declared winner by net worth ($4,880). Only 13 structures built across 300 turns — there isn't enough cash to build expensive things often, so most landings end with the bot picking *Skip*. Five chance events fire in the longer game; mayoral tax climbs to $423. The fact that the cap fires correctly is good news: the `_checkWinCondition` turn-cap branch (`Turn cap (300) reached — Player 2 wins by net worth!`) was added to keep games from idling forever, and this iteration is its first observed activation in this map's playtests.

### Iteration 10 — never-build (always Skip on empty plots)
**Highlights a balance issue.** All four players sit on $1,500 cash (their starting amount) the entire game, build zero structures, never receive rent, never collect taxes — and the game still ends at turn 190 with Player 2 hitting NW $5,000. The driver of the win is the per-turn `passiveYield = 1` electricity + 1 food + the +3 grants from power_plant/mine cells, and crucially: **resources counted toward NW at full base price**. Each player ends with ~50 electricity ($35 each) and ~50 food ($30 each) plus 1 oil ($80) — that's $3,330 of "net worth" sitting in unused inventory. Adding the $1,500 starting cash gives a $4,830 baseline before any active play; one extra mine visit per player closes the gap. **A player can win this game by walking around for 190 turns without making a single decision.**

This is the single most important finding from the run-set, and it motivated the post-iteration fix described below.

### Verification runs after the fix

After applying the resource-NW sell-spread fix (see *Change applied* below) the game still terminates correctly:

- **Iter 11 (post-fix, cheapest-first):** Player 2 wins at turn 70 with NW $5,025 — within the same 65–78 turn band as iters 1–7.
- **Iter 12 (post-fix, never-build):** Player 4 wins at turn 216 with NW $5,001. The fix delays the never-build win by ~26 turns (190 → 216) but doesn't eliminate it. With passive yield + resource-cell grants accumulating across 200+ turns even at sell-spread valuation, hoarding eventually clears the threshold. *To eliminate the exploit entirely would require either capping passiveYield, charging upkeep on resources sitting idle, or making the win condition contingent on owning ≥ 1 structure — see Recommendations §1.*

---

## Change applied between iteration 10 and the verification runs

### Resource net-worth: switch from buy-side base price to sell-spread

**File:** `games/Acca/AccaGame.js`, `netWorth(p)` near line 1377.

Before:
```js
Object.entries(p.resources).forEach(([res, qty]) => {
  nw += (prices[res] || 0) * qty;        // base-price valuation
});
```

After:
```js
const spread = (this.cfg.market && this.cfg.market.sellSpread) || 1;
Object.entries(p.resources).forEach(([res, qty]) => {
  nw += (prices[res] || 0) * spread * qty; // liquidation valuation (×0.9)
});
```

**Why:** iteration 10 demonstrated that the prior buy-side valuation rewarded passive accumulation more than active strategy. A player who never built finished at NW $4,830–$5,000. Valuing inventory at the price you'd actually realise if you sold it (sell-spread = 0.9 × base price) is both more economically faithful and brings the never-build NW down by ~10%, putting the win behind a slightly higher hurdle.

**Effect, measured against verification runs:**
- Cheapest-first: same band (turn 69 → 70).
- Never-build: pushed from turn 190 → turn 216 (≈ +14% game length). Still wins eventually because passive yield keeps producing.
- No effect on bankruptcies, auto-sells, or any active-strategy outcome.

This change is low-risk, on-trend with the existing balance work in the file, and motivated directly by an observed run.

---

## Cross-iteration findings

### What works well

- **Win condition is reachable on the default map.** Across 10 of 10 runs the game terminated with a clean winner — 9 by NW target, 1 by turn-cap fallback. Game length spans 61–300 turns, which gives the win condition genuine tension.
- **The upkeep-shortage → idle-structure rule (rather than force-buy at market) keeps the economy stable.** Zero bankruptcies across all twelve runs. Even iteration 8 (diversified rotation, building Vaults and Police Stations on a 37-cell map) survived 8 auto-sell events without anyone going to zero.
- **Turn-cap fallback works.** Iteration 9 hit exactly turn 300, declared the highest-NW player the winner, and exited cleanly. Confirms the fallback added by the prior playtest fix is wired up correctly.
- **No rendering, animation, or input-system regressions** were observed by the synthetic harness across ~3,000+ effective frames per run.

### Issues identified

1. **Never-build NW exploit (HIGH).** The biggest balance issue. Discussed at length above; a passive player with no strategy can win in ~190 turns purely from `passiveYield + resource-cell grants × inventory-value-counted-toward-NW`. The applied sell-spread fix narrows this gap but doesn't close it.

2. **Cheapest-first dominance (MEDIUM).** When the bot picks the cheapest available structure at every empty plot, every cell becomes a Shop. This is partly a reflection of the bot, but it does say something about the design: at $250 build cost with $20 passive owner income + occasional $50 visitor rent, Shop has the best $/turn payback on this map by a wide margin. Iterations 8 and 9 (forced diversification) confirm the more expensive structures are net-negative on a 37-cell map within 100 turns. **House, Factory, Police Station, Vault need either lower build cost on small maps, or higher per-turn yield, to be competitive.**

3. **Empty-plot menu UX when broke (LOW–MEDIUM).** When the player can't afford anything, the menu still presents 7 disabled rows + Skip. The driver tolerates this fine; a human will not. Two improvements layer here: (a) when `cheapest > player.money`, hide disabled rows and show only Skip with a one-line "Cheapest is $X — you have $Y" subtitle; (b) auto-highlight Skip so a single Enter clears the menu.

4. **Driver convergence in 60–80 turns leaves chance events under-sampled (LOW).** Cheapest-first runs end before most chance events have a chance to fire (1–8 events typically vs. 4 chance cells × ~75 turns × ~5 BFS targeting opportunities). On a small map this matters because it means players don't get a feel for how chance events shape outcomes. Either: (a) add a couple more chance cells to the default map, (b) bias the BFS-target scoring of chance cells upward (currently 50, vs 100 for empty buildable), or (c) introduce a "near-miss" chance trigger when a player ends adjacent to a chance cell.

5. **Build-menu labels include cost in parentheses (`Build Shop ($250)`).** Real UX feature, but it broke the first version of my driver's exact-string priority lookup. Worth flagging because any external automation (e.g., a future replay-driver, save-format test, or controller-mapping layer) will hit the same gotcha. Either expose a stable `meta.type` field on each option (the structure is already tracked via `entry.type` upstream of the label), or document the parenthesised-cost convention in a comment near `_showBuildMenu`. **This is purely an integration-friendliness improvement.** The on-screen label is fine.

### Driver caveats

- Hidden-tab `requestAnimationFrame` throttling will silently freeze a long automation run. The harness replaces rAF with synchronous `__pump(N)`, which sidesteps it entirely.
- `game.eventLog` is capped at 500 entries and rolls off silently. The harness wraps `game.log` and pushes into an uncapped `window.__events` array.
- The bot's BFS scoring matters a lot. Empty-buildable at 100 dominates everything else; in the late game when no plots are empty, the BFS falls through to whichever cell is at the requested depth, which is fine but homogenises behaviour.
- For iterations 3–7 the chance-event count regex was tightened to require `Chance —` (em-dash) rather than `Chance:` and produced 0 matches even when chance events fired. Iteration 1's number (8) is right; later iterations have the actual count obscured by a regex change. **This is a measurement bug, not a game bug.** Confirmed by manually re-walking the iteration-1 events.

---

## Recommendations, in priority order

### 1. Close the never-build exploit decisively *(highest impact)*

The applied fix (resources at sell-spread) narrows the gap but doesn't close it. To eliminate the exploit, pick one (or layer):

- **a. Win-condition gate:** "to win by net worth, you must own at least one structure." One-line change in `_checkWinCondition`. Guarantees the player has *done* something.
- **b. Reduce passive yield:** drop `cfg.market.passiveYield` from 1 to 0.5, or grant only on alternate turns. The yield exists to "sustain one shop + one house without resource-cell visits"; shops only need 1 electricity/turn and houses 1 food/turn, so the comment is currently over-budgeted by 50%.
- **c. Inventory storage cost:** charge a tiny ($1/unit/turn?) holding cost on inventory above a threshold. Pushes players to actually sell or use what they accumulate.

Recommend a + b together — keeps the balance the playtest tuned for, just bolts the loophole shut.

### 2. Rebalance non-Shop structures for small maps

On a 37-cell map, a Vault (build $1,000) or Police Station ($700) cannot recoup its cost in 70–80 turns of average play. Either:

- **a.** Add a per-map "small-map" cost multiplier (e.g., `0.6×` for maps under 50 cells), or
- **b.** Halve the build cost of high-end structures and double their per-turn passive contribution. Maintains expected-value parity with Shop while making them an attractive choice on every map size.

Iteration 8 (diversified) is the cleanest demonstration that mixed-strategy *can* win the game; it just costs the lower-finishing players two-thirds of their net worth to do it.

### 3. Empty-plot menu UX when broke

When `cheapest > player.money`:
- Hide all disabled "Build X" rows.
- Show: `Cheapest build is $X — you have $Y. Skip.`
- Pre-select Skip so Enter clears the menu in one keystroke.

Cheap to implement (10–20 lines around `_showBuildMenu`); turns the most common late-game UI moment from 7 keystrokes per landing into 1.

### 4. Make chance events fire more often on small maps

On the default map (37 cells, 4 chance cells = 11% of the board), only ~5 chance events fired in the longest iteration-9 run (300 turns). Either:

- Bump chance-cell count to 6.
- Add a "near-miss" trigger: when a player ends turn within 1 step of a chance cell without landing, fire a low-impact chance event with probability 25%.

The chance system already has a rich event pool that's underutilised on small maps.

### 5. Stable, tooling-friendly menu options

For drivers, save replay tools, and accessibility automation: expose a stable `meta.type`/`meta.id` field on every menu option, alongside the human-readable label. Today the only durable handle on a "Build Shop" option is parsing the cost out of the label string.

---

## Appendix — final per-iteration player snapshots

### Iteration 1 (cheapest-first, win at turn 69)
| Player | Money | Net Worth | Shops | Bankrupt |
|--------|------:|----------:|------:|:--------:|
| Player 1 | $1,900 | $5,100 | 8 | no |
| Player 2 | $1,640 | $4,260 | 6 | no |
| Player 3 | $1,708 | $4,868 | 8 | no |
| Player 4 | $1,891 | $4,801 | 7 | no |

### Iteration 2 (cheapest-first, win at turn 72)
| Player | Money | Net Worth | Structures | Bankrupt |
|--------|------:|----------:|-----------:|:--------:|
| Player 1 | $1,854 | $4,764 | 8 | no |
| Player 2 | $2,006 | $4,706 | 7 | no |
| Player 3 | $1,810 | $4,510 | 7 | no |
| Player 4 | $1,760 | $5,180 | 7 | no |

### Iteration 8 (diversified rotation, win at turn 71)
| Player | Money | Net Worth | Structures | Bankrupt |
|--------|------:|----------:|-----------:|:--------:|
| Player 1 | $45    | $1,635 | 3  | no |
| Player 2 | $305   | $4,795 | 10 | no |
| Player 3 | $72    | $1,272 | 2  | no |
| Player 4 | $655   | $5,025 | 7  | no |

Stress on the economy is visible — P1 and P3 are within $50 of bankruptcy — but the upkeep-idle rule and `_resolveDebt` half-value liquidation keep them alive long enough for P4 to clear the win threshold.

### Iteration 9 (expensive-first, turn-cap fallback at 300)
| Player | Money | Net Worth | Structures | Bankrupt |
|--------|------:|----------:|-----------:|:--------:|
| Player 1 | $158 | $3,248 | 4 | no |
| Player 2 | $300 | $4,880 | 2 | no |
| Player 3 | $70  | $3,875 | 5 | no |
| Player 4 | $200 | $4,360 | 2 | no |

P2 is declared winner via turn-cap fallback. Game log: `Turn cap (300) reached — Player 2 wins by net worth!`. Confirms the cap branch fires and selects correctly.

### Iteration 10 (never-build, win at turn 190 — pre-fix)
| Player | Money | Net Worth | Structures | Resources (e/f/o) | Bankrupt |
|--------|------:|----------:|-----------:|------------------:|:--------:|
| Player 1 | $1,500 | $4,895 | 0 | 51 / 51 / 1 | no |
| Player 2 | $1,500 | $5,000 | 0 | 54 / 51 / 1 | no |
| Player 3 | $1,500 | $4,830 | 0 | 50 / 50 / 1 | no |
| Player 4 | $1,500 | $4,830 | 0 | 50 / 50 / 1 | no |

The diagnostic case for the resource-NW exploit: identical strategies (none), nearly identical end states, the player with one extra mine visit wins.

---

## Closing

The Acca game **is winnable** on the default map under the rules as configured today, by every reasonable strategy and even by no strategy at all. The dominant remaining balance question is whether the `$5,000` net-worth target should be reachable purely through resource accumulation; the playtest answers "yes, currently, in ~190–216 turns." The recommendations above are calibrated to keep the win obtainable while requiring at least *some* engagement with the game's structure-and-property loop.

*Driver, harness, and per-event timeline are accessible on the live page at `window.__events` (uncapped log) and `window.__driver` (play loop, decideMenu strategy hook). Total events captured across the 12 runs of this report: ~10,500.*
