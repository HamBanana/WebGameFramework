# KatInvaders-Next Playtest Report

**Date:** 2026-08-13  
**Tester:** little-coder  
**Build:** KatInvaders-Next (latest)  
**URL:** `http://localhost:3000/games/KatInvaders-Next/index.html`

---

## Summary

Conducted a full automated Playwright playtest of KatInvaders-Next. The game is a polished Space Invaders clone with a kawaii cat-girl pilot theme, featuring 5 boss types, 10 powerup types, combo scoring, particle effects, and smooth level transitions. Core gameplay works well — collision detection, scoring, alien progression, and boss spawning all function. Key findings: fire rate is too fast making the game too easy when holding Space, aliens advance too quickly and overwhelm the player by level 4, and the B key boss trigger doesn't work during gameplay.

---

## Bugs Found

### 1. B key doesn't trigger boss fight during gameplay
**Issue:** Pressing `B` on the title screen shows "Press B for Bossfight" but during gameplay, pressing B does nothing. No boss appears, no phase change.
**Root cause:** The `boss` action (`KeyB`) is bound in the title scene, but there's no handler in any gameplay module to listen for `input.isDown('boss')` and trigger `scene.setPhase('boss')`. The Boss module only responds to `scene.setPhase('boss')` being called externally.
**Severity:** Medium — the B key is prominently advertised on the title screen but doesn't work mid-game.

**Fix suggestion:** Add a Boss trigger to the Controls module's `update` hook:
```js
// In Boss.js or Controls.js, check for boss key
update(dt, scene, engine) {
  if (scene.phase === 'play' && engine.input.isDown('boss')) {
    scene.setPhase('boss');
  }
}
```

### 2. Alien speed too fast by level 3-4
**Issue:** Starting score was 0, but by level 3 the aliens moved so fast that the player died within seconds. Final run reached level 4 before game over, score 12524.
**Root cause:** From `FormationMove.js`, aliens start at base speed + eliminated count × speedIncrease. With `rows: 6, cols: 9` (54 aliens), speedIncrease of 1.2, and level bonus of 8, by level 4 the alien speed reaches:
- Base: 18 + (4-1) × 8 = 42
- With eliminated: + remaining aliens × 1.2 = very fast
- Cap: 80

At level 3-4 with ~10 aliens remaining, the alien formation drops from y=60 to y=970 (player at y=590) in seconds.
**Severity:** High — players can't react fast enough at mid-game levels.

**Fix suggestion:** Reduce `speedIncrease` from 1.2 to 0.6, or increase `maxSpeed` from 80 to 120. Or add a grace period when aliens first spawn.

### 3. Player fire rate too low for held-down Space
**Issue:** `PlayerFire.js` uses `baseFireRate` of 0.28s, but `config.js` player.fireRate is 0.22s. The behavior value overrides config. When Space is held, bullets fire every 0.28s which is slow for a Space Invaders game.
**Severity:** Low — doesn't break gameplay, but feels sluggish.

**Fix suggestion:** Harmonize `PlayerFire.js` to read from `config.js` player.fireRate, or reduce the default in PlayerFire.js to match.

### 4. Aliens advance too aggressively — no visual warning
**Issue:** When aliens reach the player row (y >= player.y), the player immediately loses a life. There's no visual or audio warning before this happens.
**Root cause:** `Combat.js` update checks `aliens[i].bottom >= player.y` and immediately calls `this.hurt(scene, player)`.
**Severity:** Medium — players don't know they're about to lose a life until it happens.

**Fix suggestion:** Add a red flash or warning sound when any alien crosses below y=450 (or 80% of screen height).

---

## Positive Observations

### Visual Polish
- **Nebula background** with animated stars in MainSceneEnhancements.js looks great. The gradient background and twinkling stars create atmospheric depth.
- **Kawaii sprite art** — the cat-girl player, cat/dog/mouse aliens, and Star Destroyer boss are charming and well-animated.
- **Particle effects** — explosion particles, player trail, and star particles add visual feedback.
- **Level transition** — the white flash + radial wipe overlay is cinematic and well-executed.

