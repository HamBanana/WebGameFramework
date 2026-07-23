// games/HamInvadersHeretic31B/config.js
// Game-specific configuration. Uses sprite NAMES only — no asset paths.
(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {
  "engine": {
    "width": 800,
    "height": 500,
    "canvasId": "gameCanvas",
    "backgroundColor": "#000000"
  },
  "physics": {
    "gravity": 0
  },
  "game": {
    "name": "HamInvadersHeretic31B",
    "startScene": "TitleScreen"
  },
  "debug": {
    "enabled": false,
    "toggleKey": "F1"
  }
};

})(window.GF = window.GF || {});
