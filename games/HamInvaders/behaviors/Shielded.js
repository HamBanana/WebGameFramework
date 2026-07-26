// behaviors/Shielded.js — "invulnerable while its escorts live".
//
// This is what gives a hand-placed boss level its shape: the drones you put in
// the level file ARE the difficulty. Place six and the player has to strip all
// six before the mothership can be touched; place none and it is a straight
// damage race. modules/Boss.js reads e.data.shielded when applying damage.
(function (GF) {
  'use strict';

  GF.behavior('Shielded', (cfg) => ({
    onAdd(e) { e.data.shielded = true; e.data.shieldT = 0; },

    update(dt, e, world) {
      e.data.shieldT += dt;
      e.data.shielded = world.count(cfg.by || 'bossDrone') > 0;
    },

    // drawOver rather than draw, so the boss's own sprite still renders.
    drawOver(ctx, e) {
      if (!e.data.shielded) return;

      const pulse = 0.55 + Math.sin(e.data.shieldT * 4) * 0.2;
      const cx = e.centerX;
      const cy = e.y + e.h / 2;
      const rx = e.w * 0.68;
      const ry = e.h * 0.95;

      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = cfg.color || '#5dade2';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = pulse * 0.18;
      ctx.fillStyle = cfg.color || '#5dade2';
      ctx.fill();
      ctx.restore();
    },
  }));

})(window.GF);
