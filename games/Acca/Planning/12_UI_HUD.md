# 12 — UI / HUD

The reference for the default layout is `Planning/defaultinterface.png`. This doc translates that into a concrete plan that can be implemented against `framework/systems/UISystem.js`.

## 12.1 Layout regions

Canvas size: 1024 × 576 (from `cfg.engine`).

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TOP BAR  — name | money | net worth | resources strip                        │  ~48px
├──────────────────┬───────────────────────────────┬──────────────────────────┤
│  DISTRICTS       │                               │  PLAYERS PANEL           │
│  SIDEBAR (left)  │       MAP VIEW (canvas)        │  (per-player summary)    │
│  · district name │                               ├──────────────────────────┤
│  · pop / hap     │                               │  LOG / EVENTS            │
│  · tax / mayor   │                               │                          │
└──────────────────┴───────────────────────────────┴──────────────────────────┘
```

The current `_drawHUD` already implements a similar structure; this plan formalises it and adds the top-bar resource strip.

## 12.2 Top bar (per `Planning/defaultinterface.png`)

Four cells, each with a sliced background:

1. **Name** — current player name, color-tinted background.
2. **Money on hand** — `$1,234`.
3. **Net worth** — `totalValue` (cash + property + business + resources).
4. **Resources strip** — seven icons (`res_wood`, `res_steel`, `res_electricity`, `res_water`, `res_food`, `res_coal`, `res_oil`) with counts, in fixed order. Each item has a small price ticker beneath it driven by `MarketSystem`.

The strip width must scale to canvas width without overlapping the right-side panels (i.e., the strip occupies the *active player's* row only; in 4-player games, every player still has a row in the **PLAYERS PANEL** with abbreviated stats).

## 12.3 Map view

Center-of-screen rectangle bounded by board extents + 16px padding. Renders:

- District tinting (semi-transparent rect behind each district's cells using `district.color`).
- Cells (sprite-driven).
- Owner ring (3px, `player.color`).
- Business stack — small icons at top-right of each owned cell, max 5.
- Movement highlights — pulsing yellow border on neighbors of `currentCell` during MOVE.
- Player tokens — staggered.

## 12.4 Left sidebar — Districts

A DOM panel (`#districtSidebar`) showing a scrollable list of all districts, updated each frame via `AccaGame._renderDistrictSidebar()`. Per district:

- District name (colored border strip matching `district.color`).
- Specialty resource tag.
- Population and happiness (color-coded: green ≥ 70, yellow ≥ 40, orange ≥ 20, red below).
- Tax rate and buildings owned/total.
- Mayor name (colored dot + name, or "No mayor" in muted text).

## 12.5 Players panel (right side)

For each player (active player highlighted):

- Color bar accent.
- Token preview sprite.
- Name + bankrupt badge.
- Cash, total value, property count, districts mayored, level.

For 4 players, panel rows scale to 56px each. Selecting a player (gamepad LB/RB) opens a read-only **Player Details** modal — useful for quickly evaluating opponents before a trade.

## 12.5 Log

Last 6 messages, latest highlighted white, older lines fading to gray. Already implemented; add: emoji-icon prefix per category to scan quickly (uses a sprite, not unicode).

## 12.6 Modal menus

Modals are vertically centered, 320–480px wide. Built with `Menu` + `UISystem.drawPanel`. Stacking is allowed (e.g., Manage → Property Detail → Build Business).

Modals types:

- **Generic Menu** — title + arrow-key list (already implemented).
- **Picker** — list with thumbnail (player picker, property picker).
- **Trade Window** — two-column layout with stepper inputs.
- **Slider** — single horizontal slider for tax rate, prices.
- **Confirmation** — yes/no with mock summary.

Each modal advertises its keys at the bottom: `↑↓ select   Enter confirm   Esc back`.

## 12.7 Notifications

`games/Acca/ui/Notifications.js` shows a queue of timed cards in the top-right (below the top bar):

- Priority levels: `info`, `success`, `warning`, `danger`.
- Default duration: 3.5s.
- Pause on hover (mouse) or when modal is open.
- Subscribes to events for: `chance:drawn`, `district:mayorChanged`, `business:sabotaged`, `population:migrated` (only big migrations), `market:priceChanged` (only when ≥ 25% delta).

## 12.8 Title screen

Already implemented at a basic level. Required additions:

- Map selector (left/right cycles maps, fetched from `cfg.maps[]`).
- Win condition selector.
- Start button + Settings/Credits buttons.

## 12.9 Game over screen

Already drawn. Add: standings table.

## 12.10 Accessibility

- All text uses readable sizes (≥ 12px monospace at default zoom).
- All colors used to encode state (mayor color, owner color) are paired with iconography or text — no information is color-only.
- Optional setting `cfg.accessibility.colorBlindFriendly = true` swaps to a tested palette. Hooks into HUD/Cell rendering via `cfg.players[i].color`.
