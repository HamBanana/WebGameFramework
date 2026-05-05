# 20 — Changes

A running log of behavior, balance, and structural changes vs Acca v1, plus subsequent v2-internal changes. Each entry has a date, a one-line summary, the file(s) touched, and the rationale.

## v2 vs v1 — initial split (date n/a — v2 forked from v1)

| # | Change | Files | Rationale |
|---|--------|-------|-----------|
| 1 | Split monolithic `AccaGame.js` into `core/`, `managers/`, `render/`, `ui/`, `systems/`. | `games/Acca2/**` | Modularity, easier maintenance. |
| 2 | Drop Property and Business entities; one PlayerStructure per cell. | `core/PlayerStructure.js`, `managers/StructureManager.js` | Two-level hierarchy added complexity without changing core decisions. |
| 3 | Drop Company entity; players act directly. | (n/a — entity removed) | Same — see `07_Companies.md`. |
| 4 | Rename Region → District everywhere; drop Region tier. | `systems/DistrictSystem.js` | Simplifies terminology. |
| 5 | DOM HUD instead of canvas HUD. | `index.html`, `styles/*`, `ui/HUDRenderer.js` | More readable, screen-reader-friendlier, easier to iterate. |
| 6 | Add `MoneyAnimations` (cash-delta flashes + floating "+$X" + coin burst). | `ui/MoneyAnimations.js`, `styles/theme.css` | Visceral feedback on cash changes. |
| 7 | Camera moves to `CameraManager` with lerp + spotlight. | `managers/CameraManager.js`, `render/BoardRenderer.js` | Lets prompts highlight the relevant cell. |
| 8 | Hybrid `NetWorthOrLastStanding` win type, set as default. | `managers/WinConditionChecker.js`, `cfg.win.type` | Single condition that aligns with most playtests. |
| 9 | Catch-up bonus for trailing players. | `managers/EconomyManager.js`, `cfg.catchUp.*` | Keeps lagging players in the game. |
| 10 | Resources count at sell-spread in net worth (not buy price). | `AccaGame.netWorth`, `cfg.market.sellSpread` | Closes the v1 "never build, hoard at buy price" exploit. |
| 11 | Vault levels with capacities; vault interest. | `core/PlayerStructure.js`, `managers/StructureManager.js`, `cfg.structures.vaultLevels` | Adds a sink for cash that's safer than buildings. |
| 12 | Idle-on-shortage upkeep (vs v1's destroy-on-shortage plan). | `managers/EconomyManager.js`, `cfg.structures.upkeep` | Soft penalty, no cascading bankruptcies. |
| 13 | Sabotage now costs 1 oil (in addition to cash). | `systems/TradeSystem.js`, `cfg.sabotage.oilCost` | Gives oil a non-migration use. |
| 14 | Police protection — sabotage rejected near active police stations. | `systems/TradeSystem.js`, `cfg.structures.policeProtectionTier` | Strategic counter to sabotage spam. |
| 15 | Trade imbalance ratio guard (5×). | `systems/TradeSystem.js`, `cfg.trade.maxImbalanceRatio` | Anti-collusion. |
| 16 | Cooperative threat counter (`cfg.mode = "cooperative"`). | `AccaGame`, `cfg.cooperative.*` | Optional shared-fail mode for coop play. |
| 17 | Mayor festival/grant cooldowns formalised (5 turns each). | `systems/DistrictSystem.js`, `cfg.district.*Cooldown` | Prevents per-turn spam. |
| 18 | Migration is gated by mayor's oil consumption. | `systems/PopulationSystem.js`, `cfg.population.oilPerMigrationUnit` | Connects population growth to the resource economy. |
| 19 | Default win-target picker added in `game.json` ($3k / $5k / $7.5k / $10k). | `game.json` | Makes match length adjustable from the launcher. |
| 20 | Map JSON adds `nextCellId`, `nextDistrictId`, `cellCount` hints for MapCreator. | `maps/*.json` | MapCreator round-trip preservation. |

## Subsequent v2 changes

When you change v2 going forward, append a row here in the form:

```
| YYYY-MM-DD | One-line summary | files touched | rationale |
```

Keep entries in newest-first order under this section. Cross-link to a corresponding playtest report or open question when applicable.

| Date       | Change | Files | Rationale |
|------------|--------|-------|-----------|
| 2026-05-04 | Added the v2 Planning/ folder (this set of docs). | `games/Acca2/Planning/*` | Make the v2 codebase navigable for future Claude/dev sessions. |
