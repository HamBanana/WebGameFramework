// modules/Controls.js — input bindings.
(function (GF) {
  'use strict';
  GF.sceneModule('Controls', {
    scene: '*',
    order: -100,
    init(scene, engine) {
      engine.input
        .bind('left',  'KeyA', 'ArrowLeft')
        .bind('right', 'KeyD', 'ArrowRight')
        .bind('fire',  'Space', 'KeyZ', 'KeyJ')
        .bind('confirm', 'Space', 'Enter')
        .bind('pause', 'Escape', 'KeyP', 'KeyK');
    },
  });
})(window.GF);
