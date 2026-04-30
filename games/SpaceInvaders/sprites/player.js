// GameFramework/games/SpaceInvaders/sprites/player.js
// Player ship and bullet sprites.
// Ship: 36×22, origin (18, 22)  |  Bullet: 4×12, origin (2, 12)

(function (GF) {
  'use strict';

  function r(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  // ── Player ship ──────────────────────────────────────────────────────────
  function drawShip(ctx, thruster) {
    const hull   = '#00e5ff';
    const dark   = '#005577';
    const cannon = '#88ffff';
    const glow   = 'rgba(0,229,255,0.4)';

    // Engine glow (bottom)
    if (thruster) {
      ctx.fillStyle = 'rgba(255,140,0,0.7)';
      ctx.fillRect(12, 18, 12, 4);
      ctx.fillStyle = 'rgba(255,220,0,0.5)';
      ctx.fillRect(14, 18, 8, 6);
    }

    // Main hull — flat-bottomed wedge
    r(ctx,  2, 12, 32, 8,  hull);
    r(ctx,  6, 8,  24, 6,  hull);
    r(ctx, 10, 5,  16, 5,  hull);
    r(ctx, 14, 2,  8,  5,  hull);

    // Cockpit window
    r(ctx, 15, 4, 6, 4, dark);
    r(ctx, 16, 5, 4, 2, '#aaffff');

    // Wing tips
    r(ctx,  0, 14, 6,  4, dark);
    r(ctx, 30, 14, 6,  4, dark);

    // Cannon (top center)
    r(ctx, 16, 0, 4, 4, cannon);

    // Hull highlight stripe
    r(ctx,  4, 12, 28, 2, 'rgba(255,255,255,0.2)');

    // Engine exhausts
    r(ctx, 10, 19, 4, 3, dark);
    r(ctx, 22, 19, 4, 3, dark);
  }

  // ── Player bullet ────────────────────────────────────────────────────────
  function drawPlayerBullet(ctx) {
    // Bright laser bolt
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(1, 0, 2, 12);
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(0, 2, 4, 8);
    ctx.fillStyle = 'rgba(0,229,255,0.5)';
    ctx.fillRect(0, 0, 4, 12);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(1, 2, 2, 8);
  }

  // ── Alien bullet ─────────────────────────────────────────────────────────
  function drawAlienBullet(ctx, frame) {
    const c = frame === 0 ? '#ff4444' : '#ff8888';
    ctx.fillStyle = c;
    ctx.fillRect(1, 0,  2, 4);
    ctx.fillRect(0, 4,  4, 4);
    ctx.fillRect(1, 8,  2, 4);
  }

  // ── Powerup sprites ───────────────────────────────────────────────────────
  // Each powerup is 20×20, originX:10, originY:10 (center-center)

  function drawPowerupBg(ctx, color, frame) {
    // Dark background
    ctx.fillStyle = frame === 0 ? 'rgba(0,0,20,0.85)' : 'rgba(0,10,30,0.9)';
    ctx.fillRect(1, 1, 18, 18);
    // Colored border (alternates slightly for animation)
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 20, 2);
    ctx.fillRect(0, 18, 20, 2);
    ctx.fillRect(0, 0, 2, 20);
    ctx.fillRect(18, 0, 2, 20);
  }

  function drawPULightning(ctx) {
    // Rapid Fire: orange lightning bolt
    ctx.fillStyle = '#ff5500';
    ctx.fillRect(11, 2,  5, 7);   // top segment (right-heavy)
    ctx.fillRect(5,  7,  12, 4);  // diagonal crossbar
    ctx.fillRect(4,  11, 5, 7);   // bottom segment (left-heavy)
    ctx.fillStyle = '#ff9944';    // highlight
    ctx.fillRect(12, 3, 2, 4);
    ctx.fillRect(5, 8, 4, 2);
  }

  function drawPUDouble(ctx) {
    // Double Shot: two yellow bullet shafts
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(4,  5, 4, 11);  // left shaft
    ctx.fillRect(12, 5, 4, 11);  // right shaft
    ctx.fillRect(5,  3, 2, 3);   // left tip
    ctx.fillRect(13, 3, 2, 3);   // right tip
    ctx.fillStyle = '#ffee88';   // highlight
    ctx.fillRect(5, 6, 2, 7);
    ctx.fillRect(13, 6, 2, 7);
  }

  function drawPUShield(ctx) {
    // Shield: blue arch/chevron
    ctx.fillStyle = '#4488ff';
    ctx.fillRect(6,  2,  8, 3);   // top arch
    ctx.fillRect(2,  4,  16, 4);  // upper body
    ctx.fillRect(2,  8,  4, 6);   // left side
    ctx.fillRect(14, 8,  4, 6);   // right side
    ctx.fillRect(4,  14, 12, 3);  // lower body
    ctx.fillRect(8,  17, 4, 2);   // bottom point
    ctx.fillStyle = '#88bbff';    // inner glow
    ctx.fillRect(7, 5, 6, 2);
    ctx.fillRect(3, 9, 2, 3);
    ctx.fillRect(15, 9, 2, 3);
  }

  // ── Register sprites ──────────────────────────────────────────────────────

  window.addEventListener('GF:ready', function () {
    if (!GF.spriteRegistrations) GF.spriteRegistrations = {};

    GF.spriteRegistrations.player = {
      playerShip: {
        frameWidth: 36, frameHeight: 22,
        originX: 18, originY: 22,
        animations: {
          idle: {
            fps: 8, loop: true,
            frames: [
              ctx => drawShip(ctx, false),
              ctx => drawShip(ctx, true),
            ],
          },
          dead: {
            fps: 12, loop: false,
            frames: [
              ctx => { drawShip(ctx, false); ctx.fillStyle='rgba(255,100,0,0.5)'; ctx.fillRect(0,0,36,22); },
              ctx => { drawShip(ctx, false); ctx.fillStyle='rgba(255,200,0,0.6)'; ctx.fillRect(0,0,36,22); },
              ctx => { ctx.fillStyle='rgba(255,80,0,0.4)'; ctx.fillRect(4,4,28,14); },
            ],
          },
        },
      },

      playerBullet: {
        frameWidth: 4, frameHeight: 12,
        originX: 2, originY: 12,
        animations: {
          idle: {
            fps: 12, loop: true,
            frames: [
              ctx => drawPlayerBullet(ctx),
              ctx => { ctx.globalAlpha = 0.7; drawPlayerBullet(ctx); ctx.globalAlpha = 1; },
            ],
          },
        },
      },

      alienBullet: {
        frameWidth: 4, frameHeight: 12,
        originX: 2, originY: 12,
        animations: {
          idle: {
            fps: 8, loop: true,
            frames: [
              ctx => drawAlienBullet(ctx, 0),
              ctx => drawAlienBullet(ctx, 1),
            ],
          },
        },
      },

      powerupRapidFire: {
        frameWidth: 20, frameHeight: 20,
        originX: 10, originY: 10,
        animations: {
          idle: {
            fps: 5, loop: true,
            frames: [
              ctx => { drawPowerupBg(ctx, '#ff5500', 0); drawPULightning(ctx); },
              ctx => { drawPowerupBg(ctx, '#ff7700', 1); drawPULightning(ctx); },
            ],
          },
        },
      },

      powerupDoubleShot: {
        frameWidth: 20, frameHeight: 20,
        originX: 10, originY: 10,
        animations: {
          idle: {
            fps: 5, loop: true,
            frames: [
              ctx => { drawPowerupBg(ctx, '#ffcc00', 0); drawPUDouble(ctx); },
              ctx => { drawPowerupBg(ctx, '#ffee44', 1); drawPUDouble(ctx); },
            ],
          },
        },
      },

      powerupShield: {
        frameWidth: 20, frameHeight: 20,
        originX: 10, originY: 10,
        animations: {
          idle: {
            fps: 5, loop: true,
            frames: [
              ctx => { drawPowerupBg(ctx, '#4488ff', 0); drawPUShield(ctx); },
              ctx => { drawPowerupBg(ctx, '#66aaff', 1); drawPUShield(ctx); },
            ],
          },
        },
      },
    };
  });

})(window.GF = window.GF || {});
