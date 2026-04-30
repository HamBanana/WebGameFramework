// GameFramework/games/SpaceInvaders/config.js
// Space Invaders — game configuration. Sprite names only, no asset paths.

(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {

    // ── Engine ──────────────────────────────────────────────────────────────
    engine: {
      width           : 800,
      height          : 500,
      canvasId        : 'gameCanvas',
      backgroundColor : '#000008',
    },

    // ── Physics ─────────────────────────────────────────────────────────────
    // Gravity is 0 — this is a top-down shooter
    physics: {
      gravity   : 0,
      floorY    : 9999,
      leftWall  : 0,
      rightWall : 800,
    },

    // ── Player ──────────────────────────────────────────────────────────────
    player: {
      sprite      : 'playerShip',
      startX      : 400,
      startY      : 440,
      speed       : 260,          // px/s
      lives       : 3,
      hitbox      : { w: 36, h: 22 },
      bulletSpeed : 520,          // px/s upward
      fireRate    : 0.45,         // seconds between shots
      respawnDelay: 2.0,          // seconds after death
      flashTime   : 2.0,          // seconds of invincibility flashing
    },

    // ── Aliens ──────────────────────────────────────────────────────────────
    // Three rows of each type (top → bottom: squid, crab, octopus)
    aliens: {
      cols        : 11,
      rows        : 5,
      startX      : 80,           // left edge of alien grid
      startY      : 80,           // top edge of alien grid
      colSpacing  : 55,
      rowSpacing  : 40,
      moveSpeed   : 28,           // initial horizontal speed px/s
      speedPerKill: 1.8,          // speed increase per alien killed
      dropAmount  : 20,           // px to drop when reaching wall
      fireRate    : 0.4,          // shots per second (total fleet)
      bulletSpeed : 180,          // px/s downward
      types: [
        { rows: [0],      sprite: 'alienSquid',    points: 30, color: '#ff44ff' },
        { rows: [1, 2],   sprite: 'alienCrab',     points: 20, color: '#44ffff' },
        { rows: [3, 4],   sprite: 'alienOctopus',  points: 10, color: '#88ff44' },
      ],
    },

    // ── UFO ─────────────────────────────────────────────────────────────────
    ufo: {
      sprite      : 'alienUFO',
      y           : 42,
      speed       : 120,
      points      : [50, 100, 150, 300],  // random pick
      spawnInterval: [15, 25],            // seconds between appearances
    },

    // ── Bunkers ─────────────────────────────────────────────────────────────
    bunkers: {
      count  : 4,
      y      : 370,
      health : 4,           // hits before destroyed
      color  : '#44ff44',
      w      : 52,
      h      : 32,
    },

    // ── Controls ────────────────────────────────────────────────────────────
    controls: {
      left : ['ArrowLeft',  'KeyA'],
      right: ['ArrowRight', 'KeyD'],
      fire : ['Space',      'KeyZ'],
      pause: ['KeyP',       'Escape'],
    },

    // ── Powerups ─────────────────────────────────────────────────────────────
    powerups: {
      dropChance : 0.12,       // probability per alien kill
      speed      : 65,         // fall speed px/s
      duration   : 8,          // active seconds (except shield which lasts until hit)
      types: [
        { type: 'rapidFire', sprite: 'powerupRapidFire', color: '#ff5500' },
        { type: 'doubleShot', sprite: 'powerupDoubleShot', color: '#ffcc00' },
        { type: 'shield',    sprite: 'powerupShield',    color: '#4488ff' },
      ],
    },

    // ── Scoring ─────────────────────────────────────────────────────────────
    scoring: {
      extraLifeAt: 1500,
    },

    // ── Visual ──────────────────────────────────────────────────────────────
    colors: {
      player   : '#00e5ff',
      hud      : '#ffffff',
      hudAccent: '#00e5ff',
      floor    : 'rgba(0,229,255,0.3)',
    },
  };

  // Apply any overrides set by the launcher once the framework is ready.
  // Using GF:ready ensures this works whether config.js loads before
  // or after GameFramework.bundle.js (standalone vs. launcher flow).
  window.addEventListener('GF:ready', function () {
    GF.applyLauncherConfig('SpaceInvaders');
  }, { once: true });

})(window.GF = window.GF || {});
