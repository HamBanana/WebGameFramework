// GameFramework/framework/systems/TilemapSystem.js
// Renders a 2D grid of tile indices from a registered tileset image.
//
// Quick start:
//   const tm = game.tilemap.create({
//     tileset:     'tiles',          // AssetLoader key for the tileset PNG
//     tilesetCols: 8,                // how many columns the tileset image has
//     tileWidth:   32,
//     tileHeight:  32,
//     solidTiles:  [0, 1, 2],        // tile indices that block physics bodies
//     grid: [                        // row-major; -1 = transparent/empty
//       [ 0,  0,  0,  0 ],
//       [-1, -1, -1,  1 ],
//       [ 2,  2,  2,  2 ],
//     ],
//   });
//
//   // In your render callback (inside camera.begin / camera.end):
//   tm.draw(ctx, camera);
//
//   // After physics integration, resolve tilemap collisions:
//   tm.resolveCollision(playerBody);

(function (GF) {
  'use strict';

  // ── Tilemap ─────────────────────────────────────────────────────────────────

  class Tilemap {
    /**
     * @param {Object}     cfg
     * @param {string}     cfg.tileset      - AssetLoader image key
     * @param {number}     cfg.tilesetCols  - columns in the tileset image
     * @param {number}     cfg.tileWidth    - pixel width of one tile
     * @param {number}     cfg.tileHeight   - pixel height of one tile
     * @param {number[][]} cfg.grid         - [row][col] tile indices; -1 = empty
     * @param {number[]|Set<number>} [cfg.solidTiles] - indices treated as solid
     * @param {number}     [cfg.x=0]        - world X of the tilemap's top-left corner
     * @param {number}     [cfg.y=0]        - world Y of the tilemap's top-left corner
     */
    constructor(cfg = {}) {
      this.tilesetKey  = cfg.tileset     || '';
      this.tilesetCols = cfg.tilesetCols || 1;
      this.tileWidth   = cfg.tileWidth   || 32;
      this.tileHeight  = cfg.tileHeight  || 32;
      this.grid        = cfg.grid        || [];
      this.x           = cfg.x           || 0;
      this.y           = cfg.y           || 0;

      this._rows = this.grid.length;
      this._cols = this._rows > 0 ? this.grid[0].length : 0;
      this._img  = null; // resolved HTMLImageElement

      // Normalise solidTiles to a Set
      if (cfg.solidTiles) {
        this.solidTiles = (cfg.solidTiles instanceof Set)
          ? cfg.solidTiles
          : new Set(cfg.solidTiles);
      } else {
        this.solidTiles = null; // no collision
      }
    }

    // ── Dimensions ──────────────────────────────────────────────────────────

    /** Total pixel width of the tilemap. */
    get pixelWidth()  { return this._cols * this.tileWidth;  }
    /** Total pixel height of the tilemap. */
    get pixelHeight() { return this._rows * this.tileHeight; }

    // ── Asset resolution ────────────────────────────────────────────────────

    /** Called by TilemapSystem.update() once a loader is available. */
    _resolveImage(loader) {
      if (!this._img && loader) {
        this._img = loader.get(this.tilesetKey) || null;
      }
    }

    // ── Tile queries ────────────────────────────────────────────────────────

    /**
     * Return the tile index at grid column/row.  Returns -1 if out of bounds.
     * @param {number} col
     * @param {number} row
     */
    getTile(col, row) {
      if (row < 0 || row >= this._rows || col < 0 || col >= this._cols) return -1;
      return this.grid[row][col];
    }

    /**
     * Return the tile index at a world-space pixel position.
     * @param {number} worldX
     * @param {number} worldY
     */
    getTileAtWorld(worldX, worldY) {
      const col = Math.floor((worldX - this.x) / this.tileWidth);
      const row = Math.floor((worldY - this.y) / this.tileHeight);
      return this.getTile(col, row);
    }

    /**
     * Return true when the tile at (col, row) is in the solid set.
     * @param {number} col
     * @param {number} row
     */
    isSolid(col, row) {
      if (!this.solidTiles) return false;
      const t = this.getTile(col, row);
      return t >= 0 && this.solidTiles.has(t);
    }

    /**
     * Return true when the world-space point (wx, wy) falls on a solid tile.
     * @param {number} worldX
     * @param {number} worldY
     */
    isSolidAt(worldX, worldY) {
      const col = Math.floor((worldX - this.x) / this.tileWidth);
      const row = Math.floor((worldY - this.y) / this.tileHeight);
      return this.isSolid(col, row);
    }

    // ── Collision ───────────────────────────────────────────────────────────

    /**
     * Resolve solid-tile AABB collisions for a GF.PhysicsBody.
     * Call each frame **after** PhysicsSystem.update() has integrated the body.
     * The method tests all four corners of the body and pushes it out of any
     * overlapping solid tile along the axis of least penetration.
     *
     * @param {GF.PhysicsBody} body
     */
    resolveCollision(body) {
      if (!this.solidTiles) return;

      const tw = this.tileWidth;
      const th = this.tileHeight;

      // We test the four corners; iterate a small grid of tiles the body can overlap
      const c0 = Math.floor((body.x          - this.x) / tw);
      const c1 = Math.floor((body.right  - 1 - this.x) / tw);
      const r0 = Math.floor((body.y          - this.y) / th);
      const r1 = Math.floor((body.bottom - 1 - this.y) / th);

      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          if (!this.isSolid(c, r)) continue;

          const tileLeft   = this.x + c * tw;
          const tileTop    = this.y + r * th;
          const tileRight  = tileLeft + tw;
          const tileBottom = tileTop  + th;

          // Skip if not actually overlapping
          if (body.right  <= tileLeft   || body.x      >= tileRight  ||
              body.bottom <= tileTop    || body.y      >= tileBottom) continue;

          // Penetration depths on all four sides
          const overlapL = body.right  - tileLeft;   // push left
          const overlapR = tileRight   - body.x;     // push right
          const overlapT = body.bottom - tileTop;    // push up
          const overlapB = tileBottom  - body.y;     // push down

          const minH = Math.min(overlapL, overlapR);
          const minV = Math.min(overlapT, overlapB);

          if (minH < minV) {
            // Horizontal resolution
            if (overlapL < overlapR) {
              body.x  -= overlapL;
              body.vx  = Math.min(body.vx, 0);
            } else {
              body.x  += overlapR;
              body.vx  = Math.max(body.vx, 0);
            }
          } else {
            // Vertical resolution
            if (overlapT < overlapB) {
              // Landed on top of tile
              body.y        -= overlapT;
              body.vy        = Math.min(body.vy, 0);
              body.grounded  = true;
              body.vx       *= body.friction;
              if (Math.abs(body.vx) < 2) body.vx = 0;
            } else {
              // Hit underside of tile
              body.y  += overlapB;
              body.vy  = Math.max(body.vy, 0);
            }
          }
        }
      }
    }

    // ── Rendering ───────────────────────────────────────────────────────────

    /**
     * Draw the tilemap onto ctx.
     * Call this between camera.begin(ctx) and camera.end(ctx) for correct
     * world-space positioning.  When camera is provided, off-screen tiles are
     * automatically skipped.
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {GF.Camera} [camera] - pass to enable frustum culling
     */
    draw(ctx, camera) {
      if (!this._img) return;

      const tw = this.tileWidth;
      const th = this.tileHeight;

      // Compute visible tile range for culling
      let colStart = 0, colEnd = this._cols;
      let rowStart = 0, rowEnd = this._rows;

      if (camera) {
        colStart = Math.max(0,           Math.floor((camera.x - this.x)                          / tw) - 1);
        rowStart = Math.max(0,           Math.floor((camera.y - this.y)                          / th) - 1);
        colEnd   = Math.min(this._cols,  Math.ceil( (camera.x + camera.width  - this.x)          / tw) + 1);
        rowEnd   = Math.min(this._rows,  Math.ceil( (camera.y + camera.height - this.y)          / th) + 1);
      }

      for (let row = rowStart; row < rowEnd; row++) {
        for (let col = colStart; col < colEnd; col++) {
          const tileIdx = this.grid[row][col];
          if (tileIdx < 0) continue;

          const srcCol = tileIdx % this.tilesetCols;
          const srcRow = Math.floor(tileIdx / this.tilesetCols);

          ctx.drawImage(
            this._img,
            srcCol * tw, srcRow * th, tw, th,       // source rect
            this.x + col * tw, this.y + row * th, tw, th  // dest rect
          );
        }
      }
    }
  }

  // ── TilemapSystem ───────────────────────────────────────────────────────────

  class TilemapSystem {
    constructor() {
      this.name      = 'TilemapSystem';
      this._tilemaps = [];
      this._loader   = null;
    }

    /** Called automatically by Engine.addSystem(). */
    init(engine) {
      if (engine && engine.loader) this._loader = engine.loader;
    }

    /**
     * Attach an AssetLoader so tilemaps can resolve tileset images.
     * createGameAsync() calls this automatically.
     * @param {GF.AssetLoader} loader
     */
    attachLoader(loader) {
      this._loader = loader;
      return this;
    }

    /**
     * Create and register a new Tilemap.
     * @param {Object} cfg - same as Tilemap constructor
     * @returns {Tilemap}
     */
    create(cfg) {
      const tm = new Tilemap(cfg);
      this._tilemaps.push(tm);
      return tm;
    }

    /** Remove a previously created tilemap. */
    remove(tilemap) {
      const i = this._tilemaps.indexOf(tilemap);
      if (i >= 0) this._tilemaps.splice(i, 1);
    }

    /** Remove all tilemaps. */
    clear() { this._tilemaps = []; }

    update() {
      // Lazily resolve image handles each frame until all are loaded
      if (this._loader) {
        this._tilemaps.forEach(tm => tm._resolveImage(this._loader));
      }
    }

    // Games control layer ordering, so TilemapSystem has no autonomous render().
    // Instead call tilemap.draw(ctx, camera) directly inside your render callback.
    render() {}
  }

  GF.Tilemap       = Tilemap;
  GF.TilemapSystem = TilemapSystem;

})(window.GF = window.GF || {});
