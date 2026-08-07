// modules/Combo.js — combo multiplier countdown.
(function (GF) {
  'use strict';
  GF.sceneModule('Combo', {
    scene: 'Main',
    order: 3,
    phases: ['play', 'boss'],

    update(dt, scene) {
      var dt = scene.scaledDt || dt;
      var state = scene.state;
      if (state.comboTimer > 0) {
        state.comboTimer -= dt;
        if (state.comboTimer <= 0) {
          state.comboTimer = 0;
          state.combo = 0;
          state.comboMultiplier = 1;
        }
      }
    },
  });
})(window.GF);
