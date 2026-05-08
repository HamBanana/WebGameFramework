# Acca v2 — Fix Suggestions
**Companion to** `Acca_Playtest_Report.md` (10-game session, 2026-05-08)
**Scope:** Concrete, file-level fixes for every issue surfaced in the playtest, plus the tax-rate-as-derived-value rule.

For each item: **what's wrong**, **where it lives**, **the fix**, and a rough effort tag (`tiny` / `small` / `medium` / `large`).

---

## Section A — Architectural rule changes

### A.1 Remove the tax-rate slider; derive tax rate from district value `[medium]`

**Problem.** Mayor currently picks any rate in 5% increments up to the `maxTaxRate` cap (`config.js:255`). This violates the project rule: in Acca, taxes should follow district value, not be a player lever. The mayor's role is collection-only.

**Where it lives.**
- `games/Acca/managers/TurnManager.js` — `_showTaxSlider` (the 5% slider), and the `Tax rate: NN%` row in `_showDistrictMenu`
- `games/Acca/systems/DistrictSystem.js` — `setTaxRate`, the `taxRate` field initialization (`init()` sets `d.taxRate = cfg.district.defaultTaxRate`), and `collectTaxes` (uses `d.population * d.taxRate * cfg.district.taxBase`)
- `games/Acca/config.js` — the `district` block: `defaultTaxRate`, `maxTaxRate`, `taxBase`

