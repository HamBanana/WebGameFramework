// modules/Hud.js — score, lives and the active-powerup strip.
// Draws at layer 100, i.e. above the entity world but below touch controls.
(function (GF, G) {
  'use strict';

  GF.sceneModule('Hud', {
    scene: 'Main',
    layer: 100,
    phases: ['play'],

    render(ctx, scene, engine) {
      const W = engine.config.width;
      const player = scene.world.first('player');
      const style = { font: '20px monospace', color: '#fff', align: 'left', baseline: 'top' };

      GF.UISystem.drawText(ctx, 'Score: ' + scene.state.score, 12, 12, style);
      GF.UISystem.drawText(ctx, 'Lives: ' + (player ? player.data.lives : 0), W - 120, 12, style);

      if (!player) return;

      // One badge per held powerup, driven by data/powerups.js.
      let x = 12;
      for (const type in G.powerupTypes) {
        const def = G.powerupTypes[type];
        if (!def.hud || !player.data.hasPowerup(type)) continue;
        const stacks = player.data.powerupCount(type);
        GF.UISystem.drawText(ctx, def.hud + (stacks > 1 ? ' x' + stacks : ''), x, 40,
          { font: '14px monospace', color: def.color, align: 'left', baseline: 'top' });
        x += 60;
      }
    },
  });

})(window.GF, window.GAME = window.GAME || {});
