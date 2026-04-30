// GameFramework.bundle.js - AUTO-GENERATED, DO NOT EDIT
// Built: 2026-04-30T21:19:58.331Z
// Source: framework/build.js
// Include as: <script src="../../framework/GameFramework.bundle.js"></script>

// -- utils/MathUtils.js ------------------------------------------

// GameFramework/framework/utils/MathUtils.js
// Math utilities: Vector2, scalars, random helpers, angle utils, easing functions.
// All members hang off GF.Math — no class needed, just a plain namespace object.

(function (GF) {
  'use strict';

  // ─── Easing Functions ───────────────────────────────────────────────────────
  // All take t in [0, 1] and return a value in (approximately) [0, 1].

  const ease = {
    linear:      t => t,

    inQuad:      t => t * t,
    outQuad:     t => t * (2 - t),
    inOutQuad:   t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

    inCubic:     t => t * t * t,
    outCubic:    t => (--t) * t * t + 1,
    inOutCubic:  t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

    inQuart:     t => t * t * t * t,
    outQuart:    t => 1 - (--t) * t * t * t,
    inOutQuart:  t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,

    inSine:      t => 1 - Math.cos(t * Math.PI / 2),
    outSine:     t => Math.sin(t * Math.PI / 2),
    inOutSine:   t => -(Math.cos(Math.PI * t) - 1) / 2,

    inExpo:      t => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
    outExpo:     t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    inOutExpo:   t => t === 0 ? 0 : t === 1 ? 1
                       : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2
                       : (2 - Math.pow(2, -20 * t + 10)) / 2,

    inBack:      t => { const c1 = 1.70158; return c1 * t * t * t - c1 * t * t; },
    outBack:     t => { const c1 = 1.70158; t--; return 1 + c1 * t * t * t + c1 * t * t; },

    outBounce:   t => {
      if (t < 1 / 2.75)      return 7.5625 * t * t;
      if (t < 2 / 2.75)      { t -= 1.5   / 2.75; return 7.5625 * t * t + 0.75; }
      if (t < 2.5 / 2.75)   { t -= 2.25  / 2.75; return 7.5625 * t * t + 0.9375; }
                               t -= 2.625 / 2.75; return 7.5625 * t * t + 0.984375;
    },
    inBounce:    t => 1 - ease.outBounce(1 - t),

    outElastic:  t => {
      if (t === 0 || t === 1) return t;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
    },
    inElastic:   t => {
      if (t === 0 || t === 1) return t;
      return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * (2 * Math.PI) / 3);
    },
  };

  // ─── Vector2 ────────────────────────────────────────────────────────────────
  // Returns plain {x, y} objects — lightweight and JSON-friendly.

  const TAU = Math.PI * 2;

  const Vec2 = {
    /** Create a new vector. */
    create(x = 0, y = 0) { return { x, y }; },

    /** Add two vectors, returns new vector. */
    add(a, b) { return { x: a.x + b.x, y: a.y + b.y }; },

    /** Subtract b from a, returns new vector. */
    sub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; },

    /** Scale vector by scalar, returns new vector. */
    scale(a, s) { return { x: a.x * s, y: a.y * s }; },

    /** Dot product. */
    dot(a, b) { return a.x * b.x + a.y * b.y; },

    /** Magnitude (length) of vector. */
    mag(a) { return Math.sqrt(a.x * a.x + a.y * a.y); },

    /** Squared magnitude (avoids sqrt, good for comparisons). */
    magSq(a) { return a.x * a.x + a.y * a.y; },

    /** Normalize to unit vector; returns zero vector if magnitude is 0. */
    normalize(a) {
      const m = Vec2.mag(a);
      return m === 0 ? { x: 0, y: 0 } : { x: a.x / m, y: a.y / m };
    },

    /** Distance between two points. */
    dist(a, b) { return Vec2.mag(Vec2.sub(a, b)); },

    /** Squared distance (avoids sqrt). */
    distSq(a, b) { const d = Vec2.sub(a, b); return d.x * d.x + d.y * d.y; },

    /** Linear interpolate between a and b by t. */
    lerp(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; },

    /** Vector from angle (radians) and magnitude. */
    fromAngle(angle, mag = 1) { return { x: Math.cos(angle) * mag, y: Math.sin(angle) * mag }; },

    /** Angle of vector in radians. */
    angle(a) { return Math.atan2(a.y, a.x); },

    /** Perpendicular vector (rotated 90° clockwise). */
    perp(a) { return { x: a.y, y: -a.x }; },

    /** Rotate vector by angle (radians). */
    rotate(a, angle) {
      const cos = Math.cos(angle), sin = Math.sin(angle);
      return { x: a.x * cos - a.y * sin, y: a.x * sin + a.y * cos };
    },

    /** Clamp magnitude to a maximum length. */
    clampMag(a, maxMag) {
      const m = Vec2.mag(a);
      return m > maxMag ? Vec2.scale(a, maxMag / m) : { x: a.x, y: a.y };
    },
  };

  // ─── GF.Math namespace ──────────────────────────────────────────────────────

  GF.Math = {
    TAU,
    PI: Math.PI,

    // ── Scalar helpers ──────────────────────────────────────────────────────

    /** Clamp v between min and max. */
    clamp(v, min, max) { return v < min ? min : v > max ? max : v; },

    /** Linear interpolate from a to b by t. */
    lerp(a, b, t) { return a + (b - a) * t; },

    /** Map v from [inMin, inMax] to [outMin, outMax]. */
    map(v, inMin, inMax, outMin, outMax) {
      return outMin + (outMax - outMin) * ((v - inMin) / (inMax - inMin));
    },

    /** Map v from [inMin, inMax] to [outMin, outMax], clamped to output range. */
    mapClamp(v, inMin, inMax, outMin, outMax) {
      const t = GF.Math.clamp((v - inMin) / (inMax - inMin), 0, 1);
      return outMin + (outMax - outMin) * t;
    },

    /** Smooth-step interpolation (smooth start and end). */
    smoothstep(edge0, edge1, t) {
      t = GF.Math.clamp((t - edge0) / (edge1 - edge0), 0, 1);
      return t * t * (3 - 2 * t);
    },

    /** Wrap v into the range [min, max). */
    wrap(v, min, max) {
      const range = max - min;
      return ((v - min) % range + range) % range + min;
    },

    /** Round to a given number of decimal places. */
    roundTo(v, decimals) {
      const factor = Math.pow(10, decimals);
      return Math.round(v * factor) / factor;
    },

    /** Convert degrees to radians. */
    toRad(degrees) { return degrees * (Math.PI / 180); },

    /** Convert radians to degrees. */
    toDeg(radians) { return radians * (180 / Math.PI); },

    /** Shortest angular difference from a to b (radians), in [-π, π]. */
    angleDiff(a, b) {
      let d = (b - a) % TAU;
      if (d >  Math.PI) d -= TAU;
      if (d < -Math.PI) d += TAU;
      return d;
    },

    /** Angle from point (x1,y1) to point (x2,y2) in radians. */
    angleTo(x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1); },

    // ── Random helpers ──────────────────────────────────────────────────────

    /** Random float in [min, max). */
    rand(min = 0, max = 1) { return min + Math.random() * (max - min); },

    /** Random integer in [min, max] inclusive. */
    randInt(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); },

    /** Random element from an array. */
    randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; },

    /** Random element from a weighted array: [{item, weight}, ...]. */
    randWeighted(items) {
      let total = items.reduce((s, i) => s + i.weight, 0);
      let r = Math.random() * total;
      for (const item of items) { r -= item.weight; if (r <= 0) return item.item; }
      return items[items.length - 1].item;
    },

    /** Random angle in [0, TAU). */
    randAngle() { return Math.random() * TAU; },

    /** Random boolean, with optional probability of true (default 0.5). */
    randBool(p = 0.5) { return Math.random() < p; },

    /** Shuffle array in-place using Fisher-Yates; returns the array. */
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },

    // ── Geometry helpers ────────────────────────────────────────────────────

    /** True if point (px, py) is inside AABB. */
    pointInRect(px, py, rx, ry, rw, rh) {
      return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    },

    /** True if point (px, py) is inside circle (cx, cy, r). */
    pointInCircle(px, py, cx, cy, r) {
      const dx = px - cx, dy = py - cy;
      return dx * dx + dy * dy <= r * r;
    },

    /** True if two AABBs overlap. */
    rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
      return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    },

    // ── Submodules ──────────────────────────────────────────────────────────

    /** Vec2 utilities — all operations return new {x, y} objects. */
    Vec2,

    /** Easing functions — all take t in [0,1] and return a number. */
    ease,
  };

})(window.GF = window.GF || {});


// -- core/EventBus.js --------------------------------------------

// GameFramework/framework/core/EventBus.js
// Simple publish/subscribe event bus for decoupled system communication

(function (GF) {
  'use strict';

  class EventBus {
    constructor() {
      this._listeners = {};
    }

    /**
     * Subscribe to an event.
     * @param {string} event
     * @param {Function} callback
     * @returns {Function} unsubscribe function
     */
    on(event, callback) {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(callback);
      return () => this.off(event, callback);
    }

    /** Unsubscribe from an event. */
    off(event, callback) {
      if (!this._listeners[event]) return;
      this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    }

    /** Publish an event with optional data. */
    emit(event, data) {
      if (!this._listeners[event]) return;
      this._listeners[event].forEach(cb => cb(data));
    }

    /** Subscribe once; auto-unsubscribes after first call. */
    once(event, callback) {
      const unsub = this.on(event, (data) => {
        callback(data);
        unsub();
      });
    }

    /** Remove all listeners for an event (or all events if none specified). */
    clear(event) {
      if (event) {
        delete this._listeners[event];
      } else {
        this._listeners = {};
      }
    }
  }

  GF.EventBus = EventBus;

})(window.GF = window.GF || {});


// -- core/InputManager.js ----------------------------------------

// GameFramework/framework/core/InputManager.js
// Keyboard input handler with named action bindings

(function (GF) {
  'use strict';

  class InputManager {
    constructor() {
      this._held = new Set();         // currently held keys (by KeyboardEvent.code)
      this._justPressed = new Set();  // pressed this frame
      this._justReleased = new Set(); // released this frame
      this._bindings = {};            // action -> [code, ...]

      window.addEventListener('keydown', e => {
        if (!this._held.has(e.code)) {
          this._held.add(e.code);
          this._justPressed.add(e.code);
        }
        // Prevent arrow/space scroll
        if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
          e.preventDefault();
        }
      });

      window.addEventListener('keyup', e => {
        this._held.delete(e.code);
        this._justReleased.add(e.code);
      });

      // Clear state when window loses focus
      window.addEventListener('blur', () => {
        this._held.clear();
        this._justPressed.clear();
        this._justReleased.clear();
      });
    }

    /**
     * Bind an action name to one or more key codes.
     * @param {string} action - logical action name
     * @param {...string} codes - KeyboardEvent.code values (e.g. 'KeyA', 'ArrowLeft')
     */
    bind(action, ...codes) {
      this._bindings[action] = codes;
      return this;
    }

    /** True while the key/action is held down. */
    isDown(action) {
      const codes = this._bindings[action];
      if (!codes) return this._held.has(action);
      return codes.some(c => this._held.has(c));
    }

    /** True for one frame when the key/action was just pressed. */
    wasPressed(action) {
      const codes = this._bindings[action];
      if (!codes) return this._justPressed.has(action);
      return codes.some(c => this._justPressed.has(c));
    }

    /** True for one frame when the key/action was just released. */
    wasReleased(action) {
      const codes = this._bindings[action];
      if (!codes) return this._justReleased.has(action);
      return codes.some(c => this._justReleased.has(c));
    }

    /**
     * Call at the end of each game frame to clear one-frame states.
     * The Engine calls this automatically.
     */
    flush() {
      this._justPressed.clear();
      this._justReleased.clear();
    }
  }

  GF.InputManager = InputManager;

})(window.GF = window.GF || {});


// -- core/AssetLoader.js -----------------------------------------

// GameFramework/framework/core/AssetLoader.js
// Centralized asset preloader. Declare all assets upfront, then call load()
// which returns a Promise that resolves once everything is ready.
//
// Supported asset types:
//   'image' → HTMLImageElement
//   'audio' → AudioBuffer  (decoded via Web Audio API)
//   'json'  → parsed JS object
//   'text'  → raw string
//
// Usage in a game:
//   const loader = new GF.AssetLoader();
//   loader.addImage('hero', 'sprites/hero.png');
//   loader.addAudio('jump', 'audio/jump.ogg');
//   loader.addJSON('level1', 'data/level1.json');
//
//   await loader.load(progress => console.log(`${Math.round(progress * 100)}%`));
//
//   const img = loader.get('hero');  // → HTMLImageElement

