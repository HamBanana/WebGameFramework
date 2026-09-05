// behaviors/FlyPatrol.js — flying enemy that patrols in the air.
// Moves in a sine wave pattern, can be defeated by jumping on it or throwing eyeballs.
(function (GF) {
  'use strict';

  GF.behavior('FlyPatrol', (cfg) => {
    const {
      range = 150,
      speed = 60,
      waveAmp = 30,
      waveFreq = 1.5,
    } = cfg || {};

    return {
      onAdd(e) {
        e.startX = e.x;
        e.startY = e.y;
        e.range = range;
        e.speed = speed;
        e.waveAmp = waveAmp;
        e.waveFreq = waveFreq;
        e.time = Math.random() * Math.PI * 2;
        e.direction = 1;
        e.hasEyeball = true;
        e.blinded = false;
        e.stunned = 0;
        e.hurtFlash = 0;
        e.flipX = false;
      },

      update(dt, e) {
        // Stunned state (when jumped on or hit by eyeball)
        if (e.stunned > 0) {
          e.stunned -= dt;
          e.hurtFlash = Math.max(0, e.hurtFlash - dt * 5);
          return;
        }

        // Move in sine wave pattern
        e.time += dt * e.waveFreq;
        e.x += e.direction * e.speed * dt;
        e.y = e.startY + Math.sin(e.time) * e.waveAmp;

        // Patrol back and forth
        if (e.x > e.startX + e.range) {
          e.x = e.startX + e.range;
          e.direction = -1;
          e.flipX = true;
        } else if (e.x < e.startX - e.range) {
          e.x = e.startX - e.range;
          e.direction = 1;
          e.flipX = false;
        }

        // Hurt flash decay
        if (e.hurtFlash > 0) e.hurtFlash -= dt * 5;
      },

      draw(ctx, e) {
        // Blink when hurt
        if (e.hurtFlash > 0 && Math.floor(e.hurtFlash * 20) % 2 === 0) return;

        ctx.save();
        ctx.translate(e.x + e.w / 2, e.y + e.h / 2);

        const scale = e.flipX ? -1 : 1;
        ctx.scale(scale, 1);

        // Wings (animated)
        const wingFlap = Math.sin(Date.now() / 80) * 0.4;
        ctx.fillStyle = e.blinded ? '#4a4a5a' : '#6a5a8a';
        // Left wing
        ctx.beginPath();
        ctx.ellipse(-8, -4, 10, 6, -0.3 + wingFlap, 0, Math.PI * 2);
        ctx.fill();
        // Right wing
        ctx.beginPath();
        ctx.ellipse(8, -4, 10, 6, 0.3 - wingFlap, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = e.blinded ? '#3a3a4a' : '#5a4a7a';
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2a2a3a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Eyes
        if (e.hasEyeball && !e.blinded) {
          // Glowing eyes with eyeball
          ctx.fillStyle = '#ffe066';
          ctx.beginPath();
          ctx.arc(-4, -3, 4, 0, Math.PI * 2);
          ctx.arc(4, -3, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.arc(-4, -3, 2, 0, Math.PI * 2);
          ctx.arc(4, -3, 2, 0, Math.PI * 2);
          ctx.fill();

          // Eyeball highlight
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(-3, -4, 1, 0, Math.PI * 2);
          ctx.arc(5, -4, 1, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // X eyes (blinded or no eyeball)
          ctx.strokeStyle = '#ff5555';
          ctx.lineWidth = 2;
          // Left X
          ctx.beginPath();
          ctx.moveTo(-6, -5); ctx.lineTo(-2, -1);
          ctx.moveTo(-2, -5); ctx.lineTo(-6, -1);
          ctx.stroke();
          // Right X
          ctx.beginPath();
          ctx.moveTo(2, -5); ctx.lineTo(6, -1);
          ctx.moveTo(6, -5); ctx.lineTo(2, -1);
          ctx.stroke();
        }

        // Legs (small)
        ctx.strokeStyle = '#3a3a4a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-4, 8); ctx.lineTo(-6, 14);
        ctx.moveTo(4, 8); ctx.lineTo(6, 14);
        ctx.stroke();

        ctx.restore();

        // Stunned effect
        if (e.stunned > 0) {
          ctx.save();
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = '#ffe066';
          const starAngle = Date.now() / 200;
          for (let i = 0; i < 3; i++) {
            const angle = starAngle + (i * Math.PI * 2 / 3);
            const sx = e.x + e.w / 2 + Math.cos(angle) * 12;
            const sy = e.y - 5 + Math.sin(angle) * 6;
            ctx.beginPath();
            ctx.arc(sx, sy, 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }
    };
  });
})(window.GF);
