# 03 — Board and Cells

## 3.1 Cell types

The cell types known to v2 (used by sprite registrations, `BoardLoader`, `TurnManager` landing dispatch, and `MapCreator`):

| Type           | Sprite name           | Purchasable / buildable? | OnLand effect |
|----------------|------------------------|--------------------------|---------------|
| `bank`         | `cell_start`           | No                       | Spawn cell at game start. Pass-through and landing have no enforced effect in v2 (room for a passive bank bonus). |
| `buildable`    | `cell_property`        | **Yes**                  | If empty, prompt to build a structure. If a structure exists, dispatch to `StructureManager.ownerOptionsFor` (own) or `visitorEffect` (visitor). |
| `empty`        | `cell_normal`          | Yes (treated as buildable) | Same as `buildable`. Used for unthemed lots. |
| `chance`       | `cell_chance`          | No                       | Draw a chance event from the pool via `ChanceSystem`. |
| `market`       | `cell_market`          | No                       | Open the market menu (buy/sell resources). |
| `power_plant`  | `cell_power_plant`     | No                       | Resource cell — landing yields a small electricity bonus or invokes a special prompt. |
| `well`         | `cell_well`            | No                       | Resource cell — landing yields water. |
| `mine`         | `cell_mine`            | No (subType: `coal` / `iron`) | Resource cell — landing yields coal or steel ore depending on `subType`. |
| `structure`    | (varies per `structureType`) | No (pre-placed) | Pre-built non-player structure (e.g. a fixed shop placed by the map). |

Cell type is set in the map JSON and never inferred from neighborhood.

> **Δ v1.** v1 split "property" into a buyable cell + a Property entity that hosted multiple businesses. v2 collapses this — a `buildable` cell hosts at most one `PlayerStructure`. Resource cells (`forest`, `oil_rig`, `farm`) from v1's plan are not currently in v2; the resource side is `power_plant` / `well` / `mine` plus mine subtypes. Adding more is straightforward: register a sprite, add a case in `BoardLoader`, add a `LANDING` branch in `TurnManager`.

## 3.2 Cell schema (in code)

`games/Acca2/core/Cell.js`:

```js
class Cell {
  id;          // string|int (from map JSON)
  x; y;        // pixel coords (already cell-aligned in map JSON)
  type;        // see table above
  subType;     // optional refinement, e.g. 'iron' or 'coal' for mine
  district;    // district name (string) or null for non-district cells
  sprite;      // base sprite name resolved at load time

  // gameplay state
  structure;   // PlayerStructure or null

  // navigation (filled by BoardLoader)
  up; down; left; right; // cardinal-slot neighbors (best-angle pick)
  _neighbors;            // unordered list of Cell references (movement input)

  // visual
  animator;
}
```

## 3.3 District schema

A district is a named group of cells. Districts are identified by `cell.district` (the **name string**) and managed by `games/Acca2/systems/DistrictSystem.js`.

```js
// games/Acca2/systems/DistrictSystem.js — District class
class District {
  id;                       // string — same as the name, used as map key
  color;                    // hex string for map tint and sidebar
  cells;                    // Cell references belonging to this district
  mayorIndex;               // -1 if no current mayor
  taxRate;                  // 0..cfg.district.maxTaxRate; mayor-adjustable
  population;               // current resident count
  happiness;                // 0..100, lerped toward target each tick
  specialty;                // resource id or null (from map JSON)
  festivalUntilTurn;        // remaining festival duration
  festivalCooldownUntil;    // earliest turn another festival can run
  grantCooldownUntil;       // earliest turn another grant can run
  birthsThisTurn;           // population telemetry (HUD)
  deathsThisTurn;
  migratedIn;
  migratedOut;
}
```

> **Δ v1.** v1 exposed both **District** (concrete) and **Region** (planned higher-level grouping). v2 only implements districts. Region grouping is parked under `19_OpenQuestions.md`.

## 3.4 Map JSON spec

`games/Acca2/maps/default.json` and `games/Acca2/maps/denmark.json` already exist. The canonical schema:

