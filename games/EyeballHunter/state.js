// games/EyeballHunter/state.js
// Shared game state that persists across scene transitions (level -> level,
// game over -> retry, etc). Lives on window.EH so any scene can read/write it.
(function (GF, window) {
  'use strict';

  const EH = {
    // ── Run-wide stats ──────────────────────────────────────────────
    lives: 3,
    eyeballs: 0,        // total collected across the run
    bestCombo: 0,

    // ── Current level ───────────────────────────────────────────────
    levelIndex: 0,
    levelEyeballs: 0,   // collected in the current level

    // ── Temporary powerup effects (timers in seconds) ───────────────
    speedTimer: 0,      // speed boost
    shield: false,      // absorbs one hit
    magnetTimer: 0,     // attracts nearby eyeballs (flavour)

    // ── Run flow ────────────────────────────────────────────────────
    started: false,

    reset() {
      this.lives = 3;
      this.eyeballs = 0;
      this.bestCombo = 0;
      this.levelIndex = 0;
      this.levelEyeballs = 0;
      this.speedTimer = 0;
      this.shield = false;
      this.magnetTimer = 0;
      this.started = true;
    },

    // ── Powerup helpers ─────────────────────────────────────────────
    grant(type) {
      switch (type) {
        case 'life':    this.lives = Math.min(5, this.lives + 1); break;
        case 'speed':   this.speedTimer = 6; break;
        case 'shield':  this.shield = true; break;
        case 'magnet':  this.magnetTimer = 6; break;
      }
    },

    tick(dt) {
      if (this.speedTimer > 0) this.speedTimer = Math.max(0, this.speedTimer - dt);
      if (this.magnetTimer > 0) this.magnetTimer = Math.max(0, this.magnetTimer - dt);
    },

    isSpeeding() { return this.speedTimer > 0; },

    // Consume the shield if present; return true if a hit was absorbed.
    consumeShield() {
      if (this.shield) { this.shield = false; return true; }
      return false;
    }
  };

  GF.EH = EH;      // framework namespace (lint-satisfying)
  window.EH = EH;  // convenient global handle
})(window.GF = window.GF || {}, window);
