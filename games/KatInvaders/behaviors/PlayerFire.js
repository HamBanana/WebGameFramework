// behaviors/PlayerFire.js — player shooting with powerup patterns.
(function (GF) {
  'use strict';
  GF.behavior('PlayerFire', (cfg) => ({
    onAdd(e) {
      e.data.fireTimer = 0;
      e.data.rapidFire = false;
      e.data.doubleShot = false;
      e.data.megaLaser = false;
    },
    update(dt, e, world) {
      var dt = (world.scene && world.scene.scaledDt) || dt;
      var inp = world.engine && world.engine.input;
      if (!inp || !inp.isDown('fire')) return;

      var rate = e.data.rapidFire ? 0.10 : (cfg.fireRate || 0.28);
      e.data.fireTimer += dt;
      if (e.data.fireTimer < rate) return;
      e.data.fireTimer = 0;

      var my = e.y - 12;
      var mx = e.centerX;
      var speed = -(cfg.bulletSpeed || 480);

      if (e.data.megaLaser) {
        // Mega laser: wide beams
        for (var i = -1; i <= 1; i++) {
          var shot = world.spawn('megaLaser', 0, my);
          if (!shot) continue;
          shot.x = mx - shot.w / 2 + i * 10;
          shot.vy = speed;
        }
      } else if (e.data.doubleShot) {
        // Double shot: two parallel beams
        for (var j = -1; j <= 1; j += 2) {
          var shot2 = world.spawn('playerBullet', 0, my);
          if (!shot2) continue;
          shot2.x = mx - shot2.w / 2 + j * 8;
          shot2.vy = speed;
        }
      } else {
        // Single shot
        var shot3 = world.spawn('playerBullet', 0, my);
        if (shot3) {
          shot3.x = mx - shot3.w / 2;
          shot3.vy = speed;
        }
      }
    },
  }));
})(window.GF);
