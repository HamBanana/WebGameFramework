// modules/MainSceneEnhancements.js — animated space backdrop for the Main scene.
//
// layer < 0 so this paints BEFORE world.draw. At the default layer (0) it would
// render *after* the entities and bury the player and the whole invader
// formation under an opaque gradient.
(function (GF) {
  'use strict';

  GF.sceneModule('MainSceneEnhancements', {
    scene: 'Main',
    order: -100,
    layer: -100,
    phases: ['play', 'boss'],

    enter(scene, engine) {
      this._t = 0;
      scene._starField = this.createStarField(engine.config.width, engine.config.height);
    },

    createStarField(width, height) {
      var stars = [];
      for (var i = 0; i < 100; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 0.5,
          speed: Math.random() * 20 + 5,
          brightness: 0.2 + Math.random() * 0.8,
          twinkleSpeed: Math.random() * 0.5 + 0.1,
        });
      }
      return stars;
    },

    update(dt, scene, engine) {
      var step = scene.scaledDt || dt;
      this._t = (this._t || 0) + step;

      var stars = scene._starField;
      if (!stars) return;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.y += s.speed * step;
        if (s.y > engine.config.height) {
          s.y = -5;
          s.x = Math.random() * engine.config.width;
        }
        s.brightness += s.twinkleSpeed * step;
        if (s.brightness > 1)   { s.brightness = 1;   s.twinkleSpeed = -s.twinkleSpeed; }
        if (s.brightness < 0.2) { s.brightness = 0.2; s.twinkleSpeed = -s.twinkleSpeed; }
      }
    },

    render(ctx, scene, engine) {
      var W = engine.config.width;
      var H = engine.config.height;
      var colors = (GF.GAME_CONFIG && GF.GAME_CONFIG.colors) || {};
      var t = this._t || 0;

      // Background gradient
      var stops = colors.bgGradient || ['#1a0d1a', '#0d0d2e'];
      var bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, stops[0]);
      bg.addColorStop(1, stops[stops.length - 1]);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Drifting nebulae
      var nebulas = colors.nebula || [];
      for (var i = 0; i < nebulas.length; i++) {
        if (typeof nebulas[i] !== 'string') continue;
        ctx.fillStyle = nebulas[i];
        ctx.beginPath();
        ctx.arc(W / 2 + Math.sin(t * 0.3 + i) * 50, H / 3 + i * 30, 150 + i * 30, 0, Math.PI * 2);
        ctx.fill();
      }

      // Star field
      var stars = scene._starField;
      if (!stars) return;
      for (var j = 0; j < stars.length; j++) {
        var s = stars[j];
        ctx.fillStyle = 'rgba(255, 255, 255, ' + s.brightness.toFixed(2) + ')';
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }
    },
  });
})(window.GF = window.GF || {});
