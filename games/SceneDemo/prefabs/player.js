// prefabs/player.js — the entity the editor drops into a scene as "player".
(function (GF) {
  'use strict';
  GF.prefab('player', {
    tags: ['player'], w: 24, h: 24, data: { color: '#ffd24a' },
    behaviors: [['TopdownMove', { speed: 180 }]],
  });
})(window.GF);
