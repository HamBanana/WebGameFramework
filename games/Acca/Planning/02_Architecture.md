# 02 — Architecture

## 2.1 How Acca uses GameFramework

`GameFramework` provides the engine, sprite system, input, audio, particles, UI, save, scene transitions, and event bus. Acca is composed *on top* of those primitives — it does not roll its own canvas loop and does not reach into framework internals.

Bootstrap chain (from `games/Acca/index.html`, in load order):

```
index.html
  ├─ <link rel="stylesheet" href="styles/theme.css">
  ├─ <link rel="stylesheet" href="styles/topbar.css">
  ├─ <link rel="stylesheet" href="styles/sidebars.css">
  │
  ├─ <script src="config.js"></script>                       ← defines GF.GAME_CONFIG
  ├─ <script src="../../framework/GameFramework.bundle.js"></script>
  │
  ├─ utils/format.js       — money/percent helpers
  ├─ utils/validate.js     — map/config/save validators
  │
  ├─ sprites/tokens.js, die.js, cells.js, cells_extra.js,
  │  structures.js, resources.js, businesses.js, ui_icons.js
  │                          ← register entries on GF.sprites
  │
  ├─ systems/MarketSystem.js, DistrictSystem.js,
  │  PopulationSystem.js, ChanceSystem.js, TradeSystem.js,
  │  AccaSave.js
  │
  ├─ core/Constants.js, Cell.js, PlayerStructure.js, Player.js,
  │  DieController.js, Menu.js, MovementController.js
  │
  ├─ managers/BoardLoader.js, StructureManager.js,
  │  EconomyManager.js, CameraManager.js,
  │  WinConditionChecker.js, TurnManager.js
  │
  ├─ render/BoardRenderer.js, OverlayRenderer.js
  ├─ ui/MoneyAnimations.js, HUDRenderer.js
  │
  └─ AccaGame.js                                              ← orchestrator + bootstrap
```

`AccaGame.js` calls `GF.createGame(cfg.engine, cfg.physics)` to obtain `{ engine, sprites, physics, ui }`, registers sprites, binds inputs, and wires the loop.


## 2.2 Module map

All Acca code lives under `games/Acca/`; nothing leaks into `framework/`.

