// GameFramework/games/TTTG426B/config.js
// Game-specific configuration. Uses sprite NAMES only — no asset paths.

(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {
  "engine": {
    "width": 400,
    "height": 500,
    "canvasId": "gameCanvas",
    "backgroundColor": "#1a1a2e"
  },
  "physics": {
    "gravity": 0
  },
  "game": {
    "name": "TTTG426B"
  },
  "debug": {
    "enabled": false,
    "toggleKey": "F1"
  }
};

})(window.GF = window.GF || {});
