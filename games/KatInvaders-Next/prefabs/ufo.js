// prefabs/ufo.js — mystery cat toy that flies across the top.
(function (GF) {
  'use strict';
  GF.prefab('ufo', {
    tags: ['ufo'], w: 40, h: 18, sprite: 'alienUFO',
    behaviors: ['CullOffscreen'],
  });
})(window.GF);