| Module                     | File                                              | Responsibility |
|----------------------------|---------------------------------------------------|----------------|
| **Game shell**             | `games/Acca/AccaGame.js`                         | Owns engine, top-level state machine (MENU/PLAYING/GAME_OVER), draws background, delegates to subsystems. Stays thin. |
| **Config**                 | `games/Acca/config.js`                           | `GF.GAME_CONFIG` — all tunables (engine, board, players, win, structures, market, population, district, chance, sabotage, trade, turn, audio, theme, controls). |
| **Constants**              | `games/Acca/core/Constants.js`                   | `GAME_STATE` and `TURN_STAGE` enums attached to `GF.Acca`. |
| **Cell**                   | `games/Acca/core/Cell.js`                        | Cell entity (id, x/y, type, district, neighbors, structure). |
| **PlayerStructure**        | `games/Acca/core/PlayerStructure.js`             | One built object on a cell (type, owner, value, vault state, idle/sabotage state). |
| **Player**                 | `games/Acca/core/Player.js`                      | Player state (cash, level, resources, owned structures, mayor districts, current cell). |
| **Die**                    | `games/Acca/core/DieController.js`               | Animated 6-sided die, `roll(duration, onDone)`. |
| **Menu**                   | `games/Acca/core/Menu.js`                        | Generic up/down arrow-key menu modal. |
| **Movement**               | `games/Acca/core/MovementController.js`          | Per-step arrow movement during `MOVE`. |
| **Map loader**              | `games/Acca/managers/BoardLoader.js`             | Loads `GF.mapData` into `game.cells[]`; cardinal slot wiring; board bounds. |
| **Structure manager**       | `games/Acca/managers/StructureManager.js`        | Build, owner-options-on-landing, visitor-effect, pass-through (toll). |
| **Economy manager**         | `games/Acca/managers/EconomyManager.js`          | Start-of-turn production + taxes + catch-up; end-of-turn upkeep + debt + bankruptcy + system ticks. |
| **Camera manager**          | `games/Acca/managers/CameraManager.js`           | Lerp camera, zoom in/out, spotlight overlay. |
| **Win checker**             | `games/Acca/managers/WinConditionChecker.js`     | `check()` → winner or null. Helpers: `leader()`, `lowestCash()`, `grantRandomStructure()`. |
| **Turn manager**            | `games/Acca/managers/TurnManager.js`             | Per-turn state machine; hosts every menu (start, manage, mayor, portfolio, trade, market, build prompt, owner/visitor menus, chance). |
| **District system**         | `games/Acca/systems/DistrictSystem.js`           | District state, mayor election (strict majority), tax rate, festival, investment grant. |
| **Market system**           | `games/Acca/systems/MarketSystem.js`             | 7-resource buy/sell, supply/demand moving averages, drift toward target prices. |
| **Population system**       | `games/Acca/systems/PopulationSystem.js`         | Per-district happiness, growth, migration (oil-gated). |
| **Trade system**            | `games/Acca/systems/TradeSystem.js`              | Atomic trades, hostile takeovers, sabotage, anti-collusion guard. |
| **Chance system**           | `games/Acca/systems/ChanceSystem.js`             | Weighted draw with repeat guard, 8 effect handlers, die-override hook. |
| **Save**                    | `games/Acca/systems/AccaSave.js`                 | Serialize/deserialize game state to/from `localStorage`. |
| **Board renderer**          | `games/Acca/render/BoardRenderer.js`             | World transform, district tints, cell sprites, owner rings, tokens, spotlight overlay. |
| **Overlay renderer**        | `games/Acca/render/OverlayRenderer.js`           | Background, die, menu modal, start menu, game-over screen. |
| **HUD renderer**            | `games/Acca/ui/HUDRenderer.js`                   | DOM panels (topbar, district sidebar, players panel, notifications) — signature-cached. |
| **Money animations**        | `games/Acca/ui/MoneyAnimations.js`               | Detect cash deltas; spawn flash + floating "+$X" + coin-burst on the topbar / player rows. |
| **Sprites**                 | `games/Acca/sprites/*.js`                        | Sprite-name registrations (tokens, die, cells, cells_extra, structures, resources, businesses, ui_icons). |
| **Themes**                  | `games/Acca/themes/theme_*.json`                 | Color/sprite-override packs. |
| **Maps**                    | `games/Acca/maps/*.json`                         | Cell + district data. |
| **MapCreator**              | `games/Acca/MapCreator/*`                        | Editor for authoring map JSON. |
| **Styles**                  | `games/Acca/styles/*.css`                        | DOM HUD styling (`theme.css`, `topbar.css`, `sidebars.css`). |
| **Utils**                   | `games/Acca/utils/{format,validate}.js`          | `money()`, `percent()`, validators. |

`AccaGame.js` should never know about, e.g., the internals of the market — it asks `marketSys.priceOf('wood')`. This keeps each subsystem replaceable.
## 2.3 Communication: the EventBus

All cross-module messaging goes through the framework's `EventBus` (`engine.events`). The HUD/audio/particles passively react to events without coupling to game logic.

Standard event names used by Acca (canonical — keep grep-able):

