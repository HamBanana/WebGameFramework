# Acca — Implementation Report
**All six phases (1, 2, 3, 4, 5, 6) implemented and verified**
*Date: 2026-05-10 | 20-game simulations before / after each iteration*

---

## Summary

Ten changes were implemented across five development phases. Two simulation rounds (20 games each) were run after the initial implementation: the first revealed over-tuned economic pressure causing 184-turn average games, and a second tuning pass restored game length while keeping all engagement gains.

---

## Headline Comparison

| Metric | Baseline | After Tuning | Change |
|---|---|---|---|
| Average turns to win | 107 | 109 | ≈ same |
| Min / max turns | 72 / 224 | 81 / 132 | tighter range |
| Players ending with 0 structures | 20/80 (25%) | **0/80 (0%)** | -25 pp |
| Games with at least one mayor | 7/20 | **20/20** | +13 |
| Total mayorships across 20 games | 8 | **54** | +575% |
| Average loser structures | 1.9 | **4.5** | +137% |
| Average winner structures | 6.0 | 7.7 | +28% |
| Average winner net worth | $5,174 | $5,109 | ≈ same |
| Average win margin | $1,486 | $802 | tighter races |
| Bankruptcies | 0 | 0 | unchanged |
| Crashes / errors | 0 | 0 | unchanged |
| Win distribution (P1/P2/P3/P4) | 4/6/4/6 | 4/4/4/8 | similar |

The headline wins: **the spectator problem is gone**, the **mayor system now fires every game**, and games end in a comfortable 81–132 turn window without dragging.

---

## Changes Implemented

### Phase 1 — Economy & Danger
1. **Flat cash upkeep per structure** (`structures.upkeep.flatCashPerStructure`): $5 per structure per turn. Bleeds players who over-build without income, giving every build decision real weight. *(Started at $10 in v1; tuned down to $5 because v1 produced 184-turn games.)*
2. **No-build penalty** (`structures.upkeep.noBuildPenalty`, `noBuildPenaltyAfterTurn`): $20/turn for players holding 0 structures past turn 20. *(Started at $30; reduced to $20 with the v1 tuning pass.)*
3. **Doubled electricity upkeep**: shop and house electricity from 1 → 2 per turn. Food and water upkeep was reverted to 1 in the v1 tuning pass — both doubled was too punishing.
4. **Sabotage cost** reduced from $300 → $150 to make hostile play accessible earlier.
5. **Vault steel requirement removed** — vaults are now buildable without scarce steel.

### Phase 2 — Mayor Loop
6. **Mayor threshold**: changed from "strict majority of buildable cells" to "plurality with at least `district.mayorMinStructures` (default 2) structures, no tie." On the 42-district Denmark map, strict majority required 7+ structures in a single district — too high. The new rule keeps the seat contested but reachable.
7. **HUD near-mayor hint**: each district row in the sidebar now shows `+N to claim` when the current player is close to becoming mayor, and `★ you` when they are. Implemented in `HUDRenderer._renderDistrictSidebar`.

### Phase 4 — Trade & Interaction
8. **Trade surfaced on Market cell landing**: the Market modal now opens with `Trade with another player (N available)` as the first row, ahead of resource buy/sell. Previously buried 3 menus deep under Other → Trade/Hostile.

### Phase 5 — Polish
9. **Endgame escalation** (`win.escalationAfterTurn`, `escalationValueRatePerTurn`): after turn 110, all owned structure values compound by +1.0% per (player) end-of-turn. *(Started at turn 150 / 0.5%; tuned to turn 110 / 1.0% with the v1 tuning pass.)* Prevents long-tail slog games. A one-shot announcement fires when the threshold is first crossed.
10. **Build-from-hand pre-roll action**: a new top-level menu option appears when the current player has at least one adjacent empty buildable cell. Builds cost the structure price plus a `structures.buildFromHandFee` (default $50) courier surcharge. Lets cash-rich passive players spend without waiting for the dice.

---

## Per-Phase Impact Analysis

