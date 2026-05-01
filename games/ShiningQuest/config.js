// GameFramework/games/ShiningQuest/config.js
// Shining Force-style RPG configuration. Sprite NAMES only — no asset paths.

(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {

    // ── Engine ──────────────────────────────────────────────────────────────
    engine: {
      width           : 832,
      height          : 480,
      canvasId        : 'gameCanvas',
      backgroundColor : '#0a0a14',
    },

    // Top-down RPG: gravity is 0
    physics: {
      gravity   : 0,
      floorY    : 99999,
      leftWall  : 0,
      rightWall : 99999,
    },

    // ── Battle layout ───────────────────────────────────────────────────────
    battle: {
      cellSize       : 32,                       // pixels per grid cell
      gridOffset     : { x: 16, y: 32 },          // top-left of grid in screen space
      hpBarOffset    : { x: -14, y: -42 },        // relative to feet position
      // Movement-cost overrides per terrain index:
      //   0 grass, 1 path, 2 forest, 3 water, 4 wall, 5 mountain
      terrainCost   : { 0:1, 1:1, 2:2, 3:99, 4:99, 5:3 },
      blockedTerrain: [3, 4],                    // water + wall block
      damageVariance: 0.20,                      // ±20% on every hit
      critMultiplier: 2.0,
      enemyTurnDelayMs: 350,
    },

    // ── Town overworld ──────────────────────────────────────────────────────
    town: {
      cols: 26, rows: 15,
      cellSize: 32,
      playerSpeed: 130,                          // pixels per second
      partyName: 'Force of the Sunrise',
    },

    // ── UI palette (re-used by every scene) ────────────────────────────────
    ui: {
      panelBg     : 'rgba(8,12,32,0.92)',
      panelBorder : '#88aaff',
      titleColor  : '#ffdd66',
      hudColor    : '#ffffff',
      hudFont     : '14px monospace',
      titleFont   : 'bold 22px monospace',
      bigTitleFont: 'bold 38px monospace',
      enemyTeamColor : '#ff5566',
      playerTeamColor: '#66ccff',
      moveTileColor  : 'rgba(80,160,255,0.35)',
      attackTileColor: 'rgba(255,80,80,0.40)',
      pathTileColor  : 'rgba(255,220,80,0.60)',
      cursorColor    : '#ffdd44',
    },

    // ── Controls ────────────────────────────────────────────────────────────
    controls: {
      up     : ['ArrowUp',    'KeyW'],
      down   : ['ArrowDown',  'KeyS'],
      left   : ['ArrowLeft',  'KeyA'],
      right  : ['ArrowRight', 'KeyD'],
      confirm: ['Enter', 'Space', 'KeyZ'],
      cancel : ['Escape', 'Backspace', 'KeyX'],
      menu   : ['KeyM', 'Tab'],
    },
  };

  window.addEventListener('GF:ready', function () {
    GF.applyLauncherConfig('ShiningQuest');
  }, { once: true });

})(window.GF = window.GF || {});