```jsonc
{
  "version": 2,
  "name": "Default Map",
  "size": { "rows": 8, "cols": 12, "cellSize": 64 },
  "spawnCellId": 0,                        // where players start; falls back to first 'bank' cell
  "nextCellId": 96,                        // MapCreator auto-increment hint
  "nextDistrictId": 4,                     // MapCreator auto-increment hint
  "districts": [
    {
      "id": 1,
      "name": "Downtown",
      "color": "#5e8edd",
      "specialty": "service",              // resource id or null
      "basePopulation": 30,
      "defaultTaxRate": 0.1,
      "cellCount": 12
    }
  ],
  "cells": [
    {
      "id": 0,
      "x": 0, "y": 0,
      "type": "buildable",
      "subType": null,
      "district": "Downtown",              // matches districts[].name
      "districtId": 1,                     // also matches districts[].id (kept for MapCreator)
      "structureType": null,               // for type === 'structure', pre-placed structure
      "value": 200                         // legacy; unused at runtime
    }
  ],
  "connections": [
    { "from": 0, "to": 1, "direction": "both" }
  ]
}
```

Notes:

- `direction` is `"both"` (bidirectional) or `"forward"` (one-way) to support special board layouts.
- `value` is retained for backward compatibility but ignored at runtime; structure prices come from `cfg.structures.catalog`.
- Cells reference districts by **both** name (string) and id (int). `DistrictSystem` keys by name; `MapCreator` uses id.
- Connections are undirected when `"both"`. `BoardLoader` walks them once and builds `_neighbors[]` on each side.

## 3.5 Validation

`games/Acca2/utils/validate.js` exposes `validateMap(json)`. It checks:

- Every `cell.district` (when set) references a `districts[].name`.
- Every `connection.from` / `to` references a real cell.
- The cell list and id space are consistent.
- The connection graph reaches every cell from `spawnCellId` (warn on islands).

Validation errors should fail loudly to the console rather than silently render a half-formed board. The validator is **not** currently wired into `BoardLoader.load()` — it's exposed for MapCreator and ad-hoc usage. Adding a `validate.assert()` call in `BoardLoader.load()` is the recommended next step (see `19_OpenQuestions.md`).

## 3.6 Neighbor wiring

Implemented in `managers/BoardLoader.js`:

1. Build `cellById` from the cells list.
2. Walk `connections`. For each, push the linked Cell onto each side's `_neighbors` (and only one side if `"forward"`).
3. For each cell, choose a single Cell for each of `up/down/left/right` from `_neighbors` by best-cardinal angle (largest projection onto the axis).
4. If no candidate found in a cardinal slot, leave it null. Movement input falls back to `_neighbors`.

The cardinal slots feed `MovementController.adjacent` (which the player navigates with arrow keys); the unordered `_neighbors` list is the canonical edge set used by movement-pathing.

## 3.7 Visual layering (BoardRenderer)

Render order, back to front (see `render/BoardRenderer.drawWorld`):

1. Background gradient + diagonal stripes (`OverlayRenderer.drawBackground`, *before* the world transform).
2. Board frame panel (dark rectangle behind cells).
3. District tints — semi-transparent color washes drawn beneath cells.
4. Roads — asphalt edge, surface, dashed lane markings, one-way arrows.
5. Cell sprites.
6. Owner rings — player-colored rectangle around owned-structure cells.
7. Toll-gate accrued indicator (`$X` floating label).
8. Next-cell tooltips during MOVE stage.
9. Player tokens (each with `moveOffset` for stacking when ≥2 share a cell).
10. Spotlight overlay — dimmed full-screen fill + a glowing "hole" + pulsing halo (when `camera.spotlightCell` is set).

Then the canvas is reset to screen space and:

11. Die (`OverlayRenderer.drawDie`).
12. Menu modal (`OverlayRenderer.drawMenuOverlay`).
13. DOM HUD (`HUDRenderer.render`) — automatically composited over the canvas.

## 3.8 MapCreator alignment

`games/Acca2/MapCreator/` exports the same JSON shape described in 3.4. Any new cell-level field added here (`subType`, `structureType`, future region fields) must be exposed in MapCreator before it's consumed by the runtime, so authors aren't blocked.

## 3.9 Δ v1 roundup for this chapter

- v1 planned cells: `forest`, `oil_rig`, `well`, `farm`, `power_plant`. v2 ships: `well`, `mine` (with subtypes `coal`/`iron`), `power_plant`. The remaining types are deferred.
- v1 used `region` everywhere; v2 uses `district` consistently and drops the `region.bonus` industry hook.
- `cell.value` is no longer authoritative — structure cost is taken from `cfg.structures.catalog`.
- v2 introduces `type: "structure"` for *map-pre-placed* structures (a cell that comes with a built shop, etc., before players start).
