// GameFramework/framework/systems/SaveSystem.js
// Thin localStorage wrapper with JSON serialisation, versioning, and slot support.
//
// All keys are namespaced so saves from different games never collide.
// createGame() exposes this as game.save; set opts.saveOpts.namespace to your
// game's name for isolation.
//
// Usage:
//   game.save.write('slot1', { level: 3, score: 9500 });
//   const record = game.save.read('slot1');
//   // record -> { data: { level: 3, score: 9500 }, version: 1, timestamp: <ms> }
//
//   game.save.list();   // [ { slot, version, timestamp }, … ]
//   game.save.exists('slot1');  // true
//   game.save.delete('slot1');
//   game.save.clear();  // wipe every slot in this namespace

(function (GF) {
  'use strict';

  class SaveSystem {
    /**
     * @param {Object} cfg
     * @param {string} cfg.namespace - prefix for localStorage keys (default: 'GF')
     */
    constructor(cfg = {}) {
      this.name      = 'SaveSystem';
      this.namespace = cfg.namespace || 'GF';
    }

    // ── Key helpers ─────────────────────────────────────────────────────────

    _key(slot) {
      return 'GF_SAVE_' + this.namespace + '_' + String(slot);
    }

    _prefix() {
      return 'GF_SAVE_' + this.namespace + '_';
    }

    // ── Core API ────────────────────────────────────────────────────────────

    /**
     * Write data to a named save slot.
     *
     * @param {string} slot          - slot identifier, e.g. 'slot1' or 'autosave'
     * @param {*}      data          - any JSON-serialisable value
     * @param {number} [version=1]   - schema version number (for future migration)
     * @returns {boolean}            - true on success, false if localStorage is unavailable
     */
    write(slot, data, version) {
      try {
        const record = {
          version:   version !== undefined ? version : 1,
          timestamp: Date.now(),
          data:      data,
        };
        localStorage.setItem(this._key(slot), JSON.stringify(record));
        return true;
      } catch (e) {
        console.warn('[SaveSystem] write("' + slot + '") failed:', e);
        return false;
      }
    }

    /**
     * Read a save slot.
     *
     * @param {string} slot
     * @returns {{ data: *, version: number, timestamp: number } | null}
     *   Returns null when the slot is empty or the JSON is corrupt.
     */
    read(slot) {
      try {
        const raw = localStorage.getItem(this._key(slot));
        if (raw === null) return null;
        return JSON.parse(raw);
      } catch (e) {
        console.warn('[SaveSystem] read("' + slot + '") failed:', e);
        return null;
      }
    }

    /**
     * Return true when the slot contains data.
     * @param {string} slot
     */
    exists(slot) {
      return localStorage.getItem(this._key(slot)) !== null;
    }

    /**
     * Delete a single save slot.
     * @param {string} slot
     */
    delete(slot) {
      localStorage.removeItem(this._key(slot));
    }

    /**
     * List all save slots for this namespace, sorted by timestamp (newest first).
     * @returns {{ slot: string, version: number|null, timestamp: number|null }[]}
     */
    list() {
      const prefix  = this._prefix();
      const results = [];

      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith(prefix)) continue;
        const slot = k.slice(prefix.length);
        try {
          const record = JSON.parse(localStorage.getItem(k));
          results.push({ slot, version: record.version, timestamp: record.timestamp });
        } catch (_) {
          results.push({ slot, version: null, timestamp: null });
        }
      }

      results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      return results;
    }

    /**
     * Delete all save slots in this namespace.
     */
    clear() {
      const prefix   = this._prefix();
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) toRemove.push(k);
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    }

    // ── System interface (no-ops — SaveSystem is sync / on-demand) ──────────

    update() {}
    render() {}
  }

  GF.SaveSystem = SaveSystem;

})(window.GF = window.GF || {});
