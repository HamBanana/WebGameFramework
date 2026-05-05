# 17 — File Structure

This chapter is the canonical layout under `games/Acca2/`. Every file has a one-line description plus its status. When a new file is added, update this chapter and `API_Reference.md`.

```
games/Acca2/
├── index.html                          (exists)  Page scaffold: DOM HUD + canvas + script loader.
├── game.json                           (exists)  Launcher metadata + per-launch config options.
├── launch.js                           (exists)  Standalone Node dev server (port 3000 default).
├── config.js                           (exists)  Defines GF.GAME_CONFIG.
├── AccaGame.js                         (exists)  Top-level orchestrator (state machine, glue).
│
├── core/
│   ├── Constants.js                    (exists)  GAME_STATE and TURN_STAGE enums.
│   ├── Cell.js                         (exists)  Cell entity.
│   ├── PlayerStructure.js              (exists)  Built structure on a cell.
│   ├── Player.js                       (exists)  Player entity.
│   ├── DieController.js                (exists)  Animated die with roll(duration, onDone).
│   ├── Menu.js                         (exists)  Generic up/down arrow-key modal menu.
│   └── MovementController.js           (exists)  Per-step arrow movement during MOVE.
│
├── managers/
│   ├── BoardLoader.js                  (exists)  Map JSON → cells + cell graph.
│   ├── StructureManager.js             (exists)  Build, owner-options, visitor-effect, pass-through.
│   ├── EconomyManager.js               (exists)  Start/end-of-turn ticks, debt, bankruptcy.
│   ├── CameraManager.js                (exists)  Lerp camera + spotlight.
│   ├── WinConditionChecker.js          (exists)  check() → winner | null; helpers.
│   └── TurnManager.js                  (exists)  Turn state machine; hosts every menu.
│
├── render/
│   ├── BoardRenderer.js                (exists)  Canvas world: tints, cells, owners, tokens, spotlight.
│   └── OverlayRenderer.js              (exists)  Background, die, modal, start menu, game-over.
│
├── ui/
│   ├── HUDRenderer.js                  (exists)  DOM panels (topbar, sidebars, notifications).
│   └── MoneyAnimations.js              (exists)  Cash-delta flash + floating "+$X" + coin burst.
│
├── systems/
│   ├── DistrictSystem.js               (exists)  Districts, mayor election, festival, grant.
│   ├── MarketSystem.js                 (exists)  Resource prices + drift.
│   ├── PopulationSystem.js             (exists)  Per-district happiness, growth, migration.
│   ├── TradeSystem.js                  (exists)  Trades, takeover, sabotage.
│   ├── ChanceSystem.js                 (exists)  Pool draw + 8 effect handlers + die override.
│   └── AccaSave.js                     (exists)  Snapshot to localStorage.
│
├── sprites/
│   ├── tokens.js                       (exists)  Player tokens.
│   ├── die.js                          (exists)  Die sprite + rolling animation.
│   ├── cells.js                        (exists)  Bank, chance, market, buildable, empty.
│   ├── cells_extra.js                  (exists)  Resource cells (power_plant, well, mine).
│   ├── structures.js                   (exists)  Player structures (shop, toll, etc.).
│   ├── resources.js                    (exists)  Resource icons.
│   ├── businesses.js                   (exists)  Legacy business iconography (kept for compat).
│   └── ui_icons.js                     (exists)  Misc UI glyphs.
│
├── utils/
│   ├── format.js                       (exists)  money(), percent(), delta(), truncate(), roundTo().
│   └── validate.js                     (exists)  validateMap(), validateConfig(), validateSave().
│
├── styles/
│   ├── theme.css                       (exists)  Root color/typography variables.
│   ├── topbar.css                      (exists)  Top-bar grid + resource pills.
│   └── sidebars.css                    (exists)  Left district sidebar + right notifications/players.
│
├── themes/
│   ├── theme_classic.json              (exists)  Classic palette.
│   └── theme_warm.json                 (exists)  Warm palette variant.
│
├── maps/
│   ├── default.json                    (exists)  Starter map.
│   └── denmark.json                    (exists)  Larger map used in 500-turn playtest.
│
├── MapCreator/
│   ├── index.html                      (exists)  Editor page.
│   └── launch.js                       (exists)  Standalone editor dev server.
│
├── 20260504_PLAYTEST_REPORT.md         (exists)  Most recent playtest record.
│
└── Planning/
    ├── 00_Index.md                     (NEW)
    ├── 01_GameOverview.md              (NEW)
    ├── 02_Architecture.md              (NEW)
    ├── 03_BoardAndCells.md             (NEW)
    ├── 04_PlayerAndTurn.md             (NEW)
    ├── 05_StructuresAndBuildings.md    (NEW)
    ├── 06_ResourcesAndMarket.md        (NEW)
    ├── 07_Companies.md                 (NEW — delta record only)
    ├── 08_Population.md                (NEW)
    ├── 09_DistrictsAndMayors.md        (NEW)
    ├── 10_ChanceEvents.md              (NEW)
    ├── 11_TradingAndSabotage.md        (NEW)
    ├── 12_UI_HUD.md                    (NEW)
    ├── 13_AudioVisualFeedback.md       (NEW)
    ├── 14_SpritesAndAssets.md          (NEW)
    ├── 15_WinConditionsAndMultiplayer.md (NEW)
    ├── 16_DataModels.md                (NEW)
    ├── 17_FileStructure.md             (NEW — this file)
    ├── 18_ImplementationRoadmap.md     (NEW)
    ├── 19_OpenQuestions.md             (NEW)
    ├── 20_Changes.md                   (NEW)
    └── API_Reference.md                (NEW — per-file API breakdown)
```

