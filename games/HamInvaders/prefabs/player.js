// prefabs/player.js — the ham ship.
(function (GF) {
  'use strict';
  GF.prefab('player', {
    tags: ['player'], w: 40, h: 24, sprite: 'hamShip',
    data: { lives: 3 },
    behaviors: [
      ['PlayerMove', { speed: 300, margin: 4 }],
      'Powerups',
      'ShipAura',
    ],
  });
})(window.GF);
