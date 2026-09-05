// parts/GameOver.js — game over screen with restart.
(function (G, GF) {
  'use strict';

  const VW = 960, VH = 540;

  class GameOver extends GF.Scene {
    constructor() {
      super();
      this.t = 0;
    }

    update(dt, engine) {
      this.t += dt;
      const input = engine.input;
      if (input.wasPressed('KeyR') || input.wasPressed('Enter') || input.wasPressed('Space')) {
        const game = window.GAME && window.GAME.game;
        window.EH.reset();
        game.scenes.replaceWithTransition(new G.scenes.Main(0), { type: 'fade', duration: 0.7 });
      }
    }

    render(ctx, engine) {
      ctx.fillStyle = '#0a0505';
      ctx.fillRect(0, 0, VW, VH);

      ctx.fillStyle = '#ff5d5d';
      ctx.font = 'bold 64px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', VW / 2, 220);

      const EH = window.EH;
      ctx.fillStyle = '#fff';
      ctx.font = '24px monospace';
      ctx.fillText(`Eyeballs collected: ${EH.eyeballs}`, VW / 2, 290);

      if (Math.floor(this.t * 2) % 2 === 0) {
        ctx.fillStyle = '#7cfc9e';
        ctx.font = 'bold 22px monospace';
        ctx.fillText('PRESS R TO RETRY', VW / 2, 380);
      }
      ctx.textAlign = 'left';
    }
  }

  G.scenes.GameOver = GameOver;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
