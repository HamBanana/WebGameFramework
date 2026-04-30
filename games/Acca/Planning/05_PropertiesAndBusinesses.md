# 05 — Properties and Businesses

## 5.1 Property entity

`games/Acca/entities/Property.js` wraps a purchasable cell:

```js
class Property {
  cell;            // back-ref to Cell
  ownerIndex;
  companyId;       // which of the owner's companies holds this property
  basePrice;       // initial purchase price
  improvedValue;   // dynamic — basePrice + sum(business.value)
  businesses;      // array of Business, capped by tier (see 5.4)
  tier;            // 1..5 — caps business slots and unlocks types
  rentMultiplier;  // computed from businesses + mayor bonus
  sabotagedUntilTurn; // -1 if not sabotaged
}
```

When a property changes hands (`property:soldTo` event), all child businesses transfer with it. Outstanding upkeep cost transfers too — the new owner pays the next end-of-turn upkeep.

## 5.2 Purchase flow

1. Player lands on an unowned property.
2. TurnManager `_handleProperty` shows menu: `Buy ($price)`, `Skip`.
3. On Buy: deduct money, set `ownerIndex`, push to `Player.ownedCells`, emit `property:bought`.
4. RegionSystem listens and re-checks mayor status for that district.

When a player lands on their own property, the menu offers: `Build Business`, `Upgrade Business`, `Tear Down Business`, `Set as Company HQ`, `Skip`. Build/Upgrade is the same flow as `MANAGE` — see 4.2.

## 5.3 Rent

When player A lands on player B's property:

```
rent = property.basePrice * cfg.property.baseRentRate
     + sum(business.rentContribution for business in property.businesses)
     + (mayor of district == B ? cfg.property.mayorBonus : 0)
     - (property.sabotagedUntilTurn >= currentTurn ? cfg.property.sabotageRebate : 0)
```

If the visiting player can't afford the rent, the difference is auto-paid in resources (using market value). If they still can't cover it, properties are auctioned to make up the gap; if liquidation can't cover it, the player is bankrupt.

## 5.4 Business entity

`games/Acca/entities/Business.js`:

```js
class Business {
  type;            // see 5.5 catalog
  level;           // 1..3
  employees;       // current count
  maxEmployees;    // capacity from level
  rentContribution;
  productionRate;  // resources/turn
  upkeep;          // {resourceName: qty} per turn
  idleReason;      // null | 'no_employees' | 'no_resources' | 'sabotaged'
}
```

A business is `idle` if any of:
- no employees available in the region,
- not enough upkeep resources at end-of-turn,
- the host property is sabotaged.

Idle businesses produce nothing and reduce regional happiness by `cfg.population.happiness.idleBusinessPenalty`.

## 5.5 Business catalog

The catalog is config-driven via `cfg.businesses`. v1 ships with the following; designers can add more in config without touching code.

| Type | Build cost | Resource cost (build) | Upkeep / turn | Production / turn | Employees | Notes |
|------|------------|----------------------|---------------|-------------------|-----------|-------|
| `shop` | $200 | wood ×2 | electricity ×1 | money +$30 | 2 | Generic income. |
| `factory` | $500 | steel ×3, wood ×2 | electricity ×2, coal ×1 | money +$80 | 6 | Bigger income; consumes coal. |
| `farm` | $250 | wood ×2 | water ×2 | food ×3 | 4 | Production, not income. |
| `lumber_mill` | $300 | steel ×1 | electricity ×1 | wood ×3 | 3 | Allowed only on `forest` cells. |
| `coal_mine` | $400 | steel ×2 | electricity ×1 | coal ×3 | 5 | `mine` cells with subType=coal. |
| `steel_mill` | $600 | steel ×2 | coal ×2, electricity ×2 | steel ×2 | 6 | `mine` cells with subType=iron. |
| `power_plant` | $700 | steel ×3 | coal ×2 | electricity ×4 | 4 | `power_plant` cells. |
| `oil_rig` | $800 | steel ×4 | electricity ×1 | oil ×2 | 5 | `oil_rig` cells. |
| `water_pump` | $300 | steel ×2 | electricity ×1 | water ×3 | 2 | `well` cells. |
| `service` | $400 | wood ×2 | electricity ×1, water ×1 | money +$60, happiness +1 | 4 | Service business — boosts regional happiness. |

Cell-type restrictions are enforced at build time. Generic types (`shop`, `factory`, `service`) build on any property.

## 5.6 Property tier and player level

A property's `tier` caps business slots and unlocks higher-tier types:

| Tier | Slots | Unlocks |
|------|-------|---------|
| 1 | 1 | shop, farm, water_pump, lumber_mill |
| 2 | 2 | + service, coal_mine |
| 3 | 3 | + factory |
| 4 | 4 | + steel_mill, power_plant |
| 5 | 5 | + oil_rig |

Tier increases by paying `cfg.property.tierUpgradeCost[tier]`. Increasing a tier emits `property:tierUp`.

The **player level** is the average tier of all owned properties, rounded down. It's surfaced in the HUD and is one win-condition target.

## 5.7 Bankruptcy / liquidation order

When a player can't pay (rent, upkeep, taxes):

1. Sell resources at market price until either solvent or out.
2. Auction lowest-tier property (returned to bank — sold instantly at `cfg.property.bankBuybackRate × improvedValue`).
3. Repeat from step 1.
4. If still insolvent: bankrupt. Remaining properties revert to bank, region mayor status recomputes.

## 5.8 UI for property management

The Manage Properties modal lists all owned properties grouped by region. Selecting one opens a property detail panel:

