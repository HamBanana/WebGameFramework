// GameFramework/games/SwarmHome/core/Devices.js
// Modular apartment devices: Elevator (homemade lift), CoffeeMachine,
// charging Dock, Crate. Each takes a design spec and supports rebuild(spec)
// so the Design Panel can live-edit them. Device chatter is published on an
// MQTT-style bus: bus(topic, payload) — mirroring how the real ESP swarm
// would talk.

(function (GF) {
  'use strict';

  const SH = GF.SwarmHome = GF.SwarmHome || {};
  const P = () => SH.parts;

  // ── Elevator ──────────────────────────────────────────────────────────────
  // A vertical platform lift. Levels: 'bottom' (floor) and 'top' (topY —
  // counter or table surface height). Robots board at the bottom and ride.

  class Elevator {
    constructor(scene, id, spec, opts) {
      this.scene = scene;
      this.id = id;
      this.x = opts.x;
      this.z = opts.z;
      this.topY = opts.topY;
      this.bottomY = 0.02;
      this.bus = opts.bus || (() => {});
      this.platformY = this.bottomY;
      this.targetY = this.bottomY;
      this.moving = false;
      this.rider = null;
      this.group = null;
      this.platform = null;
      this.rebuild(spec);
    }

    rebuild(spec) {
      this.spec = spec;
      if (this.group) {
        this.scene.remove(this.group);
        this.group.traverse(o => {
          if (o.geometry) o.geometry.dispose();
          if (o.material && o.material.dispose) o.material.dispose();
        });
      }
      const { mkBox, mkCyl, add } = P();
      const g = new THREE.Group();
      const ps = spec.platform;
      const railH = this.topY + 0.25;

      // Corner rails
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) =>
        add(g, mkCyl(0.016, railH, 8, spec.color, { r: 0.35, m: 0.6 }),
          sx * (ps / 2 + 0.03), railH / 2, sz * (ps / 2 + 0.03)));
      // Top crossbars
      add(g, mkBox(ps + 0.1, 0.025, 0.025, spec.color, { r: 0.35, m: 0.6 }), 0, railH, -(ps / 2 + 0.03));
      add(g, mkBox(ps + 0.1, 0.025, 0.025, spec.color, { r: 0.35, m: 0.6 }), 0, railH, (ps / 2 + 0.03));
      // Base frame
      add(g, mkBox(ps + 0.12, 0.02, ps + 0.12, 0x333740, { r: 0.8 }), 0, 0.01, 0);

      // Platform (animated)
      this.platform = add(g, mkBox(ps, 0.02, ps, 0x556070, { r: 0.6, m: 0.3 }), 0, this.platformY, 0);
      const stripe = mkBox(ps, 0.004, 0.04, 0xffcc44, { e: 0xffcc44, ei: 0.5 });
      stripe.position.set(0, 0.012, ps / 2 - 0.04);
      this.platform.add(stripe);

      // Tiny controller box with LED — it's an ESP32 lift, after all
      add(g, mkBox(0.05, 0.07, 0.03, 0x223344, { r: 0.6 }), ps / 2 + 0.08, 0.25, ps / 2 + 0.03);
      this.led = add(g, P().mkSphere(0.012, 0x22ff66, { e: 0x22ff66, ei: 0.9 }), ps / 2 + 0.08, 0.31, ps / 2 + 0.05);

      g.position.set(this.x, 0, this.z);
      this.scene.add(g);
      this.group = g;
    }

    get surfaceY() { return this.platformY + 0.01; }

    levelY(level) { return level === 'top' ? this.topY : this.bottomY; }

    atLevel(level) { return !this.moving && Math.abs(this.platformY - this.levelY(level)) < 0.005; }

    call(level, who) {
      const ty = this.levelY(level);
      if (Math.abs(this.targetY - ty) < 0.005) return;
      this.targetY = ty;
      this.moving = true;
      this.bus(`home/lift/${this.id}/call`, { level, by: who || 'sim' });
    }

    update(dtK) {
      if (!this.moving) return;
      const dir = Math.sign(this.targetY - this.platformY);
      this.platformY += dir * this.spec.speed * dtK;
      if ((dir > 0 && this.platformY >= this.targetY) || (dir < 0 && this.platformY <= this.targetY)) {
        this.platformY = this.targetY;
        this.moving = false;
        this.bus(`home/lift/${this.id}/arrived`, { level: this.platformY > 0.1 ? 'top' : 'bottom' });
      }
      this.platform.position.y = this.platformY;
      if (this.led) this.led.material.emissiveIntensity = this.moving ? 0.2 + Math.abs(Math.sin(Date.now() * 0.01)) : 0.9;
    }
  }

  // ── CoffeeMachine ─────────────────────────────────────────────────────────
  // Sits on the counter, front facing +Z (toward the kitchen lift). brew()
  // runs for spec.brewMinutes sim-minutes, then dispenses a cup onto the
  // requesting robot's tray.

  class CoffeeMachine {
    constructor(scene, spec, opts) {
      this.scene = scene;
      this.x = opts.x;
      this.z = opts.z;
      this.baseY = opts.baseY;      // counter top
      this.bus = opts.bus || (() => {});
      this.state = 'idle';          // idle | brewing | dispensing
      this.brewLeft = 0;
      this.client = null;
      this.onDone = null;
      this.cup = null;
      this.steam = [];
      this.group = null;
      this.rebuild(spec);
    }

    rebuild(spec) {
      this.spec = spec;
      if (this.group) {
        this.scene.remove(this.group);
        this.group.traverse(o => {
          if (o.geometry) o.geometry.dispose();
          if (o.material && o.material.dispose) o.material.dispose();
        });
      }
      const { mkBox, mkCyl, add, mkSphere } = P();
      const g = new THREE.Group();
      add(g, mkBox(0.24, 0.30, 0.20, spec.color, { r: 0.5, m: 0.1 }), 0, 0.15, -0.02);
      add(g, mkBox(0.24, 0.05, 0.26, spec.color, { r: 0.5, m: 0.1 }), 0, 0.295, 0.01);
      // Spout arm overhanging the counter edge (dispenses onto the lift below... or level with it)
      add(g, mkBox(0.06, 0.04, 0.16, 0x333740, { r: 0.4, m: 0.4 }), 0, 0.24, 0.12);
      this.spout = add(g, mkCyl(0.014, 0.05, 10, 0x333740, { r: 0.4, m: 0.4 }), 0, 0.20, 0.18);
      // Status LED
      this.led = add(g, mkSphere(0.013, 0x444444, { e: 0x444444, ei: 1 }), 0.09, 0.27, 0.085);
      this.led.castShadow = false;
      // Water tank hint
      add(g, mkBox(0.05, 0.2, 0.14, 0x99bbcc, { r: 0.2, t: true, o: 0.6 }), -0.145, 0.16, -0.02);

      g.position.set(this.x, this.baseY, this.z);
      this.scene.add(g);
      this.group = g;

      // Steam puffs (reused spheres)
      this.steam.forEach(s => this.scene.remove(s.mesh));
      this.steam = [];
      for (let i = 0; i < 6; i++) {
        const m = mkSphere(0.018, 0xffffff, { t: true, o: 0 });
        m.castShadow = false;
        m.material = new THREE.MeshBasicMaterial({ color: 0xeeeeff, transparent: true, opacity: 0 });
        this.scene.add(m);
        this.steam.push({ mesh: m, t: i / 6 });
      }
    }

    spoutWorld() {
      const v = new THREE.Vector3();
      this.spout.getWorldPosition(v);
      return v;
    }

    /** Start brewing for `robot`; cb fires after the cup lands on its tray. */
    brew(robot, cb) {
      if (this.state !== 'idle') return false;
      this.state = 'brewing';
      this.brewLeft = this.spec.brewMinutes;
      this.client = robot;
      this.onDone = cb;
      this.bus('home/coffee/brew_start', { for: robot.id, minutes: this.spec.brewMinutes });
      return true;
    }

    update(dtReal, dtSimMin) {
      // LED
      if (this.led) {
        const c = this.state === 'idle' ? 0x335533 : this.state === 'brewing' ? 0xff7700 : 0x33ff66;
        this.led.material.color.setHex(c);
        this.led.material.emissive.setHex(c);
        this.led.material.emissiveIntensity = this.state === 'brewing' ? 0.4 + Math.abs(Math.sin(Date.now() * 0.008)) : 0.8;
      }

      if (this.state === 'brewing') {
        this.brewLeft -= dtSimMin;
        // Steam animation
        const sw = this.spoutWorld();
        this.steam.forEach(s => {
          s.t += dtReal * 0.5;
          if (s.t > 1) s.t -= 1;
          s.mesh.position.set(sw.x + Math.sin(s.t * 9) * 0.02, sw.y + 0.06 + s.t * 0.22, sw.z);
          s.mesh.material.opacity = 0.5 * Math.sin(s.t * Math.PI);
          const sc = 0.6 + s.t * 1.2;
          s.mesh.scale.set(sc, sc, sc);
        });
        if (this.brewLeft <= 0) {
          this.steam.forEach(s => { s.mesh.material.opacity = 0; });
          this.state = 'dispensing';
          this.dispenseT = 0;
          this.cup = P().makeCup();
          const sw2 = this.spoutWorld();
          this.cup.position.set(sw2.x, sw2.y - 0.09, sw2.z);
          this.scene.add(this.cup);
          this.bus('home/coffee/brew_done', { for: this.client.id });
        }
      } else if (this.state === 'dispensing') {
        this.dispenseT += dtReal;
        const k = Math.min(this.dispenseT / 0.9, 1);
        const tray = new THREE.Vector3();
        this.client.trayAnchor.getWorldPosition(tray);
        const sw = this.spoutWorld();
        // Ease out, slight arc
        const e = 1 - Math.pow(1 - k, 2);
        this.cup.position.set(
          sw.x + (tray.x - sw.x) * e,
          sw.y - 0.09 + (tray.y - (sw.y - 0.09)) * e + Math.sin(e * Math.PI) * 0.05,
          sw.z + (tray.z - sw.z) * e
        );
        if (k >= 1) {
          this.client.attachCup(this.cup);
          this.bus('home/coffee/dispensed', { to: this.client.id });
          this.state = 'idle';
          const cb = this.onDone;
          this.cup = null; this.client = null; this.onDone = null;
          if (cb) cb();
        }
      }
    }
  }

  // ── Dock ──────────────────────────────────────────────────────────────────

  class Dock {
    constructor(scene, index, opts) {
      const { mkBox, mkCyl, add, mkSphere } = P();
      this.index = index;
      const g = new THREE.Group();
      const pad = add(g, mkBox(0.42, 0.015, 0.42, 0x2a2e38, { r: 0.7 }), 0, 0.008, 0);
      pad.receiveShadow = true;
      const trim = add(g, mkBox(0.46, 0.006, 0.46, 0x3a672a, { e: 0x44ff44, ei: 0.25, r: 0.6 }), 0, 0.003, 0);
      trim.castShadow = false;
      add(g, mkCyl(0.025, 0.22, 8, 0x333740, { r: 0.6 }), 0.18, 0.11, -0.18);
      this.led = add(g, mkSphere(0.016, 0x225522, { e: 0x44ff44, ei: 0.4 }), 0.18, 0.24, -0.18);
      this.led.castShadow = false;
      g.position.set(opts.x, 0, opts.z);
      scene.add(g);
      this.group = g;
      this.charging = false;
    }

    setCharging(on) {
      this.charging = on;
    }

    update() {
      if (this.led) {
        this.led.material.emissiveIntensity = this.charging
          ? 0.5 + Math.abs(Math.sin(Date.now() * 0.004)) : 0.35;
      }
    }
  }

  // ── Crate ─────────────────────────────────────────────────────────────────

  class Crate {
    constructor(scene, spec, opts) {
      const { mkBox, add } = P();
      const s = spec.size;
      const g = new THREE.Group();
      add(g, mkBox(s, s * 0.7, s, spec.color, { r: 0.9 }), 0, s * 0.35, 0);
      add(g, mkBox(s + 0.01, 0.03, s + 0.01, 0x6a4a28, { r: 0.9 }), 0, s * 0.18, 0);
      add(g, mkBox(s + 0.01, 0.03, s + 0.01, 0x6a4a28, { r: 0.9 }), 0, s * 0.52, 0);
      // Side handles
      add(g, mkBox(0.02, 0.025, 0.12, 0x4a3018, { r: 0.8 }), -(s / 2 + 0.01), s * 0.45, 0);
      add(g, mkBox(0.02, 0.025, 0.12, 0x4a3018, { r: 0.8 }), (s / 2 + 0.01), s * 0.45, 0);
      g.position.set(opts.x, 0, opts.z);
      scene.add(g);
      this.group = g;
      this.spec = spec;
    }

    setPos(x, y, z) { this.group.position.set(x, y, z); }
    get pos() { return this.group.position; }
  }

  SH.Devices = { Elevator, CoffeeMachine, Dock, Crate };

})(window.GF = window.GF || {});
