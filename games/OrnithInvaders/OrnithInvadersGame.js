// GameFramework/games/OrnithInvaders/OrnithInvadersGame.js
// Ornith Invaders — scaffolded starting point; replace MainScene with the real game.
// Depends on: config.js (GF.GAME_CONFIG), GameFramework.bundle.js

(function (GF) {
  'use strict';

  class MainScene extends GF.Scene {
    init(engine) {
      this.t = 0;
    }

    update(dt, engine) {
      this.t += dt;
    }

    render(ctx, engine) {
      const { width, height } = GF.GAME_CONFIG.engine;
      ctx.fillStyle = '#ffffff';
      ctx.font = '28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Ornith Invaders', width / 2, height / 2);
      ctx.font = '14px monospace';
      ctx.fillStyle = '#8888aa';
      ctx.fillText('scaffolded — game logic goes here', width / 2, height / 2 + 30);
      const x = width / 2 + Math.cos(this.t * 2) * 60;
      ctx.fillStyle = '#4488ff';
      ctx.fillRect(x - 8, height / 2 + 60, 16, 16);
    }
  }

  window.addEventListener('GF:ready', () => {
    const cfg = GF.GAME_CONFIG;
    const game = GF.createGame(cfg.engine, cfg.physics, {
      gameName: cfg.game.name,
      audio: true, tweens: true, particles: true, scenes: true, debug: true,
    });
    game.scenes.push(new MainScene(), game.engine);
    game.engine.start();
  });

})(window.GF = window.GF || {});
