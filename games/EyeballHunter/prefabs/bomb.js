// prefabs/bomb.js — boss projectile.
(function (GF) {
  'use strict';
  GF.prefab('bomb', {
    behaviors: ['BossBomb'],
    h: 16,
    tags: ['bomb'],
    w: 16,
  });
})(window.GF);
