// GameFramework/games/TTT-12b-it-qat/config.js
// Game-specific configuration. Uses sprite NAMES only — no asset paths.

(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {
  "engine": {
    "width": 800,
    "height": 600,
    "canvasId": "gameCanvas",
    "backgroundColor": "#1a1a2e"
  },
  "physics": {
    "gravity": 0
  },
  "game": {
    "name": "TTT-12b-it-qat"
  },
  "debug": {
    "enabled": false,
    "toggleKey": "F1"
  }
};

})(window.GF = window.GF || {});
