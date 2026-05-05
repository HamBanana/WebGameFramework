# 04 — Player and Turn Flow

## 4.1 Player entity

`games/Acca2/core/Player.js` — `class Player`.

```js
class Player {
  // identity
  index;                  // 0..3
  name;                   // from cfg.players[i].name (overridable later)
  color;                  // hex, used by HUD and owner rings
  spriteName;             // 'token_red' | 'token_blue' | 'token_green' | 'token_yellow'
  animator;               // sprite animator instance

  // money & status
  money;                  // current cash on hand (can dip negative mid-turn before debt resolution)
  level;                  // small integer; advances on milestones (build cadence)
  isBankrupt;             // sticky flag; bankrupt players are skipped on advance

  // holdings
  ownedStructures;        // PlayerStructure[]
  resources;              // map of resource → quantity
  districtsMayoredOf;     // Set<districtId> (string names)

  // position
  currentCell;            // Cell reference
  moveOffset;             // {x,y} pixel offset for token rendering when sharing a cell
}
```

Helpers:

- `structuresInDistrict(district)` — counts the player's owned structures in a given district. Used by Shop cap and several rent rules.
- `housesOwned` (getter) — counts `type === 'house'` structures across the player.
- `addMoney(amount)` — adjusts cash and emits a money-delta hook for UI animation.

> **Δ v1.** v2 has no Property entity, no Business entity, no Company entity. `ownedStructures` is the single canonical list of what a player owns; everything else is derived from it.

## 4.2 Turn state machine

Implemented in `games/Acca2/managers/TurnManager.js`. Stages enum lives in `core/Constants.js`:

```js
A.TURN_STAGE = {
  TURN_START:   'turn_start',
  ROLL:         'roll',
  MOVE:         'move',
  CONFIRM_LAND: 'confirm_land',
  LANDING:      'landing',
  LAND_PROMPT:  'land_prompt',
  BETWEEN:      'between',
  END_TURN:     'end_turn',
};
```

| Stage           | Entry action                                                                                      | Exits to |
|-----------------|---------------------------------------------------------------------------------------------------|----------|
| `TURN_START`    | Camera zooms onto active player. `EconomyManager.runStartOfTurn(player)` runs production, taxes, catch-up bonus, contextual tips. Open the start menu (Roll / Manage / Trade / Market / Save / Game log / Pass). | `ROLL` (Roll), `LAND_PROMPT` (any submenu), `END_TURN` (Pass). |
| `ROLL`          | Honour any pending `chanceSys` die-override. Run `die.roll(cfg.turn.rollDuration, onDone)`. Log "Player rolled X." | `MOVE`. |
| `MOVE`          | `MovementController.begin(player, moves)` — accept arrow keys to step through `_neighbors`; die face counts down. | `LANDING` (final step → `move:complete` → `cell:enter` with `final:true`). |
| `CONFIRM_LAND`  | (Reserved — used to ask the player to confirm the chosen path. Currently inactive; the path resolves immediately.) | `LANDING`. |
| `LANDING`       | Branch on `player.currentCell.type` and dispatch (see 4.3). | `LAND_PROMPT` if a menu is shown; `END_TURN` if landing produced no menu. |
| `LAND_PROMPT`   | A menu is open (build, owner options, visitor options, takeover, chance). Wait for user. | `END_TURN` once the menu's terminal action runs. |
| `END_TURN`      | `EconomyManager.runEndOfTurn(player)` — turn counter ↑, upkeep, debt resolution, system ticks. | `BETWEEN`. |
| `BETWEEN`       | Camera zooms out; hold for `cfg.camera.betweenTurnsHold` seconds. | `_advanceToNextPlayer()` → `TURN_START` of the next non-bankrupt player. |

### Landing dispatch

`TurnManager` reads `player.currentCell.type` and routes:

- `bank` → no enforced effect (open to a `cfg.bank` extension).
- `buildable` / `empty`:
  - cell empty → **Build prompt** (catalog of structures, filtered by player cash).
  - cell has structure owned by **self** → `StructureManager.ownerOptionsFor(structure, player, onDone)` menu.
  - cell has structure owned by **another** → `StructureManager.visitorEffect(structure, player, onDone)` (rent + optional follow-up like "takeover" or "teleport for fee").
- `chance` → `ChanceSystem.draw(player, players)` and a result toast.
- `market` → market browser menu.
- `power_plant` / `well` / `mine` → resource yield + log.
- `structure` (pre-placed by map) → treated like an owned-by-system structure.

## 4.3 Start-of-turn ticks (`EconomyManager.runStartOfTurn`)

In order:

1. Run production: passive resource yields, shop visit income, house rent + population contribution, factory output (specialty or food), toll/teleporter/police/vault owner income.
2. Mayor taxes — `districtSys.collectTaxes(player)` collects from districts the player mayors.
3. Catch-up bonus — if `player` is below `cfg.catchUp.threshold` of the leader's net worth, hand them `cfg.catchUp.amount`.
4. Contextual tips — log a tip if the player is broke, holding too much oil, etc. (UX nudge.)

## 4.4 End-of-turn ticks (`EconomyManager.runEndOfTurn`)

