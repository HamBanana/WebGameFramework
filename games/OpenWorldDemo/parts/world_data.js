// parts/world_data.js — builds G.state.world (two areas) programmatically.
//  • town     : top-down streets (racing-pack tiles/cars), buildings, props, NPCs.
//  • showroom : enclosed lot showcasing the isometric_vehicles (8-direction drive).
// Tile ids index sprites/world_tiles.png (cols=8):
//   0 grass · 1 asphalt · 2 asphalt v-dash · 3 asphalt h-dash · 4 asphalt ·
//   5 sand · 6 dirt · 7 parking · 8 crosswalk · 9 concrete
(function (G) {
  'use strict';
  G.state = G.state || {};

  const TILE = 64;
  const grid = (rows, cols, v) =>
    Array.from({ length: rows }, () => Array.from({ length: cols }, () => v));

  // ---- TOWN -----------------------------------------------------------------
  const TC = 48, TR = 36;                 // cols, rows  (3072 x 2304 px)
  const ground = grid(TR, TC, 0);         // grass
  const collision = grid(TR, TC, -1);     // walkable

  // stamp a 3-wide horizontal avenue centred on row `r` (dashed centre line)
  function hRoad(r) {
    for (let c = 0; c < TC; c++) {
      if (ground[r - 1]) ground[r - 1][c] = 1;
      ground[r][c] = 3;
      if (ground[r + 1]) ground[r + 1][c] = 1;
    }
  }
  // stamp a 3-wide vertical avenue centred on col `c`
  function vRoad(c) {
    for (let r = 0; r < TR; r++) {
      if (ground[r][c - 1] !== undefined) ground[r][c - 1] = 1;
      ground[r][c] = 2;
      if (ground[r][c + 1] !== undefined) ground[r][c + 1] = 1;
    }
  }
  const HROWS = [8, 20, 30], VCOLS = [8, 24, 40];
  HROWS.forEach(hRoad);
  VCOLS.forEach(vRoad);
  // crosswalks framing each intersection
  HROWS.forEach((r) => VCOLS.forEach((c) => {
    ground[r - 1][c] = 8; ground[r + 1][c] = 8;
    ground[r][c - 1] = 8; ground[r][c + 1] = 8;
  }));
  // solid border ring
  for (let c = 0; c < TC; c++) { collision[0][c] = 1; collision[TR - 1][c] = 1; }
  for (let r = 0; r < TR; r++) { collision[r][0] = 1; collision[r][TC - 1] = 1; }

  const px = (col) => col * TILE + TILE / 2;   // tile centre -> px
  const E = 0, W = Math.PI, N = -Math.PI / 2, S = Math.PI / 2; // headings

  const town = {
    cols: TC, rows: TR, background: '#3a7d3a',
    layers: { ground, collision },
    spawns: {
      default:      { x: px(24), y: px(22) },
      fromShowroom: { x: px(40), y: px(4) + 40 },
    },
    portals: [
      // gate to the showroom (top of the map, by the arch)
      { x: px(40) - 48, y: px(2) - 20, w: 96, h: 70, toArea: 'showroom', toSpawn: 'entry' },
    ],
    entities: [
      // --- drivable cars, aligned to the streets (heading set for looks) ---
      { type: 'car', drivable: true, sprite: 'car_red',    x: px(12), y: px(8),  heading: E },
      { type: 'car', drivable: true, sprite: 'car_blue',   x: px(20), y: px(9),  heading: W },
      { type: 'car', drivable: true, sprite: 'car_yellow', x: px(24), y: px(15), heading: S },
      { type: 'car', drivable: true, sprite: 'car_green',  x: px(8),  y: px(24), heading: S },
      { type: 'car', drivable: true, sprite: 'car_red2',   x: px(32), y: px(20), heading: E },
      { type: 'car', drivable: true, sprite: 'pcar_purple',x: px(40), y: px(26), heading: N },
      { type: 'car', drivable: true, sprite: 'car_black',  x: px(36), y: px(30), heading: W },
      { type: 'car', drivable: true, sprite: 'moto_red',   x: px(16), y: px(30), heading: E },
      // --- buildings (billboards, y-sorted) ---
      { type: 'bld', sprite: 'bld_church',    x: px(15), y: px(5),  scale: 0.9,  w: 260, h: 170 },
      { type: 'bld', sprite: 'bld_cathedral', x: px(30), y: px(6),  scale: 0.9,  w: 320, h: 220 },
      { type: 'bld', sprite: 'bld_house',     x: px(5),  y: px(15), scale: 1.4,  w: 200, h: 200 },
      { type: 'bld', sprite: 'bld_house',     x: px(45), y: px(15), scale: 1.4,  w: 200, h: 200 },
      { type: 'bld', sprite: 'bld_gate',      x: px(40), y: px(3),  scale: 0.55, w: 240, h: 220 },
      // --- trees & props ---
      { type: 'prop', sprite: 'tree_large', x: px(4),  y: px(4),  scale: 0.7 },
      { type: 'prop', sprite: 'tree_large', x: px(44), y: px(5),  scale: 0.7 },
      { type: 'prop', sprite: 'tree_small', x: px(13), y: px(13), scale: 0.6 },
      { type: 'prop', sprite: 'tree_small', x: px(28), y: px(14), scale: 0.6 },
      { type: 'prop', sprite: 'tree_small', x: px(35), y: px(25), scale: 0.6 },
      { type: 'prop', sprite: 'tree_small', x: px(18), y: px(26), scale: 0.6 },
      { type: 'prop', sprite: 'tree_large', x: px(44), y: px(32), scale: 0.7 },
      { type: 'prop', sprite: 'rock',   x: px(6),  y: px(28), scale: 0.5 },
      { type: 'prop', sprite: 'barrel', x: px(22), y: px(11), scale: 0.45 },
      { type: 'prop', sprite: 'cone',   x: px(23), y: px(20), scale: 0.4 },
      { type: 'prop', sprite: 'cone',   x: px(25), y: px(20), scale: 0.4 },
      { type: 'prop', sprite: 'tires',  x: px(33), y: px(8),  scale: 0.5 },
      { type: 'prop', sprite: 'tent',   x: px(10), y: px(19), scale: 0.6 },
      // --- NPCs (wander) ---
      { type: 'npc', sprite: 'char_npc1', x: px(22), y: px(23), heading: E, spd: 26, t: 0 },
      { type: 'npc', sprite: 'char_npc2', x: px(26), y: px(28), heading: W, spd: 22, t: 1.3 },
      { type: 'npc', sprite: 'char_npc3', x: px(14), y: px(9),  heading: S, spd: 30, t: 0.6 },
      // --- birds (drift) ---
      { type: 'bird', sprite: 'bird', x: px(20), y: px(4), heading: E, spd: 60 },
      { type: 'bird', sprite: 'crow', x: px(34), y: px(18), heading: W, spd: 50 },
      // --- signpost ---
      { type: 'sign', x: px(39), y: px(5), text: 'SHOWROOM ^' },
    ],
  };

  // bake static collision footprints for scenery so walking/driving is blocked
  (function stampTownCollision() {
    const foot = (e) => {
      if (e.type === 'bld') {
        if (e.sprite === 'bld_gate') return null;        // archway: walk through to portal
        return { w: 1, h: 1 };                            // church / cathedral / house
      }
      if (e.type === 'prop') {
        if (e.sprite === 'cone') return null;             // drive over cones
        if (e.sprite === 'tree_large' || e.sprite === 'tent') return { w: 1, h: 0 };
        return { w: 0, h: 0 };                            // tree_small, rock, barrel, tires
      }
      return null;
    };
    for (const e of town.entities) {
      const f = foot(e); if (!f) continue;
      const tx = Math.floor(e.x / TILE), ty = Math.floor(e.y / TILE);
      for (let r = ty - f.h; r <= ty; r++)
        for (let c = tx - f.w; c <= tx + f.w; c++)
          if (collision[r] && collision[r][c] !== undefined) collision[r][c] = 1;
    }
  })();

  // ---- SHOWROOM (isometric vehicles) ---------------------------------------
  const SC = 24, SR = 16;                 // 1536 x 1024 px
  const sground = grid(SR, SC, 9);        // concrete floor
  const scoll = grid(SR, SC, -1);
  for (let c = 0; c < SC; c++) { sground[0][c] = 6; sground[SR - 1][c] = 6; scoll[0][c] = 1; scoll[SR - 1][c] = 1; }
  for (let r = 0; r < SR; r++) { sground[r][0] = 6; sground[r][SC - 1] = 6; scoll[r][0] = 1; scoll[r][SC - 1] = 1; }
  // decorative parking stripes down the middle
  for (let c = 3; c < SC - 3; c++) sground[8][c] = 7;

  // isometric sheet: 8 rows (vehicle types), 8 cols (headings). row = type.
  const isoCar = (sheet, row, col, x, y) =>
    ({ type: 'isocar', drivable: true, sheet, row, col, x, y, heading: Math.PI / 2 });

  const showroom = {
    cols: SC, rows: SR, background: '#1c2230',
    layers: { ground: sground, collision: scoll },
    spawns: {
      entry: { x: px(12), y: px(13) },
    },
    portals: [
      { x: px(12) - 48, y: px(14) + 8, w: 96, h: 60, toArea: 'town', toSpawn: 'fromShowroom' },
    ],
    entities: [
      isoCar('iso_red',    0, 0, px(4),  px(5)),   // sedan
      isoCar('iso_blue',   1, 2, px(8),  px(5)),   // coupe
      isoCar('iso_green',  2, 4, px(12), px(5)),   // hot hatch
      isoCar('iso_yellow', 3, 6, px(16), px(5)),   // small delivery
      isoCar('iso_orange', 5, 1, px(6),  px(11)),  // minibus
      isoCar('iso_black',  6, 3, px(10), px(11)),  // delivery van
      isoCar('iso_white',  7, 5, px(14), px(11)),  // pickup
      isoCar('iso_grey',   4, 7, px(18), px(11)),  // station wagon
      { type: 'sign', x: px(12), y: px(2), text: 'ISO SHOWROOM — E to drive' },
      { type: 'sign', x: px(12), y: px(15) + 20, text: 'v exit to town v' },
    ],
  };

  G.state.world = {
    tileWidth: TILE, tileHeight: TILE,
    tileset: { image: 'sprites/world_tiles.png', cols: 8 },
    startArea: 'town', startSpawn: 'default',
    areas: { town, showroom },
  };
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} });
