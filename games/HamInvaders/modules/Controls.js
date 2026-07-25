// modules/Controls.js — action bindings, shared by every scene.
//
// Everything downstream reads named actions ('left', 'fire', 'confirm'), never
// key codes, so re-binding or adding an input device touches only this file
// and modules/Touch.js.
(function (GF) {
  'use strict';

  GF.sceneModule('Controls', {
    scene: '*',
    order: -100,

    init(scene, engine) {
      engine.input
        .bind('left',    'KeyA', 'ArrowLeft')
        .bind('right',   'KeyD', 'ArrowRight')
        .bind('fire',    'Space')
        .bind('confirm', 'Space', 'Enter');
    },
  });

})(window.GF);
