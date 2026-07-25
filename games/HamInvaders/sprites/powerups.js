// sprites/powerups.js — one sprite per powerup, generated from data/powerups.js
// so a new powerup gets its pickup art for free.
(function (GF, G) {
  'use strict';
  GF.sprites = GF.sprites || {};

  var W = 24, H = 24;

  Object.keys(G.powerupTypes || {}).forEach(function (type) {
    var p = G.powerupTypes[type];
    GF.sprites['powerup_' + type] = {
      frameWidth: W, frameHeight: H, originX: W / 2, originY: H,
      animations: { idle: { fps: 1, loop: true, frames: [function (ctx) {
        ctx.save();
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = p.color;
        ctx.fillRect(2, 2, W - 4, H - 4);

        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.4;
        ctx.fillRect(4, 4, W - 8, H - 8);
        ctx.globalAlpha = 1;

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.icon, W / 2, H / 2);
        ctx.restore();
      }] } },
    };
  });

})(window.GF = window.GF || {}, window.GAME = window.GAME || {});