- Per-business row: type, level, employees, upkeep cost, production, idle reason.
- Buttons: Build (→ catalog menu), Upgrade, Demolish, Tier Up.
- Shows projected weekly income ("If you do nothing, +$X/turn").

Detailed UI design lives in `12_UI_HUD.md`.

## 5.9 Player structures

A **player structure** is a board occupant that lives outside the property/business model: it sits directly on a single cell (not a `property` cell), has its own ownership, and exposes mechanics that don't fit the business slot system. Structures and properties coexist on the same board — landing on a structure cell triggers the structure's own interaction, never the property menu.

Structure cells in the map JSON use `cellType: "structure"` with a `structureType` field naming one of the catalog entries in 5.10.

`games/Acca/entities/PlayerStructure.js`:

```js
class PlayerStructure {
  cell;            // back-ref to Cell
  ownerIndex;      // -1 if unowned
  type;            // see 5.10 catalog
  baseValue;       // initial purchase price
  currentValue;    // dynamic — grows with investment for shops, etc.
  maxCapital;      // cap on currentValue (district-scaled, see below)
  state;           // type-specific bag (tollAccrued, residents, vaultBalance, …)
  sabotagedUntilTurn; // -1 if not sabotaged
}
```

### Purchase flow

1. Player lands on an unowned structure.
2. TurnManager `_handleStructure` shows menu: `Buy ($currentValue)`, `Skip`.
3. On Buy: deduct money, set `ownerIndex`, push to `Player.ownedStructures`, emit `structure:bought`.
4. RegionSystem and StructureManager re-evaluate any cross-structure couplings (see 5.10).

Structures inherit the same liquidation rules as properties (see 5.7) — they are auctioned alongside properties when a player can't pay, ordered by `currentValue`.

System: `games/Acca/systems/StructureManager.js`.

## 5.10 Structure catalog

Catalog is config-driven via `cfg.structures`. v1 ships with the following:

| Type | Build cost | Cell restriction | Owner-on-land effect | Other-on-land / pass-through |
|------|------------|------------------|----------------------|------------------------------|
| `shop` | $250 | any structure cell | Invest cash; raises `currentValue` up to `maxCapital`. | Pay `currentValue × cfg.structures.shopVisitRate`. |
| `toll_gate` | $400 | path/junction cell | No-op (toll keeps accruing). | Pay accrued toll; toll then increases by `cfg.structures.tollIncrement`. Owner passes free but accrual still ticks. |
| `teleporter` | $500 | any structure cell | May teleport free to another owned teleporter. | May pay `cfg.structures.teleportFee` to use any of owner's teleporters. |
| `house` | $300 | residential cell | If owner is district mayor, collect resident taxes; otherwise no-op. Houses count toward factory production bonus. | Standard rent (`currentValue × cfg.structures.houseRentRate`). |
| `factory` | $600 | industrial cell | Collect produced resources for the turn; resource type set per-cell in map JSON. | Standard rent. |
| `police_station` | $700 | any structure cell | No-op. | No-op. Passive: while owned, blocks or reduces sabotage on owner's properties + structures in the same district (see `11_TradingAndSabotage.md`). |
| `vault` | $500 | any structure cell | Collect interest: `cash × cfg.structures.vaultInterestRate`. | Standard rent. Owner pays `cfg.structures.vaultUpkeep` end-of-turn regardless. |

### Shop max capital

A `shop`'s `maxCapital` scales with the owner's footprint in the same district:

```
maxCapital = cfg.structures.shopBaseCap
           + ownedStructuresInDistrict × cfg.structures.shopCapPerStructure
```

So consolidating structures in one district raises the ceiling on each shop's investable value.

### Houses ↔ factories coupling

A player's `housesOwned` count (sum of owned `house` *structures*) feeds the production bonus on every owned `factory` *structure*:

```
factoryProduction = cfg.structures.factoryBaseRate
                  × (1 + housesOwned × cfg.structures.factoryHouseBonus)
```

This coupling is structure-only — it does **not** affect business-slot factories from 5.5.

### Police station ↔ sabotage

When `11_TradingAndSabotage.md`'s sabotage system targets a property or structure, the targeting check first looks for an owner-controlled `police_station` in the same district. If one exists, sabotage is blocked or its duration reduced per `cfg.structures.policeProtectionTier`.

## 5.11 Overlap with businesses

`shop` and `factory` exist **both** as a business type (built inside a property — see 5.5) and as a player structure (a standalone cell — see 5.10). They are intentionally distinct:

| Aspect | Business shop/factory (5.5) | Structure shop/factory (5.10) |
|---|---|---|
| Lives on | A slot inside an owned `property` cell | Its own dedicated `structure` cell |
| Ownership | Implicit via parent property | Independent — bought when landed on |
| Scaling | `level` 1–3, employees | `currentValue` (shop) or houses-coupled production (factory) |
| Income path | Contributes to property rent | Charged directly on visit / collected on owner-land |

Map authors pick the model per cell at board-design time. A single cell is either a `property` (with business slots) or a `structure` (with one fixed structure type) — never both.

## 5.12 UI for structure management

The Manage menu gains a **Structures** tab alongside Properties, grouped by district:

- Per-structure row: type, current value / accrued state, district mayor status, idle/sabotage flag.
- Buttons: Invest (shop only), Demolish, View Linked (e.g. list of teleporter siblings).
- Shows projected income contribution ("Houses: 4 → factory bonus +40%").

Detailed UI design lives in `12_UI_HUD.md`.
