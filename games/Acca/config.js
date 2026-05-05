// games/Acca2/config.js
// Game-specific configuration for Acca v2 — same schema as v1.
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
    "map": "maps/default.json",
    "cellSize": 64,
    "originX": 32,
    "originY": 32
  },
  "camera": {
    "zoomedInCellsAcross": 6,
    "zoomOutPadding": 80,
    "lerp": 0.12,
    "betweenTurnsHold": 0.6
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
  "numberOfPlayers": 2,
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
    "tiebreaker": "TotalValue"
  },
  "mode": "competitive",
  "catchUp": {
    "enabled": true,
    "threshold": 0.55,
    "amount": 120
  },
  "cooperative": {
    "targetMultiplier": 2.5,
    "threatLimit": 30,
    "threatPerTurn": 1,
    "threatPerPlague": 4,
    "threatPerLowHappiness": 1
  },
  "property": {
    "basePrice": 200,
    "baseRent": 30,
    "baseRentRate": 0.15,
    "mayorBonus": 50,
    "sabotageRebate": 15,
    "bankBuybackRate": 0.5,
    "takeoverMultiplier": 5,
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
        "cost": 250
      },
      {
        "type": "toll_gate",
        "label": "Toll Gate",
        "cost": 400
      },
      {
        "type": "teleporter",
        "label": "Teleporter",
        "cost": 500
      },
      {
        "type": "house",
        "label": "House",
        "cost": 300
      },
      {
        "type": "factory",
        "label": "Factory",
        "cost": 600
      },
      {
        "type": "police_station",
        "label": "Police Station",
        "cost": 700
      },
      {
        "type": "vault",
        "label": "Vault",
        "cost": 1000
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
    "shopBaseCap": 800,
    "shopCapPerStructure": 200,
    "shopVisitRate": 0.2,
    "shopInvestStep": 100,
    "tollIncrement": 25,
    "teleportFee": 75,
    "houseRentRate": 0.25,
    "houseTaxIfMayor": 60,
    "housePopContribution": 4,
    "houseOwnerIncome": 18,
    "tollOwnerIncome": 8,
    "teleporterOwnerIncome": 12,
    "policeOwnerIncome": 30,
    "vaultOwnerIncome": 10,
    "vaultInterestRate": 0.01,
    "factoryBaseRate": 1,
    "factoryHouseBonus": 0.25,
    "factoryResource": "food",
    "factoryJobs": 4,
    "shopJobs": 2,
    "policeProtectionTier": 1,
    "vaultLevels": [
      {
        "level": 1,
        "buildCost": 1000,
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
      "shopElectricity": 1,
      "houseElectricity": 1,
      "factoryOil": 1,
      "policeElectricity": 1,
      "tollElectricity": 0,
      "teleporterElectricity": 1,
      "vaultElectricity": 0,
      "shortagePenalty": 4
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
    "sellSpread": 0.9,
    "driftRate": 0.2,
    "movingAvgAlpha": 0.3,
    "priceFloorMul": 0.4,
    "priceCeilMul": 2.5,
    "specialtyBonus": 1,
    "specialtyDiscount": 0,
    "passiveYield": 1
  },
  "population": {
    "birthRate": 0.04,
    "deathRate": 0.02,
    "happinessLerp": 0.4,
    "migrationRate": 0.05,
    "migrationFloor": 30,
    "foodPerCapita": 0.01,
    "waterPerCapita": 0.01,
    "taxComfortRate": 0.1,
    "oilPerMigrationUnit": 50,
    "happiness": {
      "idleBusinessPenalty": 2
    }
  },
  "district": {
    "taxBase": 1,
    "maxTaxRate": 0.5,
    "defaultTaxRate": 0.1,
    "defaultPopulation": 30,
    "festivalCost": 200,
    "festivalDuration": 3,
    "festivalHappiness": 10,
    "grantCost": 300,
    "grantPopulation": 5,
    "grantCooldown": 5,
    "festivalCooldown": 5,
    "happinessGrowthMultiplier": 1.5
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
        "message": "Stock market crash! You lose 10% of your cash."
      },
      {
        "id": "festival",
        "label": "Regional Festival",
        "category": "economy",
        "weight": 1,
        "effect": "money",
        "value": 150,
        "scope": "self",
        "message": "A regional festival boosts your earnings by $150."
      },
      {
        "id": "bonus_pay",
        "label": "Bonus Payment",
        "category": "economy",
        "weight": 1,
        "effect": "money",
        "value": 100,
        "scope": "self",
        "message": "You receive a $100 bonus payment."
      },
      {
        "id": "tax_audit",
        "label": "Tax Audit",
        "category": "economy",
        "weight": 1,
        "effect": "money",
        "value": -120,
        "scope": "self",
        "message": "A surprise tax audit costs you $120."
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
        "message": "You strike oil! Gain 3 oil."
      },
      {
        "id": "repair_bill",
        "label": "Property Repairs",
        "category": "economy",
        "weight": 1,
        "effect": "money",
        "value": -80,
        "scope": "self",
        "message": "Repair bills come in. You pay $80."
      },
      {
        "id": "supplier_discount",
        "label": "Supplier Discount",
        "category": "economy",
        "weight": 0.6,
        "effect": "money",
        "value": 80,
        "scope": "self",
        "message": "A supplier offers you a kickback of $80."
      },
      {
        "id": "trade_embargo",
        "label": "Trade Embargo",
        "category": "economy",
        "weight": 0.4,
        "effect": "money",
        "value": -200,
        "scope": "all",
        "message": "A trade embargo costs every player $200."
      },
      {
        "id": "regional_festival",
        "label": "Regional Festival",
        "category": "population",
        "weight": 0.8,
        "effect": "happiness",
        "value": 10,
        "scope": "mayor",
        "message": "+10 happiness in your mayoral regions."
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
        "message": "A plague drops happiness in every region by 10."
      },
      {
        "id": "boom_town",
        "label": "Boom Town",
        "category": "population",
        "weight": 0.5,
        "effect": "migration_in",
        "value": 20,
        "scope": "self",
        "message": "20 residents migrate to your lowest-population region."
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
        "message": "A windfall delivers 5 of a random resource."
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
        "message": "Steel surge: +5 steel."
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
        "message": "A coal seam is uncovered: +5 coal."
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
        "message": "A surplus delivers 10 electricity."
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
        "message": "Rains gift +5 water to every player."
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
        "message": "Drought! -5 water for every player."
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
        "message": "A rival sabotages a property of the leader."
      },
      {
        "id": "philanthropy",
        "label": "Philanthropy",
        "category": "social",
        "weight": 0.6,
        "effect": "money",
        "value": 200,
        "scope": "lowest",
        "message": "$200 gift to the player with the least cash."
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
        "message": "Your next roll is between 4 and 6."
      }
    ]
  },
  "sabotage": {
    "cost": 300,
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
  "turn": {
    "rollDuration": 1.4,
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
    "confirm": [
      "Enter",
      "Space"
    ],
    "cancel": [
      "Escape",
      "Backspace"
    ],
    "endTurn": [
      "KeyE"
    ]
  },
  "debug": {
    "enabled": true,
    "toggleKey": "F1"
  }
};

  window.addEventListener('GF:ready', function () {
    GF.applyLauncherConfig('Acca2');
  }, { once: true });
})(window.GF = window.GF || {});
