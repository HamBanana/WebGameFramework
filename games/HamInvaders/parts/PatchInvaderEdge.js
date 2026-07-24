// parts/PatchInvaderEdge.js — fixes the locked Main scene's invader-formation
// edge-drop firing repeatedly for a single edge touch, WITHOUT editing
// parts/Main.js (see README §35 "Locked files").
//
// Main's update() reverses direction + drops the formation whenever any
// invader is within a few px of the screen edge (`x + w >= W - 4` / `x <= 4`).
// That check runs off the invaders' position from the END of the previous
// frame, so after a stutter/GC pause produces one large-dt frame, the
// formation can land WAY past the threshold in a single jump. Reversing
// direction and moving back by one normal frame's distance isn't enough to
// clear a large overshoot, so the check keeps re-firing — reverse, drop,
// reverse, drop — every frame until the small steps finally claw back past
// the line. That's what shows up as a sudden multi-step fall instead of one
// clean 16px drop.
//
// Fix: after each locked update() call, if invaderDir flipped (i.e. a drop
// just happened), clamp the formation back within Main's own edge-check
// band. This never touches a frame where no drop occurred, so normal
// gameplay is untouched — it only prevents the SAME edge touch from
// re-triggering next frame regardless of how large the overshoot was.
(function (G, GF) {
  'use strict';

  window.addEventListener('GF:ready', () => {
    const Main = G.scenes.Main;
    if (!Main) return;

    const EDGE_BAND = 4;  // matches Main's own `W - 4` / `<= 4` check
    const MARGIN = 1;     // clamp strictly clear of that band

    const origUpdate = Main.prototype.update;
    Main.prototype.update = function (dt, engine) {
      const dirBefore = this.invaderDir;
      origUpdate.call(this, dt, engine);

      if (this.phase === 'play' && this.invaderDir !== dirBefore &&
          this.invaders && this.invaders.length) {
        const W = engine.config.width;
        for (const inv of this.invaders) {
          const rightLimit = W - EDGE_BAND - inv.w - MARGIN;
          const leftLimit = EDGE_BAND + MARGIN;
          if (inv.x > rightLimit) inv.x = rightLimit;
          else if (inv.x < leftLimit) inv.x = leftLimit;
        }
      }
    };
  });

  G.components.PatchInvaderEdge = true;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
