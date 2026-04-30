// GameFramework/games/SceneTransitionDemo/SceneTransitionDemoGame.js
//
// "Orb Catcher" — a minimal click-to-score game whose sole purpose is
// demonstrating every built-in TweenSystem scene transition.
//
// Scene flow and transitions used:
//   MenuScene  ──[player's choice]──▶  GameScene
//   GameScene  ──[fade]──────────────▶  PauseScene   (push / pop)
//   PauseScene ──[fade]──────────────▶  GameScene    (pop)
//   PauseScene ──[iris]──────────────▶  MenuScene    (replaceAll)
//   GameScene  ──[wipe]──────────────▶  GameOverScene (replace)
//   GameOverScene ──[player's choice]▶  GameScene    (replace)
//   GameOverScene ──[iris]───────────▶  MenuScene    (replace)
//
// Transition types available for player selection on the menu:
//   iris, fade, wipe, flash

(function (GF) {
  'use strict';

  const W = () => GF.GAME_CONFIG.engine.width;
  const H = () => GF.GAME_CONFIG.engine.height;

  // ── Shared mutable state (persists across scene switches) ──────────────────
  const state = {
    score:        0,
    highScore:    0,
    transIndex:   0,   // index into TRANS_TYPES
  };

  // ── Transition catalogue ────────────────────────────────────────────────────
  const TRANS_TYPES = ['iris', 'fade', 'wipe', 'flash'];

  // Default overlay colour per type (flash must be white)
  const TRANS_COLOR = {
    iris:  '#000000',
    fade:  '#000000',
    wipe:  '#0a0020',
    flash: '#ffffff',
  };

  const TRANS_DESC = {
    iris:  'Classic circle iris  ·  open / close from centre',
    fade:  'Fade to black and back',
    wipe:  'Curtain sweeps horizontally across the screen',
    flash: 'Flash to white and back',
  };

  function selTrans() { return TRANS_TYPES[state.transIndex]; }
  function selColor() { return TRANS_COLOR[selTrans()]; }

  // ── Shared drawing helpers ──────────────────────────────────────────────────

  /** Generate an array of background stars. */
  function makeStars(n) {
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push({
        x:     GF.Math.rand(0, W()),
        y:     GF.Math.rand(0, H()),
        r:     GF.Math.rand(0.5, 1.8),
        phase: GF.Math.rand(0, GF.Math.TAU),
        speed: GF.Math.rand(0.6, 2.2),
      });
    }
    return arr;
  }

  /** Draw twinkling stars. time is seconds elapsed. */
  function drawStars(ctx, stars, time) {
    for (const s of stars) {
      const b = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(s.phase + time * s.speed));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, GF.Math.TAU);
      ctx.fillStyle = `rgba(255,255,255,${b.toFixed(2)})`;
      ctx.fill();
    }
  }

  /**
   * Draw a glowing orb centred at the canvas origin.
   * The caller must translate to (x, y) before invoking.
   */
  function drawOrbAt(ctx, r, fillColor, glowColor) {
    // Soft outer glow
    const grd = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 2.4);
    grd.addColorStop(0, glowColor);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.4, 0, GF.Math.TAU);
    ctx.fillStyle = grd;
    ctx.fill();

    // Orb body
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, GF.Math.TAU);
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Specular highlight
    ctx.beginPath();
    ctx.arc(-r * 0.27, -r * 0.30, r * 0.21, 0, GF.Math.TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.48)';
    ctx.fill();
  }

  /** Fill background with a top-to-bottom linear gradient. */
  function drawBg(ctx, topColor, bottomColor) {
    const grd = ctx.createLinearGradient(0, 0, 0, H());
    grd.addColorStop(0, topColor);
    grd.addColorStop(1, bottomColor);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W(), H());
  }

  /**
   * Guard used in every DOM click handler to ignore clicks that arrive while
   * a transition is playing (DOM listeners are not blocked by the engine).
   */
  function isTransitioning(engine) {
    const sm = engine.getSystem('SceneManager');
    return sm && sm._activeTransition != null;
  }

  // ── MenuScene ───────────────────────────────────────────────────────────────
  class MenuScene extends GF.Scene {

    init(engine) {
      this._time  = 0;
      this._stars = makeStars(110);
      this._pulse = { alpha: 0.55 }; // animated by TweenSystem

      this._clickHandler = (e) => this._onClick(e, engine);
    }

    enter(engine) {
      engine.canvas.addEventListener('mousedown', this._clickHandler);

      // Pulse the "click to start" label
      const tw = engine.getSystem('TweenSystem');
      tw.killAll(this._pulse);
      this._pulse.alpha = 0.55;
      tw.create(this._pulse, { alpha: 1.0 }, 0.9, {
        ease: 'inOutSine', yoyo: true, loop: true,
      });
    }

    exit(engine) {
      engine.canvas.removeEventListener('mousedown', this._clickHandler);
      engine.getSystem('TweenSystem').killAll(this._pulse);
    }

    // ── Input ────────────────────────────────────────────────────────────────

    _onClick(e, engine) {
      if (isTransitioning(engine)) return;

      const rect  = engine.canvas.getBoundingClientRect();
      const sx    = W() / rect.width;
      const sy    = H() / rect.height;
      const mx    = (e.clientX - rect.left) * sx;
      const my    = (e.clientY - rect.top)  * sy;

      // Left / right arrows to cycle transition type
      const arrowR = W() / 2 + 120;
      const arrowL = W() / 2 - 120;
      const selY   = H() / 2 + 10;
      if (Math.abs(my - selY) < 30) {
        if (mx > arrowR - 30 && mx < arrowR + 30) {
          state.transIndex = (state.transIndex + 1) % TRANS_TYPES.length;
          return;
        }
        if (mx > arrowL - 30 && mx < arrowL + 30) {
          state.transIndex = (state.transIndex - 1 + TRANS_TYPES.length) % TRANS_TYPES.length;
          return;
        }
      }

      // Anywhere else → start game
      this._startGame(engine);
    }

    _startGame(engine) {
      state.score = 0;
      engine.getSystem('SceneManager').replaceWithTransition(new GameScene(), {
        type:     selTrans(),
        duration: 0.8,
        color:    selColor(),
      });
    }

    update(dt, engine) {
      this._time += dt;

      if (engine.input.wasPressed('ArrowRight')) {
        state.transIndex = (state.transIndex + 1) % TRANS_TYPES.length;
      }
      if (engine.input.wasPressed('ArrowLeft')) {
        state.transIndex = (state.transIndex - 1 + TRANS_TYPES.length) % TRANS_TYPES.length;
      }
      if (engine.input.wasPressed('Space') || engine.input.wasPressed('Enter')) {
        this._startGame(engine);
      }
    }

    render(ctx) {
      drawBg(ctx, '#0e0a2e', '#08081a');
      drawStars(ctx, this._stars, this._time);

      ctx.save();
      ctx.textAlign = 'center';

      // ── Title ──────────────────────────────────────────────────────────────
      ctx.font        = 'bold 58px "Courier New", monospace';
      ctx.fillStyle   = '#ffffff';
      ctx.shadowColor = '#6c5ce7';
      ctx.shadowBlur  = 32;
      ctx.fillText('ORB CATCHER', W() / 2, 120);

      ctx.font        = '16px "Courier New", monospace';
      ctx.fillStyle   = '#a29bfe';
      ctx.shadowBlur  = 0;
      ctx.fillText('Scene Transition Demo  ·  GameFramework', W() / 2, 152);

      // ── Transition selector ────────────────────────────────────────────────
      const cx   = W() / 2;
      const selY = H() / 2 + 10;

      ctx.font      = '12px "Courier New", monospace';
      ctx.fillStyle = '#636e72';
      ctx.fillText('TRANSITION TYPE  ( ◄ ► or arrow keys )', cx, selY - 36);

      // Arrows
      ctx.font      = 'bold 22px monospace';
      ctx.fillStyle = '#a29bfe';
      ctx.fillText('◄', cx - 120, selY + 4);
      ctx.fillText('►', cx + 120, selY + 4);

      // Selected name
      ctx.font        = 'bold 30px "Courier New", monospace';
      ctx.fillStyle   = '#ffffff';
      ctx.shadowColor = '#a29bfe';
      ctx.shadowBlur  = 18;
      ctx.fillText(selTrans().toUpperCase(), cx, selY + 4);

      // Description
      ctx.shadowBlur  = 0;
      ctx.font        = '13px "Courier New", monospace';
      ctx.fillStyle   = '#74b9ff';
      ctx.fillText(TRANS_DESC[selTrans()], cx, selY + 32);

      // ── Start prompt ───────────────────────────────────────────────────────
      ctx.globalAlpha = this._pulse.alpha;
      ctx.font        = 'bold 22px "Courier New", monospace';
      ctx.fillStyle   = '#00cec9';
      ctx.shadowColor = '#00cec9';
      ctx.shadowBlur  = 18;
      ctx.fillText('▶  CLICK  OR  SPACE  TO  START', cx, H() / 2 + 110);

      ctx.restore();
    }
  }

  // ── GameScene ───────────────────────────────────────────────────────────────
  class GameScene extends GF.Scene {

    init(engine) {
      this._time      = 0;
      this._gameTime  = GF.GAME_CONFIG.game.duration;
      this._stars     = makeStars(80);
      this._orbs      = this._spawnOrbs(engine);

      this._clickHandler = (e) => this._onClick(e, engine);
    }

    enter(engine) {
      engine.canvas.addEventListener('mousedown', this._clickHandler);
    }

    exit(engine) {
      engine.canvas.removeEventListener('mousedown', this._clickHandler);
    }

    // ── Orb lifecycle ────────────────────────────────────────────────────────

    _spawnOrbs(engine) {
      const cfg = GF.GAME_CONFIG.game;
      return GF.GAME_CONFIG.orbs.map((orbDef, i) => {
        const angle = GF.Math.randAngle();
        const speed = GF.Math.rand(cfg.orbSpeed.min, cfg.orbSpeed.max);
        return {
          x:           GF.Math.rand(cfg.orbRadius + 30, W() - cfg.orbRadius - 30),
          y:           GF.Math.rand(cfg.orbRadius + 60, H() - cfg.orbRadius - 20),
          vx:          Math.cos(angle) * speed,
          vy:          Math.sin(angle) * speed,
          r:           cfg.orbRadius,
          fill:        orbDef.fill,
          glow:        orbDef.glow,
          scale:       1,
          visible:     true,
          dying:       false,
          respawnTimer: 0,
          id:          i,
        };
      });
    }

    _onClick(e, engine) {
      if (isTransitioning(engine)) return;

      const rect = engine.canvas.getBoundingClientRect();
      const sx   = W() / rect.width;
      const sy   = H() / rect.height;
      const mx   = (e.clientX - rect.left) * sx;
      const my   = (e.clientY - rect.top)  * sy;

      const tw = engine.getSystem('TweenSystem');
      for (const orb of this._orbs) {
        if (!orb.visible || orb.dying) continue;
        const dx = mx - orb.x, dy = my - orb.y;
        if (dx * dx + dy * dy <= orb.r * orb.r) {
          orb.dying = true;
          orb.scale = 1;
          state.score += GF.GAME_CONFIG.game.orbPoints;
          // Scale-down pop animation
          tw.create(orb, { scale: 0 }, 0.18, {
            ease: 'inBack',
            onComplete: () => {
              orb.dying        = false;
              orb.visible      = false;
              orb.respawnTimer = GF.GAME_CONFIG.game.respawnTime;
            },
          });
          break;
        }
      }
    }

    // ── Update ───────────────────────────────────────────────────────────────

    update(dt, engine) {
      this._time     += dt;
      this._gameTime -= dt;

      // Round over
      if (this._gameTime <= 0) {
        this._gameTime = 0;
        if (state.score > state.highScore) state.highScore = state.score;
        engine.getSystem('SceneManager').replaceWithTransition(new GameOverScene(), {
          type:     'wipe',
          duration: 0.7,
          color:    '#0a0020',
        });
        return;
      }

      // Pause
      if (engine.input.wasPressed('Escape') || engine.input.wasPressed('KeyP')) {
        engine.getSystem('SceneManager').pushWithTransition(new PauseScene(), {
          type:     'fade',
          duration: 0.35,
        });
        return;
      }

      // Move orbs
      const cfg = GF.GAME_CONFIG.game;
      const tw  = engine.getSystem('TweenSystem');

      for (const orb of this._orbs) {
        if (!orb.visible && !orb.dying) {
          // Respawn countdown
          orb.respawnTimer -= dt;
          if (orb.respawnTimer <= 0) {
            const angle = GF.Math.randAngle();
            const speed = GF.Math.rand(cfg.orbSpeed.min, cfg.orbSpeed.max);
            orb.x       = GF.Math.rand(cfg.orbRadius + 30, W() - cfg.orbRadius - 30);
            orb.y       = GF.Math.rand(cfg.orbRadius + 60, H() - cfg.orbRadius - 20);
            orb.vx      = Math.cos(angle) * speed;
            orb.vy      = Math.sin(angle) * speed;
            orb.scale   = 0;
            orb.visible = true;
            // Elastic pop-in
            tw.create(orb, { scale: 1 }, 0.45, { ease: 'outElastic' });
          }
          continue;
        }

        if (orb.dying) continue; // physics handled by tween

        orb.x += orb.vx * dt;
        orb.y += orb.vy * dt;

        // Bounce off canvas edges (leave 50 px header for HUD)
        if (orb.x - orb.r < 0)       { orb.x = orb.r;        orb.vx =  Math.abs(orb.vx); }
        if (orb.x + orb.r > W())     { orb.x = W() - orb.r;  orb.vx = -Math.abs(orb.vx); }
        if (orb.y - orb.r < 50)      { orb.y = 50 + orb.r;   orb.vy =  Math.abs(orb.vy); }
        if (orb.y + orb.r > H())     { orb.y = H() - orb.r;  orb.vy = -Math.abs(orb.vy); }
      }
    }

    // ── Render ───────────────────────────────────────────────────────────────

    render(ctx) {
      drawBg(ctx, '#050a2e', '#08081a');
      drawStars(ctx, this._stars, this._time);

      // Orbs
      for (const orb of this._orbs) {
        if (!orb.visible && !orb.dying) continue;
        const scale = orb.dying ? (orb.scale || 0) : orb.scale;
        ctx.save();
        ctx.translate(orb.x, orb.y);
        if (scale !== 1) ctx.scale(scale, scale);
        drawOrbAt(ctx, orb.r, orb.fill, orb.glow);
        ctx.restore();
      }

      this._drawHUD(ctx);
    }

    _drawHUD(ctx) {
      const timeLeft = Math.max(0, this._gameTime);
      const urgent   = timeLeft <= 5;

      ctx.save();

      // Score
      ctx.textAlign  = 'left';
      ctx.font       = 'bold 12px "Courier New", monospace';
      ctx.fillStyle  = '#636e72';
      ctx.fillText('SCORE', 20, 26);
      ctx.font       = 'bold 28px "Courier New", monospace';
      ctx.fillStyle  = '#ffffff';
      ctx.fillText(state.score, 20, 52);

      // Timer
      ctx.textAlign  = 'right';
      ctx.font       = 'bold 12px "Courier New", monospace';
      ctx.fillStyle  = '#636e72';
      ctx.fillText('TIME', W() - 20, 26);
      ctx.font       = 'bold 28px "Courier New", monospace';
      ctx.fillStyle  = urgent ? '#ff6b6b' : '#ffffff';
      if (urgent) { ctx.shadowColor = '#ff3030'; ctx.shadowBlur = 16; }
      ctx.fillText(Math.ceil(timeLeft), W() - 20, 52);
      ctx.shadowBlur = 0;

      // Hint
      ctx.textAlign  = 'center';
      ctx.font       = '12px "Courier New", monospace';
      ctx.fillStyle  = 'rgba(255,255,255,0.25)';
      ctx.fillText('ESC — PAUSE', W() / 2, 24);

      ctx.restore();
    }
  }

  // ── PauseScene ──────────────────────────────────────────────────────────────
  class PauseScene extends GF.Scene {

    init(engine) {
      this._stars = makeStars(50);
      this._time  = 0;
      this._clickHandler = (e) => this._onClick(e, engine);
    }

    enter(engine) {
      engine.canvas.addEventListener('mousedown', this._clickHandler);
    }

    exit(engine) {
      engine.canvas.removeEventListener('mousedown', this._clickHandler);
    }

    _onClick(e, engine) {
      if (isTransitioning(engine)) return;
      const rect = engine.canvas.getBoundingClientRect();
      const my   = (e.clientY - rect.top) * (H() / rect.height);

      if (my > H() / 2 + 20 && my < H() / 2 + 70)  this._resume(engine);
      if (my > H() / 2 + 80 && my < H() / 2 + 130) this._quitToMenu(engine);
    }

    _resume(engine) {
      engine.getSystem('SceneManager').popWithTransition({
        type: 'fade', duration: 0.35,
      });
    }

    _quitToMenu(engine) {
      state.score = 0;
      engine.getSystem('SceneManager').replaceAllWithTransition(new MenuScene(), {
        type: 'iris', duration: 0.8,
      });
    }

    update(dt, engine) {
      this._time += dt;
      if (engine.input.wasPressed('Escape') ||
          engine.input.wasPressed('Enter')  ||
          engine.input.wasPressed('KeyR')) {
        this._resume(engine);
      }
      if (engine.input.wasPressed('KeyQ') || engine.input.wasPressed('KeyM')) {
        this._quitToMenu(engine);
      }
    }

    render(ctx) {
      drawBg(ctx, '#0b0b28', '#040408');
      drawStars(ctx, this._stars, this._time);

      // Dark vignette overlay
      ctx.fillStyle = 'rgba(0,0,15,0.55)';
      ctx.fillRect(0, 0, W(), H());

      ctx.save();
      ctx.textAlign = 'center';

      // Title
      ctx.font        = 'bold 62px "Courier New", monospace';
      ctx.fillStyle   = '#ffffff';
      ctx.shadowColor = '#6c5ce7';
      ctx.shadowBlur  = 44;
      ctx.fillText('PAUSED', W() / 2, H() / 2 - 20);

      // Resume
      ctx.shadowBlur  = 0;
      ctx.font        = 'bold 21px "Courier New", monospace';
      ctx.fillStyle   = '#00cec9';
      ctx.shadowColor = '#00cec9';
      ctx.shadowBlur  = 12;
      ctx.fillText('[ ENTER ]  RESUME', W() / 2, H() / 2 + 52);

      // Quit
      ctx.shadowBlur  = 0;
      ctx.font        = 'bold 21px "Courier New", monospace';
      ctx.fillStyle   = '#fd79a8';
      ctx.fillText('[ Q ]  MAIN MENU', W() / 2, H() / 2 + 108);

      ctx.restore();
    }
  }

  // ── GameOverScene ────────────────────────────────────────────────────────────
  class GameOverScene extends GF.Scene {

    init(engine) {
      this._time         = 0;
      this._stars        = makeStars(80);
      this._displayScore = { value: 0 }; // tweened up to state.score
      this._pulse        = { alpha: 0 };
      this._isNewHigh    = state.score > 0 && state.score >= state.highScore;

      this._clickHandler = (e) => this._onClick(e, engine);
    }

    enter(engine) {
      engine.canvas.addEventListener('mousedown', this._clickHandler);

      const tw = engine.getSystem('TweenSystem');

      // Count-up score animation
      this._displayScore.value = 0;
      tw.create(this._displayScore, { value: state.score }, 1.1, {
        ease: 'outQuart', delay: 0.2,
      });

      // Delayed pulse on the "play again" prompt
      this._pulse.alpha = 0;
      tw.create(this._pulse, { alpha: 0.65 }, 0.4, {
        delay: 1.4,
        onComplete: () => {
          tw.create(this._pulse, { alpha: 1 }, 0.85, {
            ease: 'inOutSine', yoyo: true, loop: true,
          });
        },
      });
    }

    exit(engine) {
      engine.canvas.removeEventListener('mousedown', this._clickHandler);
      const tw = engine.getSystem('TweenSystem');
      tw.killAll(this._displayScore);
      tw.killAll(this._pulse);
    }

    _onClick(e, engine) {
      if (isTransitioning(engine)) return;
      const rect = engine.canvas.getBoundingClientRect();
      const my   = (e.clientY - rect.top) * (H() / rect.height);

      if (my > H() / 2 + 88  && my < H() / 2 + 138) this._playAgain(engine);
      if (my > H() / 2 + 148 && my < H() / 2 + 198) this._goToMenu(engine);
    }

    _playAgain(engine) {
      state.score = 0;
      engine.getSystem('SceneManager').replaceWithTransition(new GameScene(), {
        type:     selTrans(),
        duration: 0.8,
        color:    selColor(),
      });
    }

    _goToMenu(engine) {
      engine.getSystem('SceneManager').replaceWithTransition(new MenuScene(), {
        type: 'iris', duration: 0.8,
      });
    }

    update(dt, engine) {
      this._time += dt;
      if (engine.input.wasPressed('Space') || engine.input.wasPressed('Enter')) {
        this._playAgain(engine);
      }
      if (engine.input.wasPressed('KeyM') || engine.input.wasPressed('Escape')) {
        this._goToMenu(engine);
      }
    }

    render(ctx) {
      drawBg(ctx, '#1c0505', '#08081a');
      drawStars(ctx, this._stars, this._time);

      // Red centre glow
      const grd = ctx.createRadialGradient(W() / 2, H() / 2, 0, W() / 2, H() / 2, 220);
      grd.addColorStop(0, 'rgba(200,30,30,0.22)');
      grd.addColorStop(1, 'rgba(200,30,30,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W(), H());

      ctx.save();
      ctx.textAlign = 'center';

      // Title
      ctx.font        = 'bold 62px "Courier New", monospace';
      ctx.fillStyle   = '#ff6b6b';
      ctx.shadowColor = '#ff2020';
      ctx.shadowBlur  = 40;
      ctx.fillText('GAME OVER', W() / 2, H() / 2 - 80);

      // Score label
      ctx.shadowBlur  = 0;
      ctx.font        = '14px "Courier New", monospace';
      ctx.fillStyle   = '#8080a0';
      ctx.fillText('SCORE', W() / 2, H() / 2 - 14);

      // Score value (counts up)
      ctx.font        = 'bold 54px "Courier New", monospace';
      ctx.fillStyle   = '#ffffff';
      ctx.shadowColor = '#74b9ff';
      ctx.shadowBlur  = 22;
      ctx.fillText(Math.round(this._displayScore.value), W() / 2, H() / 2 + 44);

      // High-score callout
      ctx.shadowBlur = 0;
      if (this._isNewHigh && state.score > 0) {
        ctx.font        = 'bold 15px "Courier New", monospace';
        ctx.fillStyle   = '#ffe66d';
        ctx.shadowColor = '#ffe66d';
        ctx.shadowBlur  = 14;
        ctx.fillText('✦  NEW HIGH SCORE  ✦', W() / 2, H() / 2 + 74);
      } else if (state.highScore > 0) {
        ctx.shadowBlur  = 0;
        ctx.font        = '13px "Courier New", monospace';
        ctx.fillStyle   = '#636e72';
        ctx.fillText('BEST: ' + state.highScore, W() / 2, H() / 2 + 74);
      }

      // Play Again (pulsing)
      ctx.shadowBlur  = 0;
      ctx.globalAlpha = this._pulse.alpha;
      ctx.font        = 'bold 20px "Courier New", monospace';
      ctx.fillStyle   = '#00cec9';
      ctx.shadowColor = '#00cec9';
      ctx.shadowBlur  = 14;
      ctx.fillText('[ SPACE ]  PLAY AGAIN  ·  ' + selTrans().toUpperCase() + ' transition', W() / 2, H() / 2 + 118);

      // Menu
      ctx.globalAlpha = 1;
      ctx.shadowBlur  = 0;
      ctx.font        = '17px "Courier New", monospace';
      ctx.fillStyle   = '#a29bfe';
      ctx.fillText('[ M ]  MAIN MENU', W() / 2, H() / 2 + 166);

      ctx.restore();
    }
  }

  // ── Bootstrap ────────────────────────────────────────────────────────────────
  window.addEventListener('GF:ready', async function () {
    const { engine, scenes } = await GF.createGameAsync(
      GF.GAME_CONFIG.engine,
      GF.GAME_CONFIG.physics,
      {
        gameName:  GF.GAME_CONFIG.name,
        particles: false,
        tilemap:   false,
        dialogue:  false,
        debug:     false,
        audioOpts: { disabled: true },
      }
    );

    // Bind useful keys (other keys are checked by raw code in wasPressed)
    engine.input.bind('pause', 'Escape', 'KeyP');

    scenes.push(new MenuScene(), engine);
    engine.start();
  });

})(window.GF = window.GF || {});
