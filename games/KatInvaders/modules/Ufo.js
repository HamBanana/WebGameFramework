// modules/Ufo.js — mystery UFO spawns periodically.
(function (GF) {
  'use strict';
  GF.sceneModule('Ufo', {
    scene: 'Main',
    phases: ['play'],

    enter(scene) { this.timer = 0; },

    update(dt, scene) {
      var cfg = GF.GAME_CONFIG || {};
      var ufoCfg = cfg.ufo || {};
      var interval = ufoCfg.appearanceInterval || 25;
      this.timer += dt;

      if (this.timer >= interval && scene.world.count('ufo') === 0) {
        this.timer = 0;
        var ufo = scene.world.spawn('ufo', -40, 40);
        if (ufo) {
          ufo.vx = ufoCfg.speed || 100;
        }
      }
    },
  });
})(window.GF);
