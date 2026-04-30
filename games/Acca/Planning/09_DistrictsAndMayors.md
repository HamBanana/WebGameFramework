# 09 — Districts and Mayors

## Terminology

- **District** — a named group of squares on the board. `cell.district` holds the district id string (e.g. `"District A"`). Managed by `games/Acca/systems/DistrictSystem.js`.
- **Region** — a higher-level grouping of districts (future feature, not yet implemented).

---

## 9.1 Mayor election

A player becomes Mayor of a district when they own **every buildable square** in that district. Non-buildable cells (bank, chance) do not count.

Detection lives in `games/Acca/systems/DistrictSystem.js`. It is triggered by `property:bought` and `property:soldTo` via `recomputeMayor(districtId)`:

```js
const district = districtSys.get(districtId);
const buildable = district.cells.filter(c => c.type === 'buildable');
const owners = new Set(buildable.map(c => c.structure?.ownerIndex ?? -1));
if (owners.size === 1 && !owners.has(-1)) {
  newMayor = owners.values().next().value;
} else {
  newMayor = -1;
}
if (newMayor !== district.mayorIndex) {
  emit('district:mayorChanged', { district, oldMayor, newMayor });
  district.mayorIndex = newMayor;
}
```

## 9.2 Tax collection

End-of-turn tick step 3 (see 4.3) calls `DistrictSystem.collectTaxes(currentPlayer)`:

```js
for district in districtsControlledBy(currentPlayer):
  earned = round(district.population * district.taxRate * cfg.district.taxBase)
  player.addMoney(earned)
  emit('district:taxesPaid', { district, mayor: player, amount: earned })
```

`cfg.district.taxBase` is a small per-capita amount (default 0.5) so a district with 100 people and 10% tax rate yields $5 per turn, but at 30% tax with 200 people, $30 per turn — incentivizing growth at moderate happiness.

Taxes are paid only on the mayor's own turn end, not globally.

## 9.3 Mayor controls

Available in the `MANAGE` modal under "Mayor controls" (only visible if the player mayors at least one district):

- **Tax rate slider** — `0 .. cfg.district.maxTaxRate` (default 0.5). Live happiness target preview shown.
- **Festival** — pay $200 from the player's cash, district happiness +10 for 3 turns. One festival per district, cooldown 5 turns. Hooks `cfg.district.festivalCost` and `cfg.district.festivalDuration`.
- **Investment grant** — pay $300 to immediately add `cfg.district.grantPopulation` (default 5) to the population. Cooldown 5 turns.

## 9.4 Losing mayorship

Mayor status is lost when the trigger in 9.1 reverts: another player takes a buildable square in the district (purchase, trade, takeover) or a square is lost during bankruptcy.

When mayorship changes:

- `district.mayorIndex` updates.
- All active festivals/grants persist on the district (they're district-scoped, not player-scoped).
- Tax rate set by the previous mayor stays until the new mayor changes it (or, if district returns to "no mayor", the tax rate resets to the map default).
- Emit `district:mayorChanged`.

## 9.5 Migration interaction

Migration (see 08) automatically punishes mayors that overtax. The mayor's UI must surface the migration risk so the punishment is visible *before* the player presses confirm:

- "Projected migration: 8 residents leaving next turn." (computed from current happiness target).

## 9.6 Multiple districts, single mayor

A player can mayor multiple districts simultaneously. The left sidebar lists each district with current happiness, population, tax rate, and mayor. The Mayor menu in `TurnManager._showMayorMenu` lists each district the current player controls.

## 9.7 No-mayor districts

Districts without a mayor still tick population/happiness, but:

- No taxes are collected (the tax line item just doesn't fire).
- The map's default `taxRate` is used for happiness calculations.

## 9.8 District data model

```js
// games/Acca/systems/DistrictSystem.js
class District {
  id;                      // string — matches cell.district values
  color;                   // hex string for tinting and sidebar
  cells;                   // array of Cell references
  mayorIndex;              // -1 if no mayor
  taxRate;                 // 0..cfg.district.maxTaxRate
  population;
  happiness;               // 0..100
  festivalUntilTurn;
  grantCooldownUntil;
  festivalCooldownUntil;
  birthsThisTurn;
  deathsThisTurn;
  migratedIn;
  migratedOut;
  specialty;               // resource id or null (from map JSON)
}
```

## 9.9 Events emitted by DistrictSystem

| Event | Payload |
|-------|---------|
| `district:mayorChanged` | `{ district, oldMayor, newMayor }` |
| `district:taxesPaid` | `{ district, mayor, amount }` |
| `district:taxRateChanged` | `{ district, mayor }` |
| `district:festival` | `{ district, mayor }` |
| `district:grant` | `{ district, mayor }` |
