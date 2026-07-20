// GameFramework/games/ShadowStrike3D/ShadowStrike3D.js
// Shadow Strike reimagined in 3D using Three.js.

(function (GF) {
  'use strict';

  const STATE = { MENU:'menu', COUNTDOWN:'countdown', FIGHT:'fight', ROUND_END:'round_end', GAME_OVER:'game_over' };
  const ATTACK_MOVES = ['lightPunch','heavyPunch','lightKick','heavyKick','special'];

  // ── Material / mesh helpers ─────────────────────────────────────────────────

  function mkMat(color, opts) {
    opts = opts || {};
    return new THREE.MeshStandardMaterial({
      color,
      roughness: opts.r !== undefined ? opts.r : 0.85,
      metalness: opts.m || 0,
      emissive: opts.e ? new THREE.Color(opts.e) : new THREE.Color(0),
      emissiveIntensity: opts.ei || 0,
    });
  }

  function mkBox(w, h, d, c, o) {
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mkMat(c, o));
  }
  function mkCyl(r, h, segs, c, o) {
    return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segs || 8), mkMat(c, o));
  }
  function mkCone(r, h, segs, c, o) {
    return new THREE.Mesh(new THREE.ConeGeometry(r, h, segs || 6), mkMat(c, o));
  }
  function mkSphere(r, c, o) {
    return new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), mkMat(c, o));
  }

  // Helper: create mesh, set position, add to parent, return mesh
  function add(parent, mesh, x, y, z) {
    mesh.position.set(x || 0, y || 0, z || 0);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // ── Kuro mesh (dark ninja) ──────────────────────────────────────────────────

  function buildKuro() {
    const C = {
      body:0x1a1a3e, hi:0x2a2a5e, mask:0x0c0c22,
      belt:0x00e5ff, eye:0xff3300, glove:0x0c0c22, boot:0x111130, scarf:0x003355
    };
    const root = new THREE.Group();

    // Torso group — pivot at hip (y=0.60)
    const tG = new THREE.Group();
    tG.position.set(0, 0.60, 0);
    tG.name = 'torso';

    add(tG, mkBox(0.25, 0.40, 0.18, C.body),          0, 0.20, 0);
    add(tG, mkBox(0.09, 0.26, 0.20, C.hi),             0, 0.24, 0);
    add(tG, mkBox(0.30, 0.05, 0.20, C.belt, {e:C.belt, ei:0.9, r:0.2}), 0, 0.02, 0);
    add(tG, mkBox(0.30, 0.07, 0.22, C.scarf),          0, 0.42, 0.01);

    // Head group — pivot at neck
    const hG = new THREE.Group();
    hG.position.set(0, 0.44, 0);
    hG.name = 'head';
    add(hG, mkBox(0.22, 0.20, 0.18, C.mask),           0, 0.10, 0);
    add(hG, mkCone(0.04, 0.13, 4, C.body),        -0.04, 0.26, 0);
    add(hG, mkCone(0.04, 0.14, 4, C.body),         0.05, 0.29, 0);
    const em = mkMat(C.eye, {e:C.eye, ei:1.3, r:0.1});
    [-0.065, 0.065].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.038, 6, 6), em);
      add(hG, eye, ex, 0.10, 0.09);
    });
    tG.add(hG);

    // Arms
    const lA = new THREE.Group(); lA.position.set(-0.16, 0.35, 0); lA.name = 'lArm';
    add(lA, mkCyl(0.065, 0.28, 6, C.body),             0, -0.14, 0);
    add(lA, mkBox(0.10, 0.10, 0.11, C.glove),          0, -0.31, 0);
    tG.add(lA);

    const rA = new THREE.Group(); rA.position.set( 0.16, 0.35, 0); rA.name = 'rArm';
    add(rA, mkCyl(0.065, 0.28, 6, C.body),             0, -0.14, 0);
    add(rA, mkBox(0.10, 0.10, 0.11, C.glove),          0, -0.31, 0);
    tG.add(rA);

    root.add(tG);

    // Legs — pivot at hip
    const lL = new THREE.Group(); lL.position.set(-0.09, 0.60, 0); lL.name = 'lLeg';
    add(lL, mkCyl(0.085, 0.29, 6, C.hi),               0, -0.145, 0);
    add(lL, mkCyl(0.075, 0.27, 6, C.hi),               0, -0.42,  0);
    add(lL, mkBox(0.14, 0.07, 0.16, C.boot),         0.01, -0.60, 0.01);
    root.add(lL);

    const rL = new THREE.Group(); rL.position.set( 0.09, 0.60, 0); rL.name = 'rLeg';
    add(rL, mkCyl(0.085, 0.29, 6, C.hi),               0, -0.145, 0);
    add(rL, mkCyl(0.075, 0.27, 6, C.hi),               0, -0.42,  0);
    add(rL, mkBox(0.14, 0.07, 0.16, C.boot),         0.01, -0.60, 0.01);
    root.add(rL);

    // Cyan aura point light
    const aura = new THREE.PointLight(0x00e5ff, 0, 1.8);
    aura.position.set(0, 0.70, 0);
    root.add(aura);

    root.userData.b    = { tG, hG, lA, rA, lL, rL };
    root.userData.aura = aura;
    root.userData.hipY = 0.60;
    return root;
  }

  // ── Hana mesh (fire warrior) ────────────────────────────────────────────────

  function buildHana() {
    const C = {
      body:0x3a0c0c, hi:0x6e1a1a, arm:0x8b0000,
      belt:0xff6600, eye:0xffdd00, glove:0x5a0000, boot:0x2a0000, hair:0xcc2200
    };
    const root = new THREE.Group();

    const tG = new THREE.Group();
    tG.position.set(0, 0.60, 0);
    tG.name = 'torso';

    add(tG, mkBox(0.30, 0.42, 0.20, C.body),           0, 0.21, 0);
    add(tG, mkBox(0.26, 0.22, 0.22, C.arm),            0, 0.30, 0);
    add(tG, mkBox(0.09, 0.10, 0.24, C.hi),          -0.06, 0.32, 0);
    add(tG, mkBox(0.09, 0.10, 0.24, C.hi),           0.06, 0.32, 0);
    add(tG, mkBox(0.36, 0.06, 0.22, C.belt, {e:C.belt, ei:0.8, r:0.2}), 0, 0.02, 0);

    // Head group
    const hG = new THREE.Group();
    hG.position.set(0, 0.47, 0);
    hG.name = 'head';
    add(hG, mkBox(0.26, 0.22, 0.20, C.body),           0, 0.11,  0);
    add(hG, mkBox(0.28, 0.05, 0.22, C.belt, {e:C.belt, ei:0.5}), 0, 0.12, 0);
    const hairMat = mkMat(C.hair, {r:0.9});
    [[-0.07,0.30], [0,0.34], [0.08,0.28]].forEach(([hx,hy]) => {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 4), hairMat);
      add(hG, sp, hx, hy, 0);
    });
    const em2 = mkMat(C.eye, {e:C.eye, ei:1.1, r:0.1});
    [-0.08, 0.08].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), em2);
      add(hG, eye, ex, 0.11, 0.10);
    });
    // Battle scar
    add(hG, mkBox(0.02, 0.10, 0.02, C.hair), 0.02, 0.09, 0.10);
    tG.add(hG);

    // Arms (brawny)
    const lA = new THREE.Group(); lA.position.set(-0.19, 0.36, 0); lA.name = 'lArm';
    add(lA, mkCyl(0.085, 0.30, 6, C.hi),               0, -0.15, 0);
    add(lA, mkBox(0.13, 0.11, 0.13, C.glove),          0, -0.34, 0);
    tG.add(lA);

    const rA = new THREE.Group(); rA.position.set( 0.19, 0.36, 0); rA.name = 'rArm';
    add(rA, mkCyl(0.085, 0.30, 6, C.hi),               0, -0.15, 0);
    add(rA, mkBox(0.13, 0.11, 0.13, C.glove),          0, -0.34, 0);
    tG.add(rA);

    root.add(tG);

    // Legs (stockier)
    const lL = new THREE.Group(); lL.position.set(-0.11, 0.60, 0); lL.name = 'lLeg';
    add(lL, mkCyl(0.10, 0.29, 6, C.hi),                0, -0.145, 0);
    add(lL, mkCyl(0.09, 0.27, 6, C.hi),                0, -0.42,  0);
    add(lL, mkBox(0.17, 0.08, 0.18, C.boot),         0.01, -0.60, 0.01);
    root.add(lL);

    const rL = new THREE.Group(); rL.position.set( 0.11, 0.60, 0); rL.name = 'rLeg';
    add(rL, mkCyl(0.10, 0.29, 6, C.hi),                0, -0.145, 0);
    add(rL, mkCyl(0.09, 0.27, 6, C.hi),                0, -0.42,  0);
    add(rL, mkBox(0.17, 0.08, 0.18, C.boot),         0.01, -0.60, 0.01);
    root.add(rL);

    // Orange aura
    const aura = new THREE.PointLight(0xff6600, 0, 1.8);
    aura.position.set(0, 0.70, 0);
    root.add(aura);

    root.userData.b    = { tG, hG, lA, rA, lL, rL };
    root.userData.aura = aura;
    root.userData.hipY = 0.60;
    return root;
  }

  // ── Pose animator ───────────────────────────────────────────────────────────

  function peakCurve(t, dur) {
    const p = Math.min(t / dur, 1);
    return p < 0.45 ? p / 0.45 : Math.max(0, 1 - (p - 0.45) / 0.55);
  }

  function applyPose(root, state, at, st, facing) {
    const { tG, hG, lA, rA, lL, rL } = root.userData.b;
    const hipY = root.userData.hipY;
    const sin = Math.sin;

    // Reset
    tG.position.y = hipY;
    tG.rotation.set(0, 0, 0);
    hG.rotation.set(0, 0, 0);
    lA.rotation.set(0, 0, 0);
    rA.rotation.set(0, 0, 0);
    lL.rotation.set(0, 0, 0);
    rL.rotation.set(0, 0, 0);
    root.rotation.z = 0;

    switch (state) {
      case 'idle':
        tG.position.y = hipY + sin(at * 2.2) * 0.012;
        hG.rotation.y = sin(at * 1.3) * 0.04;
        lA.rotation.z =  0.08;
        rA.rotation.z = -0.08;
        break;

      case 'walk': {
        const w = at * 9;
        lL.rotation.x =  sin(w) * 0.55;
        rL.rotation.x = -sin(w) * 0.55;
        lA.rotation.x = -sin(w) * 0.38;
        rA.rotation.x =  sin(w) * 0.38;
        tG.rotation.z =  sin(w) * 0.04;
        tG.position.y =  hipY + Math.abs(sin(w)) * 0.018;
        break;
      }

      case 'jump':
        lL.rotation.x = -0.55; rL.rotation.x = -0.55;
        lA.rotation.x = -0.90; rA.rotation.x = -0.90;
        tG.rotation.x = -0.12;
        break;

      case 'fall':
        lL.rotation.x = 0.35; rL.rotation.x = 0.35;
        lA.rotation.x = 0.50; rA.rotation.x = 0.50;
        tG.rotation.x = 0.10;
        break;

      case 'crouch':
        tG.position.y = hipY - 0.22;
        lL.rotation.x = 1.00; rL.rotation.x = 1.00;
        lA.rotation.x = 0.28; rA.rotation.x = 0.28;
        tG.rotation.x = 0.18;
        break;

      case 'block':
        lA.rotation.x = -1.50; rA.rotation.x = -1.50;
        lA.rotation.z =  0.30; rA.rotation.z = -0.30;
        hG.rotation.x =  0.18;
        break;

      case 'hit':
        tG.rotation.x = -0.28;
        tG.rotation.z = (facing > 0 ? 1 : -1) * 0.18;
        lA.rotation.x = -0.45; rA.rotation.x = -0.45;
        hG.rotation.x = -0.22;
        break;

      case 'win': {
        const w = at * 4;
        lA.rotation.x = -1.8 + sin(w) * 0.15;
        rA.rotation.x = -1.8 + sin(w + 0.5) * 0.15;
        hG.rotation.x = -0.15;
        tG.position.y = hipY + sin(w * 0.6) * 0.04;
        break;
      }

      case 'ko': {
        const f = Math.min(st / 0.55, 1);
        root.rotation.z = (facing > 0 ? -1 : 1) * f * 1.55;
        lA.rotation.x = 1.0; rA.rotation.x = 1.0;
        break;
      }

      case 'lightPunch': {
        const p = peakCurve(st, 0.25);
        rA.rotation.x = -p * 1.55; rA.rotation.z = -p * 0.15;
        tG.rotation.z =  p * 0.16;
        break;
      }
      case 'heavyPunch': {
        const p = peakCurve(st, 0.42);
        rA.rotation.x = -p * 1.80; rA.rotation.z = -p * 0.28;
        lA.rotation.x =  p * 0.50;
        tG.rotation.z =  p * 0.28; tG.rotation.x = -p * 0.12;
        break;
      }
      case 'lightKick': {
        const p = peakCurve(st, 0.28);
        rL.rotation.x = -p * 1.35; lL.rotation.x = p * 0.18;
        tG.rotation.z =  p * 0.10;
        break;
      }
      case 'heavyKick': {
        const p = peakCurve(st, 0.45);
        rL.rotation.x = -p * 1.65; lL.rotation.x = p * 0.28;
        tG.rotation.z =  p * 0.20; tG.rotation.x = -p * 0.10;
        lA.rotation.x = -p * 0.38;
        break;
      }
      case 'special': {
        const p = peakCurve(st, 0.52);
        lA.rotation.x = -p * 1.65; rA.rotation.x = -p * 1.65;
        lA.rotation.z =  p * 0.38; rA.rotation.z = -p * 0.38;
        tG.rotation.x = -p * 0.32; hG.rotation.x = -p * 0.18;
        if (root.userData.aura) root.userData.aura.intensity = p * 2.8;
        break;
      }
    }

    // Aura only during special
    if (state !== 'special' && root.userData.aura) {
      root.userData.aura.intensity = 0;
    }
  }

  // ── Stage ───────────────────────────────────────────────────────────────────

  function buildStage(scene, hw) {
    // Main platform
    const plat = mkBox(hw * 2, 0.18, 2.6, 0x180830, {r:0.95});
    plat.position.set(0, -0.09, 0);
    plat.receiveShadow = true;
    scene.add(plat);

    // Neon front/back edges
    const edgeMat = mkMat(0xaa00ff, {e:0xaa00ff, ei:0.9, r:0.1});
    [-1.30, 1.30].forEach(ez => {
      const e = new THREE.Mesh(new THREE.BoxGeometry(hw * 2, 0.025, 0.05), edgeMat);
      e.position.set(0, 0.01, ez);
      scene.add(e);
    });

    // Boundary pillars (cyan)
    const bpMat = mkMat(0x00e5ff, {e:0x00e5ff, ei:0.5, r:0.2});
    [-hw, hw].forEach(bx => {
      const bp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.6, 0.06), bpMat);
      bp.position.set(bx, 0.80, 0);
      scene.add(bp);
    });

    // Floor grid
    const gm = new THREE.LineBasicMaterial({color:0x330055, transparent:true, opacity:0.45});
    for (let gx = -hw; gx <= hw; gx += 0.8) {
      const g = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(gx, 0.001, -1.3),
          new THREE.Vector3(gx, 0.001,  1.3)
        ]), gm);
      scene.add(g);
    }
    for (let gz = -1.3; gz <= 1.3; gz += 0.65) {
      const g = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-hw, 0.001, gz),
          new THREE.Vector3( hw, 0.001, gz)
        ]), gm);
      scene.add(g);
    }

    // Atmospheric background pillars
    const dpMat = mkMat(0x0a0018, {r:1});
    [[-6,0,-7],[6,0,-7],[-9,0,-11],[9,0,-11],[0,0,-9]].forEach(([px,py,pz]) => {
      const dp = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 10, 8), dpMat);
      dp.position.set(px, py, pz);
      scene.add(dp);
      const rm = mkMat(0x5500aa, {e:0x5500aa, ei:0.8});
      const rn = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.06), rm);
      rn.position.set(px, 2.0, pz + 0.45);
      scene.add(rn);
    });

    // Infinite dark floor
    const fp = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      mkMat(0x070012, {r:1})
    );
    fp.rotation.x = -Math.PI / 2;
    fp.position.y = -0.18;
    scene.add(fp);
  }

  function buildLighting(scene) {
    scene.add(new THREE.AmbientLight(0x220033, 0.85));

    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(2, 9, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.width = sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.left = -9; sun.shadow.camera.right = 9;
    sun.shadow.camera.top  =  8; sun.shadow.camera.bottom = -4;
    scene.add(sun);

    const rim = new THREE.DirectionalLight(0xaa00ff, 0.55);
    rim.position.set(0, 4, -6);
    scene.add(rim);

    const p1l = new THREE.PointLight(0x00e5ff, 0.45, 9);
    p1l.position.set(-3.5, 2, 2);
    scene.add(p1l);

    const p2l = new THREE.PointLight(0xff6600, 0.45, 9);
    p2l.position.set(3.5, 2, 2);
    scene.add(p2l);

    const fg = new THREE.PointLight(0x330066, 1.4, 7);
    fg.position.set(0, 0.15, 0);
    scene.add(fg);

    return { floorGlow: fg };
  }

  // ── FxSystem ────────────────────────────────────────────────────────────────

  // Fireball flipbook sheet (game's own sprites/): 7x7 grid, 256px cells, 45 frames.
  const FB_COLS = 7, FB_FRAMES = 45, FB_FPS = 30;

  class FxSystem {
    constructor(scene) {
      this._s = scene; this._p = []; this._fl = []; this._fb = [];
      // Load the recolored fireball sheet once; each projectile clones it for its own UV.
      const tex = new THREE.TextureLoader().load('sprites/Fireball45Frames.png');
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;   // NPOT-safe
      tex.generateMipmaps = false;
      tex.minFilter = tex.magFilter = THREE.LinearFilter;
      this._fbBase = tex;
    }

    _fbSetFrame(o, frame) {
      const f = Math.min(frame, FB_FRAMES - 1);
      const c = f % FB_COLS, r = Math.floor(f / FB_COLS);
      o.tex.offset.set(c / FB_COLS, 1 - (r + 1) / FB_COLS);   // flip row: image top-left -> UV bottom-left
    }

    // Launch a fireball projectile from (x,y) travelling in facing `dir` (+1/-1).
    spawnFireball(x, y, dir) {
      const tex = this._fbBase.clone();
      tex.needsUpdate = true;
      tex.repeat.set(1 / FB_COLS, 1 / FB_COLS);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      const sp = new THREE.Sprite(mat);
      sp.scale.set(1.1, 1.1, 1);
      sp.position.set(x, y, 0.35);
      this._s.add(sp);
      const fl = new THREE.PointLight(0xff6a00, 4.5, 3.2);
      fl.position.set(x, y, 0.4);
      this._s.add(fl);
      const o = { sp, tex, mat, fl, dir, frame: 0, ft: 0, vx: dir * 4.6 };
      this._fbSetFrame(o, 0);
      this._fb.push(o);
    }

    _burst(x, y, color, count, speed, life) {
      const geo = new THREE.SphereGeometry(0.055, 4, 4);
      for (let i = 0; i < count; i++) {
        const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color, transparent:true}));
        mesh.position.set(x, y, (Math.random() - 0.5) * 0.5);
        this._s.add(mesh);
        const sp = speed * (0.5 + Math.random());
        this._p.push({
          mesh,
          vx: (Math.random() - 0.5) * sp * 1.5,
          vy: sp * 0.7 + Math.random() * sp,
          vz: (Math.random() - 0.5) * sp * 0.6,
          life, maxLife: life
        });
      }
      const fl = new THREE.PointLight(color, 5, 2.5);
      fl.position.set(x, y, 0.4);
      this._s.add(fl);
      this._fl.push({light: fl, life: 0.14});
    }

    spawnHit(x, y, color)     { this._burst(x, y, color, 10, 2.5, 0.38); }
    spawnSpecial(x, y, color) { this._burst(x, y, color, 20, 4.0, 0.60); }

    update(dt) {
      for (let i = this._p.length - 1; i >= 0; i--) {
        const p = this._p[i];
        p.vy -= 11 * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.life -= dt;
        const a = Math.max(0, p.life / p.maxLife);
        p.mesh.material.opacity = a;
        p.mesh.scale.setScalar(a * 0.8 + 0.2);
        if (p.life <= 0) {
          this._s.remove(p.mesh);
          p.mesh.geometry.dispose();
          p.mesh.material.dispose();
          this._p.splice(i, 1);
        }
      }
      for (let i = this._fl.length - 1; i >= 0; i--) {
        const f = this._fl[i];
        f.life -= dt;
        f.light.intensity = Math.max(0, (f.life / 0.14) * 5);
        if (f.life <= 0) { this._s.remove(f.light); this._fl.splice(i, 1); }
      }
      // Fireball projectiles: advance flipbook, travel forward, swell + fade, then retire.
      for (let i = this._fb.length - 1; i >= 0; i--) {
        const o = this._fb[i];
        o.ft += dt;
        while (o.ft >= 1 / FB_FPS) { o.ft -= 1 / FB_FPS; o.frame++; }
        o.sp.position.x += o.vx * dt;
        const t = o.frame / FB_FRAMES;
        o.sp.scale.setScalar(1.0 + t * 1.1);
        o.mat.opacity = o.frame >= FB_FRAMES - 8 ? Math.max(0, (FB_FRAMES - o.frame) / 8) : 1;
        this._fbSetFrame(o, o.frame);
        if (o.fl) { o.fl.position.set(o.sp.position.x, o.sp.position.y, 0.4); o.fl.intensity = 4.5 * o.mat.opacity; }
        if (o.frame >= FB_FRAMES) {
          this._s.remove(o.sp); this._s.remove(o.fl);
          o.mat.dispose(); o.tex.dispose();
          this._fb.splice(i, 1);
        }
      }
    }

    dispose() {
      this._p.forEach(p => { this._s.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose(); });
      this._fl.forEach(f => this._s.remove(f.light));
      this._fb.forEach(o => { this._s.remove(o.sp); this._s.remove(o.fl); o.mat.dispose(); o.tex.dispose(); });
      if (this._fbBase) this._fbBase.dispose();
      this._p = []; this._fl = []; this._fb = [];
    }
  }

  // ── Fighter3D ───────────────────────────────────────────────────────────────

  const ATTACK_DURS = { lightPunch:0.28, heavyPunch:0.44, lightKick:0.30, heavyKick:0.48, special:0.54 };

  class Fighter3D {
    constructor(cfg) {
      this.cfg = cfg; this.name = cfg.displayName; this.color = cfg.color;
      this.x = cfg.startX; this.y = 0; this.vy = 0; this.vx = 0; this.grounded = true;
      this.health = cfg.maxHealth; this.maxHealth = cfg.maxHealth;
      this.facing = cfg.startFacing; this.wins = 0;
      this.state = 'idle'; this.prevState = null;
      this.stateTimer = 0; this.stunTimer = 0;
      this.attackMove = null; this.attackLanded = false;
      this.animTime = 0; this.comboCount = 0; this.comboTimer = 0;
      this.mesh = null;
    }

    setMesh(m) { this.mesh = m; this._sync(); }

    resetForRound(cfg) {
      this.x = cfg.startX; this.y = 0; this.vy = 0; this.vx = 0; this.grounded = true;
      this.health = this.maxHealth; this.state = 'idle'; this.prevState = null;
      this.stateTimer = 0; this.stunTimer = 0;
      this.attackMove = null; this.attackLanded = false;
      this.animTime = 0; this.comboCount = 0; this.comboTimer = 0;
      if (this.mesh) { this.mesh.rotation.z = 0; this._sync(); }
    }

    _sync() {
      if (!this.mesh) return;
      this.mesh.position.set(this.x, this.y, 0);
      this.mesh.rotation.y = this.facing > 0 ? 0 : Math.PI;
    }

    _setState(s) {
      if (this.state === s) return;
      this.prevState = this.state; this.state = s; this.stateTimer = 0;
    }

    faceOpponent(o) {
      const d = o.x > this.x ? 1 : -1;
      if (d !== this.facing) {
        this.facing = d;
        if (this.mesh) this.mesh.rotation.y = d > 0 ? 0 : Math.PI;
      }
    }

    processInput(inp, actions, other) {
      if (this.state === 'ko' || this.state === 'win') return;
      if (this.state === 'idle' || this.state === 'walk' || this.state === 'crouch') {
        this.faceOpponent(other);
      }
      if (this.stunTimer > 0) { this.vx = 0; return; }

      // Attack
      if (this.state !== 'attack' && this.state !== 'hit') {
        for (const mv of ATTACK_MOVES) {
          if (inp.wasPressed(actions[mv])) {
            this._setState('attack');
            this.attackMove = mv;
            this.attackLanded = false;
            this.vx = 0;
            return;
          }
        }
      }
      if (this.state === 'attack' || this.state === 'hit') { this.vx = 0; return; }

      const left   = inp.isDown(actions.left);
      const right  = inp.isDown(actions.right);
      const jump   = inp.wasPressed(actions.jump);
      const crouch = inp.isDown(actions.crouch);
      const block  = inp.isDown(actions.block);

      if (block  && this.grounded) { this._setState('block');  this.vx = 0; return; }
      if (crouch && this.grounded) { this._setState('crouch'); this.vx = 0; return; }
      if (jump   && this.grounded) { this.vy = this.cfg.jumpPower; this.grounded = false; this._setState('jump'); }

      const spd = this.cfg.speed * (this.grounded ? 1 : 0.8);
      if (left)       { this.vx = -spd; this._setState('walk'); }
      else if (right) { this.vx =  spd; this._setState('walk'); }
      else            {
        this.vx = 0;
        if (this.grounded && (this.state==='walk'||this.state==='block'||this.state==='crouch')) {
          this._setState('idle');
        }
      }
    }

    receiveHit(moveDef, attackerFacing) {
      if (this.state === 'ko') return false;
      const blocking = (this.state === 'block');
      const dmg = Math.round(moveDef.damage * (blocking ? this.cfg.blockDamageMultiplier : 1));
      this.health = Math.max(0, this.health - dmg);
      this.x += attackerFacing * moveDef.knockback * 0.045;
      if (!blocking) this.vy = 1.8;
      if (this.health <= 0)   this._setState('ko');
      else if (!blocking) { this.stunTimer = moveDef.stun; this._setState('hit'); }
      return true;
    }

    tryHitOpponent(other) {
      if (this.state !== 'attack' || this.attackLanded || !this.attackMove) return false;
      const mv = this.cfg.moves[this.attackMove]; if (!mv) return false;
      const dur = ATTACK_DURS[this.attackMove] || 0.35;
      const pct = this.stateTimer / dur;
      if (pct < 0.28 || pct > 0.68) return false;
      if (Math.abs(other.x - this.x) > mv.range)  return false;
      if (Math.abs(other.y - this.y) > 0.80)       return false;
      const hit = other.receiveHit(mv, this.facing);
      if (hit) { this.attackLanded = true; this.comboCount++; this.comboTimer = 1.5; }
      return hit;
    }

    update(dt, hw) {
      this.stateTimer += dt;
      this.animTime   += dt;
      if (this.stunTimer  > 0) this.stunTimer  -= dt;
      if (this.comboTimer > 0) { this.comboTimer -= dt; if (this.comboTimer <= 0) this.comboCount = 0; }

      // Horizontal
      this.x += this.vx * dt;
      this.vx = 0;

      // Vertical physics
      if (!this.grounded) {
        this.vy -= this.cfg.gravity * dt;
        this.y  += this.vy * dt;
        if (this.state === 'jump' && this.vy < 0) this._setState('fall');
        if (this.y <= 0) {
          this.y = 0; this.vy = 0; this.grounded = true;
          if (this.state === 'fall' || this.state === 'jump') this._setState('idle');
        }
      }

      // Stage bounds
      this.x = Math.max(-hw + 0.1, Math.min(hw - 0.1, this.x));

      // Auto-end attack / hit
      const dur = ATTACK_DURS[this.attackMove] || 0.35;
      if (this.state === 'attack' && this.stateTimer >= dur) this._setState('idle');
      if (this.state === 'hit'    && this.stunTimer <= 0)    this._setState('idle');

      // Animate mesh
      if (this.mesh) {
        const boneState = this.state === 'attack' ? this.attackMove : this.state;
        applyPose(this.mesh, boneState, this.animTime, this.stateTimer, this.facing);
        this._sync();
      }
    }
  }

  // ── AI Controller ────────────────────────────────────────────────────────────

  class AIController {
    constructor(cfg) { this.cfg = cfg; this._t = 0; }
    think(dt, self, opp) {
      this._t += dt; const acts = {};
      if (this._t < this.cfg.reactionTime) return acts;
      this._t = 0;
      const dist  = Math.abs(self.x - opp.x);
      const toOpp = opp.x > self.x ? 1 : -1;
      const aggro = this.cfg.aggressionBias;
      if (opp.state === 'attack' && dist < 0.80 && Math.random() < 0.55) { acts.block = true; return acts; }
      if (opp.state === 'attack' && opp.attackMove === 'special' && dist < 1.1 && Math.random() < 0.5) { acts.jump = true; return acts; }
      if (dist > 1.2) {
        acts[toOpp > 0 ? 'right' : 'left'] = true;
        if (Math.random() < this.cfg.jumpFrequency) acts.jump = true;
      } else if (dist < 0.52) {
        if (Math.random() < (1 - aggro) * 0.5) acts[toOpp > 0 ? 'left' : 'right'] = true;
        else acts[ATTACK_MOVES[Math.floor(Math.random() * 4)]] = true;
      } else {
        if (Math.random() < aggro) {
          const sp = self.health < 40 && dist < 0.72 && Math.random() < 0.35;
          acts[sp ? 'special' : ATTACK_MOVES[Math.floor(Math.random() * 4)]] = true;
        } else {
          acts[toOpp > 0 ? 'right' : 'left'] = true;
        }
      }
      return acts;
    }
  }

  // ── HUD ──────────────────────────────────────────────────────────────────────

  function drawHUD(ctx, p1, p2, rnd, time, W, H, cfg) {
    const UI = GF.UISystem, bW = 340, bH = 20, px = 24, py = 18;
    UI.drawHealthBar(ctx, px, py, bW, bH, p1.health, p1.maxHealth);
    UI.drawHealthBar(ctx, W - px - bW, py, bW, bH, p2.health, p2.maxHealth, {reversed: true});
    UI.drawText(ctx, p1.name, px, py + bH + 5, {font:'bold 13px monospace', color:p1.color, shadow:true});
    UI.drawText(ctx, p2.name, W - px, py + bH + 5, {font:'bold 13px monospace', color:p2.color, align:'right', shadow:true});
    const maxW = Math.ceil(cfg.round.totalRounds / 2);
    for (let i = 0; i < maxW; i++) {
      ctx.beginPath(); ctx.arc(px + i * 18, py - 8, 5, 0, Math.PI * 2);
      ctx.fillStyle = i < p1.wins ? p1.color : '#333'; ctx.fill();
      ctx.beginPath(); ctx.arc(W - px - i * 18, py - 8, 5, 0, Math.PI * 2);
      ctx.fillStyle = i < p2.wins ? p2.color : '#333'; ctx.fill();
    }
    const ts = time >= 9990 ? '∞' : Math.ceil(Math.max(0, time)).toString();
    UI.drawPanel(ctx, W/2 - 32, py - 4, 64, bH + 8, {bgColor:'rgba(0,0,0,0.7)', borderColor:'rgba(255,255,255,0.2)', radius:4});
    UI.drawText(ctx, ts, W / 2, py, {font:'bold 22px monospace', color:time<=10?'#ff4444':'#ffffff', align:'center', baseline:'top', shadow:true, glow:time<=10?'#ff0000':undefined});
    UI.drawText(ctx, `ROUND ${rnd}`, W / 2, py + bH + 5, {font:'11px monospace', color:'#aa88ff', align:'center', baseline:'top'});
    if (p1.comboCount >= 2) UI.drawText(ctx, `${p1.comboCount} HIT COMBO!`, px, py + bH + 22, {font:'bold 16px monospace', color:'#ffdd00', glow:'#ff8800', glowBlur:10, shadow:true});
    if (p2.comboCount >= 2) UI.drawText(ctx, `${p2.comboCount} HIT COMBO!`, W - px, py + bH + 22, {font:'bold 16px monospace', color:'#ffdd00', glow:'#ff8800', glowBlur:10, align:'right', shadow:true});
  }

  // ── Main game controller ──────────────────────────────────────────────────────

  class ShadowStrike3DGame {
    constructor(engine, three3d) {
      this.engine = engine; this.three3d = three3d; this.cfg = GF.GAME_CONFIG;
      this.W = this.cfg.engine.width; this.H = this.cfg.engine.height;
      this.gameState = STATE.MENU; this.roundNum = 1; this.roundTimer = 0;
      this.koCooldown = 0; this.paused = false; this._flashMsg = '';
      this._p1Wins = 0; this._p2Wins = 0; this._menuAnimT = 0;
      this._countdownTimer = 0; this._matchOver = false;
      this._overallWinner = ''; this._overallColor = ''; this._camShake = 0;
      this.p1 = null; this.p2 = null;

      const scene = three3d.scene;
      buildStage(scene, this.cfg.stage.halfWidth);
      const {floorGlow} = buildLighting(scene);
      this._floorGlow = floorGlow;
      scene.fog = new THREE.FogExp2(0x050010, 0.07);

      this.fx = new FxSystem(scene);

      // Camera
      this._cam = new THREE.PerspectiveCamera(60, this.W / this.H, 0.1, 200);
      this._cam.position.set(0, 2.8, 6.5);
      this._cam.lookAt(0, 0.9, 0);
      three3d.setCamera(this._cam);

      // Build fighter meshes
      this._m1 = buildKuro(); scene.add(this._m1);
      this._m2 = buildHana(); scene.add(this._m2);

      // Input bindings
      const ctl = this.cfg.controls;
      Object.entries(ctl.p1).forEach(([a, c]) => engine.input.bind('p1_' + a, c));
      Object.entries(ctl.p2).forEach(([a, c]) => engine.input.bind('p2_' + a, c));
      engine.input.bind('pause',   'Escape', 'KeyP');
      engine.input.bind('confirm', 'Enter',  'Space');

      this._ai     = new AIController(this.cfg.ai);
      this._p2IsAI = true;

      this._initAudio(engine.audio);
      engine.onUpdate(dt => this._update(dt));
      engine.onRender(ctx => this._render2D(ctx));
    }

    _initAudio(a) {
      this._audio = a;
      if (!a || !a._ensureContext) return;
      a._ensureContext();
      const ctx = a._ctx; if (!ctx) return;
      const mkTone = (f, d, tp, v) => {
        const sr = ctx.sampleRate, len = Math.floor(sr * d), buf = ctx.createBuffer(1, len, sr), dd = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
          const t = i / sr;
          const s = tp === 'noise' ? Math.random() * 2 - 1 : tp === 'sq' ? (Math.sin(2 * Math.PI * f * t) > 0 ? 1 : -1) : Math.sin(2 * Math.PI * f * t);
          dd[i] = s * (1 - t / d) * (v || 0.2);
        }
        return buf;
      };
      try {
        a.register('punch',   mkTone(280, 0.10, 'noise', 0.22));
        a.register('kick',    mkTone(160, 0.14, 'noise', 0.28));
        a.register('special', mkTone(520, 0.30, 'sq',    0.18));
        a.register('block',   mkTone(380, 0.07, 'sq',    0.12));
        a.register('ko',      mkTone(90,  0.50, 'noise', 0.35));
        a.register('win',     mkTone(880, 0.40, 'sq',    0.22));
        a.register('fight',   mkTone(660, 0.18, 'sq',    0.28));
      } catch (_) {}
    }

    _sfx(name) { try { if (this._audio) this._audio.play(name); } catch (_) {} }

    _startRound() {
      const cfg = this.cfg;
      const p1w = this._p1Wins, p2w = this._p2Wins;
      this.p1 = new Fighter3D(cfg.fighters.kuro); this.p1.wins = p1w; this.p1.setMesh(this._m1); this._m1.rotation.z = 0;
      this.p2 = new Fighter3D(cfg.fighters.hana); this.p2.wins = p2w; this.p2.setMesh(this._m2); this._m2.rotation.z = 0;
      this.roundTimer = cfg.round.roundTime; this.koCooldown = 0;
      this._flashMsg = ''; this.gameState = STATE.COUNTDOWN; this._countdownTimer = 2.5;
      this.fx.dispose();
    }

    _endRound(winner) {
      const cfg = this.cfg;
      if (winner === 'p1') {
        this.p1.wins++; this._p1Wins = this.p1.wins;
        this.p1._setState('win'); this.p2._setState('ko');
        this._flashMsg = 'KURO WINS!'; this._sfx('win'); this._sfx('ko');
      } else if (winner === 'p2') {
        this.p2.wins++; this._p2Wins = this.p2.wins;
        this.p2._setState('win'); this.p1._setState('ko');
        this._flashMsg = 'HANA WINS!'; this._sfx('win'); this._sfx('ko');
      } else {
        this._flashMsg = 'DRAW!';
      }
      this.gameState = STATE.ROUND_END; this.koCooldown = cfg.round.koDuration;
      const maxW = Math.ceil(cfg.round.totalRounds / 2);
      if      (this._p1Wins >= maxW) { this._overallWinner = 'KURO'; this._overallColor = cfg.fighters.kuro.color; this._matchOver = true; }
      else if (this._p2Wins >= maxW) { this._overallWinner = 'HANA'; this._overallColor = cfg.fighters.hana.color; this._matchOver = true; }
      else { this.roundNum++; this._matchOver = false; }
    }

    _update(dt) {
      if (this.paused) return;
      this._menuAnimT += dt;
      if (this._camShake > 0) this._camShake -= dt;
      if (this._floorGlow) this._floorGlow.intensity = 1.3 + Math.sin(this._menuAnimT * 1.8) * 0.3;

      switch (this.gameState) {
        case STATE.MENU:
          if (this.engine.input.wasPressed('confirm')) {
            this._p1Wins = 0; this._p2Wins = 0; this.roundNum = 1; this._startRound();
          }
          this._m1.position.set(-2.2, 0, 0); this._m1.rotation.y = 0;
          applyPose(this._m1, 'idle', this._menuAnimT,       0,  1);
          this._m2.position.set( 2.2, 0, 0); this._m2.rotation.y = Math.PI;
          applyPose(this._m2, 'idle', this._menuAnimT + 0.5, 0, -1);
          break;

        case STATE.COUNTDOWN:
          this._countdownTimer -= dt;
          if (this.p1) this.p1.update(dt, this.cfg.stage.halfWidth);
          if (this.p2) this.p2.update(dt, this.cfg.stage.halfWidth);
          if (this._countdownTimer <= 0) { this.gameState = STATE.FIGHT; this._sfx('fight'); }
          break;

        case STATE.FIGHT:
          this._updateFight(dt); break;

        case STATE.ROUND_END:
          this.koCooldown -= dt;
          if (this.p1) this.p1.update(dt, this.cfg.stage.halfWidth);
          if (this.p2) this.p2.update(dt, this.cfg.stage.halfWidth);
          this.fx.update(dt);
          if (this.koCooldown <= 0) {
            if (this._matchOver) this.gameState = STATE.GAME_OVER;
            else this._startRound();
          }
          break;

        case STATE.GAME_OVER:
          if (this.engine.input.wasPressed('confirm')) {
            this._p1Wins = 0; this._p2Wins = 0; this.roundNum = 1; this._startRound();
          }
          break;
      }

      if (this.engine.input.wasPressed('pause') && this.gameState !== STATE.MENU) {
        this.paused = !this.paused;
      }
      this._updateCamera(dt);
    }

    _updateFight(dt) {
      const { p1, p2, engine } = this, inp = engine.input, ctl = this.cfg.controls, hw = this.cfg.stage.halfWidth;
      const p1Inp = { isDown: a => inp.isDown('p1_' + a), wasPressed: a => inp.wasPressed('p1_' + a), wasReleased: () => false };
      let p2Inp;
      if (this._p2IsAI) {
        const acts = this._ai.think(dt, p2, p1);
        p2Inp = { isDown: a => !!acts[a], wasPressed: a => !!acts[a], wasReleased: () => false };
      } else {
        p2Inp = { isDown: a => inp.isDown('p2_' + a), wasPressed: a => inp.wasPressed('p2_' + a), wasReleased: () => false };
      }
      p1.processInput(p1Inp, Object.fromEntries(Object.keys(ctl.p1).map(a => [a, a])), p2);
      p2.processInput(p2Inp, Object.fromEntries(Object.keys(ctl.p2).map(a => [a, a])), p1);
      p1.update(dt, hw); p2.update(dt, hw);
      // Fireball: the "special" attack casts a travelling fireball (once per special).
      [p1, p2].forEach(p => {
        const casting = (p.state === 'attack' && p.attackMove === 'special');
        if (casting && !p._fbSpawned) { this.fx.spawnFireball(p.x + p.facing * 0.4, p.y + 0.78, p.facing); p._fbSpawned = true; }
        else if (!casting) { p._fbSpawned = false; }
      });
      this._resolveOverlap();
      const h1 = p1.tryHitOpponent(p2), h2 = p2.tryHitOpponent(p1);
      if (h1) { const sp = p1.attackMove === 'special'; this.fx[sp ? 'spawnSpecial' : 'spawnHit'](p2.x, p2.y + 0.7, 0xffdd00); this._camShake = sp ? 0.20 : 0.08; this._sfx(sp ? 'special' : p1.attackMove.includes('ick') ? 'kick' : 'punch'); }
      if (h2) { const sp = p2.attackMove === 'special'; this.fx[sp ? 'spawnSpecial' : 'spawnHit'](p1.x, p1.y + 0.7, 0xffdd00); this._camShake = sp ? 0.20 : 0.08; this._sfx(sp ? 'special' : p2.attackMove.includes('ick') ? 'kick' : 'punch'); }
      this.fx.update(dt);
      this.roundTimer -= dt;
      if      (p1.state === 'ko' && p2.state !== 'ko') this._endRound('p2');
      else if (p2.state === 'ko' && p1.state !== 'ko') this._endRound('p1');
      else if (p1.state === 'ko' && p2.state === 'ko') this._endRound('draw');
      else if (this.roundTimer <= 0) {
        if      (p1.health > p2.health) this._endRound('p1');
        else if (p2.health > p1.health) this._endRound('p2');
        else                            this._endRound('draw');
      }
    }

    _resolveOverlap() {
      if (!this.p1 || !this.p2) return;
      const min = this.p1.cfg.halfWidth + this.p2.cfg.halfWidth + 0.05;
      const dx  = this.p2.x - this.p1.x;
      if (Math.abs(dx) < min) {
        const push = (min - Math.abs(dx)) / 2 + 0.01, dir = dx >= 0 ? 1 : -1, hw = this.cfg.stage.halfWidth;
        this.p1.x = Math.max(-hw + 0.1, Math.min(hw - 0.1, this.p1.x - dir * push));
        this.p2.x = Math.max(-hw + 0.1, Math.min(hw - 0.1, this.p2.x + dir * push));
      }
    }

    _updateCamera(dt) {
      let tx = 0, td = 6.5, ty = 0.88;
      if (this.p1 && this.p2) {
        const mid = (this.p1.x + this.p2.x) * 0.5, sep = Math.abs(this.p2.x - this.p1.x);
        tx = mid * 0.35; td = Math.max(5.2, 4.5 + sep * 0.55);
        ty = 0.88 + (this.p1.y + this.p2.y) * 0.5 * 0.22;
      }
      const shk = this._camShake > 0 ? Math.sin(Date.now() * 0.08) * 0.045 : 0;
      const lf  = Math.min(1, dt * 4);
      this._cam.position.x += (tx + shk - this._cam.position.x) * lf;
      this._cam.position.z += (td - this._cam.position.z) * lf;
      this._cam.position.y += (2.8 - this._cam.position.y) * lf;
      this._cam.lookAt(this._cam.position.x * 0.4, ty, 0);
    }

    _render2D(ctx) {
      const { W, H, cfg } = this, UI = GF.UISystem;

      if (this.gameState === STATE.MENU) {
        ctx.fillStyle = 'rgba(0,0,0,0.40)'; ctx.fillRect(0, 0, W, H);
        UI.drawText(ctx, 'SHADOW  STRIKE  3D', W/2, H*0.16, {font:'bold 52px monospace', color:'#ffffff', align:'center', glow:'#00e5ff', glowBlur:22, stroke:'#006688', strokeWidth:3, shadow:true});
        UI.drawText(ctx, 'VS', W/2, H*0.50, {font:'bold 36px monospace', color:'#ff4444', align:'center', glow:'#ff0000', glowBlur:14, shadow:true});
        UI.drawText(ctx, 'KURO', W*0.30, H*0.78, {font:'bold 20px monospace', color:'#00e5ff', align:'center', shadow:true, glow:'#00e5ff', glowBlur:8});
        UI.drawText(ctx, 'Shadow Ninja',  W*0.30, H*0.84, {font:'12px monospace', color:'#556688', align:'center'});
        UI.drawText(ctx, 'HANA', W*0.70, H*0.78, {font:'bold 20px monospace', color:'#ff6600', align:'center', shadow:true, glow:'#ff6600', glowBlur:8});
        UI.drawText(ctx, 'Flame Warrior', W*0.70, H*0.84, {font:'12px monospace', color:'#886644', align:'center'});
        if (Math.floor(Date.now() / 520) % 2) {
          UI.drawText(ctx, 'PRESS ENTER TO START', W/2, H-68, {font:'bold 20px monospace', color:'#ffffff', align:'center', glow:'#ffffff', glowBlur:8});
        }
        UI.drawText(ctx, 'KURO (P1):  A/D=Move  W=Jump  S=Crouch  U/I=Punch  J/K=Kick  L=Special  O=Block', W/2, H-44, {font:'11px monospace', color:'#445566', align:'center'});
        UI.drawText(ctx, 'HANA (CPU): Computer-controlled AI opponent', W/2, H-28, {font:'11px monospace', color:'#554433', align:'center'});
        return;
      }

      if (this.p1 && this.p2) drawHUD(ctx, this.p1, this.p2, this.roundNum, this.roundTimer, W, H, cfg);

      if (this.gameState === STATE.COUNTDOWN) {
        const t = Math.ceil(this._countdownTimer), txt = t > 1 ? String(t - 1) : 'FIGHT!';
        const col = t > 1 ? '#ffdd00' : '#00ff88', sz = t > 1 ? 100 : 76;
        UI.drawText(ctx, txt, W/2, H/2 - sz/2, {font:`bold ${sz}px monospace`, color:col, align:'center', glow:col, glowBlur:28, stroke:'#000000', strokeWidth:5, shadow:true});
      }

      if (this.gameState === STATE.ROUND_END && this._flashMsg) {
        UI.drawPanel(ctx, W/2-200, H/2-48, 400, 90, {bgColor:'rgba(0,0,0,0.82)', borderColor:'#ffffff', borderWidth:2, radius:10});
        UI.drawText(ctx, this._flashMsg, W/2, H/2-3, {font:'bold 48px monospace', color:'#ffffff', align:'center', baseline:'middle', glow:'#aa44ff', glowBlur:24, stroke:'#000000', strokeWidth:4, shadow:true});
      }

      if (this.gameState === STATE.GAME_OVER) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H);
        UI.drawText(ctx, `${this._overallWinner} WINS THE MATCH!`, W/2, H/2-64, {font:'bold 38px monospace', color:this._overallColor||'#fff', align:'center', glow:this._overallColor, glowBlur:18, stroke:'#000', strokeWidth:3, shadow:true});
        if (Math.floor(Date.now() / 620) % 2) UI.drawText(ctx, 'PRESS ENTER TO PLAY AGAIN', W/2, H/2+10, {font:'bold 20px monospace', color:'#fff', align:'center', shadow:true});
        UI.drawText(ctx, `KURO ${this._p1Wins} — ${this._p2Wins} HANA`, W/2, H/2+60, {font:'16px monospace', color:'#888', align:'center'});
      }

      if (this.paused) {
        ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, 0, W, H);
        UI.drawText(ctx, 'PAUSED', W/2, H/2, {font:'bold 52px monospace', color:'#fff', align:'center', baseline:'middle', glow:'#aaaaff', glowBlur:24, shadow:true});
        UI.drawText(ctx, 'Press P or ESC to resume', W/2, H/2+48, {font:'16px monospace', color:'#aaa', align:'center'});
      }
    }
  }

  // ── Bootstrap ─────────────────────────────────────────────────────────────────

  window.addEventListener('GF:ready', async function () {
    if (!window.THREE) {
      console.error('Shadow Strike 3D requires Three.js. Add the CDN script to index.html.');
      return;
    }
    try {
      const cfg = GF.GAME_CONFIG;
      const { engine } = await GF.createGameAsync(cfg.engine, cfg.physics, { gameName: 'ShadowStrike3D' });
      const three3d = new GF.Three3DScene({ bgColor: 0x050010 });
      engine.addSystem(three3d);
      const game = new ShadowStrike3DGame(engine, three3d);
      engine.start();
      window._ss3d = game;
    } catch (e) {
      console.error('[ShadowStrike3D] Init error:', e);
    }
  });

})(window.GF = window.GF || {});
