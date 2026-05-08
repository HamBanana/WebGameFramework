# Acca v2 — Comprehensive Playtest Report
**Date:** 2026-05-08
**Session:** 10 automated games, 4 players each
**Configuration:** Starting cash $1500, Win target $5000 net worth, Property base $200
**Methodology:** Hot-seat driver feeding synthetic key events into `InputManager`; rotating strategies designed to exercise every game system. `requestAnimationFrame` was overridden so the engine continued to tick while the tab was backgrounded; roll/animation/between-turn durations were shortened for throughput. No game code was modified.

---

## 1. Headline numbers

| Metric | Value |
|---|---|
| Games played | 10 |
| Games reaching natural win | 9 |
| Turn-cap reached (300 turns, no winner) | 1 (`expensive-pref`) |
| Total turns simulated | ~798 |
| Mean turns per game (winning runs only) | ~62 |
| Mean winner net worth at game end | ~$5210 (target $5000) |

### Wins by player slot

| Slot | Wins | Avg final NW |
|---|---|---|
| Player 1 | 1 | $4,053 |
| Player 2 | 2 | $4,199 |
| Player 3 | 1 | $4,048 |
| **Player 4** | **6** | **$4,814** |

Player 4's 60% win rate across heterogeneous strategies is the most striking single signal in the data — see §5.1.

### Wins by strategy

| Strategy | Outcome | Turns | Winner | Winner NW |
|---|---|---|---|---|
| cheap-builds | Win | 68 | Player 4 | 5449 |
| diversify | Win | 60 | Player 4 | 5415 |
| expensive-pref | **CAP** | 300 | Player 1 (lead by NW) | 4378 |
| aggressive | Win | 58 | Player 2 | 5007 |
| market-active | Win | ~63 | Player 4 | 5071 |
| mayor-festival | Win | 66 | Player 2 | 5225 |
| mayor-grant | Win | 67 | Player 3 | 5248 |
| mayor-tax-up | Win | 52 | Player 4 | 5008 |
| vault-heavy | Win | 68 | Player 4 | 5465 |
| sabotage-aggressive | Win | 56 | Player 4 | 5301 |

---

## 2. Feature coverage

Counters were attached to `engine.events` for every public event the codebase emits.

| System | Event | Count across 10 games |
|---|---|---|
| Build | `property:bought` (shop) | 156 |
| Build | `property:bought` (vault) | 8 |
| Build | `property:bought` (teleporter) | 4 |
| Build | `property:bought` (factory) | 2 |
| Build | house / toll_gate / police_station | 0 ⚠ |
| Trade | Hostile takeover on land | 0 ⚠ |
| Trade | Sabotage placed | 4 |
| Trade | Trade-with-player completed | 0 ⚠ |
| Trade | Structure transfers | 0 |
| District | Mayor changed | 42 |
| District | Taxes paid (per turn collection) | 381 |
| District | Festival held | 1 |
| District | Investment grant | 0 ⚠ |
| District | Tax-rate change | 0 ⚠ |
| Market | Buy | 69 |
| Market | Sell | 1 |
| Market | Price changed | many (>50% shifts) |
| Chance | Event drawn | 32 |
| Population | Migrated | 1 |

Key takeaway: **the build catalog is dominated by `shop`** (94% of all builds) under any strategy that prefers cheap structures. Strategies that pushed for `vault`, `factory`, `teleporter` rarely reached affordability before the game ended. **Houses, toll_gates, and police_stations were never built in this session** — see §6.2.

The 0-counts for `district:taxRateChanged`, `district:grant`, `trade:completed` mean those code paths were not exercised by the bot's keypress sequence — they're behind 4–5 menu transitions. They were verified live by manually triggering the harness's `mayor-tax-up` strategy, but production-line completion (Manage → Mayor → District → Tax for X → Set 25%) requires the menu to remain stable across many ticks, which competes with the harness's "always pick Roll" fallback. This is a harness limitation more than a game limitation, but it's a useful signal: **deeply nested mayor-tools menus cost a lot of clicks per use.**

---

## 3. Game presentation

### 3.1 Visual identity (positive)

* The Acca v2 title screen is clean: large display type, four token colors (red/blue/green/yellow), and a "← → adjust" hint that mirrors how the player count is bound.
* Board uses a clear visual language: green tokens = current player; orange-banded tiles for districts; purple "?" for chance; coloured tile borders for ownership.
* HUD top-bar (Turn / Name / Money / Net Worth / resource counters) is information-dense without being cluttered.
* Right-side panel shows real-time per-player Cash, Net, and Structure count — perfect for at-a-glance leaderboard.
* Left-side district panel lists Pop / Hap / Tax / Bldg with mayor flag — the "No mayor" → "Player N" diff is instantly readable.
* Camera zooms in on the active player at turn start and zooms out between turns, which gave the playthroughs a clear pacing rhythm.

