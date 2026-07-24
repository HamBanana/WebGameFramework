// parts/PatchTouch.js — adds mobile touch controls to the locked Main scene
// WITHOUT editing parts/Main.js (see README §35 "Locked files").
//
// Joystick (bottom-left) drives left/right movement the same way A/D or the
// arrow keys do (Player.update reads isDown('left')/isDown('right')).
// The fire button (bottom-right) taps 'fire' AND 'confirm' on every press —
// mirroring the keyboard, where Space is bound to both actions, so the same
// button also advances the game-over screen.
(function (G, GF) {
  'use strict';

  window.addEventListener('GF:ready', () => {
    const Main = G.scenes.Main;
    if (!Main) return;

    const origInit = Main.prototype.init;
    Main.prototype.init = function (engine) {
      origInit.call(this, engine);

      let touch = engine.getSystem('touch');
      if (!touch) {
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
    };

    const origRender = Main.prototype.render;
    Main.prototype.render = function (ctx, engine) {
      origRender.call(this, ctx, engine);
      const touch = engine.getSystem('touch');
      if (touch) touch.draw(ctx);
    };
  });

  G.components.PatchTouch = true;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
