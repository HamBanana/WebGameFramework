// modules/Background.js — the deep-space fill, drawn beneath the entity world
// (negative layer). Swapping in a starfield or a parallax backdrop is a change
// to this file only.
(function (GF) {
  'use strict';

  GF.sceneModule('Background', {
    scene: '*',
    layer: -100,

    render(ctx, scene, engine) {
      ctx.fillStyle = scene.config.background || '#1a1a2e';
      ctx.fillRect(0, 0, engine.config.width, engine.config.height);
    },
  });

})(window.GF);
