// behaviors/BossMove.js — the mothership's sweep.
//
// Bounces between two margins instead of using Formation's edge-and-drop march,
// because the boss owns the field alone and should never descend into the
// player. Speed scales with damage taken, so the fight tightens as it goes.
(function (GF) {
  'use strict';

  GF.behavior('BossMove', (cfg) => ({
    onAdd(e) {
      e.data.dir = cfg.dir || 1;
      e.data.baseY = e.y;
      e.data.swayT = 0;
    },

    update(dt, e, world) {
      const engine = world.engine;
      if (!engine) return;

      const margin = cfg.margin != null ? cfg.margin : 20;
      const W = engine.config.width;

      // Wounded means faster: 1x at full HP up to `rage` at the last sliver.
      const hp = e.data.hp != null ? e.data.hp : 1;
      const max = e.data.maxHp || hp || 1;
      const hurt = 1 - Math.max(0, Math.min(1, hp / max));
      const speed = (cfg.speed || 70) * (1 + hurt * ((cfg.rage || 2) - 1));

      e.x += speed * e.data.dir * dt;

      if (e.x <= margin) { e.x = margin; e.data.dir = 1; }
      else if (e.right >= W - margin) { e.x = W - margin - e.w; e.data.dir = -1; }

      // A slow vertical sway keeps it from reading as a sprite on rails.
      if (cfg.sway) {
        e.data.swayT += dt * (cfg.swaySpeed || 1.2);
        e.y = e.data.baseY + Math.sin(e.data.swayT) * cfg.sway;
      }
    },
  }));

})(window.GF);
