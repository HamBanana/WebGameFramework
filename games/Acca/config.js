// games/Acca/config.js
// Game-specific configuration for Acca v0.1.
(function (GF) {
  'use strict';
  GF.GAME_CONFIG = {
  "engine": {
    "width": 768,
    "height": 528,
    "canvasId": "gameCanvas",
    "backgroundColor": "#0d1218"
  },
  "physics": {
    "gravity": 0,
    "floorY": 9999,
    "leftWall": 0,
    "rightWall": 768
  },
  "board": {
    "map": "maps/denmark.json",
    "cellSize": 64,
    "originX": 32,
    "originY": 32
  },
  "camera": {
    "zoomedInCellsAcross": 6,
    "zoomOutPadding": 80,
    "lerp": 0.12,
    "betweenTurnsHold": 0.6,
    "mousePanStrength": 0.6
  },
  "players": [
    {
      "name": "Player 1",
      "sprite": "token_red",
      "color": "#ff6b6b"
    },
    {
      "name": "Player 2",
      "sprite": "token_blue",
      "color": "#6b9bff"
    },
    {
      "name": "Player 3",
      "sprite": "token_green",
      "color": "#7be07f"
    },
    {
      "name": "Player 4",
      "sprite": "token_yellow",
      "color": "#ffe57a"
    }
  ],
  "numberOfPlayers": 4,
  "startingMoney": 1500,
  "startingResources": {
    "wood": 0,
    "steel": 0,
    "electricity": 3,
    "water": 0,
    "food": 3,
    "coal": 0,
    "oil": 1
  },
  "win": {
    "type": "NetWorthOrLastStanding",
    "target": 5000,
    "turnCap": 300,
    "tiebreaker": "TotalValue",
    "escalationAfterTurn": 110,
    "escalationValueRatePerTurn": 0.01
  },
  "mode": "competitive",
  "catchUp": {
    "enabled": true,
    "threshold": 0.35,
    "amount": 60
  },
  "cooperative": {
    "targetMultiplier": 2.5,
    "threatLimit": 30,
    "threatPerTurn": 1,
    "threatPerPlague": 4,
    "threatPerLowHappiness": 1
  },
  "property": {
    "basePrice": 300,
    "baseRent": 30,
    "baseRentRate": 0.15,
    "mayorBonus": 50,
    "sabotageRebate": 15,
    "bankBuybackRate": 0.5,
    "takeoverMultiplier": 3,
    "takeoverSabotageMultiplier": 1.5,
    "maxTakeoversPerTurn": 1,
    "tierUpgradeCost": {
      "2": 300,
      "3": 600,
      "4": 1000,
      "5": 1600
    }
  },
  "structures": {
    "catalog": [
      {
        "type": "shop",
        "label": "Shop",
        "cost": 250,
        "resourceCost": {
          "wood": 1
        },
        "description": "Visitors pay rent (% of value). Owner can Invest to grow value up to a per-district cap."
      },
      {
        "type": "toll_gate",
        "label": "Toll Gate",
        "cost": 250,
        "resourceCost": {
          "wood": 1
        },
        "description": "Every player passing through pays the current toll directly to the owner. Toll grows by tollIncrement per pass."
      },
      {
        "type": "teleporter",
        "label": "Teleporter",
        "cost": 400,
        "resourceCost": {
          "steel": 1
        },
        "description": "Visitors can pay teleportFee to teleport to another teleporter you own. Free for the owner."
      },
      {
        "type": "house",
        "label": "House",
        "cost": 250,
        "resourceCost": {
          "wood": 1
        },
        "description": "Generates owner income; contributes population. Visitors pay rent. Mayor of district gets a flat tax per turn."
      },
      {
        "type": "factory",
        "label": "Factory",
        "cost": 500,
        "resourceCost": {
          "steel": 1
        },
        "description": "Produces a resource each turn (district specialty if any, else food). Houses in the district scale output."
      },
      {
        "type": "police_station",
        "label": "Police Station",
        "cost": 500,
        "resourceCost": {
          "steel": 1
        },
        "description": "Owner income each turn. Structures within policeProtectionTier cells are sabotage-resistant."
      },
      {
        "type": "vault",
        "label": "Vault",
        "cost": 750,
        "description": "5 levels — deposit cash up to capacity, earns interest each turn. Stored money counts toward net worth."
      }
    ],
    "sprites": {
      "shop": "cell_shop",
      "toll_gate": "cell_toll_gate",
      "teleporter": "cell_teleporter",
      "house": "cell_house",
      "factory": "cell_factory",
      "police_station": "cell_police_station",
      "vault": "cell_vault"
    },
    "buildFromHandFee": 50,
    "shopBaseCap": 800,
    "shopCapPerStructure": 200,
    "shopVisitRate": 0.2,
    "shopInvestStep": 100,
    "shopPassiveValueRate": 0.05,
    "shopPassivePopScale": 100,
    "houseRenovateStep": 100,
    "houseBaseCap": 700,
    "houseCapPerStructure": 150,
    "tollIncrement": 10,
    "conversionFee": 100,
    "tollInitialRent": 10,
    "teleportFee": 75,
    "houseRentRate": 0.25,
    "houseTaxIfMayor": 60,
    "housePopContribution": 4,
    "houseOwnerIncome": 18,
    "tollOwnerIncome": 0,
    "teleporterOwnerIncome": 15,
    "policeOwnerIncome": 30,
    "vaultOwnerIncome": 25,
    "vaultInterestRate": 0.015,
    "factoryOwnerIncome": 20,
    "shopSameDistrictDimishing": 0.5,
    "factoryBaseRate": 1,
    "factoryHouseBonus": 0.25,
    "factoryResource": "food",
    "factoryJobs": 4,
    "shopJobs": 2,
    "policeProtectionTier": 1,
    "vaultLevels": [
      {
        "level": 1,
        "buildCost": 750,
        "capacity": 5000
      },
      {
        "level": 2,
        "upgradeCost": 2000,
        "capacity": 15000
      },
      {
        "level": 3,
        "upgradeCost": 3000,
        "capacity": 30000
      },
      {
        "level": 4,
        "upgradeCost": 4000,
        "capacity": 50000
      },
      {
        "level": 5,
        "upgradeCost": 5000,
        "capacity": 75000
      }
    ],
    "upkeep": {
      "houseFood": 1,
      "houseWater": 1,
      "shopElectricity": 2,
      "houseElectricity": 2,
      "factoryOil": 1,
      "factoryCoal": 1,
      "policeElectricity": 1,
      "tollElectricity": 0,
      "teleporterElectricity": 1,
      "vaultElectricity": 0,
      "shortagePenalty": 4,
      "flatCashPerStructure": 7,
      "noBuildPenalty": 30,
      "noBuildPenaltyAfterTurn": 30
    }
  },
  "market": {
    "resources": [
      "wood",
      "steel",
      "electricity",
      "water",
      "food",
      "coal",
      "oil"
    ],
    "basePrices": {
      "wood": 25,
      "steel": 50,
      "electricity": 35,
      "water": 20,
      "food": 30,
      "coal": 40,
      "oil": 80
    },
    "sellSpread": 1,
    "defaultStockBasis": 12,
    "factoryDumpShare": 0.5,
    "cellMarketShare": 0.5,
    "driftRate": 0.2,
    "movingAvgAlpha": 0.3,
    "priceFloorMul": 0.4,
    "priceCeilMul": 2.5,
    "specialtyBonus": 1,
    "specialtyDiscount": 0,
    "passiveYield": 1,
    "cellSupplyInitial": 30,
    "cellSupplyMax": 50,
    "cellSupplyMin": 1,
    "factoryReplenishToCells": 0.5
  },
  "population": {
    "birthRate": 0.04,
    "deathRate": 0.02,
    "happinessLerp": 0.4,
    "migrationRate": 0.05,
    "migrationFloor": 30,
    "foodPerCapita": 0.01,
    "waterPerCapita": 0.01,
    "electricityPerCapita": 0.01,
    "coalPerCapita": 0.005,
    "oilPerCapita": 0.005,
    "taxComfortRate": 0.1,
    "oilPerMigrationUnit": 50,
    "happiness": {
      "idleBusinessPenalty": 2
    }
  },
  "district": {
    "taxBase": 1,
    "taxRateMin": 0.05,
    "taxRateMax": 0.25,
    "taxRateAnchor": 1000,
    "defaultPopulation": 30,
    "festivalCost": 200,
    "festivalDuration": 3,
    "festivalHappiness": 10,
    "grantCost": 300,
    "grantPopulation": 5,
    "grantCooldown": 5,
    "festivalCooldown": 5,
    "happinessGrowthMultiplier": 1.5,
    "mayorMinStructures": 2
  },
  "chance": {
    "repeatGuard": 3,
    "shuffleEvery": 12,
    "nearMissProb": 0.25,
    "pool": [
      {
        "id": "stock_crash",
        "label": "Stock Market Crash",
        "category": "economy",
        "weight": 1,
        "effect": "money_pct",
        "value": -0.1,
        "scope": "self",
        "message": "Panic selling hits the exchange — 10% of your cash evaporates."
      },
      {
        "id": "festival",
        "label": "Regional Festival",
        "category": "economy",
        "weight": 1,
        "effect": "money",
        "value": 150,
        "scope": "self",
        "message": "Merchants flock to the celebration — a windfall for your businesses."
      },
      {
        "id": "bonus_pay",
        "label": "Bonus Payment",
        "category": "economy",
        "weight": 1,
        "effect": "money",
        "value": 100,
        "scope": "self",
        "message": "The city rewards your development activity with a cash bonus."
      },
      {
        "id": "tax_audit",
        "label": "Tax Audit",
        "category": "economy",
        "weight": 1,
        "effect": "money",
        "value": -120,
        "scope": "self",
        "message": "Inspectors flag irregularities in your accounts — back taxes are due."
      },
      {
        "id": "oil_strike",
        "label": "Oil Discovery",
        "category": "economy",
        "weight": 0.6,
        "effect": "resource",
        "value": {
          "resource": "oil",
          "qty": 3
        },
        "scope": "self",
        "message": "Wildcatters strike crude beneath your land — barrels ready to sell."
      },
      {
        "id": "repair_bill",
        "label": "Property Repairs",
        "category": "economy",
        "weight": 1,
        "effect": "money",
        "value": -80,
        "scope": "self",
        "message": "Unexpected maintenance bills land on your desk — pay up or face decline."
      },
      {
        "id": "supplier_discount",
        "label": "Supplier Discount",
        "category": "economy",
        "weight": 0.6,
        "effect": "money",
        "value": 80,
        "scope": "self",
        "message": "A supply chain partner cuts you a discreet deal below market rate."
      },
      {
        "id": "trade_embargo",
        "label": "Trade Embargo",
        "category": "economy",
        "weight": 0.4,
        "effect": "money",
        "value": -200,
        "scope": "all",
        "message": "International sanctions freeze trade — every player takes a financial hit."
      },
      {
        "id": "regional_festival",
        "label": "Regional Festival",
        "category": "population",
        "weight": 0.8,
        "effect": "happiness",
        "value": 10,
        "scope": "mayor",
        "message": "A street festival lifts spirits across every district you govern."
      },
      {
        "id": "plague",
        "label": "Plague",
        "category": "population",
        "weight": 0.4,
        "effect": "happiness",
        "value": -10,
        "scope": "all",
        "duration": 3,
        "message": "Disease spreads unchecked — happiness collapses across all districts."
      },
      {
        "id": "boom_town",
        "label": "Boom Town",
        "category": "population",
        "weight": 0.5,
        "effect": "migration_in",
        "value": 20,
        "scope": "self",
        "message": "Word of your developments draws settlers — new residents arrive in your smallest district."
      },
      {
        "id": "resource_boom",
        "label": "Resource Boom",
        "category": "resource",
        "weight": 0.7,
        "effect": "resource",
        "value": {
          "resource": "random",
          "qty": 5
        },
        "scope": "self",
        "message": "A commodity surplus arrives unexpectedly — your stockpile grows."
      },
      {
        "id": "industrial_surge",
        "label": "Industrial Surge",
        "category": "resource",
        "weight": 0.6,
        "effect": "resource",
        "value": {
          "resource": "steel",
          "qty": 5
        },
        "scope": "self",
        "message": "New blast furnaces come online — regional steel output spikes."
      },
      {
        "id": "coal_seam",
        "label": "Coal Seam",
        "category": "resource",
        "weight": 0.6,
        "effect": "resource",
        "value": {
          "resource": "coal",
          "qty": 5
        },
        "scope": "self",
        "message": "Surveyors expose a rich seam — coal flows directly into your stores."
      },
      {
        "id": "energy_surplus",
        "label": "Energy Surplus",
        "category": "resource",
        "weight": 0.6,
        "effect": "resource",
        "value": {
          "resource": "electricity",
          "qty": 10
        },
        "scope": "self",
        "message": "The grid is overproducing — excess electricity is diverted to your account."
      },
      {
        "id": "rainy_season",
        "label": "Rainy Season",
        "category": "weather",
        "weight": 0.6,
        "effect": "resource",
        "value": {
          "resource": "water",
          "qty": 5
        },
        "scope": "all",
        "message": "Prolonged rains replenish every player's water reserves — a rising tide."
      },
      {
        "id": "drought",
        "label": "Drought",
        "category": "weather",
        "weight": 0.4,
        "effect": "resource",
        "value": {
          "resource": "water",
          "qty": -5
        },
        "scope": "all",
        "message": "A punishing dry spell drains every player's water reserves."
      },
      {
        "id": "rivalry",
        "label": "Rivalry",
        "category": "social",
        "weight": 0.3,
        "effect": "sabotage",
        "value": 1,
        "scope": "leader",
        "duration": 2,
        "message": "An anonymous tip triggers a targeted attack — the current leader's property is sabotaged."
      },
      {
        "id": "philanthropy",
        "label": "Philanthropy",
        "category": "social",
        "weight": 0.6,
        "effect": "money",
        "value": 200,
        "scope": "lowest",
        "message": "An anonymous donor takes pity on the player falling furthest behind."
      },
      {
        "id": "lucky_die",
        "label": "Lucky Die",
        "category": "social",
        "weight": 0.4,
        "effect": "modify_die",
        "value": {
          "min": 4,
          "max": 6
        },
        "scope": "self",
        "message": "Fortune smiles — your next move is guaranteed to land somewhere prime."
      }
    ]
  },
  "sabotage": {
    "cost": 150,
    "oilCost": 1,
    "duration": 3,
    "cooldown": 4,
    "revealAttacker": false,
    "rentReductionMul": 0.5
  },
  "trade": {
    "maxImbalanceRatio": 5,
    "allowImbalanced": false
  },
  "items": {
    "maxStack": 5,
    "catalog": [
      {
        "id": "extra_die",
        "label": "Extra Die",
        "price": 120,
        "useAt": "pre_roll",
        "description": "Roll 2 dice on your next move. Sum determines the steps."
      },
      {
        "id": "lucky_charm",
        "label": "Lucky Charm",
        "price": 90,
        "useAt": "pre_roll",
        "description": "Your next roll is guaranteed to be 5 or 6."
      },
      {
        "id": "loaded_die",
        "label": "Loaded Die",
        "price": 70,
        "useAt": "pre_roll",
        "description": "Your next roll is guaranteed to be exactly 4."
      },
      {
        "id": "shield",
        "label": "Sabotage Shield",
        "price": 180,
        "useAt": "pre_roll",
        "description": "Activate before rolling. Blocks the next sabotage attempt against you."
      },
      {
        "id": "warp_token",
        "label": "Warp Token",
        "price": 250,
        "useAt": "pre_roll",
        "description": "Skip the dice. Move 1 to 12 steps in any direction of your choosing."
      }
    ]
  },
  "theMan": {
    "enabled": true,
    "duration": 3,
    "threatThreshold": 0.8,
    "triggers": {
      "bankrupt": {
        "emotion": "laughing",
        "line": "One down."
      },
      "roll1": {
        "emotion": "laughing",
        "line": "Pathetic."
      },
      "trade": {
        "emotion": "talking",
        "line": "A handshake means nothing."
      },
      "sabotage": {
        "emotion": "shouting",
        "line": "Burn it down!"
      },
      "win": {
        "emotion": "crying",
        "line": "Impossible…"
      },
      "lost": {
        "emotion": "sad",
        "line": ""
      }
    }
  },
  "turn": {
    "rollDuration": 0.4,
    "moveStepDelay": 0
  },
  "audio": {
    "sfxVolume": 0.7,
    "uiVolume": 0.6,
    "musicVolume": 0.4
  },
  "accessibility": {
    "colorBlindFriendly": false
  },
  "theme": {
    "id": "theme_classic",
    "overrides": {}
  },
  "maps": [
    "maps/default.json"
  ],
  "scenarios": [],
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
    "upLeft": [
      "KeyQ"
    ],
    "upRight": [
      "KeyE"
    ],
    "downLeft": [
      "KeyX"
    ],
    "downRight": [
      "KeyC"
    ],
    "confirm": [
      "Enter",
      "Space"
    ],
    "cancel": [
      "Escape",
      "Backspace"
    ],
    "stepBack": [
      "KeyZ"
    ],
    "endTurn": [
      "KeyE"
    ],
    "mapView": [
      "Tab",
      "KeyM"
    ],
    "zoomIn": [
      "Numpad8"
    ],
    "zoomOut": [
      "Numpad2"
    ]
  },
  "debug": {
    "enabled": true,
    "toggleKey": "F1"
  }
};

  window.addEventListener('GF:ready', function () {
    GF.applyLauncherConfig('Acca');
  }, { once: true });
})(window.GF = window.GF || {});
