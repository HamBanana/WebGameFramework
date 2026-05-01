// GameFramework/framework/systems/TurnBasedBattleSystem.js
// Generic turn-based battle controller — manages turn order, rounds, and
// the current actor. Renders nothing; the game decides how to draw and
// what menu options to expose for the active unit.
//
// Unit shape (the only fields the system reads):
//   {
//     id      : string,            // optional, for debugging
//     team    : 'player' | 'enemy' | string,
//     name    : string,
//     hp      : number,
//     maxHp   : number,
//     agility : number,            // higher = acts earlier in the round
//     dead    : boolean,           // set true when hp reaches 0
//   }
// The system mutates `dead` and `hp` only via dealDamage()/heal() helpers.
// The game is free to read or set any other unit fields.
//
// Lifecycle (driven by the game):
//   battle.start({ units, victory, defeat })
//   while (!battle.finished) {
//      const unit = battle.currentUnit();
//      // game shows menus, animations, attacks etc. for `unit`
//      battle.endTurn();          // advances to next unit
//   }
//
// Events fired on engine.events:
//   'battle:start'         { units }
//   'battle:round'         { round, order }
//   'battle:turn_start'    { unit }
//   'battle:turn_end'      { unit }
//   'battle:unit_damaged'  { unit, source, amount }
//   'battle:unit_healed'   { unit, source, amount }
//   'battle:unit_died'     { unit, source }
//   'battle:complete'      { result: 'victory' | 'defeat' | 'draw' }

(function (GF) {
  'use strict';

  class TurnBasedBattleSystem {
    constructor() {
      this.name     = 'TurnBasedBattleSystem';
      this._engine  = null;
      this._reset();
    }

    init(engine) { this._engine = engine; }

    _reset() {
      this._units    = [];
      this._order    = [];
      this._idx      = -1;
      this._round    = 0;
      this._victory  = null; // (units) => boolean
      this._defeat   = null;
      this.finished  = false;
      this.result    = null;
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    /**
     * Start a new battle.
     * @param {Object}   cfg
     * @param {Array}    cfg.units    - all combatants (will mutate)
     * @param {Function} [cfg.victory]- (units) => boolean (default: no enemy alive)
     * @param {Function} [cfg.defeat] - (units) => boolean (default: no player alive)
     */
    start(cfg = {}) {
      this._reset();
      this._units   = cfg.units || [];
      this._victory = cfg.victory || (units => !units.some(u => u.team === 'enemy'  && !u.dead));
      this._defeat  = cfg.defeat  || (units => !units.some(u => u.team === 'player' && !u.dead));
      this._emit('battle:start', { units: this._units });
      this._beginRound();
      return this;
    }

    /** True once an outcome has been decided. */
    get isFinished() { return this.finished; }

    /** Returns the unit currently taking its turn, or null. */
    currentUnit() {
      if (this.finished || this._idx < 0 || this._idx >= this._order.length) return null;
      return this._order[this._idx];
    }

    /** End the current unit's turn and advance to the next living unit. */
    endTurn() {
      const cur = this.currentUnit();
      if (cur) this._emit('battle:turn_end', { unit: cur });

      // Check end conditions after every turn
      if (this._checkEnd()) return;

      // Advance to next living unit in the round
      while (true) {
        this._idx++;
        if (this._idx >= this._order.length) {
          // Round complete — start next
          this._beginRound();
          // _beginRound may itself end the battle
          if (this.finished) return;
          break;
        }
        const next = this._order[this._idx];
        if (next && !next.dead) {
          this._emit('battle:turn_start', { unit: next });
          break;
        }
      }
    }

    /** All living units (or filtered by team). */
    livingUnits(team) {
      return this._units.filter(u => !u.dead && (!team || u.team === team));
    }

    /** All units (filtered by team). */
    allUnits(team) {
      return team ? this._units.filter(u => u.team === team) : this._units.slice();
    }

    // ── Damage / heal helpers ────────────────────────────────────────────────

    /**
     * Deal damage to a unit. Emits 'battle:unit_damaged' and 'battle:unit_died'.
     * @returns {number} the amount actually dealt
     */
    dealDamage(target, amount, source) {
      if (!target || target.dead) return 0;
      const before = target.hp;
      target.hp = Math.max(0, target.hp - Math.max(0, Math.round(amount)));
      const dealt = before - target.hp;
      this._emit('battle:unit_damaged', { unit: target, source, amount: dealt });
      if (target.hp <= 0 && !target.dead) {
        target.dead = true;
        this._emit('battle:unit_died', { unit: target, source });
      }
      return dealt;
    }

    /**
     * Heal a unit. Emits 'battle:unit_healed'.
     * @returns {number} the amount actually healed
     */
    heal(target, amount, source) {
      if (!target || target.dead) return 0;
      const before = target.hp;
      target.hp = Math.min(target.maxHp || target.hp + amount, target.hp + Math.max(0, Math.round(amount)));
      const healed = target.hp - before;
      this._emit('battle:unit_healed', { unit: target, source, amount: healed });
      return healed;
    }

    /** Force-end the battle with a result. */
    forceEnd(result) {
      this.finished = true;
      this.result   = result;
      this._emit('battle:complete', { result });
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    _beginRound() {
      // Order living units by agility desc, ties broken by current order
      this._round++;
      const living = this._units.filter(u => !u.dead);
      // Stable sort: tag with index, sort, strip
      this._order = living
        .map((u, i) => ({ u, i, ag: u.agility || 0 }))
        .sort((a, b) => (b.ag - a.ag) || (a.i - b.i))
        .map(o => o.u);
      this._idx = -1;

      this._emit('battle:round', { round: this._round, order: this._order.slice() });

      if (this._checkEnd()) return;

      // Move to first unit
      while (++this._idx < this._order.length) {
        const u = this._order[this._idx];
        if (!u.dead) {
          this._emit('battle:turn_start', { unit: u });
          return;
        }
      }
      // Empty round — call _beginRound again (shouldn't normally happen)
      if (this._order.length === 0) this.forceEnd('draw');
    }

    _checkEnd() {
      if (this.finished) return true;
      if (this._victory && this._victory(this._units)) {
        this.forceEnd('victory');
        return true;
      }
      if (this._defeat && this._defeat(this._units)) {
        this.forceEnd('defeat');
        return true;
      }
      return false;
    }

    _emit(name, detail) {
      if (this._engine && this._engine.events) this._engine.events.emit(name, detail);
    }

    update() {}
    render() {}
  }

  GF.TurnBasedBattleSystem = TurnBasedBattleSystem;

})(window.GF = window.GF || {});
