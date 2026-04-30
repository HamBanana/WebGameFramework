# 09 — Regions and Mayors

## 9.1 Mayor election

A player becomes Mayor of a region when they own **every property cell** in that region. Resource cells (mine, forest, etc.) count as properties for this purpose. Non-purchasable cells (bank, chance, market) do not.

Detection lives in `games/Acca/systems/RegionSystem.js`. It listens to `property:bought` and `property:soldTo` and recomputes mayor status for the affected region:

```js
const region = regions[district];
const purchasable = cells.filter(c => c.district === district && isPurchasable(c));
const ownerSet = new Set(purchasable.map(c => c.ownerIndex));
if (ownerSet.size === 1 && !ownerSet.has(-1)) {
  newMayor = ownerSet.values().next().value;
} else {
  newMayor = -1;
}
if (newMayor !== region.mayorIndex) {
  emit('region:mayorChanged', { region, oldMayor, newMayor });
  region.mayorIndex = newMayor;
}
```

## 9.2 Tax collection

End-of-turn tick step 3 (see 4.3) calls `RegionSystem.collectTaxes(currentPlayer)`:

```js
for region in regionsControlledBy(currentPlayer):
  earned = round(region.population * region.taxRate * cfg.region.taxBase)
  player.addMoney(earned)
  emit('region:taxesPaid', { region, mayor: player, amount: earned })
```

`cfg.region.taxBase` is a small per-capita amount (default 0.5) so a region with 100 people and 10% tax rate yields $5 per turn, but at 30% tax with 200 people, $30 per turn — incentivizing growth at moderate happiness.

Taxes are paid only on the mayor's own turn end, not globally. This concentrates the income spike with the player whose strategy paid off this round.

## 9.3 Mayor controls

Available in the `MANAGE` modal under a "Mayor" tab (only visible if the player mayors at least one region):

- **Tax rate slider** — `0 .. cfg.region.maxTaxRate` (default 0.5). Live happiness target preview shown.
- **Festival** — pay $200 from the player's cash, region happiness +10 for 3 turns. One festival per region, cooldown 5 turns. Hooks `cfg.region.festivalCost` and `cfg.region.festivalDuration`.
- **Investment grant** — pay $300 to immediately add `cfg.region.grantPopulation` (default 5) to the population. Cooldown 5 turns.

## 9.4 Losing mayorship

Mayor status is lost when the trigger in 9.1 reverts: another player takes a property in the region (purchase, trade, takeover) or a property is auctioned back to the bank during bankruptcy.

When mayorship changes:

- `region.mayorIndex` updates.
- All active festivals/grants persist on the region (they're region-scoped, not player-scoped).
- Tax rate set by the previous mayor stays until the new mayor changes it (or, if region returns to "no mayor", the tax rate resets to the map default).
- Emit `region:mayorChanged`.

## 9.5 Migration interaction

Migration (see 08) automatically punishes mayors that overtax. The mayor's UI must surface the migration risk so the punishment is visible *before* the player presses confirm:

- "Projected migration: 8 residents leaving next turn." (computed from current happiness target).

## 9.6 Multiple regions, single mayor

A player can mayor multiple regions simultaneously. The HUD lists each with current happiness, population, tax rate, and projected income.

## 9.7 No-mayor regions

Regions without a mayor still tick population/happiness, but:

- No taxes are collected (the tax line item just doesn't fire).
- The map's default `taxRate` is used for happiness calculations.
