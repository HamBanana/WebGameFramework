# 13 — Audio and Visual Feedback

## 13.1 Audio

Use `framework/systems/AudioSystem.js`. Sound names are registered in the framework (asset paths live there); games refer only to names. Names defined for Acca:

| Sound name | When | Channel |
|------------|------|---------|
| `sfx_die_roll` | DieController starts roll | sfx |
| `sfx_die_settle` | DieController snaps to value | sfx |
| `sfx_step` | Each cell step | sfx |
| `sfx_buy` | Property purchased | sfx |
| `sfx_build` | Business built | sfx |
| `sfx_upgrade` | Business upgraded | sfx |
| `sfx_rent` | Rent paid | sfx |
| `sfx_takeover` | Hostile takeover succeeds | sfx |
| `sfx_sabotage` | Sabotage triggers | sfx |
| `sfx_chance_economy` | Economy chance card | sfx |
| `sfx_chance_population` | Population chance card | sfx |
| `sfx_chance_resource` | Resource chance card | sfx |
| `sfx_chance_weather` | Weather chance card | sfx |
| `sfx_mayor_gain` | Mayor election | sfx |
| `sfx_mayor_lose` | Mayor lost | sfx |
| `sfx_menu_move` | Menu cursor moves | ui |
| `sfx_menu_confirm` | Menu confirm | ui |
| `sfx_menu_cancel` | Menu cancel | ui |
| `sfx_notification_info` | Info toast appears | ui |
| `sfx_notification_warn` | Warn/danger toast | ui |
| `mus_title` | Title screen | music |
| `mus_play_calm` | Playing, default loop | music |
| `mus_play_tense` | Playing, when leader within 25% of win | music |
| `mus_game_over_win` | Game over (winner exists) | music |

Music channels crossfade in 1.5s when state changes. SFX channel respects `cfg.audio.sfxVolume`; UI respects `cfg.audio.uiVolume`; music respects `cfg.audio.musicVolume`. All defaults clamp to 0..1.

## 13.2 Particles

Use `framework/systems/ParticleSystem.js`. Effects:

| Effect name | Trigger |
|-------------|---------|
| `dust_step` | Player token moves between cells |
| `coins_burst` | Money gained ≥ $50 |
| `coins_drop` | Money lost ≥ $50 |
| `confetti` | Mayor election, win condition met |
| `sparks_build` | Business built / upgraded |
| `smoke_sabotage` | Sabotage applied |
| `roll_dust` | Die roll snaps |
| `migration_arrows` | Population migrated (one arrow per ~10 movers) |

## 13.3 Animations

- Die uses sprite animation (already wired). Add a brief scale-up easing on snap.
- Player tokens use `walk` / `idle` animation states; switch on movement.
- Cells: `idle` plus `highlight` (pulse) animation states.
- Property owner ring: pulses on the turn the property changes hands; static otherwise.
- Tween system used for all menu open/close (`framework/systems/TweenSystem.js`).

## 13.4 Camera

Currently no camera tweens — the board fits on screen. For larger maps, `framework/systems/Camera.js` should:

- Center on the active player's token at turn start.
- Smooth-follow during `MOVE`.
- Pan to a property on takeover/sabotage events for ~1 second before resuming.
- Zoom (1× / 1.25×) toggleable from `Options`.

## 13.5 Theming

A `cfg.theme` block holds colors and font sizes used by HUD/region/player rendering. Themes live in `games/Acca/themes/*.json` (NEW — see 17_FileStructure). Two ship with v1: `theme_classic` (current grayscale-blue) and `theme_warm` (terracotta/amber). Selectable in `Options`.
