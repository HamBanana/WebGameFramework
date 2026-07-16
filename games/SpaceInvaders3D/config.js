// GameFramework/games/SpaceInvaders3D/config.js
// Three3DScene renders behind the engine canvas, so backgroundColor must be
// 'transparent' for the 3D world to show through.

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
    "leftWall": -99999,
    "rightWall": 99999
  },
  "player": {
    "startX": 0,
    "y": 1.2,
    "z": 5,
    "halfRange": 5.5,
    "yMin": 0.4,
    "yMax": 4.4,
    "speed": 9,
    "ySpeed": 7,
    "lives": 3,
    "bulletSpeed": 28,
    "fireRate": 0.32,
    "respawnDelay": 1.4,
    "invincibleTime": 2.2
  },
  "aliens": {
    "cols": 9,
    "rows": 4,
    "startZ": -10,
    "topY": 4.2,
    "colSpacing": 1.1,
    "rowSpacing": 1.1,
    "formationSway": 0.6,
    "diveIntervalBase": 1.6,
    "diveDuration": 2.6,
    "diveFireChance": 0.7,
    "formationFireRate": 0.6,
    "bulletSpeed": 11,
    "types": [
      {
        "rows": [
          0
        ],
        "shape": "squid",
        "points": 80,
        "color": 16729343
      },
      {
        "rows": [
          1
        ],
        "shape": "crab",
        "points": 50,
        "color": 4521983
      },
      {
        "rows": [
          2,
          3
        ],
        "shape": "octopus",
        "points": 30,
        "color": 8978244
      }
    ],
    "marchInterval": 0.7
  },
  "powerups": {
    "dropChance": 0.18,
    "diveDropBonus": 0.12,
    "fallSpeed": 2.6,
    "duration": 9,
    "types": [
      {
        "type": "rapidFire",
        "color": 16734464,
        "weight": 3
      },
      {
        "type": "doubleShot",
        "color": 16763904,
        "weight": 3
      },
      {
        "type": "tripleShot",
        "color": 11157759,
        "weight": 1
      },
      {
        "type": "shield",
        "color": 4491775,
        "weight": 2
      },
      {
        "type": "extraLife",
        "color": 4521880,
        "weight": 1
      }
    ]
  },
  "boss": {
    "everyNLevels": 3,
    "baseHealth": 28,
    "healthPerStage": 10,
    "bonusPoints": 2000,
    "bonusLives": 1,
    "y": 3.4,
    "z": -8.5,
    "speed": 2.6,
    "fireRate": 0.85,
    "bulletSpeed": 9,
    "diveCooldown": 6,
    "minionInterval": [
      5,
      9
    ]
  },
  "ufo": {
    "y": 5.5,
    "z": -11,
    "halfRangeX": 6,
    "speed": 5,
    "points": [
      50,
      100,
      150,
      300
    ],
    "spawnInterval": [
      10,
      18
    ]
  },
  "bunkers": {
    "count": 4,
    "z": 2.5,
    "health": 5,
    "color": 4521796
  },
  "controls": {
    "left": [
      "ArrowLeft",
      "KeyA"
    ],
    "right": [
      "ArrowRight",
      "KeyD"
    ],
    "up": [
      "ArrowUp",
      "KeyW"
    ],
    "down": [
      "ArrowDown",
      "KeyS"
    ],
    "fire": [
      "Space",
      "KeyZ"
    ],
    "pause": [
      "KeyP",
      "Escape"
    ]
  },
  "scoring": {
    "extraLifeAt": 1500
  },
  "debug": {
    "enabled": false
  }
};

  window.addEventListener('GF:ready', function () {
    GF.applyLauncherConfig('SpaceInvaders3D');
  }, { once: true });

})(window.GF = window.GF || {});
