// behaviors/CullOffscreen.js — destroy the entity once it leaves the canvas.
// Every projectile and pickup needs this; none of them should have to say how.
(function (GF) {
  'use strict';

  GF.behavior('CullOffscreen', (cfg) => ({
    update(dt, e, world) {
      const m = cfg.margin != null ? cfg.margin : 32;
      const W = world.engine.config.width;
      const H = world.engine.config.height;
      if (e.bottom < -m || e.y > H + m || e.right < -m || e.x > W + m) e.destroy();
    },
  }));

})(window.GF);
