# 05 — Structures and Buildings

> **Δ v1.** This chapter replaces v1's `05_PropertiesAndBusinesses.md`. v2 removes the *Property* and *Business* entities and treats every owned object as a single `PlayerStructure` on a `buildable` cell. Owner effects, visitor effects, upkeep, and rent are all properties of the structure type — no nested catalog.

## 5.1 PlayerStructure entity

`games/Acca/core/PlayerStructure.js` — `class PlayerStructure`.

```js
class PlayerStructure {
  // identity
  type;             // 'shop' | 'toll_gate' | 'teleporter' | 'house' | 'factory' | 'police_station' | 'vault'
  ownerIndex;       // player index (or -1 for map-pre-placed neutral structures)

  // value
  baseValue;        // build cost from cfg.structures.catalog
  currentValue;     // tracked separately so investments (Shop) and upgrades (Vault) raise it

  // placement & rendering
  cell;             // the Cell this structure sits on
  animator;         // sprite animator (sprite name from cfg.structures.sprites[type])

  // type-specific state (only populated for the relevant type)
  tollAccrued;      // toll_gate: per-pass fee charged to the next visitor; auto-paid to owner on each pass-through (grows by tollIncrement after each pass — there is no cup, never held by the structure)
  level;            // vault: 1..5
  storedMoney;      // vault: cash deposited (counts toward netWorth)
  idleUntilTurn;    // upkeep idle marker — structure produces nothing until this turn
  sabotagedUntilTurn; // sabotage marker — structure earns half rent / no income
}
```

Structure lifecycle:

- **Build** — `StructureManager.build(cell, type, ownerIndex)` creates one, attaches it to `cell.structure`, pushes onto `players[ownerIndex].ownedStructures`, deducts the cost.
- **Sell / liquidate** — handled by `EconomyManager` debt resolution: cheapest structures sell at half value first.
- **Trade away** — `TradeSystem.executeTrade` swaps `cell.structure` and `ownerIndex` atomically.
- **Takeover** — `TradeSystem.takeover` re-points `ownerIndex` at the attacker; current value rebases to base.

## 5.2 Structure catalog (config)

From `cfg.structures.catalog`:

| Type             | Build cost | Sprite (from `cfg.structures.sprites`) | One-line summary |
|------------------|------------|---------------------------------------|------------------|
| `shop`           | $250       | `cell_shop`                            | Visitors pay rent (% of currentValue). Owner can invest in increments to grow value up to a per-district cap. |
| `toll_gate`      | $400       | `cell_toll_gate`                       | Every player passing through pays the current `tollAccrued` directly to the owner (no cup, no menu). The fee then grows by `tollIncrement` so popular routes get more expensive. |
| `teleporter`     | $500       | `cell_teleporter`                      | Visitors can pay a fee to teleport to another teleporter the same player owns. |
| `house`          | $300       | `cell_house`                           | Generates owner income; contributes population. Visitors pay house rent. Mayor of district can collect a flat tax. |
| `factory`        | $600       | `cell_factory`                         | Produces resource (district specialty if set, else `food`). House count in the district scales output. |
| `police_station` | $700       | `cell_police_station`                  | Owner income; structures within `policeProtectionTier` cells are sabotage-resistant. |
| `vault`          | $1000      | `cell_vault`                           | 5 levels: deposit cash up to capacity; earns interest each turn. Stored money counts toward net worth. |

`cfg.structures.shopBaseCap` and `shopCapPerStructure` define how much investment each Shop can absorb based on the owner's structures-in-district count. `cfg.structures.shopInvestStep` is the increment per click ($100 default).

Houses follow the same pattern via `houseBaseCap` (default $700), `houseCapPerStructure` (default $150), and `houseRenovateStep` (default $100). Renovating raises `currentValue` by the step (and therefore the per-visit rent, which scales with `currentValue`) up to the per-district cap.

`cfg.structures.tierUpgradeCost` (`{ "2": 300, "3": 600, "4": 1000, "5": 1600 }`) is reserved for the Vault upgrade ladder; see `vaultLevels` for the canonical capacity table.

## 5.3 Build flow

When a player lands on an empty buildable cell, `TurnManager` opens the **Build menu**:

1. List entries from `cfg.structures.catalog`, with each option enabled only if `player.money ≥ entry.cost`.
2. Confirming an option calls `structures.build(cell, type, ownerIndex)`:
   - Creates the `PlayerStructure`.
   - Deducts cost from `player.money`.
   - Attaches to `cell.structure` and `player.ownedStructures`.
   - Triggers `districtSys.recomputeMayor(cell.district)` if the cell is in a district.
3. `TurnManager` transitions to `END_TURN`.

The Build menu uses the spotlight effect — `cameraManager.spotlightOnCell(cell)` highlights the cell underneath the menu modal.

## 5.4 Owner effects (when self-owned)

`StructureManager.ownerOptionsFor(structure, player, onDone)` returns a menu `options[]` based on `structure.type`:

