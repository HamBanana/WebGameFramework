// GameFramework/games/KatInvaders/sprites/enemies.js
// Kawaii alien invaders: cat girls (top), dog boys (middle), mouse friends (bottom),
// plus UFO and explosion.
// All 32×24, origin (16, 24)

(function (GF) {
  'use strict';

  function r(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  // ── Cat Girl (top row) ───────────────────────────────────────────────────
  function drawCatGirl(ctx, frame, color) {
    const c = color || '#ff99cc';
    // Head
    r(ctx, 8, 2, 16, 12, c);
    r(ctx, 4, 6, 24, 8, c);
    // Ears
    r(ctx, 6, 0, 6, 5, c);
    r(ctx, 20, 0, 6, 5, c);
    r(ctx, 8, 1, 3, 3, '#ffccdd');
    r(ctx, 21, 1, 3, 3, '#ffccdd');
    // Eyes
    r(ctx, 9, 8, 4, 4, '#220033');
    r(ctx, 19, 8, 4, 4, '#220033');
    r(ctx, 10, 9, 2, 2, '#ffffff');
    r(ctx, 20, 9, 2, 2, '#ffffff');
    // Whiskers
    r(ctx, 4, 12, 5, 1, c);
    r(ctx, 23, 12, 5, 1, c);
    // Body
    r(ctx, 10, 14, 12, 6, c);
    // Tail — frame-dependent
    if (frame === 0) {
      r(ctx, 4, 16, 6, 4, c);
      r(ctx, 2, 14, 4, 4, c);
    } else {
      r(ctx, 4, 18, 6, 4, c);
      r(ctx, 2, 20, 4, 4, c);
    }
    // Paws
    r(ctx, 10, 20, 4, 4, c);
    r(ctx, 18, 20, 4, 4, c);
  }

  // ── Dog Boy (middle rows) ────────────────────────────────────────────────
  function drawDogBoy(ctx, frame, color) {
    const c = color || '#99ccff';
    // Head (square-ish)
    r(ctx, 6, 4, 20, 14, c);
    r(ctx, 4, 6, 24, 10, c);
    // Floppy ears — frame-dependent
    if (frame === 0) {
      r(ctx, 2, 4, 6, 10, c);
      r(ctx, 24, 4, 6, 10, c);
      r(ctx, 3, 6, 4, 6, '#88aadd');
      r(ctx, 25, 6, 4, 6, '#88aadd');
    } else {
      r(ctx, 0, 6, 6, 8, c);
      r(ctx, 26, 6, 6, 8, c);
      r(ctx, 1, 8, 4, 5, '#88aadd');
      r(ctx, 27, 8, 4, 5, '#88aadd');
    }
    // Eyes
    r(ctx, 10, 8, 4, 4, '#220033');
    r(ctx, 18, 8, 4, 4, '#220033');
    r(ctx, 11, 9, 2, 2, '#ffffff');
    r(ctx, 19, 9, 2, 2, '#ffffff');
    // Nose
    r(ctx, 14, 14, 4, 3, '#332244');
    // Mouth
    r(ctx, 12, 17, 8, 2, '#332244');
    // Body
    r(ctx, 8, 18, 16, 4, c);
    // Feet
    r(ctx, 8, 22, 5, 2, c);
    r(ctx, 19, 22, 5, 2, c);
  }

  // ── Mouse Friend (bottom rows) ───────────────────────────────────────────
  function drawMouseFriend(ctx, frame, color) {
    const c = color || '#aaffcc';
    // Round head
    r(ctx, 8, 2, 16, 14, c);
    r(ctx, 4, 6, 24, 10, c);
    // Round ears
    r(ctx, 4, 2, 8, 6, c);
    r(ctx, 20, 2, 8, 6, c);
    r(ctx, 5, 3, 5, 4, '#ccffdd');
    r(ctx, 21, 3, 5, 4, '#ccffdd');
    // Eyes
    r(ctx, 9, 8, 5, 5, '#220033');
    r(ctx, 18, 8, 5, 5, '#220033');
    r(ctx, 10, 9, 3, 3, '#ffffff');
    r(ctx, 19, 9, 3, 3, '#ffffff');
    // Nose
    r(ctx, 14, 14, 4, 3, '#ff88aa');
    // Body
    r(ctx, 10, 16, 12, 6, c);
    // Tail — frame-dependent
    if (frame === 0) {
      r(ctx, 4, 18, 6, 2, c);
      r(ctx, 2, 16, 4, 2, c);
    } else {
      r(ctx, 4, 20, 6, 2, c);
      r(ctx, 2, 22, 4, 2, c);
    }
    // Feet
    r(ctx, 10, 22, 4, 2, c);
    r(ctx, 18, 22, 4, 2, c);
  }

  // ── UFO / Mystery cat toy ────────────────────────────────────────────────
  // 40×18, origin (20, 18)
  function drawUFO(ctx) {
    const c1 = '#ff6699';
    const c2 = '#ff99bb';
    // Saucer
    r(ctx, 10, 6, 20, 10, c1);
    r(ctx, 4, 8, 32, 8, c1);
    r(ctx, 0, 10, 40, 6, c1);
    // Dome
    r(ctx, 14, 2, 12, 6, c2);
    r(ctx, 12, 4, 16, 4, c2);
    // Windows
    r(ctx, 6, 10, 4, 4, '#ffddff');
    r(ctx, 14, 10, 4, 4, '#ffddff');
    r(ctx, 22, 10, 4, 4, '#ffddff');
    r(ctx, 30, 10, 4, 4, '#ffddff');
    // Lights
    r(ctx, 4, 14, 4, 2, '#ffccdd');
    r(ctx, 12, 14, 4, 2, '#ffccdd');
    r(ctx, 20, 14, 4, 2, '#ffccdd');
    r(ctx, 28, 14, 4, 2, '#ffccdd');
  }

  // ── Explosion ────────────────────────────────────────────────────────────
  // 32×24, origin (16, 24)
  function drawExplosion(ctx, frame) {
    const colors = ['#ffff88', '#ff8844', '#ff4466'];
    const c = colors[frame % colors.length];
    if (frame === 0) {
      r(ctx, 12, 8, 8, 8, c);
      r(ctx, 6, 4, 4, 4, c);
      r(ctx, 22, 4, 4, 4, c);
      r(ctx, 4, 12, 4, 4, c);
      r(ctx, 24, 12, 4, 4, c);
      r(ctx, 8, 18, 4, 4, c);
      r(ctx, 20, 18, 4, 4, c);
    } else if (frame === 1) {
      r(ctx, 8, 4, 16, 16, c);
      r(ctx, 4, 8, 24, 8, c);
      r(ctx, 12, 2, 8, 4, c);
      r(ctx, 12, 18, 8, 4, c);
    } else {
      r(ctx, 4, 6, 8, 6, c);
      r(ctx, 20, 6, 8, 6, c);
      r(ctx, 10, 14, 6, 6, c);
      r(ctx, 16, 14, 6, 6, c);
      r(ctx, 2, 2, 4, 4, c);
      r(ctx, 26, 2, 4, 4, c);
    }
  }

  // ── Register sprites synchronously so they're ready before GF:ready fires ──

  if (!GF.spriteRegistrations) GF.spriteRegistrations = {};

  GF.spriteRegistrations.enemies = {
    alienCat: {
      frameWidth: 32, frameHeight: 24,
      originX: 16, originY: 24,
      animations: {
        idle: {
          fps: 3, loop: true,
          frames: [
            ctx => drawCatGirl(ctx, 0),
            ctx => drawCatGirl(ctx, 1),
          ],
        },
      },
    },

    alienDog: {
      frameWidth: 32, frameHeight: 24,
      originX: 16, originY: 24,
      animations: {
        idle: {
          fps: 3, loop: true,
          frames: [
            ctx => drawDogBoy(ctx, 0),
            ctx => drawDogBoy(ctx, 1),
          ],
        },
      },
    },

    alienMouse: {
      frameWidth: 32, frameHeight: 24,
      originX: 16, originY: 24,
      animations: {
        idle: {
          fps: 3, loop: true,
          frames: [
            ctx => drawMouseFriend(ctx, 0),
            ctx => drawMouseFriend(ctx, 1),
          ],
        },
      },
    },

    alienUFO: {
      frameWidth: 40, frameHeight: 18,
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
      frameWidth: 32, frameHeight: 24,
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

})(window.GF = window.GF || {});
