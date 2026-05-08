# 06 — Resources and Market

## 6.1 Resource catalog

Defined under `cfg.market.resources` and seeded in `cfg.startingResources`. v2 ships with seven resources:

| Resource      | Base price ($) | Starting qty | Notes |
|---------------|----------------|--------------|-------|
| `wood`        | 25             | 0            | Build material — required to construct Shop / Toll Gate / House. |
| `steel`       | 50             | 0            | Build material — required for Teleporter / Factory / Police (1) and Vault (2). |
| `electricity` | 35             | 3            | Powers shops, houses, police, teleporter (factories don't draw electricity). |
| `water`       | 20             | 0            | Population upkeep — each house drinks 1 water/turn alongside food. |
| `food`        | 30             | 3            | Population upkeep — each house consumes 1 food/turn; also default factory output. |
| `coal`        | 40             | 0            | Industrial input — each factory burns 1 coal/turn alongside oil. |
| `oil`         | 80             | 1            | Industrial input + sabotage reagent (1 oil per attempt); scales mayor's migration capacity. |

These are the only resources v2 trades on the market; structures' upkeep references the `food` / `electricity` / `oil` subset.

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

`games/Acca/systems/MarketSystem.js`. **Stocks-and-flows model** — each resource has a global supply pool (`stock[r]`) and the spot price is derived directly from the pool size vs a per-resource basis. There is no buy/sell spread.

```js
class MarketSystem {
  constructor(cfg, eventBus) { /* basePrices, stock, basis from cfg.market */ }

  priceOf(resource);                 // spot price (single price for buy + sell)
  sellPriceOf(resource);             // alias of priceOf — kept for caller compat
  buy(player, resource, qty);        // {ok, totalCost, reason?}
  sell(player, resource, qty);       // {ok, totalProceeds, reason?}
  addStock(resource, qty, source);   // factory dump / cell yield / chance event
  drift();                           // no-op (price is stock-derived)
  serialize() / deserialize(data);
}
```

Pricing:

- `scale = clamp(priceFloorMul, priceCeilMul, basis / max(1, stock))`.
- `priceOf(r) = max(1, round(basePrice × scale))`.
- Defaults: `priceFloorMul = 0.4`, `priceCeilMul = 2.5`, `defaultStockBasis = 12`. Per-resource overrides via `cfg.market.stockBasis[r]`.
- Stock at basis → price = basePrice. Stock = 1 → price ≈ basePrice × ceil. Stock ≫ basis → price ≈ basePrice × floor.

Flows:

- **Buy** depletes the pool (`stock[r] -= qty`), pays `qty × priceOf(r)`. Refused if `stock < qty` (`pool depleted`).
- **Sell** replenishes the pool (`stock[r] += qty`), earns `qty × priceOf(r)`. No spread.
- **Factory output** mirrors `cfg.market.factoryDumpShare` of its production into the pool (default 0.5).
- **Resource cells** (mine/well/power_plant) on landing dump `cfg.market.cellMarketShare` of the player yield into the pool (default 0.5).
- **Chance events** can call `addStock(r, ±n, 'chance')` to spike or drain the pool.

Each flow calls `_maybeEmitPriceChange` so price updates propagate to `market:priceChanged` listeners (HUD, log, narrator). `drift()` is a no-op kept as a hook for callers that already invoke it per turn.

Buy/sell helpers:

- `buy()` — checks pool stock and affordability; deducts cost; pulls from `stock`; adds to player. Emits `market:bought` then `market:priceChanged`.
- `sell()` — checks player has the resource; pays out; adds to `stock`. Emits `market:sold