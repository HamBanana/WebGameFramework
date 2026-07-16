// GameFramework/games/SwarmHome/core/RoutineManager.js
// Owns the 24 h sim clock, fires scheduled tasks, builds task-step programs
// for robots (coffee run, patrol, dock return) and runs cooperative
// crate-carry operations where two robots move as one.

(function (GF) {
  'use strict';

  const SH = GF.SwarmHome = GF.SwarmHome || {};

  function parseHM(s) {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  }

  const CUP_SPOTS = [[0, -0.02], [0.09, 0.05], [-0.09, 0.04], [0.06, -0.09]];

  // ── Cooperative crate carry ───────────────────────────────────────────────

  class CrateOp {
    constructor(rm, rA, rB) {
      this.rm = rm;
      this.rA = rA; this.rB = rB;
      this.crate = rm.crate;
      this.phase = 'gather';
      this.t = 0;
      this.done = false;

      const { places, world } = rm;
      const start = world.cellWorld(places.crateStart.col, places.crateStart.row);
      const end = world.cellWorld(places.crateEnd.col, places.crateEnd.row);
      this.startPos = start; this.endPos = end;
      this.offset = this.crate.spec.size / 2 + 0.15;

      // Make sure the crate is at its pickup point
      this.crate.setPos(start.x, 0, start.z);

      rA.pushTask([
        { t: 'log', topic: `robot/${rA.id}/task`, payload: { task: 'crate_carry' } },
        { t: 'goto', col: places.crateStart.col - 1, row: places.crateStart.row, label: 'going to crate' },
      ]);
      rB.pushTask([
        { t: 'log', topic: `robot/${rB.id}/task`, payload: { task: 'crate_carry' } },
        { t: 'goto', col: places.crateStart.col + 1, row: places.crateStart.row, label: 'going to crate' },
      ]);
      rm.mqtt('swarm/crate/op_start', { robots: [rA.id, rB.id] });
    }

    update(dtK) {
      const { rA, rB, crate } = this;

      switch (this.phase) {
        case 'gather':
          if (!rA.queue.length && !rB.queue.length) {
            rA.state = 'coop'; rB.state = 'coop';
            this.phase = 'face';
          }
          break;

        case 'face': {
          // Both turn to the travel direction (+Z toward the drop point)
          const want = Math.atan2(this.endPos.x - this.startPos.x, this.endPos.z - this.startPos.z);
          const turn = (r) => {
            let d = want - r.yaw;
            while (d > Math.PI) d -= Math.PI * 2;
            while (d < -Math.PI) d += Math.PI * 2;
            const mx = r.spec.turnSpeed * dtK;
            if (Math.abs(d) <= mx) { r.yaw = want; return true; }
            r.yaw += Math.sign(d) * mx;
            return false;
          };
          const a = turn(rA), b = turn(rB);
          if (a && b) {
            this.phase = 'lift'; this.t = 0;
            this.rm.mqtt('swarm/crate/lift', {});
          }
          break;
        }

        case 'lift':
          this.t += dtK;
          crate.setPos(crate.pos.x, Math.min(this.t / 1.2, 1) * 0.14, crate.pos.z);
          if (this.t >= 1.2) { this.phase = 'move'; this.t = 0; }
          break;

        case 'move': {
          const dx = this.endPos.x - crate.pos.x, dz = this.endPos.z - crate.pos.z;
          const dist = Math.hypot(dx, dz);
          const step = Math.min(0.4 * dtK, dist);
          if (dist > 0.02) {
            crate.setPos(crate.pos.x + dx / dist * step, 0.14, crate.pos.z + dz / dist * step);
          } else {
            crate.setPos(this.endPos.x, 0.14, this.endPos.z);
            this.phase = 'lower'; this.t = 0;
          }
          rA.x = crate.pos.x - this.offset; rA.z = crate.pos.z;
          rB.x = crate.pos.x + this.offset; rB.z = crate.pos.z;
          rA._spinWheels(step, 0); rB._spinWheels(step, 0);
          break;
        }

        case 'lower':
          this.t += dtK;
          crate.setPos(crate.pos.x, (1 - Math.min(this.t / 1.2, 1)) * 0.14, crate.pos.z);
          if (this.t >= 1.2) {
            this.phase = 'release';
            this.rm.mqtt('swarm/crate/drop', {});
          }
          break;

        case 'release': {
          // Hand control back, snap grid cells from world position, send home
          [this.rA, this.rB].forEach(r => {
            const g = this.rm.world.grid.toGrid(r.x, r.z);
            r.col = g.col; r.row = g.row;
            r.state = 'idle';
            this.rm.sendDock(r);
          });
          this.done = true;
          break;
        }
      }
    }
  }

  // ── RoutineManager ────────────────────────────────────────────────────────

  class RoutineManager {
    constructor(cfg, world, robots, devices, mqtt) {
      this.cfg = cfg;
      this.world = world;            // { grid, places, cellWorld, counterH, tableH }
      this.places = world.places;
      this.robots = robots;          // id → Robot (Map)
      this.devices = devices;        // { kitchenLift, bedsideLift, machine, crate, docks }
      this.crate = devices.crate;
      this.mqtt = mqtt;

      this.minutes = parseHM(cfg.sim.startTime);
      this.speed = cfg.sim.speed;
      this.paused = false;
      this.ops = [];
      this.cups = [];                // { mesh, placedAt }
      this.cupSpot = 0;

      this.schedule = cfg.schedule.map(e => ({ ...e, at: parseHM(e.time) }));
    }

    clockString() {
      const m = Math.floor(this.minutes) % 1440;
      return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    }

    update(dtReal) {
      if (this.paused) return { dtK: 0, dtSimMin: 0 };
      const dtK = dtReal * Math.max(this.speed, 0.25);   // kinematic time
      const dtSimMin = dtReal * this.speed;              // clock time

      const prev = this.minutes;
      this.minutes += dtSimMin;

      // Fire schedule entries crossed this tick (handles midnight wrap)
      const a = prev % 1440, b = this.minutes % 1440;
      this.schedule.forEach(e => {
        const crossed = a < b ? (e.at > a && e.at <= b) : (e.at > a || e.at <= b);
        if (crossed) this.fire(e);
      });
      if (this.minutes >= 1440) this.minutes -= 1440;

      // Cooperative ops
      this.ops.forEach(op => op.update(dtK));
      this.ops = this.ops.filter(op => !op.done);

      // Idle robots head home to charge
      this.robots.forEach(r => {
        if (!r.busy && !r.atDock && r.state !== 'coop' && !r.riding) this.sendDock(r);
      });

      // Delivered cups get drunk eventually
      const life = this.cfg.sim.cupLifetimeMin;
      this.cups = this.cups.filter(c => {
        const age = (this.minutes - c.placedAt + 1440) % 1440;
        if (age > life) {
          c.mesh.parent && c.mesh.parent.remove(c.mesh);
          this.mqtt('home/human/coffee_drunk', {});
          return false;
        }
        return true;
      });

      return { dtK, dtSimMin };
    }

    fire(entry) {
      const ids = entry.robots || [entry.robot];
      const bots = ids.map(id => this.robots.get(id)).filter(Boolean);
      if (bots.length !== ids.length) return;            // robot disabled via launcher
      if (bots.some(b => b.busy)) {
        this.mqtt('swarm/schedule/skipped', { task: entry.task, reason: 'robot busy' });
        return;
      }
      this.mqtt('swarm/schedule/fire', { time: entry.time, task: entry.task, robots: ids });
      this.startTask(entry.task, bots);
    }

    startTask(task, bots) {
      if (task === 'coffeeRun') this.taskCoffeeRun(bots[0]);
      else if (task === 'patrol') this.taskPatrol(bots[0]);
      else if (task === 'crateMove' && bots.length >= 2) this.ops.push(new CrateOp(this, bots[0], bots[1]));
    }

    registerCup(mesh) {
      this.cups.push({ mesh, placedAt: this.minutes });
    }

    // ── Task programs ───────────────────────────────────────────────────────

    taskCoffeeRun(r) {
      const P = this.places;
      const kl = this.devices.kitchenLift;
      const bl = this.devices.bedsideLift;
      const tw = P.tableWorld;
      const tY = this.world.tableH;
      const spot = CUP_SPOTS[this.cupSpot++ % CUP_SPOTS.length];

      r.pushTask([
        { t: 'log', topic: `robot/${r.id}/task`, payload: { task: 'coffee_run' } },
        { t: 'goto', col: P.kitchenStage.col, row: P.kitchenStage.row, label: 'heading to kitchen' },
        { t: 'callLift', lift: kl, level: 'bottom' },
        { t: 'waitLift', lift: kl, level: 'bottom' },
        { t: 'board', lift: kl },
        { t: 'ride', lift: kl, level: 'top' },
        { t: 'brew', machine: this.devices.machine },
        { t: 'ride', lift: kl, level: 'bottom' },
        { t: 'unboard', col: P.kitchenStage.col, row: P.kitchenStage.row },
        { t: 'goto', col: P.bedStage.col, row: P.bedStage.row, label: 'delivering coffee' },
        { t: 'callLift', lift: bl, level: 'bottom' },
        { t: 'waitLift', lift: bl, level: 'bottom' },
        { t: 'board', lift: bl },
        { t: 'ride', lift: bl, level: 'top' },
        // Drive off the platform onto the tabletop
        { t: 'way', label: 'on the table', points: [{ x: tw.x, y: tY, z: tw.z + 0.14 }] },
        { t: 'placeCup', x: tw.x + spot[0], y: tY, z: tw.z + spot[1] - 0.06 },
        // Reverse back onto the platform
        { t: 'way', label: 'returning', points: [{ x: bl.x, y: tY, z: bl.z }] },
        { t: 'ride', lift: bl, level: 'bottom' },
        { t: 'unboard', col: P.bedStage.col, row: P.bedStage.row },
        { t: 'log', topic: `robot/${r.id}/task_done`, payload: { task: 'coffee_run' } },
      ]);
      this.sendDock(r);
    }

    taskPatrol(r) {
      const steps = [
        { t: 'log', topic: `robot/${r.id}/task`, payload: { task: 'patrol' } },
      ];
      this.places.patrol.forEach(cell => {
        steps.push({ t: 'goto', col: cell.col, row: cell.row, label: 'patrolling' });
        steps.push({ t: 'scan' });
        steps.push({ t: 'log', topic: `robot/${r.id}/scan_ok`, payload: { cell: `${cell.col},${cell.row}` } });
      });
      steps.push({ t: 'log', topic: `robot/${r.id}/task_done`, payload: { task: 'patrol' } });
      r.pushTask(steps);
      this.sendDock(r);
    }

    sendDock(r) {
      if (!r.homeDock) return;
      r.pushTask([
        { t: 'goto', col: r.homeDock.col, row: r.homeDock.row, label: 'returning to dock' },
      ]);
    }
  }

  SH.RoutineManager = RoutineManager;

})(window.GF = window.GF || {});
