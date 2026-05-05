# Acca v2 — Planning Index

Location: `games/Acca2/Planning/`

This folder is the design/architecture bible for **Acca v2**, the modular rewrite of Acca on top of `GameFramework`. The intent is that anyone (or any future Claude session) can read this set of files and (a) understand the v2 codebase as it stands, and (b) extend or rebuild it without reverse-engineering intent from JS files.

Acca v2 is a city-building board game (top-down, 2–4 players, hot-seat). Players move around a connected grid, buy buildable cells, build income-producing structures (shops, houses, factories, vaults, …), corner districts to become Mayor, manipulate a 7-resource market, and trade or sabotage each other to victory.

The planning set is split into self-contained documents. Read them in order for a top-down view, or jump straight to a topic.

## Reading order

| #   | Document                                  | Purpose |
|-----|-------------------------------------------|---------|
| 00  | `00_Index.md`                             | This file — entry point, glossary, conventions, deltas vs Acca v1. |
| 01  | `01_GameOverview.md`                      | Vision, pillars, target experience, scope of v2. |
| 02  | `02_Architecture.md`                      | How v2 sits on top of GameFramework: modules, ownership, runtime flow. |
| 03  | `03_BoardAndCells.md`                     | Cell types, neighbor wiring, districts, map JSON spec. |
| 04  | `04_PlayerAndTurn.md`                     | Turn state machine, controls, Player entity, dice, movement. |
| 05  | `05_StructuresAndBuildings.md`            | The seven structure types, build flow, owner/visitor effects, upkeep. |
| 06  | `06_ResourcesAndMarket.md`                | The 7 resources, production, market dynamics, pricing. |
| 07  | `07_Companies.md`                         | (v2) — companies are unimplemented; the doc records the delta from v1. |
| 08  | `08_Population.md`                        | Population dynamics, happiness, employment, migration. |
| 09  | `09_DistrictsAndMayors.md`                | District control, Mayor role, taxes, mayor controls (festival, grant). |
| 10  | `10_ChanceEvents.md`                      | Chance pool, event categories, weighting, hooks. |
| 11  | `11_TradingAndSabotage.md`                | Trades, hostile takeovers, sabotage. |
| 12  | `12_UI_HUD.md`                            | DOM topbar/sidebars, canvas overlays, menus, notifications. |
| 13  | `13_AudioVisualFeedback.md`               | Sound, particles, money animations, camera, theming. |
| 14  | `14_SpritesAndAssets.md`                  | Sprite name registry and animation contracts. |
| 15  | `15_WinConditionsAndMultiplayer.md`       | Win types, competitive vs cooperative, end-game flow. |
| 16  | `16_DataModels.md`                        | Canonical schemas: `GAME_CONFIG`, map JSON, save snapshot. |
| 17  | `17_FileStructure.md`                     | Where each file lives under `games/Acca2/`. |
| 18  | `18_ImplementationRoadmap.md`             | Current implementation state and the next phases of work. |
| 19  | `19_OpenQuestions.md`                     | Unresolved design questions and parked debates. |
| 20  | `20_Changes.md`                           | Running log of behavior/balance changes vs Acca v1. |
| —   | `API_Reference.md`                        | Per-file class/method reference for every source file under `games/Acca2/`. |

## What's different about v2 (top-level deltas vs Acca v1)

These are the structural changes that ripple through the entire planning set. Each subsequent doc calls them out again where they're relevant.

