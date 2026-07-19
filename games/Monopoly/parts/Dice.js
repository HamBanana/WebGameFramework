// parts/Dice.js — component, wired by owui-games-tool.
(function (G, GF) {
  'use strict';

  class Dice {
    constructor() {
      this.d1 = 1;
      this.d2 = 1;
      this.showing = false;
    }

    roll() {
      this.d1 = Math.floor(Math.random() * 6) + 1;
      this.d2 = Math.floor(Math.random() * 6) + 1;
      this.showing = true;
      return this.d1 + this.d2;
    }

    draw(ctx) {
      if (!this.showing) return;

      const cx = 400;
      const cy = 340;
      const size = 30;

      // Draw first die
      this.drawDie(ctx, cx - 25, cy, size, this.d1);
      // Draw second die
      this.drawDie(ctx, cx + 25, cy, size, this.d2);

      // Total
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Total: " + (this.d1 + this.d2), cx, cy + 35);
    }

    drawDie(ctx, x, y, size, value) {
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
      ctx.strokeRect(x - size / 2, y - size / 2, size, size);

      ctx.fillStyle = "#333";
      const r = 3;
      const half = size / 2 - 6;

      switch (value) {
        case 1:
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
          break;
        case 2:
          ctx.beginPath(); ctx.arc(x - half, y - half, r, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x + half, y + half, r, 0, Math.PI * 2); ctx.fill();
          break;
        case 3:
          ctx.beginPath(); ctx.arc(x - half, y - half, r, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x + half, y + half, r, 0, Math.PI * 2); ctx.fill();
          break;
        case 4:
          ctx.beginPath(); ctx.arc(x - half, y - half, r, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x + half, y - half, r, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x - half, y + half, r, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x + half, y + half, r, 0, Math.PI * 2); ctx.fill();
          break;
        case 5:
          ctx.beginPath(); ctx.arc(x - half, y - half, r, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x + half, y - half, r, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x - half, y + half, r, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x + half, y + half, r, 0, Math.PI * 2); ctx.fill();
          break;
        case 6:
          ctx.beginPath(); ctx.arc(x - half, y - half, r, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x + half, y - half, r, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x - half, y, r, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x + half, y, r, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x - half, y + half, r, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x + half, y + half, r, 0, Math.PI * 2); ctx.fill();
          break;
      }
    }
  }

  G.components.Dice = Dice;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
