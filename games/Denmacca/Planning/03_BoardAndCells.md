# 03 — Board and Cells

## 3.1 Cell types

The cell types known to v2 (used by sprite registrations, `BoardLoader`, `TurnManager` landing dispatch, and `MapCreator`):

| Type           | Sprite name           | Purchasable / buildable? | OnLand effect |
|----------------|------------------------|--------------------------|---------------|
| `bank`         | `cell_start`           | No                       | Spawn cell at game start. **Landing pays $200** (a passive stipend, deliberately small). Pass-through is a no-op. |
| `buildable`    | `cell_property`        | **Yes**                  | If empty, prompt to build a structure. If a structure exists, dispatch to `StructureManager.ownerOptionsFor` (own) or `visitorEffect` (visitor). |
| `empty`        | `cell_normal`          | Yes (treated as buildable) | Same as `buildable`. Used for unthemed lots. |
| `chance`       | `cell_chance`          | No                       | Draw a chance event from the pool via `ChanceSystem`. |
| `market`       | `cell_market`          | No                       | Open the market menu (buy/sell resources). |
| `power_plant`  | `cell_power_plant`     | No                       | Resource cell — landing yields +3 electricity. |
| `well`         | `cell_well`            | No                       | Resource cell — landing yields +3 water. |
| `mine`         | `cell_mine`            | No (subType: `coal` / `iron` / `oil`) | Resource cell — landing yields +3 of the matching resource (`iron` → steel). `subType` is read from the live `Cell` (set by `BoardLoader` from the map JSON). |
| `structure`    | (varies per `structureType`) | No (pre-placed) | Pre-built non-player structure. If the cell carries a `PlayerStructure` instance the regular owner/visitor flow runs; otherwise the landing is a flavour-only stop and the turn ends safely. |

Cell type is set in the map JSON and never inferred from neighborhood.

> **Δ v1.** v1 split "property" into a buyable cell + a Property entity that hosted multiple businesses. v2 collapses this — a `buildable` cell hosts at most one `PlayerStructure`. Resource cells (`forest`, `oil_rig`, `farm`) from v1's plan are not currently in v2; the resource side is `power_plant` / `well` / `mine` plus mine subtypes. Adding more is straightforward: register a sprite, add a case in `BoardLoader`, add a `LANDING` branch in `TurnManager`.

## 3.2 Cell schema (in code)

`games/Acca/core/Cell.js`:

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

A district is a named group of cells. Districts are identified by `cell.district` (the **name string**) and managed by `games/Acca/systems/DistrictSystem.js`.

```js
// games/Acca/systems/DistrictSystem.js — District class
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

`games/Acca/maps/default.json` and `games/Acca/maps/denmark.json` already exist. The canonical schema:

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
