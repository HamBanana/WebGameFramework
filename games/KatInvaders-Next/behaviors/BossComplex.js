// behaviors/BossComplex.js — boss has complex movement pattern with multiple phases.
(function (GF) {
  'use strict';
  GF.behavior('BossComplex', (cfg) => ({
    onAdd(e) {
      e.data.timer = 0;
      e.data.phase = 'enter';
      e.data.targetY = 50;
    },
    update(dt, e, world) {
      var dt = (world.scene && world.scene.scaledDt) || dt;
      var W = world.engine.config.width;
      var speed = cfg.speed || 45;
      var targetY = e.data.targetY;
      
      e.data.timer += dt;
      
      // Enter phase
      if (e.data.phase === 'enter') {
        var dy = targetY - e.y;
        e.y += dy * speed * dt;
        if (Math.abs(dy) < 2) e.data.phase = 'phase1';
      }
      // Phase 1: Horizontal movement
      else if (e.data.phase === 'phase1') {
        e.x += Math.sin(e.data.timer * 0.5) * speed * dt;
        // Change to phase 2 after 4 seconds
        if (e.data.timer > 4) e.data.phase = 'phase2';
      }
      // Phase 2: Vertical oscillation
      else if (e.data.phase === 'phase2') {
        e.x += Math.sin(e.data.timer * 0.8) * speed * 0.8 * dt;
        e.y = targetY + Math.sin(e.data.timer * 1.5) * 40;
        // Change to phase 3 after 5 seconds
        if (e.data.timer > 9) e.data.phase = 'phase3';
      }
      // Phase 3: Random movement with bursts
      else if (e.data.phase === 'phase3') {
        e.x += (Math.random() - 0.5) * speed * 3 * dt;
        e.y += (Math.random() - 0.5) * speed * 2 * dt;
        // Return to center after random time
        if (e.data.timer % 3 < 0.5) {
          e.x += (W/2 - e.x) * speed * 0.3 * dt;
          e.y += (targetY - e.y) * speed * 0.3 * dt;
        }
      }
      
      // Keep in bounds
      if (e.x < 10) e.x = 10;
      if (e.x + e.w > W - 10) e.x = W - e.w - 10;
      if (e.y < 30) e.y = 30;
      if (e.y > 180) e.y = 180;
    },
  }));
})(window.GF);
