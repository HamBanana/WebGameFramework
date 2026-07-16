// GameFramework/games/SwarmHome/core/CameraDirector.js
// Manages every viewpoint in the sim:
//   • free orbit camera (mouse: rotate / pan / wheel zoom)
//   • each robot's mast camera (the view its ESP32 would actually stream)
//   • fixed device cams (kitchen machine cam, bedside cam, corner overview)
// plus an optional picture-in-picture inset rendered with a scissor pass.
//
// Registered as an engine system AFTER Three3DScene so its render() runs
// right after the main 3D pass (engine renders systems in add order).

(function (GF) {
  'use strict';

  const SH = GF.SwarmHome = GF.SwarmHome || {};

  class CameraDirector {
    constructor(engine, three, cfg) {
      this.name = 'camDirector';
      this.engine = engine;
      this.three = three;
      this.cfg = cfg;
      this.W = cfg.engine.width;
      this.H = cfg.engine.height;
      this.cams = [];               // { id, label, getCam }
      this.activeIdx = 0;
      this.pip = !!cfg.camera.pip;
      this.lastRobotIdx = -1;

      // Orbit camera
      this.orbitCam = new THREE.PerspectiveCamera(55, this.W / this.H, 0.05, 100);
      this.orbitCam.position.set(4.2, 4.4, 4.6);
      this.controls = new THREE.OrbitControls(this.orbitCam, engine.canvas);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.08;
      this.controls.maxPolarAngle = Math.PI * 0.495;
      this.controls.minDistance = 0.5;
      this.controls.maxDistance = 18;
      this.controls.target.set(0, 0.3, 0);
      this.controls.update();

      this.addCam('orbit', 'Free orbit', () => this.orbitCam);
    }

    addCam(id, label, getCam, isRobot) {
      this.cams.push({ id, label, getCam, isRobot: !!isRobot });
    }

    /** Fixed cam helper: position + lookAt, registered under id/label. */
    addFixedCam(id, label, pos, look, fov) {
      const cam = new THREE.PerspectiveCamera(fov || 60, this.W / this.H, 0.02, 60);
      cam.position.set(pos.x, pos.y, pos.z);
      cam.lookAt(look.x, look.y, look.z);
      this.addCam(id, label, () => cam);
    }

    get active() { return this.cams[this.activeIdx]; }

    setActive(id) {
      const i = this.cams.findIndex(c => c.id === id);
      if (i >= 0) {
        this.activeIdx = i;
        if (this.cams[i].isRobot) this.lastRobotIdx = i;
        this.controls.enabled = (this.cams[i].id === 'orbit');
      }
    }

    cycle() {
      this.activeIdx = (this.activeIdx + 1) % this.cams.length;
      if (this.active.isRobot) this.lastRobotIdx = this.activeIdx;
      this.controls.enabled = (this.active.id === 'orbit');
    }

    /** The camera shown in the PiP inset (null = no pip this frame). */
    pipCamEntry() {
      if (!this.pip) return null;
      if (this.active.id === 'orbit') {
        // Orbit fullscreen → inset shows a robot's POV
        const idx = this.lastRobotIdx >= 0 ? this.lastRobotIdx : this.cams.findIndex(c => c.isRobot);
        if (idx < 0 || idx === this.activeIdx) return null;
        return this.cams[idx];
      }
      // POV fullscreen → inset shows the orbit overview for context
      return this.cams[0];
    }

    pipRect() {
      const pw = Math.round(this.W * 0.27);
      const ph = Math.round(pw * 9 / 16);
      return { x: this.W - pw - 14, y: this.H - ph - 14, w: pw, h: ph };
    }

    update(dt) {
      const inp = this.engine.input;
      const hot = [
        ['camOrbit', 'orbit'], ['camR1', 'R1'], ['camR2', 'R2'], ['camR3', 'R3'],
        ['camR4', 'R4'], ['camKitchen', 'kitchen'], ['camBed', 'bedside'], ['camCorner', 'corner'],
      ];
      hot.forEach(([action, id]) => {
        if (inp.wasPressed(action)) this.setActive(id);
      });
      if (inp.wasPressed('camCycle')) this.cycle();
      if (inp.wasPressed('pipToggle')) this.pip = !this.pip;

      if (this.controls.enabled) this.controls.update();

      // Hand the active camera to Three3DScene for the main pass
      const cam = this.active.getCam();
      if (cam) {
        if (cam.aspect !== this.W / this.H) {
          cam.aspect = this.W / this.H;
          cam.updateProjectionMatrix();
        }
        this.three.setCamera(cam);
      }
    }

    // Runs after Three3DScene.render (system add order) → PiP scissor pass
    render() {
      const entry = this.pipCamEntry();
      if (!entry) return;
      const cam = entry.getCam();
      if (!cam) return;

      const r = this.three.renderer;
      const { x, y, w, h } = this.pipRect();
      // WebGL viewport origin is bottom-left
      const glY = this.H - y - h;

      if (cam.aspect !== w / h) {
        cam.aspect = w / h;
        cam.updateProjectionMatrix();
      }

      const oldAutoClear = r.autoClear;
      r.autoClear = false;
      r.clearDepth();
      r.setScissorTest(true);
      r.setScissor(x, glY, w, h);
      r.setViewport(x, glY, w, h);
      r.render(this.three.scene, cam);
      r.setScissorTest(false);
      r.setViewport(0, 0, this.W, this.H);
      r.autoClear = oldAutoClear;
    }
  }

  SH.CameraDirector = CameraDirector;

})(window.GF = window.GF || {});
