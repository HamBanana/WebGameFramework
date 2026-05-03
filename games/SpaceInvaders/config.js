// GameFramework/games/SpaceInvaders/config.js
// Space Invaders — game configuration. Sprite names only, no asset paths.

(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {
  "engine": {
    "width": 800,
    "height": 500,
    "canvasId": "gameCanvas",
    "backgroundColor": "#000008"
  },
  "physics": {
    "gravity": 0,
    "floorY": 9999,
    "leftWall": 0,
    "rightWall": 800
  },
  "player": {
    "sprite": "playerShip",
    "startX": 400,
    "startY": 440,
    "speed": 260,
    "lives": 3,
    "hitbox": {
      "w": 36,
      "h": 22
    },
    "bulletSpeed": 520,
    "fireRate": 0.45,
    "respawnDelay": 2,
    "flashTime": 2
  },
  "aliens": {
    "cols": 11,
    "rows": 5,
    "startX": 80,
    "startY": 80,
    "colSpacing": 55,
    "rowSpacing": 40,
    "moveSpeed": 28,
    "speedPerKill": 1.8,
    "dropAmount": 20,
    "fireRate": 0.4,
    "bulletSpeed": 180,
    "types": [
      {
        "rows": [
          0
        ],
        "sprite": "alienSquid",
        "points": 30,
        "color": "#ff44ff"
      },
      {
        "rows": [
          1,
          2
        ],
        "sprite": "alienCrab",
        "points": 20,
        "color": "#44ffff"
      },
      {
        "rows": [
          3,
          4
        ],
        "sprite": "alienOctopus",
        "points": 10,
        "color": "#88ff44"
      }
    ]
  },
  "ufo": {
    "sprite": "alienUFO",
    "y": 42,
    "speed": 120,
    "points": [
      50,
      100,
      150,
      300
    ],
    "spawnInterval": [
      15,
      25
    ]
  },
  "bunkers": {
    "count": 4,
    "y": 370,
    "health": 4,
    "color": "#44ff44",
    "w": 52,
    "h": 32
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
    "fire": [
      "Space",
      "KeyZ"
    ],
    "pause": [
      "KeyP",
      "Escape"
    ]
  },
  "powerups": {
    "dropChance": 0.12,
    "speed": 65,
    "duration": 8,
    "types": [
      {
        "type": "rapidFire",
        "sprite": "powerupRapidFire",
        "color": "#ff5500"
      },
      {
        "type": "doubleShot",
        "sprite": "powerupDoubleShot",
        "color": "#ffcc00"
      },
      {
        "type": "shield",
        "sprite": "powerupShield",
        "color": "#4488ff"
      }
    ]
  },
  "scoring": {
    "extraLifeAt": 1500
  },
  "colors": {
    "player": "#00e5ff",
    "hud": "#ffffff",
    "hudAccent": "#00e5ff",
    "floor": "rgba(0,229,255,0.3)"
  }
};

  // Apply any overrides set by the launcher once the framework is ready.
  // Using GF:ready ensures this works whether config.js loads before
  // or after GameFramework.bundle.js (standalone vs. launcher flow).
  window.addEventListener('GF:ready', function () {
    GF.applyLauncherConfig('SpaceInvaders');
  }, { once: true });

})(window.GF = window.GF || {});
