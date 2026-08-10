// GameFramework/games/KatInvaders-Next/sprites/boss.js
// Boss: giant evil cat lady mothership + her shield drones.
// Mothership: 96×56, origin (48, 56) | Drone: 28×25, origin (14, 25)

(function (GF) {
  'use strict';

  function r(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  // ── Boss Mothership — evil over-cat-lady ship ────────────────────────────
  function drawBoss(ctx, frame) {
    const hull       = '#aa1144';
    const hullDark   = '#660022';
    const hullLight  = '#ff4488';
    const eye        = frame === 0 ? '#ffff00' : '#ff8800';
    const engineGlow = frame === 0 ? '#ff66ff' : '#aa44ff';
    const window     = '#ffaadd';

    // Outer shadow
    r(ctx, 4, 18, 88, 28, hullDark);
    r(ctx, 0, 22, 96, 20, hullDark);

    // Main hull
    r(ctx, 8, 16, 80, 28, hull);
    r(ctx, 4, 20, 88, 22, hull);
    r(ctx, 16, 12, 64, 28, hull);

    // Top dome
    r(ctx, 28, 6, 40, 12, hull);
    r(ctx, 32, 2, 32, 10, hullLight);
    r(ctx, 36, 0, 24, 6, hullLight);

    // Center menacing eye/core
    r(ctx, 40, 18, 16, 12, '#330011');
    r(ctx, 42, 20, 12, 8, eye);
    r(ctx, 46, 22, 4, 4, '#ffffff');

    // Side cannons
    r(ctx, 4, 26, 12, 10, hullDark);
    r(ctx, 0, 30, 8, 6, '#220000');
    r(ctx, 80, 26, 12, 10, hullDark);
    r(ctx, 88, 30, 8, 6, '#220000');

    // Window strip
    r(ctx, 20, 28, 8, 4, window);
    r(ctx, 30, 28, 6, 4, window);
    r(ctx, 60, 28, 6, 4, window);
    r(ctx, 68, 28, 8, 4, window);

    // Lower armor
    r(ctx, 12, 40, 72, 4, hullDark);
    r(ctx, 20, 44, 56, 4, hullDark);

    // Engine vents
    r(ctx, 24, 48, 12, 6, engineGlow);
    r(ctx, 60, 48, 12, 6, engineGlow);
    r(ctx, 28, 50, 4, 4, '#ffffff');
    r(ctx, 64, 50, 4, 4, '#ffffff');

    // Underside spikes
    r(ctx, 44, 44, 8, 8, hullLight);
    r(ctx, 46, 50, 4, 4, '#ffffff');

    // Highlight stripe
    r(ctx, 12, 14, 72, 2, 'rgba(255,255,255,0.3)');
  }

  function drawBossDamageFlash(ctx, frame) {
    drawBoss(ctx, frame);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 96, 56);
    ctx.globalAlpha = 1;
  }

  // ── Star Destroyer Boss (Boss 2) ─────────────────────────────────────────
  function drawStarDestroyer(ctx, frame) {
    const hull       = '#333344';
    const hullDark   = '#111122';
    const hullLight  = '#666688';
    const eye        = frame === 0 ? '#ff4444' : '#ff0000';
    const engineGlow = frame === 0 ? '#0088ff' : '#0066cc';
    const window     = '#88ccff';

    // Main body - elongated shape
    r(ctx, 20, 20, 60, 36, hull);
    r(ctx, 16, 22, 68, 32, hullDark);

    // Top wing
    r(ctx, 12, 10, 76, 14, hull);
    r(ctx, 14, 8, 72, 6, hullLight);

    // Bottom wing
    r(ctx, 12, 56, 76, 14, hull);
    r(ctx, 14, 62, 72, 8, hullLight);

    // Center engine
    r(ctx, 40, 30, 16, 20, '#110011');
    r(ctx, 42, 32, 12, 16, eye);
    r(ctx, 44, 34, 4, 4, '#ffffff');

    // Side engines
    r(ctx, 8, 40, 12, 12, engineGlow);
    r(ctx, 84, 40, 12, 12, engineGlow);
    r(ctx, 10, 42, 8, 8, '#ffffff');
    r(ctx, 86, 42, 8, 8, '#ffffff');

    // Window strip
    r(ctx, 30, 48, 8, 4, window);
    r(ctx, 40, 48, 6, 4, window);
    r(ctx, 50, 48, 8, 4, window);

    // Engine vents
    r(ctx, 24, 28, 8, 4, engineGlow);
    r(ctx, 64, 28, 8, 4, engineGlow);
    r(ctx, 26, 26, 4, 2, '#ffffff');
    r(ctx, 66, 26, 4, 2, '#ffffff');
  }

  // ── Crimson Reaper Boss (Boss 3) ─────────────────────────────────────────
  function drawCrimsonReaper(ctx, frame) {
    const hull       = '#440011';
    const hullDark   = '#220000';
    const hullLight  = '#ff4444';
    const eye        = frame === 0 ? '#ff00ff' : '#ff66ff';
    const engineGlow = frame === 0 ? '#ff8800' : '#ff6600';
    const window     = '#ffcccc';

    // Main body - angular shape
    r(ctx, 20, 15, 56, 35, hull);
    r(ctx, 16, 12, 64, 40, hullDark);

    // Top spikes
    r(ctx, 24, 0, 8, 12, hullLight);
    r(ctx, 48, 0, 8, 12, hullLight);

    // Bottom spikes
    r(ctx, 28, 50, 6, 8, hullLight);
    r(ctx, 56, 50, 6, 8, hullLight);

    // Center eye
    r(ctx, 40, 25, 16, 12, '#220022');
    r(ctx, 42, 27, 12, 8, eye);
    r(ctx, 44, 29, 4, 4, '#ffffff');

    // Side wings - flapping animation
    if (frame === 0) {
      r(ctx, 4, 20, 12, 16, hull);
      r(ctx, 80, 20, 12, 16, hull);
    } else {
      r(ctx, 2, 15, 16, 24, hull);
      r(ctx, 76, 15, 16, 24, hull);
    }

    // Engine vents
    r(ctx, 24, 40, 8, 10, engineGlow);
    r(ctx, 64, 40, 8, 10, engineGlow);
    r(ctx, 26, 42, 4, 6, '#ffffff');
    r(ctx, 66, 42, 4, 6, '#ffffff');

    // Window
    r(ctx, 38, 35, 10, 4, window);
  }

  // ── Void Hydra Boss (Boss 4) ─────────────────────────────────────────────
  function drawVoidHydra(ctx, frame) {
    const hull       = '#110033';
    const hullDark   = '#000022';
    const hullLight  = '#aa66ff';
    const eye        = frame === 0 ? '#00ffff' : '#00ccff';
    const engineGlow = frame === 0 ? '#ff00ff' : '#cc00cc';
    const window     = '#ccffff';

    // Main body - circular with multiple heads
    r(ctx, 30, 20, 40, 30, hull);
    r(ctx, 26, 18, 48, 34, hullDark);

    // Three heads (left, center, right)
    r(ctx, 18, 15, 10, 12, hullLight);
    r(ctx, 38, 15, 10, 12, hullLight);
    r(ctx, 58, 15, 10, 12, hullLight);

    // Eyes
    r(ctx, 20, 17, 6, 8, eye);
    r(ctx, 40, 17, 6, 8, eye);
    r(ctx, 60, 17, 6, 8, eye);
    r(ctx, 22, 19, 2, 2, '#ffffff');
    r(ctx, 42, 19, 2, 2, '#ffffff');
    r(ctx, 62, 19, 2, 2, '#ffffff');

    // Center core
    r(ctx, 36, 35, 8, 15, '#220033');
    r(ctx, 38, 37, 4, 11, engineGlow);
    r(ctx, 38, 37, 2, 5, '#ffffff');

    // Side tentacles
    if (frame === 0) {
      r(ctx, 8, 40, 8, 12, hull);
      r(ctx, 80, 40, 8, 12, hull);
    } else {
      r(ctx, 6, 35, 12, 18, hull);
      r(ctx, 76, 35, 12, 18, hull);
    }

    // Engine vents
    r(ctx, 28, 52, 8, 4, engineGlow);
    r(ctx, 60, 52, 8, 4, engineGlow);
  }

  // ── Galaxy Devourer Boss (Boss 5) ────────────────────────────────────────
  function drawGalaxyDevourer(ctx, frame) {
    const hull       = '#000011';
    const hullDark   = '#000000';
    const hullLight  = '#ff6600';
    const eye        = frame === 0 ? '#00ff00' : '#00cc00';
    const engineGlow = frame === 0 ? '#ffff00' : '#ffcc00';
    const window     = '#ffffff';

    // Main body - complex shape
    r(ctx, 25, 20, 55, 35, hull);
    r(ctx, 20, 15, 65, 40, hullDark);

    // Top spikes
    r(ctx, 20, 0, 10, 15, hullLight);
    r(ctx, 40, 0, 10, 15, hullLight);
    r(ctx, 60, 0, 10, 15, hullLight);

    // Four eyes (one for each direction)
    r(ctx, 30, 25, 8, 8, eye);
    r(ctx, 52, 25, 8, 8, eye);
    r(ctx, 30, 45, 8, 8, eye);
    r(ctx, 52, 45, 8, 8, eye);
    
    // Eye highlights
    r(ctx, 32, 27, 2, 2, '#ffffff');
    r(ctx, 54, 27, 2, 2, '#ffffff');
    r(ctx, 32, 47, 2, 2, '#ffffff');
    r(ctx, 54, 47, 2, 2, '#ffffff');

    // Center black hole
    r(ctx, 38, 32, 10, 10, '#000000');
    r(ctx, 40, 34, 6, 6, engineGlow);
    r(ctx, 42, 36, 2, 2, '#ffffff');

    // Side arms
    if (frame === 0) {
      r(ctx, 8, 30, 10, 16, hull);
      r(ctx, 80, 30, 10, 16, hull);
    } else {
      r(ctx, 4, 28, 16, 20, hull);
      r(ctx, 76, 28, 16, 20, hull);
    }

    // Engine vents
    r(ctx, 30, 55, 6, 5, engineGlow);
    r(ctx, 54, 55, 6, 5, engineGlow);
    r(ctx, 32, 57, 2, 3, '#ffffff');
    r(ctx, 56, 57, 2, 3, '#ffffff');
  }

  function drawBossDamageFlash(ctx, frame) {
    drawBoss(ctx, frame);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 96, 56);
    ctx.globalAlpha = 1;
  }

  // ── Boss Minion (fast shield drone) ──────────────────────────────────────
  // 24×18, origin (12, 18)
  function drawMinion(ctx, frame) {
    const c1 = '#ff66cc';
    const c2 = '#aa2288';
    r(ctx, 4, 4, 16, 8, c1);
    r(ctx, 2, 6, 20, 6, c1);
    r(ctx, 6, 2, 12, 4, c1);
    // Eye
    r(ctx, 9, 6, 6, 4, '#220000');
    r(ctx, 10, 7, 4, 2, '#ffff44');
    // Wings — frame-dependent
    if (frame === 0) {
      r(ctx, 0, 8, 4, 4, c2);
      r(ctx, 20, 8, 4, 4, c2);
    } else {
      r(ctx, 0, 6, 4, 6, c2);
      r(ctx, 20, 6, 4, 6, c2);
    }
    // Tail
    r(ctx, 8, 12, 8, 4, c2);
    r(ctx, 10, 16, 4, 2, c1);
  }

  // ── Register sprites synchronously so they're ready before GF:ready fires ──

  if (!GF.spriteRegistrations) GF.spriteRegistrations = {};

  GF.spriteRegistrations.boss = {
    bossMothership: {
      frameWidth: 96, frameHeight: 56,
      originX: 48, originY: 56,
      animations: {
        idle: {
          fps: 4, loop: true,
          frames: [
            ctx => drawBoss(ctx, 0),
            ctx => drawBoss(ctx, 1),
          ],
        },
        hit: {
          fps: 18, loop: false,
          frames: [
            ctx => drawBossDamageFlash(ctx, 0),
            ctx => drawBossDamageFlash(ctx, 1),
            ctx => drawBoss(ctx, 0),
          ],
        },
      },
    },

    bossStarDestroyer: {
      frameWidth: 100, frameHeight: 70,
      originX: 50, originY: 70,
      animations: {
        idle: {
          fps: 4, loop: true,
          frames: [
            ctx => drawStarDestroyer(ctx, 0),
            ctx => drawStarDestroyer(ctx, 1),
          ],
        },
        hit: {
          fps: 18, loop: false,
          frames: [
            ctx => { drawStarDestroyer(ctx, 0); ctx.globalAlpha=0.5; ctx.fillStyle='#fff'; ctx.fillRect(0,0,100,70); ctx.globalAlpha=1; },
            ctx => { drawStarDestroyer(ctx, 1); ctx.globalAlpha=0.5; ctx.fillStyle='#fff'; ctx.fillRect(0,0,100,70); ctx.globalAlpha=1; },
            ctx => drawStarDestroyer(ctx, 0),
          ],
        },
      },
    },

    bossCrimsonReaper: {
      frameWidth: 90, frameHeight: 60,
      originX: 45, originY: 60,
      animations: {
        idle: {
          fps: 4, loop: true,
          frames: [
            ctx => drawCrimsonReaper(ctx, 0),
            ctx => drawCrimsonReaper(ctx, 1),
          ],
        },
        hit: {
          fps: 18, loop: false,
          frames: [
            ctx => { drawCrimsonReaper(ctx, 0); ctx.globalAlpha=0.5; ctx.fillStyle='#fff'; ctx.fillRect(0,0,90,60); ctx.globalAlpha=1; },
            ctx => { drawCrimsonReaper(ctx, 1); ctx.globalAlpha=0.5; ctx.fillStyle='#fff'; ctx.fillRect(0,0,90,60); ctx.globalAlpha=1; },
            ctx => drawCrimsonReaper(ctx, 0),
          ],
        },
      },
    },

    bossVoidHydra: {
      frameWidth: 95, frameHeight: 65,
      originX: 47.5, originY: 65,
      animations: {
        idle: {
          fps: 4, loop: true,
          frames: [
            ctx => drawVoidHydra(ctx, 0),
            ctx => drawVoidHydra(ctx, 1),
          ],
        },
        hit: {
          fps: 18, loop: false,
          frames: [
            ctx => { drawVoidHydra(ctx, 0); ctx.globalAlpha=0.5; ctx.fillStyle='#fff'; ctx.fillRect(0,0,95,65); ctx.globalAlpha=1; },
            ctx => { drawVoidHydra(ctx, 1); ctx.globalAlpha=0.5; ctx.fillStyle='#fff'; ctx.fillRect(0,0,95,65); ctx.globalAlpha=1; },
            ctx => drawVoidHydra(ctx, 0),
          ],
        },
      },
    },

    bossGalaxyDevourer: {
      frameWidth: 110, frameHeight: 75,
      originX: 55, originY: 75,
      animations: {
        idle: {
          fps: 4, loop: true,
          frames: [
            ctx => drawGalaxyDevourer(ctx, 0),
            ctx => drawGalaxyDevourer(ctx, 1),
          ],
        },
        hit: {
          fps: 18, loop: false,
          frames: [
            ctx => { drawGalaxyDevourer(ctx, 0); ctx.globalAlpha=0.5; ctx.fillStyle='#fff'; ctx.fillRect(0,0,110,75); ctx.globalAlpha=1; },
            ctx => { drawGalaxyDevourer(ctx, 1); ctx.globalAlpha=0.5; ctx.fillStyle='#fff'; ctx.fillRect(0,0,110,75); ctx.globalAlpha=1; },
            ctx => drawGalaxyDevourer(ctx, 0),
          ],
        },
      },
    },

    bossMinion: {
      frameWidth: 24, frameHeight: 18,
      originX: 12, originY: 18,
      animations: {
        idle: {
          fps: 8, loop: true,
          frames: [
            ctx => drawMinion(ctx, 0),
            ctx => drawMinion(ctx, 1),
          ],
        },
      },
    },
  };

})(window.GF = window.GF || {});
