// modules/Combat.js — firing, hits, scoring and the lose conditions.
//
// The overlap rules are declared once in init and then run by the world every
// frame. Adding an interaction is one more onOverlap line, not another nested
// loop in a scene.
(function (GF, G) {
  'use strict';

  GF.sceneModule('Combat', {
    scene: 'Main',
    order: -5,
    phases: ['play'],

    init(scene, engine) {
      const world = scene.world;

      // shot → invader
      world.onOverlap('shot', 'invader', (shot, inv) => {
        shot.destroy();
        inv.destroy();
        this.award(scene, (3 - inv.data.tier) * 10);
        scene.events.emit('invader:killed', { x: inv.centerX, y: inv.centerY, tier: inv.data.tier });
      });

      // shot → ufo
      world.onOverlap('shot', 'ufo', (shot, ufo) => {
        shot.destroy();
        ufo.destroy();
        this.award(scene, scene.config.ufoScore || 100);
      });

      // invader shot → player
      world.onOverlap('invaderShot', 'player', (shot, player) => {
        shot.destroy();
        if (player.data.hasPowerup('invincible')) return;   // untouchable, no bonus
        if (player.data.hasPowerup('shield')) this.award(scene, 10);
        else this.hurt(scene, player);
      });

      // invader → player (a collision, not a shot). Only reachable while
      // invincible: otherwise the row check below ends the run a frame first.
      world.onOverlap('invader', 'player', (inv, player) => {
        inv.destroy();
        if (player.data.hasPowerup('invincible')) this.award(scene, 50);
        else this.hurt(scene, player);
      });

      // player → powerup
      world.onOverlap('player', 'powerup', (player, pickup) => {
        pickup.destroy();
        player.data.addPowerup(pickup.data.type);
      });
    },

    award(scene, points) { scene.state.score += points; },

    /** Take a life; drop to the game-over phase when they run out. */
    hurt(scene, player) {
      player.data.lives--;
      if (player.data.lives <= 0) {
        scene.state.won = false;
        scene.setPhase('over');
      }
    },

    update(dt, scene, engine) {
      this.reload = Math.max(0, (this.reload || 0) - dt);

      const player = scene.world.first('player');
      if (!player) return;

      if (engine.input.wasPressed('fire')) this.shoot(scene, player);

      // Smart bomb: each pickup queues exactly one detonation.
      while (player.data.bombPending > 0) {
        player.data.bombPending--;
        this.detonate(scene);
      }

      // Invaders reaching the player's row ends the run outright — unless the
      // player is invincible. Suppressing it here is what makes the
      // invader→player rule above reachable at all: the descending block gets
      // vaporised on contact instead of ending the game.
      if (!player.data.hasPowerup('invincible')) {
        for (const inv of scene.world.byTag('invader')) {
          if (inv.bottom >= player.y) {
            scene.state.won = false;
            scene.setPhase('over');
            break;
          }
        }
      }
    },

    /**
     * Wipe the lowest occupied rows — the invaders closest to the player, i.e.
     * the ones actually threatening. Rows are matched by their spawn index, not
     * by y, because Bob wobbles y per-invader and would smear the buckets.
     * Kills go through the normal event so bombed invaders can drop too.
     */
    detonate(scene) {
      const live = scene.world.byTag('invader');
      if (!live.length) return;

      const wanted = scene.config.smartBombRows || 2;
      const occupied = [...new Set(live.map(i => i.data.row))].sort((a, b) => b - a);
      const doomed = new Set(occupied.slice(0, wanted));

      for (const inv of live) {
        if (!doomed.has(inv.data.row)) continue;
        inv.destroy();
        this.award(scene, (3 - inv.data.tier) * 10);
        scene.events.emit('invader:killed', { x: inv.centerX, y: inv.centerY, tier: inv.data.tier });
      }
    },

    /** One shot from the muzzle, plus whatever the held powerups add. */
    shoot(scene, player) {
      if (this.reload > 0) return;
      this.reload = scene.config.fireCooldown || 0.3;

      const mx = player.centerX;
      const my = player.y - 12;
      const speed = -(scene.config.shotSpeed || 400);

      const shots = [{ dx: 0, dy: 0 }];
      for (const type in G.weaponPatterns) {
        if (player.data.hasPowerup(type)) shots.push(...G.weaponPatterns[type]);
      }

      for (const s of shots) {
        const shot = scene.world.spawn('shot', 0, my + (s.dy || 0));
        if (!shot) continue;
        shot.x = mx + (s.dx || 0) - shot.w / 2;
        shot.vy = speed;
        if (s.kind) {
          shot.sprite = 'shot' + s.kind.charAt(0).toUpperCase() + s.kind.slice(1);
          shot.data.kind = s.kind;
          if (scene.world.sprites) shot._anim = scene.world.sprites.createAnimator(shot.sprite, 'idle');
        }
      }
    },
  });

})(window.GF, window.GAME = window.GAME || {});
