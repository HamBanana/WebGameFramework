// behaviors/FireOnChance.js — each `interval` sec, roll for a shot.
(function (GF) {
  'use strict';
  GF.behavior('FireOnChance', (cfg) => ({
    onAdd(e) {
      e.data.rollIn = Math.random() * (cfg.interval || 1);
      e.data.reloadIn = 0;
    },
    update(dt, e, world) {
      var dt = (world.scene && world.scene.scaledDt) || dt;
      e.data.reloadIn = Math.max(0, e.data.reloadIn - dt);
      e.data.rollIn -= dt;
      if (e.data.rollIn > 0) return;
      e.data.rollIn = cfg.interval || 1;
      if (Math.random() >= (cfg.chance != null ? cfg.chance : 0.1)) return;
      if (e.data.reloadIn > 0) return;
      e.data.reloadIn = cfg.cooldown || 1.5;
      var shot = world.spawn(cfg.prefab || 'alienShot', 0, e.bottom);
      if (!shot) return;
      shot.x = e.centerX - shot.w / 2;
      shot.vy = cfg.speed || 160;
    },
  }));
})(window.GF);
