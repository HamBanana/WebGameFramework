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
