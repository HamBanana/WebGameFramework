# API Reference — Acca v2

Per-file class / method reference for every source file under `games/Acca2/`. Generated from the v2 source as of 2026-05-04.

Conventions:

- "Exports" are entries attached to `GF.Acca` (alias `A`) or `GF.GAME_CONFIG` or `GF.sprites`. v2 does not use ES modules.
- Classes are listed with public fields (those referenced from other files) and public methods. Internal helpers prefixed with `_` are omitted unless they're part of the contract.
- "Listens"/"Emits" name events on `engine.events`.

---

## Top-level

### `games/Acca2/index.html`

The page scaffold. Declares the topbar (`#topbar`), district sidebar (`#districtSidebar`), canvas (`#gameCanvas`), and right sidebar (`#sidebar`) with notifications and player list panels. Links the three CSS files and loads scripts in the order specified in `17_FileStructure.md` §17.1.

### `games/Acca2/game.json`

Launcher metadata + per-launch config options.

```json
{
  "id":    "Acca2",
  "title": "Acca v2",
  "icon":  "🏙️",
  "color": "#4da6ff",
  "tags":  ["BOARD GAME", "2–4 PLAYERS", "STRATEGY"],
  "desc":  "...",
  "config": [
    { "key": "Players",         "opts": ["2", "3", "4"], "def": "2",      "apply": { ... } },
    { "key": "Starting Money",  "opts": ["$500", ..., "$2 500"], "def": "$1 500", "apply": { ... } },
    { "key": "Win Target",      "opts": ["$3 000", ..., "$10 000"], "def": "$5 000", "apply": { ... } },
    { "key": "Property Price",  "opts": ["$100", ..., "$400"], "def": "$200", "apply": { ... } }
  ]
}
```

### `games/Acca2/launch.js`

Standalone Node dev server. Serves the game directory at `/` and the framework directory at `/framework/`.

- `node launch.js` — port 3000 (default).
- `node launch.js 8080` — custom port.
- Opens the browser automatically (`start` / `open` / `xdg-open`).

### `games/Acca2/config.js`

Defines `GF.GAME_CONFIG` — the entire game configuration object (see `16_DataModels.md` §16.1). Listens for `GF:ready` and calls `GF.applyLauncherConfig('Acca2')` to merge launcher overrides.

### `games/Acca2/AccaGame.js`

Top-level orchestrator. Exports `A.AccaGame`.

```js
class AccaGame {
  // Constructed by the bootstrap; takes no args.
  constructor()

  // Lifecycle
  start()                         // Start the engine (engine.start()).

  // Public game-wide helpers
  log(message)                    // Append to eventLog (capped at 500).
  get currentPlayer               // → players[currentPlayerIndex].
  netWorth(player)                // Cash + structure values + vault stored + resources at sell price.
  movePlayerTo(player, cell)      // Teleport (emit cell:leave, cell:enter).
  checkMayor(player, districtId)  // Recompute mayorship if district system exists.

  // Bootstrap (private)
  _beginGame()                    // Load board, init players, init districts, start turn.
  _initPlayers()                  // Pick spawn cell, create players, set start state.
  _beginBetweenTurns()             // Camera zoom-out + hold timer.
  _advanceToNextPlayer()          // Skip bankrupts, check winner, start next turn.
  _update(dt)                     // Per-frame dispatch.
  _updateMenu()                   // MENU-state input.
  _render(ctx)                    // Per-frame draw dispatch.
}
```

Top-level fields wired in the constructor:

- `cfg`, `engine`, `sprites`, `physics`, `ui` — framework handles.
- `gameState`, `players[]`, `currentPlayerIndex`, `cells[]`, `eventLog[]`, `lastRoll`, `winner`, `menuPlayerCount`, `cooperativeThreat`, `turnCounter`, `_betweenTurnsTimer`.
- `_camera` — camera state (see `13_AudioVisualFeedback.md` §13.4).
- Controllers: `die`, `menu`, `movement`.
- Managers: `boardLoader`, `structures`, `economy`, `camera`, `win`.
- Systems (optional): `marketSys`, `districtSys`, `populationSys`, `tradeSys`, `chanceSys`, `turn`.
- Renderers: `boardRenderer`, `overlayRenderer`, `hud`.
- DOM refs: `dom.{container, tbTurn, tbName, tbBankruptBadge, tbMoney, tbNetWorth, tbResources, notifications, playerList, districtList}`.

