// games/Acca-Prototype/config.js
// Game-specific configuration for Acca Prototype v0.1
// (web port of the Unity Acca board-game prototype).
(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {
  "engine": {
    "width": 1024,
    "height": 640,
    "canvasId": "gameCanvas",
    "backgroundColor": "#10141c"
  },
  "physics": {
    "gravity": 0
  },
  "game": {
    "name": "Acca-Prototype"
  },
  "players": [
    {
      "name": "Player 1",
      "color": "#ff5252"
    },
    {
      "name": "Player 2",
      "color": "#4d7cff"
    },
    {
      "name": "Player 3",
      "color": "#51d974"
    },
    {
      "name": "Player 4",
      "color": "#ffd740"
    }
  ],
  "numberOfPlayers": 2,
  "startingMoney": 1000,
  "winTarget": 4000,
  "turnCap": 80,
  "debug": {
    "enabled": false,
    "toggleKey": "F1"
  }
};

  window.addEventListener('GF:ready', function () {
    GF.applyLauncherConfig('Acca-Prototype');
  }, { once: true });
})(window.GF = window.GF || {});
