// GameFramework/framework/scenes/GameOverScene.js
// Reusable game-over scene template. Shows a message + score + high score
// and waits for a "restart" input action.
//
// Example:
//   game.scenes.replaceWithTransition(new GF.GameOverScene({
//     score: scoreManager.score,
//     highScore: scoreManager.highScore,
//     newRecord: scoreManager.score === scoreManager.highScore,
//     onRestart: () => game.scenes.replace(new GameScene(), game.engine),
//     onMenu:    () => game.scenes.replace(new TitleScene(), game.engine),
//   }), { type: 'fade', duration: 0.6 });

(function (GF) {
  'use strict';

  if (!GF.Scene) GF.Scene = function () {};

  function GameOverScene(opts) {
    opts = opts || {};
    this.opts = Object.assign({
      title:        'GAME OVER',
      subtitle:     'Press SPACE to restart',
      bgColor:      'rgba(0,0,0,0.85)',
      titleColor:   '#ff5555',
      titleFont:    'bold 56px monospace',
      subtitleFont: '20px monospace',
      scoreFont:    '24px monospace',
      score:        null,
      highScore:    null,
      newRecord:    false,
      restartAction:'jump',
      menuAction:   null,
      onRestart:    null,
      onMenu:       null,
      victory:      false,           // toggle palette/title for "victory!" version
    }, opts);
    if (this.opts.victory) {
      if (this.opts.title    === 'GAME OVER') this.opts.title    = 'VICTORY!';
      if (this.opts.titleColor === '#ff5555') this.opts.titleColor = '#55ff77';
    }
    this._t = 0;
  }

  GameOverScene.prototype = Object.create(GF.Scene.prototype);
  GameOverScene.prototype.constructor = GameOverScene;

  GameOverScene.prototype.init = function (engine) { this.engine = engine; };

  GameOverScene.prototype.update = function (dt, engine) {
    this._t += dt;
    var input = engine.input;
    if (input && input.wasPressed(this.opts.restartAction) && this.opts.onRestart) {
      this.opts.onRestart(engine);
    }
    if (input && this.opts.menuAction && input.wasPressed(this.opts.menuAction) && this.opts.onMenu) {
      this.opts.onMenu(engine);
    }
  };

  GameOverScene.prototype.render = function (ctx, engine) {
    var W = engine.canvas.width, H = engine.canvas.height;
    ctx.fillStyle = this.opts.bgColor;
    ctx.fillRect(0, 0, W, H);

    var ui = engine.systems && engine.systems.ui ? engine.systems.ui : GF.UISystem;

    var titleY = H * 0.32;
    var scoreY = H * 0.50;
    var highY  = H * 0.58;
    var subY   = H * 0.78;

    if (ui && ui.drawText) {
      ui.drawText(ctx, this.opts.title, W / 2, titleY, {
        font: this.opts.titleFont, color: this.opts.titleColor,
        align: 'center', baseline: 'middle',
        shadow: true, glow: this.opts.titleColor, glowBlur: 16,
      });
      if (this.opts.score != null) {
        ui.drawText(ctx, 'SCORE  ' + this.opts.score, W / 2, scoreY, {
          font: this.opts.scoreFont, color: '#ffffff', align: 'center', baseline: 'middle',
        });
      }
      if (this.opts.highScore != null) {
        var label = this.opts.newRecord ? 'NEW HIGH SCORE  ' : 'HIGH SCORE  ';
        ui.drawText(ctx, label + this.opts.highScore, W / 2, highY, {
          font: this.opts.scoreFont,
          color: this.opts.newRecord ? '#ffd54a' : '#cccccc',
          align: 'center', baseline: 'middle',
        });
      }
      var alpha = 0.55 + 0.45 * Math.sin(this._t * 4);
      ctx.save(); ctx.globalAlpha = alpha;
      ui.drawText(ctx, this.opts.subtitle, W / 2, subY, {
        font: this.opts.subtitleFont, color: '#cccccc',
        align: 'center', baseline: 'middle',
      });
      ctx.restore();
    } else {
      ctx.fillStyle = this.opts.titleColor;
      ctx.font = this.opts.titleFont;
      ctx.textAlign = 'center';
      ctx.fillText(this.opts.title, W / 2, titleY);
      if (this.opts.score != null) {
        ctx.fillStyle = '#fff';
        ctx.font = this.opts.scoreFont;
        ctx.fillText('SCORE  ' + this.opts.score, W / 2, scoreY);
      }
      ctx.font = this.opts.subtitleFont;
      ctx.fillText(this.opts.subtitle, W / 2, subY);
    }
  };

  GF.GameOverScene = GameOverScene;

})(window.GF = window.GF || {});
