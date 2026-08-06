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
      const rescale = () => this._setupScaling();
      window.addEventListener('resize', rescale);
      window.addEventListener('orientationchange', rescale);
      // iOS reports the post-rotation size late; the visual viewport does not.
      if (window.visualViewport) window.visualViewport.addEventListener('resize', rescale);
    }

    _setupScaling() {
      const parent = this.canvas.parentElement || document.body;
      const vW = window.innerWidth  || this.config.width;
      const vH = window.innerHeight || this.config.height;

      // Game pages commonly wrap the canvas in a fixed-size div (800x600 and
      // friends). On a phone that wrapper is wider than the screen, and since
      // the page centres it, the canvas edges — where touch controls live —
      // end up off-screen. Cap the wrapper at the viewport before measuring.
      if (parent !== document.body && parent !== document.documentElement) {
        parent.style.maxWidth  = vW + 'px';
        parent.style.maxHeight = vH + 'px';
      }

      const pW = Math.min(parent.clientWidth  || vW, vW);
      const pH = Math.min(parent.clientHeight || vH, vH);
      const scaleX = pW / this.config.width;
      const scaleY = pH / this.config.height;
      const scale  = Math.min(scaleX, scaleY);
      this.canvas.style.width  = (this.config.width  * scale) + 'px';
      this.canvas.style.height = (this.config.height * scale) + 'px';
    }

    /**
     * Register a game system (must have optional update(dt,engine) /
     * render(ctx,engine) methods). A system with `overlay === true` renders
     * after the game's own onRender callback, so it always stays on top.
     */
    addSystem(system) {
      this._systems.push(system);
      if (system.init) system.init(this);
      return this;
    }

    /** Remove a system by name or reference; its destroy() runs if present. */
    removeSystem(sysOrName) {
      const i = typeof sysOrName === 'string'
        ? this._systems.findIndex(s => s.name === sysOrName)
        : this._systems.indexOf(sysOrName);
      if (i < 0) return null;
      const [sys] = this._systems.splice(i, 1);
      if (sys.destroy) sys.destroy();
      return sys;
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
      this._systems.forEach(s => { if (s.render && !s.overlay) s.render(this.ctx, this); });
      if (this._onRender) this._onRender(this.ctx, this);
      // Overlays (touch controls) paint last so a game that draws its HUD in
      // onRender cannot bury them.
      this._systems.forEach(s => { if (s.render && s.overlay) s.render(this.ctx, this); });

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
