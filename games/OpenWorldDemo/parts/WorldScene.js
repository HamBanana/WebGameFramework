// parts/WorldScene.js — open-world driving demo.
// Walk a top-down character around a town, press E near a car to get in, drive it
// (smooth 360° steering), press E to get out. A gate leads to an isometric
// "showroom" where the isometric_vehicles are drivable with 8-direction frames.
(function (G, GF) {
  'use strict';

  const TAU = Math.PI * 2;
  const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };

  // per-sprite draw scale for the top-down cars
  function carScale(sprite) {
    if (sprite.indexOf('pcar') === 0) return 0.8;
    if (sprite.indexOf('moto') === 0) return 0.55;
    if (sprite === 'car_green_small') return 0.6;
    return 0.5;
  }
  // isometric heading -> column (0..7). Frame 0 faces south (+y), +45° clockwise.
  const ISO_OFFSET = 0;
  function isoCol(angle) {
    let i = Math.round((angle - Math.PI / 2) / (Math.PI / 4));
    return (((i + ISO_OFFSET) % 8) + 8) % 8;
  }

  G.scenes.World = class World extends GF.Scene {
    init(engine) {
      this.engine = engine;
      this.game = G.game;

      const phys = engine.getSystem('PhysicsSystem');
      if (phys) { phys.gravity = 0; phys.floorY = 1e9; phys.leftWall = -1e9; phys.rightWall = 1e9; }

      engine.input
        .bind('up', 'ArrowUp', 'KeyW').bind('down', 'ArrowDown', 'KeyS')
        .bind('left', 'ArrowLeft', 'KeyA').bind('right', 'ArrowRight', 'KeyD')
        .bind('action', 'KeyE', 'Enter');

      this.player = new GF.PhysicsBody({ x: 0, y: 0, width: 26, height: 26,
        gravityScale: 0, maxSpeedX: 900, maxSpeedY: 900, friction: 0.0001, tag: 'player' });
      if (phys) phys.addBody(this.player);

      this.mode = 'foot';        // 'foot' | 'car'
      this.vehicle = null;       // entity being driven
      this.facing = Math.PI / 2; // foot facing (down)
      this.heading = 0;          // car heading
      this.carSpeed = 0;         // signed scalar (top-down driving)
      this.isoCol = 0;
      this._ePrev = false;
      this.prompt = '';

      this.world = new GF.WorldSystem({ viewWidth: engine.config.width, viewHeight: engine.config.height });
      engine.addSystem(this.world);
      this.world.setPlayer(this.player, (ctx) => this._drawPlayer(ctx));
      this.world.onEntityDraw((ctx, e) => this._drawEntity(ctx, e));
      this.world.onEntityUpdate((e, dt) => this._updateEntity(e, dt));
      this.world.onPortal(() => { if (this.mode === 'car') this._exitVehicle(true); });
      this.world.onEnterArea(() => { this.mode = 'foot'; this.vehicle = null; this.carSpeed = 0; });

      this.world.loadWorld(G.state.world || { areas: {} });
    }

    // ── input helpers ─────────────────────────────────────────────────────────
    _axis(inp) {
      let vx = 0, vy = 0;
      if (inp.isDown('left'))  vx -= 1;
      if (inp.isDown('right')) vx += 1;
      if (inp.isDown('up'))    vy -= 1;
      if (inp.isDown('down'))  vy += 1;
      return { vx, vy };
    }

    // ── enter / exit ──────────────────────────────────────────────────────────
    _feet() { return { x: this.player.x + this.player.width / 2, y: this.player.y + this.player.height }; }

    _tryEnter() {
      const f = this._feet();
      const ents = this.world.entities();
      let best = null, bestD = 80 * 80;
      for (const e of ents) {
        if (!e.drivable) continue;
        const d = dist2(f.x, f.y, e.x, e.y);
        if (d < bestD) { bestD = d; best = e; }
      }
      if (!best) return;
      const i = ents.indexOf(best);
      if (i >= 0) ents.splice(i, 1);
      this.vehicle = best;
      this.mode = 'car';
      this.heading = best.heading || 0;
      this.carSpeed = 0;
      this.isoCol = best.col || 0;
      // place body centred on the car
      this.player.x = best.x - this.player.width / 2;
      this.player.y = best.y - this.player.height / 2;
      this.player.vx = this.player.vy = 0;
    }

    _exitVehicle(intoArea) {
      const v = this.vehicle;
      if (!v) { this.mode = 'foot'; return; }
      const c = { x: this.player.x + this.player.width / 2, y: this.player.y + this.player.height / 2 };
      v.x = c.x; v.y = c.y; v.heading = this.heading;
      if (v.type === 'isocar') v.col = this.isoCol;
      if (intoArea) this.world.entities().push(v);
      // step the character out to the side of the vehicle
      const ox = Math.cos(this.heading + Math.PI / 2) * 46;
      const oy = Math.sin(this.heading + Math.PI / 2) * 46;
      this.player.x = c.x + ox - this.player.width / 2;
      this.player.y = c.y + oy - this.player.height / 2;
      this.player.vx = this.player.vy = 0;
      this.vehicle = null;
      this.mode = 'foot';
      this.facing = this.heading;
    }

    // ── update ────────────────────────────────────────────────────────────────
    update(dt, engine) {
      const inp = engine.input;
      const eDown = inp.isDown('action');
      const ePress = eDown && !this._ePrev;
      this._ePrev = eDown;

      if (this.mode === 'foot') {
        this._updateFoot(inp, dt);
        if (ePress) this._tryEnter();
      } else if (this.vehicle && this.vehicle.type === 'isocar') {
        this._updateIsoCar(inp, dt);
        if (ePress) this._exitVehicle(true);
      } else {
        this._updateTopCar(inp, dt);
        if (ePress) this._exitVehicle(true);
      }
      this._resolveCarCollisions();
    }

    _updateFoot(inp, dt) {
      // tank controls: W/S forward-back along facing, A/D rotate (same as driving)
      let fwd = 0, turn = 0;
      if (inp.isDown('up'))    fwd  += 1;
      if (inp.isDown('down'))  fwd  -= 1;
      if (inp.isDown('left'))  turn -= 1;
      if (inp.isDown('right')) turn += 1;
      this.facing += turn * 3.0 * dt;
      this.facing = ((this.facing % TAU) + TAU) % TAU;
      const spd = 165;
      this.player.vx = Math.cos(this.facing) * fwd * spd;
      this.player.vy = Math.sin(this.facing) * fwd * spd;

      // proximity prompt
      const f = this._feet();
      let near = false;
      for (const e of this.world.entities()) {
        if (e.drivable && dist2(f.x, f.y, e.x, e.y) < 80 * 80) { near = true; break; }
      }
      this.prompt = near ? 'E — get in' : '';
    }

    // Push the controlled body out of parked-vehicle circles (soft collision).
    // Runs at the end of update(), i.e. after physics + tile collision this frame.
    _resolveCarCollisions() {
      const p = this.player;
      const cx = p.x + p.width / 2, cy = p.y + p.height / 2;
      const R = 28;
      for (const e of this.world.entities()) {
        if (e.type !== 'car' && e.type !== 'isocar') continue;
        const rad = e.type === 'isocar' ? 30 : 26;
        const dx = cx - e.x, dy = cy - e.y;
        const min = R + rad;
        const d = Math.hypot(dx, dy);
        if (d > 0.001 && d < min) {
          const push = min - d;
          p.x += (dx / d) * push;
          p.y += (dy / d) * push;
        }
      }
    }

    _updateTopCar(inp, dt) {
      const accel = 560, maxF = 540, maxR = 200;
      let f = 0;
      if (inp.isDown('up')) f = 1; else if (inp.isDown('down')) f = -1;
      if (f > 0) this.carSpeed += accel * dt;
      else if (f < 0) this.carSpeed -= accel * dt;
      else this.carSpeed *= (1 - Math.min(1, 2.4 * dt));      // coast
      this.carSpeed = Math.max(-maxR, Math.min(maxF, this.carSpeed));

      let steer = 0;
      if (inp.isDown('left')) steer -= 1;
      if (inp.isDown('right')) steer += 1;
      const grip = Math.min(1, Math.abs(this.carSpeed) / 90);
      this.heading += steer * 2.7 * dt * grip * (this.carSpeed >= 0 ? 1 : -1);
      this.heading = ((this.heading % TAU) + TAU) % TAU;

      this.player.vx = Math.cos(this.heading) * this.carSpeed;
      this.player.vy = Math.sin(this.heading) * this.carSpeed;
      this.prompt = 'E — get out';
    }

    _updateIsoCar(inp, dt) {
      const { vx, vy } = this._axis(inp);
      const spd = 185;
      if (vx || vy) {
        const m = Math.hypot(vx, vy);
        this.player.vx = (vx / m) * spd;
        this.player.vy = (vy / m) * spd;
        this.heading = Math.atan2(vy, vx);
        this.isoCol = isoCol(this.heading);
      } else { this.player.vx = 0; this.player.vy = 0; }
      this.prompt = 'E — get out';
    }

    // ── ambient entity update ───────────────────────────────────────────────
    _updateEntity(e, dt) {
      const area = this.world.area; if (!area) return;
      const W = area.pixelWidth, H = area.pixelHeight;
      if (e.type === 'npc') {
        e.t = (e.t || 0) - dt;
        if (e.t <= 0) { e.heading = Math.floor(Math.random() * 8) * (Math.PI / 4); e.t = 1.2 + Math.random() * 2.2; }
        e.x += Math.cos(e.heading) * e.spd * dt;
        e.y += Math.sin(e.heading) * e.spd * dt;
        e.x = Math.max(48, Math.min(W - 48, e.x));
        e.y = Math.max(48, Math.min(H - 48, e.y));
      } else if (e.type === 'bird') {
        e.x += Math.cos(e.heading) * e.spd * dt;
        e.y += Math.sin(e.heading) * e.spd * dt * 0.4;
        e.bob = (e.bob || 0) + dt * 6;
        if (e.x < -40) e.x = W + 40; if (e.x > W + 40) e.x = -40;
        if (e.y < -40) e.y = H + 40; if (e.y > H + 40) e.y = -40;
      }
    }

    // ── drawing ──────────────────────────────────────────────────────────────
    _drawPlayer(ctx) {
      const b = this.player;
      const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
      const img = G.state.img;
      if (this.mode === 'car' && this.vehicle) {
        const v = this.vehicle;
        if (v.type === 'isocar') {
          this._carShadow(ctx, cx, cy, 34);
          G.drawIsoFrame(ctx, img[v.sheet], v.row, this.isoCol, cx, cy - 6, 2.2);
        } else {
          this._carShadow(ctx, cx, cy, 30);
          G.drawRotated(ctx, img[v.sprite], cx, cy, this.heading, carScale(v.sprite));
        }
      } else {
        this._carShadow(ctx, cx, cy + 6, 14);
        if (!G.drawRotated(ctx, img.char_player, cx, cy, this.facing, 0.62)) {
          ctx.fillStyle = '#ffd24a'; ctx.fillRect(cx - 8, cy - 10, 16, 20);
        }
      }
      // interaction prompt floats above the player
      if (this.prompt) {
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        const w = ctx.measureText(this.prompt).width + 12;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(cx - w / 2, cy - 44, w, 17);
        ctx.fillStyle = '#ffe680';
        ctx.fillText(this.prompt, cx, cy - 31);
        ctx.textAlign = 'left';
      }
    }

    _carShadow(ctx, x, y, r) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(x, y + 10, r, r * 0.45, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    _drawEntity(ctx, e) {
      const img = G.state.img;
      switch (e.type) {
        case 'car':
          this._carShadow(ctx, e.x, e.y, 30);
          G.drawRotated(ctx, img[e.sprite], e.x, e.y, e.heading || 0, carScale(e.sprite));
          break;
        case 'isocar':
          this._carShadow(ctx, e.x, e.y, 34);
          G.drawIsoFrame(ctx, img[e.sheet], e.row, e.col || 0, e.x, e.y - 6, 2.2);
          break;
        case 'bld':
          G.drawBillboard(ctx, img[e.sprite], e.x, e.y, e.scale || 1);
          break;
        case 'prop':
          G.drawBillboard(ctx, img[e.sprite], e.x, e.y, e.scale || 1);
          break;
        case 'npc':
          this._carShadow(ctx, e.x, e.y + 4, 12);
          G.drawRotated(ctx, img[e.sprite], e.x, e.y, e.heading || 0, 0.55);
          break;
        case 'bird': {
          const yo = Math.sin(e.bob || 0) * 4;
          G.drawBillboard(ctx, img[e.sprite], e.x, e.y - 60 + yo, 0.5);
          break;
        }
        case 'sign':
          ctx.fillStyle = '#6b4b2a'; ctx.fillRect(e.x - 3, e.y - 24, 6, 24);
          ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
          const w = ctx.measureText(e.text).width + 10;
          ctx.fillStyle = 'rgba(20,20,20,0.8)'; ctx.fillRect(e.x - w / 2, e.y - 44, w, 16);
          ctx.fillStyle = '#ffe680'; ctx.fillText(e.text, e.x, e.y - 32);
          ctx.textAlign = 'left';
          break;
      }
    }

    render(ctx, engine) {
      this.world.draw(ctx);
      const area = this.world.areaName === 'showroom' ? 'Isometric Showroom' : 'Town';
      GF.UISystem.drawText(ctx, area, 12, 12, { font: 'bold 16px monospace', color: '#fff' });
      const hint = this.mode === 'car'
        ? 'W/S drive · A/D steer · E get out'
        : 'W/S move · A/D turn · E enter car';
      GF.UISystem.drawText(ctx, hint, 12, 32, { font: '12px monospace', color: '#bfe' });
      if (this.mode === 'car' && this.vehicle && this.vehicle.type !== 'isocar') {
        GF.UISystem.drawText(ctx, Math.round(Math.abs(this.carSpeed)) + ' px/s',
          12, engine.config.height - 16, { font: '12px monospace', color: '#9fd' });
      }
    }
  };
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