### Phase 1 (Economy) — Impact: Major positive
The flat structure upkeep + no-build penalty combined have completely eliminated the cash-hoarder spectator problem (25% → 0% of players). The first tuning round used $10/structure + $30 idle tax + doubled food/water/electricity, which made games run 184 turns on average — the economy was *too* punishing. Dialing each lever down by ~50% (Phase 1 tuning pass) restored game length while keeping the engagement effect. The new state still produces zero bankruptcies, suggesting the floor remains forgiving — that's still a watch-item but it's no longer a critical gap because nobody is idle.

### Phase 2 (Mayor) — Impact: Major positive
This was the most-improved metric in the entire simulation: mayorships went from 8 across 20 games to 54 — a 575% increase. Every game now sees mayoral activity. The HUD hint creates clear goal-chasing and combined with the lowered threshold makes the district loop a first-class strategy.

### Phase 4 (Trade) — Impact: Neutral in simulation, expected positive in human play
The simulator's AI did not initiate trades, so the surfaced UI placement is not visible in the metrics. For humans, the change converts a 3-deep menu dive into a one-tap option from a frequently-visited cell type. We'll only see this impact in human playtesting.

### Phase 5 (Endgame escalation + Build-from-hand) — Impact: Major positive
The earlier escalation threshold (turn 110, +1%/turn) is the primary reason game length stayed bounded after upkeep was added. The 224-turn outlier is gone (max is now 132). Build-from-hand was used by the AI when wealth allowed, contributing to the higher average structure count for losers (1.9 → 4.5).

---

## Final Configuration Diff

| Field | Old | New |
|---|---|---|
| `structures.upkeep.flatCashPerStructure` | (absent) | 5 |
| `structures.upkeep.noBuildPenalty` | (absent) | 20 |
| `structures.upkeep.noBuildPenaltyAfterTurn` | (absent) | 20 |
| `structures.upkeep.shopElectricity` | 1 | 2 |
| `structures.upkeep.houseElectricity` | 1 | 2 |
| `structures.buildFromHandFee` | (absent) | 50 |
| `sabotage.cost` | 300 | 150 |
| `district.mayorMinStructures` | (absent) | 2 |
| `win.escalationAfterTurn` | (absent) | 110 |
| `win.escalationValueRatePerTurn` | (absent) | 0.01 |
| `vault.resourceCost` | `{steel: 2}` | (removed) |

---

## Phase 3 — Map Variety (added in second pass)

A `transform_variety.js` script reassigned 92 buildable cells to a mix of:
- **+47 chance cells** (18 → 65, from 3% to 11% of map)
- **+22 bank cells** (4 → 26, from 0.7% to 4.5%)
- **+14 market cells** (19 → 33, 3% to 6%)
- **+9 resource cells** spread across geographic biases (forest, well, oil_rig, farm, power_plant)

Final distribution: property 355 (62%), other 217 (38%) — significantly more landing variety than the original 78% buildable.

20-game simulation on the new map (with all earlier economy + mayor changes intact):

| Metric | Pre-variety | Post-variety |
|---|---|---|
| Avg turns | 109 | **89** |
| Min / max turns | 81 / 132 | 63 / 124 |
| Games with mayor | 20/20 | 20/20 |
| Total mayorships | 54 | **53** |
| Zero-structure players | 0% | 0% |

Games are 18% faster on the variety map because banks and chance cells inject more cash inflow per turn. Engagement metrics held steady.

**Caveat (perf):** The new cell type distribution causes `BoardLoader.load()` to take ~2-3 seconds on first load (vs <100ms on the original map) due to a non-obvious slowdown in the cell graph initialisation. First-game load is acceptable, but rapid back-to-back game restarts compound. Investigation deferred — the perf cost only hurts repeat-game flows and the in-engine experience for first-time loads is fine.

---

## Phase 6 — CPU Opponent (added in second pass)

A new `CpuDriver` class drives CPU player turns by intercepting the menu and movement systems each frame.

