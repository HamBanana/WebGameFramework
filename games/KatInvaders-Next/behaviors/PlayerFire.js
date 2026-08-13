// behaviors/PlayerFire.js — player shooting with powerup patterns.
(function (GF) {
  'use strict';
  GF.behavior('PlayerFire', (cfg) => ({
    onAdd(e) {
      e.data.fireTimer = 0;
      e.data.rapidFire = false;
      e.data.weaponMode = 'single';
      e.data.baseFireRate = cfg.fireRate || 0.28;
    },
    update(dt, e, world) {
      var dt = (world.scene && world.scene.scaledDt) || dt;
      var inp = world.engine && world.engine.input;
      if (!inp || !inp.isDown('fire')) return;

      // Determine fire rate based on rapid fire status
      var rate = e.data.rapidFire ? 0.10 : e.data.baseFireRate;
      e.data.fireTimer += dt;
      if (e.data.fireTimer < rate) return;
      e.data.fireTimer = 0;

      var my = e.y - 12;
      var mx = e.centerX;
      var speed = -(cfg.bulletSpeed || 480);

      // Derive weapon mode from active powerup flags (takes priority over stored mode)
      var weaponMode = 'single';
      if (e.data.megaLaser) weaponMode = 'mega';
      else if (e.data.tripleShot) weaponMode = 'triple';
      else if (e.data.spreadShot) weaponMode = 'spread';
      else if (e.data.doubleShot) weaponMode = 'double';
      else weaponMode = e.data.weaponMode || 'single';
      
      if (weaponMode === 'mega') {
        // Mega laser: wide beams
        for (var i = -1; i <= 1; i++) {
          var shot = world.spawn('megaLaser', 0, my);
          if (!shot) continue;
          shot.x = mx - shot.w / 2 + i * 10;
          shot.vy = speed;
        }
      } else if (weaponMode === 'triple') {
        // Triple shot: three parallel beams
        for (var j = -1; j <= 1; j++) {
          var shot = world.spawn('playerBullet', 0, my);
          if (!shot) continue;
          shot.x = mx - shot.w / 2 + j * 10;
          shot.vy = speed;
        }
      } else if (weaponMode === 'spread') {
        // Spread shot: cone of bullets
        for (var k = -2; k <= 2; k++) {
          var shot = world.spawn('playerBullet', 0, my);
          if (!shot) continue;
          shot.x = mx - shot.w / 2 + k * 8;
          shot.vy = speed;
          // Add slight horizontal movement for spread
          shot.vx = k * 50;
        }
      } else if (weaponMode === 'double') {
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