(function (GF) {
  'use strict';

  class AssetLoader {
    constructor() {
      /** @type {Map<string, {type: string, url: string}>} */
      this._queue = new Map();

      /** @type {Map<string, any>} */
      this._assets = new Map();

      this._loaded   = false;
      this._audioCtx = null; // lazy — only created if audio assets are queued
    }

    // ── Registration ──────────────────────────────────────────────────────────

    /**
     * Register an asset to preload.
     * @param {string} key   - Unique name used with get()
     * @param {string} type  - 'image' | 'audio' | 'json' | 'text'
     * @param {string} url   - Path to the asset
     */
    add(key, type, url) {
      if (this._loaded) {
        console.warn(`[AssetLoader] add("${key}") called after load() — use addAndLoad() instead.`);
      }
      this._queue.set(key, { type, url });
      return this;
    }

    /** Shorthand for add(key, 'image', url). */
    addImage(key, url) { return this.add(key, 'image', url); }

    /** Shorthand for add(key, 'audio', url). */
    addAudio(key, url) { return this.add(key, 'audio', url); }

    /** Shorthand for add(key, 'json', url). */
    addJSON(key, url)  { return this.add(key, 'json',  url); }

    /** Shorthand for add(key, 'text', url). */
    addText(key, url)  { return this.add(key, 'text',  url); }

    // ── Loading ───────────────────────────────────────────────────────────────

    /**
     * Load all registered assets.
     *
     * @param {function(progress: number, loaded: number, total: number): void} [onProgress]
     *   Called after each asset resolves. progress is [0, 1].
     * @returns {Promise<AssetLoader>} Resolves with `this` when all assets are done.
     */
    load(onProgress) {
      const entries = [...this._queue.entries()];
      const total   = entries.length;

      if (total === 0) {
        this._loaded = true;
        return Promise.resolve(this);
      }

      let loadedCount = 0;

      const tick = () => {
        loadedCount++;
        if (onProgress) onProgress(loadedCount / total, loadedCount, total);
      };

      const promises = entries.map(([key, { type, url }]) => {
        return this._loadOne(type, url)
          .then(asset => {
            this._assets.set(key, asset);
            tick();
          })
          .catch(err => {
            console.error(`[AssetLoader] Failed to load "${key}" (${url}):`, err);
            this._assets.set(key, null);
            tick(); // still count as processed so progress reaches 100%
          });
      });

      return Promise.all(promises).then(() => {
        this._loaded = true;
        return this;
      });
    }

    /**
     * Add a single asset and load it immediately.
     * Useful for on-demand loading after the main preload is done.
     * @returns {Promise<any>} Resolves with the loaded asset.
     */
    addAndLoad(key, type, url) {
      return this._loadOne(type, url).then(asset => {
        this._assets.set(key, asset);
        this._queue.set(key, { type, url });
        return asset;
      });
    }

    // ── Access ────────────────────────────────────────────────────────────────

    /**
     * Retrieve a loaded asset by key.
     * Returns null (and logs a warning) if not found.
     * @param {string} key
     * @returns {any}
     */
    get(key) {
      if (!this._assets.has(key)) {
        console.warn(`[AssetLoader] Asset "${key}" not found. Was it registered and loaded?`);
        return null;
      }
      return this._assets.get(key);
    }

    /** True if the given key has been loaded (even if it failed — value will be null). */
    has(key) { return this._assets.has(key); }

    /** True once load() has completed (regardless of errors). */
    get isLoaded() { return this._loaded; }

    /** Number of assets currently registered in the queue. */
    get total() { return this._queue.size; }

    // ── AudioContext access ───────────────────────────────────────────────────

    /**
     * The Web Audio AudioContext, created lazily on first audio asset.
     * AudioSystem can reuse this context.
     * @returns {AudioContext|null}
     */
    get audioContext() { return this._audioCtx; }

    // ── Internal ──────────────────────────────────────────────────────────────

    _loadOne(type, url) {
      switch (type) {
        case 'image': return this._loadImage(url);
        case 'audio': return this._loadAudio(url);
        case 'json':  return fetch(url).then(r => r.json());
        case 'text':  return fetch(url).then(r => r.text());
        default:
          return Promise.reject(new Error(`[AssetLoader] Unknown asset type: "${type}"`));
      }
    }

    _loadImage(url) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload  = () => resolve(img);
        img.onerror = () => reject(new Error(`Image not found: ${url}`));
        img.src = url;
      });
    }

    _loadAudio(url) {
      if (!this._audioCtx) {
        this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      return fetch(url)
        .then(r => r.arrayBuffer())
        .then(buf => this._audioCtx.decodeAudioData(buf));
    }
  }

  GF.AssetLoader = AssetLoader;

})(window.GF = window.GF || {});


// -- core/Engine.js ----------------------------------------------

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


// -- core/SceneManager.js ----------------------------------------

// GameFramework/framework/core/SceneManager.js
// Scene lifecycle management with a push/pop stack.
//
// Scene lifecycle:
//   init(engine)    — called once the first time a scene is pushed. Set up objects here.
//   enter(engine)   — called each time the scene becomes the active (top) scene.
//   update(dt, engine) — called every frame while the scene is on top.
//   render(ctx, engine) — called every frame while the scene is on top.
//   exit(engine)    — called when the scene is covered by another or popped.
//   destroy(engine) — called when the scene is permanently removed (pop / replace).
//
// Usage:
//   const scenes = new GF.SceneManager();
//   engine.addSystem(scenes);
//
//   class MenuScene extends GF.Scene {
//     enter(engine) { /* set up menu */ }
//     update(dt, engine) { if (engine.input.wasPressed('start')) scenes.push(new GameScene()); }
//     render(ctx, engine) { /* draw menu */ }
//   }
//
//   scenes.push(new MenuScene(), engine);
//   engine.start();
//
// Stack operations:
//   scenes.push(scene)    — push a new scene on top
//   scenes.pop()          — remove current scene, return to previous
//   scenes.replace(scene) — swap current scene with a new one (no stack growth)
//   scenes.clear()        — destroy and remove all scenes

(function (GF) {
  'use strict';

  // ─── Scene (base class) ───────────────────────────────────────────────────

  /**
   * Base class for all scenes. Extend and override any lifecycle hooks you need.
   * None of the methods are abstract — all default to no-ops.
   */
  class Scene {
    /** Called once, the first time this scene is pushed onto the stack. */
    // eslint-disable-next-line no-unused-vars
    init(engine) {}

    /** Called each time this scene becomes the top-most active scene. */
    // eslint-disable-next-line no-unused-vars
    enter(engine) {}

    /**
     * Called every frame while this scene is active.
     * @param {number} dt - Delta time in seconds
     * @param {GF.Engine} engine
     */
    // eslint-disable-next-line no-unused-vars
    update(dt, engine) {}

    /**
     * Called every frame while this scene is active, after update.
     * @param {CanvasRenderingContext2D} ctx
     * @param {GF.Engine} engine
     */
    // eslint-disable-next-line no-unused-vars
    render(ctx, engine) {}

    /** Called when this scene is covered by another scene (push) or removed (pop). */
    // eslint-disable-next-line no-unused-vars
    exit(engine) {}

    /** Called when this scene is permanently removed (pop or replace). */
    // eslint-disable-next-line no-unused-vars
    destroy(engine) {}
  }

  // ─── SceneManager ─────────────────────────────────────────────────────────

  class SceneManager {
    constructor() {
      this.name = 'SceneManager';

      /** @type {Scene[]} */
      this._stack  = [];

      /** @type {GF.Engine|null} */
      this._engine = null;

      // Pending operations are queued and flushed after each update/render pass,
      // so scenes never mutate the stack mid-frame.
      this._pending = []; // { op: 'push'|'pop'|'replace'|'clear', scene? }

      /**
       * Active transition overlay, or null when idle.
       * While set, scene updates are frozen and the overlay is rendered on top.
       * @type {GF.TransitionHandle|null}
       */
      this._activeTransition = null;
    }

    // ── Engine hooks ──────────────────────────────────────────────────────────

    init(engine) {
      this._engine = engine;
    }

    update(dt, engine) {
      // While a transition is playing the overlay animates via TweenSystem;
      // scene updates are frozen to prevent state changes mid-transition.
      if (this._activeTransition) return;

      this._flushPending(engine);

      const top = this._top();
      if (top) top.update(dt, engine);
    }

    render(ctx, engine) {
      const top = this._top();
      if (top) top.render(ctx, engine);

      // Draw the transition overlay on top of the scene.
      if (this._activeTransition && this._activeTransition.active) {
        const { width, height } = engine.canvas;
        this._activeTransition.render(ctx, width, height);
      }
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Push a new scene on top of the stack. The current scene is paused (exit called).
     * The new scene's init() is called if this is its first push, then enter().
     * @param {Scene} scene
     * @param {GF.Engine} [engine] - If provided, executes immediately (before next frame)
     */
    push(scene, engine) {
      if (engine) {
        this._executePush(scene, engine);
      } else {
        this._pending.push({ op: 'push', scene });
      }
      return this;
    }

    /**
     * Remove the top scene from the stack (exit + destroy), then enter the one below it.
     * @param {GF.Engine} [engine]
     */
    pop(engine) {
      if (engine) {
        this._executePop(engine);
      } else {
        this._pending.push({ op: 'pop' });
      }
      return this;
    }

    /**
     * Replace the top scene with a new one (exit + destroy current, then init + enter new).
     * The scenes below are unaffected.
     * @param {Scene} scene
     * @param {GF.Engine} [engine]
     */
    replace(scene, engine) {
      if (engine) {
        this._executeReplace(scene, engine);
      } else {
        this._pending.push({ op: 'replace', scene });
      }
      return this;
    }

    /** Remove and destroy every scene on the stack. */
    clear(engine) {
      if (engine) {
        this._executeClear(engine);
      } else {
        this._pending.push({ op: 'clear' });
      }
      return this;
    }

    // ── Transition API ────────────────────────────────────────────────────────
    //
    // Each method mirrors its non-transition counterpart but wraps the stack
    // operation in a TweenSystem transition overlay.  The scene switch fires at
    // the midpoint (when the overlay is fully opaque), so neither the outgoing
    // nor the incoming scene is ever visible during the swap.
    //
    // opts: { type, duration, color, ease }
    //   type     - 'fade' | 'flash' | 'wipe' | 'iris'  (default: 'fade')
    //   duration - total seconds for both halves         (default: 0.5)
    //   color    - overlay colour                        (type-specific default)
    //   ease     - easing function name                  (default: 'linear')
    //
    // If no TweenSystem is registered on the engine the operation executes
    // immediately with no animation.

    /**
     * Push a new scene with a transition animation.
     * @param {Scene} scene
     * @param {Object} [opts]
     */
    pushWithTransition(scene, opts = {}) {
      this._startTransition(opts, () => this._executePush(scene, this._engine));
      return this;
    }

    /**
     * Pop the top scene with a transition animation.
     * @param {Object} [opts]
     */
    popWithTransition(opts = {}) {
      this._startTransition(opts, () => this._executePop(this._engine));
      return this;
    }

    /**
     * Replace the top scene with a transition animation.
     * @param {Scene} scene
     * @param {Object} [opts]
     */
    replaceWithTransition(scene, opts = {}) {
      this._startTransition(opts, () => this._executeReplace(scene, this._engine));
      return this;
    }

    /**
     * Clear the entire stack and push a fresh scene, all behind a transition.
     * Use this to jump cleanly back to a root scene (e.g. Main Menu) from a
     * deeply nested state without leaving orphaned scenes on the stack.
     * @param {Scene} scene
     * @param {Object} [opts]
     */
    replaceAllWithTransition(scene, opts = {}) {
      this._startTransition(opts, () => {
        this._executeClear(this._engine);
        this._executePush(scene, this._engine);
      });
      return this;
    }

    // ── Public getters ────────────────────────────────────────────────────────

    /** The current (top-most) scene, or null if the stack is empty. */
    get current() { return this._top() || null; }

    /** A copy of the scene stack (index 0 = bottom, last = top). */
    get stack() { return [...this._stack]; }

    /** Number of scenes on the stack. */
    get depth() { return this._stack.length; }

    // ── Internal ──────────────────────────────────────────────────────────────

    /**
     * Begin a transition, executing midpointOp when the overlay is fully
     * opaque.  Falls back to an instant operation if TweenSystem is absent.
     * Silently ignores nested calls — transitions cannot be stacked.
     * @private
     */
    _startTransition(opts, midpointOp) {
      if (this._activeTransition) return; // already transitioning — ignore

      const tweens = this._engine ? this._engine.getSystem('TweenSystem') : null;
      if (!tweens) {
        // No TweenSystem available: perform the swap immediately
        midpointOp();
        return;
      }

      const handle = tweens.createTransition(
        opts.type     || 'fade',
        opts.duration != null ? opts.duration : 0.5,
        {
          color:      opts.color,
          ease:       opts.ease,
          onMidpoint: midpointOp,
          onComplete: () => { this._activeTransition = null; },
        }
      );
      this._activeTransition = handle;
    }

    _top() { return this._stack.length ? this._stack[this._stack.length - 1] : null; }

    _flushPending(engine) {
      while (this._pending.length) {
        const { op, scene } = this._pending.shift();
        switch (op) {
          case 'push':    this._executePush(scene, engine);    break;
          case 'pop':     this._executePop(engine);            break;
          case 'replace': this._executeReplace(scene, engine); break;
          case 'clear':   this._executeClear(engine);          break;
        }
      }
    }

    _executePush(scene, engine) {
      const prev = this._top();
      if (prev) prev.exit(engine);

      if (!scene._initialized) {
        scene.init(engine);
        scene._initialized = true;
      }
      this._stack.push(scene);
      scene.enter(engine);

      engine.events.emit('scene:push', { scene, stack: this._stack });
    }

    _executePop(engine) {
      if (!this._stack.length) return;

      const removed = this._stack.pop();
      removed.exit(engine);
      removed.destroy(engine);

      const next = this._top();
      if (next) next.enter(engine);

      engine.events.emit('scene:pop', { removed, scene: next, stack: this._stack });
    }

    _executeReplace(scene, engine) {
      if (this._stack.length) {
        const removed = this._stack.pop();
        removed.exit(engine);
        removed.destroy(engine);
      }

      if (!scene._initialized) {
        scene.init(engine);
        scene._initialized = true;
      }
      this._stack.push(scene);
      scene.enter(engine);

      engine.events.emit('scene:replace', { scene, stack: this._stack });
    }

    _executeClear(engine) {
      while (this._stack.length) {
        const s = this._stack.pop();
        s.exit(engine);
        s.destroy(engine);
      }
      engine.events.emit('scene:clear');
    }
  }

  GF.Scene        = Scene;
  GF.SceneManager = SceneManager;

})(window.GF = window.GF || {});


// -- systems/SpriteSystem.js -------------------------------------

// GameFramework/framework/systems/SpriteSystem.js
// Manages sprite definitions (by name) and provides per-entity animators.
//
// Sprite definitions contain named animations; each animation has:
//   fps    {number}   - frames per second
//   loop   {boolean}  - whether to loop (default true)
//   frames {Array}    - array of draw functions: (ctx) => void
//
// Games register sprites by name only — no asset paths in GAME_CONFIG.
// The framework resolves names to renderers.

(function (GF) {
  'use strict';

  class SpriteSystem {
    constructor() {
      this.name = 'SpriteSystem';
      this._sprites = {}; // name -> { frameWidth, frameHeight, originX, originY, animations }
    }

    /**
     * Register a sprite definition under a unique name.
     * @param {string} name
     * @param {Object} definition - { frameWidth, frameHeight, originX, originY, animations }
     */
    registerSprite(name, definition) {
      this._sprites[name] = definition;
      return this;
    }

    /** Register multiple sprites from an object map. */
    registerSprites(map) {
      Object.keys(map).forEach(name => this.registerSprite(name, map[name]));
      return this;
    }

    /** Return the raw definition or null. */
    getSprite(name) {
      return this._sprites[name] || null;
    }

    /**
     * Create an animator instance for a named sprite.
     * @param {string} spriteName
     * @param {string} [initialAnimation='idle']
     * @returns {SpriteAnimator}
     */
    createAnimator(spriteName, initialAnimation) {
      const def = this._sprites[spriteName];
      if (!def) console.warn(`SpriteSystem: sprite '${spriteName}' not registered.`);
      return new SpriteAnimator(this, spriteName, initialAnimation || 'idle');
    }

    /**
     * Draw a sprite frame directly (no animator).
     * x, y specify the draw origin (typically feet-center).
     */
    drawFrame(ctx, spriteName, animName, frameIdx, x, y, flipX) {
      const def = this._sprites[spriteName];
      if (!def) return;
      const anim = def.animations[animName];
      if (!anim || !anim.frames.length) return;
      const frame = anim.frames[frameIdx % anim.frames.length];
      if (typeof frame !== 'function') return;

      const ox = def.originX || 0;
      const oy = def.originY || 0;

      ctx.save();
      ctx.translate(x, y);
      if (flipX) {
        ctx.scale(-1, 1);
      }
      ctx.translate(-ox, -oy);
      frame(ctx);
      ctx.restore();
    }

    update() {}
    render() {}
  }

  // -------------------------------------------------------------------------

  class SpriteAnimator {
    constructor(spriteSystem, spriteName, initialAnimation) {
      this._ss         = spriteSystem;
      this.spriteName  = spriteName;
      this.animation   = initialAnimation;
      this.frameIndex  = 0;
      this._timer      = 0;
      this.finished    = false;
      this._onFinish   = null;
      this.flipX       = false;  // set to mirror horizontally
    }

    /** Switch to a named animation. Force-restart even if same animation when force=true. */
    play(animName, force) {
      if (this.animation === animName && !force) return this;
      const def = this._ss.getSprite(this.spriteName);
      if (!def || !def.animations[animName]) {
        console.warn(`SpriteAnimator: animation '${animName}' not found on '${this.spriteName}'`);
        return this;
      }
      this.animation  = animName;
      this.frameIndex = 0;
      this._timer     = 0;
      this.finished   = false;
      return this;
    }

    /** Register a one-time callback fired when a non-looping animation finishes. */
    onFinish(cb) { this._onFinish = cb; return this; }

    /** Call each frame with the frame's delta time (seconds). */
    update(dt) {
      const def = this._ss.getSprite(this.spriteName);
      if (!def) return;
      const anim = def.animations[this.animation];
      if (!anim) return;

      const fps = anim.fps || 12;
      this._timer += dt;

      while (this._timer >= 1 / fps) {
        this._timer -= 1 / fps;
        this.frameIndex++;
        if (this.frameIndex >= anim.frames.length) {
          if (anim.loop !== false) {
            this.frameIndex = anim.loopFrom || 0;
          } else {
            this.frameIndex = anim.frames.length - 1;
            if (!this.finished) {
              this.finished = true;
              if (this._onFinish) this._onFinish();
            }
          }
        }
      }
    }

    /** Draw the current frame at world position (x, y = feet center). */
    draw(ctx, x, y) {
      this._ss.drawFrame(ctx, this.spriteName, this.animation, this.frameIndex, x, y, this.flipX);
    }

    /** Return the current frame duration in seconds (useful for hitbox timing). */
    get frameDuration() {
      const def  = this._ss.getSprite(this.spriteName);
      const anim = def && def.animations[this.animation];
      return anim ? 1 / (anim.fps || 12) : 0;
    }
  }

  GF.SpriteSystem  = SpriteSystem;
  GF.SpriteAnimator = SpriteAnimator;

})(window.GF = window.GF || {});


// -- systems/PhysicsSystem.js ------------------------------------

// GameFramework/framework/systems/PhysicsSystem.js
// Simple AABB physics with gravity and floor collision

(function (GF) {
  'use strict';

  class PhysicsBody {
    /**
     * @param {Object} cfg
     * @param {number} cfg.x, cfg.y      - initial position (x,y = top-left)
     * @param {number} cfg.width         - hitbox width
     * @param {number} cfg.height        - hitbox height
     * @param {number} cfg.gravityScale  - 0 = no gravity, 1 = full, negative = float up
     * @param {number} cfg.maxSpeedX     - maximum horizontal speed (px/s)
     * @param {number} cfg.maxSpeedY     - maximum vertical speed   (px/s)
     * @param {number} cfg.friction      - ground friction multiplier (0-1) per frame
     */
    constructor(cfg = {}) {
      this.x           = cfg.x           || 0;
      this.y           = cfg.y           || 0;
      this.vx          = 0;
      this.vy          = 0;
      this.width       = cfg.width       || 40;
      this.height      = cfg.height      || 80;
      this.gravityScale = cfg.gravityScale !== undefined ? cfg.gravityScale : 1;
      this.maxSpeedX   = cfg.maxSpeedX   || 500;
      this.maxSpeedY   = cfg.maxSpeedY   || 1200;
      this.friction    = cfg.friction    !== undefined ? cfg.friction : 0.8;
      this.grounded    = false;
      this.tag         = cfg.tag         || 'body';
    }

    get centerX() { return this.x + this.width  / 2; }
    get centerY() { return this.y + this.height / 2; }
    get right()   { return this.x + this.width;      }
    get bottom()  { return this.y + this.height;     }

    /** AABB overlap test. */
    overlaps(other) {
      return this.x      < other.right  &&
             this.right  > other.x      &&
             this.y      < other.bottom &&
             this.bottom > other.y;
    }
  }

  // ---------------------------------------------------------------------------

  class PhysicsSystem {
    /**
     * @param {Object} cfg
     * @param {number} cfg.gravity  - downward acceleration in px/s²
     * @param {number} cfg.floorY   - y coordinate of the main floor
     * @param {number} cfg.leftWall - x coordinate of the left boundary
     * @param {number} cfg.rightWall - x coordinate of the right boundary
     */
    constructor(cfg = {}) {
      this.name      = 'PhysicsSystem';
      this.gravity   = cfg.gravity   !== undefined ? cfg.gravity   : 2200;
      this.floorY    = cfg.floorY    || 380;
      this.leftWall  = cfg.leftWall  || 0;
      this.rightWall = cfg.rightWall || 800;
      this._bodies   = [];
    }

    addBody(body)    { this._bodies.push(body); return body; }
    removeBody(body) { const i = this._bodies.indexOf(body); if (i >= 0) this._bodies.splice(i, 1); }

    update(dt) {
      this._bodies.forEach(body => {
        // Gravity
        body.vy += this.gravity * body.gravityScale * dt;

        // Clamp speed
        body.vx = Math.max(-body.maxSpeedX, Math.min(body.maxSpeedX, body.vx));
        body.vy = Math.max(-body.maxSpeedY, Math.min(body.maxSpeedY, body.vy));

        // Integrate
        body.x += body.vx * dt;
        body.y += body.vy * dt;

        // Floor
        const floor = this.floorY;
        if (body.bottom >= floor) {
          body.y       = floor - body.height;
          body.vy      = 0;
          body.grounded = true;
          // Ground friction
          body.vx *= body.friction;
          if (Math.abs(body.vx) < 2) body.vx = 0;
        } else {
          body.grounded = false;
        }

        // Walls
        if (body.x < this.leftWall) {
          body.x  = this.leftWall;
          body.vx = 0;
        }
        if (body.right > this.rightWall) {
          body.x  = this.rightWall - body.width;
          body.vx = 0;
        }
      });
    }

    render() {}
  }

  GF.PhysicsBody   = PhysicsBody;
  GF.PhysicsSystem = PhysicsSystem;

})(window.GF = window.GF || {});


// -- systems/UISystem.js -----------------------------------------

// GameFramework/framework/systems/UISystem.js
// Static utility methods for drawing common HUD elements

(function (GF) {
  'use strict';

  const UISystem = {
    name: 'UISystem',

    // -------------------------------------------------------------------------
    // Health bar
    // -------------------------------------------------------------------------
    /**
     * Draw a health/energy bar.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x, y         - top-left corner
     * @param {number} width        - total bar width
     * @param {number} height       - bar height
     * @param {number} current      - current value
     * @param {number} max          - maximum value
     * @param {Object} [opts]
     *   opts.reversed   {boolean} - fill from right to left
     *   opts.bgColor    {string}
     *   opts.fillColor  {string}  - override automatic color (green→yellow→red)
     *   opts.borderColor{string}
     *   opts.borderWidth{number}
     */
    drawHealthBar(ctx, x, y, width, height, current, max, opts) {
      opts = opts || {};
      const pct    = Math.max(0, Math.min(1, current / max));
      const filled = width * pct;
      const rev    = opts.reversed || false;
      const drawX  = rev ? x + width - filled : x;

      // Background
      ctx.fillStyle = opts.bgColor || '#222222';
      ctx.fillRect(x, y, width, height);

      // Dynamic color: green → yellow → red
      let fillColor = opts.fillColor;
      if (!fillColor) {
        const hue  = pct > 0.5 ? 120 : pct > 0.25 ? 60 : 0;
        fillColor  = `hsl(${hue},100%,45%)`;
      }
      ctx.fillStyle = fillColor;
      ctx.fillRect(drawX, y, filled, height);

      // Inner highlight
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(drawX, y, filled, Math.ceil(height * 0.35));

      // Border
      ctx.strokeStyle  = opts.borderColor  || '#ffffff';
      ctx.lineWidth    = opts.borderWidth  || 2;
      ctx.strokeRect(x, y, width, height);
    },

    // -------------------------------------------------------------------------
    // Text
    // -------------------------------------------------------------------------
    /**
     * Draw text with optional shadow/glow/stroke.
     * @param {CanvasRenderingContext2D} ctx
     * @param {string} text
     * @param {number} x, y
     * @param {Object} [opts]
     *   opts.font        {string}  - CSS font string
     *   opts.color       {string}
     *   opts.align       {string}  - textAlign
     *   opts.baseline    {string}  - textBaseline
     *   opts.shadow      {boolean} - drop shadow
     *   opts.glow        {string}  - glow color
     *   opts.glowBlur    {number}
     *   opts.stroke      {string}  - outline color
     *   opts.strokeWidth {number}
     */
    drawText(ctx, text, x, y, opts) {
      opts = opts || {};
      ctx.save();
      ctx.font         = opts.font      || '20px monospace';
      ctx.textAlign    = opts.align     || 'left';
      ctx.textBaseline = opts.baseline  || 'top';

      if (opts.shadow) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillText(text, x + 2, y + 2);
      }

      if (opts.glow) {
        ctx.shadowColor = opts.glow;
        ctx.shadowBlur  = opts.glowBlur || 8;
      }

      if (opts.stroke) {
        ctx.strokeStyle = opts.stroke;
        ctx.lineWidth   = opts.strokeWidth || 3;
        ctx.lineJoin    = 'round';
        ctx.strokeText(text, x, y);
      }

      ctx.fillStyle   = opts.color || '#ffffff';
      ctx.shadowBlur  = 0;
      ctx.fillText(text, x, y);
      ctx.restore();
    },

    // -------------------------------------------------------------------------
    // Panel / box
    // -------------------------------------------------------------------------
    drawPanel(ctx, x, y, width, height, opts) {
      opts = opts || {};
      ctx.save();
      ctx.globalAlpha = opts.alpha !== undefined ? opts.alpha : 1;
      ctx.fillStyle   = opts.bgColor || 'rgba(0,0,0,0.7)';

      if (opts.radius) {
        this._roundRect(ctx, x, y, width, height, opts.radius);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, width, height);
      }

      if (opts.borderColor) {
        ctx.strokeStyle = opts.borderColor;
        ctx.lineWidth   = opts.borderWidth || 2;
        if (opts.radius) {
          this._roundRect(ctx, x, y, width, height, opts.radius);
          ctx.stroke();
        } else {
          ctx.strokeRect(x, y, width, height);
        }
      }
      ctx.restore();
    },

    _roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h,     x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y,         x + r, y);
      ctx.closePath();
    },

    update() {},
    render() {},
  };

  GF.UISystem = UISystem;

})(window.GF = window.GF || {});


