// GameFramework/framework/systems/EntityWorld.js
// The composition layer: GameObjects made of small reusable BEHAVIORS, owned by
// an EntityWorld that runs the update/draw/cull/sweep loop and resolves
// collisions declaratively. This is what keeps a scene tiny — the scene spawns
// prefabs and states overlap rules; all per-entity logic lives in behavior files.
//
//   // behaviors/FormationMove.js
//   GF.behavior('FormationMove', (cfg) => ({
//     update(dt, e, world) { e.x += world.dir * (cfg.speed || 60) * dt; }
//   }));
//
//   // prefabs/invader.js
//   GF.prefab('invader', { tags:['invader'], w:32, h:24, sprite:'invader',
//                          behaviors:['FormationMove', ['DropOnDeath', { chance:0.15 }]] });
//
//   // scenes/Main.js  (stays ~40 lines)
//   this.world = engine.getSystem('EntityWorld');
//   this.world.spawnGrid('invader', 8, 5, 40, 50, 56, 40);
//   this.world.onOverlap('bullet', 'invader', (b, i) => { b.destroy(); i.destroy(); this.score += 10; });
//   // update(dt): this.world.update(dt);   render(ctx): this.world.draw(ctx);

(function (GF) {
  'use strict';

  GF._behaviors = GF._behaviors || {};
  GF._prefabs   = GF._prefabs   || {};

  /** Register a named behavior factory. factory(cfg) -> behavior instance with
   *  optional hooks: onAdd(e,world), update(dt,e,world), draw(ctx,e,world),
   *  onRemove(e,world), onOverlap handled by world rules. */
  GF.behavior = function (name, factory) { GF._behaviors[name] = factory; return GF; };

  /** Register a named prefab (entity archetype). See spec fields in _instantiate. */
  GF.prefab = function (name, spec) { GF._prefabs[name] = spec; return GF; };

  // ── GameObject ──────────────────────────────────────────────────────────────
  class GameObject {
    constructor(spec) {
      spec = spec || {};
      this.name = spec.name || '';
      this.x = spec.x || 0; this.y = spec.y || 0;      // top-left (AABB), like PhysicsBody
      this.w = spec.w || 0; this.h = spec.h || 0;
      this.vx = spec.vx || 0; this.vy = spec.vy || 0;
      this.flipX = false;
      this.static = !!spec.static;                     // skip velocity integration
      this.collideWorld = !!spec.collideWorld;         // resolve vs world solid tiles
      this.alive = true;
      this.tags = new Set(spec.tags || []);
      this.data = Object.assign({}, spec.data);        // free per-entity state
      this.sprite = spec.sprite || null;
      this.anim = spec.anim || 'idle';
      this._behaviors = [];
      this._anim = null;                               // SpriteAnimator (set by world)
      this._world = null;
    }
    get right()   { return this.x + this.w; }
    get bottom()  { return this.y + this.h; }
    get centerX() { return this.x + this.w / 2; }
    get centerY() { return this.y + this.h / 2; }
    has(tag)      { return this.tags.has(tag); }
    addTag(t)     { this.tags.add(t); return this; }
    removeTag(t)  { this.tags.delete(t); return this; }
    /** Attach a behavior instance (or a registered behavior by name/[name,cfg]). */
    addBehavior(b, cfg) {
      const inst = (typeof b === 'string') ? GF.EntityWorld._make(b, cfg) : b;
      if (!inst) return this;
      this._behaviors.push(inst);
      if (this._world && inst.onAdd) inst.onAdd(this, this._world);
      return this;
    }
    /** Find an attached behavior by its registered name. */
    behavior(name) { return this._behaviors.find(b => b._name === name) || null; }
    /** Play an animation on this object's animator (if it has a sprite). */
    play(anim, force) { if (this._anim) this._anim.play(anim, force); return this; }
    overlaps(o) {
      return this.x < o.x + o.w && this.right > o.x &&
             this.y < o.y + o.h && this.bottom > o.y;
    }
    destroy() { this.alive = false; return this; }
  }

  // ── EntityWorld ─────────────────────────────────────────────────────────────
  class EntityWorld {
    constructor(opts) {
      opts = opts || {};
      this.name = 'EntityWorld';
      this._objs = [];
      this._rules = [];          // { a, b, cb }
      this._prefabs = {};        // local overrides
      this._tick = null;         // optional world.onTick
      this.camera = opts.camera || null;
      this.sprites = opts.sprites || null;
      this._solid = opts.solidFn || null;   // (x,y) -> boolean
      this.data = {};            // shared world state (e.g. world.dir)
    }

    init(engine) {
      this.engine = engine;
      if (!this.sprites && engine.getSystem) this.sprites = engine.getSystem('SpriteSystem');
    }
    render() {} // draw() is called by the scene so it controls layering vs. HUD/tiles.

    setCamera(cam)     { this.camera = cam; return this; }
    setSolid(fn)       { this._solid = fn; return this; }
    onTick(fn)         { this._tick = fn; return this; }
    definePrefab(name, spec) { this._prefabs[name] = spec; return this; }
    _resolvePrefab(name) { return this._prefabs[name] || GF._prefabs[name] || null; }

    /** Instantiate a prefab-name or inline spec into a GameObject and add it. */
    spawn(nameOrSpec, x, y, overrides) {
      let spec;
      if (typeof nameOrSpec === 'string') {
        const pf = this._resolvePrefab(nameOrSpec);
        if (!pf) { console.warn('EntityWorld: no prefab "' + nameOrSpec + '"'); return null; }
        spec = Object.assign({ name: nameOrSpec }, pf);
      } else {
        spec = Object.assign({}, nameOrSpec);
      }
      if (x != null) spec.x = x;
      if (y != null) spec.y = y;
      if (overrides) spec = Object.assign(spec, overrides);

      const obj = new GameObject(spec);
      obj._world = this;
      // sprite animator
      if (obj.sprite && this.sprites && this.sprites.getSprite(obj.sprite)) {
        obj._anim = this.sprites.createAnimator(obj.sprite, obj.anim);
      }
      // behaviors (string | [name,cfg] | instance)
      const list = spec.behaviors || [];
      for (let i = 0; i < list.length; i++) {
        const b = list[i];
        if (Array.isArray(b)) obj.addBehavior(b[0], b[1]);
        else obj.addBehavior(b);
      }
      if (typeof spec.setup === 'function') spec.setup(obj, this);
      this._objs.push(obj);
      // fire onAdd for behaviors attached before _world existed
      for (const bh of obj._behaviors) if (bh.onAdd && !bh._added) { bh._added = true; bh.onAdd(obj, this); }
      return obj;
    }

    /** Spawn a cols×rows grid of a prefab. Optional perCell(obj,c,r) to tweak. */
    spawnGrid(name, cols, rows, x0, y0, dx, dy, perCell) {
      const out = [];
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const o = this.spawn(name, x0 + c * dx, y0 + r * dy);
          if (o && perCell) perCell(o, c, r);
          if (o) out.push(o);
        }
      return out;
    }

    destroy(obj) { if (obj) obj.alive = false; return this; }
    all()          { return this._objs; }
    byTag(tag)     { return this._objs.filter(o => o.alive && o.tags.has(tag)); }
    first(tag)     { return this._objs.find(o => o.alive && o.tags.has(tag)) || null; }
    count(tag)     { return this.byTag(tag).length; }
    clear()        { this._objs.forEach(o => this._removeNow(o)); this._objs = []; return this; }

    /** Declarative collision: run cb(a,b) for every overlapping pair (tagA,tagB). */
    onOverlap(tagA, tagB, cb) { this._rules.push({ a: tagA, b: tagB, cb }); return this; }

    isSolid(x, y) { return this._solid ? !!this._solid(x, y) : false; }

    // ── loop ──────────────────────────────────────────────────────────────────
    update(dt) {
      const objs = this._objs;
      // 1. behaviors
      for (let i = 0; i < objs.length; i++) {
        const o = objs[i]; if (!o.alive) continue;
        for (let b = 0; b < o._behaviors.length; b++) {
          const bh = o._behaviors[b];
          if (bh.update) bh.update(dt, o, this);
        }
      }
      // 2. integrate velocity (+ optional world-solid resolution)
      for (let i = 0; i < objs.length; i++) {
        const o = objs[i]; if (!o.alive || o.static) continue;
        if (o.collideWorld && this._solid) this._moveResolved(o, dt);
        else { o.x += o.vx * dt; o.y += o.vy * dt; }
        if (o._anim) o._anim.update(dt);
      }
      // 3. collision rules
      for (let r = 0; r < this._rules.length; r++) {
        const rule = this._rules[r];
        const A = this.byTag(rule.a), B = this.byTag(rule.b);
        for (let i = 0; i < A.length; i++) {
          const a = A[i]; if (!a.alive) continue;
          for (let j = 0; j < B.length; j++) {
            const b = B[j];
            if (a === b || !b.alive || !a.alive) continue;
            if (a.overlaps(b)) rule.cb(a, b, this);
          }
        }
      }
      // 4. world tick
      if (this._tick) this._tick(dt, this);
      // 5. sweep dead
      let write = 0;
      for (let i = 0; i < objs.length; i++) {
        const o = objs[i];
        if (o.alive) objs[write++] = o;
        else this._removeNow(o);
      }
      objs.length = write;
    }

    _removeNow(o) {
      for (let b = 0; b < o._behaviors.length; b++) {
        const bh = o._behaviors[b];
        if (bh.onRemove) bh.onRemove(o, this);
      }
    }

    // Axis-separated resolution against the world solid function (top-down walls).
    _moveResolved(o, dt) {
      const solidBox = (x, y) => this._solid(x, y) || this._solid(x + o.w - 1, y) ||
                                 this._solid(x, y + o.h - 1) || this._solid(x + o.w - 1, y + o.h - 1);
      const nx = o.x + o.vx * dt;
      if (!solidBox(nx, o.y)) o.x = nx; else o.vx = 0;
      const ny = o.y + o.vy * dt;
      if (!solidBox(o.x, ny)) o.y = ny; else o.vy = 0;
    }

    // ── draw ───────────────────────────────────────────────────────────────────
    /** Draw all live objects, y-sorted by feet (bottom) and camera-culled. A
     *  behavior with a draw() hook overrides the default sprite/box rendering. */
    draw(ctx, camera) {
      camera = camera || this.camera;
      const list = [];
      for (let i = 0; i < this._objs.length; i++) {
        const o = this._objs[i]; if (!o.alive) continue;
        if (camera && !camera.isVisible(o.x - 4, o.y - 4, o.w + 8, o.h + 8)) continue;
        list.push(o);
      }
      list.sort((a, b) => a.bottom - b.bottom);
      for (let i = 0; i < list.length; i++) {
        const o = list[i];
        let drawn = false;
        for (let b = 0; b < o._behaviors.length; b++) {
          const bh = o._behaviors[b];
          if (bh.draw) { bh.draw(ctx, o, this); drawn = true; }
        }
        if (drawn) continue;
        if (o._anim) { o._anim.flipX = o.flipX; o._anim.draw(ctx, o.centerX, o.bottom); }
        else if (o.sprite && this.sprites) {
          this.sprites.drawFrame(ctx, o.sprite, o.anim, 0, o.centerX, o.bottom, o.flipX);
        } else {
          ctx.fillStyle = o.data.color || '#e33';
          ctx.fillRect(o.x, o.y, o.w || 8, o.h || 8);
        }
      }
    }
  }

  // Internal: instantiate a registered behavior by name (+ optional cfg).
  EntityWorld._make = function (name, cfg) {
    const factory = GF._behaviors[name];
    if (!factory) { console.warn('EntityWorld: no behavior "' + name + '"'); return null; }
    const inst = factory(cfg || {}) || {};
    inst._name = name;
    return inst;
  };

  GF.GameObject  = GameObject;
  GF.EntityWorld = EntityWorld;

})(window.GF = window.GF || {});
