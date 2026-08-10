// behaviors/BossHover.js — boss hovers up and down with side-to-side movement.
(function (GF) {
  'use strict';
  GF.behavior('BossHover', (cfg) => ({
    onAdd(e) {
      e.data.timer = 0;
      e.data.baseY = 50;
    },
    update(dt, e, world) {
      var dt = (world.scene && world.scene.scaledDt) || dt;
      var W = world.engine.config.width;
      var speed = cfg.speed || 40;
      var hoverSpeed = cfg.hoverSpeed || 30;
      
      // Side-to-side movement
      e.data.timer += dt;
      e.x += Math.sin(e.data.timer * 0.8) * speed * dt;
      
      // Up and down hover movement
      e.y = e.data.baseY + Math.sin(e.data.timer * 1.2) * 80;
      
      // Keep in bounds
      if (e.x < 10) e.x = 10;
      if (e.x + e.w > W - 10) e.x = W - e.w - 10;
      if (e.y < 20) e.y = 20;
      if (e.y > 150) e.y = 150;
    },
  }));
})(window.GF);
