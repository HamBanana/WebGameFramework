// games/Acca2/managers/BoardLoader.js
// Builds the runtime cell graph from GF.mapData. Responsibilities:
//   1. Map raw cell records → game Cells with the right sprite + game type.
//   2. Walk the connections list and populate each cell's _neighbors array
//      (and store the connections list for the road renderer).
//   3. Greedy cardinal-slot assignment: for every Cell, pick which neighbour
//      sits in each of the four arrow-key slots (up/down/left/right).
//   4. Compute board bounds and the camera "zoomed-out" scale for that map.
//
// Pure construction — no game-state mutation outside the AccaGame instance
// passed in.

(function (GF) {
  'use strict';
  const A = GF.Acca = GF.Acca || {};

  const SPRITE_FOR = {
    bank        : 'cell_start',
    chance      : 'cell_chance',
    market      : 'cell_market',
    property    : 'cell_property',
    power_plant : 'cell_power_plant',
    well        : 'cell_well',
  };

  const GAMETYPE_FOR = {
    bank        : 'bank',
    chance      : 'chance',
    market      : 'market',
    property    : 'buildable',
    power_plant : 'power_plant',
    well        : 'well',
  };

  const cardinalAngles = { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 };
  const angularDev = (a, b) => Math.abs(((a - b + Math.PI) % (2 * Math.PI)) - Math.PI);

  class BoardLoader {
    /** @param {AccaGame} game */
    constructor(game) {
      this.game = game;
    }

    load() {
      const game = this.game;
      const { cellSize, originX, originY } = game.cfg.board;
      const { cells, connections } = GF.mapData;

      game.cells = [];
      const cellById = new Map();

      cells.forEach(c => {
        const { sprite, gameType } = this._resolveSprite(c);
        const cell = new A.Cell(c.id, c.x, c.y, gameType, c.district, sprite, c.subType);
        cell.animator = game.sprites.createAnimator(sprite, 'idle');
        // Pre-placed neutral structure cells: stash the structureType on the
        // cell so TurnManager can label it on landing without consulting
        // GF.mapData. cell.structure remains null (these are not owned by
        // any player and don't participate in build/sell flows).
        if (gameType === 'structure' && c.structureType) {
          cell.structureType = c.structureType;
        }
        game.cells.push(cell);
        cellById.set(c.id, cell);
      });

      // Preserve connections (with resolved Cell refs) for road rendering.
      game._connections = [];
      connections.forEach(conn => {
        const fromCell = cellById.get(conn.from);
        const toCell   = cellById.get(conn.to);
        if (!fromCell || !toCell) return;

        if (conn.direction === 'both') {
          if (!fromCell._neighbors.includes(toCell)) fromCell._neighbors.push(toCell);
          if (!toCell._neighbors.includes(fromCell)) toCell._neighbors.push(fromCell);
        } else if (conn.direction === 'forward') {
          if (!fromCell._neighbors.includes(toCell)) fromCell._neighbors.push(toCell);
        }

        game._connections.push({ from: fromCell, to: toCell, direction: conn.direction });
      });

      // Greedy cardinal-slot assignment: for every neighbour, compute its
      // angular deviation from each cardinal axis, sort the four axes
      // best-fit-first, sort neighbours by best-fit deviation (most-cardinal
      // first), and walk the list assigning each to its first available slot.
      // Guarantees every neighbour gets a slot when one is free, so a 5-way
      // junction is reachable with arrow keys.
      game.cells.forEach(cell => {
        cell.up = cell.down = cell.left = cell.right = null;
        if (!cell._neighbors || cell._neighbors.length === 0) return;
        const ranked = cell._neighbors.map(neighbor => {
          const dx = neighbor.x - cell.x;
          const dy = neighbor.y - cell.y;
          const angle = Math.atan2(dy, dx);
          const fits = Object.keys(cardinalAngles).map(dir => ({
            dir,
            dev: angularDev(angle, cardinalAngles[dir]),
          })).sort((a, b) => a.dev - b.dev);
          return { neighbor, fits, bestDev: fits[0].dev };
        }).sort((a, b) => a.bestDev - b.bestDev);

        ranked.forEach(r => {
          for (const f of r.fits) {
            if (cell[f.dir] === null) {
              cell[f.dir] = r.neighbor;
              break;
            }
          }
        });
      });

      game._toPixel  = (cell) => ({ x: originX + cell.x, y: originY + cell.y });
      game._cellSize = cellSize;

      this._computeBounds();
    }

    _resolveSprite(c) {
      // Common cases — direct table lookup.
      if (SPRITE_FOR[c.type]) {
        return { sprite: SPRITE_FOR[c.type], gameType: GAMETYPE_FOR[c.type] };
      }

      // Mines have a sub-typed sprite when possible (cell_mine_coal/_iron/_oil)
      // and fall back to the generic cell_mine.
      if (c.type === 'mine') {
        const sub = c.subType;
        const subSprite = sub ? `cell_mine_${sub}` : null;
        const sprite = (subSprite && GF.sprites && GF.sprites[subSprite])
          ? subSprite
          : 'cell_mine';
        return { sprite, gameType: 'mine' };
      }

      // Pre-placed structure cells (rare; map-defined shops etc.).
      if (c.type === 'structure') {
        const st = c.structureType;
        const stSprite = st ? `cell_${st}` : null;
        const sprite = (stSprite && GF.sprites && GF.sprites[stSprite])
          ? stSprite
          : 'cell_property';
        return { sprite, gameType: 'structure' };
      }

      // Empty / default — districted empty cells become buildable; the rest
      // are flat ground.
      if (c.district !== null && c.district !== undefined) {
        return { sprite: 'cell_property', gameType: 'buildable' };
      }
      return { sprite: 'cell_normal', gameType: 'empty' };
    }

    _computeBounds() {
      const game = this.game;
      if (game.cells.length === 0) return;
      const size = game._cellSize;
      let minX = game.cells[0].x, maxX = game.cells[0].x;
      let minY = game.cells[0].y, maxY = game.cells[0].y;
      game.cells.forEach(c => {
        if (c.x < minX) minX = c.x;
        if (c.x > maxX) maxX = c.x;
        if (c.y < minY) minY = c.y;
        if (c.y > maxY) maxY = c.y;
      });
      const ox = game.cfg.board.originX;
      const oy = game.cfg.board.originY;
      game._boardBounds = {
        minX: ox + minX - size / 2, maxX: ox + maxX + size / 2,
        minY: oy + minY - size / 2, maxY: oy + maxY + size / 2,
      };
      const W = game.cfg.engine.width, H = game.cfg.engine.height;
      const pad = game.cfg.camera.zoomOutPadding;
      const bw = game._boardBounds.maxX - game._boardBounds.minX + pad * 2;
      const bh = game._boardBounds.maxY - game._boardBounds.minY + pad * 2;
      game._camera.zoomedOutScale = Math.min(W / bw, H / bh);
      game._camera.boardCenter = {
        x: (game._boardBounds.minX + game._boardBounds.maxX) / 2,
        y: (game._boardBounds.minY + game._boardBounds.maxY) / 2,
      };
    }
  }

  A.BoardLoader = BoardLoader;

})(window.GF = window.GF || {});
