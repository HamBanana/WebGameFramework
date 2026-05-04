// GameFramework/framework/systems/StateMachine.js
// A small, allocation-free finite state machine with timed states and
// onEnter / onUpdate / onExit hooks. Useful for fighter character logic,
// boss phases, AI behaviour, dialog flow, etc.
//
// Example:
//   const fsm = new GF.StateMachine({
//     initial: 'idle',
//     states: {
//       idle: {
//         onEnter(prev) { /* … */ },
//         onUpdate(dt)  { if (input.wasPressed('attack')) fsm.go('punch'); },
//       },
//       punch: {
//         duration: 0.4,                // auto-transition after 0.4 s
//         onEnter() { anim.play('punch'); },
//         onComplete: 'idle',           // state to enter when duration elapses
//       },
//       hurt: {
//         duration: 0.3,
//         onEnter() { anim.play('hit'); },
//         onComplete: (fsm) => fsm.previous,  // dynamic transition
//       },
//     },
//   });
//
//   // Inside scene update:
//   fsm.update(dt);
//   fsm.go('punch');                    // explicit transition
//   if (fsm.is('idle', 'walk')) { … }   // multi-state membership test
//   fsm.timeInState                     // seconds since entering current state

(function (GF) {
  'use strict';

  function StateMachine(opts) {
    opts = opts || {};
    this.states  = opts.states || {};
    this.current = null;
    this.previous = null;
    this.timeInState = 0;
    this._duration   = 0;       // 0 = no auto-transition
    this._onComplete = null;    // string or function
    this._owner = opts.owner || null;

    if (opts.initial) this.go(opts.initial);
  }

  StateMachine.prototype.has = function (name) { return !!this.states[name]; };

  StateMachine.prototype.is = function (/* ...names */) {
    for (var i = 0; i < arguments.length; i++) {
      if (this.current === arguments[i]) return true;
    }
    return false;
  };

  StateMachine.prototype.go = function (name, payload) {
    if (!this.states[name]) {
      console.warn('[StateMachine] unknown state: ' + name);
      return false;
    }
    if (name === this.current) return false;

    var oldName = this.current;
    var oldDef  = oldName ? this.states[oldName] : null;
    var newDef  = this.states[name];

    if (oldDef && typeof oldDef.onExit === 'function') {
      oldDef.onExit.call(this._owner || this, name, this);
    }

    this.previous     = oldName;
    this.current      = name;
    this.timeInState  = 0;
    this._duration    = newDef.duration || 0;
    this._onComplete  = newDef.onComplete || null;

    if (typeof newDef.onEnter === 'function') {
      newDef.onEnter.call(this._owner || this, oldName, this, payload);
    }
    return true;
  };

  // Force re-enter: useful when the same state needs to restart its timer.
  StateMachine.prototype.restart = function (payload) {
    if (!this.current) return;
    var def = this.states[this.current];
    this.timeInState = 0;
    if (typeof def.onEnter === 'function') {
      def.onEnter.call(this._owner || this, this.current, this, payload);
    }
  };

  StateMachine.prototype.update = function (dt) {
    if (!this.current) return;
    this.timeInState += dt;

    var def = this.states[this.current];
    if (typeof def.onUpdate === 'function') {
      def.onUpdate.call(this._owner || this, dt, this);
    }

    // Auto-transition
    if (this._duration > 0 && this.timeInState >= this._duration) {
      var next = this._onComplete;
      if (typeof next === 'function') next = next.call(this._owner || this, this);
      if (next) this.go(next);
      else this._duration = 0;  // stop firing
    }
  };

  // Convenience: fire a state-specific handler if defined (e.g. on input).
  StateMachine.prototype.handle = function (event /* , ...args */) {
    var def = this.current && this.states[this.current];
    if (!def) return;
    var fn = def['on_' + event] || def[event];
    if (typeof fn === 'function') {
      var args = Array.prototype.slice.call(arguments, 1);
      args.push(this);
      return fn.apply(this._owner || this, args);
    }
  };

  GF.StateMachine = StateMachine;

})(window.GF = window.GF || {});
