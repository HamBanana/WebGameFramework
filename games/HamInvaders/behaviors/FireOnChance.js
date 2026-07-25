// behaviors/FireOnChance.js — "each second, roll for a shot".
//
// Every `interval` seconds the entity rolls once against `chance`; only on a
// win does it spawn `prefab` below itself. `cooldown` is a floor on the gap
// between shots, so back-to-back winning rolls can't double-tap.
//
// This is the whole attack rule in one place. The old version split it across
// an updateAttack() that rolled but threw the bullet away, a shouldFire() that
// only checked the cooldown, and a scene loop that called fire() directly —
// so the roll never gated anything and the invaders fired every cooldown.
(function (GF) {
  'use strict';

  GF.behavior('FireOnChance', (cfg) => ({
    onAdd(e) {
      // Stagger the first roll so the whole formation doesn't roll in lockstep.
      e.data.rollIn   = Math.random() * (cfg.interval || 1);
      e.data.reloadIn = 0;
    },

    update(dt, e, world) {
      e.data.reloadIn = Math.max(0, e.data.reloadIn - dt);
      e.data.rollIn -= dt;
      if (e.data.rollIn > 0) return;

      e.data.rollIn = cfg.interval || 1;
      if (Math.random() >= (cfg.chance != null ? cfg.chance : 0.1)) return;
      if (e.data.reloadIn > 0) return;

      const tier = e.data.tier || 0;
      e.data.reloadIn = (cfg.cooldown || 1.5) - tier * (cfg.cooldownPerTier || 0.3);

      const shot = world.spawn(cfg.prefab || 'invaderShot', 0, e.bottom);
      if (!shot) return;
      shot.x = e.centerX - shot.w / 2;
      shot.vy = (cfg.speed || 200) + tier * (cfg.speedPerTier || 40);
    },
  }));

})(window.GF);
