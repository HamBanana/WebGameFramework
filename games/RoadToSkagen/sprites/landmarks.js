// GameFramework/games/RoadToSkagen/sprites/landmarks.js
// Iconic Danish landmark sprites:
//   windmill   — animated 4-blade rotating windmill
//   lighthouse — striped lighthouse with rotating beam
//   church     — small red Danish village church
//   farmhouse  — yellow Danish farmhouse with red roof

(function (GF) {
  'use strict';

  GF.sprites = GF.sprites || {};

  function r(ctx, x, y, w, h, fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
  }

  // ── Windmill (4 frames — blades rotating) ─────────────────────────────────
  // Frame size 60×96, origin at feet (30, 96).
  function drawWindmillBase(ctx) {
    // Hill shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(30, 92, 26, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Body
    r(ctx, 18, 32, 24, 60, '#e5e0c8');
    r(ctx, 18, 32, 24, 4,  '#bfb898');  // top band
    r(ctx, 18, 88, 24, 4,  '#9a9474');  // foot shadow
    // Door
    r(ctx, 26, 70, 8, 22, '#5a3c1c');
    r(ctx, 30, 78, 1, 4,  '#caa56a');
    // Windows
    r(ctx, 22, 50, 5, 5, '#3a4a2a');
    r(ctx, 33, 50, 5, 5, '#3a4a2a');
    r(ctx, 22, 50, 1, 5, '#1a2a1a');
    r(ctx, 33, 50, 1, 5, '#1a2a1a');
    // Tower cap
    ctx.fillStyle = '#5a3c1c';
    ctx.beginPath();
    ctx.moveTo(16, 32);
    ctx.lineTo(30, 18);
    ctx.lineTo(44, 32);
    ctx.closePath();
    ctx.fill();
    // Cap shine
    ctx.fillStyle = '#7a5a2a';
    ctx.beginPath();
    ctx.moveTo(30, 18); ctx.lineTo(44, 32); ctx.lineTo(34, 32);
    ctx.closePath();
    ctx.fill();
    // Hub
    ctx.fillStyle = '#2c1a0a';
    ctx.beginPath();
    ctx.arc(30, 30, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawWindmillBlades(ctx, angle) {
    ctx.save();
    ctx.translate(30, 30);
    ctx.rotate(angle);
    // 4 blades
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate(i * Math.PI / 2);
      // Blade frame (dark)
      ctx.fillStyle = '#3c2a14';
      ctx.fillRect(-1, -2, 26, 4);
      // Sail (light)
      ctx.fillStyle = '#f4ead0';
      ctx.fillRect(2, -1, 22, 2);
      // Cross spar
      ctx.fillStyle = '#3c2a14';
      ctx.fillRect(8, -7, 2, 14);
      ctx.fillRect(16, -7, 2, 14);
      ctx.restore();
    }
    ctx.restore();
  }

  GF.sprites['windmill'] = {
    frameWidth: 60, frameHeight: 96,
    originX: 30, originY: 96,
    animations: {
      idle: {
        fps: 8, loop: true,
        frames: [0, 1, 2, 3].map(i => (ctx) => {
          drawWindmillBase(ctx);
          drawWindmillBlades(ctx, i * Math.PI / 8);
        }),
      },
    },
  };

  // ── Lighthouse (animated rotating beam — 4 frames) ────────────────────────
  // 38×96, origin at base (19, 96)
  function drawLighthouseBody(ctx, beamPhase) {
    // Base rocks
    ctx.fillStyle = '#6a6a72';
    ctx.beginPath();
    ctx.moveTo(2, 96); ctx.lineTo(8, 84); ctx.lineTo(30, 84); ctx.lineTo(36, 96);
    ctx.closePath(); ctx.fill();
    // Tower (red & white stripes)
    r(ctx, 12, 22, 14, 64, '#ffffff');
    r(ctx, 12, 22, 14, 12, '#cc1f1f');
    r(ctx, 12, 46, 14, 12, '#cc1f1f');
    r(ctx, 12, 70, 14, 12, '#cc1f1f');
    // Top platform
    r(ctx, 10, 18, 18, 4, '#3a3a3a');
    // Lamp room
    r(ctx, 14, 8,  10, 12, '#ffd54a');
    r(ctx, 14, 8,  10, 2,  '#fff5c0');
    // Roof
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath();
    ctx.moveTo(13, 8); ctx.lineTo(19, 0); ctx.lineTo(25, 8);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(18, -2, 2, 4);

    // Light beam
    ctx.save();
    ctx.translate(19, 14);
    const angles = [-0.6, -0.2, 0.2, 0.6];
    const a = angles[beamPhase];
    ctx.rotate(a);
    const grad = ctx.createLinearGradient(0, 0, 60, 0);
    grad.addColorStop(0, 'rgba(255, 240, 160, 0.6)');
    grad.addColorStop(1, 'rgba(255, 240, 160, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(60, -10);
    ctx.lineTo(60,  10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  GF.sprites['lighthouse'] = {
    frameWidth: 80, frameHeight: 96,
    originX: 19, originY: 96,   // anchored at base of tower
    animations: {
      idle: {
        fps: 4, loop: true,
        frames: [0, 1, 2, 3].map(i => (ctx) => drawLighthouseBody(ctx, i)),
      },
    },
  };

  // ── Danish village church ─────────────────────────────────────────────────
  // 56×64, origin (28, 64)
  GF.sprites['church'] = {
    frameWidth: 56, frameHeight: 64,
    originX: 28, originY: 64,
    animations: {
      idle: { fps: 1, loop: true, frames: [(ctx) => {
        // Nave (white)
        r(ctx, 8, 28, 40, 36, '#ede9d8');
        // Roof (red tile)
        ctx.fillStyle = '#a83c2a';
        ctx.beginPath();
        ctx.moveTo(4, 30); ctx.lineTo(28, 14); ctx.lineTo(52, 30);
        ctx.closePath(); ctx.fill();
        // Tower
        r(ctx, 18, 14, 10, 50, '#ede9d8');
        // Tower roof
        ctx.fillStyle = '#a83c2a';
        ctx.beginPath();
        ctx.moveTo(16, 14); ctx.lineTo(23, 4); ctx.lineTo(30, 14);
        ctx.closePath(); ctx.fill();
        // Cross
        r(ctx, 22, -2, 2, 8, '#3a3a3a');
        r(ctx, 19, 0, 8, 2, '#3a3a3a');
        // Tower window
        r(ctx, 21, 30, 4, 6, '#3a4a5a');
        // Nave windows
        r(ctx, 14, 38, 5, 8, '#3a4a5a');
        r(ctx, 35, 38, 5, 8, '#3a4a5a');
        r(ctx, 42, 38, 5, 8, '#3a4a5a');
        // Door
        r(ctx, 28, 50, 6, 14, '#5a3c1c');
        r(ctx, 31, 56, 1, 4,  '#caa56a');
      }] },
    },
  };

  // ── Farmhouse (yellow walls, red roof — classic Danish landhus) ───────────
  // 64×40, origin (32, 40)
  GF.sprites['farmhouse'] = {
    frameWidth: 64, frameHeight: 40,
    originX: 32, originY: 40,
    animations: {
      idle: { fps: 1, loop: true, frames: [(ctx) => {
        // Walls
        r(ctx, 4, 18, 56, 22, '#f3d878');
        // Half-timber lines
        r(ctx, 4, 26, 56, 1, '#5a3c1c');
        for (let x = 4; x <= 60; x += 8) r(ctx, x, 18, 1, 22, '#7a5a2a');
        // Roof (red thatch)
        ctx.fillStyle = '#a83c2a';
        ctx.beginPath();
        ctx.moveTo(0, 20); ctx.lineTo(32, 4); ctx.lineTo(64, 20);
        ctx.closePath(); ctx.fill();
        // Roof shadow
        ctx.fillStyle = '#7a2a1a';
        ctx.beginPath();
        ctx.moveTo(32, 4); ctx.lineTo(64, 20); ctx.lineTo(50, 20);
        ctx.closePath(); ctx.fill();
        // Chimney
        r(ctx, 20, 6, 5, 10, '#9a7a5a');
        r(ctx, 20, 6, 5, 2,  '#3a2a1a');
        // Door
        r(ctx, 28, 28, 8, 12, '#5a3c1c');
        // Windows
        r(ctx, 12, 24, 7, 7, '#7ab5d8');
        r(ctx, 45, 24, 7, 7, '#7ab5d8');
        r(ctx, 12, 24, 1, 7, '#1a1a1a');
        r(ctx, 45, 24, 1, 7, '#1a1a1a');
      }] },
    },
  };

})(window.GF = window.GF || {});
