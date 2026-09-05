// behaviors/EyeballProjectile.js — thrown eyeball that damages enemies.
(function (GF) {
  'use strict';

  GF.behavior('EyeballProjectile', (cfg) => {
    const { speed = 400, lifetime = 2 } = cfg || {};

    return {
      onAdd(e) {
        e.speed = speed;
        e.lifetime = lifetime;
        e.dir = cfg.dir || 1;
        e.vx = e.dir * speed;
        e.vy = 0;
        e.gravity = 300;
      },

      update(dt, e) {
        e.lifetime -= dt;
        if (e.lifetime <= 0) {
          e.alive = false;
          return;
        }

        e.vy += e.gravity * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      },

      draw(ctx, e) {
        // Rotating eyeball
        ctx.save();
        ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
        ctx.rotate(Date.now() / 100);

        // White of eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Iris
        ctx.fillStyle = '#0066ff';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        // Pupil
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.arc(-2, -2, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    };
  });
})(window.GF);
