// GameFramework/framework/systems/ModelSystem.js
// 3D GLB/GLTF model viewing system using Three.js.
//
// Prerequisites — load these scripts BEFORE GameFramework.bundle.js:
//   <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
//   <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
//   <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
//
// Usage in GF.createGame opts:  { models: true }
// The system is registered as engine.getSystem('models') and also game.models.
//
// The ModelSystem creates its own WebGL canvas placed BEHIND the game canvas.
// Set engineConfig.backgroundColor = 'transparent' so the 2D canvas doesn't
// cover the 3D view.
//
// ── Modes ────────────────────────────────────────────────────────────────────
// Two interaction modes are supported:
//
//   • orbit  (default) — single model centred at origin; OrbitControls let the
//                        user rotate / pan / zoom around it.
//   • walk            — first-person mode. All loaded models are arranged in a
//                        circular gallery on pedestals; WASD moves and mouse
//                        (with pointer lock) looks. The user can physically
//                        walk around each model to see all sides.
//
// Switch with `system.setMode('walk' | 'orbit')`.
//
// ── Preset Models ────────────────────────────────────────────────────────────
// The framework owns asset paths for built-in 3D models. Games refer to them
// by name only:
//
//     await models.loadPreset('claude_3d');
//     await models.loadPreset('claudia_3d');
//
// New presets can be registered with `ModelSystem.registerPreset(name, path)`.

