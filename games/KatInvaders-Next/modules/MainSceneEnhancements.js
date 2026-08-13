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
      for (var i = 0; i < 60; i++) {
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

      // Drifting nebulae (batched)
      var nebulas = colors.nebula || [];
      if (nebulas.length > 0) {
        ctx.beginPath();
        for (var i = 0; i < nebulas.length; i++) {
          if (typeof nebulas[i] !== 'string') continue;
          ctx.moveTo(W / 2 + Math.sin(t * 0.3 + i) * 50 + 150 + i * 30, H / 3 + i * 30);
          ctx.arc(W / 2 + Math.sin(t * 0.3 + i) * 50, H / 3 + i * 30, 150 + i * 30, 0, Math.PI * 2);
        }
        ctx.fillStyle = nebulas[0];
        ctx.fill();
      }

      // Star field — batch by brightness to minimize fillStyle changes
      var stars = scene._starField;
      if (!stars) return;
      var buckets = [[], [], [], [], []]; // 5 brightness buckets
      for (var j = 0; j < stars.length; j++) {
        var s = stars[j];
        var bucket = Math.min(4, Math.floor(s.brightness * 5));
        buckets[bucket].push(s);
      }
      var brightLevels = ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,1.0)'];
      for (var b = 0; b < 5; b++) {
        var bucket = buckets[b];
        if (bucket.length === 0) continue;
        ctx.fillStyle = brightLevels[b];
        for (var k = 0; k < bucket.length; k++) {
          var st = bucket[k];
          ctx.fillRect(st.x, st.y, st.size, st.size);
        }
      }

      // Cool level transition: white flash + radial wipe
      var trans = scene._levelTransition;
      if (trans) {
        var p = Math.min(1, trans.progress);
        // Flash out
        var flashAlpha = Math.max(0, 1 - p * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + (flashAlpha * 0.9) + ')';
        ctx.fillRect(0, 0, W, H);
        // Radial wipe from center
        var radius = p * Math.max(W, H) * 0.9;
        var grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, radius);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,' + (p * 0.8) + ')');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        // Level text pop
        if (p > 0.5) {
          ctx.save();
          ctx.globalAlpha = (p - 0.5) * 2;
          ctx.fillStyle = '#ffccff';
          ctx.font = 'bold 48px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = '#ff69b4';
          ctx.shadowBlur = 20;
          ctx.fillText('LEVEL ' + scene.state.level, W/2, H/2);
          ctx.restore();
        }
      }
    },
  });
})(window.GF = window.GF || {});