1. Increment `game.turnCounter`.
2. Run upkeep: houses consume food, buildings consume electricity, factories consume oil. If the player can't pay, **idle** one structure of that consumer type (set `idleUntilTurn`) and dock 4 happiness from that district.
3. Decay sabotage timers (`sabotagedUntilTurn` countdown).
4. Resolve debt if `player.money < 0`:
   1. Withdraw vault stored money.
   2. Auto-sell resources at current market sell price (cheapest first or highest-quantity first, see code).
   3. Auto-sell structures at half value (cheapest first).
5. Set `player.isBankrupt = true` if `netWorth(player) ≤ 0`.
6. Tick systems: `populationSys.tick(turn, players)`, `marketSys.drift()`.
7. Increment `game.cooperativeThreat` (per-turn + per low-happiness district + per active plague event).

## 4.5 Controls

Bound in `cfg.controls`, applied in `AccaGame.constructor` via `engine.input.bind`.

| Action     | Default keys                  | Effect |
|------------|-------------------------------|--------|
| `up`       | `ArrowUp`, `KeyW`             | Move token up (during MOVE); menu navigation. |
| `down`     | `ArrowDown`, `KeyS`           | Move token down; menu navigation. |
| `left`     | `ArrowLeft`, `KeyA`           | Move token left; in MENU, decrement player count; in market/portfolio, change selection. |
| `right`    | `ArrowRight`, `KeyD`          | Move token right; in MENU, increment player count. |
| `confirm`  | `Enter`, `Space`              | Activate menu option; start game from MENU; restart from GAME_OVER. |
| `cancel`   | `Escape`, `Backspace`         | Close a menu (calls its `onCancel` hook). |
| `endTurn`  | `KeyE`                        | Reserved. Currently no global handler — end-of-turn happens via the start menu's "Pass" or via terminal landing flows. |

## 4.6 Die

`games/Acca2/core/DieController.js`. Pure visual + state container — no rng exposed externally.

- `roll(duration, onDone)` — picks a random 1..6, animates for `duration` seconds, then calls `onDone(value)`. `cfg.turn.rollDuration` default is 1.4s.
- `setFace(value)` — set the visible face directly (used by `MovementController` to count down during MOVE).
- `update(dt)` — advance animation; cycle through faces while rolling.

`ChanceSystem` can register a die-override (`{min, max}`) that the next `TurnManager` ROLL stage consumes via `chanceSys.consumeDieOverride(playerIndex)`. The override clamps the rolled value into the override's range — implemented by re-randomising in the override's range, not by re-rolling the die animation.

## 4.7 Movement

`games/Acca2/core/MovementController.js`.

Lifecycle:

1. `TurnManager` calls `movement.begin(player, moves)` after the die settles.
2. Each frame, `movement.update()` reads input and (if a step is queued) calls `stepTo(target)`.
3. On every step:
   - Toll-gate pass-through is applied via `StructureManager.passThroughEffect`.
   - `cell:leave` and `cell:enter` events fire.
4. On the final step, `movement.update()` emits `move:complete`. `TurnManager` listens for that on `engine.events` and transitions to `LANDING`.

The `roads[]` / `roadIdx` fields are kept as a stub for API compatibility; v2 does not implement multi-road choice at intersections (open question — see `19_OpenQuestions.md`).

## 4.8 Player setup flow (start of game)

`AccaGame._beginGame()`:

1. `boardLoader.load()` populates `game.cells[]` and the cell graph.
2. `game._initPlayers()` picks the spawn cell (`mapData.spawnCellId` → first `bank` cell → `cells[0]`) and creates `n` players from `cfg.players[]`. Each gets `cfg.startingMoney` cash and `cfg.startingResources` quantities. Player tokens get a small render offset so they don't all stack.
3. `districtSys.init(cells, mapData.districts)` builds the district map and seeds population from `cfg.district.defaultPopulation × max(1, cells/3)`.
4. State is reset: `turnCounter=0`, `cooperativeThreat=0`, `eventLog=[]`, HUD signature cache cleared.
5. Camera zooms out to board, then `turn.startTurn(currentPlayer)`.

## 4.9 End-of-game flow

`game._advanceToNextPlayer` calls `win.check()` after each turn. If a winner is returned:

1. `game.winner = winner; game.gameState = GAME_OVER`.
2. `OverlayRenderer.drawGameOver` paints the dimmed screen with the winner's colour, name, and stats.
3. `confirm` returns to `MENU`; player count and HUD signatures reset.

Win condition logic and tiebreakers live in `15_WinConditionsAndMultiplayer.md`.

## 4.10 Δ v1 roundup for this chapter

- Stage names match v1 (`TURN_START`, `ROLL`, `MOVE`, `LANDING`, `END_TURN`, `BETWEEN`) plus the v2 additions `CONFIRM_LAND` (reserved) and `LAND_PROMPT` (explicit menu state).
- v1 planned per-stage events `turn:start`, `die:roll`. v2 currently does not emit them — TurnManager calls subsystems directly. They are easy to add when audio/particles need them.
- `EndTurn` key (`KeyE`) is reserved but unused as a global; v1 had a global hot-key.
