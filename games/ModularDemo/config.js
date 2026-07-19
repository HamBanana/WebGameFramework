// games/ModularDemo/config.js
// Game-specific configuration. Uses sprite NAMES only — no asset paths.
(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {
  "engine": {
    "width": 560,
    "height": 360,
    "canvasId": "gameCanvas",
    "backgroundColor": "#12141f"
  },
  "physics": {
    "gravity": 0
  },
  "game": {
    "name": "ModularDemo",
    "startScene": "Main"
  },
  "debug": {
    "enabled": false,
    "toggleKey": "F1"
  }
};

})(window.GF = window.GF || {});
