// GameFramework/games/ShiningQuest3D/ShiningQuest3DGame.js
// Shining Force-style tactical RPG rendered in true 3D using Three.js.
//
// Mirrors the original Shining Quest's structure (Title → Town → Battle →
// Victory / GameOver) but every world is a real 3D scene built from
// procedural meshes. The framework's Three3DScene system hosts the
// Three.js renderer behind the engine's 2D canvas; HUD, dialogue, action
// menu, and floating damage numbers are drawn by the existing 2D UISystem
// over the top.
//
// Game-specific work in this file is limited to:
//   • Scene definitions (Title, Town, Battle, GameOver, Victory)
//   • Procedural 3D mesh builders (units, terrain, town, castle)
//   • Battle camera framing and unit animation tweens
//   • Simple enemy AI
//
// Mechanics — turn order, grid math, pathfinding, dialogue sequencing,
// and menu navigation — come from the framework.

(function (GF) {
  'use strict';

  const CFG  = () => GF.GAME_CONFIG;
  const DATA = () => GF.QuestData;

  // ── Persistent state across scenes ─────────────────────────────────────────
  const State = {
    chapterIdx : 0,
    party      : null,
    visitedChapters: new Set(),
  };

  function clonePartyFromTemplate() {
    State.party = DATA().party.map(p => Object.assign({}, p,
      { hp: p.maxHp, dead: false, mp: p.mp || 0 }));
  }

  // ── Procedural audio (mirrors original Shining Quest) ────────────────────
  function makeTone(audioCtx, freq, duration, type, env) {
    const sr   = audioCtx.sampleRate;
    const len  = Math.floor(sr * duration);
    const buf  = audioCtx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      let s = 0;
      if      (type === 'square') s = Math.sin(2*Math.PI*freq*t) > 0 ? 1 : -1;
      else if (type === 'noise')  s = Math.random() * 2 - 1;
      else if (type === 'sweep')  s = Math.sin(2*Math.PI*(freq + (env.sweep||0)*t)*t);
      else                        s = Math.sin(2*Math.PI*freq*t);
      const a = env.attack || 0.005, r = env.release || duration;
      let amp = (t < a) ? t/a : Math.max(0, 1 - (t - a) / (r - a));
      data[i] = s * amp * (env.volume || 0.25);
    }
    return buf;
  }

  function setupAudio(audio) {
    audio._ensureContext();
    const ctx = audio._ctx;
    if (!ctx) return;
    audio.register('cursor',    makeTone(ctx, 660, 0.06, 'square', { volume: 0.15 }));
    audio.register('confirm',   makeTone(ctx, 880, 0.10, 'square', { volume: 0.18 }));
    audio.register('cancel',    makeTone(ctx, 320, 0.10, 'square', { volume: 0.18 }));
    audio.register('hit',       makeTone(ctx, 220, 0.18, 'noise',  { volume: 0.30 }));
    audio.register('crit',      makeTone(ctx, 180, 0.30, 'sweep',  { volume: 0.35, sweep: -120 }));
    audio.register('heal',      makeTone(ctx, 720, 0.35, 'sweep',  { volume: 0.30, sweep: 380 }));
    audio.register('death',     makeTone(ctx, 140, 0.45, 'sweep',  { volume: 0.35, sweep: -90 }));
    audio.register('victory',   makeTone(ctx, 660, 0.50, 'square', { volume: 0.30 }));
    audio.register('defeat',    makeTone(ctx, 110, 0.60, 'sweep',  { volume: 0.35, sweep: -50 }));
    audio.register('spell',     makeTone(ctx, 540, 0.40, 'sweep',  { volume: 0.30, sweep: 220 }));
    audio.register('step',      makeTone(ctx, 380, 0.04, 'square', { volume: 0.10 }));
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── 3D builders ────────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  // Terrain palette for battle maps. y = "thickness" of the cell column.
  const TERRAIN_3D = {
    0: { color: 0x4a8a3a, roof: 'flat',    h: 0.10, name: 'Plain'    },
    1: { color: 0xcaa377, roof: 'flat',    h: 0.06, name: 'Path'     },
    2: { color: 0x2a4a22, roof: 'tree',    h: 0.10, name: 'Forest'   },
    3: { color: 0x1d3aaa, roof: 'water',   h: -0.20, name: 'Water'   },
    4: { color: 0x666677, roof: 'wall',    h: 1.10, name: 'Wall'     },
    5: { color: 0x7a6a55, roof: 'mountain',h: 0.50, name: 'Mountain' },
  };

  function buildTerrainCell(THREE, type, x, z, size) {
    const p = TERRAIN_3D[type] || TERRAIN_3D[0];
    const g = new THREE.Group();
    g.userData.terrainType = type;

    const blockH = Math.max(0.02, Math.abs(p.h) + 0.10);
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(size, blockH, size),
      new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.95 })
    );
    block.position.set(x, p.h - blockH / 2 + 0.05, z);
    block.receiveShadow = true;
    if (type === 4 || type === 5) block.castShadow = true;
    g.add(block);

    if (p.roof === 'tree') {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.08, 0.35, 6),
        new THREE.MeshStandardMaterial({ color: 0x4a2a18 })
      );
      trunk.position.set(x, 0.27, z); g.add(trunk);
      const foliage = new THREE.Mesh(
        new THREE.ConeGeometry(0.34, 0.6, 8),
        new THREE.MeshStandardMaterial({ color: 0x2e7a2a, flatShading: true })
      );
      foliage.position.set(x, 0.75, z);
      foliage.castShadow = true;
      g.add(foliage);
    } else if (p.roof === 'mountain') {
      const peak = new THREE.Mesh(
        new THREE.ConeGeometry(size * 0.45, 0.85, 4),
        new THREE.MeshStandardMaterial({ color: 0xb0a090, flatShading: true })
      );
      peak.position.set(x, 0.95, z);
      peak.castShadow = true;
      g.add(peak);
      const snow = new THREE.Mesh(
        new THREE.ConeGeometry(size * 0.18, 0.25, 4),
        new THREE.MeshStandardMaterial({ color: 0xeeeeee })
      );
      snow.position.set(x, 1.30, z);
      g.add(snow);
    } else if (p.roof === 'wall') {
      // Crenellation strip along the top
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(size, 0.10, size),
        new THREE.MeshStandardMaterial({ color: 0x444455 })
      );
      cap.position.set(x, p.h + 0.05, z);
      g.add(cap);
    } else if (p.roof === 'water') {
      // Sheen plate just above water level
      const sheen = new THREE.Mesh(
        new THREE.PlaneGeometry(size * 0.95, size * 0.95),
        new THREE.MeshStandardMaterial({
          color: 0x4477dd, roughness: 0.2, metalness: 0.4,
          transparent: true, opacity: 0.55,
        })
      );
      sheen.rotation.x = -Math.PI / 2;
      sheen.position.set(x, p.h + 0.06, z);
      g.add(sheen);
    }
    return g;
  }

  // Build a procedural unit mesh based on its template. Returns a Group that
  // can be tweened; userData.body is the main mesh (for damage flashes).
  function buildUnitMesh(THREE, unit) {
    const g = new THREE.Group();
    const isPlayer = unit.team === 'player';
    const armor = isPlayer ? 0x4488dd : 0xa83a3a;

    // Body
    const bodyMat = new THREE.MeshStandardMaterial({ color: armor, roughness: 0.8 });
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.32, 0.7, 10),
      bodyMat
    );
    body.position.y = 0.35;
    body.castShadow = true;
    g.add(body);

    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xf2d3a9, roughness: 0.7 })
    );
    head.position.y = 0.84;
    head.castShadow = true;
    g.add(head);

    // Class / sprite specific
    if (unit.clazz === 'Knight') {
      const helm = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 0.20, 8),
        new THREE.MeshStandardMaterial({ color: 0xc8c8d8, metalness: 0.4 })
      );
      helm.position.y = 1.02; helm.castShadow = true; g.add(helm);
      const sword = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.6, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xe4e4ec, metalness: 0.6 })
      );
      sword.position.set(0.30, 0.55, 0.05);
      g.add(sword);
      const shield = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.40, 0.32),
        new THREE.MeshStandardMaterial({ color: 0x224488 })
      );
      shield.position.set(-0.30, 0.45, 0); g.add(shield);
    } else if (unit.clazz === 'Mage') {
      const hood = new THREE.Mesh(
        new THREE.ConeGeometry(0.30, 0.45, 8),
        new THREE.MeshStandardMaterial({ color: 0x4a2aa6 })
      );
      hood.position.y = 0.95; hood.castShadow = true; g.add(hood);
      const robe = new THREE.Mesh(
        new THREE.ConeGeometry(0.40, 0.7, 10, 1, true),
        new THREE.MeshStandardMaterial({ color: 0x4a2aa6, side: THREE.DoubleSide })
      );
      robe.position.y = 0.35; g.add(robe);
      const staff = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 1.0, 6),
        new THREE.MeshStandardMaterial({ color: 0x6a4a2a })
      );
      staff.position.set(0.30, 0.50, 0); g.add(staff);
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.10, 12, 12),
        new THREE.MeshStandardMaterial({
          color: 0x88ccff, emissive: 0x4488dd, emissiveIntensity: 0.6,
        })
      );
      orb.position.set(0.30, 1.02, 0); g.add(orb);
    } else if (unit.clazz === 'Warrior') {
      body.scale.set(1.30, 1.0, 1.30);
      const shoulders = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.10, 0.40),
        new THREE.MeshStandardMaterial({ color: 0x884422 })
      );
      shoulders.position.y = 0.72; g.add(shoulders);
      const axeShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.85, 6),
        new THREE.MeshStandardMaterial({ color: 0x5a3a18 })
      );
      axeShaft.position.set(0.32, 0.55, 0); g.add(axeShaft);
      const axeHead = new THREE.Mesh(
        new THREE.BoxGeometry(0.30, 0.18, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.6 })
      );
      axeHead.position.set(0.32, 0.95, 0); g.add(axeHead);
    } else if (unit.sprite === 'goblin') {
      body.scale.set(0.85, 0.7, 0.85);
      body.position.y = 0.25;
      bodyMat.color.setHex(0x4a8a4a);
      head.scale.set(0.85, 0.85, 0.85);
      head.position.y = 0.66;
      head.material.color.setHex(0x4a8a4a);
      const ear = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.18, 4),
        new THREE.MeshStandardMaterial({ color: 0x4a8a4a })
      );
      ear.position.set(0.18, 0.78, 0); ear.rotation.z = -Math.PI / 4; g.add(ear);
      const ear2 = ear.clone();
      ear2.position.set(-0.18, 0.78, 0); ear2.rotation.z = Math.PI / 4; g.add(ear2);
      const spear = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.85, 6),
        new THREE.MeshStandardMaterial({ color: 0x5a3a18 })
      );
      spear.position.set(0.25, 0.45, 0); g.add(spear);
    } else if (unit.sprite === 'skeleton') {
      bodyMat.color.setHex(0xeeeec4);
      bodyMat.roughness = 1.0;
      head.material.color.setHex(0xeeeec4);
      const ribs = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.04, 0.30),
        new THREE.MeshStandardMaterial({ color: 0xddddc0 })
      );
      ribs.position.y = 0.55; g.add(ribs);
      const ribs2 = ribs.clone(); ribs2.position.y = 0.40; g.add(ribs2);
      const sword = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.55, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xa0a0a0, metalness: 0.5 })
      );
      sword.position.set(0.28, 0.50, 0); g.add(sword);
    } else if (unit.sprite === 'bat') {
      body.scale.set(0.55, 0.45, 0.55);
      body.position.y = 0.55;
      bodyMat.color.setHex(0x222244);
      head.scale.set(0.7, 0.7, 0.7);
      head.position.y = 0.92;
      head.material.color.setHex(0x222244);
      const wingMat = new THREE.MeshStandardMaterial({
        color: 0x111128, side: THREE.DoubleSide, roughness: 0.9,
      });
      const wL = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.30), wingMat);
      wL.position.set(-0.32, 0.65, 0);
      wL.rotation.y = Math.PI / 6;
      g.add(wL);
      const wR = wL.clone();
      wR.position.set(0.32, 0.65, 0);
      wR.rotation.y = -Math.PI / 6;
      g.add(wR);
      g.userData.wings = [wL, wR];
    } else if (unit.sprite === 'darkMage') {
      const cloak = new THREE.Mesh(
        new THREE.ConeGeometry(0.45, 0.95, 12, 1, true),
        new THREE.MeshStandardMaterial({
          color: 0x111133, side: THREE.DoubleSide, roughness: 1.0,
        })
      );
      cloak.position.y = 0.48; g.add(cloak);
      bodyMat.color.setHex(0x222244);
      head.material.color.setHex(0x000000);
      head.scale.set(0.85, 0.85, 0.85);
      const hood = new THREE.Mesh(
        new THREE.ConeGeometry(0.26, 0.45, 8),
        new THREE.MeshStandardMaterial({ color: 0x111133 })
      );
      hood.position.y = 0.95; g.add(hood);
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 12, 12),
        new THREE.MeshStandardMaterial({
          color: 0xaa44ff, emissive: 0x6600ff, emissiveIntensity: 0.8,
        })
      );
      orb.position.set(0.30, 0.85, 0); g.add(orb);
    } else if (unit.sprite === 'dragon') {
      body.scale.set(2.0, 1.4, 2.4);
      body.position.y = 0.55;
      bodyMat.color.setHex(0x8a1a1a);
      head.scale.set(1.8, 1.6, 2.2);
      head.position.set(0.6, 1.1, 0);
      head.material.color.setHex(0x8a1a1a);
      const wingMat = new THREE.MeshStandardMaterial({
        color: 0x551111, side: THREE.DoubleSide, roughness: 0.9,
      });
      const wL = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), wingMat);
      wL.position.set(-0.7, 1.5, 0);
      wL.rotation.y = Math.PI / 7;
      g.add(wL);
      const wR = wL.clone();
      wR.position.set(0.7, 1.5, 0);
      wR.rotation.y = -Math.PI / 7;
      g.add(wR);
      g.userData.wings = [wL, wR];
      // Spikes along the back
      for (let i = -1; i <= 1; i++) {
        const sp = new THREE.Mesh(
          new THREE.ConeGeometry(0.10, 0.30, 4),
          new THREE.MeshStandardMaterial({ color: 0x4a0a0a })
        );
        sp.position.set(i * 0.30, 1.30, 0); g.add(sp);
      }
    }

    // Team ring on the ground for clarity
    const ringMat = new THREE.MeshBasicMaterial({
      color: isPlayer ? 0x4488ff : 0xff5544, transparent: true, opacity: 0.55,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.30, 0.42, 24), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.07;
    g.add(ring);
    g.userData.ring = ring;
    g.userData.body = body;
    g.userData.bodyMat = bodyMat;
    g.userData.headMat = head.material;
    return g;
  }

  // Convert grid (col, row) to world (x, z). Grid is centered around origin.
  function gridToWorld(col, row, cols, rows, cellSize) {
    return {
      x: (col - (cols - 1) / 2) * cellSize,
      z: (row - (rows - 1) / 2) * cellSize,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── TitleScene3D ───────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  class TitleScene3D extends GF.Scene {
    init(engine) {
      this._engine = engine;
      this._three = engine.getSystem('three3d');
      this._t = 0;
      this._pulse = { v: 1.0 };
      const tw = engine.getSystem('TweenSystem');
      tw.create(this._pulse, { v: 0.25 }, 0.9, { ease: 'inOutSine', loop: true, yoyo: true });

      const ctrls = CFG().controls;
      engine.input.bind('confirm', ...ctrls.confirm);

      try { setupAudio(engine.getSystem('AudioSystem')); } catch(e) {}

      State.chapterIdx = 0;
      State.visitedChapters.clear();
      clonePartyFromTemplate();

      // Build castle silhouette + stars
      const THREE = window.THREE;
      this._three.setBackground(0x05050f);

      // Camera: slow orbit around castle
      const cam = new THREE.PerspectiveCamera(45, engine.canvas.width / engine.canvas.height, 0.1, 200);
      cam.position.set(0, 4, 18);
      cam.lookAt(0, 3, 0);
      this._three.setCamera(cam);
      this._cam = cam;

      // Atmosphere
      const amb = new THREE.AmbientLight(0x223355, 0.8);
      this._three.add(amb);
      const moon = new THREE.DirectionalLight(0xaabbff, 0.7);
      moon.position.set(-8, 15, 5);
      this._three.add(moon);
      const fill = new THREE.PointLight(0xffaa44, 1.3, 22);
      fill.position.set(0, 4, 4);
      this._three.add(fill);

      // Castle group — multiple towers + central keep
      const castle = new THREE.Group();
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x1a1a26, roughness: 0.95 });
      const accentMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.95 });
      // Central keep
      const keep = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 3), stoneMat);
      keep.position.y = 2.5; castle.add(keep);
      // Twin towers
      for (const dx of [-3, 3]) {
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 6, 12), accentMat);
        tower.position.set(dx, 3, 0); castle.add(tower);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.2, 12),
          new THREE.MeshStandardMaterial({ color: 0x882244 }));
        roof.position.set(dx, 6.6, 0); castle.add(roof);
      }
      // Battlements (small boxes)
      for (let i = -2; i <= 2; i++) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), accentMat);
        m.position.set(i * 0.8, 5.25, 1.5); castle.add(m);
      }
      // Lit windows
      const winMat = new THREE.MeshBasicMaterial({ color: 0xffcc44 });
      const w1 = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), winMat);
      w1.position.set(-0.8, 3.0, 1.51); castle.add(w1);
      const w2 = w1.clone(); w2.position.set(0.8, 3.0, 1.51); castle.add(w2);
      const w3 = w1.clone(); w3.position.set(0, 4.0, 1.51); castle.add(w3);
      // Ground
      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(40, 32),
        new THREE.MeshStandardMaterial({ color: 0x1a1f30, roughness: 1.0 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = 0;
      castle.add(ground);
      this._three.add(castle);
      this._castle = castle;

      // Stars (Points cloud)
      const starGeo = new THREE.BufferGeometry();
      const N = 800;
      const positions = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const r = 60;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(1 - Math.random());
        positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
        positions[i*3+1] = r * Math.cos(phi) * 0.6 + 8;
        positions[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
        color: 0xffffff, size: 0.18, sizeAttenuation: true,
      }));
      this._three.add(stars);
    }

    update(dt, engine) {
      this._t += dt;
      // Slow orbit
      const r = 18, h = 4 + Math.sin(this._t * 0.2) * 0.6;
      this._cam.position.set(Math.sin(this._t * 0.12) * r, h, Math.cos(this._t * 0.12) * r);
      this._cam.lookAt(0, 3, 0);

      if (engine.input.wasPressed('confirm')) {
        engine.getSystem('AudioSystem').play('confirm');
        engine.getSystem('SceneManager').replaceWithTransition(
          new TownScene3D(), { type: 'fade', duration: 0.7, color: '#000000' }
        );
      }
    }

    render(ctx, engine) {
      const W = engine.canvas.width, H = engine.canvas.height;
      const ui = GF.UISystem;

      ui.drawText(ctx, 'SHINING QUEST 3D', W / 2, H * 0.22, {
        font: CFG().ui.bigTitleFont, color: CFG().ui.titleColor,
        align: 'center', baseline: 'middle',
        glow: '#ffaa22', glowBlur: 28, stroke: '#332200', strokeWidth: 4,
      });
      ui.drawText(ctx, 'A tactical RPG, now in three dimensions', W / 2, H * 0.22 + 42, {
        font: '14px monospace', color: '#aab8d8',
        align: 'center', baseline: 'middle',
      });

      ctx.globalAlpha = this._pulse.v;
      ui.drawText(ctx, '— PRESS SPACE / ENTER —', W / 2, H - 70, {
        font: 'bold 18px monospace', color: '#ffffff',
        align: 'center', baseline: 'middle',
      });
      ctx.globalAlpha = 1;

      ui.drawText(ctx, 'WASD/Arrows · SPACE select · X cancel', W / 2, H - 36, {
        font: '11px monospace', color: '#7788aa',
        align: 'center', baseline: 'middle',
      });
    }

    destroy(engine) {
      this._three.clearScene();
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── TownScene3D (overworld hub) ────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  // Town tile types
  const T_GRASS=0, T_PATH=1, T_WATER=2, T_WALL=3, T_FLOWER=4;

  function buildTownMap() {
    const cols = CFG().town.cols, rows = CFG().town.rows;
    const grid = Array.from({ length: rows }, () => Array(cols).fill(T_GRASS));

    // Castle keep
    for (let r = 0; r < 5; r++) for (let c = 9; c < 17; c++) grid[r][c] = T_WALL;
    grid[4][12] = T_PATH; grid[4][13] = T_PATH;

    // Path leading from gate to bottom
    for (let r = 4; r < rows; r++) { grid[r][12] = T_PATH; grid[r][13] = T_PATH; }
    for (let c = 2; c < cols - 2; c++) grid[10][c] = T_PATH;

    // Side houses
    for (let r = 7; r < 10; r++) for (let c = 3; c < 6; c++) grid[r][c] = T_WALL;
    grid[9][4] = T_PATH;
    for (let r = 7; r < 10; r++) for (let c = 19; c < 22; c++) grid[r][c] = T_WALL;
    grid[9][20] = T_PATH;

    // Moat
    for (let c = 8; c < 18; c++) grid[5][c] = T_WATER;
    grid[5][12] = T_PATH; grid[5][13] = T_PATH;

    // Flowers
    grid[7][12] = T_FLOWER; grid[7][13] = T_FLOWER;
    grid[12][6] = T_FLOWER; grid[12][19] = T_FLOWER;
    grid[13][2] = T_FLOWER; grid[13][cols - 3] = T_FLOWER;

    // Outer wall
    for (let c = 0; c < cols; c++) { grid[0][c] = T_WALL; grid[rows-1][c] = T_WALL; }
    for (let r = 0; r < rows; r++) { grid[r][0] = T_WALL; grid[r][cols-1] = T_WALL; }
    grid[rows-1][12] = T_PATH; grid[rows-1][13] = T_PATH;

    return grid;
  }

  function isTownWalkable(tile) {
    return tile !== T_WALL && tile !== T_WATER;
  }

  function buildTownTileMesh(THREE, type, x, z, size) {
    const g = new THREE.Group();
    if (type === T_GRASS) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(size, 0.10, size),
        new THREE.MeshStandardMaterial({ color: 0x3d8a3a, roughness: 0.95 }));
      m.position.set(x, -0.05, z); m.receiveShadow = true; g.add(m);
    } else if (type === T_PATH) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(size, 0.08, size),
        new THREE.MeshStandardMaterial({ color: 0xc8a474, roughness: 0.95 }));
      m.position.set(x, -0.04, z); m.receiveShadow = true; g.add(m);
    } else if (type === T_WATER) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(size, 0.18, size),
        new THREE.MeshStandardMaterial({ color: 0x234abd, roughness: 0.3, metalness: 0.4 }));
      m.position.set(x, -0.18, z); m.receiveShadow = true; g.add(m);
    } else if (type === T_WALL) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(size, 1.5, size),
        new THREE.MeshStandardMaterial({ color: 0x66667a, roughness: 0.9 }));
      m.position.set(x, 0.7, z); m.castShadow = true; m.receiveShadow = true; g.add(m);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(size * 0.85, 0.15, size * 0.85),
        new THREE.MeshStandardMaterial({ color: 0x44445a }));
      cap.position.set(x, 1.5, z); g.add(cap);
    } else if (type === T_FLOWER) {
      const base = new THREE.Mesh(new THREE.BoxGeometry(size, 0.10, size),
        new THREE.MeshStandardMaterial({ color: 0x3d8a3a, roughness: 0.95 }));
      base.position.set(x, -0.05, z); base.receiveShadow = true; g.add(base);
      const colors = [0xff5577, 0xffdd55, 0xffffff, 0xaa55ff];
      for (let i = 0; i < 4; i++) {
        const fx = x - size/4 + (i % 2) * size/2;
        const fz = z - size/4 + Math.floor(i/2) * size/2;
        const flower = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 8, 8),
          new THREE.MeshStandardMaterial({ color: colors[i] })
        );
        flower.position.set(fx, 0.10, fz); g.add(flower);
      }
    }
    return g;
  }

  class TownScene3D extends GF.Scene {
    init(engine) {
      const cfg = CFG();
      this._engine   = engine;
      this._three    = engine.getSystem('three3d');
      this._dialogue = engine.getSystem('DialogueSystem');
      this._scenes   = engine.getSystem('SceneManager');
      this._audio    = engine.getSystem('AudioSystem');

      engine.input.bind('up',      ...cfg.controls.up);
      engine.input.bind('down',    ...cfg.controls.down);
      engine.input.bind('left',    ...cfg.controls.left);
      engine.input.bind('right',   ...cfg.controls.right);
      engine.input.bind('confirm', ...cfg.controls.confirm);
      engine.input.bind('cancel',  ...cfg.controls.cancel);

      this._dialogue.advanceKey = 'confirm';
      this._dialogue._getPortraitCb = name => GF.portraits[name] || null;

      const THREE = window.THREE;
      this._three.setBackground(0x4488cc);

      // Build town grid
      this._mapGrid = buildTownMap();
      const cs = 1.0;
      const cols = cfg.town.cols, rows = cfg.town.rows;
      this._mapMeta = { cols, rows, cs };

      const root = new THREE.Group();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const w = gridToWorld(c, r, cols, rows, cs);
          root.add(buildTownTileMesh(THREE, this._mapGrid[r][c], w.x, w.z, cs));
        }
      }
      this._three.add(root);

      // Sky-ish backdrop and lights
      const amb = new THREE.AmbientLight(0xffffff, 0.55);
      this._three.add(amb);
      const sun = new THREE.DirectionalLight(0xfff4cc, 1.1);
      sun.position.set(8, 14, 6);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.camera.left = -20; sun.shadow.camera.right = 20;
      sun.shadow.camera.top = 20; sun.shadow.camera.bottom = -20;
      this._three.add(sun);

      // Player avatar (Kestra, knight)
      const playerTpl = State.party.find(p => p.id === 'kestra') || State.party[0];
      const playerMesh = buildUnitMesh(THREE, playerTpl);
      // Spawn at the town gate (rows-2)
      const spawn = gridToWorld(cols / 2 | 0, rows - 2, cols, rows, cs);
      playerMesh.position.set(spawn.x, 0, spawn.z);
      this._three.add(playerMesh);
      this._player = {
        mesh: playerMesh,
        x: spawn.x, z: spawn.z,
        facing: -Math.PI / 2,  // facing +Z (towards the castle gate up north)
      };

      // NPCs
      const villagerTpl = { team: 'enemy', sprite: 'goblin' }; // placeholder ignored — we override mesh
      const kingMesh = buildKingMesh(THREE);
      const w1 = gridToWorld(12, 5, cols, rows, cs);
      kingMesh.position.set(w1.x, 0, w1.z);
      this._three.add(kingMesh);

      const villagerMeshA = buildVillagerMesh(THREE, 0xc36a3a);
      const wA = gridToWorld(4, 11, cols, rows, cs);
      villagerMeshA.position.set(wA.x, 0, wA.z);
      this._three.add(villagerMeshA);

      const villagerMeshB = buildVillagerMesh(THREE, 0x3a8a8a);
      const wB = gridToWorld(21, 11, cols, rows, cs);
      villagerMeshB.position.set(wB.x, 0, wB.z);
      this._three.add(villagerMeshB);

      this._npcs = [
        { id: 'king', col: 12, row: 5, mesh: kingMesh,
          script: () => this._talkToKing() },
        { id: 'villager', col: 4, row: 11, mesh: villagerMeshA,
          script: () => this._showRandomVillagerLine() },
        { id: 'villager', col: 21, row: 11, mesh: villagerMeshB,
          script: () => this._showRandomVillagerLine() },
      ];

      // Camera (3rd person follow)
      const cam = new THREE.PerspectiveCamera(50, engine.canvas.width / engine.canvas.height, 0.1, 200);
      this._three.setCamera(cam);
      this._cam = cam;
      this._updateCamera(0);

      this._showIntro = !State.visitedChapters.has('town_intro');
      this._signLine = `Chapter ${State.chapterIdx + 1} awaits — speak to the King.`;
      this._t = 0;
      this._walkBob = 0;
    }

    enter(engine) {
      if (this._showIntro) {
        this._showIntro = false;
        State.visitedChapters.add('town_intro');
        this._dialogue.start(DATA().townIntro);
      }
    }

    _talkToKing() {
      const ch = DATA().chapters[State.chapterIdx];
      if (!ch) {
        this._dialogue.start(DATA().finale);
        const off = this._engine.events.on('dialogue:end', () => {
          off();
          this._scenes.replaceWithTransition(new VictoryScene3D(),
            { type: 'iris', duration: 1.0, color: '#000000' });
        });
        return;
      }
      this._dialogue.start(ch.intro);
      const off = this._engine.events.on('dialogue:end', () => {
        off();
        this._scenes.replaceWithTransition(new BattleScene3D(ch),
          { type: 'wipe', duration: 0.9, color: '#000000' });
      });
    }

    _showRandomVillagerLine() {
      const lines = DATA().villagerLines;
      this._dialogue.start(lines[Math.floor(Math.random() * lines.length)]);
    }

    update(dt, engine) {
      this._t += dt;
      if (this._dialogue.isActive) return;

      const { cols, rows, cs } = this._mapMeta;
      const speed = CFG().town.playerSpeed;

      let dx = 0, dz = 0;
      if (engine.input.isDown('left'))  dx -= 1;
      if (engine.input.isDown('right')) dx += 1;
      if (engine.input.isDown('up'))    dz -= 1;
      if (engine.input.isDown('down'))  dz += 1;

      const moving = dx !== 0 || dz !== 0;
      if (moving) {
        const len = Math.hypot(dx, dz) || 1;
        dx /= len; dz /= len;
        const nx = this._player.x + dx * speed * dt;
        const nz = this._player.z + dz * speed * dt;
        // Convert world to grid for collision check
        const col = Math.round(nx / cs + (cols - 1) / 2);
        const row = Math.round(nz / cs + (rows - 1) / 2);
        if (col >= 0 && row >= 0 && row < rows && col < cols
            && isTownWalkable(this._mapGrid[row][col])) {
          this._player.x = nx;
          this._player.z = nz;
        }
        this._player.facing = Math.atan2(dx, dz);
        this._walkBob += dt * 8;
      } else {
        this._walkBob *= 0.9;
      }

      // Apply transform
      this._player.mesh.position.set(this._player.x,
        Math.abs(Math.sin(this._walkBob)) * 0.05, this._player.z);
      this._player.mesh.rotation.y = this._player.facing;

      this._updateCamera(dt);

      if (engine.input.wasPressed('confirm')) {
        const npc = this._nearbyNpc();
        if (npc) {
          this._audio.play('confirm');
          npc.script();
        }
      }
    }

    _updateCamera(dt) {
      // Fixed-direction follow camera: the camera always sits at the same
      // offset south of (and above) the player, looking north towards the
      // castle. This keeps the orientation stable when the character turns —
      // the world doesn't spin around them.
      const w3 = CFG().world3d;
      this._cam.position.set(
        this._player.x,
        w3.townFollowHeight,
        this._player.z + w3.townFollowDist
      );
      this._cam.lookAt(this._player.x, 0.5, this._player.z);
    }

    _nearbyNpc() {
      const { cols, rows, cs } = this._mapMeta;
      const px = this._player.x, pz = this._player.z;
      for (const n of this._npcs) {
        const w = gridToWorld(n.col, n.row, cols, rows, cs);
        if (Math.hypot(px - w.x, pz - w.z) < cs * 1.6) return n;
      }
      return null;
    }

    render(ctx, engine) {
      const W = engine.canvas.width, H = engine.canvas.height;
      const cfg = CFG();
      const ui = GF.UISystem;

      // NPC interaction prompt — projected from 3D position
      const npc = this._nearbyNpc();
      if (npc) {
        const v3 = new window.THREE.Vector3();
        npc.mesh.getWorldPosition(v3);
        v3.y += 1.4;
        const sp = this._three.worldToScreen(v3);
        if (sp.depth > -1 && sp.depth < 1) {
          const pulse = (Math.sin(Date.now() / 180) * 0.4 + 0.6);
          ctx.globalAlpha = pulse;
          ui.drawText(ctx, '▼ SPACE', sp.x, sp.y, {
            font: 'bold 14px monospace', color: '#ffdd44',
            align: 'center', baseline: 'middle',
            stroke: '#000000', strokeWidth: 3,
          });
          ctx.globalAlpha = 1;
        }
      }

      // Bottom HUD
      ui.drawPanel(ctx, 8, H - 36, W - 16, 28, {
        bgColor: cfg.ui.panelBg, borderColor: cfg.ui.panelBorder, radius: 4,
      });
      ui.drawText(ctx, this._signLine, 16, H - 22, {
        font: cfg.ui.hudFont, color: cfg.ui.hudColor, baseline: 'middle',
      });
      const partyStr = State.party.map(p => `${p.name.slice(0,3)} ${p.hp}/${p.maxHp}`).join('  ');
      ui.drawText(ctx, `Party: ${partyStr}`, W - 16, H - 22, {
        font: cfg.ui.hudFont, color: cfg.ui.hudColor, align: 'right', baseline: 'middle',
      });
    }

    destroy(engine) {
      this._three.clearScene();
    }
  }

  function buildKingMesh(THREE) {
    const g = new THREE.Group();
    const robe = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 1.2, 12, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x7a1f3a, side: THREE.DoubleSide })
    );
    robe.position.y = 0.6; g.add(robe);
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.30, 0.30, 0.5, 10),
      new THREE.MeshStandardMaterial({ color: 0x7a1f3a })
    );
    body.position.y = 0.85; g.add(body);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.20, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xf0d2a8 })
    );
    head.position.y = 1.30; g.add(head);
    const beard = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.30, 6),
      new THREE.MeshStandardMaterial({ color: 0xeeeeee })
    );
    beard.position.y = 1.10; beard.rotation.x = Math.PI;
    g.add(beard);
    // Gold crown — five spikes on a ring
    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.10, 12),
      new THREE.MeshStandardMaterial({ color: 0xffcc44, metalness: 0.7 })
    );
    crown.position.y = 1.50; g.add(crown);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.16, 4),
        new THREE.MeshStandardMaterial({ color: 0xffcc44, metalness: 0.7 })
      );
      spike.position.set(Math.cos(a) * 0.22, 1.62, Math.sin(a) * 0.22);
      g.add(spike);
    }
    return g;
  }

  function buildVillagerMesh(THREE, tunicColor) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.30, 0.7, 10),
      new THREE.MeshStandardMaterial({ color: tunicColor })
    );
    body.position.y = 0.35; g.add(body);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xf0d2a8 })
    );
    head.position.y = 0.85; g.add(head);
    const hat = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.18, 8),
      new THREE.MeshStandardMaterial({ color: 0x554433 })
    );
    hat.position.y = 1.04; g.add(hat);
    return g;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── BattleScene3D ──────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  const PHASE = {
    INTRO: 'intro', UNIT_TURN: 'unit_turn', PICK_MOVE: 'pick_move',
    ANIM_MOVE: 'anim_move', PICK_ATTACK: 'pick_attack', PICK_SPELL: 'pick_spell',
    ANIM_ATTACK: 'anim_attack', ENEMY_THINK: 'enemy_think',
    OUTRO: 'outro', DEFEAT: 'defeat',
  };

  class BattleScene3D extends GF.Scene {
    constructor(chapterDef) { super(); this._chapter = chapterDef; }

    init(engine) {
      const cfg = CFG();
      this._engine   = engine;
      this._three    = engine.getSystem('three3d');
      this._dialogue = engine.getSystem('DialogueSystem');
      this._scenes   = engine.getSystem('SceneManager');
      this._tweens   = engine.getSystem('TweenSystem');
      this._audio    = engine.getSystem('AudioSystem');
      this._battle   = engine.getSystem('TurnBasedBattleSystem');
      this._grids    = engine.getSystem('GridSystem');

      this._dialogue.advanceKey = 'confirm';
      this._dialogue._getPortraitCb = name => GF.portraits[name] || null;

      const ch = this._chapter;
      const THREE = window.THREE;
      const cs = 1.0;
      const cols = ch.cols, rows = ch.rows;
      this._cs = cs;
      this._mapMeta = { cols, rows, cs };

      // Sky / fog
      this._three.setBackground(0x6688bb);

      // Logical grid
      const grid = this._grids.create({
        cols, rows, cellSize: cs,
        x: 0, y: 0,
      });
      this._grid = grid;

      // Apply terrain costs / blocked
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const t = ch.terrain[r][c];
          const palCost = TERRAIN_3D[t] ? cfg.battle.terrainCost[t] : 1;
          if (cfg.battle.blockedTerrain.indexOf(t) >= 0) {
            grid.setBlocked(c, r, true);
          } else {
            grid.setCost(c, r, palCost);
          }
        }
      }

      // Build 3D terrain
      const terrainRoot = new THREE.Group();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const w = gridToWorld(c, r, cols, rows, cs);
          terrainRoot.add(buildTerrainCell(THREE, ch.terrain[r][c], w.x, w.z, cs));
        }
      }
      this._three.add(terrainRoot);

      // Highlight overlay group (move/attack tiles, cursor, path)
      this._highlightRoot = new THREE.Group();
      this._three.add(this._highlightRoot);

      // Lighting (outdoor)
      const amb = new THREE.AmbientLight(0xffffff, 0.55);
      this._three.add(amb);
      const sun = new THREE.DirectionalLight(0xfff4cc, 1.2);
      sun.position.set(8, 16, 6);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.camera.left = -cols; sun.shadow.camera.right = cols;
      sun.shadow.camera.top = rows; sun.shadow.camera.bottom = -rows;
      this._three.add(sun);

      // Camera: isometric overhead at fixed angle
      const cam = new THREE.PerspectiveCamera(45, engine.canvas.width / engine.canvas.height, 0.1, 200);
      const camDist = Math.max(cols, rows) * 1.1;
      cam.position.set(0, camDist * 1.1, camDist * 0.9);
      cam.lookAt(0, 0, 0);
      this._three.setCamera(cam);
      this._cam = cam;
      this._camAnchor = { x: 0, z: 0 };

      // Build units
      this._units = [];
      State.party.forEach((p, i) => {
        if (p.dead) return;
        const spawn = ch.playerSpawns[i] || ch.playerSpawns[0];
        const u = Object.assign({}, p, {
          col: spawn.col, row: spawn.row,
          mesh: buildUnitMesh(THREE, p),
          actedThisTurn: false,
          ref: p,
        });
        const w = gridToWorld(u.col, u.row, cols, rows, cs);
        u.mesh.position.set(w.x, 0, w.z);
        this._three.add(u.mesh);
        grid.placeOccupant(u, u.col, u.row);
        this._units.push(u);
      });
      ch.enemies.forEach(e => {
        const tpl = DATA().enemies[e.type];
        const u = Object.assign({}, tpl, {
          col: e.col, row: e.row,
          dead: false, hp: tpl.maxHp,
          mesh: buildUnitMesh(THREE, tpl),
          actedThisTurn: false,
        });
        const w = gridToWorld(u.col, u.row, cols, rows, cs);
        u.mesh.position.set(w.x, 0, w.z);
        // Face towards player side (east side, lower col)
        u.mesh.rotation.y = -Math.PI / 2;
        this._three.add(u.mesh);
        grid.placeOccupant(u, u.col, u.row);
        this._units.push(u);
      });
      // Player units face east (towards enemies)
      for (const u of this._units) {
        if (u.team === 'player') u.mesh.rotation.y = Math.PI / 2;
      }

      // Hook battle events
      this._unsubs = [
        engine.events.on('battle:turn_start', d => this._onTurnStart(d.unit)),
        engine.events.on('battle:complete',   d => this._onComplete(d.result)),
      ];

      // State
      this._cursor = { col: this._units[0].col, row: this._units[0].row };
      this._reachable = [];
      this._attackable = [];
      this._floatingTexts = [];
      this._t = 0;

      this._phase = PHASE.INTRO;
      this._introDone = false;
      this._battle.start({ units: this._units });
      this._pendingFirstUnit = this._battle.currentUnit();

      this._dialogue.start(this._chapter.intro);
      const off = engine.events.on('dialogue:end', () => {
        off();
        this._introDone = true;
        if (this._pendingFirstUnit) {
          this._beginUnitTurn(this._pendingFirstUnit);
          this._pendingFirstUnit = null;
        }
      });
    }

    destroy(engine) {
      this._unsubs.forEach(fn => fn());
      this._grids.remove(this._grid);
      this._three.clearScene();
    }

    // ── Battle events ────────────────────────────────────────────────────────

    _onTurnStart(unit) {
      if (!this._introDone) { this._pendingFirstUnit = unit; return; }
      this._beginUnitTurn(unit);
    }

    _beginUnitTurn(unit) {
      this._activeUnit = unit;
      this._cursor = { col: unit.col, row: unit.row };
      this._reachable  = this._grid.tilesInRange(unit, unit.move, { team: unit.team, ignore: unit });
      this._attackable = [];
      // Pan camera to track active unit
      const cs = this._cs, m = this._mapMeta;
      const w = gridToWorld(unit.col, unit.row, m.cols, m.rows, cs);
      this._camAnchor = { x: w.x, z: w.z };
      if (unit.team === 'player') {
        this._buildActionMenu(unit);
        this._phase = PHASE.UNIT_TURN;
      } else {
        this._phase = PHASE.ENEMY_THINK;
        this._enemyThinkTimer = CFG().battle.enemyTurnDelayMs / 1000;
      }
      this._rebuildHighlights();
    }

    _buildActionMenu(unit) {
      const items = [
        { label: 'Move',   value: 'move',   enabled: this._reachable.length > 1 },
        { label: 'Attack', value: 'attack', enabled: this._anyAttackTargets(unit) },
      ];
      if (unit.spell) {
        items.push({ label: unit.spell.name, value: 'spell',
                     enabled: this._anySpellTargets(unit) });
      }
      items.push({ label: 'Wait', value: 'wait', enabled: true });

      this._menu = new GF.CursorMenu({
        items,
        onSelect: it => this._onMenuSelect(it),
        onCancel: () => {},
        actions : { up: ['ArrowUp','KeyW'], down: ['ArrowDown','KeyS'],
                    select: ['Enter','Space','KeyZ'], cancel: ['Escape','KeyX'] },
      });
    }

    _anyAttackTargets(unit) {
      const cells = this._grid.cellsInRing(unit, unit.attackRange.min, unit.attackRange.max);
      return cells.some(({col,row}) => {
        const occ = this._grid.occupantAt(col, row);
        return occ && !occ.dead && occ.team !== unit.team;
      });
    }
    _anySpellTargets(unit) {
      if (!unit.spell) return false;
      const cells = this._grid.cellsInRing(unit, 1, unit.spell.range);
      return cells.some(({col,row}) => {
        const occ = this._grid.occupantAt(col, row);
        return occ && !occ.dead && occ.team !== unit.team;
      });
    }

    _onMenuSelect(item) {
      this._audio.play('confirm');
      if (item.value === 'move') {
        this._phase = PHASE.PICK_MOVE;
        this._rebuildHighlights();
      } else if (item.value === 'attack') {
        this._phase = PHASE.PICK_ATTACK;
        this._attackable = this._grid.cellsInRing(
          this._activeUnit, this._activeUnit.attackRange.min, this._activeUnit.attackRange.max
        ).filter(({col,row}) => {
          const occ = this._grid.occupantAt(col, row);
          return occ && !occ.dead && occ.team !== this._activeUnit.team;
        });
        if (this._attackable.length) this._cursor = { ...this._attackable[0] };
        this._rebuildHighlights();
      } else if (item.value === 'spell') {
        this._phase = PHASE.PICK_SPELL;
        this._attackable = this._grid.cellsInRing(
          this._activeUnit, 1, this._activeUnit.spell.range
        ).filter(({col,row}) => {
          const occ = this._grid.occupantAt(col, row);
          return occ && !occ.dead && occ.team !== this._activeUnit.team;
        });
        if (this._attackable.length) this._cursor = { ...this._attackable[0] };
        this._rebuildHighlights();
      } else if (item.value === 'wait') {
        this._endActiveTurn();
      }
    }

    _endActiveTurn() {
      this._menu = null;
      this._reachable = [];
      this._attackable = [];
      this._rebuildHighlights();
      this._battle.endTurn();
    }

    _onComplete(result) {
      if (result === 'victory') {
        State.party.forEach(p => {
          const battleU = this._units.find(u => u.id === p.id);
          if (battleU) { p.hp = battleU.hp; p.dead = battleU.dead; }
        });
        State.party.forEach(p => { if (!p.dead) p.hp = Math.min(p.maxHp, p.hp + 6); });
        State.chapterIdx = this._chapter.nextChapter !== null
          ? this._chapter.nextChapter
          : State.chapterIdx + 1;
        this._audio.play('victory');
        this._phase = PHASE.OUTRO;
        this._dialogue.start(this._chapter.victory);
        const off = this._engine.events.on('dialogue:end', () => {
          off();
          this._scenes.replaceWithTransition(new TownScene3D(),
            { type: 'fade', duration: 0.7, color: '#000000' });
        });
      } else {
        this._audio.play('defeat');
        this._phase = PHASE.DEFEAT;
        setTimeout(() => {
          this._scenes.replaceWithTransition(new GameOverScene3D(),
            { type: 'iris', duration: 1.0, color: '#000000' });
        }, 1500);
      }
    }

    // ── Highlights ──────────────────────────────────────────────────────────

    _rebuildHighlights() {
      // Wipe and rebuild the highlight overlay
      const root = this._highlightRoot;
      while (root.children.length) {
        const c = root.children.pop();
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
      }

      const THREE = window.THREE;
      const cs = this._cs, m = this._mapMeta;
      const cfg = CFG();

      const tile = (col, row, color, alpha) => {
        const w = gridToWorld(col, row, m.cols, m.rows, cs);
        const plane = new THREE.Mesh(
          new THREE.PlaneGeometry(cs * 0.95, cs * 0.95),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: alpha })
        );
        plane.rotation.x = -Math.PI / 2;
        plane.position.set(w.x, 0.18, w.z);
        root.add(plane);
        return plane;
      };

      if (this._phase === PHASE.PICK_MOVE) {
        for (const c of this._reachable) tile(c.col, c.row, cfg.ui.moveTileColor, 0.35);
        // Path preview
        const path = this._grid.findPath(
          { col: this._activeUnit.col, row: this._activeUnit.row },
          { col: this._cursor.col, row: this._cursor.row },
          { team: this._activeUnit.team, ignore: this._activeUnit }
        );
        if (path) {
          for (let i = 1; i < path.length; i++) {
            const w = gridToWorld(path[i].col, path[i].row, m.cols, m.rows, cs);
            const dot = new THREE.Mesh(
              new THREE.SphereGeometry(0.12, 8, 8),
              new THREE.MeshBasicMaterial({ color: cfg.ui.pathTileColor })
            );
            dot.position.set(w.x, 0.30, w.z);
            root.add(dot);
          }
        }
      }
      if (this._phase === PHASE.PICK_ATTACK || this._phase === PHASE.PICK_SPELL) {
        for (const c of this._attackable) tile(c.col, c.row, cfg.ui.attackTileColor, 0.45);
      }

      // Cursor (pulsing yellow ring)
      if (this._phase === PHASE.PICK_MOVE || this._phase === PHASE.PICK_ATTACK ||
          this._phase === PHASE.PICK_SPELL) {
        const w = gridToWorld(this._cursor.col, this._cursor.row, m.cols, m.rows, cs);
        const cursor = new THREE.Mesh(
          new THREE.RingGeometry(cs * 0.42, cs * 0.50, 24),
          new THREE.MeshBasicMaterial({ color: cfg.ui.cursorColor, transparent: true, opacity: 0.85 })
        );
        cursor.rotation.x = -Math.PI / 2;
        cursor.position.set(w.x, 0.21, w.z);
        cursor.userData.cursor = true;
        root.add(cursor);
        this._cursorMesh = cursor;
      } else {
        this._cursorMesh = null;
      }
    }

    // ── Update ───────────────────────────────────────────────────────────────

    update(dt, engine) {
      this._t += dt;
      // Animate floating texts
      this._floatingTexts.forEach(ft => { ft.t += dt; ft.y -= 24 * dt; });
      this._floatingTexts = this._floatingTexts.filter(ft => ft.t < 1.0);

      // Animate dragon / bat wings if any
      for (const u of this._units) {
        if (u.dead) continue;
        const wings = u.mesh.userData.wings;
        if (wings) {
          const a = Math.sin(this._t * 6) * 0.4;
          wings[0].rotation.y = Math.PI / 7 + a;
          wings[1].rotation.y = -Math.PI / 7 - a;
        }
      }

      // Gently bob the cursor
      if (this._cursorMesh) {
        this._cursorMesh.position.y = 0.21 + Math.sin(this._t * 6) * 0.06;
      }

      // Smooth camera pan to anchor
      const target = this._camAnchor || { x: 0, z: 0 };
      const camDist = Math.max(this._mapMeta.cols, this._mapMeta.rows) * 1.1;
      const goalX = target.x;
      const goalZ = target.z + camDist * 0.9;
      const goalY = camDist * 1.1;
      this._cam.position.x += (goalX - this._cam.position.x) * Math.min(1, dt * 4);
      this._cam.position.y += (goalY - this._cam.position.y) * Math.min(1, dt * 4);
      this._cam.position.z += (goalZ - this._cam.position.z) * Math.min(1, dt * 4);
      this._cam.lookAt(target.x, 0, target.z);

      if (this._dialogue.isActive) return;

      switch (this._phase) {
        case PHASE.UNIT_TURN:    return this._updateUnitTurn(dt, engine);
        case PHASE.PICK_MOVE:    return this._updatePickMove(dt, engine);
        case PHASE.ANIM_MOVE:    return this._updateAnimMove(dt, engine);
        case PHASE.PICK_ATTACK:  return this._updatePickTarget(dt, engine, false);
        case PHASE.PICK_SPELL:   return this._updatePickTarget(dt, engine, true);
        case PHASE.ANIM_ATTACK:  return this._updateAnimAttack(dt, engine);
        case PHASE.ENEMY_THINK:  return this._updateEnemyThink(dt, engine);
      }
    }

    _updateUnitTurn(dt, engine) {
      this._menu.update(engine.input);
    }

    _updatePickMove(dt, engine) {
      if (this._moveCursor(engine)) this._rebuildHighlights();
      if (engine.input.wasPressed('cancel')) {
        this._audio.play('cancel');
        this._phase = PHASE.UNIT_TURN;
        this._rebuildHighlights();
        return;
      }
      if (engine.input.wasPressed('confirm')) {
        const cell = this._reachable.find(r => r.col === this._cursor.col && r.row === this._cursor.row);
        if (!cell) { this._audio.play('cancel'); return; }
        this._audio.play('confirm');
        const path = this._grid.findPath(
          { col: this._activeUnit.col, row: this._activeUnit.row },
          { col: this._cursor.col, row: this._cursor.row },
          { team: this._activeUnit.team, ignore: this._activeUnit }
        );
        if (!path || path.length < 2) { this._audio.play('cancel'); return; }
        this._beginMoveAnim(path);
      }
    }

    _beginMoveAnim(path) {
      this._phase = PHASE.ANIM_MOVE;
      this._movePath = path;
      this._movePathIdx = 0;
      this._moveStepTimer = 0;
      this._grid.removeOccupant(this._activeUnit);
      this._rebuildHighlights();
    }

    _updateAnimMove(dt, engine) {
      const u = this._activeUnit;
      const m = this._mapMeta, cs = this._cs;
      const stepDuration = CFG().battle.moveStepSeconds;

      this._moveStepTimer += dt;
      while (this._moveStepTimer >= stepDuration && this._movePathIdx < this._movePath.length - 1) {
        this._moveStepTimer -= stepDuration;
        this._movePathIdx++;
        this._audio.play('step');
      }
      const fromIdx = Math.max(0, this._movePathIdx - 1);
      const toIdx   = Math.min(this._movePath.length - 1, this._movePathIdx);
      const a = this._movePath[fromIdx], b = this._movePath[toIdx];
      const t = Math.min(1, this._moveStepTimer / stepDuration);
      const aw = gridToWorld(a.col, a.row, m.cols, m.rows, cs);
      const bw = gridToWorld(b.col, b.row, m.cols, m.rows, cs);
      const px = aw.x + (bw.x - aw.x) * t;
      const pz = aw.z + (bw.z - aw.z) * t;
      const bob = Math.abs(Math.sin((this._movePathIdx + t) * Math.PI)) * 0.06;
      u.mesh.position.set(px, bob, pz);

      // Face the direction of travel
      const dx = b.col - a.col, dz = b.row - a.row;
      if (dx !== 0 || dz !== 0) {
        u.mesh.rotation.y = Math.atan2(dx, dz);
      }

      this._camAnchor = { x: px, z: pz };

      if (this._movePathIdx >= this._movePath.length - 1 && t >= 1) {
        const last = this._movePath[this._movePath.length - 1];
        u.col = last.col; u.row = last.row;
        const wc = gridToWorld(u.col, u.row, m.cols, m.rows, cs);
        u.mesh.position.set(wc.x, 0, wc.z);
        this._grid.placeOccupant(u, u.col, u.row);

        if (u.team === 'player') {
          const items = [
            { label: 'Attack', value: 'attack', enabled: this._anyAttackTargets(u) },
          ];
          if (u.spell) items.push({ label: u.spell.name, value: 'spell',
                                     enabled: this._anySpellTargets(u) });
          items.push({ label: 'Wait', value: 'wait', enabled: true });
          this._menu = new GF.CursorMenu({
            items,
            onSelect: it => this._onMenuSelect(it),
            onCancel: () => {},
            actions : { up: ['ArrowUp','KeyW'], down: ['ArrowDown','KeyS'],
                        select: ['Enter','Space','KeyZ'], cancel: ['Escape','KeyX'] },
          });
          this._phase = PHASE.UNIT_TURN;
          this._rebuildHighlights();
        } else {
          this._enemyAttackPhase();
        }
      }
    }

    _updatePickTarget(dt, engine, isSpell) {
      if (this._moveCursor(engine)) this._rebuildHighlights();
      if (engine.input.wasPressed('cancel')) {
        this._audio.play('cancel');
        this._phase = PHASE.UNIT_TURN;
        this._rebuildHighlights();
        return;
      }
      if (engine.input.wasPressed('confirm')) {
        const valid = this._attackable.find(c => c.col === this._cursor.col && c.row === this._cursor.row);
        if (!valid) { this._audio.play('cancel'); return; }
        const target = this._grid.occupantAt(this._cursor.col, this._cursor.row);
        if (!target || target.dead || target.team === this._activeUnit.team) {
          this._audio.play('cancel'); return;
        }
        this._beginAttack(this._activeUnit, target, isSpell);
      }
    }

    _beginAttack(attacker, target, isSpell) {
      this._phase = PHASE.ANIM_ATTACK;
      this._audio.play(isSpell ? 'spell' : 'hit');
      const m = this._mapMeta, cs = this._cs;
      const aw = gridToWorld(attacker.col, attacker.row, m.cols, m.rows, cs);
      const tw = gridToWorld(target.col, target.row, m.cols, m.rows, cs);
      this._attackPending = {
        attacker, target, isSpell,
        timer: 0, duration: isSpell ? CFG().battle.spellDuration : CFG().battle.attackDuration,
        applied: false, attackerStart: aw,
        attackerLunge: { x: (tw.x - aw.x) * 0.25, z: (tw.z - aw.z) * 0.25 },
      };
      // Face target
      const dx = target.col - attacker.col, dz = target.row - attacker.row;
      attacker.mesh.rotation.y = Math.atan2(dx, dz);
      this._camAnchor = { x: (aw.x + tw.x) / 2, z: (aw.z + tw.z) / 2 };
      this._rebuildHighlights();
    }

    _updateAnimAttack(dt, engine) {
      const a = this._attackPending; if (!a) return;
      a.timer += dt;
      const fr = a.timer / a.duration;
      // Lunge motion: 0..0.4 forward, 0.4..1 return
      let lungeT;
      if (fr < 0.4) lungeT = fr / 0.4;
      else lungeT = Math.max(0, 1 - (fr - 0.4) / 0.6);
      a.attacker.mesh.position.x = a.attackerStart.x + a.attackerLunge.x * lungeT;
      a.attacker.mesh.position.z = a.attackerStart.z + a.attackerLunge.z * lungeT;
      a.attacker.mesh.position.y = lungeT * 0.18;

      // Apply damage & spawn particles at the impact point
      if (!a.applied && a.timer > a.duration * 0.45) {
        a.applied = true;
        const dmg = this._calcDamage(a.attacker, a.target, a.isSpell);
        const before = a.target.hp;
        this._battle.dealDamage(a.target, dmg.amount, a.attacker);
        const dealt = before - a.target.hp;

        // Floating text — projected later in render()
        this._floatingTexts.push({
          target: a.target,
          text: dealt + (dmg.crit ? ' CRIT!' : ''),
          color: dmg.crit ? '#ffff66' : '#ffffff',
          t: 0, y: 0,
        });

        // 3D burst (Points cloud)
        this._spawn3DBurst(a.target.mesh.position, a.isSpell);

        // Damage flash
        const mat = a.target.mesh.userData.bodyMat;
        if (mat) {
          const oldEmissive = mat.emissive ? mat.emissive.getHex() : 0x000000;
          if (mat.emissive) {
            mat.emissive.setHex(a.isSpell ? 0xaa44ff : 0xff3333);
            setTimeout(() => mat.emissive.setHex(oldEmissive), 220);
          }
        }

        if (dmg.crit) this._audio.play('crit');
        if (a.target.dead) {
          this._audio.play('death');
          this._floatingTexts.push({
            target: a.target, text: 'DEFEATED',
            color: '#ff5566', t: 0, y: -16,
          });
          this._grid.removeOccupant(a.target);
          // Topple animation
          this._tweens.create(a.target.mesh.rotation, { z: -Math.PI / 2 }, 0.4, { ease: 'inOutQuad' });
          this._tweens.create(a.target.mesh.position, { y: -0.2 }, 0.6, { ease: 'inQuad' });
          // Fade
          a.target.mesh.traverse(child => {
            if (child.material) {
              child.material.transparent = true;
              this._tweens.create(child.material, { opacity: 0.0 }, 0.8, { ease: 'inQuad' });
            }
          });
        }
      }

      if (a.timer >= a.duration) {
        a.attacker.mesh.position.x = a.attackerStart.x;
        a.attacker.mesh.position.z = a.attackerStart.z;
        a.attacker.mesh.position.y = 0;
        this._attackPending = null;
        this._endActiveTurn();
      }
    }

    _spawn3DBurst(pos, isSpell) {
      const THREE = window.THREE;
      const N = 30;
      const positions = new Float32Array(N * 3);
      const velocities = [];
      for (let i = 0; i < N; i++) {
        positions[i*3]   = pos.x;
        positions[i*3+1] = pos.y + 0.5;
        positions[i*3+2] = pos.z;
        const a = Math.random() * Math.PI * 2;
        const sp = 1 + Math.random() * 2;
        velocities.push([Math.cos(a) * sp, 1 + Math.random() * 2, Math.sin(a) * sp]);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color: isSpell ? 0xaa66ff : 0xffaa44,
        size: 0.15, transparent: true, opacity: 0.95,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(geo, mat);
      this._three.add(points);

      // Animate then remove
      const start = performance.now();
      const tick = () => {
        const t = (performance.now() - start) / 1000;
        if (t > 0.7) {
          this._three.remove(points);
          return;
        }
        const arr = geo.attributes.position.array;
        for (let i = 0; i < N; i++) {
          arr[i*3]   += velocities[i][0] * 0.016;
          arr[i*3+1] += (velocities[i][1] - t * 4) * 0.016;
          arr[i*3+2] += velocities[i][2] * 0.016;
        }
        geo.attributes.position.needsUpdate = true;
        mat.opacity = Math.max(0, 0.95 - t * 1.4);
        requestAnimationFrame(tick);
      };
      tick();
    }

    _calcDamage(attacker, target, isSpell) {
      const cfg = CFG().battle;
      let base;
      if (isSpell) {
        const [lo, hi] = attacker.spell.dmg;
        base = GF.Math.rand(lo, hi);
      } else {
        base = Math.max(1, attacker.atk - target.def * 0.6);
      }
      base *= 1 + (Math.random() * 2 - 1) * cfg.damageVariance;
      const crit = !isSpell && Math.random() < (attacker.critChance || 0);
      if (crit) base *= cfg.critMultiplier;
      return { amount: Math.max(1, Math.round(base)), crit };
    }

    _updateEnemyThink(dt, engine) {
      this._enemyThinkTimer -= dt;
      if (this._enemyThinkTimer > 0) return;

      const u = this._activeUnit;
      const targets = this._units.filter(t => t.team === 'player' && !t.dead);
      if (!targets.length) { this._endActiveTurn(); return; }
      let bestTarget = targets[0], bestDist = Infinity;
      for (const t of targets) {
        const d = GF.Grid.manhattan(u, t);
        if (d < bestDist) { bestDist = d; bestTarget = t; }
      }

      const inRange = bestDist >= u.attackRange.min && bestDist <= u.attackRange.max;
      if (inRange) { this._enemyAttackPhase(bestTarget); return; }

      const reach = this._grid.tilesInRange(u, u.move, { team: u.team, ignore: u });
      let bestCell = null, bestScore = Infinity;
      for (const cell of reach) {
        const d = Math.abs(cell.col - bestTarget.col) + Math.abs(cell.row - bestTarget.row);
        const score = (d >= u.attackRange.min && d <= u.attackRange.max) ? -100 + d : d * 10 + cell.cost;
        if (score < bestScore) { bestScore = score; bestCell = cell; }
      }

      if (bestCell && (bestCell.col !== u.col || bestCell.row !== u.row)) {
        const path = this._grid.findPath(
          { col: u.col, row: u.row }, { col: bestCell.col, row: bestCell.row },
          { team: u.team, ignore: u }
        );
        if (path && path.length > 1) {
          this._aiQueuedTarget = bestTarget;
          this._beginMoveAnim(path);
          return;
        }
      }
      this._enemyAttackPhase(bestTarget);
    }

    _enemyAttackPhase(target) {
      const u = this._activeUnit;
      target = target || this._aiQueuedTarget;
      this._aiQueuedTarget = null;
      const targets = this._units.filter(t =>
        t.team === 'player' && !t.dead &&
        GF.Grid.manhattan(u, t) >= u.attackRange.min &&
        GF.Grid.manhattan(u, t) <= u.attackRange.max);
      const pick = targets.includes(target) ? target : targets[0];
      if (pick) this._beginAttack(u, pick, false);
      else      this._endActiveTurn();
    }

    _moveCursor(engine) {
      let moved = false;
      // Cursor maps to the screen-space arrows. Because the camera looks down at
      // the grid, "up" should reduce row and "right" should increase col.
      if (engine.input.wasPressed('left'))  { this._cursor.col = Math.max(0, this._cursor.col - 1); moved = true; }
      if (engine.input.wasPressed('right')) { this._cursor.col = Math.min(this._chapter.cols - 1, this._cursor.col + 1); moved = true; }
      if (engine.input.wasPressed('up'))    { this._cursor.row = Math.max(0, this._cursor.row - 1); moved = true; }
      if (engine.input.wasPressed('down'))  { this._cursor.row = Math.min(this._chapter.rows - 1, this._cursor.row + 1); moved = true; }
      if (moved) this._audio.play('cursor');
      return moved;
    }

    // ── Render (2D HUD overlay) ─────────────────────────────────────────────

    render(ctx, engine) {
      const W = engine.canvas.width, H = engine.canvas.height;
      const cfg = CFG();
      const ui = GF.UISystem;
      const THREE = window.THREE;

      // HP bars and active markers, projected from world to screen
      for (const u of this._units) {
        if (u.dead) continue;
        const v = new THREE.Vector3();
        u.mesh.getWorldPosition(v); v.y += 1.5;
        const sp = this._three.worldToScreen(v);
        if (sp.depth > 1 || sp.depth < -1) continue;
        const barW = 36, barH = 4;
        ctx.fillStyle = '#000000';
        ctx.fillRect(sp.x - barW/2 - 1, sp.y - 1, barW + 2, barH + 2);
        ctx.fillStyle = u.team === 'player' ? '#66ccff' : '#ff5566';
        ctx.fillRect(sp.x - barW/2, sp.y, barW * (u.hp / u.maxHp), barH);

        // Active arrow
        if (u === this._activeUnit && this._phase !== PHASE.ANIM_MOVE && this._phase !== PHASE.ANIM_ATTACK) {
          const t = Date.now() / 200;
          const bob = Math.abs(Math.sin(t)) * 4;
          ctx.fillStyle = u.team === 'player' ? '#88ddff' : '#ff8888';
          ctx.beginPath();
          ctx.moveTo(sp.x - 6, sp.y - 12 - bob);
          ctx.lineTo(sp.x + 6, sp.y - 12 - bob);
          ctx.lineTo(sp.x,     sp.y - 4 - bob);
          ctx.closePath(); ctx.fill();
        }
      }

      // Floating texts (anchored to target unit)
      for (const ft of this._floatingTexts) {
        if (!ft.target) continue;
        const v = new THREE.Vector3();
        ft.target.mesh.getWorldPosition(v); v.y += 1.6;
        const sp = this._three.worldToScreen(v);
        const a = 1 - ft.t;
        ctx.globalAlpha = Math.max(0, a);
        ui.drawText(ctx, ft.text, sp.x, sp.y - 30 - ft.t * 26, {
          font: 'bold 14px monospace', color: ft.color,
          align: 'center', baseline: 'middle',
          stroke: '#000000', strokeWidth: 3,
        });
        ctx.globalAlpha = 1;
      }

      // Action menu (place near active unit screen position)
      if (this._phase === PHASE.UNIT_TURN && this._menu && this._activeUnit) {
        const v = new THREE.Vector3();
        this._activeUnit.mesh.getWorldPosition(v); v.y += 1.0;
        const sp = this._three.worldToScreen(v);
        const m = this._menu.measure();
        let mx = sp.x + 32, my = sp.y - m.height / 2;
        if (mx + m.width > W - 8) mx = W - 8 - m.width;
        if (my < 8) my = 8;
        if (my + m.height > H - 88) my = H - 88 - m.height;
        this._menu.draw(ctx, mx, my);
      }

      // HUD
      this._renderHUD(ctx, engine);

      // Cursor terrain info (when picking)
      if (this._phase === PHASE.PICK_MOVE || this._phase === PHASE.PICK_ATTACK || this._phase === PHASE.PICK_SPELL) {
        const t = this._chapter.terrain[this._cursor.row][this._cursor.col];
        const pal = TERRAIN_3D[t];
        const occ = this._grid.occupantAt(this._cursor.col, this._cursor.row);
        let line = `Terrain: ${pal.name}`;
        if (occ) line += `   |   ${occ.name}  HP ${occ.hp}/${occ.maxHp}  ATK ${occ.atk}  DEF ${occ.def}`;
        ui.drawText(ctx, line, 16, 12, {
          font: cfg.ui.hudFont, color: '#ffffff', shadow: true,
        });
      }
    }

    _renderHUD(ctx, engine) {
      const W = engine.canvas.width, H = engine.canvas.height;
      const ui = GF.UISystem;
      const cfg = CFG();

      ui.drawPanel(ctx, 8, H - 80, W - 16, 72, {
        bgColor: cfg.ui.panelBg, borderColor: cfg.ui.panelBorder, radius: 4, borderWidth: 2,
      });

      const u = this._activeUnit;
      ui.drawText(ctx, this._chapter.title, 16, H - 68, {
        font: 'bold 13px monospace', color: cfg.ui.titleColor,
      });
      if (u) {
        ui.drawText(ctx, `${u.team === 'player' ? '★' : '✖'}  ${u.name}  (${u.clazz || 'Foe'})`,
          16, H - 48, { font: 'bold 14px monospace',
            color: u.team === 'player' ? cfg.ui.playerTeamColor : cfg.ui.enemyTeamColor });
        ui.drawText(ctx, `HP ${u.hp}/${u.maxHp}   ATK ${u.atk}   DEF ${u.def}   AGI ${u.agility}   MOV ${u.move}`,
          16, H - 28, { font: cfg.ui.hudFont, color: '#dddddd' });
      }

      const partyAlive = this._units.filter(p => p.team === 'player' && !p.dead);
      const enemyAlive = this._units.filter(p => p.team === 'enemy'  && !p.dead);
      ui.drawText(ctx, `Allies ${partyAlive.length}/${this._units.filter(p=>p.team==='player').length}`,
        W - 200, H - 48, { font: cfg.ui.hudFont, color: cfg.ui.playerTeamColor });
      ui.drawText(ctx, `Foes   ${enemyAlive.length}/${this._units.filter(p=>p.team==='enemy').length}`,
        W - 200, H - 28, { font: cfg.ui.hudFont, color: cfg.ui.enemyTeamColor });

      let hint = '';
      if (this._phase === PHASE.UNIT_TURN)   hint = '↑↓: choose   SPACE: confirm';
      if (this._phase === PHASE.PICK_MOVE)   hint = 'Move where?   SPACE: go   X: cancel';
      if (this._phase === PHASE.PICK_ATTACK) hint = 'Attack target?   SPACE: hit   X: cancel';
      if (this._phase === PHASE.PICK_SPELL)  hint = 'Cast where?   SPACE: cast   X: cancel';
      if (this._phase === PHASE.ENEMY_THINK) hint = 'Enemy thinking…';
      ui.drawText(ctx, hint, W - 16, H - 68, {
        font: cfg.ui.hudFont, color: '#aaccee', align: 'right',
      });
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── GameOverScene3D / VictoryScene3D ───────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  class GameOverScene3D extends GF.Scene {
    init(engine) {
      this._t = 0;
      this._three = engine.getSystem('three3d');
      engine.input.bind('confirm', ...CFG().controls.confirm);
      const THREE = window.THREE;
      this._three.setBackground(0x180408);
      const cam = new THREE.PerspectiveCamera(50, engine.canvas.width / engine.canvas.height, 0.1, 100);
      cam.position.set(0, 3, 6); cam.lookAt(0, 0.5, 0);
      this._three.setCamera(cam);
      const amb = new THREE.AmbientLight(0x442233, 0.8); this._three.add(amb);
      const spot = new THREE.SpotLight(0xff3344, 2.0); spot.position.set(0, 8, 0);
      this._three.add(spot);
      // Ground
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40),
        new THREE.MeshStandardMaterial({ color: 0x10050a, roughness: 1.0 }));
      ground.rotation.x = -Math.PI / 2; this._three.add(ground);
      // Fallen unit silhouettes
      for (const p of State.party) {
        const u = buildUnitMesh(THREE, p);
        u.position.set((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 2);
        u.rotation.z = -Math.PI / 2;
        u.position.y = 0.1;
        this._three.add(u);
      }
    }
    update(dt, engine) {
      this._t += dt;
      if (this._t > 1.0 && engine.input.wasPressed('confirm')) {
        engine.getSystem('SceneManager').replaceWithTransition(new TitleScene3D(),
          { type: 'fade', duration: 0.6, color: '#000000' });
      }
    }
    render(ctx, engine) {
      const W = engine.canvas.width, H = engine.canvas.height;
      const ui = GF.UISystem;
      ui.drawText(ctx, 'YOUR FORCE HAS FALLEN', W / 2, H / 2 - 40, {
        font: 'bold 36px monospace', color: '#ff4455',
        align: 'center', baseline: 'middle',
        glow: '#ff0022', glowBlur: 24, stroke: '#220000', strokeWidth: 4,
      });
      ui.drawText(ctx, `Chapter ${State.chapterIdx + 1} ended in defeat.`, W/2, H/2, {
        font: '16px monospace', color: '#dd9999', align: 'center', baseline: 'middle',
      });
      if (this._t > 1.0 && Math.floor(this._t * 2) % 2 === 0) {
        ui.drawText(ctx, '— Press SPACE to return to the title —', W/2, H - 60, {
          font: '14px monospace', color: '#ffffff', align: 'center', baseline: 'middle',
        });
      }
    }
    destroy(engine) { this._three.clearScene(); }
  }

  class VictoryScene3D extends GF.Scene {
    init(engine) {
      this._t = 0;
      this._three = engine.getSystem('three3d');
      engine.input.bind('confirm', ...CFG().controls.confirm);
      try { engine.getSystem('AudioSystem').play('victory'); } catch(e) {}
      const THREE = window.THREE;
      this._three.setBackground(0x33220a);
      const cam = new THREE.PerspectiveCamera(50, engine.canvas.width / engine.canvas.height, 0.1, 100);
      cam.position.set(0, 3, 6); cam.lookAt(0, 0.8, 0);
      this._three.setCamera(cam);
      this._cam = cam;
      const amb = new THREE.AmbientLight(0xffeeaa, 0.7); this._three.add(amb);
      const spot = new THREE.PointLight(0xffcc66, 2.0, 25); spot.position.set(0, 6, 4);
      this._three.add(spot);
      // Ground
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40),
        new THREE.MeshStandardMaterial({ color: 0x4a2a10, roughness: 1.0 }));
      ground.rotation.x = -Math.PI / 2; this._three.add(ground);
      // Triumphant party
      State.party.forEach((p, i) => {
        if (p.dead) return;
        const u = buildUnitMesh(THREE, p);
        u.position.set((i - 1) * 1.4, 0, 0);
        u.rotation.y = Math.PI;
        this._three.add(u);
      });
      // Sparkles
      const N = 200;
      const positions = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        positions[i*3]   = (Math.random() - 0.5) * 12;
        positions[i*3+1] = Math.random() * 6;
        positions[i*3+2] = (Math.random() - 0.5) * 12;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      this._sparkles = new THREE.Points(geo,
        new THREE.PointsMaterial({ color: 0xffd680, size: 0.10, transparent: true, opacity: 0.9 }));
      this._three.add(this._sparkles);
    }
    update(dt, engine) {
      this._t += dt;
      // Sparkles drift up
      if (this._sparkles) {
        const arr = this._sparkles.geometry.attributes.position.array;
        for (let i = 0; i < arr.length; i += 3) {
          arr[i+1] += dt * 0.5;
          if (arr[i+1] > 6) arr[i+1] = 0;
        }
        this._sparkles.geometry.attributes.position.needsUpdate = true;
      }
      // Slow camera arc
      this._cam.position.set(Math.sin(this._t * 0.3) * 6, 3, Math.cos(this._t * 0.3) * 6);
      this._cam.lookAt(0, 0.8, 0);

      if (this._t > 1.5 && engine.input.wasPressed('confirm')) {
        engine.getSystem('SceneManager').replaceWithTransition(new TitleScene3D(),
          { type: 'iris', duration: 0.8, color: '#000000' });
      }
    }
    render(ctx, engine) {
      const W = engine.canvas.width, H = engine.canvas.height;
      const ui = GF.UISystem;
      ui.drawText(ctx, 'THE REALM IS SAVED', W/2, H/2 - 40, {
        font: 'bold 38px monospace', color: '#ffdd66',
        align: 'center', baseline: 'middle',
        glow: '#ff9911', glowBlur: 28, stroke: '#332200', strokeWidth: 4,
      });
      ui.drawText(ctx, 'Your Force returns home in glory.', W/2, H/2, {
        font: '16px monospace', color: '#ffe6aa', align: 'center', baseline: 'middle',
      });
      if (this._t > 1.5 && Math.floor(this._t * 2) % 2 === 0) {
        ui.drawText(ctx, '— Press SPACE to return to the title —', W/2, H - 60, {
          font: '14px monospace', color: '#ffffff', align: 'center', baseline: 'middle',
        });
      }
    }
    destroy(engine) { this._three.clearScene(); }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ── Bootstrap ──────────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  window.addEventListener('GF:ready', async function () {
    if (!window.THREE) {
      console.error('Shining Quest 3D requires Three.js. Make sure the CDN script tag is present in index.html.');
      return;
    }
    const cfg = CFG();
    const game = await GF.createGameAsync(cfg.engine, cfg.physics, {
      gameName: 'ShiningQuest3D',
      grids   : true,
      battle  : true,
      dialogue: true,
      tilemap : false,
      models  : false,
    });

    const { engine, scenes } = game;

    // Register the Three.js host system. The framework provides Three3DScene
    // but the game decides when to install it (so games that don't need 3D
    // don't pay the cost).
    const three3d = new GF.Three3DScene({ bgColor: 0x0a0a14 });
    engine.addSystem(three3d);

    scenes.push(new TitleScene3D(), engine);
    engine.start();
  });

})(window.GF = window.GF || {});
