# 14 — Sprites and Assets

## 14.1 Existing Acca v2 sprite registries

Each file under `games/Acca2/sprites/` registers entries on `GF.sprites` (called by `AccaGame.constructor` via `sprites.registerSprites(GF.sprites)`).

| File                                       | What it registers |
|--------------------------------------------|-------------------|
| `games/Acca2/sprites/tokens.js`            | `token_red`, `token_blue`, `token_green`, `token_yellow` (the four player tokens). |
| `games/Acca2/sprites/die.js`               | `die` — multi-frame animator for the rolling state and the six face values. |
| `games/Acca2/sprites/cells.js`             | `cell_start` (bank), `cell_chance`, `cell_market`, `cell_property` (buildable), `cell_normal` (empty). |
| `games/Acca2/sprites/cells_extra.js`       | `cell_power_plant`, `cell_well`, `cell_mine` (resource cells). |
| `games/Acca2/sprites/structures.js`        | `cell_shop`, `cell_toll_gate`, `cell_teleporter`, `cell_house`, `cell_factory`, `cell_police_station`, `cell_vault`. |
| `games/Acca2/sprites/resources.js`         | Resource icon sprites (one per `cfg.market.resources`). |
| `games/Acca2/sprites/businesses.js`        | Reserved for legacy "business" iconography from v1; in v2 the structures registry covers the same ground. |
| `games/Acca2/sprites/ui_icons.js`          | Misc UI glyphs (mayor crown, sabotage marker, padlock for vault, etc.). |

> **Δ v1.** v2 keeps the `businesses.js` file for backward compatibility; new structures go into `structures.js`.

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
2. Add an entry to the appropriate file under `sprites/`. The entry is a JS object that the framework's `SpriteSystem` understands — typically `{ kind: 'tile', size: 64, draw(ctx) { /* paint to context */ } }` for procedural sprites, or `{ kind: 'image', src: 'assets/...' }` for raster sprites loaded by the framework.
3. Reference the name from config or directly from a renderer.
4. Update `14.1` and `17_FileStructure.md` if you create a new sprite file.

> **Convention.** `FRAMEWORK_CONFIG must not include full asset paths` — paths to image files belong only inside `framework/sprites/*` (for framework-shipped art) or inside the sprite-registration object itself (for game-shipped art under `games/Acca2/`). Game code references sprites by name, period.

## 14.5 Asset folder convention

If raster art is added later, it would live at:

```
games/Acca2/assets/sprites/...
```

…and be referenced from `sprites/*.js` by relative path. v2 currently ships with procedural sprites only (each sprite is a small canvas-painting routine), so no `assets/` folder exists yet.

## 14.6 Δ v1 roundup for this chapter

- Sprite naming convention is unchanged.
- v2 separates `cells.js` (basic cells) from `cells_extra.js` (resource cells) and `structures.js` (player structures); v1 lumped them all into `cells.js`.
- All sprites in v2 are procedural canvases. v1's plan referenced raster `Sprites/Claude` and `Sprites/Claudia` for character sprites; those exist in the framework but aren't currently used by Acca v2.