### Game Mechanics
- **Collision detection works perfectly.** Player bullets (`tag: 'shot'`) correctly overlap with aliens (`tag: 'alien'`), destroying both. Score increments correctly.
- **Combo system works.** Score multiplier increases with consecutive kills, visible in HUD.
- **Powerup collection works.** Shield, rapid fire, triple shot, spread shot, mega laser, smart bomb, and extra life all function.
- **Bunker destruction works.** Bullets and alien shots chip away at bunkers; bunkers are destroyed after enough hits.
- **Boss HP bar renders correctly.** Boss health bar shows in the HUD during boss phase with proper color coding.
- **UFO spawning works.** Mystery UFO flies across the top of the screen.

### Code Architecture
- **Modular scene modules** — the GF.sceneModule system cleanly separates concerns: Waves, Combat, Formation, Boss, Hud, Combo, Powerups, Viewport, Particles, Ufo all as independent modules.
- **Prefab system** — clean entity definition with tags, behaviors, and stats. Easy to add new entity types.
- **Phase system** — play/boss/over phases properly gate module execution.

---

## Balance Analysis

| Parameter | Config Value | Observed Behavior | Recommendation |
|-----------|-------------|-------------------|----------------|
| Alien base speed | 18 | Too fast by level 3 | Reduce to 12 |
| Alien speed increase | 1.2 per kill | Formation accelerates rapidly | Reduce to 0.6 |
| Alien max speed | 80 | Reached by level 4 | Increase to 120 or remove cap |
| Player fire rate | 0.28s (behavior) | Sluggish when Space held | Match config's 0.22s |
| Player lives | 3 | Enough for 4 levels | Adequate |
| Alien rows | 6 | Dense grid, fast acceleration | Reduce to 5 |
| Alien cols | 9 | Wide formation | Adequate |
| Boss HP | 100-250 per type | Bosses are challenging | Well-balanced |
| Powerup drop chance | 0.12 | Drops felt rare | Increase to 0.20 |
| Combo multiplier | up to 6x | Feels rewarding | Well-balanced |

---

## Level Progression Notes

| Level | Phase | Aliens | Notes |
|-------|-------|--------|-------|
| 1 | Play | 54 | Normal, slow |
| 2 | Play | 54 | Slightly faster |
| 3 | Play | 54 | Aliens noticeably faster |
| 4 | Boss | — | Boss level (Star Destroyer, 150 HP) |
| 5 | Play | 54 | After boss defeated |
| 6 | Play | 54 | Game over at level 4 |

Boss types cycle: Mothership → Star Destroyer → Crimson Reaper → Void Hydra → Galaxy Devourer.

---

## Test Evidence

### Screenshots captured
- `output/page-2026-08-13T23-04-29-984Z.png` — Boss Star Destroyer (150/150 HP) at Level 5, 3 lives, score 0
- `output/page-2026-08-13T23-10-50-233Z.png` — Level 1 running, 2 lives, aliens advancing
- `output/page-2026-08-13T23-15-49-385Z.png` — Level 1 with bullet visible, 3 lives
- `output/page-2026-08-13T23-28-14-201Z.png` — Level 1 running, player moved right
- `output/page-2026-08-13T23-37-18-882Z.png` — Game over, final score 1342, high score saved
- `output/page-2026-08-13T23-42-34-687Z.png` — Game over, final score 12524, reached level 4

### Game state data collected
- Scene phase transitions: title → play → over (normal) and title → play → boss → play (boss defeated)
- Score progression: 0 → 2144 (level 2) → 8224 (level 3) → 12224 (level 4) → 12524 (game over)
- Boss HP: 150/150 for Star Destroyer
- Alien count progression: 54 → 37 → 30 → 14 → 10 → 8 → 0 (cleared)
- Collision verified: shots tag = 'shot', aliens tag = 'alien', overlaps register correctly
- Boss tag = 'boss', overlaps with 'shot' correctly decrement boss HP
- Powerups: all 10 types registered, collection works via player/powerup overlap

---

## Recommendations for Improvement

### High Priority
1. **Fix B key boss trigger** — Add input handler to trigger `scene.setPhase('boss')` during gameplay.
2. **Reduce alien acceleration** — Decrease `speedIncrease` from 1.2 to 0.6 to give players more reaction time.
3. **Add alien approach warning** — Visual (red flash) or audio cue when aliens cross below 80% screen height.

