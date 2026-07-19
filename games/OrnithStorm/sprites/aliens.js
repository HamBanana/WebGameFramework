// GameFramework/games/SpaceInvaders/sprites/aliens.js
// Alien sprites: squid (top), crab (middle), octopus (bottom), UFO, explosion
// All drawn as canvas vector art; origin = center-bottom of bounding box.
// Frame size: 32 × 24  |  Origin at (16, 24)

(function (GF) {
  'use strict';

  function r(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  // ── Squid (top row) ──────────────────────────────────────────────────────
  // 32×24, origin (16,24)
  function drawSquid(ctx, frame, color) {
    const c = color || '#ff44ff';
    // Body dome
    r(ctx, 10, 2, 12, 10, c);
    r(ctx,  6, 6, 20, 8,  c);
    r(ctx,  4, 10, 24, 4, c);
    // Eyes
    r(ctx,  7, 7, 4, 4, '#000');
    r(ctx, 21, 7, 4, 4, '#000');
    r(ctx,  8, 8, 2, 2, '#fff');
    r(ctx, 22, 8, 2, 2, '#fff');
    // Antennae
    r(ctx,  6, 0, 2, 4, c);
    r(ctx, 24, 0, 2, 4, c);
    r(ctx,  4, 2, 2, 2, c);
    r(ctx, 26, 2, 2, 2, c);
    // Tentacles - frame-dependent
    if (frame === 0) {
      r(ctx,  4, 14, 4, 4, c);
      r(ctx, 12, 14, 4, 6, c);
      r(ctx, 20, 14, 4, 6, c);
      r(ctx, 24, 14, 4, 4, c);
    } else {
      r(ctx,  2, 14, 4, 6, c);
      r(ctx, 10, 14, 4, 4, c);
      r(ctx, 18, 14, 4, 4, c);
      r(ctx, 26, 14, 4, 6, c);
    }
  }

  // ── Crab (middle rows) ───────────────────────────────────────────────────
  // 32×24, origin (16,24)
  function drawCrab(ctx, frame, color) {
    const c = color || '#44ffff';
    // Body
    r(ctx,  4, 6, 24, 10, c);
    r(ctx,  8, 4, 16, 14, c);
    r(ctx,  6, 8, 20, 8,  c);
    // Eyes — square bug eyes
    r(ctx,  8, 6, 4, 4, '#000');
    r(ctx, 20, 6, 4, 4, '#000');
    r(ctx,  9, 7, 2, 2, '#fff');
    r(ctx, 21, 7, 2, 2, '#fff');
    // Claws / arms - frame-dependent
    if (frame === 0) {
      r(ctx,  0, 4, 4, 4, c);
      r(ctx,  0, 8, 6, 2, c);
      r(ctx, 28, 4, 4, 4, c);
      r(ctx, 26, 8, 6, 2, c);
      r(ctx,  2, 16, 4, 4, c);
      r(ctx, 26, 16, 4, 4, c);
    } else {
      r(ctx,  0, 6, 4, 4, c);
      r(ctx,  0, 10, 6, 2, c);
      r(ctx, 28, 6, 4, 4, c);
      r(ctx, 26, 10, 6, 2, c);
      r(ctx,  0, 14, 4, 6, c);
      r(ctx, 28, 14, 4, 6, c);
    }
    // Bottom feet
    r(ctx,  6, 18, 4, 4, c);
    r(ctx, 14, 18, 4, 4, c);
    r(ctx, 22, 18, 4, 4, c);
  }

  // ── Octopus (bottom rows) ────────────────────────────────────────────────
  // 32×24, origin (16,24)
  function drawOctopus(ctx, frame, color) {
    const c = color || '#88ff44';
    // Round body
    r(ctx,  8, 2, 16, 14, c);
    r(ctx,  4, 4, 24, 10, c);
    r(ctx,  6, 2, 20, 14, c);
    // Eyes
    r(ctx,  9, 6, 5, 5, '#000');
    r(ctx, 18, 6, 5, 5, '#000');
    r(ctx, 10, 7, 3, 3, '#fff');
    r(ctx, 19, 7, 3, 3, '#fff');
    // Underbelly bumps
    r(ctx,  4, 14, 6, 2, c);
    r(ctx, 12, 14, 4, 2, c);
    r(ctx, 18, 14, 6, 2, c);
    r(ctx, 24, 14, 4, 2, c);
    // Legs — frame-dependent
    if (frame === 0) {
      r(ctx,  2, 16, 4, 6, c);
      r(ctx,  8, 16, 4, 4, c);
      r(ctx, 14, 16, 4, 6, c);
      r(ctx, 20, 16, 4, 4, c);
      r(ctx, 26, 16, 4, 6, c);
    } else {
      r(ctx,  0, 16, 4, 4, c);
      r(ctx,  6, 16, 4, 6, c);
      r(ctx, 12, 16, 4, 4, c);
      r(ctx, 18, 16, 4, 6, c);
      r(ctx, 24, 16, 4, 4, c);
      r(ctx, 30, 16, 2, 6, c);
    }
  }

  // ── UFO / Mystery ship ────────────────────────────────────────────────────
  // 40×18, origin (20,18)
  function drawUFO(ctx) {
    const c1 = '#ff2222';
    const c2 = '#ff6666';
    // Saucer body
    r(ctx, 10, 6,  20, 10, c1);
    r(ctx,  4, 8,  32, 8,  c1);
    r(ctx,  0, 10, 40, 6,  c1);
    // Dome top
    r(ctx, 14, 2, 12, 6,  c2);
    r(ctx, 12, 4, 16, 4,  c2);
    // Windows
    r(ctx,  6, 10, 4, 4, '#ffcccc');
    r(ctx, 14, 10, 4, 4, '#ffcccc');
    r(ctx, 22, 10, 4, 4, '#ffcccc');
    r(ctx, 30, 10, 4, 4, '#ffcccc');
    // Bottom ridge
    r(ctx,  4, 14, 4, 2, c2);
    r(ctx, 12, 14, 4, 2, c2);
    r(ctx, 20, 14, 4, 2, c2);
    r(ctx, 28, 14, 4, 2, c2);
  }

  // ── Explosion ─────────────────────────────────────────────────────────────
  // 32×24, origin (16,24)
  function drawExplosion(ctx, frame) {
    const colors = ['#ffff00','#ff8800','#ff4400'];
    const c = colors[frame % colors.length];
    if (frame === 0) {
      r(ctx, 12, 8,  8,  8,  c);
      r(ctx,  6, 4,  4,  4,  c);
      r(ctx, 22, 4,  4,  4,  c);
      r(ctx,  4, 12, 4,  4,  c);
      r(ctx, 24, 12, 4,  4,  c);
      r(ctx,  8, 18, 4,  4,  c);
      r(ctx, 20, 18, 4,  4,  c);
    } else if (frame === 1) {
      r(ctx,  8, 4,  16, 16, c);
      r(ctx,  4, 8,  24, 8,  c);
      r(ctx, 12, 2,  8,  4,  c);
      r(ctx, 12, 18, 8,  4,  c);
    } else {
      r(ctx,  4, 6,  8,  6,  c);
      r(ctx, 20, 6,  8,  6,  c);
      r(ctx, 10, 14, 6,  6,  c);
      r(ctx, 16, 14, 6,  6,  c);
      r(ctx,  2, 2,  4,  4,  c);
      r(ctx, 26, 2,  4,  4,  c);
    }
  }

  // ── Register sprites ──────────────────────────────────────────────────────

  window.addEventListener('GF:ready', function () {
    if (!GF.spriteRegistrations) GF.spriteRegistrations = {};

    GF.spriteRegistrations.aliens = {
      alienSquid: {
        frameWidth : 32, frameHeight: 24,
        originX: 16, originY: 24,
        animations: {
          idle: {
            fps: 3, loop: true,
            frames: [
              ctx => drawSquid(ctx, 0),
              ctx => drawSquid(ctx, 1),
            ],
          },
        },
      },

      alienCrab: {
        frameWidth : 32, frameHeight: 24,
        originX: 16, originY: 24,
        animations: {
          idle: {
            fps: 3, loop: true,
            frames: [
              ctx => drawCrab(ctx, 0),
              ctx => drawCrab(ctx, 1),
            ],
          },
        },
      },

      alienOctopus: {
        frameWidth : 32, frameHeight: 24,
        originX: 16, originY: 24,
        animations: {
          idle: {
            fps: 3, loop: true,
            frames: [
              ctx => drawOctopus(ctx, 0),
              ctx => drawOctopus(ctx, 1),
            ],
          },
        },
      },

      alienUFO: {
        frameWidth : 40, frameHeight: 18,
        originX: 20, originY: 18,
        animations: {
          idle: {
            fps: 6, loop: true,
            frames: [
              ctx => drawUFO(ctx),
              ctx => { drawUFO(ctx); ctx.fillStyle='rgba(255,200,200,0.3)'; ctx.fillRect(0,0,40,18); },
            ],
          },
        },
      },

      alienExplosion: {
        frameWidth : 32, frameHeight: 24,
        originX: 16, originY: 24,
        animations: {
          idle: {
            fps: 8, loop: false,
            frames: [
              ctx => drawExplosion(ctx, 0),
              ctx => drawExplosion(ctx, 1),
              ctx => drawExplosion(ctx, 2),
              ctx => drawExplosion(ctx, 1),
            ],
          },
        },
      },
    };
  });

})(window.GF = window.GF || {});
