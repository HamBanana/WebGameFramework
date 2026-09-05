// behaviors/GoalDraw.js — the level exit door. Pulsing, glowing portal.
(function (GF) {
  'use strict';
  GF.behavior('GoalDraw', (cfg) => ({
    onAdd(e) {
      e.phase = 0;
    },
    update(dt, e, world) {
      e.phase += dt;
    },
    draw(ctx, e) {
      ctx.save();
      ctx.translate(e.x + e.w / 2, e.y + e.h);

      // Glow behind door
      const pulse = 0.5 + 0.3 * Math.sin(e.phase * 2);
      ctx.globalAlpha = 0.4 * pulse;
      ctx.fillStyle = '#7cfc9e';
      ctx.beginPath(); ctx.arc(0, -e.h / 2, e.w, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;

      // Door frame
      ctx.fillStyle = '#20302a';
      ctx.strokeStyle = '#7cfc9e';
      ctx.lineWidth = 3;
      const w = e.w, h = e.h;
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0);
      ctx.lineTo(-w / 2, -h + 10);
      ctx.arc(0, -h + 10, w / 2, Math.PI, 0);
      ctx.lineTo(w / 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner swirl
      ctx.fillStyle = '#0f1a14';
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 6, 0);
      ctx.lineTo(-w / 2 + 6, -h + 14);
      ctx.arc(0, -h + 14, w / 2 - 6, Math.PI, 0);
      ctx.lineTo(w / 2 - 6, 0);
      ctx.closePath();
      ctx.fill();

      // Eye symbol in the middle
      ctx.fillStyle = '#7cfc9e';
      ctx.beginPath();
      ctx.arc(0, -h / 2, 6 + 2 * Math.sin(e.phase * 3), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f1a14';
      ctx.beginPath();
      ctx.arc(0, -h / 2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }));
})(window.GF);
