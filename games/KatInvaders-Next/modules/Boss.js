// modules/Boss.js — boss wave entry, boss fight logic.
(function (GF) {
  'use strict';

  GF.sceneModule('Boss', {
    scene: 'Main',
    order: 15,
    phases: ['play', 'boss'],

    onPhase(phase) {
      if (phase === 'boss') {
        this.phase = 'boss';
        this.state = 'warning';
        this.timer = 0;
      }
    },

    enter(scene, engine) {
      // Only set up boss state when actually in boss phase.
      // Normal waves are handled by Waves module.
      console.log('[Boss] enter: phase=' + scene.phase);
      if (scene.phase !== 'boss') return;

      scene.world.clear();

      // Spawn player
      var playerCfg = (GF.GAME_CONFIG && GF.GAME_CONFIG.player) || {};
      var player = scene.world.spawn('player',
        playerCfg.startX || 240,
        playerCfg.startY || 590
      );
      if (player) {
        player.data.lives = playerCfg.lives || 3;
      }

      // Warning phase
      this.state = 'warning';
      this.timer = (GF.GAME_CONFIG && GF.GAME_CONFIG.boss && GF.GAME_CONFIG.boss.warningDuration) || 4;
    },

    update(dt, scene, engine) {
      var dt = scene.scaledDt || dt;
      if (this.state === 'warning') {
        this.timer -= dt;
        if (this.timer <= 0) {
          this.state = 'fight';
          this.spawnBoss(scene, engine);
        }
        return;
      }

      if (this.state !== 'fight') return;

      // Check if boss is dead
      if (scene.world.count('boss') === 0) {
        // Boss defeated! Next level
        this.state = 'done';
        scene.events.emit('boss:dead');
        setTimeout(function () {
          if (scene.phase === 'boss') {
            scene.state.level++;
            scene.setPhase('play');
          }
        }, 1500);
        return;
      }

      // Spawn minions periodically - only one at a time, every 5 seconds
      var cfg = GF.GAME_CONFIG || {};
      var bossCfg = cfg.boss || {};
      this.minionTimer = (this.minionTimer || 0) + dt;
      var spawnInterval = bossCfg.spawnMinionInterval || 5;
      
      if (this.minionTimer >= spawnInterval) {
        this.minionTimer = 0;
        var boss = scene.world.first('boss');
        if (boss) {
          // Spawn only one minion at a time
          var minion = scene.world.spawn('bossMinion', boss.x + 15, boss.bottom + 10);
          if (minion) {
            // Minion will capture player position on add
          }
        }
      }
    },

    spawnBoss(scene, engine) {
      var cfg = GF.GAME_CONFIG || {};
      var bossCfg = cfg.boss || {};
      var bossTypes = bossCfg.bossTypes || [];
      
      // Select boss type based on level (cycling through types)
      var level = scene.state.level || 1;
      var typeIndex = (level / bossCfg.bossInterval - 1) % bossTypes.length;
      var selectedType = bossTypes[Math.floor(typeIndex)];
      
      // Map behavior types to actual behaviors
      var behavior = selectedType.behavior;
      var behaviors = [];
      
      if (behavior === 'patrol') {
        behaviors = ['BossMove', 'BossGun'];
      } else if (behavior === 'hover') {
        behaviors = ['BossHover', 'BossGun'];
      } else if (behavior === 'aggressive') {
        behaviors = ['BossAggressive', 'BossGun'];
      } else if (behavior === 'circle') {
        behaviors = ['BossCircle', 'BossGun'];
      } else if (behavior === 'complex') {
        behaviors = ['BossComplex', 'BossGun'];
      } else {
        behaviors = ['BossMove', 'BossGun'];
      }
      
      var boss = scene.world.spawn(selectedType.prefab,
        (engine.config.width / 2) - 48,
        50
      );
      if (boss) {
        boss.data.hp = selectedType.hp || bossCfg.hp;
        boss.data.maxHp = selectedType.hp || bossCfg.hp;
        boss.data.fireRate = selectedType.fireRate || bossCfg.fireRate;
        boss.data.speed = selectedType.speed || bossCfg.speed;
        boss.data.behavior = behavior;
      }
    },

    render(ctx, scene, engine) {
      if (this.state !== 'fight') return;
      var boss = scene.world.first('boss');
      if (!boss) return;

      var W = engine.config.width;
      var barW = 200, barH = 12;
      var barX = (W - barW) / 2, barY = 10;
      var hpRatio = Math.max(0, boss.data.hp / boss.data.maxHp);

      // Background
      ctx.fillStyle = 'rgba(50,0,50,0.7)';
      ctx.fillRect(barX, barY, barW, barH);

      // Health
      var color = hpRatio > 0.5 ? '#44ff88' : hpRatio > 0.25 ? '#ffcc44' : '#ff4466';
      ctx.fillStyle = color;
      ctx.fillRect(barX + 1, barY + 1, (barW - 2) * hpRatio, barH - 2);

      // Border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);

      // HP text
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.max(0, boss.data.hp) + '/' + boss.data.maxHp, W / 2, barY + barH / 2);
    },
  });
})(window.GF);
