// behaviors/EnemyPatrol.js — patrolling enemy that carries one eyeball.
// Walking enemies stay on ground/platforms. Can be defeated by jumping on them
// or throwing eyeballs at them.
(function (GF) {
  'use strict';
  GF.behavior('EnemyPatrol', (cfg) => ({
    onAdd(e) {
      e.homeX = e.x;
      e.range = cfg.range != null ? cfg.range : 120;
      e.dir = (Math.random() < 0.5 ? -1 : 1);
      e.speed = cfg.speed != null ? cfg.speed : 45;
      e.hasEyeball = true;
      e.blindFlash = 0;
      e.stunned = 0;
      e.hurtFlash = 0;
      e.baseY = e.y;
      e.onGround = true;
      e.vy = 0;
    },
    update(dt, e, world) {
      const solids = (world.data && world.data.solids) || [];
      
      // Stunned state (when jumped on or hit by eyeball)
      if (e.stunned > 0) {
        e.stunned -= dt;
        e.hurtFlash = Math.max(0, e.hurtFlash - dt * 5);
        // Fall down when stunned
        e.vy += 800 * dt;
        e.y += e.vy * dt;
        // Check ground collision
        for (const s of solids) {
          const bottom = e.y + e.h;
          const prevBottom = bottom - e.vy * dt;
          if (prevBottom <= s.y + 2 && bottom >= s.y && e.x + e.w > s.x && e.x < s.x + s.w) {
            e.y = s.y - e.h;
            e.vy = 0;
            e.onGround = true;
          }
        }
        return;
      }

      if (e.blindFlash > 0) e.blindFlash = Math.max(0, e.blindFlash - dt);
      const t = (world.data && world.data.t) || 0;

      // Blinded enemies drift half speed — harmless, just wandering.
      const mult = e.hasEyeball ? 1 : 0.5;
      const spd = e.speed * mult;
      
      // Move horizontally
      const newX = e.x + e.dir * spd * dt;
      
      // Check if there's ground ahead
      const hasGroundAhead = solids.some(s => {
        const aheadX = e.dir > 0 ? newX + e.w + 5 : newX - 5;
        return aheadX >= s.x && aheadX <= s.x + s.w && 
               e.y + e.h >= s.y - 10 && e.y + e.h <= s.y + 10;
      });
      
      if (hasGroundAhead) {
        e.x = newX;
      } else {
        // Turn around if no ground ahead
        e.dir *= -1;
      }
      
      const lo = e.homeX - e.range;
      const hi = e.homeX + e.range;
      if (e.x < lo) { e.x = lo; e.dir = 1; }
      if (e.x > hi) { e.x = hi; e.dir = -1; }

      // Simple bob to feel alive
      if (e.onGround) {
        e.y = (e.baseY != null ? e.baseY : e.y) + Math.sin(t * 3 + e.homeX) * 2;
      }

      // Hurt flash decay
      if (e.hurtFlash > 0) e.hurtFlash -= dt * 5;
    },
    draw(ctx, e) {
      // Blink when hurt
      if (e.hurtFlash > 0 && Math.floor(e.hurtFlash * 20) % 2 === 0) return;

      const blind = !e.hasEyeball;
      const bodyColor = blind ? '#3a3a3a' : '#2a2a2a';
      const legColor = blind ? '#4a4a4a' : '#4a4a4a';

      ctx.save();
      ctx.translate(e.x + e.w / 2, e.y + e.h / 2);

      // Legs
      ctx.strokeStyle = legColor;
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const a = -0.5 + i * 0.4 + (e.dir > 0 ? 0.15 : -0.15);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 10, Math.sin(a) * 10);
        ctx.lineTo(Math.cos(a) * 22, Math.sin(a) * 22);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(Math.cos(Math.PI - a) * 10, Math.sin(a) * 10);
        ctx.lineTo(Math.cos(Math.PI - a) * 22, Math.sin(a) * 22);
        ctx.stroke();
      }

      // Body
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();

      if (e.hasEyeball) {
        // Two glowing eyeballs
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(-4, -2, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(4, -2, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0000ff';
        ctx.beginPath(); ctx.arc(-4, -2, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(4, -2, 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#cc0000';
        ctx.beginPath(); ctx.arc(0, 3, 3, 0, Math.PI * 2); ctx.fill();
      } else if (e.stunned > 0) {
        // Stunned stars
        ctx.fillStyle = '#ffe066';
        const starAngle = Date.now() / 200;
        for (let i = 0; i < 3; i++) {
          const angle = starAngle + (i * Math.PI * 2 / 3);
          ctx.beginPath();
          ctx.arc(Math.cos(angle) * 8, -10 + Math.sin(angle) * 4, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // X'd out, sightless eyes
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;
        for (const ox of [-4, 4]) {
          ctx.beginPath(); ctx.moveTo(ox - 3, -5); ctx.lineTo(ox + 3, 1); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(ox + 3, -5); ctx.lineTo(ox - 3, 1); ctx.stroke();
        }
      }

      if (e.blindFlash > 0) {
        ctx.globalAlpha = e.blindFlash / 0.3;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
      }

      ctx.restore();
    }
  }));
})(window.GF);
