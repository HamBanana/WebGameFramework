// modules/DebugTools.js — register game-specific debug commands with the framework.
//
// Commands appear in the ⚙ DEBUG TOOLS panel (F6) under "Game: Main".
// Each command receives { scene, engine, world, state } as context.
//
// Toggle: 🔧 (F1) = physics overlay / ⚙ (F6) = this command panel

(function (GF) {
  'use strict';

  GF.sceneModule('DebugTools', {
    scene: '*',
    order: -100,
    phases: ['*', 'over'],

    enter: function (scene, engine) {
      var world = scene.world;
      var cfg = (GF.GAME_CONFIG && GF.GAME_CONFIG) || {};

      // ── Level control ───────────────────────────────────────────────────
      GF.DebugTools.registerCommands('Main', [
        // Level progression
        { label: '▶ Next Level', fn: function (ctx) {
          if (ctx.scene && ctx.engine) {
            ctx.scene.state.level++;
            ctx.scene.world.clear();
            var waves = ctx.scene.module('Waves');
            if (waves) waves.spawnWave(ctx.scene, ctx.engine);
          }
        }},
        { label: '▶ Set Level N', fn: function (ctx) {
          if (ctx.scene) ctx.scene.state.level = ctx.scene.state.level + 1;
        }},
        { label: '▶ Skip to Boss', fn: function (ctx) {
          if (ctx.scene) ctx.scene.setPhase('boss');
        }},
        { label: '▶ Instant Boss', fn: function (ctx) {
          if (!ctx.scene || !ctx.engine) return;
          ctx.scene.setPhase('boss');
          if (ctx.scene.world) ctx.scene.world.clear();
          var bossMod = ctx.scene.module('Boss');
          if (bossMod && bossMod.spawnBoss) {
            bossMod.state = 'fight';
            bossMod.timer = 0;
            bossMod.spawnBoss(ctx.scene, ctx.engine);
          } else {
            // Fallback: spawn boss directly
            if (ctx.scene.world) {
              var bossCfg = (GF.GAME_CONFIG && GF.GAME_CONFIG.boss) || {};
              var boss = ctx.scene.world.spawn('boss', 192, 50);
              if (boss) {
                boss.data.hp = bossCfg.hp || 100;
                boss.data.maxHp = boss.data.hp;
                boss.data.fireRate = bossCfg.fireRate || 0.035;
                boss.data.speed = bossCfg.speed || 60;
                boss.data.behavior = 'patrol';
              }
            }
          }
        }},
        { label: '▶ Level 1', fn: function (ctx) {
          if (ctx.scene) {
            ctx.scene.state.level = 1;
            if (ctx.scene.world) ctx.scene.world.clear();
            var waves = ctx.scene.module('Waves');
            if (waves) waves.spawnWave(ctx.scene, ctx.engine);
          }
        }},

        // ── Player cheats ─────────────────────────────────────────────────
        { label: '♡ God Mode', fn: function (ctx) {
          if (ctx.world) {
            var p = ctx.world.first('player');
            if (p) { p.data.invincible = true; p.data.lives = 99; }
          }
        }},
        { label: '♡ Clear God Mode', fn: function (ctx) {
          if (ctx.world) {
            var p = ctx.world.first('player');
            if (p) p.data.invincible = false;
          }
        }},
        { label: '♡ Max Lives (99)', fn: function (ctx) {
          if (ctx.world) {
            var p = ctx.world.first('player');
            if (p) p.data.lives = 99;
          }
        }},
        { label: '♡ Shield Active', fn: function (ctx) {
          if (ctx.world) {
            var p = ctx.world.first('player');
            if (p) { p.data.shield = true; p.data.powerups.shield = 999; }
          }
        }},
        { label: '♡ Remove Shield', fn: function (ctx) {
          if (ctx.world) {
            var p = ctx.world.first('player');
            if (p) { p.data.shield = false; p.data.powerups.shield = 0; }
          }
        }},
        { label: '♡ MegaLaser Active', fn: function (ctx) {
          if (ctx.world) {
            var p = ctx.world.first('player');
            if (p) p.data.weaponMode = 'mega';
          }
        }},
        { label: '♡ Invincible 30s', fn: function (ctx) {
          if (ctx.world) {
            var p = ctx.world.first('player');
            if (p) { p.data.invincible = true; p.data.invincibleTimer = 30; }
          }
        }},

        // ── Score ─────────────────────────────────────────────────────────
        { label: '+ Score 10K', fn: function (ctx) {
          if (ctx.state) ctx.state.score += 10000;
        }},
        { label: '+ Score 100K', fn: function (ctx) {
          if (ctx.state) ctx.state.score += 100000;
        }},
        { label: 'Set Score 0', fn: function (ctx) {
          if (ctx.state) ctx.state.score = 0;
        }},
        { label: 'Reset Combo', fn: function (ctx) {
          if (ctx.state) { ctx.state.combo = 0; ctx.state.comboMultiplier = 1; ctx.state.comboTimer = 0; }
        }},
        { label: 'Max Combo x6', fn: function (ctx) {
          if (ctx.state) { ctx.state.combo = 50; ctx.state.comboMultiplier = 6; }
        }},

        // ── Spawn entities ────────────────────────────────────────────────
        { label: '🛸 Spawn UFO', fn: function (ctx) {
          if (ctx.world) ctx.world.spawn('ufo', 0, 50);
        }},
        { label: '👾 Spawn Boss', fn: function (ctx) {
          if (!ctx.scene || !ctx.engine) return;
          ctx.scene.setPhase('boss');
          var bossMod = ctx.scene.module('Boss');
          if (bossMod && bossMod.spawnBoss) {
            bossMod.spawnBoss(ctx.scene, ctx.engine);
            bossMod.state = 'fight';
          } else {
            // Fallback: spawn boss directly (Boss module may not be registered for this scene)
            if (ctx.world && ctx.scene.world) {
              var bossCfg = (GF.GAME_CONFIG && GF.GAME_CONFIG.boss) || {};
              var boss = ctx.scene.world.spawn('boss', 192, 50);
              if (boss) {
                boss.data.hp = bossCfg.hp || 100;
                boss.data.maxHp = boss.data.hp;
                boss.data.fireRate = bossCfg.fireRate || 0.035;
                boss.data.speed = bossCfg.speed || 60;
                boss.data.behavior = 'patrol';
              }
            }
          }
        }},
        { label: '🔥 Spawn All Boss Types', fn: function (ctx) {
          if (!ctx.world) return;
          var bossCfg = cfg.boss || {};
          var types = bossCfg.bossTypes || [];
          for (var i = 0; i < types.length && i < 3; i++) {
            var t = types[i];
            if (t.prefab) {
              var b = ctx.world.spawn(t.prefab, 50 + i * 140, 50);
              if (b) { b.data.hp = t.hp || 100; b.data.maxHp = b.data.hp; }
            }
          }
        }},
        { label: '💥 Spawn RapidFire Powerup', fn: function (ctx) {
          if (!ctx.world) return;
          var p = ctx.world.first('player');
          if (!p) return;
          var pu = ctx.world.spawn('powerup', p.x - 20, p.y - 40);
          if (pu) { pu.data.type = 'rapidFire'; pu.sprite = 'powerupRapidFire'; }
        }},
        { label: '💥 Spawn Shield Powerup', fn: function (ctx) {
          if (!ctx.world) return;
          var p = ctx.world.first('player');
          if (!p) return;
          var pu = ctx.world.spawn('powerup', p.x - 20, p.y - 40);
          if (pu) { pu.data.type = 'shield'; pu.sprite = 'powerupShield'; }
        }},
        { label: '💥 Spawn SmartBomb Powerup', fn: function (ctx) {
          if (!ctx.world) return;
          var p = ctx.world.first('player');
          if (!p) return;
          var pu = ctx.world.spawn('powerup', p.x - 20, p.y - 40);
          if (pu) { pu.data.type = 'smartBomb'; pu.sprite = 'powerupSmartBomb'; }
        }},
        { label: '💥 Spawn ExtraLife Powerup', fn: function (ctx) {
          if (!ctx.world) return;
          var p = ctx.world.first('player');
          if (!p) return;
          var pu = ctx.world.spawn('powerup', p.x - 20, p.y - 40);
          if (pu) { pu.data.type = 'extraLife'; pu.sprite = 'powerupExtraLife'; }
        }},

        // ── Combat ────────────────────────────────────────────────────────
        { label: '💣 Smart Bomb All', fn: function (ctx) {
          if (ctx.scene) {
            var combat = ctx.scene.module('Combat');
            if (combat) combat.detonate(ctx.scene);
          }
        }},
        { label: '💣 Kill All Aliens', fn: function (ctx) {
          if (ctx.world) ctx.world.byTag('alien').forEach(function (e) { e.destroy(); });
        }},
        { label: '💣 Kill All Projectiles', fn: function (ctx) {
          if (ctx.world) {
            ctx.world.byTag('shot').forEach(function (e) { e.destroy(); });
            ctx.world.byTag('alienShot').forEach(function (e) { e.destroy(); });
            ctx.world.byTag('bossShot').forEach(function (e) { e.destroy(); });
          }
        }},
        { label: '💣 Kill All Bosses', fn: function (ctx) {
          if (ctx.world) {
            ctx.world.byTag('boss').forEach(function (e) { e.destroy(); });
            ctx.world.byTag('bossMinion').forEach(function (e) { e.destroy(); });
          }
        }},

        // ── Reset ─────────────────────────────────────────────────────────
        { label: '⟲ Restart Level', fn: function (ctx) {
          if (ctx.scene && ctx.engine) {
            var mgr = ctx.scene._manager();
            if (mgr) mgr.replace(ctx.scene.sceneName, ctx.engine);
          }
        }},
        { label: '⟲ Restart Game', fn: function (ctx) {
          if (ctx.scene && ctx.engine) {
            var title = GF.TitleScene ? GF.TitleScene() : null;
            if (title) {
              var mgr = ctx.scene._manager();
              if (mgr) mgr.replace(title, ctx.engine);
            }
          }
        }},
      ]);

      // Register for Boss phase too
      GF.DebugTools.registerCommands('Boss', [
        { label: '♡ God Mode', fn: function (ctx) {
          if (ctx.world) { var p = ctx.world.first('player'); if (p) p.data.invincible = true; }
        }},
        { label: '♡ Max Lives', fn: function (ctx) {
          if (ctx.world) { var p = ctx.world.first('player'); if (p) p.data.lives = 99; }
        }},
        { label: '💣 Kill Boss', fn: function (ctx) {
          if (ctx.world) {
            var b = ctx.world.first('boss');
            if (b) { ctx.world.byTag('boss').forEach(function (e) { e.destroy(); }); }
          }
        }},
        { label: '💣 Kill Minions', fn: function (ctx) {
          if (ctx.world) ctx.world.byTag('bossMinion').forEach(function (e) { e.destroy(); });
        }},
        { label: '⟲ Restart Boss', fn: function (ctx) {
          if (ctx.scene && ctx.engine) {
            var mgr = ctx.scene._manager();
            if (mgr) mgr.replace(ctx.scene.sceneName, ctx.engine);
          }
        }},
      ]);
    },
  });
})(window.GF);
