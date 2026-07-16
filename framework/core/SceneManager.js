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
