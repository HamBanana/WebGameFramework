// modules/Formation.js — marches the invaders sideways and drops them a row
// when the block reaches an edge. Runs at order -10, i.e. before the world's
// collision pass, so this frame's hits are tested against this frame's
// positions.
//
// The edge test is deliberately followed by a clamp. This replaces
// PatchInvaderEdge.js, which existed only because the bug was unreachable
// without editing a locked scene:
//
//   The edge check reads positions from the end of the previous frame. After a
//   GC pause or a tab-switch produces one oversized dt, the block can jump far
//   past the threshold in a single step. Reversing direction then moves it back
//   by only one normal frame's distance — not enough to clear a large
//   overshoot — so the check re-fires every frame (reverse, drop, reverse,
//   drop) until the small steps finally claw back past the line. On screen that
//   reads as a sudden multi-row plunge instead of one clean 16px drop.
//
// Clamping the block back inside the band after a drop means the same edge
// touch cannot re-trigger, no matter how big the overshoot was. Frames without
// a drop are untouched.
(function (GF) {
  'use strict';

  const EDGE = 4;      // how close to the wall counts as "at the edge"
  const MARGIN = 1;    // clamp strictly clear of that band

  GF.sceneModule('Formation', {
    scene: 'Main',
    order: -10,
    phases: ['play'],

    update(dt, scene, engine) {
      const invaders = scene.world.byTag('invader');
      if (!invaders.length) return;

      const W = engine.config.width;
      const data = scene.world.data;
      const drop = scene.config.dropAmount || 16;

      const atEdge = invaders.some(inv => inv.right >= W - EDGE || inv.x <= EDGE);
      if (atEdge) {
        data.dir *= -1;
        const rightLimit = W - EDGE - MARGIN;
        const leftLimit = EDGE + MARGIN;
        for (const inv of invaders) {
          inv.y += drop;
          if (inv.right > rightLimit) inv.x = rightLimit - inv.w;
          else if (inv.x < leftLimit) inv.x = leftLimit;
        }
      }

      const step = data.speed * data.dir * dt;
      for (const inv of invaders) inv.x += step;
    },
  });

})(window.GF);
