// GameFramework/games/SwarmHome/SwarmHomeGame.js
// Bootstrap + orchestration: builds the apartment, devices and robot swarm,
// wires the camera director, HUD, design panel, MQTT-style event log and the
// daily routine simulation.

(function (GF) {
  'use strict';

  const SH = GF.SwarmHome = GF.SwarmHome || {};

  class SwarmHomeGame {
    constructor(engine, three, save) {
      this.engine = engine;
      this.three = three;
      this.save = save;
      this.cfg = GF.GAME_CONFIG;
      this.mqttLog = [];
      this.selectedId = null;

      // ── World ──
      const builder = new SH.ApartmentBuilder(three.scene, this.cfg);
      this.world = builder.build();
      const { places, cellWorld, counterH, tableH } = this.world;

      // ── Devices ──
      const bus = (topic, payload) => this.mqtt(topic, payload);
      const dv = this.cfg.devices;
      const klPos = cellWorld(places.kitchenLiftCell.col, places.kitchenLiftCell.row);
      const blPos = cellWorld(places.bedLiftCell.col, places.bedLiftCell.row);
      const mcPos = cellWorld(places.machineCell.col, places.machineCell.row);

      this.devices = {
        kitchenLift: new SH.Devices.Elevator(three.scene, 'kitchen', dv.kitchenLift,
          { x: klPos.x, z: klPos.z, topY: counterH - 0.01, bus }),
        bedsideLift: new SH.Devices.Elevator(three.scene, 'bedside', dv.bedsideLift,
          { x: blPos.x, z: blPos.z, topY: tableH - 0.01, bus }),
        machine: new SH.Devices.CoffeeMachine(three.scene, dv.coffeeMachine,
          { x: mcPos.x, z: mcPos.z, baseY: counterH, bus }),
        docks: places.docks.map((cell, i) => {
          const p = cellWorld(cell.col, cell.row);
          return new SH.Devices.Dock(three.scene, i, { x: p.x, z: p.z });
        }),
        crate: null,
      };
      this._spawnCrate();

      // ── Robots ──
      this._loadDesigns();
      const count = Math.min(this.cfg.sim.robotCount, this.cfg.robots.length, places.docks.length);
      const ctx = {
        scene: three.scene,
        grid: this.world.grid,
        cellWorld,
        mqtt: bus,
        onCupPlaced: (cup) => this.routine.registerCup(cup),
      };
      this.robots = [];
      for (let i = 0; i < count; i++) {
        const r = new SH.Robot(this.cfg.robots[i], ctx);
        r.homeDock = places.docks[i];
        r.setCell(places.docks[i].col, places.docks[i].row);
        r.yaw = Math.PI;   // face into the room
        this.robots.push(r);
      }
      const robotMap = new Map(this.robots.map(r => [r.id, r]));

      // ── Routine ──
      this.routine = new SH.RoutineManager(this.cfg, this.world, robotMap, this.devices, bus);

      // ── Cameras ──
      this.cameras = new SH.CameraDirector(engine, three, this.cfg);
      this.robots.forEach(r =>
        this.cameras.addCam(r.id, `${r.name} cam (robot)`, () => r.povCam, true));
      this.cameras.addFixedCam('kitchen', 'Kitchen cam',
        { x: mcPos.x + 0.5, y: counterH + 0.7, z: mcPos.z + 0.9 },
        { x: klPos.x, y: counterH, z: klPos.z }, 60);
      const tw = places.tableWorld;
      this.cameras.addFixedCam('bedside', 'Bedside cam',
        { x: tw.x - 0.7, y: tableH + 0.9, z: tw.z + 0.7 },
        { x: tw.x, y: tableH, z: tw.z }, 60);
      this.cameras.addFixedCam('corner', 'Corner overview',
        { x: -this.world.bounds.w / 2 + 0.3, y: 2.3, z: this.world.bounds.d / 2 - 0.3 },
        { x: 0.5, y: 0, z: 0 }, 75);
      engine.addSystem(this.cameras);   // after Three3DScene → PiP pass ordering

      // ── UI ──
      this.hud = new SH.HUD(this);
      this.panel = new SH.DesignPanel(this);
      this.selectRobot(this.robots[0] ? this.robots[0].id : null);

      // ── Input ──
      Object.entries(this.cfg.controls).forEach(([action, codes]) =>
        engine.input.bind(action, ...codes));
      this._setupTouch();
      this._setupPicking();

      engine.onUpdate((dt) => this._update(dt));
      engine.onRender((ctx2d) => {
        this.hud.draw(ctx2d);
        this.touch.draw(ctx2d);   // controls above the HUD
      });

      this.mqtt('swarm/sim/online', { robots: this.robots.map(r => r.id) });
    }

    // ── Frame update ─────────────────────────────────────────────────────────

    _update(dt) {
      const inp = this.engine.input;
      if (inp.wasPressed('pause')) this.routine.paused = !this.routine.paused;
      if (inp.wasPressed('speedUp')) this._bumpSpeed(1);
      if (inp.wasPressed('speedDown')) this._bumpSpeed(-1);
      if (inp.wasPressed('designPanel')) this.panel.toggle();

      const { dtK, dtSimMin } = this.routine.update(dt);
      if (dtK > 0) {
        this.robots.forEach(r => r.update(dtK, dtSimMin));
        this.devices.kitchenLift.update(dtK);
        this.devices.bedsideLift.update(dtK);
        this.devices.machine.update(dt, dtSimMin);
      }
      this.devices.docks.forEach((d, i) => {
        const r = this.robots[i];
        d.setCharging(!!(r && r.atDock && r.state === 'charging'));
        d.update();
      });
    }

    _bumpSpeed(dir) {
      const speeds = [0.5, 1, 2, 4, 8];
      let i = speeds.findIndex(s => s >= this.routine.speed);
      if (i < 0) i = 1;
      i = Math.min(speeds.length - 1, Math.max(0, i + dir));
      this.routine.speed = speeds[i];
      this.mqtt('swarm/sim/speed', { x: speeds[i] });
    }

    // ── MQTT-style event log ─────────────────────────────────────────────────

    mqtt(topic, payload) {
      const body = payload && Object.keys(payload).length ? ' ' + JSON.stringify(payload) : '';
      let line = `${this.routine ? this.routine.clockString() : '--:--'} ${topic}${body}`;
      if (line.length > 52) line = line.slice(0, 51) + '…';
      this.mqttLog.push(line);
      if (this.mqttLog.length > 8) this.mqttLog.shift();
      this.engine.events.emit('mqtt', { topic, payload });
    }

    camHotkey(id) {
      const i = this.robots.findIndex(r => r.id === id);
      return i >= 0 ? `[${i + 1}]` : '';
    }

    // ── Touch controls (mobile) ──────────────────────────────────────────────
    // Buttons inject the same input actions the keyboard uses, so the
    // existing wasPressed() handlers in _update / CameraDirector serve both.
    // Robot selection works by tapping a robot (pointer events), and
    // OrbitControls handles one-finger rotate / two-finger pan+zoom natively.

    _setupTouch() {
      this.touch = new GF.TouchControls({ autoRender: false });
      this.engine.addSystem(this.touch);
      this.touch
        // Sim controls, bottom-centre
        .addButton({ id: 'speedDown', action: 'speedDown', label: '−', anchor: 'bc', x: -64, y: 42, r: 24 })
        .addButton({ id: 'pause', action: 'pause', label: '⏯', anchor: 'bc', x: 0, y: 42, r: 24 })
        .addButton({ id: 'speedUp', action: 'speedUp', label: '＋', anchor: 'bc', x: 64, y: 42, r: 24 })
        // Camera + panel, top-right column
        .addButton({ id: 'camCycle', action: 'camCycle', label: '📷', anchor: 'tr', x: 38, y: 78, r: 24 })
        .addButton({ id: 'camOrbit', action: 'camOrbit', label: '🏠', anchor: 'tr', x: 38, y: 138, r: 24 })
        .addButton({ id: 'pip', action: 'pipToggle', label: '🖼', anchor: 'tr', x: 38, y: 198, r: 24 })
        .addButton({ id: 'design', action: 'designPanel', label: '🛠', anchor: 'tr', x: 38, y: 258, r: 24 });
    }

    // ── Selection (click a robot in the 3D view) ─────────────────────────────

    _setupPicking() {
      const canvas = this.engine.canvas;
      const ray = new THREE.Raycaster();
      let downAt = null;
      canvas.addEventListener('pointerdown', e => { downAt = { x: e.clientX, y: e.clientY }; });
      canvas.addEventListener('pointerup', e => {
        if (!downAt) return;
        const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
        downAt = null;
        if (moved > 6) return;   // drag → orbit, not a click
        const rect = canvas.getBoundingClientRect();
        const ndc = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const cam = this.cameras.active.getCam();
        if (!cam || !cam.isPerspectiveCamera) return;
        ray.setFromCamera(ndc, cam);
        const hits = ray.intersectObjects(this.robots.map(r => r.group), true);
        if (hits.length) {
          const id = hits[0].object.userData.robotId;
          if (id) this.selectRobot(id);
        }
      });
    }

    selectRobot(id) {
      this.selectedId = id;
      this.robots.forEach(r => { r.ring.visible = (r.id === id); });
      if (id && this.panel) this.panel.selectRobot(id);
    }

    // ── Design persistence ───────────────────────────────────────────────────

    _loadDesigns() {
      if (!this.save) return;
      const saved = this.save.read('designs');
      if (!saved || !saved.data) return;
      // v1 designs predate the small-bot scale — ignore them.
      if (saved.version !== 2) return;
      const { robots, devices } = saved.data;
      if (Array.isArray(robots)) {
        robots.forEach(spec => {
          const i = this.cfg.robots.findIndex(r => r.id === spec.id);
          if (i >= 0) this.cfg.robots[i] = spec;
        });
      }
      if (devices) Object.assign(this.cfg.devices, devices);
    }

    saveDesigns() {
      if (!this.save) return;
      this.save.write('designs', {
        robots: this.cfg.robots,
        devices: this.cfg.devices,
      }, 2);
    }

    resetDesigns() {
      if (this.save) this.save.delete('designs');
      location.reload();
    }

    applyRobotSpec(id) {
      const r = this.robots.find(x => x.id === id);
      if (!r) return;
      const i = this.cfg.robots.findIndex(s => s.id === id);
      r.rebuild(this.cfg.robots[i]);
      r.ring.visible = (this.selectedId === id);
      this.saveDesigns();
    }

    applyDeviceSpec(key) {
      const dv = this.cfg.devices;
      if (key === 'kitchenLift') this.devices.kitchenLift.rebuild(dv.kitchenLift);
      else if (key === 'bedsideLift') this.devices.bedsideLift.rebuild(dv.bedsideLift);
      else if (key === 'coffeeMachine') this.devices.machine.rebuild(dv.coffeeMachine);
      else if (key === 'crate') this._spawnCrate();
      this.saveDesigns();
    }

    _spawnCrate() {
      const old = this.devices.crate;
      const pos = old ? { x: old.pos.x, z: old.pos.z } : (() => {
        const p = this.world.cellWorld(this.world.places.crateStart.col, this.world.places.crateStart.row);
        return { x: p.x, z: p.z };
      })();
      if (old) {
        this.three.scene.remove(old.group);
        old.group.traverse(o => {
          if (o.geometry) o.geometry.dispose();
          if (o.material && o.material.dispose) o.material.dispose();
        });
      }
      this.devices.crate = new SH.Devices.Crate(this.three.scene, this.cfg.devices.crate, pos);
      if (this.routine) this.routine.crate = this.devices.crate;
    }
  }

  // ── Bootstrap ───────────────────────────────────────────────────────────────

  window.addEventListener('GF:ready', async function () {
    if (!window.THREE) {
      console.error('Swarm Home requires Three.js. Add the CDN script to index.html.');
      return;
    }
    if (!THREE.OrbitControls) {
      console.error('Swarm Home requires THREE.OrbitControls (CDN script in index.html).');
      return;
    }
    try {
      const cfg = GF.GAME_CONFIG;
      const game = await GF.createGameAsync(cfg.engine, cfg.physics, {
        gameName: 'SwarmHome',
        saveOpts: { namespace: 'SwarmHome' },
      });
      const three = new GF.Three3DScene({ bgColor: 0x10131c });
      game.engine.addSystem(three);
      const sim = new SwarmHomeGame(game.engine, three, game.save);
      game.engine.start();
      window._swarmHome = sim;
    } catch (e) {
      console.error('[SwarmHome] Init error:', e);
    }
  });

})(window.GF = window.GF || {});
