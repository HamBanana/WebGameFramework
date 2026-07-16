// GameFramework/games/SpaceInvaders3D/SpaceInvaders3DGame.js
// Galaga-style 3D arcade shooter built on the GameFramework + Three3DScene.
//
// World layout:
//   X: horizontal (player + alien formation)
//   Y: vertical
//   Z: depth (-Z is "into the screen"; player at +Z, aliens at -Z)
// Aliens hold a swaying formation and periodically dive at the player along
// curved Bezier paths, then loop back and rejoin formation.

(function (GF) {
  'use strict';

  const STATE = {
    TITLE: 'title', PLAYING: 'playing', LEVEL_CLEAR: 'level_clear',
    DEAD: 'dead', GAME_OVER: 'game_over', BOSS_RESULTS: 'boss_results',
  };

  // ── Material/mesh helpers ──────────────────────────────────────────────────

  function mat(color, opts) {
    opts = opts || {};
    return new THREE.MeshStandardMaterial({
      color,
      roughness: opts.r !== undefined ? opts.r : 0.7,
      metalness: opts.m !== undefined ? opts.m : 0.15,
      emissive: opts.e !== undefined ? new THREE.Color(opts.e) : new THREE.Color(0),
      emissiveIntensity: opts.ei || 0,
    });
  }
  function box(w, h, d, c, o) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, o)); }
  function sphere(r, c, o)    { return new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), mat(c, o)); }
  function cyl(r, h, c, o)    { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 10), mat(c, o)); }
  function attach(parent, mesh, x, y, z) {
    mesh.position.set(x || 0, y || 0, z || 0);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // ── Alien meshes (Galaga-flavored: bee / butterfly / boss-galaxian) ────────

  // Bottom rows: small "bee" drone
  function buildBee(color) {
    const g = new THREE.Group();
    const c = color;
    attach(g, box(0.45, 0.35, 0.50, c, { e: c, ei: 0.30 }), 0, 0, 0);
    // wings
    attach(g, box(0.95, 0.05, 0.30, c, { e: c, ei: 0.55 }), 0, 0.05, 0);
    attach(g, sphere(0.16, c, { e: c, ei: 0.45 }), 0, 0.10, 0.20);
    // eyes
    const em = mat(0xffff00, { e: 0xffff00, ei: 1.5 });
    [-0.07, 0.07].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), em);
      attach(g, eye, ex, 0.12, 0.30);
    });
    return g;
  }

  // Middle row: "butterfly" — wider wings, glowing
  function buildButterfly(color) {
    const g = new THREE.Group();
    const c = color;
    attach(g, box(0.40, 0.40, 0.55, c, { e: c, ei: 0.30 }), 0, 0, 0);
    // double wings
    attach(g, box(1.30, 0.10, 0.35, c, { e: c, ei: 0.7 }), 0, 0.0, 0);
    attach(g, box(0.95, 0.08, 0.30, c, { e: c, ei: 0.5 }), 0, -0.10, 0.05);
    // head/eye dome
    attach(g, sphere(0.18, c, { e: c, ei: 0.5 }), 0, 0.12, 0.22);
    const em = mat(0xff2266, { e: 0xff2266, ei: 1.5 });
    [-0.08, 0.08].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), em);
      attach(g, eye, ex, 0.13, 0.34);
    });
    return g;
  }

  // Top row: "galaxian boss" — biggest, ornate
  function buildBossAlien(color) {
    const g = new THREE.Group();
    const c = color;
    attach(g, box(0.65, 0.55, 0.65, c, { e: c, ei: 0.30 }), 0, 0, 0);
    attach(g, box(1.40, 0.12, 0.45, c, { e: c, ei: 0.9 }), 0, 0.05, 0);
    // crown spikes
    [-0.20, 0, 0.20].forEach(sx => {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.30, 4), mat(c, { e: c, ei: 0.7 }));
      sp.position.set(sx, 0.35, 0);
      g.add(sp);
    });
    // glowing core
    attach(g, sphere(0.20, 0xffffff, { e: 0xffffff, ei: 1.4 }), 0, 0.05, 0.28);
    return g;
  }

  function buildAlienMesh(shape, color) {
    if (shape === 'squid')   return buildBossAlien(color);
    if (shape === 'crab')    return buildButterfly(color);
    return buildBee(color);
  }

  // Boss mothership — big multi-stage mesh
  function buildBossMothership() {
    const g = new THREE.Group();
    const hull = mat(0x441166, { e: 0x331144, ei: 0.35, m: 0.5, r: 0.4 });
    // Central body
    attach(g, new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.8, 1.4), hull), 0, 0, 0);
    // Wing extensions
    attach(g, new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.45, 1.0), mat(0x6622aa, { e: 0x441166, ei: 0.55 })), 0, -0.15, 0);
    // Side prongs
    [-2.4, 2.4].forEach(sx => {
      const prong = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 1.8), mat(0xaa44ff, { e: 0xaa44ff, ei: 0.8 }));
      attach(g, prong, sx, -0.1, 0.2);
    });
    // Top crest
    attach(g, new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45, 0.9), mat(0xff44ff, { e: 0xff44ff, ei: 0.7 })), 0, 0.45, 0);
    // Glowing core
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 12), mat(0xffff00, { e: 0xffff00, ei: 1.6 }));
    core.position.set(0, 0.15, 0.4);
    g.add(core);
    g.userData.core = core;
    // Eye lights along the wing
    const eyeMat = mat(0xff2266, { e: 0xff2266, ei: 1.4 });
    [-1.8, -1.1, -0.5, 0.5, 1.1, 1.8].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.10, 8, 8), eyeMat);
      attach(g, eye, ex, -0.05, 0.55);
    });
    // Twin spikes on top
    [-0.6, 0.6].forEach(sx => {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.55, 6), mat(0xff44ff, { e: 0xff44ff, ei: 0.8 }));
      sp.position.set(sx, 0.65, 0);
      g.add(sp);
    });
    // Aura point light
    const aura = new THREE.PointLight(0xff44ff, 0, 6);
    aura.position.set(0, 0, 0);
    g.add(aura);
    g.userData.aura = aura;
    return g;
  }

  // UFO — glowing flat disc (bonus target during play)
  function buildUFO() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.45, 0.18, 18), mat(0xff4444, { e: 0xff4444, ei: 0.55, m: 0.4 }));
    attach(g, body, 0, 0, 0);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xffaaaa, { e: 0xff6666, ei: 0.9 }));
    attach(g, dome, 0, 0.08, 0);
    const lightMat = mat(0xffff00, { e: 0xffff00, ei: 1.5 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), lightMat);
      attach(g, l, Math.cos(a) * 0.58, -0.04, Math.sin(a) * 0.58);
    }
    return g;
  }

  // Player ship — sleek wedge with engine glow
  function buildPlayerShip() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 1.1, 4),
      mat(0x00e5ff, { e: 0x0099cc, ei: 0.5, m: 0.55, r: 0.3 })
    );
    body.rotation.x = -Math.PI / 2;
    body.position.set(0, 0, -0.1);
    g.add(body);
    attach(g, box(1.2, 0.10, 0.40, 0x00aacc, { e: 0x0066aa, ei: 0.3 }), 0, -0.05, 0.20);
    const cp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2),
                              mat(0xffffff, { e: 0x99ddff, ei: 0.9, m: 0.6, r: 0.1 }));
    cp.position.set(0, 0.08, 0.00);
    g.add(cp);
    const engineMat = mat(0xffaa00, { e: 0xff6600, ei: 1.6 });
    [-0.20, 0.20].forEach(ex => {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.10, 8, 8), engineMat);
      attach(g, e, ex, -0.02, 0.45);
    });
    return g;
  }

  // Powerup orb — glowing rotating shape
  function buildPowerup(color) {
    const g = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.32, 0),
      mat(color, { e: color, ei: 1.0, m: 0.7, r: 0.2 })
    );
    g.add(core);
    // Outer halo cube
    const halo = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.55, 0.55),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, wireframe: true })
    );
    g.add(halo);
    const light = new THREE.PointLight(color, 1.0, 3.5);
    g.add(light);
    g.userData.core = core;
    g.userData.halo = halo;
    return g;
  }

  // ── Stage ──────────────────────────────────────────────────────────────────

  function buildStage(scene) {
    const starGeo = new THREE.BufferGeometry();
    const N = 800;
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 80;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 50 + 5;
      arr[i * 3 + 2] = -10 - Math.random() * 60;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.10, sizeAttenuation: true, transparent: true, opacity: 0.9
    }));
    scene.add(stars);

    const neb = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 60),
      new THREE.MeshBasicMaterial({ color: 0x1a0040, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    neb.position.set(0, 5, -55);
    scene.add(neb);

    const gridMat = new THREE.LineBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.5 });
    const half = 14;
    for (let x = -half; x <= half; x += 1.5) {
      const g = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, -1.0, 6),
          new THREE.Vector3(x, -1.0, -28),
        ]),
        gridMat
      );
      scene.add(g);
    }
    for (let z = 6; z >= -28; z -= 1.5) {
      const g = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-half, -1.0, z),
          new THREE.Vector3( half, -1.0, z),
        ]),
        gridMat
      );
      scene.add(g);
    }

    const pillarMat = mat(0x00e5ff, { e: 0x00aacc, ei: 0.85, r: 0.2 });
    [-9, 9].forEach(px => {
      for (let pz = 6; pz >= -16; pz -= 4) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.6, 0.15), pillarMat);
        p.position.set(px, 0.0, pz);
        scene.add(p);
      }
    });

    return { stars };
  }

  function buildLighting(scene) {
    scene.add(new THREE.AmbientLight(0x223355, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(3, 12, 6);
    key.castShadow = true;
    key.shadow.mapSize.width = key.shadow.mapSize.height = 1024;
    key.shadow.camera.left = -12; key.shadow.camera.right = 12;
    key.shadow.camera.top  =  10; key.shadow.camera.bottom = -6;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xff44ff, 0.45);
    rim.position.set(-4, 4, -10);
    scene.add(rim);
    const cool = new THREE.PointLight(0x00aaff, 1.2, 18);
    cool.position.set(0, 4, 2);
    scene.add(cool);
  }

  // ── Particle FX (3D) ───────────────────────────────────────────────────────

  class FX3D {
    constructor(scene) { this._scene = scene; this._parts = []; this._flashes = []; }

    burst(x, y, z, color, opts) {
      opts = opts || {};
      const count = opts.count || 14;
      const speed = opts.speed || 4.5;
      const life  = opts.life  || 0.55;
      const sz    = opts.size  || 0.10;
      const geo   = new THREE.SphereGeometry(sz, 5, 5);
      for (let i = 0; i < count; i++) {
        const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true }));
        m.position.set(x, y, z);
        this._scene.add(m);
        const s = speed * (0.4 + Math.random());
        this._parts.push({
          mesh: m,
          vx: (Math.random() - 0.5) * s * 1.4,
          vy: (Math.random() - 0.2) * s,
          vz: (Math.random() - 0.5) * s * 1.4,
          life, maxLife: life,
          gravity: opts.gravity !== undefined ? opts.gravity : 3,
        });
      }
      const fl = new THREE.PointLight(color, 4, 6);
      fl.position.set(x, y, z);
      this._scene.add(fl);
      this._flashes.push({ light: fl, life: 0.18, maxLife: 0.18 });
    }

    update(dt) {
      for (let i = this._parts.length - 1; i >= 0; i--) {
        const p = this._parts[i];
        p.vy -= p.gravity * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.life -= dt;
        const a = Math.max(0, p.life / p.maxLife);
        p.mesh.material.opacity = a;
        p.mesh.scale.setScalar(0.2 + a * 0.8);
        if (p.life <= 0) {
          this._scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          p.mesh.material.dispose();
          this._parts.splice(i, 1);
        }
      }
      for (let i = this._flashes.length - 1; i >= 0; i--) {
        const f = this._flashes[i];
        f.life -= dt;
        f.light.intensity = Math.max(0, (f.life / f.maxLife) * 4);
        if (f.life <= 0) { this._scene.remove(f.light); this._flashes.splice(i, 1); }
      }
    }

    dispose() {
      this._parts.forEach(p => {
        this._scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
      });
      this._flashes.forEach(f => this._scene.remove(f.light));
      this._parts = []; this._flashes = [];
    }
  }

  // ── Audio (procedural) ─────────────────────────────────────────────────────

  function makeTone(ctx, freq, dur, type, env) {
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * dur);
    const buf = ctx.createBuffer(1, len, sr);
    const dd  = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      let s = 0;
      if (type === 'square') s = Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1;
      else if (type === 'noise') s = Math.random() * 2 - 1;
      else if (type === 'sweep') { const f = freq + (env.sweep || 0) * t; s = Math.sin(2 * Math.PI * f * t); }
      else s = Math.sin(2 * Math.PI * freq * t);
      const attack  = env.attack  || 0.01;
      const release = env.release || dur;
      let amp = t < attack ? t / attack : Math.max(0, 1 - (t - attack) / (release - attack));
      dd[i] = s * amp * (env.volume || 0.3);
    }
    return buf;
  }

  function setupAudio(audio) {
    if (!audio || !audio._ensureContext) return;
    audio._ensureContext();
    const ctx = audio._ctx;
    if (!ctx) return;
    try {
      audio.register('shoot',     makeTone(ctx, 880, 0.12, 'square', { attack: 0.005, release: 0.12, volume: 0.20 }));
      audio.register('alienDie',  makeTone(ctx, 300, 0.22, 'sweep',  { attack: 0.005, release: 0.22, sweep: -400, volume: 0.32 }));
      audio.register('playerDie', makeTone(ctx, 150, 0.50, 'noise',  { attack: 0.01,  release: 0.50, volume: 0.38 }));
      audio.register('ufoAppear', makeTone(ctx, 440, 0.60, 'sweep',  { attack: 0.05,  release: 0.60, sweep: 220, volume: 0.25 }));
      audio.register('ufoHit',    makeTone(ctx, 600, 0.30, 'sweep',  { attack: 0.005, release: 0.30, sweep: -300, volume: 0.35 }));
      audio.register('levelUp',   makeTone(ctx, 550, 0.40, 'square', { attack: 0.01,  release: 0.40, volume: 0.28 }));
      audio.register('extraLife', makeTone(ctx, 660, 0.45, 'square', { attack: 0.01,  release: 0.45, volume: 0.30 }));
      audio.register('dive',      makeTone(ctx, 180, 0.40, 'sweep',  { attack: 0.01,  release: 0.40, sweep:  500, volume: 0.22 }));
      audio.register('powerup',   makeTone(ctx, 750, 0.28, 'sweep',  { attack: 0.01,  release: 0.28, sweep:  320, volume: 0.32 }));
      audio.register('shield',    makeTone(ctx, 380, 0.20, 'square', { attack: 0.005, release: 0.20, volume: 0.28 }));
      // Boss-specific
      audio.register('bossAlert', makeTone(ctx, 110, 0.80, 'sweep',  { attack: 0.05,  release: 0.80, sweep:  80,  volume: 0.40 }));
      audio.register('bossHit',   makeTone(ctx, 240, 0.15, 'square', { attack: 0.005, release: 0.15, volume: 0.30 }));
      audio.register('bossDie',   makeTone(ctx,  80, 1.20, 'sweep',  { attack: 0.02,  release: 1.20, sweep: -60,  volume: 0.55 }));
      // Victory jingle notes — C5, E5, G5, C6, E6
      audio.register('j0', makeTone(ctx, 523.25, 0.18, 'square', { attack: 0.005, release: 0.18, volume: 0.28 }));
      audio.register('j1', makeTone(ctx, 659.25, 0.18, 'square', { attack: 0.005, release: 0.18, volume: 0.28 }));
      audio.register('j2', makeTone(ctx, 783.99, 0.18, 'square', { attack: 0.005, release: 0.18, volume: 0.28 }));
      audio.register('j3', makeTone(ctx, 1046.5, 0.18, 'square', { attack: 0.005, release: 0.18, volume: 0.28 }));
      audio.register('j4', makeTone(ctx, 1318.5, 0.55, 'square', { attack: 0.005, release: 0.55, volume: 0.32 }));
    } catch (_) { /* audio unavailable */ }
  }

  // Play a victory jingle: ascending arpeggio.
  function playJingle(audio) {
    if (!audio || !audio.play) return;
    const seq = [
      ['j0',   0],
      ['j1', 140],
      ['j2', 280],
      ['j3', 420],
      ['j4', 600],
    ];
    seq.forEach(([n, delay]) => {
      setTimeout(() => { try { audio.play(n); } catch (_) {} }, delay);
    });
  }

  // ── Math helpers ───────────────────────────────────────────────────────────

  function cubicBezier(p0, p1, p2, p3, t) {
    const u = 1 - t;
    const b0 = u * u * u, b1 = 3 * u * u * t, b2 = 3 * u * t * t, b3 = t * t * t;
    return {
      x: b0 * p0.x + b1 * p1.x + b2 * p2.x + b3 * p3.x,
      y: b0 * p0.y + b1 * p1.y + b2 * p2.y + b3 * p3.y,
      z: b0 * p0.z + b1 * p1.z + b2 * p2.z + b3 * p3.z,
    };
  }

  function pickWeighted(types) {
    const total = types.reduce((s, t) => s + (t.weight || 1), 0);
    let r = Math.random() * total;
    for (const t of types) { r -= (t.weight || 1); if (r <= 0) return t; }
    return types[types.length - 1];
  }

  // ── Game state ─────────────────────────────────────────────────────────────

  const G = { score: 0, hiScore: 0, lives: 3, level: 1, extraGiven: false };

  // ── Main game ──────────────────────────────────────────────────────────────

  class SpaceInvaders3DGame {
    constructor(engine, three3d) {
      this.engine = engine;
      this.three3d = three3d;
      this.cfg = GF.GAME_CONFIG;
      this.W = this.cfg.engine.width;
      this.H = this.cfg.engine.height;

      this.state = STATE.TITLE;
      this._titleT = 0;
      this._stateT = 0;
      this._paused = false;
      this._camShake = 0;
      this._formationT = 0;

      const scene = three3d.scene;
      this._scene = scene;
      buildStage(scene);
      buildLighting(scene);
      scene.fog = new THREE.FogExp2(0x000018, 0.025);

      this._cam = new THREE.PerspectiveCamera(60, this.W / this.H, 0.1, 200);
      this._cam.position.set(0, 2.9, 10.5);
      this._cam.lookAt(0, 2.0, -3);
      three3d.setCamera(this._cam);

      this.fx = new FX3D(scene);

      this._playerMesh = buildPlayerShip();
      this._playerMesh.position.set(0, this.cfg.player.y, this.cfg.player.z);
      scene.add(this._playerMesh);

      // Shield bubble (hidden by default)
      this._shieldMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.95, 18, 14),
        new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.25, wireframe: true })
      );
      this._shieldMesh.visible = false;
      this._playerMesh.add(this._shieldMesh);

      this._aliens = [];
      this._alienBullets = [];
      this._playerBullets = [];
      this._powerups = [];
      this._activePowerups = {};
      this._ufo = null;
      this._ufoTimer = 8;
      this._boss = null;
      this._bossWarning = null;
      this._bossKills = 0;
      this._bossResults = null;

      const c = this.cfg.controls;
      engine.input.bind('left',  ...c.left);
      engine.input.bind('right', ...c.right);
      engine.input.bind('up',    ...c.up);
      engine.input.bind('down',  ...c.down);
      engine.input.bind('fire',  ...c.fire);
      engine.input.bind('pause', ...c.pause);

      this._audio = engine.audio || engine.getSystem('AudioSystem');
      setupAudio(this._audio);

      engine.onUpdate(dt => this._update(dt));
      engine.onRender(ctx => this._render2D(ctx));
    }

    _sfx(n) { try { this._audio && this._audio.play(n); } catch (_) {} }

    // ── Game lifecycle ───────────────────────────────────────────────────────

    _startGame() {
      G.score = 0;
      G.lives = this.cfg.player.lives;
      G.level = 1;
      G.extraGiven = false;
      this._activePowerups = {};
      this._shieldMesh.visible = false;
      this._buildLevel();
      this.state = STATE.PLAYING;
      this._stateT = 0;
    }

    _buildLevel() {
      this._aliens.forEach(a => this._scene.remove(a.mesh));
      this._aliens = [];
      this._playerBullets.forEach(b => this._scene.remove(b.mesh));
      this._playerBullets = [];
      this._alienBullets.forEach(b => this._scene.remove(b.mesh));
      this._alienBullets = [];
      this._powerups.forEach(p => this._scene.remove(p.mesh));
      this._powerups = [];
      if (this._boss) { this._scene.remove(this._boss.mesh); this._boss = null; }

      this._isBossLevel = (G.level % this.cfg.boss.everyNLevels === 0);
      if (this._isBossLevel) {
        this._buildBossLevel();
        // Reset player state same way as regular levels
        this._playerMesh.position.set(0, this.cfg.player.y, this.cfg.player.z);
        this._playerMesh.rotation.set(0, 0, 0);
        this._playerInvincible = 1.5;
        this._playerAlive = true;
        this._fireTimer = 0;
        this._ufo = null;
        this._ufoTimer = 9999;
        return;
      }

      const ac = this.cfg.aliens;
      const cols = ac.cols, rows = ac.rows;
      const startX = -((cols - 1) / 2) * ac.colSpacing;
      const topY = ac.topY - (G.level - 1) * 0.15;

      // Stagger entry: each alien gets a delay before its entry path starts
      let entryOrder = 0;
      for (let row = 0; row < rows; row++) {
        const typeDef = ac.types.find(t => t.rows.includes(row)) || ac.types[ac.types.length - 1];
        for (let col = 0; col < cols; col++) {
          const formX = startX + col * ac.colSpacing;
          const formY = topY - row * ac.rowSpacing;
          const formZ = ac.startZ;
          const mesh = buildAlienMesh(typeDef.shape, typeDef.color);
          mesh.visible = false;
          this._scene.add(mesh);

          // Entry from off-screen (top corners alternating per column)
          const side = (col % 2 === 0) ? -1 : 1;
          const entryFrom = { x: side * 12, y: formY + 4, z: formZ - 4 };
          const entryC1   = { x: side * 6,  y: formY + 3.5, z: formZ - 2 };
          const entryC2   = { x: formX - side * 2, y: formY + 1.2, z: formZ + 0.5 };

          this._aliens.push({
            mesh, col, row, alive: true,
            shape: typeDef.shape, points: typeDef.points, color: typeDef.color,
            formX, formY, formZ,
            state: 'waiting',
            entryDelay: 0.08 * entryOrder + Math.random() * 0.15,
            pathT: 0, pathDur: 1.8,
            entryFrom, entryC1, entryC2,
            swayPhase: Math.random() * Math.PI * 2,
            divePoints: null,
          });
          entryOrder++;
        }
      }
      this._totalAliens = this._aliens.length;
      this._diveTimer = 4.0 - (G.level - 1) * 0.2;     // first dive after entry completes
      this._formationFireTimer = 3.5;
      this._formationT = 0;

      // Player reset
      this._playerMesh.position.set(0, this.cfg.player.y, this.cfg.player.z);
      this._playerMesh.rotation.set(0, 0, 0);
      this._playerInvincible = 1.5;
      this._playerAlive = true;
      this._fireTimer = 0;
      this._activePowerups = this._activePowerups || {};
      // Keep shield if active across levels (no, refresh per level)

      this._ufo = null;
      this._ufoTimer = GF.Math.rand(...this.cfg.ufo.spawnInterval);
    }

    // ── Update loop ──────────────────────────────────────────────────────────

    _update(dt) {
      if (this._camShake > 0) this._camShake -= dt;
      this._updateCamera(dt);
      this.fx.update(dt);

      if (this.engine.input.wasPressed('pause') && this.state === STATE.PLAYING) {
        this._paused = !this._paused;
      }
      if (this._paused) return;

      this._stateT += dt;

      switch (this.state) {
        case STATE.TITLE:
          this._titleT += dt;
          if (this.engine.input.wasPressed('fire')) this._startGame();
          break;
        case STATE.PLAYING:
          this._updatePlayer(dt);
          this._updateAliens(dt);
          this._updateBoss(dt);
          this._updateBullets(dt);
          this._updateUFO(dt);
          this._updatePowerups(dt);
          this._checkCollisions();
          if (this._isBossLevel) {
            // Boss level: clear when boss dies (handled via state transition)
          } else if (this._aliens.every(a => !a.alive)) {
            this._onLevelClear();
          }
          break;
        case STATE.LEVEL_CLEAR:
          this._updateBullets(dt);
          this._updateAliens(dt);
          this._updatePowerups(dt);
          if (this._stateT > 1.8) {
            G.level++;
            this._buildLevel();
            this.state = STATE.PLAYING;
            this._stateT = 0;
          }
          break;
        case STATE.DEAD:
          this._updateBullets(dt);
          this._updateAliens(dt);
          if (this._stateT > this.cfg.player.respawnDelay) {
            if (G.lives <= 0) {
              if (G.score > G.hiScore) G.hiScore = G.score;
              this.state = STATE.GAME_OVER;
              this._stateT = 0;
            } else {
              this._playerMesh.position.set(0, this.cfg.player.y, this.cfg.player.z);
              this._playerMesh.rotation.set(0, 0, 0);
              this._playerAlive = true;
              this._playerInvincible = this.cfg.player.invincibleTime;
              this.state = STATE.PLAYING;
              this._stateT = 0;
            }
          }
          break;
        case STATE.GAME_OVER:
          if (this._stateT > 1.5 && this.engine.input.wasPressed('fire')) {
            this.state = STATE.TITLE;
            this._stateT = 0;
          }
          break;
        case STATE.BOSS_RESULTS:
          this._updateBullets(dt);
          this._updateAliens(dt);
          this._updatePowerups(dt);
          // Auto-advance after a few seconds, or skip on fire
          if (this._stateT > 2.4 && (this.engine.input.wasPressed('fire') || this._stateT > 6.5)) {
            G.level++;
            this._bossResults = null;
            this._buildLevel();
            this.state = STATE.PLAYING;
            this._stateT = 0;
          }
          break;
      }
    }

    // ── Player ───────────────────────────────────────────────────────────────

    _updatePlayer(dt) {
      if (!this._playerAlive) return;
      const pc = this.cfg.player;
      const inp = this.engine.input;

      let vx = 0, vy = 0;
      if (inp.isDown('left'))  vx = -pc.speed;
      if (inp.isDown('right')) vx =  pc.speed;
      if (inp.isDown('up'))    vy =  pc.ySpeed;
      if (inp.isDown('down'))  vy = -pc.ySpeed;
      this._playerMesh.position.x = GF.Math.clamp(this._playerMesh.position.x + vx * dt, -pc.halfRange, pc.halfRange);
      this._playerMesh.position.y = GF.Math.clamp(this._playerMesh.position.y + vy * dt, pc.yMin, pc.yMax);
      const targetRoll  = vx === 0 ? 0 : (vx > 0 ? -0.25 : 0.25);
      const targetPitch = vy === 0 ? 0 : (vy > 0 ? -0.20 : 0.20);
      this._playerMesh.rotation.z += (targetRoll  - this._playerMesh.rotation.z) * Math.min(1, dt * 8);
      this._playerMesh.rotation.x += (targetPitch - this._playerMesh.rotation.x) * Math.min(1, dt * 8);

      // Fire rate from rapidFire powerup
      const fireRate = this._activePowerups.rapidFire ? pc.fireRate * 0.4 : pc.fireRate;
      this._fireTimer -= dt;
      if (inp.isDown('fire') && this._fireTimer <= 0) {
        this._fireTimer = fireRate;
        const px = this._playerMesh.position.x;
        const py = this._playerMesh.position.y + 0.3;
        const pz = this._playerMesh.position.z;
        if (this._activePowerups.tripleShot) {
          this._spawnPlayerBullet(px, py, pz, 0, 0);
          this._spawnPlayerBullet(px - 0.25, py, pz, -3, 0);
          this._spawnPlayerBullet(px + 0.25, py, pz,  3, 0);
        } else if (this._activePowerups.doubleShot) {
          this._spawnPlayerBullet(px - 0.30, py, pz, 0, 0);
          this._spawnPlayerBullet(px + 0.30, py, pz, 0, 0);
        } else {
          this._spawnPlayerBullet(px, py, pz, 0, 0);
        }
        this._sfx('shoot');
      }

      // Powerup duration ticking
      for (const type of Object.keys(this._activePowerups)) {
        const ap = this._activePowerups[type];
        if (ap.timer !== Infinity) {
          ap.timer -= dt;
          if (ap.timer <= 0) delete this._activePowerups[type];
        }
      }
      this._shieldMesh.visible = !!this._activePowerups.shield;
      if (this._shieldMesh.visible) {
        this._shieldMesh.rotation.y += dt * 2;
        this._shieldMesh.rotation.x += dt * 0.8;
      }

      // Invincibility flash
      if (this._playerInvincible > 0) {
        this._playerInvincible -= dt;
        this._playerMesh.visible = Math.floor(this._playerInvincible * 10) % 2 === 0;
      } else {
        this._playerMesh.visible = true;
      }
    }

    _spawnPlayerBullet(x, y, z, vx, vy) {
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.55, 8),
        mat(0x00ffff, { e: 0x00ffff, ei: 1.4 })
      );
      m.position.set(x, y, z);
      this._scene.add(m);
      const light = new THREE.PointLight(0x00ffff, 1.0, 2.2);
      m.add(light);
      this._playerBullets.push({
        mesh: m,
        vx: vx || 0, vy: vy || 0,
        vz: -this.cfg.player.bulletSpeed,
      });
    }

    // ── Aliens (Galaga-style) ────────────────────────────────────────────────

    _updateAliens(dt) {
      this._formationT += dt;
      const formOffsetX = Math.sin(this._formationT * 0.4) * this.cfg.aliens.formationSway;

      let waitingAny = false;
      for (const a of this._aliens) {
        if (!a.alive) continue;

        if (a.state === 'waiting') {
          a.entryDelay -= dt;
          if (a.entryDelay <= 0) {
            a.mesh.visible = true;
            a.state = 'entering';
            a.pathT = 0;
          } else {
            waitingAny = true;
            continue;
          }
        }

        if (a.state === 'entering') {
          a.pathT += dt / a.pathDur;
          if (a.pathT >= 1) {
            a.state = 'formation';
            a.pathT = 0;
            a.mesh.position.set(a.formX + formOffsetX, a.formY, a.formZ);
            a.mesh.rotation.set(0, 0, 0);
          } else {
            const p = cubicBezier(a.entryFrom, a.entryC1, a.entryC2, { x: a.formX + formOffsetX, y: a.formY, z: a.formZ }, a.pathT);
            const prev = a._prevPos || p;
            a.mesh.position.set(p.x, p.y, p.z);
            a.mesh.rotation.z = (prev.x - p.x) * 1.5;
            a.mesh.rotation.x = (p.z - prev.z) * 1.5;
            a._prevPos = p;
          }
          continue;
        }

        if (a.state === 'formation') {
          a.swayPhase += dt * 1.5;
          const sx = Math.sin(a.swayPhase) * 0.08;
          const sy = Math.cos(a.swayPhase * 0.7) * 0.04;
          a.mesh.position.set(a.formX + formOffsetX + sx, a.formY + sy, a.formZ);
          a.mesh.rotation.y = Math.sin(a.swayPhase * 0.5) * 0.25;
          a.mesh.rotation.z = 0;
          a.mesh.rotation.x = 0;
          continue;
        }

        if (a.state === 'diving') {
          a.pathT += dt / a.pathDur;
          if (a.pathT >= 1) {
            // Set up re-entry from the exit side
            const exitSide = a.diveSide;
            a.entryFrom = { x: -exitSide * 11, y: a.formY + 4, z: a.formZ - 4 };
            a.entryC1   = { x: -exitSide * 5,  y: a.formY + 3, z: a.formZ - 1 };
            a.entryC2   = { x: a.formX + exitSide * 1.5, y: a.formY + 1, z: a.formZ + 0.4 };
            a.state = 'entering';
            a.pathT = 0;
            a.pathDur = 1.8;
            a._prevPos = null;
          } else {
            const p = cubicBezier(a.diveP0, a.diveP1, a.diveP2, a.diveP3, a.pathT);
            const prev = a._prevPos || p;
            a.mesh.position.set(p.x, p.y, p.z);
            // Bank to face direction
            const dx = p.x - prev.x, dz = p.z - prev.z, dy = p.y - prev.y;
            a.mesh.rotation.y = Math.atan2(dx, -dz) + Math.PI;
            a.mesh.rotation.x = Math.atan2(-dy, Math.hypot(dx, dz));
            a.mesh.rotation.z = -dx * 0.8;
            a._prevPos = p;

            // Dive-fire chance — fire near the midpoint
            if (!a.diveFired && a.pathT > 0.30 && a.pathT < 0.45) {
              if (Math.random() < this.cfg.aliens.diveFireChance) {
                this._spawnAlienBullet(p.x, p.y, p.z, 0, 0, this.cfg.aliens.bulletSpeed);
              }
              a.diveFired = true;
            }
          }
        }
      }

      // Trigger new dives — only when nobody is still entering for the first time
      if (!waitingAny) {
        this._diveTimer -= dt;
        if (this._diveTimer <= 0) {
          const formed = this._aliens.filter(a => a.alive && a.state === 'formation');
          if (formed.length > 0) {
            const pickCount = 1 + (Math.random() < 0.3 && formed.length > 4 ? 1 : 0);
            for (let k = 0; k < pickCount && formed.length > 0; k++) {
              const idx = Math.floor(Math.random() * formed.length);
              const a = formed.splice(idx, 1)[0];
              this._startDive(a);
            }
            const baseInt = this.cfg.aliens.diveIntervalBase;
            const levelBonus = Math.max(0, (G.level - 1) * 0.15);
            this._diveTimer = Math.max(0.3, baseInt - levelBonus + Math.random() * 0.8);
          } else {
            this._diveTimer = 0.4;
          }
        }

        // Occasional formation potshot (less common than dive-fires)
        this._formationFireTimer -= dt;
        if (this._formationFireTimer <= 0) {
          this._formationFireTimer = (1 / this.cfg.aliens.formationFireRate) * (0.6 + Math.random());
          const formed = this._aliens.filter(a => a.alive && a.state === 'formation');
          if (formed.length > 0) {
            const a = GF.Math.randChoice(formed);
            this._spawnAlienBullet(a.mesh.position.x, a.mesh.position.y - 0.2, a.mesh.position.z, 0, 0, this.cfg.aliens.bulletSpeed * 0.8);
          }
        }
      }
    }

    _startDive(a) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const px = this._playerMesh.position.x;
      const py = this._playerMesh.position.y;
      const pz = this._playerMesh.position.z;
      a.diveSide = side;
      a.state = 'diving';
      a.pathT = 0;
      a.pathDur = this.cfg.aliens.diveDuration;
      a.diveFired = false;
      a._prevPos = null;
      a.diveP0 = { x: a.mesh.position.x, y: a.mesh.position.y, z: a.mesh.position.z };
      a.diveP1 = { x: a.diveP0.x + side * 3.2, y: a.diveP0.y - 1.5, z: a.diveP0.z + 4 };
      a.diveP2 = { x: px - side * 0.8,         y: py + 0.5,         z: pz - 1.5 };
      a.diveP3 = { x: side * 9,                y: py + 2.5,         z: pz + 5.5 };
      this._sfx('dive');
    }

    _spawnAlienBullet(x, y, z, vx, vy, vz) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 8, 8),
        mat(0xff4444, { e: 0xff4444, ei: 1.3 })
      );
      m.position.set(x, y, z);
      this._scene.add(m);
      const light = new THREE.PointLight(0xff4444, 0.9, 2.0);
      m.add(light);
      this._alienBullets.push({
        mesh: m,
        vx: vx || 0, vy: vy || 0, vz: vz !== undefined ? vz : this.cfg.aliens.bulletSpeed,
      });
    }

    // ── Boss ─────────────────────────────────────────────────────────────────

    _buildBossLevel() {
      const bc = this.cfg.boss;
      const stage = Math.floor(G.level / bc.everyNLevels); // 1, 2, 3...
      const maxHp = bc.baseHealth + (stage - 1) * bc.healthPerStage;
      const mesh = buildBossMothership();
      mesh.position.set(0, bc.y + 2.5, bc.z - 6);  // start above and behind
      this._scene.add(mesh);

      this._boss = {
        mesh,
        x: 0, y: bc.y + 2.5, z: bc.z - 6,
        baseY: bc.y, baseZ: bc.z,
        dir: 1,
        hp: maxHp,
        maxHp,
        stage,
        flashT: 0,
        state: 'entering',
        stateT: 0,
        attackTimer: 2.0,
        attackPattern: 0,
        diveCooldown: bc.diveCooldown,
        diveTime: 0,
        minionTimer: GF.Math.rand(...bc.minionInterval),
        startTime: performance.now(),
      };

      this._bossWarning = { alpha: 0, scale: 0.5, t: 0 };
      try { this._audio && this._audio.play('bossAlert'); } catch (_) {}
    }

    _updateBoss(dt) {
      const b = this._boss;
      if (!b) return;
      const bc = this.cfg.boss;
      b.stateT += dt;
      if (b.flashT > 0) b.flashT -= dt;

      // Boss core pulses
      if (b.mesh.userData.core) {
        const s = 1 + Math.sin(b.stateT * 4) * 0.12;
        b.mesh.userData.core.scale.setScalar(s);
      }
      if (b.mesh.userData.aura) {
        b.mesh.userData.aura.intensity = 1.4 + Math.sin(b.stateT * 5) * 0.6;
      }

      if (b.state === 'entering') {
        // Glide down into combat position
        const t = Math.min(1, b.stateT / 1.6);
        const ease = 1 - Math.pow(1 - t, 3);
        b.x = 0;
        b.y = (bc.y + 2.5) + (bc.y - (bc.y + 2.5)) * ease;
        b.z = (bc.z - 6) + (bc.z - (bc.z - 6)) * ease;
        if (t >= 1) { b.state = 'combat'; b.stateT = 0; }
      } else if (b.state === 'combat') {
        // Horizontal sweep
        if (b.diveTime > 0) {
          b.diveTime -= dt;
          const dt2 = 1 - (b.diveTime / 1.8);
          b.z = b.baseZ + Math.sin(dt2 * Math.PI) * 4.5;
          // arc toward player X during dive
          const px = this._playerMesh.position.x;
          b.x += (px * 0.6 - b.x) * Math.min(1, dt * 1.4);
        } else {
          b.x += bc.speed * b.dir * dt;
          if (b.x < -3.5) { b.x = -3.5; b.dir = 1; }
          if (b.x >  3.5) { b.x =  3.5; b.dir = -1; }
          b.z = b.baseZ + Math.sin(b.stateT * 1.4) * 0.4;
          b.y = b.baseY + Math.sin(b.stateT * 0.8) * 0.15;
        }

        // Attack cycle
        b.attackTimer -= dt;
        if (b.attackTimer <= 0) {
          this._bossFire();
          const hpFrac = b.hp / b.maxHp;
          const rate = 1 / bc.fireRate * (0.6 + hpFrac * 0.4);
          b.attackTimer = rate + Math.random() * 0.3;
        }

        // Dive when HP < 60%
        b.diveCooldown -= dt;
        if (b.diveCooldown <= 0 && b.hp / b.maxHp < 0.6 && b.diveTime <= 0) {
          b.diveTime = 1.8;
          b.diveCooldown = bc.diveCooldown;
        }

        // Minion wave
        b.minionTimer -= dt;
        if (b.minionTimer <= 0) {
          this._spawnBossMinions();
          b.minionTimer = GF.Math.rand(...bc.minionInterval);
        }
      }

      // Apply transform
      b.mesh.position.set(b.x, b.y, b.z);
      b.mesh.rotation.y = Math.sin(b.stateT * 0.7) * 0.18;
      b.mesh.rotation.z = b.dir * 0.06 + Math.sin(b.stateT * 0.5) * 0.04;
      // Damage flash — tint emissive while flashT > 0
      if (b.flashT > 0) {
        b.mesh.traverse(c => {
          if (c.material && c.material.emissive) {
            c.material.emissiveIntensity = Math.min(2.5, (c.material.emissiveIntensity || 0) + 0.05);
          }
        });
      }

      // Body collision with player
      if (this._playerAlive && this._playerInvincible <= 0) {
        const pm = this._playerMesh.position;
        if (Math.abs(b.x - pm.x) < 2.0 && Math.abs(b.y - pm.y) < 0.9 && Math.abs(b.z - pm.z) < 1.2) {
          this._onPlayerHit();
        }
      }
    }

    _bossFire() {
      const b = this._boss;
      const bc = this.cfg.boss;
      const px = this._playerMesh.position.x;
      const py = this._playerMesh.position.y;
      const pz = this._playerMesh.position.z;

      // Pattern selection: more variety as HP drops
      const hpFrac = b.hp / b.maxHp;
      const patterns = hpFrac > 0.66 ? ['single', 'spread']
                      : hpFrac > 0.33 ? ['single', 'spread', 'triple']
                      :                  ['spread', 'triple', 'fan'];
      const pat = GF.Math.randChoice(patterns);

      const dx = px - b.x, dy = py - b.y, dz = pz - b.z;
      const len = Math.max(0.1, Math.hypot(dx, dy, dz));
      const ux = dx / len, uy = dy / len, uz = dz / len;
      const sp = bc.bulletSpeed;

      const shoot = (vx, vy, vz) => this._spawnAlienBullet(b.x, b.y - 0.3, b.z + 0.4, vx, vy, vz);

      if (pat === 'single') {
        shoot(ux * sp, uy * sp, uz * sp);
      } else if (pat === 'spread') {
        for (let i = -1; i <= 1; i++) {
          const a = Math.atan2(ux, uz) + i * 0.25;
          shoot(Math.sin(a) * sp, uy * sp, Math.cos(a) * sp);
        }
      } else if (pat === 'triple') {
        shoot(-sp * 0.35, uy * sp * 0.5, sp * 0.85);
        shoot(0,           uy * sp * 0.5, sp);
        shoot( sp * 0.35, uy * sp * 0.5, sp * 0.85);
      } else if (pat === 'fan') {
        const baseA = Math.atan2(ux, uz);
        for (let i = -2; i <= 2; i++) {
          const a = baseA + i * 0.20;
          shoot(Math.sin(a) * sp, uy * sp * 0.6, Math.cos(a) * sp);
        }
      }
    }

    _spawnBossMinions() {
      // Spawn 2-3 bee minions that fly in from the sides and dive
      const count = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const typeDef = this.cfg.aliens.types[2]; // bee
        const mesh = buildAlienMesh(typeDef.shape, typeDef.color);
        const formX = (side > 0 ? -1 : 1) * (1 + i * 0.6);
        const formY = 4.0;
        const formZ = -9;
        mesh.visible = true;
        mesh.position.set(side * 11, formY + 3, formZ - 3);
        this._scene.add(mesh);
        const a = {
          mesh, col: 0, row: 0, alive: true,
          shape: typeDef.shape, points: typeDef.points, color: typeDef.color,
          formX, formY, formZ,
          state: 'entering',
          pathT: 0, pathDur: 1.6,
          entryFrom: { x: side * 11, y: formY + 3, z: formZ - 3 },
          entryC1: { x: side * 5, y: formY + 2, z: formZ - 1 },
          entryC2: { x: formX + side, y: formY + 0.5, z: formZ + 0.4 },
          swayPhase: Math.random() * Math.PI * 2,
          isMinion: true,
        };
        this._aliens.push(a);
        // Immediately schedule a dive after entry
        setTimeout(() => { if (a.alive && a.state === 'formation') this._startDive(a); }, 2200 + i * 600);
      }
    }

    _damageBoss(amount) {
      const b = this._boss;
      if (!b) return;
      b.hp -= amount;
      b.flashT = 0.15;
      this.fx.burst(b.x, b.y, b.z + 0.5, 0xffffff, { count: 12, speed: 3.5, life: 0.35, size: 0.08 });
      this._sfx('bossHit');
      if (b.hp <= 0) this._onBossKilled();
    }

    _onBossKilled() {
      const b = this._boss;
      if (!b) return;
      const bc = this.cfg.boss;
      this._sfx('bossDie');
      this._addShake(0.7);
      // Multi-stage explosion
      const burst = (delay) => setTimeout(() => {
        const ox = b.x + (Math.random() - 0.5) * 3;
        const oy = b.y + (Math.random() - 0.5) * 1.4;
        const oz = b.z + (Math.random() - 0.5) * 1.0;
        this.fx.burst(ox, oy, oz, 0xffff00, { count: 28, speed: 6, life: 1.2, size: 0.14 });
        this.fx.burst(ox, oy, oz, 0xff4444, { count: 18, speed: 4, life: 0.9, size: 0.10 });
      }, delay);
      [0, 120, 280, 460, 700, 950].forEach(d => burst(d));

      // Award bonus, life
      const bonusPts = bc.bonusPoints + (b.stage - 1) * 500;
      G.score += bonusPts;
      G.lives = Math.min(99, G.lives + bc.bonusLives);
      this._bossKills++;
      this._checkExtraLife();

      // Build results screen data
      const elapsed = (performance.now() - b.startTime) / 1000;
      this._bossResults = {
        stage: b.stage,
        bonus: bonusPts,
        livesAwarded: bc.bonusLives,
        time: elapsed,
        score: G.score,
      };

      // Remove boss mesh after a short flourish
      setTimeout(() => {
        if (this._boss && this._boss.mesh) this._scene.remove(this._boss.mesh);
        this._boss = null;
      }, 600);

      this.state = STATE.BOSS_RESULTS;
      this._stateT = 0;

      // Play the jingle a beat after the boom
      setTimeout(() => playJingle(this._audio), 600);
    }

    // ── Powerups ─────────────────────────────────────────────────────────────

    _maybeDropPowerup(x, y, z, fromDive) {
      const pc = this.cfg.powerups;
      const chance = pc.dropChance + (fromDive ? pc.diveDropBonus : 0);
      if (Math.random() > chance) return;
      const typeDef = pickWeighted(pc.types);
      const mesh = buildPowerup(typeDef.color);
      mesh.position.set(x, y, z);
      this._scene.add(mesh);
      this._powerups.push({
        mesh,
        type: typeDef.type,
        color: typeDef.color,
        vx: 0,
        // Drift toward player Z (positive Z)
        spin: 0,
      });
    }

    _updatePowerups(dt) {
      const pc = this.cfg.powerups;
      const px = this._playerMesh.position.x;
      const py = this._playerMesh.position.y;
      const pz = this._playerMesh.position.z;
      for (let i = this._powerups.length - 1; i >= 0; i--) {
        const p = this._powerups[i];

        // Drift toward player Z
        p.mesh.position.z += pc.fallSpeed * dt;

        // Proportional XY homing — gain grows as we approach the player Z
        // plane so the powerup arrives roughly at player XY when it crosses
        // player Z. Capped so it doesn't snap violently when very close.
        const dz = pz - p.mesh.position.z;
        if (dz > 0.05) {
          const tRemain = dz / pc.fallSpeed;          // seconds until at player Z
          const gain    = GF.Math.clamp(1 / tRemain, 1.2, 7);
          p.mesh.position.x += (px - p.mesh.position.x) * gain * dt;
          p.mesh.position.y += (py - p.mesh.position.y) * gain * dt;
        }

        p.spin += dt * 3;
        p.mesh.rotation.y = p.spin;
        if (p.mesh.userData.halo) p.mesh.userData.halo.rotation.set(p.spin * 0.6, p.spin * 0.9, 0);

        // Pickup — generous box so the player can grab it as it passes through
        if (this._playerAlive) {
          const ddx = p.mesh.position.x - px;
          const ddy = p.mesh.position.y - py;
          const ddz = p.mesh.position.z - pz;
          if (Math.abs(ddx) < 1.0 && Math.abs(ddy) < 1.0 && Math.abs(ddz) < 1.1) {
            this._activatePowerup(p.type);
            this.fx.burst(p.mesh.position.x, p.mesh.position.y, p.mesh.position.z, p.color, { count: 18, speed: 4, life: 0.5 });
            this._scene.remove(p.mesh);
            this._powerups.splice(i, 1);
            continue;
          }
        }

        // Despawn shortly after passing player Z
        if (p.mesh.position.z > pz + 1.4) {
          this._scene.remove(p.mesh);
          this._powerups.splice(i, 1);
        }
      }
    }

    _activatePowerup(type) {
      const pc = this.cfg.powerups;
      this._sfx('powerup');
      if (type === 'shield') {
        this._activePowerups.shield = { timer: Infinity, duration: Infinity };
      } else if (type === 'rapidFire' || type === 'doubleShot' || type === 'tripleShot') {
        // Mutually exclusive shot powerups
        delete this._activePowerups.doubleShot;
        delete this._activePowerups.tripleShot;
        if (type === 'rapidFire') {
          this._activePowerups.rapidFire = { timer: pc.duration, duration: pc.duration };
        } else {
          this._activePowerups[type] = { timer: pc.duration, duration: pc.duration };
        }
      } else if (type === 'extraLife') {
        G.lives = Math.min(99, G.lives + 1);
        this._sfx('extraLife');
      }
    }

    // ── Bullets ──────────────────────────────────────────────────────────────

    _updateBullets(dt) {
      for (let i = this._playerBullets.length - 1; i >= 0; i--) {
        const b = this._playerBullets[i];
        b.prevZ = b.mesh.position.z;
        b.prevX = b.mesh.position.x;
        b.prevY = b.mesh.position.y;
        b.mesh.position.x += (b.vx || 0) * dt;
        b.mesh.position.y += (b.vy || 0) * dt;
        b.mesh.position.z += b.vz * dt;
        if (b.mesh.position.z < -16 || Math.abs(b.mesh.position.x) > 14) {
          this._scene.remove(b.mesh);
          this._playerBullets.splice(i, 1);
        }
      }
      for (let i = this._alienBullets.length - 1; i >= 0; i--) {
        const b = this._alienBullets[i];
        b.prevZ = b.mesh.position.z;
        b.prevX = b.mesh.position.x;
        b.prevY = b.mesh.position.y;
        b.mesh.position.x += (b.vx || 0) * dt;
        b.mesh.position.y += (b.vy || 0) * dt;
        b.mesh.position.z += b.vz * dt;
        if (b.mesh.position.z > 9 || Math.abs(b.mesh.position.x) > 14 || b.mesh.position.y < -4) {
          this._scene.remove(b.mesh);
          this._alienBullets.splice(i, 1);
        }
      }
    }

    _bulletHits(b, tx, ty, tz, tolX, tolY, tolZ) {
      const bx = b.mesh.position.x, by = b.mesh.position.y;
      if (Math.abs(bx - tx) > tolX) return false;
      if (Math.abs(by - ty) > tolY) return false;
      const z0 = b.prevZ !== undefined ? b.prevZ : b.mesh.position.z;
      const z1 = b.mesh.position.z;
      const lo = Math.min(z0, z1), hi = Math.max(z0, z1);
      return (lo <= tz + tolZ) && (hi >= tz - tolZ);
    }

    _updateUFO(dt) {
      const uc = this.cfg.ufo;
      const range = uc.halfRangeX || 6;
      if (!this._ufo) {
        this._ufoTimer -= dt;
        if (this._ufoTimer <= 0) {
          const dir = Math.random() < 0.5 ? 1 : -1;
          const mesh = buildUFO();
          mesh.position.set(-dir * range, uc.y, uc.z);
          this._scene.add(mesh);
          this._ufo = { mesh, dir, spin: 0 };
          this._ufoTimer = GF.Math.rand(...uc.spawnInterval);
          this._sfx('ufoAppear');
        }
      } else {
        this._ufo.mesh.position.x += this._ufo.dir * uc.speed * dt;
        this._ufo.spin += dt * 4;
        this._ufo.mesh.rotation.y = this._ufo.spin;
        if (Math.abs(this._ufo.mesh.position.x) > range) {
          this._scene.remove(this._ufo.mesh);
          this._ufo = null;
        }
      }
    }

    // ── Collisions ───────────────────────────────────────────────────────────

    _checkCollisions() {
      // Player bullets → aliens
      for (let i = this._playerBullets.length - 1; i >= 0; i--) {
        const b = this._playerBullets[i];
        let consumed = false;

        for (let j = 0; j < this._aliens.length; j++) {
          const a = this._aliens[j];
          if (!a.alive || a.state === 'waiting') continue;
          const ax = a.mesh.position.x, ay = a.mesh.position.y, az = a.mesh.position.z;
          // Diving aliens get a bigger hitbox (they're closer / faster)
          const sz = a.state === 'diving' ? 0.7 : 0.55;
          if (this._bulletHits(b, ax, ay, az, sz, sz, sz)) {
            this._killAlien(a, a.state === 'diving');
            consumed = true;
            break;
          }
        }
        if (consumed) {
          this._scene.remove(b.mesh);
          this._playerBullets.splice(i, 1);
          continue;
        }

        // Player bullets → Boss
        if (this._boss && this._boss.state !== 'entering') {
          const bm = this._boss;
          if (this._bulletHits(b, bm.x, bm.y, bm.z + 0.2, 1.7, 0.6, 0.8)) {
            this._damageBoss(1);
            this._scene.remove(b.mesh);
            this._playerBullets.splice(i, 1);
            continue;
          }
        }

        // Player bullets → UFO
        if (this._ufo) {
          const um = this._ufo.mesh.position;
          if (this._bulletHits(b, um.x, um.y, um.z, 0.85, 0.5, 0.6)) {
            const pts = GF.Math.randChoice(this.cfg.ufo.points);
            G.score += pts;
            this.fx.burst(um.x, um.y, um.z, 0xff4444, { count: 28, speed: 6, life: 0.9 });
            this._scene.remove(this._ufo.mesh);
            this._ufo = null;
            this._sfx('ufoHit');
            this._scene.remove(b.mesh);
            this._playerBullets.splice(i, 1);
            this._addShake(0.18);
            this._checkExtraLife();
            continue;
          }
        }
      }

      // Alien bullets → player
      for (let i = this._alienBullets.length - 1; i >= 0; i--) {
        const b = this._alienBullets[i];
        if (this._playerAlive && this._playerInvincible <= 0) {
          const pm = this._playerMesh.position;
          if (this._bulletHits(b, pm.x, pm.y, pm.z, 0.55, 0.6, 0.6)) {
            this._scene.remove(b.mesh);
            this._alienBullets.splice(i, 1);
            this._onPlayerHit();
          }
        }
      }

      // Diving aliens body-slam the player
      if (this._playerAlive && this._playerInvincible <= 0) {
        const pm = this._playerMesh.position;
        for (const a of this._aliens) {
          if (!a.alive || a.state !== 'diving') continue;
          const dx = a.mesh.position.x - pm.x;
          const dy = a.mesh.position.y - pm.y;
          const dz = a.mesh.position.z - pm.z;
          if (Math.abs(dx) < 0.7 && Math.abs(dy) < 0.7 && Math.abs(dz) < 0.7) {
            // Kill alien too (kamikaze)
            this._killAlien(a, true);
            this._onPlayerHit();
            break;
          }
        }
      }
    }

    _killAlien(a, fromDive) {
      a.alive = false;
      this._scene.remove(a.mesh);
      const px = a.mesh.position.x, py = a.mesh.position.y, pz = a.mesh.position.z;
      this.fx.burst(px, py, pz, a.color, { count: 22, speed: 5.5, life: 0.75 });
      const mult = fromDive ? 2 : 1;
      const pts = (a.points + G.level * 4) * mult;
      G.score += pts;
      this._sfx('alienDie');
      this._maybeDropPowerup(px, py, pz, fromDive);
      this._checkExtraLife();
    }

    _onPlayerHit() {
      if (!this._playerAlive || this._playerInvincible > 0) return;
      // Shield absorbs
      if (this._activePowerups.shield) {
        delete this._activePowerups.shield;
        this._shieldMesh.visible = false;
        this._sfx('shield');
        const pm = this._playerMesh.position;
        this.fx.burst(pm.x, pm.y, pm.z, 0x4488ff, { count: 30, speed: 5, life: 0.6, size: 0.10 });
        this._addShake(0.15);
        return;
      }
      this._playerAlive = false;
      G.lives--;
      this._activePowerups = {};
      this._shieldMesh.visible = false;
      this._sfx('playerDie');
      const pm = this._playerMesh.position;
      this.fx.burst(pm.x, pm.y, pm.z, 0x00e5ff, { count: 40, speed: 6.5, life: 1.2, size: 0.14 });
      this.fx.burst(pm.x, pm.y, pm.z, 0xffaa00, { count: 20, speed: 4.5, life: 0.9, size: 0.10 });
      this._addShake(0.5);
      this._playerMesh.visible = false;
      this.state = STATE.DEAD;
      this._stateT = 0;
    }

    _onLevelClear() {
      this._sfx('levelUp');
      this.state = STATE.LEVEL_CLEAR;
      this._stateT = 0;
      this._addShake(0.2);
    }

    _checkExtraLife() {
      if (!G.extraGiven && G.score >= this.cfg.scoring.extraLifeAt) {
        G.extraGiven = true;
        G.lives++;
        this._sfx('extraLife');
      }
    }

    _addShake(amt) { this._camShake = Math.max(this._camShake, amt); }

    _updateCamera(dt) {
      const targetX = this.state === STATE.TITLE ? Math.sin(this._titleT * 0.4) * 2.5 : this._playerMesh.position.x * 0.18;
      const lf = Math.min(1, dt * 3);
      this._cam.position.x += (targetX - this._cam.position.x) * lf;

      if (this._camShake > 0) {
        const m = this._camShake;
        this._cam.position.y += (Math.random() - 0.5) * m;
        this._cam.position.x += (Math.random() - 0.5) * m;
      } else {
        this._cam.position.y += (2.9 - this._cam.position.y) * lf;
      }
      this._cam.lookAt(this._cam.position.x * 0.5, 2.0, -3);
    }

    // ── 2D HUD ───────────────────────────────────────────────────────────────

    _drawCrosshair(ctx) {
      // Project the player's forward bullet trajectory onto the alien formation
      // plane (z = aliens.startZ) and draw a crosshair at that screen position.
      const pm = this._playerMesh.position;
      const targetZ = this.cfg.aliens.startZ;
      const target = new THREE.Vector3(pm.x, pm.y + 0.3, targetZ);
      const proj = this.three3d.worldToScreen(target);
      if (proj.depth > 1 || proj.depth < -1) return;
      const x = proj.x, y = proj.y;
      const r = 14;
      ctx.save();
      ctx.strokeStyle = '#00ffaa';
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = 0.85;
      // Outer ring
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
      // Inner dot
      ctx.fillStyle = '#00ffaa';
      ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
      // Tick marks
      ctx.beginPath();
      ctx.moveTo(x - r - 6, y); ctx.lineTo(x - r - 2, y);
      ctx.moveTo(x + r + 2, y); ctx.lineTo(x + r + 6, y);
      ctx.moveTo(x, y - r - 6); ctx.lineTo(x, y - r - 2);
      ctx.moveTo(x, y + r + 2); ctx.lineTo(x, y + r + 6);
      ctx.stroke();
      ctx.restore();
    }

    _drawBossHUD(ctx) {
      const b = this._boss;
      if (!b || b.state === 'entering') return;
      const W = this.W;
      const UI = GF.UISystem;
      const barW = Math.min(W - 80, 600), barH = 16;
      const x = (W - barW) / 2;
      const y = 50;
      const frac = Math.max(0, b.hp / b.maxHp);
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(x, y, barW, barH);
      // Gradient fill
      const grad = ctx.createLinearGradient(x, y, x + barW, y);
      grad.addColorStop(0, '#ff2266');
      grad.addColorStop(0.5, '#ff66cc');
      grad.addColorStop(1, '#ffaaff');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barW * frac, barH);
      ctx.strokeStyle = '#ff66cc';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, barW, barH);
      ctx.restore();
      UI.drawText(ctx, `MOTHERSHIP — STAGE ${b.stage}`, W/2, y - 6, {
        font: 'bold 12px monospace', color: '#ff88dd', align: 'center', baseline: 'bottom',
        glow: '#ff2266', glowBlur: 4,
      });
    }

    _drawPowerupHUD(ctx) {
      const types = ['rapidFire', 'doubleShot', 'tripleShot', 'shield'];
      const labels = { rapidFire: 'RAPID', doubleShot: 'TWIN', tripleShot: 'TRIPLE', shield: 'SHIELD' };
      const colors = { rapidFire: '#ff8800', doubleShot: '#ffcc00', tripleShot: '#aa66ff', shield: '#4488ff' };
      let y = 50;
      const UI = GF.UISystem;
      for (const t of types) {
        const ap = this._activePowerups[t];
        if (!ap) continue;
        const remaining = ap.timer === Infinity ? 1 : Math.max(0, ap.timer / ap.duration);
        const w = 90, h = 10;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(8, y, w, h);
        ctx.fillStyle = colors[t];
        ctx.fillRect(8, y, w * remaining, h);
        ctx.strokeStyle = colors[t]; ctx.lineWidth = 1;
        ctx.strokeRect(8, y, w, h);
        ctx.restore();
        UI.drawText(ctx, labels[t], 102, y + 5, {
          font: 'bold 10px monospace', color: colors[t], baseline: 'middle',
        });
        y += 16;
      }
    }

    _render2D(ctx) {
      const W = this.W, H = this.H;
      const UI = GF.UISystem;

      if (this.state === STATE.TITLE) {
        ctx.fillStyle = 'rgba(0,0,0,0.40)';
        ctx.fillRect(0, 0, W, H);
        UI.drawText(ctx, 'GALAGA  STRIKE  3D', W/2, 90, {
          font: 'bold 52px monospace', color: '#00e5ff', align: 'center',
          glow: '#00e5ff', glowBlur: 22, stroke: '#003355', strokeWidth: 3, shadow: true,
        });
        UI.drawText(ctx, 'SWOOPING SWARMS · POWERUPS · 3D DOGFIGHT', W/2, 140, {
          font: 'bold 14px monospace', color: '#ff66cc', align: 'center',
          glow: '#ff44aa', glowBlur: 8,
        });
        UI.drawText(ctx, `HI-SCORE  ${G.hiScore}`, W/2, 180, {
          font: '18px monospace', color: '#ffcc00', align: 'center',
        });
        const lines = [
          'ARROW KEYS / WASD  —  FLY (4-WAY)',
          'SPACE / Z          —  FIRE',
          'P / ESC            —  PAUSE',
        ];
        lines.forEach((l, i) => {
          UI.drawText(ctx, l, W/2, 250 + i * 26, {
            font: '15px monospace', color: '#aaccff', align: 'center',
          });
        });
        const powerLine = 'RAPID  ·  TWIN  ·  TRIPLE  ·  SHIELD  ·  1-UP';
        UI.drawText(ctx, 'PICKUPS:', W/2, 360, {
          font: '12px monospace', color: '#888', align: 'center',
        });
        UI.drawText(ctx, powerLine, W/2, 380, {
          font: 'bold 13px monospace', color: '#ffcc00', align: 'center', glow: '#aa6600', glowBlur: 4,
        });
        if (Math.floor(this._titleT * 2) % 2 === 0) {
          UI.drawText(ctx, 'PRESS SPACE TO START', W/2, H - 60, {
            font: 'bold 22px monospace', color: '#ffffff', align: 'center',
            glow: '#ffffff', glowBlur: 10,
          });
        }
        UI.drawText(ctx, `FPS: ${this.engine.fps}`, 8, 8, { font: '11px monospace', color: '#446688' });
        return;
      }

      // Top HUD bar
      UI.drawPanel(ctx, 0, 0, W, 40, {
        bgColor: 'rgba(0,8,24,0.75)', borderColor: 'rgba(0,229,255,0.4)', borderWidth: 1,
      });
      UI.drawText(ctx, `SCORE  ${G.score}`, 16, 20, {
        font: 'bold 18px monospace', color: '#ffffff', baseline: 'middle',
        glow: '#00e5ff', glowBlur: 4,
      });
      UI.drawText(ctx, `HI  ${Math.max(G.hiScore, G.score)}`, W/2, 20, {
        font: 'bold 16px monospace', color: '#ffcc00', align: 'center', baseline: 'middle',
      });
      UI.drawText(ctx, `STAGE ${G.level}`, W/2 + 140, 20, {
        font: '14px monospace', color: '#88ccff', baseline: 'middle',
      });
      const livesText = 'LIVES ' + '▲'.repeat(Math.max(0, G.lives));
      UI.drawText(ctx, livesText, W - 16, 20, {
        font: 'bold 16px monospace', color: '#00e5ff', align: 'right', baseline: 'middle',
        glow: '#00e5ff', glowBlur: 4,
      });

      // Crosshair while playing
      if (this.state === STATE.PLAYING && this._playerAlive) {
        this._drawCrosshair(ctx);
      }
      this._drawPowerupHUD(ctx);
      this._drawBossHUD(ctx);

      if (this.state === STATE.BOSS_RESULTS && this._bossResults) {
        const r = this._bossResults;
        ctx.fillStyle = 'rgba(0,0,0,0.78)';
        ctx.fillRect(0, 0, W, H);
        UI.drawPanel(ctx, W/2 - 280, H/2 - 140, 560, 280, {
          bgColor: 'rgba(20,0,40,0.92)', borderColor: '#ff66cc', borderWidth: 3, radius: 12,
        });
        UI.drawText(ctx, 'BOSS DEFEATED!', W/2, H/2 - 100, {
          font: 'bold 38px monospace', color: '#ff66cc', align: 'center', baseline: 'middle',
          glow: '#ff44aa', glowBlur: 22, stroke: '#000', strokeWidth: 3, shadow: true,
        });
        const t = Math.floor(r.time);
        const rows = [
          ['STAGE',         `${r.stage}`,  '#88ccff'],
          ['TIME',          `${t}s`,       '#88ccff'],
          ['BONUS POINTS', `+${r.bonus}`,  '#ffcc00'],
          ['LIVES EARNED', `+${r.livesAwarded}`, '#44ff88'],
          ['TOTAL SCORE',  `${r.score}`,   '#ffffff'],
        ];
        rows.forEach((row, i) => {
          const y = H/2 - 50 + i * 28;
          UI.drawText(ctx, row[0], W/2 - 200, y, {
            font: 'bold 15px monospace', color: '#aaaaaa', baseline: 'middle',
          });
          UI.drawText(ctx, row[1], W/2 + 200, y, {
            font: 'bold 17px monospace', color: row[2], align: 'right', baseline: 'middle',
            glow: row[2], glowBlur: 4,
          });
        });
        if (this._stateT > 2.4 && Math.floor(this._stateT * 2) % 2 === 0) {
          UI.drawText(ctx, 'PRESS SPACE TO CONTINUE', W/2, H/2 + 110, {
            font: 'bold 14px monospace', color: '#ffffff', align: 'center', baseline: 'middle',
          });
        }
      }

      if (this._isBossLevel && this._boss && this._bossWarning && this._stateT < 2.0 && this.state === STATE.PLAYING) {
        const a = Math.min(1, this._stateT / 0.3) * Math.max(0, 1 - (this._stateT - 1.4) / 0.6);
        ctx.save();
        ctx.globalAlpha = a;
        UI.drawPanel(ctx, W/2 - 220, 60, 440, 60, {
          bgColor: 'rgba(60,0,20,0.85)', borderColor: '#ff2266', borderWidth: 2, radius: 8,
        });
        UI.drawText(ctx, '⚠  BOSS APPROACHING  ⚠', W/2, 90, {
          font: 'bold 24px monospace', color: '#ff66cc', align: 'center', baseline: 'middle',
          glow: '#ff2266', glowBlur: 14,
        });
        ctx.restore();
      }

      if (this.state === STATE.LEVEL_CLEAR) {
        UI.drawPanel(ctx, W/2 - 220, H/2 - 50, 440, 100, {
          bgColor: 'rgba(0,0,0,0.82)', borderColor: '#00e5ff', borderWidth: 2, radius: 8,
        });
        UI.drawText(ctx, 'STAGE CLEAR!', W/2, H/2 - 12, {
          font: 'bold 36px monospace', color: '#00e5ff', align: 'center', baseline: 'middle',
          glow: '#00e5ff', glowBlur: 16, shadow: true,
        });
        UI.drawText(ctx, `STAGE ${G.level + 1} INCOMING`, W/2, H/2 + 22, {
          font: '16px monospace', color: '#ffffff', align: 'center', baseline: 'middle',
        });
      }

      if (this.state === STATE.GAME_OVER) {
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, 0, W, H);
        UI.drawText(ctx, 'GAME OVER', W/2, H/2 - 50, {
          font: 'bold 56px monospace', color: '#ff4444', align: 'center',
          glow: '#ff0000', glowBlur: 18, stroke: '#000', strokeWidth: 3,
        });
        UI.drawText(ctx, `FINAL SCORE: ${G.score}`, W/2, H/2 + 10, {
          font: 'bold 22px monospace', color: '#ffffff', align: 'center',
        });
        UI.drawText(ctx, `HI-SCORE: ${G.hiScore}`, W/2, H/2 + 42, {
          font: '18px monospace', color: '#ffcc00', align: 'center',
        });
        if (this._stateT > 1.5 && Math.floor(this._stateT * 2) % 2 === 0) {
          UI.drawText(ctx, 'PRESS SPACE TO CONTINUE', W/2, H - 60, {
            font: 'bold 18px monospace', color: '#ffffff', align: 'center',
          });
        }
      }

      if (this._paused) {
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, 0, W, H);
        UI.drawText(ctx, 'PAUSED', W/2, H/2, {
          font: 'bold 56px monospace', color: '#ffffff', align: 'center', baseline: 'middle',
          glow: '#aaaaff', glowBlur: 22,
        });
        UI.drawText(ctx, 'Press P or ESC to resume', W/2, H/2 + 50, {
          font: '16px monospace', color: '#aaaaaa', align: 'center',
        });
      }
    }
  }

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  window.addEventListener('GF:ready', async function () {
    if (!window.THREE) {
      console.error('Space Invaders 3D requires Three.js — load it before the framework bundle.');
      return;
    }
    try {
      const cfg = GF.GAME_CONFIG;
      const { engine } = await GF.createGameAsync(cfg.engine, cfg.physics, { gameName: 'SpaceInvaders3D' });
      const three3d = new GF.Three3DScene({ bgColor: 0x000010 });
      engine.addSystem(three3d);
      const game = new SpaceInvaders3DGame(engine, three3d);
      engine.start();
      window._si3d = game;
    } catch (e) {
      console.error('[SpaceInvaders3D] Init error:', e);
    }
  });

})(window.GF = window.GF || {});
