// parts/Victory.js — victory screen after defeating the boss.
(function (G, GF) {
  'use strict';

  const VW = 960, VH = 540;

  class Victory extends GF.Scene {
    constructor() {
      super();
      this.t = 0;
      this.confetti = [];
      for (let i = 0; i < 60; i++) {
        this.confetti.push({
          x: Math.random() * VW,
          y: Math.random() * -VH,
          vy: 40 + Math.random() * 80,
          vx: (Math.random() - 0.5) * 40,
          color: ['#ff5d8f', '#ffe066', '#5fe0ff', '#7cfc9e', '#c084fc'][i % 5],
          size: 3 + Math.random() * 4,
        });
      }
    }

    update(dt, engine) {
      this.t += dt;
      for (const c of this.confetti) {
        c.y += c.vy * dt;
        c.x += c.vx * dt;
        if (c.y > VH) { c.y = -10; c.x = Math.random() * VW; }
      }
      const input = engine.input;
      if (input.wasPressed('KeyR') || input.wasPressed('Enter') || input.wasPressed('Space')) {
        const game = window.GAME && window.GAME.game;
        window.EH.reset();
        game.scenes.replaceWithTransition(new G.scenes.Main(0), { type: 'fade', duration: 0.7 });
      }
    }

    render(ctx, engine) {
      ctx.fillStyle = '#050a0a';
      ctx.fillRect(0, 0, VW, VH);

      // Confetti
      for (const c of this.confetti) {
        ctx.fillStyle = c.color;
        ctx.fillRect(c.x, c.y, c.size, c.size);
      }

      ctx.fillStyle = '#ffe066';
      ctx.font = 'bold 64px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('VICTORY!', VW / 2, 200);

      ctx.fillStyle = '#7cfc9e';
      ctx.font = '22px monospace';
      ctx.fillText('The Optic Horror is blind and vanquished.', VW / 2, 250);

      const EH = window.EH;
      ctx.fillStyle = '#fff';
      ctx.font = '26px monospace';
      ctx.fillText(`Total eyeballs collected: ${EH.eyeballs}`, VW / 2, 310);

      if (Math.floor(this.t * 2) % 2 === 0) {
        ctx.fillStyle = '#5fe0ff';
        ctx.font = 'bold 22px monospace';
        ctx.fillText('PRESS R TO PLAY AGAIN', VW / 2, 400);
      }
      ctx.textAlign = 'left';
    }
  }

  G.scenes.Victory = Victory;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
