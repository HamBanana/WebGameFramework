// prefabs/boss.js — the many-eyed final boss.
(function (GF) {
  'use strict';
  GF.prefab('boss', {
    behaviors: ['BossAI'],
    h: 90,
    tags: ['enemy', 'boss'],
    w: 90,
  });
})(window.GF);
