// GameFramework/framework/systems/MenuSystem.js
// Cursor-driven vertical menu — common to RPGs, strategy games, and any
// menu-heavy interface. Pure logic + draw helper; the game decides where
// it lives in the scene graph and which actions trigger which menus.
//
// Quick start:
//   const menu = new GF.CursorMenu({
//     items: [
//       { label: 'Attack',  value: 'attack',  enabled: true },
//       { label: 'Magic',   value: 'magic',   enabled: false },
//       { label: 'Item',    value: 'item' },
//       { label: 'Wait',    value: 'wait' },
//     ],
//     onSelect: (item) => console.log('chose', item.value),
//     onCancel: () => console.log('cancelled'),
//   });
//
//   // Each frame:
//   menu.update(engine.input);
//   menu.draw(ctx, x, y);
//
// Default key bindings:
//   ArrowUp / ArrowDown   move cursor
//   Enter / Space / KeyZ  select
//   Escape / Backspace / KeyX  cancel
//
// You can rebind via cfg.keys = { up:[...], down:[...], select:[...], cancel:[...] }
// or supply a custom action-based input layer (cfg.actions = { up, down, ... }).

(function (GF) {
  'use strict';

  const DEFAULT_KEYS = {
    up    : ['ArrowUp',   'KeyW'],
    down  : ['ArrowDown', 'KeyS'],
    left  : ['ArrowLeft', 'KeyA'],
    right : ['ArrowRight','KeyD'],
    select: ['Enter', 'Space', 'KeyZ'],
    cancel: ['Escape','Backspace','KeyX'],
  };

  const DEFAULT_STYLE = {
    width        : 160,
    rowHeight    : 22,
    padding      : 10,
    bgColor      : 'rgba(0,0,40,0.92)',
    borderColor  : '#88aaff',
    borderWidth  : 2,
    radius       : 4,
    font         : '14px monospace',
    textColor    : '#ffffff',
    disabledColor: '#666688',
    cursorColor  : '#ffdd44',
    selectedBg   : 'rgba(80,80,160,0.5)',
  };

  class CursorMenu {
    /**
     * @param {Object} cfg
     * @param {Array}  cfg.items     - [{label, value, enabled?, hint?}]
     * @param {Function} [cfg.onSelect] - (item) => void
     * @param {Function} [cfg.onCancel] - () => void
     * @param {Object} [cfg.keys]    - keymap overrides (see DEFAULT_KEYS)
     * @param {Object} [cfg.actions] - action-name overrides (see DEFAULT_KEYS)
     * @param {Object} [cfg.style]   - draw style overrides
     * @param {boolean}[cfg.wrap=true] - cursor wraps top/bottom
     * @param {number} [cfg.cursor=0]  - initial cursor index
     */
    constructor(cfg = {}) {
      this.items    = cfg.items || [];
      this.onSelect = cfg.onSelect || (() => {});
      this.onCancel = cfg.onCancel || (() => {});
      this.keys     = Object.assign({}, DEFAULT_KEYS, cfg.keys || {});
      this.actions  = cfg.actions || null;
      this.style    = Object.assign({}, DEFAULT_STYLE, cfg.style || {});
      this.wrap     = cfg.wrap !== false;
      this.cursor   = Math.max(0, Math.min(this.items.length - 1, cfg.cursor || 0));
      this.active   = true;
      this._lastInputT = 0;
    }

    setItems(items, keepCursor) {
      this.items = items || [];
      if (!keepCursor || this.cursor >= this.items.length) this.cursor = 0;
    }

    /** Move cursor to next enabled item (delta = +/-1). */
    move(delta) {
      if (!this.items.length) return;
      let i = this.cursor;
      for (let n = 0; n < this.items.length; n++) {
        i += delta;
        if (this.wrap) {
          if (i < 0) i = this.items.length - 1;
          if (i >= this.items.length) i = 0;
        } else {
          if (i < 0 || i >= this.items.length) return;
        }
        if (this.items[i].enabled !== false) {
          this.cursor = i;
          return;
        }
      }
    }

    /** Returns the currently highlighted item. */
    currentItem() { return this.items[this.cursor] || null; }

    /** Programmatic select — invokes onSelect without input. */
    select() {
      const item = this.currentItem();
      if (!item || item.enabled === false) return;
      this.onSelect(item);
    }

    /** Programmatic cancel. */
    cancel() { this.onCancel(); }

    // ── Per-frame input ───────────────────────────────────────────────────────

    /** Call once per frame. `input` is GF.InputManager. */
    update(input) {
      if (!this.active || !input) return;

      const pressed = (action) => {
        const codes = (this.actions && this.actions[action]) || this.keys[action] || [];
        for (let i = 0; i < codes.length; i++) {
          if (input.wasPressed(codes[i])) return true;
        }
        return false;
      };

      if (pressed('up'))     this.move(-1);
      if (pressed('down'))   this.move(+1);
      if (pressed('select')) this.select();
      if (pressed('cancel')) this.cancel();
    }

    // ── Drawing ───────────────────────────────────────────────────────────────

    /**
     * Compute total pixel size — useful for layout / centring.
     * @returns {{ width: number, height: number }}
     */
    measure() {
      const s = this.style;
      return {
        width : s.width,
        height: s.padding * 2 + this.items.length * s.rowHeight,
      };
    }

    /**
     * Draw the menu at top-left (x, y).
     */
    draw(ctx, x, y) {
      const s   = this.style;
      const m   = this.measure();
      const ui  = GF.UISystem;

      ui.drawPanel(ctx, x, y, m.width, m.height, {
        bgColor: s.bgColor, borderColor: s.borderColor,
        borderWidth: s.borderWidth, radius: s.radius,
      });

      ctx.save();
      ctx.font = s.font;
      ctx.textBaseline = 'middle';

      for (let i = 0; i < this.items.length; i++) {
        const it = this.items[i];
        const ry = y + s.padding + i * s.rowHeight + s.rowHeight / 2;

        if (i === this.cursor) {
          // Selection band
          ctx.fillStyle = s.selectedBg;
          ctx.fillRect(x + 4, ry - s.rowHeight / 2 + 2,
                       m.width - 8, s.rowHeight - 4);
          // Cursor arrow
          ctx.fillStyle = s.cursorColor;
          ctx.beginPath();
          ctx.moveTo(x + 8,  ry - 5);
          ctx.lineTo(x + 14, ry);
          ctx.lineTo(x + 8,  ry + 5);
          ctx.closePath();
          ctx.fill();
        }

        ctx.fillStyle = (it.enabled === false) ? s.disabledColor : s.textColor;
        ctx.fillText(it.label, x + 22, ry);

        if (it.hint) {
          ctx.fillStyle = s.disabledColor;
          ctx.textAlign = 'right';
          ctx.fillText(it.hint, x + m.width - s.padding, ry);
          ctx.textAlign = 'left';
        }
      }
      ctx.restore();
    }
  }

  GF.CursorMenu = CursorMenu;

})(window.GF = window.GF || {});
