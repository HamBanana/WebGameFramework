// GameFramework/framework/systems/PlayerController.js
// A reusable 2D player movement controller that wires together a PhysicsBody,
// a SpriteAnimator, and the InputManager.
//
// Three preset modes cover the bulk of game types:
//   'platformer' — left/right run + jump (with optional double-jump)
//   'topdown'    — 8-direction free movement, no gravity
//   'sideways'   — left/right only, no jump (for fighting / arcade)
//
// Animation names follow a convention:
//   idle, walk (or run), jump (one-shot), fall, land (one-shot)
// Override via opts.animations to map convention -> your sprite's animation
// names (e.g. { walk: 'run', jump: 'leap' }).

(function (GF) {
  'use strict';

  var DEFAULT_ANIM = {
    idle: 'idle', walk: 'walk', run: 'run', jump: 'jump',
    fall: 'fall', land: 'land', crouch: 'crouch', attack: 'attack',
  };

  function PlayerController(opts) {
    opts = opts || {};
    this.body     = opts.body;          // GF.PhysicsBody
    this.animator = opts.animator;      // GF.SpriteAnimator
    this.input    = opts.input;         // engine.input
    this.mode     = opts.mode || 'platformer';

    this.speed       = opts.speed     || 220;     // px/s
    this.runSpeed    = opts.runSpeed  || this.speed * 1.5;
    this.jumpPower   = opts.jumpPower || 700;     // px/s upward velocity
    this.maxJumps    = opts.maxJumps  || 1;       // 2 = double-jump
    this.airControl  = opts.airControl != null ? opts.airControl : 0.6; // 0..1
    this.facing      = 1;               // 1 right, -1 left

    this.actions = Object.assign({
      left:  'left',  right: 'right', up:   'up',   down:  'down',
      jump:  'jump',  run:   'run',   crouch:'crouch',attack:'attack',
    }, opts.actions || {});

    this.animations = Object.assign({}, DEFAULT_ANIM, opts.animations || {});

    this._jumpsLeft  = this.maxJumps;
    this._wasGrounded = false;

    // Hooks
    this.onJump   = opts.onJump   || null;
    this.onLand   = opts.onLand   || null;
    this.onAttack = opts.onAttack || null;
  }

  PlayerController.prototype.update = function (dt) {
    var b = this.body, anim = this.animator, input = this.input;
    if (!b || !input) return;

    var L = input.isDown(this.actions.left);
    var R = input.isDown(this.actions.right);
    var U = input.isDown(this.actions.up);
    var D = input.isDown(this.actions.down);
    var running = input.isDown(this.actions.run);
    var moveSpeed = running ? this.runSpeed : this.speed;

    if (this.mode === 'topdown') {
      var vx = 0, vy = 0;
      if (L) vx -= 1; if (R) vx += 1;
      if (U) vy -= 1; if (D) vy += 1;
      if (vx !== 0 && vy !== 0) { vx *= 0.7071; vy *= 0.7071; }  // diag
      b.vx = vx * moveSpeed;
      b.vy = vy * moveSpeed;
      if (vx > 0) this.facing = 1; else if (vx < 0) this.facing = -1;
      this._playMoveAnim(vx !== 0 || vy !== 0, running);
    }
    else if (this.mode === 'sideways') {
      if (L)      { b.vx = -moveSpeed; this.facing = -1; }
      else if (R) { b.vx = moveSpeed;  this.facing =  1; }
      else        { b.vx = 0; }
      this._playMoveAnim(L || R, running);
    }
    else {  // platformer
      var grounded = b.grounded;
      var control  = grounded ? 1 : this.airControl;
      if (L)      { b.vx = -moveSpeed * control; this.facing = -1; }
      else if (R) { b.vx = moveSpeed  * control; this.facing =  1; }
      else if (grounded) { b.vx = 0; }

      // Jump
      if (input.wasPressed(this.actions.jump)) {
        if (grounded) this._jumpsLeft = this.maxJumps;
        if (this._jumpsLeft > 0) {
          b.vy = -this.jumpPower;
          this._jumpsLeft--;
          if (this.onJump) this.onJump(this);
        }
      }
      // Just landed?
      if (!this._wasGrounded && grounded) {
        if (this.onLand) this.onLand(this);
        this._jumpsLeft = this.maxJumps;
      }
      this._wasGrounded = grounded;

      this._playPlatformerAnim(L, R, grounded, running);
    }

    // Attack hook (any mode)
    if (input.wasPressed(this.actions.attack) && this.onAttack) {
      this.onAttack(this);
    }

    if (anim) {
      anim.flipX = (this.facing < 0);
      anim.update(dt);
    }
  };

  PlayerController.prototype._playMoveAnim = function (moving, running) {
    if (!this.animator) return;
    var a = this.animations;
    var name = !moving       ? a.idle
            : (running && this.animator.sprite && this.animator.sprite.animations[a.run]) ? a.run
            : a.walk;
    this.animator.play(name);
  };

  PlayerController.prototype._playPlatformerAnim = function (L, R, grounded, running) {
    if (!this.animator) return;
    var a = this.animations;
    var sprite = this.animator.sprite;
    var anims = sprite ? sprite.animations : {};
    if (!grounded) {
      if (this.body.vy < 0 && anims[a.jump]) this.animator.play(a.jump);
      else if (anims[a.fall])                this.animator.play(a.fall);
    } else if (L || R) {
      var name = (running && anims[a.run]) ? a.run : a.walk;
      this.animator.play(name);
    } else {
      this.animator.play(a.idle);
    }
  };

  GF.PlayerController = PlayerController;

})(window.GF = window.GF || {});
