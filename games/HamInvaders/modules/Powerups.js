// modules/Powerups.js — drops pickups where invaders die.
//
// Listens for the 'invader:killed' event rather than hooking the collision, so
// anything that can kill an invader (a shot, a smart bomb, a future explosion)
// gets drops without this module knowing about it. Collecting a pickup is
// handled by the player→powerup rule in modules/Combat.js.
(function (GF, G) {
  'use strict';

  GF.sceneModule('Powerups', {
    scene: 'Main',
    phases: ['play'],

    init(scene, engine) {
      scene.events.on('invader:killed', (hit) => this.maybeDrop(scene, hit));
    },

    enter(scene) { this.cooldown = 0; },

    update(dt) { this.cooldown = Math.max(0, this.cooldown - dt); },

    maybeDrop(scene, hit) {
      if (scene.phase !== 'play' || this.cooldown > 0) return;

      const cfg = (GF.GAME_CONFIG && GF.GAME_CONFIG.powerups) || {};
      if (Math.random() >= (cfg.dropChance != null ? cfg.dropChance : 0.15)) return;

      const types = cfg.types && cfg.types.length ? cfg.types : Object.keys(G.powerupTypes);
      const type = types[Math.floor(Math.random() * types.length)];

      const pickup = scene.world.spawn('powerup', hit.x - 12, hit.y - 12);
      if (!pickup) return;
      pickup.data.type = type;
      pickup.sprite = 'powerup_' + type;
      if (scene.world.sprites) pickup._anim = scene.world.sprites.createAnimator(pickup.sprite, 'idle');

      this.cooldown = cfg.cooldown != null ? cfg.cooldown : 5;
    },
  });

})(window.GF, window.GAME = window.GAME || {});
