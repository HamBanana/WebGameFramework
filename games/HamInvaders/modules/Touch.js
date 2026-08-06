// modules/Touch.js — on-canvas controls for phones, drawn above everything.
//
// The joystick feeds the same 'left'/'right' actions as the keyboard, and the
// fire button taps 'fire' AND 'confirm' — mirroring Space, which is bound to
// both, so the same button also dismisses the game-over screen.
//
// This used to be PatchTouch.js, which reached into Main.prototype.init and
// Main.prototype.render because the scene was the only place to hook. Deleting
// this file now removes touch support cleanly; nothing else references it.
(function (GF) {
  'use strict';

  GF.sceneModule('Touch', {
    scene: 'Main',
    layer: 300,

    init(scene, engine) {
      // The framework attaches an automatic layout to every game; this module
      // replaces it with a hand-tuned one (adding ours evicts the automatic
      // system), because the fire button here also has to dismiss game over.
      let touch = engine.getSystem('touch');
      if (!touch || touch._auto) {
        touch = new GF.TouchControls({ autoRender: false });
        engine.addSystem(touch);
        touch
          .addJoystick({
            id: 'move', anchor: 'bl', x: 90, y: 90, radius: 56,
            actions: { left: 'left', right: 'right' },
          })
          .addButton({
            id: 'fire', action: 'fire', label: '🔥', anchor: 'br', x: 70, y: 70, r: 34,
            onTap: () => engine.input.tapAction('confirm'),
          });
      }
      this.touch = touch;
    },

    render(ctx, scene, engine) {
      if (this.touch) this.touch.draw(ctx);
    },
  });

})(window.GF);
