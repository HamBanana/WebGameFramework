// GameFramework/games/Acca/sprites/die.js
// 6-sided die sprite — registered as 'die'.
// Animations:
//   rolling  — fast cycle of random faces (loops)
//   face1..6 — single-frame static faces (loop=false)
//
// Origin is the visual center of the die.

(function (GF) {
  'use strict';

  GF.sprites = GF.sprites || {};

  const SIZE = 64;            // square frame
  const ORIGIN = SIZE / 2;    // centered

  // Palette
  const DIE_BG     = '#f8f4e6';
  const DIE_SHADE  = '#cdc6b3';
  const DIE_BORDER = '#1a1a1a';
  const PIP_COLOR  = '#1a1a1a';
  const PIP_HL     = '#ffffff';

  // Pip layouts on a 4×4 grid (relative coords on a 40×40 face area).
  // Coordinates are 0..3 on each axis; converted to pixel offsets.
  const PIPS = {
    1: [[2, 2]],
    2: [[1, 1], [3, 3]],
    3: [[1, 1], [2, 2], [3, 3]],
    4: [[1, 1], [3, 1], [1, 3], [3, 3]],
    5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]],
    6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]],
  };

  // ── Drawing helpers ────────────────────────────────────────────────────────
  function drawDieBody(ctx) {
    // Drop shadow
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(ORIGIN, SIZE - 6, 22, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Cube face (flat 2D representation)
    const faceX = 8, faceY = 8, faceW = 48, faceH = 48;

    // Bottom-right shade
    ctx.fillStyle = DIE_SHADE;
    ctx.beginPath();
    ctx.moveTo(faceX + faceW, faceY);
    ctx.lineTo(faceX + faceW + 4, faceY + 4);
    ctx.lineTo(faceX + faceW + 4, faceY + faceH + 4);
    ctx.lineTo(faceX + 4, faceY + faceH + 4);
    ctx.lineTo(faceX, faceY + faceH);
    ctx.lineTo(faceX + faceW, faceY + faceH);
    ctx.closePath();
    ctx.fill();

    // Main face
    ctx.fillStyle = DIE_BG;
    roundRect(ctx, faceX, faceY, faceW, faceH, 6);
    ctx.fill();

    // Border
    ctx.strokeStyle = DIE_BORDER;
    ctx.lineWidth = 2;
    roundRect(ctx, faceX, faceY, faceW, faceH, 6);
    ctx.stroke();

    // Inner highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(faceX + 3, faceY + faceH - 4);
    ctx.lineTo(faceX + 3, faceY + 3);
    ctx.lineTo(faceX + faceW - 4, faceY + 3);
    ctx.stroke();
  }

  function drawPips(ctx, value) {
    const pips = PIPS[value] || [];
    const faceX = 8, faceY = 8, faceSize = 48;
    const cell = faceSize / 4;

    pips.forEach(([gx, gy]) => {
      const cx = faceX + (gx + 0.5) * cell;
      const cy = faceY + (gy + 0.5) * cell;

      ctx.fillStyle = PIP_COLOR;
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Tiny highlight
      ctx.fillStyle = PIP_HL;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(cx - 1, cy - 1, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ── Frame factory: a face frame is body + pips ─────────────────────────────
  function faceFrame(value) {
    return (ctx) => {
      drawDieBody(ctx);
      drawPips(ctx, value);
    };
  }

  // Rolling animation: cycle through all six faces quickly + a slight wobble.
  function rollingFrames() {
    const order = [1, 4, 2, 6, 3, 5, 2, 4, 6, 1, 3, 5];
    return order.map((v, i) => (ctx) => {
      ctx.save();
      // Wobble rotate around center
      const angle = ((i % 4) - 1.5) * 0.05;
      ctx.translate(ORIGIN, ORIGIN);
      ctx.rotate(angle);
      ctx.translate(-ORIGIN, -ORIGIN);
      drawDieBody(ctx);
      drawPips(ctx, v);
      ctx.restore();
    });
  }

  // ── Register sprite ────────────────────────────────────────────────────────
  GF.sprites['die'] = {
    frameWidth : SIZE,
    frameHeight: SIZE,
    originX    : ORIGIN,
    originY    : ORIGIN,
    animations : {
      rolling: { fps: 18, loop: true,  frames: rollingFrames() },
      face1  : { fps: 1,  loop: false, frames: [faceFrame(1)] },
      face2  : { fps: 1,  loop: false, frames: [faceFrame(2)] },
      face3  : { fps: 1,  loop: false, frames: [faceFrame(3)] },
      face4  : { fps: 1,  loop: false, frames: [faceFrame(4)] },
      face5  : { fps: 1,  loop: false, frames: [faceFrame(5)] },
      face6  : { fps: 1,  loop: false, frames: [faceFrame(6)] },
      // alias used by SpriteAnimator default
      idle   : { fps: 1,  loop: false, frames: [faceFrame(1)] },
    },
  };

})(window.GF = window.GF || {});
