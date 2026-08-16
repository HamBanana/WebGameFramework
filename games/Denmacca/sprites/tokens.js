// GameFramework/games/Acca/sprites/tokens.js
// Player tokens — registered as 'token_red', 'token_blue', 'token_green', 'token_yellow'.
// Origin is the visual center of the token's base.
// Each token has a single 'idle' animation that gently bobs.

(function (GF) {
  'use strict';

  GF.sprites = GF.sprites || {};

  // ── Palette per token ───────────────────────────────────────────────────────
  const TOKEN_PALETTES = {
    token_red   : { base: '#cc1f1f', shade: '#7a0d0d', light: '#ff6b6b', rim: '#ffd0d0' },
    token_blue  : { base: '#1f5fcc', shade: '#0d2f7a', light: '#6b9bff', rim: '#d0deff' },
    token_green : { base: '#2faa3a', shade: '#0d5a13', light: '#7be07f', rim: '#d2ffd6' },
    token_yellow: { base: '#e8c01a', shade: '#8a6f0a', light: '#ffe57a', rim: '#fff6c0' },
  };

  // Frame size: 36 × 44, origin at (18, 40) — anchored at the bottom of the
  // base disk so a token stands on a cell's center.
  const FRAME_W = 36;
  const FRAME_H = 44;
  const ORIGIN_X = 18;
  const ORIGIN_Y = 40;

  // ── Drawing helpers ────────────────────────────────────────────────────────
  function drawToken(ctx, palette, bobY) {
    const cx = 18;

    // --- Base disk (shadow on the cell) ---
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(cx, 40, 11, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- Pawn body (rounded peg) ---
    const bodyTop = 12 + bobY;
    const bodyBottom = 36 + bobY;
    const bodyW = 16;

    // Stem
    ctx.fillStyle = palette.base;
    ctx.beginPath();
    ctx.moveTo(cx - bodyW / 2, bodyBottom);
    ctx.lineTo(cx - bodyW / 2 + 3, bodyTop + 8);
    ctx.lineTo(cx + bodyW / 2 - 3, bodyTop + 8);
    ctx.lineTo(cx + bodyW / 2, bodyBottom);
    ctx.closePath();
    ctx.fill();

    // Shade side
    ctx.fillStyle = palette.shade;
    ctx.beginPath();
    ctx.moveTo(cx, bodyTop + 8);
    ctx.lineTo(cx + bodyW / 2 - 3, bodyTop + 8);
    ctx.lineTo(cx + bodyW / 2, bodyBottom);
    ctx.lineTo(cx, bodyBottom);
    ctx.closePath();
    ctx.fill();

    // Head (sphere)
    ctx.fillStyle = palette.base;
    ctx.beginPath();
    ctx.arc(cx, bodyTop + 4, 8, 0, Math.PI * 2);
    ctx.fill();

    // Head highlight
    ctx.fillStyle = palette.light;
    ctx.beginPath();
    ctx.arc(cx - 2, bodyTop + 1, 3, 0, Math.PI * 2);
    ctx.fill();

    // Head shade
    ctx.fillStyle = palette.shade;
    ctx.beginPath();
    ctx.arc(cx + 3, bodyTop + 6, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Rim band
    ctx.fillStyle = palette.rim;
    ctx.fillRect(cx - 6, bodyBottom - 4, 12, 2);

    // Foot disk
    ctx.fillStyle = palette.shade;
    ctx.beginPath();
    ctx.ellipse(cx, bodyBottom, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Build animation frames ─────────────────────────────────────────────────
  function makeIdleFrames(palette) {
    // 4-frame gentle bob loop: 0, -1, 0, +1
    const offsets = [0, -1, 0, 1];
    return offsets.map(off => (ctx) => drawToken(ctx, palette, off));
  }

  // ── Register all four tokens ───────────────────────────────────────────────
  Object.keys(TOKEN_PALETTES).forEach(name => {
    GF.sprites[name] = {
      frameWidth : FRAME_W,
      frameHeight: FRAME_H,
      originX    : ORIGIN_X,
      originY    : ORIGIN_Y,
      animations : {
        idle: { fps: 4, loop: true, frames: makeIdleFrames(TOKEN_PALETTES[name]) },
      },
    };
  });

})(window.GF = window.GF || {});
