// games/Acca/AccaGame.js
// Top-level orchestrator. Holds the engine, the menus, the players & cells,
// and instantiates every manager / system / renderer. The heavy lifting lives
// in the focused modules under core/, managers/, render/, ui/, systems/.
//
// Responsibilities of this file:
//   • Wire engine + sprites + input bindings.
//   • Construct managers and renderers and store them on the instance so
//     other modules can reach across (e.g. TurnManager → economy.runEndOfTurn).
//   • Implement the small game-wide helpers other modules call: log(),
//     netWorth(), movePlayerTo(), checkMayor(), the menu state.
//   • Drive the per-frame _update / _render via engine.onUpdate/onRender.

(function (GF) {
  'use strict';
  const A = GF.Acca = GF.Acca || {};

  class AccaGame {
    constructor() {
      const cfg = GF.GAME_CONFIG;
      this.cfg  = cfg;

      const { engine, sprites, physics, ui } = GF.createGame(cfg.engine, cfg.physics);
      this.engine  = engine;
      this.sprites = sprites;
      this.physics = physics;
      this.ui      = ui;

      if (GF.sprites) sprites.registerSprites(GF.sprites);

      const ctl = cfg.controls;
      Object.entries(ctl).forEach(([action, codes]) => engine.input.bind(action, ...codes));

      // ── State ─────────────────────────────────────────────────────────
      this.gameState           = A.GAME_STATE.MENU;
      this.players             = [];
      this.currentPlayerIndex  = 0;
      this.cells               = [];
      this.eventLog            = [];
      this.lastRoll            = 0;
      this.winner              = null;
      this.menuPlayerCount     = cfg.numberOfPlayers;
      this.cooperativeThreat   = 0;
      this.turnCounter         = 0;
      this._betweenTurnsTimer  = 0;
      this._zoomOutTimer       = 0;   // seconds until camera zooms out after end-of-turn

      // Camera state (zoom + pan).
      this._camera = {
        scale: 1, cx: 0, cy: 0,
        targetScale: 1, targetCx: 0, targetCy: 0,
        boardCenter: { x: 0, y: 0 },
        zoomedOutScale: 1,
      };

      // ── Core controllers ─────────────────────────────────────────────
      this.die        = new A.DieController(sprites);
      this.menu       = new A.Menu(engine.input, ctl);
      this.movement   = new A.MovementController(engine.input, ctl, engine.events, this);

      // ── Managers ──────────────────────────────────────────────────────
      this.boardLoader = new A.BoardLoader(this);
      this.structures  = new A.StructureManager(this);
      this.economy     = new A.EconomyManager(this);
      this.camera      = new A.CameraManager(this);
      this.win         = new A.WinConditionChecker(this);

      // Optional Acca-namespace systems (loaded by separate <script> tags).
      this.marketSys     = A.MarketSystem     ? new A.MarketSystem(cfg, engine.events) : null;
      this.districtSys   = A.DistrictSystem   ? new A.DistrictSystem(cfg, engine.events) : null;
      this.populationSys = (A.PopulationSystem && this.districtSys)
        ? new A.PopulationSystem(cfg, engine.events, this.districtSys) : null;
      this.tradeSys      = A.TradeSystem      ? new A.TradeSystem(cfg, engine.events, this.districtSys) : null;
      this.chanceSys     = A.ChanceSystem     ? new A.ChanceSystem(cfg, engine.events, {
        districtSystem: this.districtSys,
        getLeader:        () => this.win.leader(),
        getLowestCash:    () => this.win.lowestCash(),
        sabotageProperty: (s, dur) => { s.sabotagedUntilTurn = (this.turnCounter || 0) + dur; },
        grantFreeStructure: (player) => this.win.grantRandomStructure(player),
      }) : null;

      this.turn = new A.TurnManager(this);

      // ── Renderers ─────────────────────────────────────────────────────
      this.boardRenderer    = new A.BoardRenderer(this);
      this.overlayRenderer  = new A.OverlayRenderer(this);
      this.hud              = new A.HUDRenderer(this);

      // ── Engine event listeners ────────────────────────────────────────
      engine.events.on('district:mayorChanged', ({ district, oldMayor, newMayor }) => {
        if (oldMayor >= 0 && this.players[oldMayor]) {
          this.players[oldMayor].districtsMayoredOf.delete(district.id);
          this.log(`${this.players[oldMayor].name} lost mayorship of ${district.id}.`);
        }
        if (newMayor >= 0 && this.players[newMayor]) {
          this.players[newMayor].districtsMayoredOf.add(district.id);
          this.log(`${this.players[newMayor].name} is now Mayor of ${district.id}!`);
        }
      });
      engine.events.on('district:taxesPaid', ({ district, mayor, amount }) =>
        this.log(`${mayor.name} collected $${amount} taxes from ${district.id}.`));
      engine.events.on('market:priceChanged', ({ resource, oldPrice, newPrice }) => {
        const ratio = (newPrice - oldPrice) / Math.max(1, oldPrice);
        if (Math.abs(ratio) >= 0.25) {
          this.log(`Market: ${resource} ${oldPrice}→${newPrice}.`);
        }
      });
      engine.events.on('business:sabotaged', ({ structure, attacker }) =>
        this.log(`Sabotage on ${structure.type}${attacker ? ' by ' + attacker.name : ''}.`));

      // ── DOM HUD references ────────────────────────────────────────────
      this.dom = {
        container        : document.getElementById('gameContainer'),
        tbTurn           : document.getElementById('tb-turn'),
        tbName           : document.getElementById('tb-name'),
        tbBankruptBadge  : document.getElementById('tb-bankrupt-badge'),
        tbMoney          : document.getElementById('tb-money'),
        tbNetWorth       : document.getElementById('tb-networth'),
        tbResources      : document.getElementById('tb-resources'),
        notifications    : document.getElementById('notifications'),
        playerList       : document.getElementById('playerList'),
        districtList     : document.getElementById('districtList'),
      };

      engine.onUpdate((dt) => this._update(dt));
      engine.onRender((ctx) => this._render(ctx));
    }

    start() { this.engine.start(); }

    // ── Public game-wide helpers ────────────────────────────────────────
    log(message) {
      this.eventLog.push(message);
      // Cap raised so the in-game "Game log" panel can surface a useful history.
      // Notifications panel slices the last 12, so the visible HUD doesn't change.
      const CAP = 500;
      if (this.eventLog.length > CAP) {
        this.eventLog.splice(0, this.eventLog.length - CAP);
      }
    }

    get currentPlayer() { return this.players[this.currentPlayerIndex]; }

    /** Net worth = cash + structure currentValues + vault stored money +
     *  resources at sell-spread market price. Resources count at sell-spread
     *  (not buy-side base price) to close the never-build NW exploit
     *  identified in v1 playtest. */
    netWorth(p) {
      let nw = p.money;
      p.ownedStructures.forEach(s => {
        nw += s.currentValue;
        if (s.type === 'vault') nw += (s.storedMoney || 0);
      });
      const prices = this.cfg.market.basePrices;
      const spread = (this.cfg.market && this.cfg.market.sellSpread) || 1;
      Object.entries(p.resources).forEach(([res, qty]) => {
        nw += (prices[res] || 0) * spread * qty;
      });
      return Math.round(nw);
    }

    movePlayerTo(player, cell) {
      this.engine.events.emit('cell:leave', { player, cell: player.currentCell });
      player.currentCell = cell;
      this.engine.events.emit('cell:enter', { player, cell, final: true });
    }

    checkMayor(player, districtId) {
      if (this.districtSys) this.districtSys.recomputeMayor(districtId);
    }

    // ── Game lifecycle ──────────────────────────────────────────────────
    _beginGame() {
      this.boardLoader.load();
      this._initPlayers();

      // Build per-district state once we know cells.
      if (this.districtSys) {
        const districtsMeta = (GF.mapData && GF.mapData.districts) || [];
        this.districtSys.init(this.cells, districtsMeta);
        this.districtSys.list().forEach(d => {
          d.population = Math.round((this.cfg.district.defaultPopulation || 30) * Math.max(1, d.cells.length / 3));
        });
      }

      this.turnCounter        = 0;
      this.cooperativeThreat  = 0;
      this.eventLog           = [];
      this.hud.resetSignatures();
      this.log('Game started.');
      this.gameState = A.GAME_STATE.PLAYING;

      // Snap to zoomed-out view first, then turn start zooms in.
      this.camera.zoomOutToBoard();
      this.camera.snap();
      this.turn.startTurn(this.currentPlayer);
    }

    _initPlayers() {
      this.players = [];
      // Pick the spawn cell: map's spawnCellId wins; fall back to first bank cell.
      let startCell = null;
      const spawnId = (GF.mapData && GF.mapData.spawnCellId !== undefined && GF.mapData.spawnCellId !== null)
        ? GF.mapData.spawnCellId : null;
      if (spawnId !== null) {
        startCell = this.cells.find(c => c.id === spawnId) || null;
      }
      if (!startCell) startCell = this.cells.find(c => c.type === 'bank') || this.cells[0];

      const count = Math.min(this.menuPlayerCount, this.cfg.players.length);
      const startRes = this.cfg.startingResources || {};
      for (let i = 0; i < count; i++) {
        const def = this.cfg.players[i];
        const p = new A.Player(i, def, startCell, this.cfg.startingMoney, this.sprites);
        Object.entries(startRes).forEach(([r, q]) => { p.resources[r] = q; });
        const offsets = [
          { x: -10, y: -6 }, { x:  10, y: -6 },
          { x: -10, y:  6 }, { x:  10, y:  6 },
        ];
        p.moveOffset = offsets[i] || { x: 0, y: 0 };
        this.players.push(p);
      }
      this.currentPlayerIndex = 0;
    }

    _beginBetweenTurns() {
      // Hold the camera zoomed in long enough for money animations to play out,
      // then zoom out and hold the board view for betweenTurnsHold seconds.
      // MoneyAnimations.FLOAT_LIFETIME_MS is the floating-text lifetime (ms).
      const animHoldSec = (A.MoneyAnimations && A.MoneyAnimations.FLOAT_LIFETIME_MS)
        ? A.MoneyAnimations.FLOAT_LIFETIME_MS / 1000
        : 1.7;
      this._zoomOutTimer      = animHoldSec;
      this._betweenTurnsTimer = animHoldSec + this.cfg.camera.betweenTurnsHold;
    }

    _advanceToNextPlayer() {
      for (let i = 1; i <= this.players.length; i++) {
        const idx = (this.currentPlayerIndex + i) % this.players.length;
        if (!this.players[idx].isBankrupt) {
          this.currentPlayerIndex = idx;
          break;
        }
      }
      const winner = this.win.check();
      if (winner) {
        this.winner    = winner;
        this.gameState = A.GAME_STATE.GAME_OVER;
        this.log(`Game Over — ${winner.name} wins!`);
        return;
      }
      this.turn.startTurn(this.currentPlayer);
    }

    // ── Per-frame ───────────────────────────────────────────────────────
    _update(dt) {
      this.cells.forEach(c => c.animator && c.animator.update(dt));
      this.players.forEach(p => p.animator.update(dt));
      this.die.update(dt);
      this.menu.update();
      this.camera.update(dt);

      switch (this.gameState) {
        case A.GAME_STATE.MENU:
          this._updateMenu();
          break;

        case A.GAME_STATE.PLAYING:
          if (this.turn.stage === A.TURN_STAGE.BETWEEN) {
            this._betweenTurnsTimer -= dt;
            // Zoom out only after the money animation window has elapsed.
            if (this._zoomOutTimer > 0) {
              this._zoomOutTimer -= dt;
              if (this._zoomOutTimer <= 0) this.camera.zoomOutToBoard();
            }
            if (this._betweenTurnsTimer <= 0) {
              this._advanceToNextPlayer();
            }
          } else {
            this.movement.update(dt);
          }
          this.hud.render();
          break;

        case A.GAME_STATE.GAME_OVER:
          if (this.engine.input.wasPressed('confirm')) {
            this.gameState = A.GAME_STATE.MENU;
            this.menuPlayerCount = this.cfg.numberOfPlayers;
            this.hud.resetSignatures();
          }
          break;
      }
    }

    _updateMenu() {
      const inp = this.engine.input;
      if (inp.wasPressed('left'))    this.menuPlayerCount = Math.max(2, this.menuPlayerCount - 1);
      if (inp.wasPressed('right'))   this.menuPlayerCount = Math.min(this.cfg.players.length, this.menuPlayerCount + 1);
      if (inp.wasPressed('confirm')) this._beginGame();
    }

    _render(ctx) {
      const W = this.cfg.engine.width;
      const H = this.cfg.engine.height;

      this.overlayRenderer.drawBackground(ctx, W, H);

      switch (this.gameState) {
        case A.GAME_STATE.MENU:
          this.overlayRenderer.drawStartMenu(ctx, W, H);
          break;
        case A.GAME_STATE.PLAYING:
          this.boardRenderer.drawWorld(ctx, W, H);
          this.overlayRenderer.drawDie(ctx, W, H);
          this.overlayRenderer.drawMenuOverlay(ctx, W, H);
          break;
        case A.GAME_STATE.GAME_OVER:
          this.boardRenderer.drawWorld(ctx, W, H);
          this.overlayRenderer.drawGameOver(ctx, W, H);
          break;
      }
    }
  }

  // ── Bootstrap ────────────────────────────────────────────────────────
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
    window._accaGame = game; // debugging hook
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  A.AccaGame = AccaGame;

})(window.GF = window.GF || {});
