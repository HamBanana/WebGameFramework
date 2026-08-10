// modules/Powerups.js — drop pickups on alien kill.
(function (GF) {
  'use strict';
  GF.sceneModule('Powerups', {
    scene: 'Main',
    phases: ['play', 'boss'],

    init(scene, engine) {
      scene.events.on('alien:killed', (hit) => this.maybeDrop(scene, hit));
      scene.events.on('minion:killed', (hit) => this.maybeDropMinion(scene, hit));
    },

    enter(scene) { this.cooldown = 0; },

    update(dt, scene) {
      var dt = scene.scaledDt || dt;
      this.cooldown = Math.max(0, this.cooldown - dt);
    },

    maybeDrop(scene, hit) {
      if (scene.phase !== 'play' || this.cooldown > 0) return;
      var cfg = (GF.GAME_CONFIG && GF.GAME_CONFIG.powerups) || {};
      if (Math.random() >= (cfg.dropChance != null ? cfg.dropChance : 0.12)) return;
      var selected = this.selectPowerup(cfg);
      if (!selected) return;
      this.spawnPowerup(scene, hit, cfg, selected);
    },

    maybeDropMinion(scene, hit) {
      if (scene.phase !== 'boss' || this.cooldown > 0) return;
      var cfg = (GF.GAME_CONFIG && GF.GAME_CONFIG.powerups) || {};
      var chance = (cfg.minionDropChance != null ? cfg.minionDropChance : 0.25);
      if (Math.random() >= chance) return;
      var selected = this.selectPowerup(cfg);
      if (!selected) return;
      this.spawnPowerup(scene, hit, cfg, selected);
    },

    selectPowerup(cfg) {
      var types = cfg.types || [];
      if (!types.length) return null;
      var weights = types.map(function (t) { return t.weight || 1; });
      var totalWeight = weights.reduce(function (a, b) { return a + b; }, 0);
      var r = Math.random() * totalWeight;
      var selected = types[0];
      for (var i = 0; i < types.length; i++) {
        r -= weights[i];
        if (r <= 0) { selected = types[i]; break; }
      }
      return selected;
    },

    spawnPowerup(scene, hit, cfg, selected) {
      var pickup = scene.world.spawn('powerup', hit.x - 10, hit.y - 10);
      if (!pickup) return;
      pickup.data.type = selected.type;
      pickup.sprite = selected.sprite;
      if (scene.world.sprites) {
        pickup._anim = scene.world.sprites.createAnimator(pickup.sprite, 'idle');
      }
      
      // Create particle effect for powerup spawn
      var particles = GF.game.particles;
      if (particles) {
        var colors = selected.color ? [selected.color, selected.color + '88', '#ffffff'] : ['#ffffff'];
        particles.burst(hit.x, hit.y, {
          count: 10,
          colors: colors,
          speed: [20, 100],
          direction: -Math.PI / 2, // Upward
          spread: 0.3,
          life: [0.4, 0.8],
          size: [2, 5],
          gravity: -50, // Floating up
          fadeOut: true,
          shrink: true
        });
      }
      
      this.cooldown = cfg.cooldown != null ? cfg.cooldown : 5;
    },
    
    applyPowerup(scene, player, powerupType) {
      var durations = (GF.GAME_CONFIG && GF.GAME_CONFIG.powerups && GF.GAME_CONFIG.powerups.durations) || {};
      var duration = durations[powerupType] || 10;
      
      switch (powerupType) {
        case 'rapidFire':
          player.data.fireRate = (player.data.baseFireRate || 0.22) * 0.5;
          setTimeout(function() {
            player.data.fireRate = player.data.baseFireRate || 0.22;
          }, duration * 1000);
          break;
        case 'doubleShot':
          player.data.weaponMode = 'double';
          setTimeout(function() {
            player.data.weaponMode = 'single';
          }, duration * 1000);
          break;
        case 'tripleShot':
          player.data.weaponMode = 'triple';
          setTimeout(function() {
            player.data.weaponMode = 'single';
          }, duration * 1000);
          break;
        case 'spreadShot':
          player.data.weaponMode = 'spread';
          setTimeout(function() {
            player.data.weaponMode = 'single';
          }, duration * 1000);
          break;
        case 'shield':
          player.data.hasShield = true;
          setTimeout(function() {
            player.data.hasShield = false;
          }, duration * 1000);
          break;
        case 'megaLaser':
          player.data.weaponMode = 'mega';
          setTimeout(function() {
            player.data.weaponMode = 'single';
          }, duration * 1000);
          break;
        case 'slowMo':
          var originalDt = scene.scaledDt || 1;
          scene.scaledDt = 0.5;
          setTimeout(function() {
            scene.scaledDt = originalDt;
          }, duration * 1000);
          break;
        case 'invincible':
          player.data.invincible = true;
          setTimeout(function() {
            player.data.invincible = false;
          }, duration * 1000);
          break;
        case 'smartBomb':
          // Kill all aliens and boss minions
          var aliens = scene.world.byTag('alien');
          var minions = scene.world.byTag('bossMinion');
          var shots = scene.world.byTag('enemyShot');
          for (var i = 0; i < aliens.length; i++) {
            aliens[i].destroy();
          }
          for (var j = 0; j < minions.length; j++) {
            minions[j].destroy();
          }
          for (var k = 0; k < shots.length; k++) {
            shots[k].destroy();
          }
          // Explosion effect
          var particles = GF.game.particles;
          if (particles) {
            particles.burst(player.x + player.w / 2, player.y, {
              count: 50,
              colors: ['#ffcc00', '#ff6600', '#ffffff'],
              speed: [100, 300],
              life: [0.5, 1.5],
              size: [4, 10]
            });
          }
          break;
        case 'extraLife':
          if (player.data.lives !== undefined) {
            player.data.lives++;
          }
          break;
      }
    }
  });
})(window.GF);
