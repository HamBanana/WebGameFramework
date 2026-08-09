// GameFramework/games/KatInvaders/sprites/boss.js
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