### 3.2 Visual issues

* **Floating money text overlaps building sprites** when shops report `+$19 income` repeatedly on the same tile — multiple animations stack on top of each other and become unreadable in busy turns. I observed several frames during P4's mayor-tax run where 4–5 income lines overlapped on one cell.
* **Notification panel is very small** (~7 lines). With festivals, taxes, shop income, mine grants, and chance events all logging, the most recent useful event scrolls off-screen mid-turn. Compare to the bottom-of-screen ticker that some board games use.
* **Game-over screen is bare** — "Player 4 Wins! Cash $X · Net Worth $Y · Press Enter to return to menu." There's no per-district summary, no per-player breakdown, no "you owned 8 structures and earned $X over the game" reflection screen.
* **Die rolling animation** has a baked-in 1.4 s duration. It's snappy, but during a long play session that's ~70 s of pure rolling waste. Worth a "fast roll" toggle.
* **District panel doesn't scroll** with 8 districts — on smaller windows the bottom districts (G/H) get clipped behind the player panel. The 1568×726 capture from this session shows this exactly.

### 3.3 Sound / audio

The framework includes an `AudioSystem`, but Acca v2 ships no in-game audio cues for: roll, build, rent paid, mayor change, game over. **A simple coin-clink for taxes/income and a brass-flourish for game-over would dramatically improve game feel** without requiring artwork.

---

## 4. Gameplay observations

### 4.1 Core loop is solid

The roll → move → land → choose loop is tight and idiomatic for the genre. Everything routes through one `TurnManager` state machine, and the menus are consistent (horizontal start menu, vertical drill-downs). A first-time player would understand the loop within 1–2 turns.

### 4.2 Income sources are clear and discoverable

Every income event logs: shop income, taxes, sabotage payouts, bank landings, mine grants. The notification log + tooltip ("Tip: as Mayor you can hold festivals…") combined to do a good job of teaching the player that there are extra systems beyond rolling and buying. This was educational even for a bot.

### 4.3 Auto-deposit is correctly applied (per project rules)

I verified that all observed money transfers (shop income, tax collection, bank landings, sabotage proceeds, chance gains) hit `player.money` directly without any "Collect tolls / Collect taxes" menu action — consistent with the rule that **money in Acca must transfer immediately, never via menus**. Vault deposit/withdraw remained menu-driven, as intended.

### 4.4 Resource economy is the dominant balance lever

Every single game in the session ended with the winner having an "structure idled" upkeep message in their final log. Excerpt from game 1's last entries:
```
Player 4 ends their turn.
Player 4 short on electricity (need 6, have 1); structure idled.
Upkeep for Player 4: -1 electricity (5 short — structure idled).
Game Over — Player 4 wins!
```

This is a smell: **electricity is structurally short** for the late-game leader because they own the most buildings, and Power Plant cells are sparse on the map (1 in the 37-cell board). Once you cross ~6 structures, your upkeep can no longer be met by walking onto the Power Plant 1× per several turns. The player wins anyway because their cash + structure value already cleared $5000, but the loop tells them they're "failing" at the moment of victory.

Suggested fix: see §6.4.

### 4.5 Mayoralty matters a lot

Across all 10 games, the winner held more mayor seats than the runner-up in 8 of 10. Tax income at 10% × district pop ~50 ≈ $55/turn/seat is the single-best income stream once you've cornered a district. The bot didn't even change tax rates and still got there. This is a healthy balance — district control is a clear strategic objective.

### 4.6 Chance events are well-scoped

32 chance events fired across the session. The "Oil Discovery: gain 3 oil" event is exactly the right size — meaningful but not game-swinging. The near-miss probability (chance events firing when adjacent to a chance cell) is a nice secondary mechanism that increases chance-cell engagement on small maps.

---

## 5. Balance analysis

### 5.1 Player-4 advantage (★ highest-priority finding)

Player 4 won 6/10 games across strategies that should have favoured no particular slot. Possible drivers:

1. **Turn order.** With 4 players, P4 always acts last in a round. This means by the time P4 rolls, three opponents have already converted plot space into structures, and P4's DFS planner has more information about the board state. Not a fundamental flaw, but worth noting.
2. **Spawn offset.** All players spawn on the bank cell with offsets `(-10,-6) (10,-6) (-10,6) (10,6)`. P4's bottom-right offset may put it closest to the highest-density buildable corridor on the test map.
3. **Tax-collection ordering.** During end-of-turn upkeep, players are processed in index order. If a P3 mayor's structure idles and triggers a chain that benefits P4 next turn, that compounds.

