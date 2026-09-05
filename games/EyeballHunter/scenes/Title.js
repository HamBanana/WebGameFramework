// parts/Title.js — start screen.
(function (G, GF) {
  'use strict';

  const VW = 960, VH = 540;

  class Title extends GF.Scene {
    constructor() {
      super();
      this.t = 0;
    }

    update(dt, engine) {
      this.t += dt;
      const input = engine.input;
      if (input.wasPressed('Enter') || input.wasPressed('Space') || input.wasPressed('KeyZ')) {
        const game = window.GAME && window.GAME.game;
        window.EH.reset();
        game.scenes.replaceWithTransition(new G.scenes.Main(0), { type: 'fade', duration: 0.7 });
      }
    }

    render(ctx, engine) {
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, VW, VH);

      // Drifting fog
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = '#8a8aff';
      for (let i = 0; i < 5; i++) {
        const x = ((this.t * 20 + i * 250) % (VW + 300)) - 150;
        ctx.beginPath();
        ctx.ellipse(x, 100 + (i % 3) * 60, 140, 34, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Big eye
      const pulse = 1 + 0.05 * Math.sin(this.t * 2);
      ctx.save();
      ctx.translate(VW / 2, 200);
      ctx.scale(pulse, pulse);
      // Glow
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath(); ctx.ellipse(0, 0, 78, 54, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      // Sclera
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(0, 0, 60, 40, 0, 0, Math.PI * 2); ctx.fill();
      // Iris
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
      // Pupil
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
      // Highlight
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-6, -6, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Title
      ctx.fillStyle = '#ff4433';
      ctx.shadowColor = '#ff2200';
      ctx.shadowBlur = 16;
      ctx.font = 'bold 56px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('EYEBALL HUNTER', VW / 2, 320);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#c8d0e0';
      ctx.font = '18px monospace';
      ctx.fillText('Steal eyeballs. Survive the spiders. Defeat the Optic Horror.', VW / 2, 360);

      // Controls
      ctx.fillStyle = '#8892a8';
      ctx.font = '14px monospace';
      ctx.fillText('← → / A D  Move      ↑ / W / Space  Jump', VW / 2, 410);
      ctx.fillText('Jump on enemies to snatch their eyes — touch one and lose a life.', VW / 2, 432);
      ctx.fillText('Blinded enemies survive, stay standing, and give no more eyes.', VW / 2, 452);

      // Blinking prompt
      if (Math.floor(this.t * 2) % 2 === 0) {
        ctx.fillStyle = '#7cfc9e';
        ctx.font = 'bold 22px monospace';
        ctx.fillText('PRESS ENTER TO START', VW / 2, 490);
      }
      ctx.textAlign = 'left';
    }
  }

  G.scenes.Title = Title;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
