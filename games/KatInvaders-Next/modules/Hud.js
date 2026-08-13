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
      });

      GF.UISystem.drawText(ctx, 'LEVEL  ' + scene.state.level, W / 2, 12, {
        font: 'bold 20px monospace', color: '#aaffff', align: 'center', baseline: 'top',
      });

      var player = scene.world.first('player');
      var lives = player ? (player.data.lives || 0) : 0;
      ctx.fillStyle = '#ff6699';
      for (var i = 0; i < lives; i++) {
        ctx.font = '24px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('♥', W - 20 - i * 25, 12);
      }

      // ── Row 2: combo (left) and high score (right) ──────────────────────
      if (scene.state.comboMultiplier > 1) {
        var comboColor = scene.state.comboMultiplier >= 3 ? '#ffcc00' : '#ff8ec4';
        var comboFont  = 'bold 18px monospace';
        var comboText  = 'COMBO x' + scene.state.comboMultiplier.toFixed(1) +
                         '  (' + scene.state.combo + ')';

        ctx.font = comboFont;
        var comboWidth = ctx.measureText(comboText).width;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(10, 35, comboWidth + 10, 24);

        ctx.fillStyle = comboColor;
        ctx.font = comboFont;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(comboText, 15, 38);
      }

      var high = this.highScore();
      if (high > 0) {
        ctx.fillStyle = '#ffcc00';
        ctx.font = '15px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('HIGH  ' + high, W - 15, 40);
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

          ctx.fillStyle = type.color;
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(type.icon + ' ' + Math.ceil(left) + 's', px, 64);
          px += 70;
        }
      }

      // Level transition overlay (cool flash + text)
      var trans = scene._levelTransition;
      if (trans) {
        var p = Math.min(1, trans.progress);
        var W = engine.config.width;
        var H = engine.config.height;
        // White flash out
        ctx.fillStyle = 'rgba(255,255,255,' + Math.max(0, 1 - p * 1.5) + ')';
        ctx.fillRect(0, 0, W, H);
        // Dark vignette in
        var grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)*0.7);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,' + (p * 0.85) + ')');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        // Level up text
        if (p > 0.3) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, (p - 0.3) * 2);
          ctx.fillStyle = '#ffccff';
          ctx.font = 'bold 56px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = '#ff69b4';
          ctx.shadowBlur = 30;
          ctx.fillText('LEVEL ' + scene.state.level, W/2, H/2 - 20);
          ctx.font = '24px monospace';
          ctx.fillStyle = '#aaffff';
          ctx.fillText('Get Ready!', W/2, H/2 + 40);
          ctx.restore();
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
