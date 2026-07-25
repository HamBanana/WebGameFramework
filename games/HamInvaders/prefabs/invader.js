// prefabs/invader.js — one marching invader. `tier` (0..2) is set per row by
// modules/Waves.js and picks the sprite, score value and firing cadence.
(function (GF) {
  'use strict';
  GF.prefab('invader', {
    tags: ['invader'], w: 32, h: 24, sprite: 'invader0',
    data: { tier: 0 },
    behaviors: [
      // Phase is assigned per grid cell by modules/Waves.js, so the block
      // ripples as one body rather than 40 independent wobbles.
      ['Bob', { amp: 3, speed: 4 }],
      ['FireOnChance', {
        prefab: 'invaderShot',
        chance: 0.1,          // 10% per roll…
        interval: 1,          // …one roll per second
        cooldown: 1.5,        // floor between shots, minus 0.3 per tier
        speed: 200,
      }],
    ],
  });
})(window.GF);
