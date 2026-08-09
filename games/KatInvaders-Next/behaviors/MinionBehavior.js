// behaviors/MinionBehavior.js — boss minions dive-bomb the player.
(function (GF) {
  'use strict';
  GF.behavior('MinionBehavior', (cfg) => ({
    onAdd(e) {
      e.data.phase = 'dive';
      e.data.timer = 0;
    },
    update(dt, e, world) {
      var dt = (world.scene && world.scene.scaledDt) || dt;
      var player = world.first('player');
      if (!player) return;

      if (e.data.phase === 'dive') {
        // Move toward player
        var dx = (player.centerX - e.centerX) * 1.5;
        var dy = (player.y - e.centerY) * 1.5;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          e.x += (dx / dist) * (cfg.speed || 120) * dt;
          e.y += (dy / dist) * (cfg.speed || 120) * dt;
        }
        if (e.y > world.engine.config.height + 30) {
          e.destroy();
        }
      }
    },
  }));
})(window.GF);
