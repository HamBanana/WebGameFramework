// GameFramework/games/RoadToSkagen/sprites/npcs.js
// Road NPC sprites that occasionally pass Claude on the road.
//   car_red, car_blue   — small hatchback silhouettes (oncoming or overtaking)
//   cyclist             — animated 2-frame cyclist
//   hiker               — animated 2-frame hiker walking
//   tractor             — slow farm tractor

(function (GF) {
  'use strict';

  GF.sprites = GF.sprites || {};

  function r(ctx, x, y, w, h, fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
  }

  function makeStatic(w, h, ox, oy, draw) {
    return {
      frameWidth: w, frameHeight: h, originX: ox, originY: oy,
      animations: { idle: { fps: 1, loop: true, frames: [draw] } },
    };
  }

  function makeAnim(w, h, ox, oy, fps, frames) {
    return {
      frameWidth: w, frameHeight: h, originX: ox, originY: oy,
      animations: { idle: { fps: fps, loop: true, frames: frames } },
    };
  }

  // ── Car (red hatchback) — 32×20, origin (16, 20) ─────────────────────────
  function drawCar(ctx, body, light) {
    // Body
    r(ctx, 4, 8, 26, 8, body);
    // Roof
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(8, 8); ctx.lineTo(11, 2); ctx.lineTo(22, 2); ctx.lineTo(26, 8);
    ctx.closePath(); ctx.fill();
    // Windows
    r(ctx, 12, 4, 5, 4, '#a0d4e8');
    r(ctx, 18, 4, 4, 4, '#a0d4e8');
    // Body shine
    r(ctx, 4, 8, 26, 1, 'rgba(255,255,255,0.3)');
    // Bumper line
    r(ctx, 4, 14, 26, 1, 'rgba(0,0,0,0.4)');
    // Wheels
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(10, 17, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(24, 17, 2.5, 0, Math.PI * 2); ctx.fill();
    // Hubcaps
    r(ctx, 9, 16, 2, 2, '#7a7a7a');
    r(ctx, 23, 16, 2, 2, '#7a7a7a');
    // Headlight
    r(ctx, 30, 11, 1, 2, light);
  }
  GF.sprites['car_red']  = makeStatic(32, 20, 16, 20, (ctx) => drawCar(ctx, '#cc1f1f', '#ffd54a'));
  GF.sprites['car_blue'] = makeStatic(32, 20, 16, 20, (ctx) => drawCar(ctx, '#2a5fb0', '#ffd54a'));

  // ── Cyclist — 2 frames (legs alternating). 18×24, origin (9, 24) ─────────
  function drawCyclist(ctx, legPhase) {
    // Wheels
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(4, 20, 3, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(14, 20, 3, 0, Math.PI * 2); ctx.stroke();
    // Spokes
    r(ctx, 4, 17, 1, 6, '#3a3a3a');
    r(ctx, 14, 17, 1, 6, '#3a3a3a');
    // Frame
    ctx.strokeStyle = '#7c2a8a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(4, 20); ctx.lineTo(9, 13); ctx.lineTo(14, 20); ctx.moveTo(9, 13); ctx.lineTo(11, 9);
    ctx.stroke();
    // Handlebars
    r(ctx, 12, 8, 2, 1, '#1a1a1a');
    // Seat
    r(ctx, 8, 12, 3, 1, '#1a1a1a');
    // Body
    r(ctx, 8, 7, 4, 6, '#cc6f2a');
    // Helmet
    r(ctx, 8, 4, 5, 3, '#3a3a3a');
    // Head
    r(ctx, 9, 5, 3, 3, '#f0c89a');
    // Legs (alternating)
    if (legPhase === 0) {
      r(ctx, 7,  13, 2, 4, '#1a1a3a');
      r(ctx, 11, 14, 2, 3, '#1a1a3a');
    } else {
      r(ctx, 7,  14, 2, 3, '#1a1a3a');
      r(ctx, 11, 13, 2, 4, '#1a1a3a');
    }
  }
  GF.sprites['cyclist'] = makeAnim(18, 24, 9, 24, 8, [
    (ctx) => drawCyclist(ctx, 0),
    (ctx) => drawCyclist(ctx, 1),
  ]);

  // ── Hiker — 2 frames. 14×26, origin (7, 26) ──────────────────────────────
  function drawHiker(ctx, legPhase) {
    // Backpack
    r(ctx, 9, 8, 4, 8, '#2a6f4a');
    r(ctx, 9, 8, 4, 1, '#1a4f3a');
    // Body
    r(ctx, 5, 8, 5, 8, '#cc1f1f');
    // Head
    ellipse(ctx, 7, 5, 2, 2, '#f0c89a');
    // Hat
    r(ctx, 5, 2, 5, 2, '#3a3a3a');
    r(ctx, 4, 3, 7, 1, '#3a3a3a');
    // Arms
    r(ctx, 4, 9, 1, 5, '#cc1f1f');
    r(ctx, 10, 9, 1, 5, '#cc1f1f');
    // Walking stick
    r(ctx, 11, 8, 1, 14, '#5a3c1c');
    // Legs
    if (legPhase === 0) {
      r(ctx, 5, 16, 2, 8, '#1a3a5a');
      r(ctx, 8, 16, 2, 6, '#1a3a5a');
    } else {
      r(ctx, 5, 16, 2, 6, '#1a3a5a');
      r(ctx, 8, 16, 2, 8, '#1a3a5a');
    }
    // Boots
    r(ctx, 5, 24, 3, 2, '#1a1a1a');
    r(ctx, 8, 22, 3, 2, '#1a1a1a');
  }
  function ellipse(ctx, cx, cy, rx, ry, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  GF.sprites['hiker'] = makeAnim(14, 26, 7, 26, 5, [
    (ctx) => drawHiker(ctx, 0),
    (ctx) => drawHiker(ctx, 1),
  ]);

  // ── Tractor (slow, distinctive Danish-farm green) ────────────────────────
  GF.sprites['tractor'] = makeStatic(40, 28, 20, 28, (ctx) => {
    // Cab
    r(ctx, 8, 4, 14, 14, '#2f7a3a');
    // Cab window
    r(ctx, 10, 6, 10, 8, '#a0d4e8');
    // Hood
    r(ctx, 22, 10, 14, 8, '#2f7a3a');
    // Stack
    r(ctx, 26, 4, 3, 6, '#1a1a1a');
    // Wheels
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(12, 22, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(32, 23, 4, 0, Math.PI * 2); ctx.fill();
    // Tread
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath(); ctx.arc(12, 22, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(32, 23, 2.5, 0, Math.PI * 2); ctx.fill();
    // Headlight
    r(ctx, 35, 14, 2, 2, '#ffd54a');
  });

})(window.GF = window.GF || {});
