// GameFramework/framework/utils/ProceduralAudio.js
// Procedural sound generation helpers — extracted from SpaceInvaders &
// ShiningQuest so games can synthesise simple SFX without needing audio assets.
//
// The core function is GF.Audio.makeToneBuffer(audioCtx, freq, duration, type, env).
// Higher-level helpers provide common SFX presets (laser, hit, coin, etc.).
//
// Example:
//   const audio = game.audio;
//   GF.Audio.registerStandardSet(audio);   // registers 'laser', 'hit', 'coin', …
//   audio.play('laser');

(function (GF) {
  'use strict';

  GF.Audio = GF.Audio || {};

  // ── Core synthesis ─────────────────────────────────────────────────────────
  // type: 'sine' | 'square' | 'sweep' | 'noise'
  // env:  { attack, release, volume, sweep }
  GF.Audio.makeToneBuffer = function (audioCtx, freq, duration, type, env) {
    env = env || {};
    var sr     = audioCtx.sampleRate;
    var len    = Math.floor(sr * duration);
    var buffer = audioCtx.createBuffer(1, len, sr);
    var data   = buffer.getChannelData(0);
    var attack  = env.attack  || 0.01;
    var release = env.release || duration;
    var volume  = env.volume  || 0.3;
    var sweep   = env.sweep   || 0;

    for (var i = 0; i < len; i++) {
      var t = i / sr;
      var sample = 0;
      if (type === 'square') {
        sample = Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1;
      } else if (type === 'noise') {
        sample = Math.random() * 2 - 1;
      } else if (type === 'sweep') {
        var f = freq + sweep * t;
        sample = Math.sin(2 * Math.PI * f * t);
      } else {
        sample = Math.sin(2 * Math.PI * freq * t);
      }
      var amp = 1;
      if (t < attack) amp = t / attack;
      else amp = Math.max(0, 1 - (t - attack) / Math.max(0.0001, release - attack));
      data[i] = sample * amp * volume;
    }
    return buffer;
  };

  // Multi-tone arpeggio (e.g. a level-up or coin-pickup chord).
  GF.Audio.makeArpeggioBuffer = function (audioCtx, freqs, stepDuration, type, env) {
    env = env || {};
    var totalDur = freqs.length * stepDuration;
    var sr       = audioCtx.sampleRate;
    var len      = Math.floor(sr * totalDur);
    var buffer   = audioCtx.createBuffer(1, len, sr);
    var data     = buffer.getChannelData(0);
    var volume   = env.volume || 0.3;

    for (var i = 0; i < len; i++) {
      var t      = i / sr;
      var step   = Math.min(freqs.length - 1, Math.floor(t / stepDuration));
      var stepT  = t - step * stepDuration;
      var freq   = freqs[step];
      var sample = (type === 'square')
        ? (Math.sin(2 * Math.PI * freq * stepT) > 0 ? 1 : -1)
        : Math.sin(2 * Math.PI * freq * stepT);
      var attack  = 0.01;
      var release = stepDuration;
      var amp     = stepT < attack ? stepT / attack
                    : Math.max(0, 1 - (stepT - attack) / (release - attack));
      data[i] = sample * amp * volume;
    }
    return buffer;
  };

  // ── Standard SFX preset library ────────────────────────────────────────────
  // Registers a generic, broadly-useful palette into an AudioSystem.
  GF.Audio.registerStandardSet = function (audioSystem, options) {
    if (!audioSystem) return;
    options = options || {};
    if (audioSystem._ensureContext) audioSystem._ensureContext();
    var ctx = audioSystem._ctx;
    if (!ctx) {
      console.warn('[ProceduralAudio] no AudioContext on AudioSystem');
      return;
    }
    var T = GF.Audio.makeToneBuffer;
    var A = GF.Audio.makeArpeggioBuffer;

    var presets = {
      laser:     T(ctx, 880, 0.12, 'square', { attack: 0.005, release: 0.12, volume: 0.20 }),
      shoot:     T(ctx, 880, 0.12, 'square', { attack: 0.005, release: 0.12, volume: 0.20 }),
      hit:       T(ctx, 200, 0.10, 'noise',  { attack: 0.005, release: 0.10, volume: 0.30 }),
      explode:   T(ctx, 150, 0.50, 'noise',  { attack: 0.01,  release: 0.50, volume: 0.35 }),
      coin:      A(ctx, [880, 1320], 0.07, 'square', { volume: 0.25 }),
      jump:      T(ctx, 520, 0.18, 'sweep',  { attack: 0.005, release: 0.18, sweep: 240, volume: 0.22 }),
      land:      T(ctx, 180, 0.10, 'square', { attack: 0.005, release: 0.10, volume: 0.18 }),
      pickup:    T(ctx, 750, 0.28, 'sweep',  { attack: 0.01,  release: 0.28, sweep: 320, volume: 0.30 }),
      powerup:   T(ctx, 750, 0.28, 'sweep',  { attack: 0.01,  release: 0.28, sweep: 320, volume: 0.30 }),
      levelUp:   A(ctx, [550, 660, 780, 1040], 0.08, 'square', { volume: 0.25 }),
      gameOver:  A(ctx, [440, 350, 260, 180], 0.18, 'square', { volume: 0.30 }),
      menuMove:  T(ctx, 660, 0.05, 'square', { attack: 0.001, release: 0.05, volume: 0.15 }),
      menuConfirm: T(ctx, 880, 0.12, 'square', { attack: 0.005, release: 0.12, volume: 0.22 }),
      menuCancel:  T(ctx, 220, 0.12, 'square', { attack: 0.005, release: 0.12, volume: 0.18 }),
    };

    var only = options.only || null;     // ['laser','hit'] etc
    var skip = options.skip || [];
    Object.keys(presets).forEach(function (k) {
      if (only && only.indexOf(k) < 0) return;
      if (skip.indexOf(k) >= 0) return;
      audioSystem.register(k, presets[k]);
    });
  };

})(window.GF = window.GF || {});
