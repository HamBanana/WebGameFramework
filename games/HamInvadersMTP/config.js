// games/HamInvadersMTP/config.js
// Game-specific configuration. Uses sprite NAMES only — no asset paths.
(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {
  "engine": {
    "width": 800,
    "height": 450,
    "canvasId": "gameCanvas",
    "backgroundColor": "#0d0d1a"
  },
  "physics": {
    "gravity": 0
  },
  "game": {
    "name": "HamInvadersMTP",
    "startScene": "Main"
  },
  "debug": {
    "enabled": false,
    "toggleKey": "F1"
  }
};

})(window.GF = window.GF || {});
