// GameFramework/games/SceneTransitionDemo/GAME_CONFIG.js
// Configuration for the Scene Transition Demo — showcases all four built-in
// transition types (iris, fade, wipe, flash) between four distinct scenes.

(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {

    // ── Engine ──────────────────────────────────────────────────────────────
    name: 'SceneTransitionDemo',

    engine: {
      width:           800,
      height:          450,
      canvasId:        'gameCanvas',
      backgroundColor: '#08081a',
    },

    // ── Physics ─────────────────────────────────────────────────────────────
    // Gravity disabled — orbs bounce freely in 2-D space.
    physics: {
      gravity:   0,
      floorY:    9999,
      leftWall:  0,
      rightWall: 800,
    },

    // ── Gameplay ─────────────────────────────────────────────────────────────
    game: {
      orbCount:    6,       // number of active orbs
      duration:    30,      // seconds per round
      orbRadius:   26,      // px
      orbPoints:   10,      // score per click
      orbSpeed:    { min: 55, max: 120 },  // px/s
      respawnTime: 1.5,     // seconds before a popped orb reappears
    },

    // ── Orb palette ──────────────────────────────────────────────────────────
    // fill  — solid body colour
    // glow  — radial-glow colour (should be a semi-transparent version of fill)
    orbs: [
      { fill: '#ff6b6b', glow: 'rgba(255,107,107,0.55)' },
      { fill: '#4ecdc4', glow: 'rgba(78,205,196,0.55)'  },
      { fill: '#ffe66d', glow: 'rgba(255,230,109,0.55)' },
      { fill: '#a29bfe', glow: 'rgba(162,155,254,0.55)' },
      { fill: '#fd79a8', glow: 'rgba(253,121,168,0.55)' },
      { fill: '#74b9ff', glow: 'rgba(116,185,255,0.55)' },
    ],

  };

  // Apply any overrides set by the launcher once the framework is ready.
  // Using GF:ready ensures this works whether GAME_CONFIG.js loads before
  // or after GameFramework.bundle.js (standalone vs. launcher flow).
  window.addEventListener('GF:ready', function () {
    GF.applyLauncherConfig('SceneTransitionDemo');
  }, { once: true });

})(window.GF = window.GF || {});
