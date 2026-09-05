// prefabs/powerup.js — floating collectible powerups.
(function (GF) {
  'use strict';
  GF.prefab('powerup', {
    behaviors: ['PowerupFloat'],
    h: 24,
    tags: ['powerup'],
    w: 24,
  });
})(window.GF);
