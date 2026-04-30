# 18 — Implementation Roadmap

The roadmap is organized into phases that build on each other. Each phase is shippable: the game is playable at the end of every phase, just with fewer features than the next.

The phases below extend the original Gameplan.txt roadmap, which covered Phase 1–6 at a high level. This doc breaks each phase into concrete tickets that map to files in `17_FileStructure.md`.

---

## Phase 0 — Refactor (no behavior change)

Goal: split `AccaGame.js` into the modules in 17.

| # | Ticket | Files |
|---|--------|-------|
| 0.1 | Extract `Cell` to `entities/Cell.js`. | entities/Cell.js |
| 0.2 | Extract `Player` to `entities/Player.js`. | entities/Player.js |
| 0.3 | Extract `DieController` and `MovementController`. | systems/DieController.js, systems/MovementController.js |
| 0.4 | Extract `Menu` to `ui/Menu.js`. | ui/Menu.js |
| 0.5 | Extract `TurnManager` to `systems/TurnManager.js`. | systems/TurnManager.js |
| 0.6 | Move board init/render into `systems/Board.js`. | systems/Board.js |
| 0.7 | Update `index.html` script ordering per 17.1. | index.html |
| 0.8 | Add `utils/validate.js` and `utils/format.js`. | utils/* |
| 0.9 | Re-run `default.json` to confirm everything still loads. | — |

Definition of done: gameplay identical to current `AccaGame.js`, but split.

---

## Phase 1 — Map schema v2 + extra cell types

Goal: support resource cells and richer regions in the map JSON; render them.

| # | Ticket | Files |
|---|--------|-------|
| 1.1 | Bump `default.json` to schema v2 (per 03 + 16). | maps/default.json |
| 1.2 | Add resource cell sprite registrations. | sprites/cells.js |
| 1.3 | Render new cell types (forest, mine, oil_rig, well, farm, power_plant, market). | systems/Board.js |
| 1.4 | Region tinting under cells. | systems/Board.js |
| 1.5 | MapCreator support for new cell types and region.specialty. | MapCreator/launch.js |
| 1.6 | `MapLoader.validateMap` enforces v2 invariants. | utils/validate.js |

---

## Phase 2 — Resources & market

Goal: full resource economy with prices and the market modal.

| # | Ticket | Files |
|---|--------|-------|
| 2.1 | Implement `MarketSystem` (prices, supply/demand MA, drift). | systems/MarketSystem.js |
| 2.2 | `MarketModal` for buy/sell. | ui/modals/MarketModal.js |
| 2.3 | `ResourceStrip` widget in HUD. | ui/widgets/ResourceStrip.js |
| 2.4 | Wire `cell:land` for `market` cells to MarketModal. | systems/TurnManager.js |
| 2.5 | Resource sprites. | sprites/resources.js |
| 2.6 | End-of-turn `MarketSystem.drift()` invocation. | systems/TurnManager.js |
| 2.7 | Persist market in save payload. | systems/AccaSave.js |

---

## Phase 3 — Properties, businesses, companies

Goal: full economic loop on properties.

| # | Ticket | Files |
|---|--------|-------|
| 3.1 | `Property`, `Business`, `Company` entities. | entities/* |
| 3.2 | `cfg.businesses.catalog` with v1 catalog (per 05). | config.js |
| 3.3 | Build/upgrade/demolish flows in `ManageModal`. | ui/modals/ManageModal.js |
| 3.4 | End-of-turn business production + upkeep. | systems/TurnManager.js |
| 3.5 | Rent calculation in `_handleProperty` includes businesses + sabotage. | systems/TurnManager.js |
| 3.6 | Player.level computation. | entities/Player.js |
| 3.7 | Business sprites. | sprites/businesses.js |
| 3.8 | Property tier upgrade UI. | ui/modals/PropertyDetailModal.js |

---

## Phase 4 — Population + Mayor + Taxes

Goal: regions feel alive.

| # | Ticket | Files |
|---|--------|-------|
| 4.1 | `Region` entity & `RegionSystem`. | entities/Region.js, systems/RegionSystem.js |
| 4.2 | `PopulationSystem` (growth, happiness, employment, migration). | systems/PopulationSystem.js |
| 4.3 | Tax collection at end-of-turn (per active mayor). | systems/RegionSystem.js |
| 4.4 | Mayor UI in `ManageModal` (tax slider, festival, grant). | ui/modals/ManageModal.js |
| 4.5 | Mayor election listeners. | systems/RegionSystem.js |
| 4.6 | Region badge rendering (population + happiness face + tax). | systems/Board.js |
| 4.7 | Population sprites. | sprites/ui_icons.js |

---

## Phase 5 — Trading, takeover, sabotage

Goal: players act on each other.

| # | Ticket | Files |
|---|--------|-------|
| 5.1 | `TradeSystem` core (atomic asset swap). | systems/TradeSystem.js |
| 5.2 | `TradeModal` two-column UI. | ui/modals/TradeModal.js |
| 5.3 | Hostile takeover flow. | systems/TradeSystem.js, ui/modals/ManageModal.js |
| 5.4 | Sabotage flow. | systems/TradeSystem.js |
| 5.5 | Sabotaged property rendering + smoke particles. | systems/Board.js |
| 5.6 | Anti-imbalance + cooldown enforcement. | systems/TradeSystem.js |

---

## Phase 6 — Chance events

Goal: the chance pool is fully wired.

| # | Ticket | Files |
|---|--------|-------|
| 6.1 | `ChanceSystem` with weighted draw + recent-guard. | systems/ChanceSystem.js |
| 6.2 | All effect handlers (`money`, `money_pct`, `resource`, `happiness`, `migration_in`, `sabotage`, `free_property`, `modify_die`). | systems/ChanceSystem.js |
| 6.3 | `ChanceModal`. | ui/modals/ChanceModal.js |
| 6.4 | Expanded pool in `cfg.chance` to cover the categories listed in 10.4. | config.js |
| 6.5 | Chance-card sprites. | sprites/ui_icons.js |

---

## Phase 7 — Polish (audio, particles, theming, accessibility)

| # | Ticket | Files |
|---|--------|-------|
| 7.1 | Hook each event in 02 to `AudioSystem` (per 13.1). | many |
| 7.2 | Particles per 13.2. | systems/Board.js, ParticleSystem usage |
| 7.3 | Themes: `theme_classic`, `theme_warm`. | themes/* |
| 7.4 | Color-blind palette toggle. | config.js, HUD |
| 7.5 | Notifications widget. | ui/Notifications.js |
| 7.6 | Camera follow during MOVE. | framework/systems/Camera.js |

---

## Phase 8 — Save / load / cooperative / scenarios

| # | Ticket | Files |
|---|--------|-------|
| 8.1 | `AccaSave.serialize` / `.deserialize`. | systems/AccaSave.js |
| 8.2 | F5/F9 quick save/load. | systems/TurnManager.js |
| 8.3 | Cooperative mode toggle + threat track. | systems/ScenarioSystem.js |
| 8.4 | Ship `scenarios/oil_rush.json`. | scenarios/* |
| 8.5 | Title-screen scenario selector. | AccaGame.js |

---

## Phase 9 — Test harness

Pure-logic tests for: MarketSystem math, PopulationSystem math, RegionSystem mayor detection, ChanceSystem draw weighting. Each as a Node script under `games/Acca/__tests__/`.

---

## Cross-phase guardrails

- **Don't merge to "main" with a broken build.** After each phase, the game must launch from `launcher.html` and play through one match.
- **Save format never changes silently.** Bumping `version` requires a migration helper or a discard-and-warn.
- **Config is the contract.** Any number that designers might want to tweak goes in `config.js` first; code reads from it second.
- **Events go through the bus.** No subsystem reaches into another's internals.
