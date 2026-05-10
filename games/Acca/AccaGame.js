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

      // Apply persisted fast-roll preference before any roll executes.
      try {
        if (localStorage.getItem('acca_fast_roll') === '1') {
          cfg.turn.rollDuration = 0.4;
        }
      } catch (e) { /* ignore */ }

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
      // Phase 6 — per-slot CPU/Human types. Index 0 is always 'human' (the
      // local player). The selection menu lets the user toggle the rest.
      // Persisted in localStorage so the previous session's setup is the
      // default next time.
      this.menuPlayerTypes     = this._loadMenuPlayerTypes(cfg.players.length);
      this.menuSelectedSlot    = 1;       // currently-highlighted slot in the menu
      this.cooperativeThreat   = 0;
      // Bug E1 — phase grouping for the game log. The active phase entry (if
      // any) collects subsequent log() calls as bullet-points. null = no
      // phase active, log() pushes top-level entries.
      this._currentLogPhase    = null;
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
      this.theMan        = A.TheManNarrator   ? new A.TheManNarrator(this) : null;
      this.chanceSys     = A.ChanceSystem     ? new A.ChanceSystem(cfg, engine.events, {
        districtSystem: this.districtSys,
        getLeader:        () => this.win.leader(),
        getLowestCash:    () => this.win.lowestCash(),
        sabotageProperty: (s, dur) => { s.sabotagedUntilTurn = (this.turnCounter || 0) + dur; },
        grantFreeStructure: (player) => this.win.grantRandomStructure(player),
      }) : null;

      this.turn = new A.TurnManager(this);

      // CPU driver (Phase 6) — ticks each frame, takes over input when the
      // current player is CPU. Constructed unconditionally; it's a no-op
      // when no player has isCPU set.
      this.cpu = A.CpuDriver ? new A.CpuDriver(this) : null;

      // Audio cues — synthesised via WebAudio so the game ships with no
      // binary dependencies. SfxPlayer is a no-op if AudioContext can't be
      // created, so this is safe to call unconditionally.
      this.sfx = (A.SfxPlayer && cfg.audio)
        ? new A.SfxPlayer({ volume: cfg.audio.sfxVolume })
        : null;

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
          if (this.sfx) this.sfx.mayor();
        }
      });
      engine.events.on('district:taxesPaid', ({ district, mayor, amount }) =>
        this.log(`${mayor.name} collected $${amount} taxes from ${district.id}.`));
      // Audio cues — keyed off the canonical event names (property:built was
      // renamed from property:bought in this rebalance).
      engine.events.on('property:built', () => { if (this.sfx) this.sfx.build(); });
      this._turnPriceChanges = {};   // resource → { oldPrice, newPrice } for current turn
      engine.events.on('market:priceChanged', ({ resource, oldPrice, newPrice }) => {
        const ratio = (newPrice - oldPrice) / Math.max(1, oldPrice);
        if (Math.abs(ratio) >= 0.25) {
          this.log(`Market: ${resource} $${oldPrice}→$${newPrice}.`);
        }
        // Track cumulative change for this turn (keep earliest oldPrice).
        if (!this._turnPriceChanges[resource]) {
          this._turnPriceChanges[resource] = { oldPrice, newPrice };
        } else {
          this._turnPriceChanges[resource].newPrice = newPrice;
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
        priceReport      : document.getElementById('price-report'),
        priceReportTable : document.getElementById('price-report-table'),
      };

      engine.onUpdate((dt) => this._update(dt));
      engine.onRender((ctx) => this._render(ctx));

      // Map → district-list hover sync. Pointing at a cell on the board sets
      // the same _focusDistrictId the HUD row hover/click drives, so the
      // matching .dist-row picks up the .focused style and the on-map
      // dashed-outline pulse fires together. Skips when the user has pinned
      // a district by clicking a row — pinning is sticky on purpose.
      this._initMapHover();
    }

    start() { this.engine.start(); }

    // ── Public game-wide helpers ────────────────────────────────────────
    /** Append a log entry. Coalesces consecutive identical messages into a
     *  single entry with a count tail (×N) so heavy mayor turns don't drown
     *  the notification panel.
     *
     *  Bug E1 — when a phase is active (set via beginPhase/endPhase) the
     *  message becomes a sub-line of that phase's entry, producing
     *  "one entry per action" with bullet-points (e.g.
     *    Player 1 — turn start
     *      · Taxes - District D: $53
     *      · Shop income: $37
     *  ).
     *  Standalone entries (turn/msg/count) are still emitted when no phase
     *  is active, so log() callers from menu actions, chance events, etc. keep
     *  working unchanged.
     *
     *  Pass `{ noCoalesce: true }` to force a fresh row even when the message
     *  matches the previous one (used for one-shot events that should always
     *  show separately, e.g. mayor changes).
     *  Pass `{ standalone: true }` to bypass the active phase and create a
     *  top-level entry — used for cross-phase announcements. */
    log(message, opts) {
      const turn = (this.turnCounter || 0) + 1;
      const phase = (opts && opts.standalone) ? null : this._currentLogPhase;
      if (phase) {
        const lastLine = phase.lines[phase.lines.length - 1];
        if (lastLine && lastLine.msg === message && !(opts && opts.noCoalesce)) {
          lastLine.count = (lastLine.count || 1) + 1;
        } else {
          phase.lines.push({ msg: message, count: 1 });
        }
        this._capLog();
        return;
      }
      const last = this.eventLog[this.eventLog.length - 1];
      // Legacy coalescing only against single-line entries (phase entries
      // never coalesce against a flat msg).
      if (last && typeof last === 'object' && last.msg === message
          && !last.action && !(opts && opts.noCoalesce)) {
        last.count = (last.count || 1) + 1;
      } else {
        this.eventLog.push({ turn, msg: message, count: 1 });
      }
      this._capLog();
    }

    /** Trim the log to a fixed cap so very long sessions don't grow without
     *  bound. Phase entries count as one row each. */
    _capLog() {
      const CAP = 500;
      if (this.eventLog.length > CAP) {
        this.eventLog.splice(0, this.eventLog.length - CAP);
      }
    }

    /** Bug E1 — start a new "action" entry. Subsequent log() calls become
     *  bullet-points under it until endPhase() is called or another phase
     *  begins. Returns the phase entry so callers can decorate it. */
    beginPhase(label, opts) {
      this.endPhase();
      const turn = (this.turnCounter || 0) + 1;
      const entry = { turn, action: label, lines: [] };
      if (opts && opts.meta) entry.meta = opts.meta;
      this.eventLog.push(entry);
      this._currentLogPhase = entry;
      this._capLog();
      return entry;
    }

    /** End the active phase. Empty phases (no lines) are pruned so the log
     *  doesn't fill with no-op headers (e.g. a "rolling" phase a player
     *  blasted through with nothing notable to record). */
    endPhase() {
      const cur = this._currentLogPhase;
      this._currentLogPhase = null;
      if (!cur) return;
      if (!cur.lines || cur.lines.length === 0) {
        const i = this.eventLog.lastIndexOf(cur);
        if (i >= 0) this.eventLog.splice(i, 1);
      }
    }

    /** Return the displayable string for a log entry. Old saves may store
     *  raw strings; new entries are either single-message objects (msg/count)
     *  or phase entries (action/lines).
     *
     *  For phase entries this returns the header line; the lines[] array
     *  must be rendered separately by callers that want bullet sub-rows. */
    static logText(entry) {
      if (!entry) return '';
      if (typeof entry === 'string') return entry;
      if (entry.action) {
        // Compact representation for single-row consumers (notifications panel).
        if (entry.lines && entry.lines.length > 0) {
          const last = entry.lines[entry.lines.length - 1];
          const tail = last && last.msg ? ` — ${last.msg}` : '';
          return `${entry.action}${tail}`;
        }
        return entry.action;
      }
      return entry.count > 1 ? `${entry.msg} (×${entry.count})` : entry.msg;
    }

    get currentPlayer() { return this.players[this.currentPlayerIndex]; }

    /** Net worth = cash + structure currentValues + vault stored money +
     *  resources valued at the current market price (no buy/sell spread —
     *  the stocks-and-flows market closes the never-build exploit by moving
     *  the price as the pool changes, so off-market hoards don't trade for
     *  more than they actually clear at). */
    netWorth(p) {
      let nw = p.money;
      p.ownedStructures.forEach(s => {
        nw += s.currentValue;
        if (s.type === 'vault') nw += (s.storedMoney || 0);
      });
      const M = this.marketSys;
      const fallback = (this.cfg.market && this.cfg.market.basePrices) || {};
      Object.entries(p.resources).forEach(([res, qty]) => {
        const price = M ? M.priceOf(res) : (fallback[res] || 0);
        nw += price * qty;
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
      this._currentLogPhase   = null;
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
        const def = Object.assign({}, this.cfg.players[i],
          { isCPU: (this.menuPlayerTypes[i] === 'cpu') });
        const p = new A.Player(i, def, startCell, this.cfg.startingMoney, this.sprites, this);
        Object.entries(startRes).forEach(([r, q]) => { p.resources[r] = q; });
        const offsets = [
          { x: -10, y: -6 }, { x:  10, y: -6 },
          { x: -10, y:  6 }, { x:  10, y:  6 },
        ];
        p.moveOffset = offsets[i] || { x: 0, y: 0 };
        this.players.push(p);
      }
      // Random starting player + per-round rotation removes the slot-N
      // last-mover advantage observed in the 10-game playtest (P4 won 6/10).
      // _firstPlayerForRound is the index of the player who acts first this
      // round; the round counter increments each time the cycle wraps.
      this.currentPlayerIndex   = Math.floor(Math.random() * count);
      this._firstPlayerForRound = this.currentPlayerIndex;
      this._roundCounter        = 0;
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
      this._showPriceReport();
    }

    _showPriceReport() {
      const dom = this.dom;
      if (!dom.priceReport || !dom.priceReportTable || !this.marketSys) return;
      const resources = (this.cfg.market && this.cfg.market.resources) || [];
      const changes   = this._turnPriceChanges || {};

      dom.priceReportTable.innerHTML = '';
      resources.forEach(r => {
        const price     = this.marketSys.priceOf(r);
        const changed   = changes[r];
        const oldPrice  = changed ? changed.oldPrice : price;
        const delta     = price - oldPrice;
        const pct       = oldPrice > 0 ? Math.round((delta / oldPrice) * 100) : 0;

        const row = document.createElement('div');
        row.className = 'pr-row' + (changed ? ' pr-changed' : '');

        const name  = document.createElement('span');
        name.className = 'pr-name';
        name.textContent = r;

        const priceEl = document.createElement('span');
        priceEl.className = 'pr-price';
        priceEl.textContent = `$${price}`;

        const deltaEl = document.createElement('span');
        if (!changed || delta === 0) {
          deltaEl.className = 'pr-delta flat';
          deltaEl.textContent = '—';
        } else if (delta > 0) {
          deltaEl.className = 'pr-delta up';
          deltaEl.textContent = `▲ +${pct}%`;
        } else {
          deltaEl.className = 'pr-delta down';
          deltaEl.textContent = `▼ ${pct}%`;
        }

        row.appendChild(name);
        row.appendChild(priceEl);
        row.appendChild(deltaEl);
        dom.priceReportTable.appendChild(row);
      });

      dom.priceReport.classList.add('visible');
    }

    _hidePriceReport() {
      if (this.dom.priceReport) this.dom.priceReport.classList.remove('visible');
      this._turnPriceChanges = {};
    }

    _advanceToNextPlayer() {
      this._hidePriceReport();
      const prevIdx = this.currentPlayerIndex;
      for (let i = 1; i <= this.players.length; i++) {
        const idx = (this.currentPlayerIndex + i) % this.players.length;
        if (!this.players[idx].isBankrupt) {
          this.currentPlayerIndex = idx;
          break;
        }
      }
      // Round-robin starting position: when the cycle wraps back to (or past)
      // _firstPlayerForRound, advance the round and rotate the lead. Removes
      // the last-mover advantage Player 4 enjoyed in the playtest baseline.
      const cycledThroughLead =
        (prevIdx >= this._firstPlayerForRound &&
         this.currentPlayerIndex < this._firstPlayerForRound) ||
        (prevIdx <  this._firstPlayerForRound &&
         this.currentPlayerIndex >= this._firstPlayerForRound &&
         this.currentPlayerIndex < prevIdx);
      if (cycledThroughLead) {
        this._roundCounter++;
        this._firstPlayerForRound = (this._firstPlayerForRound + 1) % this.players.length;
        // Skip bankrupt players when picking the next round's lead.
        let safety = this.players.length;
        while (this.players[this._firstPlayerForRound].isBankrupt && safety-- > 0) {
          this._firstPlayerForRound = (this._firstPlayerForRound + 1) % this.players.length;
        }
      }
      // Auto-save once per completed round.
      if (cycledThroughLead && GF.Acca && GF.Acca.Save) {
        try {
          if (GF.Acca.Save.save(this)) this._flashAutoSave();
        } catch (e) { /* save failures are non-fatal */ }
      }
      const winner = this.win.check();
      if (winner) {
        this.winner    = winner;
        this.gameState = A.GAME_STATE.GAME_OVER;
        this.log(`Game Over — ${winner.name} wins!`);
        if (this.sfx) this.sfx.victory();
        if (this.engine && this.engine.events) {
          this.engine.events.emit('game:won', { winner });
        }
        return;
      }
      this.turn.startTurn(this.currentPlayer);
    }

    /** Briefly flash a "Saved" indicator in the topbar after an auto-save.
     *  Pure DOM — no canvas churn. */
    _flashAutoSave() {
      let el = document.getElementById('tb-autosave');
      if (!el) {
        const tb = document.getElementById('topbar');
        if (!tb) return;
        el = document.createElement('div');
        el.id = 'tb-autosave';
        el.className = 'tb-autosave';
        el.textContent = 'Saved';
        tb.appendChild(el);
      }
      el.classList.remove('show');
      // Force reflow so the animation can re-trigger on rapid auto-saves.
      // eslint-disable-next-line no-unused-expressions
      void el.offsetWidth;
      el.classList.add('show');
    }

    /** Wire mousemove/leave on the engine canvas. Two responsibilities:
     *
     *  Bug I2 — hovering a cell on the board highlights its district in the
     *  right-hand list (HUD reads `_focusDistrictId`) WITHOUT moving the
     *  camera. Camera follow is now gated on `_focusDistrictPinned` in
     *  CameraManager, so the hover side-effect is purely visual list
     *  highlighting.
     *
     *  Bug I1 — the mouse position drives a camera pan on top of the active
     *  player-follow target. The camera reads `_mousePosition` during its
     *  update tick and shifts the target by the mouse's offset from canvas
     *  centre (capped by config). Skipped while pinned/in map view/over a
     *  menu so the manual focus is preserved. */
    _initMapHover() {
      const canvas = this.engine && this.engine.canvas;
      if (!canvas) return;

      const updateFromEvent = (e) => {
        if (this.gameState !== A.GAME_STATE.PLAYING) return;
        if (!this.cells || this.cells.length === 0) return;
        if (typeof this._toPixel !== 'function' || !this._cellSize) return;

        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        // Client → internal canvas coords (the canvas is CSS-scaled).
        const sx = (e.clientX - rect.left) * (canvas.width  / rect.width);
        const sy = (e.clientY - rect.top)  * (canvas.height / rect.height);

        // Bug I1 — record the screen-space mouse position so CameraManager
        // can apply a mouse-driven pan. Cleared on mouseleave so the camera
        // re-centres on the player when the mouse exits the canvas.
        this._mousePosition = { sx, sy };

        if (this._focusDistrictPinned) return;

        // Internal canvas coords → world coords. The board renderer applies:
        //   translate(W/2, H/2); scale(cam.scale); translate(-cam.cx, -cam.cy)
        // so the inverse is the obvious one.
        const W = this.cfg.engine.width, H = this.cfg.engine.height;
        const cam = this._camera;
        const wx = (sx - W / 2) / cam.scale + cam.cx;
        const wy = (sy - H / 2) / cam.scale + cam.cy;

        // Find the nearest cell whose square contains the cursor. Cells are
        // free-form (not a regular grid on Denmark-style maps), so a linear
        // scan is the simple correct option — only a few hundred cells.
        const half = this._cellSize / 2;
        let bestId = null, bestDist = Infinity;
        for (const c of this.cells) {
          const px = this._toPixel(c);
          const dx = wx - px.x, dy = wy - px.y;
          if (Math.abs(dx) > half || Math.abs(dy) > half) continue;
          const d2 = dx * dx + dy * dy;
          if (d2 < bestDist) {
            bestDist = d2;
            bestId   = c.district || null;
          }
        }
        // Only assign when the value actually changes — avoids needless HUD
        // signature churn during long mouse drags inside one district.
        if (bestId !== this._focusDistrictId) {
          this._focusDistrictId = bestId;
        }
      };

      canvas.addEventListener('mousemove', updateFromEvent);
      canvas.addEventListener('mouseleave', () => {
        // Drop the mouse-pan offset so the camera snaps back to the player.
        this._mousePosition = null;
        if (this._focusDistrictPinned) return;
        if (this._focusDistrictId !== null) this._focusDistrictId = null;
      });
    }

    // ── Per-frame ───────────────────────────────────────────────────────
    _update(dt) {
      this.cells.forEach(c => c.animator && c.animator.update(dt));
      this.players.forEach(p => p.animator.update(dt));
      this.die.update(dt);
      this.menu.update();
      this.camera.update(dt);
      // Phase 6 — CPU driver runs after menu.update so it sees the post-input
      // menu state. The driver no-ops when the current player isn't CPU.
      if (this.cpu) this.cpu.update(dt);

      switch (this.gameState) {
        case A.GAME_STATE.MENU:
          this._updateMenu();
          break;

        case A.GAME_STATE.PLAYING:
          if (this.engine.input.wasPressed('mapView')) this.camera.toggleMapView();
          if (this.engine.input.wasPressed('zoomIn'))  this.camera.zoomIn();
          if (this.engine.input.wasPressed('zoomOut')) this.camera.zoomOut();
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
          // Enter → Replay (same player count, fresh board);
          // Escape → Main menu (player-count picker).
          if (this.engine.input.wasPressed('confirm')) {
            this.hud.resetSignatures();
            this._beginGame();
          } else if (this.engine.input.wasPressed('cancel')) {
            this.gameState = A.GAME_STATE.MENU;
            this.menuPlayerCount = this.cfg.numberOfPlayers;
            this.hud.resetSignatures();
          }
          break;
      }
    }

    _updateMenu() {
      const inp = this.engine.input;
      // Left/right adjusts player count.
      if (inp.wasPressed('left'))    this.menuPlayerCount = Math.max(2, this.menuPlayerCount - 1);
      if (inp.wasPressed('right'))   this.menuPlayerCount = Math.min(this.cfg.players.length, this.menuPlayerCount + 1);
      // Up/down moves the highlighted slot.
      if (inp.wasPressed('up'))   this.menuSelectedSlot = Math.max(0, this.menuSelectedSlot - 1);
      if (inp.wasPressed('down')) this.menuSelectedSlot = Math.min(this.menuPlayerCount - 1, this.menuSelectedSlot + 1);
      // Clamp slot to current count when count shrinks.
      if (this.menuSelectedSlot >= this.menuPlayerCount) this.menuSelectedSlot = this.menuPlayerCount - 1;
      // Tab / KeyT toggles human/CPU on the highlighted slot. Slot 0 stays
      // human (the local player); other slots cycle. Persisted to localStorage.
      if (inp.wasPressed('KeyT') || inp.wasPressed('Tab')) {
        const i = this.menuSelectedSlot;
        if (i > 0) {
          this.menuPlayerTypes[i] = (this.menuPlayerTypes[i] === 'cpu') ? 'human' : 'cpu';
          this._saveMenuPlayerTypes();
        }
      }
      if (inp.wasPressed('confirm')) this._beginGame();
    }

    _loadMenuPlayerTypes(maxSlots) {
      const types = new Array(maxSlots).fill('human');
      try {
        const raw = localStorage.getItem('acca_player_types');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            for (let i = 0; i < Math.min(parsed.length, maxSlots); i++) {
              types[i] = (parsed[i] === 'cpu' && i > 0) ? 'cpu' : 'human';
            }
          }
        }
      } catch (e) { /* localStorage unavailable */ }
      types[0] = 'human';
      return types;
    }

    _saveMenuPlayerTypes() {
      try {
        localStorage.setItem('acca_player_types', JSON.stringify(this.menuPlayerTypes));
      } catch (e) { /* ignore */ }
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
