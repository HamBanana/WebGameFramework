// GameFramework.bundle.js - AUTO-GENERATED, DO NOT EDIT
// Built: 2026-08-05T00:37:22.722Z
// Source: framework/build.js (core)

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


// -- utils/ProceduralAudio.js ------------------------------------

// GameFramework/framework/utils/ProceduralAudio.js
// Procedural sound generation helpers — extracted from SpaceInvaders &
// ShiningQuest so games can synthesise simple SFX without needing audio assets.
//
// The core function is GF.Audio.makeToneBuffer(audioCtx, freq, duration, type, env).
// Higher-level helpers provide common SFX presets (laser, hit, coin, etc.).
//
// Example:
//   const audio = game.audio;
//   GF.Audio.registerStandardSet(audio);   // registers 'laser', 'hit', 'coin', …
//   audio.play('laser');

(function (GF) {
  'use strict';

  GF.Audio = GF.Audio || {};

  // ── Core synthesis ─────────────────────────────────────────────────────────
  // type: 'sine' | 'square' | 'sweep' | 'noise'
  // env:  { attack, release, volume, sweep }
  GF.Audio.makeToneBuffer = function (audioCtx, freq, duration, type, env) {
    env = env || {};
    var sr     = audioCtx.sampleRate;
    var len    = Math.floor(sr * duration);
    var buffer = audioCtx.createBuffer(1, len, sr);
    var data   = buffer.getChannelData(0);
    var attack  = env.attack  || 0.01;
    var release = env.release || duration;
    var volume  = env.volume  || 0.3;
    var sweep   = env.sweep   || 0;

    for (var i = 0; i < len; i++) {
      var t = i / sr;
      var sample = 0;
      if (type === 'square') {
        sample = Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1;
      } else if (type === 'noise') {
        sample = Math.random() * 2 - 1;
      } else if (type === 'sweep') {
        var f = freq + sweep * t;
        sample = Math.sin(2 * Math.PI * f * t);
      } else {
        sample = Math.sin(2 * Math.PI * freq * t);
      }
      var amp = 1;
      if (t < attack) amp = t / attack;
      else amp = Math.max(0, 1 - (t - attack) / Math.max(0.0001, release - attack));
      data[i] = sample * amp * volume;
    }
    return buffer;
  };

  // Multi-tone arpeggio (e.g. a level-up or coin-pickup chord).
  GF.Audio.makeArpeggioBuffer = function (audioCtx, freqs, stepDuration, type, env) {
    env = env || {};
    var totalDur = freqs.length * stepDuration;
    var sr       = audioCtx.sampleRate;
    var len      = Math.floor(sr * totalDur);
    var buffer   = audioCtx.createBuffer(1, len, sr);
    var data     = buffer.getChannelData(0);
    var volume   = env.volume || 0.3;

    for (var i = 0; i < len; i++) {
      var t      = i / sr;
      var step   = Math.min(freqs.length - 1, Math.floor(t / stepDuration));
      var stepT  = t - step * stepDuration;
      var freq   = freqs[step];
      var sample = (type === 'square')
        ? (Math.sin(2 * Math.PI * freq * stepT) > 0 ? 1 : -1)
        : Math.sin(2 * Math.PI * freq * stepT);
      var attack  = 0.01;
      var release = stepDuration;
      var amp     = stepT < attack ? stepT / attack
                    : Math.max(0, 1 - (stepT - attack) / (release - attack));
      data[i] = sample * amp * volume;
    }
    return buffer;
  };

  // ── Standard SFX preset library ────────────────────────────────────────────
  // Registers a generic, broadly-useful palette into an AudioSystem.
  GF.Audio.registerStandardSet = function (audioSystem, options) {
    if (!audioSystem) return;
    options = options || {};
    if (audioSystem._ensureContext) audioSystem._ensureContext();
    var ctx = audioSystem._ctx;
    if (!ctx) {
      console.warn('[ProceduralAudio] no AudioContext on AudioSystem');
      return;
    }
    var T = GF.Audio.makeToneBuffer;
    var A = GF.Audio.makeArpeggioBuffer;

    var presets = {
      laser:     T(ctx, 880, 0.12, 'square', { attack: 0.005, release: 0.12, volume: 0.20 }),
      shoot:     T(ctx, 880, 0.12, 'square', { attack: 0.005, release: 0.12, volume: 0.20 }),
      hit:       T(ctx, 200, 0.10, 'noise',  { attack: 0.005, release: 0.10, volume: 0.30 }),
      explode:   T(ctx, 150, 0.50, 'noise',  { attack: 0.01,  release: 0.50, volume: 0.35 }),
      coin:      A(ctx, [880, 1320], 0.07, 'square', { volume: 0.25 }),
      jump:      T(ctx, 520, 0.18, 'sweep',  { attack: 0.005, release: 0.18, sweep: 240, volume: 0.22 }),
      land:      T(ctx, 180, 0.10, 'square', { attack: 0.005, release: 0.10, volume: 0.18 }),
      pickup:    T(ctx, 750, 0.28, 'sweep',  { attack: 0.01,  release: 0.28, sweep: 320, volume: 0.30 }),
      powerup:   T(ctx, 750, 0.28, 'sweep',  { attack: 0.01,  release: 0.28, sweep: 320, volume: 0.30 }),
      levelUp:   A(ctx, [550, 660, 780, 1040], 0.08, 'square', { volume: 0.25 }),
      gameOver:  A(ctx, [440, 350, 260, 180], 0.18, 'square', { volume: 0.30 }),
      menuMove:  T(ctx, 660, 0.05, 'square', { attack: 0.001, release: 0.05, volume: 0.15 }),
      menuConfirm: T(ctx, 880, 0.12, 'square', { attack: 0.005, release: 0.12, volume: 0.22 }),
      menuCancel:  T(ctx, 220, 0.12, 'square', { attack: 0.005, release: 0.12, volume: 0.18 }),
    };

    var only = options.only || null;     // ['laser','hit'] etc
    var skip = options.skip || [];
    Object.keys(presets).forEach(function (k) {
      if (only && only.indexOf(k) < 0) return;
      if (skip.indexOf(k) >= 0) return;
      audioSystem.register(k, presets[k]);
    });
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


// -- core/GameLoader.js ------------------------------------------

// GameFramework/framework/core/GameLoader.js
// Manifest-driven part loading, so a game's index.html never lists its files.
//
// A game keeps its parts in one folder per KIND (sprites/, behaviors/, prefabs/,
// modules/, scenes/) and names them in manifest.json:
//
//   { "sprites":   ["invader", "player"],
//     "behaviors": ["FireOnChance", "PlayerMove"],
//     "prefabs":   ["invader", "bullet"],
//     "modules":   ["Hud", "Combat"],
//     "scenes":    [] }
//
// index.html then needs only:
//
//   <script src="config.js"></script>
//   <script src="../../framework/GameFramework.bundle.js"></script>
//   <script>GF.loadGame('manifest.json');</script>
//
// Adding a behaviour is one new file + one line in the manifest. Nothing that
// already exists gets edited — which is the whole point of the layout.
//
// Entries are bare names ("Hud") resolved to "<kind>/<name>.js". An entry that
// contains a '/' or ends in '.js' is used verbatim, so a game can still point
// somewhere else when it has to.

(function (GF) {
  'use strict';

  // Load order between kinds. Registrations are name-based and resolved lazily
  // (a prefab names its behaviours as strings), so this order is about being
  // predictable rather than about hard dependencies.
  var KIND_ORDER = ['data', 'sprites', 'behaviors', 'behaviours', 'prefabs', 'systems', 'modules', 'scenes'];

  // `levels` holds JSON documents, not scripts, so it is fetched rather than
  // injected — see loadLevels below. Keeping it out of KIND_ORDER stops
  // manifestPaths from turning "boss" into a <script src="levels/boss.js">.
  var DATA_KINDS = ['levels'];

  // ── ready gate ────────────────────────────────────────────────────────────
  // GF:ready must not fire until every part has registered itself, otherwise
  // boot would find an empty scene/module registry. Anything that loads game
  // code asynchronously claims the gate with GF.defer() and releases it when
  // done; GameFramework.js fires GF:ready once the gate is clear AND the DOM
  // is parsed, whichever happens last.
  GF._readyPending = GF._readyPending || 0;
  GF.defer  = function () { GF._readyPending++; return GF; };
  GF.release = function () {
    GF._readyPending = Math.max(0, GF._readyPending - 1);
    if (GF._maybeFireReady) GF._maybeFireReady();
    return GF;
  };

  /** Resolve one manifest entry to a URL relative to the game's own folder. */
  function entryPath(kind, entry) {
    if (typeof entry !== 'string') return null;
    if (entry.indexOf('/') !== -1 || /\.js$/i.test(entry)) {
      return /\.js$/i.test(entry) ? entry : entry + '.js';
    }
    return kind + '/' + entry + '.js';
  }

  /** Flatten a manifest object into an ordered list of script URLs. */
  GF.manifestPaths = function (manifest) {
    var out = [];
    if (!manifest) return out;

    // `scripts` is an escape hatch for files that must load before everything
    // else (a shared constants file, a vendored lib, ...).
    (manifest.scripts || []).forEach(function (e) {
      var p = entryPath('', e);
      if (p) out.push(p.replace(/^\//, ''));
    });

    var kinds = KIND_ORDER.slice();
    // Allow a game to add its own folder kinds; they load after the known ones.
    Object.keys(manifest).forEach(function (k) {
      if (k === 'scripts' || DATA_KINDS.indexOf(k) !== -1) return;
      if (kinds.indexOf(k) === -1 && Array.isArray(manifest[k])) kinds.push(k);
    });

    kinds.forEach(function (kind) {
      var list = manifest[kind];
      if (!Array.isArray(list)) return;
      list.forEach(function (e) {
        var p = entryPath(kind, e);
        if (p) out.push(p);
      });
    });
    return out;
  };

  /**
   * Inject scripts in order and resolve when all have run.
   * Uses `script.async = false`, which lets the browser download in parallel
   * but still execute in insertion order.
   */
  function injectAll(urls, baseDir) {
    if (!urls.length) return Promise.resolve([]);
    var pending = urls.length;
    var failed = [];
    return new Promise(function (resolve) {
      urls.forEach(function (url) {
        var s = document.createElement('script');
        s.src = baseDir + url;
        s.async = false;                 // preserve execution order
        s.onload = done;
        s.onerror = function () { failed.push(url); done(); };
        document.head.appendChild(s);
      });
      function done() {
        if (--pending === 0) {
          if (failed.length) console.error('[GF] failed to load: ' + failed.join(', '));
          resolve(failed);
        }
      }
    });
  }

  /**
   * Fetch the manifest's `levels` (JSON layout documents written by
   * tools/editor.html) and register them under GF._levels.
   *
   * These are preloaded rather than fetched by the scene because a scene must
   * know its name and module selection at CONSTRUCTION time — GF.GameScene
   * resolves modules in init(). Loading them here, behind the same ready gate
   * as the scripts, keeps `GF.dataScene('boss')` a synchronous lookup.
   */
  function loadLevels(manifest, baseDir) {
    var names = [];
    DATA_KINDS.forEach(function (kind) {
      (Array.isArray(manifest[kind]) ? manifest[kind] : []).forEach(function (e) {
        if (typeof e === 'string') names.push(e);
      });
    });
    if (!names.length) return Promise.resolve();

    return Promise.all(names.map(function (entry) {
      var isPath = entry.indexOf('/') !== -1 || /\.json$/i.test(entry);
      var url = isPath ? (/\.json$/i.test(entry) ? entry : entry + '.json')
                       : 'levels/' + entry + '.json';
      var name = entry.replace(/^.*\//, '').replace(/\.json$/i, '');
      return fetch(baseDir + url)
        .then(function (r) {
          if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
          return r.json();
        })
        .then(function (doc) { GF._levels[name] = doc; })
        .catch(function (err) {
          console.error('[GF] level "' + name + '" failed to load:', err);
        });
    }));
  }

  /**
   * Load a game's parts from a manifest.
   * @param {string|Object} manifest - URL of a manifest.json, or the object itself.
   * @returns {Promise} resolves once every part script has executed.
   */
  GF.loadGame = function (manifest) {
    GF.defer();   // synchronous — claims the gate before DOMContentLoaded can fire

    var url = (typeof manifest === 'string') ? manifest : null;
    var baseDir = url ? url.replace(/[^\/]*$/, '') : '';

    var got = url
      ? fetch(url).then(function (r) {
          if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
          return r.json();
        })
      : Promise.resolve(manifest);

    return got
      .then(function (m) {
        GF.MANIFEST = m;
        // Levels are data and register no globals, so they can load in parallel
        // with the scripts; both must finish before the ready gate is released.
        return Promise.all([
          injectAll(GF.manifestPaths(m), baseDir),
          loadLevels(m, baseDir),
        ]);
      })
      .catch(function (err) {
        console.error('[GF] loadGame("' + url + '") failed:', err);
      })
      .then(function () {
        GF.release();
      });
  };

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

    // ── Synthetic input (touch overlays, virtual gamepads, replays) ─────────
    // These inject state through the same code path as real keys, so
    // isDown / wasPressed / wasReleased behave identically. An action name
    // is resolved to its first bound key code (or used verbatim if unbound).

    /** Resolve an action name to the code that backs it. */
    _codeFor(action) {
      const codes = this._bindings[action];
      return (codes && codes.length) ? codes[0] : action;
    }

    /** Synthetic key-down for an action (held until releaseAction). */
    pressAction(action) {
      const code = this._codeFor(action);
      if (!this._held.has(code)) {
        this._held.add(code);
        this._justPressed.add(code);
      }
    }

    /** Synthetic key-up for an action. */
    releaseAction(action) {
      const code = this._codeFor(action);
      if (this._held.has(code)) {
        this._held.delete(code);
        this._justReleased.add(code);
      }
    }

    /** One-frame press (tap): wasPressed() is true for the next frame only. */
    tapAction(action) {
      this._justPressed.add(this._codeFor(action));
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

  // Scenes are duck-typed: games (often LLM-authored) push plain classes that
  // implement only some of the hooks (init/update/render). A missing hook is a
  // no-op, not a TypeError.
  function callHook(scene, hook, a, b) {
    if (scene && typeof scene[hook] === 'function') return scene[hook](a, b);
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
      callHook(top, 'update', dt, engine);
    }

    render(ctx, engine) {
      const top = this._top();
      callHook(top, 'render', ctx, engine);

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
      callHook(prev, 'exit', engine);

      if (!scene._initialized) {
        callHook(scene, 'init', engine);
        scene._initialized = true;
      }
      this._stack.push(scene);
      callHook(scene, 'enter', engine);

      engine.events.emit('scene:push', { scene, stack: this._stack });
    }

    _executePop(engine) {
      if (!this._stack.length) return;

      const removed = this._stack.pop();
      callHook(removed, 'exit', engine);
      callHook(removed, 'destroy', engine);

      const next = this._top();
      callHook(next, 'enter', engine);

      engine.events.emit('scene:pop', { removed, scene: next, stack: this._stack });
    }

    _executeReplace(scene, engine) {
      if (this._stack.length) {
        const removed = this._stack.pop();
        callHook(removed, 'exit', engine);
        callHook(removed, 'destroy', engine);
      }

      if (!scene._initialized) {
        callHook(scene, 'init', engine);
        scene._initialized = true;
      }
      this._stack.push(scene);
      callHook(scene, 'enter', engine);

      engine.events.emit('scene:replace', { scene, stack: this._stack });
    }

    _executeClear(engine) {
      while (this._stack.length) {
        const s = this._stack.pop();
        callHook(s, 'exit', engine);
        callHook(s, 'destroy', engine);
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

    /**
     * Register a sprite from a spritesheet image + an atlas (Aseprite hash-export
     * format — the same `animate.json` shape the framework's built-in sprites use).
     * No generated JS and no bundle rebuild required: pass the image (or its URL)
     * and the parsed atlas object, and the animations are built at runtime.
     *
     * @param {string} name
     * @param {HTMLImageElement|{img,isLoaded}|string} image - loaded image, a
     *        {img,isLoaded} sheet wrapper, or a URL to lazy-load.
     * @param {Object} atlas - parsed animate.json: { frames:[{frame:{x,y,w,h},duration}],
     *        meta:{ frameTags:[{name,from,to,loop}], origin:{x,y}, frameSize:{w,h} } }
     * @param {Object} [opts] - { originX, originY, defaultFps } overrides.
     * @returns {Object} the built sprite definition (also registered under `name`).
     */
    registerSheet(name, image, atlas, opts) {
      const sheet = SpriteSystem._asSheet(image);
      const def = SpriteSystem.buildSheetDefinition(sheet, atlas, opts);
      this.registerSprite(name, def);
      return def;
    }

    /**
     * Async convenience: fetch the atlas JSON and load the image, then register.
     * Use when you only have URLs. Prefer registerSheet with an inline atlas
     * object where possible (headless tooling cannot fetch).
     * @returns {Promise<Object>} resolves with the sprite definition.
     */
    registerSheetAsync(name, imageUrl, atlasUrl, opts) {
      const self = this;
      return fetch(atlasUrl)
        .then(r => r.json())
        .then(atlas => self.registerSheet(name, imageUrl, atlas, opts));
    }

    // --- internals ---------------------------------------------------------

    /** Normalise an image argument into a { img, isLoaded() } sheet wrapper. */
    static _asSheet(image) {
      if (image && typeof image.isLoaded === 'function') return image; // already a wrapper
      if (typeof image === 'string') return SpriteSystem._loadImage(image);
      // A raw HTMLImageElement (may or may not be loaded yet).
      const img = image;
      return { img, isLoaded: () => !!(img && (img.complete ? img.naturalWidth !== 0 || img.width : false)) };
    }

    /** Lazy-load an image URL, mirroring the built-in sprite loaders' pattern. */
    static _loadImage(url) {
      SpriteSystem._imageCache = SpriteSystem._imageCache || {};
      if (SpriteSystem._imageCache[url]) return SpriteSystem._imageCache[url];
      const img = new Image();
      let loaded = false;
      img.addEventListener('load',  () => { loaded = true; });
      img.addEventListener('error', () => { console.warn('SpriteSystem: failed to load ' + url); });
      img.src = url;
      return SpriteSystem._imageCache[url] = { img, isLoaded: () => loaded };
    }

    /** Return a frame draw function that blits a sub-rect of the sheet. */
    static _makeFrameDrawer(sheet, sx, sy, fw, fh) {
      return function (ctx) {
        if (!sheet.isLoaded()) {
          ctx.fillStyle = '#446';
          ctx.fillRect(2, 2, fw - 4, fh - 4);
          return;
        }
        ctx.drawImage(sheet.img, sx, sy, fw, fh, 0, 0, fw, fh);
      };
    }

    /**
     * Build a { frameWidth, frameHeight, originX, originY, animations } definition
     * from a sheet wrapper + Aseprite-style atlas. Exposed for tooling/tests.
     */
    static buildSheetDefinition(sheet, atlas, opts) {
      opts = opts || {};
      atlas = atlas || {};
      const meta   = atlas.meta || {};
      const frames = Array.isArray(atlas.frames) ? atlas.frames : [];
      const fsize  = meta.frameSize || {};
      const origin = meta.origin || {};

      // Frame dimensions: prefer meta.frameSize, else the first frame's rect.
      const first = (frames[0] && frames[0].frame) || {};
      const frameWidth  = fsize.w || first.w || opts.frameWidth  || 0;
      const frameHeight = fsize.h || first.h || opts.frameHeight || 0;
      const originX = (opts.originX != null) ? opts.originX : (origin.x != null ? origin.x : frameWidth  / 2);
      const originY = (opts.originY != null) ? opts.originY : (origin.y != null ? origin.y : frameHeight);
      const defaultFps = opts.defaultFps || 12;

      const rectOf = (i) => (frames[i] && frames[i].frame) || { x: 0, y: 0, w: frameWidth, h: frameHeight };
      const drawerFor = (i) => {
        const r = rectOf(i);
        return SpriteSystem._makeFrameDrawer(sheet, r.x, r.y, r.w || frameWidth, r.h || frameHeight);
      };
      // fps for a tag: derive from the tag's first frame duration (ms) if present.
      const fpsFor = (from) => {
        const d = frames[from] && frames[from].duration;
        return (d && d > 0) ? Math.max(1, Math.round(1000 / d)) : defaultFps;
      };

      const animations = {};
      const tags = Array.isArray(meta.frameTags) ? meta.frameTags : [];
      if (tags.length) {
        tags.forEach(tag => {
          const from = tag.from | 0;
          const to   = (tag.to != null ? tag.to : from) | 0;
          const list = [];
          for (let i = from; i <= to; i++) list.push(drawerFor(i));
          animations[tag.name] = {
            fps: tag.fps || fpsFor(from),
            loop: tag.loop !== false && tag.direction !== 'once',
            frames: list,
          };
        });
      } else {
        // No tags: one looping 'idle' animation spanning every frame.
        const list = frames.length ? frames.map((_, i) => drawerFor(i)) : [drawerFor(0)];
        animations.idle = { fps: defaultFps, loop: true, frames: list };
      }

      return { frameWidth, frameHeight, originX, originY, animations };
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


// -- systems/WorldSystem.js --------------------------------------

// GameFramework/framework/systems/WorldSystem.js
// Data-driven, multi-area open-world manager built on top of Camera + Tilemap.
//
// A "world" is a plain data object (ship it as a JS object, not fetched JSON, so
// it works in the headless harness). It has one or more named AREAS; each area is
// a set of tile LAYERS plus entities, spawn points, and portals to other areas.
//
//   const world = new GF.WorldSystem({ viewWidth: 800, viewHeight: 450 });
//   game.engine.addSystem(world);            // AFTER physics, so collision resolves last
//   world.setTileset('world/tiles.png', 8);  // tileset PNG + columns (optional)
//   world.setPlayer(playerBody, (ctx) => playerAnim.draw(ctx, playerBody.centerX, playerBody.bottom));
//   world.loadWorld(GAME_WORLD);             // the data object below
//   // in your scene.render:  world.draw(ctx);  then draw the HUD
//
// World data shape:
//   {
//     tileWidth: 32, tileHeight: 32,
//     tileset: { image: 'world/tiles.png', cols: 8 },   // optional (falls back to flat colors)
//     startArea: 'town', startSpawn: 'default',
//     areas: {
//       town: {
//         cols: 40, rows: 30,
//         layers: {
//           ground:    [[...]],   // required; row-major tile indices, -1 = empty
//           decor:     [[...]],   // optional; drawn above ground, below entities
//           collision: [[...]],   // optional; any cell >= 0 blocks the player
//           overhead:  [[...]],   // optional; drawn above entities (roofs, tree canopy)
//         },
//         entities: [ { type:'npc', sprite:'villager', anim:'idle', x:320, y:400, props:{} } ],
//         spawns:   { default: { x:320, y:400 } },
//         portals:  [ { x:1248, y:384, w:32, h:64, toArea:'forest', toSpawn:'fromTown' } ],
//         background: '#243',   // optional flat backdrop for the area
//       },
//       forest: { ... }
//     }
//   }

(function (GF) {
  'use strict';

  function deterministicTileColor(idx) {
    // Stable pseudo-color so worlds are visible before/without a tileset image.
    const h = (idx * 47) % 360;
    const l = 30 + (idx * 13) % 25;
    return 'hsl(' + h + ',42%,' + l + '%)';
  }

  class WorldSystem {
    constructor(opts) {
      opts = opts || {};
      this.name = 'WorldSystem';
      this._viewW = opts.viewWidth  || 800;
      this._viewH = opts.viewHeight || 450;
      this._lerp  = opts.lerp !== undefined ? opts.lerp : 0.12;

      this.camera = new GF.Camera({ width: this._viewW, height: this._viewH, lerp: this._lerp });

      this._data       = null;
      this._areas      = {};      // name -> prepared area (lazy)
      this._current    = null;    // prepared current area
      this._currentName = null;

      this._player     = null;    // GF.PhysicsBody
      this._playerDraw = null;    // (ctx) => void
      this._dynamic    = [];      // extra bodies to resolve against collision

      this._sprites    = null;    // GF.SpriteSystem (for entity animators)
      this._tilesetImg = null;    // { img, isLoaded() } or null
      this._tileCols   = 1;

      this._portalLock = false;   // true while player still overlaps the portal it arrived through

      this._cb = { enterArea: null, entityDraw: null, entityUpdate: null, portal: null };
    }

    // ── System interface ──────────────────────────────────────────────────────

    init(engine) {
      this._engine = engine;
      this._sprites = engine.getSystem ? engine.getSystem('SpriteSystem') : null;
    }

    render() {} // draw() is called by the game so it controls layering vs. the HUD.

    // ── Configuration ─────────────────────────────────────────────────────────

    /** Set the tileset image (URL or a loaded image / sheet wrapper) and column count. */
    setTileset(image, cols) {
      this._tileCols = cols || 1;
      if (!image) { this._tilesetImg = null; return this; }
      if (typeof image === 'string') {
        this._tilesetImg = GF.SpriteSystem ? GF.SpriteSystem._loadImage(image) : null;
      } else if (image.isLoaded) {
        this._tilesetImg = image;
      } else {
        const img = image;
        this._tilesetImg = { img, isLoaded: () => !!(img && (img.complete ? img.naturalWidth !== 0 : img.width)) };
      }
      return this;
    }

    /** Register the player body and how to draw it (drawn y-sorted among entities). */
    setPlayer(body, drawFn) {
      this._player = body;
      this._playerDraw = drawFn || null;
      return this;
    }

    /** Additional bodies that should collide with the collision layer. */
    addDynamicBody(body) { this._dynamic.push(body); return this; }
    removeDynamicBody(body) {
      const i = this._dynamic.indexOf(body);
      if (i >= 0) this._dynamic.splice(i, 1);
      return this;
    }

    onEnterArea(cb)    { this._cb.enterArea = cb;    return this; }
    onEntityDraw(cb)   { this._cb.entityDraw = cb;   return this; }
    onEntityUpdate(cb) { this._cb.entityUpdate = cb; return this; }
    onPortal(cb)       { this._cb.portal = cb;       return this; }

    // ── World loading ─────────────────────────────────────────────────────────

    /** Load a world data object and enter its start area. */
    loadWorld(data) {
      this._data  = data || {};
      this._areas = {};
      if (this._data.tileset) this.setTileset(this._data.tileset.image, this._data.tileset.cols);
      const start = this._data.startArea || Object.keys(this._data.areas || {})[0];
      if (start) this.enterArea(start, this._data.startSpawn);
      return this;
    }

    _tw() { return (this._data && this._data.tileWidth)  || 32; }
    _th() { return (this._data && this._data.tileHeight) || 32; }

    /** Build (once) the runtime structures for an area from its data. */
    _prepareArea(name) {
      if (this._areas[name]) return this._areas[name];
      const src = (this._data.areas || {})[name];
      if (!src) { console.warn('WorldSystem: no area named "' + name + '"'); return null; }

      const tw = this._tw(), th = this._th();
      const layers = src.layers || {};
      const cols = src.cols || (layers.ground && layers.ground[0] ? layers.ground[0].length : 0);
      const rows = src.rows || (layers.ground ? layers.ground.length : 0);

      // Collision Tilemap (reuses tested AABB resolution). Any cell >= 0 is solid.
      let collisionTM = null;
      const cgrid = layers.collision;
      if (cgrid && cgrid.length) {
        const solid = new Set();
        for (let r = 0; r < cgrid.length; r++)
          for (let c = 0; c < cgrid[r].length; c++)
            if (cgrid[r][c] >= 0) solid.add(cgrid[r][c]);
        collisionTM = new GF.Tilemap({
          tileWidth: tw, tileHeight: th, grid: cgrid,
          solidTiles: Array.from(solid), x: 0, y: 0,
        });
      }

      // Entity animators (lazy, only if a SpriteSystem is present).
      const entities = (src.entities || []).map(e => {
        const ent = Object.assign({}, e);
        if (this._sprites && ent.sprite && this._sprites.getSprite(ent.sprite)) {
          ent._animator = this._sprites.createAnimator(ent.sprite, ent.anim || 'idle');
        }
        return ent;
      });

      const prepared = {
        name, src, cols, rows, layers,
        pixelWidth: cols * tw, pixelHeight: rows * th,
        collisionTM, entities,
        spawns: src.spawns || {}, portals: src.portals || [],
        background: src.background || (this._data.background || '#1a1a2e'),
      };
      this._areas[name] = prepared;
      return prepared;
    }

    /** Switch to an area and place the player at a named spawn (if the player is set). */
    enterArea(name, spawnName) {
      const area = this._prepareArea(name);
      if (!area) return this;
      this._current = area;
      this._currentName = name;

      // Re-clamp the camera to this area's bounds.
      this.camera.worldWidth  = Math.max(area.pixelWidth,  this._viewW);
      this.camera.worldHeight = Math.max(area.pixelHeight, this._viewH);

      if (this._player) {
        const sp = area.spawns[spawnName] || area.spawns['default'] ||
                   { x: area.pixelWidth / 2, y: area.pixelHeight / 2 };
        // Spawns are given as feet-center; place the body's top-left accordingly.
        this._player.x = sp.x - (this._player.width  || 0) / 2;
        this._player.y = sp.y - (this._player.height || 0);
        this.camera.follow(this._player);
        this.camera.snapTo(this._player.x + (this._player.width || 0) / 2,
                           this._player.y + (this._player.height || 0) / 2);
      }
      // The player begins overlapping nothing new until they leave the arrival portal.
      this._portalLock = true;

      if (this._cb.enterArea) this._cb.enterArea(name, area);
      return this;
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    get areaName() { return this._currentName; }
    get area()     { return this._current; }
    entities()     { return this._current ? this._current.entities : []; }

    /** World-space solid test against the current area's collision layer. */
    isSolidAt(wx, wy) {
      return !!(this._current && this._current.collisionTM &&
                this._current.collisionTM.isSolidAt(wx, wy));
    }

    // ── Update ────────────────────────────────────────────────────────────────

    update(dt) {
      if (!this._current) return;

      // Resolve collisions (run after PhysicsSystem has integrated bodies).
      const cm = this._current.collisionTM;
      if (cm) {
        if (this._player) cm.resolveCollision(this._player);
        for (let i = 0; i < this._dynamic.length; i++) cm.resolveCollision(this._dynamic[i]);
      }

      // Entity animation + optional per-entity game update.
      const ents = this._current.entities;
      for (let i = 0; i < ents.length; i++) {
        const e = ents[i];
        if (this._cb.entityUpdate) this._cb.entityUpdate(e, dt, this);
        if (e._animator) e._animator.update(dt);
      }

      // Portals: check the player's feet point against portal rects.
      if (this._player) {
        const px = this._player.x + (this._player.width  || 0) / 2;
        const py = this._player.y + (this._player.height || 0);
        let inAny = false;
        const portals = this._current.portals;
        for (let i = 0; i < portals.length; i++) {
          const p = portals[i];
          if (px >= p.x && px < p.x + (p.w || this._tw()) &&
              py >= p.y && py < p.y + (p.h || this._th())) {
            inAny = true;
            if (!this._portalLock) {
              if (this._cb.portal) this._cb.portal(p, this);
              this.enterArea(p.toArea, p.toSpawn);
              return; // area changed; stop processing this frame
            }
          }
        }
        // Release the lock once the player has stepped off the arrival portal.
        if (!inAny) this._portalLock = false;
      }

      this.camera.update(dt);
    }

    // ── Rendering ─────────────────────────────────────────────────────────────

    /** Draw one tile layer with frustum culling and a flat-color fallback. */
    _drawLayer(ctx, grid) {
      if (!grid || !grid.length) return;
      const tw = this._tw(), th = this._th();
      const cam = this.camera;
      const img = this._tilesetImg && this._tilesetImg.isLoaded() ? this._tilesetImg.img : null;

      const colStart = Math.max(0, Math.floor(cam.x / tw) - 1);
      const rowStart = Math.max(0, Math.floor(cam.y / th) - 1);
      const colEnd   = Math.ceil((cam.x + cam.width)  / tw) + 1;
      const rowEnd   = Math.ceil((cam.y + cam.height) / th) + 1;

      for (let row = rowStart; row < rowEnd && row < grid.length; row++) {
        const line = grid[row];
        if (!line) continue;
        for (let col = colStart; col < colEnd && col < line.length; col++) {
          const idx = line[col];
          if (idx < 0) continue;
          const dx = col * tw, dy = row * th;
          if (img) {
            const sc = idx % this._tileCols;
            const sr = Math.floor(idx / this._tileCols);
            ctx.drawImage(img, sc * tw, sr * th, tw, th, dx, dy, tw, th);
          } else {
            ctx.fillStyle = deterministicTileColor(idx);
            ctx.fillRect(dx, dy, tw, th);
          }
        }
      }
    }

    /** Draw the entire current area: layers, y-sorted entities + player, overhead. */
    draw(ctx) {
      if (!this._current) return;
      const area = this._current;
      const cam = this.camera;

      // Flat area backdrop (screen space) so gaps aren't transparent.
      ctx.fillStyle = area.background;
      ctx.fillRect(0, 0, cam.width, cam.height);

      cam.begin(ctx);

      this._drawLayer(ctx, area.layers.ground);
      this._drawLayer(ctx, area.layers.decor);

      // Collect drawables (entities + player), cull, y-sort by feet, then draw.
      const drawables = [];
      const ents = area.entities;
      for (let i = 0; i < ents.length; i++) {
        const e = ents[i];
        const w = e.w || (this._sprites && this._sprites.getSprite(e.sprite) ? this._sprites.getSprite(e.sprite).frameWidth : 24) || 24;
        const h = e.h || (this._sprites && this._sprites.getSprite(e.sprite) ? this._sprites.getSprite(e.sprite).frameHeight : 24) || 24;
        if (!cam.isVisible(e.x - w, e.y - h, w * 2, h * 2)) continue;
        drawables.push({ feet: e.y, kind: 'entity', e });
      }
      if (this._player) {
        drawables.push({ feet: this._player.y + (this._player.height || 0), kind: 'player' });
      }
      drawables.sort((a, b) => a.feet - b.feet);

      for (let i = 0; i < drawables.length; i++) {
        const d = drawables[i];
        if (d.kind === 'player') {
          if (this._playerDraw) this._playerDraw(ctx);
        } else {
          const e = d.e;
          if (this._cb.entityDraw) {
            this._cb.entityDraw(ctx, e, this);
          } else if (e._animator) {
            e._animator.flipX = !!e.flipX;
            e._animator.draw(ctx, e.x, e.y);
          } else {
            // No sprite: a simple marker so placed entities are visible.
            ctx.fillStyle = e.color || '#e33';
            ctx.fillRect(e.x - 8, e.y - 16, 16, 16);
          }
        }
      }

      this._drawLayer(ctx, area.layers.overhead);

      cam.end(ctx);
    }
  }

  GF.WorldSystem = WorldSystem;

})(window.GF = window.GF || {});


// -- systems/EntityWorld.js --------------------------------------

// GameFramework/framework/systems/EntityWorld.js
// The composition layer: GameObjects made of small reusable BEHAVIORS, owned by
// an EntityWorld that runs the update/draw/cull/sweep loop and resolves
// collisions declaratively. This is what keeps a scene tiny — the scene spawns
// prefabs and states overlap rules; all per-entity logic lives in behavior files.
//
//   // behaviors/FormationMove.js
//   GF.behavior('FormationMove', (cfg) => ({
//     update(dt, e, world) { e.x += world.dir * (cfg.speed || 60) * dt; }
//   }));
//
//   // prefabs/invader.js
//   GF.prefab('invader', { tags:['invader'], w:32, h:24, sprite:'invader',
//                          behaviors:['FormationMove', ['DropOnDeath', { chance:0.15 }]] });
//
//   // scenes/Main.js  (stays ~40 lines)
//   this.world = engine.getSystem('EntityWorld');
//   this.world.spawnGrid('invader', 8, 5, 40, 50, 56, 40);
//   this.world.onOverlap('bullet', 'invader', (b, i) => { b.destroy(); i.destroy(); this.score += 10; });
//   // update(dt): this.world.update(dt);   render(ctx): this.world.draw(ctx);

(function (GF) {
  'use strict';

  GF._behaviors = GF._behaviors || {};
  GF._prefabs   = GF._prefabs   || {};

  /** Register a named behavior factory. factory(cfg) -> behavior instance with
   *  optional hooks: onAdd(e,world), update(dt,e,world), draw(ctx,e,world),
   *  onRemove(e,world), onOverlap handled by world rules. */
  GF.behavior = function (name, factory) { GF._behaviors[name] = factory; return GF; };

  /** Register a named prefab (entity archetype). See spec fields in _instantiate. */
  GF.prefab = function (name, spec) { GF._prefabs[name] = spec; return GF; };

  // ── GameObject ──────────────────────────────────────────────────────────────
  class GameObject {
    constructor(spec) {
      spec = spec || {};
      this.name = spec.name || '';
      this.x = spec.x || 0; this.y = spec.y || 0;      // top-left (AABB), like PhysicsBody
      this.w = spec.w || 0; this.h = spec.h || 0;
      this.vx = spec.vx || 0; this.vy = spec.vy || 0;
      this.flipX = false;
      this.static = !!spec.static;                     // skip velocity integration
      this.collideWorld = !!spec.collideWorld;         // resolve vs world solid tiles
      this.alive = true;
      this.tags = new Set(spec.tags || []);
      this.data = Object.assign({}, spec.data);        // free per-entity state
      this.sprite = spec.sprite || null;
      this.anim = spec.anim || 'idle';
      this._behaviors = [];
      this._anim = null;                               // SpriteAnimator (set by world)
      this._world = null;
    }
    get right()   { return this.x + this.w; }
    get bottom()  { return this.y + this.h; }
    get centerX() { return this.x + this.w / 2; }
    get centerY() { return this.y + this.h / 2; }
    has(tag)      { return this.tags.has(tag); }
    addTag(t)     { this.tags.add(t); return this; }
    removeTag(t)  { this.tags.delete(t); return this; }
    /** Attach a behavior instance (or a registered behavior by name/[name,cfg]). */
    addBehavior(b, cfg) {
      const inst = (typeof b === 'string') ? GF.EntityWorld._make(b, cfg) : b;
      if (!inst) return this;
      this._behaviors.push(inst);
      if (this._world && inst.onAdd) inst.onAdd(this, this._world);
      return this;
    }
    /** Find an attached behavior by its registered name. */
    behavior(name) { return this._behaviors.find(b => b._name === name) || null; }
    /** Play an animation on this object's animator (if it has a sprite). */
    play(anim, force) { if (this._anim) this._anim.play(anim, force); return this; }
    overlaps(o) {
      return this.x < o.x + o.w && this.right > o.x &&
             this.y < o.y + o.h && this.bottom > o.y;
    }
    destroy() { this.alive = false; return this; }
  }

  // ── EntityWorld ─────────────────────────────────────────────────────────────
  class EntityWorld {
    constructor(opts) {
      opts = opts || {};
      this.name = 'EntityWorld';
      this._objs = [];
      this._rules = [];          // { a, b, cb }
      this._prefabs = {};        // local overrides
      this._tick = null;         // optional world.onTick
      this.camera = opts.camera || null;
      this.sprites = opts.sprites || null;
      this._solid = opts.solidFn || null;   // (x,y) -> boolean
      this.data = {};            // shared world state (e.g. world.dir)
    }

    init(engine) {
      this.engine = engine;
      if (!this.sprites && engine.getSystem) this.sprites = engine.getSystem('SpriteSystem');
    }
    render() {} // draw() is called by the scene so it controls layering vs. HUD/tiles.

    setCamera(cam)     { this.camera = cam; return this; }
    setSolid(fn)       { this._solid = fn; return this; }
    onTick(fn)         { this._tick = fn; return this; }
    definePrefab(name, spec) { this._prefabs[name] = spec; return this; }
    _resolvePrefab(name) { return this._prefabs[name] || GF._prefabs[name] || null; }

    /** Instantiate a prefab-name or inline spec into a GameObject and add it. */
    spawn(nameOrSpec, x, y, overrides) {
      let spec;
      if (typeof nameOrSpec === 'string') {
        const pf = this._resolvePrefab(nameOrSpec);
        if (!pf) { console.warn('EntityWorld: no prefab "' + nameOrSpec + '"'); return null; }
        spec = Object.assign({ name: nameOrSpec }, pf);
      } else {
        spec = Object.assign({}, nameOrSpec);
      }
      if (x != null) spec.x = x;
      if (y != null) spec.y = y;
      if (overrides) spec = Object.assign(spec, overrides);

      const obj = new GameObject(spec);
      obj._world = this;
      // sprite animator
      if (obj.sprite && this.sprites && this.sprites.getSprite(obj.sprite)) {
        obj._anim = this.sprites.createAnimator(obj.sprite, obj.anim);
      }
      // behaviors (string | [name,cfg] | instance)
      const list = spec.behaviors || [];
      for (let i = 0; i < list.length; i++) {
        const b = list[i];
        if (Array.isArray(b)) obj.addBehavior(b[0], b[1]);
        else obj.addBehavior(b);
      }
      if (typeof spec.setup === 'function') spec.setup(obj, this);
      this._objs.push(obj);
      // fire onAdd for behaviors attached before _world existed
      for (const bh of obj._behaviors) if (bh.onAdd && !bh._added) { bh._added = true; bh.onAdd(obj, this); }
      return obj;
    }

    /** Spawn a cols×rows grid of a prefab. Optional perCell(obj,c,r) to tweak. */
    spawnGrid(name, cols, rows, x0, y0, dx, dy, perCell) {
      const out = [];
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const o = this.spawn(name, x0 + c * dx, y0 + r * dy);
          if (o && perCell) perCell(o, c, r);
          if (o) out.push(o);
        }
      return out;
    }

    destroy(obj) { if (obj) obj.alive = false; return this; }
    all()          { return this._objs; }
    byTag(tag)     { return this._objs.filter(o => o.alive && o.tags.has(tag)); }
    first(tag)     { return this._objs.find(o => o.alive && o.tags.has(tag)) || null; }
    count(tag)     { return this.byTag(tag).length; }
    clear()        { this._objs.forEach(o => this._removeNow(o)); this._objs = []; return this; }

    /** Declarative collision: run cb(a,b) for every overlapping pair (tagA,tagB). */
    onOverlap(tagA, tagB, cb) { this._rules.push({ a: tagA, b: tagB, cb }); return this; }

    isSolid(x, y) { return this._solid ? !!this._solid(x, y) : false; }

    // ── loop ──────────────────────────────────────────────────────────────────
    update(dt) {
      const objs = this._objs;
      // 1. behaviors
      for (let i = 0; i < objs.length; i++) {
        const o = objs[i]; if (!o.alive) continue;
        for (let b = 0; b < o._behaviors.length; b++) {
          const bh = o._behaviors[b];
          if (bh.update) bh.update(dt, o, this);
        }
      }
      // 2. integrate velocity (+ optional world-solid resolution)
      for (let i = 0; i < objs.length; i++) {
        const o = objs[i]; if (!o.alive || o.static) continue;
        if (o.collideWorld && this._solid) this._moveResolved(o, dt);
        else { o.x += o.vx * dt; o.y += o.vy * dt; }
        if (o._anim) o._anim.update(dt);
      }
      // 3. collision rules
      for (let r = 0; r < this._rules.length; r++) {
        const rule = this._rules[r];
        const A = this.byTag(rule.a), B = this.byTag(rule.b);
        for (let i = 0; i < A.length; i++) {
          const a = A[i]; if (!a.alive) continue;
          for (let j = 0; j < B.length; j++) {
            const b = B[j];
            if (a === b || !b.alive || !a.alive) continue;
            if (a.overlaps(b)) rule.cb(a, b, this);
          }
        }
      }
      // 4. world tick
      if (this._tick) this._tick(dt, this);
      // 5. sweep dead
      let write = 0;
      for (let i = 0; i < objs.length; i++) {
        const o = objs[i];
        if (o.alive) objs[write++] = o;
        else this._removeNow(o);
      }
      objs.length = write;
    }

    _removeNow(o) {
      for (let b = 0; b < o._behaviors.length; b++) {
        const bh = o._behaviors[b];
        if (bh.onRemove) bh.onRemove(o, this);
      }
    }

    // Axis-separated resolution against the world solid function (top-down walls).
    _moveResolved(o, dt) {
      const solidBox = (x, y) => this._solid(x, y) || this._solid(x + o.w - 1, y) ||
                                 this._solid(x, y + o.h - 1) || this._solid(x + o.w - 1, y + o.h - 1);
      const nx = o.x + o.vx * dt;
      if (!solidBox(nx, o.y)) o.x = nx; else o.vx = 0;
      const ny = o.y + o.vy * dt;
      if (!solidBox(o.x, ny)) o.y = ny; else o.vy = 0;
    }

    // ── draw ───────────────────────────────────────────────────────────────────
    /** Draw all live objects, y-sorted by feet (bottom) and camera-culled.
     *  Per entity, three passes run so decorations compose instead of fighting:
     *    drawUnder(ctx,e,world) — beneath the body (shadows, glows)
     *    draw(ctx,e,world)      — REPLACES the default sprite/box rendering
     *    drawOver(ctx,e,world)  — on top of it (shields, damage flashes, labels)
     *  Only draw() suppresses the default, so an overlay behavior can be added
     *  to a prefab without having to re-implement how the entity looks. */
    draw(ctx, camera) {
      camera = camera || this.camera;
      const list = [];
      for (let i = 0; i < this._objs.length; i++) {
        const o = this._objs[i]; if (!o.alive) continue;
        if (camera && !camera.isVisible(o.x - 4, o.y - 4, o.w + 8, o.h + 8)) continue;
        list.push(o);
      }
      list.sort((a, b) => a.bottom - b.bottom);
      for (let i = 0; i < list.length; i++) {
        const o = list[i];
        const bhs = o._behaviors;
        for (let b = 0; b < bhs.length; b++) if (bhs[b].drawUnder) bhs[b].drawUnder(ctx, o, this);

        let drawn = false;
        for (let b = 0; b < bhs.length; b++) {
          const bh = bhs[b];
          if (bh.draw) { bh.draw(ctx, o, this); drawn = true; }
        }
        if (!drawn) {
          if (o._anim) { o._anim.flipX = o.flipX; o._anim.draw(ctx, o.centerX, o.bottom); }
          else if (o.sprite && this.sprites) {
            this.sprites.drawFrame(ctx, o.sprite, o.anim, 0, o.centerX, o.bottom, o.flipX);
          } else {
            ctx.fillStyle = o.data.color || '#e33';
            ctx.fillRect(o.x, o.y, o.w || 8, o.h || 8);
          }
        }

        for (let b = 0; b < bhs.length; b++) if (bhs[b].drawOver) bhs[b].drawOver(ctx, o, this);
      }
    }
  }

  // Internal: instantiate a registered behavior by name (+ optional cfg).
  EntityWorld._make = function (name, cfg) {
    const factory = GF._behaviors[name];
    if (!factory) { console.warn('EntityWorld: no behavior "' + name + '"'); return null; }
    const inst = factory(cfg || {}) || {};
    inst._name = name;
    return inst;
  };

  GF.GameObject  = GameObject;
  GF.EntityWorld = EntityWorld;

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
//
// ── Modes ────────────────────────────────────────────────────────────────────
// Two interaction modes are supported:
//
//   • orbit  (default) — single model centred at origin; OrbitControls let the
//                        user rotate / pan / zoom around it.
//   • walk            — first-person mode. All loaded models are arranged in a
//                        circular gallery on pedestals; WASD moves and mouse
//                        (with pointer lock) looks. The user can physically
//                        walk around each model to see all sides.
//
// Switch with `system.setMode('walk' | 'orbit')`.
//
// ── Preset Models ────────────────────────────────────────────────────────────
// The framework owns asset paths for built-in 3D models. Games refer to them
// by name only:
//
//     await models.loadPreset('claude_3d');
//     await models.loadPreset('claudia_3d');
//
// New presets can be registered with `ModelSystem.registerPreset(name, path)`.

(function (GF) {
  'use strict';

  // ── Built-in preset registry ───────────────────────────────────────────────
  // Asset paths live HERE so games never need to know where the .glb files
  // sit on disk — they refer to models by name only.
  // Paths are resolved relative to the framework bundle location via
  // GF.resolvePath, so they work regardless of how deeply nested a game lives.
  const PRESETS = {
    'claude_3d':  '../Sprites/Claude/claude_3d.glb',
    'claudia_3d': '../Sprites/Claudia/claudia_3d.glb',
  };

  class ModelSystem {
    constructor(opts) {
      opts = opts || {};
      this.name = 'models';

      // Loaded model registry  ── { name: ModelData }
      // Each ModelData: { name, scene, animations, animationNames, meshCount,
      //                   matCount, mixer, actions, activeAction,
      //                   placed (bool), pedestal, label }
      this._models      = {};
      this._activeModel = null; // model focused in orbit mode / nearest in walk mode

      // Three.js objects
      this._scene       = null;
      this._camera      = null;
      this._renderer    = null;
      this._controls    = null;     // OrbitControls (orbit mode only)
      this._threeCanvas = null;

      this._gridHelper  = null;
      this._axesHelper  = null;

      // Environment (walk mode)
      this._floor       = null;
      this._envGroup    = null;     // pedestals, nameplates, etc.

      // First-person walking state
      this._mode          = 'orbit'; // 'orbit' | 'walk'
      this._fpYaw         = 0;        // radians
      this._fpPitch       = 0;        // radians (clamped)
      this._fpVelY        = 0;        // for jump (future)
      this._fpHeight      = 1.65;     // eye height in metres
      this._fpSpeed       = 4.0;      // walk speed (units/s)
      this._fpRunSpeed    = 8.0;      // shift-run speed
      this._fpLookSens    = 0.0022;   // mouse sensitivity
      this._pointerLocked = false;
      this._fpHintEl      = null;     // DOM element shown when not locked

      // Engine ref captured in init() so update() can read input
      this._engine = null;

      // Gallery layout config
      this._galleryRadius   = 4.5;
      this._galleryYRotation = 0;
      this._pedestalHeight  = 0.45;
      this._pedestalRadius  = 0.7;

      // Options / appearance
      this._bgColor  = opts.bgColor  !== undefined ? opts.bgColor  : 0x16161e;
      this._showGrid = opts.showGrid !== undefined ? opts.showGrid : true;
      this._showAxes = opts.showAxes !== undefined ? opts.showAxes : false;

      // Callbacks
      this._onModelLoaded = null;
      this._onModelError  = null;

      // Bound listeners (so we can remove them)
      this._onMouseMove        = this._onMouseMove.bind(this);
      this._onPointerLockChange = this._onPointerLockChange.bind(this);
      this._onCanvasClick      = this._onCanvasClick.bind(this);
    }

    // ─── Lifecycle ─────────────────────────────────────────────────────────────

    init(engine) {
      const THREE = window.THREE;
      if (!THREE) {
        console.error('[ModelSystem] window.THREE not found. Load Three.js before GameFramework.');
        return;
      }
      this._engine = engine;

      const W = engine.canvas.width;
      const H = engine.canvas.height;

      // ── Scene ──
      this._scene = new THREE.Scene();
      this._scene.background = new THREE.Color(this._bgColor);

      // ── Camera ──
      this._camera = new THREE.PerspectiveCamera(60, W / H, 0.01, 500);
      this._camera.position.set(0, 1.5, 4);

      // ── Renderer ──
      this._renderer = new THREE.WebGLRenderer({ antialias: true });
      this._renderer.setPixelRatio(window.devicePixelRatio || 1);
      this._renderer.setSize(W, H);
      this._renderer.shadowMap.enabled = true;
      this._renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
      try {
        this._renderer.outputEncoding   = THREE.sRGBEncoding;
        this._renderer.toneMapping      = THREE.ACESFilmicToneMapping;
        this._renderer.toneMappingExposure = 1.0;
      } catch (_) {}

      // ── Insert WebGL canvas BEHIND the engine canvas ──
      this._threeCanvas = this._renderer.domElement;
      this._threeCanvas.style.cssText =
        'position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;';

      const parent = engine.canvas.parentElement || document.body;
      parent.style.position = 'relative';
      parent.insertBefore(this._threeCanvas, engine.canvas);

      // The engine canvas is on top for 2D HUD overlays. Disable its pointer
      // events so 3D mouse interaction reaches the WebGL canvas underneath.
      engine.canvas.style.cssText +=
        ';position:absolute;top:0;left:0;z-index:1;background:transparent;pointer-events:none;';

      // ── Lights ──
      this._applyLighting('studio');

      // ── Helpers ──
      this._gridHelper = new THREE.GridHelper(20, 40, 0x3a3a5c, 0x2a2a44);
      this._gridHelper.visible = this._showGrid;
      this._scene.add(this._gridHelper);

      this._axesHelper = new THREE.AxesHelper(1);
      this._axesHelper.visible = this._showAxes;
      this._scene.add(this._axesHelper);

      // ── Environment group (walk mode) ──
      this._envGroup = new THREE.Group();
      this._envGroup.visible = false; // hidden until walk mode
      this._scene.add(this._envGroup);
      this._buildEnvironment();

      // ── Orbit controls (default mode) ──
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

      // ── Walk-mode listeners (always installed, but only act in walk mode) ──
      this._threeCanvas.addEventListener('click', this._onCanvasClick);
      document.addEventListener('pointerlockchange', this._onPointerLockChange);
      document.addEventListener('mousemove', this._onMouseMove);

      // ── Walk-mode hint overlay ──
      this._createWalkHint(parent);

      // ── Default WASD bindings (do not clobber if the game already bound them) ──
      const inp = engine.input;
      if (inp) {
        if (!inp._bindings.walkForward)  inp.bind('walkForward',  'KeyW', 'ArrowUp');
        if (!inp._bindings.walkBackward) inp.bind('walkBackward', 'KeyS', 'ArrowDown');
        if (!inp._bindings.walkLeft)     inp.bind('walkLeft',     'KeyA', 'ArrowLeft');
        if (!inp._bindings.walkRight)    inp.bind('walkRight',    'KeyD', 'ArrowRight');
        if (!inp._bindings.walkRun)      inp.bind('walkRun',      'ShiftLeft', 'ShiftRight');
        if (!inp._bindings.walkUp)       inp.bind('walkUp',       'Space');
        if (!inp._bindings.walkDown)     inp.bind('walkDown',     'KeyQ', 'ControlLeft');
      }

      // ── Resize observer ──
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
      if (this._mode === 'orbit') {
        if (this._controls) this._controls.update();
      } else {
        this._updateWalk(dt);
      }
      // Advance every model's animation mixer (visible models only)
      Object.values(this._models).forEach(m => {
        if (m.mixer && m.scene.parent === this._scene) m.mixer.update(dt);
      });
    }

    render(/* ctx, engine */) {
      if (this._renderer && this._scene && this._camera) {
        this._renderer.render(this._scene, this._camera);
      }
    }

    destroy() {
      if (this._resizeObserver) this._resizeObserver.disconnect();
      Object.values(this._models).forEach(m => m.mixer && m.mixer.stopAllAction());

      if (this._threeCanvas) {
        this._threeCanvas.removeEventListener('click', this._onCanvasClick);
      }
      document.removeEventListener('pointerlockchange', this._onPointerLockChange);
      document.removeEventListener('mousemove', this._onMouseMove);

      if (this._fpHintEl && this._fpHintEl.parentElement) {
        this._fpHintEl.parentElement.removeChild(this._fpHintEl);
      }
      if (document.pointerLockElement) document.exitPointerLock();

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

    // ─── Environment (walk mode) ──────────────────────────────────────────────

    _buildEnvironment() {
      const THREE = window.THREE;

      // Floor — a 30x30 plane with a subtle two-tone radial fade.
      const floorGeo = new THREE.PlaneGeometry(40, 40, 1, 1);
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x252535, roughness: 0.95, metalness: 0.0,
      });
      this._floor = new THREE.Mesh(floorGeo, floorMat);
      this._floor.rotation.x = -Math.PI / 2;
      this._floor.position.y = 0;
      this._floor.receiveShadow = true;
      this._envGroup.add(this._floor);

      // Faint perimeter ring of lamp posts to anchor the space visually.
      const postCount = 8;
      const postRadius = 12;
      for (let i = 0; i < postCount; i++) {
        const a = (i / postCount) * Math.PI * 2;
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 3, 8),
          new THREE.MeshStandardMaterial({ color: 0x1a1a26, roughness: 0.9 })
        );
        post.position.set(Math.cos(a) * postRadius, 1.5, Math.sin(a) * postRadius);
        post.castShadow = true;
        this._envGroup.add(post);

        const lamp = new THREE.PointLight(0xffd699, 0.7, 8, 1.6);
        lamp.position.set(Math.cos(a) * postRadius, 3.0, Math.sin(a) * postRadius);
        this._envGroup.add(lamp);

        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0xffe2b0 })
        );
        bulb.position.copy(lamp.position);
        this._envGroup.add(bulb);
      }
    }

    // ─── Mode switching ───────────────────────────────────────────────────────

    /**
     * Switch interaction mode.
     * @param {'orbit'|'walk'} mode
     */
    setMode(mode) {
      if (mode !== 'orbit' && mode !== 'walk') {
        console.warn('[ModelSystem] Unknown mode:', mode);
        return;
      }
      if (mode === this._mode) return;
      this._mode = mode;

      if (mode === 'walk') {
        // Disable orbit controls
        if (this._controls) this._controls.enabled = false;

        // Show environment, arrange every loaded model in the gallery
        this._envGroup.visible = true;
        if (this._gridHelper) this._gridHelper.visible = false;
        this._showAllModels();
        this._arrangeAsGallery();

        // Place camera at start position outside the gallery, facing centre
        const startDist = this._galleryRadius + 3;
        this._camera.position.set(0, this._fpHeight, startDist);
        this._fpYaw   = Math.PI;   // face -Z (toward gallery centre)
        this._fpPitch = 0;
        this._applyFpRotation();

        if (this._fpHintEl) this._fpHintEl.style.display = 'block';

      } else {
        // Back to orbit
        if (this._controls) this._controls.enabled = true;
        this._envGroup.visible = false;
        if (this._gridHelper) this._gridHelper.visible = this._showGrid;

        if (document.pointerLockElement) document.exitPointerLock();
        this._pointerLocked = false;
        if (this._fpHintEl) this._fpHintEl.style.display = 'none';

        // Hide all but the active model and re-centre it
        this._showOnlyActive();

        this._camera.position.set(0, 1.5, 4);
        if (this._controls) {
          this._controls.target.set(0, 1, 0);
          this._controls.update();
        }
      }
      if (this._engine && this._engine.events) {
        this._engine.events.emit('models:modeChanged', mode);
      }
    }

    getMode() { return this._mode; }

    // ─── Walk-mode controls ──────────────────────────────────────────────────

    _onCanvasClick(/* e */) {
      if (this._mode !== 'walk') return;
      if (!this._pointerLocked && this._threeCanvas.requestPointerLock) {
        // Browsers throttle re-locking for ~1.25s after Esc, but the request
        // simply fails silently in that window — no harm in calling it.
        try { this._threeCanvas.requestPointerLock(); } catch (_) {}
      }
    }

    _onPointerLockChange() {
      this._pointerLocked = (document.pointerLockElement === this._threeCanvas);
      if (this._fpHintEl) {
        this._fpHintEl.style.display =
          (this._mode === 'walk' && !this._pointerLocked) ? 'block' : 'none';
      }
    }

    _onMouseMove(e) {
      if (this._mode !== 'walk' || !this._pointerLocked) return;
      const dx = e.movementX || 0;
      const dy = e.movementY || 0;
      this._fpYaw   -= dx * this._fpLookSens;
      this._fpPitch -= dy * this._fpLookSens;
      const lim = Math.PI / 2 - 0.05;
      if (this._fpPitch >  lim) this._fpPitch =  lim;
      if (this._fpPitch < -lim) this._fpPitch = -lim;
      this._applyFpRotation();
    }

    _applyFpRotation() {
      // Yaw around Y, then pitch around X.
      const e = this._camera.rotation;
      e.order = 'YXZ';
      e.y = this._fpYaw;
      e.x = this._fpPitch;
      e.z = 0;
    }

    _updateWalk(dt) {
      const inp = this._engine && this._engine.input;
      if (!inp) return;

      const fwd  = inp.isDown('walkForward')  ? 1 : 0;
      const back = inp.isDown('walkBackward') ? 1 : 0;
      const lft  = inp.isDown('walkLeft')     ? 1 : 0;
      const rgt  = inp.isDown('walkRight')    ? 1 : 0;
      const run  = inp.isDown('walkRun');

      // Movement vector in camera-local space: -Z is forward, +X is right.
      let mz = (back - fwd);
      let mx = (rgt  - lft);
      const len = Math.hypot(mx, mz);
      if (len > 0) { mx /= len; mz /= len; }

      // Rotate by yaw to get world-space delta
      const speed = run ? this._fpRunSpeed : this._fpSpeed;
      const cosY = Math.cos(this._fpYaw);
      const sinY = Math.sin(this._fpYaw);
      const wx =  mx * cosY + mz * sinY;
      const wz = -mx * sinY + mz * cosY;

      const dx = wx * speed * dt;
      const dz = wz * speed * dt;
      this._camera.position.x += dx;
      this._camera.position.z += dz;

      // Clamp to floor area (keep player inside the 40x40 plane minus a margin)
      const HALF = 19;
      if (this._camera.position.x >  HALF) this._camera.position.x =  HALF;
      if (this._camera.position.x < -HALF) this._camera.position.x = -HALF;
      if (this._camera.position.z >  HALF) this._camera.position.z =  HALF;
      if (this._camera.position.z < -HALF) this._camera.position.z = -HALF;

      // Keep eye height fixed
      this._camera.position.y = this._fpHeight;
    }

    _createWalkHint(parent) {
      const el = document.createElement('div');
      el.id = 'gf-walk-hint';
      el.style.cssText = [
        'position:absolute', 'left:50%', 'bottom:42px', 'transform:translateX(-50%)',
        'padding:10px 16px', 'border-radius:8px',
        'background:rgba(8,8,18,0.78)', 'border:1px solid rgba(100,100,180,0.35)',
        'color:#aabbff', 'font:600 12px "Segoe UI",system-ui,sans-serif',
        'letter-spacing:0.5px', 'pointer-events:none', 'z-index:5',
        'display:none', 'text-align:center', 'box-shadow:0 6px 24px rgba(0,0,0,0.4)',
      ].join(';');
      el.innerHTML =
        '<div style="font-size:13px;color:#ccd5ff;">Click to look around</div>' +
        '<div style="margin-top:4px;color:#7788bb;font-weight:400;">' +
        'WASD — move &nbsp;·&nbsp; Mouse — look &nbsp;·&nbsp; Shift — run &nbsp;·&nbsp; Esc — release</div>';
      parent.appendChild(el);
      this._fpHintEl = el;
    }

    // ─── Gallery placement ───────────────────────────────────────────────────

    /**
     * Arrange every loaded model in a circle around origin, each on a pedestal.
     * Called automatically when entering walk mode but can be called manually
     * (e.g. after loading new models while already in walk mode).
     */
    _arrangeAsGallery() {
      const THREE = window.THREE;
      const names = Object.keys(this._models);
      if (!names.length) return;

      // Clear out previous pedestals
      Object.values(this._models).forEach(m => {
        if (m.pedestal) {
          this._scene.remove(m.pedestal);
          m.pedestal = null;
        }
      });

      const N = names.length;
      // Choose a radius proportional to model count so big galleries don't crowd
      const r = Math.max(this._galleryRadius, 1.6 + N * 0.45);

      names.forEach((name, i) => {
        const a = (i / N) * Math.PI * 2 + this._galleryYRotation;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;

        const m = this._models[name];

        // Pedestal: short cylinder
        const pedGroup = new THREE.Group();
        const ped = new THREE.Mesh(
          new THREE.CylinderGeometry(this._pedestalRadius, this._pedestalRadius * 1.05,
                                     this._pedestalHeight, 24),
          new THREE.MeshStandardMaterial({ color: 0x2a2c3c, roughness: 0.7, metalness: 0.05 })
        );
        ped.position.y = this._pedestalHeight / 2;
        ped.castShadow = true;
        ped.receiveShadow = true;
        pedGroup.add(ped);

        // Nameplate (sprite-text)
        const label = this._makeLabel(name);
        if (label) {
          label.position.set(0, this._pedestalHeight + 2.6, 0);
          pedGroup.add(label);
        }

        pedGroup.position.set(x, 0, z);
        // Models face the gallery centre
        pedGroup.rotation.y = -a + Math.PI / 2;
        this._scene.add(pedGroup);
        m.pedestal = pedGroup;

        // Position the model on top of the pedestal
        m.scene.position.set(x, this._pedestalHeight, z);
        m.scene.rotation.y = -a + Math.PI / 2; // face inward
      });
    }

    _makeLabel(text) {
      const THREE = window.THREE;
      // Render text to a canvas, use as sprite texture
      const cvs = document.createElement('canvas');
      cvs.width = 512; cvs.height = 128;
      const c = cvs.getContext('2d');
      c.clearRect(0, 0, cvs.width, cvs.height);

      // Background pill
      const padX = 24, padY = 18;
      c.font = 'bold 56px "Segoe UI", system-ui, sans-serif';
      const w = Math.min(cvs.width - 16, c.measureText(text).width + padX * 2);
      const h = 100;
      const x0 = (cvs.width - w) / 2;
      const y0 = (cvs.height - h) / 2;
      c.fillStyle = 'rgba(20,22,40,0.85)';
      _roundedRect(c, x0, y0, w, h, 14); c.fill();
      c.strokeStyle = 'rgba(120,140,220,0.6)'; c.lineWidth = 2;
      _roundedRect(c, x0, y0, w, h, 14); c.stroke();

      c.fillStyle = '#ccddff';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(text, cvs.width / 2, cvs.height / 2 + 4);

      const tex = new THREE.CanvasTexture(cvs);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
      const sprite = new THREE.Sprite(mat);
      // Scale based on text width so labels look uniform
      sprite.scale.set(2.0, 0.5, 1);
      return sprite;
    }

    /** Add every loaded model's scene to the THREE scene (walk mode). */
    _showAllModels() {
      Object.values(this._models).forEach(m => {
        if (m.scene.parent !== this._scene) this._scene.add(m.scene);
        // Reset to origin; arrangeAsGallery will reposition.
        m.scene.position.set(0, 0, 0);
        m.scene.rotation.set(0, 0, 0);
        // Auto-play first animation if any
        if (m.mixer && m.animationNames.length > 0 && !m.activeAction) {
          this._playClipOn(m, m.animationNames[0]);
        }
      });
    }

    /** Show only the active model, hide all others (orbit mode). */
    _showOnlyActive() {
      Object.values(this._models).forEach(m => {
        if (m === this._activeModel) {
          if (m.scene.parent !== this._scene) this._scene.add(m.scene);
          m.scene.position.set(0, 0, 0);
          m.scene.rotation.set(0, 0, 0);
        } else {
          if (m.scene.parent === this._scene) this._scene.remove(m.scene);
          if (m.pedestal && m.pedestal.parent === this._scene) {
            this._scene.remove(m.pedestal);
            m.pedestal = null;
          }
        }
      });
    }

    // ─── Model loading ────────────────────────────────────────────────────────

    /**
     * Load a GLB/GLTF from a File object (e.g. from <input type="file">).
     * @param {File} file
     * @param {string} [nameOverride]
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

    /**
     * Load a preset model registered with the framework. Asset paths are owned
     * by the framework — games refer to models by name only.
     * @param {string} presetName
     * @returns {Promise<ModelData>}
     */
    loadPreset(presetName) {
      const rel = PRESETS[presetName];
      if (!rel) return Promise.reject(new Error('[ModelSystem] Unknown preset: ' + presetName));
      const url = (GF && GF.resolvePath) ? GF.resolvePath(rel) : rel;
      return this.loadFromURL(url, presetName);
    }

    /** Register or override a preset model path. */
    static registerPreset(name, relativePath) {
      PRESETS[name] = relativePath;
    }
    /** List all registered preset names. */
    static listPresets() { return Object.keys(PRESETS); }

    _loadURL(url, name) {
      return new Promise((resolve, reject) => {
        const loader = new window.THREE.GLTFLoader();
        loader.load(
          url,
          gltf => {
            const data = this._processGLTF(gltf, name);
            this._models[name] = data;
            // Auto-place into the gallery if we're already in walk mode
            if (this._mode === 'walk') {
              if (data.scene.parent !== this._scene) this._scene.add(data.scene);
              this._arrangeAsGallery();
              if (data.mixer && data.animationNames.length > 0) {
                this._playClipOn(data, data.animationNames[0]);
              }
            }
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

      // Per-model mixer + actions (so multiple models can animate at once)
      const mixer   = animations.length ? new THREE.AnimationMixer(root) : null;
      const actions = {};
      if (mixer) animations.forEach(c => { actions[c.name] = mixer.clipAction(c); });

      return {
        name, scene: root, animations, animationNames,
        meshCount, matCount: matSet.size,
        mixer, actions, activeAction: null, pedestal: null,
      };
    }

    /**
     * In orbit mode: bring this model to centre stage (hides others).
     * In walk mode: simply mark it as active for animation panel highlights.
     */
    showModel(name) {
      const data = this._models[name];
      if (!data) { console.warn('[ModelSystem] Unknown model:', name); return; }
      this._activeModel = data;

      if (this._mode === 'orbit') {
        this._showOnlyActive();
        // Re-apply wireframe if toggled
        if (this._wireframe) this.setWireframe(true);
        // Auto-play first animation
        if (data.mixer && data.animationNames[0]) this.playAnimation(data.animationNames[0]);
      }
    }

    removeModel(name) {
      const m = this._models[name];
      if (!m) return;
      if (m.mixer) m.mixer.stopAllAction();
      if (m.scene.parent === this._scene) this._scene.remove(m.scene);
      if (m.pedestal && m.pedestal.parent === this._scene) this._scene.remove(m.pedestal);
      if (this._activeModel === m) this._activeModel = null;
      delete this._models[name];

      if (this._mode === 'walk') this._arrangeAsGallery();
    }

    getModelNames()   { return Object.keys(this._models); }
    getActiveModel()  { return this._activeModel; }

    // ─── Animation ────────────────────────────────────────────────────────────

    _playClipOn(model, name) {
      const action = model.actions[name];
      if (!action) return;
      if (model.activeAction && model.activeAction !== action) {
        model.activeAction.fadeOut(0.25);
      }
      model.activeAction = action;
      action.reset().fadeIn(0.25).play();
    }

    /** Play an animation by name on the active model. */
    playAnimation(name) {
      if (!this._activeModel) return;
      this._playClipOn(this._activeModel, name);
    }

    stopAnimation() {
      if (!this._activeModel) return;
      const m = this._activeModel;
      if (m.activeAction) { m.activeAction.fadeOut(0.25); m.activeAction = null; }
    }

    getActiveAnimationName() {
      const m = this._activeModel;
      return (m && m.activeAction) ? m.activeAction.getClip().name : null;
    }

    // ─── Scene Controls ──────────────────────────────────────────────────────

    resetCamera() {
      if (!this._camera) return;
      if (this._mode === 'walk') {
        const startDist = this._galleryRadius + 3;
        this._camera.position.set(0, this._fpHeight, startDist);
        this._fpYaw = Math.PI; this._fpPitch = 0;
        this._applyFpRotation();
      } else {
        this._camera.position.set(0, 1.5, 4);
        if (this._controls) { this._controls.target.set(0, 1, 0); this._controls.update(); }
      }
    }

    setLighting(preset) { this._applyLighting(preset); }

    showGrid(visible) {
      this._showGrid = visible;
      // Grid is hidden in walk mode regardless; in orbit it follows the toggle
      if (this._gridHelper && this._mode === 'orbit') this._gridHelper.visible = visible;
    }

    showAxes(visible) {
      if (this._axesHelper) this._axesHelper.visible = visible;
    }

    setWireframe(enabled) {
      this._wireframe = enabled;
      Object.values(this._models).forEach(m => {
        m.scene.traverse(child => {
          if (!child.isMesh) return;
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach(mat => { mat.wireframe = enabled; });
        });
      });
    }

    setBackground(colorHex) {
      this._bgColor = colorHex;
      if (this._scene) this._scene.background = new window.THREE.Color(colorHex);
    }

    /** Adjust walking speed (units/second). */
    setWalkSpeed(speed, runSpeed) {
      if (typeof speed === 'number')    this._fpSpeed    = speed;
      if (typeof runSpeed === 'number') this._fpRunSpeed = runSpeed;
    }

    /** Adjust mouse-look sensitivity (radians per pixel). */
    setLookSensitivity(s) { this._fpLookSens = s; }

    // ─── Event Hooks ─────────────────────────────────────────────────────────

    /** fn(name, modelData) called after each successful load */
    onModelLoaded(fn) { this._onModelLoaded = fn; }

    /** fn(name, error) called on load failure */
    onError(fn) { this._onModelError = fn; }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function _roundedRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  GF.ModelSystem = ModelSystem;

})(window.GF = window.GF || {});


// -- systems/Three3DScene.js -------------------------------------

// GameFramework/framework/systems/Three3DScene.js
// A reusable Three.js host system for games that want full 3D worlds.
//
// Unlike ModelSystem (which loads GLB files and runs orbit / walk gallery
// modes), Three3DScene is a thin renderer that the game itself populates with
// procedural meshes. Games can swap entire 3D scenes per game-scene transition
// via clearScene().
//
// Prerequisites — load Three.js BEFORE GameFramework.bundle.js:
//   <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
//
// Set engineConfig.backgroundColor = 'transparent' so the 2D canvas doesn't
// cover the 3D view.
//
// Usage:
//   const three = new GF.Three3DScene({ bgColor: 0x0a0a14 });
//   engine.addSystem(three);
//   // From a Scene's init():
//   const cube = new THREE.Mesh(geometry, material);
//   three.add(cube);                  // tracked, removable in bulk later
//   three.setCamera(myCamera);        // override the default camera
//   // From the Scene's destroy():
//   three.clearScene();
//
// Helpers:
//   three.worldToScreen(vec3) → { x, y } pixel coords on the 2D engine canvas
//   three.setBackground(0xrrggbb)
//   three.add(obj) / three.remove(obj) / three.clearScene()

(function (GF) {
  'use strict';

  class Three3DScene {
    constructor(opts) {
      this.name = 'three3d';
      opts = opts || {};
      this._opts          = opts;
      this._bgColor       = opts.bgColor !== undefined ? opts.bgColor : 0x0a0a14;
      this._scene         = null;
      this._camera        = null;
      this._renderer      = null;
      this._domEl         = null;
      this._addedObjects  = [];   // every obj added via add() — bulk removable
      this._engine        = null;
      this._resizeObs     = null;
    }

    // ── Lifecycle ────────────────────────────────────────────────────────────

    init(engine) {
      const THREE = window.THREE;
      if (!THREE) {
        console.error('[Three3DScene] window.THREE not found. Load Three.js before GameFramework.');
        return;
      }
      this._engine = engine;
      const W = engine.canvas.width;
      const H = engine.canvas.height;

      // Renderer
      this._renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this._renderer.setPixelRatio(window.devicePixelRatio || 1);
      this._renderer.setSize(W, H);
      this._renderer.shadowMap.enabled = true;
      this._renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
      try {
        this._renderer.outputEncoding      = THREE.sRGBEncoding;
        this._renderer.toneMapping         = THREE.ACESFilmicToneMapping;
        this._renderer.toneMappingExposure = 1.0;
      } catch (_) {}

      // Scene
      this._scene = new THREE.Scene();
      this._scene.background = new THREE.Color(this._bgColor);

      // Default camera (games usually replace via setCamera)
      this._camera = new THREE.PerspectiveCamera(55, W / H, 0.05, 500);
      this._camera.position.set(0, 6, 10);
      this._camera.lookAt(0, 0, 0);

      // Insert renderer canvas BEHIND the engine's 2D canvas
      this._domEl = this._renderer.domElement;
      this._domEl.style.cssText =
        'position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;';
      const parent = engine.canvas.parentElement || document.body;
      parent.style.position = 'relative';
      parent.insertBefore(this._domEl, engine.canvas);
      // 2D canvas overlays the 3D one for HUD / dialogue rendering.
      engine.canvas.style.cssText +=
        ';position:absolute;top:0;left:0;z-index:1;background:transparent;';

      // Resize: keep both canvases in sync with the parent container
      this._resizeObs = new ResizeObserver(() => this._sync());
      this._resizeObs.observe(parent);
    }

    _sync() {
      if (!this._renderer || !this._engine) return;
      const W = this._engine.canvas.width;
      const H = this._engine.canvas.height;
      // updateStyle=false: keep the width:100%/height:100% CSS so the WebGL
      // canvas scales with the container (mobile) instead of snapping to px.
      this._renderer.setSize(W, H, false);
      if (this._camera && this._camera.isPerspectiveCamera) {
        this._camera.aspect = W / H;
        this._camera.updateProjectionMatrix();
      }
    }

    // No-op: game scenes drive their own 3D animation in update()
    update(/* dt, engine */) {}

    render(/* ctx, engine */) {
      if (this._renderer && this._scene && this._camera) {
        this._renderer.render(this._scene, this._camera);
      }
    }

    destroy() {
      if (this._resizeObs) this._resizeObs.disconnect();
      this.clearScene();
      if (this._renderer) {
        this._renderer.dispose();
        if (this._domEl && this._domEl.parentElement) {
          this._domEl.parentElement.removeChild(this._domEl);
        }
      }
    }

    // ── Scene API ────────────────────────────────────────────────────────────

    /** Set the active camera (e.g. PerspectiveCamera, OrthographicCamera). */
    setCamera(cam) { this._camera = cam; }

    /** Direct accessors for advanced use. */
    get scene()    { return this._scene; }
    get camera()   { return this._camera; }
    get renderer() { return this._renderer; }

    /** Add an object to the scene. Tracked for bulk-clear. */
    add(obj) {
      if (!obj || !this._scene) return obj;
      this._scene.add(obj);
      this._addedObjects.push(obj);
      return obj;
    }

    /** Remove a single tracked object. */
    remove(obj) {
      if (!obj || !this._scene) return;
      this._scene.remove(obj);
      const i = this._addedObjects.indexOf(obj);
      if (i >= 0) this._addedObjects.splice(i, 1);
      _disposeRecursive(obj);
    }

    /** Remove every object that was added via add(). Use on scene transitions. */
    clearScene() {
      if (!this._scene) return;
      for (const obj of this._addedObjects) {
        this._scene.remove(obj);
        _disposeRecursive(obj);
      }
      this._addedObjects = [];
    }

    /** Update the scene background colour. */
    setBackground(colorHex) {
      if (this._scene) this._scene.background = new window.THREE.Color(colorHex);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Project a world-space Vector3 to pixel coordinates on the engine's 2D
     * canvas. Useful for HUD elements that should track 3D objects (HP bars,
     * floating damage text, name plates).
     * @param {THREE.Vector3} v3
     * @returns {{x:number, y:number, depth:number}}
     */
    worldToScreen(v3) {
      const ndc = v3.clone().project(this._camera);
      const W = this._engine.canvas.width;
      const H = this._engine.canvas.height;
      return {
        x: (ndc.x + 1) * 0.5 * W,
        y: (-ndc.y + 1) * 0.5 * H,
        depth: ndc.z,
      };
    }
  }

  // Recursively dispose geometries / materials so we don't leak GPU resources.
  function _disposeRecursive(obj) {
    if (!obj) return;
    obj.traverse && obj.traverse(child => {
      if (child.geometry && child.geometry.dispose) child.geometry.dispose();
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(m => {
          if (m.map && m.map.dispose) m.map.dispose();
          if (m.dispose) m.dispose();
        });
      }
    });
  }

  GF.Three3DScene = Three3DScene;

})(window.GF = window.GF || {});


// -- systems/GridSystem.js ---------------------------------------

// GameFramework/framework/systems/GridSystem.js
// Logical grid for tactical games — passability, occupants, A* pathfinding,
// BFS range/area queries, and grid<->world coordinate conversion.
//
// GridSystem is intentionally orthogonal to TilemapSystem. TilemapSystem
// renders tile graphics; GridSystem owns the logical playfield (who is on
// which cell, which cells are blocked, where can a unit reach this turn).
//
// Quick start:
//   const grid = game.grids.create({ cols: 12, rows: 10, cellSize: 32, x: 0, y: 0 });
//   grid.setBlocked(3, 4, true);
//   grid.placeOccupant(unit, 5, 5);
//   const reachable = grid.tilesInRange(unit, 4); // [{col,row,cost}]
//   const path      = grid.findPath({col: 5, row: 5}, {col: 8, row: 7});
//   const { x, y }  = grid.toWorldCenter(8, 7);
//
// Each occupant is an arbitrary object identified by reference. Optionally
// it may expose a `team` (string) — used by tilesInRange to treat enemy
// occupants as blockers and ally occupants as walk-through-only.

(function (GF) {
  'use strict';

  // ─── Min-heap priority queue (for A*) ───────────────────────────────────────
  class _PQ {
    constructor() { this._a = []; }
    get size() { return this._a.length; }
    push(item, prio) {
      this._a.push({ item, prio });
      let i = this._a.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (this._a[p].prio <= this._a[i].prio) break;
        [this._a[p], this._a[i]] = [this._a[i], this._a[p]];
        i = p;
      }
    }
    pop() {
      const top = this._a[0];
      const last = this._a.pop();
      if (this._a.length) {
        this._a[0] = last;
        let i = 0;
        const n = this._a.length;
        for (;;) {
          const l = i * 2 + 1, r = l + 1;
          let m = i;
          if (l < n && this._a[l].prio < this._a[m].prio) m = l;
          if (r < n && this._a[r].prio < this._a[m].prio) m = r;
          if (m === i) break;
          [this._a[m], this._a[i]] = [this._a[i], this._a[m]];
          i = m;
        }
      }
      return top.item;
    }
  }

  // ─── Grid ───────────────────────────────────────────────────────────────────

  class Grid {
    /**
     * @param {Object} cfg
     * @param {number} cfg.cols       - number of columns
     * @param {number} cfg.rows       - number of rows
     * @param {number} cfg.cellSize   - pixel size of one cell (square)
     * @param {number} [cfg.x=0]      - world X of grid's top-left corner
     * @param {number} [cfg.y=0]      - world Y of grid's top-left corner
     * @param {number[]} [cfg.terrainCost] - per-cell move-cost grid (row-major), defaults 1
     * @param {boolean[]} [cfg.blocked]    - per-cell blocked grid (row-major), defaults false
     */
    constructor(cfg = {}) {
      this.cols     = cfg.cols     || 1;
      this.rows     = cfg.rows     || 1;
      this.cellSize = cfg.cellSize || 32;
      this.x        = cfg.x        || 0;
      this.y        = cfg.y        || 0;

      const n = this.cols * this.rows;

      // Terrain cost (1 = normal, higher = harder to traverse)
      this._cost    = new Array(n);
      // Static blockers (walls etc.)
      this._blocked = new Array(n);
      // Occupant references — only one occupant per cell
      this._occupants = new Array(n);

      for (let i = 0; i < n; i++) {
        this._cost[i]      = cfg.terrainCost ? (cfg.terrainCost[i] || 1) : 1;
        this._blocked[i]   = cfg.blocked     ? !!cfg.blocked[i]          : false;
        this._occupants[i] = null;
      }
    }

    // ── Coordinate conversion ─────────────────────────────────────────────────

    /** Convert grid (col,row) → world top-left pixel of that cell. */
    toWorld(col, row) {
      return { x: this.x + col * this.cellSize, y: this.y + row * this.cellSize };
    }

    /** Convert grid (col,row) → world centre pixel of that cell. */
    toWorldCenter(col, row) {
      const half = this.cellSize / 2;
      return { x: this.x + col * this.cellSize + half, y: this.y + row * this.cellSize + half };
    }

    /** Convert world pixel → grid (col,row). Returns {col,row} possibly out of bounds. */
    toGrid(worldX, worldY) {
      return {
        col: Math.floor((worldX - this.x) / this.cellSize),
        row: Math.floor((worldY - this.y) / this.cellSize),
      };
    }

    /** Returns true if (col,row) lies on the board. */
    inBounds(col, row) {
      return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
    }

    // ── Cell state ────────────────────────────────────────────────────────────

    _idx(col, row) { return row * this.cols + col; }

    setBlocked(col, row, blocked) {
      if (!this.inBounds(col, row)) return;
      this._blocked[this._idx(col, row)] = !!blocked;
    }
    isBlocked(col, row) {
      if (!this.inBounds(col, row)) return true;
      return this._blocked[this._idx(col, row)];
    }

    setCost(col, row, cost) {
      if (!this.inBounds(col, row)) return;
      this._cost[this._idx(col, row)] = Math.max(0.1, cost);
    }
    getCost(col, row) {
      if (!this.inBounds(col, row)) return Infinity;
      return this._cost[this._idx(col, row)];
    }

    // ── Occupancy ─────────────────────────────────────────────────────────────

    occupantAt(col, row) {
      if (!this.inBounds(col, row)) return null;
      return this._occupants[this._idx(col, row)];
    }

    /** Place occupant at (col,row). Removes it from any prior cell. */
    placeOccupant(occ, col, row) {
      if (!occ) return;
      this.removeOccupant(occ);
      if (!this.inBounds(col, row)) return;
      this._occupants[this._idx(col, row)] = occ;
      occ.col = col;
      occ.row = row;
    }

    /** Remove occupant from its current cell (looks up by reference). */
    removeOccupant(occ) {
      if (!occ) return;
      // Fast path if occupant tracks its position
      if (Number.isInteger(occ.col) && Number.isInteger(occ.row) && this.inBounds(occ.col, occ.row)) {
        const i = this._idx(occ.col, occ.row);
        if (this._occupants[i] === occ) this._occupants[i] = null;
      }
      // Fallback scan
      for (let i = 0; i < this._occupants.length; i++) {
        if (this._occupants[i] === occ) this._occupants[i] = null;
      }
    }

    /** Iterate all occupants. Callback receives (occ, col, row). */
    forEachOccupant(cb) {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const o = this._occupants[this._idx(c, r)];
          if (o) cb(o, c, r);
        }
      }
    }

    // ── Pathing primitives ────────────────────────────────────────────────────

    /**
     * Returns true if a unit can ENTER (col,row). Walls and enemy occupants
     * block; allied occupants are passable but not stoppable (handled in tilesInRange).
     */
    isPassable(col, row, opts = {}) {
      if (!this.inBounds(col, row)) return false;
      if (this.isBlocked(col, row)) return false;
      const occ = this.occupantAt(col, row);
      if (!occ) return true;
      if (opts.ignore && opts.ignore === occ) return true;
      if (opts.team && occ.team && occ.team === opts.team) return true; // walk through allies
      return false;
    }

    /** Returns true if a unit can STOP on (col,row). Any occupant other than `ignore` blocks. */
    isStoppable(col, row, opts = {}) {
      if (!this.inBounds(col, row)) return false;
      if (this.isBlocked(col, row)) return false;
      const occ = this.occupantAt(col, row);
      if (!occ) return true;
      if (opts.ignore && opts.ignore === occ) return true;
      return false;
    }

    /**
     * Manhattan-distance neighbours of (c,r). Returns an array of {col,row}.
     */
    neighbours4(col, row) {
      const out = [];
      if (col > 0)              out.push({ col: col - 1, row });
      if (col < this.cols - 1)  out.push({ col: col + 1, row });
      if (row > 0)              out.push({ col, row: row - 1 });
      if (row < this.rows - 1)  out.push({ col, row: row + 1 });
      return out;
    }

    /**
     * BFS from origin yielding every cell reachable within `maxCost` total
     * movement cost. Cells occupied by an ally are traversable but not stoppable.
     * Returned cells are stoppable (passable AND empty/the unit itself).
     *
     * @param {Object} origin    - { col, row } or a unit with col/row/team
     * @param {number} maxCost   - movement budget
     * @param {Object} [opts]
     * @param {string} [opts.team] - allies of this team are walk-through
     * @param {Object} [opts.ignore] - occupant to ignore (typically the moving unit)
     * @returns {Array<{col,row,cost,parent}>}
     */
    tilesInRange(origin, maxCost, opts = {}) {
      const team   = opts.team   || (origin && origin.team)   || null;
      const ignore = opts.ignore || origin || null;
      const startC = origin.col, startR = origin.row;
      if (!this.inBounds(startC, startR)) return [];

      const dist  = new Map();
      const parent= new Map();
      const key   = (c, r) => r * this.cols + c;

      dist.set(key(startC, startR), 0);
      const pq = new _PQ();
      pq.push({ col: startC, row: startR }, 0);

      const out = [];

      while (pq.size) {
        const cur = pq.pop();
        const k   = key(cur.col, cur.row);
        const cost = dist.get(k);

        // Origin is always reachable (cost 0)
        if (this.isStoppable(cur.col, cur.row, { ignore })) {
          out.push({ col: cur.col, row: cur.row, cost, parent: parent.get(k) || null });
        }

        const nb = this.neighbours4(cur.col, cur.row);
        for (let i = 0; i < nb.length; i++) {
          const n = nb[i];
          // Must be passable (walls / enemies block; allies are walk-through)
          if (!this.isPassable(n.col, n.row, { team, ignore })) continue;
          const stepCost = this.getCost(n.col, n.row);
          const newCost  = cost + stepCost;
          if (newCost > maxCost) continue;
          const nk = key(n.col, n.row);
          if (newCost < (dist.has(nk) ? dist.get(nk) : Infinity)) {
            dist.set(nk, newCost);
            parent.set(nk, { col: cur.col, row: cur.row });
            pq.push(n, newCost);
          }
        }
      }
      return out;
    }

    /**
     * A* path from {col,row} → {col,row}.
     * @returns {Array<{col,row}>|null} including both endpoints, or null if unreachable
     */
    findPath(from, to, opts = {}) {
      if (!this.inBounds(from.col, from.row) || !this.inBounds(to.col, to.row)) return null;
      const team   = opts.team   || null;
      const ignore = opts.ignore || null;
      const key    = (c, r) => r * this.cols + c;
      const heur   = (c, r) => Math.abs(c - to.col) + Math.abs(r - to.row);

      const gScore = new Map();
      const came   = new Map();
      gScore.set(key(from.col, from.row), 0);

      const pq = new _PQ();
      pq.push({ col: from.col, row: from.row }, heur(from.col, from.row));

      while (pq.size) {
        const cur = pq.pop();
        if (cur.col === to.col && cur.row === to.row) {
          // Reconstruct
          const path = [{ col: cur.col, row: cur.row }];
          let k = key(cur.col, cur.row);
          while (came.has(k)) {
            const p = came.get(k);
            path.unshift(p);
            k = key(p.col, p.row);
          }
          return path;
        }
        const nb = this.neighbours4(cur.col, cur.row);
        for (let i = 0; i < nb.length; i++) {
          const n = nb[i];
          // Allow stepping into the goal even if it's occupied by an enemy
          // (caller decides what to do — used for "attack target" pathing).
          const isGoal = (n.col === to.col && n.row === to.row);
          if (!isGoal && !this.isPassable(n.col, n.row, { team, ignore })) continue;
          if (!isGoal && !this.inBounds(n.col, n.row)) continue;
          if (isGoal && this.isBlocked(n.col, n.row)) continue;

          const stepCost = this.getCost(n.col, n.row);
          const tentative = (gScore.get(key(cur.col, cur.row)) || 0) + stepCost;
          const nk = key(n.col, n.row);
          if (tentative < (gScore.has(nk) ? gScore.get(nk) : Infinity)) {
            came.set(nk, { col: cur.col, row: cur.row });
            gScore.set(nk, tentative);
            pq.push(n, tentative + heur(n.col, n.row));
          }
        }
      }
      return null;
    }

    /**
     * Cells within a chebyshev/manhattan range — used for attack reach.
     * @param {Object} origin    - { col, row }
     * @param {number} minRange
     * @param {number} maxRange
     * @param {string} [shape='diamond'] - 'diamond' (manhattan) | 'square' (chebyshev)
     */
    cellsInRing(origin, minRange, maxRange, shape) {
      shape = shape || 'diamond';
      const out = [];
      for (let r = origin.row - maxRange; r <= origin.row + maxRange; r++) {
        for (let c = origin.col - maxRange; c <= origin.col + maxRange; c++) {
          if (!this.inBounds(c, r)) continue;
          const dx = Math.abs(c - origin.col), dy = Math.abs(r - origin.row);
          const d  = (shape === 'square') ? Math.max(dx, dy) : (dx + dy);
          if (d >= minRange && d <= maxRange) out.push({ col: c, row: r, dist: d });
        }
      }
      return out;
    }

    /** Manhattan distance between two cells. */
    static manhattan(a, b) {
      return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
    }
  }

  // ─── GridSystem ─────────────────────────────────────────────────────────────

  class GridSystem {
    constructor() {
      this.name   = 'GridSystem';
      this._grids = [];
    }
    init() {}

    /** Create and register a grid. */
    create(cfg) {
      const g = new Grid(cfg);
      this._grids.push(g);
      return g;
    }

    /** Remove a grid. */
    remove(grid) {
      const i = this._grids.indexOf(grid);
      if (i >= 0) this._grids.splice(i, 1);
    }

    /** Remove all grids. */
    clear() { this._grids = []; }

    update() {}
    render() {} // games render their own grids; this system is purely logical
  }

  GF.Grid       = Grid;
  GF.GridSystem = GridSystem;

})(window.GF = window.GF || {});


// -- systems/TurnBasedBattleSystem.js ----------------------------

// GameFramework/framework/systems/TurnBasedBattleSystem.js
// Generic turn-based battle controller — manages turn order, rounds, and
// the current actor. Renders nothing; the game decides how to draw and
// what menu options to expose for the active unit.
//
// Unit shape (the only fields the system reads):
//   {
//     id      : string,            // optional, for debugging
//     team    : 'player' | 'enemy' | string,
//     name    : string,
//     hp      : number,
//     maxHp   : number,
//     agility : number,            // higher = acts earlier in the round
//     dead    : boolean,           // set true when hp reaches 0
//   }
// The system mutates `dead` and `hp` only via dealDamage()/heal() helpers.
// The game is free to read or set any other unit fields.
//
// Lifecycle (driven by the game):
//   battle.start({ units, victory, defeat })
//   while (!battle.finished) {
//      const unit = battle.currentUnit();
//      // game shows menus, animations, attacks etc. for `unit`
//      battle.endTurn();          // advances to next unit
//   }
//
// Events fired on engine.events:
//   'battle:start'         { units }
//   'battle:round'         { round, order }
//   'battle:turn_start'    { unit }
//   'battle:turn_end'      { unit }
//   'battle:unit_damaged'  { unit, source, amount }
//   'battle:unit_healed'   { unit, source, amount }
//   'battle:unit_died'     { unit, source }
//   'battle:complete'      { result: 'victory' | 'defeat' | 'draw' }

(function (GF) {
  'use strict';

  class TurnBasedBattleSystem {
    constructor() {
      this.name     = 'TurnBasedBattleSystem';
      this._engine  = null;
      this._reset();
    }

    init(engine) { this._engine = engine; }

    _reset() {
      this._units    = [];
      this._order    = [];
      this._idx      = -1;
      this._round    = 0;
      this._victory  = null; // (units) => boolean
      this._defeat   = null;
      this.finished  = false;
      this.result    = null;
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    /**
     * Start a new battle.
     * @param {Object}   cfg
     * @param {Array}    cfg.units    - all combatants (will mutate)
     * @param {Function} [cfg.victory]- (units) => boolean (default: no enemy alive)
     * @param {Function} [cfg.defeat] - (units) => boolean (default: no player alive)
     */
    start(cfg = {}) {
      this._reset();
      this._units   = cfg.units || [];
      this._victory = cfg.victory || (units => !units.some(u => u.team === 'enemy'  && !u.dead));
      this._defeat  = cfg.defeat  || (units => !units.some(u => u.team === 'player' && !u.dead));
      this._emit('battle:start', { units: this._units });
      this._beginRound();
      return this;
    }

    /** True once an outcome has been decided. */
    get isFinished() { return this.finished; }

    /** Returns the unit currently taking its turn, or null. */
    currentUnit() {
      if (this.finished || this._idx < 0 || this._idx >= this._order.length) return null;
      return this._order[this._idx];
    }

    /** End the current unit's turn and advance to the next living unit. */
    endTurn() {
      const cur = this.currentUnit();
      if (cur) this._emit('battle:turn_end', { unit: cur });

      // Check end conditions after every turn
      if (this._checkEnd()) return;

      // Advance to next living unit in the round
      while (true) {
        this._idx++;
        if (this._idx >= this._order.length) {
          // Round complete — start next
          this._beginRound();
          // _beginRound may itself end the battle
          if (this.finished) return;
          break;
        }
        const next = this._order[this._idx];
        if (next && !next.dead) {
          this._emit('battle:turn_start', { unit: next });
          break;
        }
      }
    }

    /** All living units (or filtered by team). */
    livingUnits(team) {
      return this._units.filter(u => !u.dead && (!team || u.team === team));
    }

    /** All units (filtered by team). */
    allUnits(team) {
      return team ? this._units.filter(u => u.team === team) : this._units.slice();
    }

    // ── Damage / heal helpers ────────────────────────────────────────────────

    /**
     * Deal damage to a unit. Emits 'battle:unit_damaged' and 'battle:unit_died'.
     * @returns {number} the amount actually dealt
     */
    dealDamage(target, amount, source) {
      if (!target || target.dead) return 0;
      const before = target.hp;
      target.hp = Math.max(0, target.hp - Math.max(0, Math.round(amount)));
      const dealt = before - target.hp;
      this._emit('battle:unit_damaged', { unit: target, source, amount: dealt });
      if (target.hp <= 0 && !target.dead) {
        target.dead = true;
        this._emit('battle:unit_died', { unit: target, source });
      }
      return dealt;
    }

    /**
     * Heal a unit. Emits 'battle:unit_healed'.
     * @returns {number} the amount actually healed
     */
    heal(target, amount, source) {
      if (!target || target.dead) return 0;
      const before = target.hp;
      target.hp = Math.min(target.maxHp || target.hp + amount, target.hp + Math.max(0, Math.round(amount)));
      const healed = target.hp - before;
      this._emit('battle:unit_healed', { unit: target, source, amount: healed });
      return healed;
    }

    /** Force-end the battle with a result. */
    forceEnd(result) {
      this.finished = true;
      this.result   = result;
      this._emit('battle:complete', { result });
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    _beginRound() {
      // Order living units by agility desc, ties broken by current order
      this._round++;
      const living = this._units.filter(u => !u.dead);
      // Stable sort: tag with index, sort, strip
      this._order = living
        .map((u, i) => ({ u, i, ag: u.agility || 0 }))
        .sort((a, b) => (b.ag - a.ag) || (a.i - b.i))
        .map(o => o.u);
      this._idx = -1;

      this._emit('battle:round', { round: this._round, order: this._order.slice() });

      if (this._checkEnd()) return;

      // Move to first unit
      while (++this._idx < this._order.length) {
        const u = this._order[this._idx];
        if (!u.dead) {
          this._emit('battle:turn_start', { unit: u });
          return;
        }
      }
      // Empty round — call _beginRound again (shouldn't normally happen)
      if (this._order.length === 0) this.forceEnd('draw');
    }

    _checkEnd() {
      if (this.finished) return true;
      if (this._victory && this._victory(this._units)) {
        this.forceEnd('victory');
        return true;
      }
      if (this._defeat && this._defeat(this._units)) {
        this.forceEnd('defeat');
        return true;
      }
      return false;
    }

    _emit(name, detail) {
      if (this._engine && this._engine.events) this._engine.events.emit(name, detail);
    }

    update() {}
    render() {}
  }

  GF.TurnBasedBattleSystem = TurnBasedBattleSystem;

})(window.GF = window.GF || {});


// -- systems/MenuSystem.js ---------------------------------------

// GameFramework/framework/systems/MenuSystem.js
// Cursor-driven vertical menu — common to RPGs, strategy games, and any
// menu-heavy interface. Pure logic + draw helper; the game decides where
// it lives in the scene graph and which actions trigger which menus.
//
// Quick start:
//   const menu = new GF.CursorMenu({
//     items: [
//       { label: 'Attack',  value: 'attack',  enabled: true },
//       { label: 'Magic',   value: 'magic',   enabled: false },
//       { label: 'Item',    value: 'item' },
//       { label: 'Wait',    value: 'wait' },
//     ],
//     onSelect: (item) => console.log('chose', item.value),
//     onCancel: () => console.log('cancelled'),
//   });
//
//   // Each frame:
//   menu.update(engine.input);
//   menu.draw(ctx, x, y);
//
// Default key bindings:
//   ArrowUp / ArrowDown   move cursor
//   Enter / Space / KeyZ  select
//   Escape / Backspace / KeyX  cancel
//
// You can rebind via cfg.keys = { up:[...], down:[...], select:[...], cancel:[...] }
// or supply a custom action-based input layer (cfg.actions = { up, down, ... }).

(function (GF) {
  'use strict';

  const DEFAULT_KEYS = {
    up    : ['ArrowUp',   'KeyW'],
    down  : ['ArrowDown', 'KeyS'],
    left  : ['ArrowLeft', 'KeyA'],
    right : ['ArrowRight','KeyD'],
    select: ['Enter', 'Space', 'KeyZ'],
    cancel: ['Escape','Backspace','KeyX'],
  };

  const DEFAULT_STYLE = {
    width        : 160,
    rowHeight    : 22,
    padding      : 10,
    bgColor      : 'rgba(0,0,40,0.92)',
    borderColor  : '#88aaff',
    borderWidth  : 2,
    radius       : 4,
    font         : '14px monospace',
    textColor    : '#ffffff',
    disabledColor: '#666688',
    cursorColor  : '#ffdd44',
    selectedBg   : 'rgba(80,80,160,0.5)',
  };

  class CursorMenu {
    /**
     * @param {Object} cfg
     * @param {Array}  cfg.items     - [{label, value, enabled?, hint?}]
     * @param {Function} [cfg.onSelect] - (item) => void
     * @param {Function} [cfg.onCancel] - () => void
     * @param {Object} [cfg.keys]    - keymap overrides (see DEFAULT_KEYS)
     * @param {Object} [cfg.actions] - action-name overrides (see DEFAULT_KEYS)
     * @param {Object} [cfg.style]   - draw style overrides
     * @param {boolean}[cfg.wrap=true] - cursor wraps top/bottom
     * @param {number} [cfg.cursor=0]  - initial cursor index
     */
    constructor(cfg = {}) {
      this.items    = cfg.items || [];
      this.onSelect = cfg.onSelect || (() => {});
      this.onCancel = cfg.onCancel || (() => {});
      this.keys     = Object.assign({}, DEFAULT_KEYS, cfg.keys || {});
      this.actions  = cfg.actions || null;
      this.style    = Object.assign({}, DEFAULT_STYLE, cfg.style || {});
      this.wrap     = cfg.wrap !== false;
      this.cursor   = Math.max(0, Math.min(this.items.length - 1, cfg.cursor || 0));
      this.active   = true;
      this._lastInputT = 0;
    }

    setItems(items, keepCursor) {
      this.items = items || [];
      if (!keepCursor || this.cursor >= this.items.length) this.cursor = 0;
    }

    /** Move cursor to next enabled item (delta = +/-1). */
    move(delta) {
      if (!this.items.length) return;
      let i = this.cursor;
      for (let n = 0; n < this.items.length; n++) {
        i += delta;
        if (this.wrap) {
          if (i < 0) i = this.items.length - 1;
          if (i >= this.items.length) i = 0;
        } else {
          if (i < 0 || i >= this.items.length) return;
        }
        if (this.items[i].enabled !== false) {
          this.cursor = i;
          return;
        }
      }
    }

    /** Returns the currently highlighted item. */
    currentItem() { return this.items[this.cursor] || null; }

    /** Programmatic select — invokes onSelect without input. */
    select() {
      const item = this.currentItem();
      if (!item || item.enabled === false) return;
      this.onSelect(item);
    }

    /** Programmatic cancel. */
    cancel() { this.onCancel(); }

    // ── Per-frame input ───────────────────────────────────────────────────────

    /** Call once per frame. `input` is GF.InputManager. */
    update(input) {
      if (!this.active || !input) return;

      const pressed = (action) => {
        const codes = (this.actions && this.actions[action]) || this.keys[action] || [];
        for (let i = 0; i < codes.length; i++) {
          if (input.wasPressed(codes[i])) return true;
        }
        return false;
      };

      if (pressed('up'))     this.move(-1);
      if (pressed('down'))   this.move(+1);
      if (pressed('select')) this.select();
      if (pressed('cancel')) this.cancel();
    }

    // ── Drawing ───────────────────────────────────────────────────────────────

    /**
     * Compute total pixel size — useful for layout / centring.
     * @returns {{ width: number, height: number }}
     */
    measure() {
      const s = this.style;
      return {
        width : s.width,
        height: s.padding * 2 + this.items.length * s.rowHeight,
      };
    }

    /**
     * Draw the menu at top-left (x, y).
     */
    draw(ctx, x, y) {
      const s   = this.style;
      const m   = this.measure();
      const ui  = GF.UISystem;

      ui.drawPanel(ctx, x, y, m.width, m.height, {
        bgColor: s.bgColor, borderColor: s.borderColor,
        borderWidth: s.borderWidth, radius: s.radius,
      });

      ctx.save();
      ctx.font = s.font;
      ctx.textBaseline = 'middle';

      for (let i = 0; i < this.items.length; i++) {
        const it = this.items[i];
        const ry = y + s.padding + i * s.rowHeight + s.rowHeight / 2;

        if (i === this.cursor) {
          // Selection band
          ctx.fillStyle = s.selectedBg;
          ctx.fillRect(x + 4, ry - s.rowHeight / 2 + 2,
                       m.width - 8, s.rowHeight - 4);
          // Cursor arrow
          ctx.fillStyle = s.cursorColor;
          ctx.beginPath();
          ctx.moveTo(x + 8,  ry - 5);
          ctx.lineTo(x + 14, ry);
          ctx.lineTo(x + 8,  ry + 5);
          ctx.closePath();
          ctx.fill();
        }

        ctx.fillStyle = (it.enabled === false) ? s.disabledColor : s.textColor;
        ctx.fillText(it.label, x + 22, ry);

        if (it.hint) {
          ctx.fillStyle = s.disabledColor;
          ctx.textAlign = 'right';
          ctx.fillText(it.hint, x + m.width - s.padding, ry);
          ctx.textAlign = 'left';
        }
      }
      ctx.restore();
    }
  }

  GF.CursorMenu = CursorMenu;

})(window.GF = window.GF || {});


// -- systems/TouchControls.js ------------------------------------

// GameFramework/framework/systems/TouchControls.js
// On-canvas touch controls: virtual buttons and joysticks that inject input
// through InputManager's synthetic-action API, so game code keeps reading
// engine.input.isDown / wasPressed exactly as it does for the keyboard.
//
// Usage:
//   const touch = new GF.TouchControls();          // auto-enables on touch devices
//   engine.addSystem(touch);
//   touch.addButton({ id:'pause', action:'pause', label:'⏯', anchor:'bc', x:0,  y:42 });
//   touch.addButton({ id:'fire',  action:'fire',  label:'A',  anchor:'br', x:60, y:60, mode:'hold' });
//   touch.addJoystick({ id:'move', anchor:'bl', x:90, y:90,
//                       actions:{ up:'up', down:'down', left:'left', right:'right' } });
//   // Analog stick value (-1..1 per axis): touch.value('move')
//
// Buttons: mode 'tap' (default) fires wasPressed once; mode 'hold' keeps the
// action isDown while touched.
//
// Rendering: by default the system draws itself during the engine's system
// render pass, which runs BEFORE the game's onRender callback — a game that
// paints a HUD in onRender should pass { autoRender:false } and call
// touch.draw(ctx) at the end of its own onRender so the controls stay on top.
//
// Event handling is attached to the canvas' parent in the CAPTURE phase, so
// touches on a control never reach OrbitControls / game listeners on the
// canvas, while touches elsewhere pass through untouched.
//
// Detection: enabled automatically when the device reports touch support;
// override with { force:true } (always on) or { force:false } via .enabled.

(function (GF) {
  'use strict';

  class TouchControls {
    constructor(opts) {
      opts = opts || {};
      this.name = 'touch';
      this.enabled = opts.force !== undefined ? !!opts.force : TouchControls.isTouchDevice();
      this.autoRender = opts.autoRender !== undefined ? !!opts.autoRender : true;
      this.opacity = opts.opacity !== undefined ? opts.opacity : 0.55;

      this._buttons = [];
      this._sticks = [];
      this._pointers = new Map();   // pointerId → { kind:'button'|'stick', ref }
      this._engine = null;
      this._listeners = [];
    }

    static isTouchDevice() {
      if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
      if ((navigator.maxTouchPoints | 0) > 0) return true;
      // 'ontouchstart' in window is unreliable (false positives in emulated
      // DOMs and some desktop browsers) — prefer the pointer media query.
      try {
        return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
      } catch (_) {
        return false;
      }
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────

    init(engine) {
      this._engine = engine;
      const canvas = engine.canvas;
      canvas.style.touchAction = 'none';   // stop browser pan/zoom on the game

      // Capture phase on the parent → we run before canvas listeners
      // (OrbitControls, picking) and can swallow control touches.
      const parent = canvas.parentElement || document.body;
      const on = (type, fn) => {
        parent.addEventListener(type, fn, true);
        this._listeners.push([parent, type, fn]);
      };
      on('pointerdown', e => this._onDown(e));
      on('pointermove', e => this._onMove(e));
      on('pointerup', e => this._onUp(e));
      on('pointercancel', e => this._onUp(e));
    }

    destroy() {
      this._listeners.forEach(([el, type, fn]) => el.removeEventListener(type, fn, true));
      this._listeners = [];
      this._releaseAll();
    }

    // ── Control registration ──────────────────────────────────────────────

    /**
     * @param {Object} def
     * @param {string} def.id        unique id
     * @param {string} def.action    InputManager action (or key code) to inject
     * @param {string} [def.label]   text/emoji drawn on the button
     * @param {string} [def.anchor]  'tl'|'tr'|'bl'|'br'|'tc'|'bc' (default 'br')
     * @param {number} def.x, def.y  centre offset from the anchor, inward
     * @param {number} [def.r=26]    radius (circle) / half-size (rect)
     * @param {string} [def.mode]    'tap' (default) | 'hold'
     * @param {string} [def.shape]   'circle' (default) | 'rect'
     * @param {string} [def.color]   accent colour
     * @param {function} [def.onTap] optional callback fired on press
     */
    addButton(def) {
      this._buttons.push(Object.assign({
        r: 26, mode: 'tap', shape: 'circle', color: '#9bb8e8',
        anchor: 'br', label: '', pressed: false, visible: true,
      }, def));
      return this;
    }

    /**
     * @param {Object} def
     * @param {string} def.id
     * @param {string} [def.anchor='bl']
     * @param {number} def.x, def.y     centre offset from anchor, inward
     * @param {number} [def.radius=64]
     * @param {Object} [def.actions]    { up, down, left, right } actions to hold
     * @param {number} [def.deadzone=0.3]
     */
    addJoystick(def) {
      this._sticks.push(Object.assign({
        anchor: 'bl', radius: 64, deadzone: 0.3, actions: null,
        vx: 0, vy: 0, active: false, visible: true, color: '#9bb8e8',
      }, def));
      return this;
    }

    getButton(id) { return this._buttons.find(b => b.id === id) || null; }
    getJoystick(id) { return this._sticks.find(s => s.id === id) || null; }

    /** Analog joystick value: { x:-1..1, y:-1..1 } (y negative = up). */
    value(id) {
      const s = this.getJoystick(id);
      return s ? { x: s.vx, y: s.vy } : { x: 0, y: 0 };
    }

    // ── Geometry ──────────────────────────────────────────────────────────

    _center(c) {
      const W = this._engine.canvas.width, H = this._engine.canvas.height;
      switch (c.anchor) {
        case 'tl': return { x: c.x, y: c.y };
        case 'tr': return { x: W - c.x, y: c.y };
        case 'bl': return { x: c.x, y: H - c.y };
        case 'tc': return { x: W / 2 + c.x, y: c.y };
        case 'bc': return { x: W / 2 + c.x, y: H - c.y };
        default: return { x: W - c.x, y: H - c.y };   // br
      }
    }

    _toCanvas(e) {
      const canvas = this._engine.canvas;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      return {
        x: (e.clientX - rect.left) * canvas.width / rect.width,
        y: (e.clientY - rect.top) * canvas.height / rect.height,
      };
    }

    _hit(x, y) {
      const PAD = 12;
      for (const b of this._buttons) {
        if (!b.visible) continue;
        const c = this._center(b);
        if (Math.hypot(x - c.x, y - c.y) <= b.r + PAD) return { kind: 'button', ref: b };
      }
      for (const s of this._sticks) {
        if (!s.visible) continue;
        const c = this._center(s);
        if (Math.hypot(x - c.x, y - c.y) <= s.radius + PAD * 2) return { kind: 'stick', ref: s };
      }
      return null;
    }

    // ── Pointer handling (tests may call these with {clientX..} stubs) ────

    _onDown(e) {
      if (!this.enabled || !this._engine) return;
      const p = this._toCanvas(e);
      if (!p) return;
      const hit = this._hit(p.x, p.y);
      if (!hit) return;

      e.preventDefault && e.preventDefault();
      e.stopPropagation && e.stopPropagation();
      this._pointers.set(e.pointerId !== undefined ? e.pointerId : 1, hit);

      if (hit.kind === 'button') {
        const b = hit.ref;
        b.pressed = true;
        if (b.mode === 'hold') this._engine.input.pressAction(b.action);
        else this._engine.input.tapAction(b.action);
        if (b.onTap) b.onTap();
      } else {
        hit.ref.active = true;
        this._updateStick(hit.ref, p.x, p.y);
      }
    }

    _onMove(e) {
      if (!this.enabled || !this._engine) return;
      const id = e.pointerId !== undefined ? e.pointerId : 1;
      const grab = this._pointers.get(id);
      if (!grab) return;
      e.preventDefault && e.preventDefault();
      e.stopPropagation && e.stopPropagation();
      const p = this._toCanvas(e);
      if (!p) return;
      if (grab.kind === 'stick') this._updateStick(grab.ref, p.x, p.y);
    }

    _onUp(e) {
      if (!this._engine) return;
      const id = e.pointerId !== undefined ? e.pointerId : 1;
      const grab = this._pointers.get(id);
      if (!grab) return;
      e.preventDefault && e.preventDefault();
      e.stopPropagation && e.stopPropagation();
      this._pointers.delete(id);
      this._release(grab);
    }

    _release(grab) {
      if (grab.kind === 'button') {
        const b = grab.ref;
        b.pressed = false;
        if (b.mode === 'hold') this._engine.input.releaseAction(b.action);
      } else {
        const s = grab.ref;
        s.active = false;
        this._setStickVector(s, 0, 0);
      }
    }

    _releaseAll() {
      this._pointers.forEach(grab => this._release(grab));
      this._pointers.clear();
    }

    _updateStick(s, px, py) {
      const c = this._center(s);
      let dx = (px - c.x) / s.radius;
      let dy = (py - c.y) / s.radius;
      const len = Math.hypot(dx, dy);
      if (len > 1) { dx /= len; dy /= len; }
      this._setStickVector(s, dx, dy);
    }

    _setStickVector(s, vx, vy) {
      s.vx = vx; s.vy = vy;
      if (!s.actions) return;
      const inp = this._engine.input;
      const dz = s.deadzone;
      const want = {
        left: vx < -dz, right: vx > dz,
        up: vy < -dz, down: vy > dz,
      };
      ['left', 'right', 'up', 'down'].forEach(dir => {
        const action = s.actions[dir];
        if (!action) return;
        s._held = s._held || {};
        if (want[dir] && !s._held[dir]) { inp.pressAction(action); s._held[dir] = true; }
        else if (!want[dir] && s._held[dir]) { inp.releaseAction(action); s._held[dir] = false; }
      });
    }

    // ── Rendering ─────────────────────────────────────────────────────────

    update() {}

    render(ctx) {
      if (this.autoRender) this.draw(ctx);
    }

    /** Draw the controls. Call from your onRender if autoRender is false. */
    draw(ctx) {
      if (!this.enabled || !this._engine) return;
      ctx.save();

      this._buttons.forEach(b => {
        if (!b.visible) return;
        const c = this._center(b);
        ctx.globalAlpha = b.pressed ? Math.min(1, this.opacity + 0.35) : this.opacity;
        ctx.beginPath();
        if (b.shape === 'rect') {
          const r = b.r;
          ctx.rect(c.x - r, c.y - r * 0.7, r * 2, r * 1.4);
        } else {
          ctx.arc(c.x, c.y, b.r, 0, Math.PI * 2);
        }
        ctx.fillStyle = b.pressed ? 'rgba(70,100,160,0.9)' : 'rgba(16,20,34,0.8)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = b.color;
        ctx.stroke();
        if (b.label) {
          ctx.fillStyle = '#e8f0ff';
          ctx.font = `${Math.round(b.r * 0.9)}px "Segoe UI", system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(b.label, c.x, c.y + 1);
        }
      });

      this._sticks.forEach(s => {
        if (!s.visible) return;
        const c = this._center(s);
        ctx.globalAlpha = s.active ? Math.min(1, this.opacity + 0.25) : this.opacity;
        ctx.beginPath();
        ctx.arc(c.x, c.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16,20,34,0.55)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = s.color;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(c.x + s.vx * s.radius * 0.6, c.y + s.vy * s.radius * 0.6, s.radius * 0.38, 0, Math.PI * 2);
        ctx.fillStyle = s.active ? 'rgba(120,160,230,0.9)' : 'rgba(70,90,130,0.8)';
        ctx.fill();
      });

      ctx.restore();
    }
  }

  GF.TouchControls = TouchControls;

})(window.GF = window.GF || {});


// -- systems/StateMachine.js -------------------------------------

// GameFramework/framework/systems/StateMachine.js
// A small, allocation-free finite state machine with timed states and
// onEnter / onUpdate / onExit hooks. Useful for fighter character logic,
// boss phases, AI behaviour, dialog flow, etc.
//
// Example:
//   const fsm = new GF.StateMachine({
//     initial: 'idle',
//     states: {
//       idle: {
//         onEnter(prev) { /* … */ },
//         onUpdate(dt)  { if (input.wasPressed('attack')) fsm.go('punch'); },
//       },
//       punch: {
//         duration: 0.4,                // auto-transition after 0.4 s
//         onEnter() { anim.play('punch'); },
//         onComplete: 'idle',           // state to enter when duration elapses
//       },
//       hurt: {
//         duration: 0.3,
//         onEnter() { anim.play('hit'); },
//         onComplete: (fsm) => fsm.previous,  // dynamic transition
//       },
//     },
//   });
//
//   // Inside scene update:
//   fsm.update(dt);
//   fsm.go('punch');                    // explicit transition
//   if (fsm.is('idle', 'walk')) { … }   // multi-state membership test
//   fsm.timeInState                     // seconds since entering current state

(function (GF) {
  'use strict';

  function StateMachine(opts) {
    opts = opts || {};
    this.states  = opts.states || {};
    this.current = null;
    this.previous = null;
    this.timeInState = 0;
    this._duration   = 0;       // 0 = no auto-transition
    this._onComplete = null;    // string or function
    this._owner = opts.owner || null;

    if (opts.initial) this.go(opts.initial);
  }

  StateMachine.prototype.has = function (name) { return !!this.states[name]; };

  StateMachine.prototype.is = function (/* ...names */) {
    for (var i = 0; i < arguments.length; i++) {
      if (this.current === arguments[i]) return true;
    }
    return false;
  };

  StateMachine.prototype.go = function (name, payload) {
    if (!this.states[name]) {
      console.warn('[StateMachine] unknown state: ' + name);
      return false;
    }
    if (name === this.current) return false;

    var oldName = this.current;
    var oldDef  = oldName ? this.states[oldName] : null;
    var newDef  = this.states[name];

    if (oldDef && typeof oldDef.onExit === 'function') {
      oldDef.onExit.call(this._owner || this, name, this);
    }

    this.previous     = oldName;
    this.current      = name;
    this.timeInState  = 0;
    this._duration    = newDef.duration || 0;
    this._onComplete  = newDef.onComplete || null;

    if (typeof newDef.onEnter === 'function') {
      newDef.onEnter.call(this._owner || this, oldName, this, payload);
    }
    return true;
  };

  // Force re-enter: useful when the same state needs to restart its timer.
  StateMachine.prototype.restart = function (payload) {
    if (!this.current) return;
    var def = this.states[this.current];
    this.timeInState = 0;
    if (typeof def.onEnter === 'function') {
      def.onEnter.call(this._owner || this, this.current, this, payload);
    }
  };

  StateMachine.prototype.update = function (dt) {
    if (!this.current) return;
    this.timeInState += dt;

    var def = this.states[this.current];
    if (typeof def.onUpdate === 'function') {
      def.onUpdate.call(this._owner || this, dt, this);
    }

    // Auto-transition
    if (this._duration > 0 && this.timeInState >= this._duration) {
      var next = this._onComplete;
      if (typeof next === 'function') next = next.call(this._owner || this, this);
      if (next) this.go(next);
      else this._duration = 0;  // stop firing
    }
  };

  // Convenience: fire a state-specific handler if defined (e.g. on input).
  StateMachine.prototype.handle = function (event /* , ...args */) {
    var def = this.current && this.states[this.current];
    if (!def) return;
    var fn = def['on_' + event] || def[event];
    if (typeof fn === 'function') {
      var args = Array.prototype.slice.call(arguments, 1);
      args.push(this);
      return fn.apply(this._owner || this, args);
    }
  };

  GF.StateMachine = StateMachine;

})(window.GF = window.GF || {});


// -- systems/PlayerController.js ---------------------------------

// GameFramework/framework/systems/PlayerController.js
// A reusable 2D player movement controller that wires together a PhysicsBody,
// a SpriteAnimator, and the InputManager.
//
// Three preset modes cover the bulk of game types:
//   'platformer' — left/right run + jump (with optional double-jump)
//   'topdown'    — 8-direction free movement, no gravity
//   'sideways'   — left/right only, no jump (for fighting / arcade)
//
// Animation names follow a convention:
//   idle, walk (or run), jump (one-shot), fall, land (one-shot)
// Override via opts.animations to map convention -> your sprite's animation
// names (e.g. { walk: 'run', jump: 'leap' }).

(function (GF) {
  'use strict';

  var DEFAULT_ANIM = {
    idle: 'idle', walk: 'walk', run: 'run', jump: 'jump',
    fall: 'fall', land: 'land', crouch: 'crouch', attack: 'attack',
  };

  function PlayerController(opts) {
    opts = opts || {};
    this.body     = opts.body;          // GF.PhysicsBody
    this.animator = opts.animator;      // GF.SpriteAnimator
    this.input    = opts.input;         // engine.input
    this.mode     = opts.mode || 'platformer';

    this.speed       = opts.speed     || 220;     // px/s
    this.runSpeed    = opts.runSpeed  || this.speed * 1.5;
    this.jumpPower   = opts.jumpPower || 700;     // px/s upward velocity
    this.maxJumps    = opts.maxJumps  || 1;       // 2 = double-jump
    this.airControl  = opts.airControl != null ? opts.airControl : 0.6; // 0..1
    this.facing      = 1;               // 1 right, -1 left

    this.actions = Object.assign({
      left:  'left',  right: 'right', up:   'up',   down:  'down',
      jump:  'jump',  run:   'run',   crouch:'crouch',attack:'attack',
    }, opts.actions || {});

    this.animations = Object.assign({}, DEFAULT_ANIM, opts.animations || {});

    this._jumpsLeft  = this.maxJumps;
    this._wasGrounded = false;

    // Hooks
    this.onJump   = opts.onJump   || null;
    this.onLand   = opts.onLand   || null;
    this.onAttack = opts.onAttack || null;
  }

  PlayerController.prototype.update = function (dt) {
    var b = this.body, anim = this.animator, input = this.input;
    if (!b || !input) return;

    var L = input.isDown(this.actions.left);
    var R = input.isDown(this.actions.right);
    var U = input.isDown(this.actions.up);
    var D = input.isDown(this.actions.down);
    var running = input.isDown(this.actions.run);
    var moveSpeed = running ? this.runSpeed : this.speed;

    if (this.mode === 'topdown') {
      var vx = 0, vy = 0;
      if (L) vx -= 1; if (R) vx += 1;
      if (U) vy -= 1; if (D) vy += 1;
      if (vx !== 0 && vy !== 0) { vx *= 0.7071; vy *= 0.7071; }  // diag
      b.vx = vx * moveSpeed;
      b.vy = vy * moveSpeed;
      if (vx > 0) this.facing = 1; else if (vx < 0) this.facing = -1;
      this._playMoveAnim(vx !== 0 || vy !== 0, running);
    }
    else if (this.mode === 'sideways') {
      if (L)      { b.vx = -moveSpeed; this.facing = -1; }
      else if (R) { b.vx = moveSpeed;  this.facing =  1; }
      else        { b.vx = 0; }
      this._playMoveAnim(L || R, running);
    }
    else {  // platformer
      var grounded = b.grounded;
      var control  = grounded ? 1 : this.airControl;
      if (L)      { b.vx = -moveSpeed * control; this.facing = -1; }
      else if (R) { b.vx = moveSpeed  * control; this.facing =  1; }
      else if (grounded) { b.vx = 0; }

      // Jump
      if (input.wasPressed(this.actions.jump)) {
        if (grounded) this._jumpsLeft = this.maxJumps;
        if (this._jumpsLeft > 0) {
          b.vy = -this.jumpPower;
          this._jumpsLeft--;
          if (this.onJump) this.onJump(this);
        }
      }
      // Just landed?
      if (!this._wasGrounded && grounded) {
        if (this.onLand) this.onLand(this);
        this._jumpsLeft = this.maxJumps;
      }
      this._wasGrounded = grounded;

      this._playPlatformerAnim(L, R, grounded, running);
    }

    // Attack hook (any mode)
    if (input.wasPressed(this.actions.attack) && this.onAttack) {
      this.onAttack(this);
    }

    if (anim) {
      anim.flipX = (this.facing < 0);
      anim.update(dt);
    }
  };

  PlayerController.prototype._playMoveAnim = function (moving, running) {
    if (!this.animator) return;
    var a = this.animations;
    var name = !moving       ? a.idle
            : (running && this.animator.sprite && this.animator.sprite.animations[a.run]) ? a.run
            : a.walk;
    this.animator.play(name);
  };

  PlayerController.prototype._playPlatformerAnim = function (L, R, grounded, running) {
    if (!this.animator) return;
    var a = this.animations;
    var sprite = this.animator.sprite;
    var anims = sprite ? sprite.animations : {};
    if (!grounded) {
      if (this.body.vy < 0 && anims[a.jump]) this.animator.play(a.jump);
      else if (anims[a.fall])                this.animator.play(a.fall);
    } else if (L || R) {
      var name = (running && anims[a.run]) ? a.run : a.walk;
      this.animator.play(name);
    } else {
      this.animator.play(a.idle);
    }
  };

  GF.PlayerController = PlayerController;

})(window.GF = window.GF || {});


// -- systems/ScoreManager.js -------------------------------------

// GameFramework/framework/systems/ScoreManager.js
// Tracks score, persistent high score, and an optional combo multiplier.
// Persistence uses SaveSystem when available, falling back to localStorage.
//
// Events emitted on engine.events (when bound):
//   score:add        { amount, score, combo, multiplier }
//   score:newHigh    { score }
//   score:reset      { }
//   score:multiplier { multiplier, combo }

(function (GF) {
  'use strict';

  function ScoreManager(opts) {
    opts = opts || {};
    this.gameName       = opts.gameName     || 'GF';
    this.score          = 0;
    this.highScore      = 0;
    this.combo          = 0;
    this.comboMaxTime   = opts.comboMaxTime || 1.5;  // seconds
    this._comboTimer    = 0;
    this.multiplierStep = opts.multiplierStep || 0.5;  // +0.5x per combo
    this.multiplierCap  = opts.multiplierCap  || 4;
    this.events         = opts.events || null;       // EventBus
    this.save           = opts.save   || null;       // SaveSystem
    this._highScoreKey  = '_highScore_' + this.gameName;

    this._loadHighScore();
  }

  ScoreManager.prototype.update = function (dt) {
    if (this._comboTimer > 0) {
      this._comboTimer -= dt;
      if (this._comboTimer <= 0) this.resetCombo();
    }
  };

  ScoreManager.prototype.add = function (amount, opts) {
    opts = opts || {};
    if (opts.combo !== false) {
      this.combo++;
      this._comboTimer = this.comboMaxTime;
    }
    var multiplier = this.multiplier();
    var earned     = Math.round(amount * multiplier);
    this.score    += earned;

    if (this.events) {
      this.events.emit('score:add',
        { amount: earned, score: this.score, combo: this.combo, multiplier: multiplier });
      if (opts.combo !== false && this.combo > 1) {
        this.events.emit('score:multiplier', { multiplier: multiplier, combo: this.combo });
      }
    }

    if (this.score > this.highScore) {
      this.highScore = this.score;
      this._saveHighScore();
      if (this.events) this.events.emit('score:newHigh', { score: this.score });
    }

    return earned;
  };

  ScoreManager.prototype.subtract = function (amount) {
    this.score = Math.max(0, this.score - amount);
    if (this.events) this.events.emit('score:add',
      { amount: -amount, score: this.score, combo: this.combo, multiplier: 1 });
  };

  ScoreManager.prototype.multiplier = function () {
    if (this.combo <= 1) return 1;
    return Math.min(this.multiplierCap, 1 + (this.combo - 1) * this.multiplierStep);
  };

  ScoreManager.prototype.resetCombo = function () {
    if (this.combo === 0) return;
    this.combo = 0;
    this._comboTimer = 0;
    if (this.events) this.events.emit('score:multiplier', { multiplier: 1, combo: 0 });
  };

  ScoreManager.prototype.reset = function () {
    this.score = 0;
    this.resetCombo();
    if (this.events) this.events.emit('score:reset', {});
  };

  ScoreManager.prototype.resetHighScore = function () {
    this.highScore = 0;
    this._saveHighScore();
  };

  ScoreManager.prototype._loadHighScore = function () {
    try {
      if (this.save && this.save.read) {
        var rec = this.save.read(this._highScoreKey);
        if (rec && rec.data && typeof rec.data.highScore === 'number') {
          this.highScore = rec.data.highScore;
          return;
        }
      }
      var raw = localStorage.getItem('GF_HIGHSCORE_' + this.gameName);
      if (raw) this.highScore = parseInt(raw, 10) || 0;
    } catch (e) { /* ignore */ }
  };

  ScoreManager.prototype._saveHighScore = function () {
    try {
      if (this.save && this.save.write) {
        this.save.write(this._highScoreKey, { highScore: this.highScore });
        return;
      }
      localStorage.setItem('GF_HIGHSCORE_' + this.gameName, String(this.highScore));
    } catch (e) { /* ignore */ }
  };

  GF.ScoreManager = ScoreManager;

})(window.GF = window.GF || {});


// -- systems/WaveSpawner.js --------------------------------------

// GameFramework/framework/systems/WaveSpawner.js
// Generic wave-based enemy spawner. Defines a sequence of waves where each
// wave is a list of {kind, count, spacing} entries; the spawner emits one
// enemy at a time via a user-provided spawn callback, then progresses to the
// next wave when all enemies from the current wave are dead.
//
// Designed for shooters (SpaceInvaders), tower-defense, survival modes, etc.
//
// Example:
//   const waves = [
//     { delay: 0.5, entries: [
//       { kind: 'alienSquid', count: 8, spacing: 0.15 },
//       { kind: 'alienCrab',  count: 8, spacing: 0.15 },
//     ]},
//     { delay: 1.0, entries: [
//       { kind: 'alienOctopus', count: 12, spacing: 0.10 },
//     ], boss: true },
//   ];
//
//   const spawner = new GF.WaveSpawner({
//     waves,
//     spawn: (kind, info) => spawnEnemy(kind, info),
//     onWaveStart: w => console.log('wave', w),
//     onWaveClear: w => console.log('clear', w),
//     onAllClear:  () => console.log('victory!'),
//   });
//   spawner.start();
//   ...
//   spawner.update(dt);                    // advance scheduling
//   spawner.notifyKilled(enemy);          // tell the spawner an enemy died

(function (GF) {
  'use strict';

  function WaveSpawner(opts) {
    opts = opts || {};
    this.waves       = opts.waves || [];
    this.spawn       = opts.spawn;             // (kind, info) => entity
    this.onWaveStart = opts.onWaveStart || null;
    this.onWaveClear = opts.onWaveClear || null;
    this.onAllClear  = opts.onAllClear  || null;

    this.events      = opts.events || null;    // optional EventBus
    this.eventNamespace = opts.eventNamespace || 'wave';

    this.difficulty  = opts.difficulty || 1;   // multiplier on counts
    this.difficultyRamp = opts.difficultyRamp || 0;  // +ramp per wave

    this._reset();
  }

  WaveSpawner.prototype._reset = function () {
    this.currentWaveIndex = -1;
    this.currentEntry     = null;
    this._delayTimer      = 0;
    this._spawnTimer      = 0;
    this._waveAlive       = 0;
    this._entryQueue      = [];
    this._entriesLeft     = 0;
    this._active          = false;
    this._waitingForClear = false;
  };

  WaveSpawner.prototype.start = function () {
    this._reset();
    this._active = true;
    this._advanceWave();
  };

  WaveSpawner.prototype.stop = function () {
    this._active = false;
  };

  WaveSpawner.prototype.update = function (dt) {
    if (!this._active) return;

    if (this._delayTimer > 0) {
      this._delayTimer -= dt;
      return;
    }

    // Currently emitting a wave's entries
    if (this.currentEntry) {
      this._spawnTimer -= dt;
      while (this._spawnTimer <= 0 && this.currentEntry && this.currentEntry.remaining > 0) {
        this._spawnOne();
        this._spawnTimer += this.currentEntry.spacing || 0.2;
      }
      if (this.currentEntry && this.currentEntry.remaining === 0) {
        this._nextEntry();
      }
    }
  };

  WaveSpawner.prototype._spawnOne = function () {
    if (!this.spawn) return;
    var entry = this.currentEntry;
    var info  = {
      waveIndex: this.currentWaveIndex,
      kind:      entry.kind,
      indexInEntry: entry.spawned,
      total:     entry.count,
    };
    var ent = this.spawn(entry.kind, info);
    entry.remaining--;
    entry.spawned++;
    this._waveAlive++;
    if (this.events) this.events.emit(this.eventNamespace + ':spawn', { entity: ent, info: info });
  };

  WaveSpawner.prototype._nextEntry = function () {
    if (this._entriesLeft > 0) {
      this.currentEntry = this._entryQueue.shift();
      this._entriesLeft--;
      this._spawnTimer = 0;
    } else {
      this.currentEntry = null;
      this._waitingForClear = true;
    }
  };

  WaveSpawner.prototype._advanceWave = function () {
    this._waitingForClear = false;
    this.currentWaveIndex++;
    if (this.currentWaveIndex >= this.waves.length) {
      this._active = false;
      if (this.onAllClear) this.onAllClear();
      if (this.events) this.events.emit(this.eventNamespace + ':all_clear', {});
      return;
    }

    var wave = this.waves[this.currentWaveIndex];
    var diffMul = this.difficulty + this.currentWaveIndex * this.difficultyRamp;
    this._entryQueue = (wave.entries || []).map(function (e) {
      return {
        kind:      e.kind,
        count:     Math.max(1, Math.floor((e.count || 1) * diffMul)),
        remaining: Math.max(1, Math.floor((e.count || 1) * diffMul)),
        spawned:   0,
        spacing:   e.spacing || 0.2,
        meta:      e.meta || null,
      };
    });
    this._entriesLeft  = this._entryQueue.length;
    this._delayTimer   = wave.delay || 0;
    this._waveAlive    = 0;

    if (this.onWaveStart) this.onWaveStart(this.currentWaveIndex, wave);
    if (this.events) this.events.emit(this.eventNamespace + ':start', { wave: this.currentWaveIndex });

    this._nextEntry();
  };

  // Game must call this when an enemy spawned by us is destroyed.
  WaveSpawner.prototype.notifyKilled = function (entity) {
    if (this._waveAlive > 0) this._waveAlive--;
    if (this._waitingForClear && this._waveAlive === 0) {
      var idx = this.currentWaveIndex;
      if (this.onWaveClear) this.onWaveClear(idx, this.waves[idx]);
      if (this.events) this.events.emit(this.eventNamespace + ':clear', { wave: idx });
      this._advanceWave();
    }
  };

  Object.defineProperty(WaveSpawner.prototype, 'isActive', {
    get: function () { return this._active; },
  });
  Object.defineProperty(WaveSpawner.prototype, 'aliveCount', {
    get: function () { return this._waveAlive; },
  });

  GF.WaveSpawner = WaveSpawner;

})(window.GF = window.GF || {});


// -- systems/ParallaxSystem.js -----------------------------------

// GameFramework/framework/systems/ParallaxSystem.js
// Multi-layer horizontal/vertical parallax scrolling.
//
// You give the system a list of layer descriptors. Each layer has its own
// scroll factor (0 = static like sky, 1 = same speed as the camera/world).
// The framework draws layers in order; you supply a per-layer draw callback.
//
// Use it for:
//   - infinite-side-scroller backgrounds (RoadToSkagen)
//   - skyboxes / starfield (SpaceInvaders)
//   - menus with depth
//
// Example:
//   const parallax = new GF.ParallaxSystem({
//     layers: [
//       { factor: 0.1, draw: drawSky      },   // moves slowest
//       { factor: 0.4, draw: drawMountains, tile: 800 },  // tiles every 800 px
//       { factor: 0.8, draw: drawTrees,    tile: 400 },
//       { factor: 1.0, draw: drawRoad     },   // foreground
//     ],
//   });
//   ...
//   parallax.scrollX = camera.x;
//   parallax.draw(ctx);

(function (GF) {
  'use strict';

  function ParallaxSystem(opts) {
    opts = opts || {};
    this.layers   = (opts.layers || []).map(function (l) { return Object.assign({}, l); });
    this.scrollX  = opts.scrollX || 0;
    this.scrollY  = opts.scrollY || 0;
    this.viewportW = opts.viewportW || 800;
    this.viewportH = opts.viewportH || 450;
  }

  ParallaxSystem.prototype.addLayer = function (layer) {
    this.layers.push(Object.assign({}, layer));
    return this.layers[this.layers.length - 1];
  };

  ParallaxSystem.prototype.removeLayer = function (layer) {
    var i = this.layers.indexOf(layer);
    if (i >= 0) this.layers.splice(i, 1);
  };

  // Update is optional — only useful if a layer wants its own animation timer.
  ParallaxSystem.prototype.update = function (dt) {
    for (var i = 0; i < this.layers.length; i++) {
      var l = this.layers[i];
      if (typeof l.update === 'function') l.update(dt);
    }
  };

  ParallaxSystem.prototype.draw = function (ctx) {
    for (var i = 0; i < this.layers.length; i++) {
      var l = this.layers[i];
      var ox = -this.scrollX * (l.factor || 1) - (l.offsetX || 0);
      var oy = -this.scrollY * (l.factorY != null ? l.factorY : 0) - (l.offsetY || 0);

      ctx.save();
      if (l.tile) {
        // Wrap layer horizontally every l.tile pixels.
        var t = l.tile;
        var startX = ox % t;
        if (startX > 0) startX -= t;
        for (var x = startX; x < this.viewportW; x += t) {
          ctx.save();
          ctx.translate(x, oy);
          if (l.draw) l.draw(ctx, l, this);
          ctx.restore();
        }
      } else {
        ctx.translate(ox, oy);
        if (l.draw) l.draw(ctx, l, this);
      }
      ctx.restore();
    }
  };

  GF.ParallaxSystem = ParallaxSystem;

})(window.GF = window.GF || {});


// -- scenes/TitleScene.js ----------------------------------------

// GameFramework/framework/scenes/TitleScene.js
// Reusable title / start scene template.
//
// Configure via constructor options; subclass and override draw/update if you
// need something custom. Common controls:
//   - Press confirm  -> opts.onStart(engine)
//   - Press menu     -> opts.onMenu  (e.g. options screen)
//
// Example:
//   class MyTitle extends GF.TitleScene { constructor() { super({
//     title:    'COSMIC CONQUEST',
//     subtitle: 'Press SPACE to start',
//     bgColor:  '#0a0a2e',
//     onStart:  (engine) => engine.systems.scenes.replace(new GameScene(), engine),
//   }); } }

(function (GF) {
  'use strict';

  if (!GF.Scene) {
    // Provide a no-op base so this file can load before SceneManager.
    GF.Scene = function () {};
  }

  function TitleScene(opts) {
    opts = opts || {};
    this.opts = Object.assign({
      title:        'GAME',
      subtitle:     'Press SPACE to start',
      bgColor:      '#0a0a2e',
      titleColor:   '#ffffff',
      subtitleColor:'#cccccc',
      titleFont:    'bold 48px monospace',
      subtitleFont: '20px monospace',
      blink:        true,            // pulse the subtitle
      confirmAction:'jump',          // input action that starts the game
      menuAction:   null,            // optional second action
      bossAction:   null,            // optional boss shortcut action
      onStart:      null,            // (engine) => void
      onMenu:       null,
      onBossStart:  null,
      drawBackground: null,          // (ctx, scene) => void  (optional)
    }, opts);
    this._t = 0;
  }

  TitleScene.prototype = Object.create(GF.Scene.prototype);
  TitleScene.prototype.constructor = TitleScene;

  TitleScene.prototype.init = function (engine) { this.engine = engine; };

  TitleScene.prototype.update = function (dt, engine) {
    this._t += dt;
    var input = engine.input;
    if (input && input.wasPressed(this.opts.confirmAction) && this.opts.onStart) {
      this.opts.onStart(engine);
    }
    if (input && this.opts.menuAction && input.wasPressed(this.opts.menuAction) && this.opts.onMenu) {
      this.opts.onMenu(engine);
    }
    if (input && this.opts.bossAction && input.wasPressed(this.opts.bossAction) && this.opts.onBossStart) {
      this.opts.onBossStart(engine);
    }
  };

  TitleScene.prototype.render = function (ctx, engine) {
    var W = engine.canvas.width, H = engine.canvas.height;

    if (this.opts.drawBackground) {
      this.opts.drawBackground(ctx, this);
    } else {
      ctx.fillStyle = this.opts.bgColor;
      ctx.fillRect(0, 0, W, H);
    }

    var ui = engine.systems && engine.systems.ui ? engine.systems.ui : GF.UISystem;
    if (ui && ui.drawText) {
      ui.drawText(ctx, this.opts.title, W / 2, H * 0.4, {
        font: this.opts.titleFont, color: this.opts.titleColor,
        align: 'center', baseline: 'middle',
        shadow: true, glow: this.opts.titleColor, glowBlur: 10,
      });
      var sub = this.opts.subtitle;
      if (sub) {
        var alpha = this.opts.blink ? (0.55 + 0.45 * Math.sin(this._t * 4)) : 1;
        ctx.save();
        ctx.globalAlpha = alpha;
        ui.drawText(ctx, sub, W / 2, H * 0.6, {
          font: this.opts.subtitleFont, color: this.opts.subtitleColor,
          align: 'center', baseline: 'middle',
        });
        ctx.restore();
      }
    } else {
      // UISystem unavailable — minimal fallback
      ctx.fillStyle = this.opts.titleColor;
      ctx.font = this.opts.titleFont;
      ctx.textAlign = 'center';
      ctx.fillText(this.opts.title, W / 2, H * 0.4);
      ctx.font = this.opts.subtitleFont;
      ctx.fillText(this.opts.subtitle, W / 2, H * 0.6);
    }
  };

  GF.TitleScene = TitleScene;

})(window.GF = window.GF || {});


// -- scenes/GameOverScene.js -------------------------------------

// GameFramework/framework/scenes/GameOverScene.js
// Reusable game-over scene template. Shows a message + score + high score
// and waits for a "restart" input action.
//
// Example:
//   game.scenes.replaceWithTransition(new GF.GameOverScene({
//     score: scoreManager.score,
//     highScore: scoreManager.highScore,
//     newRecord: scoreManager.score === scoreManager.highScore,
//     onRestart: () => game.scenes.replace(new GameScene(), game.engine),
//     onMenu:    () => game.scenes.replace(new TitleScene(), game.engine),
//   }), { type: 'fade', duration: 0.6 });

(function (GF) {
  'use strict';

  if (!GF.Scene) GF.Scene = function () {};

  function GameOverScene(opts) {
    opts = opts || {};
    this.opts = Object.assign({
      title:        'GAME OVER',
      subtitle:     'Press SPACE to restart',
      bgColor:      'rgba(0,0,0,0.85)',
      titleColor:   '#ff5555',
      titleFont:    'bold 56px monospace',
      subtitleFont: '20px monospace',
      scoreFont:    '24px monospace',
      score:        null,
      highScore:    null,
      newRecord:    false,
      restartAction:'jump',
      menuAction:   null,
      onRestart:    null,
      onMenu:       null,
      victory:      false,           // toggle palette/title for "victory!" version
    }, opts);
    if (this.opts.victory) {
      if (this.opts.title    === 'GAME OVER') this.opts.title    = 'VICTORY!';
      if (this.opts.titleColor === '#ff5555') this.opts.titleColor = '#55ff77';
    }
    this._t = 0;
  }

  GameOverScene.prototype = Object.create(GF.Scene.prototype);
  GameOverScene.prototype.constructor = GameOverScene;

  GameOverScene.prototype.init = function (engine) { this.engine = engine; };

  GameOverScene.prototype.update = function (dt, engine) {
    this._t += dt;
    var input = engine.input;
    if (input && input.wasPressed(this.opts.restartAction) && this.opts.onRestart) {
      this.opts.onRestart(engine);
    }
    if (input && this.opts.menuAction && input.wasPressed(this.opts.menuAction) && this.opts.onMenu) {
      this.opts.onMenu(engine);
    }
  };

  GameOverScene.prototype.render = function (ctx, engine) {
    var W = engine.canvas.width, H = engine.canvas.height;
    ctx.fillStyle = this.opts.bgColor;
    ctx.fillRect(0, 0, W, H);

    var ui = engine.systems && engine.systems.ui ? engine.systems.ui : GF.UISystem;

    var titleY = H * 0.32;
    var scoreY = H * 0.50;
    var highY  = H * 0.58;
    var subY   = H * 0.78;

    if (ui && ui.drawText) {
      ui.drawText(ctx, this.opts.title, W / 2, titleY, {
        font: this.opts.titleFont, color: this.opts.titleColor,
        align: 'center', baseline: 'middle',
        shadow: true, glow: this.opts.titleColor, glowBlur: 16,
      });
      if (this.opts.score != null) {
        ui.drawText(ctx, 'SCORE  ' + this.opts.score, W / 2, scoreY, {
          font: this.opts.scoreFont, color: '#ffffff', align: 'center', baseline: 'middle',
        });
      }
      if (this.opts.highScore != null) {
        var label = this.opts.newRecord ? 'NEW HIGH SCORE  ' : 'HIGH SCORE  ';
        ui.drawText(ctx, label + this.opts.highScore, W / 2, highY, {
          font: this.opts.scoreFont,
          color: this.opts.newRecord ? '#ffd54a' : '#cccccc',
          align: 'center', baseline: 'middle',
        });
      }
      var alpha = 0.55 + 0.45 * Math.sin(this._t * 4);
      ctx.save(); ctx.globalAlpha = alpha;
      ui.drawText(ctx, this.opts.subtitle, W / 2, subY, {
        font: this.opts.subtitleFont, color: '#cccccc',
        align: 'center', baseline: 'middle',
      });
      ctx.restore();
    } else {
      ctx.fillStyle = this.opts.titleColor;
      ctx.font = this.opts.titleFont;
      ctx.textAlign = 'center';
      ctx.fillText(this.opts.title, W / 2, titleY);
      if (this.opts.score != null) {
        ctx.fillStyle = '#fff';
        ctx.font = this.opts.scoreFont;
        ctx.fillText('SCORE  ' + this.opts.score, W / 2, scoreY);
      }
      ctx.font = this.opts.subtitleFont;
      ctx.fillText(this.opts.subtitle, W / 2, subY);
    }
  };

  GF.GameOverScene = GameOverScene;

})(window.GF = window.GF || {});


// -- scenes/GameScene.js -----------------------------------------

// GameFramework/framework/scenes/GameScene.js
// A scene the framework owns, so games never write (or edit) one.
//
// The problem this solves: a hand-written Main scene grows into a monolith that
// holds spawning, collision, HUD, input and game-over logic all at once. Every
// new feature means editing it — and if it's locked, monkey-patching its
// prototype from a Patch*.js file. Both are the same failure: the scene is the
// only extension point.
//
// GF.GameScene has no game logic of its own. It owns an EntityWorld, a phase,
// and a shared `state` bag, and it runs MODULES that register themselves:
//
//   // modules/Hud.js
//   GF.sceneModule('Hud', {
//     scene: 'Main',
//     layer: 100,                       // render order; world draws at 0
//     phases: ['play'],                 // only while scene.phase === 'play'
//     render(ctx, scene) {
//       GF.UISystem.drawText(ctx, 'Score: ' + scene.state.score, 12, 12, {...});
//     },
//   });
//
// Adding a feature = adding a file. Nothing existing is touched, so there is no
// locked file to work around and no prototype to patch.
//
// Module spec (every field optional):
//   scene   'Main' | ['Main','Bonus'] | '*'   which scenes it attaches to (default '*')
//   order   number   update order; modules < 0 run BEFORE world.update, >= 0 after
//   layer   number   render order; modules < 0 draw BEFORE world.draw, >= 0 after
//   phases  ['play'] run only in these phases (default: every phase)
//   state   {}       defaults merged into scene.state on enter
//   init(scene, engine)          once, when the scene is first pushed
//   enter(scene, engine)         each time the scene becomes active
//   update(dt, scene, engine)
//   render(ctx, scene, engine)
//   onPhase(phase, prev, scene)  when scene.setPhase() changes the phase
//   exit(scene, engine) / destroy(scene, engine)
//
// Each scene instance gets its own module instance (via Object.create), so a
// module can keep private state with a plain `this.foo = …` inside init/enter
// without leaking it between scenes or across a restart.

(function (GF) {
  'use strict';

  GF._sceneModules = GF._sceneModules || [];

  /**
   * Register a scene module. Modules are matched to scenes by name; a module
   * registered for a scene that never runs is simply inert.
   */
  GF.sceneModule = function (name, spec) {
    if (!spec) { console.warn('GF.sceneModule("' + name + '"): missing spec'); return GF; }
    GF._sceneModules.push({ name: name, spec: spec });
    return GF;
  };

  function boundTo(m, sceneName) {
    var want = m.spec.scene;
    if (want == null || want === '*') return true;
    return Array.isArray(want) ? want.indexOf(sceneName) !== -1 : want === sceneName;
  }

  /**
   * Every module registered for `sceneName`, in registration order.
   *
   * `sel` lets a scene borrow another scene's module stack instead of forcing
   * every module to list it. A hand-placed level typically wants all of the
   * gameplay a scene already has, minus whatever it replaces:
   *
   *   { from: 'Main', exclude: ['Waves', 'Formation'] }
   *
   * …which is "play like Main, but I place the entities myself". Without this a
   * new scene name would attach nothing, and reusing combat/HUD would mean
   * editing every one of those modules' `scene` fields.
   *
   *   from     string|string[]  also take modules bound to these scene names
   *   include  string[]         force these in, whatever they are bound to
   *   exclude  string[]         drop these by name (wins over from/include)
   */
  GF.sceneModulesFor = function (sceneName, sel) {
    sel = sel || {};
    var names = [sceneName];
    if (sel.from) {
      (Array.isArray(sel.from) ? sel.from : [sel.from]).forEach(function (n) {
        if (names.indexOf(n) === -1) names.push(n);
      });
    }
    var inc = sel.include || [];
    var exc = sel.exclude || [];
    // Filtering the registry in place keeps registration order, which the
    // scene's stable sort relies on to break order/layer ties.
    return GF._sceneModules.filter(function (m) {
      if (exc.indexOf(m.name) !== -1) return false;
      if (inc.indexOf(m.name) !== -1) return true;
      return names.some(function (n) { return boundTo(m, n); });
    });
  };

  function num(v, dflt) { return typeof v === 'number' ? v : dflt; }

  class GameScene extends GF.Scene {
    /**
     * @param {string} name   scene name modules attach to (default 'Main')
     * @param {Object} [opts] { phase, state, world, modules } overrides.
     *        `modules` is the selector documented on GF.sceneModulesFor.
     */
    constructor(name, opts) {
      super();
      opts = opts || {};
      this.sceneName = name || 'Main';
      this.phase = opts.phase || 'play';
      this.state = Object.assign({}, opts.state);
      this.world = null;
      this.engine = null;
      this.events = new GF.EventBus();
      this._mods = [];
      this._initialState = Object.assign({}, opts.state);
      this._opts = opts;
    }

    // ── module access ───────────────────────────────────────────────────────
    /** The live instance of a named module attached to this scene, or null. */
    module(name) {
      var m = this._mods.find(function (x) { return x.name === name; });
      return m ? m.inst : null;
    }
    /** True when a named module is attached (feature detection for modules). */
    has(name) { return !!this.module(name); }

    // ── phase ───────────────────────────────────────────────────────────────
    /** Switch phase, notifying modules. Phases gate which modules run. */
    setPhase(phase) {
      if (phase === this.phase) return this;
      var prev = this.phase;
      this.phase = phase;
      for (var i = 0; i < this._mods.length; i++) {
        var inst = this._mods[i].inst;
        if (inst.onPhase) inst.onPhase(phase, prev, this, this.engine);
      }
      this.events.emit('scene:phase', { phase: phase, prev: prev, scene: this });
      return this;
    }

    _runs(inst) {
      return !inst.phases || inst.phases.indexOf(this.phase) !== -1;
    }

    // ── scene stack helpers (modules use these instead of reaching for G.game) ─
    _manager() {
      var g = GF.game || (window.GAME && window.GAME.game);
      return (g && g.scenes) || null;
    }
    /** Resolve a scene NAME to an instance: a registered class, else a GameScene. */
    static create(name, opts) {
      var reg = (window.GAME && window.GAME.scenes) || {};
      var Cls = reg[name];
      if (Cls && Cls !== GameScene && typeof Cls === 'function') return new Cls(opts);
      return new GameScene(name, opts);
    }
    push(name, opts) {
      var mgr = this._manager();
      if (mgr) mgr.push(typeof name === 'string' ? GameScene.create(name, opts) : name, this.engine);
      return this;
    }
    replace(name, opts) {
      var mgr = this._manager();
      if (mgr) mgr.replace(typeof name === 'string' ? GameScene.create(name, opts) : name, this.engine);
      return this;
    }
    pop() {
      var mgr = this._manager();
      if (mgr) mgr.pop(this.engine);
      return this;
    }

    // ── lifecycle ───────────────────────────────────────────────────────────
    init(engine) {
      this.engine = engine;

      this.world = this._opts.world || new GF.EntityWorld();
      // Driven by this scene, NOT registered as an engine system — a scene that
      // is covered on the stack must stop simulating.
      if (this.world.init) this.world.init(engine);

      // Per-scene config from GAME_CONFIG.scenes[name], so tuning needs no code.
      var cfgAll = (GF.GAME_CONFIG && GF.GAME_CONFIG.scenes) || {};
      this.config = cfgAll[this.sceneName] || {};

      var self = this;
      this._mods = GF.sceneModulesFor(this.sceneName, this._opts.modules).map(function (m) {
        // Object.create, so a module can keep per-scene-instance state with a
        // plain `this.foo = …` while sharing its hooks via the prototype.
        var inst = Object.create(m.spec);
        inst._name = m.name;
        return { name: m.name, inst: inst, order: num(inst.order, 0), layer: num(inst.layer, 0) };
      });
      // Stable sort: registration order breaks ties.
      this._mods.forEach(function (m, i) { m._i = i; });
      this._updates = this._mods.slice().sort(function (a, b) { return a.order - b.order || a._i - b._i; });
      this._renders = this._mods.slice().sort(function (a, b) { return a.layer - b.layer || a._i - b._i; });

      this._each('init', engine);
    }

    enter(engine) {
      this.engine = engine;
      // Re-entering the scene resets to the declared starting state, so a
      // restart never inherits the previous run's leftovers.
      this.state = Object.assign({}, this._initialState);
      this._mods.forEach(function (m) {
        if (m.inst.state) Object.assign(this.state, m.inst.state);
      }, this);
      this.phase = this._opts.phase || 'play';
      this._each('enter', engine);
    }

    update(dt, engine) {
      var list = this._updates, i, m;
      for (i = 0; i < list.length; i++) {
        m = list[i];
        if (m.order >= 0) break;
        if (m.inst.update && this._runs(m.inst)) m.inst.update(dt, this, engine);
      }
      if (this.world && this._worldRuns()) this.world.update(dt);
      for (; i < list.length; i++) {
        m = list[i];
        if (m.inst.update && this._runs(m.inst)) m.inst.update(dt, this, engine);
      }
    }

    render(ctx, engine) {
      var list = this._renders, i, m;
      for (i = 0; i < list.length; i++) {
        m = list[i];
        if (m.layer >= 0) break;
        if (m.inst.render && this._runs(m.inst)) m.inst.render(ctx, this, engine);
      }
      if (this.world && this._worldRuns()) this.world.draw(ctx);
      for (; i < list.length; i++) {
        m = list[i];
        if (m.inst.render && this._runs(m.inst)) m.inst.render(ctx, this, engine);
      }
    }

    /** Phases in which the entity world simulates/draws. Default: all. */
    _worldRuns() {
      var only = this.config.worldPhases;
      return !only || only.indexOf(this.phase) !== -1;
    }

    exit(engine)    { this._each('exit', engine); }
    destroy(engine) { this._each('destroy', engine); if (this.world) this.world.clear(); }

    _each(hook, engine) {
      for (var i = 0; i < this._mods.length; i++) {
        var inst = this._mods[i].inst;
        if (inst[hook]) inst[hook](this, engine);
      }
    }
  }

  GF.GameScene = GameScene;

})(window.GF = window.GF || {});


// -- core/SceneData.js -------------------------------------------

// GameFramework/framework/core/SceneData.js
// Data-authored levels: the placement half of a scene as a JSON document, so a
// level can be laid out in tools/editor.html instead of written as spawn calls.
//
// This does NOT introduce a second scene system. A level document produces a
// GF.GameScene (see framework/scenes/GameScene.js) — the same scene class the
// rest of the framework uses — so every GF.sceneModule the game already has
// runs unchanged. The document only supplies what a GUI can honestly own:
//
//   which scene it is        "scene": "Boss"
//   which modules attach     "modules": { "from": "Main", "exclude": ["Waves"] }
//   what is placed, where    "entities": [ { "prefab": "boss", "x": 384, … } ]
//   simple tag-vs-tag rules  "overlaps": [ { "a": "shot", "b": "boss", … } ]
//   starting state / phase   "state": { "level": 5 }
//
// Everything else — movement, firing, scoring, HUD — stays in behaviors and
// modules, which is where code belongs. A level is a layout, not a program.
//
//   // scenes/boot.js
//   G.scenes.Boss = GF.dataScene('boss');     // levels/boss.json, preloaded
//                                             // by GameLoader from the manifest
//
// The `modules` selector is what makes hand-placed levels practical in a game
// built on generated waves: "play exactly like Main, but I place the entities"
// is `{ from: 'Main', exclude: ['Waves', 'Formation'] }` — no edits to any of
// Main's modules.

(function (GF) {
  'use strict';

  // Level documents preloaded by GameLoader (manifest `levels`), keyed by name.
  GF._levels = GF._levels || {};

  /** Register a level document under a name (GameLoader does this for you). */
  GF.level = function (name, doc) { GF._levels[name] = doc; return GF; };

  /** Look up a preloaded level document. */
  GF.getLevel = function (name) { return GF._levels[name] || null; };

  // ── declarative overlap actions ────────────────────────────────────────────
  // The editor can only offer rules it can round-trip through JSON, so the
  // common shapes get names. Anything richer belongs in a sceneModule.
  var OVERLAP_ACTIONS = {
    destroyA:    function (a) { a.destroy(); },
    destroyB:    function (a, b) { b.destroy(); },
    destroyBoth: function (a, b) { a.destroy(); b.destroy(); },
    nothing:     function () {},
  };

  /** Register a custom named overlap action usable from level JSON. */
  GF.overlapAction = function (name, fn) { OVERLAP_ACTIONS[name] = fn; return GF; };

  /** Names of the overlap actions available (the editor lists these). */
  GF.overlapActions = function () { return Object.keys(OVERLAP_ACTIONS); };

  /**
   * Spawn a document's entities into a world.
   *
   * Split out from DataScene so a hand-written scene can use the editor for
   * layout only: build the world yourself, then pour the placed entities in.
   *
   * @param {Object} doc   parsed level JSON
   * @param {GF.EntityWorld} world
   * @returns {Object} map of editor id -> GameObject
   */
  GF.buildScene = function (doc, world) {
    var byId = {};
    if (!doc || !world) return byId;

    (doc.entities || []).forEach(function (ent) {
      if (!ent || ent.enabled === false) return;

      // A placed entity is a prefab reference plus a position, or an inline
      // spec for one-off props the game has no prefab for.
      var spec = ent.prefab ? ent.prefab : Object.assign({}, ent.spec || {});

      var overrides = Object.assign({}, ent.overrides);
      if (ent.name) overrides.name = ent.name;
      // `data` merges rather than replaces, so the editor can tweak one key
      // without copying the prefab's whole data block into the level file.
      if (overrides.data && typeof spec === 'string') {
        var pf = world._resolvePrefab(spec);
        if (pf && pf.data) overrides.data = Object.assign({}, pf.data, overrides.data);
      }

      var obj = world.spawn(spec, ent.x, ent.y, overrides);
      if (obj) {
        obj.data._editorId = ent.id;
        if (ent.id) byId[ent.id] = obj;
      }
    });

    return byId;
  };

  /**
   * Register a document's declarative overlap rules on a world.
   *
   * Ordering matters: EntityWorld skips a colliding pair once either side is
   * dead, so a rule that destroys must run AFTER any rule that only observes.
   * DataScene therefore lets the modules register first and calls this last —
   * otherwise a document's "destroyB" would silently starve a module's scoring
   * rule for the same pair.
   */
  GF.applyOverlaps = function (doc, world) {
    (doc.overlaps || []).forEach(function (rule) {
      if (!rule || !rule.a || !rule.b) return;
      var fn = OVERLAP_ACTIONS[rule.do || 'nothing'];
      if (!fn) { console.warn('[GF] level: unknown overlap action "' + rule.do + '"'); return; }
      world.onOverlap(rule.a, rule.b, fn);
    });
    return world;
  };

  /** Accept a level name, a document, or a URL-shaped name; return the doc. */
  function resolveDoc(source) {
    if (source && typeof source === 'object') return source;
    if (typeof source === 'string') {
      var name = source.replace(/^.*\//, '').replace(/\.json$/i, '');
      var doc = GF._levels[name];
      if (doc) return doc;
      console.error('[GF] no level "' + name + '" — list it under "levels" in manifest.json');
    }
    return { entities: [] };
  }

  // ── DataScene ───────────────────────────────────────────────────────────────
  /**
   * A GF.GameScene whose entities come from a level document. Modules, phases,
   * per-scene config and the scene stack all behave exactly as they do for a
   * scene with no document — this only adds the placement step.
   */
  class DataScene extends GF.GameScene {
    /**
     * @param {Object|string} source - level document, or a preloaded level name.
     * @param {Object} [opts] - GameScene opts; the document's own fields win.
     */
    constructor(source, opts) {
      var doc = resolveDoc(source);
      var o = Object.assign({}, opts);
      // Document fields are the authored intent, so they take precedence over
      // whatever the caller guessed.
      if (doc.modules) o.modules = doc.modules;
      if (doc.phase)   o.phase   = doc.phase;
      o.state = Object.assign({}, doc.state, o.state);

      super(doc.scene || doc.name || 'Main', o);
      this.doc = doc;
      this.entities = {};
    }

    init(engine) {
      super.init(engine);                 // world + modules, and module init()s

      // GameScene reads per-scene tuning from GAME_CONFIG.scenes[name], which a
      // new level's scene name has no entry in. Letting the document carry its
      // own `config` keeps a level self-contained — and gives the editor a
      // place to tune a fight — while still deferring to GAME_CONFIG when both
      // define a key.
      if (this.doc.config) {
        this.config = Object.assign({}, this.doc.config, this.config);
      }
      if (this.doc.background && this.config.background == null) {
        this.config.background = this.doc.background;
      }
      // Modules registered their overlap rules during super.init(); the
      // document's declarative ones go last — see GF.applyOverlaps.
      GF.applyOverlaps(this.doc, this.world);
    }

    enter(engine) {
      // Entities exist before any module's enter() hook, so a module can count
      // or find what the level placed. Re-entering respawns from the document,
      // which is what makes a retry deterministic.
      this.world.clear();
      this.entities = GF.buildScene(this.doc, this.world);
      super.enter(engine);
    }

    /** Look up a placed entity by its editor id. */
    entity(id) { return this.entities[id] || null; }
  }

  /**
   * Scene-class factory, so boot code can register a level like any scene:
   *   G.scenes.Boss = GF.dataScene('boss');
   */
  GF.dataScene = function (source, opts) {
    return class extends DataScene {
      constructor(o) { super(source, Object.assign({}, opts, o)); }
    };
  };

  /** Fetch a level document directly (the editor uses this; games rarely need it). */
  GF.loadLevel = function (url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('level ' + url + ': ' + r.status);
      return r.json();
    });
  };

  GF.DataScene = DataScene;

})(window.GF = window.GF || {});


// -- core/Boot.js ------------------------------------------------

// GameFramework/framework/core/Boot.js
// The generic boot sequence, so games stop shipping a copy-pasted boot.js.
//
// Opt in from GAME_CONFIG:
//
//   game: { name: 'MyGame', startScene: 'Main', autoBoot: true,
//           systems: { audio: true, particles: true, debug: false } }
//
// and the framework creates the game, resolves the start scene (a class in
// GAME.scenes, else a GF.GameScene composed from registered modules) and starts
// the engine. Games that still call GF.createGame() themselves are unaffected —
// autoBoot only runs when explicitly enabled.

(function (GF) {
  'use strict';

  /**
   * Build the game and push the start scene.
   * @param {Object} [opts] overrides merged over GAME_CONFIG.game.systems
   * @returns {Object} the game handle from GF.createGame
   */
  GF.boot = function (opts) {
    var cfg = GF.GAME_CONFIG || {};
    var gameCfg = cfg.game || {};
    var G = window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} };

    var game = GF.createGame(cfg.engine, cfg.physics, Object.assign({
      gameName: gameCfg.name,
      audio: true, tweens: true, particles: true, scenes: true, debug: false,
    }, gameCfg.systems || {}, opts || {}));

    // Shared handles: modules reach game.audio, game.particles, ... through either.
    G.game = game;
    GF.game = game;

    var startName = gameCfg.startScene || 'Main';
    var registered = Object.keys(G.scenes || {});
    var name = startName;
    if (!(G.scenes && G.scenes[startName])) {
      // No class registered under the configured name. A plain GF.GameScene is
      // still right whenever modules are bound to it, so only fall back to the
      // first registered scene when nothing at all would run — otherwise
      // registering any other scene (a data level, say) would hijack the start.
      var hasModules = typeof GF.sceneModulesFor === 'function' &&
        GF.sceneModulesFor(startName).some(function (m) {
          var w = m.spec.scene;
          return w != null && w !== '*';
        });
      if (!hasModules && registered.length) name = registered[0];
    }

    var scene = GF.GameScene.create(name);
    if (!scene) { console.error('[GF] boot: cannot resolve start scene "' + startName + '"'); return game; }

    game.scenes.push(scene, game.engine);
    game.engine.start();
    return game;
  };

  window.addEventListener('GF:ready', function () {
    var gameCfg = (GF.GAME_CONFIG && GF.GAME_CONFIG.game) || {};
    if (gameCfg.autoBoot) GF.boot();
  });

})(window.GF = window.GF || {});


// -- GameFramework.js --------------------------------------------

// GameFramework/framework/GameFramework.js
(function (GF) {
  'use strict';

  GF.VERSION = '2.4.0';

  // Auto-detect the directory this bundle was loaded from so that
  // GF.resolvePath() works regardless of where the game lives on disk.
  GF._frameworkBase = (function () {
    var s = document.currentScript;
    if (!s) {
      var all = document.querySelectorAll('script[src]');
      for (var i = all.length - 1; i >= 0; i--) {
        if (all[i].src.indexOf('GameFramework') !== -1) { s = all[i]; break; }
      }
    }
    if (s && s.src) return s.src.replace(/\/[^\/]*$/, '');
    return '/framework';
  }());

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
    var useDialogue  = opts.dialogue  !== false;
    var useModels    = !!opts.models;
    var useGrids     = opts.grids     !== false;
    var useBattle    = opts.battle    !== false;
    var useScore     = opts.score     === true;       // opt-in
    var useParallax  = opts.parallax  === true;       // opt-in

    // Resolve debug config. GAME_CONFIG.debug is authoritative when present:
    //   false           -> disable overlay entirely
    //   { enabled, toggleKey, ... } -> use as DebugOverlay config
    //   (absent)        -> fall back to opts.debug / opts.debugOpts
    var gameCfgDebug = (GF.GAME_CONFIG && GF.GAME_CONFIG.debug !== undefined)
      ? GF.GAME_CONFIG.debug : null;
    var useDebug, debugOpts;
    if (gameCfgDebug === false) {
      useDebug  = false;
      debugOpts = {};
    } else if (gameCfgDebug && typeof gameCfgDebug === 'object') {
      useDebug  = true;
      // opts.debugOpts can still layer on top for programmatic overrides
      debugOpts = Object.assign({}, gameCfgDebug, opts.debugOpts || {});
    } else {
      // No GAME_CONFIG.debug - honour opts flags (backward-compat)
      useDebug  = opts.debug !== false;
      debugOpts = opts.debugOpts || {};
    }

    var engine  = new GF.Engine(engineConfig);
    var sprites = new GF.SpriteSystem();
    // Sprite files (framework's and the game's own sprites/ folder) register
    // into the global GF.sprites map at load time, before any SpriteSystem
    // exists. Fold them in here so no game has to repeat this line.
    if (GF.sprites) sprites.registerSprites(GF.sprites);
    var physics = new GF.PhysicsSystem(physicsConfig);
    var ui      = GF.UISystem;

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
    var grids     = useGrids     ? new GF.GridSystem()                                  : null;
    var battle    = useBattle    ? new GF.TurnBasedBattleSystem()                       : null;
    var debug     = useDebug     ? new GF.DebugOverlay(debugOpts)                       : null;
    var score     = useScore     ? new GF.ScoreManager(Object.assign(
                                       { gameName: opts.gameName, save: save, events: engine.events },
                                       opts.scoreOpts || {}))                          : null;
    var parallax  = useParallax  ? new GF.ParallaxSystem(Object.assign(
                                       { viewportW: engineConfig.width, viewportH: engineConfig.height },
                                       opts.parallaxOpts || {}))                       : null;

    if (audio)    engine.addSystem(audio);
    if (tweens)   engine.addSystem(tweens);
    if (particles) engine.addSystem(particles);
    if (scenes)   engine.addSystem(scenes);
    if (tilemap)  engine.addSystem(tilemap);
    if (dialogue) engine.addSystem(dialogue);
    if (models)   engine.addSystem(models);
    if (grids)    engine.addSystem(grids);
    if (battle)   engine.addSystem(battle);
    if (score)    engine.addSystem(score);
    if (debug)    engine.addSystem(debug);
    // ParallaxSystem is intentionally NOT added to engine.systems by default;
    // games typically draw it themselves at the start of their scene's render.

    // `scenes` also accepts an array of scene instances (a common way games
    // try to boot); they are pushed in order, so the last one is on top.
    if (scenes && Array.isArray(opts.scenes)) {
      opts.scenes.forEach(function (s) { scenes.push(s, engine); });
    }

    return {
      engine: engine, sprites: sprites, physics: physics, ui: ui, save: save,
      audio: audio, tweens: tweens, particles: particles, scenes: scenes,
      tilemap: tilemap, dialogue: dialogue, models: models, debug: debug,
      grids: grids, battle: battle, score: score, parallax: parallax,
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

  // GF:ready fires once BOTH the DOM is parsed and every deferred loader has
  // finished (see core/GameLoader.js — GF.defer()/GF.release()). Without the
  // gate, a manifest-loaded game would boot before its scenes had registered.
  var _domReady = false;
  var _fired    = false;

  GF._maybeFireReady = function () {
    if (_fired || !_domReady || GF._readyPending > 0) return;
    _fired = true;
    window.dispatchEvent(new CustomEvent('GF:ready', { detail: GF }));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      _domReady = true;
      GF._maybeFireReady();
    });
  } else {
    _domReady = true;
    // Microtask, so an inline `GF.loadGame(...)` running immediately after this
    // bundle still gets to claim the gate before GF:ready goes out.
    Promise.resolve().then(GF._maybeFireReady);
  }

  console.log('%cGameFramework v' + GF.VERSION + ' loaded', 'color:#00e5ff;font-weight:bold');

})(window.GF = window.GF || {});
