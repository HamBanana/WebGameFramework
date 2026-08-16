// games/Acca2/core/Menu.js
// Arrow-key list overlay rendered on the canvas (screen-space). Pure UI —
// the caller supplies title, subtitle, options, and optional onIndexChange /
// onCancel callbacks. Escape default behaviour: walk to a 'Back' option's
// action; pass `onCancel: null` explicitly to make the menu mandatory.

(function (GF) {
  'use strict';
  const A = GF.Acca = GF.Acca || {};

  class Menu {
    constructor(input, controls) {
      this.input         = input;
      this.controls      = controls;
      this.options       = [];
      this.index         = 0;
      this.title         = '';
      this.subtitle      = '';
      this.visible       = false;
      this.layout        = 'vertical'; // 'vertical' | 'horizontal'
      this.onIndexChange = null;
      this.onCancel      = null;
      // Optional scroll-window for long lists (e.g. game log). When set, the
      // renderer shows only `maxVisible` rows around `scrollOffset`; up/down
      // still moves the cursor through the full options list and the window
      // follows. null disables windowing (full list rendered, original
      // behavior).
      this.maxVisible    = null;
      this.scrollOffset  = 0;
    }

    /**
     * @param {string} title
     * @param {Array<{label, action, meta?, _disabled?}>} options
     * @param {string} [subtitle]
     * @param {{ onIndexChange?: function, onCancel?: function|null, maxVisible?: number }} [opts]
     */
    show(title, options, subtitle, opts) {
      this.title    = title;
      this.subtitle = subtitle || '';
      this.options  = options;
      this.index    = 0;
      this.visible  = true;
      this.layout   = (opts && opts.layout) || 'vertical';
      this.maxVisible    = (opts && typeof opts.maxVisible === 'number') ? opts.maxVisible : null;
      this.scrollOffset  = 0;
      this.onIndexChange = (opts && opts.onIndexChange) || null;
      // If no explicit onCancel was provided, default to a "Back" option's action
      // so Escape walks the menu stack the same way the user would. Pass
      // `onCancel: null` (an explicit own-property) to disable Escape entirely
      // (used for mandatory choices like road selection).
      if (opts && Object.prototype.hasOwnProperty.call(opts, 'onCancel')) {
        this.onCancel        = opts.onCancel || null;
        this._cancelDisabled = opts.onCancel === null;
      } else {
        const back = options.find(o => o && o.label === 'Back');
        this.onCancel        = (back && back.action) || null;
        this._cancelDisabled = !this.onCancel;
      }
      // Fire a synthetic onIndexChange for the initial item so consumers (e.g.
      // the property spotlight) can react immediately when the menu opens.
      if (this.onIndexChange && this.options[0]) {
        this.onIndexChange(this.options[0], 0);
      }
    }

    hide() {
      this.visible       = false;
      this.options       = [];
      this.subtitle      = '';
      this.layout        = 'vertical';
      this.onIndexChange = null;
      this.onCancel      = null;
    }

    update() {
      if (!this.visible || this.options.length === 0) return;

      const cur = this.options[this.index];
      const onStepper = !!(cur && cur.stepper);

      let moved = false;
      // Up/down always navigates between options.
      if (this._pressed('up'))   { this.index = (this.index - 1 + this.options.length) % this.options.length; moved = true; }
      if (this._pressed('down')) { this.index = (this.index + 1) % this.options.length; moved = true; }

      // Left/right: adjust the stepper value when on a stepper option,
      // otherwise navigate (matches the previous behavior for vertical menus).
      if (onStepper) {
        if (this._pressed('left'))  this._stepperDelta(cur, -1);
        if (this._pressed('right')) this._stepperDelta(cur, +1);
      } else {
        if (this._pressed('left'))  { this.index = (this.index - 1 + this.options.length) % this.options.length; moved = true; }
        if (this._pressed('right')) { this.index = (this.index + 1) % this.options.length; moved = true; }
      }

      if (moved) {
        this._adjustScroll();
        if (this.onIndexChange) {
          this.onIndexChange(this.options[this.index], this.index);
        }
      }

      if (this._pressed('cancel')) {
        if (this._cancelDisabled) return; // mandatory choice — ignore Escape
        const cb = this.onCancel;
        this.hide();
        if (cb) cb();
        return;
      }

      if (this._pressed('confirm')) {
        const opt = this.options[this.index];
        if (opt && opt._disabled) return;
        // Stepper rows act on confirm using the current value rather than
        // hiding the menu — this lets the player keep adjusting and apply
        // multiple times (e.g. Buy several stacks before Done).
        if (opt && opt.stepper) {
          if (opt.action) opt.action(opt.stepper.value);
          return;
        }
        this.hide();
        if (opt && opt.action) opt.action();
      }
    }

    /** Adjust a stepper option's value, clamp to [min,max], rebuild label, fire onChange. */
    _stepperDelta(opt, dir) {
      const s = opt.stepper;
      const cur  = (typeof s.value === 'number') ? s.value : (s.min || 0);
      const step = s.step || 1;
      const next = Math.max(s.min, Math.min(s.max, cur + dir * step));
      if (next === cur) return;
      s.value = next;
      if (typeof s.format === 'function') opt.label = s.format(next);
      if (typeof s.onChange === 'function') s.onChange(next);
    }

    _pressed(action) {
      const codes = this.controls[action];
      if (!codes) return false;
      return codes.some(code => this.input.wasPressed(code));
    }

    /** Slide `scrollOffset` so the cursor stays within the visible window
     *  when `maxVisible` is set. No-op when the menu shows the full list. */
    _adjustScroll() {
      if (!this.maxVisible || this.options.length <= this.maxVisible) {
        this.scrollOffset = 0;
        return;
      }
      const max = this.options.length - this.maxVisible;
      if (this.index < this.scrollOffset) {
        this.scrollOffset = this.index;
      } else if (this.index >= this.scrollOffset + this.maxVisible) {
        this.scrollOffset = this.index - this.maxVisible + 1;
      }
      this.scrollOffset = Math.max(0, Math.min(max, this.scrollOffset));
    }

    /** Returns the slice of options that should render now plus the offset
     *  the renderer should subtract from `index` to find the highlighted
     *  row's position in the slice. */
    visibleSlice() {
      if (!this.maxVisible || this.options.length <= this.maxVisible) {
        return { slice: this.options, offset: 0 };
      }
      const start = this.scrollOffset;
      return { slice: this.options.slice(start, start + this.maxVisible), offset: start };
    }
  }

  A.Menu = Menu;

})(window.GF = window.GF || {});
