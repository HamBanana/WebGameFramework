// behaviors/PlayerMove.js — horizontal movement clamped to field.
(function (GF) {
  'use strict';
  GF.behavior('PlayerMove', (cfg) => ({
    update(dt, e, world) {
      var inp = world.engine && world.engine.input;
      if (!inp) return;
      var speed = cfg.speed || 240;
      e.x += ((inp.isDown('right') ? 1 : 0) - (inp.isDown('left') ? 1 : 0)) * speed * dt;
      var margin = cfg.margin != null ? cfg.margin : 4;
      var W = world.engine.config.width;
      if (e.x < margin) e.x = margin;
      if (e.x + e.w > W - margin) e.x = W - e.w - margin;
    },
  }));
})(window.GF);
