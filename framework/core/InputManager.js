// GameFramework/framework/core/InputManager.js
// Keyboard input handler with named action bindings

(function (GF) {
  'use strict';

  class InputManager {
    constructor() {
      this._held = new Set();         // currently held keys (by KeyboardEvent.code)
      this._justPressed = new Set();  // pressed this frame
      this._justReleased = new Set(); // released this frame
      this._bindings = {};            // action -> [code, ...]

      window.addEventListener('keydown', e => {
        if (!this._held.has(e.code)) {
          this._held.add(e.code);
          this._justPressed.add(e.code);
        }
        // Prevent arrow/space scroll
        if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
          e.preventDefault();
        }
      });

      window.addEventListener('keyup', e => {
        this._held.delete(e.code);
        this._justReleased.add(e.code);
      });

      // Clear state when window loses focus
      window.addEventListener('blur', () => {
        this._held.clear();
        this._justPressed.clear();
        this._justReleased.clear();
      });
    }

    /**
     * Bind an action name to one or more key codes.
     * @param {string} action - logical action name
     * @param {...string} codes - KeyboardEvent.code values (e.g. 'KeyA', 'ArrowLeft')
     */
    bind(action, ...codes) {
      this._bindings[action] = codes;
      return this;
    }

    /** True while the key/action is held down. */
    isDown(action) {
      const codes = this._bindings[action];
      if (!codes) return this._held.has(action);
      return codes.some(c => this._held.has(c));
    }

    /** True for one frame when the key/action was just pressed. */
    wasPressed(action) {
      const codes = this._bindings[action];
      if (!codes) return this._justPressed.has(action);
      return codes.some(c => this._justPressed.has(c));
    }

    /** True for one frame when the key/action was just released. */
    wasReleased(action) {
      const codes = this._bindings[action];
      if (!codes) return this._justReleased.has(action);
      return codes.some(c => this._justReleased.has(c));
    }

    /**
     * Call at the end of each game frame to clear one-frame states.
     * The Engine calls this automatically.
     */
    flush() {
      this._justPressed.clear();
      this._justReleased.clear();
    }
  }

  GF.InputManager = InputManager;

})(window.GF = window.GF || {});
