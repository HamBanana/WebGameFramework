// GameFramework/games/HappyPup/config.js
// Happy Pup — game configuration. Sprite names only, no asset paths.

(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {
  "engine": {
    "width": 800,
    "height": 500,
    "canvasId": "gameCanvas",
    "backgroundColor": "#87ceeb"
  },
  "physics": {
    "gravity": 2400,
    "floorY": 430,
    "leftWall": 0,
    "rightWall": 4000
  },
  "world": {
    "width": 4000,
    "groundColor": "#6cbf5f",
    "groundShadow": "#3f8a3a",
    "pathColor": "#d6c79a"
  },
  "dog": {
    "sprite": "pupDog",
    "startX": 80,
    "startY": 380,
    "width": 36,
    "height": 24,
    "speed": 240,
    "jumpPower": 720,
    "friction": 0.78,
    "lickReach": 14,
    "lickCooldown": 0.35
  },
  "npc": {
    "feetY": 430,
    "placements": [
      {
        "x": 340,
        "variant": "personA"
      },
      {
        "x": 620,
        "variant": "personB"
      },
      {
        "x": 900,
        "variant": "personC"
      },
      {
        "x": 1180,
        "variant": "personA"
      },
      {
        "x": 1460,
        "variant": "personD"
      },
      {
        "x": 1740,
        "variant": "personB"
      },
      {
        "x": 2020,
        "variant": "personC"
      },
      {
        "x": 2320,
        "variant": "personD"
      },
      {
        "x": 2620,
        "variant": "personA"
      },
      {
        "x": 2900,
        "variant": "personB"
      },
      {
        "x": 3220,
        "variant": "personC"
      },
      {
        "x": 3540,
        "variant": "personD"
      }
    ],
    "faceBoxW": 26,
    "faceBoxH": 28,
    "headOffsetY": 60
  },
  "scenery": {
    "props": [
      {
        "x": 120,
        "sprite": "parkTree",
        "flip": false
      },
      {
        "x": 260,
        "sprite": "parkBush",
        "flip": false
      },
      {
        "x": 500,
        "sprite": "parkTree",
        "flip": true
      },
      {
        "x": 740,
        "sprite": "parkBench",
        "flip": false
      },
      {
        "x": 980,
        "sprite": "parkBush",
        "flip": true
      },
      {
        "x": 1100,
        "sprite": "parkTree",
        "flip": false
      },
      {
        "x": 1340,
        "sprite": "parkLamp",
        "flip": false
      },
      {
        "x": 1560,
        "sprite": "parkBush",
        "flip": false
      },
      {
        "x": 1820,
        "sprite": "parkTree",
        "flip": true
      },
      {
        "x": 2080,
        "sprite": "parkBench",
        "flip": false
      },
      {
        "x": 2260,
        "sprite": "parkBush",
        "flip": true
      },
      {
        "x": 2440,
        "sprite": "parkLamp",
        "flip": false
      },
      {
        "x": 2700,
        "sprite": "parkTree",
        "flip": false
      },
      {
        "x": 2960,
        "sprite": "parkBush",
        "flip": false
      },
      {
        "x": 3160,
        "sprite": "parkTree",
        "flip": true
      },
      {
        "x": 3380,
        "sprite": "parkLamp",
        "flip": false
      },
      {
        "x": 3640,
        "sprite": "parkBench",
        "flip": false
      },
      {
        "x": 3820,
        "sprite": "parkTree",
        "flip": false
      }
    ],
    "clouds": [
      {
        "x": 200,
        "y": 90,
        "scale": 1.2
      },
      {
        "x": 680,
        "y": 60,
        "scale": 0.9
      },
      {
        "x": 1240,
        "y": 110,
        "scale": 1
      },
      {
        "x": 1820,
        "y": 70,
        "scale": 1.3
      },
      {
        "x": 2400,
        "y": 95,
        "scale": 0.8
      },
      {
        "x": 3000,
        "y": 60,
        "scale": 1.1
      },
      {
        "x": 3580,
        "y": 100,
        "scale": 1
      }
    ]
  },
  "camera": {
    "lerp": 0.12,
    "followOffsetY": -40
  },
  "hud": {
    "heartIconColor": "#ff5d8f",
    "heartIconShadow": "#a83560",
    "barBg": "rgba(0,0,0,0.55)",
    "textColor": "#fff8e7",
    "textShadow": "#222"
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
    "jump": [
      "Space",
      "KeyW",
      "ArrowUp"
    ],
    "start": [
      "Enter",
      "NumpadEnter"
    ]
  },
  "debug": {
    "enabled": false,
    "toggleKey": "F1"
  }
};

  // Optional launcher hook — kept for consistency with other games.
  window.addEventListener('GF:ready', function () {
    if (typeof GF.applyLauncherConfig === 'function') {
      GF.applyLauncherConfig('HappyPup');
    }
  }, { once: true });

})(window.GF = window.GF || {});
