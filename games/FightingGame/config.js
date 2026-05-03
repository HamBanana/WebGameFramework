// GameFramework/games/FightingGame/config.js
// Game-specific configuration.
// Uses sprite NAMES only — no asset paths.

(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {

    // ── Canvas / Engine ─────────────────────────────────────────────────────
    engine: {
      width          : 800,
      height         : 480,
      canvasId       : 'gameCanvas',
      backgroundColor: '#0a0012',
    },

    // ── Physics ──────────────────────────────────────────────────────────────
    physics: {
      gravity   : 2400,   // px/s²
      floorY    : 385,    // y-coordinate of the stage floor (feet land here)
      leftWall  : 40,
      rightWall : 760,
    },

    // ── Round settings ────────────────────────────────────────────────────────
    round: {
      totalRounds    : 3,      // best of 3
      roundTime      : 5,     // seconds per round (0 = sudden death)
      koDuration     : 2.5,    // seconds to show KO screen before next round
      victoryDuration: 3.0,
    },

    // ── Fighters ─────────────────────────────────────────────────────────────
    // Games reference sprites by NAME; the SpriteSystem resolves them.
    fighters: {
      kuro: {
        sprite     : 'kuro',          // sprite name registered with SpriteSystem
        displayName: 'KURO',
        startX     : 200,
        startFacing: 1,               // 1 = facing right, -1 = facing left
        color      : '#00e5ff',
        maxHealth  : 100,
        speed      : 280,             // walk speed px/s
        jumpPower  : -820,            // initial vy on jump (negative = up)
        hitbox     : { w: 38, h: 72 },
        moves: {
          lightPunch: { damage: 8,  stun: 0.20, range: 55, knockback: 80  },
          heavyPunch: { damage: 15, stun: 0.35, range: 62, knockback: 180 },
          lightKick : { damage: 10, stun: 0.22, range: 58, knockback: 100 },
          heavyKick : { damage: 18, stun: 0.40, range: 66, knockback: 220 },
          special   : { damage: 25, stun: 0.55, range: 75, knockback: 280 },
        },
        blockDamageMultiplier: 0.20,
      },

      hana: {
        sprite     : 'hana',
        displayName: 'HANA',
        startX     : 600,
        startFacing: -1,
        color      : '#ff6600',
        maxHealth  : 100,
        speed      : 250,
        jumpPower  : -780,
        hitbox     : { w: 42, h: 72 },
        moves: {
          lightPunch: { damage: 9,  stun: 0.18, range: 58, knockback: 85  },
          heavyPunch: { damage: 16, stun: 0.38, range: 65, knockback: 200 },
          lightKick : { damage: 11, stun: 0.24, range: 62, knockback: 110 },
          heavyKick : { damage: 19, stun: 0.42, range: 68, knockback: 240 },
          special   : { damage: 26, stun: 0.60, range: 78, knockback: 300 },
        },
        blockDamageMultiplier: 0.25,
      },
    },

    // ── AI (CPU) ─────────────────────────────────────────────────────────────
    ai: {
      reactionTime  : 0.18,   // seconds before AI reacts (lower = harder)
      aggressionBias: 0.55,   // 0 = defensive, 1 = always attacking
      jumpFrequency : 0.018,  // probability of jumping per frame when idle
    },

    // ── Stage ────────────────────────────────────────────────────────────────
    stage: {
      background: '#0a0012',
      floorColor: '#1a0a2e',
      floorY    : 385,
      stageW    : 800,
      stageH    : 480,
    },

    // ── Debug ─────────────────────────────────────────────────────────────────
    // enabled: start visible; toggleKey: keyboard code to show/hide overlay
    debug: {
      enabled  : false,
      toggleKey: 'F1',
    },

    // ── Controls ─────────────────────────────────────────────────────────────
    // KeyboardEvent.code strings
    controls: {
      p1: {
        left      : 'KeyA',
        right     : 'KeyD',
        jump      : 'KeyW',
        crouch    : 'KeyS',
        lightPunch: 'KeyU',
        heavyPunch: 'KeyI',
        lightKick : 'KeyJ',
        heavyKick : 'KeyK',
        special   : 'KeyL',
        block     : 'KeyO',
      },
      p2: {
        left      : 'ArrowLeft',
        right     : 'ArrowRight',
        jump      : 'ArrowUp',
        crouch    : 'ArrowDown',
        lightPunch: 'Numpad1',
        heavyPunch: 'Numpad2',
        lightKick : 'Numpad4',
        heavyKick : 'Numpad5',
        special   : 'Numpad6',
        block     : 'Numpad3',
      },
    },
  };

  // Apply any overrides set by the launcher once the framework is ready.
  // Using GF:ready ensures this works whether config.js loads before
  // or after GameFramework.bundle.js (standalone vs. launcher flow).
  window.addEventListener('GF:ready', function () {
    GF.applyLauncherConfig('FightingGame');
  }, { once: true });

})(window.GF = window.GF || {});
