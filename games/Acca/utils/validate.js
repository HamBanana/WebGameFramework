// games/Acca/utils/validate.js — light-touch validators (Planning §16.5).
// Each returns { ok, errors }.

(function (GF) {
  'use strict';
  GF.Acca = GF.Acca || {};

  function validateMap(json) {
    const errors = [];
    if (!json || typeof json !== 'object') {
      errors.push('map: not an object');
      return { ok: false, errors };
    }
    if (!Array.isArray(json.cells)) errors.push('map.cells must be an array');
    if (!Array.isArray(json.connections)) errors.push('map.connections must be an array');
    if (json.cells) {
      const ids = new Set();
      json.cells.forEach((c, i) => {
        if (typeof c.id !== 'number' && typeof c.id !== 'string')
          errors.push(`cell[${i}].id missing/wrong type`);
        if (ids.has(c.id)) errors.push(`cell[${i}].id duplicated: ${c.id}`);
        ids.add(c.id);
        if (typeof c.x !== 'number' || typeof c.y !== 'number')
          errors.push(`cell[${i}] missing x/y`);
        if (!c.type) errors.push(`cell[${i}] missing type`);
      });
      if (json.connections) {
        json.connections.forEach((conn, i) => {
          if (!ids.has(conn.from)) errors.push(`connection[${i}].from references missing cell ${conn.from}`);
          if (!ids.has(conn.to))   errors.push(`connection[${i}].to references missing cell ${conn.to}`);
        });
      }
    }
    return { ok: errors.length === 0, errors };
  }

  function validateConfig(cfg) {
    const errors = [];
    if (!cfg) { errors.push('cfg missing'); return { ok: false, errors }; }
    if (!cfg.engine || !cfg.engine.canvasId) errors.push('cfg.engine.canvasId missing');
    if (!cfg.market || !Array.isArray(cfg.market.resources)) errors.push('cfg.market.resources missing');
    if (!Array.isArray(cfg.players) || cfg.players.length < 2) errors.push('cfg.players needs ≥2 entries');
    if (!cfg.structures || !Array.isArray(cfg.structures.catalog)) errors.push('cfg.structures.catalog missing');
    return { ok: errors.length === 0, errors };
  }

  function validateSave(json) {
    const errors = [];
    if (!json || typeof json !== 'object') {
      errors.push('save: not an object'); return { ok: false, errors };
    }
    if (typeof json.version !== 'number') errors.push('save.version missing');
    if (!Array.isArray(json.players)) errors.push('save.players missing');
    return { ok: errors.length === 0, errors };
  }

  GF.Acca.validate = { validateMap, validateConfig, validateSave };

})(window.GF = window.GF || {});
