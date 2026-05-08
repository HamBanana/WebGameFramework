# 21 — Bugs and proposed changes

A live triage doc. Items move from **Open** → **In progress** → **Done** as commits land. The wording of each item below is preserved from the original draft so the source of the request stays visible; the **Status** and **Resolution** lines are appended as work progresses.

Conventions:
- **Status** — `Open`, `In progress`, or `Done` (with commit ref or doc cross-link).
- Items mixing bugs and design changes are split into the three categories at the bottom (Bugs / Design / UX) so it's clear what's being scoped where.

---

## A. Property management

### A.1 — Convertible properties

> The only current management option for properties is to sell them. Properties should be directly interchangeable, so they can be converted to another. Doing so should be equivalent to selling the property at its current value, and building the new one, plus a fee for the conversion.

**Status:** Open
**Scope:** Design change. New owner action **Convert to ...** in [`StructureManager.ownerOptionsFor`](../managers/StructureManager.js). Equivalent to refund `currentValue` + charge `newType.baseValue + cfg.structures.conversionFee` (flat fee, default $100). Investments above `baseValue` (Shop invest, House renovate, Vault upgrades) are forfeited; new structure starts at its own `baseValue`. Vault `storedMoney` must be withdrawn first; teleporter conversion orphans the partner. Mayor recompute fires.

## B. Resource handling

### B.1 — Every resource has a purpose

> All resources must have a purpose. Wood and steel is used for building properties. Electricity, water, food, coal and oil is used for population happiness and survival.

**Status:** Open
**Scope:** Two parts:
1. **Build cost in resources.** Add optional `resourceCost: { wood: N, steel: M }` per [`cfg.structures.catalog`](../config.js) entry. Suggested: Shop/House → 1 wood; Factory/Police → 1 steel; Vault → 2 steel.
2. **Consumption audit.** Walk every resource against [EconomyManager.runEndOfTurn](../managers/EconomyManager.js); close the doc/code gaps for water (population upkeep) and coal (industrial input).

## C. Properties

### C.1 — Toll gate income (config tweak only)

> Toll gates should not provide passive income.

**Status:** Open
**Resolution intent:** The current behavior is *not* passive income — toll receipts are paid directly on each pass-through (see [05_Structures §5.5–5.6](05_StructuresAndBuildings.md)). The misread reduces to a config tweak: lower `cfg.structures.tollIncrement` from $25 to $10 so the per-pass fee grows more gradually.

### C.2 — Tooltips on build menu

> Explanations of properties should be available when buying them, possibly by selecting a tooltip next to the menu item.

**Status:** Open
**Scope:** Each catalog row in the build menu shows a longer explainer (info icon or hover). Description text added to `cfg.structures.catalog[type].description`.

## D. Hostile takeover

### D.1 — Buy-from-owner silently skips turn

> The option to buy a property from an opposing player is displayed, even if the current player can't afford it. Selecting the option makes the turn be silently skipped. That's bad.

**Status:** Open
**Scope:** Bug. Per [05_Structures §5.5](05_StructuresAndBuildings.md), the option should already be "shown-disabled with reason." Fix in `_offerTakeoverOnLand` in [TurnManager.js](../managers/TurnManager.js); ensure the menu primitive ignores `onSelect` for `disabled` rows.

## E. UX

### E.1 — Scrollable game log

> The full game log is shown in pages, it should just be a scrollable list. There should be one log entry per action, describing what happened during that action (E.g. Player 1 - turn start: Taxes - District D: $53; Shop income: $37).

**Status:** Open
**Scope:** Replace pagination in [HUDRenderer](../ui/HUDRenderer.js) / [TurnManager](../managers/TurnManager.js) with a scrollable DOM list. Group lines by parent action so start-of-turn shows one entry with multiple sub-bullets. Auto-scroll to bottom on new entry; user scroll-up pauses auto-scroll.

### E.2 — "The Man" narrator

