// GameFramework/framework/systems/DebugOverlay.js
// Toggleable developer overlay — press F1 (or cfg.toggleKey) to show/hide.
//
// Displays:
//   • FPS counter
//   • Physics body count + AABB wireframes (green) + velocity vectors (yellow)
//   • Any custom watch values registered with overlay.watch()
//
// Added automatically by createGame() as game.debug.
// Extra watches example:
//   game.debug.watch('playerX', () => Math.round(player.x));
//   game.debug.watch('state',   () => stateMachine.current);

(function (GF) {
  'use strict';

  class DebugOverlay {
    /**
     * @param {Object}  cfg
     * @param {string}  cfg.toggleKey - KeyboardEvent.code to toggle (default 'F1')
     * @param {boolean} cfg.enabled   - start visible (default false)
     */
    constructor(cfg = {}) {
      this.name      = 'DebugOverlay';
      this.toggleKey = cfg.toggleKey || 'F1';
      this.enabled   = cfg.enabled   !== undefined ? cfg.enabled : false;

      this._watches  = []; // { label: string, fn: () => * }
      this._engine   = null;
    }

    // ── System interface ────────────────────────────────────────────────────

    init(engine) {
      this._engine = engine;
      window.addEventListener('keydown', e => {
        if (e.code === this.toggleKey) {
          e.preventDefault();
          this.enabled = !this.enabled;
          console.log('[DebugOverlay] ' + (this.enabled ? 'ON' : 'OFF'));
        }
      });
    }

    update() {}

    render(ctx, engine) {
      if (!this.enabled) return;

      const e = engine || this._engine;

      // ── Physics wireframes ──────────────────────────────────────────────

      const physics = e && e.getSystem ? e.getSystem('PhysicsSystem') : null;
      if (physics && physics._bodies && physics._bodies.length) {
        ctx.save();
        physics._bodies.forEach(b => {
          // AABB outline
          ctx.strokeStyle = 'rgba(0,255,80,0.85)';
          ctx.lineWidth   = 1;
          ctx.strokeRect(b.x, b.y, b.width, b.height);

          // Centre dot
          ctx.fillStyle = 'rgba(0,255,80,0.85)';
          ctx.fillRect(b.centerX - 2, b.centerY - 2, 4, 4);

          // Velocity vector (scaled so 600 px/s ≈ 30 px long)
          const scale = 0.05;
          const vx = b.vx * scale;
          const vy = b.vy * scale;
          if (Math.abs(vx) > 0.5 || Math.abs(vy) > 0.5) {
            ctx.strokeStyle = 'rgba(255,220,0,0.9)';
            ctx.lineWidth   = 2;
            ctx.beginPath();
            ctx.moveTo(b.centerX, b.centerY);
            ctx.lineTo(b.centerX + vx, b.centerY + vy);
            ctx.stroke();

            // Arrowhead
            const angle = Math.atan2(vy, vx);
            const al    = 6;
            ctx.beginPath();
            ctx.moveTo(b.centerX + vx, b.centerY + vy);
            ctx.lineTo(
              b.centerX + vx - al * Math.cos(angle - 0.4),
              b.centerY + vy - al * Math.sin(angle - 0.4)
            );
            ctx.moveTo(b.centerX + vx, b.centerY + vy);
            ctx.lineTo(
              b.centerX + vx - al * Math.cos(angle + 0.4),
              b.centerY + vy - al * Math.sin(angle + 0.4)
            );
            ctx.stroke();
          }

          // "grounded" indicator
          if (b.grounded) {
            ctx.fillStyle = 'rgba(0,180,255,0.7)';
            ctx.fillRect(b.x, b.bottom - 2, b.width, 2);
          }
        });
        ctx.restore();
      }

      // ── HUD panel ───────────────────────────────────────────────────────

      const lines = [];
      lines.push('GF debug  [' + (this.toggleKey) + ']');
      lines.push('FPS: ' + (e ? Math.round(e.fps || 0) : '?'));
      lines.push('Bodies: ' + (physics ? physics._bodies.length : 0));

      this._watches.forEach(w => {
        let val;
        try { val = w.fn(); } catch (_) { val = '!err'; }
        lines.push(w.label + ': ' + val);
      });

      const PAD    = 8;
      const LINE_H = 16;
      const PAN_W  = 180;
      const PAN_H  = lines.length * LINE_H + PAD * 2;
      const PAN_X  = 8;
      const PAN_Y  = 8;

      ctx.save();

      // Panel background
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(PAN_X, PAN_Y, PAN_W, PAN_H);

      // Top accent bar
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(PAN_X, PAN_Y, PAN_W, 2);

      // Text
      ctx.textBaseline = 'top';
      lines.forEach((line, i) => {
        ctx.font      = i === 0 ? 'bold 11px monospace' : '12px monospace';
        ctx.fillStyle = i === 0 ? '#00ff88' : '#ccffee';
        ctx.fillText(line, PAN_X + PAD, PAN_Y + PAD + i * LINE_H);
      });

      ctx.restore();
    }

    // ── Watch API ───────────────────────────────────────────────────────────

    /**
     * Add a custom value line to the overlay panel.
     * @param {string}   label - display label
     * @param {Function} fn    - called each frame; return value is displayed
     * @returns {this}
     */
    watch(label, fn) {
      this._watches.push({ label, fn });
      return this;
    }

    /**
     * Remove all custom watches.
     * @returns {this}
     */
    clearWatches() {
      this._watches = [];
      return this;
    }

    /**
     * Remove a single watch by label.
     * @param {string} label
     * @returns {this}
     */
    removeWatch(label) {
      this._watches = this._watches.filter(w => w.label !== label);
      return this;
    }
  }

  GF.DebugOverlay = DebugOverlay;

})(window.GF = window.GF || {});
