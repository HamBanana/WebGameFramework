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

      console.log('[Waves] spawnGrid: startX=' + startX + ' startY=' + startY + ' spacingX=' + spacingX + ' spacingY=' + spacingY + ' W=' + W + ' H=' + H);
      scene.world.spawnGrid('alienCat', cols, rows, startX, startY, spacingX, spacingY, function (alien, c, r) {
        alien.data.row = r;
        alien.data.col = c;
        var tier = r % 3;
        alien.data.tier = tier;
        // Replace with correct tier prefab
        scene.world.destroy(alien);
        var tierPrefab = TIER_SPRITES[tier];
        var newAlien = scene.world.spawn(tierPrefab, alien.x, alien.y);
        if (newAlien) {
          newAlien.data.row = r;
          newAlien.data.col = c;
          newAlien.data.tier = tier;
        }
      });
      console.log('[Waves] spawnWave done: aliens=' + scene.world.count('alien') + ' player=' + scene.world.first('player'));

      // Bunkers module is registered for 'Main' scene — it's already attached.
      // No need to manually push it.
    },

    update(dt, scene, engine) {
      // Check if all aliens are dead
      var alienCount = scene.world.count('alien');
      console.log('[Waves] update: level=' + scene.state.level + ' aliens=' + alienCount + ' phase=' + scene.phase);
      if (alienCount === 0) {
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
          // Next level
          scene.state.level++;
          scene.world.clear();
          this.spawnWave(scene, engine);
        }
      }
    },
  });
})(window.GF);
