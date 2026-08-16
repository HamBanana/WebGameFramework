// games/Acca/systems/SfxPlayer.js
// Self-contained Web-Audio synth that produces five recognisable sound cues
// without requiring any audio asset files. Each cue is a short envelope over
// a single oscillator (or a tiny chord) — designed so the build stays a
// single-folder game with no binary dependencies. If real audio files are
// dropped in later, this player can be swapped out for the framework's
// AudioSystem with no event-wiring changes.
//
// API (all methods are no-ops if the AudioContext can't be created):
//   const sfx = new GF.Acca.SfxPlayer({ volume: 0.7 });
//   sfx.coin();         // money gain
//   sfx.build();        // structure built
//   sfx.mayor();        // mayoral seat changed
//   sfx.roll();         // die clatter (short noise burst)
//   sfx.victory();      // game-over fanfare
//   sfx.setVolume(0.5);

(function (GF) {
  'use strict';
  GF.Acca = GF.Acca || {};

  class SfxPlayer {
    constructor(opts) {
      this.volume = (opts && opts.volume != null) ? opts.volume : 0.7;
      this._ctx = null;
      // Throttle each cue so heavy mayor-turn streams of `+$19` don't fire
      // 30 simultaneous coin chimes.
      this._lastFire = {};
      this._minIntervalMs = 60;
      // Resume on first user interaction (autoplay-policy guard).
      const resume = () => { if (this._ctx && this._ctx.state === 'suspended') this._ctx.resume(); };
      document.addEventListener('click',   resume, { once: true });
      document.addEventListener('keydown', resume, { once: true });
    }

    setVolume(v) {
      this.volume = Math.max(0, Math.min(1, v || 0));
    }

    _ensure() {
      if (this._ctx) return this._ctx;
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        this._ctx = new Ctx();
      } catch (e) { return null; }
      return this._ctx;
    }

    _throttle(name) {
      const now = performance.now();
      const last = this._lastFire[name] || 0;
      if (now - last < this._minIntervalMs) return false;
      this._lastFire[name] = now;
      return true;
    }

    /** Short envelope on a single oscillator. */
    _bleep({ freq, dur = 0.12, type = 'sine', vol = 1, sweep = 0 }) {
      const ctx = this._ensure();
      if (!ctx) return;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (sweep) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(40, freq + sweep), ctx.currentTime + dur);
      }
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(vol * this.volume, ctx.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur + 0.02);
    }

    /** Short noise burst — used by the dice-roll clatter. */
    _noise(dur = 0.15, vol = 0.3) {
      const ctx = this._ensure();
      if (!ctx) return;
      const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        // Lightly low-passed white noise for a cleaner "clack".
        const t = i / data.length;
        data[i] = (Math.random() * 2 - 1) * (1 - t) * 0.6;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const gain = ctx.createGain();
      gain.gain.value = vol * this.volume;
      src.connect(gain).connect(ctx.destination);
      src.start();
    }

    coin() {
      if (!this._throttle('coin')) return;
      // Two ascending sine pings — short and bright.
      this._bleep({ freq: 880, dur: 0.08, type: 'sine', vol: 0.55 });
      setTimeout(() => this._bleep({ freq: 1320, dur: 0.10, type: 'sine', vol: 0.55 }), 55);
    }

    build() {
      if (!this._throttle('build')) return;
      // Triangle "thock" sweep.
      this._bleep({ freq: 220, dur: 0.16, type: 'triangle', vol: 0.65, sweep: 80 });
      setTimeout(() => this._bleep({ freq: 440, dur: 0.10, type: 'triangle', vol: 0.45 }), 90);
    }

    mayor() {
      if (!this._throttle('mayor')) return;
      // Major-third double bleep — implies "promotion".
      this._bleep({ freq: 660, dur: 0.12, type: 'sawtooth', vol: 0.4 });
      setTimeout(() => this._bleep({ freq: 990, dur: 0.18, type: 'sawtooth', vol: 0.45 }), 100);
    }

    roll() {
      if (!this._throttle('roll')) return;
      // Quick noise burst — a die clatter without an actual dice sample.
      this._noise(0.18, 0.25);
    }

    victory() {
      if (!this._throttle('victory')) return;
      // Three-note arpeggio — C/E/G upper-octave fanfare.
      const notes = [523, 659, 784, 1046];
      notes.forEach((f, i) => {
        setTimeout(() => this._bleep({ freq: f, dur: 0.22, type: 'square', vol: 0.5 }), i * 110);
      });
    }
  }

  GF.Acca.SfxPlayer = SfxPlayer;

})(window.GF = window.GF || {});