| Event                               | Payload                                          | Emitted by                | Used by                          |
|-------------------------------------|--------------------------------------------------|---------------------------|----------------------------------|
| `cell:enter`                        | `{ player, cell, final }`                        | `AccaGame.movePlayerTo`, `MovementController` | TurnManager landing dispatch |
| `cell:leave`                        | `{ player, cell }`                               | same                      | TurnManager, BoardRenderer       |
| `move:complete`                     | `{ player }`                                     | `MovementController`      | TurnManager (→ LANDING)          |
| `district:mayorChanged`             | `{ district, oldMayor, newMayor }`               | `DistrictSystem`          | `AccaGame` log, HUDRenderer      |
| `district:taxesPaid`                | `{ district, mayor, amount }`                    | `DistrictSystem`          | `AccaGame` log                   |
| `district:taxRateChanged`           | `{ district, mayor }`                            | `DistrictSystem`          | HUDRenderer                      |
| `district:festival`                 | `{ district, mayor }`                            | `DistrictSystem`          | HUDRenderer, audio               |
| `district:grant`                    | `{ district, mayor }`                            | `DistrictSystem`          | HUDRenderer                      |
| `market:priceChanged`               | `{ resource, oldPrice, newPrice, delta, ratio }` | `MarketSystem.drift()`    | `AccaGame` log (≥25% jumps)      |
| `market:bought`                     | `{ player, resource, qty, total }`               | `MarketSystem.buy()`      | (HUD; not yet listened)          |
| `market:sold`                       | `{ player, resource, qty, total }`               | `MarketSystem.sell()`     | (HUD; not yet listened)          |
| `business:sabotaged`                | `{ structure, attacker }`                        | `TradeSystem`, `ChanceSystem` | `AccaGame` log               |
| (game-internal log helper)          | `game.log(message)`                              | many                      | HUDRenderer notifications panel  |

> Adding new events is allowed — but they go in this table first. The Sprite/audio/particle systems should never reach into game state directly; they should react to events.

Several events (`turn:start`, `die:roll`, `cell:land`, `property:bought`, `population:happinessChanged`, `population:migrated`, `chance:drawn`, `game:over`) are **not currently emitted**; the equivalent state changes are read directly from `game` by the HUD layer. Adding them is a low-risk extension if needed.

## 2.4 Top-level state machine

`game.gameState` keeps three high-level states (defined in `core/Constants.js`):

```
MENU → PLAYING → GAME_OVER → MENU
```

`SETUP` is collapsed into `MENU` (player count is selected on the menu screen). There is no explicit `PAUSED` state — long modals (trade window, market) live inside `PLAYING` because the modal owns the input gate.

Inside `PLAYING`, `TurnManager.stage` runs the per-turn machine (see `04_PlayerAndTurn.md`). Splitting top-level state from turn-stage avoids the "is this menu the turn menu or the trade menu?" ambiguity.

## 2.5 Update / render contract

Each frame, the framework calls (registered from `AccaGame.constructor`):

1. `AccaGame._update(dt)` — top-level dispatch:
   - Update animators (cells, players, die).
   - Update menu input (`menu.update()`).
   - Update camera lerp (`camera.update(dt)`).
   - Branch on `gameState`: MENU updates the player count, PLAYING runs movement/turn logic + HUD render, GAME_OVER waits for confirm.
2. `AccaGame._render(ctx)`:
   - `OverlayRenderer.drawBackground`.
   - Branch: `drawStartMenu` / (`drawWorld` + `drawDie` + `drawMenuOverlay`) / `drawGameOver`.

Subsystems must be safe to be skipped (e.g., `tradeSys.serialize()` is only read by `AccaSave` — the system never advances time on its own; `MarketSystem.drift()` is invoked explicitly by `EconomyManager.runEndOfTurn`).

## 2.6 Cross-cutting rules

- **Determinism for the same seed.** Most randomness goes through `Math.random()` directly; if save/replay determinism is added later, route it through `framework/utils/MathUtils.js`.
- **DOM is allowed for HUD only.** The board, die, and menu modal are canvas. The topbar and sidebars are DOM. No new HTML files; only the existing `index.html` and `MapCreator/index.html`.
- **No globals besides `window.GF`.** Subsystems are passed `engine`, `sprites`, `cfg`, etc. via the constructor. The orchestrator hangs them off `this`.
- **Hot-reload friendly.** Modules wrap their code in IIFEs that take `window.GF` and attach to `GF.Acca`.
- **Resource-shortage upkeep idles structures rather than destroying them.** This keeps net-worth stable across turns and avoids cascading bankruptcies.
