// GameFramework/games/KatInvaders/KatInvadersGame.js
// Kawaii Cat Invaders — main boot + scene registration.
// Depends on: config.js (GF.GAME_CONFIG), GameFramework.bundle.js, manifest.json

(function (GF) {
  'use strict';

  // Helper: create ES6 class subclass instance (classes can't be called without new)
  function subclassInstance(Class, args) {
    var inst = Reflect ? Reflect.construct(Class, args) : new Class(args);
    return inst;
  }

  // ── Scene: Main ────────────────────────────────────────────────────────────
  function MainScene() {
    var inst = new GF.GameScene('Main', {
      phase: 'play',
      state: {
        score: 0, lives: 3, level: 1, won: false,
        combo: 0, comboTimer: 0, comboMultiplier: 1,
      },
    });
    Object.setPrototypeOf(inst, MainScene.prototype);
    return inst;
  }
  MainScene.prototype = Object.create(GF.GameScene.prototype);
  MainScene.prototype.constructor = MainScene;
  MainScene.prototype.init = function(engine) {
    GF.GameScene.prototype.init.call(this, engine);
  };
  MainScene.prototype.enter = function(engine) {
    GF.GameScene.prototype.enter.call(this, engine);
  };

  // ── Scene: TitleScreen ─────────────────────────────────────────────────────
  function BossScene() {
    var inst = new GF.GameScene('Main', {
      phase: 'boss',
      state: {
        score: 0, lives: 3, level: 5, won: false,
        combo: 0, comboTimer: 0, comboMultiplier: 1,
      },
    });
    Object.setPrototypeOf(inst, BossScene.prototype);
    return inst;
  }
  BossScene.prototype = Object.create(GF.GameScene.prototype);
  BossScene.prototype.constructor = BossScene;
  BossScene.prototype.init = function(engine) {
    GF.GameScene.prototype.init.call(this, engine);
  };
  BossScene.prototype.enter = function(engine) {
    GF.GameScene.prototype.enter.call(this, engine);
  };

  function TitleScene() {
    var inst = new GF.TitleScene({
      title: 'KAT INVADERS',
      subtitle: 'Press SPACE to Start',
      bgColor: '#0a0a1a',
      titleColor: '#ff8ec4',
      subtitleColor: '#ffffff',
      titleFont: 'bold 42px monospace',
      subtitleFont: '20px monospace',
      confirmAction: 'confirm',
      bossAction: 'boss',
      onStart: function (engine) {
        engine.getSystem('SceneManager').replace(new MainScene(), engine);
      },
      onBossStart: function (engine) {
        engine.getSystem('SceneManager').replace(new BossScene(), engine);
      },
    });
    Object.setPrototypeOf(inst, TitleScene.prototype);
    return inst;
  }
  TitleScene.prototype = Object.create(GF.TitleScene.prototype);
  TitleScene.prototype.constructor = TitleScene;

  TitleScene.prototype.render = function (ctx, engine) {
    var W = engine.config.width, H = engine.config.height;
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, W, H);

    // Animated stars (batched, fewer save/restore)
    var t = this._t || 0;
    ctx.textAlign = 'center';
    for (var i = 0; i < 40; i++) {
      var sx = ((i * 137 + 50) % W);
      var sy = ((i * 211 + 30) % H);
      var alpha = 0.3 + 0.4 * Math.sin(t * 2 + i * 0.5);
      ctx.fillStyle = 'rgba(255,180,220,' + alpha.toFixed(2) + ')';
      ctx.fillRect(sx, sy, 2, 2);
    }

    // Title glow
    ctx.save();
    ctx.shadowColor = '#ff69b4';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ff8ec4';
    ctx.font = 'bold 42px monospace';
    ctx.fillText('KAT INVADERS', W / 2, H * 0.32);
    ctx.restore();

    // Subtitle
    ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 4);
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px monospace';
    ctx.fillText('Press SPACE to Start', W / 2, H * 0.52);

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#88aacc';
    ctx.font = '15px monospace';
    ctx.fillText('← → or A D to move  |  SPACE to fire', W / 2, H * 0.68);
    ctx.fillText('Collect powerups • Defeat the boss • Save Earth!', W / 2, H * 0.78);
    ctx.fillText('Every 5 levels: BOSS BATTLE!', W / 2, H * 0.88);

    ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 3);
    ctx.fillStyle = '#ffdd44';
    ctx.font = '18px monospace';
    ctx.fillText('Press B for Bossfight', W / 2, H * 0.96);
    ctx.globalAlpha = 1;
  };

  // ── Scene: GameOver ────────────────────────────────────────────────────────
  function GameOverScene() {
    var inst = new GF.GameOverScene({
      bgColor: 'rgba(10,10,26,0.9)',
      titleColor: '#ff4488',
      onRestart: function (engine) {
        engine.getSystem('SceneManager').replace(new MainScene(), engine);
      },
    });
    Object.setPrototypeOf(inst, GameOverScene.prototype);
    return inst;
  }
  GameOverScene.prototype = Object.create(GF.GameOverScene.prototype);
  GameOverScene.prototype.constructor = GameOverScene;

  // ── Scene Registration ─────────────────────────────────────────────────────
  // Register scenes IMMEDIATELY so autoBoot finds them before GF:ready fires.
  // Boot.js's GF:ready handler runs before ours (GameFramework loads first),
  // so waiting for GF:ready causes a race condition → black screen.
  window.GAME = window.GAME || { scenes: {} };
  window.GAME.scenes.TitleScreen = TitleScene;
  window.GAME.scenes.Main = MainScene;
  window.GAME.scenes.GameOver = GameOverScene;

  // Register sprites with the SpriteSystem.
  // Sprite files store definitions in GF.spriteRegistrations;
  // we collect them here and register before the game starts.
  window.addEventListener('GF:ready', function () {
    if (GF.spriteRegistrations) {
      var spriteMap = {};
      Object.values(GF.spriteRegistrations).forEach(function (map) {
        Object.assign(spriteMap, map);
      });
      var game = GF.game;
      if (game && game.sprites) {
        game.sprites.registerSprites(spriteMap);
      }
    }
    // Bind input actions so TitleScene can use them.
    // (Controls module only runs on GameScene, not TitleScene)
    if (GF.game && GF.game.engine && GF.game.engine.input) {
      GF.game.engine.input
        .bind('left',  'KeyA', 'ArrowLeft')
        .bind('right', 'KeyD', 'ArrowRight')
        .bind('fire',  'Space', 'KeyZ', 'KeyJ')
        .bind('confirm', 'Space', 'Enter')
        .bind('boss', 'KeyB')
        .bind('pause', 'Escape', 'KeyP', 'KeyK');
    }
  });

})(window.GF = window.GF || {});
