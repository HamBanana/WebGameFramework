// scenes/levels.js — registers the game's data-authored levels as scenes.
//
// GF.dataScene(name) looks the document up in the levels preloaded from
// manifest.json, and returns a GF.GameScene subclass. Registering it in
// GAME.scenes is what lets any module reach it by name — modules/BossEntry.js
// does scene.push('Boss').
(function (G, GF) {
  'use strict';

  G.scenes.Boss = GF.dataScene('boss');

})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
