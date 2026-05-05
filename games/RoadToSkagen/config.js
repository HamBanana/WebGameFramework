// GameFramework/games/RoadToSkagen/config.js
// Game-specific configuration for Road to Skagen.
// Sprite NAMES only — no asset paths.
//
// Sprites referenced (must be registered before game start):
//   claude          (framework — character)
//   tree_pine, tree_birch, bush, signpost, milestone,
//   cloud_small, cloud_big, sun, moon, star,
//   fence, building_city, road_tile, grass_tile, beach_tile,
//   wave, snowflake_pile

(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {
  "engine": {
    "width": 1024,
    "height": 420,
    "canvasId": "gameCanvas",
    "backgroundColor": "#7fb6d8"
  },
  "physics": {
    "gravity": 0,
    "floorY": 9999,
    "leftWall": 0,
    "rightWall": 1024
  },
  "player": {
    "sprite": "claude",
    "scale": 3,
    "groundY": 340,
    "restPosX": 220,
    "walkSpeed": 80
  },
  "journey": {
    "totalKm": 387,
    "cities": [
      {
        "name": "Copenhagen",
        "km": 0,
        "sprite": "building_city"
      },
      {
        "name": "Roskilde",
        "km": 30,
        "sprite": "building_city"
      },
      {
        "name": "Odense",
        "km": 130,
        "sprite": "building_city"
      },
      {
        "name": "Fredericia",
        "km": 175,
        "sprite": "building_city"
      },
      {
        "name": "Aarhus",
        "km": 225,
        "sprite": "building_city"
      },
      {
        "name": "Viborg",
        "km": 270,
        "sprite": "building_city"
      },
      {
        "name": "Aalborg",
        "km": 320,
        "sprite": "building_city"
      },
      {
        "name": "Hjørring",
        "km": 360,
        "sprite": "building_city"
      },
      {
        "name": "Skagen",
        "km": 387,
        "sprite": "building_city"
      }
    ],
    "shopKm": [
      0,
      30,
      130,
      175,
      225,
      270,
      320,
      360
    ],
    "shopRangeKm": 15
  },
  "start": {
    "health": 100,
    "maxHealth": 100,
    "money": 300,
    "food": 10,
    "maxFood": 20,
    "day": 1,
    "clothes": false,
    "rifle": false,
    "map": false,
    "medicine": 0
  },
  "walking": {
    "kmMin": 10,
    "kmRange": 14,
    "mapBonus": 3,
    "foodMin": 2,
    "foodRange": 3,
    "fatigueMin": 4,
    "fatigueRange": 8
  },
  "eventChances": {
    "danger": 0.35,
    "weather": 0.2,
    "good": 0.17
  },
  "dangers": [
    {
      "text": "🚗 A German tourist convoy nearly runs you over! You leap into the ditch.",
      "damage": 30,
      "avoid": null
    },
    {
      "text": "🐗 A wild boar charges from the undergrowth!",
      "damage": 35,
      "avoid": "rifle",
      "avoidText": "You level your rifle — it bolts."
    },
    {
      "text": "🦶 Your ankle twists on a cobblestone. Sharp pain shoots up your leg.",
      "damage": 40,
      "avoid": null
    },
    {
      "text": "🤢 Gas station pastry was a terrible idea. Food poisoning hits hard.",
      "damage": 30,
      "avoid": "medicine",
      "avoidText": "Medicine quells it quickly."
    },
    {
      "text": "👤 Two shady figures demand your money or your health.",
      "damage": 0,
      "avoid": "rifle",
      "avoidText": "The rifle changes their minds fast.",
      "rob": 0.45
    },
    {
      "text": "🐍 Denmark's only venomous snake — the adder — sinks its fangs in.",
      "damage": 45,
      "avoid": "medicine",
      "avoidText": "Anti-venom in your kit saves you."
    },
    {
      "text": "🌊 A rogue wave soaks everything. Hypothermia sets in.",
      "damage": 25,
      "avoid": "clothes",
      "avoidText": "Your warm clothes keep the worst at bay.",
      "cold": true
    },
    {
      "text": "😤 Aggressive swan blocks the path and attacks relentlessly.",
      "damage": 20,
      "avoid": null
    },
    {
      "text": "🕳 You stumble into a bog. Escaping costs you dearly.",
      "damage": 35,
      "avoid": "map",
      "avoidText": "Your map shows a safe path around it."
    },
    {
      "text": "🍺 Rowdy Viking re-enactors pick a fight outside a mead hall.",
      "damage": 25,
      "avoid": "rifle",
      "avoidText": "One look at the rifle and they back off."
    },
    {
      "text": "🌪 A sudden storm pins you down for hours. Exposure takes its toll.",
      "damage": 20,
      "avoid": "clothes",
      "avoidText": "Warm clothes keep the exposure minimal.",
      "cold": true
    },
    {
      "text": "🧊 Ice on the road at dawn. You slide and fall hard.",
      "damage": 28,
      "avoid": null
    }
  ],
  "weatherEvents": [
    {
      "effect": "rain",
      "text": "🌧 Danish drizzle — persistent, grey, weirdly calming.",
      "health": 5,
      "km": 3
    },
    {
      "effect": "snow",
      "text": "❄️ Cold snap from Norway. Your breath clouds the air.",
      "health": 0,
      "km": 0,
      "cold": true
    },
    {
      "effect": "sunshine",
      "text": "☀️ Rare Danish sunshine! A warmth you forgot existed.",
      "health": 15,
      "km": 0
    },
    {
      "effect": "gale",
      "text": "💨 North Sea gale. Every step is a negotiation.",
      "health": 0,
      "km": -3,
      "cold": true
    },
    {
      "effect": "rainbow",
      "text": "🌈 Rainbow over the fjord. You feel invincible.",
      "health": 10,
      "km": 5
    },
    {
      "effect": "fog",
      "text": "🌫 Dense fog. Navigation is instinct.",
      "health": 0,
      "km": -3
    },
    {
      "effect": "crisp",
      "text": "🌤 Crisp autumn morning. The trail feels shorter.",
      "health": 5,
      "km": 5
    },
    {
      "effect": "storm",
      "text": "⛈ Thunder over Jutland. You shelter and wait it out.",
      "health": -5,
      "km": 0
    }
  ],
  "goodEvents": [
    {
      "text": "☕ A roadside café owner takes pity on you. Free coffee and pastry.",
      "health": 12
    },
    {
      "text": "🚜 Farmer offers cash for an hour's help loading bales.",
      "money": 70,
      "food": 2
    },
    {
      "text": "🫐 A hedgerow thick with wild blueberries.",
      "food": 4
    },
    {
      "text": "📸 Tourist mistakes you for a local guide. Pays handsomely.",
      "money": 90
    },
    {
      "text": "🐟 Fisherman at a harbour gives you smoked herring.",
      "food": 5
    },
    {
      "text": "💸 Find a 100 kr note under a park bench.",
      "money": 100
    },
    {
      "text": "🏡 A Danish family invites you for hygge. Warm food, warm hearts.",
      "health": 20,
      "food": 3
    },
    {
      "text": "🚉 Sympathetic conductor waves you past the ticket check.",
      "km": 20
    },
    {
      "text": "🍎 Old orchard with ripe apples nobody's claimed.",
      "food": 4
    },
    {
      "text": "🎸 Street musician tips you for holding the hat.",
      "money": 50
    },
    {
      "text": "⛽ Gas station attendant gives you yesterday's sandwiches.",
      "food": 3
    },
    {
      "text": "💊 Medicine kit found in an abandoned shelter.",
      "medicine": 2
    }
  ],
  "cityEvents": {
    "30": {
      "text": "⛪ Roskilde! Viking ships in the harbour. You feel inspired.",
      "health": 10
    },
    "130": {
      "text": "🌹 Odense! Hans Christian Andersen's birthplace. Free cake for travellers.",
      "health": 15,
      "money": 40
    },
    "175": {
      "text": "🏰 Fredericia! You cross into Jutland. The great bridge behind you.",
      "health": 10
    },
    "225": {
      "text": "🏢 Aarhus! Denmark's second city buzzes with life. You find work for a few hours.",
      "money": 100,
      "food": 2
    },
    "270": {
      "text": "🏛 Viborg! Ancient cathedral city. A priest hands you bread for the road.",
      "food": 6
    },
    "320": {
      "text": "🌆 Aalborg! Aquavit country. A sip of the local spirit warms you through.",
      "health": 10
    },
    "360": {
      "text": "🏠 Hjørring! Almost there. The sea air is sharp and clean.",
      "health": 8
    }
  },
  "restEvents": [
    {
      "text": "😤 Thieves raid your camp!",
      "money": -40
    },
    {
      "text": "🌪 Storm shreds your shelter!",
      "health": -20
    },
    {
      "text": "🐻 Something raids your food while you sleep.",
      "food": -3
    }
  ],
  "restFlavours": [
    "You sleep under a barn roof. Dreams of the coast.",
    "A bus shelter does the job. Surprisingly restful.",
    "Campfire under the open sky. Stars over Jutland.",
    "You find a church pew unlocked. Forgiveness and sleep."
  ],
  "restBadEventChance": 0.22,
  "restHealthMin": 10,
  "restHealthRange": 15,
  "hunt": {
    "successChance": 0.62,
    "foodMin": 4,
    "foodRange": 8,
    "preyNames": [
      "pheasant",
      "rabbit",
      "deer",
      "hare"
    ],
    "failTexts": [
      "Rifle jams at the worst moment.",
      "Spooked it. Hours wasted.",
      "Boar turns the hunt around."
    ],
    "successFatigueMin": 3,
    "successFatigueRange": 5,
    "failExtraDamageMin": 5,
    "failExtraDamageRange": 10
  },
  "workJobs": [
    {
      "name": "Farm labouring",
      "payMin": 55,
      "payMax": 85,
      "risk": 0.1
    },
    {
      "name": "Construction help",
      "payMin": 70,
      "payMax": 120,
      "risk": 0.15
    },
    {
      "name": "Fish processing",
      "payMin": 65,
      "payMax": 100,
      "risk": 0.08
    },
    {
      "name": "Delivery run",
      "payMin": 80,
      "payMax": 140,
      "risk": 0.1
    },
    {
      "name": "Tour guiding",
      "payMin": 60,
      "payMax": 105,
      "risk": 0.05
    },
    {
      "name": "Dock loading",
      "payMin": 75,
      "payMax": 115,
      "risk": 0.12
    }
  ],
  "workInjuryMin": 8,
  "workInjuryRange": 15,
  "forage": {
    "successChance": 0.68,
    "finds": [
      {
        "name": "wild strawberries",
        "food": 3,
        "money": 0
      },
      {
        "name": "chanterelle mushrooms",
        "food": 2,
        "money": 50
      },
      {
        "name": "returnable bottles",
        "food": 0,
        "money": 30
      },
      {
        "name": "rose hips",
        "food": 3,
        "money": 0
      },
      {
        "name": "sea buckthorn",
        "food": 4,
        "money": 0
      }
    ],
    "fatigueMin": 4,
    "fatigueRange": 5
  },
  "shopItems": [
    {
      "id": "food",
      "label": "🍞 Food Rations (3 kg)",
      "cost": 60,
      "food": 3,
      "desc": "+3 kg food"
    },
    {
      "id": "bigfood",
      "label": "🥩 Big Food Pack (8 kg)",
      "cost": 150,
      "food": 8,
      "desc": "+8 kg food"
    },
    {
      "id": "medicine",
      "label": "💊 Medicine (×2)",
      "cost": 140,
      "medicine": 2,
      "desc": "Restores 40 health each"
    },
    {
      "id": "clothes",
      "label": "🧥 Warm Clothes",
      "cost": 180,
      "flag": "clothes",
      "desc": "Halves cold damage"
    },
    {
      "id": "rifle",
      "label": "🔫 Hunting Rifle",
      "cost": 240,
      "flag": "rifle",
      "desc": "Hunt + deters robbers"
    },
    {
      "id": "map",
      "label": "🗺 Trail Map",
      "cost": 80,
      "flag": "map",
      "desc": "+3 km/walk bonus"
    }
  ],
  "medicineHealAmount": 40,
  "coldDamageNoCoat": 12,
  "coldHealWithCoat": 8,
  "starvationDamage": 20,
  "walkHealthFloor": 10,
  "dayNight": {
    "daysPerCycle": 2
  },
  "achievements": [
    {
      "id": "first_steps",
      "icon": "🚶",
      "title": "First Steps",
      "desc": "Walk your first kilometre."
    },
    {
      "id": "jutland",
      "icon": "🏰",
      "title": "Crossing Jutland",
      "desc": "Reach Fredericia."
    },
    {
      "id": "halfway",
      "icon": "🌍",
      "title": "Halfway There",
      "desc": "Reach Aarhus, the heart of Jutland."
    },
    {
      "id": "aalborg",
      "icon": "🌆",
      "title": "Aquavit Country",
      "desc": "Reach Aalborg."
    },
    {
      "id": "survivor",
      "icon": "🏥",
      "title": "Brush With Death",
      "desc": "Survive while below 15% health."
    },
    {
      "id": "hunter",
      "icon": "🏹",
      "title": "Hunter",
      "desc": "Successfully hunt for food."
    },
    {
      "id": "forager",
      "icon": "🍄",
      "title": "Forager",
      "desc": "Find sea buckthorn — the orange gold of the dunes."
    },
    {
      "id": "rich",
      "icon": "💰",
      "title": "Loaded",
      "desc": "Accumulate 1000 kr at once."
    },
    {
      "id": "fully_kitted",
      "icon": "🎒",
      "title": "Fully Kitted",
      "desc": "Own clothes, rifle, map, and at least one medicine."
    },
    {
      "id": "pacifist",
      "icon": "🕊",
      "title": "Pacifist Path",
      "desc": "Reach Skagen without owning a rifle."
    },
    {
      "id": "skagen",
      "icon": "⚓",
      "title": "The Tip",
      "desc": "Reach Skagen."
    },
    {
      "id": "legend",
      "icon": "🌟",
      "title": "Legendary Run",
      "desc": "Score 2000 or more."
    }
  ],
  "debug": {
    "enabled": false,
    "toggleKey": "F1"
  },
  "controls": {
    "walk": [
      "w",
      "W"
    ],
    "rest": [
      "a",
      "A"
    ],
    "shop": [
      "s",
      "S"
    ],
    "hunt": [
      "d",
      "D"
    ],
    "work": [
      "q",
      "Q"
    ],
    "forage": [
      "e",
      "E"
    ],
    "medicine": [
      "m",
      "M"
    ],
    "restart": [
      "r",
      "R"
    ]
  }
};

  // Apply any overrides set by the launcher once the framework is ready.
  // Using GF:ready ensures this works whether config.js loads before
  // or after GameFramework.bundle.js (standalone vs. launcher flow).
  window.addEventListener('GF:ready', function () {
    GF.applyLauncherConfig('RoadToSkagen');
  }, { once: true });

})(window.GF = window.GF || {});

