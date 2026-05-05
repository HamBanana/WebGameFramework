# 16 — Data Models

This doc is the canonical schema reference. When code and this doc disagree, the doc wins until it's updated.

## 16.1 `cfg` (the contents of `GAME_CONFIG`)

```js
{
  engine: { width, height, canvasId, backgroundColor },
  physics: { gravity, floorY, leftWall, rightWall },

  board: {
    map,            // path to default map JSON
    cellSize,       // px
    originX, originY,
  },

  players: [
    { name, sprite, color }, …   // up to 6 entries; first N used
  ],
  numberOfPlayers,               // 2..N; UI-adjustable
  startingMoney,                 // $
  startingResources: { wood:0, … },

  win: { type, target, tiebreaker? },

  property: {
    basePrice,
    baseRent,
    baseRentRate,            // multiplier on basePrice for rent calc
    mayorBonus,
    sabotageRebate,
    bankBuybackRate,         // 0..1
    takeoverMultiplier,
    maxTakeoversPerTurn,
    tierUpgradeCost: { 2:300, 3:600, 4:1000, 5:1600 },
  },

  market: {
    resources: ['wood', …],
    basePrices: { wood:25, … },
    sellSpread,              // 0..1
    driftRate,               // 0..1
    movingAvgAlpha,          // 0..1
    specialtyBonus,          // +n production
    specialtyDiscount,       // -n upkeep
  },

  population: {
    birthRate,
    deathRate,
    happinessLerp,
    migrationRate,
    migrationFloor,          // happiness threshold
    foodPerCapita,
    waterPerCapita,
    taxComfortRate,
    happiness: {
      idleBusinessPenalty,
    },
    oilPerMigrationUnit,
  },

  district: {
    // A district is a named group of squares. Wholly owning one grants Mayorship.
    taxBase,
    maxTaxRate,
    defaultTaxRate,
    defaultPopulation,
    festivalCost,
    festivalDuration,
    festivalHappiness,
    grantPopulation,
    grantCost,
    grantCooldown,
    festivalCooldown,
  },

  industries: { types: [...], bonus: { … }, changeCost, newCompanyCost },

  businesses: {
    catalog: {
      shop: { buildCost, buildResources, upkeep, production, employees, levels: { 1:..., 2:..., 3:... } },
      …
    },
    cellTypeRestrictions: { lumber_mill: ['forest'], … },
  },

  chance: [ {id, label, category, weight, effect, value, scope, message, duration}, … ],

  sabotage: { cost, duration, cooldown, revealAttacker },

  trade:    { maxImbalanceRatio },

  cooperative: { targetMultiplier, threatLimit },

  turn: { rollDuration, moveStepDelay },

  controls: { up:[…], down:[…], left:[…], right:[…], confirm:[…], cancel:[…], endTurn:[…], quickSave:[…], quickLoad:[…] },

  audio: { sfxVolume, uiVolume, musicVolume },

  accessibility: { colorBlindFriendly },

  theme: { id: 'theme_classic', overrides: { … } },

  maps: ['maps/default.json', 'maps/oil_rush.json'],   // selectable on title
  scenarios: ['scenarios/oil_rush.json'],
}
```

This config block lives in `games/Acca/config.js`. Keep keys flat where reasonable so designers can scan it.

## 16.2 Map JSON

See `03_BoardAndCells.md §3.4`. Schema version is `2`. `MapLoader.js` rejects older versions with a clear error pointing to the migration helper.

## 16.3 Save game shape

`framework/systems/SaveSystem.js` handles persistence. Acca's payload (`AccaSave.js`):

```jsonc
{
  "version": 1,
  "mapId": "default",
  "rngSeed": 1234567,
  "turnCounter": 12,
  "currentPlayerIndex": 1,
  "players": [
    {
      "index": 0,
      "name": "Player 1",
      "color": "#ff6b6b",
      "spriteName": "token_red",
      "money": 1240,
      "level": 2,
      "isBankrupt": false,
      "resources": { "wood":3, "steel":0, "electricity":1, "water":2, "food":0, "coal":0, "oil":0 },
      "currentCellId": "c14",
      "ownedCellIds": ["c4","c5"],
      "companies": [
        { "id":"coA","name":"Hamco","industry":"general","propertyIds":["c4","c5"] }
      ],
      "districtsMayoredOf": []
    }
  ],
  "cells": [
    {
      "id":"c4",
      "ownerIndex":0,
      "tier":2,
      "sabotagedUntilTurn":-1,
      "businesses":[
        { "type":"shop","level":1,"employees":2,"idleReason":null }
      ]
    }
  ],
  "districts": [
    { "id":"District A","population":48,"happiness":52,"taxRate":0.10,"mayorIndex":-1,
      "festivalUntilTurn":-1,"grantCooldownUntil":-1,"festivalCooldownUntil":-1 }
  ],
  "market": {
    "prices": { "wood":24, "steel":52, "electricity":35, "water":21, "food":29, "coal":40, "oil":81 },
    "supplyMA": { … },
    "demandMA": { … }
  },
  "chance": { "recentlyDrawn":["festival","stock_crash"] },
  "log": [ … last 6 messages … ]
}
```

`AccaSave.serialize(game)` and `AccaSave.deserialize(payload, game)` are the two entry points. Loading mid-turn returns to `TURN_START` of the saved player to keep the state machine simple.

## 16.4 Event payload schema

See `02_Architecture.md §2.3` for the canonical list. Payloads should use the entity *references* in-game (not just ids) so listeners don't have to look up — except in save/load where everything is serialized to ids.

## 16.5 Validation helpers

`games/Acca/utils/validate.js` (NEW) exposes:

- `validateMap(json)` → `{ ok, errors }`.
- `validateConfig(cfg)` → `{ ok, errors }`.
- `validateSave(json)` → `{ ok, errors }`.

Each is invoked at boot or load time and emits errors via `console.error`. Production builds may downgrade validation to a single boot-time check for performance.
