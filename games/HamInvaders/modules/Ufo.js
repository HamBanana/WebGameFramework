// modules/Ufo.js — the bonus saucer that crosses the top of the screen.
(function (GF) {
  'use strict';

  GF.sceneModule('Ufo', {
    scene: 'Main',
    order: -5,
    phases: ['play'],

    enter(scene) { this.timer = scene.config.ufoInterval || 20; },

    update(dt, scene, engine) {
      this.timer -= dt;
      if (this.timer > 0 || scene.world.count('ufo') > 0) return;

      this.timer = scene.config.ufoInterval || 20;

      const W = engine.config.width;
      const speed = scene.config.ufoSpeed || 100;
      const dir = Math.random() < 0.5 ? 1 : -1;
      const ufo = scene.world.spawn('ufo', 0, 20);
      if (!ufo) return;
      ufo.x = dir === 1 ? -ufo.w : W;
      ufo.vx = speed * dir;
    },
  });

})(window.GF);
