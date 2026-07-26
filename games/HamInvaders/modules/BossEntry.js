// modules/BossEntry.js — jump straight to the boss fight from the title card.
//
// The boss is reached in normal play by clearing every wave (see
// modules/BossWave.js); this is the shortcut for testing and tuning it without
// playing through first. A separate file rather than an edit to
// modules/Title.js, so deleting it removes the shortcut cleanly.
(function (GF) {
  'use strict';

  GF.sceneModule('BossEntry', {
    scene: 'TitleScreen',
    layer: 101,        // just above Title's own text

    init(scene, engine) {
      engine.input.bind('boss', 'KeyB');
    },

    update(dt, scene, engine) {
      // 'Boss' resolves through GAME.scenes, where scenes/boot.js registered it
      // as GF.dataScene('boss') — i.e. levels/boss.json.
      if (engine.input.wasPressed('boss')) scene.push('Boss');
    },

    render(ctx, scene, engine) {
      GF.UISystem.drawText(ctx, 'Press B to skip to the BOSS',
        engine.config.width / 2, engine.config.height / 2 + 130,
        { align: 'center', font: '18px monospace', color: '#c39bd3' });
    },
  });

})(window.GF);
