// GameFramework/framework/core/EventBus.js
// Simple publish/subscribe event bus for decoupled system communication

(function (GF) {
  'use strict';

  class EventBus {
    constructor() {
      this._listeners = {};
    }

    /**
     * Subscribe to an event.
     * @param {string} event
     * @param {Function} callback
     * @returns {Function} unsubscribe function
     */
    on(event, callback) {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(callback);
      return () => this.off(event, callback);
    }

    /** Unsubscribe from an event. */
    off(event, callback) {
      if (!this._listeners[event]) return;
      this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    }

    /** Publish an event with optional data. */
    emit(event, data) {
      if (!this._listeners[event]) return;
      this._listeners[event].forEach(cb => cb(data));
    }

    /** Subscribe once; auto-unsubscribes after first call. */
    once(event, callback) {
      const unsub = this.on(event, (data) => {
        callback(data);
        unsub();
      });
    }

    /** Remove all listeners for an event (or all events if none specified). */
    clear(event) {
      if (event) {
        delete this._listeners[event];
      } else {
        this._listeners = {};
      }
    }
  }

  GF.EventBus = EventBus;

})(window.GF = window.GF || {});
