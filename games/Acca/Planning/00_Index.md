# Acca — Planning Index

Location: `games/Acca/Planning/`

This folder is the design/planning bible for **Acca**, a top-down board game built on top of `GameFramework`. The intent is that anyone (or any future Claude session) can read this set of files and produce a fully functional implementation of the game without having to reverse-engineer intent from code.

The planning set is split into self-contained documents. Read them in order for a top-down view, or jump straight to a topic.

## Reading order

| #  | Document | Purpose |
|----|----------|---------|
| 00 | `00_Index.md` | This file — entry point, glossary, conventions. |
| 01 | `01_GameOverview.md` | Vision, pillars, target experience, scope of v1. |
| 02 | `02_Architecture.md` | How Acca sits on top of GameFramework: modules, ownership, runtime flow. |
| 03 | `03_BoardAndCells.md` | Cell types, neighbors, regions, board layout & map JSON spec. |
| 04 | `04_PlayerAndTurn.md` | Turn state machine, controls, player state, dice. |
| 05 | `05_PropertiesAndBusinesses.md` | Property purchase, businesses, upgrades, upkeep, and player structures (shops, toll gates, teleporters, houses, factories, police stations, vaults). |
| 06 | `06_ResourcesAndMarket.md` | The 7 resources, production, market dynamics, pricing. |
| 07 | `07_Companies.md` | Company creation, industry bonuses, multiple companies. |
| 08 | `08_Population.md` | Population dynamics, happiness, employment, migration. |
| 09 | `09_DistrictsAndMayors.md` | District control, Mayor role, taxes, mayor loss. |
| 10 | `10_ChanceEvents.md` | Chance pool, event categories, weighting. |
| 11 | `11_TradingAndSabotage.md` | Trades, hostile takeovers, sabotage. |
| 12 | `12_UI_HUD.md` | HUD layout, menus, dialog/notification design. |
| 13 | `13_AudioVisualFeedback.md` | Sound effects, music, animations, particles. |
| 14 | `14_SpritesAndAssets.md` | Sprite name registry, animation contracts, tile art. |
| 15 | `15_WinConditionsAndMultiplayer.md` | Competitive vs. cooperative, win triggers, end-game. |
| 16 | `16_DataModels.md` | Canonical schemas: map JSON, save game, configs. |
| 17 | `17_FileStructure.md` | Where each new file goes inside `games/Acca/`. |
| 18 | `18_ImplementationRoadmap.md` | Phased implementation plan with concrete tickets. |
| 19 | `19_OpenQuestions.md` | Unresolved design questions, parked debates, future ideas. |

## Conventions used in these docs

- **File path bullet** — every time a planning doc names a piece of code that should exist, it includes the path it would live at, e.g. `games/Acca/systems/PopulationManager.js`. This keeps the planning aligned with the user's rule: *"Always include paths to where a given file belongs in the file structure."*
- **Sprite names, never paths** — when a doc references art, it uses the sprite name (e.g. `cell_property`, `token_red`). Asset paths only appear in `framework/sprites/*` and are out of scope here. This matches the framework rule: *"FRAMEWORK_CONFIG must not include full asset paths."*
- **Config-first** — anything that designers would tune (prices, happiness curves, chance weights) is described as a key under `GAME_CONFIG` in `games/Acca/config.js`, not hard-coded.
- **Modular & extensible** — each subsystem is described as a class with a small, named API. New systems plug in via the framework's EventBus rather than reaching into each other.
- **No HTML files** — the only HTML files in `games/Acca/` are the existing `index.html` and `MapCreator/index.html`. New planning never asks for additional HTML; layouts are canvas-rendered.

## Glossary

- **Cell** — one tile on the board. Has type, optional district/region, neighbors.
- **Property** — a buyable cell that hosts a player's businesses.
- **Business** — an income/resource-producing structure built inside a property.
- **Player structure** — a standalone buyable cell with its own built-in mechanic (shop, toll gate, teleporter, house, factory, police station, vault). Coexists with properties on the board; see `05_PropertiesAndBusinesses.md` §5.9.
- **District** — a named group of squares. `cell.district` holds the district id. Wholly owning all buildable squares grants Mayorship. Managed by `DistrictSystem`.
- **Region** — a higher-level grouping of districts (future feature, not yet implemented).
- **Mayor** — the player who owns every buildable square in a district; collects taxes.
- **Company** — a player-owned grouping of properties. Players may run multiple companies.
- **Turn stage** — a phase inside a player's turn (TurnStart → Roll → Move → ConfirmLand → Landing → LandPrompt → EndTurn).
- **GF** — the framework namespace exposed on `window.GF` by `framework/GameFramework.bundle.js`.

## How to extend the planning

1. Drop a new `NN_TopicName.md` into this folder.
2. Add a row to the table above.
3. Update `19_OpenQuestions.md` if the new topic raises any.
4. Cross-reference: link from related docs (e.g. a new doc on "Auctions" should be linked from `05_PropertiesAndBusinesses.md`).