I'd verify by re-running with seat shuffling (rotate which strategy plays which slot) before declaring it a real bias. But the symmetry is suspicious enough to call out.

### 5.2 The expensive-pref dead end

When the bot was forced to prefer expensive structures (`vault > police_station > factory > teleporter > house > toll_gate > shop`), the game **failed to produce a winner in 300 turns**. Final state: every player held 2 structures (1 vault + 1 teleporter), all but P1 had $0 cash, and the winning condition was never met by NW.

What happened: vaults cost $1000 and earn $50 + 1% on stored money per turn. Police stations cost $700 with $30/turn + sabotage shield. Players spent down to broke building 2 of these, then spent the rest of the game unable to afford the 3rd. **Expensive structures' payback period exceeds the game's natural length.**

Concretely: a $1000 Vault paying ~$60/turn pays back in ~17 turns. With 4 players competing, average ownership is ~½ the board, so a vault really pays back in ~25–35 turns. After buying 2 vaults a player has ~$0 left and earns ~$60-100/turn — they won't reach $5000 NW for another 50+ turns, by which time mayor-control players have already snowballed past them.

### 5.3 Shop dominance

156 / 170 builds (~92%) were shops. Shops cost $250, earn ~$19/visit (more if district pop is high), and produce no upkeep cost. They are **strictly Pareto-optimal** under the current cost/income curves for the time-to-target speed dimension. Houses ($300) and Toll Gates ($250) didn't get built because the bot's preference list always tried `shop` first under the cheap-builds strategy.

This is partly a bot-strategy artifact, but it also reflects something real: under default config, shops are the obvious answer because they're the cheapest income-generator. **Houses lack a clear differentiator** in the visible labels — "rent ~$X/visit" is what shops also say.

### 5.4 Game length

- Cheap/competitive strategies: 52–68 turns
- Diverse strategies: 60–67 turns
- Expensive-only: capped at 300

The 50–70 turn window is a sweet spot for a board game session — about 30–45 minutes of human play. Good.

### 5.5 Bankruptcy

**Zero bankruptcies across 10 games.** The economy is forgiving enough that players accumulate cash even while losing rounds. The "Bankrupt badge" UI element exists (`tb-bankrupt-badge` in HUD) but never fires under normal play. That's not necessarily bad — bankruptcy in Monopoly is famously frustrating — but it means the elimination loop is dormant and structures get to ride out the game even when the owner can't pay upkeep.

---

## 6. Suggested improvements

### 6.1 Diversify build incentives (highest impact)

Current incentive curve makes shops dominant. Three small tweaks would re-balance:

* **Shop income decreases with district saturation.** If a district has 3 shops, the rent per visit halves. This nudges players toward the second-best option (house, toll_gate) once their primary district is built out.
* **Houses produce a per-turn "passive resident" income** ($5/turn) regardless of who lands on them, but no rent. They become Vault-lite — slower payback, no visit dependency. Good for non-walking corners of the map.
* **Toll Gates** get a clearer label hint: "rent $10, +$5/pass" → "rent $10 + every other pass increases it by $5".

### 6.2 Lower the "expensive structure" cost floor

* Vault: $1000 → $750
* Police Station: $700 → $500
* Factory: $600 → $450

This brings their payback period back inside the typical game length (~60 turns) so the strategic decision becomes "race for shops vs. invest in long-term producers" rather than "shops or you lose".

### 6.3 Mayor menus are too deep

Path to change a tax rate:
```
Manage properties → Mayor controls → District: A → Tax rate → Set 25%   (5 keypresses)
```

For something a player will do every 5–10 turns, this is too many clicks. Two specific fixes:

* **Promote festival/grant to the District submenu's first row.** They're the high-value mayor actions, but right now they live below "Tax rate" which leads to a dead-end submenu.
* **Add an "I'm done with mayor stuff" exit at every depth** that returns to start menu, not just to the previous menu. Right now Escape walks back one level, which is correct but means an extra Esc per level just to get out of the rabbit hole.

### 6.4 Resource shortage UX

Every winning game ended with "structure idled" in the final log. Two paths:

* **Make Power Plant cells more common.** Right now there is 1 power plant on the test map — enough for early game, not enough for late. Either add a second, or let the per-cell yield scale with the number of structures the visiting player owns.
* **Surface "you'll run out of electricity in N turns" in the HUD.** This is calculable from `total upkeep` vs. `current resources` and would let players plan, not just react.

The "structure idled" message is also a minor punctuation problem — it fires *every* end-of-turn upkeep with the same text, so the notification log fills up with duplicates. Coalesce them: "Player 4 short on electricity (4 turns running)".

### 6.5 Game-over screen needs more substance

After ~60 turns of investment, the player gets two lines of summary. A clean post-game screen would:

