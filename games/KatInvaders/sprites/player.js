// GameFramework/games/KatInvaders/sprites/player.js
// Kawaii cat-girl pilot ship and bullets.
// Ship: 36×22, origin (18, 22) | Bullet: 4×12, origin (2, 12)

(function (GF) {
  'use strict';

  function r(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  // ── Player ship — cute cat-girl spaceship ────────────────────────────────
  function drawShip(ctx, thruster) {
    const pink    = '#ff8ec4';
    const darkPink = '#e06090';
    const white   = '#ffffff';
    const black   = '#222233';
    const cheek   = '#ff6699';
    const eye     = '#442266';
    const pupil   = '#110022';

    // Thruster flame
    if (thruster) {
      r(ctx, 12, 20, 12, 4, '#ffaa00');
      r(ctx, 14, 20, 8,  5, '#ffdd44');
      r(ctx, 15, 20, 6,  3, '#ffffff');
    }

    // Ship body — rounded cat shape
    r(ctx,  2, 12, 32, 8, pink);      // main hull
    r(ctx,  6,  8, 24, 6, pink);      // upper hull
    r(ctx, 10,  5, 16, 5, pink);      // turret

    // Cat ears on top
    r(ctx,  8,  1,  6,  5, pink);     // left ear
    r(ctx, 10,  0,  4,  3, darkPink); // left inner
    r(ctx, 22,  1,  6,  5, pink);     // right ear
    r(ctx, 24,  0,  4,  3, darkPink); // right inner

    // Face window
    r(ctx, 12, 7, 12, 6, '#aaddff');  // visor
    r(ctx, 14, 8, 3, 3, eye);         // left eye
    r(ctx, 20, 8, 3, 3, eye);         // right eye
    r(ctx, 15, 9, 1, 1, white);       // left highlight
    r(ctx, 21, 9, 1, 1, white);       // right highlight

    // Cheek blush
    r(ctx, 11, 11, 3, 2, cheek);
    r(ctx, 23, 11, 3, 2, cheek);

    // Cannon
    r(ctx, 15, 0, 6, 6, darkPink);
    r(ctx, 17, 0, 2, 6, white);

    // Wing tips
    r(ctx,  0, 14, 6, 5, darkPink);
    r(ctx, 30, 14, 6, 5, darkPink);

    // Tail fin
    r(ctx,  8, 18, 4, 4, darkPink);
    r(ctx, 24, 18, 4, 4, darkPink);
  }

  // ── Player bullet — cute star spark ──────────────────────────────────────
  function drawPlayerBullet(ctx) {
    r(ctx, 1, 0, 2, 12, '#ffffff');
    r(ctx, 0, 2, 4, 8, '#ffccff');
    r(ctx, 0, 0, 4, 12, 'rgba(255,200,255,0.5)');
    r(ctx, 1, 3, 2, 6, '#ffffff');
  }

  // ── Mega laser bullet ────────────────────────────────────────────────────
  // 8×16, origin (4, 16)
  function drawMegaLaserBullet(ctx, frame) {
    r(ctx, 0, 0, 8, 16, frame === 0 ? 'rgba(170,68,255,0.45)' : 'rgba(220,120,255,0.45)');
    r(ctx, 1, 0, 6, 16, frame === 0 ? '#aa44ff' : '#cc77ff');
    r(ctx, 3, 0, 2, 16, '#ffffff');
    if (frame === 1) {
      r(ctx, 2, 4, 4, 2, '#ffeeff');
      r(ctx, 2, 10, 4, 2, '#ffeeff');
    }
  }

  // ── Alien bullet — heart-shaped missive ──────────────────────────────────
  function drawAlienBullet(ctx, frame) {
    const c = frame === 0 ? '#ff4488' : '#ff88aa';
    r(ctx, 1, 0, 2, 4, c);
    r(ctx, 0, 4, 4, 4, c);
    r(ctx, 1, 8, 2, 4, c);
  }

  // ── Boss bullet ──────────────────────────────────────────────────────────
  // 8×12, origin (4, 12)
  function drawBossBullet(ctx, frame) {
    const c1 = frame === 0 ? '#ff4422' : '#ffaa44';
    const c2 = frame === 0 ? '#ffcc66' : '#ffeeaa';
    r(ctx, 1, 0, 6, 12, c1);
    r(ctx, 2, 1, 4, 10, c2);
    r(ctx, 3, 2, 2, 8, '#ffffff');
  }

  // ── Powerup sprites ──────────────────────────────────────────────────────
  // Each 20×20, origin (10, 10)

  function drawPowerupBg(ctx, color, frame) {
    r(ctx, 1, 1, 18, 18, frame === 0 ? 'rgba(20,0,20,0.85)' : 'rgba(30,0,30,0.9)');
    r(ctx, 0, 0, 20, 2, color);
    r(ctx, 0, 18, 20, 2, color);
    r(ctx, 0, 0, 2, 20, color);
    r(ctx, 18, 0, 2, 20, color);
  }

  function drawPULightning(ctx) {
    r(ctx, 11, 2, 5, 7, '#ff5500');
    r(ctx, 5, 7, 12, 4, '#ff5500');
    r(ctx, 4, 11, 5, 7, '#ff5500');
    r(ctx, 12, 3, 2, 4, '#ff9944');
    r(ctx, 5, 8, 4, 2, '#ff9944');
  }

  function drawPUDouble(ctx) {
    r(ctx, 4, 5, 4, 11, '#ffcc00');
    r(ctx, 12, 5, 4, 11, '#ffcc00');
    r(ctx, 5, 3, 2, 3, '#ffcc00');
    r(ctx, 13, 3, 2, 3, '#ffcc00');
    r(ctx, 5, 6, 2, 7, '#ffee88');
    r(ctx, 13, 6, 2, 7, '#ffee88');
  }

  function drawPUShield(ctx) {
    r(ctx, 6, 2, 8, 3, '#4488ff');
    r(ctx, 2, 4, 16, 4, '#4488ff');
    r(ctx, 2, 8, 4, 6, '#4488ff');
    r(ctx, 14, 8, 4, 6, '#4488ff');
    r(ctx, 4, 14, 12, 3, '#4488ff');
    r(ctx, 8, 17, 4, 2, '#4488ff');
    r(ctx, 7, 5, 6, 2, '#88bbff');
    r(ctx, 3, 9, 2, 3, '#88bbff');
    r(ctx, 15, 9, 2, 3, '#88bbff');
  }

  function drawPUSmartBomb(ctx) {
    r(ctx, 9, 2, 2, 16, '#ff2266');
    r(ctx, 2, 9, 16, 2, '#ff2266');
    r(ctx, 4, 4, 3, 3, '#ff2266');
    r(ctx, 13, 4, 3, 3, '#ff2266');
    r(ctx, 4, 13, 3, 3, '#ff2266');
    r(ctx, 13, 13, 3, 3, '#ff2266');
    r(ctx, 8, 8, 4, 4, '#ffffff');
    r(ctx, 7, 7, 6, 6, '#ffaacc');
    r(ctx, 9, 9, 2, 2, '#ffffff');
  }

  function drawPUMegaLaser(ctx) {
    r(ctx, 8, 2, 4, 16, '#aa44ff');
    r(ctx, 7, 4, 6, 12, '#cc88ff');
    r(ctx, 9, 2, 2, 16, '#ffffff');
    r(ctx, 5, 3, 2, 2, '#ffccff');
    r(ctx, 13, 3, 2, 2, '#ffccff');
    r(ctx, 5, 15, 2, 2, '#ffccff');
    r(ctx, 13, 15, 2, 2, '#ffccff');
  }

  function drawPUExtraLife(ctx) {
    r(ctx, 4, 5, 4, 3, '#44ff88');
    r(ctx, 12, 5, 4, 3, '#44ff88');
    r(ctx, 3, 7, 14, 4, '#44ff88');
    r(ctx, 5, 11, 10, 3, '#44ff88');
    r(ctx, 7, 14, 6, 2, '#44ff88');
    r(ctx, 9, 16, 2, 1, '#44ff88');
    r(ctx, 5, 6, 2, 2, '#aaffcc');
    r(ctx, 13, 6, 2, 2, '#aaffcc');
    r(ctx, 9, 9, 2, 5, '#003322');
    r(ctx, 8, 9, 2, 1, '#003322');
  }

  // ── Register sprites synchronously so they're ready before GF:ready fires ──

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
        idle: { fps: 12, loop: true, frames: [
          ctx => drawPlayerBullet(ctx),
          ctx => { ctx.globalAlpha = 0.7; drawPlayerBullet(ctx); ctx.globalAlpha = 1; },
        ]},
      },
    },

    megaLaserBullet: {
      frameWidth: 8, frameHeight: 16,
      originX: 4, originY: 16,
      animations: {
        idle: { fps: 14, loop: true, frames: [
          ctx => drawMegaLaserBullet(ctx, 0),
          ctx => drawMegaLaserBullet(ctx, 1),
        ]},
      },
    },

    alienBullet: {
      frameWidth: 4, frameHeight: 12,
      originX: 2, originY: 12,
      animations: {
        idle: { fps: 8, loop: true, frames: [
          ctx => drawAlienBullet(ctx, 0),
          ctx => drawAlienBullet(ctx, 1),
        ]},
      },
    },

    bossBullet: {
      frameWidth: 8, frameHeight: 12,
      originX: 4, originY: 12,
      animations: {
        idle: { fps: 10, loop: true, frames: [
          ctx => drawBossBullet(ctx, 0),
          ctx => drawBossBullet(ctx, 1),
        ]},
      },
    },

    powerupRapidFire: {
      frameWidth: 20, frameHeight: 20,
      originX: 10, originY: 10,
      animations: {
        idle: { fps: 5, loop: true, frames: [
          ctx => { drawPowerupBg(ctx, '#ff5500', 0); drawPULightning(ctx); },
          ctx => { drawPowerupBg(ctx, '#ff7700', 1); drawPULightning(ctx); },
        ]},
      },
    },

    powerupDoubleShot: {
      frameWidth: 20, frameHeight: 20,
      originX: 10, originY: 10,
      animations: {
        idle: { fps: 5, loop: true, frames: [
          ctx => { drawPowerupBg(ctx, '#ffcc00', 0); drawPUDouble(ctx); },
          ctx => { drawPowerupBg(ctx, '#ffee44', 1); drawPUDouble(ctx); },
        ]},
      },
    },

    powerupShield: {
      frameWidth: 20, frameHeight: 20,
      originX: 10, originY: 10,
      animations: {
        idle: { fps: 5, loop: true, frames: [
          ctx => { drawPowerupBg(ctx, '#4488ff', 0); drawPUShield(ctx); },
          ctx => { drawPowerupBg(ctx, '#66aaff', 1); drawPUShield(ctx); },
        ]},
      },
    },

    powerupSmartBomb: {
      frameWidth: 20, frameHeight: 20,
      originX: 10, originY: 10,
      animations: {
        idle: { fps: 6, loop: true, frames: [
          ctx => { drawPowerupBg(ctx, '#ff2266', 0); drawPUSmartBomb(ctx); },
          ctx => { drawPowerupBg(ctx, '#ff5588', 1); drawPUSmartBomb(ctx); },
        ]},
      },
    },

    powerupMegaLaser: {
      frameWidth: 20, frameHeight: 20,
      originX: 10, originY: 10,
      animations: {
        idle: { fps: 6, loop: true, frames: [
          ctx => { drawPowerupBg(ctx, '#aa44ff', 0); drawPUMegaLaser(ctx); },
          ctx => { drawPowerupBg(ctx, '#cc77ff', 1); drawPUMegaLaser(ctx); },
        ]},
      },
    },

    powerupExtraLife: {
      frameWidth: 20, frameHeight: 20,
      originX: 10, originY: 10,
      animations: {
        idle: { fps: 6, loop: true, frames: [
          ctx => { drawPowerupBg(ctx, '#44ff88', 0); drawPUExtraLife(ctx); },
          ctx => { drawPowerupBg(ctx, '#77ffaa', 1); drawPUExtraLife(ctx); },
        ]},
      },
    },
  };

})(window.GF = window.GF || {});
