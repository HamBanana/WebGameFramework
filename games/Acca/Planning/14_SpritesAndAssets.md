# 14 — Sprites and Assets

Per the framework rule: **sprite NAMES only here**. Asset paths live in `framework/sprites/*.js` and are resolved by the framework's `AssetLoader`. New sprites added for Acca live in `games/Acca/sprites/*.js` so the framework remains generic.

## 14.1 Existing Acca sprite registries

- `games/Acca/sprites/cells.js` — board cell tiles.
- `games/Acca/sprites/tokens.js` — player tokens.
- `games/Acca/sprites/die.js` — die.

Each module pushes entries onto `GF.sprites` at load time (already wired by `AccaGame` via `sprites.registerSprites(GF.sprites)`).

## 14.2 Required sprite names

### Cells

- `cell_normal` — empty/buildable lot.
- `cell_property` — generic owned-or-buyable property.
- `cell_start` — bank / starting cell.
- `cell_chance` — chance tile.
- `cell_market` (NEW) — market.
- `cell_forest` (NEW) — forest cell (wood resource).
- `cell_mine_coal` / `cell_mine_iron` (NEW) — coal / iron variants of mine.
- `cell_oil` (NEW) — oil rig.
- `cell_well` (NEW) — water well.
- `cell_farm` (NEW) — farm.
- `cell_power` (NEW) — power plant.

Each cell sprite needs at minimum two animation states: `idle` and `highlight`.

### Tokens

`token_red`, `token_blue`, `token_green`, `token_yellow` (already declared in `cfg.players`). Each needs `idle`, `walk`, `cheer`, `slump`. Add: `token_purple`, `token_orange` if `cfg.players` is expanded to 6.

### Die

`die` — animation states: `face1` … `face6`, `rolling`. Already wired.

### Resources (NEW)

Used in HUD strip, market modal, business cards.

- `res_wood`, `res_steel`, `res_electricity`, `res_water`, `res_food`, `res_coal`, `res_oil`.

### Businesses (NEW)

Small icons stacked over property cells; also used in Build menu thumbnails.

- `biz_shop`, `biz_factory`, `biz_farm`, `biz_lumber_mill`, `biz_coal_mine`, `biz_steel_mill`, `biz_power_plant`, `biz_oil_rig`, `biz_water_pump`, `biz_service`.

### Population & happiness

- `pop_face_happy`, `pop_face_neutral`, `pop_face_sad`, `pop_face_angry` — used in region badges.

### UI miscellaneous

- `ui_panel_corner` — for sliced panel rendering (already provided by UISystem? confirm).
- `ui_arrow_left`, `ui_arrow_right` — selectors.
- `ui_check`, `ui_x` — confirm/cancel.
- `chance_card_economy`, `chance_card_population`, `chance_card_resource`, `chance_card_weather`, `chance_card_social` — chance modal illustration.

## 14.3 Animation contract

Every sprite registered for Acca must obey:

```js
{
  name: 'biz_factory',
  states: {
    idle:      { frames: [...], loop: true,  fps: 6 },
    highlight: { frames: [...], loop: true,  fps: 12 },
  },
  width: 32,
  height: 32,
  origin: { x: 16, y: 16 },   // center
}
```

Animator instances created via `sprites.createAnimator(name, initialState)`. State changes via `animator.play(state, restart=false)`.

## 14.4 Adding a new sprite

1. Add an entry to `games/Acca/sprites/<category>.js` with a unique name.
2. Provide the underlying asset path in `framework/sprites/<category>.js` if the framework owns the asset, or in the same Acca file otherwise.
3. Ensure `width`, `height`, and `origin` match the rendering in HUD/board (otherwise tokens/cells will misalign).
4. Re-run `framework/build.js` if the bundle is built (rather than served à la carte).

## 14.5 Asset folder convention

If new image assets are added:

- Game-specific: `games/Acca/sprites/img/<name>.png`.
- Framework-owned: `Sprites/<Category>/spritesheet.png` (the existing pattern with `Claude/` and `Claudia/`).

Assets are not committed via this planning step — only references are. Adding actual artwork is a separate task in `18_ImplementationRoadmap.md`.
