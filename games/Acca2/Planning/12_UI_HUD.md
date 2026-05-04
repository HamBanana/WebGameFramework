# 12 — UI / HUD

## 12.1 Layout regions

The page (`games/Acca2/index.html`) declares a simple grid of DOM regions plus a single `<canvas>` for the board:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                  TOPBAR (DOM)                                │
│  Turn │ Name [bankrupt?] │ Money on hand │ Net worth │ Resources             │
├───────────────────────┬────────────────────────────────┬─────────────────────┤
│   DISTRICT SIDEBAR    │                                │   RIGHT SIDEBAR     │
│        (DOM)          │      <canvas id="gameCanvas">  │      (DOM)          │
│  Districts list:      │           BOARD + DIE          │  Notifications      │
│  name, mayor, pop,    │       + MENU MODAL OVERLAY     │  (last 12 events)   │
│  happiness, tax rate  │       + SPOTLIGHT              │                     │
│                       │                                │  Players panel      │
│                       │                                │  (one row each)     │
└───────────────────────┴────────────────────────────────┴─────────────────────┘
```

Styling lives in three CSS files under `games/Acca2/styles/`:

- `theme.css` — root variables (colors, fonts, layout dimensions).
- `topbar.css` — the top bar grid and resource-pill styling.
- `sidebars.css` — left district sidebar, right notifications + players panel.

> **Δ v1.** v1 was canvas-only. v2 mixes DOM (HUD) and canvas (board, menu modal, die). The board area is the only canvas surface; everything labelled "DOM" above is real `<div>`s updated by `ui/HUDRenderer.js`.

## 12.2 Top bar

DOM nodes: `#tb-turn`, `#tb-name`, `#tb-bankrupt-badge`, `#tb-money`, `#tb-networth`, `#tb-resources`.

| Cell             | Source                                    |
|------------------|-------------------------------------------|
| Turn             | `game.turnCounter`.                       |
| Name             | `game.currentPlayer.name`. The bankrupt badge appears when `currentPlayer.isBankrupt`. |
| Money on hand    | `game.currentPlayer.money`.               |
| Net worth        | `game.netWorth(game.currentPlayer)`.      |
| Resources        | One pill per resource; quantity from `currentPlayer.resources[resource]`. |

`ui/MoneyAnimations.js` watches `currentPlayer.money` for changes and:

- Adds a `gain` or `loss` flash class to the money cell.
- Spawns a floating "+$X" or "−$X" indicator.
- On gains, spawns a small coin-burst particle effect.

All overlays auto-remove after ~1700 ms. The same effect runs on each row of the player list (with a smaller floating indicator).

## 12.3 Map view

`<canvas id="gameCanvas" width="768" height="528">` renders:

- Background gradient + diagonal stripes.
- Board frame, district tints, roads, cell sprites, owner rings, tokens, spotlight overlay (see `03_BoardAndCells.md` §3.7).
- Die in the bottom-right (during `ROLL` and `MOVE` stages).
- Menu modal overlay (centered card with options).
- Start-menu / Game-over screens.

The canvas is resolution-fixed at 768×528 per `cfg.engine.{width,height}`. The browser scales the canvas to fit the `#mapWrap` slot in the grid.

## 12.4 Left sidebar — Districts

`<div id="districtSidebar"> > .panel > #districtList`. Built by `HUDRenderer.render()` from `districtSys.list()`.

Each district row shows:

- District name with mayor color/initial badge.
- Population (with up/down arrow if it changed last tick).
- Happiness mood (😊 / 😐 / 😠 emoji or equivalent class).
- Tax rate (percentage).
- Building count (`district.cells.filter(c => c.structure).length`).

The row highlights when the current player is mayor of that district. Renders only when the district's signature changes — see 12.10.

## 12.5 Right sidebar

Two panels stacked:

1. **Notifications** — last 12 entries from `game.eventLog`. Built fresh each frame the signature changes.
2. **Players** — one row per player:
   - Color dot.
   - Name.
   - Cash + net worth + structure count + districts mayored.
   - Active highlight on `game.currentPlayer`.
   - Bankrupt strikethrough on `isBankrupt`.

## 12.6 Modal menus

The menu modal is canvas-rendered (`OverlayRenderer.drawMenuOverlay`). Shape:

- Translucent backdrop.
- Centered card with title, optional subtitle, list of options (one highlighted), and a help line at the bottom.
- Disabled options render dimmed; the highlight skips them.

The menu is driven by `core/Menu.js` (`A.Menu`):

```js
menu.show(title, options, subtitle?, {
  onIndexChange: (option, index) => { /* preview / spotlight */ },
  onCancel:      () => { /* default = call the 'Back' option's action */ }
});
```

`options` shape: `{ label, action, meta?, _disabled?: bool }`.

`onIndexChange` is what enables previews — for example, the Portfolio menu spotlights the highlighted structure's cell, and the build menu highlights the structure type.

## 12.7 Notifications

Driven by `game.log(message)` and rendered into `#notifications` by `HUDRenderer`. The eventLog is capped at 500 entries (`AccaGame.log`) and the panel slices the last 12 for display.

There's also an in-game **Game log** menu (Manage → Game log) that paginates through the full 500-entry log, 14 entries per page.

## 12.8 Title screen

`OverlayRenderer.drawStartMenu`. Centred title, the four token previews from `cfg.players[]`, the player-count selector (← / →) showing `menuPlayerCount`, and a "Press ▶ to start" prompt.

Confirm transitions to `_beginGame()`.

## 12.9 Game over screen

`OverlayRenderer.drawGameOver`. Dims the world view and overlays:

- Winner name in their color.
- One-line stats (cash, net worth, structures, districts mayored).
- "Press ▶ to return to menu."

Confirm transitions back to `MENU`.

## 12.10 Signature-cached DOM rendering

The DOM HUD updates only when the *signature* (a hash of the relevant state) changes. `HUDRenderer.render()` is called every frame, but it short-circuits when nothing meaningful has changed.

Pseudocode for one panel:

```js
const sig = `${player.money}|${player.isBankrupt}|${this.netWorth(player)}|...`;
if (sig === this._sigPlayer) return;
this._sigPlayer = sig;
// ... rebuild DOM ...
```

`HUDRenderer.resetSignatures()` is called when starting a new game / returning to menu / after game over so the next frame fully repaints.

## 12.11 Accessibility

- `cfg.accessibility.colorBlindFriendly` toggles a higher-contrast palette (reserved — not yet wired into the CSS variables).
- All interactive choices are keyboard-only; no mouse-required controls.
- Resource icons render alongside their colored pill so color is not the only signal.
- Bankrupt status is shown by both a strikethrough and a textual badge.

## 12.12 Δ v1 roundup for this chapter

- DOM HUD replaces v1's canvas HUD.
- `MoneyAnimations` is new.
- Menu's `onIndexChange` callback is new — drives spotlight previews.
- The full game log (Manage → Game log) is new.
