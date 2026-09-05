// prefabs/spider.js — patrolling enemy carrying one eyeball.
(function (GF) {
  'use strict';
  GF.prefab('spider', {
    behaviors: ['EnemyPatrol'],
    h: 28,
    tags: ['enemy'],
    w: 32,
  });
})(window.GF);
