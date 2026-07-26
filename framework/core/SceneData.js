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
