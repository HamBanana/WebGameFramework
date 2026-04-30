// GameFramework/games/RoadToSkagen/sprites/wildlife.js
// Wildlife sprites:
//   cow      — black & white Danish dairy cow (idle, mild head bob)
//   sheep    — fluffy white sheep
//   deer     — brown deer
//   bird     — flying bird (animated wings)
//   swan     — graceful swan
//   rabbit   — small rabbit

(function (GF) {
  'use strict';

  GF.sprites = GF.sprites || {};

  function r(ctx, x, y, w, h, fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
  }

  function ellipse(ctx, cx, cy, rx, ry, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Cow ───────────────────────────────────────────────────────────────────
  // 36×26, origin (18, 26)
  function drawCow(ctx, headOffset) {
    // Body
    ellipse(ctx, 18, 14, 12, 7, '#ffffff');
    // Black patches
    ellipse(ctx, 14, 13, 5, 4, '#1a1a1a');
    ellipse(ctx, 22, 16, 4, 3, '#1a1a1a');
    // Legs
    r(ctx, 10, 18, 3, 8, '#1a1a1a');
    r(ctx, 16, 18, 3, 8, '#ffffff');
    r(ctx, 22, 18, 3, 8, '#1a1a1a');
    r(ctx, 27, 18, 3, 8, '#ffffff');
    // Head
    const hx = 28 + headOffset;
    ellipse(ctx, hx, 11, 5, 4, '#ffffff');
    // Snout
    ellipse(ctx, hx + 3, 13, 2, 1.5, '#ffd0d0');
    // Eye
    r(ctx, hx + 1, 9, 1, 1, '#1a1a1a');
    // Horns
    r(ctx, hx - 1, 7, 1, 2, '#caa56a');
    r(ctx, hx + 3, 7, 1, 2, '#caa56a');
    // Tail
    r(ctx, 5, 12, 1, 8, '#1a1a1a');
    r(ctx, 4, 19, 3, 2, '#1a1a1a');
  }
  GF.sprites['cow'] = {
    frameWidth: 36, frameHeight: 26,
    originX: 18, originY: 26,
    animations: {
      idle: { fps: 2, loop: true, frames: [
        (ctx) => drawCow(ctx, 0),
        (ctx) => drawCow(ctx, -1),
        (ctx) => drawCow(ctx, 0),
        (ctx) => drawCow(ctx, 1),
      ]},
    },
  };

  // ── Sheep ─────────────────────────────────────────────────────────────────
  // 22×20, origin (11, 20)
  GF.sprites['sheep'] = {
    frameWidth: 22, frameHeight: 20,
    originX: 11, originY: 20,
    animations: {
      idle: { fps: 1, loop: true, frames: [(ctx) => {
        // Fluffy body
        ellipse(ctx, 11, 10, 8, 5, '#fff8ee');
        ellipse(ctx, 6,  9,  3, 3, '#fff8ee');
        ellipse(ctx, 16, 9,  3, 3, '#fff8ee');
        ellipse(ctx, 11, 6,  3, 3, '#fff8ee');
        // Legs
        r(ctx, 6,  14, 2, 6, '#3a3a3a');
        r(ctx, 14, 14, 2, 6, '#3a3a3a');
        // Head
        ellipse(ctx, 18, 10, 3, 3, '#3a3a3a');
        r(ctx, 19, 9, 1, 1, '#fff8ee');
      }] },
    },
  };

  // ── Deer ──────────────────────────────────────────────────────────────────
  // 30×30, origin (15, 30)
  GF.sprites['deer'] = {
    frameWidth: 30, frameHeight: 30,
    originX: 15, originY: 30,
    animations: {
      idle: { fps: 1, loop: true, frames: [(ctx) => {
        // Body
        ellipse(ctx, 14, 16, 9, 5, '#a8632a');
        // Spots (fawn marking)
        r(ctx, 11, 13, 1, 1, '#fff8ee');
        r(ctx, 16, 14, 1, 1, '#fff8ee');
        r(ctx, 18, 17, 1, 1, '#fff8ee');
        // Legs
        r(ctx, 7,  20, 2, 10, '#7a4218');
        r(ctx, 12, 20, 2, 10, '#7a4218');
        r(ctx, 18, 20, 2, 10, '#7a4218');
        r(ctx, 22, 20, 2, 10, '#7a4218');
        // Neck & head
        r(ctx, 22, 8, 3, 8, '#a8632a');
        ellipse(ctx, 26, 6, 3, 2, '#a8632a');
        // Antlers
        r(ctx, 24, 1, 1, 4, '#5a3c1c');
        r(ctx, 23, 0, 1, 2, '#5a3c1c');
        r(ctx, 26, 0, 1, 2, '#5a3c1c');
        // Eye & nose
        r(ctx, 27, 5, 1, 1, '#1a1a1a');
        r(ctx, 28, 7, 1, 1, '#1a1a1a');
        // Tail (white flag)
        r(ctx, 5, 13, 2, 3, '#fff8ee');
      }] },
    },
  };

  // ── Bird (flying — 4 frame wing flap) ─────────────────────────────────────
  // 16×10, origin (8, 5)
  function drawBird(ctx, wingPhase) {
    ctx.fillStyle = '#1a1a1a';
    // Body
    ctx.beginPath();
    ctx.ellipse(8, 5, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wings — V shape varying with phase
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (wingPhase === 0) {        // up
      ctx.moveTo(8, 5); ctx.lineTo(2, 1);
      ctx.moveTo(8, 5); ctx.lineTo(14, 1);
    } else if (wingPhase === 1) { // mid
      ctx.moveTo(8, 5); ctx.lineTo(1, 4);
      ctx.moveTo(8, 5); ctx.lineTo(15, 4);
    } else if (wingPhase === 2) { // down
      ctx.moveTo(8, 5); ctx.lineTo(2, 8);
      ctx.moveTo(8, 5); ctx.lineTo(14, 8);
    } else {                      // mid (up sweep)
      ctx.moveTo(8, 5); ctx.lineTo(1, 5);
      ctx.moveTo(8, 5); ctx.lineTo(15, 5);
    }
    ctx.stroke();
  }
  GF.sprites['bird'] = {
    frameWidth: 16, frameHeight: 10,
    originX: 8, originY: 5,
    animations: {
      idle: { fps: 6, loop: true, frames: [
        (ctx) => drawBird(ctx, 0),
        (ctx) => drawBird(ctx, 1),
        (ctx) => drawBird(ctx, 2),
        (ctx) => drawBird(ctx, 3),
      ]},
    },
  };

  // ── Swan (still, on water) ────────────────────────────────────────────────
  GF.sprites['swan'] = {
    frameWidth: 24, frameHeight: 18,
    originX: 12, originY: 18,
    animations: {
      idle: { fps: 1, loop: true, frames: [(ctx) => {
        // Body
        ellipse(ctx, 10, 11, 7, 4, '#ffffff');
        // Tail
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(3, 11); ctx.lineTo(0, 8); ctx.lineTo(4, 9);
        ctx.closePath(); ctx.fill();
        // Neck (S-curve)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(15, 9);
        ctx.bezierCurveTo(20, 6, 22, 4, 21, 2);
        ctx.stroke();
        // Head
        ellipse(ctx, 21, 2, 2, 1.5, '#ffffff');
        // Beak
        r(ctx, 22, 2, 2, 1, '#e8a020');
        // Eye
        r(ctx, 21, 1, 1, 1, '#1a1a1a');
        // Water ripple
        ctx.strokeStyle = 'rgba(80,140,180,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(2, 16); ctx.lineTo(20, 16);
        ctx.stroke();
      }] },
    },
  };

  // ── Rabbit ────────────────────────────────────────────────────────────────
  GF.sprites['rabbit'] = {
    frameWidth: 14, frameHeight: 14,
    originX: 7, originY: 14,
    animations: {
      idle: { fps: 1, loop: true, frames: [(ctx) => {
        // Body
        ellipse(ctx, 7, 10, 4, 3, '#9a8870');
        // Head
        ellipse(ctx, 10, 8, 2.5, 2.5, '#9a8870');
        // Ears
        r(ctx, 9,  3, 1, 5, '#9a8870');
        r(ctx, 11, 3, 1, 5, '#9a8870');
        r(ctx, 9,  4, 1, 2, '#ffd0d0');
        r(ctx, 11, 4, 1, 2, '#ffd0d0');
        // Tail
        ellipse(ctx, 3, 9, 1.5, 1.5, '#fff8ee');
        // Eye
        r(ctx, 11, 7, 1, 1, '#1a1a1a');
      }] },
    },
  };

})(window.GF = window.GF || {});
