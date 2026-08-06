// GameFramework/games/KatInvaders/config.js
// Kawaii Cat Invaders — a Space Invaders clone with a unique Japanese cat-girl
// pilot theme, procedural kawaii pixel art, and all modern mechanics.

(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {
  "game": {
    "name": "KatInvaders",
    "startScene": "TitleScreen",
    "autoBoot": true,
    "systems": {
      "audio": true,
      "tweens": true,
      "particles": true,
      "debug": false
    }
  },
  "engine": {
    "width": 480,
    "height": 640,
    "physics": {
      "gravity": 0,
      "dt": 0.016666666666666666,
      "iterations": 3
    },
    "ui": {
      "hud": {
        "enabled": true
      },
      "fps": {
        "enabled": true
      }
    },
    "debug": {
      "physics": false,
      "fps": true
    }
  },
  "audio": {
    "masterVolume": 0.3,
    "sfx": {
      "fire": {
        "type": "square",
        "freq": 880,
        "decay": 0.08,
        "vol": 0.15
      },
      "hit": {
        "type": "square",
        "freq": 220,
        "decay": 0.12,
        "vol": 0.12
      },
      "die": {
        "type": "sawtooth",
        "freq": 440,
        "decay": 0.3,
        "vol": 0.15
      },
      "powerup": {
        "type": "sine",
        "freq": 660,
        "decay": 0.2,
        "vol": 0.12
      },
      "ufo": {
        "type": "triangle",
        "freq": 110,
        "decay": 0.4,
        "vol": 0.08
      },
      "levelUp": {
        "type": "sine",
        "freq": 523,
        "decay": 0.5,
        "vol": 0.1
      },
      "explosion": {
        "type": "sawtooth",
        "freq": 100,
        "decay": 0.3,
        "vol": 0.18
      },
      "bossDie": {
        "type": "sawtooth",
        "freq": 80,
        "decay": 0.8,
        "vol": 0.2
      }
    }
  },
  "colors": {
    "bg": "#0a0a1a",
    "floor": "#ff69b4",
    "floorGlow": "#ff1493",
    "text": "#ffffff",
    "textSecondary": "#88aacc",
    "player": "#ff8ec4",
    "playerBullet": "#ffffff",
    "alienBullet": "#ff4488",
    "alien1": "#ff99cc",
    "alien2": "#99ccff",
    "alien3": "#aaffcc",
    "ufo": "#ff6699",
    "bunker": "#ffccdd",
    "boss": "#ff2277",
    "bossMinion": "#ff66bb",
    "powerup": {
      "rapidFire": "#ff6633",
      "doubleShot": "#ffcc00",
      "shield": "#4488ff",
      "megaLaser": "#aa44ff",
      "smartBomb": "#ff2266",
      "extraLife": "#44ff88"
    }
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
      "KeyZ",
      "KeyJ"
    ],
    "pause": [
      "Escape",
      "KeyP",
      "KeyK"
    ]
  },
  "player": {
    "width": 36,
    "height": 22,
    "startX": 240,
    "startY": 590,
    "speed": 240,
    "fireRate": 0.28,
    "bulletSpeed": 480,
    "bulletWidth": 4,
    "bulletHeight": 12,
    "lives": 3,
    "invincibleDuration": 2
  },
  "aliens": {
    "rows": 5,
    "cols": 10,
    "startX": 30,
    "startY": 60,
    "spacingX": 40,
    "spacingY": 36,
    "initialSpeed": 30,
    "maxSpeed": 90,
    "speedIncrease": 1.5,
    "dropAmount": 16,
    "fireRate": 0.002,
    "bulletSpeed": 160,
    "bulletWidth": 4,
    "bulletHeight": 10,
    "points": [
      30,
      20,
      20,
      10,
      10
    ]
  },
  "ufo": {
    "width": 40,
    "height": 18,
    "speed": 100,
    "points": [
      50,
      100,
      150,
      200
    ],
    "appearanceInterval": 25
  },
  "bunkers": {
    "count": 4,
    "health": 8,
    "color": "#ffccdd",
    "width": 48,
    "height": 36,
    "spacing": 100,
    "startY": 520
  },
  "boss": {
    "width": 96,
    "height": 56,
    "hp": 80,
    "speed": 50,
    "fireRate": 0.03,
    "bulletSpeed": 180,
    "bulletWidth": 8,
    "bulletHeight": 12,
    "spawnMinionInterval": 8,
    "minionCount": 3,
    "warningDuration": 4
  },
  "powerups": {
    "dropChance": 0.12,
    "types": [
      {
        "type": "rapidFire",
        "color": "#ff6633",
        "sprite": "powerupRapidFire",
        "icon": "⚡",
        "weight": 25
      },
      {
        "type": "doubleShot",
        "color": "#ffcc00",
        "sprite": "powerupDoubleShot",
        "icon": "⬆⬆",
        "weight": 25
      },
      {
        "type": "shield",
        "color": "#4488ff",
        "sprite": "powerupShield",
        "icon": "🛡",
        "weight": 20
      },
      {
        "type": "megaLaser",
        "color": "#aa44ff",
        "sprite": "powerupMegaLaser",
        "icon": "★",
        "weight": 15
      },
      {
        "type": "smartBomb",
        "color": "#ff2266",
        "sprite": "powerupSmartBomb",
        "icon": "💣",
        "weight": 10
      },
      {
        "type": "extraLife",
        "color": "#44ff88",
        "sprite": "powerupExtraLife",
        "icon": "♥",
        "weight": 5
      }
    ],
    "durations": {
      "rapidFire": 10,
      "doubleShot": 10,
      "shield": 12,
      "megaLaser": 8,
      "smartBomb": null,
      "extraLife": null
    }
  },
  "combo": {
    "window": 2,
    "baseMultiplier": 1,
    "perKill": 0.1,
    "maxMultiplier": 5
  },
  "levels": {
    "bossInterval": 5,
    "maxLevels": 99,
    "alienSpeedBonus": 10,
    "alienFireBonus": 0.0003
  },
  "particles": {
    "maxCount": 300,
    "default": {
      "speed": [
        50,
        150
      ],
      "life": [
        0.3,
        0.8
      ],
      "size": [
        2,
        5
      ],
      "fadeOut": true,
      "shrink": true
    }
  },
  "viewport": {
    "zoomOnLevelComplete": 1.4,
    "zoomDuration": 0.6,
    "shakeIntensity": 4,
    "shakeDuration": 0.3
  }
};

})(window.GF = window.GF || {});
