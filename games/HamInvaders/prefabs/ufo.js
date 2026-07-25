// prefabs/ufo.js — the bonus saucer. modules/Ufo.js sets vx and the edge it
// enters from; drifting off-screen is handled by CullOffscreen.
(function (GF) {
  'use strict';
  GF.prefab('ufo', {
    tags: ['ufo'], w: 48, h: 20, sprite: 'ufo',
    behaviors: [['CullOffscreen', { margin: 64 }]],
  });
})(window.GF);
