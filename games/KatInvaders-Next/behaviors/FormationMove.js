// behaviors/FormationMove.js — alien formation moves as one body.
// Reads world.data.dir (+1 right, -1 left), world.data.speed.
// Drops when hitting an edge.
(function (GF) {
  'use strict';
  GF.behavior('FormationMove', (cfg) => ({
    onAdd(e, world) {
      var W = world.engine ? world.engine.config.width : 'NO_ENGINE';
      console.log('[FormationMove] onAdd: e.x=' + e.x + ' e.y=' + e.y + ' e.w=' + e.w + ' e.h=' + e.h + ' W=' + W);
    },
    update(dt, e, world) {
      var dt = (world.scene && world.scene.scaledDt) || dt;
      var dir = world.data.dir || 1;
      var speed = world.data.speed || 30;
      e.x += dir * speed * dt;

      // Check if any alien hit the edge
      var W = world.engine ? world.engine.config.width : 480;
      var margin = cfg.edgeMargin || 8;
      var hitEdge = false;
      var allies = world.byTag('alien');
      for (var i = 0; i < allies.length; i++) {
        var a = allies[i];
        if (a.x < margin || a.x + a.w > W - margin) {
          if (!world.data._edgeHitLogged) {
            console.log('[FormationMove] edge hit! a.x=' + a.x + ' a.w=' + a.w + ' right=' + (a.x + a.w) + ' W=' + W + ' margin=' + margin + ' limit=' + (W - margin));
            world.data._edgeHitLogged = true;
          }
          hitEdge = true;
          break;
        }
      }
      if (hitEdge) {
        world.data.dir = -dir;
        // Drop all aliens and pull them back in bounds
        for (var j = 0; j < allies.length; j++) {
          var ally = allies[j];
          ally.y += cfg.dropAmount || 16;
          if (ally.x < margin) ally.x = margin;
          if (ally.x + ally.w > W - margin) ally.x = W - margin - ally.w;
        }
      }
    },
  }));
})(window.GF);
