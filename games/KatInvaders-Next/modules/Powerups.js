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
  });
})(window.GF);
