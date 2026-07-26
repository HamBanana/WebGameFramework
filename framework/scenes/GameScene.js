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
