// GameFramework/games/ShiningQuest3D/config.js
// Configuration for Shining Quest 3D — sprite NAMES only, no asset paths.
// Three3DScene renders behind the engine canvas, so backgroundColor must be
// 'transparent' for the 3D world to be visible.

(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {
  "engine": {
    "width": 960,
    "height": 540,
    "canvasId": "gameCanvas",
    "backgroundColor": "transparent"
  },
  "physics": {
    "gravity": 0,
    "floorY": 99999,
    "leftWall": 0,
    "rightWall": 99999
  },
  "world3d": {
    "cellSize": 1,
    "unitYOffset": 0,
    "cameraTilt": 0.85,
    "cameraOrbit": 0,
    "townFollowDist": 7.5,
    "townFollowHeight": 5.5
  },
  "battle": {
    "terrainCost": {
      "0": 1,
      "1": 1,
      "2": 2,
      "3": 99,
      "4": 99,
      "5": 3
    },
    "blockedTerrain": [
      3,
      4
    ],
    "damageVariance": 0.2,
    "critMultiplier": 2,
    "enemyTurnDelayMs": 350,
    "moveStepSeconds": 0.18,
    "attackDuration": 0.55,
    "spellDuration": 0.7
  },
  "town": {
    "cols": 26,
    "rows": 15,
    "playerSpeed": 4.5,
    "partyName": "Force of the Sunrise"
  },
  "ui": {
    "panelBg": "rgba(8,12,32,0.92)",
    "panelBorder": "#88aaff",
    "titleColor": "#ffdd66",
    "hudColor": "#ffffff",
    "hudFont": "14px monospace",
    "titleFont": "bold 22px monospace",
    "bigTitleFont": "bold 44px monospace",
    "enemyTeamColor": "#ff5566",
    "playerTeamColor": "#66ccff",
    "moveTileColor": 4491519,
    "attackTileColor": 16733508,
    "pathTileColor": 16768324,
    "cursorColor": 16768324
  },
  "debug": {
    "enabled": false,
    "toggleKey": "F1"
  },
  "controls": {
    "up": [
      "ArrowUp",
      "KeyW"
    ],
    "down": [
      "ArrowDown",
      "KeyS"
    ],
    "left": [
      "ArrowLeft",
      "KeyA"
    ],
    "right": [
      "ArrowRight",
      "KeyD"
    ],
    "confirm": [
      "Enter",
      "Space",
      "KeyZ"
    ],
    "cancel": [
      "Escape",
      "Backspace",
      "KeyX"
    ],
    "menu": [
      "KeyM",
      "Tab"
    ]
  }
};

  window.addEventListener('GF:ready', function () {
    GF.applyLauncherConfig('ShiningQuest3D');
  }, { once: true });

})(window.GF = window.GF || {});
