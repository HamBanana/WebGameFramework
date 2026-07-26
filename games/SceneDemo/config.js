// games/SceneDemo/config.js
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
    "name": "SceneDemo",
    "startScene": "Main",
    "autoBoot": true,
    "systems": { "audio": true, "tweens": true, "particles": true, "debug": false }
  },
  "debug": {
    "enabled": false,
    "toggleKey": "F1"
  }
};

})(window.GF = window.GF || {});
