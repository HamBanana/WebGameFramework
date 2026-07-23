(function (G, GF) {
  'use strict';

  window.addEventListener('GF:ready', function () {
    var Main = G.scenes.Main;
    if (!Main) return;

    var origU = Main.prototype.update;

    Main.prototype.update = function (dt, engine) {
      var ls = this._levelState;
      if (!ls) {
        ls = this._levelState = { cur: 1, max: 3, won: false, go: false, th: null, done: false };
      }

      if (ls.th && ls.th.active && !ls.done) return;

      // ── Level complete → fade to next ──
      if (this.invaders.length === 0 && ls.cur < ls.max) {
        var scene = this;  // capture for callback
        ls.won = true; ls.done = false;
        var tw = engine.getSystem('TweenSystem');
        ls.th = tw.createTransition('fade', 0.8, {
          onMidpoint: function() {
            ls.cur++;
            scene._startLevelNext(ls.cur);
          },
          onComplete: function() { ls.done = true; }
        });
        return;
      }

      // ── All levels done → fade to victory screen ──
      if (this.invaders.length === 0 && ls.cur >= ls.max && !ls.victoryDone) {
        ls.won = true; ls.go = true; ls.done = false;
        var tw = engine.getSystem('TweenSystem');
        ls.th = tw.createTransition('fade', 1.0, {
          onComplete: function() { ls.done = true; ls.victoryDone = true; }
        });
        return;
      }

      origU.call(this, dt, engine);
    };

    // ── Shared: reset everything and build a new level ──
    Main.prototype._startLevelNext = function(level) {
      var W = this.engine.config.width;
      var H = this.engine.config.height;
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
    };
  });

  G.components.PatchLevelUpdate = true;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
