// GameFramework/framework/scenes/TitleScene.js
// Reusable title / start scene template.
//
// Configure via constructor options; subclass and override draw/update if you
// need something custom. Common controls:
//   - Press confirm  -> opts.onStart(engine)
//   - Press menu     -> opts.onMenu  (e.g. options screen)
//
// Example:
//   class MyTitle extends GF.TitleScene { constructor() { super({
//     title:    'COSMIC CONQUEST',
//     subtitle: 'Press SPACE to start',
//     bgColor:  '#0a0a2e',
//     onStart:  (engine) => engine.systems.scenes.replace(new GameScene(), engine),
//   }); } }

(function (GF) {
  'use strict';

  if (!GF.Scene) {
    // Provide a no-op base so this file can load before SceneManager.
    GF.Scene = function () {};
  }

  function TitleScene(opts) {
    opts = opts || {};
    this.opts = Object.assign({
      title:        'GAME',
      subtitle:     'Press SPACE to start',
      bgColor:      '#0a0a2e',
      titleColor:   '#ffffff',
      subtitleColor:'#cccccc',
      titleFont:    'bold 48px monospace',
      subtitleFont: '20px monospace',
      blink:        true,            // pulse the subtitle
      confirmAction:'jump',          // input action that starts the game
      menuAction:   null,            // optional second action
      onStart:      null,            // (engine) => void
      onMenu:       null,
      drawBackground: null,          // (ctx, scene) => void  (optional)
    }, opts);
    this._t = 0;
  }

  TitleScene.prototype = Object.create(GF.Scene.prototype);
  TitleScene.prototype.constructor = TitleScene;

  TitleScene.prototype.init = function (engine) { this.engine = engine; };

  TitleScene.prototype.update = function (dt, engine) {
    this._t += dt;
    var input = engine.input;
    if (input && input.wasPressed(this.opts.confirmAction) && this.opts.onStart) {
      this.opts.onStart(engine);
    }
    if (input && this.opts.menuAction && input.wasPressed(this.opts.menuAction) && this.opts.onMenu) {
      this.opts.onMenu(engine);
    }
  };

  TitleScene.prototype.render = function (ctx, engine) {
    var W = engine.canvas.width, H = engine.canvas.height;

    if (this.opts.drawBackground) {
      this.opts.drawBackground(ctx, this);
    } else {
      ctx.fillStyle = this.opts.bgColor;
      ctx.fillRect(0, 0, W, H);
    }

    var ui = engine.systems && engine.systems.ui ? engine.systems.ui : GF.UISystem;
    if (ui && ui.drawText) {
      ui.drawText(ctx, this.opts.title, W / 2, H * 0.4, {
        font: this.opts.titleFont, color: this.opts.titleColor,
        align: 'center', baseline: 'middle',
        shadow: true, glow: this.opts.titleColor, glowBlur: 10,
      });
      var sub = this.opts.subtitle;
      if (sub) {
        var alpha = this.opts.blink ? (0.55 + 0.45 * Math.sin(this._t * 4)) : 1;
        ctx.save();
        ctx.globalAlpha = alpha;
        ui.drawText(ctx, sub, W / 2, H * 0.6, {
          font: this.opts.subtitleFont, color: this.opts.subtitleColor,
          align: 'center', baseline: 'middle',
        });
        ctx.restore();
      }
    } else {
      // UISystem unavailable — minimal fallback
      ctx.fillStyle = this.opts.titleColor;
      ctx.font = this.opts.titleFont;
      ctx.textAlign = 'center';
      ctx.fillText(this.opts.title, W / 2, H * 0.4);
      ctx.font = this.opts.subtitleFont;
      ctx.fillText(this.opts.subtitle, W / 2, H * 0.6);
    }
  };

  GF.TitleScene = TitleScene;

})(window.GF = window.GF || {});
