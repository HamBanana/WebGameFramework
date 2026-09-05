// behaviors/PowerupFloat.js — floating collectible powerups.
// e.powerType: 'life' | 'speed' | 'shield' | 'magnet'
(function (GF) {
  'use strict';
  GF.behavior('PowerupFloat', (cfg) => ({
    onAdd(e) {
      e.powerType = cfg.type || 'life';
      e.baseY = e.y;
      e.phase = Math.random() * Math.PI * 2;
      e.spin = 0;
    },
    update(dt, e, world) {
      const t = (world.data && world.data.t) || 0;
      e.y = e.baseY + Math.sin(t * 2 + e.phase) * 6;
      e.spin += dt * 2;
    },
    draw(ctx, e) {
      ctx.save();
      ctx.translate(e.x + e.w / 2, e.y + e.h / 2);

      // Glow
      const colors = {
        life:   '#ff5d8f',
        speed:  '#ffe066',
        shield: '#5fe0ff',
        magnet: '#c084fc',
      };
      const col = colors[e.powerType] || '#fff';
      ctx.globalAlpha = 0.25 + 0.15 * Math.sin(Date.now() / 150);
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;

      // Core
      ctx.fillStyle = col;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
      ctx.stroke();

      // Icon glyph
      ctx.fillStyle = '#0a0a1a';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const glyph = { life: '+1', speed: '»', shield: '◈', magnet: '◉' }[e.powerType] || '?';
      ctx.fillText(glyph, 0, 1);

      ctx.restore();
    }
  }));
})(window.GF);
