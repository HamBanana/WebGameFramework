// modules/Title.js — the title card.
//
// Attaches to the 'TitleScreen' scene, which (like 'Main') is just a
// GF.GameScene: no scene file exists for either. It spawns nothing, so its
// entity world stays empty and only this module draws.
(function (GF) {
  'use strict';

  GF.sceneModule('Title', {
    scene: 'TitleScreen',
    layer: 100,

    init(scene, engine) {
      // Touch devices have no Space/Enter — let a tap on the canvas stand in.
      // `active` is gated on enter/exit so a tap can't also fire 'confirm'
      // while Main is pushed on top of this scene.
      this.active = false;
      engine.canvas.style.touchAction = 'none';
      engine.canvas.addEventListener('pointerdown', (e) => {
        if (!this.active) return;
        e.preventDefault();
        engine.input.tapAction('confirm');
      });
    },

    enter() { this.active = true; },
    exit()  { this.active = false; },

    update(dt, scene, engine) {
      if (engine.input.wasPressed('confirm')) scene.push('Main');
    },

    render(ctx, scene, engine) {
      const W = engine.config.width;
      const H = engine.config.height;
      const cx = W / 2;

      GF.UISystem.drawText(ctx, 'HAM INVADERS', cx, H / 2 - 60,
        { align: 'center', font: '48px monospace', color: '#ff6b6b' });
      GF.UISystem.drawText(ctx, '🐷 vs 👾', cx, H / 2 - 10,
        { align: 'center', font: '36px monospace', color: '#fff' });
      GF.UISystem.drawText(ctx, 'Arrow Keys / A,D to move', cx, H / 2 + 30,
        { align: 'center', font: '18px monospace', color: '#aaa' });
      GF.UISystem.drawText(ctx, 'Space to fire', cx, H / 2 + 55,
        { align: 'center', font: '18px monospace', color: '#aaa' });

      const hint = GF.TouchControls.isTouchDevice() ? 'Tap to Start' : 'Press Space to Start';
      GF.UISystem.drawText(ctx, hint, cx, H / 2 + 100,
        { align: 'center', font: '22px monospace', color: '#ffeb3b' });
    },
  });

})(window.GF);
