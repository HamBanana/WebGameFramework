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
    const pink    = '#ff99cc';
    const lightPink = '#ffccdd';
    const darkPink = '#e06090';
    const white   = '#ffffff';
    const black   = '#222233';
    const cheek   = '#ff6699';
    const eye     = '#442266';
    const pupil   = '#110022';
    const glow    = '#ff44aa';

    // Glow effect
    ctx.shadowColor = glow;
    ctx.shadowBlur = 8;

    // Thruster flame (animated)
    if (thruster) {
      var flameLen = Math.sin(ctx.canvas.width ? Date.now() / 100 : 0) * 8 + 12;
      var flameWidth = Math.cos(ctx.canvas.width ? Date.now() / 150 : 0) * 4 + 8;
      
      r(ctx, 14, 22, 8, flameLen, '#ff8800');
      r(ctx, 16, 22 + flameLen - 6, 4, 6, '#ffcc44');
      r(ctx, 17, 22 + flameLen - 8, 2, 4, '#ffffff');
    }

    // Ship body — rounded cat shape
    r(ctx,  4, 14, 32, 8, pink);      // main hull
    r(ctx,  8,  8, 24, 6, pink);      // upper hull
    r(ctx, 12,  3, 16, 5, pink);      // turret

    // Cat ears on top (animated)
    var earTwitch = Math.sin(ctx.canvas.width ? Date.now() / 200 : 0) * 3;
    r(ctx,  8 + earTwitch,  0,  6,  5, pink);     // left ear
    r(ctx, 10 + earTwitch,  -1,  4,  3, darkPink); // left inner
    r(ctx, 22 - earTwitch,  0,  6,  5, pink);     // right ear
    r(ctx, 24 - earTwitch,  -1,  4,  3, darkPink); // right inner

    // Face window (glowing)
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#aaddff';
    r(ctx, 12, 7, 12, 6, '#aaddff');  // visor
    ctx.shadowBlur = 0;
    
    r(ctx, 14, 8, 3, 3, eye);         // left eye
    r(ctx, 20, 8, 3, 3, eye);         // right eye
    r(ctx, 15, 9, 1, 1, white);       // left highlight
    r(ctx, 21, 9, 1, 1, white);       // right highlight

    // Cheek blush (animated)
    var blushOpacity = 0.3 + 0.2 * Math.sin(ctx.canvas.width ? Date.now() / 100 : 0);
    ctx.globalAlpha = blushOpacity;
    r(ctx, 11, 11, 3, 2, cheek);
    r(ctx, 23, 11, 3, 2, cheek);
    ctx.globalAlpha = 1;

    // Cannon (glowing tip)
    ctx.shadowBlur = 8;
    ctx.shadowColor = lightPink;
    r(ctx, 15, 0, 6, 6, darkPink);
    r(ctx, 17, 0, 2, 6, lightPink);
    ctx.shadowBlur = 0;

    // Wing tips
    r(ctx,  0, 16, 6, 5, darkPink);
    r(ctx, 30, 16, 6, 5, darkPink);

    // Tail fin (animated)
    var tailAnim = Math.sin(ctx.canvas.width ? Date.now() / 150 : 0) * 3;
    r(ctx,  8 + tailAnim, 18, 4, 4, darkPink);
    r(ctx, 24 + tailAnim, 18, 4, 4, darkPink);
    
    // Decorative sparkles
    var sparkleX = (Math.sin(ctx.canvas.width ? Date.now() / 100 : 0) + 1) * 16 + 8;
    var sparkleY = (Math.cos(ctx.canvas.width ? Date.now() / 130 : 0) + 1) * 10 + 8;
    r(ctx, sparkleX, sparkleY, 2, 2, lightPink);
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
    // Animated glow effect
    var glow = Math.sin(Date.now() / 200) * 4;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8 + glow;
    
    // Background
    r(ctx, 2, 2, 16, 16, frame === 0 ? 'rgba(20,0,20,0.9)' : 'rgba(30,0,30,0.95)');
    
    // Animated border
    var borderFrame = Math.floor(Date.now() / 150) % 2;
    if (borderFrame === 0) {
      r(ctx, 0, 0, 20, 2, color);
      r(ctx, 0, 18, 20, 2, color);
      r(ctx, 0, 0, 2, 20, color);
      r(ctx, 18, 0, 2, 20, color);
    } else {
      r(ctx, 1, 1, 18, 1, color);
      r(ctx, 1, 18, 18, 1, color);
      r(ctx, 1, 1, 1, 18, color);
      r(ctx, 18, 1, 1, 18, color);
    }
    
    // Inner highlight
    ctx.shadowBlur = 0;
    r(ctx, 4, 4, 4, 4, 'rgba(255,255,255,0.3)');
    r(ctx, 12, 12, 4, 4, 'rgba(255,255,255,0.2)');
    ctx.shadowBlur = 0;
  }

  function drawPULightning(ctx) {
    // Rapid Fire - Lightning bolt
    ctx.shadowColor = '#ff5500';
    ctx.shadowBlur = 6;
    
    var boltX = Math.sin(Date.now() / 100) * 2;
    
    r(ctx, 10 + boltX, 2, 4, 8, '#ff5500');
    r(ctx, 6 + boltX, 6, 8, 3, '#ff5500');
    r(ctx, 4 + boltX, 10, 6, 4, '#ff5500');
    r(ctx, 12 + boltX, 4, 2, 2, '#ffffff');
    r(ctx, 7 + boltX, 8, 2, 2, '#ffffff');
    
    ctx.shadowBlur = 0;
  }

  function drawPUDouble(ctx) {
    // Double Shot - twin lasers
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 6;
    
    var offset = Math.sin(Date.now() / 120) * 2;
    
    r(ctx, 4 + offset, 5, 4, 11, '#ffcc00');
    r(ctx, 12 - offset, 5, 4, 11, '#ffcc00');
    r(ctx, 5 + offset, 3, 2, 3, '#ffcc00');
    r(ctx, 14 - offset, 3, 2, 3, '#ffcc00');
    r(ctx, 5 + offset, 6, 2, 7, '#ffee88');
    r(ctx, 13 - offset, 6, 2, 7, '#ffee88');
    
    ctx.shadowBlur = 0;
  }

  function drawPUShield(ctx) {
    // Shield bubble
    ctx.shadowColor = '#4488ff';
    ctx.shadowBlur = 8;
    
    var pulse = Math.sin(Date.now() / 150) * 2;
    
    r(ctx, 6 - pulse, 2 - pulse, 8 + pulse * 2, 3 + pulse, '#4488ff');
    r(ctx, 2 - pulse, 4 - pulse, 16 + pulse * 2, 4 + pulse, '#4488ff');
    r(ctx, 2 - pulse, 8 - pulse, 4 + pulse, 6 + pulse, '#4488ff');
    r(ctx, 14 - pulse, 8 - pulse, 4 + pulse, 6 + pulse, '#4488ff');
    r(ctx, 4 - pulse, 14 - pulse, 12 + pulse * 2, 3 + pulse, '#4488ff');
    r(ctx, 8 - pulse, 17 - pulse, 4 + pulse, 2, '#4488ff');
    
    // Inner bubble
    ctx.shadowBlur = 0;
    r(ctx, 8, 8, 4, 4, '#88bbff');
    r(ctx, 6, 6, 8, 12, 'rgba(68, 136, 255, 0.3)');
  }

  function drawPUSmartBomb(ctx) {
    // Smart Bomb - explosion icon
    ctx.shadowColor = '#ff2266';
    ctx.shadowBlur = 8;
    
    var explosionFrame = Math.floor(Date.now() / 100) % 3;
    
    if (explosionFrame === 0) {
      r(ctx, 8, 2, 4, 16, '#ff2266');
      r(ctx, 2, 8, 16, 4, '#ff2266');
      r(ctx, 6, 6, 8, 8, '#ff2266');
    } else if (explosionFrame === 1) {
      r(ctx, 10, 2, 2, 16, '#ff2266');
      r(ctx, 4, 8, 12, 4, '#ff2266');
      r(ctx, 8, 6, 6, 8, '#ff2266');
    } else {
      r(ctx, 8, 2, 4, 16, '#ff2266');
      r(ctx, 2, 8, 16, 4, '#ff2266');
      r(ctx, 6, 6, 8, 8, '#ff2266');
    }
    
    // Center core
    ctx.shadowBlur = 0;
    r(ctx, 8, 8, 4, 4, '#ffffff');
    r(ctx, 7, 7, 6, 6, '#ffaacc');
    r(ctx, 9, 9, 2, 2, '#ffffff');
  }

  function drawPUMegaLaser(ctx) {
    // Mega Laser - wide beam icon
    ctx.shadowColor = '#aa44ff';
    ctx.shadowBlur = 8;
    
    var pulse = Math.sin(Date.now() / 130) * 3;
    
    r(ctx, 7 - pulse, 2 - pulse, 6 + pulse * 2, 16 + pulse, '#aa44ff');
    r(ctx, 6 - pulse, 4 - pulse, 8 + pulse * 2, 12 + pulse, '#cc88ff');
    r(ctx, 9 - pulse, 2 - pulse, 2, 16 + pulse, '#ffffff');
    r(ctx, 4 - pulse, 3 - pulse, 2, 2, '#ffccff');
    r(ctx, 14 - pulse, 3 - pulse, 2, 2, '#ffccff');
    r(ctx, 4 - pulse, 15 - pulse, 2, 2, '#ffccff');
    r(ctx, 14 - pulse, 15 - pulse, 2, 2, '#ffccff');
    
    ctx.shadowBlur = 0;
  }

  function drawPUExtraLife(ctx) {
    // Extra Life - Heart icon
    ctx.shadowColor = '#44ff88';
    ctx.shadowBlur = 8;
    
    var pulse = Math.sin(Date.now() / 200) * 2;
    
    // Heart shape
    r(ctx, 5, 7 + pulse, 6, 6, '#44ff88');
    r(ctx, 11 - pulse, 7 + pulse, 6, 6, '#44ff88');
    r(ctx, 6 - pulse, 10 - pulse, 8 + pulse, 7 + pulse, '#44ff88');
    
    // Heart details
    ctx.shadowBlur = 0;
    r(ctx, 8, 9, 2, 2, '#aaffcc');
    r(ctx, 9, 11, 2, 1, '#aaffcc');
    
    // Sparkles
    var sparkleX = (Math.sin(Date.now() / 100) + 1) * 8 + 6;
    var sparkleY = (Math.cos(Date.now() / 150) + 1) * 8 + 8;
    r(ctx, sparkleX, sparkleY, 2, 2, '#ffffff');
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
