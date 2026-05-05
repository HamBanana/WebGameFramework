# 06 — Resources and Market

## 6.1 Resource catalog

Defined under `cfg.market.resources` and seeded in `cfg.startingResources`. v2 ships with seven resources:

| Resource      | Base price ($) | Starting qty | Notes |
|---------------|----------------|--------------|-------|
| `wood`        | 25             | 0            | Cheap building material; minor industry use. |
| `steel`       | 50             | 0            | Mid-tier industrial output (mine subType `iron`). |
| `electricity` | 35             | 3            | Powers shops, houses, police, teleporter, factory. |
| `water`       | 20             | 0            | Population upkeep + districts gain happiness with surplus. |
| `food`        | 30             | 3            | Population upkeep; default factory output. |
| `coal`        | 40             | 0            | Industrial input (mine subType `coal`). |
| `oil`         | 80             | 1            | Sabotage reagent (1 oil per attempt) + scales mayor's migration capacity. |

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

`games/Acca2/systems/MarketSystem.js`. The market is a simple rolling supply/demand model.

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
- Both write back through `serialize()` so saves capture the price state.

## 6.5 District specialty

A district may have a `specialty` field in the map JSON (or `null`). Specialty:

- Acts as the factory output resource for any factory in that district (overriding the `cfg.structures.factoryResource` default).
- Grants `cfg.market.specialtyBonus` extra units per relevant structure-tick (default 1).
- Grants `cfg.market.specialtyDiscount` price discount when buying the specialty in that district (default 0 — disabled in v2; reserved for future).

## 6.6 Market UI

The market browser is opened from the start-of-turn menu (Market) and from landing on a `market` cell. It is built by `TurnManager` — a list with one row per resource showing current buy/sell price and the player's quantity, plus per-row buy/sell quantity adjustments.

UI niceties:

- Buy is grey-disabled when the player can't afford the displayed quantity.
- Sell is grey-disabled when the player has zero of the resource.
- Price-change events flash the relevant row (signature-based — see `12_UI_HUD.md`).

## 6.7 Sell-spread and net-worth

`AccaGame.netWorth(player)` values resources at `basePrice × sellSpread = basePrice × 0.9`. This explicitly closes the v1 "never build, hoard at buy price" exploit identified in playtest.

> **Δ v1.** v1 valued resources at *buy* price in net worth. v2 uses *sell* price, which is 90% of buy price by default. In practice this nudges players toward converting hoarded resources into buildings.

## 6.8 Tradable contracts (post-v1, post-v2)

Reserved as a future feature: a player could lock a resource at a fixed price for N turns. Not implemented; tracked in `19_OpenQuestions.md`.

## 6.9 Δ v1 roundup for this chapter

- v1 had a similar 7-resource catalog. v2 makes the resource list explicit in `cfg.market.resources` rather than implied by `basePrices`.
- Sell spread (0.9) is enforced uniformly in `sellPriceOf` *and* in `netWorth` — v1 only had it in sell.
- Specialty bonus is on (1); specialty discount is off (0). v1 had both as future tweaks.
- Drift floor/ceiling clamp added (`priceFloorMul`, `priceCeilMul`) — v1's plan referenced free drift.
