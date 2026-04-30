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

(function (GF) {
  'use strict';

  class ModelSystem {
    constructor(opts) {
      opts = opts || {};
      this.name = 'models';

      // Internal state
      this._models       = {};          // { name: ModelData }
      this._activeModel  = null;        // currently shown ModelData
      this._mixer        = null;        // THREE.AnimationMixer
      this._actions      = {};          // { clipName: AnimationAction }
      this._activeAction = null;

      // Three.js objects
      this._scene    = null;
      this._camera   = null;
      this._renderer = null;
      this._controls = null;
      this._threeCanvas = null;         // the WebGL canvas element

      this._gridHelper  = null;
      this._axesHelper  = null;

      // Options
      this._bgColor  = opts.bgColor  !== undefined ? opts.bgColor  : 0x16161e;
      this._showGrid = opts.showGrid !== undefined ? opts.showGrid : true;
      this._showAxes = opts.showAxes !== undefined ? opts.showAxes : false;

      // Callbacks
      this._onModelLoaded = null;
      this._onModelError  = null;
    }

    // ─── Lifecycle ─────────────────────────────────────────────────────────────

    init(engine) {
      const THREE = window.THREE;
      if (!THREE) {
        console.error('[ModelSystem] window.THREE not found. Load Three.js before GameFramework.');
        return;
      }

      const W = engine.canvas.width;
      const H = engine.canvas.height;

      // ── Three.js Scene ──
      this._scene = new THREE.Scene();
      this._scene.background = new THREE.Color(this._bgColor);

      // ── Camera ──
      this._camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 500);
      this._camera.position.set(0, 1.5, 4);

      // ── Renderer ──
      this._renderer = new THREE.WebGLRenderer({ antialias: true });
      this._renderer.setPixelRatio(window.devicePixelRatio || 1);
      this._renderer.setSize(W, H);
      this._renderer.shadowMap.enabled = true;
      this._renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
      try {
        // r128 uses outputEncoding; newer builds use outputColorSpace
        this._renderer.outputEncoding   = THREE.sRGBEncoding;
        this._renderer.toneMapping      = THREE.ACESFilmicToneMapping;
        this._renderer.toneMappingExposure = 1.0;
      } catch (_) {}

      // ── Insert WebGL canvas BEHIND the game canvas ──
      this._threeCanvas = this._renderer.domElement;
      this._threeCanvas.style.cssText =
        'position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;';

      const parent = engine.canvas.parentElement || document.body;
      parent.style.position = 'relative';
      parent.insertBefore(this._threeCanvas, engine.canvas);

      // Make game canvas transparent & on top
      engine.canvas.style.cssText +=
        ';position:absolute;top:0;left:0;z-index:1;background:transparent;';

      // ── Lights ──
      this._applyLighting('studio');

      // ── Grid helper ──
      this._gridHelper = new THREE.GridHelper(10, 20, 0x3a3a5c, 0x2a2a44);
      this._gridHelper.visible = this._showGrid;
      this._scene.add(this._gridHelper);

      // ── Axes helper ──
      this._axesHelper = new THREE.AxesHelper(1);
      this._axesHelper.visible = this._showAxes;
      this._scene.add(this._axesHelper);

      // ── Orbit controls ──
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

      // ── Sync renderer size when engine canvas resizes ──
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
      if (this._controls) this._controls.update();
      if (this._mixer)    this._mixer.update(dt);
    }

    render(/* ctx, engine */) {
      // Three.js renders to its own canvas — no 2D ctx ops needed
      if (this._renderer && this._scene && this._camera) {
        this._renderer.render(this._scene, this._camera);
      }
    }

    destroy() {
      if (this._resizeObserver) this._resizeObserver.disconnect();
      if (this._mixer) this._mixer.stopAllAction();
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

    // ─── Model Management ─────────────────────────────────────────────────────

    /**
     * Load a GLB/GLTF from a File object (e.g. from <input type="file">).
     * @param {File} file
     * @param {string} [nameOverride]  optional display name
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

    _loadURL(url, name) {
      return new Promise((resolve, reject) => {
        const loader = new window.THREE.GLTFLoader();
        loader.load(
          url,
          gltf => {
            const data = this._processGLTF(gltf, name);
            this._models[name] = data;
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

      return { name, scene: root, animations, animationNames, meshCount, matCount: matSet.size };
    }

    /**
     * Make the named model visible in the 3D scene.
     * @param {string} name
     */
    showModel(name) {
      const THREE = window.THREE;

      // Tear down current model
      if (this._activeModel) {
        this._scene.remove(this._activeModel.scene);
        if (this._mixer) {
          this._mixer.stopAllAction();
          this._mixer = null;
        }
        this._actions      = {};
        this._activeAction = null;
      }

      const data = this._models[name];
      if (!data) { console.warn('[ModelSystem] Unknown model:', name); return; }

      this._activeModel = data;
      this._scene.add(data.scene);

      // Re-apply wireframe if toggled
      if (this._wireframe) this.setWireframe(true);

      // Create animation mixer
      if (data.animations.length > 0) {
        this._mixer = new THREE.AnimationMixer(data.scene);
        data.animations.forEach(clip => {
          this._actions[clip.name] = this._mixer.clipAction(clip);
        });
        // Auto-play first animation
        if (data.animationNames[0]) this.playAnimation(data.animationNames[0]);
      }
    }

    removeModel(name) {
      if (this._activeModel && this._activeModel.name === name) {
        this._scene.remove(this._activeModel.scene);
        this._activeModel = null;
        if (this._mixer) { this._mixer.stopAllAction(); this._mixer = null; }
        this._actions = {}; this._activeAction = null;
      }
      delete this._models[name];
    }

    getModelNames()   { return Object.keys(this._models); }
    getActiveModel()  { return this._activeModel; }

    // ─── Animation ────────────────────────────────────────────────────────────

    playAnimation(name) {
      const action = this._actions[name];
      if (!action) return;
      if (this._activeAction && this._activeAction !== action) {
        this._activeAction.fadeOut(0.25);
      }
      this._activeAction = action;
      this._activeAction.reset().fadeIn(0.25).play();
    }

    stopAnimation() {
      if (this._activeAction) { this._activeAction.fadeOut(0.25); this._activeAction = null; }
    }

    getActiveAnimationName() {
      return this._activeAction ? this._activeAction.getClip().name : null;
    }

    // ─── Scene Controls ──────────────────────────────────────────────────────

    resetCamera() {
      if (!this._camera) return;
      this._camera.position.set(0, 1.5, 4);
      if (this._controls) { this._controls.target.set(0, 1, 0); this._controls.update(); }
    }

    setLighting(preset) { this._applyLighting(preset); }

    showGrid(visible) {
      if (this._gridHelper) this._gridHelper.visible = visible;
    }

    showAxes(visible) {
      if (this._axesHelper) this._axesHelper.visible = visible;
    }

    setWireframe(enabled) {
      this._wireframe = enabled;
      if (!this._activeModel) return;
      this._activeModel.scene.traverse(child => {
        if (!child.isMesh) return;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(m => { m.wireframe = enabled; });
      });
    }

    setBackground(colorHex) {
      this._bgColor = colorHex;
      if (this._scene) this._scene.background = new window.THREE.Color(colorHex);
    }

    // ─── Event Hooks ─────────────────────────────────────────────────────────

    /** fn(name, modelData) called after each successful load */
    onModelLoaded(fn) { this._onModelLoaded = fn; }

    /** fn(name, error) called on load failure */
    onError(fn) { this._onModelError = fn; }
  }

  GF.ModelSystem = ModelSystem;

})(window.GF = window.GF || {});
