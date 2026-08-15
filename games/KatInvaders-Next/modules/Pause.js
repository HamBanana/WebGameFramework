// modules/Pause.js — P/Esc/K pauses the run (R2-3).
// The entity world freezes because 'pause' is not in config scenes.Main.
// worldPhases, so bullets/behaviors stop; this module renders the overlay.
(function (GF) {
  'use strict';

  GF.sceneModule('Pause', {
    scene: 'Main',
    order: -50,
    layer: 300,
    phases: ['play', 'boss', 'pause'],

    onPhase(phase) {
      if (phase === 'pause') this._t = 0;
    },

    update(dt, scene, engine) {
      var input = engine.input;
      if (scene.phase === 'pause') {
        this._t = (this._t || 0) + dt;
        if (input.wasPressed('pause') || input.wasPressed('confirm')) {
          scene.setPhase(this._prevPhase || 'play');
        }
      } else if (input.wasPressed('pause')) {
        this._prevPhase = scene.phase; // 'play' or 'boss'
        this._t = 0;
        scene.setPhase('pause');
      }
    },

    render(ctx, scene, engine) {
      if (scene.phase !== 'pause') return;
      var W = engine.config.width, H = engine.config.height;

      ctx.fillStyle = 'rgba(10,10,26,0.72)';
      ctx.fillRect(0, 0, W, H);

      var a = 0.6 + 0.4 * Math.sin((this._t || 0) * 4);
      ctx.save();
      ctx.globalAlpha = a;
      GF.UISystem.drawText(ctx, 'PAUSED', W / 2, H * 0.42, {
        align: 'center', font: 'bold 44px monospace', color: '#ffccff',
        shadow: true, glow: '#ff69b4', glowBlur: 14,
      });
      ctx.restore();

      GF.UISystem.drawText(ctx, 'Press P / ESC to resume', W / 2, H * 0.56, {
        align: 'center', font: '18px monospace', color: '#aaddff',
      });
      GF.UISystem.drawText(ctx, 'SCORE ' + (scene.state.score || 0) + '  •  LEVEL ' + (scene.state.level || 1), W / 2, H * 0.64, {
        align: 'center', font: '14px monospace', color: '#88aacc',
      });
    },
  });
})(window.GF);
