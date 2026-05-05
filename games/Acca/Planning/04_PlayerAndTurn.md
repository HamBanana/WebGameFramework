# 04 — Player and Turn Flow

## 4.1 Player entity

`games/Acca/entities/Player.js`:

```js
class Player {
  index;            // 0..n-1
  name;             // configurable (config.players[i].name)
  color;            // accent color
  spriteName;       // token sprite name
  animator;

  // Wealth
  money;
  totalValue;       // recomputed: money + propertyValue + businessValue + resourceMarketValue
  level;            // increases as the player builds — see 05_PropertiesAndBusinesses
  isBankrupt;

  // Holdings
  ownedCells;       // [Cell]
  resources;        // { wood: n, steel: n, electricity: n, water: n, food: n, coal: n, oil: n }
  companies;        // [Company]
  regionsMayoredOf; // Set<regionId>

  // Position
  currentCell;
  moveOffset;       // {x, y} stagger so multiple tokens don't fully overlap
}
```

`addMoney(delta)` triggers the bankruptcy check. Bankruptcy in v1: if `money` drops below 0 and `totalValue` (after auto-liquidating resources at market) is also below 0, the player is flagged bankrupt; their properties are auctioned (or returned to the bank — see 05) and they are skipped on subsequent rotations.

Net worth ("Net worth" in the HUD) = `totalValue`.

## 4.2 Turn state machine

The state machine is owned by `games/Acca/systems/TurnManager.js`. Stages:

| Stage | Entry action | Exits to |
|-------|--------------|----------|
| `TURN_START` | Show start menu (Roll / Trade / Manage / Options / End Turn). | `ROLL`, `TRADE`, `MANAGE`, `END_TURN` |
| `TRADE` (new) | Open Trade modal. | back to `TURN_START` |
| `MANAGE` (new) | Open Manage Properties modal — build/upgrade/sell business, set tax rate (if mayor of any region). | back to `TURN_START` |
| `ROLL` | Animate die. | `MOVE` |
| `MOVE` | Enable MovementController. Each step decrements `movesLeft`. Passing through a Bank cell triggers `bank.passIncome`. | `CONFIRM_LAND` (when movesLeft = 0) |
| `CONFIRM_LAND` | Show "Land here?" menu (Confirm only — leaves the door open for future "End early" rules). | `LANDING` |
| `LANDING` | Resolve cell type via the appropriate handler. | `LAND_PROMPT` or `END_TURN` |
| `LAND_PROMPT` | Submenu created by the cell handler. | `END_TURN` |
| `END_TURN` | Run end-of-turn ticks (population, market drift, business production), advance to next non-bankrupt player. | `TURN_START` of next player |

`TURN_START` adds two new options compared to today: **Trade** and **Manage**. These let players act between rolls without forcing them to wait for a specific cell.

## 4.3 End-of-turn ticks

When `END_TURN` is entered for player N, but *before* advancing to player N+1, the following run in this order:

1. **Business production:** every business that has the resources/electricity it needs produces output and pays its owner; idle businesses skipped (see 05).
2. **Property upkeep:** owners pay each business's resource upkeep. Insufficient resources mark the business `idle` for next turn.
3. **Region taxes:** every mayor receives `taxes` from their region (see 09).
4. **Population step:** each region's population advances by one step (births, deaths, migration — see 08).
5. **Market drift:** prices drift toward the equilibrium given current supply/demand (see 06).
6. **Chance trigger weights:** chance pool weights regenerate if any are time-decayed.

Only the active player observes these ticks visually (HUD gets updated and animated). Subsystems may emit `*:tick` events for the HUD to animate.

## 4.4 Controls

Bindings from `cfg.controls`:

| Action | Default keys | Use |
|--------|-------------|-----|
| `up`, `down`, `left`, `right` | Arrow keys, WASD | Menu navigation, board movement, player count adjust on title. |
| `confirm` | Enter, Space | Confirm menu choice / start game / dismiss notification. |
| `cancel` | Escape, Backspace | Close modal, return to previous menu. |
| `endTurn` (NEW) | KeyE | Skip directly to End Turn from `TURN_START` (when no remaining mandatory action). |
| `quickSave` (NEW) | F5 | Save game to slot 1 via SaveSystem. |
| `quickLoad` (NEW) | F9 | Load slot 1. |

Add a gamepad mapping: dpad/left-stick → directions, A → confirm, B → cancel, Start → menu, Select → trade. Implementation: extend `framework/core/InputManager.js` only if it doesn't already accept gamepad codes; otherwise add an Acca-specific mapping that translates gamepad codes into the same action names.

## 4.5 Die

`games/Acca/systems/DieController.js` already covers basic animation. Extend with:

- `applyModifier(mod)` — temporarily replace next roll's range, e.g. `{ min: 1, max: 4 }` for a "Sluggish Streets" chance event.
- `peekResult()` — debug-only.
- Animation: spinning sprite (registered via `sprites/die.js` — already exists) plus particle puff on snap.

## 4.6 Movement

`games/Acca/systems/MovementController.js` already implements the per-step arrow-key model. Required changes:

- Highlight all valid neighbor cells at every step (already implemented for current cell — confirm).
- Allow back-tracking: stepping onto the previous cell counts as a step but does **not** retreat the move counter back up.
- Pass-through events: emit `cell:passThrough` (NEW) for cells the player crosses but doesn't land on. Bank uses this to pay `passIncome`.
- Auto-stop on dead-ends: if `movesLeft > 0` but the current cell has zero unvisited neighbors *and* zero neighbors at all, fall through to `move:complete`.

## 4.7 Player setup flow

On the title screen (`GAME_STATE.MENU`):

1. Player count selector (already exists, 2..N).
2. **(NEW)** Per-player customization: name field, color swatch, token sprite. Selected via D-pad. Defaults from `cfg.players[i]`.
3. **(NEW)** Map selector: dropdown of `maps/*.json`.
4. **(NEW)** Win condition selector: type + target.
5. Start button.

Customizations override the corresponding fields when `Player` instances are constructed in `_initPlayers()`.

## 4.8 End-of-game flow

When a win condition fires (checked at `END_TURN`), `gameState` becomes `GAME_OVER`. The current `_drawGameOver` view stands; extend with:

- Final standings table — name, totalValue, regions mayored, properties owned.
- "New Game" / "Title screen" / "Save replay" options.
- Auto-save the final state to a `replays/` slot in the SaveSystem.