// -- systems/AudioSystem.js --------------------------------------

// GameFramework/framework/systems/AudioSystem.js
// Web Audio API-backed sound system. Register SFX and music by name;
// play/stop/fade by name. Works standalone or with AssetLoader.
//
// Usage:
//   const audio = new GF.AudioSystem();
//   engine.addSystem(audio);
//
//   // Register from a pre-decoded AudioBuffer (e.g. via AssetLoader):
//   audio.register('jump', loader.get('jump'));
//
//   // Or register from a URL (AudioSystem will decode lazily on first play):
//   audio.registerURL('bgm', 'audio/theme.ogg', { loop: true, volume: 0.6 });
//
//   audio.play('jump');
//   audio.playMusic('bgm', { fadeIn: 1.0 });
//   audio.stopMusic({ fadeOut: 0.5 });
//   audio.setMasterVolume(0.8);

(function (GF) {
  'use strict';

  // ─── AudioClip ─────────────────────────────────────────────────────────────
  // Internal record for a registered sound.

  class AudioClip {
    constructor(name, source, opts = {}) {
      this.name     = name;
      this.buffer   = source instanceof AudioBuffer ? source : null;
      this.url      = typeof source === 'string'    ? source : null;
      this.volume   = opts.volume ?? 1.0;
      this.loop     = opts.loop   ?? false;
      this._loading = false;
    }
  }

  // ─── AudioSystem ───────────────────────────────────────────────────────────

  class AudioSystem {
    /**
     * @param {Object}  [opts]
     * @param {number}  [opts.masterVolume=1]   - Master gain [0, 1]
     * @param {number}  [opts.musicVolume=1]    - Music channel gain [0, 1]
     * @param {number}  [opts.sfxVolume=1]      - SFX channel gain [0, 1]
     * @param {AudioContext} [opts.audioContext] - Reuse an existing AudioContext
     *                                            (e.g. from AssetLoader)
     */
    constructor(opts = {}) {
      this.name = 'AudioSystem';

      this._ctx = opts.audioContext || null; // created lazily
      this._clips = new Map();              // name → AudioClip

      // Channel gain nodes (created when ctx is ready)
      this._masterGain = null;
      this._musicGain  = null;
      this._sfxGain    = null;

      // Pending config stored until ctx is created
      this._masterVolume = opts.masterVolume ?? 1.0;
      this._musicVolume  = opts.musicVolume  ?? 1.0;
      this._sfxVolume    = opts.sfxVolume    ?? 1.0;

      // Currently playing music node (for stop/fade)
      this._musicNode   = null;
      this._musicClip   = null;
      this._musicFadeId = null; // requestAnimationFrame id for fade

      // Active SFX sources (for stopping all)
      this._activeSfx = new Set();

      this._suspended = false;

      // Resume context on first user interaction (browser autoplay policy)
      this._resumeOnInteraction = this._resumeOnInteraction.bind(this);
      document.addEventListener('click',   this._resumeOnInteraction, { once: true });
      document.addEventListener('keydown', this._resumeOnInteraction, { once: true });
    }

    // ── Context setup ─────────────────────────────────────────────────────────

    _ensureContext() {
      if (this._ctx) return;
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this._ctx.createGain();
      this._musicGain  = this._ctx.createGain();
      this._sfxGain    = this._ctx.createGain();

      this._musicGain.connect(this._masterGain);
      this._sfxGain.connect(this._masterGain);
      this._masterGain.connect(this._ctx.destination);

      this._masterGain.gain.value = this._masterVolume;
      this._musicGain.gain.value  = this._musicVolume;
      this._sfxGain.gain.value    = this._sfxVolume;
    }

    _resumeOnInteraction() {
      if (this._ctx && this._ctx.state === 'suspended') {
        this._ctx.resume();
      }
    }

    // ── Registration ──────────────────────────────────────────────────────────

    /**
     * Register a clip from a decoded AudioBuffer.
     * @param {string}       name
     * @param {AudioBuffer}  buffer
     * @param {Object}       [opts]
     * @param {number}       [opts.volume=1]
     * @param {boolean}      [opts.loop=false]
     */
    register(name, buffer, opts = {}) {
      this._clips.set(name, new AudioClip(name, buffer, opts));
      return this;
    }

    /**
     * Register a clip from a URL — decoded lazily on first play.
     * @param {string} name
     * @param {string} url
     * @param {Object} [opts]
     */
    registerURL(name, url, opts = {}) {
      this._clips.set(name, new AudioClip(name, url, opts));
      return this;
    }

    /**
     * Attach all audio assets from an AssetLoader instance.
     * Any asset whose type was 'audio' (an AudioBuffer) is registered automatically.
     * Also reuses the AssetLoader's AudioContext if one was created.
     * @param {GF.AssetLoader} loader
     */
    attachLoader(loader) {
      if (loader.audioContext && !this._ctx) {
        this._ctx = loader.audioContext;
        this._masterGain = this._ctx.createGain();
        this._musicGain  = this._ctx.createGain();
        this._sfxGain    = this._ctx.createGain();
        this._musicGain.connect(this._masterGain);
        this._sfxGain.connect(this._masterGain);
        this._masterGain.connect(this._ctx.destination);
        this._masterGain.gain.value = this._masterVolume;
        this._musicGain.gain.value  = this._musicVolume;
        this._sfxGain.gain.value    = this._sfxVolume;
      }
      // Walk the internal asset map — register any AudioBuffers not yet registered
      loader._assets.forEach((asset, key) => {
        if (asset instanceof AudioBuffer && !this._clips.has(key)) {
          this.register(key, asset);
        }
      });
      return this;
    }

    // ── Playback ──────────────────────────────────────────────────────────────

    /**
     * Play a one-shot sound effect.
     * @param {string} name
     * @param {Object} [opts]
     * @param {number} [opts.volume]   - Override clip volume
     * @param {number} [opts.pitch=1]  - Playback rate (1 = normal)
     * @param {number} [opts.delay=0]  - Delay in seconds before playing
     * @returns {AudioBufferSourceNode|null}
     */
    play(name, opts = {}) {
      const clip = this._clips.get(name);
      if (!clip) { console.warn(`[AudioSystem] Unknown clip: "${name}"`); return null; }

      if (clip.url && !clip.buffer) {
        this._decodeURL(clip).then(() => this.play(name, opts));
        return null;
      }
      if (!clip.buffer) return null;

      this._ensureContext();
      if (this._ctx.state === 'suspended') this._ctx.resume();

      const source = this._ctx.createBufferSource();
      source.buffer = clip.buffer;
      source.playbackRate.value = opts.pitch ?? 1;

      const gain = this._ctx.createGain();
      gain.gain.value = opts.volume ?? clip.volume;
      source.connect(gain);
      gain.connect(this._sfxGain);

      const when = this._ctx.currentTime + (opts.delay ?? 0);
      source.start(when);

      this._activeSfx.add(source);
      source.onended = () => this._activeSfx.delete(source);

      return source;
    }

    /**
     * Play looping background music, optionally fading in.
     * Only one music track plays at a time — playMusic replaces the current one.
     * @param {string} name
     * @param {Object} [opts]
     * @param {number} [opts.fadeIn=0]    - Fade-in duration in seconds
     * @param {number} [opts.volume]      - Override clip volume
     */
    playMusic(name, opts = {}) {
      const clip = this._clips.get(name);
      if (!clip) { console.warn(`[AudioSystem] Unknown clip: "${name}"`); return; }

      if (clip.url && !clip.buffer) {
        this._decodeURL(clip).then(() => this.playMusic(name, opts));
        return;
      }

      this._ensureContext();
      if (this._ctx.state === 'suspended') this._ctx.resume();

      this.stopMusic(); // stop current track immediately

      const source = this._ctx.createBufferSource();
      source.buffer = clip.buffer;
      source.loop   = true;

      const gain = this._ctx.createGain();
      const targetVol = opts.volume ?? clip.volume;
      const fadeIn    = opts.fadeIn ?? 0;

      if (fadeIn > 0) {
        gain.gain.setValueAtTime(0, this._ctx.currentTime);
        gain.gain.linearRampToValueAtTime(targetVol, this._ctx.currentTime + fadeIn);
      } else {
        gain.gain.value = targetVol;
      }

      source.connect(gain);
      gain.connect(this._musicGain);
      source.start();

      this._musicNode = { source, gain };
      this._musicClip = clip;
    }

    /**
     * Stop the current music track.
     * @param {Object} [opts]
     * @param {number} [opts.fadeOut=0] - Fade-out duration in seconds
     */
    stopMusic(opts = {}) {
      if (!this._musicNode) return;
      const { source, gain } = this._musicNode;
      const fadeOut = opts.fadeOut ?? 0;

      if (fadeOut > 0 && this._ctx) {
        gain.gain.setValueAtTime(gain.gain.value, this._ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this._ctx.currentTime + fadeOut);
        source.stop(this._ctx.currentTime + fadeOut);
      } else {
        try { source.stop(); } catch (_) {}
      }

      this._musicNode = null;
      this._musicClip = null;
    }

    /** True if a music track is currently playing. */
    get isMusicPlaying() { return this._musicNode !== null; }

    /** Stop all currently playing SFX immediately. */
    stopAllSfx() {
      this._activeSfx.forEach(src => { try { src.stop(); } catch (_) {} });
      this._activeSfx.clear();
    }

    // ── Volume controls ───────────────────────────────────────────────────────

    /** Set master volume [0, 1]. Affects all audio. */
    setMasterVolume(v) {
      this._masterVolume = GF.Math ? GF.Math.clamp(v, 0, 1) : Math.min(1, Math.max(0, v));
      if (this._masterGain) this._masterGain.gain.value = this._masterVolume;
    }

    /** Set music channel volume [0, 1]. */
    setMusicVolume(v) {
      this._musicVolume = GF.Math ? GF.Math.clamp(v, 0, 1) : Math.min(1, Math.max(0, v));
      if (this._musicGain) this._musicGain.gain.value = this._musicVolume;
    }

    /** Set SFX channel volume [0, 1]. */
    setSfxVolume(v) {
      this._sfxVolume = GF.Math ? GF.Math.clamp(v, 0, 1) : Math.min(1, Math.max(0, v));
      if (this._sfxGain) this._sfxGain.gain.value = this._sfxVolume;
    }

    get masterVolume() { return this._masterVolume; }
    get musicVolume()  { return this._musicVolume;  }
    get sfxVolume()    { return this._sfxVolume;    }

    /** Mute / unmute all audio without changing stored volume values. */
    mute()   { if (this._masterGain) this._masterGain.gain.value = 0; }
    unmute() { if (this._masterGain) this._masterGain.gain.value = this._masterVolume; }

    // ── Engine system hooks ───────────────────────────────────────────────────

    /** Called by Engine.addSystem(); no per-frame update needed. */
    update(_dt, _engine) {}

    // ── Internal helpers ──────────────────────────────────────────────────────

    _decodeURL(clip) {
      if (clip._loading) return Promise.resolve();
      clip._loading = true;
      this._ensureContext();
      return fetch(clip.url)
        .then(r => r.arrayBuffer())
        .then(buf => this._ctx.decodeAudioData(buf))
        .then(buffer => { clip.buffer = buffer; clip._loading = false; })
        .catch(err => {
          console.error(`[AudioSystem] Failed to decode "${clip.name}": ${err}`);
          clip._loading = false;
        });
    }
  }

  GF.AudioSystem = AudioSystem;

})(window.GF = window.GF || {});


