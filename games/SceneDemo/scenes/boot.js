// scenes/boot.js — registers the data-authored level as this game's Main scene.
//
// GF.dataScene('main') resolves levels/main.json, preloaded from manifest.json,
// and returns a GF.GameScene subclass — so modules/Rules.js attaches to it like
// any other scene module. GAME_CONFIG.game.autoBoot then starts it.
(function (G, GF) {
  'use strict';

  G.scenes.Main = GF.dataScene('main');

})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
