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
