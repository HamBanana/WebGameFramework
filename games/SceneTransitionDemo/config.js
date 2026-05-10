// GameFramework/games/SceneTransitionDemo/config.js
// Configuration for the Scene Transition Demo — showcases all four built-in
// transition types (iris, fade, wipe, flash) between four distinct scenes.

(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {
  "name": "SceneTransitionDemo",
  "engine": {
    "width": 800,
    "height": 450,
    "canvasId": "gameCanvas",
    "backgroundColor": "#08081a"
  },
  "physics": {
    "gravity": 0,
    "floorY": 9999,
    "leftWall": 0,
    "rightWall": 800
  },
  "game": {
    "orbCount": 6,
    "duration": 30,
    "orbRadius": 26,
    "orbPoints": 10,
    "orbSpeed": {
      "min": 55,
      "max": 120
    },
    "respawnTime": 1.5
  },
  "orbs": [
    {
      "fill": "#ff6b6b",
      "glow": "rgba(255,107,107,0.55)"
    },
    {
      "fill": "#4ecdc4",
      "glow": "rgba(78,205,196,0.55)"
    },
    {
      "fill": "#ffe66d",
      "glow": "rgba(255,230,109,0.55)"
    },
    {
      "fill": "#a29bfe",
      "glow": "rgba(162,155,254,0.55)"
    },
    {
      "fill": "#fd79a8",
      "glow": "rgba(253,121,168,0.55)"
    },
    {
      "fill": "#74b9ff",
      "glow": "rgba(116,185,255,0.55)"
    }
  ],
  "debug": {
    "enabled": false,
    "toggleKey": "F1"
  }
};

  // Apply any overrides set by the launcher once the framework is ready.
  // Using GF:ready ensures this works whether config.js loads before
  // or after GameFramework.bundle.js (standalone vs. launcher flow).
  window.addEventListener('GF:ready', function () {
    GF.applyLauncherConfig('SceneTransitionDemo');
  }, { once: true });

})(window.GF = window.GF || {});
