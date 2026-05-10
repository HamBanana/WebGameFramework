// GameFramework/framework/systems/Three3DScene.js
// A reusable Three.js host system for games that want full 3D worlds.
//
// Unlike ModelSystem (which loads GLB files and runs orbit / walk gallery
// modes), Three3DScene is a thin renderer that the game itself populates with
// procedural meshes. Games can swap entire 3D scenes per game-scene transition
// via clearScene().
//
// Prerequisites — load Three.js BEFORE GameFramework.bundle.js:
//   <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
//
// Set engineConfig.backgroundColor = 'transparent' so the 2D canvas doesn't
// cover the 3D view.
//
// Usage:
//   const three = new GF.Three3DScene({ bgColor: 0x0a0a14 });
//   engine.addSystem(three);
//   // From a Scene's init():
//   const cube = new THREE.Mesh(geometry, material);
//   three.add(cube);                  // tracked, removable in bulk later
//   three.setCamera(myCamera);        // override the default camera
//   // From the Scene's destroy():
//   three.clearScene();
//
// Helpers:
//   three.worldToScreen(vec3) → { x, y } pixel coords on the 2D engine canvas
//   three.setBackground(0xrrggbb)
//   three.add(obj) / three.remove(obj) / three.clearScene()

(function (GF) {
  'use strict';

  class Three3DScene {
    constructor(opts) {
      this.name = 'three3d';
      opts = opts || {};
      this._opts          = opts;
      this._bgColor       = opts.bgColor !== undefined ? opts.bgColor : 0x0a0a14;
      this._scene         = null;
      this._camera        = null;
      this._renderer      = null;
      this._domEl         = null;
      this._addedObjects  = [];   // every obj added via add() — bulk removable
      this._engine        = null;
      this._resizeObs     = null;
    }

    // ── Lifecycle ────────────────────────────────────────────────────────────

    init(engine) {
      const THREE = window.THREE;
      if (!THREE) {
        console.error('[Three3DScene] window.THREE not found. Load Three.js before GameFramework.');
        return;
      }
      this._engine = engine;
      const W = engine.canvas.width;
      const H = engine.canvas.height;

      // Renderer
      this._renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this._renderer.setPixelRatio(window.devicePixelRatio || 1);
      this._renderer.setSize(W, H);
      this._renderer.shadowMap.enabled = true;
      this._renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
      try {
        this._renderer.outputEncoding      = THREE.sRGBEncoding;
        this._renderer.toneMapping         = THREE.ACESFilmicToneMapping;
        this._renderer.toneMappingExposure = 1.0;
      } catch (_) {}

      // Scene
      this._scene = new THREE.Scene();
      this._scene.background = new THREE.Color(this._bgColor);

      // Default camera (games usually replace via setCamera)
      this._camera = new THREE.PerspectiveCamera(55, W / H, 0.05, 500);
      this._camera.position.set(0, 6, 10);
      this._camera.lookAt(0, 0, 0);

      // Insert renderer canvas BEHIND the engine's 2D canvas
      this._domEl = this._renderer.domElement;
      this._domEl.style.cssText =
        'position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;';
      const parent = engine.canvas.parentElement || document.body;
      parent.style.position = 'relative';
      parent.insertBefore(this._domEl, engine.canvas);
      // 2D canvas overlays the 3D one for HUD / dialogue rendering.
      engine.canvas.style.cssText +=
        ';position:absolute;top:0;left:0;z-index:1;background:transparent;';

      // Resize: keep both canvases in sync with the parent container
      this._resizeObs = new ResizeObserver(() => this._sync());
      this._resizeObs.observe(parent);
    }

    _sync() {
      if (!this._renderer || !this._engine) return;
      const W = this._engine.canvas.width;
      const H = this._engine.canvas.height;
      this._renderer.setSize(W, H);
      if (this._camera && this._camera.isPerspectiveCamera) {
        this._camera.aspect = W / H;
        this._camera.updateProjectionMatrix();
      }
    }

    // No-op: game scenes drive their own 3D animation in update()
    update(/* dt, engine */) {}

    render(/* ctx, engine */) {
      if (this._renderer && this._scene && this._camera) {
        this._renderer.render(this._scene, this._camera);
      }
    }

    destroy() {
      if (this._resizeObs) this._resizeObs.disconnect();
      this.clearScene();
      if (this._renderer) {
        this._renderer.dispose();
        if (this._domEl && this._domEl.parentElement) {
          this._domEl.parentElement.removeChild(this._domEl);
        }
      }
    }

    // ── Scene API ────────────────────────────────────────────────────────────

    /** Set the active camera (e.g. PerspectiveCamera, OrthographicCamera). */
    setCamera(cam) { this._camera = cam; }

    /** Direct accessors for advanced use. */
    get scene()    { return this._scene; }
    get camera()   { return this._camera; }
    get renderer() { return this._renderer; }

    /** Add an object to the scene. Tracked for bulk-clear. */
    add(obj) {
      if (!obj || !this._scene) return obj;
      this._scene.add(obj);
      this._addedObjects.push(obj);
      return obj;
    }

    /** Remove a single tracked object. */
    remove(obj) {
      if (!obj || !this._scene) return;
      this._scene.remove(obj);
      const i = this._addedObjects.indexOf(obj);
      if (i >= 0) this._addedObjects.splice(i, 1);
      _disposeRecursive(obj);
    }

    /** Remove every object that was added via add(). Use on scene transitions. */
    clearScene() {
      if (!this._scene) return;
      for (const obj of this._addedObjects) {
        this._scene.remove(obj);
        _disposeRecursive(obj);
      }
      this._addedObjects = [];
    }

    /** Update the scene background colour. */
    setBackground(colorHex) {
      if (this._scene) this._scene.background = new window.THREE.Color(colorHex);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Project a world-space Vector3 to pixel coordinates on the engine's 2D
     * canvas. Useful for HUD elements that should track 3D objects (HP bars,
     * floating damage text, name plates).
     * @param {THREE.Vector3} v3
     * @returns {{x:number, y:number, depth:number}}
     */
    worldToScreen(v3) {
      const ndc = v3.clone().project(this._camera);
      const W = this._engine.canvas.width;
      const H = this._engine.canvas.height;
      return {
        x: (ndc.x + 1) * 0.5 * W,
        y: (-ndc.y + 1) * 0.5 * H,
        depth: ndc.z,
      };
    }
  }

  // Recursively dispose geometries / materials so we don't leak GPU resources.
  function _disposeRecursive(obj) {
    if (!obj) return;
    obj.traverse && obj.traverse(child => {
      if (child.geometry && child.geometry.dispose) child.geometry.dispose();
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(m => {
          if (m.map && m.map.dispose) m.map.dispose();
          if (m.dispose) m.dispose();
        });
      }
    });
  }

  GF.Three3DScene = Three3DScene;

})(window.GF = window.GF || {});
