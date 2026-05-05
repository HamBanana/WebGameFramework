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
      this.onIndexChange = null;
      this.onCancel      = null;
    }

    /**
     * @param {string} title
     * @param {Array<{label, action, meta?, _disabled?}>} options
     * @param {string} [subtitle]
     * @param {{ onIndexChange?: function, onCancel?: function|null }} [opts]
     */
    show(title, options, subtitle, opts) {
      this.title    = title;
      this.subtitle = subtitle || '';
      this.options  = options;
      this.index    = 0;
      this.visible  = true;
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
      this.onIndexChange = null;
      this.onCancel      = null;
    }

    update() {
      if (!this.visible || this.options.length === 0) return;

      let moved = false;
      if (this._pressed('up'))   { this.index = (this.index - 1 + this.options.length) % this.options.length; moved = true; }
      if (this._pressed('down')) { this.index = (this.index + 1) % this.options.length; moved = true; }
      if (moved && this.onIndexChange) {
        this.onIndexChange(this.options[this.index], this.index);
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
        this.hide();
        if (opt && opt.action) opt.action();
      }
    }

    _pressed(action) {
      const codes = this.controls[action];
      if (!codes) return false;
      return codes.some(code => this.input.wasPressed(code));
    }
  }

  A.Menu = Menu;

})(window.GF = window.GF || {});