- **Module split.** v1's monolithic `AccaGame.js` is broken into `core/`, `managers/`, `render/`, `ui/`, `systems/`, plus the existing `sprites/` / `utils/` / `themes/` / `maps/`. The shell file (`AccaGame.js`) only orchestrates.
- **No Property entity, no Business entity.** A buildable cell *is* the host for a single `PlayerStructure`. There is no two-level "property holds many businesses" hierarchy; one cell hosts one structure.
- **No Company entity.** Players act directly. Industry bonuses, multi-company orchestration, etc. are not implemented in v2 (see `07_Companies.md`).
- **DOM HUD.** The topbar, district sidebar, players panel, and notifications panel are real DOM elements styled from `styles/*.css`. The board, die, and menu modal are still canvas-rendered. v1's HUD was canvas-only.
- **Default win condition is `NetWorthOrLastStanding`.** v2 ships with this hybrid default; the four condition types from v1 are still configurable.
- **Spotlight + camera lerp.** Camera is owned by `CameraManager` and supports a "spotlight" effect (dimmed screen, glowing hole, pulsing halo) used to draw attention to a specific cell during prompts.
- **Cooperative threat track.** A counter (`game.cooperativeThreat`) accumulates each turn and from low-happiness districts; when it hits the limit, the table loses cooperatively. Off by default (`mode: "competitive"`).
- **Catch-up bonus.** A trailing player below `catchUp.threshold` of the leader's net worth receives `catchUp.amount` cash at the start of their turn.
- **Resource sell-spread in net-worth.** `netWorth()` values resources at `basePrice × sellSpread` (≈ 90%), closing the v1 "never-build" exploit where net-worth tracked buy price exactly.

Detailed deltas are tagged inline as **"Δ v1"** boxes in each chapter.

## Conventions used in these docs

- **File path bullet** — every time a doc names a piece of code that should exist, it includes the path it would live at, e.g. `games/Acca2/managers/EconomyManager.js`. Matches the user rule: *"Always include paths to where a given file belongs in the file structure."*
- **Sprite names, never paths** — when a doc references art, it uses the sprite name (e.g. `cell_property`, `token_red`). Asset paths only appear in `framework/sprites/*` and are out of scope here. Matches the framework rule: *"FRAMEWORK_CONFIG must not include full asset paths."*
- **Config-first** — anything a designer would tune (prices, happiness curves, chance weights) is described as a key under `GF.GAME_CONFIG` in `games/Acca2/config.js`, not hard-coded.
- **Modular & extensible** — every subsystem is a class with a small, named API. Cross-module communication goes through the framework's `EventBus` (`engine.events`), not direct method calls.
- **No HTML files added.** The only HTML files in `games/Acca2/` are the existing `index.html` and `MapCreator/index.html`. Layout that isn't provided by those goes through DOM nodes already declared in `index.html` plus the canvas.
- **Δ v1 boxes** call out specific changes from Acca v1.

## Glossary

- **Cell** — one tile on the board. Has type, optional district, neighbors. See `core/Cell.js`.
- **Structure** (a.k.a. **PlayerStructure**) — a built object owned by a player on a buildable cell. Encompasses what v1 called "properties + businesses" in one entity. See `core/PlayerStructure.js`.
- **Buildable cell** — a cell of type `buildable` (or `empty`). The only cell type on which a `PlayerStructure` may be built.
- **District** — a named group of cells. `cell.district` holds the district's name. Owning a strict majority of buildable cells in a district makes the player Mayor. Managed by `systems/DistrictSystem.js`.
- **Mayor** — the player who owns a strict majority of buildable cells in a district. Earns taxes, can adjust tax rate, hold festivals, issue investment grants.
- **Turn stage** — a phase inside a player's turn (`TURN_START` → `ROLL` → `MOVE` → `LANDING` → `LAND_PROMPT` → `END_TURN` → `BETWEEN`). Defined in `core/Constants.js`.
- **GF** — the framework namespace exposed on `window.GF` by `framework/GameFramework.bundle.js`. `GF.Acca` is the v2 game's namespace.
- **Catalog** — `cfg.structures.catalog` lists the structure types players can build, with cost.

## How to extend the planning

1. Drop a new `NN_TopicName.md` into this folder.
2. Add a row to the table above.
3. Update `19_OpenQuestions.md` if the new topic raises any.
4. Cross-reference: link from related docs (e.g. a new doc on "Auctions" should be linked from `05_StructuresAndBuildings.md`).
5. If the topic introduces new code, also update `17_FileStructure.md` and `API_Reference.md`.
