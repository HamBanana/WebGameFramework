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
      e.data.tripleShot = false;
      e.data.spreadShot = false;
      e.data.shield = false;
      e.data.megaLaser = false;
      e.data.slowMo = false;
    },
    update(dt, e, world) {
      var scene = world && world.scene;
      var types = ['rapidFire', 'doubleShot', 'tripleShot', 'spreadShot', 'shield', 'megaLaser', 'invincible', 'slowMo'];
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
      // Slow motion handling via timeScale
      var hasSlowMo = e.data.powerups.slowMo && e.data.powerups.slowMo > 0;
      if (hasSlowMo) {
        if (scene && scene.timeScale !== 0.5) {
          scene._slowMoBase = scene.timeScale != null ? scene.timeScale : 1;
          scene.timeScale = 0.5;
        }
        e.data.slowMo = true;
      } else {
        if (scene && scene.timeScale === 0.5) {
          scene.timeScale = scene._slowMoBase != null ? scene._slowMoBase : 1;
          scene._slowMoBase = null;
        }
        e.data.slowMo = false;
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