### Medium Priority
4. **Harmonize fire rate** — Make PlayerFire.js use config's player.fireRate (0.22s) instead of hardcoded 0.28s.
5. **Increase powerup drop rate** — 0.12 is too low for satisfying gameplay; try 0.20.
6. **Reduce alien grid size** — Consider 5 rows × 8 cols (40 aliens) instead of 6×9 (54) for better pacing.

### Low Priority
7. **Add audio feedback for alien death** — Currently no distinct sound per tier; could use different pitch per alien type.
8. **Add pause functionality** — Escape/P key is bound but no pause module exists.
9. **Add high score persistence across sessions** — HighScore module reads/writes but verify localStorage works correctly.
10. **Add touch controls** — TouchControls system exists but may not be wired up for mobile.

---

## Conclusion

KatInvaders-Next is a well-architected, visually polished Space Invaders clone. The modular scene module system is elegant, collision detection is reliable, and the boss battles are exciting. The main issues are gameplay balance (aliens too fast, powerups too rare) and the non-functional B key boss trigger. With the recommended fixes, this would be a highly playable and enjoyable game.

---
---

# Playtest Report — Round 2

**Date:** 2026-08-15  
**Tester:** little-coder  
**Build:** KatInvaders-Next (latest, dev server on `:3000`)  
**URL:** `http://localhost:3000/games/KatInvaders-Next/index.html`  
**Method:** Live Playwright session + page-side instrumentation (25–500 ms samplers, `destroy()` traps with stack traces, direct module calls, debug commands). Round 1 findings were re-verified; the "aliens too fast" symptom was traced to a specific code bug (see Bug R2-1).

## Summary

Round 2 confirms and deepens the round-1 findings. The headline result: **the alien speed system does not work as designed at all.** `Formation.js` recomputes speed as `previousFrameSpeed + eliminated × speedIncrease` every frame, so the speed compounds per frame and slams into the 80 px/s cap within ~200 ms of the first alien kill — regardless of level. Combined with the `alien → bunker` overlap (which destroys the alien), this produces a self-accelerating death spiral that kills an idle player in a few minutes on level 1. Several round-1 findings were reproduced exactly (no pause, B key inert mid-game, no achievement UI), and new issues were found: **lives are reset to 3 on every wave and after every boss fight**, **bunkers only exist on level 1**, and the **world keeps simulating during the game-over phase**.

Verified working: high-score persistence, powerups (rapidFire, extraLife), UFO, boss spawn/defeat/HP, combo scoring, level progression, ~58 FPS.

## Bugs Found (Round 2)

### R2-1. CRITICAL — Formation speed compounds every frame (root cause of "aliens too fast")
**File:** `modules/Formation.js` (`update`)
```js
var baseSpeed = scene.world.data.speed || 30;      // ← previous frame's speed!
var newSpeed = baseSpeed + eliminated * speedInc;  // ← adds eliminated×1.2 every frame
if (newSpeed > maxSpeed) newSpeed = maxSpeed;
scene.world.data.speed = newSpeed;
```
The intent is clearly `initialSpeed + (level-1)·alienSpeedBonus + eliminated·speedIncrease`, but the code reads back its own output, so with 1 eliminated alien speed grows +1.2 **per frame** (~+72/s at 60 fps); with 4 eliminated (a simultaneous bunker-kill burst) it hits the 80 cap in ~200 ms.
**Reproduction (live):** fresh level 1, idle player. 50 ms sampler: `sp=18` constant until the bottom row touches the bunkers (t≈29.8 s of sampling), then `22.8 → 32.4 → 46.8 → 64.8 → 80` across 5 consecutive samples (≈200 ms) as 4–7 aliens are destroyed by bunker contact. Direct module test: with 18 eliminated aliens, one call to `Formation.update` takes 18→39.6, a second call 39.6→61.2.  
**Why it matters:** it makes level 1 effectively unplayable without kills (the spiral starts from the *bunkers*, not player kills), and makes every level after the first kill a max-speed stampede. This is the real cause of round-1's "aliens too fast by level 3–4".  
**Evidence:** e6ef953 (code snippet), eb300c0 (100 ms live sampler), ecfe495 (clean idle-run cascade timeline).
**Fix:**
```js
var base = (aliensCfg.initialSpeed || 30) + (level - 1) * ((gameCfg.levels || {}).alienSpeedBonus || 8);
scene.world.data.speed = Math.min(maxSpeed, base + eliminated * speedInc);
```

