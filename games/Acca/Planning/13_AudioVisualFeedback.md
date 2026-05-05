# 13 — Audio and Visual Feedback

## 13.1 Audio

Volume is controlled by three keys under `cfg.audio`:

| Key            | Default | Channel |
|----------------|---------|---------|
| `sfxVolume`    | 0.7     | One-shot effects (roll, build, takeover, sabotage). |
| `uiVolume`     | 0.6     | Menu navigation + confirm/cancel beeps. |
| `musicVolume`  | 0.4     | Looping background music (reserved). |

Sound names follow `sfx_<verb>` / `ui_<verb>` / `music_<scene>` conventions; the framework's `AudioSystem` resolves them. ships hooks but does not bundle audio assets — adding sounds is a matter of registering audio names with `framework/systems/AudioSystem.js` and emitting `audio.play('name')` from the relevant module.

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

Particles are a reserved hook — no `ParticleSystem` calls fire from game code yet. The framework's particle system is available; the emitter API would be invoked by `MoneyAnimations` and by sabotage/takeover paths.

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

Two systems contribute to motion:

1. **Sprite animators** — every Cell, Player, and PlayerStructure carries an animator instance. The framework's `SpriteSystem` ticks them via `animator.update(dt)` (called from `AccaGame._update`). Most sprites are single-frame, but the die has a multi-frame "rolling" state, and the sprite system's animation contract supports keyed states (`'idle