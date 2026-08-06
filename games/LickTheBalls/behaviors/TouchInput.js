// behaviors/TouchInput.js — maps touch events to left/right actions.
// Drop this into the game's script list (index.html) and it will
// automatically bind to the existing 'left' / 'right' actions in the
// InputManager.
(function (GF) {
  'use strict';

  GF.behavior('TouchInput', (cfg) => ({
    onAdd(e, world) {
      const engine = world.engine;
      const input  = engine.input;
      const canvas = engine.canvas;
      const w      = engine.config.width;
      const h      = engine.config.height;

      // ── helpers ──────────────────────────────────────────────
      const getTouchX = (ev) => {
        const t = ev.touches ? ev.touches[0] : ev;
        const rect = canvas.getBoundingClientRect();
        return ((t.clientX - rect.left) / rect.width) * w;
      };

      const isLeft = (x) => x < w / 2;

      // ── event listeners ──────────────────────────────────────
      const onDown = (ev) => {
        ev.preventDefault();
        const x = getTouchX(ev);
        if (isLeft(x)) input.pressAction('left');
        else            input.pressAction('right');
      };

      const onMove = (ev) => {
        ev.preventDefault();
        const x = getTouchX(ev);
        const wasLeft = isLeft(x);
        // Release the opposite action, press the current one
        if (wasLeft) {
          input.releaseAction('right');
          input.pressAction('left');
        } else {
          input.releaseAction('left');
          input.pressAction('right');
        }
      };

      const onUp = (ev) => {
        ev.preventDefault();
        input.releaseAction('left');
        input.releaseAction('right');
      };

      canvas.addEventListener('touchstart', onDown,  { passive: false });
      canvas.addEventListener('touchmove',  onMove,  { passive: false });
      canvas.addEventListener('touchend',    onUp,    { passive: false });
      canvas.addEventListener('touchcancel', onUp,    { passive: false });

      // Also handle pointer events for mouse-fallthrough on desktop
      canvas.addEventListener('mousedown', (ev) => {
        const rect = canvas.getBoundingClientRect();
        const x = ((ev.clientX - rect.left) / rect.width) * w;
        if (isLeft(x)) input.pressAction('left');
        else            input.pressAction('right');
      });
      canvas.addEventListener('mousemove', (ev) => {
        const rect = canvas.getBoundingClientRect();
        const x = ((ev.clientX - rect.left) / rect.width) * w;
        const wasLeft = isLeft(x);
        if (wasLeft) {
          input.releaseAction('right');
          input.pressAction('left');
        } else {
          input.releaseAction('left');
          input.pressAction('right');
        }
      });
      canvas.addEventListener('mouseup', () => {
        input.releaseAction('left');
        input.releaseAction('right');
      });
      canvas.addEventListener('mouseleave', () => {
        input.releaseAction('left');
        input.releaseAction('right');
      });
    },
  }));
})(window.GF);
