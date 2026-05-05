# 08 — Population

## 8.1 What population represents

Each region tracks a single integer **population**. Population is the labour pool for businesses in that region (employment) and the tax base for the Mayor (income). Population also has a 0–100 **happiness** score that drives growth and migration.

Population is per-region, not per-cell — properties draw from a shared regional pool.

## 8.2 Entity (lives on Region)

```js
{
  population;        // integer, ≥ 0
  basePopulation;    // map default (acts as a soft target)
  happiness;         // 0..100 (start at 50)
  employed;          // sum of business.employees in region (computed)
  birthsThisTurn;    // for HUD
  deathsThisTurn;    // for HUD
  migratedIn;        // for HUD
  migratedOut;       // for HUD
}
```

System: `games/Acca/systems/PopulationSystem.js`. One global `update()` ticks every region in `END_TURN`.

## 8.3 Happiness inputs

Per region, happiness drifts each turn toward a target driven by inputs:

| Factor | Direction | Magnitude (default) |
|--------|-----------|---------------------|
| Tax rate set by Mayor | Higher tax → lower happiness | -1 per percentage point above `cfg.population.taxComfortRate` (default 10%) |
| Employment (jobs ÷ population) | Higher → higher | +5 if ratio ≥ 0.7; +2 if ≥ 0.4; -3 if ≤ 0.2 |
| Service businesses | Higher → higher | +1 per active `service` business in region |
| Idle businesses | Higher → lower | `-cfg.population.happiness.idleBusinessPenalty` (default -2) per idle business |
| Food supply (regional, shared with population scaling) | Insufficient → lower | -10 if `food < population × cfg.population.foodPerCapita` |
| Water supply | Insufficient → lower | -10 if `water < population × cfg.population.waterPerCapita` |
| Chance events | Either | per-event delta |

Each turn:

```
target = clamp(50 + Σ(factors), 0, 100)
happiness = lerp(happiness, target, cfg.population.happinessLerp)   // default 0.4
emit population:happinessChanged if |Δ| ≥ 1
```

The mayor's tax UI shows a live preview of the resulting target so players can see the trade-off before committing.

## 8.4 Growth and decline

Population steps each turn:

```
births = round(population * cfg.population.birthRate * (happiness/100))
deaths = round(population * cfg.population.deathRate * ((100 - happiness)/100))
delta  = births - deaths
population = max(0, population + delta)
```

Defaults: `birthRate = 0.04`, `deathRate = 0.02`. Net positive at 50 happiness; net negative below ~33.

## 8.5 Migration

After growth, migration moves residents between regions:

1. Sort regions by happiness, descending.
2. For each region with happiness < `cfg.population.migrationFloor` (default 30), eligible movers = `floor(population * cfg.population.migrationRate)` (default 0.05).
3. Distribute movers proportionally to other regions whose happiness ≥ `migrationFloor`. If no destination qualifies, movers stay (effectively trapped).

Migration consumes 1 oil per `cfg.population.oilPerMigrationUnit` (default 50) movers from the destination's mayor (or, if no mayor, no oil). If oil unavailable, migration is reduced proportionally — this is the "Oil enables migration" hook from the resource outline.

Emits `population:migrated` per pair `(from, to, amount)`.

## 8.6 Employment matching

Each turn, after migration:

```
needed = sum(business.maxEmployees in region for active businesses)
available = population
hired = min(needed, available)
```

`hired` is then distributed across businesses in priority order: owner-set priority → tier descending → build order. Businesses below their `minEmployees` are marked idle (`idleReason = 'no_employees'`).

## 8.7 Mayor / tax interplay

Detailed in `09_RegionsAndMayors.md`. Population drives the *amount* of taxes; happiness drives the *willingness* (i.e., migration). Together they create the central balancing act.

## 8.8 HUD surface

A small badge near each region label shows current population, happiness face (😀 ≥ 70 / 🙂 ≥ 40 / 😐 ≥ 20 / 😠 < 20 — rendered as sprites, not emoji), and tax rate. End-of-turn tickers float numbers (+births, -deaths, -migrated) in the region's color.
