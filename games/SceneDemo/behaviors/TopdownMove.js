// behaviors/TopdownMove.js — 8-way movement from the bound input actions.
(function (GF) {
  'use strict';
  GF.behavior('TopdownMove', (cfg) => ({
    update(dt, e, world) {
      const inp = world.engine && world.engine.input;
      if (!inp) return;
      const s = cfg.speed || 160;
      e.vx = ((inp.isDown('right') ? 1 : 0) - (inp.isDown('left') ? 1 : 0)) * s;
      e.vy = ((inp.isDown('down')  ? 1 : 0) - (inp.isDown('up')   ? 1 : 0)) * s;
      if (e.vx) e.flipX = e.vx < 0;
    },
  }));
})(window.GF);