// -- systems/TweenSystem.js --------------------------------------

// GameFramework/framework/systems/TweenSystem.js
// Smooth property animation over time with easing, loop, yoyo, and chain support.
// Depends on: GF.Math (for easing functions).
//
// Quick start:
//   const tweens = new GF.TweenSystem();
//   engine.addSystem(tweens);
//
//   // Slide a panel to x=400 over 0.5 s with a bounce:
//   tweens.create(panel, { x: 400 }, 0.5, { ease: 'outBounce' });
//
//   // Fade something out, then call a function:
//   tweens.create(sprite, { alpha: 0 }, 0.3, {
//     ease: 'inQuad',
//     onComplete: () => sprite.visible = false,
//   });
//
//   // Pulse (yoyo loop):
//   tweens.create(light, { radius: 80 }, 0.8, { yoyo: true, loop: true });
//
//   // Chain: fly in, pause, fly out:
//   tweens.create(banner, { y: 100 }, 0.4, { ease: 'outBack' })
//         .chain(banner, { y: -100 }, 0.4, { delay: 1.5, ease: 'inBack' });
//
// Scene transitions:
//   tweens.createTransition('iris', 0.8, {
//     onMidpoint: () => scenes.replace(new GameScene()),
//   });
//
//   // Available types: 'fade' | 'flash' | 'wipe' | 'iris'
//   // SceneManager.pushWithTransition / popWithTransition / replaceWithTransition
//   // / replaceAllWithTransition use this internally.

(function (GF) {
  'use strict';

  // ---------------------------------------------------------------------------
  // Tween
  // ---------------------------------------------------------------------------

  class Tween {
    /**
     * @param {Object}   target          - The object whose properties will be animated
     * @param {Object}   toProps         - { propName: targetValue, ... }
     * @param {number}   duration        - Duration in seconds
     * @param {Object}   [opts]
     * @param {string|Function} [opts.ease='linear']  - Easing name (key of GF.Math.ease) or custom fn(t)
     * @param {boolean}  [opts.loop=false]             - Repeat forever
     * @param {boolean}  [opts.yoyo=false]             - Reverse on each repeat
     * @param {number}   [opts.delay=0]               - Seconds before starting
     * @param {function} [opts.onUpdate]               - Called every frame: fn(target, progress)
     * @param {function} [opts.onComplete]             - Called when tween finishes (or each cycle if loop)
     * @param {TweenSystem} [opts._system]             - Back-reference, set by TweenSystem.create()
     */
    constructor(target, toProps, duration, opts = {}) {
      this.target   = target;
      this.duration = Math.max(0.0001, duration);
      this.delay    = opts.delay ?? 0;

      // Resolve easing function
      const easeName = opts.ease ?? 'linear';
      this._easeFn = typeof easeName === 'function'
        ? easeName
        : (GF.Math?.ease?.[easeName] ?? (t => t));

      this.loop       = opts.loop  ?? false;
      this.yoyo       = opts.yoyo  ?? false;
      this._direction = 1; // 1 = forward, -1 = backward (yoyo)

      this.onUpdate   = opts.onUpdate   ?? null;
      this.onComplete = opts.onComplete ?? null;

      this._system = opts._system ?? null;

      // Snapshot start values at creation time
      this._from = {};
      this._to   = {};
      for (const key in toProps) {
        this._from[key] = typeof target[key] === 'number' ? target[key] : 0;
        this._to[key]   = toProps[key];
      }

      this._elapsed      = 0;
      this._delayElapsed = 0;
      this.active        = true;
      this.paused        = false;
      this.completed     = false;

      /** @type {Tween|null} */
      this._next = null;
    }

    // -- Control ---------------------------------------------------------------

    pause()  { this.paused = true;  return this; }
    resume() { this.paused = false; return this; }

    /** Stop and remove this tween immediately. */
    stop() {
      this.active    = true; // keep it "active" so system picks it up
      this.completed = true; // but mark completed so system removes it
      return this;
    }

    /**
     * Queue a new tween to start as soon as this one completes.
     * Returns the new Tween so you can chain further.
     * @returns {Tween}
     */
    chain(target, toProps, duration, opts = {}) {
      const next = new Tween(target, toProps, duration, {
        ...opts,
        _system: this._system,
      });
      next.active = false; // won't run until this tween finishes
      this._next  = next;
      if (this._system) this._system._tweens.add(next);
      return next;
    }

    // -- Internal update -------------------------------------------------------

    /** @returns {boolean} true when the tween should be removed */
    _tick(dt) {
      if (this.paused || !this.active) return false;

      // Respect delay
      if (this._delayElapsed < this.delay) {
        this._delayElapsed += dt;
        return false;
      }

      this._elapsed += dt;
      let rawT = this._elapsed / this.duration;

      if (rawT >= 1) {
        rawT = 1;
        this._applyT(this._direction === 1 ? 1 : 0);

        if (this.loop) {
          this._elapsed = 0;
          if (this.yoyo) this._direction *= -1;
          if (this.onComplete) this.onComplete(this.target);
          return false; // keep going
        }

        // Tween finished
        this.completed = true;
        if (this.onComplete) this.onComplete(this.target);
        if (this._next) this._next.active = true;
        return true;
      }

      this._applyT(this._direction === 1 ? rawT : 1 - rawT);
      return false;
    }

    _applyT(rawT) {
      const t = this._easeFn(rawT);
      for (const key in this._from) {
        this.target[key] = this._from[key] + (this._to[key] - this._from[key]) * t;
      }
      if (this.onUpdate) this.onUpdate(this.target, rawT);
    }
  }

  // ---------------------------------------------------------------------------
  // TweenSystem
  // ---------------------------------------------------------------------------

  class TweenSystem {
    constructor() {
      this.name    = 'TweenSystem';
      /** @type {Set<Tween>} */
      this._tweens = new Set();
    }

    // -- Engine system hook ----------------------------------------------------

    init(_engine) {}

    update(dt, _engine) {
      const toRemove = [];
      this._tweens.forEach(tween => {
        if (tween._tick(dt)) toRemove.push(tween);
      });
      toRemove.forEach(t => this._tweens.delete(t));
    }

    // -- Public API ------------------------------------------------------------

    /**
     * Create and immediately start a tween.
     *
     * @param {Object}   target    - Object to animate
     * @param {Object}   toProps   - { property: targetValue, ... }
     * @param {number}   duration  - Duration in seconds
     * @param {Object}   [opts]    - See Tween constructor
     * @returns {Tween}
     */
    create(target, toProps, duration, opts = {}) {
      const tween = new Tween(target, toProps, duration, { ...opts, _system: this });
      this._tweens.add(tween);
      return tween;
    }

    /**
     * Snap to the end of a tween and apply the final values immediately,
     * without animating.
     */
    set(target, toProps) {
      for (const key in toProps) target[key] = toProps[key];
    }

    /**
     * Kill all active tweens targeting the given object.
     * If no target is given, kills ALL tweens.
     * @param {Object} [target]
     */
    killAll(target) {
      if (target === undefined) {
        this._tweens.clear();
        return;
      }
      this._tweens.forEach(t => {
        if (t.target === target) this._tweens.delete(t);
      });
    }

    /**
     * Pause all tweens targeting the given object (or all if no target).
     * @param {Object} [target]
     */
    pauseAll(target) {
      this._tweens.forEach(t => {
        if (!target || t.target === target) t.pause();
      });
    }

    /**
     * Resume all tweens targeting the given object (or all if no target).
     * @param {Object} [target]
     */
    resumeAll(target) {
      this._tweens.forEach(t => {
        if (!target || t.target === target) t.resume();
      });
    }

    /** True if there are any active tweens targeting the given object. */
    isTweening(target) {
      for (const t of this._tweens) {
        if (t.target === target && t.active && !t.completed) return true;
      }
      return false;
    }

    /** Total number of active tweens (for debugging). */
    get count() { return this._tweens.size; }


    // -- Scene transition API --------------------------------------------------

    /**
     * Create a seamless scene-transition overlay animation.
     *
     * The returned TransitionHandle has its `progress` property tweened 0 -> 1
     * over `duration` seconds.  At progress = 0.5 the overlay is fully opaque
     * and opts.onMidpoint fires -- the ideal moment to swap scenes.
     * SceneManager calls handle.render(ctx, w, h) each frame to paint the
     * effect on top of the current scene.
     *
     * Built-in types:
     *   'fade'  -- fades to black (or opts.color) and back
     *   'flash' -- same but defaults to white
     *   'wipe'  -- a curtain bar sweeps horizontally across the screen
     *   'iris'  -- classic RPG circle-iris open and close
     *
     * @param {string} type       - 'fade' | 'flash' | 'wipe' | 'iris'
     * @param {number} duration   - Total duration in seconds (both halves combined)
     * @param {Object} [opts]
     * @param {string}   [opts.color]       - Overlay colour (type-specific default)
     * @param {string}   [opts.ease]        - Easing function name (default 'linear')
     * @param {function} [opts.onMidpoint]  - Called when progress crosses 0.5
     * @param {function} [opts.onComplete]  - Called when the transition finishes
     * @returns {TransitionHandle}
     */
    createTransition(type, duration, opts) {
      opts = opts || {};
      var handle = new TransitionHandle(type, opts);

      this.create(handle, { progress: 1 }, duration, {
        ease:       opts.ease || 'linear',
        onUpdate:   function () { handle._checkMidpoint(); },
        onComplete: function () {
          handle._checkMidpoint();
          handle.active = false;
          if (handle._onComplete) handle._onComplete();
        },
      });

      return handle;
    }
  }

  // ---------------------------------------------------------------------------
  // TransitionHandle
  // ---------------------------------------------------------------------------
  //
  // Returned by TweenSystem.createTransition().  The TweenSystem animates
  // handle.progress from 0 -> 1.  SceneManager fires onMidpoint when it
  // crosses 0.5 (screen fully covered, safe to swap scenes), then calls
  // handle.render(ctx, w, h) every frame so the overlay paints on top.
  //
  // Progress -> overlay-alpha mapping (triangle wave):
  //   0.0 -> 0.5  alpha ramps 0 -> 1  (covering outgoing scene)
  //   0.5 -> 1.0  alpha ramps 1 -> 0  (revealing incoming scene)

  class TransitionHandle {
    /**
     * @param {string} type    - 'fade' | 'flash' | 'wipe' | 'iris'
     * @param {Object} [opts]
     * @param {string}   [opts.color]      - Overlay colour
     * @param {function} [opts.onMidpoint] - Called when progress >= 0.5
     * @param {function} [opts.onComplete] - Called when progress reaches 1
     */
    constructor(type, opts) {
      opts = opts || {};
      this.type     = type;
      this.color    = opts.color || (type === 'flash' ? '#ffffff' : '#000000');
      this.progress = 0;
      this.active   = true;

      this._midpointFired = false;
      this._onMidpoint    = opts.onMidpoint || null;
      this._onComplete    = opts.onComplete || null;
    }

    /** @internal */
    _checkMidpoint() {
      if (!this._midpointFired && this.progress >= 0.5) {
        this._midpointFired = true;
        if (this._onMidpoint) this._onMidpoint();
      }
    }

    /**
     * Render the transition overlay.
     * Called by SceneManager.render() after the scene has been drawn.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} w
     * @param {number} h
     */
    render(ctx, w, h) {
      if (!this.active) return;

      var p     = this.progress;
      var alpha = p <= 0.5 ? p * 2 : (1 - p) * 2;

      ctx.save();

      switch (this.type) {

        case 'fade':
        case 'flash':
          ctx.globalAlpha = alpha;
          ctx.fillStyle   = this.color;
          ctx.fillRect(0, 0, w, h);
          break;

        case 'wipe':
          ctx.fillStyle = this.color;
          if (p <= 0.5) {
            ctx.fillRect(0, 0, alpha * w, h);
          } else {
            ctx.fillRect((1 - alpha) * w, 0, alpha * w, h);
          }
          break;

        case 'iris': {
          var cx   = w / 2;
          var cy   = h / 2;
          var maxR = Math.sqrt(cx * cx + cy * cy);
          var r    = (1 - alpha) * maxR;
          ctx.fillStyle = this.color;
          if (r <= 0.5) {
            ctx.fillRect(0, 0, w, h);
          } else {
            ctx.beginPath();
            ctx.rect(0, 0, w, h);
            ctx.arc(cx, cy, r, 0, Math.PI * 2, false);
            ctx.fill('evenodd');
          }
          break;
        }

        default:
          ctx.globalAlpha = alpha;
          ctx.fillStyle   = this.color;
          ctx.fillRect(0, 0, w, h);
      }

      ctx.restore();
    }
  }

  GF.Tween            = Tween;
  GF.TweenSystem      = TweenSystem;
  GF.TransitionHandle = TransitionHandle;

})(window.GF = window.GF || {});


