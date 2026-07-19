// GameFramework/framework/systems/WorldSystem.js
// Data-driven, multi-area open-world manager built on top of Camera + Tilemap.
//
// A "world" is a plain data object (ship it as a JS object, not fetched JSON, so
// it works in the headless harness). It has one or more named AREAS; each area is
// a set of tile LAYERS plus entities, spawn points, and portals to other areas.
//
//   const world = new GF.WorldSystem({ viewWidth: 800, viewHeight: 450 });
//   game.engine.addSystem(world);            // AFTER physics, so collision resolves last
//   world.setTileset('world/tiles.png', 8);  // tileset PNG + columns (optional)
//   world.setPlayer(playerBody, (ctx) => playerAnim.draw(ctx, playerBody.centerX, playerBody.bottom));
//   world.loadWorld(GAME_WORLD);             // the data object below
//   // in your scene.render:  world.draw(ctx);  then draw the HUD
//
// World data shape:
//   {
//     tileWidth: 32, tileHeight: 32,
//     tileset: { image: 'world/tiles.png', cols: 8 },   // optional (falls back to flat colors)
//     startArea: 'town', startSpawn: 'default',
//     areas: {
//       town: {
//         cols: 40, rows: 30,
//         layers: {
//           ground:    [[...]],   // required; row-major tile indices, -1 = empty
//           decor:     [[...]],   // optional; drawn above ground, below entities
//           collision: [[...]],   // optional; any cell >= 0 blocks the player
//           overhead:  [[...]],   // optional; drawn above entities (roofs, tree canopy)
//         },
//         entities: [ { type:'npc', sprite:'villager', anim:'idle', x:320, y:400, props:{} } ],
//         spawns:   { default: { x:320, y:400 } },
//         portals:  [ { x:1248, y:384, w:32, h:64, toArea:'forest', toSpawn:'fromTown' } ],
//         background: '#243',   // optional flat backdrop for the area
//       },
//       forest: { ... }
//     }
//   }