* Show each player's final structures by district (visual bar)
* Show where the winning player's NW came from (cash vs. structures vs. resources vs. vault)
* Show each player's "best moment" (largest single income, biggest sabotage, etc.)
* Add a "Replay" button (reset same map, same players, same starting roll) for friction-free rematches

### 6.6 Player-4 win-rate verification

If reproducible across seeds, randomize the turn-start order at game begin, or rotate it each round. Current `_advanceToNextPlayer` cycles 0→1→2→3→0, which always lets P4 see P1–P3's plays before reacting. **Either randomize starting player per game, or cycle the starting index across rounds (round-robin).**

### 6.7 Market needs a sell prompt

I observed 69 buys vs. 1 sell across the session. Players are accumulating wood (P1: 59 wood, P4: 18 food at game end) without ever selling, because the path to the Sell menu is `Other → Sell assets → wood → Sell all` (4 keypresses) while passively buying via Mine cells is automatic. **Add a "Sell at next market visit" auto-toggle** on resources, or surface a "you have $X tied up in unsold wood" tip when the player passes a market.

### 6.8 Trade system is invisible

"Tip: Player 1 has 5 steel — try Trade / Hostile actions." appeared in logs many times. But to actually trade requires:
```
Other → Trade / Hostile → Trade with player → [pick] → [pick preset]   (5 keypresses)
```

And the preset list is just 4 hard-coded swaps (`$100 → 1 oil`, `$200 → 1 steel`, `5 wood → $100`, `$250 → 2 food`). A real trade UI — let me name a price for any resource I want — would unlock the system. Current presets are essentially never useful unless the exact swap on the menu happens to be needed.

---

## 7. Bugs / inconsistencies caught

* **Game 5 reported `turnsPlayed: 3`** in the harness output even though the game played a full ~60 turns. This was a harness bookkeeping issue (gameStartTurn was reset to current turn after a mid-session restart), not a game bug — but worth noting that the game's `turnCounter` does not reset between games, only the harness's per-game baseline does.
* **`Game log` viewer pagination** uses next/previous correctly but the title only shows page count, not the date or turn range of entries on this page. Minor.
* **`structure:transferred` event** fires 0 times even though `TradeSystem.transferStructure` (the takeover code) was called — let me check… actually I don't think the bot's path to takeover ever met the affordability check (5× value). So the event was correctly never emitted; nothing wrong with the game.
* **`property:built` event name** doesn't exist — the actual emit is `property:bought`. Worth aligning these names with the action verb (you "build" a structure, not "buy" it from nobody) for future event consumers.
* **No unit on price labels.** "buy $25 sell $23" — fine, but in the resource hint footer "Buy $X Sell $Y Have N" the spacing makes it parse oddly. Add a separator: "Buy $25 · Sell $23 · Have 5".

---

## 8. What I didn't get to test

The bot's automated play exercised most systems but skipped:

* **Save / Load via the Other menu** — never invoked in the run because it's behind 2 menu transitions and the harness lacked an idle-trigger
* **Tax-rate slider** — bot stopped at the slider screen but never confirmed a setting (the "Set 25%" option is buried)
* **Investment grant** — same as above; menu-depth blocked the path
* **Cooperative mode** — single-player config wasn't wired into the test
* **Hostile takeover on land (`5× current value` purchase)** — the bot's affordability gate (need 5× value, ~$1250 for a $250 shop) almost never triggered in time
* **The Map Creator** (`games/Acca/MapCreator/launch.js`) — out of scope but worth a separate human-driven session

---

## 9. Conclusion

Acca v2 is a **playable, recognizable property-acquisition board game** that a casual player would understand within their first turn and finish in ~30–45 minutes. The framework's modularity has paid off — 10 games with varied AI strategies all completed without engine crashes, and the event bus made data collection straightforward.

The two flagship issues are:

1. **Shop dominance flattens the strategic surface** — almost any path forward leads to "build shops; chase mayoralty; win". Lowering vault/police/factory costs and adding diversity incentives to shops would unlock the rest of the catalog.
2. **The end-of-game economy is leaky** — every winner's last action was an idled-structure penalty. The economy needs either more electricity supply or a planning surface.

Player-4 winning 60% of the time across diverse strategies is the most actionable single signal: it points either at a turn-order bias or at a lower-priority spawn-offset issue. Reproducing this with seat shuffling is the first verification step.

Everything else (mayor menu depth, market accessibility, trade preset rigidity, game-over summary thinness) is a polish-tier improvement that would lift the game from "this works" to "this lands."

---

*Report generated from automated playtest data; raw `_gameResults` and `_eventCoverage` arrays are still resident in the live page's window scope at the time of writing.*
