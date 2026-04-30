// GameFramework/framework/systems/PhysicsSystem.js
// Simple AABB physics with gravity and floor collision

(function (GF) {
  'use strict';

  class PhysicsBody {
    /**
     * @param {Object} cfg
     * @param {number} cfg.x, cfg.y      - initial position (x,y = top-left)
     * @param {number} cfg.width         - hitbox width
     * @param {number} cfg.height        - hitbox height
     * @param {number} cfg.gravityScale  - 0 = no gravity, 1 = full, negative = float up
     * @param {number} cfg.maxSpeedX     - maximum horizontal speed (px/s)
     * @param {number} cfg.maxSpeedY     - maximum vertical speed   (px/s)
     * @param {number} cfg.friction      - ground friction multiplier (0-1) per frame
     */
    constructor(cfg = {}) {
      this.x           = cfg.x           || 0;
      this.y           = cfg.y           || 0;
      this.vx          = 0;
      this.vy          = 0;
      this.width       = cfg.width       || 40;
      this.height      = cfg.height      || 80;
      this.gravityScale = cfg.gravityScale !== undefined ? cfg.gravityScale : 1;
      this.maxSpeedX   = cfg.maxSpeedX   || 500;
      this.maxSpeedY   = cfg.maxSpeedY   || 1200;
      this.friction    = cfg.friction    !== undefined ? cfg.friction : 0.8;
      this.grounded    = false;
      this.tag         = cfg.tag         || 'body';
    }

    get centerX() { return this.x + this.width  / 2; }
    get centerY() { return this.y + this.height / 2; }
    get right()   { return this.x + this.width;      }
    get bottom()  { return this.y + this.height;     }

    /** AABB overlap test. */
    overlaps(other) {
      return this.x      < other.right  &&
             this.right  > other.x      &&
             this.y      < other.bottom &&
             this.bottom > other.y;
    }
  }

  // ---------------------------------------------------------------------------

  class PhysicsSystem {
    /**
     * @param {Object} cfg
     * @param {number} cfg.gravity  - downward acceleration in px/s²
     * @param {number} cfg.floorY   - y coordinate of the main floor
     * @param {number} cfg.leftWall - x coordinate of the left boundary
     * @param {number} cfg.rightWall - x coordinate of the right boundary
     */
    constructor(cfg = {}) {
      this.name      = 'PhysicsSystem';
      this.gravity   = cfg.gravity   !== undefined ? cfg.gravity   : 2200;
      this.floorY    = cfg.floorY    || 380;
      this.leftWall  = cfg.leftWall  || 0;
      this.rightWall = cfg.rightWall || 800;
      this._bodies   = [];
    }

    addBody(body)    { this._bodies.push(body); return body; }
    removeBody(body) { const i = this._bodies.indexOf(body); if (i >= 0) this._bodies.splice(i, 1); }

    update(dt) {
      this._bodies.forEach(body => {
        // Gravity
        body.vy += this.gravity * body.gravityScale * dt;

        // Clamp speed
        body.vx = Math.max(-body.maxSpeedX, Math.min(body.maxSpeedX, body.vx));
        body.vy = Math.max(-body.maxSpeedY, Math.min(body.maxSpeedY, body.vy));

        // Integrate
        body.x += body.vx * dt;
        body.y += body.vy * dt;

        // Floor
        const floor = this.floorY;
        if (body.bottom >= floor) {
          body.y       = floor - body.height;
          body.vy      = 0;
          body.grounded = true;
          // Ground friction
          body.vx *= body.friction;
          if (Math.abs(body.vx) < 2) body.vx = 0;
        } else {
          body.grounded = false;
        }

        // Walls
        if (body.x < this.leftWall) {
          body.x  = this.leftWall;
          body.vx = 0;
        }
        if (body.right > this.rightWall) {
          body.x  = this.rightWall - body.width;
          body.vx = 0;
        }
      });
    }

    render() {}
  }

  GF.PhysicsBody   = PhysicsBody;
  GF.PhysicsSystem = PhysicsSystem;

})(window.GF = window.GF || {});
