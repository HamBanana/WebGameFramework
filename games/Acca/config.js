// GameFramework/games/Acca/config.js
// Game-specific configuration for Acca.
// Sprite NAMES only — no asset paths.
// Map layout, regions, and cell-type sprites are defined in the map file
// referenced by GAME_CONFIG.board.map below.

(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {

    // ── Canvas / Engine ─────────────────────────────────────────────────────
    engine: {
      width          : 1024,
      height         : 576,
      canvasId       : 'gameCanvas',
      backgroundColor: '#0d1218',
    },

    // Physics is unused for a board game, but the framework adds it by default
    // when GF.createGame() is called. These values keep it inert.
    physics: {
      gravity   : 0,
      floorY    : 9999,
      leftWall  : 0,
      rightWall : 1024,
    },

    // ── Board ───────────────────────────────────────────────────────────────
    // map: path to the JSON map file (layout, regions, cellSprite, graph data).
    // Only rendering constants live here alongside it.
    board: {
      map     : 'maps/default.json',
      cellSize: 64,
      originX : 32,
      originY : 80,
    },

    // ── Players ─────────────────────────────────────────────────────────────
    // Tokens reference sprite NAMES registered by sprites/tokens.js.
    players: [
      { name: 'Player 1', sprite: 'token_red',    color: '#ff6b6b' },
      { name: 'Player 2', sprite: 'token_blue',   color: '#6b9bff' },
      { name: 'Player 3', sprite: 'token_green',  color: '#7be07f' },
      { name: 'Player 4', sprite: 'token_yellow', color: '#ffe57a' },
    ],
    numberOfPlayers: 2,           // 2..4 — first N players from above are used
    startingMoney  : 1500,

    // ── Win conditions ──────────────────────────────────────────────────────
    win: {
      type   : 'MoneyOnHand',     // MoneyOnHand | TotalValue | Level | LastManStanding
      target : 5000,
    },

    // ── Property pricing ────────────────────────────────────────────────────
    property: {
      basePrice  : 200,           // cost to purchase
      baseRent   : 30,            // rent paid by visitors
      mayorBonus : 50,            // bonus when player controls all properties of a region
    },

    // ── Market ──────────────────────────────────────────────────────────────
    market: {
      // Resource types follow the Resource_Outline.txt design doc.
      resources: ['wood', 'steel', 'electricity', 'water', 'food', 'coal', 'oil'],
      basePrices: {
        wood: 25, steel: 50, electricity: 35, water: 20,
        food: 30, coal: 40, oil: 80,
      },
    },

    // ── Chance event pool ───────────────────────────────────────────────────
    chance: [
      { id: 'stock_crash', label: 'Stock Market Crash',  effect: 'money_pct', value: -0.10,
        message: 'Stock market crash! You lose 10% of your cash.' },
      { id: 'festival',    label: 'Regional Festival',   effect: 'money',     value:  150,
        message: 'A regional festival boosts your earnings by $150.' },
      { id: 'bonus_pay',   label: 'Bonus Payment',       effect: 'money',     value:  100,
        message: 'You receive a $100 bonus payment.' },
      { id: 'tax_audit',   label: 'Tax Audit',           effect: 'money',     value: -120,
        message: 'A surprise tax audit costs you $120.' },
      { id: 'oil_strike',  label: 'Oil Discovery',       effect: 'money',     value:  300,
        message: 'You strike oil! Gain $300.' },
      { id: 'repair_bill', label: 'Property Repairs',    effect: 'money',     value: -80,
        message: 'Repair bills come in. You pay $80.' },
    ],

    // ── Turn pacing ─────────────────────────────────────────────────────────
    turn: {
      rollDuration  : 1.4,        // seconds the die rolls before snapping
      moveStepDelay : 0.0,        // optional pause between forced steps (auto)
    },

    // ── Controls ────────────────────────────────────────────────────────────
    controls: {
      up      : ['ArrowUp',    'KeyW'],
      down    : ['ArrowDown',  'KeyS'],
      left    : ['ArrowLeft',  'KeyA'],
      right   : ['ArrowRight', 'KeyD'],
      confirm : ['Enter',      'Space'],
      cancel  : ['Escape',     'Backspace'],
    },
  };

  // Apply any overrides set by the launcher once the framework is ready.
  // Using GF:ready ensures this works whether config.js loads before
  // or after GameFramework.bundle.js (standalone vs. launcher flow).
  window.addEventListener('GF:ready', function () {
    GF.applyLauncherConfig('Acca');
  }, { once: true });

})(window.GF = window.GF || {});
