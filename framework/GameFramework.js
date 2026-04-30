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

    var audio     = useAudio     ? new GF.AudioSystem(opts.audioOpts || {})        : null;
    var tweens    = useTweens    ? new GF.TweenSystem()                             : null;
    var particles = useParticles ? new GF.ParticleSystem(opts.particleOpts || {})  : null;
    var scenes    = useScenes    ? new GF.SceneManager()                            : null;
    var tilemap   = useTilemap   ? new GF.TilemapSystem()                           : null;
    var dialogue  = useDialogue  ? new GF.DialogueSystem(opts.dialogueOpts || {})  : null;
    // DebugOverlay added last so it renders on top of everything.
    var debug     = useDebug     ? new GF.DebugOverlay(opts.debugOpts || {})        : null;

    if (audio)    engine.addSystem(audio);
    if (tweens)   engine.addSystem(tweens);
    if (particles) engine.addSystem(particles);
    if (scenes)   engine.addSystem(scenes);
    if (tilemap)  engine.addSystem(tilemap);
    if (dialogue) engine.addSystem(dialogue);
    if (debug)    engine.addSystem(debug);

    return {
      engine: engine, sprites: sprites, physics: physics, ui: ui, save: save,
      audio: audio, tweens: tweens, particles: particles, scenes: scenes,
      tilemap: tilemap, dialogue: dialogue, debug: debug,
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