## 17.1 Loading order in `index.html`

The order matters because each file may attach to `GF.Acca`, and dependents need their prerequisites already attached. The actual order in `games/Acca2/index.html`:

```
1. styles/theme.css, topbar.css, sidebars.css       (CSS first; FOUC-free)
2. config.js                                         (GF.GAME_CONFIG)
3. ../../framework/GameFramework.bundle.js          (engine, sprite, input, etc.)
4. utils/format.js, validate.js
5. sprites/tokens.js, die.js, cells.js, cells_extra.js,
   structures.js, resources.js, businesses.js, ui_icons.js
6. systems/MarketSystem.js, DistrictSystem.js,
   PopulationSystem.js, ChanceSystem.js, TradeSystem.js,
   AccaSave.js
7. core/Constants.js, Cell.js, PlayerStructure.js, Player.js,
   DieController.js, Menu.js, MovementController.js
8. managers/BoardLoader.js, StructureManager.js,
   EconomyManager.js, CameraManager.js,
   WinConditionChecker.js, TurnManager.js
9. render/BoardRenderer.js, OverlayRenderer.js
10. ui/MoneyAnimations.js, HUDRenderer.js
11. AccaGame.js                                      (orchestrator, bootstrap)
```

The orchestrator must be last because its constructor instantiates everything in order.

## 17.2 Module conventions

Every module file under `games/Acca2/` follows this skeleton:

```js
// games/Acca2/<dir>/<File>.js
// Brief description.
(function (GF) {
  'use strict';
  const A = GF.Acca = GF.Acca || {};

  class MyClass {
    constructor(deps) { /* ... */ }
    publicMethod() { /* ... */ }
  }

  A.MyClass = MyClass;
})(window.GF = window.GF || {});
```

- IIFE with `(GF)` arg ensures `window.GF` exists.
- The shared namespace `GF.Acca` (alias `A`) is the only export surface.
- No `import` / `export` — v2 ships as classic `<script>` files. Treat the load order as the dependency graph.

## 17.3 Test harness

There is no automated test harness in v2. The playtest workflow uses the in-game console hot-seat driver described in the project instructions:

> *"To play a given number of rounds efficiently, script a hot-seat driver in the page console (using `dispatchEvent` to feed synthetic key events into the existing `InputManager` — no game code modified). The driver: (a) selected `Roll` from the start menu, (b) DFS-searched for an N-step path that maximised landing on an empty buildable plot, (c) chose `Build Shop` when affordable and otherwise `Skip`, then `Pass turn`."*

Playtest records live at `games/Acca2/20260504_PLAYTEST_REPORT.md` (and similar timestamped reports in `games/Acca/` for v1 lineage).

## 17.4 Δ v1 roundup for this chapter

- v1 lived in `games/Acca/` with a single `AccaGame.js`. v2 lives in `games/Acca2/` with the module split shown above.
- v2 adds `styles/`, `themes/`, `render/`, `ui/`, and the manager split.
- v2 keeps `MapCreator/` and the legacy `sprites/businesses.js` for backward compatibility with v1 art conventions.