// -- systems/ParticleSystem.js -----------------------------------

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

      // Clean up finished particles (return to pool)
      this._particles = this._particles.filter(p => p.active);

      if (!anyAlive && !this._running) {
        this.active = false;
        if (this.onEmpty) this.onEmpty(this);
      }
    }

    render(ctx) {
      if (!this.active && this._particles.length === 0) return;

      ctx.save();
      for (const p of this._particles) {
        if (!p.active) continue;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle   = p.color;

        if (p.rotation !== 0) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          this._drawShape(ctx, 0, 0, p.size);
          ctx.restore();
        } else {
          this._drawShape(ctx, p.x, p.y, p.size);
        }
      }
      ctx.globalAlpha = 1;
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
      /** @type {Set<ParticleEmitter>} */
      this._emitters = new Set();
    }

    // ── Engine hooks ──────────────────────────────────────────────────────────

    init(_engine) {}

    update(dt, _engine) {
      const dead = [];
      this._emitters.forEach(e => {
        e.update(dt);
        if (!e.active && !e.hasParticles) dead.push(e);
      });
      dead.forEach(e => this._emitters.delete(e));
    }

    render(ctx, _engine) {
      this._emitters.forEach(e => e.render(ctx));
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
      this._emitters.add(emitter);
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
      this._emitters.forEach(e => { e.stop(); e._particles = []; });
      this._emitters.clear();
    }

    /** Number of active emitters. */
    get emitterCount() { return this._emitters.size; }

    /** Total live particle count across all emitters. */
    get particleCount() {
      let n = 0;
      this._emitters.forEach(e => n += e._particles.length);
      return n;
    }
  }

  GF.Particle        = Particle;
  GF.ParticleEmitter = ParticleEmitter;
  GF.ParticleSystem  = ParticleSystem;

})(window.GF = window.GF || {});


// -- systems/Camera.js -------------------------------------------

// GameFramework/framework/systems/Camera.js
// Scrolling camera — translates the canvas context so the world scrolls.
//
// Usage:
//   const camera = new GF.Camera({ width: 800, height: 450, worldWidth: 3200, worldHeight: 900 });
//   camera.follow(playerBody);
//   // In your render callback:
//   camera.begin(ctx);
//     // draw world-space objects here
//   camera.end(ctx);

(function (GF) {
  'use strict';

  class Camera {
    /**
     * @param {Object} cfg
     * @param {number} cfg.width        - viewport width in pixels (matches canvas width)
     * @param {number} cfg.height       - viewport height in pixels (matches canvas height)
     * @param {number} cfg.worldWidth   - total world width for scroll clamping
     * @param {number} cfg.worldHeight  - total world height for scroll clamping
     * @param {number} cfg.lerp         - smoothing factor per 60fps frame (0–1, default 0.1)
     *                                    1 = instant snap, lower values = smoother lag
     */
    constructor(cfg = {}) {
      this.name        = 'Camera';
      this.width       = cfg.width       || 800;
      this.height      = cfg.height      || 450;
      this.worldWidth  = cfg.worldWidth  !== undefined ? cfg.worldWidth  : this.width;
      this.worldHeight = cfg.worldHeight !== undefined ? cfg.worldHeight : this.height;
      this.lerp        = cfg.lerp        !== undefined ? cfg.lerp        : 0.1;

      // Current top-left world position of the viewport
      this.x = 0;
      this.y = 0;

      this._targetX = 0;
      this._targetY = 0;
      this._follow  = null; // object with { x, y } (and optionally width, height)
      this._offsetX = 0;    // offset from followed target's centre
      this._offsetY = 0;
    }

    // ── Follow API ──────────────────────────────────────────────────────────────

    /**
     * Follow a target object every frame.
     * The target must expose x and y (and optionally width / height).
     * Compatible with GF.PhysicsBody.
     *
     * @param {Object} target
     * @param {number} [offsetX=0] - horizontal nudge from the target's centre
     * @param {number} [offsetY=0] - vertical nudge from the target's centre
     */
    follow(target, offsetX, offsetY) {
      this._follow  = target;
      this._offsetX = offsetX || 0;
      this._offsetY = offsetY || 0;
      return this;
    }

    /** Stop following the current target. */
    unfollow() {
      this._follow = null;
      return this;
    }

    // ── Point-at API ────────────────────────────────────────────────────────────

    /**
     * Instantly move the camera to centre on a world point (no lerp applied).
     * @param {number} worldX
     * @param {number} worldY
     */
    snapTo(worldX, worldY) {
      this._targetX = worldX;
      this._targetY = worldY;
      this.x = this._clampX(worldX - this.width  / 2);
      this.y = this._clampY(worldY - this.height / 2);
      return this;
    }

    /**
     * Set the desired look-at point; the camera will lerp towards it.
     * @param {number} worldX
     * @param {number} worldY
     */
    lookAt(worldX, worldY) {
      this._targetX = worldX;
      this._targetY = worldY;
      return this;
    }

    // ── Internal ────────────────────────────────────────────────────────────────

    _clampX(x) {
      return Math.max(0, Math.min(this.worldWidth  - this.width,  x));
    }
    _clampY(y) {
      return Math.max(0, Math.min(this.worldHeight - this.height, y));
    }

    // ── System interface ────────────────────────────────────────────────────────

    update(dt) {
      // Derive target position from followed object
      if (this._follow) {
        const t  = this._follow;
        const cx = t.x + (t.width  || 0) / 2 + this._offsetX;
        const cy = t.y + (t.height || 0) / 2 + this._offsetY;
        this._targetX = cx;
        this._targetY = cy;
      }

      // Desired viewport top-left
      const desiredX = this._clampX(this._targetX - this.width  / 2);
      const desiredY = this._clampY(this._targetY - this.height / 2);

      // Lerp — scale factor normalised to 60 fps so feel is frame-rate independent
      const alpha = Math.min(1, this.lerp * (dt * 60));
      this.x += (desiredX - this.x) * alpha;
      this.y += (desiredY - this.y) * alpha;
    }

    render() {} // Camera has no autonomous draw; games drive begin/end manually.

    // ── Draw helpers ────────────────────────────────────────────────────────────

    /**
     * Push camera transform onto the canvas context.
     * Call before drawing world-space objects; pair with end().
     * @param {CanvasRenderingContext2D} ctx
     */
    begin(ctx) {
      ctx.save();
      ctx.translate(-Math.round(this.x), -Math.round(this.y));
    }

    /**
     * Pop the camera transform.
     * @param {CanvasRenderingContext2D} ctx
     */
    end(ctx) {
      ctx.restore();
    }

    // ── Coordinate conversion ───────────────────────────────────────────────────

    /**
     * Convert a world-space position to screen (canvas) coordinates.
     * @param {number} wx
     * @param {number} wy
     * @returns {{ x: number, y: number }}
     */
    worldToScreen(wx, wy) {
      return { x: wx - this.x, y: wy - this.y };
    }

    /**
     * Convert a screen (canvas) coordinate to world-space.
     * Useful for translating mouse / touch input.
     * @param {number} sx
     * @param {number} sy
     * @returns {{ x: number, y: number }}
     */
    screenToWorld(sx, sy) {
      return { x: sx + this.x, y: sy + this.y };
    }

    /**
     * Returns true when the given world-space rectangle is at least partially
     * within the viewport.  Use for culling draw calls.
     *
     * @param {number} wx - left edge of rect in world space
     * @param {number} wy - top  edge of rect in world space
     * @param {number} w  - rect width  (default 0)
     * @param {number} h  - rect height (default 0)
     */
    isVisible(wx, wy, w, h) {
      w = w || 0;
      h = h || 0;
      return wx + w > this.x &&
             wy + h > this.y &&
             wx     < this.x + this.width &&
             wy     < this.y + this.height;
    }
  }

  GF.Camera = Camera;

})(window.GF = window.GF || {});


// -- systems/TilemapSystem.js ------------------------------------

// GameFramework/framework/systems/TilemapSystem.js
// Renders a 2D grid of tile indices from a registered tileset image.
//
// Quick start:
//   const tm = game.tilemap.create({
//     tileset:     'tiles',          // AssetLoader key for the tileset PNG
//     tilesetCols: 8,                // how many columns the tileset image has
//     tileWidth:   32,
//     tileHeight:  32,
//     solidTiles:  [0, 1, 2],        // tile indices that block physics bodies
//     grid: [                        // row-major; -1 = transparent/empty
//       [ 0,  0,  0,  0 ],
//       [-1, -1, -1,  1 ],
//       [ 2,  2,  2,  2 ],
//     ],
//   });
//
//   // In your render callback (inside camera.begin / camera.end):
//   tm.draw(ctx, camera);
//
//   // After physics integration, resolve tilemap collisions:
//   tm.resolveCollision(playerBody);

