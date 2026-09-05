// behaviors/PlayerMove.js — platformer player physics (world-space).
// The scene supplies `world.data.solids` (array of {x,y,w,h} ground/platforms)
// and `world.data.levelHeight` (falling below this = pit death).
(function (GF) {
  'use strict';
  GF.behavior('PlayerMove', (cfg) => ({
    onAdd(e) {
      e.speed = 200;
      e.jumpForce = -520;
      e.gravity = 1100;
      e.vx = 0;
      e.vy = 0;
      e.onGround = false;
      e.invuln = 0;      // brief i-frames after a hit
      e.fellIntoPit = false;
      e.static = true;  // Prevent EntityWorld from integrating vx/vy - we handle it manually
      e.bounceV = 0;    // bounce velocity when stomping enemy
      e.knockbackX = 0;
      e.knockbackY = 0;
    },
    update(dt, e, world) {
      const input = world.engine.input;
      const EH = (typeof window !== 'undefined') ? window.EH : null;
      const solids = (world.data && world.data.solids) || [];
      const levelHeight = (world.data && world.data.levelHeight) || 560;
      const levelWidth = (world.data && world.data.levelWidth) || 960;

      if (e.invuln > 0) e.invuln = Math.max(0, e.invuln - dt);

      // --- Horizontal input (speed powerup) ---
      const speedMult = (EH && EH.isSpeeding()) ? 1.6 : 1;
      const spd = e.speed * speedMult;
      e.vx = 0;
      if (input.isDown('ArrowLeft') || input.isDown('KeyA')) { e.vx = -spd; e.flipX = true; }
      if (input.isDown('ArrowRight') || input.isDown('KeyD')) { e.vx = spd; e.flipX = false; }

      // --- Jump ---
      if ((input.wasPressed('ArrowUp') || input.wasPressed('KeyW') || input.wasPressed('Space')) && e.onGround) {
        e.vy = e.jumpForce;
        e.onGround = false;
      }

      // --- Throw eyeball (X or F key) ---
      if (input.wasPressed('KeyX') || input.wasPressed('KeyF')) {
        e.wantThrow = true;
      }

      // --- Apply gravity ---
      e.vy += e.gravity * dt;
      if (e.vy > 900) e.vy = 900;

      // --- Apply bounce (from stomping enemy) ---
      if (e.bounceV !== 0) {
        e.vy = e.bounceV;
        e.bounceV = 0;
        e.onGround = false;
      }

      // --- Apply knockback ---
      if (e.knockbackX !== 0 || e.knockbackY !== 0) {
        e.vy += e.knockbackY;
        e.vx = e.knockbackX;
        e.knockbackX = 0;
        e.knockbackY = 0;
      }

      // --- Move X, clamp to level bounds ---
      e.x += e.vx * dt;
      e.x = Math.max(0, Math.min(levelWidth - e.w, e.x));

      // --- Move Y with one-way platform collision ---
      const prevBottom = e.y + e.h;
      e.y += e.vy * dt;
      const newBottom = e.y + e.h;
      e.onGround = false;

      for (const s of solids) {
        const horizOverlap = e.x + e.w > s.x + 2 && e.x < s.x + s.w - 2;
        if (!horizOverlap) continue;

        // Landing on top
        if (prevBottom <= s.y + 1 && newBottom >= s.y && e.vy >= 0) {
          e.y = s.y - e.h;
          e.vy = 0;
          e.onGround = true;
        }
      }

      // --- Pit detection ---
      e.fellIntoPit = e.y > levelHeight;
    },
    draw(ctx, e) {
      // Blink while invulnerable
      if (e.invuln > 0 && Math.floor(e.invuln * 14) % 2 === 0) return;
      ctx.save();
      ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
      // Body
      ctx.fillStyle = '#2d1b4e';
      ctx.beginPath(); ctx.ellipse(0, 0, 14, 16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#4a3070'; ctx.lineWidth = 2; ctx.stroke();
      // Feet
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(-5, 3); ctx.lineTo(-3, 9); ctx.lineTo(-1, 3); ctx.fill();
      ctx.beginPath(); ctx.moveTo(1, 3); ctx.lineTo(3, 9); ctx.lineTo(5, 3); ctx.fill();
      // Eyes
      ctx.fillStyle = '#ff2200';
      ctx.beginPath(); ctx.arc(e.flipX ? 6 : -6, -6, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(e.flipX ? -6 : 6, -6, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(e.flipX ? 7 : -5, -6, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(e.flipX ? -5 : 7, -6, 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Shield aura
      const EH = (typeof window !== 'undefined') ? window.EH : null;
      if (EH && EH.shield) {
        ctx.save();
        ctx.globalAlpha = 0.5 + 0.3 * Math.sin(Date.now() / 120);
        ctx.strokeStyle = '#5fe0ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(e.x + e.w / 2, e.y + e.h / 2, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }));
})(window.GF);