Listens (on `engine.events`):

- `district:mayorChanged` → log + update player mayor sets.
- `district:taxesPaid` → log.
- `market:priceChanged` → log when |Δ| ≥ 25%.
- `business:sabotaged` → log.

Bootstrap (`init`):

1. Fetches `GAME_CONFIG.board.map`; populates `GF.mapData`.
2. Constructs `AccaGame`, calls `start()`, exposes `window._accaGame` for debugging.

---

## `core/`

### `core/Constants.js`

Exports two enums onto `GF.Acca`:

```js
A.GAME_STATE = { MENU, SETUP, PLAYING, GAME_OVER };
A.TURN_STAGE = { TURN_START, ROLL, MOVE, CONFIRM_LAND, LANDING, LAND_PROMPT, BETWEEN, END_TURN };
```

### `core/Cell.js` — `A.Cell`

```js
class Cell {
  constructor(id, x, y, type, district, sprite)
  neighbors()                  // → _neighbors[]
}
```

Public fields: `id`, `x`, `y`, `type`, `subType`, `district`, `sprite`, `animator`, `up`, `down`, `left`, `right`, `_neighbors`, `structure`.

### `core/PlayerStructure.js` — `A.PlayerStructure`

```js
class PlayerStructure {
  constructor(type, ownerIndex, baseValue, animator)
}
```

Public fields: `type`, `ownerIndex`, `baseValue`, `currentValue`, `cell`, `animator`, `tollAccrued`, `level`, `storedMoney`, `idleUntilTurn`, `sabotagedUntilTurn`.

### `core/Player.js` — `A.Player`

```js
class Player {
  constructor(index, def, startCell, startingMoney, spriteSystem)

  structuresInDistrict(district)   // → count of owned structures in that district
  get housesOwned                   // → count of 'house'-type structures
  addMoney(amount)                  // delta cash
}
```

Public fields: `index`, `name`, `color`, `spriteName`, `animator`, `money`, `level`, `isBankrupt`, `ownedStructures`, `resources`, `districtsMayoredOf` (Set), `currentCell`, `moveOffset`.

### `core/DieController.js` — `A.DieController`

```js
class DieController {
  constructor(spriteSystem)
  roll(duration, onDone)         // animate, then call onDone(value 1..6)
  setFace(value)                 // set visible face directly
  draw(ctx, x, y)                // render
  update(dt)                     // tick animation
}
```

Public fields: `rolling`, `rolledValue`, `animator`.

### `core/Menu.js` — `A.Menu`

```js
class Menu {
  constructor(input, controls)

  show(title, options, subtitle?, { onIndexChange?, onCancel? })
  hide()
  update()                       // input handling
}
```

`options[]` shape: `{ label, action, meta?, _disabled? }`. Public fields: `visible`, `options`, `index`, `title`, `subtitle`.

### `core/MovementController.js` — `A.MovementController`

```js
class MovementController {
  constructor(input, controls, eventBus, game)
  begin(player, moves)
  update()                       // arrow-key driven step
  stepTo(target)                 // explicit step (used by chance teleport)
  cancel()
  selectedRoad()                 // legacy — returns null in v2
}
```

Public fields: `active`, `player`, `movesLeft`, `adjacent {up, down, left, right}`, `roads`, `roadIdx`.

Emits (on `engine.events`): `cell:leave`, `cell:enter` (`final` set on the last step), `move:complete`.

---

## `managers/`

### `managers/BoardLoader.js` — `A.BoardLoader`

```js
class BoardLoader {
  constructor(game)
  load()                         // read GF.mapData → game.cells[], cardinal slots, board bounds
}
```

