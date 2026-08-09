// prefabs/alien.js — one marching alien. Tier 0=cat, 1=dog, 2=mouse.
(function (GF) {
  'use strict';
  GF.prefab('alienCat', {
    tags: ['alien'], w: 32, h: 24, sprite: 'alienCat',
    data: { tier: 0, row: 0 },
    behaviors: ['Bob', 'FormationMove', ['FireOnChance', {
      prefab: 'alienShot', chance: 0.002, interval: 1, cooldown: 1.0, speed: 160,
    }]],
  });

  GF.prefab('alienDog', {
    tags: ['alien'], w: 32, h: 24, sprite: 'alienDog',
    data: { tier: 1, row: 0 },
    behaviors: ['Bob', 'FormationMove', ['FireOnChance', {
      prefab: 'alienShot', chance: 0.002, interval: 1, cooldown: 1.2, speed: 160,
    }]],
  });

  GF.prefab('alienMouse', {
    tags: ['alien'], w: 32, h: 24, sprite: 'alienMouse',
    data: { tier: 2, row: 0 },
    behaviors: ['Bob', 'FormationMove', ['FireOnChance', {
      prefab: 'alienShot', chance: 0.002, interval: 1, cooldown: 1.4, speed: 160,
    }]],
  });
})(window.GF);
