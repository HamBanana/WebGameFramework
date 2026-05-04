// GameFramework/games/HappyPup/HappyPupGame.js
// Happy Pup — a side-scrolling "make everyone happy by licking faces" game.
// Showcases: Engine, SpriteSystem, PhysicsSystem, Camera, UISystem,
//            ParticleSystem, TweenSystem, AudioSystem, SceneManager,
//            EventBus, InputManager, MathUtils.

(function (GF) {
  'use strict';

  const CFG = () => GF.GAME_CONFIG;

  // ── Procedural audio ─────────────────────────────────────────────────────

  function makeToneBuffer(audioCtx, freq, duration, type, env) {
    const sr     = audioCtx.sampleRate;
    const len    = Math.floor(sr * duration);
    const buffer = audioCtx.createBuffer(1, len, sr);
    const data   = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      let sample = 0;
      const f = freq + (env.sweep || 0) * t;
      if (type === 'square') {
        sample = Math.sin(2 * Math.PI * f * t) > 0 ? 1 : -1;
      } else if (type === 'noise') {
        sample = Math.random() * 2 - 1;
      } else if (type === 'tri') {
        const phase = (f * t) % 1;
        sample = 4 * Math.abs(phase - 0.5) - 1;
      } else {
        sample = Math.sin(2 * Math.PI * f * t);
      }
      const attack  = env.attack  || 0.01;
      const release = env.release || duration;
      let amp = 1;
      if (t < attack) amp = t / attack;
      else            amp = Math.max(0, 1 - (t - attack) / Math.max(0.001, release - attack));
      data[i] = sample * amp * (env.volume || 0.3);
    }
    return buffer;
  }

  function setupAudio(audio) {
    audio._ensureContext();
    const ctx = audio._ctx;
    if (!ctx) return;

    audio.register('jump',    makeToneBuffer(ctx, 380, 0.16, 'sine',   { attack: 0.005, release: 0.16, sweep:  500, volume: 0.25 }));
    audio.register('land',    makeToneBuffer(ctx, 110, 0.10, 'noise',  { attack: 0.005, release: 0.10, volume: 0.18 }));
    audio.register('lick',    makeToneBuffer(ctx, 520, 0.14, 'tri',    { attack: 0.005, release: 0.14, sweep:  360, volume: 0.28 }));
    audio.register('happy',   makeToneBuffer(ctx, 660, 0.30, 'sine',   { attack: 0.005, release: 0.30, sweep:  280, volume: 0.30 }));
    audio.register('bark',    makeToneBuffer(ctx, 240, 0.10, 'square', { attack: 0.005, release: 0.10, sweep: -160, volume: 0.22 }));
    audio.register('victory', makeToneBuffer(ctx, 440, 0.80, 'sine',   { attack: 0.02,  release: 0.80, sweep:  220, volume: 0.34 }));
  }

  // ── Helper: capture system refs in one place ────────────────────────────

  function captureSystems(scene, engine) {
    scene.sprites   = engine.getSystem('SpriteSystem');
    scene.physics   = engine.getSystem('PhysicsSystem');
    scene.audio     = engine.getSystem('AudioSystem');
    scene.particles = engine.getSystem('ParticleSystem');
    scene.tweens    = engine.getSystem('TweenSystem');
    scene.scenes    = engine.getSystem('SceneManager');
    scene.ui        = GF.UISystem;
  }

  // ── Shared state ─────────────────────────────────────────────────────────

  const State = {
    happyCount: 0,
    totalNpcs:  0,
    timeMs:     0,
    bestTimeMs: null,
  };

  // ── Helpers ──────────────────────────────────────────────────────────────

  function formatTime(ms) {
    const total = Math.max(0, Math.floor(ms / 100) / 10); // tenths
    const m = Math.floor(total / 60);
    const s = (total - m * 60).toFixed(1);
    return `${m}:${s.padStart(4, '0')}`;
  }

  function drawSky(ctx, W, H) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0,   '#7ec0ee');
    grad.addColorStop(0.6, '#bfe4ff');
    grad.addColorStop(1,   '#e8f6ff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  function drawCloud(ctx, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.arc(-18, 4, 14, 0, GF.Math.TAU);
    ctx.arc(  0, -4, 18, 0, GF.Math.TAU);
    ctx.arc( 18, 4, 14, 0, GF.Math.TAU);
    ctx.arc(  0, 8, 18, 0, GF.Math.TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(180,210,235,0.5)';
    ctx.beginPath();
    ctx.ellipse(-2, 12, 18, 4, 0, 0, GF.Math.TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawGround(ctx, camera, world, floorY, W) {
    const left  = camera.x - 20;
    const right = camera.x + W + 20;
    // Distant hills first (they sit behind the grass band)
    drawHills(ctx, camera.x, floorY, W);

    // Grass
    ctx.fillStyle = world.groundColor;
    ctx.fillRect(left, floorY, right - left, 9999);
    // Top grass band
    ctx.fillStyle = world.groundShadow;
    ctx.fillRect(left, floorY + 4, right - left, 4);
    ctx.fillStyle = '#7ed47a';
    ctx.fillRect(left, floorY, right - left, 3);
    // Path strip running along the foreground
    ctx.fillStyle = world.pathColor;
    ctx.fillRect(left, floorY + 22, right - left, 26);
    // Path edges
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.fillRect(left, floorY + 22, right - left, 2);
    ctx.fillRect(left, floorY + 46, right - left, 2);
    // Path stones — deterministic by integer x (so they don't shimmer)
    ctx.fillStyle = '#a89070';
    const stoneStart = Math.floor(left / 40) * 40;
    for (let x = stoneStart; x < right; x += 40) {
      ctx.fillRect(x + 4, floorY + 32, 6, 4);
      ctx.fillRect(x + 22, floorY + 38, 8, 4);
    }
  }

  function drawHills(ctx, camX, floorY, W) {
    // Far hills
    const par = camX * 0.35;
    ctx.fillStyle = '#84b074';
    ctx.beginPath();
    ctx.moveTo(camX - 100, floorY);
    for (let x = -100; x < W + 200; x += 20) {
      const wx = camX + x - (par % 200);
      const h = 30 + Math.sin((wx + par * 0.1) * 0.012) * 18 + Math.sin(wx * 0.04) * 6;
      ctx.lineTo(wx, floorY - h);
    }
    ctx.lineTo(camX + W + 200, floorY);
    ctx.closePath();
    ctx.fill();

    // Closer hills
    const par2 = camX * 0.6;
    ctx.fillStyle = '#6aa15b';
    ctx.beginPath();
    ctx.moveTo(camX - 100, floorY);
    for (let x = -100; x < W + 200; x += 24) {
      const wx = camX + x - (par2 % 240);
      const h = 18 + Math.sin((wx + par2 * 0.2) * 0.018) * 14 + Math.cos(wx * 0.03) * 5;
      ctx.lineTo(wx, floorY - h);
    }
    ctx.lineTo(camX + W + 200, floorY);
    ctx.closePath();
    ctx.fill();
  }

  // Per-frame heart icon for the HUD
  function drawHeartIcon(ctx, x, y, size, color, shadow) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 12, size / 12);
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.moveTo(0, 1);
    ctx.bezierCurveTo(-7, -5, -8,  3, 0, 8);
    ctx.bezierCurveTo( 8,  3,  7, -5, 0, 1);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-6, -5, -7,  2, 0, 7);
    ctx.bezierCurveTo( 6,  2,  6, -5, 0, 0);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(-2, -1, 1.6, 0.9, -0.5, 0, GF.Math.TAU);
    ctx.fill();
    ctx.restore();
  }

  // ── TitleScene ───────────────────────────────────────────────────────────

  class TitleScene extends GF.Scene {
    init(engine) {
      captureSystems(this, engine);
      this.t = 0;
      this.dogAnim = this.sprites.createAnimator('pupDog', 'idle');

      // Idle clouds drifting on the title
      this.clouds = [];
      for (let i = 0; i < 6; i++) {
        this.clouds.push({
          x: Math.random() * engine.config.width,
          y: 60 + Math.random() * 80,
          v: 8 + Math.random() * 12,
          s: 0.7 + Math.random() * 0.6,
        });
      }

      // Pulse the prompt
      this.pulse = { v: 1 };
      this.tweens.create(
        this.pulse, { v: 0.35 }, 0.8,
        { ease: 'inOutSine', loop: true, yoyo: true }
      );

      // Bind start input fresh in case we returned from another scene
      const c = CFG().controls;
      engine.input.bind('start', ...c.start);
    }

    update(dt, engine) {
      this.t += dt;
      this.dogAnim.update(dt);

      const W = engine.config.width;
      for (const c of this.clouds) {
        c.x += c.v * dt;
        if (c.x - 60 > W) c.x = -80;
      }

      if (engine.input.wasPressed('start')) {
        State.happyCount = 0;
        State.timeMs = 0;
        if (this.audio) this.audio.play('bark');
        this.scenes.replaceWithTransition(new GameplayScene(), {
          type: 'fade', duration: 0.6, color: '#0c0e16',
        });
      }
    }

    render(ctx, engine) {
      const W = engine.config.width;
      const H = engine.config.height;
      drawSky(ctx, W, H);

      for (const c of this.clouds) drawCloud(ctx, c.x, c.y, c.s);

      // Sun
      ctx.save();
      const sun = ctx.createRadialGradient(W - 90, 80, 6, W - 90, 80, 90);
      sun.addColorStop(0,   'rgba(255,236,170,1)');
      sun.addColorStop(0.4, 'rgba(255,210,120,0.6)');
      sun.addColorStop(1,   'rgba(255,210,120,0)');
      ctx.fillStyle = sun;
      ctx.beginPath();
      ctx.arc(W - 90, 80, 90, 0, GF.Math.TAU);
      ctx.fill();
      ctx.restore();

      // Floor on the title screen
      ctx.fillStyle = '#6cbf5f';
      ctx.fillRect(0, H - 60, W, 60);
      ctx.fillStyle = '#3f8a3a';
      ctx.fillRect(0, H - 56, W, 4);

      // Title plate
      this.ui.drawPanel(ctx, W/2 - 240, 70, 480, 96, {
        bgColor: 'rgba(255,255,255,0.85)',
        borderColor: '#ff5d8f',
        borderWidth: 3,
        radius: 14,
      });
      this.ui.drawText(ctx, 'HAPPY PUP', W/2, 102, {
        font: 'bold 48px "Trebuchet MS", system-ui, sans-serif',
        color: '#c43a6c',
        align: 'center', baseline: 'middle',
        shadow: true,
        glow: '#ff8fb1', glowBlur: 18,
      });
      this.ui.drawText(ctx, 'Make everyone in the park smile.', W/2, 142, {
        font: '16px "Trebuchet MS", system-ui, sans-serif',
        color: '#553344',
        align: 'center', baseline: 'middle',
      });

      // Dog idling on grass
      this.dogAnim.draw(ctx, W/2, H - 60);

      // Heart trailing above the pup
      const hy = H - 110 + Math.sin(this.t * 3) * 5;
      drawHeartIcon(ctx, W/2 + 28, hy, 16, '#ff5d8f', '#a83560');

      // Hint
      ctx.save();
      ctx.globalAlpha = this.pulse.v;
      this.ui.drawText(ctx, 'PRESS ENTER TO START', W/2, H - 130, {
        font: 'bold 18px "Trebuchet MS", monospace',
        color: '#222',
        align: 'center', baseline: 'middle',
        shadow: true,
      });
      ctx.restore();

      // Controls strip
      this.ui.drawText(ctx, 'A / D — run        SPACE — jump', W/2, H - 90, {
        font: '13px monospace',
        color: 'rgba(0,0,0,0.65)',
        align: 'center', baseline: 'middle',
      });
    }

    destroy(engine) {
      if (this.tweens) this.tweens.killAll(this.pulse);
    }
  }

  // ── GameplayScene ────────────────────────────────────────────────────────

  class GameplayScene extends GF.Scene {

    init(engine) {
      captureSystems(this, engine);
      const cfg = CFG();

      // Dog physics body (top-left position; framework integrates gravity)
      this.body = new GF.PhysicsBody({
        x: cfg.dog.startX,
        y: cfg.dog.startY,
        width:  cfg.dog.width,
        height: cfg.dog.height,
        gravityScale: 1,
        maxSpeedX: cfg.dog.speed * 1.3,
        maxSpeedY: 1600,
        friction:  cfg.dog.friction,
        tag: 'dog',
      });
      this.physics.addBody(this.body);

      this.anim = this.sprites.createAnimator('pupDog', 'idle');
      this.facing = 1;
      this.lickTimer = 0;
      this.lickCooldown = 0;
      this.wasGrounded = true;

      // NPCs: array of { x, variant, anim, happy, feetY }
      this.npcs = cfg.npc.placements.map(p => ({
        x: p.x,
        variant: p.variant,
        anim: this.sprites.createAnimator(p.variant, 'sad'),
        happy: false,
        feetY: cfg.npc.feetY,
      }));
      State.totalNpcs = this.npcs.length;

      // Camera
      this.camera = new GF.Camera({
        width:       engine.config.width,
        height:      engine.config.height,
        worldWidth:  cfg.world.width,
        worldHeight: engine.config.height,
        lerp:        cfg.camera.lerp,
      });
      // Camera.follow expects { x, y, width?, height? } and centres on
      // x + width/2.  PhysicsBody exposes those properties directly.
      this.camera.follow(this.body, 0, cfg.camera.followOffsetY);
      this.camera.snapTo(
        this.body.centerX,
        this.body.centerY + cfg.camera.followOffsetY,
      );

      // Drifting clouds (scene-local, not stored in config)
      this.clouds = cfg.scenery.clouds.map(c => ({
        x: c.x, y: c.y, scale: c.scale,
        v: 6 + Math.random() * 8,
      }));

      // Win flag — gameplay continues after; on first all-happy we trigger transition.
      this.completed = false;
      this._victoryQueued = false;

      // Listen for NPC happy event for sound + heart particle burst
      this._offHappy = engine.events.on('hp:npcHappy', ({ x, y }) => {
        if (this.audio) this.audio.play('happy');
        if (this.particles) {
          this.particles.burst(x, y - 60, {
            count: 26,
            colors: ['#ff5d8f', '#ffb3c8', '#fff7a8', '#ffe066', '#ffffff'],
            speed: [80, 220],
            size:  [3, 7],
            life:  [0.5, 1.1],
            gravity: 200,
            fadeOut: true,
            shrink:  true,
            shape:   'circle',
          });
        }
      });

      // Apply level walls so the dog can't run past world edges
      this.physics.leftWall  = 0;
      this.physics.rightWall = cfg.world.width;
      this.physics.floorY    = cfg.physics.floorY;
    }

    enter(engine) {
      const c = CFG().controls;
      engine.input
        .bind('left',  ...c.left)
        .bind('right', ...c.right)
        .bind('jump',  ...c.jump);
    }

    update(dt, engine) {
      State.timeMs += dt * 1000;
      const cfg = CFG();
      const body = this.body;
      const input = engine.input;

      this.lickCooldown = Math.max(0, this.lickCooldown - dt);
      this.lickTimer    = Math.max(0, this.lickTimer    - dt);

      // Movement
      const left  = input.isDown('left');
      const right = input.isDown('right');
      const moving = left !== right;
      if (left)  { body.vx = -cfg.dog.speed; this.facing = -1; }
      if (right) { body.vx =  cfg.dog.speed; this.facing =  1; }

      if (input.wasPressed('jump') && body.grounded) {
        body.vy = -cfg.dog.jumpPower;
        if (this.audio) this.audio.play('jump');
        engine.events.emit('hp:jump', { x: body.centerX, y: body.bottom });
      }

      // Choose animation
      if (this.lickTimer > 0) {
        this.anim.play('lick');
      } else if (!body.grounded) {
        this.anim.play('jump');
      } else if (moving) {
        this.anim.play('run');
      } else {
        this.anim.play('idle');
      }
      this.anim.flipX = this.facing < 0;
      this.anim.update(dt);

      // Land sound + dust
      if (!this.wasGrounded && body.grounded) {
        if (this.audio) this.audio.play('land');
        if (this.particles) {
          this.particles.burst(body.centerX, body.bottom, {
            count: 8,
            colors: ['#cdb37a', '#a88c52'],
            speed: [40, 120],
            direction: -Math.PI / 2,
            spread: 1.4,
            size: [2, 4],
            life: [0.2, 0.45],
            gravity: 240,
            fadeOut: true,
            shape: 'circle',
          });
        }
      }
      this.wasGrounded = body.grounded;

      // Drift clouds across the world
      for (const c of this.clouds) {
        c.x += c.v * dt;
        if (c.x - 80 > cfg.world.width) c.x = -80;
      }

      // NPC update + face-overlap detection
      for (const npc of this.npcs) {
        npc.anim.update(dt);
        if (npc.happy) continue;

        const fx = npc.x;
        const fy = npc.feetY - cfg.npc.headOffsetY;
        const fw = cfg.npc.faceBoxW;
        const fh = cfg.npc.faceBoxH;
        const faceLeft = fx - fw / 2;
        const faceTop  = fy - fh / 2;

        // Dog's "lick reach" is the dog body extended upward.
        const dogLeft = body.x;
        const dogTop  = body.y - cfg.dog.lickReach;
        const dogW    = body.width;
        const dogH    = body.height + cfg.dog.lickReach;

        const overlap = GF.Math.rectsOverlap(
          dogLeft, dogTop, dogW, dogH,
          faceLeft, faceTop, fw, fh
        );

        if (overlap && this.lickCooldown <= 0) {
          this.makeHappy(npc, engine);
        }
      }

      // Camera follow (camera is not registered as an engine system; drive it manually)
      this.camera.update(dt);

      // Win check
      if (!this.completed && State.happyCount >= State.totalNpcs) {
        this.completed = true;
        if (State.bestTimeMs == null || State.timeMs < State.bestTimeMs) {
          State.bestTimeMs = State.timeMs;
        }
        if (this.audio) this.audio.play('victory');
        // Schedule scene swap after a short on-screen celebration
        this._victoryAt = this.timeAccumulator || 0;
        this._victoryDelay = 1.2;
        this._victoryQueued = true;
      }

      // Burst confetti during the celebration window
      if (this._victoryQueued) {
        this._victoryDelay -= dt;
        if (this.particles && Math.random() < 0.7) {
          this.particles.burst(
            this.camera.x + GF.Math.rand(0, engine.config.width),
            GF.Math.rand(40, 200),
            {
              count: 18,
              colors: ['#ff5d8f', '#ffb3c8', '#fff7a8', '#ffe066', '#7ec8ff'],
              speed: [60, 200],
              size: [3, 7],
              life: [0.6, 1.2],
              gravity: 180,
              fadeOut: true,
            }
          );
        }
        if (this._victoryDelay <= 0) {
          this._victoryQueued = false;
          this.scenes.replaceWithTransition(new WinScene(), {
            type: 'fade', duration: 0.8, color: '#fff7e7',
          });
        }
      }
    }

    makeHappy(npc, engine) {
      const cfg = CFG();
      npc.happy = true;
      npc.anim = this.sprites.createAnimator(npc.variant, 'happy');
      State.happyCount += 1;

      this.lickTimer    = 0.34;
      this.lickCooldown = cfg.dog.lickCooldown;

      if (this.audio) this.audio.play('lick');
      engine.events.emit('hp:npcHappy', {
        x: npc.x,
        y: npc.feetY,
      });
    }

    render(ctx, engine) {
      const W = engine.config.width;
      const H = engine.config.height;
      const cfg = CFG();

      // Sky (independent of camera)
      drawSky(ctx, W, H);

      // World rendering
      this.camera.begin(ctx);

      // Background clouds
      for (const c of this.clouds) {
        if (this.camera.isVisible(c.x - 60, c.y - 30, 120, 60)) {
          drawCloud(ctx, c.x, c.y, c.scale);
        }
      }

      // Distant hills + ground
      drawGround(ctx, this.camera, cfg.world, cfg.physics.floorY, W);

      // Scenery props
      for (const prop of cfg.scenery.props) {
        if (!this.camera.isVisible(prop.x - 60, cfg.physics.floorY - 160, 120, 200)) continue;
        this.sprites.drawFrame(ctx, prop.sprite, 'idle', 0, prop.x, cfg.physics.floorY, !!prop.flip);
      }

      // NPCs
      for (const npc of this.npcs) {
        if (!this.camera.isVisible(npc.x - 30, npc.feetY - 84, 60, 90)) continue;
        npc.anim.draw(ctx, npc.x, npc.feetY);
      }

      // Dog
      this.anim.draw(ctx, this.body.centerX, this.body.bottom);

      this.camera.end(ctx);

      // ── HUD (screen-space) ─────────────────────────────────────────────
      this.ui.drawPanel(ctx, 12, 12, 270, 56, {
        bgColor: cfg.hud.barBg,
        borderColor: '#ff8fb1',
        borderWidth: 2,
        radius: 8,
      });
      drawHeartIcon(ctx, 36, 40, 22, cfg.hud.heartIconColor, cfg.hud.heartIconShadow);
      this.ui.drawText(ctx, `${State.happyCount} / ${State.totalNpcs}`, 60, 22, {
        font: 'bold 22px "Trebuchet MS", monospace',
        color: cfg.hud.textColor,
        baseline: 'top',
        shadow: true,
      });
      this.ui.drawText(ctx, 'happy friends', 60, 50, {
        font: '11px "Trebuchet MS", monospace',
        color: 'rgba(255,255,255,0.7)',
        baseline: 'top',
      });
      this.ui.drawText(ctx, `Time: ${formatTime(State.timeMs)}`, 270, 30, {
        font: 'bold 18px monospace',
        color: cfg.hud.textColor,
        align: 'right',
        baseline: 'top',
        shadow: true,
      });

      // Off-screen indicators for sad NPCs ahead/behind
      this.drawNpcIndicators(ctx, engine);

      // Soft vignette
      ctx.save();
      const vg = ctx.createRadialGradient(W/2, H/2, H * 0.3, W/2, H/2, H * 0.85);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.32)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    drawNpcIndicators(ctx, engine) {
      const W = engine.config.width;
      const cam = this.camera;
      let aheadCount = 0, behindCount = 0;
      for (const npc of this.npcs) {
        if (npc.happy) continue;
        if (npc.x < cam.x) behindCount++;
        else if (npc.x > cam.x + W) aheadCount++;
      }
      if (aheadCount > 0) {
        this.ui.drawPanel(ctx, W - 110, 80, 96, 26, {
          bgColor: 'rgba(0,0,0,0.55)', borderColor: '#fff7a8', borderWidth: 1, radius: 6,
        });
        this.ui.drawText(ctx, `▶ ${aheadCount} ahead`, W - 62, 93, {
          font: 'bold 13px monospace', color: '#fff7a8',
          align: 'center', baseline: 'middle',
        });
      }
      if (behindCount > 0) {
        this.ui.drawPanel(ctx, 14, 80, 96, 26, {
          bgColor: 'rgba(0,0,0,0.55)', borderColor: '#7ec8ff', borderWidth: 1, radius: 6,
        });
        this.ui.drawText(ctx, `◀ ${behindCount} behind`, 62, 93, {
          font: 'bold 13px monospace', color: '#7ec8ff',
          align: 'center', baseline: 'middle',
        });
      }
    }

    destroy(engine) {
      if (this.physics) this.physics.removeBody(this.body);
      if (this._offHappy) this._offHappy();
    }
  }

  // ── WinScene ─────────────────────────────────────────────────────────────

  class WinScene extends GF.Scene {
    init(engine) {
      captureSystems(this, engine);
      this.t = 0;

      const variants = (GF.GameSprites && GF.GameSprites._personVariantNames) ||
                       ['personA','personB','personC','personD'];

      // Build a parade of all-happy NPCs
      this.parade = [];
      const W = engine.config.width;
      const count = 8;
      const spacing = (W - 80) / (count - 1);
      for (let i = 0; i < count; i++) {
        const variant = variants[i % variants.length];
        this.parade.push({
          x: 40 + i * spacing,
          y: engine.config.height - 60,
          anim: this.sprites.createAnimator(variant, 'happy'),
          phase: i * 0.13,
        });
      }

      this.dogAnim = this.sprites.createAnimator('pupDog', 'idle');

      // Confetti emitter
      if (this.particles) {
        this.emitter = this.particles.startEmitter(
          engine.config.width / 2, -10,
          {
            rate: 28,
            colors: ['#ff5d8f', '#ffb3c8', '#fff7a8', '#ffe066', '#7ec8ff', '#a3eba3'],
            speed: [80, 200],
            direction: Math.PI / 2,
            spread: 0.8,
            size:  [3, 7],
            life:  [1.5, 2.8],
            gravity: 220,
            friction: 0.985,
            fadeOut: true,
            rotation: true,
          }
        );
      }

      const c = CFG().controls;
      engine.input.bind('start', ...c.start);
    }

    update(dt, engine) {
      this.t += dt;
      this.dogAnim.update(dt);
      for (const p of this.parade) p.anim.update(dt);

      // Move confetti emitter side to side
      if (this.emitter) {
        this.emitter.x = engine.config.width / 2 + Math.sin(this.t * 0.7) * 200;
      }

      if (engine.input.wasPressed('start')) {
        if (this.audio) this.audio.play('bark');
        this.scenes.replaceWithTransition(new TitleScene(), {
          type: 'fade', duration: 0.5, color: '#0c0e16',
        });
      }
    }

    render(ctx, engine) {
      const W = engine.config.width;
      const H = engine.config.height;

      // Pastel celebratory background
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#ffe1ec');
      grad.addColorStop(1, '#fff7e7');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Sun rays
      ctx.save();
      ctx.translate(W/2, H/2);
      ctx.rotate(this.t * 0.1);
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#ffd45a';
      for (let i = 0; i < 16; i++) {
        ctx.save();
        ctx.rotate((i / 16) * GF.Math.TAU);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(20, -W);
        ctx.lineTo(-20, -W);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // Ground band
      ctx.fillStyle = '#6cbf5f';
      ctx.fillRect(0, H - 60, W, 60);
      ctx.fillStyle = '#3f8a3a';
      ctx.fillRect(0, H - 56, W, 4);

      // Parade with extra bounce per person
      for (const p of this.parade) {
        const bounce = Math.abs(Math.sin(this.t * 4 + p.phase)) * 6;
        p.anim.draw(ctx, p.x, p.y - bounce);
      }

      // Dog out front, in the middle
      const dogBounce = Math.abs(Math.sin(this.t * 6)) * 6;
      this.dogAnim.draw(ctx, W/2, H - 60 - dogBounce);

      // Title plate
      this.ui.drawPanel(ctx, W/2 - 260, 40, 520, 110, {
        bgColor: 'rgba(255,255,255,0.92)',
        borderColor: '#ff5d8f',
        borderWidth: 3,
        radius: 14,
      });
      this.ui.drawText(ctx, 'EVERYONE IS HAPPY!', W/2, 75, {
        font: 'bold 38px "Trebuchet MS", system-ui, sans-serif',
        color: '#c43a6c',
        align: 'center', baseline: 'middle',
        shadow: true,
        glow: '#ff8fb1', glowBlur: 18,
      });
      this.ui.drawText(ctx, `${State.totalNpcs} smiles delivered in ${formatTime(State.timeMs)}`, W/2, 112, {
        font: '17px "Trebuchet MS", system-ui, sans-serif',
        color: '#553344',
        align: 'center', baseline: 'middle',
      });
      if (State.bestTimeMs != null) {
        this.ui.drawText(ctx, `Best time: ${formatTime(State.bestTimeMs)}`, W/2, 138, {
          font: '13px monospace',
          color: '#7a4f63',
          align: 'center', baseline: 'middle',
        });
      }

      // Prompt
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(this.t * 3));
      this.ui.drawText(ctx, 'PRESS ENTER TO PLAY AGAIN', W/2, H - 130, {
        font: 'bold 16px "Trebuchet MS", monospace',
        color: '#222',
        align: 'center', baseline: 'middle',
        shadow: true,
      });
      ctx.restore();
    }

    destroy(engine) {
      if (this.emitter) this.emitter.stop();
    }
  }

  // ── Boot ─────────────────────────────────────────────────────────────────

  window.addEventListener('GF:ready', () => {
    const cfg = CFG();

    const game = GF.createGame(cfg.engine, cfg.physics, {
      gameName:  'HappyPup',
      audio:     true,
      tweens:    true,
      particles: true,
      scenes:    true,
      debug:     true,
      debugOpts: { toggleKey: cfg.debug.toggleKey, enabled: cfg.debug.enabled },
    });

    // Register sprites by name (paths are owned by the framework + this game's
    // sprite scripts; nothing leaks into GAME_CONFIG).
    game.sprites.registerSprite('pupDog', GF.GameSprites.pupDog);
    for (const name of GF.GameSprites._personVariantNames) {
      game.sprites.registerSprite(name, GF.GameSprites[name]);
    }
    game.sprites.registerSprite('parkTree',  GF.GameSprites.parkTree);
    game.sprites.registerSprite('parkBush',  GF.GameSprites.parkBush);
    game.sprites.registerSprite('parkBench', GF.GameSprites.parkBench);
    game.sprites.registerSprite('parkLamp',  GF.GameSprites.parkLamp);

    // Set up procedural audio
    if (game.audio) setupAudio(game.audio);

    // Initial input bindings (more added per-scene)
    game.engine.input.bind('start', ...cfg.controls.start);

    // Debug watches
    if (game.debug) {
      game.debug.watch('happy',  () => `${State.happyCount} / ${State.totalNpcs}`);
      game.debug.watch('time',   () => formatTime(State.timeMs));
      game.debug.watch('scene',  () => game.scenes.current
        ? game.scenes.current.constructor.name : '-');
    }

    // Cosmetic: jump dust via the event bus
    game.engine.events.on('hp:jump', ({ x, y }) => {
      if (!game.particles) return;
      game.particles.burst(x, y, {
        count: 7,
        colors: ['#cdb37a', '#a88c52', '#ffffff'],
        speed: [40, 120],
        direction: Math.PI / 2,
        spread: 1.3,
        size: [2, 4],
        life: [0.2, 0.4],
        fadeOut: true,
        shape: 'circle',
      });
    });

    game.scenes.push(new TitleScene(), game.engine);
    game.engine.start();
  });

})(window.GF = window.GF || {});