### `managers/StructureManager.js` — `A.StructureManager`

```js
class StructureManager {
  constructor(game)
  build(cell, type, ownerIndex)                  // → PlayerStructure
  ownerOptionsFor(structure, player, onDone)     // → menu options[]
  visitorEffect(structure, player, onDone)       // → menu options[] | null (also applies rent)
  passThroughEffect(cell, player)                // toll-gate pass-through
}
```

Encodes per-type behaviour for `shop`, `toll_gate`, `teleporter`, `house`, `factory`, `police_station`, `vault`. See `05_StructuresAndBuildings.md`.

### `managers/EconomyManager.js` — `A.EconomyManager`

```js
class EconomyManager {
  constructor(game)
  runStartOfTurn(player)
  runEndOfTurn(player)
}
```

Start-of-turn: production, taxes, catch-up, contextual tips. End-of-turn: turn counter ↑, upkeep, sabotage decay, debt resolution, bankruptcy, system ticks (`populationSys.tick`, `marketSys.drift`), cooperative threat tick.

### `managers/CameraManager.js` — `A.CameraManager`

```js
class CameraManager {
  constructor(game)
  zoomInOnPlayer(player)
  zoomOutToBoard()
  snap()
  update(dt)
  spotlightOnCell(cell)
  clearSpotlight()
  get spotlightCell             // active spotlight cell or null
}
```

### `managers/WinConditionChecker.js` — `A.WinConditionChecker`

```js
class WinConditionChecker {
  constructor(game)
  check()                        // → Player | null
  leader()                       // → Player | null (highest net worth among non-bankrupt)
  lowestCash()                   // → Player | null
  grantRandomStructure(player)   // build a random structure on a random empty buildable cell
}
```

`check()` recognises win types `MoneyOnHand`, `NetWorth` (and `TotalValue` as a synonym), `Level`, `LastManStanding`, and `NetWorthOrLastStanding` (default). The default branch additionally requires `ownedStructures.length > 0` to win by net worth. A turn-cap fallback (`cfg.win.turnCap`) returns the highest-net-worth live player when reached.

### `managers/TurnManager.js` — `A.TurnManager`

```js
class TurnManager {
  constructor(game)
  startTurn(player)
  enter(stage)                   // transition to a TURN_STAGE
}
```

Public fields: `stage` (TURN_STAGE), `player`.

`TurnManager` hosts every menu in v2 (start, manage, mayor, portfolio, trade, market, build, owner-options, visitor-effect, takeover, chance result). The menu construction lives in dedicated private methods inside this class; each one returns when the user picks a terminal action that calls back to advance state.

---

## `render/`

### `render/BoardRenderer.js` — `A.BoardRenderer`

```js
class BoardRenderer {
  constructor(game)
  drawWorld(ctx, W, H)           // board, cells, owners, tokens, spotlight
}
```

Drawn in order: board frame → district tints → roads → cell sprites → owner rings → toll-accrued labels → next-cell tooltips (during MOVE) → tokens → spotlight overlay.

### `render/OverlayRenderer.js` — `A.OverlayRenderer`

```js
class OverlayRenderer {
  constructor(game)
  drawBackground(ctx, W, H)
  drawDie(ctx, W, H)
  drawMenuOverlay(ctx, W, H)
  drawStartMenu(ctx, W, H)
  drawGameOver(ctx, W, H)
}
```

---

## `ui/`

### `ui/HUDRenderer.js` — `A.HUDRenderer`

```js
class HUDRenderer {
  constructor(game)
  render()                       // call once per frame; signature-cached
  resetSignatures()              // clear cache (for new game / GAME_OVER)
}
```

Renders the topbar (turn, name, money, net worth, resources), district sidebar (mayor, pop, happiness, tax, buildings), notifications panel (last 12 log entries), and player list (per-player stats with active highlight + bankrupt styling). Each panel only re-renders when its signature changes.

### `ui/MoneyAnimations.js` — `A.MoneyAnimations`

