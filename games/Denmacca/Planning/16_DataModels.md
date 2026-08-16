# 16 — Data Models

This chapter is the canonical schema reference for every persisted or shared shape in Acca. When the schema changes, this file is updated first; modules that consume the data follow.

## 16.1 `cfg` — the contents of `GAME_CONFIG`

`games/Acca/config.js` builds the full config object. Top-level keys (every key documented elsewhere; this is the index):

```jsonc
GF.GAME_CONFIG = {
  "engine":        { "width", "height", "canvasId", "backgroundColor" },
  "physics":       { "gravity", "floorY", "leftWall", "rightWall" },
  "board":         { "map", "cellSize", "originX", "originY" },
  "camera":        { "zoomedInCellsAcross", "zoomOutPadding", "lerp", "betweenTurnsHold" },
  "players":       [{ "name", "sprite", "color" }, ... up to 4],
  "numberOfPlayers": 2,
  "startingMoney": 1500,
  "startingResources": { "wood": 0, ..., "oil": 1 },

  "win":           { "type", "target", "turnCap", "tiebreaker" },
  "mode":          "competitive" | "cooperative",
  "catchUp":       { "enabled", "threshold", "amount" },
  "cooperative":   { "targetMultiplier", "threatLimit", "threatPerTurn",
                     "threatPerPlague", "threatPerLowHappiness" },

  "property":      { "basePrice", "baseRent", "baseRentRate", "mayorBonus",
                     "sabotageRebate", "bankBuybackRate", "takeoverMultiplier",
                     "maxTakeoversPerTurn", "tierUpgradeCost": { "2"..."5" } },

  "structures": {
    "catalog":  [{ "type", "label", "cost" }, ...],         // 7 entries
    "sprites":  { "shop": "cell_shop", ... },
    "shopBaseCap", "shopCapPerStructure", "shopVisitRate", "shopInvestStep",
    "tollIncrement", "teleportFee",
    "houseRentRate", "houseTaxIfMayor", "housePopContribution", "houseOwnerIncome",
    "tollOwnerIncome", "teleporterOwnerIncome", "policeOwnerIncome", "vaultOwnerIncome",
    "vaultInterestRate",
    "factoryBaseRate", "factoryHouseBonus", "factoryResource", "factoryJobs",
    "shopJobs",
    "policeProtectionTier",
    "vaultLevels": [
      { "level": 1, "buildCost": 1000, "capacity": 5000 },
      ... up to level 5
    ],
    "upkeep": { "houseFood", "shopElectricity", "houseElectricity",
                "factoryOil", "policeElectricity", "tollElectricity",
                "teleporterElectricity", "vaultElectricity", "shortagePenalty" }
  },

  "market": {
    "resources":        ["wood", "steel", "electricity", "water", "food", "coal", "oil"],
    "basePrices":       { "wood": 25, ..., "oil": 80 },
    "sellSpread":       0.9,
    "driftRate":        0.2,
    "movingAvgAlpha":   0.3,
    "priceFloorMul":    0.4,
    "priceCeilMul":     2.5,
    "specialtyBonus":   1,
    "specialtyDiscount": 0,
    "passiveYield":     1
  },

  "population": {
    "birthRate", "deathRate", "happinessLerp",
    "migrationRate", "migrationFloor",
    "foodPerCapita", "waterPerCapita",
    "taxComfortRate", "oilPerMigrationUnit",
    "happiness": { "idleBusinessPenalty" }
  },

  "district": {
    "taxBase", "maxTaxRate", "defaultTaxRate", "defaultPopulation",
    "festivalCost", "festivalDuration", "festivalHappiness",
    "grantCost", "grantPopulation",
    "grantCooldown", "festivalCooldown",
    "happinessGrowthMultiplier"
  },

  "chance": {
    "repeatGuard":   3,
    "shuffleEvery":  12,
    "nearMissProb":  0.25,
    "pool":          [{ /* event schema — see 10.3 */ }, ...]
  },

  "sabotage":     { "cost", "oilCost", "duration", "cooldown",
                    "revealAttacker", "rentReductionMul" },
  "trade":        { "maxImbalanceRatio", "allowImbalanced" },
  "turn":         { "rollDuration", "moveStepDelay" },
  "audio":        { "sfxVolume", "uiVolume", "musicVolume" },
  "accessibility": { "colorBlindFriendly" },
  "theme":        { "id", "overrides" },
  "maps":         ["maps/default.json", ...],
  "scenarios":    [],
  "controls":     { "up", "down", "left", "right", "confirm", "cancel", "endTurn" },
  "debug":        { "enabled", "toggleKey" }
};
```

The launcher `game.json` injects overrides (Players, Starting Money, Win Target, Property Price) via `GF.applyLauncherConfig('Acca2')`.

## 16.2 Map JSON

See `03_BoardAndCells.md` §3.4 for the full schema. Authoritative shape:

```jsonc
{
  "version": 2,
  "name":    "string",
  "size":    { "rows": int, "cols": int, "cellSize": int },
  "spawnCellId":    int | null,
  "nextCellId":     int,
  "nextDistrictId": int,
  "districts": [{ "id", "name", "color", "specialty", "basePopulation", "defaultTaxRate", "cellCount" }],
  "cells":     [{ "id", "x", "y", "type", "subType", "district", "districtId", "structureType", "value" }],
  "connections": [{ "from", "to", "direction": "both" | "forward" }]
}
```

Validation: `utils/validate.js → validateMap(json) → { ok, errors[] }`.

## 16.3 Save game shape

`systems/AccaSave.js` produces and consumes this snapshot. Storage: `localStorage["acca_save_v1"]`.

```jsonc
{
  "version":            1,
  "mapId":              "string (file name of the active map)",
  "turnCounter":        int,
  "currentPlayerIndex": int,
  "cooperativeThreat":  int,

  "players": [
    {
      "index": 0,
      "name":  "Player 1",
      "color": "#ff6b6b",
      "spriteName": "token_red",
      "money": 1500,
      "level": 0,
      "isBankrupt": false,
      "resources": { "wood": 0, ... },
      "currentCellId": 0,
      "districtsMayoredOf": ["Downtown", ...],