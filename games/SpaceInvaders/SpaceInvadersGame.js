// GameFramework/games/SpaceInvaders/SpaceInvadersGame.js
// Showcases: Engine, SpriteSystem, PhysicsSystem, UISystem, ParticleSystem,
//            TweenSystem (transitions, tweens, chains), AudioSystem,
//            SceneManager, EventBus, InputManager, MathUtils
// Features: 6 powerups (rapidFire / doubleShot / shield / smartBomb /
//           megaLaser / extraLife), boss fights every 3rd level, combo
//           multiplier, screen shake, parallax nebula, zoom-in on level
//           clear, iris scene transition between levels.

(function (GF) {
  'use strict';

  const CFG = () => GF.GAME_CONFIG;

  // ── Audio helpers (procedural synthesis) ─────────────────────────────────

  function makeToneBuffer(audioCtx, freq, duration, type, env) {
    const sr     = audioCtx.sampleRate;
    const len    = Math.floor(sr * duration);
    const buffer = audioCtx.createBuffer(1, len, sr);
    const data   = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      let sample = 0;
      if (type === 'square') {
        sample = Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1;
      } else if (type === 'noise') {
        sample = Math.random() * 2 - 1;
      } else if (type === 'sweep') {
        const f = freq + (env.sweep || 0) * t;
        sample = Math.sin(2 * Math.PI * f * t);
      } else {
        sample = Math.sin(2 * Math.PI * freq * t);
      }
      const attack  = env.attack  || 0.01;
      const release = env.release || duration;
      let amp = 1;
      if (t < attack) amp = t / attack;
      else amp = Math.max(0, 1 - (t - attack) / (release - attack));
      data[i] = sample * amp * (env.volume || 0.3);
    }
    return buffer;
  }

  function setupAudio(audio) {
    audio._ensureContext();
    const ctx = audio._ctx;
    if (!ctx) return;

    audio.register('shoot',       makeToneBuffer(ctx, 880, 0.12, 'square', { attack: 0.005, release: 0.12, volume: 0.2  }));
    audio.register('alienDie',    makeToneBuffer(ctx, 300, 0.20, 'sweep',  { attack: 0.005, release: 0.20, sweep: -400, volume: 0.3  }));
    audio.register('playerDie',   makeToneBuffer(ctx, 150, 0.50, 'noise',  { attack: 0.01,  release: 0.50, volume: 0.35 }));
    audio.register('ufoAppear',   makeToneBuffer(ctx, 440, 0.60, 'sweep',  { attack: 0.05,  release: 0.60, sweep: 220,  volume: 0.25 }));
    audio.register('levelUp',     makeToneBuffer(ctx, 550, 0.40, 'square', { attack: 0.01,  release: 0.40, volume: 0.25 }));
    audio.register('extraLife',   makeToneBuffer(ctx, 660, 0.45, 'square', { attack: 0.01,  release: 0.45, volume: 0.3  }));
    audio.register('bunkerHit',   makeToneBuffer(ctx, 200, 0.10, 'square', { attack: 0.005, release: 0.10, volume: 0.15 }));
    audio.register('powerup',     makeToneBuffer(ctx, 750, 0.28, 'sweep',  { attack: 0.01,  release: 0.28, sweep: 320,  volume: 0.3  }));
    audio.register('shieldBlock', makeToneBuffer(ctx, 380, 0.20, 'square', { attack: 0.005, release: 0.20, volume: 0.25 }));
    audio.register('march0',      makeToneBuffer(ctx, 160, 0.08, 'square', { attack: 0.005, release: 0.08, volume: 0.2  }));
    audio.register('march1',      makeToneBuffer(ctx, 130, 0.08, 'square', { attack: 0.005, release: 0.08, volume: 0.2  }));
    audio.register('march2',      makeToneBuffer(ctx, 100, 0.08, 'square', { attack: 0.005, release: 0.08, volume: 0.2  }));
    audio.register('march3',      makeToneBuffer(ctx, 80,  0.08, 'square', { attack: 0.005, release: 0.08, volume: 0.2  }));

    // New sounds
    audio.register('smartBomb',   makeToneBuffer(ctx, 80,  0.55, 'sweep',  { attack: 0.01,  release: 0.55, sweep: 1400, volume: 0.4  }));
    audio.register('megaLaser',   makeToneBuffer(ctx, 220, 0.18, 'sweep',  { attack: 0.005, release: 0.18, sweep: 600,  volume: 0.3  }));
    audio.register('combo',       makeToneBuffer(ctx, 700, 0.18, 'square', { attack: 0.005, release: 0.18, volume: 0.25 }));
    audio.register('bossHit',     makeToneBuffer(ctx, 240, 0.15, 'square', { attack: 0.005, release: 0.15, volume: 0.3  }));
    audio.register('bossDie',     makeToneBuffer(ctx, 80,  1.20, 'sweep',  { attack: 0.02,  release: 1.20, sweep: -60,  volume: 0.5  }));
    audio.register('bossAlert',   makeToneBuffer(ctx, 110, 0.80, 'sweep',  { attack: 0.05,  release: 0.80, sweep: 80,   volume: 0.35 }));
    audio.register('minionDie',   makeToneBuffer(ctx, 420, 0.12, 'sweep',  { attack: 0.005, release: 0.12, sweep: -300, volume: 0.25 }));
  }

  // ── Shared game state ─────────────────────────────────────────────────────

  const State = {
    score     : 0,
    hiScore   : 0,
    lives     : 3,
    level     : 1,
    extraGiven: false,
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  function isBossLevel(level) {
    const n = CFG().boss?.everyNLevels || 3;
    return level % n === 0;
  }

  function pickWeightedPowerup() {
    const types = CFG().powerups.types;
    const total = types.reduce((s, t) => s + (t.weight || 1), 0);
    let pick = Math.random() * total;
    for (const t of types) {
      pick -= (t.weight || 1);
      if (pick <= 0) return t;
    }
    return types[types.length - 1];
  }

  // ── TitleScene ────────────────────────────────────────────────────────────

  class TitleScene extends GF.Scene {
    init(engine) {
      this._t = 0;
      this._alpha = { v: 0 };
      engine.getSystem('TweenSystem').create(this._alpha, { v: 1 }, 1.0, { ease: 'outCubic' });
      this._pulse = { v: 1 };
      engine.getSystem('TweenSystem').create(
        this._pulse, { v: 0.2 }, 0.7,
        { ease: 'inOutSine', loop: true, yoyo: true }
      );
      engine.input.bind('fire', ...CFG().controls.fire);
    }

    update(dt, engine) {
      this._t += dt;
      if (engine.input.wasPressed('fire')) {
        State.score      = 0;
        State.lives      = CFG().player.lives;
        State.level      = 1;
        State.extraGiven = false;
        engine.getSystem('SceneManager').replace(new GameScene(), engine);
      }
    }

    render(ctx, engine) {
      const W  = engine.config.width;
      const H  = engine.config.height;
      const ui = GF.UISystem;

      // Scrolling starfield with parallax tint
      ctx.save();
      for (let i = 0; i < 120; i++) {
        const sx = GF.Math.wrap(i * 97.3, 0, W);
        const sy = GF.Math.wrap(i * 61.7 + this._t * (10 + i % 30), 0, H);
        const sz = (i % 3) + 1;
        ctx.globalAlpha = 0.3 + 0.6 * (sz / 3);
        ctx.fillStyle = i % 7 === 0 ? '#ff88ff' : (i % 5 === 0 ? '#88ddff' : '#ffffff');
        ctx.fillRect(sx, sy, sz, sz);
      }
      ctx.restore();

      // Soft nebula bands
      ctx.save();
      ctx.globalAlpha = 0.18;
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#220044');
      grad.addColorStop(0.5, '#000022');
      grad.addColorStop(1, '#001a33');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = this._alpha.v;

      // Title panel
      ui.drawPanel(ctx, W/2 - 200, 70, 400, 80, {
        bgColor: 'rgba(0,20,40,0.85)', borderColor: '#00e5ff', borderWidth: 2, radius: 8,
      });
      ui.drawText(ctx, 'SPACE INVADERS', W/2, 100, {
        font: 'bold 36px monospace', color: '#00e5ff',
        align: 'center', baseline: 'middle', glow: '#00e5ff', glowBlur: 18,
      });
      ui.drawText(ctx, 'BOSS EDITION', W/2, 130, {
        font: 'bold 14px monospace', color: '#ff66cc',
        align: 'center', baseline: 'middle', glow: '#ff44aa', glowBlur: 8,
      });

      // Hi-score
      ui.drawText(ctx, `HI-SCORE  ${State.hiScore}`, W/2, 165, {
        font: '16px monospace', color: '#ffcc00', align: 'center', baseline: 'middle',
      });

      // Alien score guide
      const alienTypes = [
        { sprite: 'alienSquid',   pts: '= 30 PTS' },
        { sprite: 'alienCrab',    pts: '= 20 PTS' },
        { sprite: 'alienOctopus', pts: '= 10 PTS' },
        { sprite: 'alienUFO',     pts: '= ??? PTS' },
      ];
      alienTypes.forEach((t, i) => {
        const sy = 195 + i * 30;
        engine.getSystem('SpriteSystem').drawFrame(ctx, t.sprite, 'idle', 0, W/2 - 60, sy + 12, false);
        ui.drawText(ctx, t.pts, W/2 - 28, sy + 4, { font: '14px monospace', color: '#ffffff' });
      });

      // Powerup legend (two rows of 3)
      ui.drawPanel(ctx, W/2 - 220, 320, 440, 84, {
        bgColor: 'rgba(0,10,30,0.75)', borderColor: '#444', radius: 4,
      });
      ui.drawText(ctx, 'POWERUPS', W/2, 332, {
        font: '11px monospace', color: '#888', align: 'center', baseline: 'middle',
      });
      const puTypes = [
        { sprite: 'powerupRapidFire',  label: '3× FIRE' },
        { sprite: 'powerupDoubleShot', label: 'TWIN' },
        { sprite: 'powerupShield',     label: 'SHIELD' },
        { sprite: 'powerupSmartBomb',  label: 'BOMB' },
        { sprite: 'powerupMegaLaser',  label: 'MEGA' },
        { sprite: 'powerupExtraLife',  label: '1-UP' },
      ];
      puTypes.forEach((pt, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const px  = W/2 - 145 + col * 145;
        const py  = 358 + row * 22;
        engine.getSystem('SpriteSystem').drawFrame(ctx, pt.sprite, 'idle', 0, px, py + 6, false);
        ui.drawText(ctx, pt.label, px + 14, py + 3, {
          font: '10px monospace', color: '#aaa', baseline: 'middle',
        });
      });

      // Boss warning text
      ui.drawText(ctx, 'WARNING: BOSS EVERY 3 LEVELS', W/2, 420, {
        font: 'bold 12px monospace', color: '#ff4488', align: 'center', baseline: 'middle',
        glow: '#ff2266', glowBlur: 6,
      });

      // Press space
      ctx.globalAlpha = this._pulse.v * this._alpha.v;
      ui.drawText(ctx, 'PRESS SPACE TO START', W/2, 460, {
        font: '16px monospace', color: '#ffffff', align: 'center', baseline: 'middle',
      });

      ctx.restore();

      ui.drawText(ctx, `FPS: ${engine.fps}`, 6, 6, { font: '11px monospace', color: '#333' });
    }
  }

  // ── GameScene ─────────────────────────────────────────────────────────────

  class GameScene extends GF.Scene {
    init(engine) {
      const cfg       = CFG();
      this._engine    = engine;
      this._physics   = engine.getSystem('PhysicsSystem');
      this._sprites   = engine.getSystem('SpriteSystem');
      this._particles = engine.getSystem('ParticleSystem');
      this._tweens    = engine.getSystem('TweenSystem');
      this._audio     = engine.getSystem('AudioSystem');
      this._scenes    = engine.getSystem('SceneManager');
      const events    = engine.events;

      try { setupAudio(this._audio); } catch(e) { /* audio unavailable */ }

      engine.input.bind('left',  ...cfg.controls.left);
      engine.input.bind('right', ...cfg.controls.right);
      engine.input.bind('fire',  ...cfg.controls.fire);
      engine.input.bind('pause', ...cfg.controls.pause);

      this._unsubs = [
        events.on('alien:killed',   d => this._onAlienKilled(d)),
        events.on('player:hit',     ()  => this._onPlayerHit()),
        events.on('level:complete', ()  => this._onLevelComplete()),
        events.on('ufo:destroyed',  d => this._onUFODestroyed(d)),
        events.on('boss:hit',       d => this._onBossHit(d)),
        events.on('boss:killed',    ()  => this._onBossKilled()),
      ];

      // Viewport state — tweened during level-complete zoom + screen shake
      this._viewport = {
        scale: 1,
        cx   : cfg.engine.width  / 2,
        cy   : cfg.engine.height / 2,
      };
      this._shake = { time: 0, magnitude: 0, x: 0, y: 0 };

      this._transition = null; // active TransitionHandle (if any)

      // Persistent background nebula state
      this._nebulaT = 0;

      this._initLevel();
    }

    _initLevel() {
      const cfg = CFG();
      const W   = cfg.engine.width;
      const H   = cfg.engine.height;

      this._paused    = false;
      this._gameOver  = false;
      this._levelDone = false;
      this._isBossLevel = isBossLevel(State.level);

      // ── Player ──
      const pc = cfg.player;
      if (!this._playerBody) {
        this._playerBody = this._physics.addBody(new GF.PhysicsBody({
          x: pc.startX - pc.hitbox.w / 2, y: pc.startY - pc.hitbox.h,
          width: pc.hitbox.w, height: pc.hitbox.h,
          gravityScale: 0, maxSpeedX: pc.speed, friction: 1, tag: 'player',
        }));
        this._playerAnim = this._sprites.createAnimator('playerShip', 'idle');
      } else {
        this._playerBody.x  = pc.startX - pc.hitbox.w / 2;
        this._playerBody.y  = pc.startY - pc.hitbox.h;
        this._playerBody.vx = 0;
        this._playerBody.vy = 0;
      }
      this._playerInvincible  = 0;
      this._playerVisible     = true;
      this._playerAlive       = true;
      this._playerVictoryGlow = false;
      this._playerAnim.play('idle', true);
      this._fireTimer      = 0;
      this._playerBullets  = [];

      // ── Powerups ──
      this._powerups       = [];
      this._activePowerups = {}; // { type: { timer, duration } }

      // ── Combo system ──
      this._comboCount = 0;
      this._comboTimer = 0;

      // ── Aliens / Boss ──
      this._aliens     = [];
      this._alienCount = 0;
      this._totalAliens = 0;
      this._minions    = [];
      this._boss       = null;
      this._bossAlertTimer = 0;
      this._bossWarningActive = false;
      this._minionSpawnTimer = 0;

      if (this._isBossLevel) {
        this._buildBoss();
      } else {
        this._buildAlienGrid();
      }

      this._alienDir       = 1;
      this._alienBullets   = [];
      this._bossBullets    = [];
      this._alienFireTimer = 0;
      this._marchStep      = 0;
      this._marchTimer     = 0;
      this._marchInterval  = 0.8;

      // ── Bunkers ──
      if (!this._bunkers || State.level === 1) {
        this._buildBunkers();
      }

      // ── UFO ──
      this._ufo      = null;
      this._ufoTimer = GF.Math.rand(...cfg.ufo.spawnInterval);
      this._ufoAnim  = this._sprites.createAnimator('alienUFO', 'idle');

      // ── HUD tween-in ──
      this._hudAlpha = { v: 0 };
      this._tweens.create(this._hudAlpha, { v: 1 }, 0.5, { ease: 'outCubic' });

      // ── Level start banner ──
      this._banner = { alpha: 1, y: 230 };
      this._tweens.create(this._banner, { alpha: 0 }, 1.8, { ease: 'inQuad', delay: 1.0 });

      // ── Boss warning banner ──
      if (this._isBossLevel) {
        this._bossWarningActive = true;
        this._bossWarning = { alpha: 0, scale: 0.5 };
        this._tweens.create(this._bossWarning, { alpha: 1, scale: 1 }, 0.4, {
          ease: 'outBack',
          onComplete: () => {
            this._tweens.create(this._bossWarning, { alpha: 0 }, 0.5, {
              ease: 'inQuad', delay: 1.4,
              onComplete: () => { this._bossWarningActive = false; },
            });
          },
        });
        try { this._audio.play('bossAlert'); } catch (e) {}
      }

      // Cleared on new level init
      this._lcBanner = null;
    }

    _buildAlienGrid() {
      const cfg   = CFG().aliens;
      const types = cfg.types;

      this._aliens     = [];
      this._alienCount = 0;

      for (let row = 0; row < cfg.rows; row++) {
        const typeDef = types.find(t => t.rows.includes(row)) || types[types.length - 1];
        for (let col = 0; col < cfg.cols; col++) {
          const x = cfg.startX + col * cfg.colSpacing;
          const y = cfg.startY + row * cfg.rowSpacing + (State.level - 1) * 8;
          this._aliens.push({
            x, y, col, row, alive: true,
            sprite  : typeDef.sprite,
            points  : typeDef.points,
            color   : typeDef.color,
            animator: this._sprites.createAnimator(typeDef.sprite, 'idle'),
          });
          this._alienCount++;
        }
      }
      this._totalAliens = this._alienCount;
    }

    _buildBoss() {
      const cfg = CFG().boss;
      const W   = CFG().engine.width;
      const bossLevel = Math.floor(State.level / cfg.everyNLevels); // 1, 2, 3...
      const maxHp = cfg.baseHealth + (bossLevel - 1) * cfg.healthPerLevel;

      this._boss = {
        x         : W / 2,
        y         : cfg.y,
        dir       : 1,
        speed     : cfg.speed + (bossLevel - 1) * 18,
        hp        : maxHp,
        maxHp     : maxHp,
        flashTime : 0,
        animator  : this._sprites.createAnimator('bossMothership', 'idle'),
        attackTimer: 1.5,
        attackPattern: 0,
        diveTime  : 0,    // > 0 = currently diving
        baseY     : cfg.y,
      };
      this._minionSpawnTimer = GF.Math.rand(...cfg.minionSpawnInterval);
    }

    _buildBunkers() {
      const cfg = CFG().bunkers;
      const W   = CFG().engine.width;
      const gap = (W - cfg.count * cfg.w) / (cfg.count + 1);
      this._bunkers = [];
      for (let i = 0; i < cfg.count; i++) {
        this._bunkers.push({
          x: gap + i * (cfg.w + gap), y: cfg.y,
          w: cfg.w, h: cfg.h, health: cfg.health,
        });
      }
    }

    enter(engine)   {}
    exit(engine)    {}

    destroy(engine) {
      this._unsubs.forEach(fn => fn());
      if (this._playerBody) this._physics.removeBody(this._playerBody);
      this._playerBullets.forEach(b => this._physics.removeBody(b.body));
      this._alienBullets.forEach(b => this._physics.removeBody(b.body));
      if (this._bossBullets) this._bossBullets.forEach(b => this._physics.removeBody(b.body));
    }

    // ── Screen shake ───────────────────────────────────────────────────────

    _addShake(magnitude, duration) {
      // Stack shakes — keep the strongest of either remaining or new
      this._shake.magnitude = Math.max(this._shake.magnitude, magnitude);
      this._shake.time      = Math.max(this._shake.time, duration);
    }

    _updateShake(dt) {
      if (this._shake.time > 0) {
        this._shake.time -= dt;
        const m = this._shake.magnitude * Math.max(0, this._shake.time / 0.4);
        this._shake.x = (Math.random() * 2 - 1) * m;
        this._shake.y = (Math.random() * 2 - 1) * m;
        if (this._shake.time <= 0) {
          this._shake.x = 0; this._shake.y = 0; this._shake.magnitude = 0;
        }
      } else {
        this._shake.x = 0; this._shake.y = 0;
      }
    }

    // ── Combo system ───────────────────────────────────────────────────────

    _addCombo() {
      const cw = CFG().combo;
      this._comboCount = Math.min(this._comboCount + 1, cw.maxMultiplier * 2);
      this._comboTimer = cw.window;
      const mult = this._comboMultiplier();
      if (mult > 1) {
        try { this._audio.play('combo'); } catch (e) {}
      }
    }

    _comboMultiplier() {
      const cw = CFG().combo;
      // Linear ramp from 1× at 1 kill to maxMultiplier× at 8+ kills
      const ramp = Math.min(1, (this._comboCount - 1) / 7);
      return Math.max(1, Math.min(cw.maxMultiplier, 1 + ramp * (cw.maxMultiplier - 1)));
    }

    _updateCombo(dt) {
      if (this._comboTimer > 0) {
        this._comboTimer -= dt;
        if (this._comboTimer <= 0) {
          this._comboCount = 0;
        }
      }
    }

    // ── Event handlers ─────────────────────────────────────────────────────

    _onAlienKilled(data) {
      const mult = this._comboMultiplier();
      const pts  = Math.round(data.points * mult);
      State.score += pts;
      this._addCombo();

      if (!State.extraGiven && State.score >= CFG().scoring.extraLifeAt) {
        State.extraGiven = true;
        State.lives++;
        this._audio.play('extraLife');
        this._showFloatingText('+1 LIFE!', CFG().engine.width / 2, 200, '#ffff00');
      }
    }

    _onPlayerHit() {
      // Shield absorbs the hit
      if (this._activePowerups.shield) {
        delete this._activePowerups.shield;
        this._audio.play('shieldBlock');
        const px = this._playerBody.x + this._playerBody.width  / 2;
        const py = this._playerBody.y + this._playerBody.height / 2;
        this._particles.burst(px, py, {
          count: 32, colors: ['#4488ff', '#88aaff', '#ffffff'],
          speed: [60, 240], life: [0.3, 0.8], size: [2, 7],
          fadeOut: true, shape: 'square',
        });
        this._showFloatingText('SHIELD BLOCKED!', px, py - 30, '#4488ff');
        this._addShake(4, 0.18);
        return;
      }

      State.lives--;
      this._comboCount = 0; // combo broken on death
      this._audio.play('playerDie');
      const px = this._playerBody.x + this._playerBody.width  / 2;
      const py = this._playerBody.y + this._playerBody.height / 2;
      this._particles.burst(px, py, {
        count: 50, colors: ['#00e5ff', '#ffffff', '#88ccff', '#ffaa00'],
        speed: [60, 280], life: [0.4, 1.2], size: [3, 9],
        gravity: 80, fadeOut: true, shrink: true, shape: 'star',
      });
      // Secondary smoke ring
      this._particles.burst(px, py, {
        count: 18, colors: ['#444444', '#222222'],
        speed: [40, 100], life: [0.6, 1.5], size: [4, 10],
        fadeOut: true, shape: 'square',
      });
      this._addShake(14, 0.55);

      // All powerups lost on death
      this._activePowerups  = {};
      this._playerAlive     = false;
      this._playerInvincible= 0;
      this._playerAnim.play('dead', true);

      if (State.lives <= 0) {
        this._gameOver = true;
        if (State.score > State.hiScore) State.hiScore = State.score;
        this._goAlpha = { v: 0 };
        this._tweens.create(this._goAlpha, { v: 1 }, 0.8, {
          ease: 'outCubic', delay: 1.2,
          onComplete: () => {
            this._scenes.replace(new GameOverScene(), this._engine);
          },
        });
      } else {
        setTimeout(() => {
          if (!this._gameOver) {
            const pc = CFG().player;
            this._playerBody.x  = pc.startX - pc.hitbox.w / 2;
            this._playerBody.y  = pc.startY - pc.hitbox.h;
            this._playerBody.vx = 0;
            this._playerAlive   = true;
            this._playerInvincible = pc.flashTime;
            this._playerAnim.play('idle', true);
          }
        }, CFG().player.respawnDelay * 1000);
      }
    }

    // ── Level complete: zoom in on player → iris transition ────────────────

    _onLevelComplete() {
      if (this._levelDone) return;
      this._levelDone = true;
      this._audio.play('levelUp');
      State.level++;

      const cfg = CFG();
      const W   = cfg.engine.width;
      const H   = cfg.engine.height;
      const px  = this._playerBody.x + this._playerBody.width  / 2;
      const py  = this._playerBody.y + this._playerBody.height / 2;

      // "Sector Cleared" banner fades in
      this._lcBanner = { alpha: 0 };
      this._tweens.create(this._lcBanner, { alpha: 1 }, 0.3, { ease: 'outCubic' });

      // Victory particle burst around player
      this._particles.burst(px, py, {
        count: 70, colors: ['#00e5ff', '#ffffff', '#ffff00', '#ff5500', '#ff44ff'],
        speed: [60, 320], life: [0.8, 2.4], size: [3, 8],
        fadeOut: true, shape: 'star', gravity: -30,
      });

      // Enable pulsing victory glow on the ship (rendered via Date.now())
      this._playerVictoryGlow = true;

      // ── Zoom in on the player (TweenSystem showcase) ──────────────────────
      this._tweens.create(this._viewport, { scale: 2.8, cx: px, cy: py }, 1.1, {
        ease: 'outCubic',
        onComplete: () => {
          // ── Iris out → swap level → iris in (TweenSystem transition API) ──
          this._transition = this._tweens.createTransition('iris', 0.9, {
            color: '#000022',
            onMidpoint: () => {
              // Reset viewport before the new level is revealed
              this._viewport.scale = 1;
              this._viewport.cx    = W / 2;
              this._viewport.cy    = H / 2;

              // Kill victory glow
              this._playerVictoryGlow = false;

              // Clean up bullets and in-flight powerups
              this._playerBullets.forEach(b => this._physics.removeBody(b.body));
              this._alienBullets.forEach(b => this._physics.removeBody(b.body));
              if (this._bossBullets) this._bossBullets.forEach(b => this._physics.removeBody(b.body));
              this._playerBullets = [];
              this._alienBullets  = [];
              this._bossBullets   = [];
              this._powerups      = [];
              this._activePowerups = {};

              // Rebuild the level (sets _levelDone = false)
              this._initLevel();
              // Keep gameplay frozen until iris has fully opened
              this._levelDone = true;
            },
            onComplete: () => {
              this._transition = null;
              this._levelDone  = false; // ← gameplay resumes here
            },
          });
        },
      });
    }

    _onUFODestroyed(data) {
      this._audio.play('ufoAppear');
      this._showFloatingText(`${data.points} PTS!`, data.x, 55, '#ff4444');
      this._addShake(5, 0.2);
    }

    _onBossHit(data) {
      this._audio.play('bossHit');
      this._addShake(3, 0.12);
    }

    _onBossKilled() {
      const boss = this._boss;
      if (!boss) return;
      this._audio.play('bossDie');
      this._addShake(28, 1.0);

      // Multi-stage boss explosion
      const burst = (delay) => {
        setTimeout(() => {
          if (this._levelDone) return;
          const ox = boss.x + (Math.random() - 0.5) * 60;
          const oy = boss.y - 28 + (Math.random() - 0.5) * 30;
          this._particles.burst(ox, oy, {
            count: 50, colors: ['#ffff00', '#ff8800', '#ff2222', '#ffffff'],
            speed: [80, 360], life: [0.4, 1.3], size: [4, 12],
            fadeOut: true, shrink: true, shape: 'star', gravity: 30,
          });
          this._particles.burst(ox, oy, {
            count: 18, colors: ['#222222', '#444444'],
            speed: [30, 90], life: [0.8, 1.8], size: [6, 14],
            fadeOut: true, shape: 'square',
          });
        }, delay);
      };
      burst(0); burst(150); burst(320); burst(520); burst(750);

      // Award bonus
      const bonus = CFG().boss.bonusPoints;
      State.score += bonus;
      this._showFloatingText(`+${bonus} BOSS BONUS!`, boss.x, boss.y - 60, '#ff66cc');

      this._boss = null;
      // Clear minions on boss death
      this._minions = [];

      // Trigger level complete
      this._engine.events.emit('level:complete');
    }

    // ── Powerup system ─────────────────────────────────────────────────────

    _activatePowerup(type) {
      const cfg     = CFG().powerups;
      const typeDef = cfg.types.find(t => t.type === type);
      const px = this._playerBody.x + this._playerBody.width  / 2;
      const py = this._playerBody.y + this._playerBody.height / 2;

      const labels = {
        rapidFire : 'RAPID FIRE!',
        doubleShot: 'TWIN SHOT!',
        shield    : 'SHIELD UP!',
        smartBomb : 'SMART BOMB!',
        megaLaser : 'MEGA LASER!',
        extraLife : '+1 LIFE!',
      };
      const colors = {
        rapidFire : '#ff5500',
        doubleShot: '#ffcc00',
        shield    : '#4488ff',
        smartBomb : '#ff2266',
        megaLaser : '#aa44ff',
        extraLife : '#44ff88',
      };

      this._audio.play('powerup');

      if (type === 'shield') {
        this._activePowerups.shield = { timer: Infinity, duration: Infinity };
      } else if (type === 'rapidFire' || type === 'doubleShot') {
        const dur = typeDef.duration || cfg.duration;
        this._activePowerups[type] = { timer: dur, duration: dur };
      } else if (type === 'megaLaser') {
        const dur = typeDef.duration || cfg.duration;
        this._activePowerups.megaLaser = { timer: dur, duration: dur };
      } else if (type === 'smartBomb') {
        this._triggerSmartBomb();
      } else if (type === 'extraLife') {
        State.lives = Math.min(99, State.lives + 1);
        this._audio.play('extraLife');
      }

      this._showFloatingText(labels[type] || type.toUpperCase(), px, py - 30, colors[type] || '#ffffff');
    }

    _triggerSmartBomb() {
      this._audio.play('smartBomb');
      this._addShake(18, 0.6);

      const W = CFG().engine.width;
      const H = CFG().engine.height;

      // Big screen-wide explosion ring
      this._particles.burst(W / 2, H / 2, {
        count: 80, colors: ['#ff2266', '#ffaaff', '#ffffff'],
        speed: [120, 460], life: [0.3, 0.9], size: [3, 10],
        fadeOut: true, shape: 'star',
      });

      // Kill bottom row(s) of aliens; if not enough, expand upward
      let toKill = Math.max(8, Math.floor((this._aliens.filter(a => a.alive).length) * 0.4));
      const alive = this._aliens.filter(a => a.alive).sort((a, b) => b.y - a.y);
      let killed = 0;
      for (const alien of alive) {
        if (killed >= toKill) break;
        alien.alive = false;
        this._particles.burst(alien.x, alien.y - 10, {
          count: 14, colors: [alien.color, '#ffffff', '#ffff00'],
          speed: [40, 160], life: [0.2, 0.6], size: [2, 6],
          fadeOut: true, shrink: true, shape: 'square',
        });
        State.score += alien.points;
        killed++;
      }

      // Damage boss if present
      if (this._boss) {
        this._damageBoss(8);
      }

      // Wipe minions
      this._minions.forEach(m => {
        this._particles.burst(m.x, m.y, {
          count: 12, colors: ['#ff66cc', '#ffffff'],
          speed: [40, 140], life: [0.2, 0.6], size: [2, 5],
          fadeOut: true, shape: 'square',
        });
        State.score += 25;
      });
      this._minions = [];

      // Clear all incoming alien bullets
      this._alienBullets.forEach(b => {
        this._particles.burst(b.body.x + 2, b.body.y + 6, {
          count: 6, colors: ['#ff8888', '#ffffff'], speed: [20, 80],
          life: [0.1, 0.3], size: [1, 3], fadeOut: true,
        });
        this._physics.removeBody(b.body);
      });
      this._alienBullets = [];
      if (this._bossBullets) {
        this._bossBullets.forEach(b => this._physics.removeBody(b.body));
        this._bossBullets = [];
      }

      this._showFloatingText(`SMART BOMB!  +${killed} KILLS`, W / 2, H / 2, '#ff66cc');

      // Recompute count
      this._refreshAlienCount();
    }

    _damageBoss(amount) {
      if (!this._boss) return;
      this._boss.hp -= amount;
      this._boss.flashTime = 0.18;
      this._engine.events.emit('boss:hit', { hp: this._boss.hp });
      this._particles.burst(this._boss.x, this._boss.y - 28, {
        count: 14, colors: ['#ffffff', '#ff66cc', '#ffff00'],
        speed: [40, 180], life: [0.15, 0.45], size: [2, 6],
        fadeOut: true, shape: 'square',
      });
      if (this._boss.hp <= 0) {
        this._engine.events.emit('boss:killed');
      }
    }

    _refreshAlienCount() {
      this._alienCount = this._aliens.filter(a => a.alive).length;
    }

    _updatePowerups(dt) {
      const puCfg = CFG().powerups;
      const H     = CFG().engine.height;
      const pbx   = this._playerBody.x + this._playerBody.width  / 2;
      const pby   = this._playerBody.y + this._playerBody.height / 2;

      // Move falling powerups downward and check collection
      for (let i = this._powerups.length - 1; i >= 0; i--) {
        const pu = this._powerups[i];
        pu.y += puCfg.speed * dt;
        pu.anim.update(dt);

        if (pu.y > H + 30) {
          this._powerups.splice(i, 1);
          continue;
        }

        // Collection: player ship overlaps the orb
        if (this._playerAlive && Math.abs(pu.x - pbx) < 22 && Math.abs(pu.y - pby) < 22) {
          this._activatePowerup(pu.type);
          this._particles.burst(pu.x, pu.y, {
            count: 26, colors: [pu.color, '#ffffff', '#ffff88'],
            speed: [50, 180], life: [0.2, 0.7], size: [2, 6],
            fadeOut: true, shape: 'star',
          });
          this._powerups.splice(i, 1);
        }
      }

      // Tick active powerup durations
      for (const type of Object.keys(this._activePowerups)) {
        const ap = this._activePowerups[type];
        if (ap.timer !== Infinity) {
          ap.timer -= dt;
          if (ap.timer <= 0) {
            delete this._activePowerups[type];
            const px2 = this._playerBody.x + this._playerBody.width / 2;
            const labels = {
              rapidFire : 'RAPID FIRE ENDED',
              doubleShot: 'TWIN SHOT ENDED',
              megaLaser : 'MEGA LASER ENDED',
            };
            this._showFloatingText(
              labels[type] || `${type.toUpperCase()} ENDED`,
              px2, this._playerBody.y - 20, '#666666'
            );
          }
        }
      }
    }

    // ── Floating text helper (TweenSystem) ─────────────────────────────────

    _showFloatingText(text, x, y, color) {
      if (!this._floatingTexts) this._floatingTexts = [];
      const obj = { text, x, y, color, alpha: 1 };
      this._tweens.create(obj, { y: y - 50, alpha: 0 }, 1.2, {
        ease: 'outCubic',
        onComplete: () => {
          const idx = this._floatingTexts.indexOf(obj);
          if (idx >= 0) this._floatingTexts.splice(idx, 1);
        }
      });
      this._floatingTexts.push(obj);
    }

    // ── Update ─────────────────────────────────────────────────────────────

    update(dt, engine) {
      this._nebulaT += dt;
      this._updateShake(dt);

      if (this._paused || this._gameOver) {
        if (engine.input.wasPressed('pause') && !this._gameOver) {
          this._paused = !this._paused;
        }
        return;
      }

      if (engine.input.wasPressed('pause') && !this._levelDone) {
        this._paused = true;
        return;
      }

      if (this._levelDone) return;

      this._updatePlayer(dt, engine);
      if (this._isBossLevel) {
        this._updateBoss(dt);
        this._updateMinions(dt);
      } else {
        this._updateAliens(dt);
      }
      this._updateBullets(dt);
      this._updateUFO(dt);
      this._updatePowerups(dt);
      this._updateCombo(dt);
      this._checkCollisions(engine);
    }

    _updatePlayer(dt, engine) {
      if (!this._playerAlive) return;

      const cfg  = CFG();
      const pc   = cfg.player;
      const body = this._playerBody;
      const W    = cfg.engine.width;

      // Movement (InputManager showcase)
      if (engine.input.isDown('left')) {
        body.vx = -pc.speed;
      } else if (engine.input.isDown('right')) {
        body.vx = pc.speed;
      } else {
        body.vx = 0;
      }
      body.x = GF.Math.clamp(body.x, 0, W - body.width);

      // Fire rate — tripled with rapidFire powerup
      const fireRate = this._activePowerups.rapidFire ? pc.fireRate * 0.28
                     : (this._activePowerups.megaLaser ? pc.fireRate * 0.55 : pc.fireRate);
      this._fireTimer -= dt;

      if (engine.input.isDown('fire') && this._fireTimer <= 0) {
        this._fireTimer = fireRate;
        const bx = body.x + body.width / 2;
        const by = body.y;

        const useMega = !!this._activePowerups.megaLaser;

        const spawnBullet = (offsetX) => {
          const w = useMega ? 8 : 4;
          const h = useMega ? 16 : 12;
          const bBody = this._physics.addBody(new GF.PhysicsBody({
            x: bx + offsetX - w / 2, y: by - h,
            width: w, height: h,
            gravityScale: 0, friction: 1,
            maxSpeedX: 0, maxSpeedY: pc.bulletSpeed * 2.4,
            tag: 'playerBullet',
          }));
          bBody.vy = -pc.bulletSpeed * (useMega ? 1.15 : 1);
          this._playerBullets.push({
            body: bBody,
            anim: this._sprites.createAnimator(useMega ? 'megaLaserBullet' : 'playerBullet', 'idle'),
            piercing: useMega,
            piercedIds: useMega ? new Set() : null,
            damage: useMega ? 2 : 1,
            isMega: useMega,
          });
        };

        spawnBullet(0);                              // center bullet (always)
        if (this._activePowerups.doubleShot) {
          spawnBullet(-12);                          // left wing bullet
          spawnBullet(+12);                          // right wing bullet
        }

        if (useMega) {
          this._audio.play('megaLaser');
          this._particles.burst(bx, by - 6, {
            count: 12, colors: ['#aa44ff', '#ffffff', '#cc88ff'],
            speed: [60, 200], life: [0.08, 0.2], size: [2, 5],
            fadeOut: true, direction: -Math.PI / 2, spread: 0.5,
          });
        } else {
          this._audio.play('shoot');
          this._particles.burst(bx, by - 6, {
            count: 6, colors: ['#ffffff', '#00e5ff'],
            speed: [40, 100], life: [0.05, 0.12], size: [1, 3],
            fadeOut: true, direction: -Math.PI / 2, spread: 0.4,
          });
        }
      }

      // Invincibility flash
      if (this._playerInvincible > 0) {
        this._playerInvincible -= dt;
        this._playerVisible = Math.floor(this._playerInvincible * 8) % 2 === 0;
      } else {
        this._playerVisible = true;
      }

      this._playerAnim.update(dt);
    }

    _updateAliens(dt) {
      const cfg   = CFG().aliens;
      const alive = this._aliens.filter(a => a.alive);
      // Defensive: keep _alienCount in sync with reality
      this._alienCount = alive.length;
      if (alive.length === 0) return;

      // Speed increases as the fleet shrinks (MathUtils.map showcase)
      const killed  = this._totalAliens - alive.length;
      const speed   = cfg.moveSpeed + killed * cfg.speedPerKill;

      this._marchInterval = GF.Math.map(alive.length, 1, this._totalAliens, 0.15, 0.8);
      this._marchTimer += dt;
      if (this._marchTimer >= this._marchInterval) {
        this._marchTimer = 0;
        this._audio.play('march' + (this._marchStep % 4));
        this._marchStep++;
        let hitWall = false;
        alive.forEach(a => {
          a.x += speed * this._alienDir * this._marchInterval;
          if (a.x >= CFG().engine.width - 30 || a.x <= 10) hitWall = true;
        });
        if (hitWall) {
          this._alienDir *= -1;
          alive.forEach(a => { a.y += cfg.dropAmount; });
          const lowest = Math.max(...alive.map(a => a.y));
          if (lowest >= CFG().player.startY - 40) {
            this._engine.events.emit('player:hit');
          }
        }
      }

      alive.forEach(a => a.animator.update(dt));

      // Alien shooting
      this._alienFireTimer -= dt;
      if (this._alienFireTimer <= 0) {
        const totalRate = cfg.fireRate * (1 + (State.level - 1) * 0.2);
        this._alienFireTimer = 1 / totalRate;
        const cols = [...new Set(alive.map(a => a.col))];
        if (cols.length > 0) {
          const col       = GF.Math.randChoice(cols);
          const colAliens = alive.filter(a => a.col === col);
          const shooter   = colAliens.reduce((bot, a) => a.y > bot.y ? a : bot);
          const bBody     = this._physics.addBody(new GF.PhysicsBody({
            x: shooter.x - 2, y: shooter.y + 2,
            width: 4, height: 12,
            gravityScale: 0, friction: 1,
            maxSpeedX: 0, maxSpeedY: cfg.bulletSpeed * 2,
            tag: 'alienBullet',
          }));
          bBody.vy = cfg.bulletSpeed + (State.level - 1) * 15;
          this._alienBullets.push({
            body: bBody,
            anim: this._sprites.createAnimator('alienBullet', 'idle'),
          });
        }
      }
    }

    _updateBoss(dt) {
      const boss = this._boss;
      if (!boss) return;

      const W   = CFG().engine.width;
      const H   = CFG().engine.height;
      const cfg = CFG().boss;

      boss.animator.update(dt);
      if (boss.flashTime > 0) boss.flashTime -= dt;

      // Movement: oscillate horizontally + occasional dive
      if (boss.diveTime > 0) {
        boss.diveTime -= dt;
        // Move down and back up
        const phase = (cfg.y + 90) - boss.baseY;
        // Use a sin curve over diveTime to dive then return
        const totalDive = 1.6;
        const t = 1 - (boss.diveTime / totalDive);
        boss.y = boss.baseY + Math.sin(t * Math.PI) * 90;
      } else {
        boss.x += boss.speed * boss.dir * dt;
        if (boss.x < 60) { boss.x = 60; boss.dir = 1; }
        if (boss.x > W - 60) { boss.x = W - 60; boss.dir = -1; }
        boss.y = boss.baseY + Math.sin(this._nebulaT * 1.4) * 6;
      }

      // Attack timer cycles through patterns
      boss.attackTimer -= dt;
      if (boss.attackTimer <= 0) {
        this._bossFire();
        // Lower fire rate when HP is low → more frantic
        const hpFrac = boss.hp / boss.maxHp;
        const rate = cfg.fireRate * (0.5 + hpFrac * 0.5);
        boss.attackTimer = rate + Math.random() * 0.4;
      }

      // Periodic dive (when below 60% HP)
      if (boss.hp / boss.maxHp < 0.6 && boss.diveTime <= 0 && Math.random() < dt * 0.12) {
        boss.diveTime = 1.6;
      }

      // Minion spawning
      this._minionSpawnTimer -= dt;
      if (this._minionSpawnTimer <= 0) {
        this._spawnMinionWave();
        this._minionSpawnTimer = GF.Math.rand(...cfg.minionSpawnInterval);
      }

      // Boss vs player collision (if it dives onto the player)
      if (this._playerAlive && this._playerInvincible <= 0) {
        const bx = boss.x - 48, by = boss.y - 56, bw = 96, bh = 56;
        if (GF.Math.rectsOverlap(
          bx, by, bw, bh,
          this._playerBody.x, this._playerBody.y, this._playerBody.width, this._playerBody.height
        )) {
          this._engine.events.emit('player:hit');
        }
      }
    }

    _bossFire() {
      const boss = this._boss;
      const cfg = CFG().boss;
      // Choose pattern based on HP
      const hpFrac = boss.hp / boss.maxHp;
      const patterns = hpFrac > 0.66 ? ['single', 'spread']
                     : hpFrac > 0.33 ? ['single', 'spread', 'triple']
                     : ['spread', 'triple', 'fan'];
      const pattern = GF.Math.randChoice(patterns);

      const px = this._playerBody.x + this._playerBody.width / 2;
      const py = this._playerBody.y;

      const spawn = (vx, vy, x = boss.x, y = boss.y - 4) => {
        const b = this._physics.addBody(new GF.PhysicsBody({
          x: x - 4, y: y,
          width: 8, height: 12,
          gravityScale: 0, friction: 1,
          maxSpeedX: 9999, maxSpeedY: 9999,
          tag: 'bossBullet',
        }));
        b.vx = vx; b.vy = vy;
        this._bossBullets.push({
          body: b,
          anim: this._sprites.createAnimator('bossBullet', 'idle'),
        });
      };

      const speed = cfg.bulletSpeed;
      const dx = px - boss.x;
      const dy = py - boss.y;
      const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const ux = dx / len, uy = dy / len;

      if (pattern === 'single') {
        spawn(ux * speed, uy * speed);
      } else if (pattern === 'spread') {
        for (let i = -1; i <= 1; i++) {
          const ang = Math.atan2(uy, ux) + i * 0.25;
          spawn(Math.cos(ang) * speed, Math.sin(ang) * speed);
        }
      } else if (pattern === 'triple') {
        spawn(-speed * 0.4, speed * 0.85, boss.x - 36);
        spawn(0,             speed,        boss.x);
        spawn(speed * 0.4,   speed * 0.85, boss.x + 36);
      } else if (pattern === 'fan') {
        for (let i = -2; i <= 2; i++) {
          const ang = Math.PI / 2 + i * 0.18;
          spawn(Math.cos(ang) * speed, Math.sin(ang) * speed);
        }
      }
    }

    _spawnMinionWave() {
      const W = CFG().engine.width;
      const count = 3 + Math.floor(Math.random() * 2);
      const fromLeft = Math.random() < 0.5;
      for (let i = 0; i < count; i++) {
        this._minions.push({
          x: fromLeft ? -30 - i * 32 : W + 30 + i * 32,
          y: 130 + i * 24,
          vx: fromLeft ? 130 : -130,
          vy: 0,
          phase: Math.random() * Math.PI * 2,
          fireTimer: 1.5 + Math.random(),
          alive: true,
          animator: this._sprites.createAnimator('bossMinion', 'idle'),
        });
      }
    }

    _updateMinions(dt) {
      const W = CFG().engine.width;
      const H = CFG().engine.height;
      for (let i = this._minions.length - 1; i >= 0; i--) {
        const m = this._minions[i];
        m.phase += dt * 3;
        m.x += m.vx * dt;
        m.y += Math.sin(m.phase) * 30 * dt;
        m.animator.update(dt);

        m.fireTimer -= dt;
        if (m.fireTimer <= 0 && m.x > 0 && m.x < W) {
          m.fireTimer = 1.5 + Math.random();
          const bBody = this._physics.addBody(new GF.PhysicsBody({
            x: m.x - 2, y: m.y + 2,
            width: 4, height: 12,
            gravityScale: 0, friction: 1,
            maxSpeedX: 0, maxSpeedY: 9999,
            tag: 'alienBullet',
          }));
          bBody.vy = 220;
          this._alienBullets.push({
            body: bBody,
            anim: this._sprites.createAnimator('alienBullet', 'idle'),
          });
        }

        if (m.x < -60 || m.x > W + 60 || m.y > H + 30) {
          this._minions.splice(i, 1);
        }
      }
    }

    _updateBullets(dt) {
      const H = CFG().engine.height;
      this._playerBullets = this._playerBullets.filter(b => {
        b.anim.update(dt);
        if (b.bossHitCooldown && b.bossHitCooldown > 0) b.bossHitCooldown -= dt;
        if (b.body.y + b.body.height < 0) { this._physics.removeBody(b.body); return false; }
        return true;
      });
      this._alienBullets = this._alienBullets.filter(b => {
        b.anim.update(dt);
        if (b.body.y > H || b.body.x < -20 || b.body.x > CFG().engine.width + 20) {
          this._physics.removeBody(b.body); return false;
        }
        return true;
      });
      if (this._bossBullets) {
        this._bossBullets = this._bossBullets.filter(b => {
          b.anim.update(dt);
          if (b.body.y > H || b.body.x < -20 || b.body.x > CFG().engine.width + 20) {
            this._physics.removeBody(b.body); return false;
          }
          return true;
        });
      }
    }

    _updateUFO(dt) {
      const cfg = CFG().ufo;
      const W   = CFG().engine.width;
      // No UFO during boss levels
      if (this._isBossLevel) return;
      if (!this._ufo) {
        this._ufoTimer -= dt;
        if (this._ufoTimer <= 0) {
          const dir = GF.Math.randBool() ? 1 : -1;
          this._ufo = {
            x: dir > 0 ? -50 : W + 50,
            y: cfg.y, dir,
            anim: this._ufoAnim,
          };
          this._ufoTimer = GF.Math.rand(...cfg.spawnInterval);
          this._audio.play('ufoAppear');
          this._engine.events.emit('ufo:appeared');
        }
      } else {
        this._ufo.x += cfg.speed * this._ufo.dir * dt;
        this._ufo.anim.update(dt);
        if (this._ufo.x < -60 || this._ufo.x > W + 60) this._ufo = null;
      }
    }

    _checkCollisions(engine) {
      const puCfg = CFG().powerups;

      // ── Player bullets vs aliens / minions / boss / UFO / bunkers ──
      for (let i = this._playerBullets.length - 1; i >= 0; i--) {
        const pb = this._playerBullets[i];
        let consumed = false;

        // ── vs aliens (regular grid) ──
        // CRITICAL: skip already-dead aliens. The captured `aliens` array can
        // contain entities killed earlier in this same loop (or by other bullets),
        // and double-counting them led to _alienCount dropping below zero and
        // ending the level early. Always check `alien.alive` here.
        for (let j = 0; j < this._aliens.length; j++) {
          const alien = this._aliens[j];
          if (!alien.alive) continue;
          const ax = alien.x - 14, ay = alien.y - 20, aw = 28, ah = 20;
          if (GF.Math.rectsOverlap(pb.body.x, pb.body.y, pb.body.width, pb.body.height, ax, ay, aw, ah)) {
            // Mega laser pierces, but doesn't double-hit the same alien
            if (pb.piercing) {
              if (pb.piercedIds.has(j)) continue;
              pb.piercedIds.add(j);
            }
            alien.alive = false;
            this._audio.play('alienDie');
            engine.events.emit('alien:killed', { points: alien.points });
            this._addShake(2, 0.08);

            // Explosion particles (combo-scaled)
            const mult = this._comboMultiplier();
            const partCount = Math.round(18 + mult * 4);
            this._particles.burst(alien.x, alien.y - 10, {
              count: partCount, colors: [alien.color, '#ffffff', '#ffff00'],
              speed: [40, 180 + mult * 20], life: [0.2, 0.6 + mult * 0.05], size: [2, 6 + mult],
              fadeOut: true, shrink: true, shape: 'square',
            });

            const earned = Math.round(alien.points * mult);
            const popupText = mult > 1 ? `+${earned} ×${mult.toFixed(1)}` : `+${alien.points}`;
            this._showFloatingText(popupText, alien.x, alien.y - 20,
              mult > 1 ? '#ffaa00' : alien.color);

            // Random powerup drop (boosted by combo)
            const dropChance = puCfg.dropChance * (1 + (mult - 1) * 0.25);
            if (Math.random() < dropChance) {
              const typeDef = pickWeightedPowerup();
              this._powerups.push({
                x   : alien.x,
                y   : alien.y,
                type: typeDef.type,
                color: typeDef.color,
                anim: this._sprites.createAnimator(typeDef.sprite, 'idle'),
              });
            }

            if (!pb.piercing) {
              this._physics.removeBody(pb.body);
              this._playerBullets.splice(i, 1);
              consumed = true;
              break;
            }
            // Piercing bullets continue and may hit more aliens this same frame
          }
        }
        if (consumed) continue;

        // ── vs minions ──
        for (let m = 0; m < this._minions.length; m++) {
          const mn = this._minions[m];
          if (!mn.alive) continue;
          const mx = mn.x - 12, my = mn.y - 18, mw = 24, mh = 18;
          if (GF.Math.rectsOverlap(pb.body.x, pb.body.y, pb.body.width, pb.body.height, mx, my, mw, mh)) {
            mn.alive = false;
            this._audio.play('minionDie');
            State.score += 35;
            this._addCombo();
            this._particles.burst(mn.x, mn.y, {
              count: 16, colors: ['#ff66cc', '#ffffff'], speed: [50, 180],
              life: [0.2, 0.5], size: [2, 5], fadeOut: true, shrink: true, shape: 'square',
            });
            this._showFloatingText('+35', mn.x, mn.y - 12, '#ff66cc');
            this._minions.splice(m, 1);
            if (!pb.piercing) {
              this._physics.removeBody(pb.body);
              this._playerBullets.splice(i, 1);
              consumed = true;
            }
            break;
          }
        }
        if (consumed) continue;

        // ── vs boss ──
        // Piercing bullets stay alive so they can keep piercing aliens, but we
        // must not let them re-damage the boss every frame they overlap it.
        // pb.bossHitCooldown ticks down in _updateBullets to gate repeat hits.
        if (this._boss && (!pb.bossHitCooldown || pb.bossHitCooldown <= 0)) {
          const bs = this._boss;
          const bx = bs.x - 44, by = bs.y - 56, bw = 88, bh = 50;
          if (GF.Math.rectsOverlap(pb.body.x, pb.body.y, pb.body.width, pb.body.height, bx, by, bw, bh)) {
            this._damageBoss(pb.damage || 1);
            // small impact particles
            this._particles.burst(pb.body.x + pb.body.width / 2, pb.body.y, {
              count: 8, colors: ['#ffffff', '#ffaa00'],
              speed: [40, 130], life: [0.1, 0.3], size: [2, 4], fadeOut: true,
            });
            if (!pb.piercing) {
              this._physics.removeBody(pb.body);
              this._playerBullets.splice(i, 1);
              consumed = true;
            } else {
              // Piercing — block re-damage until the bullet has had time to leave the boss
              pb.bossHitCooldown = 0.18;
            }
            break;
          }
        }
        if (consumed) continue;

        // Player bullet vs UFO
        if (this._ufo) {
          const ux = this._ufo.x - 20, uy = this._ufo.y - 16, uw = 40, uh = 16;
          if (GF.Math.rectsOverlap(pb.body.x, pb.body.y, pb.body.width, pb.body.height, ux, uy, uw, uh)) {
            const pts = GF.Math.randChoice(CFG().ufo.points);
            State.score += pts;
            engine.events.emit('ufo:destroyed', { points: pts, x: this._ufo.x, y: this._ufo.y });
            this._particles.burst(this._ufo.x, this._ufo.y - 8, {
              count: 36, colors: ['#ff2222','#ff8800','#ffff00','#ffffff'],
              speed: [80, 320], life: [0.3, 0.9], size: [3, 9],
              fadeOut: true, shrink: true, shape: 'star', gravity: -30,
            });
            this._ufo = null;
            if (!pb.piercing) {
              this._physics.removeBody(pb.body);
              this._playerBullets.splice(i, 1);
              consumed = true;
            }
            break;
          }
        }
        if (consumed) continue;

        // Player bullet vs bunkers
        for (let k = 0; k < this._bunkers.length; k++) {
          const bk = this._bunkers[k];
          if (bk.health <= 0) continue;
          if (GF.Math.rectsOverlap(pb.body.x, pb.body.y, pb.body.width, pb.body.height, bk.x, bk.y, bk.w, bk.h)) {
            // Mega laser passes through bunkers (and damages them slightly)
            if (pb.piercing) {
              bk.health = Math.max(0, bk.health - 0.5);
              break;
            }
            bk.health--;
            this._audio.play('bunkerHit');
            this._particles.burst(pb.body.x + 2, pb.body.y, {
              count: 8, colors: ['#44ff44','#228822'],
              speed: [30, 80], life: [0.1, 0.25], size: [2, 4], fadeOut: true,
            });
            this._physics.removeBody(pb.body);
            this._playerBullets.splice(i, 1);
            break;
          }
        }
      }

      // ── Alien bullets vs player ──
      if (this._playerAlive && this._playerInvincible <= 0) {
        for (let i = this._alienBullets.length - 1; i >= 0; i--) {
          const ab = this._alienBullets[i];
          if (GF.Math.rectsOverlap(
            ab.body.x, ab.body.y, ab.body.width, ab.body.height,
            this._playerBody.x, this._playerBody.y, this._playerBody.width, this._playerBody.height
          )) {
            this._physics.removeBody(ab.body);
            this._alienBullets.splice(i, 1);
            engine.events.emit('player:hit');
            break;
          }
        }
      }

      // ── Boss bullets vs player ──
      if (this._bossBullets && this._playerAlive && this._playerInvincible <= 0) {
        for (let i = this._bossBullets.length - 1; i >= 0; i--) {
          const bb = this._bossBullets[i];
          if (GF.Math.rectsOverlap(
            bb.body.x, bb.body.y, bb.body.width, bb.body.height,
            this._playerBody.x, this._playerBody.y, this._playerBody.width, this._playerBody.height
          )) {
            this._physics.removeBody(bb.body);
            this._bossBullets.splice(i, 1);
            engine.events.emit('player:hit');
            break;
          }
        }
      }

      // ── Alien bullets vs bunkers ──
      for (let i = this._alienBullets.length - 1; i >= 0; i--) {
        const ab = this._alienBullets[i];
        for (let k = 0; k < this._bunkers.length; k++) {
          const bk = this._bunkers[k];
          if (bk.health <= 0) continue;
          if (GF.Math.rectsOverlap(ab.body.x, ab.body.y, ab.body.width, ab.body.height, bk.x, bk.y, bk.w, bk.h)) {
            bk.health--;
            this._audio.play('bunkerHit');
            this._physics.removeBody(ab.body);
            this._alienBullets.splice(i, 1);
            break;
          }
        }
      }

      // ── Boss bullets vs bunkers ──
      if (this._bossBullets) {
        for (let i = this._bossBullets.length - 1; i >= 0; i--) {
          const bb = this._bossBullets[i];
          for (let k = 0; k < this._bunkers.length; k++) {
            const bk = this._bunkers[k];
            if (bk.health <= 0) continue;
            if (GF.Math.rectsOverlap(bb.body.x, bb.body.y, bb.body.width, bb.body.height, bk.x, bk.y, bk.w, bk.h)) {
              bk.health = Math.max(0, bk.health - 2);
              this._audio.play('bunkerHit');
              this._physics.removeBody(bb.body);
              this._bossBullets.splice(i, 1);
              break;
            }
          }
        }
      }

      // ── Refresh authoritative alien count ──
      // This is the one source of truth — derived from the actual array — so
      // there's no way for it to drift below the true number of live aliens.
      this._alienCount = this._aliens.filter(a => a.alive).length;

      // ── Level complete? ──
      if (!this._levelDone) {
        if (this._isBossLevel) {
          // Boss levels complete only via boss:killed event
        } else {
          if (this._alienCount === 0) {
            engine.events.emit('level:complete');
          }
        }
      }
    }

    // ── Render ─────────────────────────────────────────────────────────────

    render(ctx, engine) {
      const cfg = CFG();
      const W   = cfg.engine.width;
      const H   = cfg.engine.height;
      const vp  = this._viewport;

      // Background nebula (rendered in screen-space, behind world)
      this._renderBackground(ctx, W, H);

      // ── 1. Apply viewport zoom transform + screen shake ──
      ctx.save();
      ctx.translate(this._shake.x, this._shake.y);
      if (vp.scale !== 1) {
        ctx.translate(W / 2, H / 2);
        ctx.scale(vp.scale, vp.scale);
        ctx.translate(-vp.cx, -vp.cy);
      }
      this._renderWorld(ctx, engine, W, H);
      ctx.restore();

      // ── 2. HUD (screen-space) ──
      ctx.globalAlpha = this._hudAlpha.v;
      this._renderHUD(ctx, engine, W, H);
      ctx.globalAlpha = 1;

      // ── 3. Boss warning banner (screen-space, above HUD) ──
      if (this._bossWarningActive && this._bossWarning) {
        this._renderBossWarning(ctx, W, H);
      }

      // ── 4. Iris transition overlay ──
      if (this._transition) {
        this._transition.render(ctx, W, H);
      }
    }

    _renderBackground(ctx, W, H) {
      const t = this._nebulaT;
      // Parallax starfield (3 layers at different speeds)
      ctx.save();
      for (let layer = 0; layer < 3; layer++) {
        const speed = (layer + 1) * 14;
        const count = 30;
        const sz    = layer + 1;
        ctx.globalAlpha = 0.25 + layer * 0.22;
        for (let i = 0; i < count; i++) {
          const seed = i * 31 + layer * 113;
          const sx = GF.Math.wrap(seed * 7.1, 0, W);
          const sy = GF.Math.wrap(seed * 11.3 + t * speed, 0, H);
          ctx.fillStyle = (i + layer) % 7 === 0 ? '#ff88ff'
                       : (i + layer) % 5 === 0 ? '#88ddff' : '#ffffff';
          ctx.fillRect(sx, sy, sz, sz);
        }
      }
      ctx.restore();

      // Soft drifting nebula gradient bands
      ctx.save();
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      const phase = (Math.sin(t * 0.2) + 1) * 0.5;
      grad.addColorStop(0, this._isBossLevel ? '#330011' : '#001033');
      grad.addColorStop(0.5 + phase * 0.1, '#000005');
      grad.addColorStop(1, this._isBossLevel ? '#220044' : '#001a55');
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // Subtle moving radial glow
      ctx.save();
      ctx.globalAlpha = 0.18 + Math.sin(t * 0.8) * 0.05;
      const cx = W / 2 + Math.sin(t * 0.3) * 100;
      const cy = H / 2 + Math.cos(t * 0.4) * 60;
      const rg = ctx.createRadialGradient(cx, cy, 30, cx, cy, 280);
      rg.addColorStop(0, this._isBossLevel ? 'rgba(255,80,160,0.5)' : 'rgba(0,200,255,0.5)');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    _renderBossWarning(ctx, W, H) {
      const a = this._bossWarning.alpha;
      const s = this._bossWarning.scale;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(W / 2, H / 2);
      ctx.scale(s, s);
      // Warning bars
      ctx.fillStyle = 'rgba(255,40,80,0.18)';
      ctx.fillRect(-W / 2, -50, W, 100);
      // Striped bars top + bottom
      ctx.fillStyle = '#ff2266';
      for (let i = -W / 2; i < W / 2; i += 24) {
        ctx.fillRect(i, -50, 14, 6);
        ctx.fillRect(i + 6, 44, 14, 6);
      }
      GF.UISystem.drawText(ctx, '!! BOSS INCOMING !!', 0, 0, {
        font: 'bold 36px monospace', color: '#ff2266',
        align: 'center', baseline: 'middle', glow: '#ff66aa', glowBlur: 20,
      });
      GF.UISystem.drawText(ctx, 'BRACE FOR IMPACT', 0, 28, {
        font: 'bold 12px monospace', color: '#ffaacc',
        align: 'center', baseline: 'middle',
      });
      ctx.restore();
    }

    _renderWorld(ctx, engine, W, H) {
      const cfg = CFG();
      const ui  = GF.UISystem;
      const t   = Date.now() / 1000; // time for sinusoidal effects

      // ── Floor line ──
      ctx.strokeStyle = cfg.colors.floor;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(0, cfg.player.startY + 6);
      ctx.lineTo(W, cfg.player.startY + 6);
      ctx.stroke();

      // ── Bunkers (UISystem.drawHealthBar showcase) ──
      this._bunkers.forEach(bk => {
        if (bk.health <= 0) return;
        const ratio = bk.health / cfg.bunkers.health;
        ctx.save();
        ctx.globalAlpha = 0.3 + ratio * 0.7;
        ctx.fillStyle   = cfg.bunkers.color;
        ctx.fillRect(bk.x,            bk.y, bk.w,    bk.h - 8);
        ctx.fillRect(bk.x,            bk.y, 16,       bk.h);
        ctx.fillRect(bk.x + bk.w - 16, bk.y, 16,     bk.h);
        ctx.restore();
        ui.drawHealthBar(ctx, bk.x, bk.y + bk.h + 2, bk.w, 3,
          bk.health, cfg.bunkers.health,
          { borderWidth: 1, fillColor: '#44ff44', bgColor: '#002200' });
      });

      // ── Falling powerup orbs ──
      this._powerups.forEach(pu => {
        pu.anim.draw(ctx, pu.x, pu.y);
        // Pulsing glow ring around orb
        ctx.save();
        ctx.globalAlpha  = 0.25 + Math.sin(t * 5 + pu.x * 0.1) * 0.12;
        ctx.strokeStyle  = pu.color;
        ctx.lineWidth    = 2;
        ctx.shadowColor  = pu.color;
        ctx.shadowBlur   = 8;
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, 14, 0, Math.PI * 2);
        ctx.stroke();
        // Outer rotating tick marks (sparkle effect)
        ctx.globalAlpha = 0.5 + Math.sin(t * 7 + pu.x) * 0.4;
        for (let s = 0; s < 4; s++) {
          const ang = t * 2 + s * Math.PI / 2 + pu.x * 0.01;
          const ox = pu.x + Math.cos(ang) * 18;
          const oy = pu.y + Math.sin(ang) * 18;
          ctx.fillStyle = pu.color;
          ctx.fillRect(ox - 1, oy - 1, 2, 2);
        }
        ctx.restore();
      });

      // ── Aliens ──
      this._aliens.forEach(a => {
        if (!a.alive) return;
        a.animator.draw(ctx, a.x, a.y);
      });

      // ── Boss + minions ──
      if (this._boss) {
        const b = this._boss;
        // Glow aura behind boss
        ctx.save();
        const pulse = 0.25 + Math.sin(t * 2) * 0.1;
        ctx.globalAlpha = pulse;
        ctx.shadowColor = '#ff44aa';
        ctx.shadowBlur  = 28;
        ctx.fillStyle = '#ff44aa';
        ctx.beginPath();
        ctx.arc(b.x, b.y - 28, 64, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Damage flash overlay
        if (b.flashTime > 0) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = b.flashTime / 0.18;
          b.animator.draw(ctx, b.x, b.y);
          ctx.restore();
        }
        b.animator.draw(ctx, b.x, b.y);

        // Boss HP bar (above the boss)
        const barW = 220, barH = 10;
        const bx = b.x - barW / 2;
        const by = b.y - 70;
        ui.drawPanel(ctx, bx - 2, by - 2, barW + 4, barH + 4, {
          bgColor: 'rgba(0,0,0,0.6)', borderColor: '#ff66aa', borderWidth: 1, radius: 2,
        });
        const hpRatio = Math.max(0, b.hp / b.maxHp);
        ctx.fillStyle = hpRatio > 0.5 ? '#ff2266' : (hpRatio > 0.25 ? '#ffaa22' : '#ff4444');
        ctx.fillRect(bx, by, barW * hpRatio, barH);
        // Striped overlay
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < barW * hpRatio; i += 8) {
          ctx.fillRect(bx + i + ((t * 30) % 8), by, 4, barH);
        }
        ctx.restore();
        ui.drawText(ctx, 'BOSS', b.x, by - 6, {
          font: 'bold 11px monospace', color: '#ff88cc',
          align: 'center', baseline: 'middle',
        });
      }

      // Minions
      this._minions.forEach(m => {
        m.animator.draw(ctx, m.x, m.y);
      });

      // ── UFO ──
      if (this._ufo) {
        this._ufo.anim.draw(ctx, this._ufo.x, this._ufo.y);
        ui.drawText(ctx, '???', this._ufo.x, this._ufo.y - 22, {
          font: '10px monospace', color: '#ff6666', align: 'center', baseline: 'middle',
        });
      }

      // ── Player ──
      if (this._playerAlive && this._playerVisible) {
        const px = this._playerBody.x + this._playerBody.width  / 2;
        const py = this._playerBody.y + this._playerBody.height;

        // Mega laser barrel glow
        if (this._activePowerups.megaLaser) {
          ctx.save();
          const flicker = 0.5 + Math.sin(t * 14) * 0.3;
          ctx.globalAlpha = flicker;
          ctx.shadowColor = '#aa44ff';
          ctx.shadowBlur  = 16;
          ctx.fillStyle = '#aa44ff';
          ctx.fillRect(px - 3, py - 28, 6, 8);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px - 1, py - 28, 2, 8);
          ctx.restore();
        }

        // Shield glow (pulsing hexagonal aura)
        if (this._activePowerups.shield) {
          ctx.save();
          const pulse = 0.45 + Math.sin(t * 6) * 0.15;
          ctx.globalAlpha = pulse;
          ctx.strokeStyle = '#4488ff';
          ctx.lineWidth   = 3;
          ctx.shadowColor = '#4488ff';
          ctx.shadowBlur  = 14;
          ctx.beginPath();
          ctx.arc(px, py - 11, 26 + Math.sin(t * 4) * 3, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = pulse * 0.22;
          ctx.fillStyle   = '#4488ff';
          ctx.fill();
          ctx.restore();
        }

        // Victory glow (during level-complete zoom — time-based, no tween needed)
        if (this._playerVictoryGlow) {
          ctx.save();
          const brightness = 0.4 + Math.sin(t * 9) * 0.35;
          ctx.globalAlpha = brightness;
          ctx.strokeStyle = '#00e5ff';
          ctx.lineWidth   = 3;
          ctx.shadowColor = '#00e5ff';
          ctx.shadowBlur  = 22;
          ctx.beginPath();
          ctx.arc(px, py - 11, 28, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = brightness * 0.4;
          ctx.lineWidth   = 1.5;
          ctx.beginPath();
          ctx.arc(px, py - 11, 38, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        this._playerAnim.draw(ctx, px, py);
      }

      // ── Bullets ──
      this._playerBullets.forEach(b => {
        // Add a trailing glow for mega laser
        if (b.isMega) {
          ctx.save();
          ctx.globalAlpha = 0.45;
          ctx.shadowColor = '#aa44ff';
          ctx.shadowBlur  = 14;
          b.anim.draw(ctx, b.body.x + b.body.width / 2, b.body.y + b.body.height + 6);
          ctx.restore();
        }
        b.anim.draw(ctx, b.body.x + b.body.width / 2, b.body.y + b.body.height);
      });
      this._alienBullets.forEach(b => {
        b.anim.draw(ctx, b.body.x + b.body.width / 2, b.body.y + b.body.height);
      });
      if (this._bossBullets) {
        this._bossBullets.forEach(b => {
          b.anim.draw(ctx, b.body.x + b.body.width / 2, b.body.y + b.body.height);
        });
      }

      // ── Floating score / status texts ──
      if (this._floatingTexts) {
        this._floatingTexts.forEach(ft => {
          ctx.globalAlpha = ft.alpha;
          ui.drawText(ctx, ft.text, ft.x, ft.y, {
            font: 'bold 14px monospace', color: ft.color,
            align: 'center', baseline: 'middle', shadow: true,
          });
        });
        ctx.globalAlpha = 1;
      }

      // ── Level start banner ──
      if (this._banner && this._banner.alpha > 0) {
        ctx.globalAlpha = this._banner.alpha;
        ui.drawPanel(ctx, W/2 - 110, this._banner.y - 22, 220, 44, {
          bgColor: 'rgba(0,20,40,0.9)', borderColor: '#00e5ff', radius: 6,
        });
        const lvlLabel = this._isBossLevel ? `LEVEL ${State.level}  BOSS` : `LEVEL  ${State.level}`;
        ui.drawText(ctx, lvlLabel, W/2, this._banner.y, {
          font: 'bold 22px monospace', color: this._isBossLevel ? '#ff66cc' : '#00e5ff',
          align: 'center', baseline: 'middle',
          glow: this._isBossLevel ? '#ff44aa' : '#00e5ff', glowBlur: 12,
        });
        ctx.globalAlpha = 1;
      }

      // ── Sector-cleared banner ──
      if (this._lcBanner && this._lcBanner.alpha > 0) {
        ctx.globalAlpha = this._lcBanner.alpha;
        ui.drawPanel(ctx, W/2 - 170, 208, 340, 64, {
          bgColor: 'rgba(0,20,50,0.95)', borderColor: '#00e5ff',
          borderWidth: 2, radius: 6,
        });
        ui.drawText(ctx, 'SECTOR CLEARED!', W/2, 230, {
          font: 'bold 26px monospace', color: '#00e5ff',
          align: 'center', baseline: 'middle', glow: '#00e5ff', glowBlur: 16,
        });
        ui.drawText(ctx, `LEVEL ${State.level} INCOMING`, W/2, 256, {
          font: '13px monospace', color: '#88ddff',
          align: 'center', baseline: 'middle',
        });
        ctx.globalAlpha = 1;
      }

      // ── Pause overlay ──
      if (this._paused) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, W, H);
        ui.drawPanel(ctx, W/2 - 100, H/2 - 40, 200, 80, {
          bgColor: 'rgba(0,10,30,0.95)', borderColor: '#ffffff', radius: 8,
        });
        ui.drawText(ctx, 'PAUSED', W/2, H/2, {
          font: 'bold 28px monospace', color: '#ffffff',
          align: 'center', baseline: 'middle',
        });
      }
    }

    _renderHUD(ctx, engine, W, H) {
      const ui  = GF.UISystem;
      const cfg = CFG();

      // Score
      ui.drawText(ctx, 'SCORE', 16, 6,  { font: '12px monospace', color: '#888' });
      ui.drawText(ctx, String(State.score).padStart(6, '0'), 16, 20, {
        font: 'bold 18px monospace', color: '#ffffff', glow: '#00e5ff', glowBlur: 6,
      });

      // Hi-Score
      ui.drawText(ctx, 'HI-SCORE', W/2, 6, { font: '12px monospace', color: '#888', align: 'center' });
      ui.drawText(ctx, String(Math.max(State.score, State.hiScore)).padStart(6, '0'), W/2, 20, {
        font: 'bold 18px monospace', color: '#ffcc00', align: 'center',
      });

      // Level + lives
      ui.drawText(ctx, `LVL ${State.level}`, W - 90, 6,  { font: '12px monospace', color: '#888' });
      ui.drawText(ctx, 'LIVES',              W - 90, 20, { font: '11px monospace', color: '#888' });
      const drawLives = Math.min(State.lives, 6);
      for (let i = 0; i < drawLives; i++) {
        engine.getSystem('SpriteSystem').drawFrame(ctx, 'playerShip', 'idle', 0, W - 72 + i * 22, 36, false);
      }
      if (State.lives > 6) {
        ui.drawText(ctx, `+${State.lives - 6}`, W - 76 + 6 * 22, 38, {
          font: 'bold 12px monospace', color: '#ffff88', baseline: 'middle',
        });
      }

      // Alien count / boss HP
      if (this._isBossLevel && this._boss) {
        ui.drawText(ctx, `BOSS HP: ${Math.max(0, Math.ceil(this._boss.hp))}/${this._boss.maxHp}`, 16, 36, {
          font: '12px monospace', color: '#ff88cc',
        });
      } else {
        ui.drawText(ctx, `ALIENS: ${this._alienCount}`, 16, 36, {
          font: '12px monospace', color: '#88ff88',
        });
      }

      // Combo indicator (top-center, just under hi-score)
      if (this._comboCount > 1) {
        const mult = this._comboMultiplier();
        const t = Date.now() / 1000;
        const wob = 1 + Math.sin(t * 14) * 0.06;
        ctx.save();
        ctx.translate(W / 2, 50);
        ctx.scale(wob, wob);
        const text = `COMBO ×${mult.toFixed(1)}`;
        ui.drawText(ctx, text, 0, 0, {
          font: 'bold 16px monospace',
          color: mult >= 4 ? '#ff44ff' : (mult >= 2.5 ? '#ffaa22' : '#ffff88'),
          align: 'center', baseline: 'middle',
          glow: mult >= 4 ? '#ff44ff' : '#ffaa00', glowBlur: 8,
        });
        // Combo decay bar
        const cw = CFG().combo;
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(-50, 12, 100, 3);
        ctx.fillStyle = mult >= 4 ? '#ff44ff' : '#ffaa22';
        ctx.fillRect(-50, 12, 100 * (this._comboTimer / cw.window), 3);
        ctx.restore();
      }

      // ── Active powerup indicators (bottom-left) ──
      const puColorMap = {
        rapidFire : '#ff5500',
        doubleShot: '#ffcc00',
        shield    : '#4488ff',
        megaLaser : '#aa44ff',
      };
      const puLabelMap = {
        rapidFire : 'RAPID',
        doubleShot: 'TWIN',
        shield    : 'SHIELD',
        megaLaser : 'MEGA',
      };
      let puX = 16;
      const puY = H - 36;

      for (const [type, ap] of Object.entries(this._activePowerups)) {
        const color = puColorMap[type] || '#ffffff';
        const label = puLabelMap[type] || type;
        ui.drawPanel(ctx, puX, puY, 56, 22, {
          bgColor: color + '22', borderColor: color, radius: 3, borderWidth: 1,
        });
        ui.drawText(ctx, label, puX + 28, puY + 10, {
          font: 'bold 10px monospace', color, align: 'center', baseline: 'middle',
        });
        if (ap.timer !== Infinity && ap.duration !== Infinity) {
          ui.drawHealthBar(ctx, puX + 2, puY + 18, 52, 3,
            ap.timer, ap.duration,
            { fillColor: color, bgColor: '#111111', borderWidth: 0 });
        }
        puX += 62;
      }

      // FPS
      ui.drawText(ctx, `FPS: ${engine.fps}`, W - 70, H - 14, {
        font: '11px monospace', color: '#333',
      });
    }
  }

  // ── GameOverScene ─────────────────────────────────────────────────────────

  class GameOverScene extends GF.Scene {
    init(engine) {
      this._t     = 0;
      this._alpha = { v: 0 };
      this._pulse = { v: 1 };
      engine.getSystem('TweenSystem').create(this._alpha, { v: 1 }, 0.8, { ease: 'outCubic' });
      engine.getSystem('TweenSystem').create(this._pulse, { v: 0.2 }, 0.7,
        { ease: 'inOutSine', loop: true, yoyo: true });
      engine.input.bind('fire', ...CFG().controls.fire);
    }

    update(dt, engine) {
      this._t += dt;
      if (this._t > 1.5 && engine.input.wasPressed('fire')) {
        engine.getSystem('SceneManager').replace(new TitleScene(), engine);
      }
    }

    render(ctx, engine) {
      const W  = engine.config.width;
      const H  = engine.config.height;
      const ui = GF.UISystem;

      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(0, 0, W, H);

      ctx.globalAlpha = this._alpha.v;

      ui.drawPanel(ctx, W/2 - 180, H/2 - 100, 360, 200, {
        bgColor: 'rgba(30,0,0,0.95)', borderColor: '#ff2222', borderWidth: 2, radius: 10,
      });

      ui.drawText(ctx, 'GAME OVER', W/2, H/2 - 55, {
        font: 'bold 40px monospace', color: '#ff2222',
        align: 'center', baseline: 'middle', glow: '#ff0000', glowBlur: 20,
      });

      ui.drawText(ctx, `SCORE  ${String(State.score).padStart(6,'0')}`, W/2, H/2 - 8, {
        font: '20px monospace', color: '#ffffff', align: 'center', baseline: 'middle',
      });

      ui.drawText(ctx, `HI-SCORE  ${String(State.hiScore).padStart(6,'0')}`, W/2, H/2 + 22, {
        font: '18px monospace', color: '#ffcc00', align: 'center', baseline: 'middle',
      });

      ui.drawText(ctx, `LEVEL REACHED: ${State.level}`, W/2, H/2 + 50, {
        font: '14px monospace', color: '#888', align: 'center', baseline: 'middle',
      });

      ctx.globalAlpha = this._alpha.v * this._pulse.v;
      ui.drawText(ctx, 'PRESS SPACE TO PLAY AGAIN', W/2, H/2 + 85, {
        font: '14px monospace', color: '#ffffff', align: 'center', baseline: 'middle',
      });

      ctx.globalAlpha = 1;
    }
  }

  // ── Bootstrap ─────────────────────────────────────────────────────────────

  window.addEventListener('GF:ready', async function () {
    const spriteMap = {};
    if (GF.spriteRegistrations) {
      Object.values(GF.spriteRegistrations).forEach(map => Object.assign(spriteMap, map));
    }

    const game = await GF.createGameAsync(
      CFG().engine,
      CFG().physics,
      {
        setup(loader, game) {
          game.sprites.registerSprites(spriteMap);
        },
      }
    );

    const { engine, scenes } = game;
    scenes.push(new TitleScene(), engine);
    engine.start();
  });

})(window.GF = window.GF || {});
