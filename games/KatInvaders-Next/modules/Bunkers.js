// modules/Bunkers.js — place and draw destructible bunkers.
(function (GF) {
  'use strict';
  GF.sceneModule('Bunkers', {
    scene: 'Main',
    layer: 1,

    enter(scene, engine) {
      var cfg = GF.GAME_CONFIG || {};
      var bunkerCfg = cfg.bunkers || {};
      var count = bunkerCfg.count || 4;
      var spacing = bunkerCfg.spacing || 100;
      var startY = bunkerCfg.startY || 520;
      var W = engine.config.width;
      var startX = (W - (count - 1) * spacing) / 2 - (bunkerCfg.width || 48) / 2;

      for (var i = 0; i < count; i++) {
        var bx = startX + i * spacing;
        var by = startY;
        var bunker = scene.world.spawn('bunker', bx, by);
        if (bunker) {
          bunker.data.health = bunkerCfg.health || 8;
          bunker.data.maxHealth = bunkerCfg.health || 8;
        }
      }
    },

    render(ctx, scene) {
      var cfg = GF.GAME_CONFIG || {};
      var bunkerCfg = cfg.bunkers || {};
      var color = bunkerCfg.color || '#ffccdd';

      var bunkers = scene.world.byTag('bunker');
      for (var i = 0; i < bunkers.length; i++) {
        var b = bunkers[i];
        var healthRatio = (b.data.health || 0) / (b.data.maxHealth || 8);
        var alpha = 0.5 + 0.5 * healthRatio;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        // Draw bunker shape (arch)
        var bx = b.x, by = b.y, bw = b.w, bh = b.h;
        ctx.fillRect(bx, by + bh * 0.4, bw, bh * 0.6);
        ctx.fillRect(bx + bw * 0.2, by, bw * 0.6, bh * 0.5);
        ctx.fillRect(bx + bw * 0.35, by + bh * 0.5, bw * 0.3, bh * 0.5);
        ctx.restore();
      }
    },
  });
})(window.GF);
