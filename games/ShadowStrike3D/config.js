// GameFramework/games/ShadowStrike3D/config.js
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
      "leftWall": 0,
      "rightWall": 99999
    },
    "round": {
      "totalRounds": 3,
      "roundTime": 60,
      "koDuration": 2.8,
      "victoryDuration": 3
    },
    "fighters": {
      "kuro": {
        "displayName": "KURO",
        "startX": -2.2,
        "startFacing": 1,
        "color": "#00e5ff",
        "maxHealth": 100,
        "speed": 2.8,
        "jumpPower": 7.8,
        "gravity": 22,
        "halfWidth": 0.22,
        "moves": {
          "lightPunch":  { "damage": 8,  "stun": 0.20, "range": 0.62, "knockback": 0.9  },
          "heavyPunch":  { "damage": 15, "stun": 0.35, "range": 0.70, "knockback": 2.0  },
          "lightKick":   { "damage": 10, "stun": 0.22, "range": 0.66, "knockback": 1.1  },
          "heavyKick":   { "damage": 18, "stun": 0.40, "range": 0.75, "knockback": 2.5  },
          "special":     { "damage": 25, "stun": 0.55, "range": 0.85, "knockback": 3.2  }
        },
        "blockDamageMultiplier": 0.2
      },
      "hana": {
        "displayName": "HANA",
        "startX": 2.2,
        "startFacing": -1,
        "color": "#ff6600",
        "maxHealth": 100,
        "speed": 2.5,
        "jumpPower": 7.4,
        "gravity": 22,
        "halfWidth": 0.26,
        "moves": {
          "lightPunch":  { "damage": 9,  "stun": 0.18, "range": 0.66, "knockback": 1.0  },
          "heavyPunch":  { "damage": 16, "stun": 0.38, "range": 0.74, "knockback": 2.2  },
          "lightKick":   { "damage": 11, "stun": 0.24, "range": 0.70, "knockback": 1.2  },
          "heavyKick":   { "damage": 19, "stun": 0.42, "range": 0.78, "knockback": 2.7  },
          "special":     { "damage": 26, "stun": 0.60, "range": 0.88, "knockback": 3.5  }
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
      "halfWidth": 3.8,
      "floorY": 0
    },
    "controls": {
      "p1": {
        "left":       "KeyA",
        "right":      "KeyD",
        "jump":       "KeyW",
        "crouch":     "KeyS",
        "lightPunch": "KeyU",
        "heavyPunch": "KeyI",
        "lightKick":  "KeyJ",
        "heavyKick":  "KeyK",
        "special":    "KeyL",
        "block":      "KeyO"
      },
      "p2": {
        "left":       "ArrowLeft",
        "right":      "ArrowRight",
        "jump":       "ArrowUp",
        "crouch":     "ArrowDown",
        "lightPunch": "Numpad1",
        "heavyPunch": "Numpad2",
        "lightKick":  "Numpad4",
        "heavyKick":  "Numpad5",
        "special":    "Numpad6",
        "block":      "Numpad3"
      }
    },
    "debug": { "enabled": false }
  };

  window.addEventListener('GF:ready', function () {
    GF.applyLauncherConfig('ShadowStrike3D');
  }, { once: true });

})(window.GF = window.GF || {});