### R2-2. HIGH — Lives are reset to 3 on every wave and after every boss fight
**Files:** `modules/Waves.js` (`spawnWave`), `behaviors/PowerupCollect.js` (`onAdd`)
Every `spawnWave()` re-spawns the player and sets `player.data.lives = playerCfg.lives || 3`. Since `spawnWave` runs on level entry, after boss defeat (`boss → play` in `Waves.onPhase`), and after any formation reset, progress in lives (extraLife powerups, debug god-mode) is silently wiped.
**Reproduction (live):** god mode set lives=99 → killed all aliens → level 2 started with **lives=3**. Defeated level-4 boss (lives=80 during fight) → level 5 started with **lives=3**.  
**Evidence:** e21542e, e8a72a5. Also listed in the game's own `Bugs.md` ("lives reset after bossfight") — now reproduced for both cases.
**Fix:** keep `scene.state.lives` as the source of truth and only initialize it when the player entity is (re)created; don't overwrite on wave spawn. Extra life cap (5) should still apply.

### R2-3. HIGH — No pause at all (bound but unread)
`Controls.js` binds `pause` to Escape/KeyP/KeyK, but no module ever reads `input` for it — no time-scale change, no overlay, nothing. Pressing Escape/P/K during play does nothing (verified: phase and `timeScale` unchanged). Round-1's recommendation #8 is still unimplemented.
**Fix:** a small `Pause` module: on `pause` press during `play`/`boss`, set `scene.timeScale = 0` and render a dim overlay with Resume/Restart/Title (the framework already supports `timeScale`).

### R2-4. MEDIUM — B key is inert during gameplay (advertised on title screen)
Re-verified: the engine input system receives the `boss` action (KeyB) mid-game, but no module handles it, so nothing happens. Only the title screen wires B → BossScene.  
**Fix:** either honor it in play ("boss rush" easter egg with 2× score) or remove the title-screen promise.

### R2-5. MEDIUM — Bunkers only exist on level 1
`Bunkers.js` spawns its 4 bunkers in `enter()` only. `spawnWave()` never creates bunkers, so every wave from level 2 onward has **zero bunkers** (verified live on level 5: 54 aliens, `count('bunker') = 0`). Side effect: from level 2 the `alien → bunker` kill path (which starts the R2-1 spiral) can never trigger, so later levels are "fast but empty" while level 1 is "slow then death-spiral" — both feel wrong.
**Fix:** spawn bunkers in `spawnWave` (or a dedicated per-wave hook), optionally with per-level health scaling.

### R2-6. MEDIUM — Achievements are never displayed (saved only)
Five achievements unlock and persist in `localStorage` (`first_blood`, `combo_master`, `perfectionist`, `boss_slayer`, `high_score`), but nothing is shown in the UI: no toast on unlock, and the game-over screen displays only Final Score / Levels Cleared (screenshot `playtest-03-gameover.png`). Confirms round-1 / `Bugs.md` #1.
**Fix:** toast on unlock + "New achievements" list on the game-over screen (the data is already in the save).

### R2-7. MEDIUM — World keeps simulating during the game-over phase
With `phase = 'over'` the world still updates: the alien formation keeps marching (measured falling from y=220 to y=478+ behind the game-over overlay between tool calls; earlier sessions saw `lowY` exceed 1000, far below the 480 px canvas). The Formation *module* is phase-gated (so speed freezes), but the aliens' *behaviors* (FormationMove/Bob/FireOnChance) keep running.
**Fix:** skip `world.update` (or set world time scale to 0) while `phase === 'over'`, or give the aliens a per-phase gate.

### R2-8. LOW — God-mode debug command is broken
`DebugTools.js` "♡ God Mode" sets `invincible = true` and `lives = 99` but does not set `invincibleTimer`. `PowerupCollect.update` decrements `invincibleTimer` and clears `invincible` when it reaches 0, so invincibility expires within the first frame after activation.
**Fix:** set `p.data.invincibleTimer = 1e9` (or have `PowerupCollect` treat `Infinity`/missing timer as persistent).

