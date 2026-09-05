// behaviors/BossBomb.js — a rolling eyeball bomb the boss launches.
// The world integrates vx/vy automatically; this handles life, wall death,
// and drawing.
(function (GF) {
  'use strict';
  GF.behavior('BossBomb', (cfg) => ({
    onAdd(e) {
      e.life = 4;
      e.rot = 0;
    },
    update(dt, e, world) {
      e.rot += dt * 6;
      e.life -= dt;

      const solids = (world.data && world.data.solids) || [];
      for (const s of solids) {
        if (e.x + e.w > s.x && e.x < s.x + s.w && e.y + e.h > s.y && e.y < s.y + s.h) {
          e.destroy();
          break;
        }
      }

      const lw = (world.data && world.data.levelWidth) || 1800;
      if (e.x < -60 || e.x > lw + 60 || e.y > 640 || e.life <= 0) e.destroy();
    },
    draw(ctx, e) {
      ctx.save();
      ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
      ctx.rotate(e.rot);
      // Eyeball
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath(); ctx.arc(2, 0, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(2.5, 0, 1.8, 0, Math.PI * 2); ctx.fill();
      // Spikes around it
      ctx.strokeStyle = '#771111';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 7, Math.sin(a) * 7);
        ctx.lineTo(Math.cos(a) * 11, Math.sin(a) * 11);
        ctx.stroke();
      }
      ctx.restore();
    }
  }));
})(window.GF);
