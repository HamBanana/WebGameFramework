// behaviors/Bob.js — gentle vertical wobble.
(function (GF) {
  'use strict';
  GF.behavior('Bob', (cfg) => ({
    onAdd(e) {
      e.data.bobT = cfg.phase != null ? cfg.phase : Math.random() * Math.PI * 2;
      e.data.bobApplied = 0;
    },
    update(dt, e, world) {
      var dt = (world && world.scene && world.scene.scaledDt) || dt;
      e.y -= e.data.bobApplied;
      e.data.bobT += dt * (cfg.speed || 4);
      e.data.bobApplied = Math.sin(e.data.bobT) * (cfg.amp || 3);
      e.y += e.data.bobApplied;
    },
  }));
})(window.GF);
