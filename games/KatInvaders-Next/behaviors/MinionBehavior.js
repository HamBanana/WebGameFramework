// behaviors/MinionBehavior.js — boss minions dive-bomb the player.
// Only one minion dives every 5 seconds, targeting player's position at start.
(function (GF) {
  'use strict';
  
  GF.behavior('MinionBehavior', (cfg) => ({
    onAdd(e) {
      e.data.phase = 'dive';
      e.data.targetX = null;
      e.data.targetY = null;
      e.data.diveCooldown = (cfg.diveCooldown !== undefined) ? cfg.diveCooldown : 5;
      e.data.speed = cfg.speed || 120;
      
      // Record player position at start of dive (not continuously chasing)
      var player = e.world.first('player');
      if (player) {
        e.data.targetX = player.x + player.w / 2;
        e.data.targetY = player.y;
      }
    },
    update(dt, e, world) {
      var dt = (world.scene && world.scene.scaledDt) || dt;
      
      if (e.data.phase === 'dive') {
        // Use stored target position from when dive started
        var targetX = e.data.targetX;
        var targetY = e.data.targetY;
        
        if (targetX !== null && targetY !== null) {
          // Move toward stored target position
          var dx = (targetX - e.centerX);
          var dy = (targetY - e.centerY);
          var dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist > 0) {
            var speed = e.data.speed;
            e.x += (dx / dist) * speed * dt;
            e.y += (dy / dist) * speed * dt;
            
            // Slight tracking toward current player position for better feel
            var player = world.first('player');
            if (player) {
              e.x += (player.x - e.x) * 0.3 * dt;
            }
          }
        }
        
        if (e.y > world.engine.config.height + 30) {
          e.destroy();
        }
      }
    },
  }));
})(window.GF);
