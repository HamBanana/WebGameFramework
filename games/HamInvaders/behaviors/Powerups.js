// behaviors/Powerups.js — the carrier's side of the powerup system: which ones
// are active on this entity and for how long. Timed powerups stack (a repeat
// pickup extends the timer, capped at 2x the base duration); instant ones run
// their effect and are never held.
//
// Anything can ask `e.data.powerups[type]`, but the helpers hung on e.data are
// the intended interface — see modules/Combat.js and modules/Hud.js.
(function (GF, G) {
  'use strict';

  GF.behavior('Powerups', () => ({
    onAdd(e) {
      e.data.powerups = {};

      e.data.hasPowerup = (type) => {
        const p = e.data.powerups[type];
        return !!(p && p.timer > 0);
      };
      e.data.powerupCount = (type) => {
        const p = e.data.powerups[type];
        return p ? p.stacks : 0;
      };
      e.data.addPowerup = (type) => {
        const def = (G.powerupTypes || {})[type];
        if (!def) return false;
        if (def.effect) { def.effect(e); return true; }       // instant (e.g. extraLife)

        const duration = def.duration || 10;
        const cur = e.data.powerups[type];
        if (!cur) {
          e.data.powerups[type] = { stacks: 1, timer: duration };
          return true;
        }
        cur.stacks++;
        cur.timer = Math.min(cur.timer + duration * 0.5, duration * 2);
        return false;
      };
    },

    update(dt, e) {
      const held = e.data.powerups;
      for (const type in held) {
        held[type].timer -= dt;
        if (held[type].timer <= 0) delete held[type];
      }
    },
  }));

})(window.GF, window.GAME = window.GAME || {});