> When a significant event happens, an animated portrait of "The Man" should be shown in the notifications window, with a speech bubble giving a brief explanation of the event. The animation used should reflect his emotion. He is the ultimate enemy, but will not show anger or sadness, until he is threatened or defeated.

**Status:** Open
**Scope:** New `TheManNarrator` system. Sprite at `Sprites/Portraits/TheMan/`, registered as `GF.portraits['theMan']`, with rows: `idle`, `laughing`, `crying`, `angry`, `sad`, `talking`, `shouting`. Trigger table tunable in `cfg.theMan`. Per the design constraint: `angry` is gated on `cooperativeThreat ≥ 80%`; `sad`/`crying` are reserved for loss/threat states.

## F. Market

### F.1 + F.2 — Bundled market redesign

> Selling resources at the market makes no sense, and they should have the same price, whether you're buying or selling.
>
> Resources on the map should be limited supply, consumed by using them, but replenishable by factories. Prices of resources should reflect the scarcity of the resource, following the rules of supply and demand.

**Status:** Open
**Scope:** Replace [MarketSystem](../systems/MarketSystem.js)'s price-only model with stocks-and-flows:
- Each resource has a global supply pool: `MarketSystem.stock[resource]`.
- Player buys deplete the pool; sells replenish it. Factories optionally dump surplus to the pool. Resource cells (`mine`, `well`, `power_plant`) top up. Population consumption drains.
- **Price = `f(stock)`**, clamped by existing `priceFloorMul` / `priceCeilMul`.
- **No buy/sell spread** — `priceOf === sellPriceOf`. The "never-build exploit" stays closed because resources held off-market depress the global price.
- `netWorth(player)` valuation uses current `priceOf(r)` (no `× sellSpread`).
**Doc:** Full rewrite of [06_Resources](06_ResourcesAndMarket.md); drop `sellSpread` delta in [00_Index.md](00_Index.md).

## G. Trade

### G.1 — Trade can't be finalized

> The trade menu is broken, finishing a trade is impossible.

**Status:** Open
**Scope:** Bug. Investigate the confirm path in [TradeSystem](../systems/TradeSystem.js) and the trade builder UI in [TurnManager](../managers/TurnManager.js).

### G.2 — Trade UX rework

> The UX of the trading menu is horrible, it needs to be simpler and selecting specific values must be possible.

**Status:** Open
**Scope:** Numeric input fields + `all`/`0` shortcuts + ± steppers per resource. Live imbalance-ratio bar. Confirm button enabled iff `tradeSys.previewTrade(proposal).ok` (new method that runs preflight without executing).

## H. Movement

### H.1 — Cell to NW unreachable

> It's currently impossible to walk to a building located diagonally northwest of the players current location. That should be fixed.

**Status:** Open
**Scope:** Bug. Root cause: greedy cardinal-slot assignment in [BoardLoader.js](../managers/BoardLoader.js) orphans a NW neighbor when both true-N and true-W also exist. Fix: ensure every neighbor lands in *at least one* slot — add a fallback-claim pass after the greedy assignment for any orphans. Add a runtime assertion that `every(_neighbors, n => slots.includes(n))`.

### H.2 — Backtrack reverts state

> States should be saved between each square a player moves. If the player moves backwards, the previous state should be reloaded. Currently, you can move 6 squares by just moving back and forth between 2 squares.

**Status:** Open
**Scope:** [MovementController](../core/MovementController.js) keeps a snapshot stack `[{cell, snapshot}]` per `stepTo`. New `stepBack` action (key bind, e.g. Backspace) pops the latest snapshot and restores `money`, `resources`, structure dirty fields. Toll pass-through and chance-event side effects are explicitly reversible (`passThroughEffect` returns a refund token; `ChanceSystem.cancel(eventId)`). Snapshot stack clears at LANDING.

---

## Tracking by category

**Bugs (no design rework):** D.1, G.1, H.1, C.1 (config tweak)
**Design changes:** A.1, B.1, C.2, F.1+F.2
**UX additions:** E.1, E.2, G.2
**Movement state:** H.2
