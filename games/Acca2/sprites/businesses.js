// games/Acca/sprites/businesses.js — 24×24 business icons for build menu &
// property stack. Origin centered.

(function (GF) {
  'use strict';
  GF.sprites = GF.sprites || {};

  const SIZE = 24;
  const ORIGIN = SIZE / 2;

  const SET = {
    biz_shop:      { bg: '#3d6e4a', fg: '#d8ffe2', glyph: 'shop' },
    biz_factory:   { bg: '#4a4a4a', fg: '#dadada', glyph: 'factory' },
    biz_farm:      { bg: '#5a4c2a', fg: '#ffe7a8', glyph: 'farm' },
    biz_lumber_mill:{ bg: '#5a3a1f', fg: '#d8c0a0', glyph: 'lumber' },
    biz_coal_mine: { bg: '#1a1a1a', fg: '#888888', glyph: 'mine' },
    biz_steel_mill:{ bg: '#3a4a5a', fg: '#9aa6b6', glyph: 'mill' },
    biz_power_plant:{bg: '#5a4a1f', fg: '#ffe57a', glyph: 'power' },
    biz_oil_rig:   { bg: '#1a0a1f', fg: '#5a4ada', glyph: 'rig' },
    biz_water_pump:{ bg: '#1f3a5a', fg: '#6ec4ff', glyph: 'pump' },
    biz_service:   { bg: '#3a3070', fg: '#cdb6ff', glyph: 'service' },
  };

  const GLYPHS = {
    shop: (ctx, p) => {
      ctx.fillStyle = p.fg;
      ctx.fillRect(4, 8, 16, 12);
      ctx.fillStyle = p.bg;
      ctx.fillRect(10, 12, 4, 8);
      ctx.fillStyle = p.fg;
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('$', 12, 8);
    },
    factory: (ctx, p) => {
      ctx.fillStyle = p.fg;
      ctx.fillRect(2, 10, 20, 10);
      ctx.fillRect(16, 4, 3, 8);
      ctx.fillStyle = '#ddd';
      ctx.beginPath();
      ctx.arc(18, 4, 2, 0, Math.PI * 2);
      ctx.fill();
    },
    farm: (ctx, p) => {
      ctx.fillStyle = p.fg;
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(3 + i * 5, 8, 3, 12);
      }
    },
    lumber: (ctx, p) => {
      ctx.fillStyle = p.fg;
      ctx.fillRect(4, 6, 16, 4);
      ctx.fillStyle = p.bg;
      ctx.fillRect(10, 6, 4, 4);
      ctx.fillStyle = p.fg;
      ctx.fillRect(8, 12, 8, 8);
    },
    mine: (ctx, p) => {
      ctx.fillStyle = p.fg;
      ctx.beginPath();
      ctx.moveTo(2, 18); ctx.lineTo(12, 6); ctx.lineTo(22, 18);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = p.bg;
      ctx.fillRect(10, 14, 4, 6);
    },
    mill: (ctx, p) => {
      ctx.fillStyle = p.fg;
      ctx.fillRect(4, 4, 16, 16);
      ctx.fillStyle = p.bg;
      for (let i = 0; i < 3; i++) ctx.fillRect(6, 6 + i * 5, 12, 2);
    },
    power: (ctx, p) => {
      ctx.fillStyle = p.fg;
      ctx.beginPath();
      ctx.moveTo(13, 4); ctx.lineTo(7, 13); ctx.lineTo(11, 13);
      ctx.lineTo(8, 20); ctx.lineTo(15, 11); ctx.lineTo(11, 11);
      ctx.lineTo(14, 4);
      ctx.closePath(); ctx.fill();
    },
    rig: (ctx, p) => {
      ctx.fillStyle = p.fg;
      ctx.beginPath();
      ctx.moveTo(6, 20); ctx.lineTo(12, 4); ctx.lineTo(18, 20);
      ctx.closePath(); ctx.fill();
    },
    pump: (ctx, p) => {
      ctx.fillStyle = p.fg;
      ctx.beginPath();
      ctx.arc(12, 12, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.bg;
      ctx.beginPath();
      ctx.arc(10, 9, 2, 0, Math.PI * 2);
      ctx.fill();
    },
    service: (ctx, p) => {
      ctx.fillStyle = p.fg;
      ctx.beginPath();
      ctx.moveTo(12, 4); ctx.lineTo(20, 14); ctx.lineTo(12, 20); ctx.lineTo(4, 14);
      ctx.closePath(); ctx.fill();
    },
  };

  Object.keys(SET).forEach(name => {
    const p = SET[name];
    const draw = GLYPHS[p.glyph];
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
