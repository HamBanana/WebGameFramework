// games/Acca2/core/MovementController.js
// Drives stepping during the MOVE turn-stage. Reads the four cardinal slots
// (up/down/left/right) that BoardLoader pre-resolves on every Cell, and steps
// to those slots on arrow-key press. No road selection, no pixel-exact
// alignment — if a cell has multiple neighbours that resolve into the same
// cardinal bucket, only the most-aligned one is reachable.
//
// The trade-off: real-world maps (e.g. Denmark) where city links aren't on
// a strict 64-pixel grid stay fully navigable with arrow keys alone.

(function (GF) {
  'use strict';
  const A = GF.Acca = GF.Acca || {};

  class MovementController {
    constructor(input, controls, eventBus, game) {
      this.input    = input;
      this.controls = controls;
      this.events   = eventBus;
      this.game     = game;
      this.active   = false;
      this.player   = null;
      this.movesLeft = 0;
      // Adjacent neighbours by cardinal direction (or null).
      this.adjacent = { up: null, down: null, left: null, right: null };
      // Non-adjacent road choices (legacy — kept null nowadays).
      this.roads    = [];
      this.roadIdx  = 0;
    }

    begin(player, moves) {
      this.player    = player;
      this.movesLeft = moves;
      this.active    = true;
      if (this.game && this.game.die) this.game.die.setFace(this.movesLeft);
      this._refreshCandidates();
    }

    /** Pull the current cell's pre-resolved cardinal slots into the active
     *  direction map. Slots are computed once at map load via greedy
     *  angle-fit assignment (BoardLoader), so MOVE just reads them here. */
    _refreshCandidates() {
      const cur = this.player && this.player.currentCell;
      this.adjacent = { up: null, down: null, left: null, right: null };
      this.roads    = [];
      this.roadIdx  = 0;
      if (!cur) return;
      this.adjacent.up    = cur.up    || null;
      this.adjacent.down  = cur.down  || null;
      this.adjacent.left  = cur.left  || null;
      this.adjacent.right = cur.right || null;
      // Dead-end (no cardinal slots filled) — forfeit movement and log it
      // so the player knows what happened.
      const anyAdj = !!(this.adjacent.up || this.adjacent.down ||
                        this.adjacent.left || this.adjacent.right);
      if (!anyAdj) {
        if (this.game && this.game.log && this.player) {
          this.game.log(`${this.player.name} reached a dead end with ${this.movesLeft} move${this.movesLeft === 1 ? '' : 's'} remaining.`);
        }
        this.active = false;
        this.events.emit('move:complete', { player: this.player });
      }
    }

    /** The road currently highlighted (renderer hook). Returns null when
     *  there are no non-adjacent roads or when MOVE is not active. */
    selectedRoad() {
      if (!this.active || this.roads.length === 0) return null;
      return this.roads[this.roadIdx] || null;
    }

    update() {
      if (!this.active || !this.player) return;
      // Hand input over to the menu while it's visible (e.g. landing on a
      // property → buy/continue prompt).
      if (this.game && this.game.menu && this.game.menu.visible) return;

      // Cardinal stepping — pressing an arrow key with a slot filled in that
      // direction steps immediately.
      if (this._pressed('up')    && this.adjacent.up)    { this.stepTo(this.adjacent.up);    return; }
      if (this._pressed('down')  && this.adjacent.down)  { this.stepTo(this.adjacent.down);  return; }
      if (this._pressed('left')  && this.adjacent.left)  { this.stepTo(this.adjacent.left);  return; }
      if (this._pressed('right') && this.adjacent.right) { this.stepTo(this.adjacent.right); return; }
    }

    /** Public so a future hook (e.g. teleporter) can drive movement. */
    stepTo(target) {
      const p = this.player;
      this.events.emit('cell:leave', { player: p, cell: p.currentCell });
      p.currentCell = target;
      this.movesLeft--;
      if (this.game && this.game.die) {
        if (this.movesLeft > 0) this.game.die.setFace(this.movesLeft);
      }
      const final = this.movesLeft <= 0;
      this.events.emit('cell:enter', { player: p, cell: target, final });

      if (final) {
        this.active = false;
        this.adjacent = { up: null, down: null, left: null, right: null };
        this.roads    = [];
        this.events.emit('move:complete', { player: p });
      } else {
        this._refreshCandidates();
      }
    }

    _pressed(action) {
      const codes = this.controls[action];
      if (!codes) return false;
      return codes.some(code => this.input.wasPressed(code));
    }

    cancel() {
      this.active    = false;
      this.player    = null;
      this.movesLeft = 0;
      this.adjacent  = { up: null, down: null, left: null, right: null };
      this.roads     = [];
      this.roadIdx   = 0;
    }
  }

  A.MovementController = MovementController;

})(window.GF = window.GF || {});