(function (GF) {
  'use strict';

  // ── Tilemap ─────────────────────────────────────────────────────────────────

  class Tilemap {
    /**
     * @param {Object}     cfg
     * @param {string}     cfg.tileset      - AssetLoader image key
     * @param {number}     cfg.tilesetCols  - columns in the tileset image
     * @param {number}     cfg.tileWidth    - pixel width of one tile
     * @param {number}     cfg.tileHeight   - pixel height of one tile
     * @param {number[][]} cfg.grid         - [row][col] tile indices; -1 = empty
     * @param {number[]|Set<number>} [cfg.solidTiles] - indices treated as solid
     * @param {number}     [cfg.x=0]        - world X of the tilemap's top-left corner
     * @param {number}     [cfg.y=0]        - world Y of the tilemap's top-left corner
     */
    constructor(cfg = {}) {
      this.tilesetKey  = cfg.tileset     || '';
      this.tilesetCols = cfg.tilesetCols || 1;
      this.tileWidth   = cfg.tileWidth   || 32;
      this.tileHeight  = cfg.tileHeight  || 32;
      this.grid        = cfg.grid        || [];
      this.x           = cfg.x           || 0;
      this.y           = cfg.y           || 0;

      this._rows = this.grid.length;
      this._cols = this._rows > 0 ? this.grid[0].length : 0;
      this._img  = null; // resolved HTMLImageElement

      // Normalise solidTiles to a Set
      if (cfg.solidTiles) {
        this.solidTiles = (cfg.solidTiles instanceof Set)
          ? cfg.solidTiles
          : new Set(cfg.solidTiles);
      } else {
        this.solidTiles = null; // no collision
      }
    }

    // ── Dimensions ──────────────────────────────────────────────────────────

    /** Total pixel width of the tilemap. */
    get pixelWidth()  { return this._cols * this.tileWidth;  }
    /** Total pixel height of the tilemap. */
    get pixelHeight() { return this._rows * this.tileHeight; }

    // ── Asset resolution ────────────────────────────────────────────────────

    /** Called by TilemapSystem.update() once a loader is available. */
    _resolveImage(loader) {
      if (!this._img && loader) {
        this._img = loader.get(this.tilesetKey) || null;
      }
    }

    // ── Tile queries ────────────────────────────────────────────────────────

    /**
     * Return the tile index at grid column/row.  Returns -1 if out of bounds.
     * @param {number} col
     * @param {number} row
     */
    getTile(col, row) {
      if (row < 0 || row >= this._rows || col < 0 || col >= this._cols) return -1;
      return this.grid[row][col];
    }

    /**
     * Return the tile index at a world-space pixel position.
     * @param {number} worldX
     * @param {number} worldY
     */
    getTileAtWorld(worldX, worldY) {
      const col = Math.floor((worldX - this.x) / this.tileWidth);
      const row = Math.floor((worldY - this.y) / this.tileHeight);
      return this.getTile(col, row);
    }

    /**
     * Return true when the tile at (col, row) is in the solid set.
     * @param {number} col
     * @param {number} row
     */
    isSolid(col, row) {
      if (!this.solidTiles) return false;
      const t = this.getTile(col, row);
      return t >= 0 && this.solidTiles.has(t);
    }

    /**
     * Return true when the world-space point (wx, wy) falls on a solid tile.
     * @param {number} worldX
     * @param {number} worldY
     */
    isSolidAt(worldX, worldY) {
      const col = Math.floor((worldX - this.x) / this.tileWidth);
      const row = Math.floor((worldY - this.y) / this.tileHeight);
      return this.isSolid(col, row);
    }

    // ── Collision ───────────────────────────────────────────────────────────

    /**
     * Resolve solid-tile AABB collisions for a GF.PhysicsBody.
     * Call each frame **after** PhysicsSystem.update() has integrated the body.
     * The method tests all four corners of the body and pushes it out of any
     * overlapping solid tile along the axis of least penetration.
     *
     * @param {GF.PhysicsBody} body
     */
    resolveCollision(body) {
      if (!this.solidTiles) return;

      const tw = this.tileWidth;
      const th = this.tileHeight;

      // We test the four corners; iterate a small grid of tiles the body can overlap
      const c0 = Math.floor((body.x          - this.x) / tw);
      const c1 = Math.floor((body.right  - 1 - this.x) / tw);
      const r0 = Math.floor((body.y          - this.y) / th);
      const r1 = Math.floor((body.bottom - 1 - this.y) / th);

      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          if (!this.isSolid(c, r)) continue;

          const tileLeft   = this.x + c * tw;
          const tileTop    = this.y + r * th;
          const tileRight  = tileLeft + tw;
          const tileBottom = tileTop  + th;

          // Skip if not actually overlapping
          if (body.right  <= tileLeft   || body.x      >= tileRight  ||
              body.bottom <= tileTop    || body.y      >= tileBottom) continue;

          // Penetration depths on all four sides
          const overlapL = body.right  - tileLeft;   // push left
          const overlapR = tileRight   - body.x;     // push right
          const overlapT = body.bottom - tileTop;    // push up
          const overlapB = tileBottom  - body.y;     // push down

          const minH = Math.min(overlapL, overlapR);
          const minV = Math.min(overlapT, overlapB);

          if (minH < minV) {
            // Horizontal resolution
            if (overlapL < overlapR) {
              body.x  -= overlapL;
              body.vx  = Math.min(body.vx, 0);
            } else {
              body.x  += overlapR;
              body.vx  = Math.max(body.vx, 0);
            }
          } else {
            // Vertical resolution
            if (overlapT < overlapB) {
              // Landed on top of tile
              body.y        -= overlapT;
              body.vy        = Math.min(body.vy, 0);
              body.grounded  = true;
              body.vx       *= body.friction;
              if (Math.abs(body.vx) < 2) body.vx = 0;
            } else {
              // Hit underside of tile
              body.y  += overlapB;
              body.vy  = Math.max(body.vy, 0);
            }
          }
        }
      }
    }

    // ── Rendering ───────────────────────────────────────────────────────────

    /**
     * Draw the tilemap onto ctx.
     * Call this between camera.begin(ctx) and camera.end(ctx) for correct
     * world-space positioning.  When camera is provided, off-screen tiles are
     * automatically skipped.
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {GF.Camera} [camera] - pass to enable frustum culling
     */
    draw(ctx, camera) {
      if (!this._img) return;

      const tw = this.tileWidth;
      const th = this.tileHeight;

      // Compute visible tile range for culling
      let colStart = 0, colEnd = this._cols;
      let rowStart = 0, rowEnd = this._rows;

      if (camera) {
        colStart = Math.max(0,           Math.floor((camera.x - this.x)                          / tw) - 1);
        rowStart = Math.max(0,           Math.floor((camera.y - this.y)                          / th) - 1);
        colEnd   = Math.min(this._cols,  Math.ceil( (camera.x + camera.width  - this.x)          / tw) + 1);
        rowEnd   = Math.min(this._rows,  Math.ceil( (camera.y + camera.height - this.y)          / th) + 1);
      }

      for (let row = rowStart; row < rowEnd; row++) {
        for (let col = colStart; col < colEnd; col++) {
          const tileIdx = this.grid[row][col];
          if (tileIdx < 0) continue;

          const srcCol = tileIdx % this.tilesetCols;
          const srcRow = Math.floor(tileIdx / this.tilesetCols);

          ctx.drawImage(
            this._img,
            srcCol * tw, srcRow * th, tw, th,       // source rect
            this.x + col * tw, this.y + row * th, tw, th  // dest rect
          );
        }
      }
    }
  }

  // ── TilemapSystem ───────────────────────────────────────────────────────────

  class TilemapSystem {
    constructor() {
      this.name      = 'TilemapSystem';
      this._tilemaps = [];
      this._loader   = null;
    }

    /** Called automatically by Engine.addSystem(). */
    init(engine) {
      if (engine && engine.loader) this._loader = engine.loader;
    }

    /**
     * Attach an AssetLoader so tilemaps can resolve tileset images.
     * createGameAsync() calls this automatically.
     * @param {GF.AssetLoader} loader
     */
    attachLoader(loader) {
      this._loader = loader;
      return this;
    }

    /**
     * Create and register a new Tilemap.
     * @param {Object} cfg - same as Tilemap constructor
     * @returns {Tilemap}
     */
    create(cfg) {
      const tm = new Tilemap(cfg);
      this._tilemaps.push(tm);
      return tm;
    }

    /** Remove a previously created tilemap. */
    remove(tilemap) {
      const i = this._tilemaps.indexOf(tilemap);
      if (i >= 0) this._tilemaps.splice(i, 1);
    }

    /** Remove all tilemaps. */
    clear() { this._tilemaps = []; }

    update() {
      // Lazily resolve image handles each frame until all are loaded
      if (this._loader) {
        this._tilemaps.forEach(tm => tm._resolveImage(this._loader));
      }
    }

    // Games control layer ordering, so TilemapSystem has no autonomous render().
    // Instead call tilemap.draw(ctx, camera) directly inside your render callback.
    render() {}
  }

  GF.Tilemap       = Tilemap;
  GF.TilemapSystem = TilemapSystem;

})(window.GF = window.GF || {});


// -- systems/SaveSystem.js ---------------------------------------

// GameFramework/framework/systems/SaveSystem.js
// Thin localStorage wrapper with JSON serialisation, versioning, and slot support.
//
// All keys are namespaced so saves from different games never collide.
// createGame() exposes this as game.save; set opts.saveOpts.namespace to your
// game's name for isolation.
//
// Usage:
//   game.save.write('slot1', { level: 3, score: 9500 });
//   const record = game.save.read('slot1');
//   // record -> { data: { level: 3, score: 9500 }, version: 1, timestamp: <ms> }
//
//   game.save.list();   // [ { slot, version, timestamp }, … ]
//   game.save.exists('slot1');  // true
//   game.save.delete('slot1');
//   game.save.clear();  // wipe every slot in this namespace

(function (GF) {
  'use strict';

  class SaveSystem {
    /**
     * @param {Object} cfg
     * @param {string} cfg.namespace - prefix for localStorage keys (default: 'GF')
     */
    constructor(cfg = {}) {
      this.name      = 'SaveSystem';
      this.namespace = cfg.namespace || 'GF';
    }

    // ── Key helpers ─────────────────────────────────────────────────────────

    _key(slot) {
      return 'GF_SAVE_' + this.namespace + '_' + String(slot);
    }

    _prefix() {
      return 'GF_SAVE_' + this.namespace + '_';
    }

    // ── Core API ────────────────────────────────────────────────────────────

    /**
     * Write data to a named save slot.
     *
     * @param {string} slot          - slot identifier, e.g. 'slot1' or 'autosave'
     * @param {*}      data          - any JSON-serialisable value
     * @param {number} [version=1]   - schema version number (for future migration)
     * @returns {boolean}            - true on success, false if localStorage is unavailable
     */
    write(slot, data, version) {
      try {
        const record = {
          version:   version !== undefined ? version : 1,
          timestamp: Date.now(),
          data:      data,
        };
        localStorage.setItem(this._key(slot), JSON.stringify(record));
        return true;
      } catch (e) {
        console.warn('[SaveSystem] write("' + slot + '") failed:', e);
        return false;
      }
    }

    /**
     * Read a save slot.
     *
     * @param {string} slot
     * @returns {{ data: *, version: number, timestamp: number } | null}
     *   Returns null when the slot is empty or the JSON is corrupt.
     */
    read(slot) {
      try {
        const raw = localStorage.getItem(this._key(slot));
        if (raw === null) return null;
        return JSON.parse(raw);
      } catch (e) {
        console.warn('[SaveSystem] read("' + slot + '") failed:', e);
        return null;
      }
    }

    /**
     * Return true when the slot contains data.
     * @param {string} slot
     */
    exists(slot) {
      return localStorage.getItem(this._key(slot)) !== null;
    }

    /**
     * Delete a single save slot.
     * @param {string} slot
     */
    delete(slot) {
      localStorage.removeItem(this._key(slot));
    }

    /**
     * List all save slots for this namespace, sorted by timestamp (newest first).
     * @returns {{ slot: string, version: number|null, timestamp: number|null }[]}
     */
    list() {
      const prefix  = this._prefix();
      const results = [];

      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith(prefix)) continue;
        const slot = k.slice(prefix.length);
        try {
          const record = JSON.parse(localStorage.getItem(k));
          results.push({ slot, version: record.version, timestamp: record.timestamp });
        } catch (_) {
          results.push({ slot, version: null, timestamp: null });
        }
      }

      results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      return results;
    }

    /**
     * Delete all save slots in this namespace.
     */
    clear() {
      const prefix   = this._prefix();
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) toRemove.push(k);
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    }

    // ── System interface (no-ops — SaveSystem is sync / on-demand) ──────────

    update() {}
    render() {}
  }

  GF.SaveSystem = SaveSystem;

})(window.GF = window.GF || {});


// -- systems/DebugOverlay.js -------------------------------------

// GameFramework/framework/systems/DebugOverlay.js
// Toggleable developer overlay — press F1 (or cfg.toggleKey) to show/hide.
//
// Displays:
//   • FPS counter
//   • Physics body count + AABB wireframes (green) + velocity vectors (yellow)
//   • Any custom watch values registered with overlay.watch()
//
// Added automatically by createGame() as game.debug.
// Extra watches example:
//   game.debug.watch('playerX', () => Math.round(player.x));
//   game.debug.watch('state',   () => stateMachine.current);

(function (GF) {
  'use strict';

  class DebugOverlay {
    /**
     * @param {Object}  cfg
     * @param {string}  cfg.toggleKey - KeyboardEvent.code to toggle (default 'F1')
     * @param {boolean} cfg.enabled   - start visible (default false)
     */
    constructor(cfg = {}) {
      this.name      = 'DebugOverlay';
      this.toggleKey = cfg.toggleKey || 'F1';
      this.enabled   = cfg.enabled   !== undefined ? cfg.enabled : false;

      this._watches  = []; // { label: string, fn: () => * }
      this._engine   = null;
    }

    // ── System interface ────────────────────────────────────────────────────

    init(engine) {
      this._engine = engine;
      window.addEventListener('keydown', e => {
        if (e.code === this.toggleKey) {
          e.preventDefault();
          this.enabled = !this.enabled;
          console.log('[DebugOverlay] ' + (this.enabled ? 'ON' : 'OFF'));
        }
      });
    }

    update() {}

    render(ctx, engine) {
      if (!this.enabled) return;

      const e = engine || this._engine;

      // ── Physics wireframes ──────────────────────────────────────────────

      const physics = e && e.getSystem ? e.getSystem('PhysicsSystem') : null;
      if (physics && physics._bodies && physics._bodies.length) {
        ctx.save();
        physics._bodies.forEach(b => {
          // AABB outline
          ctx.strokeStyle = 'rgba(0,255,80,0.85)';
          ctx.lineWidth   = 1;
          ctx.strokeRect(b.x, b.y, b.width, b.height);

          // Centre dot
          ctx.fillStyle = 'rgba(0,255,80,0.85)';
          ctx.fillRect(b.centerX - 2, b.centerY - 2, 4, 4);

          // Velocity vector (scaled so 600 px/s ≈ 30 px long)
          const scale = 0.05;
          const vx = b.vx * scale;
          const vy = b.vy * scale;
          if (Math.abs(vx) > 0.5 || Math.abs(vy) > 0.5) {
            ctx.strokeStyle = 'rgba(255,220,0,0.9)';
            ctx.lineWidth   = 2;
            ctx.beginPath();
            ctx.moveTo(b.centerX, b.centerY);
            ctx.lineTo(b.centerX + vx, b.centerY + vy);
            ctx.stroke();

            // Arrowhead
            const angle = Math.atan2(vy, vx);
            const al    = 6;
            ctx.beginPath();
            ctx.moveTo(b.centerX + vx, b.centerY + vy);
            ctx.lineTo(
              b.centerX + vx - al * Math.cos(angle - 0.4),
              b.centerY + vy - al * Math.sin(angle - 0.4)
            );
            ctx.moveTo(b.centerX + vx, b.centerY + vy);
            ctx.lineTo(
              b.centerX + vx - al * Math.cos(angle + 0.4),
              b.centerY + vy - al * Math.sin(angle + 0.4)
            );
            ctx.stroke();
          }

          // "grounded" indicator
          if (b.grounded) {
            ctx.fillStyle = 'rgba(0,180,255,0.7)';
            ctx.fillRect(b.x, b.bottom - 2, b.width, 2);
          }
        });
        ctx.restore();
      }

      // ── HUD panel ───────────────────────────────────────────────────────

      const lines = [];
      lines.push('GF debug  [' + (this.toggleKey) + ']');
      lines.push('FPS: ' + (e ? Math.round(e.fps || 0) : '?'));
      lines.push('Bodies: ' + (physics ? physics._bodies.length : 0));

      this._watches.forEach(w => {
        let val;
        try { val = w.fn(); } catch (_) { val = '!err'; }
        lines.push(w.label + ': ' + val);
      });

      const PAD    = 8;
      const LINE_H = 16;
      const PAN_W  = 180;
      const PAN_H  = lines.length * LINE_H + PAD * 2;
      const PAN_X  = 8;
      const PAN_Y  = 8;

      ctx.save();

      // Panel background
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(PAN_X, PAN_Y, PAN_W, PAN_H);

      // Top accent bar
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(PAN_X, PAN_Y, PAN_W, 2);

      // Text
      ctx.textBaseline = 'top';
      lines.forEach((line, i) => {
        ctx.font      = i === 0 ? 'bold 11px monospace' : '12px monospace';
        ctx.fillStyle = i === 0 ? '#00ff88' : '#ccffee';
        ctx.fillText(line, PAN_X + PAD, PAN_Y + PAD + i * LINE_H);
      });

      ctx.restore();
    }

    // ── Watch API ───────────────────────────────────────────────────────────

    /**
     * Add a custom value line to the overlay panel.
     * @param {string}   label - display label
     * @param {Function} fn    - called each frame; return value is displayed
     * @returns {this}
     */
    watch(label, fn) {
      this._watches.push({ label, fn });
      return this;
    }

    /**
     * Remove all custom watches.
     * @returns {this}
     */
    clearWatches() {
      this._watches = [];
      return this;
    }

    /**
     * Remove a single watch by label.
     * @param {string} label
     * @returns {this}
     */
    removeWatch(label) {
      this._watches = this._watches.filter(w => w.label !== label);
      return this;
    }
  }

  GF.DebugOverlay = DebugOverlay;

})(window.GF = window.GF || {});


