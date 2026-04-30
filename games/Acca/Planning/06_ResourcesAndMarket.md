# 06 — Resources and Market

This doc operationalizes the existing `Resource_Outline.txt`. Storage is unlimited (per the resource outline: *"Players have infinite storage capacity"*).

## 6.1 Resource catalog

Defined in `cfg.market.resources` and `cfg.market.basePrices`:

| Resource | Base price | Tier | Notes |
|----------|-----------|------|-------|
| `wood` | 25 | early | Construction & furniture. |
| `water` | 20 | early | Population, farms, services. |
| `food` | 30 | early | Population growth, services. |
| `coal` | 40 | mid | Industrial fuel, transitional. |
| `electricity` | 35 | mid | Universal upkeep. |
| `steel` | 50 | mid–late | Big builds and upgrades. |
| `oil` | 80 | late | Advanced factories, transport, migration mechanic (see 08). |

## 6.2 Sources

Per `Resource_Outline.txt`:

- **Owned cells** with type → resource: forest→wood, mine(coal)→coal, mine(iron)→steel, oil_rig→oil, well→water, farm→food, power_plant→electricity.
- **Owned businesses** producing the resource (see 5.5 catalog).
- **Markets** — buy at current market price.
- **Trades** between players.
- **Chance events** — see `10_ChanceEvents.md`.

## 6.3 Production cadence

Production runs at end-of-turn for the owner whose turn just ended (see 4.3 step 1). For each business:

```
if business.idle: skip
else:
  for each resource r in business.upkeep: deduct r from owner.resources
  if any r underflowed: business.idleReason = 'no_resources'; rollback this business; skip
  produce business.productionRate into owner.resources (or money if money producer)
```

This per-owner cadence (rather than global) means a player's economy advances when they take a turn. Designers can swap to global by setting `cfg.production.cadence = 'global'`.

## 6.4 Market system

`games/Acca/systems/MarketSystem.js`:

```js
class MarketSystem {
  prices;      // { [resource]: number }   — current price
  basePrices;  // immutable starting prices
  supplyMA;    // { [resource]: number }   — moving average of supply (sells)
  demandMA;    // { [resource]: number }   — moving average of demand (buys)

  buy(player, resource, qty);
  sell(player, resource, qty);
  drift();     // called once per global turn; nudges prices toward equilibrium
  priceOf(resource);
}
```

### 6.4.1 Pricing model

- Each transaction updates a moving average: `supplyMA = α·last + (1-α)·supplyMA`, with α from config (default 0.3).
- At drift time:
  ```
  ratio = (1 + demandMA) / (1 + supplyMA)
  target = clamp(basePrice * ratio, basePrice * 0.4, basePrice * 2.5)
  price = lerp(price, target, cfg.market.driftRate)   // default 0.2
  ```
- Rounding to whole money. Min price never below 1.
- Emits `market:priceChanged` whenever |Δprice| ≥ 1.

### 6.4.2 Buy / Sell

- `buy(player, resource, qty)` — price is current `priceOf(r)` × qty. Refuses if player.money < total. Increments demandMA.
- `sell(player, resource, qty)` — price is current price × qty × `cfg.market.sellSpread` (default 0.9). Increments supplyMA.

### 6.4.3 Market cell vs. inventory

Players can trade with the market only when standing on a `market` cell (or visiting via the `MANAGE` menu — designer choice; v1 default: market cell only, MANAGE shows view-only prices).

## 6.5 Regional specialization

Per the resource outline: *"Each region specializes in certain resources, encouraging trade and strategic control of key areas."* Operationalized as:

- A region can declare a `specialty` resource in the map JSON (`region.specialty`).
- Producers in that region produce +`cfg.market.specialtyBonus` units of that resource per turn (default +1).
- Consumers in that region consume +`cfg.market.specialtyDiscount` fewer units of upkeep when the upkeep is the specialty (default 0; opt-in for designers).

This rewards Mayor control of resource-rich regions.

## 6.6 Resource UI

In the HUD top bar (matching `Planning/defaultinterface.png`): a row of seven resource icons + counts for the active player. Hover/focus shows current market price and per-turn delta. Each icon is a sprite registered with the SpriteSystem under `res_wood`, `res_steel`, etc. — see `14_SpritesAndAssets.md`.

## 6.7 Tradable contracts (post-v1)

Captured here so v1 design doesn't paint into a corner:

- Long-term supply contracts ("X delivers 5 wood/turn for 5 turns at fixed price") would extend `MarketSystem` with a contract ledger. v1 keeps it spot-only.
