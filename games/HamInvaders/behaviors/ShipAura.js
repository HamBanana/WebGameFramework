// behaviors/ShipAura.js — the shield ring and invincibility shimmer.
//
// Uses drawUnder/drawOver rather than draw, so it decorates the ship sprite
// instead of replacing it. Add or remove this behaviour on the prefab and the
// ship still renders normally either way.
(function (GF) {
  'use strict';

  GF.behavior('ShipAura', (cfg) => ({
    onAdd(e) { e.data.auraT = 0; },
    update(dt, e) { e.data.auraT += dt; },

    drawUnder(ctx, e) {
      if (!e.data.hasPowerup || !e.data.hasPowerup('invincible')) return;
      ctx.save();
      ctx.globalAlpha = 0.3 + Math.sin(e.data.auraT * 10) * 0.15;
      ctx.fillStyle = cfg.invincibleColor || '#ff69b4';
      ctx.fillRect(e.x - 2, e.y - 2, e.w + 4, e.h + 4);
      ctx.restore();
    },

    drawOver(ctx, e) {
      if (!e.data.hasPowerup || !e.data.hasPowerup('shield')) return;
      ctx.save();
      ctx.strokeStyle = cfg.shieldColor || '#9b59b6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.centerX, e.centerY, e.w / 2 + 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    },
  }));

})(window.GF);
