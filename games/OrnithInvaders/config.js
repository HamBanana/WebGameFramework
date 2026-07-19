// GameFramework/games/OrnithInvanders/config.js
(function (GF) { 'use strict';
  GF.GAME_CONFIG = {
  "engine": {
    "width": 800,
    "height": 500,
    "canvasId": "gameCanvas",
    "backgroundColor": "#0a0a2e"
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
    "startY": 460,
    "speed": 280,
    "lives": 3,
    "hitbox": {
      "w": 32,
      "h": 24
    },
    "bulletSpeed": 550,
    "fireRate": 0.4,
    "respawnDelay": 1.8,
    "flashTime": 1.5
  },
  "aliens": {
    "cols": 10,
    "rows": 5,
    "startX": 50,
    "startY": 70,
    "colSpacing": 55,
    "rowSpacing": 38,
    "moveSpeed": 18,
    "speedPerKill": 1.6,
    "dropChance": 0.05,
    "types": [
      {
        "rows": [
          0
        ],
        "sprite": "alienSparrow",
        "points": 30,
        "color": "#ff44cc"
      },
      {
        "rows": [
          1,
          2
        ],
        "sprite": "alienRaven",
        "points": 20,
        "color": "#44eeff"
      },
      {
        "rows": [
          3,
          4
        ],
        "sprite": "alienEagle",
        "points": 10,
        "color": "#ffaa44"
      }
    ]
  },
  "ufo": {
    "sprite": "ufoPeregrine",
    "y": 35,
    "baseSpeed": 95,
    "points": [
      45,
      85,
      130,
      250
    ]
  },
  "bunkers": {
    "count": 4,
    "y": 400,
    "health": 4,
    "color": "#44dd44",
    "w": 50,
    "h": 28
  },
  "powerups": {
    "dropChance": 0.12,
    "speed": 70,
    "duration": 6,
    "types": [
      {
        "type": "rapidFire",
        "sprite": "powerupRapidFire",
        "color": "#ff5500",
        "weight": 3
      },
      {
        "type": "doubleShot",
        "sprite": "powerupDoubleShot",
        "color": "#ffcc00",
        "weight": 3
      },
      {
        "type": "shield",
        "sprite": "powerupShield",
        "color": "#4488ff",
        "weight": 2
      },
      {
        "type": "smartBomb",
        "sprite": "powerupSmartBomb",
        "color": "#ff2266",
        "weight": 1
      },
      {
        "type": "megaLaser",
        "sprite": "powerupMegaLaser",
        "color": "#aa44ff",
        "weight": 1,
        "duration": 5
      }
    ]
  },
  "boss": {
    "everyNLevels": 3,
    "baseHealth": 40,
    "healthPerLevel": 9,
    "bonusPoints": 1000,
    "speed": 105,
    "y": 80,
    "fireRate": 0.5,
    "bulletSpeed": 210
  },
  "combo": {
    "window": 1.7,
    "maxMultiplier": 6
  },
  "scoring": {
    "extraLifeAt": 1500
  },
  "colors": {
    "player": "#00e5ff",
    "hud": "#ffffff",
    "hudAccent": "#00ccff",
    "floor": "rgba(0,200,230,0.2)"
  },
  "debug": {
    "enabled": false,
    "toggleKey": "F1"
  }
};
})(window.GF = window.GF||{})
