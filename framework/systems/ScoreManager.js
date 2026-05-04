// GameFramework/framework/systems/ScoreManager.js
// Tracks score, persistent high score, and an optional combo multiplier.
// Persistence uses SaveSystem when available, falling back to localStorage.
//
// Events emitted on engine.events (when bound):
//   score:add        { amount, score, combo, multiplier }
//   score:newHigh    { score }
//   score:reset      { }
//   score:multiplier { multiplier, combo }

(function (GF) {
  'use strict';

  function ScoreManager(opts) {
    opts = opts || {};
    this.gameName       = opts.gameName     || 'GF';
    this.score          = 0;
    this.highScore      = 0;
    this.combo          = 0;
    this.comboMaxTime   = opts.comboMaxTime || 1.5;  // seconds
    this._comboTimer    = 0;
    this.multiplierStep = opts.multiplierStep || 0.5;  // +0.5x per combo
    this.multiplierCap  = opts.multiplierCap  || 4;
    this.events         = opts.events || null;       // EventBus
    this.save           = opts.save   || null;       // SaveSystem
    this._highScoreKey  = '_highScore_' + this.gameName;

    this._loadHighScore();
  }

  ScoreManager.prototype.update = function (dt) {
    if (this._comboTimer > 0) {
      this._comboTimer -= dt;
      if (this._comboTimer <= 0) this.resetCombo();
    }
  };

  ScoreManager.prototype.add = function (amount, opts) {
    opts = opts || {};
    if (opts.combo !== false) {
      this.combo++;
      this._comboTimer = this.comboMaxTime;
    }
    var multiplier = this.multiplier();
    var earned     = Math.round(amount * multiplier);
    this.score    += earned;

    if (this.events) {
      this.events.emit('score:add',
        { amount: earned, score: this.score, combo: this.combo, multiplier: multiplier });
      if (opts.combo !== false && this.combo > 1) {
        this.events.emit('score:multiplier', { multiplier: multiplier, combo: this.combo });
      }
    }

    if (this.score > this.highScore) {
      this.highScore = this.score;
      this._saveHighScore();
      if (this.events) this.events.emit('score:newHigh', { score: this.score });
    }

    return earned;
  };

  ScoreManager.prototype.subtract = function (amount) {
    this.score = Math.max(0, this.score - amount);
    if (this.events) this.events.emit('score:add',
      { amount: -amount, score: this.score, combo: this.combo, multiplier: 1 });
  };

  ScoreManager.prototype.multiplier = function () {
    if (this.combo <= 1) return 1;
    return Math.min(this.multiplierCap, 1 + (this.combo - 1) * this.multiplierStep);
  };

  ScoreManager.prototype.resetCombo = function () {
    if (this.combo === 0) return;
    this.combo = 0;
    this._comboTimer = 0;
    if (this.events) this.events.emit('score:multiplier', { multiplier: 1, combo: 0 });
  };

  ScoreManager.prototype.reset = function () {
    this.score = 0;
    this.resetCombo();
    if (this.events) this.events.emit('score:reset', {});
  };

  ScoreManager.prototype.resetHighScore = function () {
    this.highScore = 0;
    this._saveHighScore();
  };

  ScoreManager.prototype._loadHighScore = function () {
    try {
      if (this.save && this.save.read) {
        var rec = this.save.read(this._highScoreKey);
        if (rec && rec.data && typeof rec.data.highScore === 'number') {
          this.highScore = rec.data.highScore;
          return;
        }
      }
      var raw = localStorage.getItem('GF_HIGHSCORE_' + this.gameName);
      if (raw) this.highScore = parseInt(raw, 10) || 0;
    } catch (e) { /* ignore */ }
  };

  ScoreManager.prototype._saveHighScore = function () {
    try {
      if (this.save && this.save.write) {
        this.save.write(this._highScoreKey, { highScore: this.highScore });
        return;
      }
      localStorage.setItem('GF_HIGHSCORE_' + this.gameName, String(this.highScore));
    } catch (e) { /* ignore */ }
  };

  GF.ScoreManager = ScoreManager;

})(window.GF = window.GF || {});
