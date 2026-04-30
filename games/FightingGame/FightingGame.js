// GameFramework/games/FightingGame/FightingGame.js
// Main game logic — uses GameFramework API and GAME_CONFIG sprite names only.

(function (GF) {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────

  const STATE = {
    MENU      : 'menu',
    COUNTDOWN : 'countdown',
    FIGHT     : 'fight',
    ROUND_END : 'round_end',
    GAME_OVER : 'game_over',
  };

  const FIGHTER_STATE = {
    IDLE  : 'idle',
    WALK  : 'walk',
    JUMP  : 'jump',
    FALL  : 'fall',
    CROUCH: 'crouch',
    BLOCK : 'block',
    ATTACK: 'attack',
    HIT   : 'hit',
    KO    : 'ko',
    WIN   : 'win',
  };

  const ATTACK_ANIMS = ['lightPunch','heavyPunch','lightKick','heavyKick','special'];

  // ── Fighter class ──────────────────────────────────────────────────────────

  class Fighter {
    constructor(cfg, spriteDef, physSystem, sprites) {
      this.cfg        = cfg;
      this.spriteDef  = spriteDef;
      this.name       = cfg.displayName;
      this.color      = cfg.color;

      // Physics body
      this.body = physSystem.addBody(new GF.PhysicsBody({
        x      : cfg.startX - cfg.hitbox.w / 2,
        y      : physSystem.floorY - cfg.hitbox.h,
        width  : cfg.hitbox.w,
        height : cfg.hitbox.h,
        maxSpeedX: cfg.speed * 2,
        maxSpeedY: 1400,
        friction : 0.6,
      }));

      // Animator
      this.animator = sprites.createAnimator(cfg.sprite, 'idle');
      this.animator.flipX = (cfg.startFacing < 0);

      // Stats
      this.health    = cfg.maxHealth;
      this.maxHealth = cfg.maxHealth;
      this.facing    = cfg.startFacing; // 1=right, -1=left

      // State machine
      this.state      = FIGHTER_STATE.IDLE;
      this.prevState  = null;
      this.stateTimer = 0;   // seconds in current state
      this.stunTimer  = 0;   // stun remaining
      this.attackMove = null;// current attack name
      this.attackLanded = false;

      // Combos
      this.comboCount = 0;
      this.comboTimer = 0;

      // Round wins
      this.wins = 0;
    }

    get x()      { return this.body.x + this.body.width  / 2; }  // center x
    get y()      { return this.body.y + this.body.height;      }  // feet y
    get grounded(){ return this.body.grounded; }

    resetForRound(physSystem, cfg) {
      this.body.x  = cfg.startX - this.body.width / 2;
      this.body.y  = physSystem.floorY - this.body.height;
      this.body.vx = 0;
      this.body.vy = 0;
      this.health  = this.maxHealth;
      this.state   = FIGHTER_STATE.IDLE;
      this.stateTimer  = 0;
      this.stunTimer   = 0;
      this.attackMove  = null;
      this.attackLanded = false;
      this.comboCount  = 0;
      this.comboTimer  = 0;
      this.animator.play('idle', true);
    }

    // ── Facing ───────────────────────────────────────────────────────────────

    faceOpponent(other) {
      const dir = (other.x > this.x) ? 1 : -1;
      if (dir !== this.facing) {
        this.facing           = dir;
        this.animator.flipX   = (dir < 0);
      }
    }

    // ── Input → state ─────────────────────────────────────────────────────────

    processInput(input, actions, other) {
      if (this.state === FIGHTER_STATE.KO || this.state === FIGHTER_STATE.WIN) return;

      // Auto-face while idle/walking
      if (this.state === FIGHTER_STATE.IDLE || this.state === FIGHTER_STATE.WALK ||
          this.state === FIGHTER_STATE.CROUCH) {
        this.faceOpponent(other);
      }

      // While stunned, can only wait
      if (this.stunTimer > 0) return;

      // Attack inputs (highest priority)
      if (this.state !== FIGHTER_STATE.ATTACK && this.state !== FIGHTER_STATE.HIT) {
        for (const move of ATTACK_ANIMS) {
          if (input.wasPressed(actions[move])) {
            this._startAttack(move);
            return;
          }
        }
      }

      // Movement / block
      if (this.state === FIGHTER_STATE.ATTACK || this.state === FIGHTER_STATE.HIT) return;

      const left  = input.isDown(actions.left);
      const right = input.isDown(actions.right);
      const jump  = input.wasPressed(actions.jump);
      const crouch = input.isDown(actions.crouch);
      const block  = input.isDown(actions.block);

      if (block && this.grounded) {
        this._setState(FIGHTER_STATE.BLOCK);
        this.body.vx = 0;
        return;
      }

      if (crouch && this.grounded) {
        this._setState(FIGHTER_STATE.CROUCH);
        this.body.vx = 0;
        return;
      }

      if (jump && this.grounded) {
        this.body.vy = this.cfg.jumpPower;
        this._setState(FIGHTER_STATE.JUMP);
      }

      const spd = this.cfg.speed * (this.grounded ? 1 : 0.85);
      if (left)       { this.body.vx = -spd; this._setState(FIGHTER_STATE.WALK); }
      else if (right) { this.body.vx =  spd; this._setState(FIGHTER_STATE.WALK); }
      else if (this.grounded) {
        if (this.state === FIGHTER_STATE.WALK || this.state === FIGHTER_STATE.BLOCK ||
            this.state === FIGHTER_STATE.CROUCH) {
          this._setState(FIGHTER_STATE.IDLE);
        }
      }
    }

    _startAttack(moveName) {
      this.attackMove   = moveName;
      this.attackLanded = false;
      this._setState(FIGHTER_STATE.ATTACK);
      this.animator.play(moveName, true);
      this.animator.onFinish(() => {
        if (this.state === FIGHTER_STATE.ATTACK) {
          this._setState(FIGHTER_STATE.IDLE);
        }
      });
    }

    _setState(newState) {
      if (this.state === newState) return;
      this.prevState  = this.state;
      this.state      = newState;
      this.stateTimer = 0;

      // Sync animation
      switch (newState) {
        case FIGHTER_STATE.IDLE  : this.animator.play('idle');   break;
        case FIGHTER_STATE.WALK  : this.animator.play('walk');   break;
        case FIGHTER_STATE.JUMP  : this.animator.play('jump');   break;
        case FIGHTER_STATE.FALL  : this.animator.play('fall');   break;
        case FIGHTER_STATE.CROUCH: this.animator.play('crouch'); break;
        case FIGHTER_STATE.BLOCK : this.animator.play('block');  break;
        case FIGHTER_STATE.KO    : this.animator.play('ko');     break;
        case FIGHTER_STATE.WIN   : this.animator.play('victory');break;
        // HIT / ATTACK animation is set by the caller
      }
    }

    // ── Receive hit ───────────────────────────────────────────────────────────

    receiveHit(moveDef, attackerFacing) {
      if (this.state === FIGHTER_STATE.KO) return false;

      const blocking = (this.state === FIGHTER_STATE.BLOCK);
      const mult     = blocking ? this.cfg.blockDamageMultiplier : 1;
      const dmg      = Math.round(moveDef.damage * mult);

      this.health = Math.max(0, this.health - dmg);

      // Knockback away from attacker
      this.body.vx = attackerFacing * moveDef.knockback;
      if (!blocking) this.body.vy = -200;

      if (this.health <= 0) {
        this._setState(FIGHTER_STATE.KO);
      } else if (!blocking) {
        this.stunTimer = moveDef.stun;
        this.animator.play('hit', true);
        this.animator.onFinish(() => {
          if (this.state !== FIGHTER_STATE.KO) this._setState(FIGHTER_STATE.IDLE);
        });
        this._setState(FIGHTER_STATE.HIT);
      }

      return true; // hit confirmed
    }

    // ── Update ────────────────────────────────────────────────────────────────

    update(dt) {
      this.stateTimer += dt;
      if (this.stunTimer > 0) this.stunTimer -= dt;
      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) this.comboCount = 0;
      }

      // Jump → fall transition
      if (this.state === FIGHTER_STATE.JUMP && this.body.vy > 0) {
        this._setState(FIGHTER_STATE.FALL);
      }
      // Land
      if ((this.state === FIGHTER_STATE.FALL || this.state === FIGHTER_STATE.JUMP)
          && this.grounded) {
        this._setState(FIGHTER_STATE.IDLE);
      }
      // Air attack lands
      if (this.state === FIGHTER_STATE.ATTACK && this.grounded &&
          (this.prevState === FIGHTER_STATE.JUMP || this.prevState === FIGHTER_STATE.FALL)) {
        // allow
      }

      this.animator.update(dt);
    }

    // ── Attack hitbox check ──────────────────────────────────────────────────

    tryHitOpponent(other) {
      if (this.state !== FIGHTER_STATE.ATTACK || this.attackLanded) return false;
      if (!this.attackMove) return false;

      const hitWin = this.spriteDef.hitFrames[this.attackMove];
      if (!hitWin) return false;

      const fi = this.animator.frameIndex;
      if (fi < hitWin[0] || fi > hitWin[1]) return false;

      const move    = this.cfg.moves[this.attackMove];
      const reachX  = this.x + this.facing * move.range;
      const dist    = Math.abs(other.x - this.x);

      if (dist > move.range + 10) return false;
      // Vertical check: must be within hitbox height
      if (Math.abs(other.y - this.y) > 80) return false;

      const hit = other.receiveHit(move, this.facing);
      if (hit) {
        this.attackLanded = true;
        this.comboCount++;
        this.comboTimer = 1.5;
      }
      return hit;
    }

    // ── Draw ──────────────────────────────────────────────────────────────────

    draw(ctx) {
      this.animator.draw(ctx, this.x, this.y);
    }

    // Shadow under feet
    drawShadow(ctx) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle   = '#000000';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 2, 20, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── AI Controller ─────────────────────────────────────────────────────────

  class AIController {
    constructor(cfg) {
      this.cfg      = cfg;
      this._timer   = 0;
      this._action  = null; // pending action name
    }

    /** Returns a fake input-like object each frame for the CPU fighter. */
    think(dt, self, opponent, input) {
      this._timer += dt;

      const dist      = Math.abs(self.x - opponent.x);
      const dirToOpp  = (opponent.x > self.x) ? 1 : -1;
      const aiCfg     = this.cfg;
      const aggro     = aiCfg.aggressionBias;

      // Prepare virtual action set
      const acts = {};

      // React only every reactionTime seconds
      if (this._timer < aiCfg.reactionTime) return acts;
      this._timer = 0;

      const oState = opponent.state;

      // Block when opponent is attacking and close
      if (oState === FIGHTER_STATE.ATTACK && dist < 90) {
        if (Math.random() < 0.55) { acts['block'] = true; return acts; }
      }

      // Jump over projectile-special
      if (oState === FIGHTER_STATE.ATTACK &&
          opponent.attackMove === 'special' &&
          dist < 140 &&
          Math.random() < 0.5) {
        acts['jump'] = true;
        return acts;
      }

      // Close the gap or attack
      if (dist > 120) {
        // Move toward opponent
        acts[dirToOpp > 0 ? 'right' : 'left'] = true;
        // Random jump
        if (Math.random() < aiCfg.jumpFrequency) acts['jump'] = true;
      } else if (dist < 55) {
        // Too close – back off sometimes
        if (Math.random() < (1 - aggro) * 0.5) {
          acts[dirToOpp > 0 ? 'left' : 'right'] = true;
        } else {
          // Attack
          const moves = ATTACK_ANIMS;
          const move  = moves[Math.floor(Math.random() * (moves.length - 1))]; // skip special randomly
          acts[move]  = true;
        }
      } else {
        // Mid range – attack with aggression probability
        if (Math.random() < aggro) {
          const useSpecial = (self.health < 40 && dist < 80 && Math.random() < 0.35);
          const move = useSpecial ? 'special' :
            ATTACK_ANIMS[Math.floor(Math.random() * (ATTACK_ANIMS.length - 1))];
          acts[move] = true;
        } else {
          // Circle / approach
          acts[dirToOpp > 0 ? 'right' : 'left'] = true;
        }
      }

      return acts;
    }
  }

  // Wraps AI output into an object that looks like InputManager
  class AIInput {
    constructor() { this._acts = {}; }
    setActions(acts) { this._acts = acts; }
    isDown(action)     { return !!this._acts[action]; }
    wasPressed(action) { return !!this._acts[action]; }
    wasReleased()      { return false; }
  }

  // ── Particle system (simple visual sparks) ────────────────────────────────

  class ParticleEmitter {
    constructor() { this._particles = []; }

    emit(x, y, color, count, spreadX, spreadY) {
      for (let i = 0; i < count; i++) {
        this._particles.push({
          x, y,
          vx: (Math.random() - 0.5) * spreadX,
          vy: (Math.random() - 0.5) * spreadY - 60,
          color,
          life: 0.4 + Math.random() * 0.3,
          maxLife: 0.7,
          size: 2 + Math.random() * 4,
        });
      }
    }

    update(dt) {
      for (let i = this._particles.length - 1; i >= 0; i--) {
        const p = this._particles[i];
        p.vy  += 1200 * dt;
        p.x   += p.vx * dt;
        p.y   += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) this._particles.splice(i, 1);
      }
    }

    draw(ctx) {
      this._particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / (p.maxLife || 0.7));
        ctx.fillStyle   = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.restore();
      });
    }
  }

  // ── Stage background renderer ─────────────────────────────────────────────

  function drawStage(ctx, cfg, W, H) {
    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.7);
    sky.addColorStop(0, '#0a0012');
    sky.addColorStop(1, '#1a0030');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Distant glow orbs
    const glows = [
      { x: 150, y: 100, r: 60, c: 'rgba(0,100,255,0.06)' },
      { x: 650, y: 80,  r: 70, c: 'rgba(200,0,100,0.06)' },
    ];
    glows.forEach(g => {
      const gr = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
      gr.addColorStop(0, g.c);
      gr.addColorStop(1, 'transparent');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H);
    });

    // Floor slab
    const floorTop = cfg.physics.floorY;
    const floorGrad = ctx.createLinearGradient(0, floorTop, 0, floorTop + 100);
    floorGrad.addColorStop(0, '#2a0a4e');
    floorGrad.addColorStop(1, '#120022');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, floorTop, W, H - floorTop);

    // Floor highlight line
    ctx.strokeStyle = 'rgba(180,60,255,0.5)';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(0, floorTop);
    ctx.lineTo(W, floorTop);
    ctx.stroke();

    // Floor grid lines
    ctx.strokeStyle = 'rgba(80,20,120,0.25)';
    ctx.lineWidth   = 1;
    for (let gx = 0; gx < W; gx += 60) {
      ctx.beginPath();
      ctx.moveTo(gx, floorTop);
      ctx.lineTo(gx + 40, H);
      ctx.stroke();
    }

    // Stage edge markers
    ['left','right'].forEach((side, i) => {
      const ex = i === 0 ? cfg.physics.leftWall : cfg.physics.rightWall;
      ctx.strokeStyle = 'rgba(255,100,100,0.3)';
      ctx.lineWidth   = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(ex, floorTop - 100);
      ctx.lineTo(ex, H);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  // ── HUD renderer ─────────────────────────────────────────────────────────

  function drawHUD(ctx, p1, p2, roundNum, timeLeft, W, cfg) {
    const UI = GF.UISystem;
    const barW = 280, barH = 18;
    const pad  = 20;
    const barY = 20;

    // P1 health (left side)
    UI.drawHealthBar(ctx, pad, barY, barW, barH, p1.health, p1.maxHealth);
    // P2 health (right side, reversed fill)
    UI.drawHealthBar(ctx, W - pad - barW, barY, barW, barH, p2.health, p2.maxHealth,
      { reversed: true });

    // Names
    UI.drawText(ctx, p1.name, pad, barY + barH + 4,
      { font: 'bold 13px monospace', color: p1.color, shadow: true });
    UI.drawText(ctx, p2.name, W - pad - barW + barW, barY + barH + 4,
      { font: 'bold 13px monospace', color: p2.color, align: 'right', shadow: true });

    // Win indicators (dots)
    for (let i = 0; i < cfg.round.totalRounds; i++) {
      const dotX1 = pad + i * 18;
      const dotX2 = W - pad - barW + barW - i * 18;
      const dotY  = barY - 10;
      ctx.beginPath();
      ctx.arc(dotX1, dotY, 5, 0, Math.PI * 2);
      ctx.fillStyle = i < p1.wins ? p1.color : '#333';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(dotX2, dotY, 5, 0, Math.PI * 2);
      ctx.fillStyle = i < p2.wins ? p2.color : '#333';
      ctx.fill();
    }

    // Timer
    const timerStr = Math.ceil(Math.max(0, timeLeft)).toString();
    const timerX   = W / 2;
    UI.drawPanel(ctx, timerX - 30, barY - 2, 60, barH + 4, {
      bgColor: 'rgba(0,0,0,0.6)', borderColor: 'rgba(255,255,255,0.2)', radius: 4 });
    UI.drawText(ctx, timerStr, timerX, barY,
      { font: 'bold 20px monospace', color: timeLeft <= 10 ? '#ff4444' : '#ffffff',
        align: 'center', baseline: 'top', shadow: true,
        glow: timeLeft <= 10 ? '#ff0000' : undefined });

    // Round number
    UI.drawText(ctx, `ROUND ${roundNum}`, timerX, barY + barH + 4,
      { font: '11px monospace', color: '#aa88ff', align: 'center', baseline: 'top' });

    // Combo counter
    if (p1.comboCount >= 2) {
      UI.drawText(ctx, `${p1.comboCount} HIT COMBO!`, pad, barY + barH + 22,
        { font: 'bold 16px monospace', color: '#ffdd00',
          glow: '#ff8800', glowBlur: 10, shadow: true });
    }
    if (p2.comboCount >= 2) {
      UI.drawText(ctx, `${p2.comboCount} HIT COMBO!`, W - pad, barY + barH + 22,
        { font: 'bold 16px monospace', color: '#ffdd00',
          glow: '#ff8800', glowBlur: 10, align: 'right', shadow: true });
    }
  }

  // ── Main game controller ──────────────────────────────────────────────────

  class FightingGame {
    constructor() {
      const cfg = GF.GAME_CONFIG;

      // Create engine + systems via GameFramework
      const { engine, sprites, physics, ui } = GF.createGame(cfg.engine, cfg.physics);
      this.engine  = engine;
      this.sprites = sprites;
      this.physics = physics;
      this.ui      = ui;
      this.cfg     = cfg;

      const W = cfg.engine.width;
      const H = cfg.engine.height;

      // Register sprites from GF.sprites (populated by sprite files)
      if (GF.sprites) {
        sprites.registerSprites(GF.sprites);
      }

      // Particles
      this.particles = new ParticleEmitter();

      // Input bindings — Player 1
      const ctl = cfg.controls;
      Object.entries(ctl.p1).forEach(([action, code]) =>
        engine.input.bind('p1_' + action, code));
      Object.entries(ctl.p2).forEach(([action, code]) =>
        engine.input.bind('p2_' + action, code));
      engine.input.bind('pause', 'Escape', 'KeyP');
      engine.input.bind('confirm', 'Enter', 'Space');

      // AI
      this.ai       = new AIController(cfg.ai);
      this.aiInput  = new AIInput();
      this.p2IsAI   = true; // set to false for 2-player mode

      // Game state
      this.gameState  = STATE.MENU;
      this.roundNum   = 1;
      this.roundTimer = 0;
      this.koCooldown = 0;
      this.paused     = false;
      this._flashMsg  = '';
      this._flashTime = 0;

      // Create fighters (null until round starts)
      this.p1 = null;
      this.p2 = null;

      // Canvas dimensions
      this.W = W;
      this.H = H;

      // Wire engine callbacks
      engine.onUpdate((dt, eng) => this._update(dt, eng));
      engine.onRender((ctx, eng) => this._render(ctx, eng));
    }

    start() {
      this.engine.start();
    }

    // ── Round management ───────────────────────────────────────────────────

    _startRound() {
      const cfg  = this.cfg;
      const phys = this.physics;

      // Rebuild physics bounds
      phys.floorY    = cfg.physics.floorY;
      phys.leftWall  = cfg.physics.leftWall;
      phys.rightWall = cfg.physics.rightWall;

      // Remove old bodies
      if (this.p1) phys.removeBody(this.p1.body);
      if (this.p2) phys.removeBody(this.p2.body);

      const kDef = this.sprites.getSprite('kuro');
      const hDef = this.sprites.getSprite('hana');

      this.p1 = new Fighter(cfg.fighters.kuro, kDef, phys, this.sprites);
      this.p2 = new Fighter(cfg.fighters.hana, hDef, phys, this.sprites);

      // Restore round wins
      this.p1.wins = this._p1Wins || 0;
      this.p2.wins = this._p2Wins || 0;

      this.roundTimer = cfg.round.roundTime;
      this.koCooldown = 0;
      this.gameState  = STATE.COUNTDOWN;
      this._countdownTimer = 2.5;
      this._flashMsg  = '';
    }

    _endRound(winner) {
      const cfg = this.cfg;

      if (winner === 'p1') {
        this.p1.wins++;
        this._p1Wins = this.p1.wins;
        this.p1._setState(FIGHTER_STATE.WIN);
        this.p2._setState(FIGHTER_STATE.KO);
        this._flashMsg = 'KURO WINS!';
      } else if (winner === 'p2') {
        this.p2.wins++;
        this._p2Wins = this.p2.wins;
        this.p2._setState(FIGHTER_STATE.WIN);
        this.p1._setState(FIGHTER_STATE.KO);
        this._flashMsg = 'HANA WINS!';
      } else {
        this._flashMsg = 'DRAW!';
      }

      this.gameState  = STATE.ROUND_END;
      this.koCooldown = cfg.round.koDuration;

      const maxWins = Math.ceil(cfg.round.totalRounds / 2);
      const p1Done  = (this._p1Wins || 0) >= maxWins;
      const p2Done  = (this._p2Wins || 0) >= maxWins;

      if (p1Done || p2Done) {
        this._overallWinner = p1Done ? 'KURO' : 'HANA';
        this._overallColor  = p1Done ? this.cfg.fighters.kuro.color
                                     : this.cfg.fighters.hana.color;
        this._matchOver = true;
      } else {
        this.roundNum++;
        this._matchOver = false;
      }
    }

    // ── Update ────────────────────────────────────────────────────────────

    _update(dt) {
      if (this.paused) return;

      switch (this.gameState) {

        case STATE.MENU:
          if (this.engine.input.wasPressed('confirm')) {
            this._p1Wins  = 0;
            this._p2Wins  = 0;
            this.roundNum = 1;
            this._startRound();
          }
          break;

        case STATE.COUNTDOWN:
          this._countdownTimer -= dt;
          if (this._countdownTimer <= 0) {
            this.gameState = STATE.FIGHT;
          }
          break;

        case STATE.FIGHT:
          this._updateFight(dt);
          break;

        case STATE.ROUND_END:
          this.koCooldown -= dt;
          if (this.p1) this.p1.animator.update(dt);
          if (this.p2) this.p2.animator.update(dt);
          this.particles.update(dt);
          if (this.koCooldown <= 0) {
            if (this._matchOver) {
              this.gameState = STATE.GAME_OVER;
            } else {
              this._startRound();
            }
          }
          break;

        case STATE.GAME_OVER:
          if (this.engine.input.wasPressed('confirm')) {
            this._p1Wins  = 0;
            this._p2Wins  = 0;
            this.roundNum = 1;
            this._startRound();
          }
          break;
      }

      // Pause toggle
      if (this.engine.input.wasPressed('pause') && this.gameState !== STATE.MENU) {
        this.paused = !this.paused;
      }
    }

    _updateFight(dt) {
      const { p1, p2, engine } = this;
      const inp  = engine.input;
      const cfg  = this.cfg;

      // Build P1 actions map
      const p1Acts = {};
      Object.keys(cfg.controls.p1).forEach(action => {
        p1Acts[action] = action; // maps action name → p1_action binding key
      });
      const p1Input = {
        isDown    : a => inp.isDown('p1_' + a),
        wasPressed: a => inp.wasPressed('p1_' + a),
        wasReleased: a => inp.wasReleased('p1_' + a),
      };

      // P2 input (AI or keyboard)
      let p2Input;
      if (this.p2IsAI) {
        const aiActs = this.ai.think(dt, p2, p1, null);
        this.aiInput.setActions(aiActs);
        p2Input = {
          isDown    : a => !!aiActs[a],
          wasPressed: a => !!aiActs[a],
          wasReleased: () => false,
        };
      } else {
        p2Input = {
          isDown    : a => inp.isDown('p2_' + a),
          wasPressed: a => inp.wasPressed('p2_' + a),
          wasReleased: a => inp.wasReleased('p2_' + a),
        };
      }

      // Process inputs
      p1.processInput(p1Input, Object.fromEntries(
        Object.keys(cfg.controls.p1).map(a => [a, a])), p2);
      p2.processInput(p2Input, Object.fromEntries(
        Object.keys(cfg.controls.p2).map(a => [a, a])), p1);

      // Update fighters
      p1.update(dt);
      p2.update(dt);

      // Physics
      this.physics.update(dt);

      // Prevent overlap
      this._resolveFighterOverlap();

      // Hit checks
      const p1Hit = p1.tryHitOpponent(p2);
      const p2Hit = p2.tryHitOpponent(p1);
      if (p1Hit) this.particles.emit(p2.x, p2.y - 40, '#ffdd00', 12, 200, 180);
      if (p2Hit) this.particles.emit(p1.x, p1.y - 40, '#ffdd00', 12, 200, 180);

      this.particles.update(dt);

      // Round timer
      this.roundTimer -= dt;

      // Check KO
      if (p1.state === FIGHTER_STATE.KO && p2.state !== FIGHTER_STATE.KO) {
        this._endRound('p2');
      } else if (p2.state === FIGHTER_STATE.KO && p1.state !== FIGHTER_STATE.KO) {
        this._endRound('p1');
      } else if (p1.state === FIGHTER_STATE.KO && p2.state === FIGHTER_STATE.KO) {
        this._endRound('draw');
      } else if (this.roundTimer <= 0) {
        // Time out — higher health wins
        if (p1.health > p2.health)       this._endRound('p1');
        else if (p2.health > p1.health)  this._endRound('p2');
        else                             this._endRound('draw');
      }
    }

    _resolveFighterOverlap() {
      const p1 = this.p1, p2 = this.p2;
      const minDist = (p1.body.width + p2.body.width) * 0.5 + 4;
      const dx = p2.x - p1.x;
      if (Math.abs(dx) < minDist) {
        const push = (minDist - Math.abs(dx)) / 2 + 1;
        const dir  = dx >= 0 ? 1 : -1;
        const cfg  = this.cfg.physics;
        p1.body.x -= dir * push;
        p2.body.x += dir * push;
        // Keep within walls
        p1.body.x = Math.max(cfg.leftWall, Math.min(cfg.rightWall - p1.body.width,  p1.body.x));
        p2.body.x = Math.max(cfg.leftWall, Math.min(cfg.rightWall - p2.body.width, p2.body.x));
      }
    }

    // ── Render ────────────────────────────────────────────────────────────

    _render(ctx) {
      const { W, H, cfg } = this;
      const UI = GF.UISystem;

      // Stage background
      drawStage(ctx, cfg, W, H);

      switch (this.gameState) {

        case STATE.MENU:
          this._renderMenu(ctx, W, H, UI);
          break;

        case STATE.COUNTDOWN:
          if (this.p1) { this.p1.drawShadow(ctx); this.p1.draw(ctx); }
          if (this.p2) { this.p2.drawShadow(ctx); this.p2.draw(ctx); }
          drawHUD(ctx, this.p1, this.p2, this.roundNum, this.roundTimer, W, cfg);
          this._renderCountdown(ctx, W, H, UI);
          break;

        case STATE.FIGHT:
          this.particles.draw(ctx);
          if (this.p1) { this.p1.drawShadow(ctx); this.p1.draw(ctx); }
          if (this.p2) { this.p2.drawShadow(ctx); this.p2.draw(ctx); }
          drawHUD(ctx, this.p1, this.p2, this.roundNum, this.roundTimer, W, cfg);
          break;

        case STATE.ROUND_END:
          this.particles.draw(ctx);
          if (this.p1) { this.p1.drawShadow(ctx); this.p1.draw(ctx); }
          if (this.p2) { this.p2.drawShadow(ctx); this.p2.draw(ctx); }
          drawHUD(ctx, this.p1, this.p2, this.roundNum, this.roundTimer, W, cfg);
          this._renderFlash(ctx, W, H, UI);
          break;

        case STATE.GAME_OVER:
          if (this.p1) { this.p1.drawShadow(ctx); this.p1.draw(ctx); }
          if (this.p2) { this.p2.drawShadow(ctx); this.p2.draw(ctx); }
          this._renderGameOver(ctx, W, H, UI);
          break;
      }

      // Pause overlay
      if (this.paused) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, W, H);
        UI.drawText(ctx, 'PAUSED', W / 2, H / 2 - 20,
          { font: 'bold 42px monospace', color: '#ffffff', align: 'center',
            glow: '#aaaaff', glowBlur: 20, shadow: true });
        UI.drawText(ctx, 'Press P or ESC to resume', W / 2, H / 2 + 24,
          { font: '16px monospace', color: '#aaaaaa', align: 'center' });
      }
    }

    _renderMenu(ctx, W, H, UI) {
      // Title
      UI.drawText(ctx, 'SHADOW  STRIKE', W / 2, H / 2 - 100,
        { font: 'bold 52px monospace', color: '#ffffff', align: 'center',
          glow: '#aa00ff', glowBlur: 20, stroke: '#6600cc', strokeWidth: 3, shadow: true });

      // Character showcase: draw fighters facing each other
      const scale = 2;
      ctx.save();
      ctx.scale(scale, scale);
      if (GF.sprites && GF.sprites['kuro']) {
        const kDef = GF.sprites['kuro'];
        const kAnim = kDef.animations.idle;
        if (kAnim && kAnim.frames.length) {
          const fi = Math.floor(Date.now() / 200) % kAnim.frames.length;
          ctx.save();
          ctx.translate((W * 0.28) / scale, (H * 0.7) / scale);
          ctx.translate(-kDef.originX, -kDef.originY);
          kAnim.frames[fi](ctx);
          ctx.restore();
        }
      }
      if (GF.sprites && GF.sprites['hana']) {
        const hDef = GF.sprites['hana'];
        const hAnim = hDef.animations.idle;
        if (hAnim && hAnim.frames.length) {
          const fi = Math.floor(Date.now() / 200) % hAnim.frames.length;
          ctx.save();
          ctx.translate((W * 0.72) / scale, (H * 0.7) / scale);
          ctx.scale(-1, 1);
          ctx.translate(-hDef.originX, -hDef.originY);
          hAnim.frames[fi](ctx);
          ctx.restore();
        }
      }
      ctx.restore();

      // VS
      UI.drawText(ctx, 'VS', W / 2, H * 0.56,
        { font: 'bold 38px monospace', color: '#ff4444', align: 'center',
          glow: '#ff0000', glowBlur: 16, shadow: true });

      UI.drawText(ctx, 'KURO', W * 0.28, H * 0.74,
        { font: 'bold 18px monospace', color: '#00e5ff', align: 'center', shadow: true });
      UI.drawText(ctx, 'HANA', W * 0.72, H * 0.74,
        { font: 'bold 18px monospace', color: '#ff6600', align: 'center', shadow: true });

      // Start
      const blink = Math.floor(Date.now() / 500) % 2;
      if (blink) {
        UI.drawText(ctx, 'PRESS ENTER TO START', W / 2, H - 80,
          { font: 'bold 20px monospace', color: '#ffffff', align: 'center',
            glow: '#ffffff', glowBlur: 8 });
      }

      // Controls
      const ctrl = [
        ['KURO (P1):', 'A/D = Move  W = Jump  S = Crouch'],
        ['',           'U/I = Punch  J/K = Kick  L = Special  O = Block'],
        ['HANA (CPU):', 'Computer-controlled'],
      ];
      ctrl.forEach(([label, text], i) => {
        if (label) UI.drawText(ctx, label, W / 2 - 200, H - 52 + i * 14,
          { font: '10px monospace', color: '#888888' });
        UI.drawText(ctx, text, W / 2 - 80, H - 52 + i * 14,
          { font: '10px monospace', color: '#666666' });
      });
    }

    _renderCountdown(ctx, W, H, UI) {
      const t    = Math.ceil(this._countdownTimer);
      const text = t > 1 ? String(t - 1) : 'FIGHT!';
      const col  = t > 1 ? '#ffdd00' : '#00ff88';
      const size = t > 1 ? 96 : 72;
      UI.drawText(ctx, text, W / 2, H / 2 - size / 2,
        { font: `bold ${size}px monospace`, color: col, align: 'center',
          glow: col, glowBlur: 24, stroke: '#000000', strokeWidth: 4, shadow: true });
    }

    _renderFlash(ctx, W, H, UI) {
      if (!this._flashMsg) return;
      UI.drawPanel(ctx, W / 2 - 180, H / 2 - 44, 360, 80,
        { bgColor: 'rgba(0,0,0,0.75)', borderColor: '#ffffff', borderWidth: 2, radius: 8 });
      UI.drawText(ctx, this._flashMsg, W / 2, H / 2 - 8,
        { font: 'bold 44px monospace', color: '#ffffff', align: 'center',
          baseline: 'middle', glow: '#aa44ff', glowBlur: 20, stroke: '#000000',
          strokeWidth: 4, shadow: true });
    }

    _renderGameOver(ctx, W, H, UI) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);

      UI.drawText(ctx, `${this._overallWinner} WINS THE MATCH!`, W / 2, H / 2 - 60,
        { font: 'bold 36px monospace', color: this._overallColor || '#ffffff',
          align: 'center', glow: this._overallColor, glowBlur: 16,
          stroke: '#000000', strokeWidth: 3, shadow: true });

      const blink = Math.floor(Date.now() / 600) % 2;
      if (blink) {
        UI.drawText(ctx, 'PRESS ENTER TO PLAY AGAIN', W / 2, H / 2 + 20,
          { font: 'bold 18px monospace', color: '#ffffff', align: 'center', shadow: true });
      }

      // Final score summary
      UI.drawText(ctx,
        `${this.cfg.fighters.kuro.displayName} ${this._p1Wins || 0} — ${this._p2Wins || 0} ${this.cfg.fighters.hana.displayName}`,
        W / 2, H / 2 + 60,
        { font: '16px monospace', color: '#aaaaaa', align: 'center' });
    }
  }

  // ── Bootstrap ─────────────────────────────────────────────────────────────

  function init() {
    const game = new FightingGame();
    game.start();
    window._fightingGame = game; // expose for debugging
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window.GF = window.GF || {});
