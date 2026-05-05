# Acca — 4-Player Playtest Report

**Date:** 2026-05-03
**Session:** 50 turns, 4 hot-seat players (Red / Blue / Green / Yellow)
**Win condition (config):** $5000 cash on hand
**Outcome:** No winner after 50 turns. Final cash: P1 $530, P2 $840, P3 $460, P4 $510. Net worth: $2540 – $2880.

---

## TL;DR

The game runs end-to-end without crashing — the systems wire together, menus render, the dice rolls, players move, structures get built, and shop visit fees flow correctly. But the playtest surfaced one **map-data bug that disables an entire game system**, one **mayor-rule design issue that disables several more**, and a cluster of **UX rough edges** that would frustrate a first-time player. With small fixes, the game should feel substantially more alive.

---

## Critical issues

### 1. Three of four Chance cells are unreachable — the Chance system never fires

In the 50-turn session, **zero chance events were drawn** (`Chance` log entries: 0). Tracing why:

- `games/Acca/maps/default.json` defines four chance cells (ids 182, 183, 184, 185) and connects them with `direction: "forward"` (one-way) edges to/from non-adjacent buildable cells. Several of the chance cells sit in the corners (e.g. `182` at `(640, 0)`, while its only "incoming" edge is from cell `169` at `(768, 128)` — a diagonal jump).
- The framework's cell connectivity model only supports orthogonal neighbours via `cell.up / down / left / right`. Diagonal `from→to` edges silently get dropped or assigned to a single direction. After the runtime load, the in-degree of the chance cells is:
  - 182: 0 incoming (unreachable)
  - 183: 0 incoming (unreachable)
  - 184: 0 incoming (unreachable)
  - 185: 1 incoming (from cell 171, "left")
- Net effect: a player can step onto exactly one chance cell, only by approaching it from one specific direction. With strategic pathing favouring buildable plots, no player landed on a chance cell in 50 turns.

**Fix options:**
- Make every chance cell reachable from every adjacent grid cell — the map editor / loader should reject or auto-correct one-way edges that don't have a matching reverse edge.
- Or extend the connectivity model to support diagonal moves and make the renderer reflect that.
- Or relocate chance cells into the orthogonal grid where the existing 4-direction model works.

This is the single most impactful fix — chance events are clearly designed to be a major source of variance and player drama.

### 2. Mayor rule requires *total* district ownership — no mayor was ever assigned

`DistrictSystem.recomputeMayor()` (lines 67–91) only assigns a mayor when **every buildable cell in a district is owned by the same player**:

```
const newMayor = (allOwned && owners.size === 1) ? <that player> : -1;
```

In a 4-player game where players actively compete for plots, this is essentially impossible to achieve in normal play. After 50 turns with 28 structures built across 8 districts, every district shows `mayorIndex: -1` — including districts where one player owned 80% of the plots (e.g. District G: P1=4, P4=1).

Knock-on effects (entire dormant systems):
- `collectTaxes()` — never runs (line 102 early-returns when not mayor).
- `holdFestival()`, `investmentGrant()`, `setTaxRate()` — all gated on `mayorIndex === player.index`.
- The "Mayor controls" entry in the Manage menu never appears, so festival / grant / tax-rate UI is unreachable.
- `houseTaxIfMayor` ($60) — never collectible.
- District happiness / population machinery sits idle (population stayed at 50, 50, 50, 50, 53, 53, 53, 50 across all districts).
- The `district:mayorChanged` notification listener never fires.

**Fix:** Switch to a plurality rule — the player with the most structures in a district is mayor; tie ⇒ no mayor (current behaviour). Or a "majority of built plots" rule. The all-or-nothing rule punishes contested play, which is the whole point of having 4 players.

### 3. F5 quick-save collides with the browser's reload shortcut

`controls.quickSave: ["F5"]`. Pressing F5 in the running game reloads the page (browser default), discarding state. `InputManager.keydown` only `preventDefault()`s for `Space`/Arrow keys, so F5 propagates to the browser. After F5, `localStorage` is also empty — the save handler ran *after* the reload was already in flight, or never ran at all.

