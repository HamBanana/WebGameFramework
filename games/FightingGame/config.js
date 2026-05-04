// GameFramework/games/FightingGame/config.js
// Game-specific configuration.
// Uses sprite NAMES only — no asset paths.

(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {
  "engine": {
    "width": 800,
    "height": 480,
    "canvasId": "gameCanvas",
    "backgroundColor": "#0a0012"
  },
  "physics": {
    "gravity": 2400,
    "floorY": 385,
    "leftWall": 40,
    "rightWall": 760
  },
  "round": {
    "totalRounds": 3,
    "roundTime": 60,
    "koDuration": 2.5,
    "victoryDuration": 3
  },
  "fighters": {
    "kuro": {
      "sprite": "kuro",
      "displayName": "KURO",
      "startX": 200,
      "startFacing": 1,
      "color": "#00e5ff",
      "maxHealth": 100,
      "speed": 280,
      "jumpPower": -820,
      "hitbox": {
        "w": 38,
        "h": 72
      },
      "moves": {
        "lightPunch": {
          "damage": 8,
          "stun": 0.2,
          "range": 55,
          "knockback": 80
        },
        "heavyPunch": {
          "damage": 15,
          "stun": 0.35,
          "range": 62,
          "knockback": 180
        },
        "lightKick": {
          "damage": 10,
          "stun": 0.22,
          "range": 58,
          "knockback": 100
        },
        "heavyKick": {
          "damage": 18,
          "stun": 0.4,
          "range": 66,
          "knockback": 220
        },
        "special": {
          "damage": 25,
          "stun": 0.55,
          "range": 75,
          "knockback": 280
        }
      },
      "blockDamageMultiplier": 0.2
    },
    "hana": {
      "sprite": "hana",
      "displayName": "HANA",
      "startX": 600,
      "startFacing": -1,
      "color": "#ff6600",
      "maxHealth": 100,
      "speed": 250,
      "jumpPower": -780,
      "hitbox": {
        "w": 42,
        "h": 72
      },
      "moves": {
        "lightPunch": {
          "damage": 9,
          "stun": 0.18,
          "range": 58,
          "knockback": 85
        },
        "heavyPunch": {
          "damage": 16,
          "stun": 0.38,
          "range": 65,
          "knockback": 200
        },
        "lightKick": {
          "damage": 11,
          "stun": 0.24,
          "range": 62,
          "knockback": 110
        },
        "heavyKick": {
          "damage": 19,
          "stun": 0.42,
          "range": 68,
          "knockback": 240
        },
        "special": {
          "damage": 26,
          "stun": 0.6,
          "range": 78,
          "knockback": 300
        }
      },
      "blockDamageMultiplier": 0.25
    }
  },
  "ai": {
    "reactionTime": 0.18,
    "aggressionBias": 0.55,
    "jumpFrequency": 0.018
  },
  "stage": {
    "background": "#0a0012",
    "floorColor": "#1a0a2e",
    "floorY": 385,
    "stageW": 800,
    "stageH": 480
  },
  "debug": {
    "enabled": false,
    "toggleKey": "F1"
  },
  "controls": {
    "p1": {
      "left": "KeyA",
      "right": "KeyD",
      "jump": "KeyW",
      "crouch": "KeyS",
      "lightPunch": "KeyU",
      "heavyPunch": "KeyI",
      "lightKick": "KeyJ",
      "heavyKick": "KeyK",
      "special": "KeyL",
      "block": "KeyO"
    },
    "p2": {
      "left": "ArrowLeft",
      "right": "ArrowRight",
      "jump": "ArrowUp",
      "crouch": "ArrowDown",
      "lightPunch": "Numpad1",
      "heavyPunch": "Numpad2",
      "lightKick": "Numpad4",
      "heavyKick": "Numpad5",
      "special": "Numpad6",
      "block": "Numpad3"
    }
  }
};

  // Apply any overrides set by the launcher once the framework is ready.
  // Using GF:ready ensures this works whether config.js loads before
  // or after GameFramework.bundle.js (standalone vs. launcher flow).
  window.addEventListener('GF:ready', function () {
    GF.applyLauncherConfig('FightingGame');
  }, { once: true });

})(window.GF = window.GF || {});
