# 13 — Audio and Visual Feedback

## 13.1 Audio

Volume is controlled by three keys under `cfg.audio`:

| Key            | Default | Channel |
|----------------|---------|---------|
| `sfxVolume`    | 0.7     | One-shot effects (roll, build, takeover, sabotage). |
| `uiVolume`     | 0.6     | Menu navigation + confirm/cancel beeps. |
| `musicVolume`  | 0.4     | Looping background music (reserved). |

Sound names follow `sfx_<verb>` / `ui_<verb>` / `music_<scene>` conventions; the framework's `AudioSystem` resolves them. v2 ships hooks but does not bundle audio assets — adding sounds is a matter of registering audio names with `framework/systems/AudioSystem.js` and emitting `audio.play('name')` from the relevant module.

Suggested events to wire (none of these are emitted yet — easy extension):

| Trigger                           | Suggested sound          | Channel |
|-----------------------------------|--------------------------|---------|
| Die starts rolling                | `sfx_die_roll`           | sfx     |
| Die settles                       | `sfx_die_settle`         | sfx     |
| Step on a cell during MOVE        | `sfx_step`               | sfx     |
| Build a structure                 | `sfx_build_<type>`       | sfx     |
| Pay rent / collect rent           | `sfx_cash`               | sfx     |
| Mayor change                      | `sfx_mayor`              | sfx     |
| Sabotage applied                  | `sfx_sabotage`           | sfx     |
| Chance event drawn                | `sfx_chance`             | sfx     |
| Menu navigate / confirm / cancel  | `ui_*`                   | ui      |
| Game over (win / lose)            | `sfx_game_over`          | sfx     |

## 13.2 Particles

Particles are also a reserved hook in v2 — no `ParticleSystem` calls fire from game code yet. The framework's particle system is available; the emitter API would be invoked by `MoneyAnimations` and by sabotage/takeover paths.

The single visual particle effect that *is* implemented is the **coin-burst** in `ui/MoneyAnimations.js`, which is DOM-based (small absolutely-positioned coin spans that animate via CSS keyframes from `theme.css`).

Suggested particle additions:

| Trigger                  | Effect                                          |
|--------------------------|-------------------------------------------------|
| Roll                     | Sparkle around the die.                         |
| Build                    | Brief construction puff at the cell.            |
| Takeover                 | Player-colored ring sweep at the cell.          |
| Sabotage                 | Smoke/embers at the target cell.                |
| Mayor change             | Gold confetti from the new mayor's color.       |
| Festival                 | Fireworks above the district sidebar entry.     |

## 13.3 Animations

Two systems contribute to motion in v2:

1. **Sprite animators** — every Cell, Player, and PlayerStructure carries an animator instance. The framework's `SpriteSystem` ticks them via `animator.update(dt)` (called from `AccaGame._update`). Most v2 sprites are single-frame, but the die has a multi-frame "rolling" state, and the sprite system's animation contract supports keyed states (`'idle'`, `'walk'`, `'roll'`).
2. **Camera lerp** — `CameraManager.update(dt)` lerps `_camera.{scale, cx, cy}` toward `target*` by `cfg.camera.lerp` (= 0.12 per frame). Snap (`camera.snap()`) sets current = target instantly.
3. **DOM transitions** — money flash, floating "+$X" indicators, district happiness mood bumps, all driven by CSS `@keyframes` declared in `theme.css`. They self-clean after ~1700 ms.

## 13.4 Camera

Owned by `managers/CameraManager.js`.

State (held on `game._camera`):

- `scale`, `cx`, `cy` — current view.
- `targetScale`, `targetCx`, `targetCy` — desired view.
- `boardCenter` — center of the board, computed at load time.
- `zoomedOutScale` — the scale that fits the entire board into the canvas.

Methods:

- `zoomInOnPlayer(player)` — frame the active player at `cfg.camera.zoomedInCellsAcross` cells across (= 6).
- `zoomOutToBoard()` — frame the entire board with `cfg.camera.zoomOutPadding` (= 80px).
- `snap()` — set current = target instantly (used at game start).
- `update(dt)` — lerp current toward target.
- `spotlightOnCell(cell)` — set a cell to highlight; the renderer dims the rest of the world and pulses a halo around the cell.
- `clearSpotlight()` — clear the highlight.

Camera transitions:

- `TURN_START` → `zoomInOnPlayer(player)`.
- `BETWEEN` → `zoomOutToBoard()` (for `cfg.camera.betweenTurnsHold` = 0.6 s).
- Land prompt with a chosen cell → `spotlightOnCell` while the menu is open.
- Menu's `onIndexChange` previewing structures → `spotlightOnCell` follows the highlight.

## 13.5 Theming

Themes live under `games/Acca2/themes/`:

- `theme_classic.json` — the default.
- `theme_warm.json` — a warmer palette variant.

Theme JSON shape (descriptive — concrete file is the source of truth):

```jsonc
{
  "id":   "theme_classic",
  "name": "Classic",
  "colors": {
    "background":     "#0d1218",
    "panel":          "#16202a",
    "text":           "#e8eef5",
    "accent":         "#4da6ff",
    "districtPalette": ["#5e8edd", "#7be07f", "#ffd166", "#ef476f", "..."]
  },
  "sprites": {
    "overrides": {
      "cell_shop":      "cell_shop_classic",
      "cell_property":  "cell_property_classic"
    }
  }
}
```

`cfg.theme.id` selects which theme is active; `cfg.theme.overrides` lets a particular instance patch the theme without editing the JSON. CSS variables in `styles/theme.css` are the runtime surface — JS can rewrite them on theme switch.

## 13.6 Δ v1 roundup for this chapter

- v1 had a richer particle plan (per-cell ambient effects, parallax). v2 ships only the coin-burst on cash gains.
- Camera spotlight is new — v1 had a static camera frame.
- Themes are JSON-driven; v1 used hard-coded colors.
