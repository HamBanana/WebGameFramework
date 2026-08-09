// modules/Hud.js — score, high score, lives, level, combo, active powerups.
(function (GF) {
  'use strict';

  var HIGH_SCORE_SLOT = 'highscore';

  GF.sceneModule('Hud', {
    scene: 'Main',
    layer: 100,
    phases: ['play', 'boss'],

    render(ctx, scene, engine) {
      var W = engine.config.width;

      // ── Row 1: score / level / lives ────────────────────────────────────
      GF.UISystem.drawText(ctx, 'SCORE  ' + scene.state.score, 15, 12, {
        font: 'bold 20px monospace', color: '#ffccff', align: 'left', baseline: 'top',
        shadow: true, glow: '#ff66ff', glowBlur: 10,
      });

      GF.UISystem.drawText(ctx, 'LEVEL  ' + scene.state.level, W / 2, 12, {
        font: 'bold 20px monospace', color: '#aaffff', align: 'center', baseline: 'top',
        shadow: true,
      });

      var player = scene.world.first('player');
      var lives = player ? (player.data.lives || 0) : 0;
      for (var i = 0; i < lives; i++) {
        GF.UISystem.drawText(ctx, '♥', W - 20 - i * 25, 12, {
          font: '24px monospace', color: '#ff6699', align: 'right', baseline: 'top',
          shadow: true, glow: '#ff4488', glowBlur: 8,
        });
      }

      // ── Row 2: combo (left) and high score (right) ──────────────────────
      if (scene.state.comboMultiplier > 1) {
        var comboColor = scene.state.comboMultiplier >= 3 ? '#ffcc00' : '#ff8ec4';
        var comboFont  = 'bold 18px monospace';
        var comboText  = 'COMBO x' + scene.state.comboMultiplier.toFixed(1) +
                         '  (' + scene.state.combo + ')';

        // Measure through the canvas context — GF.UISystem has no measureText.
        ctx.save();
        ctx.font = comboFont;
        var comboWidth = ctx.measureText(comboText).width;
        ctx.restore();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(10, 35, comboWidth + 10, 24);

        GF.UISystem.drawText(ctx, comboText, 15, 38, {
          font: comboFont, color: comboColor, align: 'left', baseline: 'top',
          shadow: true, glow: comboColor, glowBlur: 8,
        });
      }

      var high = this.highScore();
      if (high > 0) {
        GF.UISystem.drawText(ctx, 'HIGH  ' + high, W - 15, 40, {
          font: '15px monospace', color: '#ffcc00', align: 'right', baseline: 'top',
          shadow: true,
        });
      }

      // ── Row 3: active powerups, laid out left to right ──────────────────
      if (player && player.data.powerups) {
        var pwrCfg = (GF.GAME_CONFIG && GF.GAME_CONFIG.powerups) || {};
        var types = pwrCfg.types || [];
        var px = 15;
        for (var j = 0; j < types.length; j++) {
          var type = types[j];
          var left = player.data.powerups[type.type];
          if (!left || left <= 0) continue;

          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(px - 5, 62, 65, 22);

          GF.UISystem.drawText(ctx, type.icon + ' ' + Math.ceil(left) + 's', px, 64, {
            font: 'bold 14px monospace', color: type.color, align: 'left', baseline: 'top',
            shadow: true, glow: type.color, glowBlur: 6,
          });
          px += 70;
        }
      }
    },

    highScore() {
      var save = GF.game && GF.game.save;
      if (!save) return 0;
      var record = save.read(HIGH_SCORE_SLOT);
      return (record && record.data && record.data.highScore) || 0;
    },
  });
})(window.GF);
