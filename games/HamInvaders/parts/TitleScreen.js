// parts/TitleScreen.js — title screen scene.
(function (G, GF) {
  'use strict';

  class TitleScreen extends GF.Scene {
    init(engine) {
      engine.input.bind('confirm', 'Space', 'Enter');
    }

    update(dt, engine) {
      if (engine.input.wasPressed('confirm')) {
        G.game.scenes.push(new G.scenes.Main());
      }
    }

    render(ctx, engine) {
      const W = engine.config.width;
      const H = engine.config.height;
      const cx = W / 2;

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, W, H);
      GF.UISystem.drawText(ctx, 'HAM INVADERS', cx, H / 2 - 60,
        { align: 'center', font: '48px monospace', color: '#ff6b6b' });
      GF.UISystem.drawText(ctx, '🐷 vs 👾', cx, H / 2 - 10,
        { align: 'center', font: '36px monospace', color: '#fff' });
      GF.UISystem.drawText(ctx, 'Arrow Keys / A,D to move', cx, H / 2 + 30,
        { align: 'center', font: '18px monospace', color: '#aaa' });
      GF.UISystem.drawText(ctx, 'Space to fire', cx, H / 2 + 55,
        { align: 'center', font: '18px monospace', color: '#aaa' });
      GF.UISystem.drawText(ctx, 'Press Space to Start', cx, H / 2 + 100,
        { align: 'center', font: '22px monospace', color: '#ffeb3b' });
    }
  }

  G.scenes.TitleScreen = TitleScreen;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
