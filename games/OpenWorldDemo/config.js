// games/OpenWorldDemo/config.js
// Game-specific configuration. Uses sprite NAMES only — no asset paths.
(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {
  "engine": {
    "width": 800,
    "height": 512,
    "canvasId": "gameCanvas",
    "backgroundColor": "#10131f"
  },
  "physics": {
    "gravity": 0
  },
  "game": {
    "name": "OpenWorldDemo",
    "startScene": "World"
  },
  "debug": {
    "enabled": false,
    "toggleKey": "F1"
  }
};

})(window.GF = window.GF || {});
