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
    console.log('[MainScene] init: engine.config.width=' + engine.config.width + ' height=' + engine.config.height);
    GF.GameScene.prototype.init.call(this, engine);
  };
  MainScene.prototype.enter = function(engine) {
    console.log('[MainScene] enter');
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
      menuAction: 'boss',
      onStart: function (engine) {
        engine.getSystem('SceneManager').replace(new MainScene(), engine);
      },
      onMenu: function (engine) {
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
    var t = this._t || 0;

    // Draw background gradient
    var bgGradient = ctx.createLinearGradient(0, 0, 0, H);
    bgGradient.addColorStop(0, '#1a0d1a');
    bgGradient.addColorStop(1, '#0d0d2e');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, W, H);

    // Draw nebula effects (batched)
    ctx.beginPath();
    for (var i = 0; i < 3; i++) {
      var offset = Math.sin(t + i) * 50;
      ctx.moveTo(W / 2 + offset + 120 + i * 30, H / 3 + i * 40);
      ctx.arc(W / 2 + offset, H / 3 + i * 40, 120 + i * 30, 0, Math.PI * 2);
    }
    ctx.fillStyle = 'rgba(255, 100, 150, 0.15)';
    ctx.fill();

    // Animated stars — batched by brightness
    var dimStars = [], brightStars = [];
    for (var i = 0; i < 40; i++) {
      var sx = ((i * 137 + t * 20) % W);
      var sy = ((i * 211 + t * 30) % H);
      var alpha = 0.4 + 0.4 * Math.sin(t * 2 + i * 0.5);
      var size = Math.abs(Math.sin(t + i * 0.3)) * 3;
      if (alpha < 0.6) {
        dimStars.push(sx, sy, size);
      } else {
        brightStars.push(sx, sy, size);
      }
    }
    ctx.fillStyle = 'rgba(255, 200, 240, 0.5)';
    for (var i = 0; i < dimStars.length; i += 3) {
      ctx.fillRect(dimStars[i], dimStars[i+1], dimStars[i+2], dimStars[i+2]);
    }
    ctx.fillStyle = 'rgba(255, 220, 255, 0.8)';
    for (var i = 0; i < brightStars.length; i += 3) {
      ctx.fillRect(brightStars[i], brightStars[i+1], brightStars[i+2], brightStars[i+2]);
    }

    // Title glow with animated gradient
    ctx.save();
    ctx.shadowColor = '#ff69b4';
    ctx.shadowBlur = 25 + 5 * Math.sin(t * 3);
    
    var titleGradient = ctx.createLinearGradient(0, H * 0.32 - 30, 0, H * 0.32 + 30);
    titleGradient.addColorStop(0, '#ffccff');
    titleGradient.addColorStop(0.5, '#ff8ec4');
    titleGradient.addColorStop(1, '#ff66cc');
    ctx.fillStyle = titleGradient;
    ctx.font = 'bold 44px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('KAT INVADERS', W / 2, H * 0.32);
    ctx.restore();

    // Subtitle with pulse animation
    var alpha = 0.55 + 0.45 * Math.sin(t * 4);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.font = '22px monospace';
    ctx.fillText('Press SPACE to Start', W / 2, H * 0.52);
    ctx.restore();

    // Controls
    var controlAlpha = 0.7 + 0.2 * Math.sin(t * 2);
    ctx.save();
    ctx.globalAlpha = controlAlpha;
    ctx.fillStyle = '#aaddff';
    ctx.font = '16px monospace';
    ctx.fillText('← → or A D to move  |  SPACE to fire', W / 2, H * 0.68);
    ctx.fillText('Collect powerups • Defeat the boss • Save Earth!', W / 2, H * 0.78);
    ctx.fillText('Every 4 levels: BOSS BATTLE!', W / 2, H * 0.88);
    ctx.restore();

    // Boss prompt with animated glow
    var bossAlpha = 0.6 + 0.4 * Math.sin(t * 2.5);
    ctx.save();
    ctx.globalAlpha = bossAlpha;
    var bossGradient = ctx.createLinearGradient(0, H * 0.96 - 15, 0, H * 0.96 + 15);
    bossGradient.addColorStop(0, '#ffdd44');
    bossGradient.addColorStop(0.5, '#ffaa00');
    bossGradient.addColorStop(1, '#ff8800');
    ctx.fillStyle = bossGradient;
    ctx.font = 'bold 20px monospace';
    ctx.fillText('Press B for Bossfight', W / 2, H * 0.96);
    ctx.restore();
    
    // High score on title screen — same save slot the HighScore module writes.
    if (GF.game && GF.game.save) {
      var saveData = GF.game.save.read('highscore');
      if (saveData && saveData.data && saveData.data.highScore) {
        ctx.save();
        ctx.fillStyle = '#aaffcc';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('High Score: ' + saveData.data.highScore, W / 2, H * 0.92);
        ctx.restore();
      }
    }
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
        console.log('[KatInvaders] Registered ' + Object.keys(spriteMap).length + ' sprites');
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
      console.log('[KatInvaders] Input actions bound');
    }
  });
  console.log('[KatInvaders] Scenes registered immediately');

})(window.GF = window.GF || {});
