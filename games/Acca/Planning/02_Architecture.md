# 02 — Architecture

## 2.1 How Acca uses GameFramework

`GameFramework` provides the engine, sprite system, input, audio, particles, UI, save, scene transitions, and event bus. Acca is composed *on top* of those primitives — it does not import HTML/CSS or roll its own canvas loop.

Bootstrap chain (already in place, do not change):

```
index.html
  └─ <script src="../../framework/GameFramework.bundle.js"></script>
  └─ <script src="config.js"></script>           ← defines GF.GAME_CONFIG
  └─ <script src="sprites/cells.js"></script>    ← defines GF.sprites entries
  └─ <script src="sprites/tokens.js"></script>
  └─ <script src="sprites/die.js"></script>
  └─ <script src="AccaGame.js"></script>         ← bootstraps the game
```

`AccaGame.js` calls `GF.createGame(cfg.engine, cfg.physics)` to obtain `{ engine, sprites, physics, ui }`, registers sprites, binds inputs, and wires the loop.

## 2.2 Module map

The current single-file `AccaGame.js` will be split into focused modules so each subsystem is independently testable and replaceable. **All Acca code lives under `games/Acca/`**; nothing leaks into `framework/`.

| Module | File | Responsibility |
|--------|------|----------------|
| Game shell | `games/Acca/AccaGame.js` | Owns engine, top-level state machine (MENU/SETUP/PLAYING/GAME_OVER), draws background, delegates to subsystems. Stays thin. |
| Config | `games/Acca/config.js` | `GF.GAME_CONFIG` — all tunables. |
| Map loader | `games/Acca/systems/MapLoader.js` | Fetches and validates `maps/*.json`. |
| Board | `games/Acca/systems/Board.js` | Cells, regions, neighbor wiring, board → pixel mapping, board rendering. |
| Cell | `games/Acca/entities/Cell.js` | Cell class incl. `OnEnter`, `OnLeave`, `OnLand`. |
| Player | `games/Acca/entities/Player.js` | Player state (money, resources, properties, bankrupt, level, companies). |
| Company | `games/Acca/entities/Company.js` | Player-owned company; properties + industry bonus. |
| Property | `games/Acca/entities/Property.js` | Wraps a cell of type=property; owns businesses. |
| Business | `games/Acca/entities/Business.js` | One slot inside a property; type, employees, upkeep, production. |
| Population | `games/Acca/systems/PopulationSystem.js` | Per-region population: size, happiness, growth, migration. |
| Mayor / region | `games/Acca/systems/RegionSystem.js` | Region ownership detection, tax collection, mayor transitions. |
| Market | `games/Acca/systems/MarketSystem.js` | Resource prices, supply/demand drift, buy/sell helpers. |
| Chance | `games/Acca/systems/ChanceSystem.js` | Drawing and applying chance events. |
| Trade | `games/Acca/systems/TradeSystem.js` | Player↔player trade negotiation, hostile takeover, sabotage. |
| Turn | `games/Acca/systems/TurnManager.js` | The per-turn state machine; uses Movement, Die, Menu. |
| Movement | `games/Acca/systems/MovementController.js` | Per-step arrow movement during MOVE stage. |
| Die | `games/Acca/systems/DieController.js` | Animated die producing 1–6. |
| Menu | `games/Acca/ui/Menu.js` | Arrow-key-driven option list (used everywhere). |
| HUD | `games/Acca/ui/HUD.js` | Top bar, players panel, log panel, resource strip. |
| Notifications | `games/Acca/ui/Notifications.js` | Floating, timed messages over the board. |
| Save | `games/Acca/systems/AccaSave.js` | Wraps `framework/systems/SaveSystem.js` for Acca's data shape. |
| Sprites | `games/Acca/sprites/cells.js`, `tokens.js`, `die.js`, `businesses.js` | Sprite-name registrations. |
| Map data | `games/Acca/maps/default.json` (and additional maps) | Cell + region data. |
| MapCreator | `games/Acca/MapCreator/*` | Editor for authoring map JSON (already exists). |

