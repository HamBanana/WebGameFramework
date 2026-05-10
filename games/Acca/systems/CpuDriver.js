// games/Acca/systems/CpuDriver.js
// Phase 6 — CPU opponent.
// Drives a CPU player's turn by intercepting menu prompts and movement steps
// each frame. Bypasses the keyboard input system: when the menu is visible
// for a CPU's turn, picks the best option using simple label/cost heuristics
// and calls the option's action() directly. When the turn is in MOVE stage,
// calls MovementController.stepTo() with a randomly-chosen valid neighbour.
//
// The driver waits a configurable cooldown between actions so the human
// player can follow what the CPU is doing. Without the cooldown, CPU turns
// would resolve in a single frame and feel like teleportation.

(function (GF) {
  'use strict';
  const A = GF.Acca = GF.Acca || {};

  class CpuDriver {
    constructor(game) {
      this.game = game;
      this.cooldown = 0;
      this.menuDelay = 0.45;  // seconds between menu actions
      this.stepDelay = 0.18;  // seconds between movement steps
    }

    update(dt) {
      const game = this.game;
      if (game.gameState !== A.GAME_STATE.PLAYING) return;
      const player = game.currentPlayer;
      if (!player || !player.isCPU || player.isBankrupt) return;

      if (this.cooldown > 0) { this.cooldown -= dt; return; }

      // Menu visible? Pick an option and act.
      if (game.menu && game.menu.visible && game.menu.options.length > 0) {
        this._pickMenuOption();
        this.cooldown = this.menuDelay;
        return;
      }

      // No menu — if movement is active, step. Skip if turn is in BETWEEN /
      // animation states (let the existing engine drive those).
      if (game.movement && game.movement.active) {
        this._stepMovement();
        this.cooldown = this.stepDelay;
        return;
      }
    }

    /** Pick the most strategic enabled menu option, hide the menu, and run
     *  the option's action(). Mirrors the human flow (Menu.update calls
     *  hide() then action()) so downstream menus open correctly. */
    _pickMenuOption() {
      const game = this.game;
      const menu = game.menu;
      const player = game.currentPlayer;
      const opts = menu.options.map((o, i) => ({ ...o, _index: i }))
                                .filter(o => !o._disabled);
      if (opts.length === 0) {
        // All disabled — try Skip if present.
        const skip = menu.options.find(o => o.label === 'Skip' || o.label === 'Continue');
        if (skip && skip.action) { menu.hide(); skip.action(); }
        else menu.hide();
        return;
      }

      const find = (label) => opts.find(o => o.label === label);
      const findStarts = (prefix) => opts.find(o => o.label && o.label.indexOf(prefix) === 0);

      // Auto-confirm prompts: chance results, end-of-turn dialogs.
      let chosen = find('OK') || find('Continue');
      if (chosen) { menu.hide(); chosen.action(); return; }

      // Build menu — pick cheapest affordable structure (already sorted in
      // the build menu, so the first 'Build ...' option is cheapest).
      const buildOpt = opts.find(o => o.label && o.label.indexOf('Build ') === 0
                                  && o.label.indexOf('Build from') !== 0);
      if (buildOpt) { menu.hide(); buildOpt.action(); return; }

      // "Buy from <opponent>" — accept on any property the CPU can afford
      // and that's a reasonable price (≤ 60% of CPU's net worth).
      const buyFrom = opts.find(o => o.label && o.label.indexOf('Buy from ') === 0);
      if (buyFrom) {
        const nw = game.netWorth(player);
        // Extract the cost from the label "Buy from X ($1234 = ...)"
        const m = /\$(\d+)/.exec(buyFrom.label);
        const cost = m ? parseInt(m[1], 10) : Infinity;
        if (cost <= nw * 0.6 && Math.random() < 0.4) {
          menu.hide(); buyFrom.action(); return;
        }
      }

      // Festival / grant — skip; CPU stays simple.
      // Roll on the start menu — always.
      chosen = find('Roll');
      if (chosen) { menu.hide(); chosen.action(); return; }

      // Skip / Pass turn fallbacks.
      chosen = find('Skip') || find('Pass turn');
      if (chosen) { menu.hide(); chosen.action(); return; }

      // Done (e.g. market modal).
      chosen = find('Done');
      if (chosen) { menu.hide(); chosen.action(); return; }

      // Sell-asset / market sub-menus: pick Back to fall through.
      chosen = find('Back');
      if (chosen) { menu.hide(); chosen.action(); return; }

      // Last resort — first enabled option.
      const first = opts[0];
      menu.hide();
      if (first.action) {
        if (first.stepper) first.action(first.stepper.value || first.stepper.min || 0);
        else first.action();
      }
    }

    /** Step in a randomly-chosen valid cardinal direction. Calls stepTo()
     *  directly on MovementController so the input layer isn't synthesised. */
    _stepMovement() {
      const game = this.game;
      const mv   = game.movement;
      if (!mv || !mv.active) return;
      const dirs = [];
      if (mv.adjacent.up)    dirs.push(mv.adjacent.up);
      if (mv.adjacent.down)  dirs.push(mv.adjacent.down);
      if (mv.adjacent.left)  dirs.push(mv.adjacent.left);
      if (mv.adjacent.right) dirs.push(mv.adjacent.right);
      if (dirs.length === 0) return;
      const pick = dirs[Math.floor(Math.random() * dirs.length)];
      mv.stepTo(pick);
    }
  }

  A.CpuDriver = CpuDriver;

})(window.GF = window.GF || {});
