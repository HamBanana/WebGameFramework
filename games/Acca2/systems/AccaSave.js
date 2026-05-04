// games/Acca/systems/AccaSave.js — Planning §16.3.
// Serializes a snapshot of the live game state to localStorage and restores it.
// Schema version 1.

(function (GF) {
  'use strict';
  GF.Acca = GF.Acca || {};

  const VERSION = 1;
  const STORAGE_KEY = 'acca_save_v1';

  function serialize(game) {
    const players = game.players.map(p => ({
      index: p.index,
      name: p.name,
      color: p.color,
      spriteName: p.spriteName,
      money: p.money,
      level: p.level,
      isBankrupt: p.isBankrupt,
      resources: Object.assign({}, p.resources),
      currentCellId: p.currentCell && p.currentCell.id,
      districtsMayoredOf: Array.from(p.districtsMayoredOf || []),
      ownedStructureCellIds: p.ownedStructures.map(s => s.cell && s.cell.id),
    }));

    const cells = game.cells.map(c => ({
      id: c.id,
      structure: c.structure ? {
        type: c.structure.type,
        ownerIndex: c.structure.ownerIndex,
        baseValue: c.structure.baseValue,
        currentValue: c.structure.currentValue,
        tollAccrued: c.structure.tollAccrued,
        sabotagedUntilTurn: c.structure.sabotagedUntilTurn,
        level: c.structure.level || 1,
        storedMoney: c.structure.storedMoney || 0,
        idleUntilTurn: c.structure.idleUntilTurn || -1,
      } : null,
    }));

    return {
      version: VERSION,
      mapId: game.cfg.board.map,
      turnCounter: game.turnCounter || 0,
      currentPlayerIndex: game.currentPlayerIndex,
      players,
      cells,
      districts: game.districtSys && game.districtSys.serialize(),
      market:   game.marketSys  && game.marketSys.serialize(),
      chance:   game.chanceSys  && game.chanceSys.serialize(),
      trade:    game.tradeSys   && game.tradeSys.serialize(),
      log: game.eventLog.slice(-20),
      cooperativeThreat: game.cooperativeThreat || 0,
    };
  }

  function deserialize(data, game) {
    if (!data) return false;
    if (data.version !== VERSION) {
      console.warn('[AccaSave] save version ' + data.version + ' != ' + VERSION + '; refusing.');
      return false;
    }
    const cellById = new Map();
    game.cells.forEach(c => cellById.set(c.id, c));

    game.cells.forEach(c => { c.structure = null; });
    game.players.forEach(p => {
      p.ownedStructures = [];
      p.districtsMayoredOf = new Set();
    });

    data.cells.forEach(snap => {
      const cell = cellById.get(snap.id);
      if (!cell) return;
      if (snap.structure) {
        const s = game.structures.build(cell, snap.structure.type, snap.structure.ownerIndex);
        if (s) {
          s.baseValue    = snap.structure.baseValue;
          s.currentValue = snap.structure.currentValue;
          s.tollAccrued  = snap.structure.tollAccrued || 0;
          s.sabotagedUntilTurn = snap.structure.sabotagedUntilTurn || -1;
          s.level        = snap.structure.level || 1;
          s.storedMoney  = snap.structure.storedMoney || 0;
          s.idleUntilTurn = snap.structure.idleUntilTurn || -1;
        }
      }
    });

    data.players.forEach((snap, i) => {
      const p = game.players[i];
      if (!p) return;
      p.money       = snap.money;
      p.level       = snap.level;
      p.isBankrupt  = snap.isBankrupt;
      p.resources   = Object.assign({}, snap.resources);
      const cell    = cellById.get(snap.currentCellId);
      if (cell) p.currentCell = cell;
      (snap.districtsMayoredOf || []).forEach(r => p.districtsMayoredOf.add(r));
    });

    game.currentPlayerIndex = data.currentPlayerIndex;
    game.turnCounter = data.turnCounter || 0;
    game.eventLog = (data.log || []).slice();
    game.cooperativeThreat = data.cooperativeThreat || 0;

    if (game.districtSys) game.districtSys.deserialize(data.districts);
    if (game.marketSys)   game.marketSys.deserialize(data.market);
    if (game.chanceSys)   game.chanceSys.deserialize(data.chance);
    if (game.tradeSys)    game.tradeSys.deserialize(data.trade);
    if (game.districtSys) game.districtSys.recomputeAll();
    return true;
  }

  function save(game) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize(game)));
      return true;
    } catch (e) {
      console.warn('[AccaSave] save failed', e);
      return false;
    }
  }

  function load(game) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      return deserialize(data, game);
    } catch (e) {
      console.warn('[AccaSave] load failed', e);
      return false;
    }
  }

  function clear() { localStorage.removeItem(STORAGE_KEY); }
  function exists() { return !!localStorage.getItem(STORAGE_KEY); }

  GF.Acca.Save = { serialize, deserialize, save, load, clear, exists, VERSION };

})(window.GF = window.GF || {});
