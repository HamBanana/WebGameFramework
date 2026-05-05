# Acca v0.1 — Architecture Report

**Date:** 2026-05-04
**Scope:** Acca — modular architecture overview.
**Behavior:** 4 players, 7 structure types, 8 districts, default Danish-flag-coloured map.
**Structure:** 1 orchestrator + 19 focused modules; CSS in 3 stylesheets; HTML 122 lines.

---

## TL;DR

`node launch.js` from `games/Acca/` boots into the start menu. All 25 JS modules parse cleanly and register on `GF.Acca`. `new AccaGame()` constructs without error. `window._accaGame` is exposed for the page-console hot-seat driver described in the project playtest procedure.

A smoke test driven via `jsdom` confirmed:
- All 25 JS files parse cleanly when served by the dev server.
- All 25 expected exports (Cell, Player, PlayerStructure, DieController, Menu, MovementController, BoardLoader, StructureManager, EconomyManager, CameraManager, WinConditionChecker, TurnManager, BoardRenderer, OverlayRenderer, HUDRenderer, MoneyAnimations, AccaGame, GAME_STATE, TURN_STAGE, MarketSystem, DistrictSystem, PopulationSystem, TradeSystem, ChanceSystem, Save) register on `GF.Acca`.
- `new AccaGame()` constructs without error after the modular load chain completes.
- `window._accaGame` is exposed for the page-console hot-seat driver described in the project playtest procedure.

A 50-turn interactive playtest could not be run end-to-end inside the headless sandbox — the canvas and `requestAnimationFrame` loop don't have real backing in jsdom, and the engine's `_tick` doesn't expose a clean stepping API. A real run should use the hot-seat driver in the browser console (see project playtest procedure).

---

## File layout

```
games/Acca/
├── AccaGame.js          ( 336 lines — slim orchestrator)
├── index.html           ( 122 lines — DOM HUD scaffolding)
├── config.js
├── game.json
├── launch.js
├── styles/
│   ├── theme.css        ( 154 lines)
│   ├── topbar.css       ( 209 lines)
│   └── sidebars.css     ( 206 lines)
├── core/
│   ├── Constants.js     (  27 lines)
│   ├── Cell.js          (  38 lines)
│   ├── Player.js        (  52 lines)
│   ├── PlayerStructure.js  ( 29 lines)
│   ├── DieController.js (  57 lines)
│   ├── Menu.js          (  98 lines)
│   └── MovementController.js (126 lines)
├── managers/
│   ├── BoardLoader.js   ( 180 lines)
│   ├── StructureManager.js (288 lines)
│   ├── EconomyManager.js   (349 lines)
│   ├── CameraManager.js (  93 lines)
│   ├── WinConditionChecker.js (95 lines)
│   └── TurnManager.js   ( 586 lines)
├── render/
│   ├── BoardRenderer.js ( 269 lines)
│   └── OverlayRenderer.js (160 lines)
├── ui/
│   ├── HUDRenderer.js   ( 182 lines)
│   └── MoneyAnimations.js  (124 lines)
├── sprites/
├── systems/
├── themes/
├── utils/
├── maps/
└── MapCreator/
```

### Module ownership map

`AccaGame.js` is a slim orchestrator that wires the parts together. Each concern lives in its own module.

| Module                              | File                                   | Concern                                                    |
| ----------------------------------- | -------------------------------------- | ---------------------------------------------------------- |
| Top-level enums                     | `core/Constants.js`                    | `GAME_STATE`, `TURN_STAGE`.                                |
| Cell class                          | `core/Cell.js`                         | Cell entity (id, x/y, type, district, neighbors, structure).|
| PlayerStructure class               | `core/PlayerStructure.js`              | Player-owned structure on a buildable cell.                |
| Animated die                        | `core/DieController.js`                | 6-sided die, `roll(duration, onDone)`.                     |
| Player state                        | `core/Player.js`                       | Cash, level, resources, owned structures, current cell.    |
| Movement                            | `core/MovementController.js`           | Cardinal stepping during MOVE stage.                       |
| Menu overlay                        | `core/Menu.js`                         | Arrow-key list overlay (canvas-rendered).                  |
| Board loader                        | `managers/BoardLoader.js`              | Board init: cells, neighbours, cardinal slots, bounds.     |
| Structure manager                   | `managers/StructureManager.js`         | Build / owner-options / visitor-effect / pass-through.     |
| Turn manager                        | `managers/TurnManager.js`              | Turn state machine + every menu reachable in a turn.       |
| Camera manager                      | `managers/CameraManager.js`            | Zoom, lerp, spotlight.                                     |
| Win condition checker               | `managers/WinConditionChecker.js`      | Leader / lowest / win check / random-grant.                |
| Economy manager                     | `managers/EconomyManager.js`           | Production / upkeep / debt / catch-up / contextual tips.   |
| Board renderer                      | `render/BoardRenderer.js`              | Canvas drawing — board, cells, owner rings, spotlight.     |
| Overlay renderer                    | `render/OverlayRenderer.js`            | Background, die, menu modal, start menu, game-over screen. |
| HUD renderer                        | `ui/HUDRenderer.js`                    | DOM-driven HUD — topbar, sidebars, notifications.          |
| Money animations                    | `ui/MoneyAnimations.js`                | Money-flash animations + coin-burst sparkles.              |
| Orchestrator                        | `AccaGame.js` (slim)                   | Construct-and-wire + per-frame `_update` / `_render`.      |
| CSS (3 files)                       | `styles/theme.css` + `topbar.css` + `sidebars.css` | CSS grouped by area.                       |

---

## Why the modular structure

The codebase is split into focused modules for these concrete reasons:

1. **The largest file is `TurnManager.js` (586 lines).** Every other module fits comfortably on a single screen — easy to navigate and orient.
2. **CSS is grouped by area** — `theme.css` for variables/layout, `topbar.css` for the top-bar + money-flash animations + resource pills, `sidebars.css` for both side panels.
3. **Each class lives in its own IIFE** — a parse error in `EconomyManager.js` no longer prevents `Menu.js` from registering.
4. **`AccaGame` is 336 lines** — constructor wires up named managers (`this.economy = new EconomyManager(this)`, `this.camera = new CameraManager(this)`, etc.). The per-frame loop is 30 lines. The only behavior-bearing methods on `AccaGame` are `log()`, `netWorth()`, `movePlayerTo()`, and lifecycle helpers (`_beginGame`, `_advanceToNextPlayer`).
5. **Each manager is testable in isolation** by feeding it a stub `game` object that exposes the few hooks it actually uses.

---

## Verification — what was checked

### Static checks (pass)
- **Node syntax check** on all 19 module files plus `AccaGame.js`: zero errors.
- **Stale-reference grep**: searched for old god-class names that should no longer be used (`game._zoomInOnPlayer`, `game._runStartOfTurn`, `this._spotlightCell` outside CameraManager, `this._lastDistrictSig` outside HUDRenderer, etc.) — zero leaks. All cross-class calls go through the manager interface (`game.camera.zoomInOnPlayer`, `game.economy.runStartOfTurn`).
- **Class export inventory**: 25 expected names register on `GF.Acca`: 7 core classes, 6 managers, 2 renderers, 2 UI helpers, 6 systems, the `AccaGame` class itself, `GAME_STATE`, and `TURN_STAGE`.
- **HTML script-tag dependency order**: scripts are sourced bottom-up — config first, framework second, utils, sprites, systems, core, managers, render, ui, then `AccaGame.js` last.

### Headless boot test (pass)
- Spun up `node launch.js` and pointed jsdom at the served URL.
- Stubbed `HTMLCanvasElement.getContext` so the engine's `_setupScaling` doesn't blow up.
- Pre-injected `GF.mapData` and overrode `window.fetch` to serve the local map.
- After 3 seconds: `window._accaGame` was present, `window.GF.Acca` populated with all 25 expected names, no missing exports.
- Two non-fatal jsdom-environmental errors logged: missing `ctx.quadraticCurveTo` (canvas stub gap) and a fetch failure on the inline map path (jsdom `runScripts:dangerously` doesn't pass our stubbed fetch into the page-context evaluator). Neither indicates a bug in game code.

### What couldn't be verified in this session
- **Interactive 50-turn hot-seat playtest in a real browser.** The bash sandbox can't keep a server alive across tool calls, so Chrome MCP can't be driven to the live server reliably. A real run should happen on the user's machine: `node games/Acca/launch.js`, then open the URL in the connected browser and paste the hot-seat driver into devtools.

---

## Playtest findings

See the companion reports in `games/Acca/docs/`:

- `20260503_PLAYTEST_REPORT.md` — 50-turn 4-player hot-seat; chance connectivity, plurality mayor rule, F5 quickSave, Cancel keybinding, property disambiguator, turn counter, balance.
- `20260504_PLAYTEST_REPORT_10_Iterations.md` — 10 rapid iterations on balance and feel.
- `20260504_PLAYTEST_REPORT_Iter11to20_FunPass.md` — catch-up bonus, contextual tips, near-miss chance probability, district specialty resources, turn cap, sell-spread net-worth valuation.
- `20260504_PLAYTEST_REPORT_Denmark.md` — 500-turn Denmark map test; plurality-mayor rule, dynamic shop investing, auto-debt-resolution.

---

## Suggestions for future work

### 1. The `game` god-object

Every manager takes `(game)` and reaches into `game.cells`, `game.players`, `game.cfg`, `game.engine.events`, etc. That cuts down on parameter-passing verbosity but means you can't construct, say, `EconomyManager` in a test without also constructing `AccaGame` (or stubbing it convincingly). **Future move:** define a small `GameContext` interface (cells, players, cfg, events, log, netWorth) and hand managers that instead.

### 2. `TurnManager` split

Most of `TurnManager`'s 586 lines are menu builders (`_showStartMenu`, `_showManageMenu`, `_showMayorMenu`, `_showDistrictMenu`, `_showTaxSlider`, `_showPortfolioMenu`, `_showTradeRootMenu`, etc.). A further split — `MenuFlows.js` owning the menu trees, `TurnManager.js` owning just the state machine — would make each piece easier to follow.

### 3. CSS variables

`theme.css` defines `--gain`, `--loss`, `--accent` etc. — but most colour stops in keyframe animations still hard-code `rgba(123, 224, 127, 0.50)` instead of `rgba(var(--gain-rgb), 0.50)`. Re-tuning the palette currently means find-replace across all three CSS files.

### 4. Save-format key

`acca_save_v1` is the current `localStorage` key. If the save schema changes in a future version, bump the key (e.g. `acca_save_v2`) to avoid loading stale saves.

### 5. The `applyLauncherConfig('Acca')` pathway

When Acca runs standalone via `launch.js`, the `GF:ready` listener calls `GF.applyLauncherConfig('Acca')`. This is a no-op when there's no launcher, but ensures that if `framework/launcher.html` is updated to recognize `Acca`, its per-game overrides automatically wire up.

---

## How to launch locally

```
cd C:\codespace\Claude\WebGameFramework\games\Acca
node launch.js
```

Default port is 3000; the script auto-opens the browser. To run on a different port:

```
node launch.js 3001
```

In the live page console, the hot-seat playtest driver attaches to `window._accaGame`.