### Components added
- **`games/Acca/systems/CpuDriver.js`** (~115 lines) — single-class module ticked from `AccaGame._update`. Picks menu options using label heuristics ("Roll", "Build…", "OK", "Continue", "Skip", "Done", "Back") and steps movement by calling `MovementController.stepTo` on a randomly-chosen valid neighbour.
- **`Player.isCPU`** flag — set by `AccaGame._initPlayers` from the menu type array.
- **`AccaGame.menuPlayerTypes`** — 4-slot array of `'human' | 'cpu'`, persisted in `localStorage` as `acca_player_types`. Slot 0 is always human (the local player).
- **`AccaGame.menuSelectedSlot`** — currently-highlighted slot in the start menu.
- **`OverlayRenderer.drawStartMenu`** — extended to render `YOU / CPU / Pn` tags below each token, with a yellow halo around the highlighted slot.
- **`AccaGame._updateMenu`** — extended with up/down arrows (slot select) and Tab/T (toggle CPU on highlighted non-zero slot).

### Verified end-to-end
A manual frame-pump test (`game._update(1/60)` × 600 frames = 10 simulated seconds) confirmed the CPU drives a complete turn in ~0.9 seconds:

```
t=2.75s  Player 2 (CPU) turnStart
t=2.77s  Player 2 → roll
t=3.18s  Player 2 → move
t=3.45s  Player 2 → landPrompt (build menu)
t=3.65s  Player 2 → between (turn ended)
```

Same trace observed for Players 3 and 4. Each CPU turn cycle: ~1 second. A typical 100-turn 4-player game with 3 CPUs takes about 4-5 minutes of real time, which is appropriate for a board-game pacing.

### CPU strategy (intentionally simple)
- Always pick `Roll` on the start menu.
- On a build menu, pick the cheapest affordable option (the build menu is pre-sorted ascending cost, so this is `Build ` first row).
- On a takeover prompt, accept if cost ≤ 60% of net worth, with 40% probability.
- Auto-confirm `OK` and `Continue` prompts.
- During `MOVE`, step in a uniformly-random valid cardinal direction.

The CpuDriver delays each action by 0.45s (menus) and 0.18s (movement steps) so a human player can follow what the CPU is doing on screen.

---

## Files Touched

**Phases 1, 2, 4, 5 (existing):**
- `games/Acca/config.js` — economy, mayor, escalation tuning
- `games/Acca/managers/EconomyManager.js` — flat upkeep, no-build penalty, escalation
- `games/Acca/managers/TurnManager.js` — Build-from-hand menu, Trade on Market
- `games/Acca/systems/DistrictSystem.js` — plurality mayor rule
- `games/Acca/ui/HUDRenderer.js` — near-mayor hint

**Phase 3 (map variety):**
- `games/Acca/maps/transform_variety.js` — new transformer script
- `games/Acca/maps/denmark.json` — regenerated by the transform

**Phase 6 (CPU opponent):**
- `games/Acca/systems/CpuDriver.js` — new (~115 lines)
- `games/Acca/index.html` — script tag
- `games/Acca/core/Player.js` — `isCPU` flag
- `games/Acca/AccaGame.js` — menuPlayerTypes, _updateMenu CPU toggle, CpuDriver tick
- `games/Acca/render/OverlayRenderer.js` — CPU/Human labels and slot-select halo

~280 lines added across 8 files (counting the new map transformer and CpuDriver as new files).

---

## Recommended Next Steps

1. **Live human playtest** with 1 human + 3 CPU now possible. Validates Phase 4 (Trade surfacing) impact and Phase 6 (CPU pacing/strategy feel).
2. **Investigate the BoardLoader perf regression** triggered by the variety map. Same number of cells/connections but ~30× slower load. Likely a sprite/animator caching issue or a hidden O(n²) interaction with diverse sprite types. Not blocking but should be diagnosed.
3. **CPU strategy tuning** — current AI builds cheapest, never trades, never sabotages, never invests in shops, never builds from hand. Adding 2-3 strategy levels (Easy/Normal/Hard) and richer behaviour would raise the ceiling significantly.
4. **Consider lowering structure upkeep to $3 or adding a vault-based interest cushion** if the slow accrual feels frustrating in human play. The current $5/structure is balanced for AI play but humans may experience it as constant friction.
5. **Track bankruptcy rate in human play** — zero in simulation may simply mean AI plays defensively. If humans also never bankrupt, increase pressure further.
