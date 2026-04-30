// GameFramework/games/RoadToSkagen/sprites/scenery.js
// Programmatic scenery sprites used by the journey scene.
// Registered names:
//   tree_pine, tree_birch, bush, signpost, milestone,
//   cloud_small, cloud_big, sun, moon, star,
//   fence, building_city, road_tile, grass_tile, beach_tile,
//   wave, snowflake_pile

(function (GF) {
  'use strict';

  GF.sprites = GF.sprites || {};

  // ── Tiny helpers ───────────────────────────────────────────────────────────
  function r(ctx, x, y, w, h, fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
  }

  function ellipse(ctx, cx, cy, rx, ry, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function makeStatic(width, height, originX, originY, draw) {
    return {
      frameWidth : width,
      frameHeight: height,
      originX    : originX,
      originY    : originY,
      animations : {
        idle: { fps: 1, loop: true, frames: [draw] },
      },
    };
  }

  function makeAnim(width, height, originX, originY, fps, frames) {
    return {
      frameWidth : width,
      frameHeight: height,
      originX    : originX,
      originY    : originY,
      animations : {
        idle: { fps: fps, loop: true, frames: frames },
      },
    };
  }

  // ── Pine tree (tall conifer) ───────────────────────────────────────────────
  GF.sprites['tree_pine'] = makeStatic(40, 64, 20, 64, (ctx) => {
    // Trunk
    r(ctx, 17, 48, 6, 16, '#3a2412');
    r(ctx, 17, 48, 2, 16, '#22150a');
    // Foliage (3 stacked triangles)
    ctx.fillStyle = '#1f5b2c';
    ctx.beginPath(); ctx.moveTo(20, 0);  ctx.lineTo(4, 24);  ctx.lineTo(36, 24); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2a7a3a';
    ctx.beginPath(); ctx.moveTo(20, 12); ctx.lineTo(2, 38);  ctx.lineTo(38, 38); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1f5b2c';
    ctx.beginPath(); ctx.moveTo(20, 26); ctx.lineTo(0, 52);  ctx.lineTo(40, 52); ctx.closePath(); ctx.fill();
    // Highlights
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.moveTo(20, 4);  ctx.lineTo(14, 18); ctx.lineTo(20, 18); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(20, 16); ctx.lineTo(12, 32); ctx.lineTo(20, 32); ctx.closePath(); ctx.fill();
  });

  // ── Birch tree (slim, white bark) ──────────────────────────────────────────
  GF.sprites['tree_birch'] = makeStatic(36, 70, 18, 70, (ctx) => {
    // Trunk (white with dark notches)
    r(ctx, 16, 22, 4, 48, '#e0e0d8');
    r(ctx, 16, 30, 4, 2,  '#222222');
    r(ctx, 16, 44, 4, 2,  '#222222');
    r(ctx, 16, 58, 4, 2,  '#222222');
    // Crown (rounded leafy mass)
    ellipse(ctx, 18, 14, 16, 14, '#5fa84a');
    ellipse(ctx, 12, 18, 8,  6,  '#7bc05c');
    ellipse(ctx, 24, 10, 7,  6,  '#7bc05c');
    ellipse(ctx, 18, 6,  6,  4,  '#aedf94');
  });

  // ── Bush (small undergrowth) ───────────────────────────────────────────────
  GF.sprites['bush'] = makeStatic(28, 18, 14, 18, (ctx) => {
    ellipse(ctx, 8,  10, 8, 8, '#1f5b2c');
    ellipse(ctx, 18, 12, 9, 7, '#2a7a3a');
    ellipse(ctx, 22, 8,  6, 5, '#3aa14a');
    // small berries
    ellipse(ctx, 12, 8, 1.2, 1.2, '#cc1f1f');
    ellipse(ctx, 22, 6, 1.2, 1.2, '#cc1f1f');
  });

  // ── Signpost ───────────────────────────────────────────────────────────────
  GF.sprites['signpost'] = makeStatic(28, 38, 14, 38, (ctx) => {
    // Post
    r(ctx, 12, 14, 4, 24, '#5a3c1c');
    // Sign board
    r(ctx, 0,  6, 28, 12, '#d8c48a');
    r(ctx, 0,  6, 28, 2,  '#fff3c9');
    r(ctx, 0, 16, 28, 2,  '#7a5a2a');
    // Directional arrow tip
    ctx.fillStyle = '#d8c48a';
    ctx.beginPath();
    ctx.moveTo(28, 6);  ctx.lineTo(28, 18); ctx.lineTo(34, 12); ctx.closePath();
    ctx.fill();
    // Text strokes (just lines for legibility)
    r(ctx, 4, 11, 16, 1, '#2c1a0a');
    r(ctx, 4, 14, 12, 1, '#2c1a0a');
  });

  // ── Milestone marker (km stone) ────────────────────────────────────────────
  GF.sprites['milestone'] = makeStatic(20, 22, 10, 22, (ctx) => {
    // Stone
    ctx.fillStyle = '#cfd2c8';
    ctx.beginPath();
    ctx.moveTo(2, 22); ctx.lineTo(2, 8); ctx.quadraticCurveTo(10, 0, 18, 8);
    ctx.lineTo(18, 22); ctx.closePath();
    ctx.fill();
    // Shadow
    ctx.fillStyle = '#9aa090';
    ctx.fillRect(2, 18, 16, 4);
    // Red top stripe
    r(ctx, 2, 4, 16, 4, '#cc1f1f');
    // Text mark
    r(ctx, 6, 12, 8, 1, '#333');
    r(ctx, 7, 15, 6, 1, '#333');
  });

  // ── Clouds ─────────────────────────────────────────────────────────────────
  GF.sprites['cloud_small'] = makeStatic(48, 18, 24, 18, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, 12, 12, 10, 7, '#ffffff');
    ellipse(ctx, 24, 9,  12, 9, '#ffffff');
    ellipse(ctx, 36, 12, 10, 7, '#ffffff');
    // soft underside
    ctx.fillStyle = 'rgba(180,200,220,0.6)';
    ctx.fillRect(8, 14, 32, 3);
  });

  GF.sprites['cloud_big'] = makeStatic(78, 28, 39, 28, (ctx) => {
    ellipse(ctx, 14, 18, 14, 10, '#ffffff');
    ellipse(ctx, 30, 13, 16, 13, '#ffffff');
    ellipse(ctx, 52, 14, 18, 12, '#ffffff');
    ellipse(ctx, 66, 19, 12, 9,  '#ffffff');
    ctx.fillStyle = 'rgba(180,200,220,0.6)';
    ctx.fillRect(8, 22, 62, 4);
  });

  // ── Sun (4-frame gentle pulse) ─────────────────────────────────────────────
  GF.sprites['sun'] = makeAnim(40, 40, 20, 20, 3, [0, 1, 0, -1].map(off => (ctx) => {
    const r0 = 12 + off * 0.5;
    // Halo
    ctx.fillStyle = 'rgba(255,225,120,0.35)';
    ctx.beginPath(); ctx.arc(20, 20, r0 + 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,225,120,0.55)';
    ctx.beginPath(); ctx.arc(20, 20, r0 + 3, 0, Math.PI * 2); ctx.fill();
    // Body
    ctx.fillStyle = '#ffd54a';
    ctx.beginPath(); ctx.arc(20, 20, r0, 0, Math.PI * 2); ctx.fill();
    // Highlight
    ctx.fillStyle = '#fff5c0';
    ctx.beginPath(); ctx.arc(16, 16, r0 / 3, 0, Math.PI * 2); ctx.fill();
  }));

  // ── Moon ───────────────────────────────────────────────────────────────────
  GF.sprites['moon'] = makeStatic(36, 36, 18, 18, (ctx) => {
    // Glow
    ctx.fillStyle = 'rgba(220,220,255,0.25)';
    ctx.beginPath(); ctx.arc(18, 18, 16, 0, Math.PI * 2); ctx.fill();
    // Body
    ctx.fillStyle = '#e8e8f8';
    ctx.beginPath(); ctx.arc(18, 18, 12, 0, Math.PI * 2); ctx.fill();
    // Crater shading
    ctx.fillStyle = '#bcbcd0';
    ctx.beginPath(); ctx.arc(22, 14, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(14, 22, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(20, 24, 1.5, 0, Math.PI * 2); ctx.fill();
  });

  // ── Star (twinkle) ────────────────────────────────────────────────────────
  GF.sprites['star'] = makeAnim(8, 8, 4, 4, 4, [
    (ctx) => { r(ctx, 3, 0, 2, 8, '#fffbe0'); r(ctx, 0, 3, 8, 2, '#fffbe0'); },
    (ctx) => { r(ctx, 3, 1, 2, 6, '#fffbe0'); r(ctx, 1, 3, 6, 2, '#fffbe0'); },
    (ctx) => { r(ctx, 3, 2, 2, 4, '#fffbe0'); r(ctx, 2, 3, 4, 2, '#fffbe0'); },
    (ctx) => { r(ctx, 3, 1, 2, 6, '#fffbe0'); r(ctx, 1, 3, 6, 2, '#fffbe0'); },
  ]);

  // ── Wooden fence ───────────────────────────────────────────────────────────
  GF.sprites['fence'] = makeStatic(32, 18, 16, 18, (ctx) => {
    r(ctx, 0,  8, 32, 2, '#8b6432');
    r(ctx, 0, 13, 32, 2, '#8b6432');
    [3, 11, 19, 27].forEach(x => {
      r(ctx, x, 2,  2, 16, '#a07840');
      r(ctx, x, 0,  2, 3,  '#5a3c1c');
    });
  });

  // ── City silhouette (skyline tile) ─────────────────────────────────────────
  GF.sprites['building_city'] = makeStatic(80, 60, 40, 60, (ctx) => {
    // Three buildings of varied height
    r(ctx,  4, 30, 18, 30, '#1c2c44');
    r(ctx, 26, 18, 22, 42, '#243a55');
    r(ctx, 52, 26, 24, 34, '#1c2c44');
    // Roof details
    r(ctx, 32, 12, 4, 6, '#243a55');
    r(ctx, 60, 18, 4, 8, '#1c2c44');
    // Windows (warm yellow)
    const win = (x, y) => r(ctx, x, y, 2, 2, '#ffd56a');
    [8, 12, 16].forEach(x => [34, 40, 46, 52].forEach(y => win(x, y)));
    [30, 34, 38, 42].forEach(x => [22, 28, 34, 40, 46, 52].forEach(y => win(x, y)));
    [56, 60, 64, 68, 72].forEach(x => [30, 36, 42, 48, 54].forEach(y => win(x, y)));
  });

  // ── Road tile (32×16, repeats horizontally) ────────────────────────────────
  GF.sprites['road_tile'] = makeStatic(32, 16, 0, 16, (ctx) => {
    // Asphalt
    r(ctx, 0, 0, 32, 16, '#3a3a3a');
    // Grain
    r(ctx, 4, 4, 2, 1, '#2a2a2a');
    r(ctx, 18, 11, 2, 1, '#2a2a2a');
    r(ctx, 26, 6, 1, 1, '#4a4a4a');
    // Center dashed line
    r(ctx, 4, 7, 8, 2, '#e8d04a');
    r(ctx, 20, 7, 8, 2, '#e8d04a');
    // Top edge highlight
    r(ctx, 0, 0, 32, 1, '#4a4a4a');
    // Bottom edge shadow
    r(ctx, 0, 15, 32, 1, '#1a1a1a');
  });

  // ── Grass tile (32×16, on either side of the road) ─────────────────────────
  GF.sprites['grass_tile'] = makeStatic(32, 16, 0, 16, (ctx) => {
    r(ctx, 0, 0, 32, 16, '#3f7a3a');
    // Texture clumps
    for (let i = 0; i < 8; i++) {
      const x = (i * 7 + 3) % 32;
      const y = (i * 5 + 1) % 14;
      r(ctx, x, y, 2, 2, '#2f6a2a');
    }
    // Highlights
    r(ctx, 6,  4, 1, 1, '#5fa84a');
    r(ctx, 18, 9, 1, 1, '#5fa84a');
    r(ctx, 24, 2, 1, 1, '#5fa84a');
  });

  // ── Beach / sand tile (final stretch near Skagen) ──────────────────────────
  GF.sprites['beach_tile'] = makeStatic(32, 16, 0, 16, (ctx) => {
    r(ctx, 0, 0, 32, 16, '#e8d49a');
    r(ctx, 4,  3, 2, 1, '#c8a868');
    r(ctx, 14, 8, 1, 1, '#c8a868');
    r(ctx, 22, 12, 2, 1, '#c8a868');
    r(ctx, 28, 5, 1, 1, '#c8a868');
  });

  // ── Wave (rolling animation) ───────────────────────────────────────────────
  GF.sprites['wave'] = makeAnim(48, 10, 24, 10, 4, [
    (ctx) => {
      ctx.fillStyle = '#3a7fae';
      ctx.fillRect(0, 4, 48, 6);
      ctx.fillStyle = '#a9d6ee';
      for (let i = 0; i < 6; i++) r(ctx, i * 8, 2, 4, 2, '#a9d6ee');
    },
    (ctx) => {
      ctx.fillStyle = '#3a7fae';
      ctx.fillRect(0, 4, 48, 6);
      ctx.fillStyle = '#a9d6ee';
      for (let i = 0; i < 6; i++) r(ctx, i * 8 + 4, 2, 4, 2, '#a9d6ee');
    },
    (ctx) => {
      ctx.fillStyle = '#3a7fae';
      ctx.fillRect(0, 5, 48, 5);
      ctx.fillStyle = '#a9d6ee';
      for (let i = 0; i < 6; i++) r(ctx, i * 8, 3, 4, 2, '#a9d6ee');
    },
    (ctx) => {
      ctx.fillStyle = '#3a7fae';
      ctx.fillRect(0, 5, 48, 5);
      ctx.fillStyle = '#a9d6ee';
      for (let i = 0; i < 6; i++) r(ctx, i * 8 + 4, 3, 4, 2, '#a9d6ee');
    },
  ]);

  // ── Lying-snow heap (cold weather marker) ──────────────────────────────────
  GF.sprites['snowflake_pile'] = makeStatic(20, 10, 10, 10, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(10, 8, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dde6f2';
    ctx.beginPath();
    ctx.ellipse(10, 9, 9, 1, 0, 0, Math.PI * 2);
    ctx.fill();
  });

})(window.GF = window.GF || {});
