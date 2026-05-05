# 17 — File Structure

This chapter is the canonical layout under `games/Acca/`. Every file has a one-line description plus its status. When a new file is added, update this chapter and `API_Reference.md`.

```
games/Acca/
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
    ├── 1