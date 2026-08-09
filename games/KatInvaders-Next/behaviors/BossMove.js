// behaviors/BossMove.js — boss patrols left/right, bounces off edges.
(function (GF) {
  'use strict';
  GF.behavior('BossMove', (cfg) => ({
    onAdd(e) {
      e.data.dir = 1;
    },
    update(dt, e, world) {
      var dt = (world.scene && world.scene.scaledDt) || dt;
      var W = world.engine.config.width;
      var speed = cfg.speed || 50;
      e.x += e.data.dir * speed * dt;
      if (e.x < 8) { e.x = 8; e.data.dir = 1; }
      if (e.x + e.w > W - 8) { e.x = W - e.w - 8; e.data.dir = -1; }
    },
  }));
})(window.GF);
