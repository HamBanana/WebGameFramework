// prefabs/powerup.js — falling pickup.
(function (GF) {
  'use strict';
  GF.prefab('powerup', {
    tags: ['powerup'], w: 20, h: 20, sprite: 'powerupRapidFire',
    vy: 80,
    data: { type: 'rapidFire' },
    behaviors: ['Bob', 'CullOffscreen'],
  });
})(window.GF);