// -- systems/DialogueSystem.js -----------------------------------

// GameFramework/framework/systems/DialogueSystem.js
// Script sequencer for text panels, speaker portraits, and timed events.
//
// A dialogue script is an array of step objects:
//
//   { type: 'text',  speaker: 'Claude',  portrait: 'claude_idle',
//     text: 'Hello, adventurer!',  duration: 2 }   // auto-advances after 2 s
//
//   { type: 'text',  text: 'Narration — no speaker box.' }
//
//   { type: 'pause', duration: 1.5 }               // silent wait, then continues
//
//   { type: 'event', id: 'boss_intro' }             // fires 'dialogue:event' on EventBus
//                                                   // and immediately continues
//
// Text steps with no duration wait for the player to press the advance action
// (default: 'interact').  Pressing advance while the typewriter is mid-way
// through instantly completes it; a second press advances.
//
// Portrait images:
//   Supply a getPortrait callback in cfg, or register images via addPortrait().
//   The callback receives the portrait string from the script step and should
//   return an HTMLImageElement (or null).
//
// EventBus events emitted:
//   'dialogue:start'    — when start() is called
//   'dialogue:advance'  — on each text step  { index, step }
//   'dialogue:event'    — on event steps      { id, step }
//   'dialogue:end'      — when the script finishes or stop() is called

(function (GF) {
  'use strict';

  class DialogueSystem {
    /**
     * @param {Object}   cfg
     * @param {string}   cfg.advanceKey     - input action bound in InputManager (default 'interact')
     * @param {number}   cfg.typeSpeed      - chars/second typewriter effect; 0 = instant (default 40)
     * @param {Function} cfg.getPortrait    - (name: string) => HTMLImageElement | null
     * @param {Object}   cfg.box            - style overrides for the dialogue box
     */
    constructor(cfg = {}) {
      this.name       = 'DialogueSystem';
      this.advanceKey = cfg.advanceKey || 'interact';
      this.typeSpeed  = cfg.typeSpeed  !== undefined ? cfg.typeSpeed : 40;

      this._getPortraitCb = cfg.getPortrait || null;
      this._portraits     = {}; // name -> HTMLImageElement, registered via addPortrait()

      // ── Box style ─────────────────────────────────────────────────────────
      this.box = Object.assign({
        x:            40,
        y:            340,
        width:        720,
        height:       110,
        padding:      16,
        radius:       8,
        fillStyle:    'rgba(10,10,30,0.93)',
        strokeStyle:  '#4488ff',
        lineWidth:    2,
        font:         '16px sans-serif',
        textColor:    '#ffffff',
        speakerFont:  'bold 14px sans-serif',
        speakerColor: '#88bbff',
        lineHeight:   22,
        portraitSize: 78,
      }, cfg.box || {});

      // ── State ─────────────────────────────────────────────────────────────
      this._script    = [];
      this._index     = -1;
      this._current   = null;
      this._visible   = '';   // typewriter: currently shown portion of text
      this._typeTimer = 0;
      this._autoTimer = 0;
      this._events    = null; // GF.EventBus

      /** True while a script is running. */
      this.isActive = false;
    }

    // ── System interface ────────────────────────────────────────────────────

    init(engine) {
      this._events = engine ? engine.events : null;
    }

    // ── Portrait helpers ────────────────────────────────────────────────────

    /**
     * Register a portrait image by name.
     * Alternatively supply cfg.getPortrait for dynamic lookups.
     * @param {string}           name
     * @param {HTMLImageElement} img
     */
    addPortrait(name, img) {
      this._portraits[name] = img;
      return this;
    }

    _resolvePortrait(name) {
      if (!name) return null;
      if (this._portraits[name]) return this._portraits[name];
      if (this._getPortraitCb)   return this._getPortraitCb(name);
      return null;
    }

    // ── Public API ──────────────────────────────────────────────────────────

    /**
     * Start playing a dialogue script.
     * @param {Array} script - array of step objects (see module header)
     * @returns {this}
     */
    start(script) {
      this._script  = Array.isArray(script) ? script : [];
      this._index   = -1;
      this.isActive = this._script.length > 0;
      if (this.isActive) {
        this._emit('dialogue:start');
        this._step();
      }
      return this;
    }

    /**
     * Advance to the next step.
     * If the typewriter is still running, completes it instead.
     */
    next() {
      if (!this.isActive) return;
      const step = this._current;
      if (step && step.type === 'text') {
        const full = step.text || '';
        if (this._visible.length < full.length) {
          // Complete typewriter
          this._visible = full;
          return;
        }
      }
      this._step();
    }

    /**
     * Immediately end the dialogue without finishing the script.
     */
    stop() {
      this._current = null;
      this.isActive = false;
      this._emit('dialogue:end');
    }

    // ── Internal sequencer ──────────────────────────────────────────────────

    _step() {
      this._index++;
      if (this._index >= this._script.length) {
        this.stop();
        return;
      }

      const step = this._script[this._index];
      this._current   = step;
      this._typeTimer = 0;
      this._autoTimer = 0;
      this._visible   = '';

      const type = step.type || 'text';

      if (type === 'event') {
        this._emit('dialogue:event', { id: step.id, step });
        this._step(); // event steps don't pause
        return;
      }

      if (type === 'text') {
        this._emit('dialogue:advance', { index: this._index, step });
        if (!this.typeSpeed) this._visible = step.text || '';
      }
      // 'pause' steps just wait for _autoTimer
    }

    _emit(name, detail) {
      if (this._events) this._events.emit(name, detail);
    }

    // ── Update ──────────────────────────────────────────────────────────────

    update(dt, engine) {
      if (!this.isActive || !this._current) return;

      const step = this._current;
      const type = step.type || 'text';

      // Advance key
      const input = engine && engine.input;
      if (input && input.wasPressed(this.advanceKey)) {
        this.next();
        return;
      }

      if (type === 'text') {
        // Typewriter
        const full = step.text || '';
        if (this.typeSpeed && this._visible.length < full.length) {
          this._typeTimer += dt;
          const charsToShow = Math.floor(this._typeTimer * this.typeSpeed);
          this._visible = full.slice(0, Math.min(charsToShow, full.length));
        }

        // Auto-advance when text is complete and duration is set
        if (step.duration !== undefined && this._visible.length >= (step.text || '').length) {
          this._autoTimer += dt;
          if (this._autoTimer >= step.duration) this._step();
        }
      }

      if (type === 'pause') {
        this._autoTimer += dt;
        if (this._autoTimer >= (step.duration || 1)) this._step();
      }
    }

    // ── Render ──────────────────────────────────────────────────────────────

    render(ctx) {
      if (!this.isActive || !this._current) return;
      const step = this._current;
      if ((step.type || 'text') !== 'text') return;

      const b   = this.box;
      const pad = b.padding;

      ctx.save();

      // ── Box ───────────────────────────────────────────────────────────────
      ctx.fillStyle   = b.fillStyle;
      ctx.strokeStyle = b.strokeStyle;
      ctx.lineWidth   = b.lineWidth;

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(b.x, b.y, b.width, b.height, b.radius);
      } else {
        // Fallback for older browsers
        ctx.rect(b.x, b.y, b.width, b.height);
      }
      ctx.fill();
      ctx.stroke();

      // ── Portrait ──────────────────────────────────────────────────────────
      let textX = b.x + pad;
      const portrait = this._resolvePortrait(step.portrait);
      if (portrait) {
        const ps = b.portraitSize;
        const py = b.y + (b.height - ps) / 2;
        ctx.drawImage(portrait, b.x + pad, py, ps, ps);
        textX += ps + pad;
      }

      let textY = b.y + pad;

      // ── Speaker name ──────────────────────────────────────────────────────
      if (step.speaker) {
        ctx.font        = b.speakerFont;
        ctx.fillStyle   = b.speakerColor;
        ctx.textBaseline = 'top';
        ctx.fillText(step.speaker, textX, textY);
        textY += b.lineHeight;
      }

      // ── Body text (word-wrapped) ───────────────────────────────────────────
      ctx.font        = b.font;
      ctx.fillStyle   = b.textColor;
      ctx.textBaseline = 'top';

      const maxTextWidth = b.width - (textX - b.x) - pad;
      this._wrapText(ctx, this._visible, textX, textY, maxTextWidth, b.lineHeight);

      // ── Advance indicator (blinking ▼) ────────────────────────────────────
      const full     = step.text || '';
      const textDone = !this.typeSpeed || this._visible.length >= full.length;
      const hasAuto  = step.duration !== undefined;

      if (textDone && !hasAuto) {
        const blink = Math.floor(Date.now() / 400) % 2 === 0;
        if (blink) {
          ctx.font      = '13px sans-serif';
          ctx.fillStyle = b.speakerColor;
          ctx.fillText('▼', b.x + b.width - pad - 10, b.y + b.height - pad - 13);
        }
      }

      ctx.restore();
    }

    // ── Text utility ────────────────────────────────────────────────────────

    _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
      if (!text) return;
      const words = text.split(' ');
      let line = '';
      let cy   = y;

      for (let i = 0; i < words.length; i++) {
        const test = line ? line + ' ' + words[i] : words[i];
        if (ctx.measureText(test).width > maxWidth && line !== '') {
          ctx.fillText(line, x, cy);
          line = words[i];
          cy  += lineHeight;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line, x, cy);
    }
  }

  GF.DialogueSystem = DialogueSystem;

})(window.GF = window.GF || {});


// -- systems/ModelSystem.js --------------------------------------

// GameFramework/framework/systems/ModelSystem.js
// 3D GLB/GLTF model viewing system using Three.js.
//
// Prerequisites — load these scripts BEFORE GameFramework.bundle.js:
//   <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
//   <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
//   <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
//
// Usage in GF.createGame opts:  { models: true }
// The system is registered as engine.getSystem('models') and also game.models.
//
// The ModelSystem creates its own WebGL canvas placed BEHIND the game canvas.
// Set engineConfig.backgroundColor = 'transparent' so the 2D canvas doesn't
// cover the 3D view.

