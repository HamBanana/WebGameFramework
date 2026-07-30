// games/ArkanoidClone/config.js
// Game-specific configuration. Uses sprite NAMES only — no asset paths.
(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {
  "engine": {
    "width": 800,
    "height": 600,
    "canvasId": "gameCanvas",
    "backgroundColor": "#0a0a1a"
  },
  "physics": {
    "gravity": 0
  },
  "game": {
    "name": "ArkanoidClone",
    "startScene": "Main"
  },
  "debug": {
    "enabled": false,
    "toggleKey": "F1"
  }
};

})(window.GF = window.GF || {});
