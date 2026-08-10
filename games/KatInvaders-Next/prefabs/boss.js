// prefabs/boss.js — bosses and minions.
(function (GF) {
  'use strict';
  GF.prefab('bossMothership', {
    tags: ['boss'], w: 96, h: 56, sprite: 'bossMothership',
    data: { hp: 100, maxHp: 100 },
    behaviors: ['BossMove', 'BossGun'],
  });

  GF.prefab('bossStarDestroyer', {
    tags: ['boss'], w: 100, h: 60, sprite: 'bossStarDestroyer',
    data: { hp: 150, maxHp: 150 },
    behaviors: ['BossHover', 'BossGun'],
  });

  GF.prefab('bossCrimsonReaper', {
    tags: ['boss'], w: 90, h: 50, sprite: 'bossCrimsonReaper',
    data: { hp: 180, maxHp: 180 },
    behaviors: ['BossAggressive', 'BossGun'],
  });

  GF.prefab('bossVoidHydra', {
    tags: ['boss'], w: 95, h: 55, sprite: 'bossVoidHydra',
    data: { hp: 200, maxHp: 200 },
    behaviors: ['BossCircle', 'BossGun'],
  });

  GF.prefab('bossGalaxyDevourer', {
    tags: ['boss'], w: 110, h: 65, sprite: 'bossGalaxyDevourer',
    data: { hp: 250, maxHp: 250 },
    behaviors: ['BossComplex', 'BossGun'],
  });

  GF.prefab('bossMinion', {
    tags: ['bossMinion'], w: 24, h: 18, sprite: 'bossMinion',
    behaviors: ['MinionBehavior', 'CullOffscreen', ['FireOnChance', {
      prefab: 'bossShot', chance: 0.05, interval: 0.5, cooldown: 0.8, speed: 200,
    }]],
  });
})(window.GF);
