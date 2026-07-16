// GameFramework/games/SwarmHome/core/ApartmentBuilder.js
// Parses the ASCII floor plan from config into:
//   • the 3D apartment (floor, dollhouse walls, furniture, lighting)
//   • a GF.Grid for robot pathfinding (grid x→world X, grid y→world Z)
//   • a `places` directory of named cells used by routines.
//
// Walls are inward-facing planes: invisible from outside (backface culled)
// so the orbit camera always sees in, but solid from robot-POV inside.

(function (GF) {
  'use strict';

  const SH = GF.SwarmHome = GF.SwarmHome || {};

  class ApartmentBuilder {
    constructor(scene, cfg) {
      this.scene = scene;
      this.cfg = cfg;
      this.apt = cfg.apartment;
    }

    build() {
      const map = this.apt.map;
      const rows = map.length;
      const cols = map[0].length;
      const cs = this.apt.cellSize;
      const W = cols * cs, D = rows * cs;

      const grid = new GF.Grid({
        cols, rows, cellSize: cs,
        x: -W / 2, y: -D / 2,
      });
      this.grid = grid;

      const places = {
        docks: [], patrol: [],
        counterCells: [], shelfCells: [],
      };

      const BLOCKING = '#KCSTBDFL';   // cells robots must path around

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ch = map[r][c];
          if (BLOCKING.includes(ch)) grid.setBlocked(c, r, true);
          const cell = { col: c, row: r };
          switch (ch) {
            case 'F': places.kitchenLiftCell = cell; break;
            case 'L': places.bedLiftCell = cell; break;
            case 'C': places.machineCell = cell; places.counterCells.push(cell); break;
            case 'K': places.counterCells.push(cell); break;
            case 'T': places.tableCell = cell; break;
            case 'S': places.shelfCells.push(cell); break;
            case '1': case '2': case '3': case '4':
              places.docks[parseInt(ch, 10) - 1] = cell; break;
          }
        }
      }

      // Staging cells: open-floor neighbour below each lift
      places.kitchenStage = { col: places.kitchenLiftCell.col, row: places.kitchenLiftCell.row + 1 };
      places.bedStage = { col: places.bedLiftCell.col, row: places.bedLiftCell.row + 1 };

      // Crate route: straight corridor (verified open in the default map)
      places.crateStart = { col: 7, row: 3 };
      places.crateEnd = { col: 7, row: 6 };

      // Patrol waypoints — pick open corners + centre
      [[1, 6], [12, 6], [6, 1], [12, 2], [6, 5]].forEach(([c, r]) => {
        if (grid.inBounds(c, r) && !grid.isBlocked(c, r)) places.patrol.push({ col: c, row: r });
      });

      this._buildShell(W, D);
      this._buildFurniture(places, cs);
      this._buildLighting(W, D);

      return {
        grid, places,
        bounds: { w: W, d: D },
        counterH: this.apt.counterHeight,
        tableH: this.apt.tableHeight,
        cellWorld: (col, row) => {
          const p = grid.toWorldCenter(col, row);
          return { x: p.x, z: p.y };
        },
      };
    }

    // ── Shell: floor, walls, rug, cell grid lines ──────────────────────────
    _buildShell(W, D) {
      const { mkMat } = SH.parts;
      const scene = this.scene;
      const wallH = this.apt.wallHeight;

      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(W, D),
        mkMat(0x8a6a4a, { r: 0.9 })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);

      // Plank seams
      const lineMat = new THREE.LineBasicMaterial({ color: 0x6a4f36, transparent: true, opacity: 0.5 });
      for (let x = -W / 2 + 0.5; x < W / 2; x += 0.5) {
        scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, 0.002, -D / 2), new THREE.Vector3(x, 0.002, D / 2),
        ]), lineMat));
      }

      // Design-tool cell grid (subtle)
      const gridMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07 });
      for (let z = -D / 2; z <= D / 2; z += 0.5) {
        scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-W / 2, 0.004, z), new THREE.Vector3(W / 2, 0.004, z),
        ]), gridMat));
      }

      // Rug
      const rug = new THREE.Mesh(new THREE.CircleGeometry(0.9, 28), mkMat(0x4a5a8a, { r: 0.95 }));
      rug.rotation.x = -Math.PI / 2;
      rug.position.set(0, 0.006, 0.4);
      rug.receiveShadow = true;
      scene.add(rug);

      // Inward-facing walls (dollhouse trick: FrontSide planes pointing in)
      const wallMat = mkMat(0xd8d2c4, { r: 0.95 });
      const baseMat = mkMat(0x5a4a3a, { r: 0.9 });
      const mkWall = (w, x, z, rotY) => {
        const wall = new THREE.Mesh(new THREE.PlaneGeometry(w, wallH), wallMat);
        wall.position.set(x, wallH / 2, z);
        wall.rotation.y = rotY;
        wall.receiveShadow = true;
        this.scene.add(wall);
        const base = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.1), baseMat);
        base.position.set(x, 0.05, z);
        base.rotation.y = rotY;
        base.position.add(new THREE.Vector3(Math.sin(rotY), 0, Math.cos(rotY)).multiplyScalar(0.002));
        this.scene.add(base);
      };
      mkWall(W, 0, -D / 2, 0);            // north wall faces +Z (inward)
      mkWall(W, 0, D / 2, Math.PI);       // south
      mkWall(D, -W / 2, 0, Math.PI / 2);  // west
      mkWall(D, W / 2, 0, -Math.PI / 2);  // east

      // Window glow on the north wall (purely decorative light source look)
      const win = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 1.0),
        new THREE.MeshBasicMaterial({ color: 0xbfdcff })
      );
      win.position.set(W * 0.18, 1.45, -D / 2 + 0.01);
      scene.add(win);
      const winFrame = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.1), mkMat(0xffffff, { r: 0.8 }));
      winFrame.position.set(W * 0.18, 1.45, -D / 2 + 0.005);
      scene.add(winFrame);
    }

    // ── Furniture from map symbols ─────────────────────────────────────────
    _buildFurniture(places, cs) {
      const { mkBox, mkCyl, add, mkMat } = SH.parts;
      const scene = this.scene;
      const cw = (cell) => {
        const p = this.grid.toWorldCenter(cell.col, cell.row);
        return { x: p.x, z: p.y };
      };
      const counterH = this.apt.counterHeight;
      const tableH = this.apt.tableHeight;
      const deskH = this.apt.deskHeight;

      // Kitchen counter (one box per K/C cell, shared look)
      places.counterCells.forEach(cell => {
        const { x, z } = cw(cell);
        add(scene, mkBox(cs, counterH - 0.04, cs, 0xe8e4dc, { r: 0.85 }), x, (counterH - 0.04) / 2, z);
        add(scene, mkBox(cs + 0.04, 0.04, cs + 0.04, 0x44484f, { r: 0.45, m: 0.2 }), x, counterH - 0.02, z);
      });

      // Shelf unit (on S cells)
      places.shelfCells.forEach(cell => {
        const { x, z } = cw(cell);
        const g = new THREE.Group();
        const sw = cs * 0.95, sd = cs * 0.8, shH = 1.7;
        add(g, mkBox(0.03, shH, sd, 0x6a5238, { r: 0.9 }), -sw / 2, shH / 2, 0);
        add(g, mkBox(0.03, shH, sd, 0x6a5238, { r: 0.9 }), sw / 2, shH / 2, 0);
        [0.35, 0.8, 1.25, 1.65].forEach(h => add(g, mkBox(sw, 0.03, sd, 0x7a6044, { r: 0.9 }), 0, h, 0));
        // A few "stored items"
        [[0xc04444, -0.1, 0.45, 0.12], [0x4488cc, 0.12, 0.45, 0.16], [0x44aa66, 0, 0.9, 0.1],
         [0xddaa33, -0.12, 0.9, 0.14], [0x9966cc, 0.1, 1.35, 0.12]].forEach(([c, ox, h, s]) => {
          add(g, mkBox(s, s, s, c, { r: 0.8 }), ox, h + s / 2 + 0.015, 0);
        });
        g.position.set(x, 0, z);
        scene.add(g);
      });

      // Bed (covers all B cells — find extent)
      const bedCells = [];
      this.apt.map.forEach((rowStr, r) => {
        [...rowStr].forEach((ch, c) => { if (ch === 'B') bedCells.push({ col: c, row: r }); });
      });
      if (bedCells.length) {
        const minC = Math.min(...bedCells.map(c => c.col)), maxC = Math.max(...bedCells.map(c => c.col));
        const minR = Math.min(...bedCells.map(c => c.row)), maxR = Math.max(...bedCells.map(c => c.row));
        const a = cw({ col: minC, row: minR }), b = cw({ col: maxC, row: maxR });
        const bx = (a.x + b.x) / 2, bz = (a.z + b.z) / 2;
        const bw = (maxC - minC + 1) * cs, bd = (maxR - minR + 1) * cs;
        add(scene, mkBox(bw, 0.18, bd, 0x6a5238, { r: 0.9 }), bx, 0.09, bz);                    // frame
        add(scene, mkBox(bw - 0.06, 0.14, bd - 0.06, 0xf0ead8, { r: 0.95 }), bx, 0.25, bz);     // mattress
        add(scene, mkBox(bw - 0.1, 0.1, bd * 0.55, 0x7a96c8, { r: 0.95 }), bx, 0.34, bz + bd * 0.18); // blanket
        add(scene, mkBox(bw * 0.5, 0.08, 0.22, 0xffffff, { r: 0.95 }), bx, 0.36, bz - bd / 2 + 0.18); // pillow
      }

      // Bedside table (T cell) — coffee destination
      if (places.tableCell) {
        const { x, z } = cw(places.tableCell);
        const g = new THREE.Group();
        const tw = cs * 0.92;
        add(g, mkBox(tw, 0.04, tw, 0x8a6844, { r: 0.85 }), 0, tableH - 0.02, 0);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) =>
          add(g, mkCyl(0.018, tableH - 0.04, 8, 0x5a4430, { r: 0.9 }),
            sx * (tw / 2 - 0.04), (tableH - 0.04) / 2, sz * (tw / 2 - 0.04)));
        g.position.set(x, 0, z);
        scene.add(g);
        places.tableTopY = tableH;
        places.tableWorld = { x, z };
      }

      // Desk (D cells)
      const deskCells = [];
      this.apt.map.forEach((rowStr, r) => {
        [...rowStr].forEach((ch, c) => { if (ch === 'D') deskCells.push({ col: c, row: r }); });
      });
      if (deskCells.length) {
        const minC = Math.min(...deskCells.map(c => c.col)), maxC = Math.max(...deskCells.map(c => c.col));
        const a = cw({ col: minC, row: deskCells[0].row }), b = cw({ col: maxC, row: deskCells[0].row });
        const dx = (a.x + b.x) / 2, dz = a.z;
        const dw = (maxC - minC + 1) * cs;
        add(scene, mkBox(dw, 0.035, cs * 0.9, 0x8a6844, { r: 0.85 }), dx, deskH, dz);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) =>
          add(scene, mkBox(0.04, deskH, 0.04, 0x5a4430, { r: 0.9 }),
            dx + sx * (dw / 2 - 0.05), deskH / 2, dz + sz * (cs * 0.4 - 0.03)));
        // Monitor
        add(scene, mkBox(0.34, 0.22, 0.02, 0x16181e, { r: 0.4, e: 0x2a3a55, ei: 0.35 }), dx, deskH + 0.16, dz - 0.08);
        add(scene, mkBox(0.05, 0.1, 0.05, 0x333740, { r: 0.6 }), dx, deskH + 0.05, dz - 0.08);
        places.deskWorld = { x: dx, z: dz };
      }
    }

    // ── Lighting ───────────────────────────────────────────────────────────
    _buildLighting(W, D) {
      const scene = this.scene;
      scene.add(new THREE.AmbientLight(0xfff2e0, 0.55));

      const sun = new THREE.DirectionalLight(0xfff4d8, 0.9);
      sun.position.set(W * 0.18, 5.5, -D * 0.9);   // in through the window
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.left = -W; sun.shadow.camera.right = W;
      sun.shadow.camera.top = D; sun.shadow.camera.bottom = -D;
      scene.add(sun);

      const kitchen = new THREE.PointLight(0xffe8c8, 0.5, 5);
      kitchen.position.set(-W / 2 + 1.2, 2.0, -D / 2 + 1.0);
      scene.add(kitchen);

      const bedside = new THREE.PointLight(0xffd8a8, 0.4, 4);
      bedside.position.set(W / 2 - 1.2, 1.8, 0);
      scene.add(bedside);
    }
  }

  SH.ApartmentBuilder = ApartmentBuilder;

})(window.GF = window.GF || {});
