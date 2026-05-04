// GameFramework/framework/GameFramework.js
(function (GF) {
  'use strict';

  GF.VERSION = '2.3.0';

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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.dispatchEvent(new CustomEvent('GF:ready', { detail: GF }));
    });
  } else {
    window.dispatchEvent(new CustomEvent('GF:ready', { detail: GF }));
  }

  console.log('%cGameFramework v' + GF.VERSION + ' loaded', 'color:#00e5ff;font-weight:bold');

})(window.GF = window.GF || {});
