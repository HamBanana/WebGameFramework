// modules/Waves.js — populates the field and decides when a wave is beaten.
//
// Runs late (order 10) so the win check sees the result of this frame's
// collisions rather than last frame's.
(function (GF) {
  'use strict';

  GF.sceneModule('Waves', {
    scene: 'Main',
    order: 10,
    state: { score: 0, level: 1, won: false },

    enter(scene, engine) {
      scene.world.clear();
      this.spawnWave(scene, engine, 1);
    },

    /** Player + invader grid for `level`. Later waves are faster and deeper. */
    spawnWave(scene, engine, level) {
      const cfg = scene.config;
      const W = engine.config.width;
      const H = engine.config.height;

      scene.state.level = level;
      scene.world.data.dir = 1;
      scene.world.data.speed = (cfg.invaderSpeed || 60) + (level - 1) * (cfg.speedPerLevel || 20);

      scene.world.spawn('player', W / 2 - 20, H - 50);

      const cols = cfg.cols || 8;
      const rows = Math.min((cfg.rows || 5) + level - 1, cfg.maxRows || 6);
      const dx = cfg.spacingX || 56;
      const dy = cfg.spacingY || 40;
      const x0 = (W - cols * dx) / 2 + 12;
      const y0 = cfg.startY || 50;

      const ripple = cfg.bobRipple != null ? cfg.bobRipple : 0.5;

      scene.world.spawnGrid('invader', cols, rows, x0, y0, dx, dy, (inv, c, r) => {
        const tier = r % 3;
        inv.data.tier = tier;
        inv.data.row = r;          // stable row id — smartBomb targets by this
        inv.sprite = 'invader' + tier;
        inv._anim = scene.world.sprites
          ? scene.world.sprites.createAnimator(inv.sprite, 'idle') : null;

        // Bob's onAdd has already run, so overwriting its random phase here is
        // what turns 40 separate wobbles into a diagonal wave across the block.
        // bobRipple: 0 makes the whole formation bob in lockstep.
        inv.data.bobT = (c + r) * ripple;
      });
    },

    update(dt, scene, engine) {
      if (scene.world.count('invader') > 0) return;

      const last = scene.config.levels || 1;
      if (scene.state.level >= last) {
        scene.state.won = true;
        scene.setPhase('over');
      } else {
        scene.world.clear();
        this.spawnWave(scene, engine, scene.state.level + 1);
      }
    },
  });

})(window.GF);
