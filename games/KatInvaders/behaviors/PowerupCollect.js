// behaviors/PowerupCollect.js — tracks player powerup state.
// Collision with powerups is handled in modules/Combat.js.
(function (GF) {
  'use strict';
  GF.behavior('PowerupCollect', (cfg) => ({
    onAdd(e) {
      e.data.lives = 3;
      e.data.powerups = {};
      e.data.invincible = false;
      e.data.invincibleTimer = 0;
      e.data.bombPending = 0;
      e.data.rapidFire = false;
      e.data.doubleShot = false;
      e.data.shield = false;
      e.data.megaLaser = false;
      e.data.invincible = false;
    },
    update(dt, e) {
      var types = ['rapidFire', 'doubleShot', 'shield', 'megaLaser', 'invincible'];
      for (var i = 0; i < types.length; i++) {
        var t = types[i];
        if (e.data.powerups[t] && e.data.powerups[t] > 0) {
          e.data.powerups[t] -= dt;
          if (e.data.powerups[t] <= 0) {
            e.data.powerups[t] = 0;
            e.data[t] = false;
          }
        }
      }
      if (e.data.invincible) {
        e.data.invincibleTimer -= dt;
        if (e.data.invincibleTimer <= 0) {
          e.data.invincible = false;
        }
      }
    },
  }));
})(window.GF);
