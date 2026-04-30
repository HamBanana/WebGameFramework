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
