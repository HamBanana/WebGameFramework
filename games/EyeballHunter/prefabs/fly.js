// prefabs/fly.js — flying enemy prefab.
(function (GF) {
  'use strict';

  GF.prefab('fly', {
    "behaviors": ["FlyPatrol"],
    "data": { "color": "#6a5a8a" },
    "h": 24,
    "tags": ["enemy", "fly"],
    "w": 24
  });

})(window.GF);
