// GameFramework/games/KatInvaders/config.js
// Kawaii Cat Invaders — a Space Invaders clone with a unique Japanese cat-girl
// pilot theme, procedural kawaii pixel art, and all modern mechanics.

(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {
  "scenes": {
    "Main": {
      "worldPhases": [
        "play",
        "boss"
      ]
    },
    "Boss": {
      "worldPhases": [
        "play",
        "boss"
      ]
    }
  },
  "game": {
    "name": "KatInvaders",
    "startScene": "TitleScreen",
    "autoBoot": true,
    "systems": {
      "audio": true,
      "tweens": true,
      "particles": true,
      "debug": {
        "enabled": true,
        "toggleKey": "F1"
      }
    }
  },
  "engine": {
    "width": 640,
    "height": 480,
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
    "masterVolume": 0.4,
    "sfx": {
      "fire": {
        "type": "square",
        "freq": 900,
        "decay": 0.06,
        "vol": 0.18,
        "pitchSlide": 300
      },
      "alienFire": {
        "type": "triangle",
        "freq": 180,
        "decay": 0.1,
        "vol": 0.12
      },
      "hit": {
        "type": "square",
        "freq": 220,
        "decay": 0.15,
        "vol": 0.14,
        "pitchSlide": 100
      },
      "die": {
        "type": "sawtooth",
        "freq": 440,
        "decay": 0.4,
        "vol": 0.18,
        "pitchSlide": -200
      },
      "powerup": {
        "type": "sine",
        "freq": 880,
        "decay": 0.3,
        "vol": 0.15,
        "pitchSlide": -400
      },
      "powerupCollect": {
        "type": "square",
        "freq": 1200,
        "decay": 0.2,
        "vol": 0.12
      },
      "ufo": {
        "type": "triangle",
        "freq": 110,
        "decay": 0.4,
        "vol": 0.1,
        "pitchSlide": -30
      },
      "levelUp": {
        "type": "sine",
        "freq": 523,
        "decay": 0.6,
        "vol": 0.15
      },
      "explosion": {
        "type": "sawtooth",
        "freq": 120,
        "decay": 0.4,
        "vol": 0.22,
        "pitchSlide": -50
      },
      "bossDie": {
        "type": "sawtooth",
        "freq": 100,
        "decay": 1.2,
        "vol": 0.25,
        "pitchSlide": -80
      },
      "bossSpawn": {
        "type": "square",
        "freq": 200,
        "decay": 0.5,
        "vol": 0.2,
        "pitchSlide": 100
      },
      "combo": {
        "type": "square",
        "freq": 600,
        "decay": 0.1,
        "vol": 0.15
      }
    }
  },
  "colors": {
    "bg": "#0d0d1f",
    "bgGradient": [
      "#1a0d1a",
      "#0d0d2e"
    ],
    "stars": [
      "#ffffff",
      "#ffccdd",
      "#aaffff",
      "#ffddaa"
    ],
    "nebula": [
      "rgba(255, 100, 150, 0.15)",
      "rgba(100, 100, 255, 0.15)",
      "rgba(255, 200, 100, 0.1)"
    ],
    "floor": "#ff69b4",
    "floorGlow": "#ff1493",
    "text": "#ffffff",
    "textSecondary": "#aaddff",
    "player": "#ff99cc",
    "playerBullet": "#ffccff",
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
    "width": 40,
    "height": 26,
    "startX": 320,
    "startY": 430,
    "speed": 280,
    "fireRate": 0.22,
    "bulletSpeed": 520,
    "bulletWidth": 6,
    "bulletHeight": 14,
    "lives": 3,
    "invincibleDuration": 2.5,
    "trailColor": "rgba(255, 100, 200, 0.6)"
  },
  "aliens": {
    "rows": 5,
    "cols": 9,
    "startX": 30,
    "startY": 50,
    "spacingX": 38,
    "spacingY": 34,
    "initialSpeed": 12,
    "maxSpeed": 120,
    "speedIncrease": 0.6,
    "dropAmount": 18,
    "fireRate": 0.0025,
    "bulletSpeed": 180,
    "bulletWidth": 5,
    "bulletHeight": 12,
    "diveSpeed": 180,
    "diveChance": 0.01,
    "points": [
      30,
      25,
      20,
      15,
      10,
      5
    ]
  },
  "ufo": {
    "width": 44,
    "height": 20,
    "speed": 120,
    "points": [
      75,
      125,
      175,
      225
    ],
    "appearanceInterval": 20,
    "minInterval": 15
  },
  "bunkers": {
    "count": 4,
    "health": 10,
    "color": "#ffccdd",
    "glow": "rgba(255, 200, 220, 0.5)",
    "width": 52,
    "height": 40,
    "spacing": 110,
    "startY": 400
  },
  "boss": {
    "width": 100,
    "height": 60,
    "hp": 100,
    "speed": 60,
    "fireRate": 0.035,
    "bulletSpeed": 200,
    "bulletWidth": 9,
    "bulletHeight": 14,
    "spawnMinionInterval": 5,
    "minionCount": 1,
    "warningDuration": 3.5,
    "bossTypes": [
      {
        "name": "Mothership",
        "hp": 100,
        "speed": 50,
        "fireRate": 0.035,
        "prefab": "bossMothership",
        "sprite": "bossMothership",
        "behavior": "patrol"
      },
      {
        "name": "Star Destroyer",
        "hp": 150,
        "speed": 35,
        "fireRate": 0.045,
        "prefab": "bossStarDestroyer",
        "sprite": "bossStarDestroyer",
        "behavior": "hover"
      },
      {
        "name": "Crimson Reaper",
        "hp": 180,
        "speed": 65,
        "fireRate": 0.05,
        "prefab": "bossCrimsonReaper",
        "sprite": "bossCrimsonReaper",
        "behavior": "aggressive"
      },
      {
        "name": "Void Hydra",
        "hp": 200,
        "speed": 40,
        "fireRate": 0.04,
        "prefab": "bossVoidHydra",
        "sprite": "bossVoidHydra",
        "behavior": "circle"
      },
      {
        "name": "Galaxy Devourer",
        "hp": 250,
        "speed": 45,
        "fireRate": 0.055,
        "prefab": "bossGalaxyDevourer",
        "sprite": "bossGalaxyDevourer",
        "behavior": "complex"
      }
    ]
  },
  "powerups": {
    "dropChance": 0.2,
    "minionDropChance": 0.25,
    "types": [
      {
        "type": "rapidFire",
        "color": "#ff6633",
        "sprite": "powerupRapidFire",
        "icon": "⚡",
        "weight": 20
      },
      {
        "type": "doubleShot",
        "color": "#ffcc00",
        "sprite": "powerupDoubleShot",
        "icon": "⬆⬆",
        "weight": 20
      },
      {
        "type": "shield",
        "color": "#4488ff",
        "sprite": "powerupShield",
        "icon": "🛡",
        "weight": 15
      },
      {
        "type": "megaLaser",
        "color": "#aa44ff",
        "sprite": "powerupMegaLaser",
        "icon": "★",
        "weight": 10
      },
      {
        "type": "smartBomb",
        "color": "#ff2266",
        "sprite": "powerupSmartBomb",
        "icon": "💣",
        "weight": 8
      },
      {
        "type": "extraLife",
        "color": "#44ff88",
        "sprite": "powerupExtraLife",
        "icon": "♥",
        "weight": 5
      },
      {
        "type": "spreadShot",
        "color": "#00ccff",
        "sprite": "powerupSpreadShot",
        "icon": "🌈",
        "weight": 12
      },
      {
        "type": "slowMo",
        "color": "#ccffff",
        "sprite": "powerupSlowMo",
        "icon": "🐢",
        "weight": 8
      },
      {
        "type": "tripleShot",
        "color": "#ff00cc",
        "sprite": "powerupTripleShot",
        "icon": "⬆⬆⬆",
        "weight": 10
      },
      {
        "type": "invincible",
        "color": "#ffff00",
        "sprite": "powerupInvincible",
        "icon": "✨",
        "weight": 7
      }
    ],
    "durations": {
      "rapidFire": 10,
      "doubleShot": 10,
      "shield": 12,
      "megaLaser": 8,
      "smartBomb": null,
      "extraLife": null,
      "spreadShot": 8,
      "slowMo": 6,
      "tripleShot": 8,
      "invincible": 5
    }
  },
  "combo": {
    "window": 2.5,
    "baseMultiplier": 1,
    "perKill": 0.08,
    "maxMultiplier": 6,
    "decay": 0.8
  },
  "levels": {
    "bossInterval": 4,
    "maxLevels": 99,
    "alienSpeedBonus": 8,
    "alienFireBonus": 0.0004,
    "scoreMultiplier": 1.5
  },
  "particles": {
    "maxCount": 500,
    "default": {
      "speed": [
        50,
        200
      ],
      "life": [
        0.2,
        1.2
      ],
      "size": [
        2,
        6
      ],
      "fadeOut": true,
      "shrink": true
    },
    "explosion": {
      "count": 30,
      "speed": [
        80,
        250
      ],
      "life": [
        0.5,
        1.5
      ],
      "size": [
        3,
        8
      ],
      "colors": [
        "#ffaa44",
        "#ff6622",
        "#ffcc22",
        "#ffffff"
      ]
    },
    "playerTrail": {
      "rate": 4,
      "speed": [
        10,
        30
      ],
      "direction": -1.5707963267948966,
      "spread": 0.3,
      "life": [
        0.3,
        0.8
      ],
      "size": [
        2,
        4
      ],
      "colors": [
        "rgba(255, 150, 200, 0.8)",
        "rgba(255, 100, 180, 0.6)"
      ]
    },
    "star": {
      "count": 1,
      "speed": [
        200,
        400
      ],
      "direction": 1.5707963267948966,
      "spread": 0.1,
      "life": [
        0.6,
        1.2
      ],
      "size": [
        2,
        5
      ],
      "colors": [
        "#ffffff",
        "#ffccdd",
        "#aaffff"
      ]
    }
  },
  "viewport": {
    "zoomOnLevelComplete": 1.6,
    "zoomDuration": 0.7,
    "shakeIntensity": 5,
    "shakeDuration": 0.4,
    "cinematicSlowMo": 0.5
  },
  "achievements": [
    {
      "id": "first_blood",
      "name": "First Blood",
      "desc": "Destroy your first alien",
      "condition": "first_alien_killed"
    },
    {
      "id": "combo_master",
      "name": "Combo Master",
      "desc": "Reach x3 combo multiplier",
      "condition": "max_combo_reached"
    },
    {
      "id": "boss_slayer",
      "name": "Boss Slayer",
      "desc": "Defeat your first boss",
      "condition": "first_boss_defeated"
    },
    {
      "id": "survivor",
      "name": "Survivor",
      "desc": "Reach level 10",
      "condition": "level_reached"
    },
    {
      "id": "perfectionist",
      "name": "Perfectionist",
      "desc": "Score 5,000 points in a run",
      "condition": "score_5000"
    },
    {
      "id": "high_score",
      "name": "High Score",
      "desc": "Score 100,000 points",
      "condition": "high_score"
    }
  ]
};

})(window.GF = window.GF || {});
