// modules/Powerups.js — drop pickups on alien kill.
(function (GF) {
  'use strict';
  GF.sceneModule('Powerups', {
    scene: 'Main',
    phases: ['play'],

    init(scene, engine) {
      scene.events.on('alien:killed', (hit) => this.maybeDrop(scene, hit));
    },

    enter(scene) { this.cooldown = 0; },

    update(dt, scene) {
      this.cooldown = Math.max(0, this.cooldown - dt);
    },

    maybeDrop(scene, hit) {
      if (scene.phase !== 'play' || this.cooldown > 0) return;
      var cfg = (GF.GAME_CONFIG && GF.GAME_CONFIG.powerups) || {};
      if (Math.random() >= (cfg.dropChance != null ? cfg.dropChance : 0.12)) return;

      var types = cfg.types || [];
      if (!types.length) return;
      var weights = types.map(function (t) { return t.weight || 1; });
      var totalWeight = weights.reduce(function (a, b) { return a + b; }, 0);
      var r = Math.random() * totalWeight;
      var selected = types[0];
      for (var i = 0; i < types.length; i++) {
        r -= weights[i];
        if (r <= 0) { selected = types[i]; break; }
      }

      var pickup = scene.world.spawn('powerup', hit.x - 10, hit.y - 10);
      if (!pickup) return;
      pickup.data.type = selected.type;
      pickup.sprite = selected.sprite;
      if (scene.world.sprites) {
        pickup._anim = scene.world.sprites.createAnimator(pickup.sprite, 'idle');
      }
      this.cooldown = cfg.cooldown != null ? cfg.cooldown : 5;
    },
  });
})(window.GF);
