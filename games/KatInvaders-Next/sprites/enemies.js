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

  // Frame functions run on every render, so Math.random() here reads as
  // per-frame flicker, not a blink. Drive it off the clock instead: eyes shut
  // for ~120 ms once every 3 s, offset per tier so the rows aren't in lockstep.
  function isBlinking(offsetMs) {
    return ((Date.now() + (offsetMs || 0)) % 3000) < 120;
  }

  // ── Cat Girl (top row) ───────────────────────────────────────────────────
  function drawCatGirl(ctx, frame, color) {
    const c = color || '#ff99cc';
    
    // Glow effect based on tier
    if (frame === 0) {
      ctx.shadowColor = c;
      ctx.shadowBlur = 6;
    }
    
    // Head (animated)
    var headWobble = Math.sin(ctx.canvas.width ? Date.now() / 300 + frame : 0) * 2;
    r(ctx, 8 + headWobble, 2, 16, 12, c);
    
    // Ears (animated)
    var earTwitch = Math.cos(ctx.canvas.width ? Date.now() / 200 : 0) * 2;
    r(ctx, 6 - earTwitch, 0, 6, 5, c);
    r(ctx, 20 + earTwitch, 0, 6, 5, c);
    r(ctx, 8 + headWobble, 1, 3, 3, '#ffccdd');
    r(ctx, 21 + headWobble, 1, 3, 3, '#ffccdd');
    
    // Eyes (blinking animation)
    var blink = !isBlinking(0);
    if (blink) {
      r(ctx, 9 + headWobble, 8, 4, 4, '#220033');
      r(ctx, 19 + headWobble, 8, 4, 4, '#220033');
      r(ctx, 10 + headWobble, 9, 2, 2, '#ffffff');
      r(ctx, 20 + headWobble, 9, 2, 2, '#ffffff');
    } else {
      r(ctx, 9 + headWobble, 9, 4, 2, '#220033'); // Closed eyes
      r(ctx, 19 + headWobble, 9, 4, 2, '#220033');
    }
    
    // Whiskers (animated)
    var whiskerWiggle = Math.sin(ctx.canvas.width ? Date.now() / 150 : 0) * 1;
    r(ctx, 4 - whiskerWiggle, 12, 5, 1, c);
    r(ctx, 23 + whiskerWiggle, 12, 5, 1, c);
    
    // Body
    r(ctx, 10 + headWobble, 14, 12, 6, c);
    
    // Tail — frame-dependent
    if (frame === 0) {
      r(ctx, 4, 16, 6, 4, c);
      r(ctx, 2, 14, 4, 4, c);
    } else {
      r(ctx, 4, 18, 6, 4, c);
      r(ctx, 2, 20, 4, 4, c);
    }
    
    // Paws (animated)
    var pawWiggle = Math.sin(ctx.canvas.width ? Date.now() / 200 : 0) * 2;
    r(ctx, 10 + pawWiggle, 20, 4, 4, c);
    r(ctx, 18 - pawWiggle, 20, 4, 4, c);
    
    ctx.shadowBlur = 0;
  }

  // ── Dog Boy (middle rows) ────────────────────────────────────────────────
  function drawDogBoy(ctx, frame, color) {
    const c = color || '#99ccff';
    
    // Glow effect
    if (frame === 0) {
      ctx.shadowColor = c;
      ctx.shadowBlur = 6;
    }
    
    // Head (animated wobble)
    var headWobble = Math.sin(ctx.canvas.width ? Date.now() / 300 + frame : 0) * 2;
    r(ctx, 6 + headWobble, 4, 20, 14, c);
    r(ctx, 4 + headWobble, 6, 24, 10, c);
    
    // Floppy ears — frame-dependent (animated)
    var earSway = Math.cos(ctx.canvas.width ? Date.now() / 200 : 0) * 3;
    if (frame === 0) {
      r(ctx, 2 - earSway, 4, 6, 10, c);
      r(ctx, 24 + earSway, 4, 6, 10, c);
      r(ctx, 3 - earSway, 6, 4, 6, '#88aadd');
      r(ctx, 25 + earSway, 6, 4, 6, '#88aadd');
    } else {
      r(ctx, 0 - earSway, 6, 6, 8, c);
      r(ctx, 26 + earSway, 6, 6, 8, c);
      r(ctx, 1 - earSway, 8, 4, 5, '#88aadd');
      r(ctx, 27 + earSway, 8, 4, 5, '#88aadd');
    }
    
    // Eyes (blinking)
    var blink = !isBlinking(900);
    if (blink) {
      r(ctx, 10 + headWobble, 8, 4, 4, '#220033');
      r(ctx, 18 + headWobble, 8, 4, 4, '#220033');
      r(ctx, 11 + headWobble, 9, 2, 2, '#ffffff');
      r(ctx, 19 + headWobble, 9, 2, 2, '#ffffff');
    } else {
      r(ctx, 10 + headWobble, 9, 4, 2, '#220033');
      r(ctx, 18 + headWobble, 9, 4, 2, '#220033');
    }
    
    // Nose (animated)
    var noseWiggle = Math.sin(ctx.canvas.width ? Date.now() / 150 : 0) * 1;
    r(ctx, 14 + noseWiggle, 14, 4, 3, '#332244');
    
    // Mouth
    r(ctx, 12 + headWobble, 17, 8, 2, '#332244');
    
    // Body (animated)
    r(ctx, 8 + headWobble, 18, 16, 4, c);
    
    // Feet (running animation)
    var footOffset = Math.sin(ctx.canvas.width ? Date.now() / 200 : 0) * 3;
    r(ctx, 8 - footOffset, 22, 5, 2, c);
    r(ctx, 19 + footOffset, 22, 5, 2, c);
    
    ctx.shadowBlur = 0;
  }

  // ── Mouse Friend (bottom rows) ───────────────────────────────────────────
  function drawMouseFriend(ctx, frame, color) {
    const c = color || '#aaffcc';
    
    // Glow effect
    if (frame === 0) {
      ctx.shadowColor = c;
      ctx.shadowBlur = 6;
    }
    
    // Round head (animated)
    var headWobble = Math.sin(ctx.canvas.width ? Date.now() / 300 + frame : 0) * 2;
    r(ctx, 8 + headWobble, 2, 16, 14, c);
    r(ctx, 4 + headWobble, 6, 24, 10, c);
    
    // Round ears (animated)
    var earWiggle = Math.cos(ctx.canvas.width ? Date.now() / 200 : 0) * 2;
    r(ctx, 4 - earWiggle, 2, 8, 6, c);
    r(ctx, 20 + earWiggle, 2, 8, 6, c);
    r(ctx, 5 - earWiggle, 3, 5, 4, '#ccffdd');
    r(ctx, 21 + earWiggle, 3, 5, 4, '#ccffdd');
    
    // Eyes (blinking)
    var blink = !isBlinking(1800);
    if (blink) {
      r(ctx, 9 + headWobble, 8, 5, 5, '#220033');
      r(ctx, 18 + headWobble, 8, 5, 5, '#220033');
      r(ctx, 10 + headWobble, 9, 3, 3, '#ffffff');
      r(ctx, 19 + headWobble, 9, 3, 3, '#ffffff');
    } else {
      r(ctx, 9 + headWobble, 9, 5, 3, '#220033');
      r(ctx, 18 + headWobble, 9, 5, 3, '#220033');
    }
    
    // Nose (animated)
    var noseWiggle = Math.sin(ctx.canvas.width ? Date.now() / 150 : 0) * 1;
    r(ctx, 14 + noseWiggle, 14, 4, 3, '#ff88aa');
    
    // Body (animated)
    r(ctx, 10 + headWobble, 16, 12, 6, c);
    
    // Tail — frame-dependent (animated)
    var tailAnim = Math.sin(ctx.canvas.width ? Date.now() / 150 : 0) * 3;
    if (frame === 0) {
      r(ctx, 4 + tailAnim, 18, 6, 2, c);
      r(ctx, 2 + tailAnim, 16, 4, 2, c);
    } else {
      r(ctx, 4 + tailAnim, 20, 6, 2, c);
      r(ctx, 2 + tailAnim, 22, 4, 2, c);
    }
    
    // Feet (running animation)
    var footOffset = Math.sin(ctx.canvas.width ? Date.now() / 200 : 0) * 2;
    r(ctx, 10 - footOffset, 22, 4, 2, c);
    r(ctx, 18 + footOffset, 22, 4, 2, c);
    
    ctx.shadowBlur = 0;
  }

  // ── UFO / Mystery cat toy ────────────────────────────────────────────────
  // 40×18, origin (20, 18)
  function drawUFO(ctx) {
    const c1 = '#ff6699';
    const c2 = '#ff99bb';
    const glow = '#ffccff';
    
    // Glow effect
    ctx.shadowColor = glow;
    ctx.shadowBlur = 10;
    
    // Saucer (pulsing)
    var pulse = Math.sin(ctx.canvas.width ? Date.now() / 200 : 0) * 3;
    r(ctx, 10 - pulse, 6 - pulse, 20 + pulse * 2, 10 + pulse, c1);
    r(ctx, 4 - pulse, 8 - pulse, 32 + pulse * 2, 8 + pulse, c1);
    r(ctx, 0 - pulse, 10 - pulse, 40 + pulse * 2, 6 + pulse, c1);
    
    // Dome (animated rotation)
    var domeAnim = Math.sin(ctx.canvas.width ? Date.now() / 150 : 0) * 2;
    r(ctx, 14 + domeAnim, 2, 12 - domeAnim, 6, c2);
    r(ctx, 12 + domeAnim, 4, 16 - domeAnim * 2, 4, c2);
    
    // Windows (rotating)
    var windowAnim = Math.cos(ctx.canvas.width ? Date.now() / 100 : 0) * 4;
    r(ctx, 6 + windowAnim, 10, 4, 4, '#ffddff');
    r(ctx, 14, 10 + windowAnim, 4, 4, '#ffddff');
    r(ctx, 22 - windowAnim, 10, 4, 4, '#ffddff');
    r(ctx, 30, 10 - windowAnim, 4, 4, '#ffddff');
    
    // Lights (flashing)
    var lightFrame = Math.floor(ctx.canvas.width ? Date.now() / 100 : 0) % 4;
    if (lightFrame === 0 || lightFrame === 2) {
      r(ctx, 4, 14, 4, 2, '#ffccdd');
      r(ctx, 12, 14, 4, 2, '#ffccdd');
      r(ctx, 20, 14, 4, 2, '#ffccdd');
      r(ctx, 28, 14, 4, 2, '#ffccdd');
    }
    
    ctx.shadowBlur = 0;
  }

  // ── Explosion ────────────────────────────────────────────────────────────
  // 32×24, origin (16, 24)
  function drawExplosion(ctx, frame) {
    const colors = ['#ffffaa', '#ffcc44', '#ff8844', '#ff4444'];
    var colorIndex = frame % colors.length;
    var c = colors[colorIndex];
    
    // Glow effect
    ctx.shadowColor = c;
    ctx.shadowBlur = 12;
    
    if (frame === 0) {
      // Initial burst - star shape
      r(ctx, 14, 4, 4, 16, c);
      r(ctx, 4, 14, 24, 4, c);
      r(ctx, 8, 2, 8, 8, c);
      r(ctx, 20, 2, 8, 8, c);
      r(ctx, 8, 18, 8, 4, c);
      r(ctx, 20, 18, 8, 4, c);
    } else if (frame === 1) {
      // Expanding ring
      r(ctx, 6, 6, 20, 12, c);
      r(ctx, 4, 8, 24, 8, c);
      r(ctx, 8, 10, 16, 4, c);
    } else if (frame === 2) {
      // Fading
      r(ctx, 10, 8, 12, 8, c);
      r(ctx, 8, 9, 16, 6, c);
    } else if (frame === 3) {
      // Final spark
      r(ctx, 12, 10, 8, 4, c);
      r(ctx, 10, 11, 12, 2, c);
    } else if (frame === 4) {
      // Sparkles
      var sparkleX = (Math.sin(ctx.canvas.width ? Date.now() / 100 : 0) + 1) * 16 + 4;
      var sparkleY = (Math.cos(ctx.canvas.width ? Date.now() / 150 : 0) + 1) * 12 + 4;
      r(ctx, sparkleX, sparkleY, 3, 3, '#ffffff');
      r(ctx, sparkleX + 6, sparkleY + 4, 2, 2, '#ffccff');
    }
    
    ctx.shadowBlur = 0;
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
