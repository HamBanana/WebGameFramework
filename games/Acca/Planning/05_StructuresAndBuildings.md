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
  tollAccrued;      // toll_gate: dollars in the cup waiting for the owner to collect
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
| `toll_gate`      | $400       | `cell_toll_gate`                       | Every player passing through pays a toll into `tollAccrued`. Owner collects on landing. |
| `teleporter`     | $500       | `cell_teleporter`                      | Visitors can pay a fee to teleport to another teleporter the same player owns. |
| `house`          | $300       | `cell_house`                           | Generates owner income; contributes population. Visitors pay house rent. Mayor of district can collect a flat tax. |
| `factory`        | $600       | `cell_factory`                         | Produces resource (district specialty if set, else `food`). House count in the district scales output. |
| `police_station` | $700       | `cell_police_station`                  | Owner income; structures within `policeProtectionTier` cells are sabotage-resistant. |
| `vault`          | $1000      | `cell_vault`                           | 5 levels: deposit cash up to capacity; earns interest each turn. Stored money counts toward net worth. |

`cfg.structures.shopBaseCap` and `shopCapPerStructure` define how much investment each Shop can absorb based on the owner's structures-in-district count. `cfg.structures.shopInvestStep` is the increment per click ($100 default).

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
| `shop`           | **Invest** (raise `currentValue` by `shopInvestStep` up to district cap), **Skip**. |
| `house`          | **Collect tax** ($60 if mayor of this district, otherwise no-op), **Skip**. |
| `factory`        | **Collect output** (district specialty resource × `factoryBaseRate × (1 + houseBonus × houses)`), **Skip**. |
| `teleporter`     | **Teleport to <other teleporter>** (free if it's yours), **Skip**. |
| `vault`          | **Deposit $X**, **Withdraw $X**, **Upgrade** (cost from `vaultLevels[level+1]`), **Skip**. |
| `toll_gate`      | **Collect tolls** ($`tollAccrued`), **Skip**. |
| `police_station` | (passive — no owner action). |

## 5.5 Visitor effects (when another player owns it)

`StructureManager.visitorEffect(structure, player, onDone)` is called when a non-owner lands on a structure. It applies the rent/fee immediately and may show a follow-up menu (e.g. takeover).

| Type             | Visitor effect on landing                                       |
|------------------|-----------------------------------------------------------------|
| `shop`           | Visitor pays rent ≈ `currentValue × baseRentRate`. Then offered: **Takeover** (5×, see 11), **Sabotage** (see 11), **Skip**. |
| `house`          | Visitor pays rent ≈ `currentValue × houseRentRate`. Same takeover/sabotage menu. |
| `factory`        | Visitor pays rent at `baseRentRate`. Same menu. |
| `vault`          | Walk past (no rent). Vaults can still be the target of takeover/sabotage. |
| `toll_gate`      | Already paid on pass-through; landing is a no-op for the visitor. (Owner doesn't auto-collect; that's done on owner landing.) |
| `teleporter`     | Offer: **Pay $`teleportFee` to teleport to <other terminal>**, **Skip**. |
| `police_station` | Walk past (no rent). |

## 5.6 Pass-through effects

`StructureManager.passThroughEffect(cell, player)` is called for every cell stepped through during MOVE, *not just the landing cell*.

The only structure with a pass-through effect is the **toll gate**: each step over a foreign-owned toll gate adds `cfg.structures.tollIncrement` ($25) to `tollAccrued` and deducts it from the visitor.

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