// GameFramework/framework/systems/Camera.js
// Scrolling camera — translates the canvas context so the world scrolls.
//
// Usage:
//   const camera = new GF.Camera({ width: 800, height: 450, worldWidth: 3200, worldHeight: 900 });
//   camera.follow(playerBody);
//   // In your render callback:
//   camera.begin(ctx);
//     // draw world-space objects here
//   camera.end(ctx);

(function (GF) {
  'use strict';

  class Camera {
    /**
     * @param {Object} cfg
     * @param {number} cfg.width        - viewport width in pixels (matches canvas width)
     * @param {number} cfg.height       - viewport height in pixels (matches canvas height)
     * @param {number} cfg.worldWidth   - total world width for scroll clamping
     * @param {number} cfg.worldHeight  - total world height for scroll clamping
     * @param {number} cfg.lerp         - smoothing factor per 60fps frame (0–1, default 0.1)
     *                                    1 = instant snap, lower values = smoother lag
     */
    constructor(cfg = {}) {
      this.name        = 'Camera';
      this.width       = cfg.width       || 800;
      this.height      = cfg.height      || 450;
      this.worldWidth  = cfg.worldWidth  !== undefined ? cfg.worldWidth  : this.width;
      this.worldHeight = cfg.worldHeight !== undefined ? cfg.worldHeight : this.height;
      this.lerp        = cfg.lerp        !== undefined ? cfg.lerp        : 0.1;

      // Current top-left world position of the viewport
      this.x = 0;
      this.y = 0;

      this._targetX = 0;
      this._targetY = 0;
      this._follow  = null; // object with { x, y } (and optionally width, height)
      this._offsetX = 0;    // offset from followed target's centre
      this._offsetY = 0;
    }

    // ── Follow API ──────────────────────────────────────────────────────────────

    /**
     * Follow a target object every frame.
     * The target must expose x and y (and optionally width / height).
     * Compatible with GF.PhysicsBody.
     *
     * @param {Object} target
     * @param {number} [offsetX=0] - horizontal nudge from the target's centre
     * @param {number} [offsetY=0] - vertical nudge from the target's centre
     */
    follow(target, offsetX, offsetY) {
      this._follow  = target;
      this._offsetX = offsetX || 0;
      this._offsetY = offsetY || 0;
      return this;
    }

    /** Stop following the current target. */
    unfollow() {
      this._follow = null;
      return this;
    }

    // ── Point-at API ────────────────────────────────────────────────────────────

    /**
     * Instantly move the camera to centre on a world point (no lerp applied).
     * @param {number} worldX
     * @param {number} worldY
     */
    snapTo(worldX, worldY) {
      this._targetX = worldX;
      this._targetY = worldY;
      this.x = this._clampX(worldX - this.width  / 2);
      this.y = this._clampY(worldY - this.height / 2);
      return this;
    }

    /**
     * Set the desired look-at point; the camera will lerp towards it.
     * @param {number} worldX
     * @param {number} worldY
     */
    lookAt(worldX, worldY) {
      this._targetX = worldX;
      this._targetY = worldY;
      return this;
    }

    // ── Internal ────────────────────────────────────────────────────────────────

    _clampX(x) {
      return Math.max(0, Math.min(this.worldWidth  - this.width,  x));
    }
    _clampY(y) {
      return Math.max(0, Math.min(this.worldHeight - this.height, y));
    }

    // ── System interface ────────────────────────────────────────────────────────

    update(dt) {
      // Derive target position from followed object
      if (this._follow) {
        const t  = this._follow;
        const cx = t.x + (t.width  || 0) / 2 + this._offsetX;
        const cy = t.y + (t.height || 0) / 2 + this._offsetY;
        this._targetX = cx;
        this._targetY = cy;
      }

      // Desired viewport top-left
      const desiredX = this._clampX(this._targetX - this.width  / 2);
      const desiredY = this._clampY(this._targetY - this.height / 2);

      // Lerp — scale factor normalised to 60 fps so feel is frame-rate independent
      const alpha = Math.min(1, this.lerp * (dt * 60));
      this.x += (desiredX - this.x) * alpha;
      this.y += (desiredY - this.y) * alpha;
    }

    render() {} // Camera has no autonomous draw; games drive begin/end manually.

    // ── Draw helpers ────────────────────────────────────────────────────────────

    /**
     * Push camera transform onto the canvas context.
     * Call before drawing world-space objects; pair with end().
     * @param {CanvasRenderingContext2D} ctx
     */
    begin(ctx) {
      ctx.save();
      ctx.translate(-Math.round(this.x), -Math.round(this.y));
    }

    /**
     * Pop the camera transform.
     * @param {CanvasRenderingContext2D} ctx
     */
    end(ctx) {
      ctx.restore();
    }

    // ── Coordinate conversion ───────────────────────────────────────────────────

    /**
     * Convert a world-space position to screen (canvas) coordinates.
     * @param {number} wx
     * @param {number} wy
     * @returns {{ x: number, y: number }}
     */
    worldToScreen(wx, wy) {
      return { x: wx - this.x, y: wy - this.y };
    }

    /**
     * Convert a screen (canvas) coordinate to world-space.
     * Useful for translating mouse / touch input.
     * @param {number} sx
     * @param {number} sy
     * @returns {{ x: number, y: number }}
     */
    screenToWorld(sx, sy) {
      return { x: sx + this.x, y: sy + this.y };
    }

    /**
     * Returns true when the given world-space rectangle is at least partially
     * within the viewport.  Use for culling draw calls.
     *
     * @param {number} wx - left edge of rect in world space
     * @param {number} wy - top  edge of rect in world space
     * @param {number} w  - rect width  (default 0)
     * @param {number} h  - rect height (default 0)
     */
    isVisible(wx, wy, w, h) {
      w = w || 0;
      h = h || 0;
      return wx + w > this.x &&
             wy + h > this.y &&
             wx     < this.x + this.width &&
             wy     < this.y + this.height;
    }
  }

  GF.Camera = Camera;

})(window.GF = window.GF || {});
