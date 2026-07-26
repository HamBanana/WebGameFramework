// behaviors/BossGun.js — the mothership's weapon.
//
// Fires timed volleys of the existing `invaderShot` prefab, so every shot it
// produces already collides with the player through modules/Combat.js — no new
// collision rule needed. Cadence and spread tighten as its HP drops.
(function (GF) {
  'use strict';

  GF.behavior('BossGun', (cfg) => ({
    onAdd(e) {
      // Stagger the opening shot so a level with several gunners doesn't fire
      // everything on the same frame.
      e.data.gunT = (cfg.delay || 0) + Math.random() * (cfg.jitter || 0.6);
    },

    update(dt, e, world) {
      e.data.gunT -= dt;
      if (e.data.gunT > 0) return;

      const hp = e.data.hp != null ? e.data.hp : 1;
      const max = e.data.maxHp || hp || 1;
      const hurt = 1 - Math.max(0, Math.min(1, hp / max));

      // Interval shrinks toward `minInterval` as it takes damage.
      const slow = cfg.interval || 1.6;
      const fast = cfg.minInterval || 0.55;
      e.data.gunT = slow - (slow - fast) * hurt;

      const shots = (cfg.shots || 3) + (hurt > 0.6 ? (cfg.rageShots || 2) : 0);
      const spread = cfg.spread || 26;
      const speed = cfg.speed || 210;
      const mid = (shots - 1) / 2;

      for (let i = 0; i < shots; i++) {
        const s = world.spawn('invaderShot', 0, e.bottom - 4);
        if (!s) continue;
        s.x = e.centerX + (i - mid) * spread - s.w / 2;
        s.vy = speed;
        // Fan the outer shots outward once it is badly hurt.
        if (cfg.fan) s.vx = (i - mid) * cfg.fan * (0.4 + hurt);
      }
    },
  }));

})(window.GF);