`AccaGame.js` should never know about, e.g., the internals of the market — it asks `MarketSystem.priceOf('wood')`. This keeps each subsystem replaceable.

## 2.3 Communication: the EventBus

All cross-module messaging goes through the framework's `EventBus` (`engine.events`). This avoids spaghetti references between systems and lets the HUD/audio/particles passively react to events without coupling to game logic.

Standard event names (canonical — keep grep-able):

| Event | Payload | Emitted by | Used by |
|-------|---------|-----------|---------|
| `turn:start` | `{ player }` | TurnManager | HUD, Audio |
| `turn:end` | `{ player }` | TurnManager | HUD, AccaSave (autosave) |
| `die:roll` | `{ value }` | DieController | HUD, Audio, Particles |
| `cell:enter` | `{ player, cell }` | MovementController | HUD, Audio |
| `cell:leave` | `{ player, cell }` | MovementController | HUD |
| `cell:land` | `{ player, cell }` | TurnManager | All landing handlers |
| `move:complete` | `{ player }` | MovementController | TurnManager |
| `property:bought` | `{ player, cell, price }` | TurnManager | RegionSystem, HUD, Audio |
| `property:soldTo` | `{ from, to, cell, price }` | TradeSystem | RegionSystem, HUD |
| `property:rentPaid` | `{ from, to, cell, amount }` | TurnManager | HUD, Audio |
| `business:built` | `{ player, property, business }` | Property | PopulationSystem, HUD |
| `business:upgraded` | `{ player, property, business, level }` | Property | HUD |
| `business:sabotaged` | `{ attacker, target, property, until }` | TradeSystem | HUD, Particles |
| `region:mayorChanged` | `{ region, oldMayor, newMayor }` | RegionSystem | HUD, Audio |
| `region:taxesPaid` | `{ region, mayor, amount }` | RegionSystem | HUD |
| `population:happinessChanged` | `{ region, delta }` | PopulationSystem | HUD |
| `population:migrated` | `{ from, to, amount }` | PopulationSystem | HUD |
| `market:priceChanged` | `{ resource, oldPrice, newPrice }` | MarketSystem | HUD |
| `chance:drawn` | `{ player, event }` | ChanceSystem | HUD, Audio, Particles |
| `game:over` | `{ winner, reason }` | AccaGame | HUD, Audio |

Adding new events is allowed — but they go in this table first.

## 2.4 Top-level state machine

`AccaGame.gameState` (already exists) keeps four high-level states:

```
MENU → SETUP → PLAYING ⇄ PAUSED → GAME_OVER → MENU
```

`PAUSED` is new in this plan — used when a long modal (trade window, save dialog) is open and the engine should keep rendering but not advance turns.

Inside `PLAYING`, `TurnManager.stage` runs the per-turn machine. Splitting top-level state from turn-stage avoids the "is the menu the turn menu or the trade menu?" ambiguity.

## 2.5 Update / render contract

Each frame, the framework calls:

1. `AccaGame._update(dt)` — top-level dispatch.
2. Every active subsystem's `update(dt)` (Board, TurnManager, MarketSystem, PopulationSystem timers).
3. `AccaGame._render(ctx)` — clears, draws background, board, tokens, HUD, modals.

Subsystems must be safe to `update(0)` and to be skipped (e.g., when paused). They must not mutate during render.

## 2.6 Cross-cutting rules

- **Determinism for the same seed.** Wrap all `Math.random()` use behind `framework/utils/MathUtils.js` (extend it if needed). Required for replays/save load.
- **No DOM.** Acca renders to canvas only; no element creation.
- **No globals besides `window.GF`.** Subsystems are passed `engine`, `sprites`, etc. via the constructor.
- **Hot-reload friendly.** Avoid module-level mutable state outside the IIFE.
