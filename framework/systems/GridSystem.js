// GameFramework/framework/systems/GridSystem.js
// Logical grid for tactical games — passability, occupants, A* pathfinding,
// BFS range/area queries, and grid<->world coordinate conversion.
//
// GridSystem is intentionally orthogonal to TilemapSystem. TilemapSystem
// renders tile graphics; GridSystem owns the logical playfield (who is on
// which cell, which cells are blocked, where can a unit reach this turn).
//
// Quick start:
//   const grid = game.grids.create({ cols: 12, rows: 10, cellSize: 32, x: 0, y: 0 });
//   grid.setBlocked(3, 4, true);
//   grid.placeOccupant(unit, 5, 5);
//   const reachable = grid.tilesInRange(unit, 4); // [{col,row,cost}]
//   const path      = grid.findPath({col: 5, row: 5}, {col: 8, row: 7});
//   const { x, y }  = grid.toWorldCenter(8, 7);
//
// Each occupant is an arbitrary object identified by reference. Optionally
// it may expose a `team` (string) — used by tilesInRange to treat enemy
// occupants as blockers and ally occupants as walk-through-only.

(function (GF) {
  'use strict';

  // ─── Min-heap priority queue (for A*) ───────────────────────────────────────
  class _PQ {
    constructor() { this._a = []; }
    get size() { return this._a.length; }
    push(item, prio) {
      this._a.push({ item, prio });
      let i = this._a.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (this._a[p].prio <= this._a[i].prio) break;
        [this._a[p], this._a[i]] = [this._a[i], this._a[p]];
        i = p;
      }
    }
    pop() {
      const top = this._a[0];
      const last = this._a.pop();
      if (this._a.length) {
        this._a[0] = last;
        let i = 0;
        const n = this._a.length;
        for (;;) {
          const l = i * 2 + 1, r = l + 1;
          let m = i;
          if (l < n && this._a[l].prio < this._a[m].prio) m = l;
          if (r < n && this._a[r].prio < this._a[m].prio) m = r;
          if (m === i) break;
          [this._a[m], this._a[i]] = [this._a[i], this._a[m]];
          i = m;
        }
      }
      return top.item;
    }
  }

  // ─── Grid ───────────────────────────────────────────────────────────────────

  class Grid {
    /**
     * @param {Object} cfg
     * @param {number} cfg.cols       - number of columns
     * @param {number} cfg.rows       - number of rows
     * @param {number} cfg.cellSize   - pixel size of one cell (square)
     * @param {number} [cfg.x=0]      - world X of grid's top-left corner
     * @param {number} [cfg.y=0]      - world Y of grid's top-left corner
     * @param {number[]} [cfg.terrainCost] - per-cell move-cost grid (row-major), defaults 1
     * @param {boolean[]} [cfg.blocked]    - per-cell blocked grid (row-major), defaults false
     */
    constructor(cfg = {}) {
      this.cols     = cfg.cols     || 1;
      this.rows     = cfg.rows     || 1;
      this.cellSize = cfg.cellSize || 32;
      this.x        = cfg.x        || 0;
      this.y        = cfg.y        || 0;

      const n = this.cols * this.rows;

      // Terrain cost (1 = normal, higher = harder to traverse)
      this._cost    = new Array(n);
      // Static blockers (walls etc.)
      this._blocked = new Array(n);
      // Occupant references — only one occupant per cell
      this._occupants = new Array(n);

      for (let i = 0; i < n; i++) {
        this._cost[i]      = cfg.terrainCost ? (cfg.terrainCost[i] || 1) : 1;
        this._blocked[i]   = cfg.blocked     ? !!cfg.blocked[i]          : false;
        this._occupants[i] = null;
      }
    }

    // ── Coordinate conversion ─────────────────────────────────────────────────

    /** Convert grid (col,row) → world top-left pixel of that cell. */
    toWorld(col, row) {
      return { x: this.x + col * this.cellSize, y: this.y + row * this.cellSize };
    }

    /** Convert grid (col,row) → world centre pixel of that cell. */
    toWorldCenter(col, row) {
      const half = this.cellSize / 2;
      return { x: this.x + col * this.cellSize + half, y: this.y + row * this.cellSize + half };
    }

    /** Convert world pixel → grid (col,row). Returns {col,row} possibly out of bounds. */
    toGrid(worldX, worldY) {
      return {
        col: Math.floor((worldX - this.x) / this.cellSize),
        row: Math.floor((worldY - this.y) / this.cellSize),
      };
    }

    /** Returns true if (col,row) lies on the board. */
    inBounds(col, row) {
      return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
    }

    // ── Cell state ────────────────────────────────────────────────────────────

    _idx(col, row) { return row * this.cols + col; }

    setBlocked(col, row, blocked) {
      if (!this.inBounds(col, row)) return;
      this._blocked[this._idx(col, row)] = !!blocked;
    }
    isBlocked(col, row) {
      if (!this.inBounds(col, row)) return true;
      return this._blocked[this._idx(col, row)];
    }

    setCost(col, row, cost) {
      if (!this.inBounds(col, row)) return;
      this._cost[this._idx(col, row)] = Math.max(0.1, cost);
    }
    getCost(col, row) {
      if (!this.inBounds(col, row)) return Infinity;
      return this._cost[this._idx(col, row)];
    }

    // ── Occupancy ─────────────────────────────────────────────────────────────

    occupantAt(col, row) {
      if (!this.inBounds(col, row)) return null;
      return this._occupants[this._idx(col, row)];
    }

    /** Place occupant at (col,row). Removes it from any prior cell. */
    placeOccupant(occ, col, row) {
      if (!occ) return;
      this.removeOccupant(occ);
      if (!this.inBounds(col, row)) return;
      this._occupants[this._idx(col, row)] = occ;
      occ.col = col;
      occ.row = row;
    }

    /** Remove occupant from its current cell (looks up by reference). */
    removeOccupant(occ) {
      if (!occ) return;
      // Fast path if occupant tracks its position
      if (Number.isInteger(occ.col) && Number.isInteger(occ.row) && this.inBounds(occ.col, occ.row)) {
        const i = this._idx(occ.col, occ.row);
        if (this._occupants[i] === occ) this._occupants[i] = null;
      }
      // Fallback scan
      for (let i = 0; i < this._occupants.length; i++) {
        if (this._occupants[i] === occ) this._occupants[i] = null;
      }
    }

    /** Iterate all occupants. Callback receives (occ, col, row). */
    forEachOccupant(cb) {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const o = this._occupants[this._idx(c, r)];
          if (o) cb(o, c, r);
        }
      }
    }

    // ── Pathing primitives ────────────────────────────────────────────────────

    /**
     * Returns true if a unit can ENTER (col,row). Walls and enemy occupants
     * block; allied occupants are passable but not stoppable (handled in tilesInRange).
     */
    isPassable(col, row, opts = {}) {
      if (!this.inBounds(col, row)) return false;
      if (this.isBlocked(col, row)) return false;
      const occ = this.occupantAt(col, row);
      if (!occ) return true;
      if (opts.ignore && opts.ignore === occ) return true;
      if (opts.team && occ.team && occ.team === opts.team) return true; // walk through allies
      return false;
    }

    /** Returns true if a unit can STOP on (col,row). Any occupant other than `ignore` blocks. */
    isStoppable(col, row, opts = {}) {
      if (!this.inBounds(col, row)) return false;
      if (this.isBlocked(col, row)) return false;
      const occ = this.occupantAt(col, row);
      if (!occ) return true;
      if (opts.ignore && opts.ignore === occ) return true;
      return false;
    }

    /**
     * Manhattan-distance neighbours of (c,r). Returns an array of {col,row}.
     */
    neighbours4(col, row) {
      const out = [];
      if (col > 0)              out.push({ col: col - 1, row });
      if (col < this.cols - 1)  out.push({ col: col + 1, row });
      if (row > 0)              out.push({ col, row: row - 1 });
      if (row < this.rows - 1)  out.push({ col, row: row + 1 });
      return out;
    }

    /**
     * BFS from origin yielding every cell reachable within `maxCost` total
     * movement cost. Cells occupied by an ally are traversable but not stoppable.
     * Returned cells are stoppable (passable AND empty/the unit itself).
     *
     * @param {Object} origin    - { col, row } or a unit with col/row/team
     * @param {number} maxCost   - movement budget
     * @param {Object} [opts]
     * @param {string} [opts.team] - allies of this team are walk-through
     * @param {Object} [opts.ignore] - occupant to ignore (typically the moving unit)
     * @returns {Array<{col,row,cost,parent}>}
     */
    tilesInRange(origin, maxCost, opts = {}) {
      const team   = opts.team   || (origin && origin.team)   || null;
      const ignore = opts.ignore || origin || null;
      const startC = origin.col, startR = origin.row;
      if (!this.inBounds(startC, startR)) return [];

      const dist  = new Map();
      const parent= new Map();
      const key   = (c, r) => r * this.cols + c;

      dist.set(key(startC, startR), 0);
      const pq = new _PQ();
      pq.push({ col: startC, row: startR }, 0);

      const out = [];

      while (pq.size) {
        const cur = pq.pop();
        const k   = key(cur.col, cur.row);
        const cost = dist.get(k);

        // Origin is always reachable (cost 0)
        if (this.isStoppable(cur.col, cur.row, { ignore })) {
          out.push({ col: cur.col, row: cur.row, cost, parent: parent.get(k) || null });
        }

        const nb = this.neighbours4(cur.col, cur.row);
        for (let i = 0; i < nb.length; i++) {
          const n = nb[i];
          // Must be passable (walls / enemies block; allies are walk-through)
          if (!this.isPassable(n.col, n.row, { team, ignore })) continue;
          const stepCost = this.getCost(n.col, n.row);
          const newCost  = cost + stepCost;
          if (newCost > maxCost) continue;
          const nk = key(n.col, n.row);
          if (newCost < (dist.has(nk) ? dist.get(nk) : Infinity)) {
            dist.set(nk, newCost);
            parent.set(nk, { col: cur.col, row: cur.row });
            pq.push(n, newCost);
          }
        }
      }
      return out;
    }

    /**
     * A* path from {col,row} → {col,row}.
     * @returns {Array<{col,row}>|null} including both endpoints, or null if unreachable
     */
    findPath(from, to, opts = {}) {
      if (!this.inBounds(from.col, from.row) || !this.inBounds(to.col, to.row)) return null;
      const team   = opts.team   || null;
      const ignore = opts.ignore || null;
      const key    = (c, r) => r * this.cols + c;
      const heur   = (c, r) => Math.abs(c - to.col) + Math.abs(r - to.row);

      const gScore = new Map();
      const came   = new Map();
      gScore.set(key(from.col, from.row), 0);

      const pq = new _PQ();
      pq.push({ col: from.col, row: from.row }, heur(from.col, from.row));

      while (pq.size) {
        const cur = pq.pop();
        if (cur.col === to.col && cur.row === to.row) {
          // Reconstruct
          const path = [{ col: cur.col, row: cur.row }];
          let k = key(cur.col, cur.row);
          while (came.has(k)) {
            const p = came.get(k);
            path.unshift(p);
            k = key(p.col, p.row);
          }
          return path;
        }
        const nb = this.neighbours4(cur.col, cur.row);
        for (let i = 0; i < nb.length; i++) {
          const n = nb[i];
          // Allow stepping into the goal even if it's occupied by an enemy
          // (caller decides what to do — used for "attack target" pathing).
          const isGoal = (n.col === to.col && n.row === to.row);
          if (!isGoal && !this.isPassable(n.col, n.row, { team, ignore })) continue;
          if (!isGoal && !this.inBounds(n.col, n.row)) continue;
          if (isGoal && this.isBlocked(n.col, n.row)) continue;

          const stepCost = this.getCost(n.col, n.row);
          const tentative = (gScore.get(key(cur.col, cur.row)) || 0) + stepCost;
          const nk = key(n.col, n.row);
          if (tentative < (gScore.has(nk) ? gScore.get(nk) : Infinity)) {
            came.set(nk, { col: cur.col, row: cur.row });
            gScore.set(nk, tentative);
            pq.push(n, tentative + heur(n.col, n.row));
          }
        }
      }
      return null;
    }

    /**
     * Cells within a chebyshev/manhattan range — used for attack reach.
     * @param {Object} origin    - { col, row }
     * @param {number} minRange
     * @param {number} maxRange
     * @param {string} [shape='diamond'] - 'diamond' (manhattan) | 'square' (chebyshev)
     */
    cellsInRing(origin, minRange, maxRange, shape) {
      shape = shape || 'diamond';
      const out = [];
      for (let r = origin.row - maxRange; r <= origin.row + maxRange; r++) {
        for (let c = origin.col - maxRange; c <= origin.col + maxRange; c++) {
          if (!this.inBounds(c, r)) continue;
          const dx = Math.abs(c - origin.col), dy = Math.abs(r - origin.row);
          const d  = (shape === 'square') ? Math.max(dx, dy) : (dx + dy);
          if (d >= minRange && d <= maxRange) out.push({ col: c, row: r, dist: d });
        }
      }
      return out;
    }

    /** Manhattan distance between two cells. */
    static manhattan(a, b) {
      return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
    }
  }

  // ─── GridSystem ─────────────────────────────────────────────────────────────

  class GridSystem {
    constructor() {
      this.name   = 'GridSystem';
      this._grids = [];
    }
    init() {}

    /** Create and register a grid. */
    create(cfg) {
      const g = new Grid(cfg);
      this._grids.push(g);
      return g;
    }

    /** Remove a grid. */
    remove(grid) {
      const i = this._grids.indexOf(grid);
      if (i >= 0) this._grids.splice(i, 1);
    }

    /** Remove all grids. */
    clear() { this._grids = []; }

    update() {}
    render() {} // games render their own grids; this system is purely logical
  }

  GF.Grid       = Grid;
  GF.GridSystem = GridSystem;

})(window.GF = window.GF || {});