(function (GF) {
  'use strict';

  class ModelSystem {
    constructor(opts) {
      opts = opts || {};
      this.name = 'models';

      // Internal state
      this._models       = {};          // { name: ModelData }
      this._activeModel  = null;        // currently shown ModelData
      this._mixer        = null;        // THREE.AnimationMixer
      this._actions      = {};          // { clipName: AnimationAction }
      this._activeAction = null;

      // Three.js objects
      this._scene    = null;
      this._camera   = null;
      this._renderer = null;
      this._controls = null;
      this._threeCanvas = null;         // the WebGL canvas element

      this._gridHelper  = null;
      this._axesHelper  = null;

      // Options
      this._bgColor  = opts.bgColor  !== undefined ? opts.bgColor  : 0x16161e;
      this._showGrid = opts.showGrid !== undefined ? opts.showGrid : true;
      this._showAxes = opts.showAxes !== undefined ? opts.showAxes : false;

      // Callbacks
      this._onModelLoaded = null;
      this._onModelError  = null;
    }

    // ─── Lifecycle ─────────────────────────────────────────────────────────────

    init(engine) {
      const THREE = window.THREE;
      if (!THREE) {
        console.error('[ModelSystem] window.THREE not found. Load Three.js before GameFramework.');
        return;
      }

      const W = engine.canvas.width;
      const H = engine.canvas.height;

      // ── Three.js Scene ──
      this._scene = new THREE.Scene();
      this._scene.background = new THREE.Color(this._bgColor);

      // ── Camera ──
      this._camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 500);
      this._camera.position.set(0, 1.5, 4);

      // ── Renderer ──
      this._renderer = new THREE.WebGLRenderer({ antialias: true });
      this._renderer.setPixelRatio(window.devicePixelRatio || 1);
      this._renderer.setSize(W, H);
      this._renderer.shadowMap.enabled = true;
      this._renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
      try {
        // r128 uses outputEncoding; newer builds use outputColorSpace
        this._renderer.outputEncoding   = THREE.sRGBEncoding;
        this._renderer.toneMapping      = THREE.ACESFilmicToneMapping;
        this._renderer.toneMappingExposure = 1.0;
      } catch (_) {}

      // ── Insert WebGL canvas BEHIND the game canvas ──
      this._threeCanvas = this._renderer.domElement;
      this._threeCanvas.style.cssText =
        'position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;';

      const parent = engine.canvas.parentElement || document.body;
      parent.style.position = 'relative';
      parent.insertBefore(this._threeCanvas, engine.canvas);

      // Make game canvas transparent & on top
      engine.canvas.style.cssText +=
        ';position:absolute;top:0;left:0;z-index:1;background:transparent;';

      // ── Lights ──
      this._applyLighting('studio');

      // ── Grid helper ──
      this._gridHelper = new THREE.GridHelper(10, 20, 0x3a3a5c, 0x2a2a44);
      this._gridHelper.visible = this._showGrid;
      this._scene.add(this._gridHelper);

      // ── Axes helper ──
      this._axesHelper = new THREE.AxesHelper(1);
      this._axesHelper.visible = this._showAxes;
      this._scene.add(this._axesHelper);

      // ── Orbit controls ──
      if (THREE.OrbitControls) {
        this._controls = new THREE.OrbitControls(this._camera, this._threeCanvas);
        this._controls.enableDamping  = true;
        this._controls.dampingFactor  = 0.06;
        this._controls.minDistance    = 0.2;
        this._controls.maxDistance    = 100;
        this._controls.target.set(0, 1, 0);
        this._controls.update();
      } else {
        console.warn('[ModelSystem] THREE.OrbitControls not found. Orbit controls disabled.');
      }

      // ── Sync renderer size when engine canvas resizes ──
      this._resizeObserver = new ResizeObserver(() => this._syncSize(engine));
      this._resizeObserver.observe(engine.canvas.parentElement || document.body);
    }

    _syncSize(engine) {
      if (!this._renderer) return;
      const W = engine.canvas.width;
      const H = engine.canvas.height;
      this._camera.aspect = W / H;
      this._camera.updateProjectionMatrix();
      this._renderer.setSize(W, H);
    }

    update(dt /*, engine */) {
      if (this._controls) this._controls.update();
      if (this._mixer)    this._mixer.update(dt);
    }

    render(/* ctx, engine */) {
      // Three.js renders to its own canvas — no 2D ctx ops needed
      if (this._renderer && this._scene && this._camera) {
        this._renderer.render(this._scene, this._camera);
      }
    }

    destroy() {
      if (this._resizeObserver) this._resizeObserver.disconnect();
      if (this._mixer) this._mixer.stopAllAction();
      if (this._renderer) {
        this._renderer.dispose();
        if (this._threeCanvas && this._threeCanvas.parentElement) {
          this._threeCanvas.parentElement.removeChild(this._threeCanvas);
        }
      }
    }

    // ─── Lighting Presets ──────────────────────────────────────────────────────

    _lightRefs = [];

    _applyLighting(preset) {
      const THREE = window.THREE;
      this._lightRefs.forEach(l => this._scene.remove(l));
      this._lightRefs = [];

      const add = (...lights) => {
        lights.forEach(l => { this._scene.add(l); this._lightRefs.push(l); });
      };

      if (preset === 'studio') {
        const amb  = new THREE.AmbientLight(0xffffff, 0.35);
        const key  = new THREE.DirectionalLight(0xffffff, 1.1);
        key.position.set(5, 8, 5);
        key.castShadow = true;
        key.shadow.mapSize.set(1024, 1024);
        const fill = new THREE.DirectionalLight(0x8899ff, 0.25);
        fill.position.set(-5, 3, -3);
        const rim  = new THREE.DirectionalLight(0xffeedd, 0.2);
        rim.position.set(0, 6, -8);
        add(amb, key, fill, rim);

      } else if (preset === 'outdoor') {
        const sky = new THREE.AmbientLight(0x87ceeb, 0.45);
        const sun = new THREE.DirectionalLight(0xfff4cc, 1.3);
        sun.position.set(10, 20, 8);
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        add(sky, sun);

      } else if (preset === 'dramatic') {
        const amb  = new THREE.AmbientLight(0x0a0a1a, 0.15);
        const spot = new THREE.SpotLight(0xff7700, 2.5);
        spot.position.set(4, 9, 4);
        spot.castShadow = true;
        spot.angle = Math.PI / 7;
        spot.penumbra = 0.3;
        const cold = new THREE.PointLight(0x0055ff, 1.0, 20);
        cold.position.set(-6, 2, -4);
        add(amb, spot, cold);

      } else if (preset === 'flat') {
        const amb = new THREE.AmbientLight(0xffffff, 1.0);
        add(amb);
      }

      this._currentLightPreset = preset;
    }

    // ─── Model Management ─────────────────────────────────────────────────────

    /**
     * Load a GLB/GLTF from a File object (e.g. from <input type="file">).
     * @param {File} file
     * @param {string} [nameOverride]  optional display name
     * @returns {Promise<ModelData>}
     */
    loadFromFile(file, nameOverride) {
      if (!window.THREE || !window.THREE.GLTFLoader) {
        return Promise.reject(new Error('[ModelSystem] THREE.GLTFLoader not found.'));
      }
      const name = nameOverride || file.name.replace(/\.(glb|gltf)$/i, '');
      const url  = URL.createObjectURL(file);
      return this._loadURL(url, name).then(data => {
        URL.revokeObjectURL(url);
        return data;
      });
    }

    /**
     * Load a GLB/GLTF from a URL.
     * @param {string} url
     * @param {string} [name]
     * @returns {Promise<ModelData>}
     */
    loadFromURL(url, name) {
      name = name || url.split('/').pop().replace(/\.(glb|gltf)$/i, '');
      return this._loadURL(url, name);
    }

    _loadURL(url, name) {
      return new Promise((resolve, reject) => {
        const loader = new window.THREE.GLTFLoader();
        loader.load(
          url,
          gltf => {
            const data = this._processGLTF(gltf, name);
            this._models[name] = data;
            if (this._onModelLoaded) this._onModelLoaded(name, data);
            resolve(data);
          },
          undefined,
          err => {
            console.error('[ModelSystem] Load failed:', name, err);
            if (this._onModelError) this._onModelError(name, err);
            reject(err);
          }
        );
      });
    }

    _processGLTF(gltf, name) {
      const THREE = window.THREE;
      const root  = gltf.scene || gltf.scenes[0];

      // Auto-fit: centre model and scale so its longest dimension = 2 units
      const box    = new THREE.Box3().setFromObject(root);
      const size   = box.getSize(new THREE.Vector3());
      const centre = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale  = 2.0 / maxDim;

      root.scale.setScalar(scale);
      root.position.x -= centre.x * scale;
      root.position.z -= centre.z * scale;
      root.position.y -= box.min.y * scale;   // sit model on the ground plane

      // Enable shadows on all meshes
      root.traverse(child => {
        if (child.isMesh) {
          child.castShadow    = true;
          child.receiveShadow = true;
        }
      });

      // Gather stats
      const matSet = new Set();
      let meshCount = 0;
      root.traverse(child => {
        if (!child.isMesh) return;
        meshCount++;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(m => matSet.add(m));
      });

      const animations    = gltf.animations || [];
      const animationNames = animations.map(a => a.name);

      return { name, scene: root, animations, animationNames, meshCount, matCount: matSet.size };
    }

    /**
     * Make the named model visible in the 3D scene.
     * @param {string} name
     */
    showModel(name) {
      const THREE = window.THREE;

      // Tear down current model
      if (this._activeModel) {
        this._scene.remove(this._activeModel.scene);
        if (this._mixer) {
          this._mixer.stopAllAction();
          this._mixer = null;
        }
        this._actions      = {};
        this._activeAction = null;
      }

      const data = this._models[name];
      if (!data) { console.warn('[ModelSystem] Unknown model:', name); return; }

      this._activeModel = data;
      this._scene.add(data.scene);

      // Re-apply wireframe if toggled
      if (this._wireframe) this.setWireframe(true);

      // Create animation mixer
      if (data.animations.length > 0) {
        this._mixer = new THREE.AnimationMixer(data.scene);
        data.animations.forEach(clip => {
          this._actions[clip.name] = this._mixer.clipAction(clip);
        });
        // Auto-play first animation
        if (data.animationNames[0]) this.playAnimation(data.animationNames[0]);
      }
    }

    removeModel(name) {
      if (this._activeModel && this._activeModel.name === name) {
        this._scene.remove(this._activeModel.scene);
        this._activeModel = null;
        if (this._mixer) { this._mixer.stopAllAction(); this._mixer = null; }
        this._actions = {}; this._activeAction = null;
      }
      delete this._models[name];
    }

    getModelNames()   { return Object.keys(this._models); }
    getActiveModel()  { return this._activeModel; }

    // ─── Animation ────────────────────────────────────────────────────────────

    playAnimation(name) {
      const action = this._actions[name];
      if (!action) return;
      if (this._activeAction && this._activeAction !== action) {
        this._activeAction.fadeOut(0.25);
      }
      this._activeAction = action;
      this._activeAction.reset().fadeIn(0.25).play();
    }

    stopAnimation() {
      if (this._activeAction) { this._activeAction.fadeOut(0.25); this._activeAction = null; }
    }

    getActiveAnimationName() {
      return this._activeAction ? this._activeAction.getClip().name : null;
    }

    // ─── Scene Controls ──────────────────────────────────────────────────────

    resetCamera() {
      if (!this._camera) return;
      this._camera.position.set(0, 1.5, 4);
      if (this._controls) { this._controls.target.set(0, 1, 0); this._controls.update(); }
    }

    setLighting(preset) { this._applyLighting(preset); }

    showGrid(visible) {
      if (this._gridHelper) this._gridHelper.visible = visible;
    }

    showAxes(visible) {
      if (this._axesHelper) this._axesHelper.visible = visible;
    }

    setWireframe(enabled) {
      this._wireframe = enabled;
      if (!this._activeModel) return;
      this._activeModel.scene.traverse(child => {
        if (!child.isMesh) return;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(m => { m.wireframe = enabled; });
      });
    }

    setBackground(colorHex) {
      this._bgColor = colorHex;
      if (this._scene) this._scene.background = new window.THREE.Color(colorHex);
    }

    // ─── Event Hooks ─────────────────────────────────────────────────────────

    /** fn(name, modelData) called after each successful load */
    onModelLoaded(fn) { this._onModelLoaded = fn; }

    /** fn(name, error) called on load failure */
    onError(fn) { this._onModelError = fn; }
  }

  GF.ModelSystem = ModelSystem;

})(window.GF = window.GF || {});


// -- GameFramework.js --------------------------------------------

// GameFramework/framework/GameFramework.js
(function (GF) {
  'use strict';

  GF.VERSION = '2.1.0';

  // Auto-detect the directory this bundle was loaded from so that
  // GF.resolvePath() works regardless of where the game lives on disk.
  // Games no longer need to declare frameworkPath in GAME_CONFIG.
  GF._frameworkBase = (function () {
    var s = document.currentScript;
    if (!s) {
      // Fallback for browsers that don't support currentScript (e.g. old IE):
      // walk the script list backwards and pick the first GameFramework entry.
      var all = document.querySelectorAll('script[src]');
      for (var i = all.length - 1; i >= 0; i--) {
        if (all[i].src.indexOf('GameFramework') !== -1) { s = all[i]; break; }
      }
    }
    if (s && s.src) return s.src.replace(/\/[^\/]*$/, '');
    return '/framework';
  }());

  // Resolve a path relative to the framework folder.
  GF.resolvePath = function (relativePath) {
    var base = GF._frameworkBase.replace(/\/$/, '');
    return base + '/' + relativePath.replace(/^\//, '');
  };

  GF.createGame = function (engineConfig, physicsConfig, opts) {
    opts = opts || {};
    var useAudio     = opts.audio     !== false;
    var useTweens    = opts.tweens    !== false;
    var useParticles = opts.particles !== false;
    var useScenes    = opts.scenes    !== false;
    var useTilemap   = opts.tilemap   !== false;
    var useDebug     = opts.debug     !== false;
    var useDialogue  = opts.dialogue  !== false;
    var useModels    = !!opts.models;

    var engine  = new GF.Engine(engineConfig);
    var sprites = new GF.SpriteSystem();
    var physics = new GF.PhysicsSystem(physicsConfig);
    var ui      = GF.UISystem;

    // SaveSystem is always created; namespace defaults to opts.gameName or 'GF'.
    var saveOpts = Object.assign({ namespace: opts.gameName || 'GF' }, opts.saveOpts || {});
    var save = new GF.SaveSystem(saveOpts);

    engine.addSystem(sprites);
    engine.addSystem(physics);
    engine.addSystem(save);

    var audio     = useAudio     ? new GF.AudioSystem(opts.audioOpts || {})           : null;
    var tweens    = useTweens    ? new GF.TweenSystem()                                : null;
    var particles = useParticles ? new GF.ParticleSystem(opts.particleOpts || {})     : null;
    var scenes    = useScenes    ? new GF.SceneManager()                               : null;
    var tilemap   = useTilemap   ? new GF.TilemapSystem()                              : null;
    var dialogue  = useDialogue  ? new GF.DialogueSystem(opts.dialogueOpts || {})     : null;
    var models    = useModels    ? new GF.ModelSystem(opts.modelOpts || {})            : null;
    // DebugOverlay added last so it renders on top of everything.
    var debug     = useDebug     ? new GF.DebugOverlay(opts.debugOpts || {})           : null;

    if (audio)    engine.addSystem(audio);
    if (tweens)   engine.addSystem(tweens);
    if (particles) engine.addSystem(particles);
    if (scenes)   engine.addSystem(scenes);
    if (tilemap)  engine.addSystem(tilemap);
    if (dialogue) engine.addSystem(dialogue);
    if (models)   engine.addSystem(models);
    if (debug)    engine.addSystem(debug);

    return {
      engine: engine, sprites: sprites, physics: physics, ui: ui, save: save,
      audio: audio, tweens: tweens, particles: particles, scenes: scenes,
      tilemap: tilemap, dialogue: dialogue, models: models, debug: debug,
    };
  };

  GF.createGameAsync = async function (engineConfig, physicsConfig, opts) {
    opts = opts || {};
    var loader = new GF.AssetLoader();
    var game   = GF.createGame(engineConfig, physicsConfig, opts);
    if (opts.setup) opts.setup(loader, game);
    await loader.load(opts.onProgress);
    if (game.audio)   game.audio.attachLoader(loader);
    if (game.tilemap) game.tilemap.attachLoader(loader);
    return Object.assign({}, game, { loader: loader });
  };

  GF.applyLauncherConfig = function (gameName) {
    try {
      var raw = localStorage.getItem('GF_CONFIG_' + gameName);
      if (!raw) return;
      var overrides = JSON.parse(raw);
      _deepMerge(GF.GAME_CONFIG, overrides);
      console.log('[GF] Launcher config applied for "' + gameName + '"');
    } catch (e) {
      console.warn('[GF] applyLauncherConfig failed:', e);
    }
  };

  function _deepMerge(target, source) {
    var keys = Object.keys(source);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var val = source[key];
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        if (!target[key] || typeof target[key] !== 'object') target[key] = {};
        _deepMerge(target[key], val);
      } else {
        target[key] = val;
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.dispatchEvent(new CustomEvent('GF:ready', { detail: GF }));
    });
  } else {
    window.dispatchEvent(new CustomEvent('GF:ready', { detail: GF }));
  }

  console.log('%cGameFramework v' + GF.VERSION + ' loaded', 'color:#00e5ff;font-weight:bold');

})(window.GF = window.GF || {});