(function (GF) {
  'use strict';

  // ── Built-in preset registry ───────────────────────────────────────────────
  // Asset paths live HERE so games never need to know where the .glb files
  // sit on disk — they refer to models by name only.
  // Paths are resolved relative to the framework bundle location via
  // GF.resolvePath, so they work regardless of how deeply nested a game lives.
  const PRESETS = {
    'claude_3d':  '../Sprites/Claude/claude_3d.glb',
    'claudia_3d': '../Sprites/Claudia/claudia_3d.glb',
  };

  class ModelSystem {
    constructor(opts) {
      opts = opts || {};
      this.name = 'models';

      // Loaded model registry  ── { name: ModelData }
      // Each ModelData: { name, scene, animations, animationNames, meshCount,
      //                   matCount, mixer, actions, activeAction,
      //                   placed (bool), pedestal, label }
      this._models      = {};
      this._activeModel = null; // model focused in orbit mode / nearest in walk mode

      // Three.js objects
      this._scene       = null;
      this._camera      = null;
      this._renderer    = null;
      this._controls    = null;     // OrbitControls (orbit mode only)
      this._threeCanvas = null;

      this._gridHelper  = null;
      this._axesHelper  = null;

      // Environment (walk mode)
      this._floor       = null;
      this._envGroup    = null;     // pedestals, nameplates, etc.

      // First-person walking state
      this._mode          = 'orbit'; // 'orbit' | 'walk'
      this._fpYaw         = 0;        // radians
      this._fpPitch       = 0;        // radians (clamped)
      this._fpVelY        = 0;        // for jump (future)
      this._fpHeight      = 1.65;     // eye height in metres
      this._fpSpeed       = 4.0;      // walk speed (units/s)
      this._fpRunSpeed    = 8.0;      // shift-run speed
      this._fpLookSens    = 0.0022;   // mouse sensitivity
      this._pointerLocked = false;
      this._fpHintEl      = null;     // DOM element shown when not locked

      // Engine ref captured in init() so update() can read input
      this._engine = null;

      // Gallery layout config
      this._galleryRadius   = 4.5;
      this._galleryYRotation = 0;
      this._pedestalHeight  = 0.45;
      this._pedestalRadius  = 0.7;

      // Options / appearance
      this._bgColor  = opts.bgColor  !== undefined ? opts.bgColor  : 0x16161e;
      this._showGrid = opts.showGrid !== undefined ? opts.showGrid : true;
      this._showAxes = opts.showAxes !== undefined ? opts.showAxes : false;

      // Callbacks
      this._onModelLoaded = null;
      this._onModelError  = null;

      // Bound listeners (so we can remove them)
      this._onMouseMove        = this._onMouseMove.bind(this);
      this._onPointerLockChange = this._onPointerLockChange.bind(this);
      this._onCanvasClick      = this._onCanvasClick.bind(this);
    }

    // ─── Lifecycle ─────────────────────────────────────────────────────────────

    init(engine) {
      const THREE = window.THREE;
      if (!THREE) {
        console.error('[ModelSystem] window.THREE not found. Load Three.js before GameFramework.');
        return;
      }
      this._engine = engine;

      const W = engine.canvas.width;
      const H = engine.canvas.height;

      // ── Scene ──
      this._scene = new THREE.Scene();
      this._scene.background = new THREE.Color(this._bgColor);

      // ── Camera ──
      this._camera = new THREE.PerspectiveCamera(60, W / H, 0.01, 500);
      this._camera.position.set(0, 1.5, 4);

      // ── Renderer ──
      this._renderer = new THREE.WebGLRenderer({ antialias: true });
      this._renderer.setPixelRatio(window.devicePixelRatio || 1);
      this._renderer.setSize(W, H);
      this._renderer.shadowMap.enabled = true;
      this._renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
      try {
        this._renderer.outputEncoding   = THREE.sRGBEncoding;
        this._renderer.toneMapping      = THREE.ACESFilmicToneMapping;
        this._renderer.toneMappingExposure = 1.0;
      } catch (_) {}

      // ── Insert WebGL canvas BEHIND the engine canvas ──
      this._threeCanvas = this._renderer.domElement;
      this._threeCanvas.style.cssText =
        'position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;';

      const parent = engine.canvas.parentElement || document.body;
      parent.style.position = 'relative';
      parent.insertBefore(this._threeCanvas, engine.canvas);

      // The engine canvas is on top for 2D HUD overlays. Disable its pointer
      // events so 3D mouse interaction reaches the WebGL canvas underneath.
      engine.canvas.style.cssText +=
        ';position:absolute;top:0;left:0;z-index:1;background:transparent;pointer-events:none;';

      // ── Lights ──
      this._applyLighting('studio');

      // ── Helpers ──
      this._gridHelper = new THREE.GridHelper(20, 40, 0x3a3a5c, 0x2a2a44);
      this._gridHelper.visible = this._showGrid;
      this._scene.add(this._gridHelper);

      this._axesHelper = new THREE.AxesHelper(1);
      this._axesHelper.visible = this._showAxes;
      this._scene.add(this._axesHelper);

      // ── Environment group (walk mode) ──
      this._envGroup = new THREE.Group();
      this._envGroup.visible = false; // hidden until walk mode
      this._scene.add(this._envGroup);
      this._buildEnvironment();

      // ── Orbit controls (default mode) ──
      if (THREE.OrbitControls) {
        this._controls = new THREE.OrbitControls(this._camera, this._threeCanvas);
        this._controls.enableDamping  = true;
        this._controls.dampingFactor  = 0.06;
        this._controls.minDistance    = 0.2;
        this._controls.maxDistance    = 100;
        this._controls.target.set(0, 1, 0);
        this._controls.update();
      } else {
        console.warn('[ModelSystem] THREE.OrbitControls not found. Orbit controls disabled.');
      }

      // ── Walk-mode listeners (always installed, but only act in walk mode) ──
      this._threeCanvas.addEventListener('click', this._onCanvasClick);
      document.addEventListener('pointerlockchange', this._onPointerLockChange);
      document.addEventListener('mousemove', this._onMouseMove);

      // ── Walk-mode hint overlay ──
      this._createWalkHint(parent);

      // ── Default WASD bindings (do not clobber if the game already bound them) ──
      const inp = engine.input;
      if (inp) {
        if (!inp._bindings.walkForward)  inp.bind('walkForward',  'KeyW', 'ArrowUp');
        if (!inp._bindings.walkBackward) inp.bind('walkBackward', 'KeyS', 'ArrowDown');
        if (!inp._bindings.walkLeft)     inp.bind('walkLeft',     'KeyA', 'ArrowLeft');
        if (!inp._bindings.walkRight)    inp.bind('walkRight',    'KeyD', 'ArrowRight');
        if (!inp._bindings.walkRun)      inp.bind('walkRun',      'ShiftLeft', 'ShiftRight');
        if (!inp._bindings.walkUp)       inp.bind('walkUp',       'Space');
        if (!inp._bindings.walkDown)     inp.bind('walkDown',     'KeyQ', 'ControlLeft');
      }

      // ── Resize observer ──
      this._resizeObserver = new ResizeObserver(() => this._syncSize(engine));
      this._resizeObserver.observe(engine.canvas.parentElement || document.body);
    }

    _syncSize(engine) {
      if (!this._renderer) return;
      const W = engine.canvas.width;
      const H = engine.canvas.height;
      this._camera.aspect = W / H;
      this._camera.updateProjectionMatrix();
      this._renderer.setSize(W, H);
    }

    update(dt /*, engine */) {
      if (this._mode === 'orbit') {
        if (this._controls) this._controls.update();
      } else {
        this._updateWalk(dt);
      }
      // Advance every model's animation mixer (visible models only)
      Object.values(this._models).forEach(m => {
        if (m.mixer && m.scene.parent === this._scene) m.mixer.update(dt);
      });
    }

    render(/* ctx, engine */) {
      if (this._renderer && this._scene && this._camera) {
        this._renderer.render(this._scene, this._camera);
      }
    }

    destroy() {
      if (this._resizeObserver) this._resizeObserver.disconnect();
      Object.values(this._models).forEach(m => m.mixer && m.mixer.stopAllAction());

      if (this._threeCanvas) {
        this._threeCanvas.removeEventListener('click', this._onCanvasClick);
      }
      document.removeEventListener('pointerlockchange', this._onPointerLockChange);
      document.removeEventListener('mousemove', this._onMouseMove);

      if (this._fpHintEl && this._fpHintEl.parentElement) {
        this._fpHintEl.parentElement.removeChild(this._fpHintEl);
      }
      if (document.pointerLockElement) document.exitPointerLock();

      if (this._renderer) {
        this._renderer.dispose();
        if (this._threeCanvas && this._threeCanvas.parentElement) {
          this._threeCanvas.parentElement.removeChild(this._threeCanvas);
        }
      }
    }

    // ─── Lighting Presets ──────────────────────────────────────────────────────

    _lightRefs = [];

    _applyLighting(preset) {
      const THREE = window.THREE;
      this._lightRefs.forEach(l => this._scene.remove(l));
      this._lightRefs = [];

      const add = (...lights) => {
        lights.forEach(l => { this._scene.add(l); this._lightRefs.push(l); });
      };

      if (preset === 'studio') {
        const amb  = new THREE.AmbientLight(0xffffff, 0.35);
        const key  = new THREE.DirectionalLight(0xffffff, 1.1);
        key.position.set(5, 8, 5);
        key.castShadow = true;
        key.shadow.mapSize.set(1024, 1024);
        const fill = new THREE.DirectionalLight(0x8899ff, 0.25);
        fill.position.set(-5, 3, -3);
        const rim  = new THREE.DirectionalLight(0xffeedd, 0.2);
        rim.position.set(0, 6, -8);
        add(amb, key, fill, rim);

      } else if (preset === 'outdoor') {
        const sky = new THREE.AmbientLight(0x87ceeb, 0.45);
        const sun = new THREE.DirectionalLight(0xfff4cc, 1.3);
        sun.position.set(10, 20, 8);
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        add(sky, sun);

      } else if (preset === 'dramatic') {
        const amb  = new THREE.AmbientLight(0x0a0a1a, 0.15);
        const spot = new THREE.SpotLight(0xff7700, 2.5);
        spot.position.set(4, 9, 4);
        spot.castShadow = true;
        spot.angle = Math.PI / 7;
        spot.penumbra = 0.3;
        const cold = new THREE.PointLight(0x0055ff, 1.0, 20);
        cold.position.set(-6, 2, -4);
        add(amb, spot, cold);

      } else if (preset === 'flat') {
        const amb = new THREE.AmbientLight(0xffffff, 1.0);
        add(amb);
      }

      this._currentLightPreset = preset;
    }

    // ─── Environment (walk mode) ──────────────────────────────────────────────

    _buildEnvironment() {
      const THREE = window.THREE;

      // Floor — a 30x30 plane with a subtle two-tone radial fade.
      const floorGeo = new THREE.PlaneGeometry(40, 40, 1, 1);
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x252535, roughness: 0.95, metalness: 0.0,
      });
      this._floor = new THREE.Mesh(floorGeo, floorMat);
      this._floor.rotation.x = -Math.PI / 2;
      this._floor.position.y = 0;
      this._floor.receiveShadow = true;
      this._envGroup.add(this._floor);

      // Faint perimeter ring of lamp posts to anchor the space visually.
      const postCount = 8;
      const postRadius = 12;
      for (let i = 0; i < postCount; i++) {
        const a = (i / postCount) * Math.PI * 2;
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 3, 8),
          new THREE.MeshStandardMaterial({ color: 0x1a1a26, roughness: 0.9 })
        );
        post.position.set(Math.cos(a) * postRadius, 1.5, Math.sin(a) * postRadius);
        post.castShadow = true;
        this._envGroup.add(post);

        const lamp = new THREE.PointLight(0xffd699, 0.7, 8, 1.6);
        lamp.position.set(Math.cos(a) * postRadius, 3.0, Math.sin(a) * postRadius);
        this._envGroup.add(lamp);

        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0xffe2b0 })
        );
        bulb.position.copy(lamp.position);
        this._envGroup.add(bulb);
      }
    }

    // ─── Mode switching ───────────────────────────────────────────────────────

    /**
     * Switch interaction mode.
     * @param {'orbit'|'walk'} mode
     */
    setMode(mode) {
      if (mode !== 'orbit' && mode !== 'walk') {
        console.warn('[ModelSystem] Unknown mode:', mode);
        return;
      }
      if (mode === this._mode) return;
      this._mode = mode;

      if (mode === 'walk') {
        // Disable orbit controls
        if (this._controls) this._controls.enabled = false;

        // Show environment, arrange every loaded model in the gallery
        this._envGroup.visible = true;
        if (this._gridHelper) this._gridHelper.visible = false;
        this._showAllModels();
        this._arrangeAsGallery();

        // Place camera at start position outside the gallery, facing centre
        const startDist = this._galleryRadius + 3;
        this._camera.position.set(0, this._fpHeight, startDist);
        this._fpYaw   = Math.PI;   // face -Z (toward gallery centre)
        this._fpPitch = 0;
        this._applyFpRotation();

        if (this._fpHintEl) this._fpHintEl.style.display = 'block';

      } else {
        // Back to orbit
        if (this._controls) this._controls.enabled = true;
        this._envGroup.visible = false;
        if (this._gridHelper) this._gridHelper.visible = this._showGrid;

        if (document.pointerLockElement) document.exitPointerLock();
        this._pointerLocked = false;
        if (this._fpHintEl) this._fpHintEl.style.display = 'none';

        // Hide all but the active model and re-centre it
        this._showOnlyActive();

        this._camera.position.set(0, 1.5, 4);
        if (this._controls) {
          this._controls.target.set(0, 1, 0);
          this._controls.update();
        }
      }
      if (this._engine && this._engine.events) {
        this._engine.events.emit('models:modeChanged', mode);
      }
    }

    getMode() { return this._mode; }

    // ─── Walk-mode controls ──────────────────────────────────────────────────

    _onCanvasClick(/* e */) {
      if (this._mode !== 'walk') return;
      if (!this._pointerLocked && this._threeCanvas.requestPointerLock) {
        // Browsers throttle re-locking for ~1.25s after Esc, but the request
        // simply fails silently in that window — no harm in calling it.
        try { this._threeCanvas.requestPointerLock(); } catch (_) {}
      }
    }

    _onPointerLockChange() {
      this._pointerLocked = (document.pointerLockElement === this._threeCanvas);
      if (this._fpHintEl) {
        this._fpHintEl.style.display =
          (this._mode === 'walk' && !this._pointerLocked) ? 'block' : 'none';
      }
    }

    _onMouseMove(e) {
      if (this._mode !== 'walk' || !this._pointerLocked) return;
      const dx = e.movementX || 0;
      const dy = e.movementY || 0;
      this._fpYaw   -= dx * this._fpLookSens;
      this._fpPitch -= dy * this._fpLookSens;
      const lim = Math.PI / 2 - 0.05;
      if (this._fpPitch >  lim) this._fpPitch =  lim;
      if (this._fpPitch < -lim) this._fpPitch = -lim;
      this._applyFpRotation();
    }

    _applyFpRotation() {
      // Yaw around Y, then pitch around X.
      const e = this._camera.rotation;
      e.order = 'YXZ';
      e.y = this._fpYaw;
      e.x = this._fpPitch;
      e.z = 0;
    }

    _updateWalk(dt) {
      const inp = this._engine && this._engine.input;
      if (!inp) return;

      const fwd  = inp.isDown('walkForward')  ? 1 : 0;
      const back = inp.isDown('walkBackward') ? 1 : 0;
      const lft  = inp.isDown('walkLeft')     ? 1 : 0;
      const rgt  = inp.isDown('walkRight')    ? 1 : 0;
      const run  = inp.isDown('walkRun');

      // Movement vector in camera-local space: -Z is forward, +X is right.
      let mz = (back - fwd);
      let mx = (rgt  - lft);
      const len = Math.hypot(mx, mz);
      if (len > 0) { mx /= len; mz /= len; }

      // Rotate by yaw to get world-space delta
      const speed = run ? this._fpRunSpeed : this._fpSpeed;
      const cosY = Math.cos(this._fpYaw);
      const sinY = Math.sin(this._fpYaw);
      const wx =  mx * cosY + mz * sinY;
      const wz = -mx * sinY + mz * cosY;

      const dx = wx * speed * dt;
      const dz = wz * speed * dt;
      this._camera.position.x += dx;
      this._camera.position.z += dz;

      // Clamp to floor area (keep player inside the 40x40 plane minus a margin)
      const HALF = 19;
      if (this._camera.position.x >  HALF) this._camera.position.x =  HALF;
      if (this._camera.position.x < -HALF) this._camera.position.x = -HALF;
      if (this._camera.position.z >  HALF) this._camera.position.z =  HALF;
      if (this._camera.position.z < -HALF) this._camera.position.z = -HALF;

      // Keep eye height fixed
      this._camera.position.y = this._fpHeight;
    }

    _createWalkHint(parent) {
      const el = document.createElement('div');
      el.id = 'gf-walk-hint';
      el.style.cssText = [
        'position:absolute', 'left:50%', 'bottom:42px', 'transform:translateX(-50%)',
        'padding:10px 16px', 'border-radius:8px',
        'background:rgba(8,8,18,0.78)', 'border:1px solid rgba(100,100,180,0.35)',
        'color:#aabbff', 'font:600 12px "Segoe UI",system-ui,sans-serif',
        'letter-spacing:0.5px', 'pointer-events:none', 'z-index:5',
        'display:none', 'text-align:center', 'box-shadow:0 6px 24px rgba(0,0,0,0.4)',
      ].join(';');
      el.innerHTML =
        '<div style="font-size:13px;color:#ccd5ff;">Click to look around</div>' +
        '<div style="margin-top:4px;color:#7788bb;font-weight:400;">' +
        'WASD — move &nbsp;·&nbsp; Mouse — look &nbsp;·&nbsp; Shift — run &nbsp;·&nbsp; Esc — release</div>';
      parent.appendChild(el);
      this._fpHintEl = el;
    }

    // ─── Gallery placement ───────────────────────────────────────────────────

    /**
     * Arrange every loaded model in a circle around origin, each on a pedestal.
     * Called automatically when entering walk mode but can be called manually
     * (e.g. after loading new models while already in walk mode).
     */
    _arrangeAsGallery() {
      const THREE = window.THREE;
      const names = Object.keys(this._models);
      if (!names.length) return;

      // Clear out previous pedestals
      Object.values(this._models).forEach(m => {
        if (m.pedestal) {
          this._scene.remove(m.pedestal);
          m.pedestal = null;
        }
      });

      const N = names.length;
      // Choose a radius proportional to model count so big galleries don't crowd
      const r = Math.max(this._galleryRadius, 1.6 + N * 0.45);

      names.forEach((name, i) => {
        const a = (i / N) * Math.PI * 2 + this._galleryYRotation;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;

        const m = this._models[name];

        // Pedestal: short cylinder
        const pedGroup = new THREE.Group();
        const ped = new THREE.Mesh(
          new THREE.CylinderGeometry(this._pedestalRadius, this._pedestalRadius * 1.05,
                                     this._pedestalHeight, 24),
          new THREE.MeshStandardMaterial({ color: 0x2a2c3c, roughness: 0.7, metalness: 0.05 })
        );
        ped.position.y = this._pedestalHeight / 2;
        ped.castShadow = true;
        ped.receiveShadow = true;
        pedGroup.add(ped);

        // Nameplate (sprite-text)
        const label = this._makeLabel(name);
        if (label) {
          label.position.set(0, this._pedestalHeight + 2.6, 0);
          pedGroup.add(label);
        }

        pedGroup.position.set(x, 0, z);
        // Models face the gallery centre
        pedGroup.rotation.y = -a + Math.PI / 2;
        this._scene.add(pedGroup);
        m.pedestal = pedGroup;

        // Position the model on top of the pedestal
        m.scene.position.set(x, this._pedestalHeight, z);
        m.scene.rotation.y = -a + Math.PI / 2; // face inward
      });
    }

    _makeLabel(text) {
      const THREE = window.THREE;
      // Render text to a canvas, use as sprite texture
      const cvs = document.createElement('canvas');
      cvs.width = 512; cvs.height = 128;
      const c = cvs.getContext('2d');
      c.clearRect(0, 0, cvs.width, cvs.height);

      // Background pill
      const padX = 24, padY = 18;
      c.font = 'bold 56px "Segoe UI", system-ui, sans-serif';
      const w = Math.min(cvs.width - 16, c.measureText(text).width + padX * 2);
      const h = 100;
      const x0 = (cvs.width - w) / 2;
      const y0 = (cvs.height - h) / 2;
      c.fillStyle = 'rgba(20,22,40,0.85)';
      _roundedRect(c, x0, y0, w, h, 14); c.fill();
      c.strokeStyle = 'rgba(120,140,220,0.6)'; c.lineWidth = 2;
      _roundedRect(c, x0, y0, w, h, 14); c.stroke();

      c.fillStyle = '#ccddff';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(text, cvs.width / 2, cvs.height / 2 + 4);

      const tex = new THREE.CanvasTexture(cvs);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
      const sprite = new THREE.Sprite(mat);
      // Scale based on text width so labels look uniform
      sprite.scale.set(2.0, 0.5, 1);
      return sprite;
    }

    /** Add every loaded model's scene to the THREE scene (walk mode). */
    _showAllModels() {
      Object.values(this._models).forEach(m => {
        if (m.scene.parent !== this._scene) this._scene.add(m.scene);
        // Reset to origin; arrangeAsGallery will reposition.
        m.scene.position.set(0, 0, 0);
        m.scene.rotation.set(0, 0, 0);
        // Auto-play first animation if any
        if (m.mixer && m.animationNames.length > 0 && !m.activeAction) {
          this._playClipOn(m, m.animationNames[0]);
        }
      });
    }

    /** Show only the active model, hide all others (orbit mode). */
    _showOnlyActive() {
      Object.values(this._models).forEach(m => {
        if (m === this._activeModel) {
          if (m.scene.parent !== this._scene) this._scene.add(m.scene);
          m.scene.position.set(0, 0, 0);
          m.scene.rotation.set(0, 0, 0);
        } else {
          if (m.scene.parent === this._scene) this._scene.remove(m.scene);
          if (m.pedestal && m.pedestal.parent === this._scene) {
            this._scene.remove(m.pedestal);
            m.pedestal = null;
          }
        }
      });
    }

    // ─── Model loading ────────────────────────────────────────────────────────

    /**
     * Load a GLB/GLTF from a File object (e.g. from <input type="file">).
     * @param {File} file
     * @param {string} [nameOverride]
     * @returns {Promise<ModelData>}
     */
    loadFromFile(file, nameOverride) {
      if (!window.THREE || !window.THREE.GLTFLoader) {
        return Promise.reject(new Error('[ModelSystem] THREE.GLTFLoader not found.'));
      }
      const name = nameOverride || file.name.replace(/\.(glb|gltf)$/i, '');
      const url  = URL.createObjectURL(file);
      return this._loadURL(url, name).then(data => {
        URL.revokeObjectURL(url);
        return data;
      });
    }

    /**
     * Load a GLB/GLTF from a URL.
     * @param {string} url
     * @param {string} [name]
     * @returns {Promise<ModelData>}
     */
    loadFromURL(url, name) {
      name = name || url.split('/').pop().replace(/\.(glb|gltf)$/i, '');
      return this._loadURL(url, name);
    }

    /**
     * Load a preset model registered with the framework. Asset paths are owned
     * by the framework — games refer to models by name only.
     * @param {string} presetName
     * @returns {Promise<ModelData>}
     */
    loadPreset(presetName) {
      const rel = PRESETS[presetName];
      if (!rel) return Promise.reject(new Error('[ModelSystem] Unknown preset: ' + presetName));
      const url = (GF && GF.resolvePath) ? GF.resolvePath(rel) : rel;
      return this.loadFromURL(url, presetName);
    }

    /** Register or override a preset model path. */
    static registerPreset(name, relativePath) {
      PRESETS[name] = relativePath;
    }
    /** List all registered preset names. */
    static listPresets() { return Object.keys(PRESETS); }

    _loadURL(url, name) {
      return new Promise((resolve, reject) => {
        const loader = new window.THREE.GLTFLoader();
        loader.load(
          url,
          gltf => {
            const data = this._processGLTF(gltf, name);
            this._models[name] = data;
            // Auto-place into the gallery if we're already in walk mode
            if (this._mode === 'walk') {
              if (data.scene.parent !== this._scene) this._scene.add(data.scene);
              this._arrangeAsGallery();
              if (data.mixer && data.animationNames.length > 0) {
                this._playClipOn(data, data.animationNames[0]);
              }
            }
            if (this._onModelLoaded) this._onModelLoaded(name, data);
            resolve(data);
          },
          undefined,
          err => {
            console.error('[ModelSystem] Load failed:', name, err);
            if (this._onModelError) this._onModelError(name, err);
            reject(err);
          }
        );
      });
    }

    _processGLTF(gltf, name) {
      const THREE = window.THREE;
      const root  = gltf.scene || gltf.scenes[0];

      // Auto-fit: centre model and scale so its longest dimension = 2 units
      const box    = new THREE.Box3().setFromObject(root);
      const size   = box.getSize(new THREE.Vector3());
      const centre = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale  = 2.0 / maxDim;

      root.scale.setScalar(scale);
      root.position.x -= centre.x * scale;
      root.position.z -= centre.z * scale;
      root.position.y -= box.min.y * scale;   // sit model on the ground plane

      // Enable shadows on all meshes
      root.traverse(child => {
        if (child.isMesh) {
          child.castShadow    = true;
          child.receiveShadow = true;
        }
      });

      // Gather stats
      const matSet = new Set();
      let meshCount = 0;
      root.traverse(child => {
        if (!child.isMesh) return;
        meshCount++;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(m => matSet.add(m));
      });

      const animations    = gltf.animations || [];
      const animationNames = animations.map(a => a.name);

      // Per-model mixer + actions (so multiple models can animate at once)
      const mixer   = animations.length ? new THREE.AnimationMixer(root) : null;
      const actions = {};
      if (mixer) animations.forEach(c => { actions[c.name] = mixer.clipAction(c); });

      return {
        name, scene: root, animations, animationNames,
        meshCount, matCount: matSet.size,
        mixer, actions, activeAction: null, pedestal: null,
      };
    }

    /**
     * In orbit mode: bring this model to centre stage (hides others).
     * In walk mode: simply mark it as active for animation panel highlights.
     */
    showModel(name) {
      const data = this._models[name];
      if (!data) { console.warn('[ModelSystem] Unknown model:', name); return; }
      this._activeModel = data;

      if (this._mode === 'orbit') {
        this._showOnlyActive();
        // Re-apply wireframe if toggled
        if (this._wireframe) this.setWireframe(true);
        // Auto-play first animation
        if (data.mixer && data.animationNames[0]) this.playAnimation(data.animationNames[0]);
      }
    }

    removeModel(name) {
      const m = this._models[name];
      if (!m) return;
      if (m.mixer) m.mixer.stopAllAction();
      if (m.scene.parent === this._scene) this._scene.remove(m.scene);
      if (m.pedestal && m.pedestal.parent === this._scene) this._scene.remove(m.pedestal);
      if (this._activeModel === m) this._activeModel = null;
      delete this._models[name];

      if (this._mode === 'walk') this._arrangeAsGallery();
    }

    getModelNames()   { return Object.keys(this._models); }
    getActiveModel()  { return this._activeModel; }

    // ─── Animation ────────────────────────────────────────────────────────────

    _playClipOn(model, name) {
      const action = model.actions[name];
      if (!action) return;
      if (model.activeAction && model.activeAction !== action) {
        model.activeAction.fadeOut(0.25);
      }
      model.activeAction = action;
      action.reset().fadeIn(0.25).play();
    }

    /** Play an animation by name on the active model. */
    playAnimation(name) {
      if (!this._activeModel) return;
      this._playClipOn(this._activeModel, name);
    }

    stopAnimation() {
      if (!this._activeModel) return;
      const m = this._activeModel;
      if (m.activeAction) { m.activeAction.fadeOut(0.25); m.activeAction = null; }
    }

    getActiveAnimationName() {
      const m = this._activeModel;
      return (m && m.activeAction) ? m.activeAction.getClip().name : null;
    }

    // ─── Scene Controls ──────────────────────────────────────────────────────

    resetCamera() {
      if (!this._camera) return;
      if (this._mode === 'walk') {
        const startDist = this._galleryRadius + 3;
        this._camera.position.set(0, this._fpHeight, startDist);
        this._fpYaw = Math.PI; this._fpPitch = 0;
        this._applyFpRotation();
      } else {
        this._camera.position.set(0, 1.5, 4);
        if (this._controls) { this._controls.target.set(0, 1, 0); this._controls.update(); }
      }
    }

    setLighting(preset) { this._applyLighting(preset); }

    showGrid(visible) {
      this._showGrid = visible;
      // Grid is hidden in walk mode regardless; in orbit it follows the toggle
      if (this._gridHelper && this._mode === 'orbit') this._gridHelper.visible = visible;
    }

    showAxes(visible) {
      if (this._axesHelper) this._axesHelper.visible = visible;
    }

    setWireframe(enabled) {
      this._wireframe = enabled;
      Object.values(this._models).forEach(m => {
        m.scene.traverse(child => {
          if (!child.isMesh) return;
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach(mat => { mat.wireframe = enabled; });
        });
      });
    }

    setBackground(colorHex) {
      this._bgColor = colorHex;
      if (this._scene) this._scene.background = new window.THREE.Color(colorHex);
    }

    /** Adjust walking speed (units/second). */
    setWalkSpeed(speed, runSpeed) {
      if (typeof speed === 'number')    this._fpSpeed    = speed;
      if (typeof runSpeed === 'number') this._fpRunSpeed = runSpeed;
    }

    /** Adjust mouse-look sensitivity (radians per pixel). */
    setLookSensitivity(s) { this._fpLookSens = s; }

    // ─── Event Hooks ─────────────────────────────────────────────────────────

    /** fn(name, modelData) called after each successful load */
    onModelLoaded(fn) { this._onModelLoaded = fn; }

    /** fn(name, error) called on load failure */
    onError(fn) { this._onModelError = fn; }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function _roundedRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  GF.ModelSystem = ModelSystem;

})(window.GF = window.GF || {});