```js
class MoneyAnimations {
  constructor(game)
  reset()                        // zero baseline
  tick()                         // detect cash deltas and fire animations
}
```

Adds `gain`/`loss` flash classes, floating "+$X" indicators, and (on gain) a coin-burst on the topbar money cell and on each player-list row.

---

## `systems/`

### `systems/DistrictSystem.js` — `A.DistrictSystem` (+ `A.District`)

`District` (data class):

```js
class District {
  id; color; cells[]; mayorIndex; taxRate;
  population; happiness;
  festivalUntilTurn; festivalCooldownUntil; grantCooldownUntil;
  birthsThisTurn; deathsThisTurn; migratedIn; migratedOut;
  specialty;
}
```

`DistrictSystem`:

```js
class DistrictSystem {
  constructor(cfg, eventBus)
  init(cells, districtsMeta)
  recomputeMayor(districtId)
  recomputeAll()
  collectTaxes(player)
  setTaxRate(player, districtId, rate)                     // → {ok, reason?}
  holdFestival(player, districtId, turn)                   // → {ok, reason?, cost?}
  investmentGrant(player, districtId, turn)                // → {ok, reason?, cost?}
  list()                                                    // → District[]
  serialize()       deserialize(data)
}
```

Emits: `district:mayorChanged`, `district:taxesPaid`, `district:taxRateChanged`, `district:festival`, `district:grant`.

### `systems/MarketSystem.js` — `A.MarketSystem`

```js
class MarketSystem {
  constructor(cfg, eventBus)
  priceOf(resource)              // → number
  sellPriceOf(resource)          // → number
  buy(player, resource, qty)     // → {ok, totalCost, reason?}
  sell(player, resource, qty)    // → {ok, totalProceeds, reason?}
  drift()                        // call once per turn end
  serialize() deserialize(data)
}
```

Public fields: `prices{}`, `supplyMA{}`, `demandMA{}`, `basePrices{}`. Emits: `market:priceChanged`.

### `systems/PopulationSystem.js` — `A.PopulationSystem`

```js
class PopulationSystem {
  constructor(cfg, eventBus, districtSystem)
  tick(turn, players)            // happiness, growth, migration in one step
}
```

### `systems/TradeSystem.js` — `A.TradeSystem`

```js
class TradeSystem {
  constructor(cfg, eventBus, districtSystem)
  executeTrade(playerA, playerB, proposal)         // → {ok, reason?}
  canTakeover(attacker, structure)                 // → {ok, reason?, cost?}
  takeover(attacker, structure, players, turn)     // → {ok, cost?, reason?}
  canSabotage(attacker, structure, turn)           // → {ok, reason?, cost?}
  sabotage(attacker, structure, players, turn)     // → {ok, cost?, reason?}
  resetTurnCounters(player)
  serialize() deserialize(data)
}
```

Public fields: `state` (Map<playerIndex, { takeoversThisTurn, sabotageCooldownUntil, takeoverShieldUntil }>). Emits: `business:sabotaged`.

### `systems/ChanceSystem.js` — `A.ChanceSystem`

```js
class ChanceSystem {
  constructor(cfg, eventBus, hooks)
    // hooks: { districtSystem, getLeader, getLowestCash,
    //          sabotageProperty(structure, duration),
    //          grantFreeStructure(player) }

  draw(player, players)                     // → event (and applies its effect)
  consumeDieOverride(playerIndex)           // → {min, max} | null
  serialize() deserialize(data)
}
```

Effect handlers: `money`, `money_pct`, `resource`, `happiness`, `migration_in`, `sabotage`, `free_property`, `modify_die`. Scopes: `self`, `all`, `mayor`, `leader`, `lowest`. Pool: 21 default events from `cfg.chance.pool`.

### `systems/AccaSave.js` — `GF.Acca.Save`

Module exports an object, not a class:

```js
GF.Acca.Save = {
  VERSION:            1,
  serialize(game),    // → snapshot
  deserialize(data, game),  // → ok bool
  save(game),         // → ok bool
  load(game),         // → ok bool
  exists(),           // → bool
  clear()
};
```

