(function (G, GF) {
  'use strict';

  window.addEventListener('GF:ready', () => {
    var Main = G.scenes.Main;
    if (!Main) return;
    var origS = Main.prototype.startGame;

    Main.prototype.startGame = function() {
      origS.call(this);
      // Initialize level state
      if (!this._levelState) {
        this._levelState = { cur: 1, max: 3, won: false, go: false, th: null, done: false, victoryDone: false };
      } else {
        this._levelState.cur = 1;
        this._levelState.won = false;
        this._levelState.go = false;
        this._levelState.th = null;
        this._levelState.done = false;
        this._levelState.victoryDone = false;
      }
    };

    Main.prototype._startNext = function(level) {
      // Reset everything for new level
      this.score = 0;
      this.lives = 3;
      this.player = null;
      this.invaders = [];
      this.bullets = [];
      this.invaderDir = 1;
      this.invaderSpeed = 60 + (level - 1) * 20;
      this.invaderDropAmount = 16;
      this.fireCooldown = 0;
      this.ufo = null;
      this.ufoTimer = 20;
      this.ufoSpeed = 100;
      this.powerups = [];
      this.phase = 'play';

      var W = this.engine.config.width;
      var H = this.engine.config.height;
      var cols = 8;
      var rows = Math.min(5 + level - 1, 6);
      var sX = 56, sY = 40;
      var startX = (W - cols * sX) / 2 + 12;
      var startY = 50;

      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          this.invaders.push(new G.components.Invader(
            startX + c * sX, startY + r * sY, r % 3
          ));
        }
      }

      this.player = new G.components.Player(W / 2 - 20, H - 50);
      this._levelState.th = null;
      this._levelState.done = false;
    };
  });
  G.components.PatchLevelStart = true;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
