// prefabs/eyeball.js — thrown eyeball projectile prefab.
(function (GF) {
  'use strict';

  GF.prefab('eyeball', {
    "behaviors": ["EyeballProjectile"],
    "data": { "color": "#ffffff" },
    "h": 16,
    "tags": ["eyeball", "projectile"],
    "w": 16
  });

})(window.GF);
