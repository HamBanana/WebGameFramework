# 03 — Board and Cells

## 3.1 Cell types

The cell types in v1 are:

| Type | Sprite name | Purchasable? | OnLand effect |
|------|-------------|--------------|---------------|
| `bank` | `cell_start` | No | Player gains `bank.baseIncome`. Game start. Players passing through (not just landing) also receive `bank.passIncome`. |
| `property` | `cell_property` (and a region-tinted overlay) | Yes | If unowned, prompt to buy. If owned by another, pay rent. If self-owned, prompt: build/upgrade business. |
| `chance` | `cell_chance` | No | Draw a chance event from the pool. |
| `market` | `cell_market` (NEW — see 14_SpritesAndAssets) | No | Open MarketMenu (buy/sell resources). |
| `forest` | `cell_forest` (NEW) | Yes | Resource cell — when owned, produces wood per turn. Upon landing, owner gains a small bonus. |
| `mine` | `cell_mine` (NEW) | Yes | Resource cell — coal or steel ore, depending on `subType`. |
| `oil_rig` | `cell_oil` (NEW) | Yes | Resource cell — oil. |
| `well` | `cell_well` (NEW) | Yes | Resource cell — water. |
| `farm` | `cell_farm` (NEW) | Yes | Resource cell — food. |
| `power_plant` | `cell_power` (NEW) | Yes | Resource cell — electricity. |
| `empty` | `cell_normal` | Yes (low base price) | Buildable lot. |

Resource cells are still properties (i.e., they can host businesses), but they have an inherent passive yield independent of any business. See `06_ResourcesAndMarket.md` for production rates.

Cell type is set in the map JSON, never inferred.

## 3.2 Cell schema (in code)

`games/Acca/entities/Cell.js`:

```js
class Cell {
  id;          // string
  x; y;        // pixel coords (already cell-aligned in map JSON)
  type;        // see table above
  subType;     // optional refinement, e.g. 'iron' for mine
  district;    // region id (string) or null for non-regional cells
  sprite;      // base sprite name
  // gameplay state
  ownerIndex;       // -1 if unowned
  purchasePrice;
  property;         // Property entity if type ∈ purchasable
  // navigation
  up; down; left; right; // directional neighbors
  _neighbors;       // unordered list (for movement highlighting)
  // visual
  animator;
}
```

## 3.3 Region (district) schema

A region is a logical grouping of cells (typically contiguous, but contiguity is not enforced — designers can group thematically). Regions are addressable by string id from cell.district.

```js
// games/Acca/entities/Region.js
class Region {
  id;          // string, e.g. 'downtown'
  name;        // human-readable, e.g. 'Downtown'
  bonus;       // optional industry bonus key when this region is mayor-controlled
  basePopulation;
  population;        // current count
  happiness;         // 0..100
  employed;          // total employed across businesses in region
  mayorIndex;        // -1 if no current mayor
  taxRate;           // 0..0.5; mayor-adjustable
  cellIds;           // ids of cells belonging to the region
}
```

## 3.4 Map JSON spec

`games/Acca/maps/default.json` already exists. The canonical schema (extended for v1) is documented here so MapCreator and the runtime stay in sync.

```jsonc
{
  "version": 2,
  "name": "Default Map",
  "size": { "rows": 8, "cols": 12, "cellSize": 64 },
  "regions": [
    {
      "id": "downtown",
      "name": "Downtown",
      "color": "#5e8edd",
      "basePopulation": 50,
      "bonus": "service"
    }
  ],
  "cells": [
    {
      "id": "c0",
      "x": 0, "y": 0,
      "type": "property",
      "subType": null,
      "district": "downtown",
      "purchasePrice": 200
    }
  ],
  "connections": [
    { "from": "c0", "to": "c1", "direction": "both" }
  ],
  "spawnCellId": "c0"   // where players start; falls back to first 'bank' cell
}
```

Notes:

- `direction` is `"both"` (bidirectional) or `"forward"` (one-way) to support special board layouts.
- `purchasePrice` is optional in the map; falls back to `cfg.property.basePrice` × region multiplier.
- `region.bonus` references a key in `cfg.industries.bonusKeys` (see `07_Companies.md`).

## 3.5 Validation

`games/Acca/systems/MapLoader.js` must validate:

- Every `cell.district` references a `regions[].id` (or is null).
- Every `connection.from` / `to` references a real cell.
- The connection graph is connected (BFS from `spawnCellId` reaches every cell that's marked reachable).
- Every region has at least one purchasable cell (otherwise mayoring it is impossible).
- The directional spatial assignment from `AccaGame._initBoard` finds at least one neighbor for every cell except dead-ends (warn if a cell has zero neighbors).

Validation errors should fail loudly to the console, not silently render half a board.

## 3.6 Neighbor wiring

Neighbor wiring already exists in `AccaGame._initBoard`. Keep its logic — pull it into `Board.js`:

1. Build `cellById` from the cells list.
2. Walk `connections`. For each, push the linked Cell onto each side's `_neighbors`.
3. For each cell, choose a single Cell for each of `up/down/left/right` from `_neighbors` by best-cardinal angle.

For maps that aren't axis-aligned (e.g., tracks of cells running diagonally), fall back to: if no candidate found in a cardinal slot, leave it null and use `_neighbors` for movement input parsing.

## 3.7 Visual layering

Render order, back to front:

1. Background gradient + parallax stripes (already implemented).
2. Region tinting (drawn beneath cells — see 12_UI_HUD).
3. Cell sprites.
4. Property owner ring.
5. Business icons stacked at top-right of each property.
6. Population indicator (small badge near the region label).
7. Movement highlights (pulsing yellow border).
8. Player tokens (with stagger offsets).
9. HUD (top bar, players panel, log).
10. Modal menus and notifications.

## 3.8 Map Creator alignment

`games/Acca/MapCreator/` must export the same JSON shape described in 3.4. Any new fields here (`subType`, `purchasePrice` per cell, `region.bonus`) must be addable in MapCreator before they're consumed by the runtime, so authors aren't blocked.