**Fix:** Remap quickSave to `Ctrl+S` (and explicitly `preventDefault` on it), or accept Ctrl+S in addition to F5, or add F5 to the prevent-default list. F9 (quickLoad) likely has the same issue on some browsers.

---

## Notable design / balance issues

### 4. The win condition is unreachable on this map within ~50 turns

Starting cash $1500, target $5000 cash on hand. After 50 turns of active play (rolling, moving, building, investing) the leading player had **$840 in cash** — net worth was up at $2540–$2880, but the win metric is cash, not net worth. Several reasons combine:

- Shops pay only $20 passive income per turn (line 1410) regardless of value.
- Visitor fees on a base shop are $20 (`shopVisitRate 0.08 × $250`). With 4 players spread across 32 buildable plots, hits are infrequent.
- Bank gives $200 only on landing — 0 bank stops in our session because the bank sits at the start cell and players spread outward.
- Mayor-tax income (the main multiplier in the design) is gated behind issue #2 above.
- Chance events (could give bonuses, philanthropy, oil) gated behind issue #1.

So even with 50 turns of "build everything you land on" play, total cash hovered around break-even. With ~12 turns per player, the dominant strategy turned into "spam shops then invest in your own shops" because that's the only consistent action available.

**Fix candidates:** (a) raise passive shop income or visitor fee, (b) introduce a "trigger" that pays out to active players regularly, (c) lower the win threshold, (d) prefer net-worth as the win metric, (e) actually wire up the mayor income (issue #2) so it can carry the late game.

### 5. Build menu `Build Shop ($250)` shows price but on-screen money drops by $230

Cash went from $1500 → $1270 after building a single shop — looks like a $20 discount. Reading the code, this is actually correct: `_runProduction()` adds $20 passive shop income at end-of-turn, *immediately* on the same turn the shop is built. The menu shows $250 but the net change is $230 because production fires on the building turn. From a player's perspective this feels like a UI/math bug. Either:
- delay first production to the next turn for a newly built shop, or
- log the income event explicitly so the player sees `-$250 build, +$20 income` as two distinct events (currently only the build is logged).

### 6. Dice distribution feels skewed in early turns

Tracked all rolls via a hook: 30 rolls, distribution `{1: 9, 2: 3, 3: 5, 4: 5, 5: 5, 6: 3}`. The "1"s came in at 30% (expected 16.7%). Not impossible variance over 30 samples, but in the first 8 rolls four were 5s and the last 5 rolls have 1, 1, 3, 1, 1 — runs feel noticeable. Consider: log the seed for reproducibility, or use a "deck-shuffle" style die that averages out over windows of 6.

---

## UX issues

### 7. `Cancel` (Escape / Backspace) doesn't dismiss menus

Verified by hooking `cancel`: pressing Escape on the Manage menu leaves it visible. The `Menu.update()` method (lines 256–273) only listens to `up`, `down`, `confirm`. The `cancel` keybinding from config exists but is unread. To leave any submenu the player must scroll to "Back". This is jarring once you're three levels deep (e.g. Start → Manage → Properties → individual property) — that's 3 "Back" picks to get out.

### 8. Properties list shows duplicates with no disambiguator

`Your structures` view rendered:
```
District E · Shop · $250
District E · Shop · $250
District E · Shop · $250
District D · Shop · $450
…
```
The three District E shops are indistinguishable — if any per-property action is added (sell, demolish, set rent), the player can't tell which one they're acting on. Consider adding a cell index, district sub-coordinate, or a "(plot 1/3 of 5)" suffix.

### 9. Notifications panel truncates aggressively

Right-side `NOTIFICATIONS` panel shows ~10 most recent lines. The internal `eventLog` is also capped at 30 entries (verified). Over 50 turns hundreds of events fired (rolls, moves, builds, visits). A player who looks away and looks back has no scrollback. Consider making the panel scrollable, or persisting full history with a clip on what's *displayed*.

### 10. Bank is at the start cell; players never return

All 4 players start at cell 149 (the bank). Movement strategy pulls them outward, and the bank is a solitary cell in the middle of the board. In 50 turns we recorded 0 bank stops. The bank's $200 stop bonus is intended to be a meaningful reward but is only meaningful for players who actively path back to it. Either move the bank to a more transit-y position, or add multiple bank cells, or trigger the bonus on pass-through (like the toll gate's accrual), not just on stop.

