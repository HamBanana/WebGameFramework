// GameFramework/games/Acca/config.js
// Game-specific configuration for Acca — the canonical contract for every
// designer-tunable number. Schema mirrors Planning §16_DataModels.md.

(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {

    // ── Canvas / Engine ─────────────────────────────────────────────────────
    engine: {
      width          : 768,
      height         : 528,
      canvasId       : 'gameCanvas',
      backgroundColor: '#0d1218',
    },

    physics: {
      gravity   : 0,
      floorY    : 9999,
      leftWall  : 0,
      rightWall : 768,
    },

    // ── Board ───────────────────────────────────────────────────────────────
    board: {
      map     : 'maps/default.json',
      cellSize: 64,
      originX : 32,
      originY : 32,
    },

    // ── Camera ──────────────────────────────────────────────────────────────
    camera: {
      zoomedInCellsAcross: 12,
      zoomOutPadding     : 80,
      lerp               : 0.12,
      betweenTurnsHold   : 0.6,
    },

    // ── Players ─────────────────────────────────────────────────────────────
    players: [
      { name: 'Player 1', sprite: 'token_red',    color: '#ff6b6b' },
      { name: 'Player 2', sprite: 'token_blue',   color: '#6b9bff' },
      { name: 'Player 3', sprite: 'token_green',  color: '#7be07f' },
      { name: 'Player 4', sprite: 'token_yellow', color: '#ffe57a' },
    ],
    numberOfPlayers: 2,
    startingMoney  : 1500,
    startingResources: { wood: 0, steel: 0, electricity: 0, water: 0, food: 0, coal: 0, oil: 0 },

    // ── Win conditions ──────────────────────────────────────────────────────
    win: {
      type     : 'MoneyOnHand',  // MoneyOnHand | TotalValue | Level | LastManStanding
      target   : 5000,
      tiebreaker: 'TotalValue',
    },

    // ── Mode (Planning §15) ─────────────────────────────────────────────────
    mode: 'competitive',         // competitive | cooperative

    cooperative: {
      targetMultiplier: 2.5,
      threatLimit     : 30,
      threatPerTurn   : 1,
      threatPerPlague : 4,
      threatPerLowHappiness: 1, // each district with happiness < 20
    },

    // ── Property pricing (legacy property cells) ────────────────────────────
    property: {
      basePrice         : 200,
      baseRent          : 30,
      baseRentRate      : 0.15,
      mayorBonus        : 50,
      sabotageRebate    : 15,
      bankBuybackRate   : 0.5,
      takeoverMultiplier: 2.0,
      maxTakeoversPerTurn: 1,
      tierUpgradeCost: { 2: 300, 3: 600, 4: 1000, 5: 1600 },
    },

    // ── Player structures (Planning §5.10) ──────────────────────────────────
    structures: {
      catalog: [
        { type: 'shop',           label: 'Shop',           cost: 250 },
        { type: 'toll_gate',      label: 'Toll Gate',      cost: 400 },
        { type: 'teleporter',     label: 'Teleporter',     cost: 500 },
        { type: 'house',          label: 'House',          cost: 300 },
        { type: 'factory',        label: 'Factory',        cost: 600 },
        { type: 'police_station', label: 'Police Station', cost: 700 },
        { type: 'vault',          label: 'Vault',          cost: 500 },
      ],
      sprites: {
        shop: 'cell_shop',
        toll_gate: 'cell_toll_gate',
        teleporter: 'cell_teleporter',
        house: 'cell_house',
        factory: 'cell_factory',
        police_station: 'cell_police_station',
        vault: 'cell_vault',
      },
      shopBaseCap        : 800,
      shopCapPerStructure: 200,
      shopVisitRate      : 0.08,
      shopInvestStep     : 100,
      tollIncrement      : 10,
      teleportFee        : 75,
      houseRentRate      : 0.10,
      houseTaxIfMayor    : 60,
      housePopContribution: 4,    // residents added to district per house owned
      factoryBaseRate    : 1,
      factoryHouseBonus  : 0.25,
      factoryResource    : 'food',
      factoryJobs        : 4,     // employees needed
      shopJobs           : 2,
      policeProtectionTier: 1,
      vaultInterestRate  : 0.04,
      vaultUpkeep        : 25,
    },

    // ── Industries / Companies (Planning §7) ────────────────────────────────
    industries: {
      types: ['general', 'logistics', 'service', 'extraction', 'energy', 'agriculture'],
      bonus: {
        general    : { incomeMul: 1.05, structureTypes: null /* all */ },
        logistics  : { incomeMul: 1.10, structureTypes: ['shop', 'factory', 'toll_gate'] },
        service    : { incomeMul: 1.10, structureTypes: ['house', 'shop'] },
        extraction : { productionMul: 1.20, structureTypes: ['factory'] },
        energy     : { incomeMul: 1.10, structureTypes: ['vault'] },
        agriculture: { productionMul: 1.15, structureTypes: ['factory', 'house'] },
      },
      changeCost   : 1000,
      newCompanyCost: 500,
    },

    // ── Market (Planning §6) ────────────────────────────────────────────────
    market: {
      resources: ['wood', 'steel', 'electricity', 'water', 'food', 'coal', 'oil'],
      basePrices: {
        wood: 25, steel: 50, electricity: 35, water: 20,
        food: 30, coal: 40, oil: 80,
      },
      sellSpread     : 0.9,
      driftRate      : 0.2,
      movingAvgAlpha : 0.3,
      priceFloorMul  : 0.4,
      priceCeilMul   : 2.5,
      specialtyBonus : 1,
      specialtyDiscount: 0,
      passiveYield   : 1, // per owned resource cell type per turn
    },

    // ── Population (Planning §8) ────────────────────────────────────────────
    population: {
      birthRate         : 0.04,
      deathRate         : 0.02,
      happinessLerp     : 0.4,
      migrationRate     : 0.05,
      migrationFloor    : 30,
      foodPerCapita     : 0.01,
      waterPerCapita    : 0.01,
      taxComfortRate    : 0.10,
      oilPerMigrationUnit: 50,
      happiness: {
        idleBusinessPenalty: 2,
      },
    },

    // ── District / Mayor (Planning §9) ──────────────────────────────────────
    // A district is a named group of squares. Wholly owning one grants Mayorship.
    district: {
      taxBase           : 0.5,
      maxTaxRate        : 0.5,
      defaultTaxRate    : 0.10,
      defaultPopulation : 30,
      festivalCost      : 200,
      festivalDuration  : 3,
      festivalHappiness : 10,
      grantCost         : 300,
      grantPopulation   : 5,
      grantCooldown     : 5,
      festivalCooldown  : 5,
    },

    // ── Chance event pool (Planning §10) ────────────────────────────────────
    chance: {
      repeatGuard : 3,
      shuffleEvery: 12,
      pool: [
        // economy
        { id: 'stock_crash',     label: 'Stock Market Crash', category: 'economy',
          weight: 1, effect: 'money_pct', value: -0.10, scope: 'self',
          message: 'Stock market crash! You lose 10% of your cash.' },
        { id: 'festival',        label: 'Regional Festival',  category: 'economy',
          weight: 1, effect: 'money', value: 150, scope: 'self',
          message: 'A regional festival boosts your earnings by $150.' },
        { id: 'bonus_pay',       label: 'Bonus Payment',      category: 'economy',
          weight: 1, effect: 'money', value: 100, scope: 'self',
          message: 'You receive a $100 bonus payment.' },
        { id: 'tax_audit',       label: 'Tax Audit',          category: 'economy',
          weight: 1, effect: 'money', value: -120, scope: 'self',
          message: 'A surprise tax audit costs you $120.' },
        { id: 'oil_strike',      label: 'Oil Discovery',      category: 'economy',
          weight: 0.6, effect: 'resource', value: { resource: 'oil', qty: 3 }, scope: 'self',
          message: 'You strike oil! Gain 3 oil.' },
        { id: 'repair_bill',     label: 'Property Repairs',   category: 'economy',
          weight: 1, effect: 'money', value: -80, scope: 'self',
          message: 'Repair bills come in. You pay $80.' },
        { id: 'supplier_discount', label: 'Supplier Discount', category: 'economy',
          weight: 0.6, effect: 'money', value: 80, scope: 'self',
          message: 'A supplier offers you a kickback of $80.' },
        { id: 'trade_embargo',   label: 'Trade Embargo',      category: 'economy',
          weight: 0.4, effect: 'money', value: -200, scope: 'all',
          message: 'A trade embargo costs every player $200.' },

        // population
        { id: 'regional_festival', label: 'Regional Festival', category: 'population',
          weight: 0.8, effect: 'happiness', value: 10, scope: 'mayor',
          message: '+10 happiness in your mayoral regions.' },
        { id: 'plague',          label: 'Plague',             category: 'population',
          weight: 0.4, effect: 'happiness', value: -10, scope: 'all', duration: 3,
          message: 'A plague drops happiness in every region by 10.' },
        { id: 'boom_town',       label: 'Boom Town',          category: 'population',
          weight: 0.5, effect: 'migration_in', value: 20, scope: 'self',
          message: '20 residents migrate to your lowest-population region.' },

        // resource
        { id: 'resource_boom',   label: 'Resource Boom',      category: 'resource',
          weight: 0.7, effect: 'resource', value: { resource: 'random', qty: 5 }, scope: 'self',
          message: 'A windfall delivers 5 of a random resource.' },
        { id: 'industrial_surge', label: 'Industrial Surge',  category: 'resource',
          weight: 0.6, effect: 'resource', value: { resource: 'steel', qty: 5 }, scope: 'self',
          message: 'Steel surge: +5 steel.' },
        { id: 'energy_surplus',  label: 'Energy Surplus',     category: 'resource',
          weight: 0.6, effect: 'resource', value: { resource: 'electricity', qty: 10 }, scope: 'self',
          message: 'A surplus delivers 10 electricity.' },

        // weather
        { id: 'rainy_season',    label: 'Rainy Season',       category: 'weather',
          weight: 0.6, effect: 'resource', value: { resource: 'water', qty: 5 }, scope: 'all',
          message: 'Rains gift +5 water to every player.' },
        { id: 'drought',         label: 'Drought',            category: 'weather',
          weight: 0.4, effect: 'resource', value: { resource: 'water', qty: -5 }, scope: 'all',
          message: 'Drought! -5 water for every player.' },

        // social
        { id: 'rivalry',         label: 'Rivalry',            category: 'social',
          weight: 0.3, effect: 'sabotage', value: 1, scope: 'leader', duration: 2,
          message: 'A rival sabotages a property of the leader.' },
        { id: 'philanthropy',    label: 'Philanthropy',       category: 'social',
          weight: 0.6, effect: 'money', value: 200, scope: 'lowest',
          message: '$200 gift to the player with the least cash.' },
        { id: 'lucky_die',       label: 'Lucky Die',          category: 'social',
          weight: 0.4, effect: 'modify_die', value: { min: 4, max: 6 }, scope: 'self',
          message: 'Your next roll is between 4 and 6.' },
      ],
    },

    // ── Sabotage (Planning §11.4) ───────────────────────────────────────────
    sabotage: {
      cost            : 300,
      oilCost         : 1,
      duration        : 3,
      cooldown        : 4,
      revealAttacker  : false,
      rentReductionMul: 0.5,
    },

    // ── Trade (Planning §11.6) ──────────────────────────────────────────────
    trade: {
      maxImbalanceRatio: 5,
      allowImbalanced  : false,
    },

    // ── Turn pacing ─────────────────────────────────────────────────────────
    turn: {
      rollDuration  : 1.4,
      moveStepDelay : 0.0,
    },

    // ── Audio (Planning §13.1) — names only; assets out of scope for v1 ─────
    audio: {
      sfxVolume  : 0.7,
      uiVolume   : 0.6,
      musicVolume: 0.4,
    },

    // ── Accessibility ───────────────────────────────────────────────────────
    accessibility: {
      colorBlindFriendly: false,
    },

    // ── Theme ───────────────────────────────────────────────────────────────
    theme: {
      id       : 'theme_classic',
      overrides: {},
    },

    // ── Maps & Scenarios ────────────────────────────────────────────────────
    maps      : ['maps/default.json'],
    scenarios : [],

    // ── Controls ────────────────────────────────────────────────────────────
    controls: {
      up        : ['ArrowUp',    'KeyW'],
      down      : ['ArrowDown',  'KeyS'],
      left      : ['ArrowLeft',  'KeyA'],
      right     : ['ArrowRight', 'KeyD'],
      confirm   : ['Enter',      'Space'],
      cancel    : ['Escape',     'Backspace'],
      endTurn   : ['KeyE'],
      quickSave : ['F5'],
      quickLoad : ['F9'],
    },
  };

  window.addEventListener('GF:ready', function () {
    GF.applyLauncherConfig('Acca');
  }, { once: true });

})(window.GF = window.GF || {});
