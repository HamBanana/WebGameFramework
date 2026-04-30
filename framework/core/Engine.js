// GameFramework/framework/core/Engine.js
// Core game loop and canvas management

(function (GF) {
  'use strict';

  class Engine {
    /**
     * @param {Object} config
     * @param {number}  config.width            - Canvas width in pixels
     * @param {number}  config.height           - Canvas height in pixels
     * @param {string}  config.canvasId         - ID of the <canvas> element
     * @param {string}  config.backgroundColor  - Background fill color
     */
    constructor(config = {}) {
      this.config = Object.assign({
        width: 800,
        height: 450,
        canvasId: 'gameCanvas',
        backgroundColor: '#000000',
      }, config);

      this.events = new GF.EventBus();
      this.input  = new GF.InputManager();

      this.canvas = document.getElementById(this.config.canvasId);
      if (!this.canvas) {
        this.canvas = document.createElement('canvas');
        this.canvas.id = this.config.canvasId;
        document.body.appendChild(this.canvas);
      }
      this.ctx = this.canvas.getContext('2d');
      this.canvas.width  = this.config.width;
      this.canvas.height = this.config.height;

      this._running   = false;
      this._lastTime  = 0;
      this._frameId   = null;
      this._systems   = [];

      // User-supplied callbacks
      this._onUpdate = null;
      this._onRender = null;

      // Performance
      this.fps         = 0;
      this._frameCount = 0;
      this._fpsTimer   = 0;

      // Scale canvas to fill container while preserving aspect ratio
      this._setupScaling();
      window.addEventListener('resize', () => this._setupScaling());
    }

    _setupScaling() {
      const parent = this.canvas.parentElement || document.body;
      const pW = parent.clientWidth  || window.innerWidth;
      const pH = parent.clientHeight || window.innerHeight;
      const scaleX = pW / this.config.width;
      const scaleY = pH / this.config.height;
      const scale  = Math.min(scaleX, scaleY);
      this.canvas.style.width  = (this.config.width  * scale) + 'px';
      this.canvas.style.height = (this.config.height * scale) + 'px';
    }

    /** Register a game system (must have optional update(dt,engine) / render(ctx,engine) methods). */
    addSystem(system) {
      this._systems.push(system);
      if (system.init) system.init(this);
      return this;
    }

    /** Set the update callback: fn(dt, engine) */
    onUpdate(fn) { this._onUpdate = fn; return this; }

    /** Set the render callback: fn(ctx, engine) */
    onRender(fn) { this._onRender = fn; return this; }

    /** Start the game loop. */
    start() {
      this._running  = true;
      this._lastTime = performance.now();
      this._frameId  = requestAnimationFrame(this._loop.bind(this));
      this.events.emit('engine:start');
      return this;
    }

    /** Stop the game loop. */
    stop() {
      this._running = false;
      if (this._frameId) {
        cancelAnimationFrame(this._frameId);
        this._frameId = null;
      }
      this.events.emit('engine:stop');
      return this;
    }

    _loop(now) {
      if (!this._running) return;

      const rawDt = (now - this._lastTime) / 1000;
      const dt    = Math.min(rawDt, 0.05); // cap to avoid spiral of death
      this._lastTime = now;

      // FPS counter
      this._frameCount++;
      this._fpsTimer += rawDt;
      if (this._fpsTimer >= 1) {
        this.fps = this._frameCount;
        this._frameCount = 0;
        this._fpsTimer   = 0;
      }

      // --- Update ---
      this._systems.forEach(s => s.update && s.update(dt, this));
      if (this._onUpdate) this._onUpdate(dt, this);

      // --- Render ---
      if (this.config.backgroundColor === 'transparent') {
        this.ctx.clearRect(0, 0, this.config.width, this.config.height);
      } else {
        this.ctx.fillStyle = this.config.backgroundColor;
        this.ctx.fillRect(0, 0, this.config.width, this.config.height);
      }
      this._systems.forEach(s => s.render && s.render(this.ctx, this));
      if (this._onRender) this._onRender(this.ctx, this);

      // Flush one-frame input state
      this.input.flush();

      this._frameId = requestAnimationFrame(this._loop.bind(this));
    }

    /** Look up a registered system by name. */
    getSystem(name) {
      return this._systems.find(s => s.name === name) || null;
    }
  }

  GF.Engine = Engine;

})(window.GF = window.GF || {});
