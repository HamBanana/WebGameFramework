# Acca — Implementation Report
**Phases 1, 2, 4, 5 implemented and verified**
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

## Phases Deferred

### Phase 3 — Map Variety (skipped this iteration)
Reducing buildable cell density from 78% → 50% requires editing the Denmark map JSON (572 cells) and reassigning ~150 cells to new flavour types. This is a substantive content task that should be done in a focused session with map-editor tooling. The current map is functional and the engagement metrics are now strong even on the over-buildable map.

### Phase 6 — AI Opponent (skipped this iteration)
The JavaScript playtest AI used in this verification can be the basis for an in-game CPU opponent. Wiring it through the turn-state-machine UI (rather than the direct economy calls used here) is a larger task that should be a deliberate session.

---

## Files Touched

- `games/Acca/config.js` — economy, mayor, escalation tuning
- `games/Acca/managers/EconomyManager.js` — flat upkeep, no-build penalty, escalation
- `games/Acca/managers/TurnManager.js` — Build-from-hand menu, Trade on Market
- `games/Acca/systems/DistrictSystem.js` — plurality mayor rule
- `games/Acca/ui/HUDRenderer.js` — near-mayor hint

No new files; ~150 lines added across the 5 files above.

---

## Recommended Next Steps

1. **Live human playtest** to validate Phase 4 (Trade) impact — the simulation can't measure it.
2. **Map variety pass** (deferred Phase 3) — the next biggest unlock for fresh-feeling games.
3. **Consider lowering structure upkeep to $3 or adding a vault-based interest cushion** if the slow accrual feels frustrating in human play. The current $5/structure is balanced for AI play but humans may experience it as constant friction.
4. **Track bankruptcy rate in human play** — zero in simulation may simply mean AI plays defensively. If humans also never bankrupt, increase pressure further.
5. **Add the AI as a CPU opponent** (deferred Phase 6) using the verified strategy from this report.
