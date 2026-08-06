// prefabs/bunker.js — destructible bunker segments.
(function (GF) {
  'use strict';
  GF.prefab('bunker', {
    tags: ['bunker'], w: 48, h: 36, sprite: null,
    data: { health: 8, maxHealth: 8 },
    static: true,
  });
})(window.GF);
