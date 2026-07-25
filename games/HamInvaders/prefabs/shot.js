// prefabs/shot.js — projectiles. `kind` selects the player-shot art; the
// invaders' return fire is its own prefab because it moves the other way and
// collides against a different tag.
(function (GF) {
  'use strict';

  GF.prefab('shot', {
    tags: ['shot'], w: 4, h: 12, sprite: 'shot',
    vy: -400,
    behaviors: ['CullOffscreen'],
  });

  GF.prefab('invaderShot', {
    tags: ['invaderShot'], w: 4, h: 10, sprite: 'invaderShot',
    vy: 200,
    behaviors: ['CullOffscreen'],
  });
})(window.GF);
