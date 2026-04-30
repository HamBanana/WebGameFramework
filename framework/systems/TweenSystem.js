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
