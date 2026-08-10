// GameFramework/framework/systems/ParticleSystem.js
// Configurable particle emitter system. ParticleSystem manages all active emitters
// and hooks into the engine loop; ParticleEmitter is created per-effect.
//
// Usage:
//   const particles = new GF.ParticleSystem();
//   engine.addSystem(particles);
//
//   // One-shot burst (e.g. hit effect):
//   particles.burst(x, y, {
//     count: 20,
//     colors: ['#ff4400', '#ffaa00', '#ffffff'],
//     speed: [80, 200],
//     life: [0.3, 0.7],
//     size: [3, 8],
//     gravity: 400,
//     fadeOut: true,
//     shrink: true,
//   });
//
//   // Continuous emitter (e.g. fire):
//   const fire = particles.create({
//     x: 200, y: 300,
//     rate: 30,               // particles per second
//     colors: ['#ff6600', '#ffcc00'],
//     speed: [40, 100],
//     direction: -Math.PI / 2,  // upward
//     spread: Math.PI / 6,
//     life: [0.4, 0.9],
//     gravity: -80,
//     fadeOut: true,
//   });
//   // ... later:
//   fire.stop();

(function (GF) {
  'use strict';

  // ─── Particle (internal data object) ──────────────────────────────────────

  class Particle {
    constructor() {
      this.x = 0; this.y = 0;
      this.vx = 0; this.vy = 0;
      this.life = 1; this.maxLife = 1;
      this.size = 4; this.startSize = 4;
      this.color = '#ffffff';
      this.alpha = 1;
      this.rotation = 0;
      this.rotSpeed = 0;
      this.gravity = 0;
      this.active = false;
    }

    reset() {
      this.x = this.y = this.vx = this.vy = 0;
      this.life = this.maxLife = 1;
      this.size = this.startSize = 4;
      this.color = '#ffffff';
      this.alpha = 1;
      this.rotation = this.rotSpeed = 0;
      this.gravity = 0;
      this.active = false;
    }
  }

  // ─── ObjectPool (internal) ────────────────────────────────────────────────

  class Pool {
    constructor(Factory, size = 256) {
      this._pool = Array.from({ length: size }, () => new Factory());
    }
    get() {
      for (let i = 0; i < this._pool.length; i++) {
        if (!this._pool[i].active) return this._pool[i];
      }
      // Pool exhausted — create overflow
      const p = new Particle();
      this._pool.push(p);
      return p;
    }
  }

  // ─── ParticleEmitter ──────────────────────────────────────────────────────

  /**
   * Configuration properties (all optional):
   *
   * Position
   *   x, y          {number}    Emit origin
   *   radius        {number}    Emit within a circle of this radius (default 0)
   *
   * Direction / velocity
   *   direction     {number}    Base angle in radians (default 0 = right)
   *   spread        {number}    Half-angle spread in radians (default Math.PI = all directions)
   *   speed         {[min,max]} Speed range [px/s] (default [50, 150])
   *
   * Appearance
   *   colors        {string[]}  Pool of colors, picked randomly (default ['#ffffff'])
   *   size          {[min,max]} Particle radius range (default [2, 6])
   *   shape         {'circle'|'square'|'star'} (default 'circle')
   *   fadeOut       {boolean}   Alpha fades to 0 over lifetime (default true)
   *   shrink        {boolean}   Size shrinks to 0 over lifetime (default false)
   *   rotation      {boolean}   Particles spin (default false)
   *
   * Physics
   *   gravity       {number}    Downward acceleration px/s² (default 0; negative = upward)
   *   friction      {number}    Velocity multiplied by this each second (default 1 = none)
   *
   * Lifetime
   *   life          {[min,max]} Particle lifetime range in seconds (default [0.5, 1.0])
   *
   * Emission mode
   *   rate          {number}    Continuous: particles per second (default 0 = burst-only)
   *   count         {number}    Burst count (used with burst() or emitter.emitBurst())
   *   duration      {number}    Auto-stop after this many seconds (0 = infinite)
   *
   * Callbacks
   *   onEmpty       {function}  Called when emitter has no more active particles
   */
  class ParticleEmitter {
    constructor(config = {}, pool) {
      this._pool = pool;
      this._particles = [];
      this._running   = false;
      this._elapsed   = 0;
      this._rateAccum = 0;

      // Apply config with defaults
      this.x         = config.x         ?? 0;
      this.y         = config.y         ?? 0;
      this.radius    = config.radius    ?? 0;
      this.direction = config.direction ?? 0;
      this.spread    = config.spread    ?? Math.PI;
      this.speed     = config.speed     ?? [50, 150];
      this.colors    = config.colors    ?? ['#ffffff'];
      this.size      = config.size      ?? [2, 6];
      this.shape     = config.shape     ?? 'circle';
      this.fadeOut   = config.fadeOut   ?? true;
      this.shrink    = config.shrink    ?? false;
      this.rotation  = config.rotation  ?? false;
      this.gravity   = config.gravity   ?? 0;
      this.friction  = config.friction  ?? 1;
      this.life      = config.life      ?? [0.5, 1.0];
      this.rate      = config.rate      ?? 0;
      this.count     = config.count     ?? 10;
      this.duration  = config.duration  ?? 0;
      this.onEmpty   = config.onEmpty   ?? null;

      /** True after start() or emitBurst(); false after stop(). */
      this.active = false;
    }

    /** Start continuous emission (uses config.rate). */
    start() {
      this._running = true;
      this.active   = true;
      this._elapsed = 0;
      return this;
    }

    /** Stop new emission; existing particles finish their lifetime. */
    stop() {
      this._running = false;
      return this;
    }

    /** Emit a burst of count particles immediately. */
    emitBurst(count) {
      const n = count ?? this.count;
      for (let i = 0; i < n; i++) this._spawn();
      this.active = true;
      return this;
    }

    /** True if there are still live particles. */
    get hasParticles() {
      return this._particles.some(p => p.active);
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    update(dt) {
      if (!this.active) return;

      this._elapsed += dt;

      // Continuous emission
      if (this._running && this.rate > 0) {
        this._rateAccum += this.rate * dt;
        while (this._rateAccum >= 1) {
          this._spawn();
          this._rateAccum--;
        }
      }

      // Auto-duration
      if (this.duration > 0 && this._elapsed >= this.duration) {
        this._running = false;
      }

      // Update existing particles
      let anyAlive = false;
      for (const p of this._particles) {
        if (!p.active) continue;

        p.life -= dt;
        if (p.life <= 0) { p.active = false; continue; }

        const lifeRatio = 1 - p.life / p.maxLife; // 0 at birth → 1 at death
        const friction  = Math.pow(this.friction, dt);

        p.vy += p.gravity * dt;
        p.vx *= friction;
        p.vy *= friction;
        p.x  += p.vx * dt;
        p.y  += p.vy * dt;
        p.rotation += p.rotSpeed * dt;

        if (this.fadeOut) p.alpha = Math.max(0, 1 - lifeRatio);
        if (this.shrink)  p.size  = Math.max(0, p.startSize * (1 - lifeRatio));

        anyAlive = true;
      }

      // Clean up finished particles in-place
      let write = 0;
      for (let i = 0; i < this._particles.length; i++) {
        if (this._particles[i].active) this._particles[write++] = this._particles[i];
      }
      this._particles.length = write;

      if (!anyAlive && !this._running) {
        this.active = false;
        if (this.onEmpty) this.onEmpty(this);
      }
    }

    render(ctx) {
      const ps = this._particles;
      if (!this.active && ps.length === 0) return;
      const shape = this.shape;
      ctx.save();
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        if (!p.active) continue;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        if (p.rotation !== 0) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          if (shape === 'square') ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
          else if (shape === 'star') this._drawStar(ctx, 0, 0, p.size);
          else { ctx.beginPath(); ctx.arc(0, 0, p.size, 0, 6.283185307179586); ctx.fill(); }
          ctx.restore();
        } else {
          const x = p.x, y = p.y, s = p.size;
          if (shape === 'square') ctx.fillRect(x - s, y - s, s * 2, s * 2);
          else if (shape === 'star') this._drawStar(ctx, x, y, s);
          else { ctx.beginPath(); ctx.arc(x, y, s, 0, 6.283185307179586); ctx.fill(); }
        }
      }
      ctx.restore();
    }

    _drawShape(ctx, x, y, size) {
      switch (this.shape) {
        case 'square':
          ctx.fillRect(x - size, y - size, size * 2, size * 2);
          break;
        case 'star':
          this._drawStar(ctx, x, y, size);
          break;
        default: // 'circle'
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
    }

    _drawStar(ctx, x, y, r) {
      const pts = 5, inner = r * 0.45;
      ctx.beginPath();
      for (let i = 0; i < pts * 2; i++) {
        const angle = (i * Math.PI / pts) - Math.PI / 2;
        const dist  = i % 2 === 0 ? r : inner;
        const px = x + Math.cos(angle) * dist;
        const py = y + Math.sin(angle) * dist;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }

    _spawn() {
      const p = this._pool.get();
      p.reset();
      p.active = true;

      // Position (within radius)
      if (this.radius > 0) {
        const angle = Math.random() * Math.PI * 2;
        const dist  = Math.random() * this.radius;
        p.x = this.x + Math.cos(angle) * dist;
        p.y = this.y + Math.sin(angle) * dist;
      } else {
        p.x = this.x;
        p.y = this.y;
      }

      // Velocity
      const angle = this.direction + (Math.random() - 0.5) * 2 * this.spread;
      const spd   = this.speed[0] + Math.random() * (this.speed[1] - this.speed[0]);
      p.vx = Math.cos(angle) * spd;
      p.vy = Math.sin(angle) * spd;

      // Appearance
      p.color     = this.colors[Math.floor(Math.random() * this.colors.length)];
      p.startSize = this.size[0] + Math.random() * (this.size[1] - this.size[0]);
      p.size      = p.startSize;
      p.alpha     = 1;

      // Physics
      p.gravity = this.gravity;

      // Lifetime
      p.maxLife = this.life[0] + Math.random() * (this.life[1] - this.life[0]);
      p.life    = p.maxLife;

      // Rotation
      if (this.rotation) {
        p.rotation = Math.random() * Math.PI * 2;
        p.rotSpeed = (Math.random() - 0.5) * 10;
      }

      this._particles.push(p);
    }
  }

  // ─── ParticleSystem ───────────────────────────────────────────────────────

  class ParticleSystem {
    /**
     * @param {Object} [opts]
     * @param {number} [opts.poolSize=512] - Shared particle pool size
     */
    constructor(opts = {}) {
      this.name   = 'ParticleSystem';
      this._pool  = new Pool(Particle, opts.poolSize ?? 512);
      this._emitters = [];  // array is faster than Set for iteration
      /**
       * Global time multiplier applied to every emitter update. 1 = real time.
       * Set below 1 for slow-motion (e.g. a cinematic) so particle debris
       * slows along with the rest of the scene. Default 1 (no change).
       */
      this.timeScale = 1;
    }

    // ── Engine hooks ──────────────────────────────────────────────────────────

    init(_engine) {}

    update(dt, _engine) {
      const scaled = dt * this.timeScale;
      let write = 0;
      const emitters = this._emitters;
      for (let i = 0; i < emitters.length; i++) {
        const e = emitters[i];
        e.update(scaled);
        if (e.active || e.hasParticles) {
          emitters[write++] = e;
        }
      }
      emitters.length = write;
    }

    render(ctx, _engine) {
      const emitters = this._emitters;
      for (let i = 0; i < emitters.length; i++) {
        emitters[i].render(ctx);
      }
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Create a new ParticleEmitter but do NOT start it yet.
     * Call emitter.start() or emitter.emitBurst() to activate.
     * @param {Object} config - See ParticleEmitter docs
     * @returns {ParticleEmitter}
     */
    create(config = {}) {
      const emitter = new ParticleEmitter(config, this._pool);
      this._emitters.push(emitter);
      return emitter;
    }

    /**
     * Convenience: create, burst, and auto-cleanup when finished.
     * @param {number} x
     * @param {number} y
     * @param {Object} [config]
     * @returns {ParticleEmitter}
     */
    burst(x, y, config = {}) {
      const emitter = this.create({ ...config, x, y });
      emitter.emitBurst(config.count ?? 20);
      return emitter;
    }

    /**
     * Convenience: create and start a continuous emitter.
     * @param {number} x
     * @param {number} y
     * @param {Object} [config]  Must include config.rate
     * @returns {ParticleEmitter}
     */
    startEmitter(x, y, config = {}) {
      const emitter = this.create({ ...config, x, y });
      emitter.start();
      return emitter;
    }

    /** Stop and remove all emitters immediately. */
    clear() {
      for (let i = 0; i < this._emitters.length; i++) {
        this._emitters[i].stop();
        this._emitters[i]._particles = [];
      }
      this._emitters.length = 0;
    }

    /** Number of active emitters. */
    get emitterCount() { return this._emitters.length; }

    /** Total live particle count across all emitters. */
    get particleCount() {
      let n = 0;
      for (let i = 0; i < this._emitters.length; i++) {
        n += this._emitters[i]._particles.length;
      }
      return n;
    }
  }

  GF.Particle        = Particle;
  GF.ParticleEmitter = ParticleEmitter;
  GF.ParticleSystem  = ParticleSystem;

})(window.GF = window.GF || {});
