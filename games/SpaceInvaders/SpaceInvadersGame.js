// GameFramework/games/SpaceInvaders/SpaceInvadersGame.js
// Showcases: Engine, SpriteSystem, PhysicsSystem, UISystem, ParticleSystem,
//            TweenSystem (transitions, tweens, chains), AudioSystem,
//            SceneManager, EventBus, InputManager, MathUtils
// Features: powerups (rapidFire / doubleShot / shield), zoom-in on level clear,
//           iris scene transition between levels.

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
  }

  // ── Shared game state ─────────────────────────────────────────────────────

  const State = {
    score     : 0,
    hiScore   : 0,
    lives     : 3,
    level     : 1,
    extraGiven: false,
  };

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

      // Scrolling starfield
      ctx.save();
      ctx.globalAlpha = 0.6;
      for (let i = 0; i < 80; i++) {
        const sx = GF.Math.wrap(i * 97.3, 0, W);
        const sy = GF.Math.wrap(i * 61.7 + this._t * (10 + i % 20), 0, H);
        const sz = (i % 3) + 1;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx, sy, sz, sz);
      }
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = this._alpha.v;

      // Title panel
      ui.drawPanel(ctx, W/2 - 180, 90, 360, 80, {
        bgColor: 'rgba(0,20,40,0.85)', borderColor: '#00e5ff', borderWidth: 2, radius: 8,
      });
      ui.drawText(ctx, 'SPACE INVADERS', W/2, 118, {
        font: 'bold 36px monospace', color: '#00e5ff',
        align: 'center', baseline: 'middle', glow: '#00e5ff', glowBlur: 18,
      });

      // Hi-score
      ui.drawText(ctx, `HI-SCORE  ${State.hiScore}`, W/2, 200, {
        font: '18px monospace', color: '#ffcc00', align: 'center', baseline: 'middle',
      });

      // Alien score guide
      const alienTypes = [
        { sprite: 'alienSquid',   pts: '= 30 PTS' },
        { sprite: 'alienCrab',    pts: '= 20 PTS' },
        { sprite: 'alienOctopus', pts: '= 10 PTS' },
        { sprite: 'alienUFO',     pts: '= ??? PTS' },
      ];
      alienTypes.forEach((t, i) => {
        const sy = 240 + i * 34;
        engine.getSystem('SpriteSystem').drawFrame(ctx, t.sprite, 'idle', 0, W/2 - 60, sy + 12, false);
        ui.drawText(ctx, t.pts, W/2 - 28, sy + 4, { font: '14px monospace', color: '#ffffff' });
      });

      // Powerup legend
      ui.drawPanel(ctx, W/2 - 160, 388, 320, 54, {
        bgColor: 'rgba(0,10,30,0.75)', borderColor: '#444', radius: 4,
      });
      ui.drawText(ctx, 'POWERUPS', W/2, 400, {
        font: '11px monospace', color: '#666', align: 'center', baseline: 'middle',
      });
      const puTypes = [
        { sprite: 'powerupRapidFire',  label: '3× FIRE' },
        { sprite: 'powerupDoubleShot', label: 'TWIN SHOT' },
        { sprite: 'powerupShield',     label: 'SHIELD' },
      ];
      puTypes.forEach((pt, i) => {
        const px = W/2 - 100 + i * 100;
        engine.getSystem('SpriteSystem').drawFrame(ctx, pt.sprite, 'idle', 0, px, 425, false);
        ui.drawText(ctx, pt.label, px + 14, 421, {
          font: '10px monospace', color: '#aaa', baseline: 'middle',
        });
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
      ];

      // Viewport state — tweened during level-complete zoom
      this._viewport = {
        scale: 1,
        cx   : cfg.engine.width  / 2,
        cy   : cfg.engine.height / 2,
      };

      this._transition = null; // active TransitionHandle (if any)

      this._initLevel();
    }

    _initLevel() {
      const cfg = CFG();
      const W   = cfg.engine.width;
      const H   = cfg.engine.height;

      this._paused    = false;
      this._gameOver  = false;
      this._levelDone = false;

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
      this._activePowerups = {}; // { type: { timer } }

      // ── Aliens ──
      this._buildAlienGrid();
      this._alienDir      = 1;
      this._alienBullets  = [];
      this._alienFireTimer= 0;
      this._marchStep     = 0;
      this._marchTimer    = 0;
      this._marchInterval = 0.8;

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
    }

    // ── Event handlers ─────────────────────────────────────────────────────

    _onAlienKilled(data) {
      State.score += data.points;
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
          count: 28, colors: ['#4488ff', '#88aaff', '#ffffff'],
          speed: [60, 220], life: [0.3, 0.8], size: [2, 7],
          fadeOut: true, shape: 'square',
        });
        this._showFloatingText('SHIELD BLOCKED!', px, py - 30, '#4488ff');
        return;
      }

      State.lives--;
      this._audio.play('playerDie');
      const px = this._playerBody.x + this._playerBody.width  / 2;
      const py = this._playerBody.y + this._playerBody.height / 2;
      this._particles.burst(px, py, {
        count: 40, colors: ['#00e5ff', '#ffffff', '#88ccff', '#ffaa00'],
        speed: [60, 250], life: [0.4, 1.0], size: [3, 8],
        gravity: 80, fadeOut: true, shrink: true, shape: 'star',
      });
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
    //
    // Timeline:
    //   0.0 s  _onLevelComplete fires — State.level++, banner fades in, victory burst
    //   0.0 s  Viewport tweens: scale 1 → 2.8, cx/cy → player center (1.1 s)
    //   1.1 s  Zoom complete → iris transition starts (0.9 s total)
    //   1.55 s iris midpoint (screen fully covered) → reset viewport, rebuild level
    //   2.0 s  iris finishes → _levelDone = false, gameplay resumes

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
        count: 55, colors: ['#00e5ff', '#ffffff', '#ffff00', '#ff5500'],
        speed: [60, 280], life: [0.8, 2.2], size: [3, 7],
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
              this._playerBullets = [];
              this._alienBullets  = [];
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
    }

    // ── Powerup system ─────────────────────────────────────────────────────

    _activatePowerup(type) {
      const cfg = CFG().powerups;
      if (type === 'shield') {
        this._activePowerups.shield = { timer: Infinity }; // lasts until hit
      } else {
        this._activePowerups[type] = { timer: cfg.duration };
      }
      this._audio.play('powerup');
      const px = this._playerBody.x + this._playerBody.width  / 2;
      const py = this._playerBody.y + this._playerBody.height / 2;
      const labels = { rapidFire: 'RAPID FIRE!', doubleShot: 'TWIN SHOT!', shield: 'SHIELD UP!' };
      const colors = { rapidFire: '#ff5500', doubleShot: '#ffcc00', shield: '#4488ff' };
      this._showFloatingText(labels[type] || type.toUpperCase(), px, py - 30, colors[type] || '#ffffff');
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
            count: 22, colors: [pu.color, '#ffffff', '#ffff88'],
            speed: [50, 160], life: [0.2, 0.7], size: [2, 5],
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
            this._showFloatingText(
              type === 'rapidFire' ? 'RAPID FIRE ENDED' : 'TWIN SHOT ENDED',
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
      this._updateAliens(dt);
      this._updateBullets(dt);
      this._updateUFO(dt);
      this._updatePowerups(dt);
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
      const fireRate = this._activePowerups.rapidFire ? pc.fireRate * 0.28 : pc.fireRate;
      this._fireTimer -= dt;

      if (engine.input.isDown('fire') && this._fireTimer <= 0) {
        this._fireTimer = fireRate;
        const bx = body.x + body.width / 2;
        const by = body.y;

        const spawnBullet = (offsetX) => {
          const bBody = this._physics.addBody(new GF.PhysicsBody({
            x: bx + offsetX - 2, y: by - 12,
            width: 4, height: 12,
            gravityScale: 0, friction: 1,
            maxSpeedX: 0, maxSpeedY: pc.bulletSpeed * 2,
            tag: 'playerBullet',
          }));
          bBody.vy = -pc.bulletSpeed;
          this._playerBullets.push({
            body: bBody,
            anim: this._sprites.createAnimator('playerBullet', 'idle'),
          });
        };

        spawnBullet(0);                              // center bullet (always)
        if (this._activePowerups.doubleShot) {
          spawnBullet(-12);                          // left wing bullet
          spawnBullet(+12);                          // right wing bullet
        }

        this._audio.play('shoot');
        this._particles.burst(bx, by - 6, {
          count: 6, colors: ['#ffffff', '#00e5ff'],
          speed: [40, 100], life: [0.05, 0.12], size: [1, 3],
          fadeOut: true, direction: -Math.PI / 2, spread: 0.4,
        });
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

    _updateBullets(dt) {
      const H = CFG().engine.height;
      this._playerBullets = this._playerBullets.filter(b => {
        b.anim.update(dt);
        if (b.body.y + b.body.height < 0) { this._physics.removeBody(b.body); return false; }
        return true;
      });
      this._alienBullets = this._alienBullets.filter(b => {
        b.anim.update(dt);
        if (b.body.y > H) { this._physics.removeBody(b.body); return false; }
        return true;
      });
    }

    _updateUFO(dt) {
      const cfg = CFG().ufo;
      const W   = CFG().engine.width;
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
      const alive   = this._aliens.filter(a => a.alive);
      const puCfg   = CFG().powerups;

      // ── Player bullets vs aliens ──
      for (let i = this._playerBullets.length - 1; i >= 0; i--) {
        const pb = this._playerBullets[i];
        let hit = false;

        for (let j = 0; j < alive.length; j++) {
          const alien = alive[j];
          const ax = alien.x - 14, ay = alien.y - 20, aw = 28, ah = 20;
          if (GF.Math.rectsOverlap(pb.body.x, pb.body.y, pb.body.width, pb.body.height, ax, ay, aw, ah)) {
            alien.alive = false;
            this._alienCount--;
            this._audio.play('alienDie');
            engine.events.emit('alien:killed', { points: alien.points });

            // Explosion particles
            this._particles.burst(alien.x, alien.y - 10, {
              count: 18, colors: [alien.color, '#ffffff', '#ffff00'],
              speed: [40, 180], life: [0.2, 0.6], size: [2, 6],
              fadeOut: true, shrink: true, shape: 'square',
            });
            this._showFloatingText(`+${alien.points}`, alien.x, alien.y - 20, alien.color);

            // Random powerup drop
            if (Math.random() < puCfg.dropChance) {
              const typeDef = puCfg.types[Math.floor(Math.random() * puCfg.types.length)];
              this._powerups.push({
                x   : alien.x,
                y   : alien.y,
                type: typeDef.type,
                color: typeDef.color,
                anim: this._sprites.createAnimator(typeDef.sprite, 'idle'),
              });
            }

            this._physics.removeBody(pb.body);
            this._playerBullets.splice(i, 1);
            hit = true;
            break;
          }
        }
        if (hit) continue;

        // Player bullet vs UFO
        if (this._ufo) {
          const ux = this._ufo.x - 20, uy = this._ufo.y - 16, uw = 40, uh = 16;
          if (GF.Math.rectsOverlap(pb.body.x, pb.body.y, pb.body.width, pb.body.height, ux, uy, uw, uh)) {
            const pts = GF.Math.randChoice(CFG().ufo.points);
            State.score += pts;
            engine.events.emit('ufo:destroyed', { points: pts, x: this._ufo.x, y: this._ufo.y });
            this._particles.burst(this._ufo.x, this._ufo.y - 8, {
              count: 30, colors: ['#ff2222','#ff8800','#ffff00','#ffffff'],
              speed: [80, 280], life: [0.3, 0.9], size: [3, 9],
              fadeOut: true, shrink: true, shape: 'star', gravity: -30,
            });
            this._ufo = null;
            this._physics.removeBody(pb.body);
            this._playerBullets.splice(i, 1);
            continue;
          }
        }

        // Player bullet vs bunkers
        for (let k = 0; k < this._bunkers.length; k++) {
          const bk = this._bunkers[k];
          if (bk.health <= 0) continue;
          if (GF.Math.rectsOverlap(pb.body.x, pb.body.y, pb.body.width, pb.body.height, bk.x, bk.y, bk.w, bk.h)) {
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

      // ── Level complete? ──
      if (this._alienCount <= 0 && !this._levelDone) {
        engine.events.emit('level:complete');
      }
    }

    // ── Render ─────────────────────────────────────────────────────────────
    //
    // Layer order:
    //   1. World content — rendered under the viewport zoom transform
    //   2. HUD            — always in screen-space, unaffected by zoom
    //   3. Transition overlay (iris) — on top of everything

    render(ctx, engine) {
      const cfg = CFG();
      const W   = cfg.engine.width;
      const H   = cfg.engine.height;
      const vp  = this._viewport;

      // ── 1. Apply viewport zoom transform ──
      ctx.save();
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

      // ── 3. Iris transition overlay ──
      if (this._transition) {
        this._transition.render(ctx, W, H);
      }
    }

    _renderWorld(ctx, engine, W, H) {
      const cfg = CFG();
      const ui  = GF.UISystem;
      const t   = Date.now() / 1000; // time for sinusoidal effects

      // ── Starfield ──
      ctx.save();
      ctx.globalAlpha = 0.4;
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = '#ffffff';
        const sx = GF.Math.wrap(i * 113.7, 0, W);
        const sy = GF.Math.wrap(i * 79.3,  0, H);
        ctx.fillRect(sx, sy, 1 + (i % 2), 1 + (i % 2));
      }
      ctx.restore();

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
        ctx.shadowBlur   = 6;
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // ── Aliens ──
      this._aliens.forEach(a => {
        if (!a.alive) return;
        a.animator.draw(ctx, a.x, a.y);
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
          // Outer ring
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
        b.anim.draw(ctx, b.body.x + b.body.width / 2, b.body.y + b.body.height);
      });
      this._alienBullets.forEach(b => {
        b.anim.draw(ctx, b.body.x + b.body.width / 2, b.body.y + b.body.height);
      });

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
        ui.drawText(ctx, `LEVEL  ${State.level}`, W/2, this._banner.y, {
          font: 'bold 22px monospace', color: '#00e5ff',
          align: 'center', baseline: 'middle', glow: '#00e5ff', glowBlur: 12,
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
      for (let i = 0; i < State.lives; i++) {
        engine.getSystem('SpriteSystem').drawFrame(ctx, 'playerShip', 'idle', 0, W - 72 + i * 22, 36, false);
      }

      // Alien count
      ui.drawText(ctx, `ALIENS: ${this._alienCount}`, 16, 36, {
        font: '12px monospace', color: '#88ff88',
      });

      // ── Active powerup indicators (bottom-left) ──
      const puColorMap = { rapidFire: '#ff5500', doubleShot: '#ffcc00', shield: '#4488ff' };
      const puLabelMap = { rapidFire: 'RAPID', doubleShot: 'TWIN', shield: 'SHIELD' };
      let puX = 16;
      const puY = H - 36;

      for (const [type, ap] of Object.entries(this._activePowerups)) {
        const color = puColorMap[type] || '#ffffff';
        const label = puLabelMap[type] || type;
        ui.drawPanel(ctx, puX, puY, 52, 22, {
          bgColor: color + '22', borderColor: color, radius: 3, borderWidth: 1,
        });
        ui.drawText(ctx, label, puX + 26, puY + 10, {
          font: 'bold 10px monospace', color, align: 'center', baseline: 'middle',
        });
        if (ap.timer !== Infinity) {
          ui.drawHealthBar(ctx, puX + 2, puY + 18, 48, 3,
            ap.timer, cfg.powerups.duration,
            { fillColor: color, bgColor: '#111111', borderWidth: 0 });
        }
        puX += 58;
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
