// GameFramework/framework/core/Boot.js
// The generic boot sequence, so games stop shipping a copy-pasted boot.js.
//
// Opt in from GAME_CONFIG:
//
//   game: { name: 'MyGame', startScene: 'Main', autoBoot: true,
//           systems: { audio: true, particles: true, debug: false } }
//
// and the framework creates the game, resolves the start scene (a class in
// GAME.scenes, else a GF.GameScene composed from registered modules) and starts
// the engine. Games that still call GF.createGame() themselves are unaffected —
// autoBoot only runs when explicitly enabled.

(function (GF) {
  'use strict';

  /**
   * Build the game and push the start scene.
   * @param {Object} [opts] overrides merged over GAME_CONFIG.game.systems
   * @returns {Object} the game handle from GF.createGame
   */
  GF.boot = function (opts) {
    var cfg = GF.GAME_CONFIG || {};
    var gameCfg = cfg.game || {};
    var G = window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} };

    var game = GF.createGame(cfg.engine, cfg.physics, Object.assign({
      gameName: gameCfg.name,
      audio: true, tweens: true, particles: true, scenes: true, debug: false,
    }, gameCfg.systems || {}, opts || {}));

    // Shared handles: modules reach game.audio, game.particles, ... through either.
    G.game = game;
    GF.game = game;

    var startName = gameCfg.startScene || 'Main';
    var registered = Object.keys(G.scenes || {});
    var name = (G.scenes && G.scenes[startName]) ? startName
             : (registered.length ? registered[0] : startName);

    var scene = GF.GameScene.create(name);
    if (!scene) { console.error('[GF] boot: cannot resolve start scene "' + startName + '"'); return game; }

    game.scenes.push(scene, game.engine);
    game.engine.start();
    return game;
  };

  window.addEventListener('GF:ready', function () {
    var gameCfg = (GF.GAME_CONFIG && GF.GAME_CONFIG.game) || {};
    if (gameCfg.autoBoot) GF.boot();
  });

})(window.GF = window.GF || {});
