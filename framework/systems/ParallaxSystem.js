// GameFramework/framework/systems/ParallaxSystem.js
// Multi-layer horizontal/vertical parallax scrolling.
//
// You give the system a list of layer descriptors. Each layer has its own
// scroll factor (0 = static like sky, 1 = same speed as the camera/world).
// The framework draws layers in order; you supply a per-layer draw callback.
//
// Use it for:
//   - infinite-side-scroller backgrounds (RoadToSkagen)
//   - skyboxes / starfield (SpaceInvaders)
//   - menus with depth
//
// Example:
//   const parallax = new GF.ParallaxSystem({
//     layers: [
//       { factor: 0.1, draw: drawSky      },   // moves slowest
//       { factor: 0.4, draw: drawMountains, tile: 800 },  // tiles every 800 px
//       { factor: 0.8, draw: drawTrees,    tile: 400 },
//       { factor: 1.0, draw: drawRoad     },   // foreground
//     ],
//   });
//   ...
//   parallax.scrollX = camera.x;
//   parallax.draw(ctx);

(function (GF) {
  'use strict';

  function ParallaxSystem(opts) {
    opts = opts || {};
    this.layers   = (opts.layers || []).map(function (l) { return Object.assign({}, l); });
    this.scrollX  = opts.scrollX || 0;
    this.scrollY  = opts.scrollY || 0;
    this.viewportW = opts.viewportW || 800;
    this.viewportH = opts.viewportH || 450;
  }

  ParallaxSystem.prototype.addLayer = function (layer) {
    this.layers.push(Object.assign({}, layer));
    return this.layers[this.layers.length - 1];
  };

  ParallaxSystem.prototype.removeLayer = function (layer) {
    var i = this.layers.indexOf(layer);
    if (i >= 0) this.layers.splice(i, 1);
  };

  // Update is optional — only useful if a layer wants its own animation timer.
  ParallaxSystem.prototype.update = function (dt) {
    for (var i = 0; i < this.layers.length; i++) {
      var l = this.layers[i];
      if (typeof l.update === 'function') l.update(dt);
    }
  };

  ParallaxSystem.prototype.draw = function (ctx) {
    for (var i = 0; i < this.layers.length; i++) {
      var l = this.layers[i];
      var ox = -this.scrollX * (l.factor || 1) - (l.offsetX || 0);
      var oy = -this.scrollY * (l.factorY != null ? l.factorY : 0) - (l.offsetY || 0);

      ctx.save();
      if (l.tile) {
        // Wrap layer horizontally every l.tile pixels.
        var t = l.tile;
        var startX = ox % t;
        if (startX > 0) startX -= t;
        for (var x = startX; x < this.viewportW; x += t) {
          ctx.save();
          ctx.translate(x, oy);
          if (l.draw) l.draw(ctx, l, this);
          ctx.restore();
        }
      } else {
        ctx.translate(ox, oy);
        if (l.draw) l.draw(ctx, l, this);
      }
      ctx.restore();
    }
  };

  GF.ParallaxSystem = ParallaxSystem;

})(window.GF = window.GF || {});
