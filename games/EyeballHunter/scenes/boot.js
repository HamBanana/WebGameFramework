// parts/boot.js — boots the game once the framework is ready.
// Auto-loaded LAST. Rarely edited: it starts the scene named in
// GF.GAME_CONFIG.game.startScene (default 'Main'), else the first registered.
(function (G, GF) {
  'use strict';
  window.addEventListener('GF:ready', () => {
    const cfg = GF.GAME_CONFIG;
    const game = GF.createGame(cfg.engine, cfg.physics, {
      gameName: cfg.game.name,
      audio: true, tweens: true, particles: true, scenes: true, debug: false,
    });
    G.game = game;                 // shared handle: scenes reach game.audio, game.grids, ...
    const names = Object.keys(G.scenes);
    const startName = (cfg.game && cfg.game.startScene) || 'Main';
    const First = G.scenes[startName] || (names.length ? G.scenes[names[0]] : null);
    if (!First) { console.error('[GAME] no scenes registered in G.scenes'); return; }
    game.scenes.push(new First(), game.engine);
    game.engine.start();
  });
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
