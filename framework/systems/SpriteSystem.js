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

    /**
     * Register a sprite from a spritesheet image + an atlas (Aseprite hash-export
     * format — the same `animate.json` shape the framework's built-in sprites use).
     * No generated JS and no bundle rebuild required: pass the image (or its URL)
     * and the parsed atlas object, and the animations are built at runtime.
     *
     * @param {string} name
     * @param {HTMLImageElement|{img,isLoaded}|string} image - loaded image, a
     *        {img,isLoaded} sheet wrapper, or a URL to lazy-load.
     * @param {Object} atlas - parsed animate.json: { frames:[{frame:{x,y,w,h},duration}],
     *        meta:{ frameTags:[{name,from,to,loop}], origin:{x,y}, frameSize:{w,h} } }
     * @param {Object} [opts] - { originX, originY, defaultFps } overrides.
     * @returns {Object} the built sprite definition (also registered under `name`).
     */
    registerSheet(name, image, atlas, opts) {
      const sheet = SpriteSystem._asSheet(image);
      const def = SpriteSystem.buildSheetDefinition(sheet, atlas, opts);
      this.registerSprite(name, def);
      return def;
    }

    /**
     * Async convenience: fetch the atlas JSON and load the image, then register.
     * Use when you only have URLs. Prefer registerSheet with an inline atlas
     * object where possible (headless tooling cannot fetch).
     * @returns {Promise<Object>} resolves with the sprite definition.
     */
    registerSheetAsync(name, imageUrl, atlasUrl, opts) {
      const self = this;
      return fetch(atlasUrl)
        .then(r => r.json())
        .then(atlas => self.registerSheet(name, imageUrl, atlas, opts));
    }

    // --- internals ---------------------------------------------------------

    /** Normalise an image argument into a { img, isLoaded() } sheet wrapper. */
    static _asSheet(image) {
      if (image && typeof image.isLoaded === 'function') return image; // already a wrapper
      if (typeof image === 'string') return SpriteSystem._loadImage(image);
      // A raw HTMLImageElement (may or may not be loaded yet).
      const img = image;
      return { img, isLoaded: () => !!(img && (img.complete ? img.naturalWidth !== 0 || img.width : false)) };
    }

    /** Lazy-load an image URL, mirroring the built-in sprite loaders' pattern. */
    static _loadImage(url) {
      SpriteSystem._imageCache = SpriteSystem._imageCache || {};
      if (SpriteSystem._imageCache[url]) return SpriteSystem._imageCache[url];
      const img = new Image();
      let loaded = false;
      img.addEventListener('load',  () => { loaded = true; });
      img.addEventListener('error', () => { console.warn('SpriteSystem: failed to load ' + url); });
      img.src = url;
      return SpriteSystem._imageCache[url] = { img, isLoaded: () => loaded };
    }

    /** Return a frame draw function that blits a sub-rect of the sheet. */
    static _makeFrameDrawer(sheet, sx, sy, fw, fh) {
      return function (ctx) {
        if (!sheet.isLoaded()) {
          ctx.fillStyle = '#446';
          ctx.fillRect(2, 2, fw - 4, fh - 4);
          return;
        }
        ctx.drawImage(sheet.img, sx, sy, fw, fh, 0, 0, fw, fh);
      };
    }

    /**
     * Build a { frameWidth, frameHeight, originX, originY, animations } definition
     * from a sheet wrapper + Aseprite-style atlas. Exposed for tooling/tests.
     */
    static buildSheetDefinition(sheet, atlas, opts) {
      opts = opts || {};
      atlas = atlas || {};
      const meta   = atlas.meta || {};
      const frames = Array.isArray(atlas.frames) ? atlas.frames : [];
      const fsize  = meta.frameSize || {};
      const origin = meta.origin || {};

      // Frame dimensions: prefer meta.frameSize, else the first frame's rect.
      const first = (frames[0] && frames[0].frame) || {};
      const frameWidth  = fsize.w || first.w || opts.frameWidth  || 0;
      const frameHeight = fsize.h || first.h || opts.frameHeight || 0;
      const originX = (opts.originX != null) ? opts.originX : (origin.x != null ? origin.x : frameWidth  / 2);
      const originY = (opts.originY != null) ? opts.originY : (origin.y != null ? origin.y : frameHeight);
      const defaultFps = opts.defaultFps || 12;

      const rectOf = (i) => (frames[i] && frames[i].frame) || { x: 0, y: 0, w: frameWidth, h: frameHeight };
      const drawerFor = (i) => {
        const r = rectOf(i);
        return SpriteSystem._makeFrameDrawer(sheet, r.x, r.y, r.w || frameWidth, r.h || frameHeight);
      };
      // fps for a tag: derive from the tag's first frame duration (ms) if present.
      const fpsFor = (from) => {
        const d = frames[from] && frames[from].duration;
        return (d && d > 0) ? Math.max(1, Math.round(1000 / d)) : defaultFps;
      };

      const animations = {};
      const tags = Array.isArray(meta.frameTags) ? meta.frameTags : [];
      if (tags.length) {
        tags.forEach(tag => {
          const from = tag.from | 0;
          const to   = (tag.to != null ? tag.to : from) | 0;
          const list = [];
          for (let i = from; i <= to; i++) list.push(drawerFor(i));
          animations[tag.name] = {
            fps: tag.fps || fpsFor(from),
            loop: tag.loop !== false && tag.direction !== 'once',
            frames: list,
          };
        });
      } else {
        // No tags: one looping 'idle' animation spanning every frame.
        const list = frames.length ? frames.map((_, i) => drawerFor(i)) : [drawerFor(0)];
        animations.idle = { fps: defaultFps, loop: true, frames: list };
      }

      return { frameWidth, frameHeight, originX, originY, animations };
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

      if (flipX) {
        ctx.save();
        ctx.translate(x - ox, y - oy);
        ctx.scale(-1, 1);
        frame(ctx);
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(x - ox, y - oy);
        frame(ctx);
        ctx.restore();
      }
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
