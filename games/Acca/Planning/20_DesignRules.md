# 20 — Changes

A running log of behaviour changes to Acca, newest first. Doc-only edits or pure refactors aren't logged here — only changes to gameplay, UX, or the public surface of a class/system.

## 2026-05-05 — Money never collected through a menu

Project rule: menus on Acca should never be used to collect money. Income is transferred immediately when it's paid. Two structures changed:

- **Toll Gate.** Removed the `Collect tolls (+$<accrued>)` owner action from `StructureManager.ownerOptionsFor('toll_gate')` (introduced earlier today). Toll receipts already transferred to the owner directly inside `passThroughEffect` — the menu was a redundant second collection. Owner-on-landing now shows a passive info line: `Toll auto-collected (+$<fee>/pass-through)` (or `next pass: free` when the fee is still 0). The `tollAccrued` field is repurposed as the **per-pass fee** that the next visitor will pay (still grows by `tollIncrement` per pass, so popular routes stay expensive). The `BoardRenderer` overlay still renders the per-pass fee on the gate as a quick visual; the comment was updated.
- **House — Mayor tax.** Removed the `Collect taxes (+$houseTaxIfMayor)` owner action from `StructureManager.ownerOptionsFor('house')`. `EconomyManager._runProduction` now auto-deposits `houseTaxIfMayor` per house at start-of-turn for any house in a district where the owner is mayor (logged as `<player> auto-collects $<n> mayor tax from House in <district>.`). Owner-on-landing now shows `Mayor tax (+$<n>/turn) auto-collected` as an info line.

The Vault's Deposit/Withdraw/Upgrade options stayed — those manage stored money rather than collecting income. The Factory's `Collect <n> <resource>` option also stayed (resources, not money — outside the scope of this rule); flagged for a follow-up if the rule extends to resources.

**Files touched**
- `managers/StructureManager.js` — removed `Collect tolls` and `Collect taxes`; replaced with passive info lines.
- `managers/EconomyManager.js` — `_runProduction` now auto-pays `houseTaxIfMayor` for mayor-owned houses.
- `render/BoardRenderer.js` — comment update; the `$<fee>` label now means per-pass fee, not cup balance.
- `Planning/05_StructuresAndBuildings.md` — owner/visitor effect tables and pass-through section rewritten to reflect immediate transfer.

## 2026-05-05 — Cell/structure pass: doc/code drift fixes + new owner actions

Triggered by the feature evaluation in `20260505_FEATURE_EVALUATION.md`. Code changes plus the matching doc updates in `03_BoardAndCells.md` and `05_StructuresAndBuildings.md`.

**Cell-level**
- `Cell` gained a `subType` field, populated by `BoardLoader` from the map JSON. `TurnManager` mine landing now reads `cell.subType` directly instead of looking up `GF.mapData.cells.find(...)`. Fixes a fragility window where reloads or out-of-sync `mapData` made every mine fall back to coal.
- `BoardLoader` also stashes `cell.structureType` for `type === 'structure'` cells so `TurnManager` can label them on landing.
- `TurnManager._handleLanding` now has a `case 'structure'` branch. If the cell carries a real `PlayerStructure` instance (e.g. a scenario seed) it routes through `_handleBuildable`; otherwise it logs a flavour line and ends the turn safely. Previously these cells fell to `default → END_TURN` silently.
- Near-miss chance events now log explicitly (`Near-miss chance — adjacent to a Chance cell (25% chance).`) so players understand why a non-chance landing fired a chance event.

**Structure owner actions**
- **Toll Gate — Collect tolls.** `StructureManager.ownerOptionsFor('toll_gate')` now offers `Collect tolls (+$<accrued>)` when the cup has money in it, paying `tollAccrued` to the owner and zeroing the cup. The passive `(toll cup is empty)` line still appears when there's nothing to collect.
- **House — Renovate.** New owner action `Renovate $<step>` that raises `currentValue` by `houseRenovateStep` (default $100) up to `houseBaseCap + structuresInDistrict × houseCapPerStructure` (defaults: $700 + $150 each). Mirrors the Shop invest pattern.
- **House and Factory rent** now scale with `currentValue` instead of `baseValue`, so renovations actually move the visitor-rent dial.
- **Factory rent** uses `property.baseRentRate` (0.15) instead of `houseRentRate` (0.25), per planning doc §5.5. Visitor rent on a base $600 factory drops from $150 to $90 — factories now earn primarily through their per-turn resource production, not gate-keeping rent.

**Visitor menu**
- `_offerTakeoverOnLand` now offers **Sabotage** alongside **Buy from owner**, gated through `TradeSystem.canSabotage` (so cost/oil/cooldown/police-shield checks apply uniformly). The option is hidden in cooperative mode.

**Build menu**
- Each row now previews the visitor rent (`rent ~$<n>/visit` for shop/house/factory) or a structure-appropriate hint (`+$25/pass-through` for toll gates, `$75/visitor teleport` for teleporters, `+$30/turn, sabotage shield` for police, `+$10/turn + 1% interest` for vaults).

**Manage menu**
- Selecting a row in **Manage → Properties** now opens the structure's owner-options menu inline (camera spotlights the cell). Same action surface as the in-place landing menu, but returns to the portfolio list when done instead of ending the turn.

**Config additions** (`config.js`)
```diff
+ "houseRenovateStep": 100,
+ "houseBaseCap": 700,
+ "houseCapPerStructure": 150,
```

**Files touched**
- `core/Cell.js`
- `managers/BoardLoader.js`
- `managers/TurnManager.js`
- `managers/StructureManager.js`
- `config.js`
- `Planning/03_BoardAndCells.md`
- `Planning/05_StructuresAndBuildings.md`
- `Planning/20_Changes.md` (this file)
- `Planning/API_Reference.md`
- `20260505_FEATURE_EVALUATION.md` (footer note)
