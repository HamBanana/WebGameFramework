// prefabs/orb.js — collectible; the scene JSON decides where they go.
(function (GF) {
  'use strict';
  GF.prefab('orb', {
    tags: ['orb'], w: 14, h: 14, data: { color: '#4fe0c0' },
    behaviors: [['Bob', { amp: 4, speed: 3 }]],
  });
})(window.GF);
