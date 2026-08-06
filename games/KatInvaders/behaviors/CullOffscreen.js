// behaviors/CullOffscreen.js — destroy entities that leave the play field.
(function (GF) {
  'use strict';
  GF.behavior('CullOffscreen', (cfg) => ({
    update(dt, e, world) {
      var W = world.engine.config.width;
      var H = world.engine.config.height;
      if (e.y > H + 50 || e.y + e.h < -50 || e.x > W + 50 || e.x + e.w < -50) {
        e.destroy();
      }
    },
  }));
})(window.GF);
