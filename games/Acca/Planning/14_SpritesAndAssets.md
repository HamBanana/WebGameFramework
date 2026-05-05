# 14 — Sprites and Assets

## 14.1 Sprite registries

Each file under `games/Acca/sprites/` registers entries on `GF.sprites` (called by `AccaGame.constructor` via `sprites.registerSprites(GF.sprites)`).

| File                                       | What it registers |
|--------------------------------------------|-------------------|
| `games/Acca/sprites/tokens.js`            | `token_red`, `token_blue`, `token_green`, `token_yellow` (the four player tokens). |
| `games/Acca/sprites/die.js`               | `die` — multi-frame animator for the rolling state and the six face values. |
| `games/Acca/sprites/cells.js`             | `cell_start` (bank), `cell_chance`, `cell_market`, `cell_property` (buildable), `cell_normal` (empty). |
| `games/Acca/sprites/cells_extra.js`       | `cell_power_plant`, `cell_well`, `cell_mine` (resource cells). |
| `games/Acca/sprites/structures.js`        | `cell_shop`, `cell_toll_gate`, `cell_teleporter`, `cell_house`, `cell_factory`, `cell_police_station`, `cell_vault`. |
| `games/Acca/sprites/resources.js`         | Resource icon sprites (one per `cfg.market.resources`). |
| `games/Acca/sprites/businesses.js`        | Reserved for legacy "business" iconography; the structures registry covers the same ground. |
| `games/Acca/sprites/ui_icons.js`          | Misc UI glyphs (mayor crown, sabotage marker, padlock for vault, etc.). |


## 14.2 Required sprite names

If you add a new cell type or structure type, register it under one of the files above with a unique name. The runtime resolves sprite by name only — never by path.

| Domain               | Name pattern         | Used by |
|----------------------|----------------------|---------|
| Cells (board)        | `cell_<type>`        | `BoardLoader` resolves `cfg.structures.sprites[type]` (for built structures), or the cell-type → sprite map in `BoardLoader` for empty cells. |
| Player tokens        | `token_<color>`      | `cfg.players[i].sprite`. |
| Die                  | `die`                | `DieController`. |
| Resources            | `res_<name>` (or whatever the file registers — check `sprites/resources.js`) | `HUDRenderer` resource pills. |
| UI glyphs            | `ui_<glyph>`         | DOM HUD via CSS background-image; canvas overlays via `sprites.draw('ui_<glyph>', ...)`. |

`cfg.structures.sprites` is the canonical structure-type → sprite-name map:

```jsonc
{
  "shop":           "cell_shop",
  "toll_gate":      "cell_toll_gate",
  "teleporter":     "cell_teleporter",
  "house":          "cell_house",
  "factory":        "cell_factory",
  "police_station": "cell_police_station",
  "vault":          "cell_vault"
}
```

## 14.3 Animation contract

Every animator supports:

- `update(dt)` — advance internal time.
- `draw(ctx, x, y)` — render the current frame at a given pixel.
- An optional `setState(name)` — switch to a named state if the registered sprite has multi-state frames. The die uses this to switch between `'rolling'` and the face values.

Cells, structures, and tokens are mostly single-state. The die is the only built-in multi-state sprite. If you add an animated structure (e.g. a chimney puff for factories) you'd:

1. Register a multi-frame animator in `sprites/structures.js`.
2. From `BoardRenderer.drawWorld`, call `cell.structure.animator.setState('puff')` when active.

## 14.4 Adding a new sprite

1. Decide the name (`cell_*` for cells, `token_*` for tokens, etc.).
2. Add an entry to the appropriate file under `sprites/`. The entry is a JS object that the framework's `SpriteSystem` understands — typically `{ kind: 'tile', size: 64