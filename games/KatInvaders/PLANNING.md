# KatInvaders — Planning & Progress

## Overview
Kawaii Cat Invaders: a Space Invaders clone with cat-girl pilot, progressive
difficulty, power-ups, boss battles, combo system, particle effects, screen
shake, and viewport zoom on level complete.

**Canvas:** 480×640 | **Theme:** kawaii pastel | **Audio:** Web Audio API procedural

---

## Current State (Bug Fixes Applied)
### Fixed
- `config.js` — Fixed GAME_CONFIG initialization (was `window.CFG`, now `GF.GAME_CONFIG`) ✅
- `KatInvadersGame.js` — Fixed ES6 class syntax, uses `new` + `Object.setPrototypeOf` for proper subclassing ✅
- `KatInvadersGame.js` — **Fixed race condition**: scenes now registered immediately (not waiting for GF:ready) ✅
- `KatInvadersGame.js` — **Fixed title screen input**: binds 'confirm' to Space/Enter on GF:ready (Controls module only runs on GameScene) ✅
- `KatInvadersGame.js` — **Fixed scene transition**: uses `engine.getSystem('SceneManager').replace()` ✅
- `manifest.json` — Removed non-existent `Title` module ✅
- `modules/Waves.js` — Fixed `cfg` undefined, fixed spawnGrid to use `'alienCat'` prefab (not non-existent `'alien'`) ✅
- `modules/Boss.js` — Fixed `enter()` clearing world during normal play (now only runs setup when phase==='boss') ✅
- `KatInvadersGame.js` — Added sprite registration from `GF.spriteRegistrations` ✅
- `KatInvadersGame.js` — Fixed initial state passed in constructor (was lost on scene enter) ✅
- `modules/Combat.js` — Fixed `cfg` undefined, added `'boss'` to phases ✅
- `modules/Hud.js` — Added `'boss'` to phases array ✅
- `modules/Viewport.js` — Simplified zoom/shake logic ✅
- `behaviors/PowerupCollect.js` — Removed broken `onOverlap` callback ✅
- `modules/Particles.js` — Fixed `GF.game` reference ✅
- `index.html` — Added cache-busting version numbers ✅
- `config.js` — complete (engine, audio, colors, controls, player, aliens, ufo,
  bunkers, boss, powerups, combo, levels, particles, viewport) ✅
- `game.json` — complete metadata ✅
- `index.html` — uses manifest.json loader ✅
- `KatInvadersGame.js` — boot code with TitleScene, MainScene, GameOverScene ✅
- `manifest.json` — load order: sprites → behaviors → prefabs → modules ✅
- `sprites/player.js` — player ship, all bullets, all powerup sprites ✅
- `sprites/enemies.js` — alienCat, alienDog, alienMouse, UFO, explosion ✅
- `sprites/boss.js` — bossMothership, bossMinion ✅
- `sprites/powerups.js` — stub (sprites defined in player.js) ✅

### Behaviors (behaviors/)
- `Bob.js` ✅ — vertical wobble
- `CullOffscreen.js` ✅ — destroy offscreen entities
- `PlayerMove.js` ✅ — horizontal movement, clamped to field
- `FireOnChance.js` ✅ — aliens fire on probability roll
- `PlayerFire.js` ✅ — player shooting with powerup patterns
- `PowerupCollect.js` ✅ — tracks player powerup state
- `FormationMove.js` ✅ — alien formation movement (edge-bounce + drop)
- `BossMove.js` ✅ — boss horizontal patrol
- `BossGun.js` ✅ — boss firing patterns
- `MinionBehavior.js` ✅ — boss minion AI (dive-bomb)

### Prefabs (prefabs/)
- `player.js` ✅ — tags: player, sprite: playerShip
- `alien.js` ✅ — alienCat, alienDog, alienMouse (3 tiers)
- `shot.js` ✅ — playerBullet, megaLaser, alienShot, bossShot
- `ufo.js` ✅ — mystery cat toy
- `powerup.js` ✅ — falling pickup
- `boss.js` ✅ — mothership + minions
- `bunker.js` ✅ — destructible bunker segments

### Modules (modules/)
- `Controls.js` ✅ — input bindings (left, right, fire, pause)
- `Hud.js` ✅ — score, lives, level, combo multiplier, powerup timers
- `Waves.js` ✅ — spawn alien grid, level progression
- `Formation.js` ✅ — formation movement logic, speed scaling
- `Combat.js` ✅ — collision rules, scoring, hurt/die, smart bomb
- `Powerups.js` ✅ — drop powerups on alien kill
- `Ufo.js` ✅ — mystery UFO spawning and movement
- `Boss.js` ✅ — boss wave entry, boss fight logic
- `GameOver.js` ✅ — game over / victory screen
- `Bunkers.js` ✅ — bunker placement and destructibility
- `Particles.js` ✅ — particle effects on kills
- `Combo.js` ✅ — combo multiplier countdown
- `Viewport.js` ✅ — zoom on level complete, screen shake

