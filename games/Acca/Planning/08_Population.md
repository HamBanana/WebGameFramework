# 08 — Population

## 8.1 What population represents

Each district holds a population number that grows or shrinks every turn based on happiness, resource availability, and the mayor's policy. Population:

- Multiplies house owner income (each house in a district contributes `housePopContribution` residents to the district pool).
- Drives migration across districts (residents leave low-happiness districts and arrive in high-happiness ones).
- Is gated by the mayor's available oil — long-distance migration consumes 1 oil per `oilPerMigrationUnit` (= 50) residents moved.

The population tick is owned by `games/Acca/systems/PopulationSystem.js` and called by `EconomyManager.runEndOfTurn` once per turn.

## 8.2 Where population lives

There is no per-citizen entity. Population is a scalar per district, on the `District` instance:

```js
// games/Acca/systems/DistrictSystem.js — District (excerpt)
class District {
  population;            // current size (≥ 0)
  happiness;             // 0..100, lerped toward target via cfg.population.happinessLerp
  birthsThisTurn;        // telemetry (resets each tick)
  deathsThisTurn;
  migratedIn;
  migratedOut;
  festivalUntilTurn;     // when set > turnCounter, +happiness boost active
}
```

## 8.3 Happiness inputs

Each tick computes a target happiness (clamped 0..100) and lerps `district.happiness` toward it by `cfg.population.happinessLerp` (= 0.4).

| Factor                    | Direction | Magnitude (default) |
|---------------------------|-----------|---------------------|
| Baseline                  | + 50      | constant midpoint |
| Tax rate over comfort     | −         | `(taxRate − cfg.population.taxComfortRate) × 100` (e.g. 20% over 10% → −10) |
| Employment available      | +         | rough function of shops + factories per resident |
| Services (vault, shop)    | +         | small per-structure bonus |
| Food shortage             | −         | `cfg.structures.upkeep.shortagePenalty` per turn shortage occurred |
| Idle business (any cause) | −         | `cfg.population.happiness.idleBusinessPenalty` (= 2) per idle structure |
| Festival active           | +         | `cfg.district.festivalHappiness` (= 10) for `festivalDuration` turns |
| Plague chance event       | −         | per the chance event payload (e.g. −10) |

The exact formula lives in `PopulationSystem.tick` — designers tune via `cfg.population.*` and `cfg.district.*`.

## 8.4 Growth and decline

Per district, per turn:

```
births  = population × birthRate × (happiness / 100) × pressureFactor
deaths  = population × deathRate × (1 − happiness / 100)
population = clamp(population + births - deaths, 0, ∞)
```

- `birthRate` = 0.04, `deathRate` = 0.02 by default.
- `pressureFactor` is a soft cap that decays as population approaches a district's structural carrying capacity (number of houses + base population).
- `cfg.district.happinessGrowthMultiplier` = 1.5 boosts births in very-happy districts.

## 8.5 Migration

Residents move from low-happiness districts to high-happiness districts each tick.

- Eligible source: `district.happiness < migrationFloor` (= 30) and `population > 0`.
- Eligible destination: `district.happiness ≥ source happiness + Δ` (some hysteresis to avoid ping-pong).
- Volume: `population × cfg.population.migrationRate` (= 0.05 → up to 5% per turn).
- **Oil cost:** the mayor of the *destination* district pays 1 oil per `cfg.population.oilPerMigrationUnit` (= 50) residents arriving. If the mayor doesn't have enough oil, migration is throttled to whatever they can afford.

This makes oil economically central — the mayor of a booming district burns through oil and either has to buy more on the market, build more factories (which themselves need oil), or accept slower growth.

## 8.6 Employment matching

Each turn, employment is recomputed:

- `factoryJobs` (= 4) per owned factory in the district.
- `shopJobs` (= 2) per owned shop in the district.
- Houses contribute population (residents).
- Employed-fraction = `min(jobs, residents) / residents`.

Higher employment → small happiness bonus. Low employment → small happiness drag. The exact formula is configurable via `cfg.population.*`.

## 8.7 Mayor / tax interplay

A mayor-set tax rate ab