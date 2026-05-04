// GameFramework/framework/systems/WaveSpawner.js
// Generic wave-based enemy spawner. Defines a sequence of waves where each
// wave is a list of {kind, count, spacing} entries; the spawner emits one
// enemy at a time via a user-provided spawn callback, then progresses to the
// next wave when all enemies from the current wave are dead.
//
// Designed for shooters (SpaceInvaders), tower-defense, survival modes, etc.
//
// Example:
//   const waves = [
//     { delay: 0.5, entries: [
//       { kind: 'alienSquid', count: 8, spacing: 0.15 },
//       { kind: 'alienCrab',  count: 8, spacing: 0.15 },
//     ]},
//     { delay: 1.0, entries: [
//       { kind: 'alienOctopus', count: 12, spacing: 0.10 },
//     ], boss: true },
//   ];
//
//   const spawner = new GF.WaveSpawner({
//     waves,
//     spawn: (kind, info) => spawnEnemy(kind, info),
//     onWaveStart: w => console.log('wave', w),
//     onWaveClear: w => console.log('clear', w),
//     onAllClear:  () => console.log('victory!'),
//   });
//   spawner.start();
//   ...
//   spawner.update(dt);                    // advance scheduling
//   spawner.notifyKilled(enemy);          // tell the spawner an enemy died

(function (GF) {
  'use strict';

  function WaveSpawner(opts) {
    opts = opts || {};
    this.waves       = opts.waves || [];
    this.spawn       = opts.spawn;             // (kind, info) => entity
    this.onWaveStart = opts.onWaveStart || null;
    this.onWaveClear = opts.onWaveClear || null;
    this.onAllClear  = opts.onAllClear  || null;

    this.events      = opts.events || null;    // optional EventBus
    this.eventNamespace = opts.eventNamespace || 'wave';

    this.difficulty  = opts.difficulty || 1;   // multiplier on counts
    this.difficultyRamp = opts.difficultyRamp || 0;  // +ramp per wave

    this._reset();
  }

  WaveSpawner.prototype._reset = function () {
    this.currentWaveIndex = -1;
    this.currentEntry     = null;
    this._delayTimer      = 0;
    this._spawnTimer      = 0;
    this._waveAlive       = 0;
    this._entryQueue      = [];
    this._entriesLeft     = 0;
    this._active          = false;
    this._waitingForClear = false;
  };

  WaveSpawner.prototype.start = function () {
    this._reset();
    this._active = true;
    this._advanceWave();
  };

  WaveSpawner.prototype.stop = function () {
    this._active = false;
  };

  WaveSpawner.prototype.update = function (dt) {
    if (!this._active) return;

    if (this._delayTimer > 0) {
      this._delayTimer -= dt;
      return;
    }

    // Currently emitting a wave's entries
    if (this.currentEntry) {
      this._spawnTimer -= dt;
      while (this._spawnTimer <= 0 && this.currentEntry && this.currentEntry.remaining > 0) {
        this._spawnOne();
        this._spawnTimer += this.currentEntry.spacing || 0.2;
      }
      if (this.currentEntry && this.currentEntry.remaining === 0) {
        this._nextEntry();
      }
    }
  };

  WaveSpawner.prototype._spawnOne = function () {
    if (!this.spawn) return;
    var entry = this.currentEntry;
    var info  = {
      waveIndex: this.currentWaveIndex,
      kind:      entry.kind,
      indexInEntry: entry.spawned,
      total:     entry.count,
    };
    var ent = this.spawn(entry.kind, info);
    entry.remaining--;
    entry.spawned++;
    this._waveAlive++;
    if (this.events) this.events.emit(this.eventNamespace + ':spawn', { entity: ent, info: info });
  };

  WaveSpawner.prototype._nextEntry = function () {
    if (this._entriesLeft > 0) {
      this.currentEntry = this._entryQueue.shift();
      this._entriesLeft--;
      this._spawnTimer = 0;
    } else {
      this.currentEntry = null;
      this._waitingForClear = true;
    }
  };

  WaveSpawner.prototype._advanceWave = function () {
    this._waitingForClear = false;
    this.currentWaveIndex++;
    if (this.currentWaveIndex >= this.waves.length) {
      this._active = false;
      if (this.onAllClear) this.onAllClear();
      if (this.events) this.events.emit(this.eventNamespace + ':all_clear', {});
      return;
    }

    var wave = this.waves[this.currentWaveIndex];
    var diffMul = this.difficulty + this.currentWaveIndex * this.difficultyRamp;
    this._entryQueue = (wave.entries || []).map(function (e) {
      return {
        kind:      e.kind,
        count:     Math.max(1, Math.floor((e.count || 1) * diffMul)),
        remaining: Math.max(1, Math.floor((e.count || 1) * diffMul)),
        spawned:   0,
        spacing:   e.spacing || 0.2,
        meta:      e.meta || null,
      };
    });
    this._entriesLeft  = this._entryQueue.length;
    this._delayTimer   = wave.delay || 0;
    this._waveAlive    = 0;

    if (this.onWaveStart) this.onWaveStart(this.currentWaveIndex, wave);
    if (this.events) this.events.emit(this.eventNamespace + ':start', { wave: this.currentWaveIndex });

    this._nextEntry();
  };

  // Game must call this when an enemy spawned by us is destroyed.
  WaveSpawner.prototype.notifyKilled = function (entity) {
    if (this._waveAlive > 0) this._waveAlive--;
    if (this._waitingForClear && this._waveAlive === 0) {
      var idx = this.currentWaveIndex;
      if (this.onWaveClear) this.onWaveClear(idx, this.waves[idx]);
      if (this.events) this.events.emit(this.eventNamespace + ':clear', { wave: idx });
      this._advanceWave();
    }
  };

  Object.defineProperty(WaveSpawner.prototype, 'isActive', {
    get: function () { return this._active; },
  });
  Object.defineProperty(WaveSpawner.prototype, 'aliveCount', {
    get: function () { return this._waveAlive; },
  });

  GF.WaveSpawner = WaveSpawner;

})(window.GF = window.GF || {});
