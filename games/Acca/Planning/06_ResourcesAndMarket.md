# 06 — Resources and Market

## 6.1 Resource catalog

Defined under `cfg.market.resources` and seeded in `cfg.startingResources`. ships with seven resources:

| Resource      | Base price ($) | Starting qty | Notes |
|---------------|----------------|--------------|-------|
| `wood`        | 25             | 0            | Cheap building material; minor industry use. |
| `steel`       | 50             | 0            | Mid-tier industrial output (mine subType `iron`). |
| `electricity` | 35             | 3            | Powers shops, houses, police, teleporter, factory. |
| `water`       | 20             | 0            | Population upkeep + districts gain happiness with surplus. |
| `food`        | 30             | 3            | Population upkeep; default factory output. |
| `coal`        | 40             | 0            | Industrial input (mine subType `coal`). |
| `oil`         | 80             | 1            | Sabotage reagent (1 oil per attempt) + scales mayor's migration capacity. |

These are the only resources traded on the market; structures' upkeep references the `food` / `electricity` / `oil` subset.

## 6.2 Sources

- **Passive yield** — every owned structure ticks `cfg.market.passiveYield` (default 1) of any matching specialty resource each turn (gated by district specialty).
- **Resource cells** — landing on a `power_plant`, `well`, or `mine` cell yields the cell's resource as a small bonus.
- **Factory** — the most reliable source. Output = `factoryBaseRate × (1 + houseBonus × housesInDistrict)` of the district's `specialty` (or `cfg.structures.factoryResource`, default `food`, when no specialty is set).
- **Chance events** — `oil_strike`, `industrial_surge`, `coal_seam`, `energy_surplus`, `rainy_season`, `drought` etc. add or remove resources (see `10_ChanceEvents.md`).
- **Market** — `MarketSystem.buy(player, resource, qty)` lets the player buy at the current price.

## 6.3 Production cadence

`EconomyManager.runStartOfTurn(player)` walks the player's `ownedStructures` and applies the type-specific yield. Order of operations:

1. **Passive yield** — district specialty bonus where applicable.
2. **Shops** — visit-based cash income: `currentValue × shopVisitRate × structuresInDistrictBonus`.
3. **Houses** — owner cash income (`houseOwnerIncome` 18) plus population-driven rent if any visitor passed last turn.
4. **Factories** — output the specialty resource (or fallback `food`).
5. **Toll/teleporter/police/vault** — small fixed owner income.
6. **Vault interest** — `storedMoney × vaultInterestRate` (1% per turn) added to `storedMoney`.

End-of-turn (`runEndOfTurn`) applies upkeep (food/electricity/oil consumption — see §5.8) and then `marketSys.drift()` updates prices.

## 6.4 Market system

`games/Acca/systems/MarketSystem.js`. The market is a simple rolling supply/demand model.

```js
class MarketSystem {
  constructor(cfg, eventBus) { /* prices, supplyMA, demandMA from cfg.market */ }

  priceOf(resource);                 // current buy price
  sellPriceOf(resource);             // current price × cfg.market.sellSpread (0.9)
  buy(player, resource, qty);        // {ok, totalCost, reason?}
  sell(player, resource, qty);       // {ok, totalProceeds, reason?}
  drift();                           // call once per turn end
  serialize() / deserialize(data);
}
```

Drift logic:

- For each resource each `drift()` call:
  - `ratio = (1 + demandMA) / (1 + supplyMA)`.
  - `target = clamp(basePrice × ratio, basePrice × priceFloorMul, basePrice × priceCeilMul)`.
    - Defaults: floor = 0.4×, ceil = 2.5×.
  - `next = max(1, round(current + (target - current) × driftRate))` (driftRate = 0.2).
- After the price update, `supplyMA[r] *= 0.85` and `demandMA[r] *= 0.85` so old transactions stop dominating.
- Buy/sell themselves smooth toward the new tick: `MA[r] = α × qty + (1 - α) × MA[r]` with `α = movingAvgAlpha` (= 0.3).
- Emits `market:priceChanged({resource, oldPrice, newPrice, delta, ratio})` whenever a price actually changes. `AccaGame` only logs the change to the in-game notifications when the relative change ≥ 25%.

Buy/sell helpers:

- `buy()` — checks affordability; deducts `qty × priceOf(resource)`; bumps `demandMA[resource]`; adds resource to player's pile. Emits `market:bought`.
- `sell()` — checks player has the resource; pays out `qty × sellPriceOf(resource)`; bumps `supplyMA[resource]`. Emits `market:sold`.
- Both write back through `serialize()` so saves capture the price st