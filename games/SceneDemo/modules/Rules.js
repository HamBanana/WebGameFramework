// modules/Rules.js — the code half of a data-authored level.
//
// Layout (which orbs exist and where) is data and lives in levels/main.json,
// edited in tools/editor.html. Rules that need real code — scoring, HUD, win
// state — are a scene module, exactly like every other module in the framework.
// A data level is a GF.GameScene, so nothing special is needed to attach one.
(function (GF) {
  'use strict';

  GF.sceneModule('Rules', {
    scene: 'Main',
    layer: 100,

    init(scene) {
      // Registered once. Rules are tag-based, so they need no entities yet, and
      // world.clear() on re-entry leaves them in place — registering here rather
      // than in enter() is what stops a retry stacking duplicate rules.
      //
      // The level document's own rule removes the orb; this only counts. Module
      // rules are registered before the document's, so the count still sees the
      // pair before it is destroyed — see GF.applyOverlaps.
      scene.world.onOverlap('player', 'orb', () => { scene.state.score++; });
    },

    enter(scene) {
      // Read the total from what the level actually placed, so adding orbs in
      // the editor needs no matching code change.
      scene.state.total = scene.world.count('orb');
      scene.state.score = 0;
    },

    render(ctx, scene, engine) {
      GF.UISystem.drawText(ctx,
        'Orbs: ' + scene.state.score + ' / ' + scene.state.total, 12, 12,
        { color: '#fff', font: '18px monospace' });

      if (scene.state.total && scene.state.score >= scene.state.total) {
        GF.UISystem.drawText(ctx, 'All collected!',
          engine.config.width / 2, engine.config.height / 2,
          { color: '#4fe0c0', align: 'center', font: '26px monospace' });
      }
    },
  });

})(window.GF);