| Type             | Owner action(s) on landing                                    |
|------------------|---------------------------------------------------------------|
| `shop`           | **Invest $`shopInvestStep`** (raise `currentValue` by the step up to a district cap of `shopBaseCap + structuresInDistrict × shopCapPerStructure`), **Continue**. |
| `house`          | **Mayor tax (+$`houseTaxIfMayor`/turn) auto-collected** info line if mayor of the district (the tax is paid automatically at start-of-turn — no menu collection), **Renovate $`houseRenovateStep`** (raise `currentValue` up to `houseBaseCap + structuresInDistrict × houseCapPerStructure`), **Continue**. |
| `factory`        | **Collect output** (district specialty resource × `factoryBaseRate × (1 + houseBonus × houses)`), **Continue**. |
| `teleporter`     | **Teleport to <other teleporter>** (free if it's yours), **Continue**. |
| `vault`          | **Deposit $X**, **Withdraw $X**, **Upgrade** (cost from `vaultLevels[level+1]`), **Continue**. |
| `toll_gate`      | Passive info line — `Toll auto-collected (+$<fee>/pass-through)` (or `next pass: free` when the fee is still 0). Toll receipts hit the owner's wallet immediately on each pass-through; nothing to collect on landing. **Continue**. |
| `police_station` | (passive — no owner action). |

These same options are also reachable from anywhere via **Manage → Properties** — selecting a row opens the structure's owner-options menu inline (camera spotlights the cell). The only difference between the two paths is that the in-place landing menu auto-ends the turn after the action while the portfolio path returns to the structure list.

## 5.5 Visitor effects (when another player owns it)

`StructureManager.visitorEffect(structure, player, onDone)` is called when a non-owner lands on a structure. It applies the rent/fee immediately and may show a follow-up menu (e.g. takeover).

| Type             | Visitor effect on landing                                       |
|------------------|-----------------------------------------------------------------|
| `shop`           | Visitor pays rent = `max(1, round(currentValue × shopVisitRate))`. Then the takeover/sabotage menu (see below). |
| `house`          | Visitor pays rent = `max(1, round(currentValue × houseRentRate))`. Renovating the house raises this rent. Same takeover/sabotage menu. |
| `factory`        | Visitor pays rent = `max(1, round(currentValue × baseRentRate))` (`property.baseRentRate` = 0.15). Same menu. |
| `vault`          | Walk past (no rent). Vaults can still be the target of takeover/sabotage. |
| `toll_gate`      | Already paid on pass-through (transferred directly to the owner); landing is a no-op for the visitor. There is no cup — the owner never lands to collect. |
| `teleporter`     | Offer: **Pay $`teleportFee` to teleport to <other terminal>**, **Pass**. |
| `police_station` | Walk past (no rent). |

After any visitor effect, `TurnManager._offerTakeoverOnLand` always presents three rows:
1. **Buy from <owner> ($cost = round(currentValue × `property.takeoverMultiplier`))** — disabled-with-explanation if the visitor can't afford it. Confirming hands the structure to the visitor via `TradeSystem.takeover` (one takeover per turn; 3-turn shield on the seller).
2. **Sabotage ($`sabotage.cost` + `sabotage.oilCost` oil, `sabotage.duration` turns)** — gated by `TradeSystem.canSabotage`: cost, oil stock, sabotage cooldown, and police-station shield are all checked, with the failure reason rendered inline when the option is disabled. Skipped entirely in cooperative mode.
3. **Continue** — ends the turn.

## 5.6 Pass-through effects

`StructureManager.passThroughEffect(cell, player)` is called for every cell stepped through during MOVE, *not just the landing cell*.

The only structure with a pass-through effect is the **toll gate**: each step over a foreign-owned toll gate transfers the current `tollAccrued` from the visitor directly to the owner (immediate payment — there is no cup to collect from), then increases `tollAccrued` by `cfg.structures.tollIncrement` ($25) so the next visitor pays a higher fee.

## 5.7 Sabotage and police protection

- A structure with `sabotagedUntilTurn > game.turnCounter` is **sabotaged** for the duration. It produces no owner income, and visitor rent is multiplied by `cfg.sabotage.rentReductionMul` (0.5).
- A structure within `cfg.structures.policeProtectionTier` cells (Manhattan distance) of any owned **active** police station is sabotage-resistant — `TradeSystem.canSabotage` rejects the attempt.

## 5.8 Upkeep

`EconomyManager.runEndOfTurn` consumes resources per structure type from `cfg.structures.upkeep`:

- House → 1 food per turn.
- Shop → 1 electricity.
- House → 1 electricity (additional to food).
- Factory → 1 oil.
- Police → 1 electricity.
- Toll gate, vault → 0 electricity (free).
- Teleporter → 1 electricity.

If the player can't pay one of these, **one** structure of that consumer type is set `idleUntilTurn = turn + 1`, and the district loses `cfg.structures.upkeep.shortagePenalty` happiness. Idle structures don't produce or earn rent until the marker decays.

## 5.9 Bankruptcy / liquidation order

When `EconomyManager.runEndOfTurn` finds `player.money < 0`:

1. **Vaults** — withdraw all `storedMoney` from owned vaults (interest is preserved across this).
2. **Resources** — sell from market at the current sell price, cheapest-first or highest-quantity-first (see `EconomyManager` for the exact rule).
3. **Structures** — sell at half `currentValue` cheapest-first.
4. If after all that `netWorth(player) ≤ 0`, set `isBankrupt = true`. Bankrupt players are skipped on `_advanceToNextPlayer`.

> **Δ v1.** v1 had a more elaborate ladder (sell businesses → sell properties at bank-buyback rate → declare bankrupt). v2 collapses to vault → resources → structures, all cheapest-first. The bank-buyback rate (`property.bankBuybackRate = 0.5`) survives as the sell-half multiplier.

## 5.10 UI for structure management

- **Land on own structure:** Owner-options menu drives the action (5.4).
- **Manage from anywhere:** From the Start-of-turn menu, "Manage → Properties" opens the **Portfolio** menu — paginated list of every structure the player owns. Selecting one spotlights its cell on the board (`cameraManager.spotlightOnCell`) and shows the same owner-options menu inline.
- **Mayor controls (pe