// sprites/boss.js — the mothership and its shield drones.
//
// Programmatic sprites like the rest of this game: a frame is a draw function
// whose local (0,0) is the entity's top-left. Origin is (w/2, h) because
// EntityWorld draws sprites at (centerX, bottom).
(function (GF) {
  'use strict';
  GF.sprites = GF.sprites || {};

  function anim(w, h, fps, frames) {
    return {
      frameWidth: w, frameHeight: h, originX: w / 2, originY: h,
      animations: { idle: { fps: fps, loop: true, frames: frames } },
    };
  }

  // ── the mothership ────────────────────────────────────────────────────────
  // Two frames that differ only in the eye glow, so the hull reads as steady
  // while the core pulses.
  function mothership(glow) {
    return function (ctx) {
      // hull
      ctx.fillStyle = '#5b2c6f'; ctx.fillRect(0, 14, 160, 34);
      ctx.fillStyle = '#7d3c98'; ctx.fillRect(20, 4, 120, 20);
      ctx.fillStyle = '#4a235a'; ctx.fillRect(0, 44, 160, 8);

      // shoulder pods
      ctx.fillStyle = '#6c3483'; ctx.fillRect(4, 24, 22, 22); ctx.fillRect(134, 24, 22, 22);
      ctx.fillStyle = '#2e1437'; ctx.fillRect(10, 46, 10, 8); ctx.fillRect(140, 46, 10, 8);

      // core
      ctx.fillStyle = glow ? '#ff6b6b' : '#c0392b';
      ctx.fillRect(66, 20, 28, 20);
      ctx.fillStyle = glow ? '#ffd24a' : '#e67e22';
      ctx.fillRect(74, 26, 12, 10);

      // eyes
      ctx.fillStyle = '#fff'; ctx.fillRect(38, 26, 16, 12); ctx.fillRect(106, 26, 16, 12);
      ctx.fillStyle = glow ? '#e74c3c' : '#222';
      ctx.fillRect(43, 29, 7, 7); ctx.fillRect(111, 29, 7, 7);

      // teeth
      ctx.fillStyle = '#d5d8dc';
      for (var i = 0; i < 7; i++) ctx.fillRect(28 + i * 18, 48, 10, 6);
    };
  }
  GF.sprites.bossCore = anim(160, 54, 3, [mothership(false), mothership(true)]);

  // ── shield drone ──────────────────────────────────────────────────────────
  function drone(lit) {
    return function (ctx) {
      ctx.fillStyle = '#1f618d'; ctx.fillRect(0, 4, 28, 16);
      ctx.fillStyle = '#2e86c1'; ctx.fillRect(4, 0, 20, 8);
      ctx.fillStyle = lit ? '#5dade2' : '#154360'; ctx.fillRect(8, 8, 12, 8);
      ctx.fillStyle = '#fff'; ctx.fillRect(11, 10, 6, 4);
      ctx.fillStyle = '#1a5276'; ctx.fillRect(0, 20, 8, 5); ctx.fillRect(20, 20, 8, 5);
    };
  }
  GF.sprites.bossDrone = anim(28, 25, 4, [drone(false), drone(true)]);

})(window.GF);
