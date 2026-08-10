// behaviors/BossAggressive.js — boss moves aggressively, darting left and right.
(function (GF) {
  'use strict';
  GF.behavior('BossAggressive', (cfg) => ({
    onAdd(e) {
      e.data.timer = 0;
      e.data.dashTimer = 0;
      e.data.dir = 1;
    },
    update(dt, e, world) {
      var dt = (world.scene && world.scene.scaledDt) || dt;
      var W = world.engine.config.width;
      var speed = cfg.speed || 70;
      var dashSpeed = speed * 2.5;
      
      e.data.timer += dt;
      e.data.dashTimer += dt;
      
      // Regular movement with direction changes
      e.x += e.data.dir * speed * dt;
      
      // Occasional aggressive dashes
      if (e.data.dashTimer > 2.5) {
        e.data.dashTimer = 0;
        e.data.isDashing = true;
        e.data.dashDirection = (Math.random() > 0.5) ? 1 : -1;
      }
      
      if (e.data.isDashing) {
        e.x += e.data.dashDirection * dashSpeed * dt;
        e.data.dashDuration = (e.data.dashDuration || 0) + dt;
        if (e.data.dashDuration > 0.6) {
          e.data.isDashing = false;
          e.data.dashDuration = 0;
          e.data.dir = -e.data.dir; // Change direction after dash
        }
      }
      
      // Keep in bounds with bounce
      if (e.x < 8) { e.x = 8; e.data.dir = 1; }
      if (e.x + e.w > W - 8) { e.x = W - e.w - 8; e.data.dir = -1; }
    },
  }));
})(window.GF);
