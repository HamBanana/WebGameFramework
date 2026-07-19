// games/HamInvaders/config.js
// Game-specific configuration. Uses sprite NAMES only — no asset paths.
(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {
  "engine": {
    "width": 800,
    "height": 500,
    "canvasId": "gameCanvas",
    "backgroundColor": "#1a1a2e"
  },
  "physics": {
    "gravity": 0
  },
  "game": {
    "name": "HamInvaders",
    "startScene": "Main"
  },
  "debug": {
    "enabled": false,
    "toggleKey": "F1"
  }
};

})(window.GF = window.GF || {});
