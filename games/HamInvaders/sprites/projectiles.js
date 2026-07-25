// sprites/projectiles.js — player shot variants and the invaders' return fire.
(function (GF) {
  'use strict';
  GF.sprites = GF.sprites || {};

  function bolt(w, h, body, core, pad) {
    return {
      frameWidth: w, frameHeight: h, originX: w / 2, originY: h,
      animations: { idle: { fps: 1, loop: true, frames: [function (ctx) {
        ctx.fillStyle = body; ctx.fillRect(-(pad || 0), 0, w + (pad || 0) * 2, h);
        ctx.fillStyle = core; ctx.fillRect(1, 0, 2, h);
      }] } },
    };
  }

  GF.sprites.shot          = bolt(4, 12, '#ffeb3b', '#fff');
  GF.sprites.shotMegaLaser = bolt(4, 12, '#ffeb3b', '#fff', 1);   // wider beam
  GF.sprites.shotRapidFire = bolt(4, 12, '#3498db', '#fff');
  GF.sprites.invaderShot   = bolt(4, 10, '#ff6b6b', '#fff');

})(window.GF = window.GF || {});