Storage key: `localStorage["acca_save_v1"]`.

---

## `sprites/`

Each file calls `GF.sprites = GF.sprites || {}; Object.assign(GF.sprites, { ... })` to register entries. Loaded once at startup; `AccaGame.constructor` then calls `sprites.registerSprites(GF.sprites)` to push them into the sprite system.

| File                    | Sprites registered (names) |
|-------------------------|----------------------------|
| `sprites/tokens.js`     | `token_red`, `token_blue`, `token_green`, `token_yellow` |
| `sprites/die.js`        | `die` (multi-state animator) |
| `sprites/cells.js`      | `cell_start` (bank), `cell_chance`, `cell_market`, `cell_property` (buildable), `cell_normal` (empty) |
| `sprites/cells_extra.js`| `cell_power_plant`, `cell_well`, `cell_mine` |
| `sprites/structures.js` | `cell_shop`, `cell_toll_gate`, `cell_teleporter`, `cell_house`, `cell_factory`, `cell_police_station`, `cell_vault` |
| `sprites/resources.js`  | Resource icon sprites for the 7 resources. |
| `sprites/businesses.js` | Legacy business iconography (kept for v1 compatibility). |
| `sprites/ui_icons.js`   | Mayor crown, sabotage marker, vault padlock, etc. |

Each sprite is a procedural object with `kind: 'tile'`, a `size`, and a `draw(ctx)` that paints the 64×64 tile.

---

## `utils/`

### `utils/format.js`

```js
GF.Acca.format = {
  money(n),            // "$X" with thousands separator
  percent(p, decimals),// "X%" (e.g. 0.15 → "15%")
  delta(n),            // "+X" or "−X"
  truncate(str, max),  // ≤max chars, else slice + "…"
  roundTo(n, step)     // round to nearest step
};
```

### `utils/validate.js`

```js
GF.Acca.validate = {
  validateMap(json),    // → { ok: bool, errors: string[] }
  validateConfig(cfg),  // → { ok, errors }
  validateSave(json)    // → { ok, errors }
};
```

---

## `MapCreator/`

### `MapCreator/index.html`

The map editor's own page (separate from the game). Loads its own UI scaffold and `MapCreator/launch.js`-served scripts.

### `MapCreator/launch.js`

Standalone Node dev server for the map editor. Same shape as the game's `launch.js`.

---

## `themes/`

| File                          | Purpose |
|-------------------------------|---------|
| `themes/theme_classic.json`   | Default palette + sprite overrides. |
| `themes/theme_warm.json`      | Warmer-palette variant. |

JSON shape outlined in `13_AudioVisualFeedback.md` §13.5.

---

## `maps/`

| File                  | Purpose |
|-----------------------|---------|
| `maps/default.json`   | Starter map shipped with v2. |
| `maps/denmark.json`   | Larger map used in the 500-turn playtest. |

JSON shape in `16_DataModels.md` §16.2.

---

## `styles/`

| File                  | Purpose |
|-----------------------|---------|
| `styles/theme.css`    | Root color/typography variables; @keyframes for money-flash animations. |
| `styles/topbar.css`   | Top-bar grid + resource pill styling. |
| `styles/sidebars.css` | Left district sidebar + right notifications/players panel. |

---

## Cross-reference

- **Where is the turn flow?** `managers/TurnManager.js` — also documented in `04_PlayerAndTurn.md`.
- **Where do prices come from?** `systems/MarketSystem.js` + `cfg.market.basePrices`.
- **Where is the win condition?** `managers/WinConditionChecker.js` + `cfg.win`.
- **Where is the save format?** `systems/AccaSave.js` — also documented in `16_DataModels.md` §16.3.
- **Where do new structure types go?** Add to `cfg.structures.catalog`, register a sprite in `sprites/structures.js`, add owner/visitor branches to `managers/StructureManager.js`.
- **Where do new chance events go?** Add to `cfg.chance.pool`. If they need a new effect handler, add it to `systems/ChanceSystem.js`.
