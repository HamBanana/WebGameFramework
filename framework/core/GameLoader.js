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