**Fix.**
1. **Delete `_showTaxSlider`** entirely from `TurnManager.js` and remove the `Tax rate:` row from `_showDistrictMenu`. The District menu becomes Festival / Investment grant / Back.
2. **Delete `DistrictSystem.setTaxRate`** (it's the only mutation path for `taxRate`).
3. **Replace `taxRate` with a computed `getter`** on `District`. Tax rate becomes a deterministic function of district value:
   ```js
   // games/Acca/systems/DistrictSystem.js
   get taxRate() {
     // Sum currentValue of every owned structure in the district
     const totalValue = this.cells.reduce((sum, c) =>
       sum + (c.structure ? c.structure.currentValue : 0), 0);
     // Anchor: $0 → 5% (rural), $1000 → 10%, $5000+ → asymptote 25%.
     // Logistic curve so well-developed districts pay more without spiking.
     const x = totalValue / 1000;
     return 0.05 + 0.20 * (x / (x + 4));   // bounded to [0.05, 0.25]
   }
   ```
4. **Drop the `taxRate` write path** in `DistrictSystem.init` and any deserialize (the field is computed; nothing to load).
5. **Update `_showDistrictMenu` subtitle** to display the *current* derived rate plus a hint at how to grow it: `"Pop ${d.population} · Tax ${rate*100}% (grows with district value)"`. This educates the player without giving them a knob.
6. **Remove `defaultTaxRate` and `maxTaxRate`** from `config.js` (they're now meaningless). Keep `taxBase` if you want the multiplier exposed for theme tweaks.

**Risk.** Save-game compatibility — old saves carry an explicit `taxRate` per district in `serialize()`. Either bump the save format version (`AccaSave.js`) and ignore old taxRate on load, or migrate (set `taxRate` getter to return saved value if present, else compute).

---

## Section B — Balance fixes (high-impact)

### B.1 Player 4's 60% win rate `[small]`

**Problem.** Across 10 games with strategy assignments rotated by game index, Player 4 (always last in turn order) won 6 games. That's likely a turn-order effect: P4 acts after seeing all opponents' rolls and builds.

**Where it lives.** `games/Acca/AccaGame.js` — `_advanceToNextPlayer` cycles `0 → 1 → 2 → 3 → 0` from a fixed `currentPlayerIndex = 0` set in `_initPlayers`.

**Fix.**
1. **Randomize the starting index** at `_beginGame`:
   ```js
   this.currentPlayerIndex = Math.floor(Math.random() * this.players.length);
   ```
2. **Or rotate it round-robin per round** for fairness without RNG: track a `roundCounter` that ticks each time the cycle completes, and offset `currentPlayerIndex` by it at round start.
3. **Surface this in the HUD** with a small "Order: P3 → P4 → P1 → P2" strip so players can see who's next. Tiny addition to `HUDRenderer`.

**Why both.** Randomization gives variance run-to-run; round-robin removes within-game last-mover advantage. I'd implement both.

**Verification.** Re-run the 10-game harness; if P-slot win rates equalize to ~25% each ±2 games, the bias was turn-order.

---

### B.2 Shop dominance — flatten the build catalog `[medium]`

**Problem.** 156 of ~170 builds (92%) were shops. Houses, toll gates, and police stations were never built across 10 games. The cost/income curves make shop strictly Pareto-optimal.

**Where it lives.** `games/Acca/managers/EconomyManager.js` — `_runProduction` (per-type income), `games/Acca/config.js` — `structures.catalog` (costs) and `structures.{*}OwnerIncome` (per-turn yields).

**Fix.**
1. **Diminishing-returns on shops in the same district.** In `_runProduction`, scale shop income by `1 / (1 + sameDistrictShopCount * 0.5)` so the second shop in a district yields ~⅔ as much as the first, the third ~½, etc. Keeps shops viable but breaks the "build only shops" attractor.
2. **Houses get a passive flat-income** (e.g. `houseOwnerIncome = 18` already exists in config but `_runProduction` never reads it — it's referenced in the build-menu hint via `expectedVisitorRent` but the actual income path through houses goes through *visitor rent only*). Wire the per-turn flat income for houses in `_runProduction`:
   ```js
   if (s.type === 'house') {
     // ...existing population/mayor-tax block...
     const flat = cfg.houseOwnerIncome || 0;
     if (flat > 0) player.addMoney(flat, `House income in ${s.cell.district}`);
   }
   ```
3. **Toll Gate's per-turn flat income (`tollOwnerIncome = 8`) is similarly unused.** Wire it the same way. The pass-through `+$tollIncrement` charge is already correctly auto-deposited.
4. **Teleporter and Police Station flat incomes (`teleporterOwnerIncome = 12`, `policeOwnerIncome = 30`) — same.** All four "OwnerIncome" config values exist but aren't consumed in `_runProduction`. **This is the single highest-leverage fix.** Connect them and the catalog instantly becomes meaningfully diverse.

**Verification.** Re-run the harness with the same strategies; the diversity strategy should now have viable non-shop builds.

---

### B.3 Expensive structures' payback period exceeds game length `[small]`

**Problem.** The `expensive-pref` strategy (vault/police/factory first) capped at 300 turns without a winner. Vault costs $1000 vs. $1500 starting cash; payback at 1% interest + $10/turn ownership income takes 50+ turns — longer than a typical game.

**Where it lives.** `games/Acca/config.js` — `structures.catalog` costs and the matching `*OwnerIncome` / `vaultInterestRate`.

**Fix.** Either lower the cost or raise the income. Concrete proposal:

| Structure | Current cost | Current per-turn | Proposed cost | Proposed per-turn |
|---|---|---|---|---|
| Vault | $1000 | $10 + 1% interest | $750 | $25 + 1.5% |
| Police Station | $700 | $30 | $500 | $30 (unchanged) |
| Factory | $600 | resource only | $500 | resource + $20 |
| Teleporter | $500 | $12 | $400 | $15 |
| House | $300 | $18 (once wired) | $250 | $18 |

These bring all payback periods under ~30 turns, the natural game length. **Pair with B.2** — without B.2, lowering cost alone won't help because the income paths are dead.

---

### B.4 Resource shortage / electricity cliff `[medium]`

**Problem.** Every winning game ended with "structure idled — short on electricity". The map has 1 power plant; total electricity demand from owned structures climbs to 6–9/turn while supply per Power-Plant landing is +3 per visit. Players win despite the resource economy fighting them.

**Where it lives.**
- `games/Acca/managers/EconomyManager.js` — `_runResourceUpkeep` lines 217–233 (electricity demand)
- `games/Acca/maps/default.json` — power plant cell count
- `games/Acca/managers/EconomyManager.js` — `_runProduction` lines 66–69 (the `passiveYield` stipend is set to `1` in `config.js:235`, only enough for ~1 shop)

**Fix.** Layered:

1. **Per-structure electricity stipend in `_runProduction`.** Right now `passiveYield = 1` flat. Scale it with structure ownership:
   ```js
   const yield1 = (game.cfg.market.passiveYield || 0) +
                  Math.floor(player.ownedStructures.length / 3);
   ```
   So at 6 structures you passively get `+3 electricity, +3 food`/turn — closes the structural gap without removing scarcity for the player who hoards 12 buildings.
2. **Add a second Power Plant cell** to `maps/default.json` on the opposite side of the board. Sparse-resource maps starve all four players; two distributed plants let two players each have a "near" supply.
3. **HUD heads-up "you'll run out in N turns"** — tiny `HUDRenderer` addition: compute total upkeep vs. current resources for the active player, show as a small badge next to the resource counter when the runway is < 5 turns. This shifts shortage from punishment to planning.
4. **Coalesce repeated "structure idled" messages** in the notification panel. Currently every end-of-turn upkeep emits the same line. Track a per-player streak counter in `_runResourceUpkeep` and only log on the first turn of a shortage and every 5 turns thereafter. Reduces log noise dramatically.

---

### B.5 Bankruptcy never fires `[tiny]`

**Problem.** Zero bankruptcies in 10 games. The `_checkBankruptcy` logic in `EconomyManager.js:330` only fires when **net worth** ≤ 0 — not just cash. Since structures have currentValue, NW rarely goes negative. The elimination path is dormant.

**Where it lives.** `games/Acca/managers/EconomyManager.js` — `_checkBankruptcy` (line 330), and `_resolveDebt` (line 281) which auto-sells everything to clear debt.

**Fix.** Either (a) lean into "no eliminations" and remove the bankruptcy path entirely (renaming `isBankrupt` → `isStruggling` and using it for visual cue only), or (b) enable real elimination by:

1. Adding **a minimum-cash floor** check: if `player.money < -500` after `_resolveDebt`, mark bankrupt. (Right now debt resolution will sell all structures down to refund value, which prevents this almost entirely.)
2. **Cap debt resolution to one structure per turn**, so a player who mismanages can't auto-rescue out of every disaster in one frame.

I'd pick (a) — it matches the family-game tone the rest of the design suggests. The `isBankrupt` field becomes purely diagnostic.

---

## Section C — UX fixes

### C.1 Mayor menus too deep `[small]`

**Problem.** Reaching a Festival is `Manage properties → Mayor controls → District: A → Festival` — 4 keypresses. Players will not navigate this every 5 turns.

**Where it lives.** `games/Acca/managers/TurnManager.js` — `_showStartMenu`, `_showManageMenu`, `_showMayorMenu`, `_showDistrictMenu`.

**Fix.**
1. **Promote a `Mayor` row into the top-level start menu** when `player.districtsMayoredOf.size > 0`. Saves 2 keypresses per mayor action.
   ```js
   const opts = [
     { label: 'Roll', action: () => this.enter(A.TURN_STAGE.ROLL) },
   ];
   if (p.districtsMayoredOf.size > 0) {
     opts.push({ label: `Mayor (${p.districtsMayoredOf.size})`, action: () => this._showMayorMenu() });
   }
   opts.push({ label: 'Manage properties', action: () => this._showManageMenu() });
   opts.push({ label: 'Sell assets',       action: () => this._showSellAssetsMenu() });
   opts.push({ label: 'Other',             action: () => this._showOtherMenu() });
   ```
2. **Skip the `Mayor` intermediate when there's only one mayoral district** — `_showMayorMenu` should auto-route to `_showDistrictMenu(theOnlyOne)` if `districts.length === 1`.
3. **District menu (after A.1 removes the tax slider)** gets two rows: `Festival` and `Investment grant`, plus `Back`. Confirm-on-default-action pattern: pressing Enter at the top level should hit the most-common action (Festival) instantly.

---

### C.2 Notification panel too small / overlapping money text `[small]`

**Problem.** The notification panel shows ~7 lines and gets dominated by repeated "Shop income" lines during heavy mayor turns. Floating money-text animations stack on the same cell when multiple incomes hit one tile in a frame.

**Where it lives.**
- `games/Acca/index.html` — the `#notifications` container CSS
- `games/Acca/ui/MoneyAnimations.js` — float spawning
- `games/Acca/AccaGame.js:135` — the 500-event log cap (already raised)

**Fix.**
1. **Increase notification panel to ~14 lines.** Pure CSS — extend `#notifications` height, scale font down 1px if it gets crowded.
2. **Group floats by cell within the same frame.** In `MoneyAnimations`, bucket new floats by `cellId` for the current tick; if a bucket has >1 entry, sum them into one animation showing `+$total`. Concrete approach: add a `_pending` map keyed by cellId, flush at end-of-frame.
3. **Coalesce repeated income lines in the notification panel.** Same pattern — if the previous notification was `Player 4 +$19 (Shop income in District D…)` and the current one matches the same regex, replace the previous line and append `(×2)`, `(×3)`. Implement in the renderer that maps `eventLog` to DOM elements.

---

### C.3 District panel overflows on small windows `[tiny]`

**Problem.** With 8 districts, the bottom rows clip behind the player panel at 1568×726.

**Where it lives.** `games/Acca/index.html` — `#districtList` container CSS.

**Fix.** Two CSS lines:
```css
#districtList { max-height: calc(100vh - 200px); overflow-y: auto; }
#districtList::-webkit-scrollbar { width: 4px; }
```

---

### C.4 Game-over screen lacks substance `[medium]`

**Problem.** Two lines of summary after 60+ turns of investment.

**Where it lives.** `games/Acca/render/OverlayRenderer.js` — `drawGameOver`.

**Fix.** Replace with a per-player results panel:

1. **Per-player summary cards** showing final NW broken down: Cash / Structures / Vault / Resources. Visual bar chart, ranked.
2. **"Notable moments"** mined from `eventLog` — the largest single income event per player, the largest sabotage paid, biggest single chance event.
3. **A `Replay` option** that calls `_beginGame()` directly — same map, same player count. The MENU detour is unnecessary for the most-common action.
4. **A `New game (different settings)` option** that returns to MENU.

This is the largest UX win in the list — it converts a flat ending into the part of the game players talk about after.

---

### C.5 Die roll duration / fast-roll toggle `[tiny]`

**Problem.** 1.4 s per roll × ~60 rolls/game = 1.4 minutes of pure dice waiting.

**Where it lives.** `games/Acca/config.js` — `turn.rollDuration = 1.4`.

**Fix.** Add to the in-game `Other` menu: a `Fast rolls (0.4s)` toggle. Persists in localStorage. Two-line change in `TurnManager._showOtherMenu`. The default stays at 1.4 for first-time players who need the visual feedback.

---

### C.6 Audio — silent game `[small]`

**Problem.** No audio cues anywhere. The framework includes `AudioSystem`.

**Where it lives.** `framework/systems/AudioSystem.js` exists; `games/Acca/AccaGame.js` doesn't call into it.

**Fix.** Five sounds, total. They're all small (< 50KB each):
- `roll.wav` — die clatter (1 s loop while rolling, fade out on settle)
- `coin.wav` — fires on any positive `addMoney`
- `build.wav` — fires on `property:bought`
- `mayor.wav` — fires on `district:mayorChanged` when newMayor !== -1
- `victory.wav` — fires on game-over winner

Bind via the existing event bus in `AccaGame.js` after the engine is created. Keep them respectful of `cfg.audio.sfxVolume`.

---

### C.7 Floating-text overlap on busy turns `[tiny]`

Already addressed in C.2 (groups floats per cell per frame). Listed separately because it's a visual issue distinct from the panel-density issue.

---

## Section D — Trade & market accessibility

### D.1 Market sell-side is unused `[small]`

**Problem.** 69 buys vs. 1 sell across the session. Players hoard resources because the path to sell is `Other → Sell assets → Resource → Sell all` (4 keypresses) while passive resource gain from Mine cells is automatic.

**Where it lives.** `games/Acca/managers/TurnManager.js` — `_showSellAssetsMenu`.

**Fix.**
1. **Auto-suggest a market visit at start-of-turn** when the player is holding ≥ 30 of any single resource. `_runContextualPrompts` already has a tip for this (`Tip: you have N wood — Market would buy at $X each.`); strengthen it into an actionable shortcut: if the tip fires, the start-of-turn menu gains a `Sell ${resource} (×$total)` row that goes straight to the sell flow. Skips three menu transitions.
2. **Or — simpler** — auto-sell a fraction (say, 25%) of any resource hoard above 50 each turn at sell-spread price, with a log line. Removes the menu friction entirely while keeping market price discovery.

---

### D.2 Trade preset rigidity `[medium]`

**Problem.** Trades are 4 hard-coded swaps (`$100 → 1 oil`, `$200 → 1 steel`, `5 wood → $100`, `$250 → 2 food`). They're rarely the right swap.

**Where it lives.** `games/Acca/managers/TurnManager.js` — `_showTradeWith`.

**Fix.** Replace with a builder UI:

1. **Two-pane trade screen** — `Offering` (left) and `Requesting` (right). Each pane lists the current player's resources/cash with `←/→` to adjust quantity.
2. **Auto-compute "fair" market price** showing whether the swap is balanced; flag imbalances over `cfg.trade.maxImbalanceRatio`.
3. **Bot accepts/rejects automatically** based on market price. (The other player is hot-seat; in single-player AI mode the AI evaluates against current sell-spread.)

This is the largest pure-UX expansion in the list. It unlocks a system that today is window dressing.

---

### D.3 Trade hint lifecycle `[tiny]`

**Problem.** The "Tip: Player X has N steel — try Trade / Hostile actions" message fires every turn the condition holds, eventually filling the log.

**Where it lives.** `games/Acca/managers/EconomyManager.js` — `_runContextualPrompts` line ~187.

**Fix.** Track which tips have fired this game and only show each tip once per N turns (say, every 8 turns). Tiny per-tip cooldown map on the player.

---

## Section E — Code & event hygiene

### E.1 `property:bought` vs. `property:built` naming `[tiny]`

**Problem.** `StructureManager.js:34` emits `property:bought` for what the rest of the codebase calls "build". `TurnManager` says "Built X in Y" in log lines, but the event consumers see `property:bought`.

**Where it lives.** `games/Acca/managers/StructureManager.js`.

**Fix.** Rename the event to `property:built`. Search for `property:bought` callers (none in the current game code besides emit; only consumers are external like the playtest harness). Add a brief deprecation alias if there are any external scripts:
```js
this.game.engine.events.emit('property:built',  payload);
this.game.engine.events.emit('property:bought', payload);  // deprecated alias, remove next release
```

---

### E.2 Unit/separator parsing in resource hint footers `[tiny]`

**Problem.** "Buy $25 Sell $23 Have 5" parses as a stream when read quickly — three fields without separators.

**Where it lives.** `games/Acca/managers/TurnManager.js` — `_showMarketResource` subtitle.

**Fix.**
```js
this.menu.show(`${resource}`, opts,
  `Buy $${M.priceOf(resource)} · Sell $${M.sellPriceOf(resource)} · Have ${p.resources[resource] || 0}`);
```

(The `·` separator is already used elsewhere in the codebase, e.g. portfolio rows. Just consistency.)

---

### E.3 Game log viewer headers `[tiny]`

**Problem.** Game-log paginator shows `Page 1 of 5 · 70 entries (newest first)` but doesn't say which turns the visible page covers.

**Where it lives.** `games/Acca/managers/TurnManager.js` — `_showGameLog`.

**Fix.** Tag each event with the turn it was logged on (`this.game.eventLog.push({turn, msg})` instead of just the string), and render headers as `Page 1 of 5 · turns 67–60`.

Behavior change: existing `eventLog` consumers expect strings. Either bump the structure with backwards compat (push objects, render `.msg` everywhere) or store turn implicitly via index (`floor(idx / events_per_turn)`, less reliable).

---

### E.4 Repeated identical log lines `[tiny]`

Already covered in C.2 — same fix. Listed here because it's also a code-hygiene win (less per-turn log churn).

---

## Section F — Coverage gaps surfaced by the harness

These weren't bugs in the game; they're paths the bot couldn't reliably navigate. The fixes here are about reducing path depth so a casual player (or test harness) actually reaches them.

### F.1 Investment grant never fired in 10 games `[small]`

**Problem.** Path: `Manage → Mayor → District → Investment grant`. Even with `mayor: 'grant'` strategy, the bot hit it 0 times.

**Fix covered by C.1** (promote Mayor row to start menu). After C.1 the path is `Mayor → District → Investment grant` — 2 keypresses.

### F.2 Hostile takeover (5× value) never fires `[small]`

**Problem.** The takeover offer requires `5× currentValue` — for a $250 shop, that's $1250, often more than landed-player's cash. Triggers dead.

**Where it lives.** `games/Acca/config.js` — `property.takeoverMultiplier = 5`.

**Fix.** Lower the multiplier to **3×**. Also: scale takeover cost down for sabotaged structures (a sabotaged shop at 50% effectiveness should cost less to take over). Implement in `TurnManager._offerTakeoverOnLand`:
```js
const sabotaged = structure.sabotagedUntilTurn > game.turnCounter;
const mult = (sabotaged ? 1.5 : 1) * (game.cfg.property.takeoverMultiplier || 5);
const cost = Math.round(structure.currentValue * mult);
```

### F.3 Save / Load `[small]`

**Problem.** Behind `Other → Save game`. 2 keypresses to save, but no auto-prompt and no quick keybind.

**Fix.** Auto-save once per round (after every full cycle of all players). Add a top-bar "saved" indicator that flashes briefly. Keep manual Save in the menu for explicit named saves.

---

## Section G — Verification plan

After implementing fixes, re-run the 10-game harness with the same strategy slate. Expected differences:

| Signal | Before | Target |
|---|---|---|
| Player-4 win rate | 6/10 | ~3/10 (≤±1 from random) |
| Shops as % of builds | 92% | < 60% |
| Builds of houses, toll_gates, police_stations | 0 each | > 5 each |
| Festival count | 1 | > 5 |
| Investment grants | 0 | > 3 |
| Tax-rate menus reached | mostly (broken path) | N/A (deleted) |
| Game length on `expensive-pref` | 300 (cap) | < 100 |
| "Structure idled" messages in winner's last 5 lines | 10/10 | < 4/10 |
| Trades / takeovers / sabotages | 0 / 0 / 4 | > 5 / > 3 / > 5 |

---

## Section H — Suggested rollout order

If shipping these in stages, this is the order I'd take:

1. **A.1** — Tax slider removal (rule alignment; quick win)
2. **B.2** — Wire the unused `*OwnerIncome` config values (single highest-leverage code change)
3. **B.4** — Electricity stipend & second power plant
4. **B.1** — Randomize/rotate starting player
5. **C.1** — Mayor row in start menu
6. **C.4** — Game-over results screen
7. **B.3** — Cost rebalance for expensive structures
8. **D.2** — Real trade builder UI
9. **C.6** — Audio (small but huge for game feel)
10. Everything else as polish.

Steps 1–4 alone should be enough to address every major balance/coverage finding from the playtest. Steps 5–7 elevate the moment-to-moment experience. Steps 8+ are quality-of-life polish that the game can ship without.
