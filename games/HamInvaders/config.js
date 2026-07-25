// games/HamInvaders/config.js
// Game-specific configuration. Uses sprite NAMES only — no asset paths.
//
// `scenes` holds per-scene tuning, reachable from any module as scene.config,
// so balance changes never mean editing code.
(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {
    engine: {
      width: 800,
      height: 500,
      canvasId: 'gameCanvas',
      backgroundColor: '#000000',
    },
    physics: {
      gravity: 0,
    },
    game: {
      // Unchanged: this is the SaveSystem namespace and the launcher's
      // GF_CONFIG_<name> localStorage key.
      name: 'HamInvadersHeretic31B',
      startScene: 'TitleScreen',
      autoBoot: true,
      systems: { audio: true, tweens: true, particles: true, debug: false },
    },
    scenes: {
      TitleScreen: {
        background: '#1a1a2e',
      },
      Main: {
        background: '#1a1a2e',
        levels: 1,            // raise for wave progression (each wave is faster + deeper)
        cols: 8,
        rows: 5,
        maxRows: 6,
        spacingX: 56,
        spacingY: 40,
        startY: 50,
        invaderSpeed: 60,
        speedPerLevel: 20,
        dropAmount: 16,
        bobRipple: 0.5,       // phase step per grid cell; 0 = whole block in lockstep
        fireCooldown: 0.3,
        shotSpeed: 400,
        smartBombRows: 2,     // how many of the lowest rows a 💣 clears
        ufoInterval: 20,
        ufoSpeed: 100,
        ufoScore: 100,
        // The entity world only simulates while playing, so the game-over
        // screen freezes the field instead of letting shots drift on.
        worldPhases: ['play'],
      },
    },
    powerups: {
      cooldown: 5,
      dropChance: 0.15,
      types: [
        'doubleShot',
        'extraLife',
        'megaLaser',
        'rapidFire',
        'shield',
        'smartBomb',
        'invincible',
        'tripleShot',
      ],
    },
    debug: {
      enabled: false,
      toggleKey: 'F1',
    },
  };

})(window.GF = window.GF || {});
