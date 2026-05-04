// games/Acca/sprites/resources.js — small 16×16 icons for the resource strip,
// market modal, business cards. Origin centered.

(function (GF) {
  'use strict';
  GF.sprites = GF.sprites || {};

  const SIZE = 16;
  const ORIGIN = SIZE / 2;

  const PALETTE = {
    res_wood:        { fg: '#a26a3a', bg: '#5a3a1f' },
    res_steel:       { fg: '#9aa6b6', bg: '#3a4a5a' },
    res_electricity: { fg: '#ffe57a', bg: '#5a4a1f' },
    res_water:       { fg: '#6ec4ff', bg: '#1f3a5a' },
    res_food:        { fg: '#7be07f', bg: '#1f5a2a' },
    res_coal:        { fg: '#5a5a5a', bg: '#1a1a1a' },
    res_oil:         { fg: '#3a2a6e', bg: '#1a0a1f' },
  };

  const GLYPH = {
    res_wood: (ctx, p) => {
      ctx.fillStyle = p.fg;
      // log
      ctx.fillRect(2, 6, 12, 4);
      ctx.fillStyle = p.bg;
      ctx.fillRect(2, 6, 2, 4);
      ctx.fillRect(7, 6, 1, 4);
      ctx.fillRect(11, 6, 1, 4);
    },
    res_steel: (ctx, p) => {
      ctx.fillStyle = p.fg;
      ctx.beginPath();
      ctx.moveTo(2, 11); ctx.lineTo(8, 5); ctx.lineTo(14, 11);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = p.bg;
      ctx.fillRect(7, 9, 2, 2);
    },
    res_electricity: (ctx, p) => {
      ctx.fillStyle = p.fg;
      ctx.beginPath();
      ctx.moveTo(9, 2); ctx.lineTo(5, 9); ctx.lineTo(8, 9);
      ctx.lineTo(6, 14); ctx.lineTo(11, 7); ctx.lineTo(8, 7);
      ctx.lineTo(10, 2);
      ctx.closePath(); ctx.fill();
    },
    res_water: (ctx, p) => {
      ctx.fillStyle = p.fg;
      ctx.beginPath();
      ctx.arc(8, 9, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.bg;
      ctx.beginPath();
      ctx.arc(6, 7, 1.5, 0, Math.PI * 2);
      ctx.fill();
    },
    res_food: (ctx, p) => {
      ctx.fillStyle = p.fg;
      ctx.beginPath();
      ctx.ellipse(8, 9, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.bg;
      ctx.fillRect(7, 4, 2, 3);
    },
    res_coal: (ctx, p) => {
      ctx.fillStyle = p.fg;
      ctx.fillRect(3, 7, 4, 4);
      ctx.fillRect(8, 5, 4, 4);
      ctx.fillRect(6, 10, 4, 4);
    },
    res_oil: (ctx, p) => {
      ctx.fillStyle = p.fg;
      ctx.beginPath();
      ctx.moveTo(8, 3); ctx.lineTo(4, 11); ctx.lineTo(12, 11);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffe000';
      ctx.fillRect(7, 6, 2, 2);
    },
  };

  Object.keys(PALETTE).forEach(name => {
    const p = PALETTE[name];
    const draw = GLYPH[name];
    GF.sprites[name] = {
      frameWidth: SIZE, frameHeight: SIZE,
      originX: ORIGIN, originY: ORIGIN,
      animations: {
        idle: { fps: 1, loop: false, frames: [(ctx) => {
          ctx.fillStyle = p.bg;
          ctx.fillRect(0, 0, SIZE, SIZE);
          ctx.strokeStyle = p.fg;
          ctx.lineWidth = 1;
          ctx.strokeRect(0.5, 0.5, SIZE - 1, SIZE - 1);
          if (draw) draw(ctx, p);
        }] },
      },
    };
  });

})(window.GF = window.GF || {});