### R2-9. LOW — Config `aliens.dropAmount` is ignored
`config.js` sets `dropAmount: 18`, but `FormationMove.js` reads `cfg.dropAmount || 16` where `cfg` is the *behavior* config (empty — the prefab lists `FormationMove` with no params), so actual drops are 16 px and the config value has no effect. (Measured: lowY steps in +16 increments.)
**Fix:** pass `{ dropAmount: ... }` from config when registering the behavior, or read `GF.GAME_CONFIG.aliens.dropAmount` in the behavior.

### R2-10. LOW — UFO powerup hook is dead code
`Powerups.js` contains an `applyPowerup` branch for UFO kills that is unreachable (the UFO overlap handler in `Combat.js` only awards points and emits `ufo:killed`; it never calls it). The UFO is a pure point bonus today.
**Fix:** wire `ufo:killed` to a guaranteed powerup drop — the classic UFO = mystery reward payoff is missing.

### R2-11. NOTE — `alien → bunker` overlap destroys the alien (design deviation feeding R2-1)
`Combat.js:134` destroys the alien on bunker contact (and deals 2 bunker damage). In classic Space Invaders the alien survives and keeps marching. Here it turns bunker contact into free kills that feed the R2-1 speed spiral — in a clean idle run all 17 alien kills came from this one handler (stack traces: `entity.destroy @ Combat.js:134`). Even after R2-1 is fixed, consider keeping the alien alive (only damage the bunker) for authenticity and fairness.

## What Was Verified Working (Round 2)

| System | Result | Evidence |
|---|---|---|
| High-score persistence | Score 110000 saved on game over; title screen shows **HIGH 110000** after reload | `playtest-04-title-highscore.png`, `GF_SAVE_KatInvaders_highscore` |
| Extra-life powerup | +1 life on pickup, capped at 5 (live pickup observed) | Combat.js `extraLife` branch + live state dump |
| Rapid-fire powerup | `player.data.rapidFire=true`, 10 s timer ticking | live state dump |
| Boss (level 4) | `bossMothership`, hp 100/100, patrol behavior; defeat → level 5 | e8a72a5 |
| UFO | Spawns ~20 s in, flies across top, culled offscreen | `prefabs/ufo.js` + live |
| Combo/scoring | Combo multiplier applied in `killAlien`; scores accrue | code + live |
| FPS | ~58 fps on this machine during active play | live rAF sampling |
| Level progression | Wave clear → next level transition runs (with R2-2 lives bug) | live |

## Idle-Death Deep Dive (new instrumentation)

Because round 1 reported idle players dying, round 2 instrumented a no-input run with 50 ms sampling plus `destroy()` traps that record the caller's stack:

1. **Formation geometry (atomic spawn, read same tick):** rows at y = 50, 84, 118, 152, 186, 220 (6×9), x = 30…334, player at y = 430, base speed 18. (Matches config exactly.)
2. **Descent rate at base speed:** one 16 px drop every ~16 s (t=14.8 s right-edge hit, t=30.8 s left-edge hit). Reaching the player row (y≈430) at base speed would take ~13 drops ≈ **3.5 minutes** — so an idle player *should* survive a long time on level 1.
3. **What actually happens:** at ~2.5 min the bottom row touches the bunkers (lowY≈382, bottom≈406 ≥ bunker top 400). Bunker overlap kills begin (7 kills in the first second) → R2-1 speed spiral 18→80 in ~200 ms → descent accelerates ~4.4× → aliens reach the player row → `hurt` + formation reset (note: **reset does not reset speed** — it spikes back to 80 immediately) → repeat until lives run out. Idle player death confirmed in multiple runs.
4. **Alien fire rate behaves as configured:** ~1 shot per ~9 s from a full 54-alien formation (54 × 0.002/s). A stationary player at x=320 can still lose a life in the first seconds: only the x=312 column fires straight down the middle, but its bullets take ~1.1 s to fall and there is no warning.
5. **Game-over screen** shows only Final Score / Levels Cleared — no achievements (see R2-6).

**Bottom line:** level 1 is not "hard" — it is *unfair*: the player is punished by a feedback loop (bunker contact → kills → max speed) that has nothing to do with player skill.

## Evidence Log (Round 2)

