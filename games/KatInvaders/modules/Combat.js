// modules/Combat.js — collisions, scoring, hurt/die.
(function (GF) {
  'use strict';

  GF.sceneModule('Combat', {
    scene: 'Main',
    order: -5,
    phases: ['play', 'boss'],

    init(scene, engine) {
      this._scene = scene;
      var world = scene.world;
      var cfg = GF.GAME_CONFIG || {};

      // Player shot → alien
      world.onOverlap('shot', 'alien', (shot, alien) => {
        var x = alien.centerX, y = alien.centerY, tier = alien.data.tier || 0;
        shot.destroy();
        alien.destroy();
        this.killAlien(scene, { tier: tier });
        scene.events.emit('alien:killed', { x: x, y: y, tier: tier });
      });

      // Player shot → UFO
      world.onOverlap('shot', 'ufo', (shot, ufo) => {
        shot.destroy();
        var x = ufo.centerX, y = ufo.centerY;
        ufo.destroy();
        var ufoPoints = (cfg.ufo && cfg.ufo.points) || [50, 100, 150, 200];
        this.award(scene, ufoPoints[Math.min(ufoPoints.length - 1, Math.floor(Math.random() * ufoPoints.length))]);
        scene.events.emit('ufo:killed', { x: x, y: y });
      });

      // Player shot → boss
      world.onOverlap('shot', 'boss', (shot, boss) => {
        shot.destroy();
        boss.data.hp--;
        if (boss.data.hp <= 0) {
          boss.destroy();
          this.award(scene, 500);
          scene.events.emit('boss:dead');
        }
      });

      // Player shot → boss minion
      world.onOverlap('shot', 'bossMinion', (shot, minion) => {
        shot.destroy();
        minion.destroy();
        this.award(scene, 25);
        scene.events.emit('minion:killed', { x: minion.centerX, y: minion.centerY });
      });

      // Alien shot → player
      world.onOverlap('alienShot', 'player', (shot, player) => {
        shot.destroy();
        if (player.data.invincible) return;
        if (player.data.shield) {
          player.data.shield = false;
          player.data.powerups.shield = 0;
          this.award(scene, 10);
        } else {
          this.hurt(scene, player);
        }
      });

      // Boss shot → player
      world.onOverlap('bossShot', 'player', (shot, player) => {
        shot.destroy();
        if (player.data.invincible) return;
        if (player.data.shield) {
          player.data.shield = false;
          player.data.powerups.shield = 0;
          this.award(scene, 10);
        } else {
          this.hurt(scene, player);
        }
      });

      // Boss minion → player
      world.onOverlap('bossMinion', 'player', (minion, player) => {
        minion.destroy();
        scene.events.emit('minion:killed', { x: minion.centerX, y: minion.centerY });
        if (player.data.invincible) return;
        if (player.data.shield) {
          player.data.shield = false;
          player.data.powerups.shield = 0;
        } else {
          this.hurt(scene, player);
        }
      });

      // Player → powerup
      world.onOverlap('player', 'powerup', (player, pickup) => {
        pickup.destroy();
        var type = pickup.data.type;
        var pwrCfg = cfg.powerups || {};
        var durations = pwrCfg.durations || {};
        var duration = durations[type] || 10;

        if (type === 'extraLife') {
          player.data.lives = Math.min((player.data.lives || 0) + 1, 5);
        } else if (type === 'smartBomb') {
          player.data.bombPending = (player.data.bombPending || 0) + 1;
        } else {
          player.data.powerups[type] = duration;
          player.data[type] = true;
        }
      });

      // Shot → bunker
      world.onOverlap('shot', 'bunker', (shot, bunker) => {
        shot.destroy();
        this.damageBunker(bunker, 1);
      });

      // Alien shot → bunker
      world.onOverlap('alienShot', 'bunker', (shot, bunker) => {
        shot.destroy();
        this.damageBunker(bunker, 1);
      });

      // Alien → bunker
      world.onOverlap('alien', 'bunker', (alien, bunker) => {
        alien.destroy();
        this.damageBunker(bunker, 2);
      });
    },

    killAlien(scene, info) {
      var pointsCfg = (GF.GAME_CONFIG && GF.GAME_CONFIG.aliens && GF.GAME_CONFIG.aliens.points) || [30, 20, 20, 10, 10];
      var tier = info.tier || 0;
      var points = pointsCfg[tier] || 10;

      // Apply combo multiplier
      var comboState = scene.state;
      comboState.comboTimer = 2.0; // cfg.combo.window
      comboState.combo = Math.min(comboState.combo + 1, 50);
      var multCfg = (GF.GAME_CONFIG && GF.GAME_CONFIG.combo) || {};
      var maxMult = multCfg.maxMultiplier || 5;
      var mult = 1 + Math.min(comboState.combo * (multCfg.perKill || 0.1), maxMult - 1);
      comboState.comboMultiplier = mult;

      this.award(scene, Math.round(points * mult));
    },

    award(scene, points) {
      scene.state.score += points;
    },

    hurt(scene, player) {
      player.data.lives--;
      player.data.invincible = true;
      player.data.invincibleTimer = (GF.GAME_CONFIG && GF.GAME_CONFIG.player && GF.GAME_CONFIG.player.invincibleDuration) || 2.0;

      // Screen shake
      var vp = scene.module('Viewport');
      if (vp) vp.shake(4, 0.3);

      // Particle event
      scene.events.emit('player:hurt', { x: player.centerX, y: player.centerY });

      if (player.data.lives <= 0) {
        scene.events.emit('player:died', { x: player.centerX, y: player.centerY });
        scene.state.won = false;
        scene.setPhase('over');
      }
    },

    damageBunker(bunker, amount) {
      bunker.data.health = (bunker.data.health || 8) - amount;
      if (bunker.data.health <= 0) {
        var scene = this._scene;
        scene.events.emit('bunker:destroyed', { x: bunker.centerX, y: bunker.centerY });
        bunker.destroy();
      }
    },

    update(dt, scene, engine) {
      // Smart bomb
      var player = scene.world.first('player');
      if (player && player.data.bombPending > 0) {
        player.data.bombPending--;
        this.detonate(scene);
      }

      // Log lowest alien position periodically
      var aliens = scene.world.byTag('alien');
      if (aliens.length > 0 && !this._logInterval) this._logInterval = 0;
      this._logInterval = (this._logInterval || 0) + dt;
      if (this._logInterval > 0.5) {
        this._logInterval = 0;
        var lowestY = 0;
        for (var i = 0; i < aliens.length; i++) {
          if (aliens[i].y > lowestY) lowestY = aliens[i].y;
        }
        console.log('[Combat] lowest alien y=' + lowestY.toFixed(1) + ' player.y=' + player.y);
      }

      // Invaders reaching player row — lose 1 life, reset formation
      if (player && !player.data.invincible) {
        for (var i = 0; i < aliens.length; i++) {
          if (aliens[i].bottom >= player.y) {
            console.log('[Combat] alien reached player! alien.bottom=' + aliens[i].bottom + ' player.y=' + player.y);
            this.hurt(scene, player);
            if (player.data.lives > 0) {
              this.resetFormation(scene);
            }
            break;
          }
        }
      }
    },

    resetFormation(scene) {
      var gameCfg = GF.GAME_CONFIG || {};
      var aliensCfg = gameCfg.aliens || {};
      var startX = aliensCfg.startX || 30;
      var startY = aliensCfg.startY || 60;
      var spacingX = aliensCfg.spacingX || 40;
      var spacingY = aliensCfg.spacingY || 36;

      var aliens = scene.world.byTag('alien');
      // Sort by row then column to restore original grid order
      aliens.sort(function (a, b) {
        if (a.data.row !== b.data.row) return a.data.row - b.data.row;
        return (a.data.col || 0) - (b.data.col || 0);
      });
      for (var i = 0; i < aliens.length; i++) {
        var alien = aliens[i];
        alien.x = startX + (alien.data.col || 0) * spacingX;
        alien.y = startY + (alien.data.row || 0) * spacingY;
      }
      // Reset formation direction and speed
      scene.world.data.dir = 1;
      scene.world.data._edgeHitLogged = false;
      var level = scene.state.level || 1;
      var baseSpeed = aliensCfg.initialSpeed || 30;
      var speedBonus = (gameCfg.levels || {}).alienSpeedBonus || 10;
      scene.world.data.speed = baseSpeed + (level - 1) * speedBonus;
    },

    detonate(scene) {
      var aliens = scene.world.byTag('alien');
      if (!aliens.length) return;
      // Destroy all aliens
      for (var i = 0; i < aliens.length; i++) {
        aliens[i].destroy();
        this.award(scene, 10);
      }
      // Particle burst
      scene.events.emit('smartbomb:detonate');
    },
  });
})(window.GF);
