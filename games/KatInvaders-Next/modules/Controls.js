// modules/Controls.js — input bindings.
(function (GF) {
  'use strict';
  GF.sceneModule('Controls', {
    scene: '*',
    order: -100,
    init(scene, engine) {
      engine.input
        .bind('left',  'KeyA', 'ArrowLeft')
        .bind('right', 'KeyD', 'ArrowRight')
        .bind('fire',  'Space', 'KeyZ', 'KeyJ')
        .bind('confirm', 'Space', 'Enter')
        .bind('pause', 'Escape', 'KeyP', 'KeyK')
        .bind('boss', 'KeyB');
    },

    // B key = mid-game "Boss Rush" (R2-4): the title screen promises it, so
    // deliver — summon the current level's boss immediately from play.
    // The wave is cleared first so the fight is clean; defeating the boss
    // then advances to the next level via Waves.onPhase.
    update(dt, scene, engine) {
      if (scene.phase === 'play' && engine.input.wasPressed('boss')) {
        scene.world.byTag('alien').forEach(function (a) { a.destroy(); });
        scene.world.byTag('alienShot').forEach(function (s) { s.destroy(); });
        scene.setPhase('boss');
      }
    },
  });
})(window.GF);
