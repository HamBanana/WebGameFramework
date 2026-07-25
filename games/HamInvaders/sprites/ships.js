// sprites/ships.js — the player ham-ship and the three invader tiers.
//
// Sprite definitions register into the global GF.sprites map at load time;
// GF.createGame folds that map into the SpriteSystem. A frame is a plain
// draw function whose local (0,0) is the entity's top-left, because origin is
// set to (w/2, h) and EntityWorld draws sprites at (centerX, bottom).
(function (GF) {
  'use strict';
  GF.sprites = GF.sprites || {};

  function still(w, h, draw) {
    return {
      frameWidth: w, frameHeight: h, originX: w / 2, originY: h,
      animations: { idle: { fps: 1, loop: true, frames: [draw] } },
    };
  }

  // ── player ────────────────────────────────────────────────────────────────
  GF.sprites.hamShip = still(40, 24, function (ctx) {
    ctx.fillStyle = '#ff8c69'; ctx.fillRect(0, 0, 40, 24);      // body
    ctx.fillStyle = '#ff6347'; ctx.fillRect(16, 24, 8, 6);      // nozzle
    ctx.fillStyle = '#fff';    ctx.fillRect(8, 4, 8, 8); ctx.fillRect(24, 4, 8, 8);
    ctx.fillStyle = '#222';    ctx.fillRect(11, 7, 4, 4); ctx.fillRect(27, 7, 4, 4);
    ctx.fillStyle = '#ff6b6b'; ctx.fillRect(14, 14, 12, 6);     // snout
    ctx.fillStyle = '#c0392b'; ctx.fillRect(16, 15, 3, 3); ctx.fillRect(21, 15, 3, 3);
  });

  // ── invaders (one sprite per tier) ────────────────────────────────────────
  ['#9b59b6', '#e67e22', '#2ecc71'].forEach(function (color, tier) {
    GF.sprites['invader' + tier] = still(32, 24, function (ctx) {
      ctx.fillStyle = color; ctx.fillRect(0, 0, 32, 24);
      ctx.fillStyle = '#fff'; ctx.fillRect(6, 6, 8, 8); ctx.fillRect(18, 6, 8, 8);
      ctx.fillStyle = '#222'; ctx.fillRect(9, 9, 4, 4); ctx.fillRect(21, 9, 4, 4);
      ctx.fillStyle = color;  ctx.fillRect(2, 24, 6, 6); ctx.fillRect(24, 24, 6, 6);  // legs
      ctx.fillStyle = '#c0392b'; ctx.fillRect(10, 18, 12, 3);                          // mouth
    });
  });

  // ── ufo ───────────────────────────────────────────────────────────────────
  GF.sprites.ufo = still(48, 20, function (ctx) {
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(10, 5, 28, 10);
    ctx.fillRect(20, 0, 8, 6);
    ctx.fillRect(0, 5, 10, 10);
    ctx.fillRect(38, 5, 10, 10);
    ctx.fillStyle = '#ffeb3b';
    ctx.fillRect(8, 8, 4, 4); ctx.fillRect(36, 8, 4, 4); ctx.fillRect(22, 5, 4, 4);
  });

})(window.GF = window.GF || {});
