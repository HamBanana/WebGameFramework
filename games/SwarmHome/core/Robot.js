// GameFramework/games/SwarmHome/core/Robot.js
// Robot entity: differential-drive kinematics, grid pathfinding (GF.Grid A*),
// a sequential task-step queue, lift riding, cup carrying, and battery sim.
//
// Step types (queued by RoutineManager):
//   {t:'goto', col, row}                 pathfind + drive on the floor grid
//   {t:'callLift', lift, level}          fire-and-forget lift call
//   {t:'waitLift', lift, level}          wait until lift parked at level
//   {t:'board', lift}                    drive straight onto the platform
//   {t:'ride', lift, level}              ride the platform to a level
//   {t:'unboard', col, row}              drive straight off to a floor cell
//   {t:'brew', machine}                  request coffee, wait for cup on tray
//   {t:'way', points:[{x,y,z}]}          straight-line waypoints (tabletops)
//   {t:'placeCup', x, y, z}              set the carried cup down
//   {t:'wait', minutes}                  idle pause (sim minutes)
//   {t:'scan'}                           full 360° camera sweep
//   {t:'state', label}                   set the HUD status label
//   {t:'log', topic, payload}            publish on the MQTT bus

(function (GF) {
  'use strict';

  const SH = GF.SwarmHome = GF.SwarmHome || {};

  const LED = {
    idle: 0x666677, drive: 0x22ccff, lift: 0xffcc33, brew: 0xff7700,
    carry: 0xff8844, charge: 0x44ff66, low: 0xff2222, coop: 0xff44cc,
  };

  class Robot {
    constructor(spec, ctx) {
      this.spec = spec;
      this.id = spec.id;
      this.name = spec.name;
      this.ctx = ctx;                 // { scene, grid, cellWorld, mqtt }
      this.col = 0; this.row = 0;
      this.x = 0; this.z = 0; this.y = 0;
      this.yaw = 0;
      this.battery = spec.battery.capacity;
      this.state = 'idle';
      this.riding = null;             // Elevator while on its platform
      this.cup = null;
      this.queue = [];
      this._path = null;
      this._retry = 0;
      this._moved = false;
      this.homeDock = null;           // {col,row} set by game

      this._build();
    }

    _build() {
      const built = SH.RobotBuilder.buildRobot(this.spec);
      this.group = built.group;
      this.povCam = built.povCam;
      this.wheels = built.wheels;
      this.led = built.led;
      this.trayAnchor = built.trayAnchor;
      this.ring = built.ring;
      this.ctx.scene.add(this.group);
      this._sync();
    }

    /** Rebuild mesh from (edited) spec, preserving pose, cup and battery %. */
    rebuild(spec) {
      const frac = this.battery / this.spec.battery.capacity;
      const hadCup = this.cup;
      if (hadCup) this.ctx.scene.attach(hadCup);
      this.ctx.scene.remove(this.group);
      this.group.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material && o.material.dispose) o.material.dispose();
      });
      this.spec = spec;
      this.name = spec.name;
      this.battery = frac * spec.battery.capacity;
      this._build();
      if (hadCup) this.attachCup(hadCup);
    }

    setCell(col, row) {
      this.col = col; this.row = row;
      const p = this.ctx.cellWorld(col, row);
      this.x = p.x; this.z = p.z;
      this._sync();
    }

    _sync() {
      this.group.position.set(this.x, this.y, this.z);
      this.group.rotation.y = this.yaw;
    }

    pushTask(steps) { this.queue.push(...steps); }
    get busy() { return this.queue.length > 0 || this.state === 'coop'; }
    get atDock() {
      return this.homeDock && this.col === this.homeDock.col && this.row === this.homeDock.row;
    }

    attachCup(cup) {
      this.trayAnchor.attach(cup);
      cup.position.set(0, 0, 0);
      cup.rotation.set(0, 0, 0);
      this.cup = cup;
    }

    /**
     * Rotate toward (tx,tz) then drive. Returns true on arrival.
     * Forward axis is +Z: yaw = atan2(dx, dz).
     */
    _driveTo(tx, tz, dtK) {
      const dx = tx - this.x, dz = tz - this.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.025) { this.x = tx; this.z = tz; return true; }

      const targetYaw = Math.atan2(dx, dz);
      let dy = targetYaw - this.yaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;

      const maxTurn = this.spec.turnSpeed * dtK;
      if (Math.abs(dy) > maxTurn) {
        this.yaw += Math.sign(dy) * maxTurn;
        this._spinWheels(dtK * 0.3, Math.sign(dy));
        return false;
      }
      this.yaw = targetYaw;

      const step = Math.min(this.spec.speed * dtK, dist);
      this.x += Math.sin(this.yaw) * step;
      this.z += Math.cos(this.yaw) * step;
      this._spinWheels(step, 0);
      this._moved = true;
      return false;
    }

    _spinWheels(dist, turnDir) {
      const dTheta = dist / this.spec.wheels.radius;
      this.wheels.forEach((w, i) => {
        const side = w.position.x < 0 ? -1 : 1;
        w.rotation.x += turnDir === 0 ? dTheta : turnDir * side * dTheta * 2;
      });
      this._moved = true;
    }

    _setLed(color, blink) {
      const intensity = blink ? 0.3 + Math.abs(Math.sin(Date.now() * 0.006)) : 0.9;
      this.led.material.color.setHex(color);
      this.led.material.emissive.setHex(color);
      this.led.material.emissiveIntensity = intensity;
    }

    update(dtK, dtSimMin) {
      this._moved = false;

      if (this.state === 'coop') {
        // RoutineManager drives us during cooperative carries.
        this.y = 0;
        this._sync();
        this._setLed(LED.coop, true);
        this._drainBattery(dtSimMin, true);
        return;
      }

      // Riding a lift → track the platform height
      if (this.riding) this.y = this.riding.surfaceY;

      const step = this.queue[0];
      if (!step) {
        if (this.atDock) {
          this.state = 'charging';
          this.battery = Math.min(this.spec.battery.capacity,
            this.battery + this.spec.battery.chargeRate * dtSimMin);
          this._setLed(this.battery >= this.spec.battery.capacity * 0.98 ? LED.idle : LED.charge,
            this.battery < this.spec.battery.capacity * 0.98);
        } else {
          this.state = 'idle';
          this._setLed(this.battery < 20 ? LED.low : LED.idle, this.battery < 20);
        }
        this._drainBattery(dtSimMin, false);
        this._sync();
        return;
      }

      switch (step.t) {
        case 'goto': {
          this.state = step.label || 'navigating';
          this._setLed(LED.drive);
          if (!this._path) {
            this._retry -= dtK;
            if (this._retry > 0) break;
            const path = this.ctx.grid.findPath(
              { col: this.col, row: this.row }, { col: step.col, row: step.row });
            if (!path || !path.length) { this._retry = 1.0; break; }
            if (path[0].col === this.col && path[0].row === this.row) path.shift();
            this._path = path;
            if (!this._path.length) { this._path = null; this._next(); break; }
          }
          const cell = this._path[0];
          const p = this.ctx.cellWorld(cell.col, cell.row);
          if (this._driveTo(p.x, p.z, dtK)) {
            this.col = cell.col; this.row = cell.row;
            this._path.shift();
            if (!this._path.length) { this._path = null; this._next(); }
          }
          break;
        }

        case 'callLift':
          step.lift.call(step.level, this.id);
          this._next();
          break;

        case 'waitLift':
          this.state = 'waiting for lift';
          this._setLed(LED.lift, true);
          if (step.lift.atLevel(step.level)) this._next();
          break;

        case 'board': {
          this.state = 'boarding lift';
          this._setLed(LED.lift);
          if (this._driveTo(step.lift.x, step.lift.z, dtK)) {
            this.riding = step.lift;
            this.col = -1; this.row = -1;   // off-grid while riding
            this._next();
          }
          break;
        }

        case 'ride':
          this.state = 'riding lift';
          this._setLed(LED.lift, true);
          if (!step._called) { step.lift.call(step.level, this.id); step._called = true; }
          if (step.lift.atLevel(step.level)) this._next();
          break;

        case 'unboard': {
          this.state = 'leaving lift';
          this._setLed(LED.lift);
          const p = this.ctx.cellWorld(step.col, step.row);
          if (this._driveTo(p.x, p.z, dtK)) {
            this.riding = null;
            this.y = 0;
            this.col = step.col; this.row = step.row;
            this._next();
          }
          break;
        }

        case 'brew':
          this.state = 'getting coffee';
          this._setLed(LED.brew, true);
          if (!step._started) {
            step._started = true;
            step._done = false;
            if (!step.machine.brew(this, () => { step._done = true; })) {
              step._started = false;   // machine busy — retry next frame
            }
          }
          if (step._done) this._next();
          break;

        case 'way': {
          this.state = step.label || 'driving';
          this._setLed(this.cup ? LED.carry : LED.drive);
          const pt = step.points[0];
          this.y = pt.y;
          if (this._driveTo(pt.x, pt.z, dtK)) {
            step.points.shift();
            if (!step.points.length) this._next();
          }
          break;
        }

        case 'placeCup': {
          this.state = 'placing cup';
          this._setLed(LED.carry);
          if (!this.cup) { this._next(); break; }
          if (!step._t) {
            step._t = 0;
            this.ctx.scene.attach(this.cup);
            step._from = this.cup.position.clone();
          }
          step._t += dtK;
          const k = Math.min(step._t / 0.8, 1);
          const e = k * k * (3 - 2 * k);    // smoothstep
          this.cup.position.set(
            step._from.x + (step.x - step._from.x) * e,
            step._from.y + (step.y - step._from.y) * e + Math.sin(e * Math.PI) * 0.06,
            step._from.z + (step.z - step._from.z) * e
          );
          if (k >= 1) {
            const placed = this.cup;
            this.cup = null;
            this.ctx.mqtt(`robot/${this.id}/cup_placed`, {});
            if (this.ctx.onCupPlaced) this.ctx.onCupPlaced(placed);
            this._next();
          }
          break;
        }

        case 'wait':
          this.state = step.label || 'waiting';
          this._setLed(LED.idle, true);
          step._left = (step._left === undefined ? step.minutes : step._left) - dtSimMin;
          if (step._left <= 0) this._next();
          break;

        case 'scan': {
          this.state = 'scanning';
          this._setLed(LED.drive, true);
          if (step._left === undefined) step._left = Math.PI * 2;
          const d = this.spec.turnSpeed * 0.5 * dtK;
          this.yaw += d;
          step._left -= d;
          this._spinWheels(d * 0.2, 1);
          if (step._left <= 0) this._next();
          break;
        }

        case 'state':
          this.state = step.label;
          this._next();
          break;

        case 'log':
          this.ctx.mqtt(step.topic, step.payload || {});
          this._next();
          break;

        default:
          this._next();
      }

      this._drainBattery(dtSimMin, this._moved);
      this._sync();
    }

    _next() { this.queue.shift(); }

    _drainBattery(dtSimMin, moving) {
      if (this.state === 'charging') return;
      const rate = moving ? this.spec.battery.drainMove : this.spec.battery.drainIdle;
      this.battery = Math.max(0, this.battery - rate * dtSimMin);
    }
  }

  SH.Robot = Robot;

})(window.GF = window.GF || {});
