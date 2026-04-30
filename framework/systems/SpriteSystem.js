// GameFramework/framework/systems/SpriteSystem.js
// Manages sprite definitions (by name) and provides per-entity animators.
//
// Sprite definitions contain named animations; each animation has:
//   fps    {number}   - frames per second
//   loop   {boolean}  - whether to loop (default true)
//   frames {Array}    - array of draw functions: (ctx) => void
//
// Games register sprites by name only — no asset paths in GAME_CONFIG.
// The framework resolves names to renderers.

(function (GF) {
  'use strict';

  class SpriteSystem {
    constructor() {
      this.name = 'SpriteSystem';
      this._sprites = {}; // name -> { frameWidth, frameHeight, originX, originY, animations }
    }

    /**
     * Register a sprite definition under a unique name.
     * @param {string} name
     * @param {Object} definition - { frameWidth, frameHeight, originX, originY, animations }
     */
    registerSprite(name, definition) {
      this._sprites[name] = definition;
      return this;
    }

    /** Register multiple sprites from an object map. */
    registerSprites(map) {
      Object.keys(map).forEach(name => this.registerSprite(name, map[name]));
      return this;
    }

    /** Return the raw definition or null. */
    getSprite(name) {
      return this._sprites[name] || null;
    }

    /**
     * Create an animator instance for a named sprite.
     * @param {string} spriteName
     * @param {string} [initialAnimation='idle']
     * @returns {SpriteAnimator}
     */
    createAnimator(spriteName, initialAnimation) {
      const def = this._sprites[spriteName];
      if (!def) console.warn(`SpriteSystem: sprite '${spriteName}' not registered.`);
      return new SpriteAnimator(this, spriteName, initialAnimation || 'idle');
    }

    /**
     * Draw a sprite frame directly (no animator).
     * x, y specify the draw origin (typically feet-center).
     */
    drawFrame(ctx, spriteName, animName, frameIdx, x, y, flipX) {
      const def = this._sprites[spriteName];
      if (!def) return;
      const anim = def.animations[animName];
      if (!anim || !anim.frames.length) return;
      const frame = anim.frames[frameIdx % anim.frames.length];
      if (typeof frame !== 'function') return;

      const ox = def.originX || 0;
      const oy = def.originY || 0;

      ctx.save();
      ctx.translate(x, y);
      if (flipX) {
        ctx.scale(-1, 1);
      }
      ctx.translate(-ox, -oy);
      frame(ctx);
      ctx.restore();
    }

    update() {}
    render() {}
  }

  // -------------------------------------------------------------------------

  class SpriteAnimator {
    constructor(spriteSystem, spriteName, initialAnimation) {
      this._ss         = spriteSystem;
      this.spriteName  = spriteName;
      this.animation   = initialAnimation;
      this.frameIndex  = 0;
      this._timer      = 0;
      this.finished    = false;
      this._onFinish   = null;
      this.flipX       = false;  // set to mirror horizontally
    }

    /** Switch to a named animation. Force-restart even if same animation when force=true. */
    play(animName, force) {
      if (this.animation === animName && !force) return this;
      const def = this._ss.getSprite(this.spriteName);
      if (!def || !def.animations[animName]) {
        console.warn(`SpriteAnimator: animation '${animName}' not found on '${this.spriteName}'`);
        return this;
      }
      this.animation  = animName;
      this.frameIndex = 0;
      this._timer     = 0;
      this.finished   = false;
      return this;
    }

    /** Register a one-time callback fired when a non-looping animation finishes. */
    onFinish(cb) { this._onFinish = cb; return this; }

    /** Call each frame with the frame's delta time (seconds). */
    update(dt) {
      const def = this._ss.getSprite(this.spriteName);
      if (!def) return;
      const anim = def.animations[this.animation];
      if (!anim) return;

      const fps = anim.fps || 12;
      this._timer += dt;

      while (this._timer >= 1 / fps) {
        this._timer -= 1 / fps;
        this.frameIndex++;
        if (this.frameIndex >= anim.frames.length) {
          if (anim.loop !== false) {
            this.frameIndex = anim.loopFrom || 0;
          } else {
            this.frameIndex = anim.frames.length - 1;
            if (!this.finished) {
              this.finished = true;
              if (this._onFinish) this._onFinish();
            }
          }
        }
      }
    }

    /** Draw the current frame at world position (x, y = feet center). */
    draw(ctx, x, y) {
      this._ss.drawFrame(ctx, this.spriteName, this.animation, this.frameIndex, x, y, this.flipX);
    }

    /** Return the current frame duration in seconds (useful for hitbox timing). */
    get frameDuration() {
      const def  = this._ss.getSprite(this.spriteName);
      const anim = def && def.animations[this.animation];
      return anim ? 1 / (anim.fps || 12) : 0;
    }
  }

  GF.SpriteSystem  = SpriteSystem;
  GF.SpriteAnimator = SpriteAnimator;

})(window.GF = window.GF || {});
