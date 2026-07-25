// modules/GameOver.js — the end-of-run screen.
//
// Only runs in the 'over' phase, which is the whole reason the play-phase
// modules (Formation, Combat, Ufo, Hud) don't need an `if (phase === 'play')`
// guard of their own.
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
      // Brief lockout so the shot that ended the run doesn't skip the screen.
      if (this.elapsed > 0.5 && engine.input.wasPressed('confirm')) scene.pop();
    },

    render(ctx, scene, engine) {
      const W = engine.config.width;
      const H = engine.config.height;
      const cx = W / 2;

      ctx.fillStyle = scene.config.background || '#1a1a2e';
      ctx.fillRect(0, 0, W, H);

      GF.UISystem.drawText(ctx, scene.state.won ? 'YOU WIN!' : 'GAME OVER', cx, H / 2 - 40,
        { align: 'center', font: '42px monospace', color: scene.state.won ? '#2ecc71' : '#e74c3c' });
      GF.UISystem.drawText(ctx, 'Final Score: ' + scene.state.score, cx, H / 2 + 10,
        { align: 'center', font: '24px monospace', color: '#fff' });
      GF.UISystem.drawText(ctx, 'Press Space to Continue', cx, H / 2 + 50,
        { align: 'center', font: '20px monospace', color: '#ffeb3b' });
    },
  });

})(window.GF);
