// prefabs/shot.js — all projectiles.
(function (GF) {
  'use strict';
  GF.prefab('playerBullet', {
    tags: ['shot'], w: 4, h: 12, sprite: 'playerBullet',
    vy: -480,
    behaviors: ['CullOffscreen'],
  });

  GF.prefab('megaLaser', {
    tags: ['shot'], w: 8, h: 16, sprite: 'megaLaserBullet',
    vy: -520,
    behaviors: ['CullOffscreen'],
  });

  GF.prefab('alienShot', {
    tags: ['alienShot'], w: 4, h: 12, sprite: 'alienBullet',
    vy: 160,
    behaviors: ['CullOffscreen'],
  });

  GF.prefab('bossShot', {
    tags: ['bossShot'], w: 8, h: 12, sprite: 'bossBullet',
    vy: 180,
    behaviors: ['CullOffscreen'],
  });
})(window.GF);
