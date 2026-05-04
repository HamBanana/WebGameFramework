// games/Acca2/core/Cell.js
// Board cell — one tile on the map. Holds its own pixel-space position, type,
// district id, currently-rendered sprite, the four cardinal-slot pointers
// resolved at load time (up/down/left/right), the raw neighbour list, and
// (when type === 'buildable') a player-owned PlayerStructure.

(function (GF) {
  'use strict';
  const A = GF.Acca = GF.Acca || {};

  class Cell {
    constructor(id, x, y, type, district, sprite) {
      this.id        = id;
      this.x         = x;
      this.y         = y;
      this.type      = type;     // 'bank' | 'buildable' | 'chance' | 'empty' | …
      this.district  = district;
      this.sprite    = sprite;

      this.up    = null;
      this.down  = null;
      this.left  = null;
      this.right = null;

      this._neighbors = [];

      // Structure (only meaningful for type === 'buildable')
      this.structure = null;     // PlayerStructure | null

      this.animator = null;
    }

    neighbors() { return this._neighbors; }
  }

  A.Cell = Cell;

})(window.GF = window.GF || {});
