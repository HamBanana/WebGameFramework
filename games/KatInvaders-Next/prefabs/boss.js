// prefabs/boss.js — mothership and minions.
(function (GF) {
  'use strict';
  GF.prefab('bossMothership', {
    tags: ['boss'], w: 96, h: 56, sprite: 'bossMothership',
    data: { hp: 80, maxHp: 80 },
    behaviors: ['BossMove', 'BossGun'],
  });

  GF.prefab('bossMinion', {
    tags: ['bossMinion'], w: 24, h: 18, sprite: 'bossMinion',
    behaviors: ['MinionBehavior', 'CullOffscreen', ['FireOnChance', {
      prefab: 'bossShot', chance: 0.05, interval: 0.5, cooldown: 0.8, speed: 200,
    }]],
  });
})(window.GF);
