// behaviors/SpikeDraw.js — deadly ground spikes (draw-only).
(function (GF) {
  'use strict';
  GF.behavior('SpikeDraw', (cfg) => ({
    draw(ctx, e) {
      ctx.save();
      ctx.translate(e.x, e.y);
      const n = Math.max(1, Math.floor(e.w / 14));
      const sw = e.w / n;
      for (let i = 0; i < n; i++) {
        const x0 = i * sw;
        ctx.fillStyle = i % 2 === 0 ? '#8a8a9a' : '#6a6a7a';
        ctx.beginPath();
        ctx.moveTo(x0, e.h);
        ctx.lineTo(x0 + sw / 2, 0);
        ctx.lineTo(x0 + sw, e.h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }));
})(window.GF);
