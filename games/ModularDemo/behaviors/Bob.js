// behaviors/Bob.js — reusable per-entity behavior.
(function (GF) {
  'use strict';
  GF.behavior('Bob', (cfg) => ({
onAdd(e){ e.data.baseY = e.y; e.data.t = 0; },
    update(dt, e){ e.data.t += dt*(cfg.speed||3); e.y = e.data.baseY + Math.sin(e.data.t)*(cfg.amp||4); }
  }));
})(window.GF);
