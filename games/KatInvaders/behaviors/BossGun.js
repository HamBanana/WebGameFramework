// behaviors/BossGun.js — boss fires downward at a rate.
(function (GF) {
  'use strict';
  GF.behavior('BossGun', (cfg) => ({
    onAdd(e) {
      e.data.timer = 0;
      e.data.interval = 1 / (cfg.fireRate || 0.03);
    },
    update(dt, e, world) {
      e.data.timer += dt;
      if (e.data.timer >= e.data.interval) {
        e.data.timer = 0;
        var shot = world.spawn('bossShot', 0, e.bottom);
        if (!shot) return;
        shot.x = e.centerX - shot.w / 2;
        shot.vy = cfg.bulletSpeed || 180;
      }
    },
  }));
})(window.GF);
