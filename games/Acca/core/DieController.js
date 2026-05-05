// games/Acca2/core/DieController.js
// 6-sided die with rolling animation. Rolls for `duration` seconds, then snaps
// to a value 1–6 and invokes the onDone callback with that value.

(function (GF) {
  'use strict';
  const A = GF.Acca = GF.Acca || {};

  class DieController {
    constructor(spriteSystem) {
      this.animator    = spriteSystem.createAnimator('die', 'face1');
      this.rolling     = false;
      this.rolledValue = 0;
      this._duration   = 0;
      this._timer      = 0;
      this._onDone     = null;
    }

    roll(duration, onDone) {
      this.rolling     = true;
      this.rolledValue = 0;
      this._duration   = duration;
      this._timer      = 0;
      this._onDone     = onDone;
      this.animator.play('rolling', true);
    }

    update(dt) {
      if (this.rolling) {
        this._timer += dt;
        if (this._timer >= this._duration) {
          this.rolling     = false;
          this.rolledValue = 1 + Math.floor(Math.random() * 6);
          this.animator.play('face' + this.rolledValue, true);
          if (this._onDone) {
            const cb = this._onDone;
            this._onDone = null;
            cb(this.rolledValue);
          }
        }
      }
      this.animator.update(dt);
    }

    /** Set the visible face directly (used to count down during movement). */
    setFace(value) {
      const v = Math.max(1, Math.min(6, value | 0));
      this.rolledValue = v;
      this.animator.play('face' + v, true);
    }

    draw(ctx, x, y) { this.animator.draw(ctx, x, y); }
  }

  A.DieController = DieController;

})(window.GF = window.GF || {});
