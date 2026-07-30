// behaviors/PlayerMove.js — reusable per-entity behavior.
(function (GF) {
  'use strict';
  GF.behavior('PlayerMove', (cfg) => ({
onAdd(e) {
  e.speed = 180;
  e.jumpForce = -400;
  e.gravity = 1000;
  e.vx = 0;
  e.vy = 0;
  e.onGround = false;
},
update(dt, e, world) {
  const input = world.engine.input;
  const scenes = world.engine.getSystem('SceneManager');
  const platforms = scenes?.current?.platforms || [];
  const GROUND_Y = 480;

  // --- Horizontal input ---
  e.vx = 0;
  if (input.isDown('ArrowLeft') || input.isDown('KeyA')) { e.vx = -e.speed; e.flipX = true; }
  if (input.isDown('ArrowRight') || input.isDown('KeyD')) { e.vx = e.speed; e.flipX = false; }

  // --- Jump ---
  if ((input.wasPressed('ArrowUp') || input.wasPressed('KeyW') || input.wasPressed('Space')) && e.onGround) {
    e.vy = e.jumpForce;
    e.onGround = false;
  }

  // --- Apply gravity ---
  e.vy += e.gravity * dt;

  // --- Move X first, then Y (separated-axis collision prevents tunneling) ---

  // Horizontal move
  e.x += e.vx * dt;
  e.x = Math.max(0, Math.min(960 - e.w, e.x));

  // Vertical move with platform collision
  const prevY = e.y;
  const prevTop = prevY;
  const prevBottom = prevY + e.h;
  e.y += e.vy * dt;
  const newTop = e.y;
  const newBottom = e.y + e.h;
  e.onGround = false;

  // Ground collision
  if (newBottom > GROUND_Y && e.vy >= 0) {
    e.y = GROUND_Y - e.h;
    e.vy = 0;
    e.onGround = true;
  }

  // Platform collisions (one-way, land on top / bump underside)
  for (const p of platforms) {
    // Does player horizontally overlap this platform?
    const horizOverlap = e.x + e.w > p.x && e.x < p.x + p.w;
    if (!horizOverlap) continue;

    // Landing on top: player was above platform, now feet at or past platform top, moving down
    if (prevBottom <= p.y && newBottom >= p.y && e.vy >= 0) {
      e.y = p.y - e.h;
      e.vy = 0;
      e.onGround = true;
    }
    // Bumping underside: player was below platform, now head at or past platform bottom, moving up
    else if (prevTop >= p.y + p.h && newTop <= p.y + p.h && e.vy < 0) {
      e.y = p.y + p.h;
      e.vy = 0;
    }
    // Already resting on top this frame — stay grounded (tolerance for float drift)
    else if (Math.abs(prevY + e.h - p.y) < 1 && e.vy >= -5 && e.vy <= 5) {
      e.onGround = true;
      // Snap to exact position to prevent drift
      if (Math.abs(e.y - (p.y - e.h)) > 0.5) {
        e.y = p.y - e.h;
      }
    }
  }

  // Safety: if somehow stuck inside a platform, push out upward
  if (!e.onGround) {
    for (const p of platforms) {
      if (e.x + e.w > p.x && e.x < p.x + p.w && newTop < p.y && newBottom > p.y) {
        e.y = p.y - e.h;
        e.vy = 0;
        e.onGround = true;
        break;
      }
    }
  }
},
draw(ctx, e) {
  ctx.save();
  ctx.translate(e.x + e.w/2, e.y + e.h/2);
  ctx.fillStyle = '#2d1b4e';
  ctx.beginPath(); ctx.ellipse(0, 0, 14, 16, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#4a3070'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.moveTo(-5,3); ctx.lineTo(-3,9); ctx.lineTo(-1,3); ctx.fill();
  ctx.beginPath(); ctx.moveTo(1,3); ctx.lineTo(3,9); ctx.lineTo(5,3); ctx.fill();
  ctx.fillStyle = '#ff2200';
  ctx.beginPath(); ctx.arc(e.flipX?6:-6, -6, 4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(e.flipX?-6:6, -6, 4, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(e.flipX?7:-5, -6, 2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(e.flipX?-5:7, -6, 2, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}
  }));
})(window.GF);