(function (GF) {
  'use strict';

  function deterministicTileColor(idx) {
    // Stable pseudo-color so worlds are visible before/without a tileset image.
    const h = (idx * 47) % 360;
    const l = 30 + (idx * 13) % 25;
    return 'hsl(' + h + ',42%,' + l + '%)';
  }

  class WorldSystem {
    constructor(opts) {
      opts = opts || {};
      this.name = 'WorldSystem';
      this._viewW = opts.viewWidth  || 800;
      this._viewH = opts.viewHeight || 450;
      this._lerp  = opts.lerp !== undefined ? opts.lerp : 0.12;

      this.camera = new GF.Camera({ width: this._viewW, height: this._viewH, lerp: this._lerp });

      this._data       = null;
      this._areas      = {};      // name -> prepared area (lazy)
      this._current    = null;    // prepared current area
      this._currentName = null;

      this._player     = null;    // GF.PhysicsBody
      this._playerDraw = null;    // (ctx) => void
      this._dynamic    = [];      // extra bodies to resolve against collision

      this._sprites    = null;    // GF.SpriteSystem (for entity animators)
      this._tilesetImg = null;    // { img, isLoaded() } or null
      this._tileCols   = 1;

      this._portalLock = false;   // true while player still overlaps the portal it arrived through

      this._cb = { enterArea: null, entityDraw: null, entityUpdate: null, portal: null };
    }

    // ── System interface ──────────────────────────────────────────────────────

    init(engine) {
      this._engine = engine;
      this._sprites = engine.getSystem ? engine.getSystem('SpriteSystem') : null;
    }

    render() {} // draw() is called by the game so it controls layering vs. the HUD.

    // ── Configuration ─────────────────────────────────────────────────────────

    /** Set the tileset image (URL or a loaded image / sheet wrapper) and column count. */
    setTileset(image, cols) {
      this._tileCols = cols || 1;
      if (!image) { this._tilesetImg = null; return this; }
      if (typeof image === 'string') {
        this._tilesetImg = GF.SpriteSystem ? GF.SpriteSystem._loadImage(image) : null;
      } else if (image.isLoaded) {
        this._tilesetImg = image;
      } else {
        const img = image;
        this._tilesetImg = { img, isLoaded: () => !!(img && (img.complete ? img.naturalWidth !== 0 : img.width)) };
      }
      return this;
    }

    /** Register the player body and how to draw it (drawn y-sorted among entities). */
    setPlayer(body, drawFn) {
      this._player = body;
      this._playerDraw = drawFn || null;
      return this;
    }

    /** Additional bodies that should collide with the collision layer. */
    addDynamicBody(body) { this._dynamic.push(body); return this; }
    removeDynamicBody(body) {
      const i = this._dynamic.indexOf(body);
      if (i >= 0) this._dynamic.splice(i, 1);
      return this;
    }

    onEnterArea(cb)    { this._cb.enterArea = cb;    return this; }
    onEntityDraw(cb)   { this._cb.entityDraw = cb;   return this; }
    onEntityUpdate(cb) { this._cb.entityUpdate = cb; return this; }
    onPortal(cb)       { this._cb.portal = cb;       return this; }

    // ── World loading ─────────────────────────────────────────────────────────

    /** Load a world data object and enter its start area. */
    loadWorld(data) {
      this._data  = data || {};
      this._areas = {};
      if (this._data.tileset) this.setTileset(this._data.tileset.image, this._data.tileset.cols);
      const start = this._data.startArea || Object.keys(this._data.areas || {})[0];
      if (start) this.enterArea(start, this._data.startSpawn);
      return this;
    }

    _tw() { return (this._data && this._data.tileWidth)  || 32; }
    _th() { return (this._data && this._data.tileHeight) || 32; }

    /** Build (once) the runtime structures for an area from its data. */
    _prepareArea(name) {
      if (this._areas[name]) return this._areas[name];
      const src = (this._data.areas || {})[name];
      if (!src) { console.warn('WorldSystem: no area named "' + name + '"'); return null; }

      const tw = this._tw(), th = this._th();
      const layers = src.layers || {};
      const cols = src.cols || (layers.ground && layers.ground[0] ? layers.ground[0].length : 0);
      const rows = src.rows || (layers.ground ? layers.ground.length : 0);

      // Collision Tilemap (reuses tested AABB resolution). Any cell >= 0 is solid.
      let collisionTM = null;
      const cgrid = layers.collision;
      if (cgrid && cgrid.length) {
        const solid = new Set();
        for (let r = 0; r < cgrid.length; r++)
          for (let c = 0; c < cgrid[r].length; c++)
            if (cgrid[r][c] >= 0) solid.add(cgrid[r][c]);
        collisionTM = new GF.Tilemap({
          tileWidth: tw, tileHeight: th, grid: cgrid,
          solidTiles: Array.from(solid), x: 0, y: 0,
        });
      }

      // Entity animators (lazy, only if a SpriteSystem is present).
      const entities = (src.entities || []).map(e => {
        const ent = Object.assign({}, e);
        if (this._sprites && ent.sprite && this._sprites.getSprite(ent.sprite)) {
          ent._animator = this._sprites.createAnimator(ent.sprite, ent.anim || 'idle');
        }
        return ent;
      });

      const prepared = {
        name, src, cols, rows, layers,
        pixelWidth: cols * tw, pixelHeight: rows * th,
        collisionTM, entities,
        spawns: src.spawns || {}, portals: src.portals || [],
        background: src.background || (this._data.background || '#1a1a2e'),
      };
      this._areas[name] = prepared;
      return prepared;
    }

    /** Switch to an area and place the player at a named spawn (if the player is set). */
    enterArea(name, spawnName) {
      const area = this._prepareArea(name);
      if (!area) return this;
      this._current = area;
      this._currentName = name;

      // Re-clamp the camera to this area's bounds.
      this.camera.worldWidth  = Math.max(area.pixelWidth,  this._viewW);
      this.camera.worldHeight = Math.max(area.pixelHeight, this._viewH);

      if (this._player) {
        const sp = area.spawns[spawnName] || area.spawns['default'] ||
                   { x: area.pixelWidth / 2, y: area.pixelHeight / 2 };
        // Spawns are given as feet-center; place the body's top-left accordingly.
        this._player.x = sp.x - (this._player.width  || 0) / 2;
        this._player.y = sp.y - (this._player.height || 0);
        this.camera.follow(this._player);
        this.camera.snapTo(this._player.x + (this._player.width || 0) / 2,
                           this._player.y + (this._player.height || 0) / 2);
      }
      // The player begins overlapping nothing new until they leave the arrival portal.
      this._portalLock = true;

      if (this._cb.enterArea) this._cb.enterArea(name, area);
      return this;
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    get areaName() { return this._currentName; }
    get area()     { return this._current; }
    entities()     { return this._current ? this._current.entities : []; }

    /** World-space solid test against the current area's collision layer. */
    isSolidAt(wx, wy) {
      return !!(this._current && this._current.collisionTM &&
                this._current.collisionTM.isSolidAt(wx, wy));
    }

    // ── Update ────────────────────────────────────────────────────────────────

    update(dt) {
      if (!this._current) return;

      // Resolve collisions (run after PhysicsSystem has integrated bodies).
      const cm = this._current.collisionTM;
      if (cm) {
        if (this._player) cm.resolveCollision(this._player);
        for (let i = 0; i < this._dynamic.length; i++) cm.resolveCollision(this._dynamic[i]);
      }

      // Entity animation + optional per-entity game update.
      const ents = this._current.entities;
      for (let i = 0; i < ents.length; i++) {
        const e = ents[i];
        if (this._cb.entityUpdate) this._cb.entityUpdate(e, dt, this);
        if (e._animator) e._animator.update(dt);
      }

      // Portals: check the player's feet point against portal rects.
      if (this._player) {
        const px = this._player.x + (this._player.width  || 0) / 2;
        const py = this._player.y + (this._player.height || 0);
        let inAny = false;
        const portals = this._current.portals;
        for (let i = 0; i < portals.length; i++) {
          const p = portals[i];
          if (px >= p.x && px < p.x + (p.w || this._tw()) &&
              py >= p.y && py < p.y + (p.h || this._th())) {
            inAny = true;
            if (!this._portalLock) {
              if (this._cb.portal) this._cb.portal(p, this);
              this.enterArea(p.toArea, p.toSpawn);
              return; // area changed; stop processing this frame
            }
          }
        }
        // Release the lock once the player has stepped off the arrival portal.
        if (!inAny) this._portalLock = false;
      }

      this.camera.update(dt);
    }

    // ── Rendering ─────────────────────────────────────────────────────────────

    /** Draw one tile layer with frustum culling and a flat-color fallback. */
    _drawLayer(ctx, grid) {
      if (!grid || !grid.length) return;
      const tw = this._tw(), th = this._th();
      const cam = this.camera;
      const img = this._tilesetImg && this._tilesetImg.isLoaded() ? this._tilesetImg.img : null;

      const colStart = Math.max(0, Math.floor(cam.x / tw) - 1);
      const rowStart = Math.max(0, Math.floor(cam.y / th) - 1);
      const colEnd   = Math.ceil((cam.x + cam.width)  / tw) + 1;
      const rowEnd   = Math.ceil((cam.y + cam.height) / th) + 1;

      for (let row = rowStart; row < rowEnd && row < grid.length; row++) {
        const line = grid[row];
        if (!line) continue;
        for (let col = colStart; col < colEnd && col < line.length; col++) {
          const idx = line[col];
          if (idx < 0) continue;
          const dx = col * tw, dy = row * th;
          if (img) {
            const sc = idx % this._tileCols;
            const sr = Math.floor(idx / this._tileCols);
            ctx.drawImage(img, sc * tw, sr * th, tw, th, dx, dy, tw, th);
          } else {
            ctx.fillStyle = deterministicTileColor(idx);
            ctx.fillRect(dx, dy, tw, th);
          }
        }
      }
    }

    /** Draw the entire current area: layers, y-sorted entities + player, overhead. */
    draw(ctx) {
      if (!this._current) return;
      const area = this._current;
      const cam = this.camera;

      // Flat area backdrop (screen space) so gaps aren't transparent.
      ctx.fillStyle = area.background;
      ctx.fillRect(0, 0, cam.width, cam.height);

      cam.begin(ctx);

      this._drawLayer(ctx, area.layers.ground);
      this._drawLayer(ctx, area.layers.decor);

      // Collect drawables (entities + player), cull, y-sort by feet, then draw.
      const drawables = [];
      const ents = area.entities;
      for (let i = 0; i < ents.length; i++) {
        const e = ents[i];
        const w = e.w || (this._sprites && this._sprites.getSprite(e.sprite) ? this._sprites.getSprite(e.sprite).frameWidth : 24) || 24;
        const h = e.h || (this._sprites && this._sprites.getSprite(e.sprite) ? this._sprites.getSprite(e.sprite).frameHeight : 24) || 24;
        if (!cam.isVisible(e.x - w, e.y - h, w * 2, h * 2)) continue;
        drawables.push({ feet: e.y, kind: 'entity', e });
      }
      if (this._player) {
        drawables.push({ feet: this._player.y + (this._player.height || 0), kind: 'player' });
      }
      drawables.sort((a, b) => a.feet - b.feet);

      for (let i = 0; i < drawables.length; i++) {
        const d = drawables[i];
        if (d.kind === 'player') {
          if (this._playerDraw) this._playerDraw(ctx);
        } else {
          const e = d.e;
          if (this._cb.entityDraw) {
            this._cb.entityDraw(ctx, e, this);
          } else if (e._animator) {
            e._animator.flipX = !!e.flipX;
            e._animator.draw(ctx, e.x, e.y);
          } else {
            // No sprite: a simple marker so placed entities are visible.
            ctx.fillStyle = e.color || '#e33';
            ctx.fillRect(e.x - 8, e.y - 16, 16, 16);
          }
        }
      }

      this._drawLayer(ctx, area.layers.overhead);

      cam.end(ctx);
    }
  }

  GF.WorldSystem = WorldSystem;

})(window.GF = window.GF || {});
