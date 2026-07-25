// behaviors/PlayerMove.js — horizontal movement clamped to the play field.
// Reads the named actions 'left'/'right', so keyboard and the touch joystick
// both drive it without this file knowing either exists.
(function (GF) {
  'use strict';

  GF.behavior('PlayerMove', (cfg) => ({
    update(dt, e, world) {
      const inp = world.engine && world.engine.input;
      if (!inp) return;

      const speed = cfg.speed || 300;
      e.x += ((inp.isDown('right') ? 1 : 0) - (inp.isDown('left') ? 1 : 0)) * speed * dt;

      const margin = cfg.margin != null ? cfg.margin : 4;
      const W = world.engine.config.width;
      if (e.x < margin) e.x = margin;
      if (e.x + e.w > W - margin) e.x = W - e.w - margin;
    },
  }));

})(window.GF);
