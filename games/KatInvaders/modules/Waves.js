// modules/Waves.js — spawn alien grid and handle level progression.
(function (GF) {
  'use strict';

  var TIER_SPRITES = ['alienCat', 'alienDog', 'alienMouse'];
  var TIER_POINTS = [30, 20, 10];

  GF.sceneModule('Waves', {
    scene: 'Main',
    order: 10,
    phases: ['play'],

    onPhase(phase, prev, scene) {
      if (phase === 'play' && prev === 'boss') {
        // Clear leftover entities from boss phase before spawning next wave
        scene.world.clear();
        this.spawnWave(scene, scene.engine);
      }
    },

    enter(scene, engine) {
      scene.world.clear();
      // Only spawn aliens in play phase; boss phase handled by Boss module
      if (scene.phase !== 'boss') {
        if (!scene.state.level) scene.state.level = 1;
        this.spawnWave(scene, engine);
      }
    },

    spawnWave(scene, engine) {
      var gameCfg = GF.GAME_CONFIG || {};
      var W = engine.config.width;
      var H = engine.config.height;

      scene.state.level = scene.state.level || 1;
      scene.world.data.dir = 1;

      var level = scene.state.level;
      var aliensCfg = gameCfg.aliens || {};
      var baseSpeed = aliensCfg.initialSpeed || 30;
      var speedBonus = (gameCfg.levels || {}).alienSpeedBonus || 10;
      scene.world.data.speed = baseSpeed + (level - 1) * speedBonus;

      // Spawn player
      var playerCfg = gameCfg.player || {};
      var player = scene.world.spawn('player',
        playerCfg.startX || 240,
        playerCfg.startY || 590
      );
      if (player) {
        player.data.lives = playerCfg.lives || 3;
      }

      // Spawn alien grid
      var rows = aliensCfg.rows || 5;
      var cols = aliensCfg.cols || 10;
      var startX = aliensCfg.startX || 30;
      var startY = aliensCfg.startY || 60;
      var spacingX = aliensCfg.spacingX || 40;
      var spacingY = aliensCfg.spacingY || 36;

      // Spawn alien grid directly with correct tier prefabs (no destroy+respawn)
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var tier = r % 3;
          var tierPrefab = TIER_SPRITES[tier];
          var alien = scene.world.spawn(tierPrefab, startX + c * spacingX, startY + r * spacingY);
          if (alien) {
            alien.data.row = r;
            alien.data.col = c;
            alien.data.tier = tier;
          }
        }
      }


      // Bunkers module is registered for 'Main' scene — it's already attached.
      // No need to manually push it.
    },

    update(dt, scene, engine) {
      // Check if all aliens are dead
      if (scene.world.count('alien') === 0) {
        var levelsCfg = (GF.GAME_CONFIG && GF.GAME_CONFIG.levels) || {};
        var bossInterval = levelsCfg.bossInterval || 5;
        var maxLevels = levelsCfg.maxLevels || 99;

        if (scene.state.level >= maxLevels) {
          scene.state.won = true;
          scene.setPhase('over');
        } else if (scene.state.level % bossInterval === 0) {
          // Boss level — handled by Boss module
          scene.setPhase('boss');
        } else {
          // Next level. The final-invader cinematic (zoom/slow-mo + explosion)
          // is driven by Combat. Hold the respawn until it finishes so the
          // burst plays out before the next wave spawns.
          var vp = scene.module('Viewport');
          if (vp && vp._cinematicActive) {
            return; // cinematic still playing — hold the respawn
          }
          scene.state.level++;
          scene.world.clear();
          this.spawnWave(scene, engine);
        }
      }
    },
  });
})(window.GF);
