// modules/Combo.js — combo multiplier countdown and decay.
(function (GF) {
  'use strict';
  GF.sceneModule('Combo', {
    scene: 'Main',
    order: 3,
    phases: ['play', 'boss'],

    update(dt, scene) {
      var step  = scene.scaledDt || dt;
      var state = scene.state;
      var cfg   = (GF.GAME_CONFIG && GF.GAME_CONFIG.combo) || {};

      if (state.comboTimer > 0) {
        state.comboTimer -= step;
        if (state.comboTimer <= 0) {
          // Window closed: shed part of the streak rather than dropping it
          // outright, and reopen the window while anything is left.
          var decay = cfg.decay != null ? cfg.decay : 0.8;
          state.combo = Math.floor((state.combo || 0) * decay);

          if (state.combo < 3) {
            state.comboTimer = 0;
            state.combo = 0;
            state.comboMultiplier = 1;
          } else {
            state.comboTimer = cfg.window || 2;
            var maxMult = cfg.maxMultiplier || 5;
            var perKill = cfg.perKill || 0.1;
            state.comboMultiplier = 1 + Math.min(state.combo * perKill, maxMult - 1);
          }
        }
      }

      // Highest multiplier this run — read back by the combo_master achievement,
      // which would otherwise always see the post-reset value of 1.
      var mult = state.comboMultiplier || 1;
      if (mult > (state.comboMultiplierMax || 1)) state.comboMultiplierMax = mult;
    },
  });
})(window.GF);
