// prefabs/player.js — the kawaii cat-girl ship.
(function (GF) {
  'use strict';
  GF.prefab('player', {
    tags: ['player'], w: 36, h: 22, sprite: 'playerShip',
    behaviors: [
      ['PlayerMove', { speed: 240, margin: 4 }],
      'PlayerFire',
      'PowerupCollect',
    ],
  });
})(window.GF);
