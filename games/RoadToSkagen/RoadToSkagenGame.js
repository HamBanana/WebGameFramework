// GameFramework/games/RoadToSkagen/RoadToSkagenGame.js
// Main game logic for "Road to Skagen" — a 387-km survival journey across
// Denmark. Built on GameFramework: uses the engine's loop for the animated
// scene (Claude walking, parallax scenery, day/night) while the discrete
// stat/inventory/shop/log UI lives in HTML overlay layers.
//
// Sprite names are resolved via GF.sprites — no asset paths leak into this
// file. All gameplay parameters come from GF.GAME_CONFIG.

(function (GF) {
  'use strict';

  // ──────────────────────────────────────────────────────────────────────────
  //  SceneObject — a single piece of scrolling scenery (tree, sign, fence…)
  // ──────────────────────────────────────────────────────────────────────────
  class SceneObject {
    constructor(spriteSystem, spriteName, x, y, layer, scale) {
      this.spriteName = spriteName;
      this.x          = x;
      this.y          = y;
      this.layer      = layer;     // parallax depth multiplier
      this.scale      = scale || 1;
      this.animator   = spriteSystem.createAnimator(spriteName, 'idle');
    }

    update(dt) {
      this.animator.update(dt);
    }

    draw(ctx) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.translate(this.x, this.y);
      ctx.scale(this.scale, this.scale);
      this.animator.draw(ctx, 0, 0);
      ctx.restore();
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  RoadToSkagenGame
  // ──────────────────────────────────────────────────────────────────────────
  class RoadToSkagenGame {
    constructor(config) {
      this.config = config;

      // Wire up framework systems.
      const fw = GF.createGame(config.engine, config.physics);
      this.engine  = fw.engine;
      this.sprites = fw.sprites;
      this.physics = fw.physics;
      this.ui      = fw.ui;
      this.canvas  = this.engine.canvas;

      if (GF.sprites) this.sprites.registerSprites(GF.sprites);

      // ── Player state (the "G" object from the original) ──────────────────
      this.state = this._initialState();

      // ── Visual state ─────────────────────────────────────────────────────
      this.player = {
        x: config.player.restPosX,
        y: config.player.groundY,
        animator: this.sprites.createAnimator(config.player.sprite, 'idle'),
        scale: config.player.scale,
      };
      this.pendingReaction = null;
      this._reactionTimer = 0;

      // Camera/world: world distance scrolls under the player.
      this.worldOffset = 0;          // logical pixels scrolled (visual)
      this.targetWorldOffset = 0;    // where we want to be after a walk

      // Background time-of-day (0..1, advances slowly while walking)
      this.timeOfDay = 0.25;         // 0=midnight, 0.5=noon

      // Walk animation state
      this.walking = false;
      this.walkPhase = 'idle';       // idle | enter | walk | exit
      this.walkTimer = 0;
      this.pendingLog = null;        // log entry to apply after walk visual

      // Visual effects state
      this.weatherEffect = null;     // 'rain' | 'snow' | 'fog' | ...
      this.weatherTimer  = 0;        // seconds until effect fades
      this.particles     = [];       // active particles
      this.popups        = [];       // floating text popups
      this.npcs          = [];       // active road NPCs
      this.npcSpawnCD    = 3;        // cooldown until next NPC may spawn
      this.shakeAmount   = 0;        // current shake magnitude (px)
      this.shakeTimer    = 0;
      this.flashColor    = null;     // 'red' | 'gold'
      this.flashTimer    = 0;
      this.rainbowAlpha  = 0;        // for rainbow event

      // Achievements
      this.achievements = {};
      this.config.achievements.forEach(a => { this.achievements[a.id] = false; });
      this._achLossless = true;      // hasn't taken damage yet (for hidden track)

      // Scene — long parallax strip generated once.
      this._buildScenery();

      // Cloud layer (drift slowly always)
      this._buildClouds();

      // Star layer (visible at night)
      this._buildStars();

      // Birds drifting across the sky during the day
      this._buildBirds();

      // Persistent celestial bodies & beach wave so their animations advance
      // smoothly instead of being recreated each frame.
      this._sun  = new SceneObject(this.sprites, 'sun',  0, 0, 0, 1.0);
      this._moon = new SceneObject(this.sprites, 'moon', 0, 0, 0, 1.0);
      this._wave = new SceneObject(this.sprites, 'wave', 0, 0, 0, 2.0);

      // Engine hooks
      this.engine.onUpdate((dt) => this._update(dt));
      this.engine.onRender((ctx) => this._render(ctx));

      // Log entries (kept here, rendered to the overlay)
      this.logEntries = [];

      // First render of UI overlay
      this._renderUI();
      this._renderAchievementGrid();
      this._addLog('🇩🇰 <strong>Welcome to Road to Skagen!</strong> 387 km ahead. Copenhagen fades behind you. Survive.', 'system');
      this._addLog('📖 <em>Tips: Shop in towns · Clothes halve cold damage · Map adds 3 km/walk · Medicine restores 40 health</em>', 'system');

      // Wire up keyboard
      this._bindKeys();

      this.engine.start();
    }

    // ── State helpers ─────────────────────────────────────────────────────
    _initialState() {
      const s = this.config.start;
      return {
        distance : 0,
        money    : s.money,
        health   : s.health,
        food     : s.food,
        day      : s.day,
        clothes  : s.clothes,
        medicine : s.medicine,
        rifle    : s.rifle,
        map      : s.map,
        gameOver : false,
        victory  : false,
        visitedKm: new Set([0]),
        shopOpen : false,
      };
    }

    _clamp(v, lo = 0, hi = Infinity) {
      return Math.max(lo, Math.min(hi, v));
    }

    _rand(min, range) {
      return Math.floor(Math.random() * range) + min;
    }

    _pick(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    // ── Scenery build ─────────────────────────────────────────────────────
    _buildScenery() {
      // The scenery is a long horizontal strip the camera scrolls through.
      // We seed it with deterministic-feeling positions at set intervals.
      const W = this.config.engine.width;
      const groundY = this.config.player.groundY;
      const span = W * 6;           // total length of pre-built scenery loop
      this.sceneSpan = span;
      const cities  = this.config.journey.cities;
      const totalKm = this.config.journey.totalKm;

      this.scenery = [];

      // Trees & bushes (background layer)
      for (let x = 0; x < span; x += 60 + Math.random() * 80) {
        const r = Math.random();
        const sprite = r < 0.35 ? 'tree_birch' : r < 0.85 ? 'tree_pine' : 'bush';
        const yJitter = Math.random() * 10;
        const y = groundY - 8 + yJitter;
        const layer = 0.5;          // background parallax
        const scale = 0.9 + Math.random() * 0.4;
        this.scenery.push(new SceneObject(this.sprites, sprite, x, y, layer, scale));
      }

      // Foreground bushes / fences (layer 1.0 — sticky to road)
      for (let x = -30; x < span; x += 110 + Math.random() * 90) {
        if (Math.random() < 0.4) {
          this.scenery.push(new SceneObject(this.sprites, 'bush', x, groundY + 4, 1.0, 0.9));
        } else if (Math.random() < 0.5) {
          this.scenery.push(new SceneObject(this.sprites, 'fence', x, groundY - 6, 1.0, 0.8));
        }
      }

      // Wildlife pasture: cows, sheep, deer, swans — midground (0.5)
      for (let x = 200; x < span; x += 240 + Math.random() * 200) {
        const r = Math.random();
        let sprite;
        if      (r < 0.32) sprite = 'cow';
        else if (r < 0.55) sprite = 'sheep';
        else if (r < 0.70) sprite = 'deer';
        else if (r < 0.82) sprite = 'rabbit';
        else if (r < 0.93) sprite = 'swan';
        else               sprite = 'sheep';
        const yOffset = -4 - Math.random() * 14;
        this.scenery.push(new SceneObject(this.sprites, sprite, x, groundY + yOffset, 0.5, 1.0));
      }

      // Windmills (Danish iconic) — midground
      for (let x = 280; x < span; x += 500 + Math.random() * 300) {
        this.scenery.push(new SceneObject(this.sprites, 'windmill', x, groundY - 4, 0.5, 0.95));
      }

      // Farmhouses & churches scattered between cities — far background (0.4)
      for (let x = 350; x < span; x += 420 + Math.random() * 280) {
        const sprite = Math.random() < 0.55 ? 'farmhouse' : 'church';
        this.scenery.push(new SceneObject(this.sprites, sprite, x + Math.random() * 80, groundY - 2, 0.4, 0.95));
      }

      // Lighthouse near the very end (tip of Skagen)
      const tipX = (totalKm - 4) / totalKm * span;
      this.scenery.push(new SceneObject(this.sprites, 'lighthouse', tipX, groundY - 2, 0.4, 1.1));

      // Distant city silhouettes between cities
      cities.forEach((c, idx) => {
        if (idx === 0 || idx === cities.length - 1) return;
        const xPos = (c.km / totalKm) * span;
        this.scenery.push(new SceneObject(this.sprites, c.sprite, xPos, groundY + 2, 0.4, 1.0));
      });

      // Milestone markers every 50 km of equivalent x
      for (let km = 50; km < totalKm; km += 50) {
        const xPos = (km / totalKm) * span;
        this.scenery.push(new SceneObject(this.sprites, 'milestone', xPos, groundY + 2, 1.0, 1.0));
      }

      // Signposts at named cities (foreground)
      cities.forEach(c => {
        const xPos = (c.km / totalKm) * span;
        this.scenery.push(new SceneObject(this.sprites, 'signpost', xPos + 30, groundY + 2, 1.0, 1.0));
      });
    }

    _buildClouds() {
      const W = this.config.engine.width;
      this.clouds = [];
      for (let i = 0; i < 6; i++) {
        const x = Math.random() * W * 1.2;
        const y = 24 + Math.random() * 80;
        const big = Math.random() < 0.4;
        const obj = new SceneObject(this.sprites, big ? 'cloud_big' : 'cloud_small', x, y, 0.2, 1.0);
        obj.driftSpeed = 5 + Math.random() * 8;
        this.clouds.push(obj);
      }
    }

    _buildStars() {
      const W = this.config.engine.width;
      this.stars = [];
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * W;
        const y = 5 + Math.random() * 110;
        const obj = new SceneObject(this.sprites, 'star', x, y, 0, 1.0);
        // Stagger phase by skipping ahead some frames.
        obj.animator._timer = Math.random() * 0.5;
        this.stars.push(obj);
      }
    }

    _buildBirds() {
      this.birds = [];
      for (let i = 0; i < 5; i++) {
        const obj = new SceneObject(this.sprites, 'bird', Math.random() * this.config.engine.width, 30 + Math.random() * 90, 0, 1.0);
        obj.driftSpeed = 28 + Math.random() * 18;
        this.birds.push(obj);
      }
    }

    // ── Update / Render ────────────────────────────────────────────────────
    _update(dt) {
      // Animate clouds drifting
      this.clouds.forEach(c => {
        c.x -= c.driftSpeed * dt;
        if (c.x < -100) c.x = this.config.engine.width + 50;
        c.update(dt);
      });

      this.stars.forEach(s => s.update(dt));
      this.scenery.forEach(s => s.update(dt));
      this._sun.update(dt);
      this._moon.update(dt);
      this._wave.update(dt);
      // Birds drift slowly across the sky
      this.birds.forEach(b => {
        b.x -= b.driftSpeed * dt;
        if (b.x < -30) {
          b.x = this.config.engine.width + 30;
          b.y = 30 + Math.random() * 90;
        }
        b.update(dt);
      });

      // Smooth camera scroll toward target
      const speed = this.config.player.walkSpeed;
      if (this.worldOffset < this.targetWorldOffset - 0.5) {
        this.worldOffset = Math.min(this.targetWorldOffset, this.worldOffset + speed * dt);
      } else if (this.worldOffset > this.targetWorldOffset + 0.5) {
        this.worldOffset = Math.max(this.targetWorldOffset, this.worldOffset - speed * dt);
      }

      // Walk visual phasing
      if (this.walking) {
        this.walkTimer += dt;
        const arrived = Math.abs(this.worldOffset - this.targetWorldOffset) < 1;
        if (arrived || this.walkTimer > 2.5) {
          this.walking = false;
          // Reaction takes precedence over plain idle so the player can see
          // the result of the event that just happened.
          if (this.pendingReaction) {
            this.player.animator.play(this.pendingReaction, true);
            this._reactionTimer = 1.2;
            this.pendingReaction = null;
          } else {
            this.player.animator.play('idle');
          }
          if (this.pendingLog) {
            const { text, type } = this.pendingLog;
            this._addLog(text, type);
            this.pendingLog = null;
          }
          this._renderUI();
          this._checkState();
        }
      } else if (this._reactionTimer > 0) {
        // Hold reaction animation, then return to idle.
        this._reactionTimer -= dt;
        if (this._reactionTimer <= 0) {
          this.player.animator.play('idle');
        }
      }

      // Slowly rotate time-of-day while moving
      if (this.walking) {
        this.timeOfDay = (this.timeOfDay + dt * 0.05) % 1;
      }

      this.player.animator.update(dt);

      // NPC spawn / motion
      this._updateNPCs(dt);

      // Particles, popups, shake, flash
      this._updateParticles(dt);
    }

    _render(ctx) {
      const W = this.config.engine.width;
      const H = this.config.engine.height;

      // Camera shake — translate canvas by tiny random offset
      let shakeX = 0, shakeY = 0;
      if (this.shakeAmount > 0) {
        shakeX = (Math.random() - 0.5) * this.shakeAmount * 2;
        shakeY = (Math.random() - 0.5) * this.shakeAmount * 2;
      }
      ctx.save();
      ctx.translate(shakeX, shakeY);

      // Sky gradient based on time-of-day
      this._drawSky(ctx, W, H);

      // Stars (only when dark)
      const darkness = this._darkness();
      if (darkness > 0.2) {
        ctx.save();
        ctx.globalAlpha = (darkness - 0.2) / 0.8;
        this.stars.forEach(s => s.draw(ctx));
        ctx.restore();
      }

      // Sun or moon
      this._drawCelestial(ctx, W, H);

      // Clouds
      ctx.save();
      ctx.globalAlpha = 0.85;
      this.clouds.forEach(c => c.draw(ctx));
      ctx.restore();

      // Birds (only visible during day)
      if (darkness < 0.5) {
        ctx.save();
        ctx.globalAlpha = 1 - darkness;
        this.birds.forEach(b => b.draw(ctx));
        ctx.restore();
      }

      // Ground band
      this._drawGround(ctx, W, H);

      // Distant skyline (background parallax — slow scroll)
      this._drawSceneryLayer(ctx, 0.4);

      // Mid-ground (trees & bushes, normal layer)
      this._drawSceneryLayer(ctx, 0.5);

      // Road
      this._drawRoad(ctx, W, H);

      // Background-layer NPCs (oncoming cars, far cyclists — behind player)
      this._drawNPCs(ctx, false);

      // Foreground (fences, signs, bushes near road)
      this._drawSceneryLayer(ctx, 1.0);

      // Player (always centered horizontally on rest position)
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.translate(this.player.x, this.player.y);
      ctx.scale(this.player.scale, this.player.scale);
      this.player.animator.draw(ctx, 0, 0);
      ctx.restore();

      // Foreground NPCs (overtaking — in front of player)
      this._drawNPCs(ctx, true);

      // Weather particles (rain, snow, fog, wind, sun sparks, rainbow)
      this._drawWeather(ctx, W, H);

      // Floating popups above the player
      this._drawPopups(ctx);

      // Distance HUD on canvas (top-left)
      this._drawCanvasHUD(ctx, W);

      // Tint overlay for darkness
      if (darkness > 0) {
        ctx.fillStyle = `rgba(8, 12, 32, ${darkness * 0.45})`;
        ctx.fillRect(0, 0, W, H);
      }

      ctx.restore();   // end shake transform

      // Screen flash (drawn AFTER restore so it doesn't shake)
      if (this.flashTimer > 0 && this.flashColor) {
        const a = Math.min(0.55, this.flashTimer * 1.4);
        ctx.fillStyle = this.flashColor === 'red'  ? `rgba(255,30,30,${a})`
                       : this.flashColor === 'gold' ? `rgba(255,213,74,${a})`
                       : `rgba(255,255,255,${a})`;
        ctx.fillRect(0, 0, W, H);
      }
    }

    _darkness() {
      // 0 at noon (timeOfDay=0.5), 1 at midnight (0 or 1)
      const d = Math.abs(this.timeOfDay - 0.5) * 2;  // 0..1
      return Math.max(0, Math.min(1, d));
    }

    // ── Visual effects API ─────────────────────────────────────────────────
    _spawnPopup(text, color, kind) {
      // Float up from above the player's head
      const offsetX = (Math.random() - 0.5) * 20;
      this.popups.push({
        text, color, kind,
        x: this.player.x + offsetX,
        y: this.player.y - 80,
        vy: -28,
        life: 1.6,
        max: 1.6,
      });
    }

    _cameraShake(magnitude, duration) {
      this.shakeAmount = Math.max(this.shakeAmount, magnitude);
      this.shakeTimer  = Math.max(this.shakeTimer, duration);
    }

    _screenFlash(color, duration) {
      this.flashColor = color;
      this.flashTimer = duration;
    }

    _setWeather(effect) {
      this.weatherEffect = effect;
      this.weatherTimer = 8;  // visible for ~8s after the event
      // Seed particles for rain/snow/fog
      this.particles.length = 0;
      const W = this.config.engine.width;
      const H = this.config.engine.height;
      if (effect === 'rain' || effect === 'storm') {
        for (let i = 0; i < 90; i++) {
          this.particles.push({
            kind: 'rain',
            x: Math.random() * W, y: Math.random() * H,
            vx: -90, vy: 280 + Math.random() * 100,
            life: Infinity, len: 6 + Math.random() * 4,
          });
        }
      } else if (effect === 'snow') {
        for (let i = 0; i < 70; i++) {
          this.particles.push({
            kind: 'snow',
            x: Math.random() * W, y: Math.random() * H,
            vx: -10 + Math.random() * 20, vy: 18 + Math.random() * 22,
            life: Infinity, size: 1 + Math.random() * 2,
            wob: Math.random() * Math.PI * 2,
          });
        }
      } else if (effect === 'gale') {
        for (let i = 0; i < 30; i++) {
          this.particles.push({
            kind: 'wind',
            x: Math.random() * W, y: 30 + Math.random() * 250,
            vx: -240 - Math.random() * 100, vy: 0,
            life: Infinity, len: 18 + Math.random() * 14,
          });
        }
      } else if (effect === 'fog') {
        for (let i = 0; i < 14; i++) {
          this.particles.push({
            kind: 'fog',
            x: Math.random() * W, y: 80 + Math.random() * 220,
            vx: -8 - Math.random() * 6, vy: 0,
            life: Infinity, r: 50 + Math.random() * 60,
            alpha: 0.12 + Math.random() * 0.18,
          });
        }
      } else if (effect === 'sunshine') {
        // Spawn radial sunshine sparkles around the sun position
        for (let i = 0; i < 18; i++) {
          this.particles.push({
            kind: 'spark',
            x: Math.random() * W, y: Math.random() * H * 0.4,
            vx: 0, vy: 0,
            life: 1.0 + Math.random() * 1.5,
            max: 2.5,
            size: 1 + Math.random() * 2,
          });
        }
      } else if (effect === 'rainbow') {
        this.rainbowAlpha = 1.0;
      }
    }

    _updateParticles(dt) {
      // Decay weather timer
      if (this.weatherTimer > 0) {
        this.weatherTimer -= dt;
        if (this.weatherTimer <= 0) {
          this.weatherEffect = null;
          this.particles.length = 0;
        }
      }
      // Update particles
      const W = this.config.engine.width;
      const H = this.config.engine.height;
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.kind === 'snow') {
          p.wob += dt * 4;
          p.x += Math.sin(p.wob) * 6 * dt;
        }
        if (p.kind === 'spark') {
          p.life -= dt;
          if (p.life <= 0) { this.particles.splice(i, 1); continue; }
        }
        // Wrap or cull
        if (p.kind === 'rain' || p.kind === 'snow' || p.kind === 'wind' || p.kind === 'fog') {
          if (p.x < -100) p.x = W + 50;
          if (p.x > W + 100) p.x = -50;
          if (p.y > H + 20) p.y = -10;
          if (p.y < -30) p.y = H + 10;
        }
      }
      // Rainbow fades slowly
      if (this.rainbowAlpha > 0 && this.weatherEffect !== 'rainbow') {
        this.rainbowAlpha = Math.max(0, this.rainbowAlpha - dt * 0.4);
      }
      // Camera shake decay
      if (this.shakeTimer > 0) {
        this.shakeTimer -= dt;
        if (this.shakeTimer <= 0) this.shakeAmount = 0;
      }
      // Flash decay
      if (this.flashTimer > 0) {
        this.flashTimer -= dt;
        if (this.flashTimer <= 0) this.flashColor = null;
      }
      // Popup motion
      for (let i = this.popups.length - 1; i >= 0; i--) {
        const p = this.popups[i];
        p.life -= dt;
        p.y += p.vy * dt;
        p.vy *= 0.98;
        if (p.life <= 0) this.popups.splice(i, 1);
      }
    }

    _drawWeather(ctx, W, H) {
      if (!this.particles.length && this.rainbowAlpha <= 0) return;

      // Rainbow drawn first (behind particles)
      if (this.rainbowAlpha > 0) {
        const colors = ['#ff5252', '#ff9b3a', '#ffd54a', '#7be07f', '#4fb6e5', '#5e60c2', '#a259d9'];
        const cx = W * 0.7;
        const cy = H + 60;
        ctx.save();
        ctx.globalAlpha = this.rainbowAlpha * 0.55;
        ctx.lineWidth = 8;
        colors.forEach((col, i) => {
          ctx.strokeStyle = col;
          ctx.beginPath();
          ctx.arc(cx, cy, 280 - i * 8, Math.PI * 1.0, Math.PI * 2.0);
          ctx.stroke();
        });
        ctx.restore();
      }

      this.particles.forEach(p => {
        if (p.kind === 'rain') {
          ctx.strokeStyle = 'rgba(170,200,230,0.7)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 3, p.y + p.len);
          ctx.stroke();
        } else if (p.kind === 'snow') {
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === 'wind') {
          ctx.strokeStyle = 'rgba(220,230,240,0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.len, p.y);
          ctx.stroke();
        } else if (p.kind === 'fog') {
          ctx.fillStyle = `rgba(220,225,230,${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === 'spark') {
          const a = Math.max(0, p.life / p.max);
          ctx.fillStyle = `rgba(255,240,150,${a})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // ── Road NPCs ─────────────────────────────────────────────────────────
    _spawnNPC() {
      // Skip if too many on screen
      if (this.npcs.length >= 4) return;
      // Don't spawn at night to keep the scene calmer
      if (this._darkness() > 0.7) return;

      const W = this.config.engine.width;
      const groundY = this.config.player.groundY;
      const types = [
        { sprite: 'car_red',  speed: 240, direction:  1, lane: -36, scale: 1.4, weight: 1.5 }, // oncoming
        { sprite: 'car_blue', speed: 260, direction:  1, lane: -36, scale: 1.4, weight: 1.0 },
        { sprite: 'cyclist',  speed:  80, direction: -1, lane:  10, scale: 1.6, weight: 1.5 }, // overtaking (foreground)
        { sprite: 'hiker',    speed:  35, direction:  1, lane: -10, scale: 1.4, weight: 1.0 }, // oncoming hiker
        { sprite: 'tractor',  speed:  50, direction:  1, lane: -32, scale: 1.3, weight: 0.6 },
      ];
      // Weighted pick
      let total = 0;
      types.forEach(t => total += t.weight);
      let roll = Math.random() * total;
      let pick = types[0];
      for (const t of types) {
        roll -= t.weight;
        if (roll <= 0) { pick = t; break; }
      }
      // Spawn from off-screen on the appropriate side
      const fromLeft = pick.direction === -1;
      const x = fromLeft ? -60 : W + 60;
      // Direction -1 = moves right (overtaking), +1 = moves left (oncoming)
      // We treat lane as Y offset relative to groundY.
      const vx = pick.direction === -1 ? pick.speed : -pick.speed;
      this.npcs.push({
        sprite: pick.sprite,
        animator: this.sprites.createAnimator(pick.sprite, 'idle'),
        x: x, y: groundY + pick.lane,
        vx: vx,
        scale: pick.scale,
        flipX: vx < 0,                       // face the direction of motion
        layer: pick.lane > 0 ? 'fg' : 'bg',  // overtaking = foreground
      });
    }

    _updateNPCs(dt) {
      this.npcSpawnCD -= dt;
      if (this.npcSpawnCD <= 0) {
        // Random gap 4–10 sec
        this.npcSpawnCD = 4 + Math.random() * 6;
        if (Math.random() < 0.85) this._spawnNPC();
      }
      const W = this.config.engine.width;
      for (let i = this.npcs.length - 1; i >= 0; i--) {
        const npc = this.npcs[i];
        npc.x += npc.vx * dt;
        npc.animator.update(dt);
        if (npc.x < -120 || npc.x > W + 120) this.npcs.splice(i, 1);
      }
    }

    _drawNPCs(ctx, foreground) {
      this.npcs.forEach(npc => {
        const isFg = npc.layer === 'fg';
        if (foreground !== isFg) return;
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.translate(npc.x, npc.y);
        ctx.scale(npc.scale, npc.scale);
        if (npc.flipX) {
          ctx.scale(-1, 1);
        }
        npc.animator.flipX = false; // we handle flip directly via ctx.scale
        npc.animator.draw(ctx, 0, 0);
        ctx.restore();
      });
    }

    _drawPopups(ctx) {
      this.popups.forEach(p => {
        const a = Math.max(0, p.life / p.max);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
      });
    }

    _drawSky(ctx, W, H) {
      const t = this.timeOfDay;
      // Determine sky colors
      let top, bot;
      if (t < 0.2 || t > 0.85) {            // night
        top = '#0a1230'; bot = '#1d2848';
      } else if (t < 0.32) {                // dawn
        top = '#3a3060'; bot = '#e89a6a';
      } else if (t < 0.7) {                 // day
        top = '#4ea3d6'; bot = '#bfe4f4';
      } else {                              // dusk
        top = '#3a2860'; bot = '#e57a48';
      }
      const grad = ctx.createLinearGradient(0, 0, 0, H * 0.65);
      grad.addColorStop(0, top);
      grad.addColorStop(1, bot);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    _drawCelestial(ctx, W, H) {
      const t = this.timeOfDay;
      if (t > 0.18 && t < 0.82) {
        const phase = (t - 0.2) / 0.6;
        this._sun.x = 60 + phase * (W - 120);
        this._sun.y = 150 - Math.sin(phase * Math.PI) * 110;
        this._sun.draw(ctx);
      } else {
        const phase = ((t + 0.5) % 1 - 0.2) / 0.6;
        this._moon.x = 60 + phase * (W - 120);
        this._moon.y = 150 - Math.sin(phase * Math.PI) * 110;
        this._moon.draw(ctx);
      }
    }

    _drawGround(ctx, W, H) {
      const groundY = this.config.player.groundY;
      const beachZone = this.state.distance > 360;
      // Distant horizon strip
      ctx.fillStyle = beachZone ? '#9ed6e8' : '#5b8c5b';
      ctx.fillRect(0, groundY - 18, W, 18);
      // Main ground
      ctx.fillStyle = beachZone ? '#e8d49a' : '#3f7a3a';
      ctx.fillRect(0, groundY, W, H - groundY);
      // Subtle ground stripes
      ctx.fillStyle = beachZone ? '#c8a868' : '#2f6a2a';
      for (let i = 0; i < 8; i++) {
        const offset = (this.worldOffset * 0.6) % 32;
        const x = (i * 120 - offset) % (W + 40);
        ctx.fillRect(x, groundY + 24 + (i % 2) * 12, 18, 3);
      }

      // Waves on the very last stretch
      if (beachZone) {
        this._wave.x = W * 0.5;
        this._wave.y = groundY - 28;
        this._wave.draw(ctx);
      }
    }

    _drawRoad(ctx, W, H) {
      const groundY = this.config.player.groundY;
      const beachZone = this.state.distance > 360;
      const tile = this.sprites.getSprite(beachZone ? 'beach_tile' : 'road_tile');
      if (!tile) return;
      const tileW = tile.frameWidth;
      const offset = ((this.worldOffset % tileW) + tileW) % tileW;
      // Road extends across full width at the player's feet level.
      const roadY = groundY + 4;
      for (let x = -offset; x < W + tileW; x += tileW) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.translate(x, roadY);
        // Use direct draw via sprite system (idle/0)
        this.sprites.drawFrame(ctx, beachZone ? 'beach_tile' : 'road_tile', 'idle', 0, 0, 0, false);
        ctx.restore();
      }
    }

    _drawSceneryLayer(ctx, layer) {
      const W = this.config.engine.width;
      this.scenery.forEach(o => {
        if (Math.abs(o.layer - layer) > 0.01) return;
        // Compute on-screen x from world position and current offset
        let x = o.x - this.worldOffset * o.layer;
        // Wrap around the scene span so scenery loops if the player walks far.
        x = ((x % this.sceneSpan) + this.sceneSpan) % this.sceneSpan;
        if (x > W + 60) x -= this.sceneSpan;
        if (x < -120 || x > W + 120) return;
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.translate(x, o.y);
        ctx.scale(o.scale, o.scale);
        o.animator.draw(ctx, 0, 0);
        ctx.restore();
      });
    }

    _drawCanvasHUD(ctx, W) {
      const distText = `${this.state.distance} / ${this.config.journey.totalKm} km`;
      this.ui.drawPanel(ctx, 12, 12, 200, 32, {
        bgColor: 'rgba(10,20,15,0.7)', borderColor: '#4caf50', borderWidth: 1, radius: 4,
      });
      this.ui.drawText(ctx, '🇩🇰 ROAD TO SKAGEN', 22, 18, {
        font: 'bold 12px monospace', color: '#c8e6c9', shadow: true,
      });
      this.ui.drawText(ctx, distText, 22, 32, {
        font: '11px monospace', color: '#ffd54a', shadow: true,
      });

      // Show city we're heading to
      const next = this._nextCity();
      if (next) {
        const remaining = next.km - this.state.distance;
        const text = `→ ${next.name} (${remaining} km)`;
        this.ui.drawText(ctx, text, W - 14, 18, {
          font: '11px monospace', color: '#fff', align: 'right', shadow: true,
        });
      }
    }

    // ── Cities ────────────────────────────────────────────────────────────
    _currentCityIndex() {
      let idx = 0;
      this.config.journey.cities.forEach((c, i) => { if (this.state.distance >= c.km) idx = i; });
      return idx;
    }

    _currentCity() { return this.config.journey.cities[this._currentCityIndex()]; }

    _nextCity() {
      const cities = this.config.journey.cities;
      for (const c of cities) if (c.km > this.state.distance) return c;
      return null;
    }

    _nearestShopCity() {
      const range = this.config.journey.shopRangeKm;
      const cities = this.config.journey.cities;
      for (const km of this.config.journey.shopKm) {
        if (Math.abs(this.state.distance - km) <= range) {
          return cities.find(c => c.km === km);
        }
      }
      return null;
    }

    _checkCityArrival() {
      for (const c of this.config.journey.cities) {
        if (this.state.distance >= c.km && !this.state.visitedKm.has(c.km) && c.km > 0) {
          this.state.visitedKm.add(c.km);
          const ev = this.config.cityEvents[c.km];
          if (ev) {
            if (ev.health) this._heal(ev.health);
            if (ev.money)  this._changeMoney(ev.money);
            if (ev.food)   this._changeFood(ev.food);
            this._addLog(`<strong>🏁 CITY REACHED: ${c.name}!</strong><br>${ev.text}`, 'city');
          }
          // Big screen flash + shake to celebrate arrival
          this._screenFlash('gold', 0.5);
          this._cameraShake(3, 0.4);
          // City-specific achievements
          if (c.km === 175) this._unlock('jutland');
          if (c.km === 225) this._unlock('halfway');
          if (c.km === 320) this._unlock('aalborg');
          if (c.km === 387) this._unlock('skagen');
          return true;
        }
      }
      return false;
    }

    // ── Damage / heal / state checks ──────────────────────────────────────
    _damage(amt) {
      if (amt <= 0) return;
      this.state.health = this._clamp(this.state.health - amt, 0, this.config.start.maxHealth);
      this._spawnPopup(`-${amt}`, '#ff5252', 'health');
      this._cameraShake(Math.min(8, 2 + amt * 0.12), 0.4);
      this._screenFlash('red', 0.25);
      // Lossless run flag (used by future achievement)
      this._achLossless = false;
      // "Brush With Death" survivor achievement
      if (this.state.health > 0 && this.state.health <= 15) this._unlock('survivor');
    }
    _heal(amt) {
      if (amt <= 0) return;
      this.state.health = this._clamp(this.state.health + amt, 0, this.config.start.maxHealth);
      this._spawnPopup(`+${amt}`, '#7be07f', 'health');
    }
    _changeMoney(delta) {
      this.state.money = Math.max(0, this.state.money + delta);
      this._spawnPopup(`${delta > 0 ? '+' : ''}${delta} kr`, delta > 0 ? '#ffd54a' : '#ff8866', 'money');
      if (this.state.money >= 1000) this._unlock('rich');
    }
    _changeFood(delta) {
      const max = this.config.start.maxFood;
      this.state.food = this._clamp(this.state.food + delta, 0, max);
      if (delta !== 0) {
        this._spawnPopup(`${delta > 0 ? '+' : ''}${delta} kg`, delta > 0 ? '#a5d6a7' : '#ff8866', 'food');
      }
    }
    _changeMedicine(delta) {
      this.state.medicine += delta;
      if (delta !== 0) {
        this._spawnPopup(`${delta > 0 ? '+' : ''}${delta} 💊`, '#90caf9', 'medicine');
      }
    }

    _checkState() {
      if (this.state.distance >= this.config.journey.totalKm && !this.state.victory) {
        this.state.distance = this.config.journey.totalKm;
        this.state.victory = true;
        this._showVictory();
        return;
      }
      if (this.state.health <= 0 && !this.state.gameOver) {
        this.state.health = 0;
        this.state.gameOver = true;
        this._showGameOver();
        return;
      }
      if (!this.state.gameOver && !this.state.victory) {
        if (this.state.health <= 20) this._addLog('⚠️ Health critically low! Rest or use medicine.', 'warning');
        else if (this.state.food <= 2) this._addLog('⚠️ Almost out of food! Find some soon.', 'warning');
      }
    }

    // ── Actions ───────────────────────────────────────────────────────────
    walk() {
      if (this.state.gameOver || this.state.victory || this.walking) return;
      this._closeShop();

      if (this.state.food <= 0) {
        this._damage(this.config.starvationDamage);
        this._addLog('💀 Starvation! You collapse from hunger. (-' + this.config.starvationDamage + ' health)', 'danger');
        this._checkState();
        this._renderUI();
        return;
      }
      if (this.state.health <= this.config.walkHealthFloor) {
        this._addLog('⚠️ Too wounded to walk. Rest or use medicine first.', 'warning');
        return;
      }

      const w = this.config.walking;
      const foodUsed = this._clamp(this._rand(w.foodMin, w.foodRange + 1), 0, this.state.food);
      this.state.food = this._clamp(this.state.food - foodUsed, 0, this.config.start.maxFood);

      let base = this._rand(w.kmMin, w.kmRange + 1);
      if (this.state.map) base += w.mapBonus;
      const oldDistance = this.state.distance;
      this.state.distance = Math.min(this.state.distance + base, this.config.journey.totalKm);

      const fatigue = this._rand(w.fatigueMin, w.fatigueRange + 1);
      this._damage(fatigue);
      this.state.day++;
      this._unlock('first_steps');

      // Trigger walking animation visual
      this._startWalkVisual(this.state.distance - oldDistance);

      let logged = false;
      const arrived = this._checkCityArrival();

      const roll = Math.random();
      const ec = this.config.eventChances;
      if (!arrived) {
        if (roll < ec.danger) {
          // Danger
          const d = this._pick(this.config.dangers);
          const avoidedBy = d.avoid && this._hasItem(d.avoid);
          let msg = `Day ${this.state.day}: ${d.text}`;
          if (avoidedBy) {
            msg += `<br><em>${d.avoidText || 'You avoid the worst.'}</em>`;
            this._damage(Math.floor((d.damage || 0) / 4));
          } else {
            if (d.damage) this._damage(d.damage);
            if (d.rob && this.state.money > 50) {
              const stolen = Math.floor(this.state.money * d.rob);
              this._changeMoney(-stolen);
              msg += ` They steal ${stolen} kr!`;
            }
            if (d.cold && this.state.clothes) {
              this._heal(Math.floor((d.damage || 0) / 2));
              msg += ' Your warm clothes soften the blow.';
            }
          }
          msg += `<br><small>Walked ${base} km · Food used ${foodUsed} kg</small>`;
          this._queueLog(msg, 'danger');
          this.pendingReaction = 'scared';
          logged = true;
        } else if (roll < ec.danger + ec.weather) {
          // Weather
          const ev = this._pick(this.config.weatherEvents);
          if (ev.health > 0) this._heal(ev.health);
          else if (ev.health < 0) this._damage(Math.abs(ev.health));
          if (ev.km > 0) this.state.distance = Math.min(this.state.distance + ev.km, this.config.journey.totalKm);
          else if (ev.km < 0) this.state.distance = Math.max(this.state.distance + ev.km, 0);

          // Visual cue on the canvas (rain, snow, fog, sunshine, gale, …)
          if (ev.effect) this._setWeather(ev.effect);
          if (ev.effect === 'sunshine') this._screenFlash('gold', 0.3);

          let msg = `Day ${this.state.day}: ${ev.text}`;
          let type = 'neutral';
          if (ev.cold && this.state.clothes) {
            this._heal(this.config.coldHealWithCoat);
            msg += ` (Warm clothes help! +${this.config.coldHealWithCoat} health)`;
          } else if (ev.cold && !this.state.clothes) {
            this._damage(this.config.coldDamageNoCoat);
            msg += ` You shiver badly. (-${this.config.coldDamageNoCoat} health)`;
            type = 'warning';
          } else if (ev.health > 0 || ev.km > 0) {
            type = 'good';
          }
          msg += `<br><small>Walked ${base} km · Food used ${foodUsed} kg</small>`;
          this._queueLog(msg, type);
          logged = true;
        } else if (roll < ec.danger + ec.weather + ec.good) {
          // Good event
          const ev = this._pick(this.config.goodEvents);
          if (ev.health)   this._heal(ev.health);
          if (ev.money)    this._changeMoney(ev.money);
          if (ev.food)     this._changeFood(ev.food);
          if (ev.km)       this.state.distance = Math.min(this.state.distance + ev.km, this.config.journey.totalKm);
          if (ev.medicine) this._changeMedicine(ev.medicine);
          this._queueLog(`Day ${this.state.day}: ${ev.text}<br><small>Walked ${base} km · Food used ${foodUsed} kg</small>`, 'good');
          this.pendingReaction = 'excited';
          logged = true;
        }
      }

      if (!logged && !arrived) {
        const flavours = [
          `The road stretches on. ${this._currentCity().name} in the rear-view.`,
          'Rolling fields of Danish yellow. Beautiful, brutal.',
          'A heron lifts from a ditch. You keep walking.',
          'Wind at your back today. Small mercies.',
          'The asphalt shimmers. Keep the North Star ahead.',
          'Birch trees line the road. Peaceful kilometre.',
        ];
        this._queueLog(`Day ${this.state.day}: ${this._pick(flavours)}<br><small>Walked ${base} km · Food used ${foodUsed} kg</small>`, 'neutral');
      }

      this._renderUI();
    }

    rest() {
      if (this.state.gameOver || this.state.victory || this.walking) return;
      this._closeShop();

      const recovered = this._rand(this.config.restHealthMin, this.config.restHealthRange + 1);
      this._heal(recovered);
      const foodUsed = this._clamp(this._rand(1, 2), 0, this.state.food);
      this.state.food -= foodUsed;
      this.state.day++;

      if (Math.random() < this.config.restBadEventChance) {
        const ev = this._pick(this.config.restEvents);
        if (ev.money)  this._changeMoney(ev.money);
        if (ev.food)   this._changeFood(ev.food);
        if (ev.health) this._damage(Math.abs(ev.health));
        this._addLog(`Day ${this.state.day}: 😴 Resting... ${ev.text}<br><small>+${recovered} health · Food used ${foodUsed} kg</small>`, 'danger');
      } else {
        this._addLog(`Day ${this.state.day}: 😴 ${this._pick(this.config.restFlavours)}<br><small>+${recovered} health · Food used ${foodUsed} kg</small>`, 'good');
      }

      // Brief idle animation refresh; advance toward day visually
      this.timeOfDay = (this.timeOfDay + 0.15) % 1;

      this._checkState();
      this._renderUI();
    }

    hunt() {
      if (this.state.gameOver || this.state.victory || this.walking) return;
      if (!this.state.rifle) {
        this._addLog('❌ You need a rifle to hunt. Buy one at a shop.', 'warning');
        return;
      }
      this._closeShop();
      this.state.day++;
      const h = this.config.hunt;
      this._damage(this._rand(h.successFatigueMin, h.successFatigueRange + 1));

      if (Math.random() < h.successChance) {
        const gained = this._rand(h.foodMin, h.foodRange + 1);
        this._changeFood(gained);
        const prey = this._pick(h.preyNames);
        this._addLog(`Day ${this.state.day}: 🏹 Successful hunt! A ${prey} — ${gained} kg of good meat.`, 'good');
        this.player.animator.play('excited', true);
        this._unlock('hunter');
      } else {
        this._damage(this._rand(h.failExtraDamageMin, h.failExtraDamageRange + 1));
        this._addLog(`Day ${this.state.day}: 🏹 Hunt failed. ${this._pick(h.failTexts)}`, 'danger');
        this.player.animator.play('scared', true);
      }

      this._checkState();
      this._renderUI();
    }

    work() {
      if (this.state.gameOver || this.state.victory || this.walking) return;
      this._closeShop();
      this.state.day++;
      const foodUsed = this._clamp(this._rand(1, 2), 0, this.state.food);
      this._changeFood(-foodUsed);

      const job = this._pick(this.config.workJobs);
      const earned = this._rand(job.payMin, (job.payMax - job.payMin) + 1);

      if (Math.random() < job.risk) {
        const injury = this._rand(this.config.workInjuryMin, this.config.workInjuryRange + 1);
        this._damage(injury);
        const partPay = Math.floor(earned * 0.5);
        this._changeMoney(partPay);
        this._addLog(`Day ${this.state.day}: 💼 ${job.name} — injured! Earned ${partPay} kr anyway.`, 'danger');
      } else {
        this._changeMoney(earned);
        this._addLog(`Day ${this.state.day}: 💼 ${job.name} — ${earned} kr earned.`, 'good');
      }

      this._checkState();
      this._renderUI();
    }

    forage() {
      if (this.state.gameOver || this.state.victory || this.walking) return;
      this._closeShop();
      this.state.day++;
      const f = this.config.forage;
      this._damage(this._rand(f.fatigueMin, f.fatigueRange + 1));

      if (Math.random() < f.successChance) {
        const find = this._pick(f.finds);
        if (find.food)  this._changeFood(find.food);
        if (find.money) this._changeMoney(find.money);
        const parts = [];
        if (find.food)  parts.push(`+${find.food} kg food`);
        if (find.money) parts.push(`+${find.money} kr`);
        this._addLog(`Day ${this.state.day}: 🍄 Found ${find.name}! (${parts.join(', ')})`, 'good');
        if (find.name === 'sea buckthorn') this._unlock('forager');
      } else {
        this._addLog(`Day ${this.state.day}: 🍄 Nothing edible. The hedgerows have been stripped.`, 'neutral');
      }

      this._checkState();
      this._renderUI();
    }

    useMedicine() {
      if (this.state.medicine <= 0 || this.state.gameOver || this.state.victory) return;
      this._changeMedicine(-1);
      this._heal(this.config.medicineHealAmount);
      this._screenFlash('gold', 0.3);
      this._addLog(`💊 Medicine taken. (+${this.config.medicineHealAmount} health · ${this.state.medicine} doses remaining)`, 'good');
      this._checkState();
      this._renderUI();
    }

    // ── Walk visual ──
    _startWalkVisual(kmAdvanced) {
      const span = this.sceneSpan;
      const totalKm = this.config.journey.totalKm;
      const dx = (kmAdvanced / totalKm) * span;
      this.targetWorldOffset += dx;
      this.walking = true;
      this.walkTimer = 0;
      this.player.animator.play('walk_e', true);
    }

    _queueLog(text, type) {
      this.pendingLog = { text, type };
    }

    // ── Shop ──
    openShop() {
      if (this.state.gameOver || this.state.victory) return;
      const city = this._nearestShopCity();
      if (!city) {
        this._addLog('❌ No shops out here. Head to the next town.', 'warning');
        return;
      }
      const sec = document.getElementById('shopSection');
      sec.style.display = 'block';
      document.getElementById('shopCityName').textContent = city.name;
      this.state.shopOpen = true;
      this._renderShopButtons();
    }

    _closeShop() {
      const sec = document.getElementById('shopSection');
      if (sec) sec.style.display = 'none';
      this.state.shopOpen = false;
    }
    closeShop() { this._closeShop(); }

    buy(itemId) {
      const item = this.config.shopItems.find(i => i.id === itemId);
      if (!item) return;
      if (item.flag && this.state[item.flag]) {
        this._addLog(`❌ Already have ${item.label.replace(/[\u{1F35E}\u{1F969}\u{1F48A}\u{1F9E5}\u{1F52B}\u{1F5FA}]/gu, '').trim()}.`, 'warning');
        return;
      }
      if (this.state.money < item.cost) {
        this._addLog(`❌ Need ${item.cost} kr. You only have ${this.state.money} kr.`, 'warning');
        return;
      }
      this._changeMoney(-item.cost);
      if (item.food)     this._changeFood(item.food);
      if (item.medicine) this._changeMedicine(item.medicine);
      if (item.flag)     this.state[item.flag] = true;
      this._addLog(`${item.label.split(' ')[0]} Bought ${item.label.replace(/^[^\s]+\s+/, '')}.`, 'good');
      if (this.state.clothes && this.state.rifle && this.state.map && this.state.medicine > 0) {
        this._unlock('fully_kitted');
      }
      this._renderUI();
      this._renderShopButtons();
    }

    _renderShopButtons() {
      const grid = document.getElementById('shopGrid');
      if (!grid) return;
      grid.innerHTML = '';
      this.config.shopItems.forEach(item => {
        const owned = item.flag && this.state[item.flag];
        const div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `
          <div class="shop-item-info">
            ${item.label}
            <small>${item.cost} kr · ${item.desc}</small>
          </div>
          <button class="btn btn-buy" ${owned ? 'disabled' : ''} data-buy="${item.id}">
            ${owned ? '✓ Owned' : 'Buy'}
          </button>`;
        grid.appendChild(div);
      });
      grid.querySelectorAll('button[data-buy]').forEach(btn => {
        btn.addEventListener('click', () => this.buy(btn.dataset.buy));
      });
    }

    // ── HTML overlay UI ──
    _renderUI() {
      const hpPct = this._clamp(this.state.health, 0, 100);
      const foodPct = this._clamp((this.state.food / this.config.start.maxFood) * 100, 0, 100);
      document.getElementById('healthVal').textContent = hpPct + '%';
      document.getElementById('foodVal').textContent   = this.state.food + ' kg';
      document.getElementById('dayVal').textContent    = this.state.day;
      document.getElementById('distVal').textContent   = this.state.distance;
      document.getElementById('totalKmVal').textContent= this.config.journey.totalKm;
      document.getElementById('moneyVal').textContent  = this.state.money;
      const hBar = document.getElementById('healthBar');
      hBar.style.width = hpPct + '%';
      hBar.className = 'stat-bar-fill bar-health' + (hpPct <= 25 ? ' low' : '');
      const fBar = document.getElementById('foodBar');
      fBar.style.width = foodPct + '%';
      fBar.className = 'stat-bar-fill bar-food' + (this.state.food <= 3 ? ' low' : '');
      const setItem = (id, owned, label) => {
        const el = document.getElementById(id);
        el.textContent = label;
        el.className = 'inv-item ' + (owned ? 'owned' : 'missing');
      };
      setItem('inv-clothes', this.state.clothes, '🧥 Clothes');
      setItem('inv-rifle',   this.state.rifle,   '🔫 Rifle');
      setItem('inv-medicine', this.state.medicine > 0, `💊 Medicine ×${this.state.medicine}`);
      setItem('inv-map',      this.state.map,    '🗺 Map');
      document.getElementById('btn-medicine').disabled = this.state.medicine <= 0 || this.state.gameOver || this.state.victory;
      document.getElementById('btn-hunt').disabled     = !this.state.rifle || this.state.gameOver || this.state.victory;
      this._renderRouteMap();
    }

    _renderRouteMap() {
      const el = document.getElementById('routeMap');
      if (!el) return;
      el.innerHTML = '';
      const cities = this.config.journey.cities;
      const cityIdx = this._currentCityIndex();
      cities.forEach((c, i) => {
        const visited = this.state.distance >= c.km;
        const current = cityIdx === i;
        const wrap = document.createElement('div');
        wrap.className = 'route-city';
        const dot = document.createElement('div');
        dot.className = 'city-dot' + (current ? ' current' : visited ? ' visited' : '');
        wrap.appendChild(dot);
        const name = document.createElement('div');
        name.className = 'city-name' + (current ? ' current' : visited ? ' visited' : '');
        name.textContent = c.name;
        wrap.appendChild(name);
        el.appendChild(wrap);
        if (i < cities.length - 1) {
          const lineWrap = document.createElement('div');
          lineWrap.className = 'city-line-wrap';
          const line = document.createElement('div');
          line.className = 'city-line' + (this.state.distance > c.km ? ' done' : '');
          lineWrap.appendChild(line);
          el.appendChild(lineWrap);
        }
      });
    }

    // ── Achievements ──
    _unlock(id) {
      if (this.achievements[id]) return;
      this.achievements[id] = true;
      const def = this.config.achievements.find(a => a.id === id);
      if (!def) return;
      this._spawnAchievementToast(def);
      this._renderAchievementGrid();
      this._addLog(`🏆 <strong>Achievement unlocked:</strong> ${def.icon} ${def.title} — <em>${def.desc}</em>`, 'system');
      this._screenFlash('gold', 0.4);
    }

    _spawnAchievementToast(def) {
      const layer = document.getElementById('achievementToasts');
      if (!layer) return;
      const el = document.createElement('div');
      el.className = 'ach-toast';
      el.innerHTML = `
        <div class="ach-row">
          <div class="ach-icon">${def.icon}</div>
          <div>
            <div class="ach-title">Achievement Unlocked</div>
            <div class="ach-name">${def.title}</div>
            <div class="ach-desc">${def.desc}</div>
          </div>
        </div>`;
      layer.appendChild(el);
      setTimeout(() => el.remove(), 6500);
    }

    _renderAchievementGrid() {
      const grid = document.getElementById('achGrid');
      const counter = document.getElementById('achCount');
      if (!grid) return;
      const list = this.config.achievements;
      const unlocked = list.filter(a => this.achievements[a.id]).length;
      if (counter) counter.textContent = `${unlocked}/${list.length}`;
      grid.innerHTML = '';
      list.forEach(a => {
        const div = document.createElement('div');
        div.className = 'ach-pill' + (this.achievements[a.id] ? ' unlocked' : '');
        div.innerHTML = `<span class="pi">${a.icon}</span><span class="pn">${a.title}</span>`;
        div.title = a.desc;
        grid.appendChild(div);
      });
    }

    _addLog(text, type = 'neutral') {
      this.logEntries.push({ text, type });
      const log = document.getElementById('eventLog');
      if (!log) return;
      Array.from(log.children).forEach((el, i, arr) => {
        if (i < arr.length - 4) el.classList.add('faded');
      });
      const entry = document.createElement('div');
      entry.className = `log-entry type-${type}`;
      entry.innerHTML = text;
      log.appendChild(entry);
      log.scrollTop = log.scrollHeight;
      const panel = document.getElementById('statsPanel');
      if (panel) {
        panel.classList.remove('flash-red', 'flash-green');
        void panel.offsetWidth;
        if (type === 'danger') panel.classList.add('flash-red');
        else if (type === 'good') panel.classList.add('flash-green');
      }
    }

    _hasItem(flag) {
      if (flag === 'medicine') return this.state.medicine > 0;
      return !!this.state[flag];
    }

    // ── End-game modals ──
    _calcScore() {
      let s = 1000;
      s += this.state.health * 5;
      s += this.state.money;
      s += this.state.food * 10;
      s -= this.state.day * 2;
      return Math.max(0, Math.round(s));
    }

    _scoreRating(s) {
      if (s >= 2000) return '🌟 LEGENDARY — A true Viking spirit!';
      if (s >= 1500) return '⭐ EXCELLENT — Denmark is proud.';
      if (s >= 1000) return '👍 GOOD — Worthy of Skagen.';
      if (s >= 500)  return '😤 SURVIVED — Barely, but still.';
      return '😅 SCRAPED THROUGH — Buy more food next time.';
    }

    _showVictory() {
      const score = this._calcScore();
      this.player.animator.play('excited', true);
      if (!this.state.rifle) this._unlock('pacifist');
      if (score >= 2000)     this._unlock('legend');
      const modal = document.getElementById('modal');
      modal.className = 'modal victory';
      document.getElementById('modalTitle').textContent = '🎉 SKAGEN! 🎉';
      document.getElementById('modalBody').innerHTML = `
        <p class="stat-line">You reached the tip of Denmark!</p>
        <p class="stat-line">📅 Days on the road: <span>${this.state.day}</span></p>
        <p class="stat-line">❤ Health remaining: <span>${this.state.health}%</span></p>
        <p class="stat-line">💰 Money left: <span>${this.state.money} kr</span></p>
        <p class="stat-line">🍖 Food left: <span>${this.state.food} kg</span></p>
        <div class="score">SCORE: ${score}</div>
        <p class="stat-line">${this._scoreRating(score)}</p>
        <p class="stat-line" style="margin-top:10px;font-size:11px;color:#81c784">
          The two seas meet here — Kattegat and Skagerrak — just as you have met the end of your journey. 🇩🇰
        </p>`;
      document.getElementById('modalOverlay').classList.add('active');
      this._addLog(`🎉 <strong>YOU REACHED SKAGEN!</strong> Score: ${score}. ${this._scoreRating(score)}`, 'city');
    }

    _showGameOver() {
      this.player.animator.play('scared', true);
      const modal = document.getElementById('modal');
      modal.className = 'modal gameover';
      document.getElementById('modalTitle').textContent = '💀 YOU DIED';
      const distance = this.state.distance;
      const closing = distance > 300 ? 'So close to Skagen... Try again.'
                    : distance > 200 ? 'Past the halfway mark at least.'
                    : 'You barely left Copenhagen. Denmark is unforgiving.';
      document.getElementById('modalBody').innerHTML = `
        <p class="stat-line">The trail claimed another soul.</p>
        <p class="stat-line">📍 Distance: <span>${distance}/${this.config.journey.totalKm} km</span></p>
        <p class="stat-line">📅 Days survived: <span>${this.state.day}</span></p>
        <p class="stat-line">💰 Money left: <span>${this.state.money} kr</span></p>
        <p class="stat-line" style="margin-top:10px;font-size:11px;color:#ef9a9a">${closing}</p>`;
      document.getElementById('modalOverlay').classList.add('active');
      this._addLog(`💀 <strong>GAME OVER</strong> — ${distance} km reached after ${this.state.day} days.`, 'danger');
    }

    restart() {
      document.getElementById('modalOverlay').classList.remove('active');
      this._closeShop();
      const log = document.getElementById('eventLog');
      if (log) log.innerHTML = '';
      this.logEntries = [];
      this.state = this._initialState();
      this.worldOffset = 0;
      this.targetWorldOffset = 0;
      this.timeOfDay = 0.25;
      this.walking = false;
      this.pendingLog = null;
      this.pendingReaction = null;
      this._reactionTimer = 0;
      this.weatherEffect = null;
      this.weatherTimer = 0;
      this.particles.length = 0;
      this.popups.length = 0;
      this.npcs.length = 0;
      this.shakeAmount = 0;
      this.shakeTimer = 0;
      this.flashColor = null;
      this.flashTimer = 0;
      this.rainbowAlpha = 0;
      this._achLossless = true;
      this.player.animator.play('idle', true);
      this._renderUI();
      this._addLog('🇩🇰 <strong>Welcome to Road to Skagen!</strong> 387 km ahead. Copenhagen fades behind you. Survive.', 'system');
      this._addLog('📖 <em>Tips: Shop in towns · Clothes halve cold damage · Map adds 3 km/walk · Medicine restores 40 health</em>', 'system');
    }

    _bindKeys() {
      const c = this.config.controls;
      const inSet = (set, k) => set.includes(k);
      document.addEventListener('keydown', (e) => {
        if (e.target && e.target.tagName === 'INPUT') return;
        const k = e.key;
        if (inSet(c.walk,    k)) this.walk();
        else if (inSet(c.rest,    k)) this.rest();
        else if (inSet(c.shop,    k)) this.state.shopOpen ? this._closeShop() : this.openShop();
        else if (inSet(c.hunt,    k)) this.hunt();
        else if (inSet(c.work,    k)) this.work();
        else if (inSet(c.forage,  k)) this.forage();
        else if (inSet(c.medicine,k)) this.useMedicine();
        else if (inSet(c.restart, k)) this.restart();
      });
    }
  }

  function boot() {
    if (!GF.GAME_CONFIG) {
      console.error('RoadToSkagen: GAME_CONFIG missing.');
      return;
    }
    GF.game = new RoadToSkagenGame(GF.GAME_CONFIG);
    window.RTS = {
      walk     : () => GF.game.walk(),
      rest     : () => GF.game.rest(),
      shop     : () => GF.game.state.shopOpen ? GF.game.closeShop() : GF.game.openShop(),
      hunt     : () => GF.game.hunt(),
      work     : () => GF.game.work(),
      forage   : () => GF.game.forage(),
      medicine : () => GF.game.useMedicine(),
      restart  : () => GF.game.restart(),
      closeShop: () => GF.game.closeShop(),
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})(window.GF = window.GF || {});
