// GameFramework/framework/systems/UISystem.js
// Static utility methods for drawing common HUD elements

(function (GF) {
  'use strict';

  const UISystem = {
    name: 'UISystem',

    // -------------------------------------------------------------------------
    // Health bar
    // -------------------------------------------------------------------------
    /**
     * Draw a health/energy bar.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x, y         - top-left corner
     * @param {number} width        - total bar width
     * @param {number} height       - bar height
     * @param {number} current      - current value
     * @param {number} max          - maximum value
     * @param {Object} [opts]
     *   opts.reversed   {boolean} - fill from right to left
     *   opts.bgColor    {string}
     *   opts.fillColor  {string}  - override automatic color (green→yellow→red)
     *   opts.borderColor{string}
     *   opts.borderWidth{number}
     */
    drawHealthBar(ctx, x, y, width, height, current, max, opts) {
      opts = opts || {};
      const pct    = Math.max(0, Math.min(1, current / max));
      const filled = width * pct;
      const rev    = opts.reversed || false;
      const drawX  = rev ? x + width - filled : x;

      // Background
      ctx.fillStyle = opts.bgColor || '#222222';
      ctx.fillRect(x, y, width, height);

      // Dynamic color: green → yellow → red
      let fillColor = opts.fillColor;
      if (!fillColor) {
        const hue  = pct > 0.5 ? 120 : pct > 0.25 ? 60 : 0;
        fillColor  = `hsl(${hue},100%,45%)`;
      }
      ctx.fillStyle = fillColor;
      ctx.fillRect(drawX, y, filled, height);

      // Inner highlight
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(drawX, y, filled, Math.ceil(height * 0.35));

      // Border
      ctx.strokeStyle  = opts.borderColor  || '#ffffff';
      ctx.lineWidth    = opts.borderWidth  || 2;
      ctx.strokeRect(x, y, width, height);
    },

    // -------------------------------------------------------------------------
    // Text
    // -------------------------------------------------------------------------
    /**
     * Draw text with optional shadow/glow/stroke.
     * @param {CanvasRenderingContext2D} ctx
     * @param {string} text
     * @param {number} x, y
     * @param {Object} [opts]
     *   opts.font        {string}  - CSS font string
     *   opts.color       {string}
     *   opts.align       {string}  - textAlign
     *   opts.baseline    {string}  - textBaseline
     *   opts.shadow      {boolean} - drop shadow
     *   opts.glow        {string}  - glow color
     *   opts.glowBlur    {number}
     *   opts.stroke      {string}  - outline color
     *   opts.strokeWidth {number}
     */
    drawText(ctx, text, x, y, opts) {
      opts = opts || {};
      ctx.save();
      ctx.font         = opts.font      || '20px monospace';
      ctx.textAlign    = opts.align     || 'left';
      ctx.textBaseline = opts.baseline  || 'top';

      if (opts.shadow) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillText(text, x + 2, y + 2);
      }

      if (opts.glow) {
        ctx.shadowColor = opts.glow;
        ctx.shadowBlur  = opts.glowBlur || 8;
      }

      if (opts.stroke) {
        ctx.strokeStyle = opts.stroke;
        ctx.lineWidth   = opts.strokeWidth || 3;
        ctx.lineJoin    = 'round';
        ctx.strokeText(text, x, y);
      }

      ctx.fillStyle   = opts.color || '#ffffff';
      ctx.shadowBlur  = 0;
      ctx.fillText(text, x, y);
      ctx.restore();
    },

    // -------------------------------------------------------------------------
    // Panel / box
    // -------------------------------------------------------------------------
    drawPanel(ctx, x, y, width, height, opts) {
      opts = opts || {};
      ctx.save();
      ctx.globalAlpha = opts.alpha !== undefined ? opts.alpha : 1;
      ctx.fillStyle   = opts.bgColor || 'rgba(0,0,0,0.7)';

      if (opts.radius) {
        this._roundRect(ctx, x, y, width, height, opts.radius);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, width, height);
      }

      if (opts.borderColor) {
        ctx.strokeStyle = opts.borderColor;
        ctx.lineWidth   = opts.borderWidth || 2;
        if (opts.radius) {
          this._roundRect(ctx, x, y, width, height, opts.radius);
          ctx.stroke();
        } else {
          ctx.strokeRect(x, y, width, height);
        }
      }
      ctx.restore();
    },

    _roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h,     x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y,         x + r, y);
      ctx.closePath();
    },

    update() {},
    render() {},
  };

  GF.UISystem = UISystem;

})(window.GF = window.GF || {});
