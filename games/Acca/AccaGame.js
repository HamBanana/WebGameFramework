// GameFramework/games/Acca/AccaGame.js
// Main game logic for Acca — uses GameFramework, no asset paths.
// Mirrors the structure of the Unity reference (GameManager, TurnManager,
// Player, MovementController, DieController, Cell) but adapted for the
// canvas-based GameFramework runtime.

(function (GF) {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────

  const GAME_STATE = {
    MENU      : 'menu',
    SETUP     : 'setup',
    PLAYING   : 'playing',
    GAME_OVER : 'game_over',
  };

  const TURN_STAGE = {
    TURN_START   : 'turnStart',     // Show roll/options menu
    ROLL         : 'roll',          // Animating die
    MOVE         : 'move',          // Player chooses path with arrow keys
    CONFIRM_LAND : 'confirmLand',   // Pause before triggering cell event
    LANDING      : 'landing',       // Cell event runs (property/market/chance)
    LAND_PROMPT  : 'landPrompt',    // Sub-menu (e.g. buy property, chance result)
    END_TURN     : 'endTurn',       // Advance to next player
  };

  // ──────────────────────────────────────────────────────────────────────────
  //  Cell
  // ──────────────────────────────────────────────────────────────────────────
  class Cell {
    constructor(id, x, y, type, district, sprite) {
      this.id        = id;
      this.x         = x;
      this.y         = y;
      this.type      = type;     // 'bank' | 'property' | 'chance' | 'empty'
      this.district  = district; // district name or null
      this.sprite    = sprite;   // sprite name registered with SpriteSystem

      // Neighbors (linked by GameManager during setup)
      this.up    = null;
      this.down  = null;
      this.left  = null;
      this.right = null;

      // Flexible neighbor list (populated from connections)
      this._neighbors = [];

      // Property state (only meaningful for type === 'property')
      this.ownerIndex = -1;      // player index, or -1 if unowned
      this.purchasePrice = 0;    // base price; set during init

      // Animator (for cell visuals)
      this.animator = null;
    }

    /** Return list of neighbors. */
    neighbors() {
      return this._neighbors;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  DieController — animated die that produces a value 1..6
  // ──────────────────────────────────────────────────────────────────────────
  class DieController {
    constructor(spriteSystem) {
      this.animator = spriteSystem.createAnimator('die', 'face1');
      this.rolling  = false;
      this.rolledValue = 0;
      this._duration = 0;
      this._timer    = 0;
      this._onDone   = null;
    }

    /** Start a roll. Calls onDone(value) when finished. */
    roll(duration, onDone) {
      this.rolling = true;
      this.rolledValue = 0;
      this._duration = duration;
      this._timer = 0;
      this._onDone = onDone;
      this.animator.play('rolling', true);
    }

    update(dt) {
      if (this.rolling) {
        this._timer += dt;
        if (this._timer >= this._duration) {
          this.rolling = false;
          this.rolledValue = 1 + Math.floor(Math.random() * 6);
          this.animator.play('face' + this.rolledValue, true);
          if (this._onDone) {
            const cb = this._onDone;
            this._onDone = null;
            cb(this.rolledValue);
          }
        }
      }
      this.animator.update(dt);
    }

    draw(ctx, x, y) {
      this.animator.draw(ctx, x, y);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Player
  // ──────────────────────────────────────────────────────────────────────────
  class Player {
    constructor(index, def, startCell, startingMoney, spriteSystem) {
      this.index      = index;
      this.name       = def.name;
      this.color      = def.color;
      this.spriteName = def.sprite;
      this.animator   = spriteSystem.createAnimator(def.sprite, 'idle');

      // Stats
      this.money       = startingMoney;
      this.totalValue  = startingMoney;
      this.level       = 1;
      this.isBankrupt  = false;

      // Properties
      this.ownedCells  = [];     // array of Cell
      this.resources   = {};     // resource name → quantity
      this.regionsMayoredOf = new Set();

      // Position
      this.currentCell = startCell;
      this.renderX     = 0;
      this.renderY     = 0;     // updated each frame from cell coords
      this.moveOffset  = { x: 0, y: 0 }; // small offset so multiple players on same cell don't fully overlap
    }

    /** Recompute total value (cash + property values). */
    recalcTotalValue() {
      const propVal = this.ownedCells.reduce((sum, c) => sum + (c.purchasePrice || 0), 0);
      this.totalValue = this.money + propVal;
    }

    addMoney(amount) {
      this.money += amount;
      if (this.money < 0) {
        // Simple bankruptcy rule — can refine later.
        this.isBankrupt = true;
        this.money = 0;
      }
      this.recalcTotalValue();
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  MovementController — handles per-step arrow input during MOVE stage
  // ──────────────────────────────────────────────────────────────────────────
  class MovementController {
    constructor(input, controls, eventBus) {
      this.input    = input;
      this.controls = controls;
      this.events   = eventBus;
      this.active   = false;
      this.player   = null;
      this.movesLeft = 0;
    }

    begin(player, moves) {
      this.player    = player;
      this.movesLeft = moves;
      this.active    = true;
    }

    /** Called every frame from the engine loop. */
    update() {
      if (!this.active || !this.player) return;
      const cur = this.player.currentCell;
      if (!cur) return;

      let target = null;
      if      (this._pressed('up')    && cur.up)    target = cur.up;
      else if (this._pressed('down')  && cur.down)  target = cur.down;
      else if (this._pressed('left')  && cur.left)  target = cur.left;
      else if (this._pressed('right') && cur.right) target = cur.right;

      if (target) {
        this._stepTo(target);
      }
    }

    _pressed(action) {
      const codes = this.controls[action];
      if (!codes) return false;
      return codes.some(code => this.input.wasPressed(code));
    }

    _stepTo(target) {
      const p = this.player;
      this.events.emit('cell:leave', { player: p, cell: p.currentCell });
      p.currentCell = target;
      this.movesLeft--;
      this.events.emit('cell:enter', { player: p, cell: target });

      if (this.movesLeft <= 0) {
        this.active = false;
        this.events.emit('move:complete', { player: p });
      }
    }

    cancel() {
      this.active = false;
      this.player = null;
      this.movesLeft = 0;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Menu — simple arrow-key-driven selection list
  // ──────────────────────────────────────────────────────────────────────────
  class Menu {
    constructor(input, controls) {
      this.input    = input;
      this.controls = controls;
      this.options  = [];      // [{ label, action }]
      this.index    = 0;
      this.title    = '';
      this.visible  = false;
    }

    show(title, options) {
      this.title   = title;
      this.options = options;
      this.index   = 0;
      this.visible = true;
    }

    hide() {
      this.visible = false;
      this.options = [];
    }

    update() {
      if (!this.visible || this.options.length === 0) return;

      if (this._pressed('up'))   this.index = (this.index - 1 + this.options.length) % this.options.length;
      if (this._pressed('down')) this.index = (this.index + 1) % this.options.length;

      if (this._pressed('confirm')) {
        const opt = this.options[this.index];
        this.hide();
        if (opt && opt.action) opt.action();
      }
    }

    _pressed(action) {
      const codes = this.controls[action];
      if (!codes) return false;
      return codes.some(code => this.input.wasPressed(code));
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  TurnManager — drives the per-turn sub-state machine
  // ──────────────────────────────────────────────────────────────────────────
  class TurnManager {
    constructor(game) {
      this.game     = game;
      this.stage    = null;
      this.player   = null;
      this.die      = game.die;
      this.movement = game.movement;
      this.menu     = game.menu;
      this.events   = game.engine.events;
      this._waitTimer = 0;

      // React to movement completion → confirm land
      this.events.on('move:complete', () => {
        if (this.stage === TURN_STAGE.MOVE) this.enter(TURN_STAGE.CONFIRM_LAND);
      });

      this.events.on('cell:enter', ({ player, cell }) => {
        this.game.log(`${player.name} stepped onto ${this.game.cellLabel(cell)}.`);
      });
    }

    startTurn(player) {
      this.player = player;
      this.enter(TURN_STAGE.TURN_START);
    }

    enter(stage) {
      this.stage = stage;
      switch (stage) {

        case TURN_STAGE.TURN_START:
          this._showStartMenu();
          break;

        case TURN_STAGE.ROLL:
          this.game.log(`${this.player.name} rolls the die...`);
          this.die.roll(this.game.cfg.turn.rollDuration, (value) => {
            this.game.log(`Rolled a ${value}.`);
            this.game.lastRoll = value;
            this.enter(TURN_STAGE.MOVE);
          });
          break;

        case TURN_STAGE.MOVE:
          this.movement.begin(this.player, this.game.lastRoll);
          this.game.log(`Move ${this.game.lastRoll} step(s) — use arrow keys.`);
          break;

        case TURN_STAGE.CONFIRM_LAND:
          this.menu.show('Land here?', [
            { label: 'Confirm', action: () => this.enter(TURN_STAGE.LANDING) },
          ]);
          break;

        case TURN_STAGE.LANDING:
          this._handleLanding();
          break;

        case TURN_STAGE.LAND_PROMPT:
          // Menu is already visible from _handleLanding; just wait for a choice.
          break;

        case TURN_STAGE.END_TURN:
          this.game.log(`${this.player.name} ends their turn.`);
          this.game.endPlayerTurn();
          break;
      }
    }

    _showStartMenu() {
      this.menu.show(`${this.player.name}'s turn`, [
        { label: 'Roll',    action: () => this.enter(TURN_STAGE.ROLL) },
        { label: 'Options', action: () => this._showOptionsMenu() },
      ]);
    }

    _showOptionsMenu() {
      const owned = this.player.ownedCells.length;
      this.menu.show('Options', [
        { label: `Properties: ${owned}`, action: () => this._showStartMenu() },
        { label: `Money: $${this.player.money}`, action: () => this._showStartMenu() },
        { label: 'Back', action: () => this._showStartMenu() },
      ]);
    }

    _handleLanding() {
      const cell = this.player.currentCell;
      switch (cell.type) {
        case 'bank':
          this.player.addMoney(200);
          this.game.log(`${this.player.name} passed the Bank. +$200.`);
          this.enter(TURN_STAGE.END_TURN);
          break;

        case 'property':
          this._handleProperty(cell);
          break;

        case 'chance':
          this._handleChance();
          break;

        default:  // empty or other
          this.enter(TURN_STAGE.END_TURN);
          break;
      }
    }

    // ── Property logic ─────────────────────────────────────────────────────
    _handleProperty(cell) {
      const p = this.player;

      if (cell.ownerIndex === -1) {
        // Unowned — offer to buy
        this.stage = TURN_STAGE.LAND_PROMPT;
        const price = cell.purchasePrice;
        const canAfford = p.money >= price;

        const opts = [];
        if (canAfford) {
          opts.push({
            label: `Buy ($${price})`,
            action: () => {
              p.addMoney(-price);
              cell.ownerIndex = p.index;
              p.ownedCells.push(cell);
              this.game.checkMayor(p, cell.district);
              this.game.log(`${p.name} bought a property in ${cell.district} for $${price}.`);
              this.enter(TURN_STAGE.END_TURN);
            },
          });
        } else {
          opts.push({
            label: `Cannot afford ($${price})`,
            action: () => this.enter(TURN_STAGE.END_TURN),
          });
        }
        opts.push({ label: 'Skip', action: () => this.enter(TURN_STAGE.END_TURN) });

        this.menu.show(`Property in ${cell.district}`, opts);
        return;
      }

      if (cell.ownerIndex === p.index) {
        this.game.log(`${p.name} is on their own property.`);
        this.enter(TURN_STAGE.END_TURN);
        return;
      }

      // Owned by another player → pay rent
      const owner = this.game.players[cell.ownerIndex];
      let rent    = this.game.cfg.property.baseRent;
      if (owner.regionsMayoredOf.has(cell.district)) {
        rent += this.game.cfg.property.mayorBonus;
      }
      p.addMoney(-rent);
      owner.addMoney(rent);
      this.game.log(`${p.name} pays $${rent} rent to ${owner.name}.`);
      this.enter(TURN_STAGE.END_TURN);
    }

    // ── Chance logic ───────────────────────────────────────────────────────
    _handleChance() {
      const pool   = this.game.cfg.chance;
      const event  = pool[Math.floor(Math.random() * pool.length)];
      const p      = this.player;
      let appliedMsg = event.message;

      switch (event.effect) {
        case 'money':
          p.addMoney(event.value);
          break;
        case 'money_pct': {
          const delta = Math.round(p.money * event.value);
          p.addMoney(delta);
          appliedMsg += ` (${delta >= 0 ? '+' : ''}$${delta})`;
          break;
        }
      }

      this.game.log(`Chance — ${event.label}: ${appliedMsg}`);

      this.stage = TURN_STAGE.LAND_PROMPT;
      this.menu.show(event.label, [
        { label: 'OK', action: () => this.enter(TURN_STAGE.END_TURN) },
      ]);
    }

    // ── Market logic ───────────────────────────────────────────────────────
    _handleMarket() {
      const cfg = this.game.cfg.market;
      const opts = cfg.resources.map(r => ({
        label: `Buy ${r} ($${cfg.basePrices[r]})`,
        action: () => {
          const price = cfg.basePrices[r];
          if (this.player.money >= price) {
            this.player.addMoney(-price);
            this.player.resources[r] = (this.player.resources[r] || 0) + 1;
            this.game.log(`${this.player.name} bought 1 ${r} for $${price}.`);
          } else {
            this.game.log(`${this.player.name} cannot afford ${r}.`);
          }
          this.enter(TURN_STAGE.END_TURN);
        },
      }));
      opts.push({ label: 'Leave Market', action: () => this.enter(TURN_STAGE.END_TURN) });

      this.stage = TURN_STAGE.LAND_PROMPT;
      this.menu.show('Market', opts);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  AccaGame — top-level controller (analogous to GameManager)
  // ──────────────────────────────────────────────────────────────────────────
  class AccaGame {
    constructor() {
      const cfg = GF.GAME_CONFIG;
      this.cfg  = cfg;

      // Engine + systems via framework
      const { engine, sprites, physics, ui } = GF.createGame(cfg.engine, cfg.physics);
      this.engine  = engine;
      this.sprites = sprites;
      this.physics = physics;
      this.ui      = ui;

      // Register sprites populated by sprites/*.js files
      if (GF.sprites) sprites.registerSprites(GF.sprites);

      // ── Input bindings ───────────────────────────────────────────────────
      const ctl = cfg.controls;
      Object.entries(ctl).forEach(([action, codes]) => engine.input.bind(action, ...codes));

      // ── Game state ───────────────────────────────────────────────────────
      this.gameState = GAME_STATE.MENU;
      this.players   = [];
      this.currentPlayerIndex = 0;
      this.cells     = [];     // flat array of all cells
      this.grid      = [];     // 2D array [row][col]
      this.eventLog  = [];     // recent messages
      this.lastRoll  = 0;
      this.winner    = null;

      // Sub-systems built on framework primitives
      this.die      = new DieController(sprites);
      this.menu     = new Menu(engine.input, ctl);
      this.movement = new MovementController(engine.input, ctl, engine.events);
      this.turn     = new TurnManager(this);

      // Number of players is configurable from the menu
      this.menuPlayerCount = cfg.numberOfPlayers;

      // Wire engine callbacks
      engine.onUpdate((dt) => this._update(dt));
      engine.onRender((ctx) => this._render(ctx));
    }

    start() {
      this.engine.start();
    }

    // ── Logging helpers ───────────────────────────────────────────────────
    log(message) {
      this.eventLog.push(message);
      if (this.eventLog.length > 6) this.eventLog.shift();
    }

    cellLabel(cell) {
      switch (cell.type) {
        case 'bank':
          return 'the Bank';
        case 'chance':
          return 'a Chance tile';
        case 'property':
          return cell.ownerIndex === -1
            ? `an unowned property in ${cell.district}`
            : `${this.players[cell.ownerIndex].name}'s property in ${cell.district}`;
        case 'empty':
          return 'an open tile';
        default:
          return 'a tile';
      }
    }

    get currentPlayer() {
      return this.players[this.currentPlayerIndex];
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Setup
    // ─────────────────────────────────────────────────────────────────────
    _initBoard() {
      const { cellSize, originX, originY } = this.cfg.board;
      const { cells, connections } = GF.mapData;

      this.cells = [];
      this.grid  = [];

      // Build cell map and create Cell objects
      const cellById = new Map();
      cells.forEach(c => {
        // Determine sprite and gameType based on cell type
        let sprite, gameType;
        if (c.type === 'bank') {
          sprite = 'cell_start';
          gameType = 'bank';
        } else if (c.type === 'chance') {
          sprite = 'cell_chance';
          gameType = 'chance';
        } else if (c.type === 'empty') {
          if (c.district !== null) {
            sprite = 'cell_property';
            gameType = 'property';
          } else {
            sprite = 'cell_normal';
            gameType = 'empty';
          }
        }

        const cell = new Cell(c.id, c.x, c.y, gameType, c.district, sprite);
        cell.purchasePrice = this.cfg.property.basePrice;
        cell.animator = this.sprites.createAnimator(sprite, 'idle');

        this.cells.push(cell);
        cellById.set(c.id, cell);
      });

      // Wire _neighbors from connections
      connections.forEach(conn => {
        const fromCell = cellById.get(conn.from);
        const toCell = cellById.get(conn.to);

        if (!fromCell || !toCell) return;

        if (conn.direction === 'both') {
          if (!fromCell._neighbors.includes(toCell)) fromCell._neighbors.push(toCell);
          if (!toCell._neighbors.includes(fromCell)) toCell._neighbors.push(fromCell);
        } else if (conn.direction === 'forward') {
          if (!fromCell._neighbors.includes(toCell)) fromCell._neighbors.push(toCell);
        }
      });

      // Assign directional slots (up/down/left/right) spatially
      this.cells.forEach(cell => {
        const candidates = { up: [], down: [], left: [], right: [] };

        cell._neighbors.forEach(neighbor => {
          const dx = neighbor.x - cell.x;
          const dy = neighbor.y - cell.y;
          const angle = Math.atan2(dy, dx);

          // Determine primary direction by dominant axis
          let direction;
          if (Math.abs(dy) > Math.abs(dx)) {
            // Vertical dominant
            direction = dy > 0 ? 'down' : 'up';
          } else {
            // Horizontal dominant
            direction = dx > 0 ? 'right' : 'left';
          }

          candidates[direction].push({ neighbor, angle });
        });

        // For each direction, pick the best candidate (closest to cardinal angle)
        const cardinalAngles = {
          up: Math.PI / 2,
          down: -Math.PI / 2,
          left: Math.PI,
          right: 0,
        };

        Object.entries(candidates).forEach(([dir, cands]) => {
          if (cands.length > 0) {
            const cardinal = cardinalAngles[dir];
            let best = cands[0];
            let bestDev = Math.abs(((cands[0].angle - cardinal + Math.PI) % (2 * Math.PI)) - Math.PI);

            for (let i = 1; i < cands.length; i++) {
              const dev = Math.abs(((cands[i].angle - cardinal + Math.PI) % (2 * Math.PI)) - Math.PI);
              if (dev < bestDev) {
                best = cands[i];
                bestDev = dev;
              }
            }
            cell[dir] = best.neighbor;
          }
        });
      });

      // Cache board-pixel converter
      this._toPixel = (cell) => ({
        x: originX + cell.x,
        y: originY + cell.y,
      });
      this._cellSize = cellSize;
    }

    _initPlayers() {
      this.players = [];
      // Find the start cell
      const startCell = this.cells.find(c => c.type === 'bank') || this.cells[0];

      const count = Math.min(this.menuPlayerCount, this.cfg.players.length);
      for (let i = 0; i < count; i++) {
        const def = this.cfg.players[i];
        const p = new Player(i, def, startCell, this.cfg.startingMoney, this.sprites);
        // Stagger overlap offsets so tokens don't fully cover each other.
        const offsets = [
          { x: -10, y: -6 }, { x:  10, y: -6 },
          { x: -10, y:  6 }, { x:  10, y:  6 },
        ];
        p.moveOffset = offsets[i] || { x: 0, y: 0 };
        this.players.push(p);
      }
      this.currentPlayerIndex = 0;
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Mayor / win condition
    // ─────────────────────────────────────────────────────────────────────
    checkMayor(player, regionId) {
      const regionCells = this.cells.filter(
        c => c.district === regionId && c.type === 'property'
      );
      const allOwned = regionCells.every(c => c.ownerIndex === player.index);
      if (allOwned) {
        if (!player.regionsMayoredOf.has(regionId)) {
          player.regionsMayoredOf.add(regionId);
          this.log(`${player.name} is now Mayor of ${regionId}!`);
        }
      }
    }

    _checkWinCondition() {
      const w = this.cfg.win;
      switch (w.type) {
        case 'MoneyOnHand':
          return this.players.find(p => p.money >= w.target) || null;
        case 'TotalValue':
          return this.players.find(p => p.totalValue >= w.target) || null;
        case 'Level':
          return this.players.find(p => p.level >= w.target) || null;
        case 'LastManStanding': {
          const live = this.players.filter(p => !p.isBankrupt);
          return live.length === 1 ? live[0] : null;
        }
        default: return null;
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Turn flow (called by TurnManager)
    // ─────────────────────────────────────────────────────────────────────
    endPlayerTurn() {
      // Advance to next non-bankrupt player
      for (let i = 1; i <= this.players.length; i++) {
        const idx = (this.currentPlayerIndex + i) % this.players.length;
        if (!this.players[idx].isBankrupt) {
          this.currentPlayerIndex = idx;
          break;
        }
      }
      const winner = this._checkWinCondition();
      if (winner) {
        this.winner = winner;
        this.gameState = GAME_STATE.GAME_OVER;
        this.log(`Game Over — ${winner.name} wins!`);
        return;
      }
      this.turn.startTurn(this.currentPlayer);
    }

    _beginGame() {
      this._initBoard();
      this._initPlayers();
      this.eventLog = [];
      this.log('Game started.');
      this.gameState = GAME_STATE.PLAYING;
      this.turn.startTurn(this.currentPlayer);
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Update
    // ─────────────────────────────────────────────────────────────────────
    _update(dt) {
      // Always animate cell sprites and player tokens
      this.cells.forEach(c => c.animator && c.animator.update(dt));
      this.players.forEach(p => p.animator.update(dt));
      this.die.update(dt);
      this.menu.update();

      switch (this.gameState) {
        case GAME_STATE.MENU:
          this._updateMenu();
          break;
        case GAME_STATE.PLAYING:
          // The MovementController self-guards via `active`, but only the
          // MOVE stage activates it.
          this.movement.update(dt);
          break;
        case GAME_STATE.GAME_OVER:
          if (this.engine.input.wasPressed('confirm')) {
            this.gameState = GAME_STATE.MENU;
            this.menuPlayerCount = this.cfg.numberOfPlayers;
          }
          break;
      }
    }

    _updateMenu() {
      const inp = this.engine.input;
      // Adjust player count
      if (inp.wasPressed('left')) {
        this.menuPlayerCount = Math.max(2, this.menuPlayerCount - 1);
      }
      if (inp.wasPressed('right')) {
        this.menuPlayerCount = Math.min(this.cfg.players.length, this.menuPlayerCount + 1);
      }
      if (inp.wasPressed('confirm')) {
        this._beginGame();
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    //  Render
    // ─────────────────────────────────────────────────────────────────────
    _render(ctx) {
      const W = this.cfg.engine.width;
      const H = this.cfg.engine.height;

      this._drawBackground(ctx, W, H);

      switch (this.gameState) {
        case GAME_STATE.MENU:
          this._drawMenu(ctx, W, H);
          break;
        case GAME_STATE.PLAYING:
          this._drawBoard(ctx);
          this._drawTokens(ctx);
          this._drawHUD(ctx, W, H);
          this._drawDie(ctx, W, H);
          this._drawMenuOverlay(ctx, W, H);
          break;
        case GAME_STATE.GAME_OVER:
          this._drawBoard(ctx);
          this._drawTokens(ctx);
          this._drawHUD(ctx, W, H);
          this._drawGameOver(ctx, W, H);
          break;
      }
    }

    _drawBackground(ctx, W, H) {
      // Vertical gradient
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1a2330');
      g.addColorStop(1, '#0a0d12');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // Faint diagonal stripes for depth
      ctx.strokeStyle = 'rgba(80,120,160,0.06)';
      ctx.lineWidth = 1;
      for (let i = -H; i < W; i += 24) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + H, H);
        ctx.stroke();
      }
    }

    _drawBoard(ctx) {
      const { originX, originY } = this.cfg.board;
      const size = this._cellSize;

      // Calculate bounding box from cell positions
      if (this.cells.length > 0) {
        let minX = this.cells[0].x, maxX = this.cells[0].x;
        let minY = this.cells[0].y, maxY = this.cells[0].y;
        this.cells.forEach(cell => {
          minX = Math.min(minX, cell.x);
          maxX = Math.max(maxX, cell.x);
          minY = Math.min(minY, cell.y);
          maxY = Math.max(maxY, cell.y);
        });

        // Board frame (with padding)
        const boardW = maxX - minX + size;
        const boardH = maxY - minY + size;
        this.ui.drawPanel(ctx, originX + minX - size / 2 - 8, originY + minY - size / 2 - 8, boardW + 16, boardH + 16, {
          bgColor: 'rgba(0,0,0,0.55)',
          borderColor: '#2a4060',
          borderWidth: 2,
          radius: 6,
        });
      }

      // Cells
      this.cells.forEach(cell => {
        const { x, y } = this._toPixel(cell);
        // Cell sprite origin is centered on its 64×64 frame, so drawing
        // at the cell's center coordinate aligns the tile perfectly.
        cell.animator.draw(ctx, x, y);

        // Owner ring on properties
        if (cell.type === 'property' && cell.ownerIndex >= 0) {
          const owner = this.players[cell.ownerIndex];
          ctx.strokeStyle = owner.color;
          ctx.lineWidth   = 3;
          ctx.strokeRect(x - size / 2 + 5, y - size / 2 + 5, size - 10, size - 10);
        }

        // Highlight cells the current player can move to during MOVE stage
        if (this.gameState === GAME_STATE.PLAYING &&
            this.turn.stage === TURN_STAGE.MOVE &&
            this.currentPlayer.currentCell.neighbors().includes(cell)) {
          ctx.save();
          ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(performance.now() / 250));
          ctx.strokeStyle = '#ffe978';
          ctx.lineWidth   = 2;
          ctx.strokeRect(x - size / 2 + 2, y - size / 2 + 2, size - 4, size - 4);
          ctx.restore();
        }
      });
    }

    _drawTokens(ctx) {
      this.players.forEach(p => {
        if (!p.currentCell) return;
        const { x, y } = this._toPixel(p.currentCell);
        p.animator.draw(ctx, x + p.moveOffset.x, y + p.moveOffset.y + 8);
      });
    }

    _drawHUD(ctx, W, H) {
      const UI = this.ui;
      const panelX = 560;
      const panelY = 80;
      const panelW = W - panelX - 16;

      UI.drawPanel(ctx, panelX, panelY, panelW, 280, {
        bgColor: 'rgba(0,0,0,0.65)',
        borderColor: '#2a4060', borderWidth: 2, radius: 6,
      });

      UI.drawText(ctx, 'PLAYERS', panelX + 14, panelY + 10,
        { font: 'bold 14px monospace', color: '#9fc8ff' });

      const lineH = 56;
      this.players.forEach((p, i) => {
        const lineY = panelY + 36 + i * lineH;
        const isCurrent = (i === this.currentPlayerIndex && this.gameState === GAME_STATE.PLAYING);

        // Active row highlight
        if (isCurrent) {
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fillRect(panelX + 4, lineY - 4, panelW - 8, lineH - 6);
          ctx.fillStyle = p.color;
          ctx.fillRect(panelX + 4, lineY - 4, 4, lineH - 6);
        }

        // Token preview (mini sprite)
        ctx.save();
        ctx.translate(panelX + 28, lineY + 26);
        ctx.scale(0.65, 0.65);
        this.sprites.drawFrame(ctx, p.spriteName, 'idle', 0, 0, 0, false);
        ctx.restore();

        // Name + bankrupt marker
        const nameLabel = `${p.name}${p.isBankrupt ? ' (bankrupt)' : ''}`;
        UI.drawText(ctx, nameLabel, panelX + 60, lineY,
          { font: 'bold 14px monospace', color: p.color, shadow: true });

        UI.drawText(ctx, `Cash: $${p.money}`, panelX + 60, lineY + 16,
          { font: '12px monospace', color: '#cdd6e0' });
        UI.drawText(ctx, `Property: ${p.ownedCells.length}    Total: $${p.totalValue}`,
          panelX + 60, lineY + 30,
          { font: '12px monospace', color: '#9aa5b1' });
      });

      // ── Event log panel ──
      const logY = panelY + 296;
      UI.drawPanel(ctx, panelX, logY, panelW, H - logY - 16, {
        bgColor: 'rgba(0,0,0,0.65)',
        borderColor: '#2a4060', borderWidth: 2, radius: 6,
      });
      UI.drawText(ctx, 'LOG', panelX + 14, logY + 10,
        { font: 'bold 14px monospace', color: '#9fc8ff' });

      this.eventLog.forEach((msg, i) => {
        UI.drawText(ctx, msg, panelX + 14, logY + 32 + i * 16,
          { font: '11px monospace', color: i === this.eventLog.length - 1 ? '#ffffff' : '#9aa5b1' });
      });

      // ── Top bar — round / turn / win condition ──
      UI.drawPanel(ctx, 16, 16, W - 32, 52, {
        bgColor: 'rgba(0,0,0,0.6)',
        borderColor: '#2a4060', borderWidth: 2, radius: 6,
      });

      const cur = this.currentPlayer;
      if (cur) {
        UI.drawText(ctx, `Turn: ${cur.name}`, 32, 30,
          { font: 'bold 18px monospace', color: cur.color, shadow: true });
      }
      const w = this.cfg.win;
      UI.drawText(ctx, `Win: ${w.type} ≥ ${w.target}`, W / 2, 30,
        { font: '14px monospace', color: '#cdd6e0', align: 'center', shadow: true });

      const stageStr = this.turn.stage ? this.turn.stage : '-';
      UI.drawText(ctx, `Stage: ${stageStr}`, W - 32, 30,
        { font: '14px monospace', color: '#9aa5b1', align: 'right', shadow: true });
    }

    _drawDie(ctx, W, H) {
      // Die is visible from ROLL through CONFIRM_LAND so the player can see
      // the rolled value while choosing how to spend it.
      const stage = this.turn.stage;
      const visibleStages = [
        TURN_STAGE.ROLL, TURN_STAGE.MOVE, TURN_STAGE.CONFIRM_LAND,
      ];
      if (!visibleStages.includes(stage)) return;
      const dieX = 280;
      const dieY = H - 60;
      this.ui.drawPanel(ctx, dieX - 36, dieY - 36, 72, 72, {
        bgColor: 'rgba(0,0,0,0.55)',
        borderColor: '#2a4060', borderWidth: 1, radius: 6,
      });
      this.die.draw(ctx, dieX, dieY);
    }

    _drawMenuOverlay(ctx, W, H) {
      if (!this.menu.visible) return;
      const UI = this.ui;
      const opts = this.menu.options;
      const optH = 28;
      const w    = 320;
      const h    = 56 + opts.length * optH;
      const x    = (W / 2) - w / 2;
      const y    = (H / 2) - h / 2;

      UI.drawPanel(ctx, x, y, w, h, {
        bgColor: 'rgba(10,15,25,0.92)',
        borderColor: '#7796c4', borderWidth: 2, radius: 8,
      });

      UI.drawText(ctx, this.menu.title, x + w / 2, y + 12,
        { font: 'bold 18px monospace', color: '#ffffff', align: 'center', shadow: true });

      opts.forEach((opt, i) => {
        const oy = y + 44 + i * optH;
        if (i === this.menu.index) {
          ctx.fillStyle = 'rgba(120,160,220,0.25)';
          ctx.fillRect(x + 8, oy - 4, w - 16, optH - 4);
        }
        const prefix = i === this.menu.index ? '> ' : '  ';
        UI.drawText(ctx, prefix + opt.label, x + 24, oy,
          { font: '14px monospace',
            color: i === this.menu.index ? '#ffffff' : '#bcd0e8' });
      });

      UI.drawText(ctx, '↑↓ select   Enter confirm', x + w / 2, y + h - 18,
        { font: '11px monospace', color: '#7793b8', align: 'center' });
    }

    _drawMenu(ctx, W, H) {
      const UI = this.ui;
      // Title
      UI.drawText(ctx, 'A C C A', W / 2, H * 0.18,
        { font: 'bold 64px monospace', color: '#ffffff',
          align: 'center', shadow: true,
          glow: '#5a8ed1', glowBlur: 22,
          stroke: '#2a4060', strokeWidth: 3 });
      UI.drawText(ctx, 'a board game of property & power', W / 2, H * 0.18 + 56,
        { font: '15px monospace', color: '#9fc8ff', align: 'center' });

      // Player count selector
      const cy = H * 0.5;
      UI.drawPanel(ctx, W / 2 - 220, cy - 50, 440, 100, {
        bgColor: 'rgba(0,0,0,0.55)',
        borderColor: '#2a4060', borderWidth: 2, radius: 6,
      });
      UI.drawText(ctx, 'PLAYERS', W / 2, cy - 36,
        { font: 'bold 14px monospace', color: '#9fc8ff', align: 'center' });
      UI.drawText(ctx, `<  ${this.menuPlayerCount}  >`, W / 2, cy - 8,
        { font: 'bold 36px monospace', color: '#ffffff', align: 'center', shadow: true });
      UI.drawText(ctx, '← → adjust', W / 2, cy + 30,
        { font: '12px monospace', color: '#7793b8', align: 'center' });

      // Token preview row for selected count
      const tokenY = H * 0.7;
      const spacing = 60;
      const startX = W / 2 - ((this.menuPlayerCount - 1) * spacing) / 2;
      for (let i = 0; i < this.menuPlayerCount; i++) {
        const def = this.cfg.players[i];
        ctx.save();
        ctx.translate(startX + i * spacing, tokenY);
        ctx.scale(1.2, 1.2);
        this.sprites.drawFrame(ctx, def.sprite, 'idle',
          Math.floor(performance.now() / 250) % 4, 0, 0, false);
        ctx.restore();
      }

      // Start prompt
      const blink = Math.floor(performance.now() / 500) % 2;
      if (blink) {
        UI.drawText(ctx, 'PRESS ENTER TO START', W / 2, H - 60,
          { font: 'bold 18px monospace', color: '#ffffff',
            align: 'center', glow: '#aac8ff', glowBlur: 8 });
      }

      // Controls hint
      UI.drawText(ctx, 'Arrow keys to move on the board · Enter to confirm',
        W / 2, H - 30,
        { font: '11px monospace', color: '#5e7898', align: 'center' });
    }

    _drawGameOver(ctx, W, H) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);

      const winner = this.winner;
      this.ui.drawText(ctx, `${winner.name.toUpperCase()} WINS!`, W / 2, H / 2 - 40,
        { font: 'bold 44px monospace', color: winner.color,
          align: 'center', glow: winner.color, glowBlur: 20,
          stroke: '#000000', strokeWidth: 3, shadow: true });

      this.ui.drawText(ctx, `Final cash: $${winner.money}     Total value: $${winner.totalValue}`,
        W / 2, H / 2 + 16,
        { font: '16px monospace', color: '#cdd6e0', align: 'center' });

      const blink = Math.floor(performance.now() / 600) % 2;
      if (blink) {
        this.ui.drawText(ctx, 'Press Enter to return to menu', W / 2, H - 60,
          { font: 'bold 16px monospace', color: '#ffffff', align: 'center', shadow: true });
      }
    }
  }

  // -- Bootstrap --
  // Fetch config.json to discover the map path, then fetch and store the map
  // data on GF.mapData before the game object is created.

  async function init() {
    try {
      const mapPath = GF.GAME_CONFIG.board.map;
      const mapRes  = await fetch(mapPath);
      GF.mapData    = await mapRes.json();
    } catch (e) {
      console.error('[Acca] Failed to load map data:', e);
    }

    const game = new AccaGame();
    game.start();
    window._accaGame = game; // expose for debugging
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window.GF = window.GF || {});
