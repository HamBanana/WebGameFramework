// behaviors/BossCircle.js — boss moves in a figure-8 pattern.
(function (GF) {
  'use strict';
  GF.behavior('BossCircle', (cfg) => ({
    onAdd(e) {
      e.data.timer = 0;
      e.data.baseX = (e.world && e.world.engine) ? e.world.engine.config.width / 2 - 48 : 192;
      e.data.baseY = 50;
    },
    update(dt, e, world) {
      var dt = (world.scene && world.scene.scaledDt) || dt;
      var W = world.engine.config.width;
      var speed = cfg.speed || 50;
      
      e.data.timer += dt;
      
      // Figure-8 pattern
      var x = Math.sin(e.data.timer * 0.6) * (W * 0.35);
      var y = Math.sin(e.data.timer * 0.3) * 60;
      
      e.x = e.data.baseX + x;
      e.y = e.data.baseY + y + 50;
      
      // Keep in bounds
      if (e.x < 10) e.x = 10;
      if (e.x + e.w > W - 10) e.x = W - e.w - 10;
    },
  }));
})(window.GF);
