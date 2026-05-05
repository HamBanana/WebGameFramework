# 09 — Districts and Mayors

## 9.1 Terminology

- **District** — a named, configurable group of cells. Identified by name (string) in `cell.district`. Maintained by `games/Acca2/systems/DistrictSystem.js`.
- **Buildable cell** — a cell where a `PlayerStructure` may be built. Cells of type `buildable` and `empty` are buildable; resource cells, bank, market, and chance are not.
- **Mayor** — the player owning a *strict majority* of a district's buildable cells.

> **Δ v1.** v1 used "region" interchangeably and originally proposed *all* purchasable cells (resources included) as the mayoring set. v2 standardises on "district" and counts only `buildable`/`empty` cells.

## 9.2 Mayor election

`DistrictSystem.recomputeMayor(districtId)` runs every time a structure is built, traded, taken over, or removed. The rule:

```
buildableCells   = district.cells.filter(c => isBuildable(c))
ownerCounts      = countBy(c => c.structure?.ownerIndex)
total            = buildableCells.length
strictMajority   = floor(total / 2) + 1
mayorIndex       = entry of ownerCounts where count ≥ strictMajority, else -1
```

If `mayorIndex` differs from the current `district.mayorIndex`, the system:

1. Updates `district.mayorIndex`.
2. Removes the district id from the previous mayor's `districtsMayoredOf`.
3. Adds the district id to the new mayor's `districtsMayoredOf`.
4. Emits `district:mayorChanged({ district, oldMayor, newMayor })`.

`AccaGame` listens for that event to log it.

## 9.3 Tax collection

At start-of-turn, `EconomyManager.runStartOfTurn` calls `districtSys.collectTaxes(player)`. For each district the player mayors:

```
amount = ceil(district.population × district.taxRate × cfg.district.taxBase)
```

`taxBase` is a global multiplier (= 1) used to scale all taxes uniformly. The amount is added to the mayor's cash and `district:taxesPaid({district, mayor, amount})` is emitted.

A mayor's bonus on owning a structure within their district is `cfg.property.mayorBonus` ($50) — this is layered on top of `houseTaxIfMayor` ($60), making mayoring a profitable district worth real cash per turn.

## 9.4 Mayor controls

`TurnManager`'s "Manage → Mayor" submenu, per district:

- **Tax rate slider** — `districtSys.setTaxRate(player, districtId, rate)` (rate clamped 0..`cfg.district.maxTaxRate` = 0.5). Emits `district:taxRateChanged`.
- **Hold festival** — `districtSys.holdFestival(player, districtId, turn)`. Costs `cfg.district.festivalCost` ($200), boosts happiness by `festivalHappiness` (+10) for `festivalDuration` (3 turns). Cooldown `festivalCooldown` (5 turns).
- **Investment grant** — `districtSys.investmentGrant(player, districtId, turn)`. Costs `cfg.district.grantCost` ($300), adds `cfg.district.grantPopulation` (+5) instantly. Cooldown `grantCooldown` (5 turns).

Each helper returns `{ ok: bool, reason?: string, cost?: number }`. `TurnManager` displays the failure reason as a one-shot toast/log entry.

## 9.5 Losing mayorship

A mayor loses the district when another player owns more buildable cells (e.g. via takeover) — the next `recomputeMayor` resolves to a different mayor or no mayor. There is no grace period and no auction mechanic in v2.

> **Δ v1.** v1 considered an "auction on losing mayorship" mechanic. v2 doesn't ship it; tracked under `19_OpenQuestions.md`.

## 9.6 Migration interaction

The mayor of a *destination* district pays 1 oil per `cfg.population.oilPerMigrationUnit` (= 50) residents migrating in. If the mayor lacks oil, migration throttles. See `08_Population.md` §8.5.

## 9.7 Multiple districts, single mayor

A player may mayor multiple districts simultaneously. Each district is an independent mayor record. Tax-rate, festival, and grant are all per-district.

The HUD chronicles district counts in two places:

- **Top bar / Players panel** — beside each player, a small badge with the count of districts mayored.
- **District sidebar** — each district row shows its mayor's color/initial. Player rows in the player panel may show "Mayor of N districts".

## 9.8 No-mayor districts

If no player has a strict majority, `district.mayorIndex = -1`. In that case:

- Taxes are not collected.
- Festival and grant are unavailable (helpers reject).
- Migration into the district is uncapped by oil.
- Population still grows/declines based on happiness.

## 9.9 District data model

(See `03_BoardAndCells.md` §3.3 for the full schema and `16_DataModels.md` for the JSON shape.)

```js
class District {
  id;               // name string
  color;            // hex
  cells;            // Cell references
  mayorIndex;       // -1 if none
  taxRate;          // 0..maxTaxRate
  population; happiness;
  festivalUntilTurn; festivalCooldownUntil; grantCooldownUntil;
  birthsThisTurn; deathsThisTurn; migratedIn; migratedOut;
  specialty;        // resource id or null
}
```

`DistrictSystem` exposes:

- `init(cells, districtsMeta)` — build districts from map data.
- `recomputeMayor(districtId)` — recompute one district.
- `recomputeAll()` — recompute every district (used after save load).
- `collectTaxes(player)` — start-of-turn helper.
- `setTaxRate / holdFestival / investmentGrant`.
- `serialize() / deserialize(data)`.

## 9.10 Events emitted by DistrictSystem

| Event                      | Payload                                          | When                                         |
|----------------------------|--------------------------------------------------|----------------------------------------------|
| `district:mayorChanged`    | `{ district, oldMayor, newMayor }`               | After a recompute changes the mayor index.   |
| `district:taxesPaid`       | `{ district, mayor, amount }`                    | At start-of-turn tax collection.             |
| `district:taxRateChanged`  | `{ district, mayor }`                            | After `setTaxRate` succeeds.                 |
| `district:festival`        | `{ district, mayor }`                            | After `holdFestival` succeeds.               |
| `district:grant`           | `{ district, mayor }`                            | After `investmentGrant` succeeds.            |

## 9.11 Δ v1 roundup for this chapter

- "District" replaces "region".
- Mayor is a strict majority (>50%) of buildable cells, not "all property cells."
- Festival/grant cooldowns formalised (5 turns each).
- Mayor's oil burns to scale migration.
- Auction on loss not implemented.
