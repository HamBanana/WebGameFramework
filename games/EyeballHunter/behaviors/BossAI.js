// behaviors/BossAI.js — the final boss: a giant many-eyed horror.
// The scene decrements e.eyeballs on player contact (steal-the-eyes theme).
// When it runs out of eyes it is defeated; the scene handles victory.
(function (GF) {
  'use strict';
  GF.behavior('BossAI', (cfg) => ({
    onAdd(e) {
      e.maxEyeballs = cfg.maxEyeballs != null ? cfg.maxEyeballs : 8;
      e.eyeballs = e.maxEyeballs;
      e.speed = cfg.speed != null ? cfg.speed : 60;
      e.hitFlash = 0;
      e.defeated = false;
      e.homeY = e.y;
      e.phase = 0;
      // Eye layout: a ring of eyes around the core
      const n = e.maxEyeballs;
      e.eyePositions = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        e.eyePositions.push({ a, r: e.w * 0.32 });
      }
    },
    update(dt, e, world) {
      if (e.defeated) {
        // Sink and fade out
        e.y += 40 * dt;
        e.fade = (e.fade != null ? e.fade : 1) - dt * 0.8;
        if (e.fade < 0) e.fade = 0;
        return;
      }
      if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt);

      const player = world.first('player');
      e.phase += dt;

      if (player) {
        // Chase the player horizontally, hover vertically
        const dx = player.centerX - e.centerX;
        const dir = dx > 0 ? 1 : -1;
        e.flipX = dir < 0;
        e.x += dir * e.speed * dt;
        e.y = e.homeY + Math.sin(e.phase * 1.5) * 30;
      } else {
        e.y = e.homeY + Math.sin(e.phase * 1.5) * 30;
      }

      // Clamp to arena
      const lw = (world.data && world.data.levelWidth) || 1800;
      e.x = Math.max(20, Math.min(lw - e.w - 20, e.x));
    },
    draw(ctx, e) {
      const fade = e.fade != null ? e.fade : 1;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(e.x + e.w / 2, e.y + e.h / 2);

      // Spiky aura
      ctx.strokeStyle = e.defeated ? '#552222' : '#771111';
      ctx.lineWidth = 3;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + e.phase * 0.5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * e.w * 0.4, Math.sin(a) * e.w * 0.4);
        ctx.lineTo(Math.cos(a) * e.w * 0.58, Math.sin(a) * e.w * 0.58);
        ctx.stroke();
      }

      // Core body
      const grd = ctx.createRadialGradient(0, 0, 5, 0, 0, e.w * 0.45);
      grd.addColorStop(0, e.defeated ? '#3a1a1a' : '#6a1515');
      grd.addColorStop(1, e.defeated ? '#1a0808' : '#2a0505');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(0, 0, e.w * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Remaining eyeballs (one per remaining hit)
      ctx.fillStyle = '#fff';
      for (let i = 0; i < e.eyeballs; i++) {
        const p = e.eyePositions[i];
        const ex = Math.cos(p.a + e.phase * 0.3) * p.r;
        const ey = Math.sin(p.a + e.phase * 0.3) * p.r;
        ctx.beginPath(); ctx.arc(ex, ey, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
      }

      // Hit flash
      if (e.hitFlash > 0) {
        ctx.globalAlpha = e.hitFlash / 0.3 * fade;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(0, 0, e.w * 0.45, 0, Math.PI * 2); ctx.fill();
      }

      ctx.restore();
    }
  }));
})(window.GF);
