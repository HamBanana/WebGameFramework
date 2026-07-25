// prefabs/powerup.js — a falling pickup. modules/Powerups.js picks the type and
// points `sprite` at the matching generated art.
(function (GF) {
  'use strict';
  GF.prefab('powerup', {
    tags: ['powerup'], w: 24, h: 24, sprite: 'powerup_shield',
    vy: 80,
    data: { type: 'shield' },
    behaviors: [
      ['Bob', { amp: 3, speed: 5 }],
      'CullOffscreen',
    ],
  });
})(window.GF);
