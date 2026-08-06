// modules/Particles.js — particle effects on kills and explosions.
(function (GF) {
  'use strict';
  GF.sceneModule('Particles', {
    scene: 'Main',
    layer: 50,
    phases: ['play', 'boss'],

    init(scene, engine) {
      scene.events.on('alien:killed', function (hit) {
        var cfg = GF.GAME_CONFIG || {};
        var pCfg = cfg.particles || {};
        var colors = ['#ff8ec4', '#ff99cc', '#ffccdd', '#ffffff', '#ff6699'];
        var p = GF.game && GF.game.engine && GF.game.engine.particles;
        if (!p) return;
        p.emit(hit.x, hit.y, {
          count: 12,
          speed: [50, 150],
          life: [0.3, 0.7],
          size: [2, 5],
          color: colors[Math.floor(Math.random() * colors.length)],
          fadeOut: true,
        });
      });

      scene.events.on('smartbomb:detonate', function () {
        var engine = GF.game && GF.game.engine;
        if (!engine || !engine.particles) return;
        var W = engine.config.width, H = engine.config.height;
        // Big flash
        engine.particles.emit(W / 2, H / 2, {
          count: 40,
          speed: [100, 300],
          life: [0.2, 0.5],
          size: [3, 8],
          color: '#ffffff',
          fadeOut: true,
        });
      });

      scene.events.on('boss:dead', function () {
        var engine = GF.game && GF.game.engine;
        if (!engine || !engine.particles) return;
        // Massive explosion
        for (var i = 0; i < 3; i++) {
          setTimeout(function () {
            if (engine && engine.particles) {
              engine.particles.emit(
                engine.config.width / 2 + (Math.random() - 0.5) * 100,
                80 + (Math.random() - 0.5) * 40,
                { count: 20, speed: [80, 200], life: [0.4, 0.8], size: [3, 7], color: '#ff4488', fadeOut: true }
              );
            }
          }, i * 200);
        }
      });
    },
  });
})(window.GF);
