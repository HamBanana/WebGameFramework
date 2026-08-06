// modules/GameOver.js — end-of-run screen.
(function (GF) {
  'use strict';
  GF.sceneModule('GameOver', {
    scene: 'Main',
    order: 20,
    layer: 200,
    phases: ['over'],

    onPhase(phase) { if (phase === 'over') this.elapsed = 0; },

    update(dt, scene, engine) {
      this.elapsed = (this.elapsed || 0) + dt;
      if (this.elapsed > 0.5 && engine.input.wasPressed('confirm')) {
        var sm = engine.getSystem('SceneManager');
        sm.replace(window.GAME.scenes.TitleScene(), engine);
      }
    },

    render(ctx, scene, engine) {
      var W = engine.config.width;
      var H = engine.config.height;
      var cx = W / 2;

      ctx.fillStyle = 'rgba(10,10,26,0.85)';
      ctx.fillRect(0, 0, W, H);

      var title = scene.state.won ? 'YOU WIN!' : 'GAME OVER';
      var titleColor = scene.state.won ? '#55ff77' : '#ff4488';

      GF.UISystem.drawText(ctx, title, cx, H * 0.35, {
        align: 'center', font: 'bold 48px monospace', color: titleColor,
        shadow: true, glow: titleColor, glowBlur: 16,
      });

      GF.UISystem.drawText(ctx, 'Final Score: ' + scene.state.score, cx, H * 0.52,
        { align: 'center', font: '24px monospace', color: '#ffffff' });

      GF.UISystem.drawText(ctx, 'Levels Cleared: ' + (scene.state.level - 1), cx, H * 0.60,
        { align: 'center', font: '20px monospace', color: '#88aacc' });

      var alpha = 0.55 + 0.45 * Math.sin((this.elapsed || 0) * 4);
      ctx.save();
      ctx.globalAlpha = alpha;
      GF.UISystem.drawText(ctx, 'Press SPACE to Continue', cx, H * 0.78,
        { align: 'center', font: '20px monospace', color: '#ffeb3b' });
      ctx.restore();
    },
  });
})(window.GF);