---

## Scene Graph
```
TitleScreen (custom, animated stars)
  ↓ SPACE/confirm
Main (GF.GameScene, phase: 'play'/'boss'/'over')
GameOver (custom, final score display)
  ↓ SPACE/confirm → back to Main
```

---

## Key Mechanics
1. **Aliens**: 5 rows × 10 cols, move right→left then left→right, drop on edge.
   Speed increases as aliens die. Three sprite tiers (cat/dog/mouse) by row.
2. **Boss**: Appears every 5 levels. Patrols top, fires bullets, spawns minions.
   Warning phase (4s) before boss appears.
3. **Powerups**: Drop 12% on alien kill. Six types: rapidFire, doubleShot,
   shield, megaLaser, smartBomb, extraLife. Each with unique sprite and duration.
4. **Combo**: Kill within 2s window = +0.1 multiplier, max 5×.
5. **Bunkers**: 4 destructible bunkers, 8 health each, procedural arch shape.
6. **UFO**: Appears every 25s, flies across top, random bonus points (50-200).
7. **Particles**: Pink/white explosions on kill, screen shake on hit.
8. **Viewport zoom**: Zoom in 1.4× for 0.6s on level complete.

---

## File Structure
```
KatInvaders/
  config.js          ✅
  game.json          ✅
  index.html         ✅
  manifest.json      ✅
  KatInvadersGame.js ✅
  PLANNING.md        ✅
  sprites/
    player.js        ✅
    enemies.js       ✅
    boss.js          ✅
    powerups.js      ✅ (stub)
  behaviors/
    Bob.js           ✅
    CullOffscreen.js ✅
    PlayerMove.js    ✅
    FireOnChance.js  ✅
    FormationMove.js ✅
    BossMove.js      ✅
    BossGun.js       ✅
    MinionBehavior.js ✅
    PlayerFire.js    ✅
    PowerupCollect.js ✅
  prefabs/
    player.js        ✅
    alien.js         ✅
    shot.js          ✅
    ufo.js           ✅
    powerup.js       ✅
    boss.js          ✅
    bunker.js        ✅
  modules/
    Controls.js      ✅
    Hud.js           ✅
    Waves.js         ✅
    Formation.js     ✅
    Combat.js        ✅
    Powerups.js      ✅
    Ufo.js           ✅
    Boss.js          ✅
    GameOver.js      ✅
    Bunkers.js       ✅
    Particles.js     ✅
    Combo.js         ✅
    Viewport.js      ✅
```

---

## Next Steps
1. Test game in browser — game should now boot to TitleScreen ✅
2. Balance difficulty numbers in config.js
3. Add sound effects if Web Audio API works
4. Polish UI and add more visual effects

## Boot Flow
1. `config.js` → sets `GF.GAME_CONFIG` with `autoBoot: true`, `startScene: 'TitleScreen'`
2. `GameFramework.bundle.js` → loads framework + Boot.js
3. `GF.loadGame('manifest.json')` → loads all game parts
4. `KatInvadersGame.js` → **immediately** registers scenes to `window.GAME.scenes`
5. `Boot.js` → calls `GF.boot()` which finds registered scenes and pushes TitleScreen

## Critical Fix: Race Condition
**Problem**: Boot.js's `GF:ready` handler runs BEFORE KatInvadersGame.js's handler
(because GameFramework.bundle.js loads first). If scenes were registered in the
`GF:ready` callback, boot would find an empty scene registry → black screen.

**Solution**: Register scenes immediately when KatInvadersGame.js executes, not
in a `GF:ready` callback. Boot.js's handler then finds the registered scenes.

```javascript
// WRONG (race condition):
window.addEventListener('GF:ready', function () {
  window.GAME.scenes.TitleScreen = TitleScene;  // Too late!
});

// RIGHT (immediate):
window.GAME.scenes.TitleScreen = TitleScene;  // Ready before boot runs
```

## Files Modified (Bug Fixes)
- `config.js` — GAME_CONFIG fix
- `KatInvadersGame.js` — ES5 compatibility, scene registration
- `index.html` — version cache-busting
- `manifest.json` — removed Title module
- `modules/Waves.js` — cfg fix
- `modules/Combat.js` — cfg fix, boss phase
- `modules/Hud.js` — boss phase
- `modules/Viewport.js` — simplified
- `behaviors/PowerupCollect.js` — removed broken callback
- `modules/Particles.js` — GF.game fix
