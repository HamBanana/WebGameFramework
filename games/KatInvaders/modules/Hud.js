// modules/Hud.js — score, lives, level, combo.
(function (GF) {
  'use strict';
  GF.sceneModule('Hud', {
    scene: 'Main',
    layer: 100,
    phases: ['play', 'boss'],

    render(ctx, scene, engine) {
      var W = engine.config.width;
      var style = { font: '20px monospace', color: '#ffffff', align: 'left', baseline: 'top' };

      GF.UISystem.drawText(ctx, 'SCORE  ' + scene.state.score, 12, 12, style);
      GF.UISystem.drawText(ctx, 'LEVEL  ' + scene.state.level, W / 2 - 40, 12, style);

      var player = scene.world.first('player');
      var lives = player ? (player.data.lives || 0) : 0;
      var livesStr = '';
      for (var i = 0; i < lives; i++) livesStr += '♥ ';
      GF.UISystem.drawText(ctx, livesStr, W - 120, 12, { font: '18px monospace', color: '#ff6699', align: 'left', baseline: 'top' });

      // Combo multiplier
      if (scene.state.comboMultiplier > 1) {
        var comboColor = scene.state.comboMultiplier >= 3 ? '#ffcc00' : '#ff8ec4';
        GF.UISystem.drawText(ctx, 'COMBO x' + scene.state.comboMultiplier.toFixed(1), 12, 38,
          { font: '16px monospace', color: comboColor, align: 'left', baseline: 'top' });
      }

      // Active powerups
      if (player && player.data.powerups) {
        var px = 12;
        var pwrCfg = (GF.GAME_CONFIG && GF.GAME_CONFIG.powerups) || {};
        var types = pwrCfg.types || [];
        for (var j = 0; j < types.length; j++) {
          var t = types[j];
          if (player.data.powerups[t.type] && player.data.powerups[t.type] > 0) {
            var remaining = Math.ceil(player.data.powerups[t.type]);
            GF.UISystem.drawText(ctx, t.icon + ' ' + remaining + 's', px, 58,
              { font: '14px monospace', color: t.color, align: 'left', baseline: 'top' });
            px += 70;
          }
        }
      }
    },
  });
})(window.GF);
