// behaviors/Bob.js — a gentle vertical wobble layered on top of whatever else
// moves the entity. It tracks the offset it applied last frame and backs it out
// first, so it composes with velocity (falling powerups) or with another
// system writing y directly (the invader formation's edge drops) instead of
// fighting either.
//
// cfg.phase pins the starting point of the sine. Left unset each entity starts
// at a random phase, which suits scattered pickups; a group that should read as
// one body wants its phase set deliberately — see modules/Waves.js, which
// staggers it across the grid so the formation ripples instead of shimmering.
(function (GF) {
  'use strict';

  GF.behavior('Bob', (cfg) => ({
    onAdd(e) {
      e.data.bobT = cfg.phase != null ? cfg.phase : Math.random() * Math.PI * 2;
      e.data.bobApplied = 0;
    },
    update(dt, e) {
      e.y -= e.data.bobApplied;                       // undo last frame's wobble
      e.data.bobT += dt * (cfg.speed || 5);
      e.data.bobApplied = Math.sin(e.data.bobT) * (cfg.amp || 3);
      e.y += e.data.bobApplied;
    },
  }));

})(window.GF);
