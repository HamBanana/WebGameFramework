// behaviors/FormationMove.js — alien formation moves as one body.
// Reads world.data.dir (+1 right, -1 left), world.data.speed.
// Drops when hitting an edge.
(function (GF) {
  'use strict';
  GF.behavior('FormationMove', (cfg) => {
    var dropAmount = cfg.dropAmount || 16;
    var margin = cfg.edgeMargin || 8;
    return {
      update(dt, e, world) {
        var dt = (world.scene && world.scene.scaledDt) || dt;
        var dir = world.data.dir || 1;
        var speed = world.data.speed || 30;
        e.x += dir * speed * dt;

        // Check edge hit on this alien only
        var W = world.engine ? world.engine.config.width : 480;
        if (e.x < margin || e.x + e.w > W - margin) {
          // Only first alien to hit edge triggers the formation response
          if (!world.data._edgeHitThisFrame) {
            world.data._edgeHitThisFrame = true;
            world.data.dir = -dir;
            var allies = world.byTag('alien');
            for (var i = 0; i < allies.length; i++) {
              var ally = allies[i];
              ally.y += dropAmount;
              if (ally.x < margin) ally.x = margin;
              if (ally.x + ally.w > W - margin) ally.x = W - margin - ally.w;
            }
          }
        }
      }
    };
  }));
})(window.GF);
