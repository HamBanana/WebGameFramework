// modules/Boss.js — the boss fight's own rules.
//
// Attaches to the 'Boss' scene only. Everything else the fight needs (firing,
// the player's shots, the HUD, the game-over screen) comes from Main's modules,
// which the level document borrows with:
//
//   "modules": { "from": "Main", "exclude": ["Waves", "Formation", "Ufo"] }
//
// Waves and Formation are excluded because the level file places the entities
// itself — that is the whole point of authoring it in the editor. Nothing in
// Main had to change for this scene to exist.
(function (GF) {
  'use strict';

  GF.sceneModule('Boss', {
    scene: 'Boss',
    order: 5,        // after the world's collision pass, so the win check is current
    layer: 100,      // health bar sits with the HUD
    phases: ['play'],
    state: { won: false, bossMax: 0 },

    init(scene, engine) {
      // The boss is not tagged 'invader', so Combat's one-hit rule never
      // touches it; damage is this module's job.
      scene.world.onOverlap('shot', 'boss', (shot, boss) => {
        shot.destroy();

        if (boss.data.shielded) {
          this.spark = 0.12;                 // brief feedback, no damage
          return;
        }

        boss.data.hp -= (shot.data.damage || 1);
        this.hit = 0.08;

        if (boss.data.hp <= 0) {
          boss.destroy();
          scene.state.score += boss.data.score || 1000;
          scene.events.emit('invader:killed',
            { x: boss.centerX, y: boss.centerY, tier: 0 });
        }
      });
    },

    enter(scene) {
      // The level file owns the boss's HP, so read the max from what it placed
      // rather than hard-coding it here.
      const boss = scene.world.first('boss');
      scene.state.bossMax = boss ? (boss.data.maxHp || boss.data.hp || 1) : 0;
      this.hit = 0;
      this.spark = 0;

      // Arriving from the waves (modules/BossWave.js) carries the run's lives
      // over, so the finale is fought with what is left rather than a fresh
      // three. Playing the level directly leaves the prefab default alone.
      const player = scene.world.first('player');
      if (player && typeof scene.state.carryLives === 'number') {
        player.data.lives = scene.state.carryLives;
      }

      // Brief arrival banner. Done here rather than as a transition on the wave
      // scene because Main's game-over screen owns that phase and would draw
      // over it.
      this.intro = scene.state.fromWaves ? 2.2 : 0;
    },

    update(dt, scene, engine) {
      this.hit = Math.max(0, (this.hit || 0) - dt);
      this.spark = Math.max(0, (this.spark || 0) - dt);
      this.intro = Math.max(0, (this.intro || 0) - dt);

      // Win the moment the field is clear of the boss. Checked after the world
      // update so the killing blow ends the fight on the same frame.
      if (scene.state.bossMax && !scene.world.first('boss')) {
        scene.state.won = true;
        scene.setPhase('over');
      }
    },

    render(ctx, scene, engine) {
      const boss = scene.world.first('boss');
      if (!boss) return;

      const W = engine.config.width;
      const max = scene.state.bossMax || 1;
      const frac = Math.max(0, boss.data.hp / max);

      const barW = Math.min(520, W - 160);
      const x = (W - barW) / 2;
      const y = 74;

      GF.UISystem.drawText(ctx, 'MOTHERSHIP', W / 2, y - 20,
        { align: 'center', font: '16px monospace', color: '#c39bd3' });

      ctx.fillStyle = '#2e1437';
      ctx.fillRect(x - 2, y - 2, barW + 4, 16);

      // Red at a sliver, amber at half, purple while healthy.
      ctx.fillStyle = this.hit > 0 ? '#fff'
                    : frac > 0.5 ? '#8e44ad'
                    : frac > 0.2 ? '#e67e22' : '#e74c3c';
      ctx.fillRect(x, y, barW * frac, 12);

      ctx.strokeStyle = '#5b2c6f';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 2.5, y - 2.5, barW + 5, 17);

      if (boss.data.shielded) {
        const drones = scene.world.count('bossDrone');
        GF.UISystem.drawText(ctx,
          'SHIELDED — destroy the ' + drones + ' drone' + (drones === 1 ? '' : 's'),
          W / 2, y + 20,
          { align: 'center', font: '14px monospace',
            color: this.spark > 0 ? '#fff' : '#5dade2' });
      }

      if (this.intro > 0) {
        const H = engine.config.height;
        // Blink, then fade out over the last half second.
        const blink = Math.sin(this.intro * 12) > -0.3;
        ctx.save();
        ctx.globalAlpha = Math.min(1, this.intro / 0.5);
        GF.UISystem.drawText(ctx, 'ALL INVADERS DESTROYED', W / 2, H / 2 - 24,
          { align: 'center', font: '26px monospace', color: '#2ecc71' });
        if (blink) {
          GF.UISystem.drawText(ctx, '⚠ MOTHERSHIP INBOUND ⚠', W / 2, H / 2 + 16,
            { align: 'center', font: '30px monospace', color: '#e74c3c' });
        }
        ctx.restore();
      }
    },
  });

})(window.GF);
