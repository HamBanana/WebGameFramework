// prefabs/wall.js — static scenery, useful for testing layout in the editor.
(function (GF) {
  'use strict';
  GF.prefab('wall', {
    tags: ['wall'], w: 32, h: 32, static: true, data: { color: '#3b4467' },
  });
})(window.GF);