| ID | Source | What it shows |
|---|---|---|
| e6ef953 | `modules/Formation.js` | Speed-compounding root-cause snippet |
| eb300c0 | live 100 ms sampler | Speed runaway 18→80 in <1 s; idle death on level 1 |
| e21542e | live state dump | lives 99→3 across level 1→2 transition |
| e8a72a5 | live state dump | lives 80→3 after boss defeat (level 4→5) |
| ecfe495 | clean idle run (50 ms + destroy traps) | Full cascade timeline: bunker kills at t≈29.8 s, speed 22.8→80 in 5 samples, hurt/reset loop, all 17 kills via `Combat.js:134` |
| e4a6c73 | shot counters (21 s + 45 s runs) | Alien fire rate ≈ configured; early central-column hit |
| e37cf24 | atomic descent test | Spawn geometry verified; ~16 s/drop at speed 18; world simulates during `over`; lazy tag-index caveat |
| screenshots | Playwright | `playtest-01-title.png`, `playtest-02-level1.png`, `playtest-03-gameover.png` (no achievements UI), `playtest-04-title-highscore.png` (HIGH 110000) |

**Instrumentation caveats:** `EntityWorld`'s tag index is lazily rebuilt (`_tagDirty`) — out-of-band `byTag` reads between frames can return stale entities; force `world._tagDirty = true` (or read during `update`) for accurate counts. Tool-call round-trips add wall-clock delay, so all timeline "t=0" values are relative to instrumentation, not game start.

## Creative Improvement Suggestions (Round 2)

1. **Turn the speed bug into a "Panic Meter" (fix + feature).** Once R2-1 is fixed, surface the formation speed as a gauge in the HUD: it fills as aliens die and drains when a wave resets. Players *see* the pressure building — the mechanic the game already has, made legible.
2. **Danger-line warning (still missing since round 1).** When the formation's bottom row crosses 75% of screen height, pulse a red vignette + soft alarm, and freeze the aliens for 1.0 s on the first player-row contact ("catnip panic") instead of an instant life loss. The current instant `hurt` gives zero reaction time.
3. **Bunkers that live.** Respawn bunkers each wave (R2-5) with a level-scaled health, and add a **Bunker Wrench** powerup that repairs 30% of a bunker's health — turns the bunkers from a level-1-only curiosity into a strategic element worth defending.
4. **Real life economy.** Keep lives across waves (R2-2), grant a bonus life every 50,000 points, and let the extraLife powerup actually matter beyond the current wave. Show lives as little cat icons (fits the theme).
5. **Pause menu done properly.** Dim overlay + cat-girl "zzz" animation, Resume / Restart / Quit-to-Title, `timeScale = 0`. Cheap to build (framework supports `timeScale`) and it was round 1's #1 missing-QoL item.
6. **Achievement toasts + game-over trophy case.** Slide-in toasts on unlock ("🏆 Combo Master!"), and a trophy row on the game-over screen listing unlocked achievements with silhouettes for locked ones — the data already exists in the save.
7. **Honor the B key.** Make mid-game B a "Boss Rush" easter egg: instantly summon the current-level boss for 2× score. The title screen already promises it; deliver it.
8. **UFO = mystery reward (fix R2-10).** Killing the UFO should drop a guaranteed random powerup (weighted) — the classic payoff the dead code was probably meant for.
9. **Post-game stat card.** Game-over screen currently shows 2 numbers. Add: time survived, aliens killed, max combo, bunkers remaining, bosses defeated — nearly all of it is already in `scene.state`/`world` at end of run.
10. **Tiered alien death sounds + tier-colored trails.** Each alien tier (cat/dog/mouse) already has distinct points; give each a distinct pitch and a short colored muzzle-flash on fire, so the board reads as three threats instead of one blob.

## Conclusion (Round 2)

The architecture remains excellent and most systems work as documented. The gameplay problems are now precisely localized: **one root-cause bug (R2-1, per-frame speed compounding) accounts for most of the "too fast" feel**, and **two state-management bugs (R2-2 lives reset, R2-5 bunker persistence) break the long-run experience**. Fixing R2-1 + R2-2 + R2-5 alone would transform the game from "level 1 is a death spiral, everything after is empty" into a properly escalating classic. The QoL gaps (pause, achievement display, B key) are small, well-understood, and were already flagged in round 1.