### 11. The Bank "stop" is a one-way reward — passing through gives nothing

Same observation: the bank only triggers in `_handleLanding` (`case 'bank'`). Players who pass over without stopping get nothing. Compare to the Toll Gate which uses `cell:enter` for pass-through effects. A small "$X for passing the bank" would reward circulation.

### 12. Cells have no visible IDs / labels for navigation

The board renders abstract square icons. While moving I had to count how many steps I'd taken because nothing on screen tells me "you have 3 moves left". Looking at the source there *is* logging ("Move 5 step(s) — use arrow keys.") but it disappears from notifications quickly. Consider showing a persistent `Moves: 3` indicator while movement is active, plus a faint highlight on legal next-step neighbours.

### 13. No turn counter visible to players

The HUD shows player name, cash, net worth, resources at the top. There's no "Turn 14 / —" indicator. With a $5000 target and no time pressure, players can't pace themselves. Even a simple "Turn 14" in the corner would help — and is required if the game ever introduces a turn limit.

### 14. "No mayor" displayed in every district sidebar — but no hint of *why*

The left district list shows "No mayor" 8 times. A new player will assume mayors are appointed somehow but the game never explains the threshold. A tooltip / subtitle like "Own all 3 plots to claim mayor" would close the loop on this currently-mysterious mechanic.

---

## Smaller observations

- Trade / Hostile actions menu was reachable but not playtested in depth (4 cooperating bots wasn't a great test of antagonistic systems).
- Player tokens move tile-to-tile cleanly; there were no rendering glitches over 50 turns.
- The default starting position putting all 4 tokens on the same cell looks visually crowded — overlapping pawns at game start.
- Industry / company creation: never used by any player. The Manage menu offered "Create company" for $500; in our cash-stressed game no one had headroom to spend it.
- Markets: never used. Players had no reason to buy/sell resources without factories generating any.
- Trade Imbalance / sabotage / Police Stations: untested because no player built one.
- The notification log doesn't show net-worth changes or major state transitions — only narrative actions. For diagnosing tight games this is too sparse.

---

## Recommended fix priority

1. **Fix chance-cell connectivity** (issue #1) — restores a whole missing system. *Map data fix.*
2. **Switch mayor rule to plurality** (issue #2) — restores the tax/festival/grant/population loop. *Single-line code change in DistrictSystem.recomputeMayor.*
3. **Re-bind quickSave/quickLoad** off F5/F9 (issue #3) — quality-of-life, prevents data loss.
4. **Wire up `cancel` in Menu.update()** (issue #7) — small change, big UX win.
5. **Re-balance for 50-turn game length** (issue #4) — once #2 lands, replay and re-evaluate.
6. **Property disambiguator + visible turn counter** (issues #8, #13) — quick HUD tweaks.

---

## Methodology note

To play 50 turns efficiently I scripted a hot-seat driver in the page console (using `dispatchEvent` to feed synthetic key events into the existing `InputManager` — no game code modified). The driver: (a) selected `Roll` from the start menu, (b) DFS-searched for an N-step path that maximised landing on an empty buildable plot, (c) chose `Build Shop` when affordable and otherwise `Skip`, then `Pass turn`. This exercises the core loop the way a casual first-time player would. Mid-session I retuned the strategy to diversify structure types, but in practice the bots almost always landed on already-built plots and ended up investing further into existing shops — which is itself a useful signal about how the game converges.
