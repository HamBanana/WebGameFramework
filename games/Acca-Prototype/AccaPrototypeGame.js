// games/Acca-Prototype/AccaPrototypeGame.js
// Acca Prototype — web port of the Unity "Acca" board game.
//
// Rules (from the Unity project's Plans/):
//  - Turn: collect income -> roll dice (1-6) -> random-walk that many steps -> land.
//  - Land:
//      * unowned tile outside any area  -> build a City Hall (free); it founds a new
//        Area, you own the tile and become that area's Mayor.
//      * unowned tile inside an area    -> buy it for its land value.
//      * land on a City Hall            -> expand that area: pick one frontier tile
//        (adjacent to the area, not in any area); it is added and you own it.
//      * any tile without a property    -> build a property (resource cost; if the
//        land belongs to someone else you also pay its rent to the land owner).
//  - Income at the start of your turn:
//      * Production: each land tile you own yields richness x 2 of each of its
//        resources per turn, limited by its reserve (-1 = unlimited).
//      * Rent: every property on the board pays its rent each turn to the Mayor
//        of its area (or to its owner if the area has no mayor).
//  - Win: first player whose cash reaches the win target. If the turn cap is
//    hit, the richest player wins.
(function (GF) {
  'use strict';

  // ── Static game data ─────────────────────────────────────────────────────

  const RES = [
    { key: 'wood',        icon: '🌲', color: '#a3704a', name: 'Wood' },
    { key: 'steel',       icon: '🔩', color: '#9aa4ad', name: 'Steel' },
    { key: 'water',       icon: '💧', color: '#4db8ff', name: 'Water' },
    { key: 'electricity', icon: '⚡', color: '#ffd94d', name: 'Electricity' },
    { key: 'oil',         icon: '🛢', color: '#b8a06a', name: 'Oil' },
  ];
  const RES_BY_KEY = {};
  RES.forEach(r => { RES_BY_KEY[r.key] = r; });

  const PROPERTIES = [
    { id: 'house',   name: 'House',   icon: '🏠', rent: 50,  cost: { wood: 4, steel: 2 },
      desc: 'Cheap home, modest rent.' },
    { id: 'farm',    name: 'Farm',    icon: '🌾', rent: 75,  cost: { wood: 2, water: 4 },
      desc: 'Irrigated fields, steady rent.' },
    { id: 'factory', name: 'Factory', icon: '🏭', rent: 150, cost: { steel: 6, electricity: 3, oil: 2 },
      desc: 'Heavy industry, big rent.' },
  ];

  // 7x7 city grid. Each tile: [ landValue, { resKey: [richness 0-5, reserve (-1 = unlimited)] } ]
  // North row: power district (electricity).  South rows: harbor (unlimited water).
  // West column: forest (wood).  East column: refinery (oil).  NE: steelworks.
  // Center: downtown — high value, no production.
  const BOARD_DATA = [
    // z = 0
    [
      [150, { electricity: [2, 40], wood: [1, 30] }],
      [150, { electricity: [3, 50] }],
      [175, { electricity: [4, 60], steel: [1, 20] }],
      [200, { electricity: [5, 80] }],
      [175, { steel: [3, 50], electricity: [2, 30] }],
      [150, { steel: [4, 60] }],
      [150, { oil: [2, 30], steel: [2, 40] }],
    ],
    // z = 1
    [
      [175, { wood: [3, 50] }],
      [175, { wood: [4, 60] }],
      [200, { wood: [2, 40], electricity: [1, 20] }],
      [225, { electricity: [3, 50] }],
      [200, { steel: [2, 40] }],
      [175, { steel: [3, 50], oil: [1, 20] }],
      [175, { oil: [3, 50] }],
    ],
    // z = 2
    [
      [200, { wood: [5, 80] }],
      [200, { wood: [3, 60] }],
      [225, { wood: [2, 40] }],
      [250, {}],
      [225, { steel: [2, 40] }],
      [200, { oil: [2, 40] }],
      [200, { oil: [4, 70] }],
    ],
    // z = 3
    [
      [225, { wood: [4, 70] }],
      [250, { wood: [2, 40] }],
      [300, {}],
      [300, {}],
      [300, { steel: [1, 30] }],
      [250, { oil: [3, 50] }],
      [225, { oil: [5, 90] }],
    ],
    // z = 4
    [
      [200, { wood: [4, 70] }],
      [200, { wood: [3, 60] }],
      [225, {}],
      [250, {}],
      [225, { steel: [2, 40] }],
      [200, { oil: [2, 40] }],
      [200, { oil: [3, 50] }],
    ],
    // z = 5 (harbor — unlimited water)
    [
      [175, { wood: [2, 40], water: [2, 60] }],
      [175, { water: [3, -1] }],
      [200, { water: [4, -1] }],
      [225, { water: [5, -1] }],
      [200, { water: [3, -1] }],
      [175, { water: [2, 40] }],
      [175, { oil: [1, 30], water: [1, 30] }],
    ],
    // z = 6 (waterfront — unlimited water)
    [
      [150, { water: [3, -1] }],
      [150, { water: [4, -1] }],
      [175, { water: [3, -1], wood: [1, 20] }],
      [200, { water: [5, -1] }],
      [175, { water: [3, -1] }],
      [150, { water: [2, 40], oil: [1, 20] }],
      [150, { water: [2, 40], oil: [2, 30] }],
    ],
  ];
  const GRID = 7;

  const CELL = 72;
  const BOARD_X = 40;
  const BOARD_Y = 88;

  const RULES = [
    'TURN',
    '  1. Income: your land produces resources, every property on the',
    '     board pays rent to its area\'s mayor (or its owner).',
    '  2. Roll the dice (SPACE) and wander that many steps.',
    '  3. On the tile you land on you may:',
    '     - Build a City Hall (free) on empty ground outside any',
    '       area — it founds a new area, you own the tile and become',
    '       its mayor.',
    '     - Buy an unowned tile inside an area (costs its value).',
    '     - On a City Hall: expand its area onto one frontier tile',
    '       (you own the new tile).',
    '     - Build a property on a tile without one (resource cost;',
    '       if the land is not yours you pay its rent to the owner).',
    'RESOURCES',
    '  Each tile yields richness x 2 of its resources per turn until',
    '  its reserve runs out. ~ means unlimited (rivers, power grid).',
    'WIN',
    '  First player to reach the win target in cash wins. If the turn',
    '  cap is reached, the richest player wins.',
    'KEYS',
    '  SPACE roll / confirm      E end turn      1-3 build property',
    '  H help                    R restart       ESC cancel',
  ];

  // ── Helpers ──────────────────────────────────────────────────────────────

  function money(n) {
    return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function areaColor(id) {
    const hue = (id * 137.508) % 360;
    return 'hsl(' + hue.toFixed(0) + ', 65%, 45%)';
  }

  function hexA(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  // ── Scene ────────────────────────────────────────────────────────────────

  class AccaScene extends GF.Scene {
    constructor() {
      super();
      this.cfg = GF.GAME_CONFIG || {};
      this.buttons = [];
      this.hoverId = null;
      this.mouse = { x: -1, y: -1 };
      this.newGame();
    }

    // -- setup ---------------------------------------------------------------

    newGame() {
      const n = Math.max(2, Math.min(4, this.cfg.numberOfPlayers | 0 || 2));
      const defs = (this.cfg.players && this.cfg.players.length) ? this.cfg.players : [
        { name: 'Player 1', color: '#ff5252' }, { name: 'Player 2', color: '#4d7cff' },
        { name: 'Player 3', color: '#51d974' }, { name: 'Player 4', color: '#ffd740' },
      ];
      this.players = [];
      for (let i = 0; i < n; i++) {
        const d = defs[i % defs.length];
        const res = {};
        RES.forEach(r => { res[r.key] = 0; });
        this.players.push({
          name: d.name,
          color: d.color,
          money: this.cfg.startingMoney | 0 || 1000,
          resources: res,
          x: 0, z: 0,          // tile coords
          px: 0, py: 0,        // pixel position (animated)
          mayorOf: null,       // area id
        });
      }

      this.tiles = [];
      for (let z = 0; z < GRID; z++) {
        for (let x = 0; x < GRID; x++) {
          const [value, prodRaw] = BOARD_DATA[z][x];
          const prod = {};
          for (const k in prodRaw) prod[k] = { rich: prodRaw[k][0], reserve: prodRaw[k][1] };
          this.tiles.push({
            x, z, value, prod,
            owner: null,      // player index
            area: null,       // area id
            cityHall: false,
            property: null,   // property id
          });
        }
      }

      this.areas = [];        // { id, mayor, tiles: [] }
      this.playerTurns = 0;
      this.cur = 0;
      this.turn = 1;
      this.winTarget = this.cfg.winTarget | 0 || 4000;
      this.turnCap = this.cfg.turnCap | 0; // full rounds; 0 = none
      this.winner = null;
      this.log = [];
      this.toast = null;
      this.phase = 'income';
      this.phaseT = 0;
      this.dice = { value: 1, final: null, t: 0, duration: 0.8 };
      this.path = [];
      this.stepT = 0;
      this.pendingLand = null;
      this.showHelp = false;
      this.areaCounter = 0;

      const p0 = this.players[0];
      p0.px = this.tilePx(p0.x); p0.py = this.tilePy(p0.z);
      this.pushLog('New game — ' + n + ' players, target ' + money(this.winTarget) + '.');
      this.startTurn();
    }

    tileAt(x, z) {
      if (x < 0 || z < 0 || x >= GRID || z >= GRID) return null;
      return this.tiles[z * GRID + x];
    }
    tilePx(x) { return BOARD_X + x * CELL + CELL / 2; }
    tilePy(z) { return BOARD_Y + z * CELL + CELL / 2; }

    neighbors(t) {
      const out = [];
      const n = this.tileAt(t.x, t.z - 1); if (n) out.push(n);
      const s = this.tileAt(t.x, t.z + 1); if (s) out.push(s);
      const w = this.tileAt(t.x - 1, t.z); if (w) out.push(w);
      const e = this.tileAt(t.x + 1, t.z); if (e) out.push(e);
      return out;
    }

    areaById(id) {
      for (const a of this.areas) if (a.id === id) return a;
      return null;
    }

    frontierTiles(tile) {
      // Tiles adjacent to this area that are not in any area.
      const area = this.areaById(tile.area);
      if (!area) return [];
      const out = [];
      for (const t of area.tiles) {
        for (const n of this.neighbors(t)) {
          if (n.area === null && !out.includes(n)) out.push(n);
        }
      }
      return out;
    }

    // -- log / toast -----------------------------------------------------------

    pushLog(msg) {
      this.log.push(msg);
      if (this.log.length > 60) this.log.shift();
    }

    showToast(lines) {
      this.toast = { lines, t: 1.8 };
    }

    // -- turn flow ---------------------------------------------------------------

    startTurn() {
      const p = this.players[this.cur];
      this.playerTurns++;
      this.turn = Math.ceil(this.playerTurns / this.players.length);
      this.phase = 'income';
      this.phaseT = 0;
      this.path = [];
      this.dice.final = null;
      this.pendingLand = null;
      this.collectIncome(p);
      // If the turn cap is reached and nobody has won yet, the game ends now.
      if (this.winner === null && this.turnCap > 0 && this.playerTurns >= this.turnCap * this.players.length) {
        this.endByCap();
        return;
      }
    }

    collectIncome(p) {
      const lines = [];
      // Production from owned land.
      let gained = {};
      RES.forEach(r => { gained[r.key] = 0; });
      for (const t of this.tiles) {
        if (t.owner !== this.cur) continue;
        for (const k in t.prod) {
          const pr = t.prod[k];
          if (pr.rich <= 0) continue;
          if (pr.reserve === 0) continue;
          const amount = pr.reserve < 0 ? pr.rich * 2 : Math.min(pr.rich * 2, pr.reserve);
          if (amount <= 0) continue;
          if (pr.reserve > 0) pr.reserve -= amount;
          p.resources[k] += amount;
          gained[k] += amount;
        }
      }
      const gainedParts = RES.filter(r => gained[r.key] > 0)
        .map(r => gained[r.key] + r.icon);
      if (gainedParts.length) lines.push('Production: +' + gainedParts.join(' '));

      // Rent from every property on the board.
      let rent = 0;
      for (const t of this.tiles) {
        if (!t.property) continue;
        const prop = PROPERTIES.find(pr => pr.id === t.property);
        const area = t.area !== null ? this.areaById(t.area) : null;
        const recipient = (area && area.mayor !== null) ? area.mayor : t.owner;
        if (recipient === this.cur) {
          p.money += prop.rent;
          rent += prop.rent;
        }
      }
      if (rent > 0) lines.push('Rent collected: +' + money(rent));

      if (lines.length) {
        this.showToast(lines);
        this.pushLog(p.name + ' income: ' + lines.join(', ') + '.');
      }
      this.checkWin();
    }

    endByCap() {
      let best = 0;
      for (let i = 1; i < this.players.length; i++) {
        if (this.players[i].money > this.players[best].money) best = i;
      }
      this.winner = { index: best, reason: 'turn cap reached' };
      this.phase = 'gameover';
      this.pushLog('Turn cap reached — ' + this.players[best].name + ' is the richest and wins!');
    }

    checkWin() {
      if (this.winner !== null) return;
      const p = this.players[this.cur];
      if (p.money >= this.winTarget) {
        this.winner = { index: this.cur, reason: 'reached ' + money(this.winTarget) };
        this.phase = 'gameover';
        this.pushLog(p.name + ' reaches ' + money(this.winTarget) + ' and wins!');
      }
    }

    rollDice() {
      this.phase = 'rolling';
      this.phaseT = 0;
      this.dice = { value: 1 + (Math.random() * 6 | 0), final: 1 + (Math.random() * 6 | 0), t: 0, duration: 0.8 };
      this.pushLog(this.players[this.cur].name + ' rolls a ' + this.dice.final + '.');
    }

    computePath() {
      // Unity-style random walk: each step picks a random direction, falling
      // back to any existing neighbor.
      const path = [];
      let cur = this.tileAt(this.players[this.cur].x, this.players[this.cur].z);
      for (let i = 0; i < this.dice.final; i++) {
        const ns = this.neighbors(cur);
        const next = ns[Math.random() * ns.length | 0];
        path.push(next);
        cur = next;
      }
      return path;
    }

    land() {
      const p = this.players[this.cur];
      const t = this.tileAt(p.x, p.z);
      this.pendingLand = t;
      this.phase = 'landed';
      const bits = [];
      if (t.owner !== null) bits.push('owned by ' + this.players[t.owner].name);
      if (t.area !== null) bits.push('in area ' + t.area + (this.areaById(t.area).mayor !== null ? ' (mayor: ' + this.players[this.areaById(t.area).mayor].name + ')' : ''));
      if (t.cityHall) bits.push('city hall');
      if (t.property) bits.push('has a ' + PROPERTIES.find(pr => pr.id === t.property).name.toLowerCase());
      this.pushLog('Lands on ' + (bits.length ? bits.join(', ') : 'empty ground') + ' (value ' + money(t.value) + ').');
    }

    // -- player actions ------------------------------------------------------------

    canBuildCityHall() {
      if (this.phase !== 'landed') return false;
      const t = this.pendingLand;
      return !!t && t.owner === null && t.area === null;
    }

    doBuildCityHall() {
      const t = this.pendingLand;
      const p = this.players[this.cur];
      const area = { id: this.areaCounter++, mayor: this.cur, tiles: [] };
      t.area = area.id;
      t.owner = this.cur;
      t.cityHall = true;
      area.tiles.push(t);
      this.areas.push(area);
      p.mayorOf = area.id;
      this.pushLog(p.name + ' builds a City Hall and founds area ' + area.id + ' — mayor of the new city!');
      this.afterLandAction();
    }

    canBuyTile() {
      if (this.phase !== 'landed') return false;
      const t = this.pendingLand;
      const p = this.players[this.cur];
      return !!t && t.owner === null && t.area !== null && p.money >= t.value;
    }

    doBuyTile() {
      const t = this.pendingLand;
      const p = this.players[this.cur];
      p.money -= t.value;
      t.owner = this.cur;
      this.pushLog(p.name + ' buys the tile for ' + money(t.value) + '.');
      this.afterLandAction();
    }

    canExpand() {
      if (this.phase !== 'landed') return false;
      const t = this.pendingLand;
      return !!t && t.cityHall && t.area !== null;
    }

    startExpand() {
      this.phase = 'expand';
      this.expandTiles = this.frontierTiles(this.pendingLand);
      if (!this.expandTiles.length) {
        this.phase = 'landed';
        this.pushLog('No frontier tiles — the area is surrounded by other cities.');
        return;
      }
      this.pushLog('Choose a frontier tile to expand the city (ESC to cancel).');
    }

    doExpand(tile) {
      const p = this.players[this.cur];
      const area = this.areaById(this.pendingLand.area);
      area.tiles.push(tile);
      tile.area = area.id;
      tile.owner = this.cur;
      this.pushLog(p.name + ' expands the city onto a frontier tile and owns it.');
      this.afterLandAction();
    }

    propAffordable(prop) {
      const p = this.players[this.cur];
      for (const k in prop.cost) if ((p.resources[k] | 0) < prop.cost[k]) return false;
      if (this.pendingLand && this.pendingLand.owner !== null && this.pendingLand.owner !== this.cur) {
        if (p.money < prop.rent) return false;
      }
      return true;
    }

    canBuildProperty(propId) {
      if (this.phase !== 'landed') return false;
      const t = this.pendingLand;
      if (!t || t.property !== null) return false;
      return this.propAffordable(PROPERTIES.find(pr => pr.id === propId));
    }

    doBuildProperty(propId) {
      const prop = PROPERTIES.find(pr => pr.id === propId);
      const t = this.pendingLand;
      const p = this.players[this.cur];
      for (const k in prop.cost) p.resources[k] -= prop.cost[k];
      t.property = prop.id;
      let extra = '';
      if (t.owner !== null && t.owner !== this.cur) {
        p.money -= prop.rent;
        this.players[t.owner].money += prop.rent;
        extra = ' and pays ' + money(prop.rent) + ' build rent to ' + this.players[t.owner].name + '.';
      }
      this.pushLog(p.name + ' builds a ' + prop.name + ' on the tile.' + extra);
      this.afterLandAction();
    }

    afterLandAction() {
      this.pendingLand = null;
      this.expandTiles = null;
      this.checkWin();
      if (this.phase === 'gameover') return;
      this.endTurn();
    }

    endTurn() {
      if (this.phase === 'gameover') return;
      this.pendingLand = null;
      this.expandTiles = null;
      this.cur = (this.cur + 1) % this.players.length;
      this.startTurn();
    }

    // -- input ------------------------------------------------------------------

    init(engine) {
      this.engine = engine;
      engine.input.bind('confirm', 'Space', 'Enter');
      engine.input.bind('endturn', 'KeyE');
      engine.input.bind('help', 'KeyH');
      engine.input.bind('cancel', 'Escape');
      engine.input.bind('restart', 'KeyR');

      const canvas = engine.canvas;
      const self = this;
      canvas.addEventListener('mousemove', (e) => {
        const r = canvas.getBoundingClientRect();
        self.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
        self.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
      });
      canvas.addEventListener('click', (e) => {
        const r = canvas.getBoundingClientRect();
        const mx = (e.clientX - r.left) * (canvas.width / r.width);
        const my = (e.clientY - r.top) * (canvas.height / r.height);
        self.handleClick(mx, my);
      });
    }

    button(id, x, y, w, h, label, enabled, action, opts) {
      opts = opts || {};
      this.buttons.push({ id, x, y, w, h, label, enabled, action, opts });
    }

    handleClick(mx, my) {
      if (this.showHelp) { this.showHelp = false; return; }
      // Expand: click a frontier tile.
      if (this.phase === 'expand' && this.expandTiles) {
        const bx = mx - BOARD_X, by = my - BOARD_Y;
        if (bx >= 0 && by >= 0 && bx < GRID * CELL && by < GRID * CELL) {
          const tx = bx / CELL | 0, tz = by / CELL | 0;
          const t = this.tileAt(tx, tz);
          if (t && this.expandTiles.includes(t)) { this.doExpand(t); return; }
        }
      }
      // Buttons (last drawn wins).
      for (let i = this.buttons.length - 1; i >= 0; i--) {
        const b = this.buttons[i];
        if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
          if (b.enabled && b.action) b.action();
          return;
        }
      }
    }

    mouseIn(x, y, w, h) {
      return this.mouse.x >= x && this.mouse.x <= x + w && this.mouse.y >= y && this.mouse.y <= y + h;
    }

    update(dt, engine) {
      if (this.showHelp) {
        if (engine.input.wasPressed('help') || engine.input.wasPressed('cancel')) this.showHelp = false;
        return;
      }
      if (engine.input.wasPressed('help')) { this.showHelp = true; return; }

      if (this.phase === 'gameover') {
        if (engine.input.wasPressed('restart')) this.newGame();
        return;
      }

      this.phaseT += dt;

      switch (this.phase) {
        case 'income':
          if (this.toast) {
            this.toast.t -= dt;
            if (this.toast.t <= 0) this.toast = null;
          }
          if (this.phaseT >= (this.toast ? 1.4 : 0.3)) {
            this.phase = 'idle';
            this.phaseT = 0;
          }
          break;

        case 'idle':
          if (engine.input.wasPressed('confirm')) this.rollDice();
          break;

        case 'rolling': {
          this.dice.t += dt;
          if (this.dice.t < this.dice.duration) {
            this.dice.value = 1 + (Math.random() * 6 | 0);
          } else {
            this.dice.value = this.dice.final;
            this.path = this.computePath();
            this.phase = 'moving';
            this.phaseT = 0;
            this.stepT = 0;
          }
          break;
        }

        case 'moving': {
          if (!this.path.length) { this.land(); break; }
          this.stepT += dt;
          const p = this.players[this.cur];
          const target = this.path[0];
          const tx = this.tilePx(target.x), ty = this.tilePy(target.z);
          const speed = 6; // tiles per second
          p.px += (tx - p.px) * Math.min(1, dt * 10);
          p.py += (ty - p.py) * Math.min(1, dt * 10);
          if (this.stepT >= 0.28) {
            this.stepT = 0;
            p.x = target.x; p.z = target.z;
            p.px = tx; p.py = ty;
            this.path.shift();
          }
          break;
        }

        case 'landed':
          if (engine.input.wasPressed('endturn')) this.endTurn();
          if (engine.input.wasPressed('cancel')) this.endTurn();
          break;

        case 'expand':
          if (engine.input.wasPressed('cancel')) {
            this.phase = 'landed';
            this.expandTiles = null;
          }
          break;
      }
    }

    // -- render ---------------------------------------------------------------------

    render(ctx, engine) {
      this.buttons = [];
      const W = engine.canvas.width, H = engine.canvas.height;

      this.drawBoard(ctx);
      this.drawPlayers(ctx);
      this.drawPanel(ctx, W, H);

      // Hover cursor
      if (this.mouse.x >= 0) {
        let over = false;
        for (const b of this.buttons) {
          if (this.mouseIn(b.x, b.y, b.w, b.h) && b.enabled) { over = true; break; }
        }
        if (this.phase === 'expand' && this.expandTiles) {
          for (const t of this.expandTiles) {
            if (this.mouse.x >= BOARD_X + t.x * CELL && this.mouse.x < BOARD_X + (t.x + 1) * CELL &&
                this.mouse.y >= BOARD_Y + t.z * CELL && this.mouse.y < BOARD_Y + (t.z + 1) * CELL) { over = true; break; }
          }
        }
        engine.canvas.style.cursor = over ? 'pointer' : 'default';
      }

      if (this.showHelp) this.drawHelp(ctx, W, H);
      if (this.phase === 'gameover') this.drawGameOver(ctx, W, H);
    }

    drawBoard(ctx) {
      // Frame
      const ui = GF.UISystem;
      ui.drawPanel(ctx, BOARD_X - 10, BOARD_Y - 10, GRID * CELL + 20, GRID * CELL + 20,
        { bgColor: 'rgba(10,14,22,0.9)', borderColor: '#2a3550', borderWidth: 2, radius: 8 });

      const p = this.players[this.cur];
      const landedTile = this.phase === 'landed' || this.phase === 'expand' ? this.pendingLand : null;

      for (const t of this.tiles) {
        const x = BOARD_X + t.x * CELL, y = BOARD_Y + t.z * CELL;

        // Base
        ctx.fillStyle = '#1a2130';
        ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);

        // Owner tint
        if (t.owner !== null) {
          ctx.fillStyle = hexA(this.players[t.owner].color, 0.30);
          ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
        }

        // Area border
        if (t.area !== null) {
          ctx.strokeStyle = areaColor(t.area);
          ctx.lineWidth = 3;
          ctx.strokeRect(x + 2.5, y + 2.5, CELL - 5, CELL - 5);
        }

        // Landed highlight
        if (landedTile && t === landedTile) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(x + 1.5, y + 1.5, CELL - 3, CELL - 3);
        }

        // Expand frontier highlight
        if (this.phase === 'expand' && this.expandTiles && this.expandTiles.includes(t)) {
          const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 180);
          ctx.strokeStyle = 'rgba(255,220,80,' + (0.5 + 0.5 * pulse) + ')';
          ctx.lineWidth = 3;
          ctx.strokeRect(x + 4, y + 4, CELL - 8, CELL - 8);
        }

        // City hall marker
        if (t.cityHall) {
          ctx.font = '20px monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText('🏛', x + 4, y + 4);
        }

        // Property icon
        if (t.property) {
          const prop = PROPERTIES.find(pr => pr.id === t.property);
          ctx.font = '26px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(prop.icon, x + CELL / 2, y + CELL / 2 + (t.cityHall ? 6 : 0));
        }

        // Value
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = '#c8d2e8';
        ctx.fillText(money(t.value), x + 4, y + CELL - 3);

        // Production dots (top-right)
        const prods = Object.keys(t.prod).filter(k => t.prod[k].rich > 0);
        prods.slice(0, 3).forEach((k, i) => {
          const pr = t.prod[k];
          const r = RES_BY_KEY[k];
          const dx = x + CELL - 8 - i * 13, dy = y + 6;
          ctx.fillStyle = pr.reserve === 0 ? '#444' : r.color;
          ctx.beginPath();
          ctx.arc(dx, dy, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#0d1118';
          ctx.lineWidth = 1;
          ctx.stroke();
          if (pr.reserve === 0) {
            ctx.font = '7px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#888';
            ctx.fillText('0', dx, dy + 0.5);
          }
        });
      }

      // Board title
      ui.drawText(ctx, 'ACCAY — the city grid', BOARD_X, 16,
        { font: 'bold 15px monospace', color: '#8fa3c8' });
      ui.drawText(ctx, 'north: power · south: harbor · west: forest · east: refinery', BOARD_X, 36,
        { font: '10px monospace', color: '#5a6b8c' });
    }

    drawPlayers(ctx) {
      // Stack offset when several tokens share a tile.
      const byTile = {};
      for (const p of this.players) {
        const k = p.x + ',' + p.z;
        (byTile[k] = byTile[k] || []).push(p);
      }
      for (const p of this.players) {
        const group = byTile[p.x + ',' + p.z];
        const idx = group.indexOf(p);
        const ox = group.length > 1 ? (idx - (group.length - 1) / 2) * 22 : 0;
        const oy = group.length > 1 ? (idx - (group.length - 1) / 2) * 10 : 0;
        const x = p.px + ox, y = p.py + oy;

        ctx.beginPath();
        ctx.arc(x, y, 13, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        GF.UISystem.drawText(ctx, p.name.slice(0, 1).toUpperCase(), x, y + 1,
          { font: 'bold 13px monospace', color: '#10141c', align: 'center', baseline: 'middle' });
      }
    }

    drawPanel(ctx, W, H) {
      const ui = GF.UISystem;
      const PX = 580, PW = W - PX - 16;
      const p = this.players[this.cur];

      // Title bar
      ui.drawText(ctx, 'ACCAY PROTOTYPE', 16, 14, { font: 'bold 16px monospace', color: '#ffb347' });
      ui.drawText(ctx, 'SPACE roll · E end turn · 1-3 build · H help', 16, 34,
        { font: '10px monospace', color: '#5a6b8c' });
      this.button('helpBtn', W - 110, 12, 94, 26, '? Help (H)', true, () => { this.showHelp = true; });

      // Player banner
      ui.drawPanel(ctx, PX, 12, PW, 64, { bgColor: hexA(p.color, 0.15), borderColor: p.color, borderWidth: 2, radius: 8 });
      ui.drawText(ctx, p.name, PX + 12, 20, { font: 'bold 16px monospace', color: p.color });
      ui.drawText(ctx, 'Turn ' + this.turn + ' / ' + (this.turnCap > 0 ? this.turnCap : '—'), PX + 12, 44,
        { font: '11px monospace', color: '#8fa3c8' });
      ui.drawText(ctx, money(p.money), PX + PW - 12, 26,
        { font: 'bold 20px monospace', color: '#fff', align: 'right' });
      ui.drawText(ctx, 'target ' + money(this.winTarget), PX + PW - 12, 52,
        { font: '10px monospace', color: '#8fa3c8', align: 'right' });

      // Dice + roll
      ui.drawPanel(ctx, PX, 88, PW, 96, { bgColor: 'rgba(10,14,22,0.9)', borderColor: '#2a3550', borderWidth: 1, radius: 8 });
      const dx = PX + 16, dy = 102;
      ctx.fillStyle = '#f5f7fb';
      ctx.beginPath();
      ctx.arc(dx + 34, dy + 34, 34, 0, Math.PI * 2);
      ctx.fill();
      this.drawDicePips(ctx, dx + 34, dy + 34, this.phase === 'idle' ? 1 : this.dice.value, '#223');
      const rollLabel = this.phase === 'idle' ? 'Roll (SPACE)' : (this.phase === 'rolling' ? 'Rolling…' : 'Rolling');
      this.button('roll', PX + 84, dy, 130, 48, rollLabel, this.phase === 'idle', () => this.rollDice(),
        { bg: '#2f6df6', color: '#fff', font: 'bold 15px monospace' });
      ui.drawText(ctx, 'Target ' + money(this.winTarget) + ' cash to win.', PX + 84, dy + 56,
        { font: '10px monospace', color: '#5a6b8c' });

      // Action panel
      const AY = 192;
      ui.drawPanel(ctx, PX, AY, PW, 160, { bgColor: 'rgba(10,14,22,0.9)', borderColor: '#2a3550', borderWidth: 1, radius: 8 });
      let ay = AY + 8;
      if (this.phase === 'landed' && this.pendingLand) {
        const t = this.pendingLand;
        ui.drawText(ctx, 'You land on a tile worth ' + money(t.value) + '.', PX + 12, ay, { font: '11px monospace', color: '#c8d2e8' });
        ay += 18;

        if (this.canBuildCityHall()) {
          this.button('cityhall', PX + 12, ay, PW - 24, 24, '🏛 Build City Hall (free)', true, () => this.doBuildCityHall(),
            { bg: '#245a3a', color: '#c9f2d4', font: '12px monospace' });
          ay += 28;
        }
        if (t.owner === null && t.area !== null) {
          this.button('buy', PX + 12, ay, PW - 24, 24,
            '💰 Buy tile — ' + money(t.value) + (p.money < t.value ? ' (too poor)' : ''),
            p.money >= t.value, () => this.doBuyTile(),
            { bg: '#2a4a8a', color: '#cfe0ff', font: '12px monospace' });
          ay += 28;
        }
        if (this.canExpand()) {
          this.button('expand', PX + 12, ay, PW - 24, 24, '🏙 Expand this city', true, () => this.startExpand(),
            { bg: '#6a4a12', color: '#ffe3ae', font: '12px monospace' });
          ay += 28;
        }
        if (t.property === null) {
          for (let i = 0; i < PROPERTIES.length; i++) {
            const pr = PROPERTIES[i];
            const costStr = Object.keys(pr.cost).map(k => pr.cost[k] + RES_BY_KEY[k].icon).join(' ');
            const extra = (t.owner !== null && t.owner !== this.cur) ? ' + ' + money(pr.rent) : '';
            this.button('prop' + pr.id, PX + 12, ay, PW - 24, 24,
              (i + 1) + '. ' + pr.icon + ' ' + pr.name + ' — ' + costStr + extra,
              this.propAffordable(pr), () => this.doBuildProperty(pr.id),
              { bg: '#3a3f52', color: '#e8ecf5', font: '12px monospace' });
            ay += 28;
          }
        }
      } else if (this.phase === 'expand') {
        ui.drawText(ctx, 'Expand: click a highlighted frontier tile.', PX + 12, ay + 4,
          { font: '12px monospace', color: '#ffe3ae' });
        ui.drawText(ctx, 'The new tile is added to the city and you own it.', PX + 12, ay + 24,
          { font: '11px monospace', color: '#8fa3c8' });
      } else if (this.phase === 'idle' || this.phase === 'income') {
        ui.drawText(ctx, (this.phase === 'income' ? 'Collecting income…' : 'Press SPACE to roll the dice.'), PX + 12, ay + 20,
          { font: '12px monospace', color: '#c8d2e8' });
      } else {
        ui.drawText(ctx, this.phase === 'rolling' ? 'The dice tumble…' : 'Wandering the streets…', PX + 12, ay + 20,
          { font: '12px monospace', color: '#c8d2e8' });
      }

      // End turn button (available when landed / picking a frontier tile)
      this.button('endturn', PX + 12, AY + 164, PW - 24, 26, '↩ End Turn (E)',
        this.phase === 'landed' || this.phase === 'expand', () => this.endTurn(),
        { bg: '#503a3a', color: '#ffd7d7', font: '12px monospace' });

      // Log
      const LY = 392;
      ui.drawPanel(ctx, PX, LY, PW, 100, { bgColor: 'rgba(10,14,22,0.9)', borderColor: '#2a3550', borderWidth: 1, radius: 8 });
      ui.drawText(ctx, 'Log', PX + 12, LY + 6, { font: 'bold 11px monospace', color: '#8fa3c8' });
      const shown = this.log.slice(-4);
      shown.forEach((line, i) => {
        ui.drawText(ctx, line, PX + 12, LY + 24 + i * 18,
          { font: '10px monospace', color: i === shown.length - 1 ? '#dfe6f5' : '#7d8cab' });
      });

      // Player cards
      const CY = 498;
      ui.drawPanel(ctx, PX, CY, PW, 134, { bgColor: 'rgba(10,14,22,0.9)', borderColor: '#2a3550', borderWidth: 1, radius: 8 });
      this.players.forEach((pl, i) => {
        const cy = CY + 8 + i * 32;
        ctx.fillStyle = pl.color;
        ctx.beginPath();
        ctx.arc(PX + 18, cy + 12, 6, 0, Math.PI * 2);
        ctx.fill();
        ui.drawText(ctx, pl.name + (i === this.cur && this.phase !== 'gameover' ? ' ▸' : ''), PX + 32, cy + 4,
          { font: (i === this.cur ? 'bold ' : '') + '11px monospace', color: i === this.cur ? '#fff' : '#9fb0d0' });
        const tilesOwned = this.tiles.filter(t => t.owner === i).length;
        const resStr = RES.map(r => pl.resources[r.key] > 0 ? pl.resources[r.key] + r.icon : '').filter(Boolean).join('');
        ui.drawText(ctx, money(pl.money), PX + PW - 12, cy + 2,
          { font: 'bold 11px monospace', color: '#fff', align: 'right' });
        ui.drawText(ctx, '🏠' + tilesOwned + '  ' + resStr + (pl.mayorOf !== null ? '  🎖 area ' + pl.mayorOf : ''), PX + 32, cy + 17,
          { font: '10px monospace', color: '#7d8cab' });
      });
    }

    drawDicePips(ctx, cx, cy, value, color) {
      const off = 14;
      const pips = {
        1: [[0, 0]],
        2: [[-off, -off], [off, off]],
        3: [[-off, -off], [0, 0], [off, off]],
        4: [[-off, -off], [off, -off], [-off, off], [off, off]],
        5: [[-off, -off], [off, -off], [0, 0], [-off, off], [off, off]],
        6: [[-off, -off], [off, -off], [-off, 0], [off, 0], [-off, off], [off, off]],
      }[value] || [[0, 0]];
      ctx.fillStyle = color;
      for (const [dx, dy] of pips) {
        ctx.beginPath();
        ctx.arc(cx + dx, cy + dy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawHelp(ctx, W, H) {
      ctx.fillStyle = 'rgba(5,8,14,0.88)';
      ctx.fillRect(0, 0, W, H);
      const ui = GF.UISystem;
      ui.drawText(ctx, 'How to play Acca', W / 2, 40,
        { font: 'bold 22px monospace', color: '#ffb347', align: 'center' });
      RULES.forEach((line, i) => {
        ui.drawText(ctx, line, 90, 90 + i * 19,
          { font: (line && !line.startsWith(' ') ? 'bold ' : '') + '12px monospace', color: line && !line.startsWith(' ') ? '#c8d2e8' : '#8fa3c8' });
      });
      ui.drawText(ctx, 'Click anywhere or press H / ESC to close', W / 2, H - 30,
        { font: '12px monospace', color: '#5a6b8c', align: 'center' });
    }

    drawGameOver(ctx, W, H) {
      const ui = GF.UISystem;
      const w = this.players[this.winner.index];
      ctx.fillStyle = 'rgba(5,8,14,0.85)';
      ctx.fillRect(0, 0, W, H);
      ui.drawText(ctx, '🏆 ' + w.name + ' wins!', W / 2, 220,
        { font: 'bold 34px monospace', color: w.color, align: 'center' });
      ui.drawText(ctx, w.reason, W / 2, 270,
        { font: '14px monospace', color: '#c8d2e8', align: 'center' });
      ui.drawText(ctx, 'Final cash: ' + money(w.money), W / 2, 300,
        { font: '14px monospace', color: '#8fa3c8', align: 'center' });
      this.button('restartBtn', W / 2 - 90, 350, 180, 44, '↻ Restart (R)', true, () => this.newGame(),
        { bg: '#2f6df6', color: '#fff', font: 'bold 15px monospace' });
    }
  }

  // ── Boot ─────────────────────────────────────────────────────────────────

  window.addEventListener('GF:ready', () => {
    const cfg = GF.GAME_CONFIG || {};
    const game = GF.createGame(cfg.engine || {}, cfg.physics || {}, {
      gameName: (cfg.game && cfg.game.name) || 'Acca-Prototype',
      scenes: [new AccaScene()],
    });
    game.engine.start();
  });
})(window.GF = (window.GF || {}));
