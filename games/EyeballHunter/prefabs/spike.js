// prefabs/spike.js — deadly ground spikes.
(function (GF) {
  'use strict';
  GF.prefab('spike', {
    behaviors: ['SpikeDraw'],
    h: 18,
    tags: ['spike'],
    w: 60,
  });
})(window.GF);
