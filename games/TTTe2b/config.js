// GameFramework/games/TTTe2b/config.js
// Game-specific configuration. Uses sprite NAMES only — no asset paths.

(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {
  "engine": {
    "width": 300,
    "height": 300,
    "canvasId": "gameCanvas",
    "backgroundColor": "#1a1a2e"
  },
  "physics": {
    "gravity": 0
  },
  "game": {
    "name": "TTTe2b"
  },
  "debug": {
    "enabled": false,
    "toggleKey": "F1"
  }
};

})(window.GF = window.GF || {});
