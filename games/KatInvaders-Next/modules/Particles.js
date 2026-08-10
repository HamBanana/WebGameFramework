// modules/Particles.js — particle effects on kills and explosions.
(function (GF) {
  'use strict';
  GF.sceneModule('Particles', {
    scene: 'Main',
    layer: 50,
    phases: ['play', 'boss'],

    init(scene, engine) {
      var p = (engine && engine.getSystem('ParticleSystem')) || (GF.game && GF.game.particles);
      if (!p) {
        console.warn('[Particles] No particle system available');
        return;
      }


      scene.events.on('alien:killed', function (hit) {
        var tierColors = [
          ['#ff69b4', '#ff8ec4', '#ff99cc', '#ffccdd', '#ffffff'],
          ['#88ccff', '#66aaff', '#aaddff', '#ffffff'],
          ['#88ffaa', '#aaffcc', '#ccffdd', '#ffffff'],
          ['#ffaa66', '#ffcc88', '#ffeeaa', '#ffffff'],
          ['#ff6688', '#ff8899', '#ffbbcc', '#ffffff'],
        ];
        var tier = (hit.tier || 0);
        var colors = tierColors[tier] || tierColors[0];
        p.burst(hit.x, hit.y, {
          count: 15,
          speed: [60, 180],
          life: [0.3, 0.7],
          size: [2, 6],
          colors: colors,
          gravity: 150,
          fadeOut: true,
          shrink: true,
        });
      });

      scene.events.on('minion:killed', function (hit) {
        p.burst(hit.x, hit.y, {
          count: 10,
          speed: [50, 140],
          life: [0.25, 0.5],
          size: [2, 4],
          colors: ['#ff66bb', '#ff88cc', '#ffbbdd'],
          fadeOut: true,
          shrink: true,
        });
      });

      scene.events.on('ufo:killed', function (hit) {
        p.burst(hit.x, hit.y, {
          count: 25,
          speed: [80, 220],
          life: [0.4, 0.9],
          size: [3, 8],
          colors: ['#ff6699', '#ff4488', '#ff88bb', '#ffffff'],
          gravity: 100,
          fadeOut: true,
          shrink: true,
        });
      });

      scene.events.on('smartbomb:detonate', function () {
        if (!p) return;
        var W = engine.config.width, H = engine.config.height;
        // Big flash
        p.burst(W / 2, H / 2, {
          count: 50,
          speed: [120, 350],
          life: [0.25, 0.5],
          size: [3, 10],
          colors: ['#ffffff', '#ffff88', '#ffcc00', '#ff8800'],
          fadeOut: true,
          shrink: true,
        });
      });

      scene.events.on('boss:dead', function () {
        if (!p) return;
        // Massive explosion — staggered bursts using scene timer instead of setTimeout
        var bursts = [{}, {}, {}, {}, {}];
        var timer = 0;
        var done = 0;
        var update = function(dt) {
          timer += dt;
          for (var i = 0; i < 5; i++) {
            if (!bursts[i].done && timer >= i * 0.18) {
              bursts[i].done = true;
              p.burst(
                engine.config.width / 2 + (Math.random() - 0.5) * 120,
                80 + (Math.random() - 0.5) * 50,
                { count: 20, speed: [80, 220], life: [0.4, 0.9], size: [3, 8],
                  colors: ['#ff2277', '#ff4488', '#ff66aa', '#ffbbcc', '#ffffff'],
                  gravity: 200, fadeOut: true, shrink: true }
              );
              done++;
            }
          }
          if (done < 5) scene._bossExplosionUpdate = update;
        };
        scene._bossExplosionUpdate = update;
      });

      // Player hurt (lose a life)
      scene.events.on('player:hurt', function (hit) {
        p.burst(hit.x, hit.y, {
          count: 18,
          speed: [70, 200],
          life: [0.3, 0.7],
          size: [3, 7],
          colors: ['#ff8ec4', '#ff69b4', '#ff4488', '#ffffff'],
          gravity: 150,
          fadeOut: true,
          shrink: true,
        });
      });

      // Player died (game over)
      scene.events.on('player:died', function (hit) {
        // Big heartbreak explosion — staggered bursts using scene timer
        var bursts = [{}, {}, {}];
        var timer = 0;
        var done = 0;
        var update = function(dt) {
          timer += dt;
          for (var i = 0; i < 3; i++) {
            if (!bursts[i].done && timer >= i * 0.15) {
              bursts[i].done = true;
              p.burst(
                hit.x + (Math.random() - 0.5) * 20,
                hit.y + (Math.random() - 0.5) * 10,
                { count: 25, speed: [60, 200], life: [0.5, 1.2], size: [3, 9],
                  colors: ['#ff8ec4', '#ff4488', '#ff2277', '#ff69b4', '#ffffff', '#ff0044'],
                  gravity: 200, fadeOut: true, shrink: true }
              );
              done++;
            }
          }
          if (done < 3) scene._playerDeathExplosionUpdate = update;
        };
        scene._playerDeathExplosionUpdate = update;
      });

      // Bunker destroyed
      scene.events.on('bunker:destroyed', function (hit) {
        p.burst(hit.x, hit.y, {
          count: 20,
          speed: [40, 150],
          life: [0.4, 0.9],
          size: [3, 7],
          colors: ['#ffccdd', '#ff99bb', '#ff6699', '#ffffff'],
          gravity: 250,
          fadeOut: true,
          shrink: true,
        });
      });
    },

    update(dt, scene, engine) {
      var step = scene.scaledDt || dt;
      if (scene._bossExplosionUpdate) scene._bossExplosionUpdate(step);
      if (scene._playerDeathExplosionUpdate) scene._playerDeathExplosionUpdate(step);
    },
  });
})(window.GF);
