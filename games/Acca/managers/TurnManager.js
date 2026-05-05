// games/Acca2/managers/TurnManager.js
// The per-turn sub-state machine plus every menu the player can reach during
// their own turn. Owns turn flow (TURN_START → ROLL → MOVE → LANDING → …) and
// dispatches to StructureManager / DistrictSystem / TradeSystem / MarketSystem
// for the actual side-effects.

(function (GF) {
  'use strict';
  const A = GF.Acca = GF.Acca || {};

  class TurnManager {
    constructor(game) {
      this.game     = game;
      this.stage    = null;
      this.player   = null;
      this.die      = game.die;
      this.movement = game.movement;
      this.menu     = game.menu;
      this.events   = game.engine.events;

      this.events.on('move:complete', () => {
        if (this.stage === A.TURN_STAGE.MOVE) this.enter(A.TURN_STAGE.LANDING);
      });

      this.events.on('cell:enter', ({ player, cell, final }) => {
        // Pass-through effects (toll gate)
        if (!final) this.game.structures.passThroughEffect(cell, player);
      });
    }

    startTurn(player) {
      this.player = player;
      this.enter(A.TURN_STAGE.TURN_START);
    }

    enter(stage) {
      this.stage = stage;
      switch (stage) {
        case A.TURN_STAGE.TURN_START:
          this.game.camera.zoomInOnPlayer(this.player);
          this.game.log(`— ${this.player.name}'s turn —`);
          this.game.economy.runStartOfTurn(this.player);
          this._showStartMenu();
          break;

        case A.TURN_STAGE.ROLL: {
          // Honor any chance-event die override on this player.
          let override = null;
          if (this.game.chanceSys) {
            override = this.game.chanceSys.consumeDieOverride(this.player.index);
          }
          this.die.roll(this.game.cfg.turn.rollDuration, (value) => {
            if (override) {
              value = override.min + Math.floor(Math.random() * (override.max - override.min + 1));
              this.die.rolledValue = value;
              this.game.log(`Lucky die! Rolled a ${value} (range ${override.min}-${override.max}).`);
            } else {
              this.game.log(`Rolled a ${value}.`);
            }
            this.game.lastRoll = value;
            this.enter(A.TURN_STAGE.MOVE);
          });
          break;
        }

        case A.TURN_STAGE.MOVE:
          this.movement.begin(this.player, this.game.lastRoll);
          this.game.log(`Move ${this.game.lastRoll} step(s) — use the arrow keys.`);
          break;

        case A.TURN_STAGE.LANDING:
          this._handleLanding();
          break;

        case A.TURN_STAGE.LAND_PROMPT:
          // Menu was shown by the handler; wait for its action.
          break;

        case A.TURN_STAGE.END_TURN:
          this.game.economy.runEndOfTurn(this.player);
          this.game._beginBetweenTurns();
          this.stage = A.TURN_STAGE.BETWEEN;
          break;

        case A.TURN_STAGE.BETWEEN:
          // Held by AccaGame._betweenTurnsTimer; nothing to do here.
          break;
      }
    }

    // ── Start-of-turn menu (horizontal bottom bar) ───────────────────────
    _showStartMenu() {
      const p    = this.player;
      const opts = [
        { label: 'Roll',               action: () => this.enter(A.TURN_STAGE.ROLL) },
        { label: 'Manage properties',  action: () => this._showManageMenu() },
        { label: 'Sell assets',        action: () => this._showSellAssetsMenu() },
        { label: 'Other',              action: () => this._showOtherMenu() },
      ];
      this.menu.show(`${p.name}  •  $${p.money}`, opts, null, { layout: 'horizontal' });
    }

    // ── Other submenu ─────────────────────────────────────────────────────
    _showOtherMenu() {
      const p    = this.player;
      const game = this.game;
      const opts = [];
      if (game.cfg.mode !== 'cooperative' && game.players.length > 1) {
        opts.push({ label: 'Trade / Hostile actions', action: () => this._showTradeRootMenu() });
      }
      opts.push({ label: 'Save game', action: () => {
        if (GF.Acca && GF.Acca.Save) {
          if (GF.Acca.Save.save(game)) game.log('Game saved.');
          else game.log('Save failed.');
        }
        this._showOtherMenu();
      } });
      const hasSave = !!(GF.Acca && GF.Acca.Save && GF.Acca.Save.exists());
      opts.push({
        label: hasSave ? 'Load game' : 'Load game  — no save slot',
        _disabled: !hasSave,
        action: () => {
          if (!hasSave) { this._showOtherMenu(); return; }
          if (GF.Acca.Save.load(game)) {
            game.log('Game loaded.');
            this.player = game.currentPlayer;
            this._showStartMenu();
          } else {
            game.log('Load failed.');
            this._showOtherMenu();
          }
        },
      });
      opts.push({ label: 'Game log', action: () => this._showGameLog(0) });
      opts.push({ label: 'Pass turn', action: () => this.enter(A.TURN_STAGE.END_TURN) });
      opts.push({ label: 'Back', action: () => this._showStartMenu() });
      this.menu.show('Other', opts, `${p.name}  •  $${p.money}`);
    }

    // ── Sell assets submenu ───────────────────────────────────────────────
    _showSellAssetsMenu() {
      const p    = this.player;
      const game = this.game;
      const back = () => this._showStartMenu();

      if (p.ownedStructures.length === 0) {
        this.menu.show('Sell assets', [
          { label: '(no structures to sell)', action: back },
        ], 'You own no properties.');
        return;
      }

      const opts = p.ownedStructures.map(s => {
        const salePrice = Math.round(s.currentValue * 0.5);
        return {
          label: `${s.cell.district} · ${this._typeLabel(s.type)} · val $${s.currentValue} → sell $${salePrice}`,
          action: () => {
            p.addMoney(salePrice);
            const idx = p.ownedStructures.indexOf(s);
            if (idx !== -1) p.ownedStructures.splice(idx, 1);
            s.cell.structure = null;
            s.cell.sprite    = null;
            s.cell.animator  = null;
            game.log(`${p.name} sold ${this._typeLabel(s.type)} in ${s.cell.district} for $${salePrice}.`);
            if (game.districtSys) game.districtSys.recomputeMayor(s.cell.district);
            game.engine.events.emit('property:sold', { structure: s, ownerIndex: p.index });
            this._showSellAssetsMenu();
          },
        };
      });
      opts.push({ label: 'Back', action: back });
      this.menu.show('Sell assets', opts, 'Sale price: 50% of current value  ·  Cannot be undone');
    }

    /** Paginated game-log viewer. Shows 14 entries per page in reverse
     *  chronological order (newest first), with prev/next/close. */
    _showGameLog(page) {
      const game = this.game;
      const PER_PAGE = 14;
      const all = (game.eventLog || []).slice().reverse();
      const totalPages = Math.max(1, Math.ceil(all.length / PER_PAGE));
      const safePage = Math.max(0, Math.min(page, totalPages - 1));
      const start = safePage * PER_PAGE;
      const slice = all.slice(start, start + PER_PAGE);

      const opts = [];
      slice.forEach(line => opts.push({
        label: '· ' + (line.length > 60 ? line.slice(0, 57) + '…' : line),
        action: () => this._showGameLog(safePage),
      }));
      if (slice.length === 0) {
        opts.push({ label: '(no events yet)', action: () => this._showStartMenu() });
      }
      if (safePage + 1 < totalPages) {
        opts.push({ label: `Next page (${safePage + 2}/${totalPages})`, action: () => this._showGameLog(safePage + 1) });
      }
      if (safePage > 0) {
        opts.push({ label: `Previous page (${safePage}/${totalPages})`, action: () => this._showGameLog(safePage - 1) });
      }
      opts.push({ label: 'Back', action: () => this._showOtherMenu() });
      this.menu.show('Game log', opts,
        `Page ${safePage + 1} of ${totalPages}  ·  ${all.length} entries (newest first)`);
    }

    // ── Manage submenu ────────────────────────────────────────────────────
    _showManageMenu() {
      const p = this.player;
      const game = this.game;
      const opts = [];
      if (p.districtsMayoredOf.size > 0 && game.districtSys) {
        opts.push({ label: `Mayor controls (${p.districtsMayoredOf.size} district${p.districtsMayoredOf.size !== 1 ? 's' : ''})`,
          action: () => this._showMayorMenu() });
      }
      opts.push({ label: 'Properties: ' + p.ownedStructures.length, action: () => this._showPortfolioMenu() });
      opts.push({ label: 'Back', action: () => this._showStartMenu() });
      this.menu.show('Manage', opts, `Cash $${p.money}  ·  Net $${game.netWorth(p)}`);
    }

    _showMayorMenu() {
      const p = this.player;
      const game = this.game;
      const districts = Array.from(p.districtsMayoredOf).map(id => game.districtSys.get(id)).filter(Boolean);
      const opts = districts.map(d => ({
        label: `${d.id}  pop ${d.population}  hap ${Math.round(d.happiness)}  tax ${Math.round(d.taxRate * 100)}%`,
        action: () => this._showDistrictMenu(d),
      }));
      opts.push({ label: 'Back', action: () => this._showManageMenu() });
      this.menu.show('Mayor', opts);
    }

    _showDistrictMenu(d) {
      const p = this.player;
      const game = this.game;
      const cfg = game.cfg.district;
      const opts = [
        { label: `Tax rate: ${Math.round(d.taxRate * 100)}%  (use ←→ in next menu)`,
          action: () => this._showTaxSlider(d) },
        { label: `Festival ($${cfg.festivalCost})`, action: () => {
          const res = game.districtSys.holdFestival(p, d.id, game.turnCounter);
          game.log(res.ok ? `Festival held in ${d.id}.`
                          : `Festival rejected: ${res.reason}.`);
          this._showDistrictMenu(d);
        } },
        { label: `Investment grant ($${cfg.grantCost} → +${cfg.grantPopulation} pop)`, action: () => {
          const res = game.districtSys.investmentGrant(p, d.id, game.turnCounter);
          game.log(res.ok ? `Grant applied in ${d.id}.`
                          : `Grant rejected: ${res.reason}.`);
          this._showDistrictMenu(d);
        } },
        { label: 'Back', action: () => this._showMayorMenu() },
      ];
      this.menu.show(`District: ${d.id}`, opts,
        `Pop ${d.population}  Happiness ${Math.round(d.happiness)}  Specialty: ${d.specialty || 'none'}`);
    }

    _showTaxSlider(d) {
      const game = this.game;
      const p = this.player;
      const cfg = game.cfg.district;
      // Step the rate via menu options (5% increments)
      const steps = [];
      const max = cfg.maxTaxRate;
      for (let v = 0; v <= max + 0.001; v += 0.05) steps.push(Math.round(v * 100) / 100);
      const opts = steps.map(v => ({
        label: `Set ${Math.round(v * 100)}%${v === d.taxRate ? '   ← current' : ''}`,
        action: () => {
          game.districtSys.setTaxRate(p, d.id, v);
          game.log(`Tax for ${d.id} set to ${Math.round(v * 100)}%.`);
          this._showDistrictMenu(d);
        },
      }));
      opts.push({ label: 'Back', action: () => this._showDistrictMenu(d) });
      this.menu.show(`Tax for ${d.id}`, opts,
        `Comfort target ≤ ${Math.round(game.cfg.population.taxComfortRate * 100)}%`);
    }

    _showPortfolioMenu() {
      const p = this.player;
      const game = this.game;
      const back = () => { game.camera.clearSpotlight(); this._showManageMenu(); };
      const opts = p.ownedStructures.map((s) => ({
        label: `${s.cell.district} · ${this._typeLabel(s.type)} · $${s.currentValue}` +
               ` · cell ${s.cell.id}` +
               (s.sabotagedUntilTurn > game.turnCounter ? ' (sabotaged)' : ''),
        meta: { cell: s.cell, structure: s },
        // Confirming a row opens the standard owner-options menu for that
        // structure (Invest / Renovate / Deposit / Upgrade / Collect tolls / …)
        // — the same menu shown when landing on the cell in person, but
        // without ending the turn after the action.
        action: () => this._showPortfolioStructure(s),
      }));
      if (opts.length === 0) opts.push({ label: '(no structures)', action: back });
      opts.push({ label: 'Back', action: back });
      this.menu.show('Your structures', opts,
        'Confirm a property to manage it; arrows to spotlight on the board.', {
        onIndexChange: (opt) => {
          if (opt && opt.meta && opt.meta.cell) {
            game.camera.spotlightOnCell(opt.meta.cell);
          } else {
            game.camera.clearSpotlight();
          }
        },
        onCancel: back,
      });
    }

    /** Inline owner-options menu for a structure managed from the portfolio.
     *  Reuses StructureManager.ownerOptionsFor so the action surface is
     *  identical to landing on the cell — the only difference is that the
     *  done-callback returns to the portfolio list rather than ending the
     *  turn (which would be punitive for the player just browsing). */
    _showPortfolioStructure(structure) {
      const game = this.game;
      const p    = this.player;
      const onDone = () => this._showPortfolioMenu();
      const opts = game.structures.ownerOptionsFor(structure, p, onDone);
      // Replace the implicit Continue at the tail with explicit Back so the
      // origin (portfolio) is unambiguous.
      if (opts.length > 0 && opts[opts.length - 1].label === 'Continue') {
        opts[opts.length - 1] = { label: 'Back', action: onDone };
      } else {
        opts.push({ label: 'Back', action: onDone });
      }
      const subtitle = `Cell ${structure.cell.id} · ${structure.cell.district || '—'}` +
        ` · Value $${structure.currentValue}` +
        (structure.sabotagedUntilTurn > game.turnCounter ? '  (sabotaged)' : '');
      this.menu.show(`Your ${this._typeLabel(structure.type)}`, opts, subtitle);
      game.camera.spotlightOnCell(structure.cell);
    }

    // ── Trade / Hostile root ──────────────────────────────────────────────
    // Hostile takeover is only available by *landing* on a property
    // (handled in _offerTakeoverOnLand) — not from this menu.
    _showTradeRootMenu() {
      const opts = [
        { label: 'Trade with player',     action: () => this._showTradeTargetMenu() },
        { label: 'Sabotage a structure',  action: () => this._showSabotageTargetMenu() },
        { label: 'Back',                  action: () => this._showOtherMenu() },
      ];
      this.menu.show('Trade / Hostile', opts);
    }

    _otherPlayers() {
      return this.game.players.filter(p => p !== this.player && !p.isBankrupt);
    }

    _showTradeTargetMenu() {
      const opts = this._otherPlayers().map(p => ({
        label: `${p.name}  ($${p.money}, ${p.ownedStructures.length} structures)`,
        action: () => this._showTradeWith(p),
      }));
      opts.push({ label: 'Back', action: () => this._showTradeRootMenu() });
      this.menu.show('Trade target', opts);
    }

    _showTradeWith(target) {
      const opts = [
        { label: `Offer $100 → request 1 oil`, action: () => this._executePreset(target,
          { money: 100 }, { resources: { oil: 1 } }) },
        { label: `Offer $200 → request 1 steel`, action: () => this._executePreset(target,
          { money: 200 }, { resources: { steel: 1 } }) },
        { label: `Offer 5 wood → request $100`, action: () => this._executePreset(target,
          { resources: { wood: 5 } }, { money: 100 }) },
        { label: `Offer $250 → request 2 food`, action: () => this._executePreset(target,
          { money: 250 }, { resources: { food: 2 } }) },
        { label: 'Back', action: () => this._showTradeTargetMenu() },
      ];
      this.menu.show(`Propose to ${target.name}`, opts,
        `Note: assets transfer immediately (hot-seat).`);
    }

    _executePreset(target, give, receive) {
      const game = this.game;
      const res = game.tradeSys.executeTrade(this.player, target, { give, receive });
      if (res.ok) {
        game.log(`Trade with ${target.name} completed.`);
      } else {
        game.log(`Trade refused: ${res.reason}.`);
      }
      this._showStartMenu();
    }

    _showSabotageTargetMenu() {
      const game = this.game;
      const cfg  = game.cfg.sabotage;
      const others = this._otherPlayers();
      const candidates = [];
      others.forEach(p => p.ownedStructures.forEach(s => candidates.push({ p, s })));
      if (candidates.length === 0) {
        this.menu.show('Sabotage', [{ label: '(no targets)', action: () => this._showTradeRootMenu() }]);
        return;
      }
      const opts = candidates.map(({ p, s }) => ({
        label: `${s.cell.district}/${this._typeLabel(s.type)} · ${p.name}`,
        action: () => {
          const r = game.tradeSys.sabotage(this.player, s, game.players, game.turnCounter);
          game.log(r.ok ? `Sabotage placed for ${cfg.duration} turns.`
                        : `Sabotage refused: ${r.reason}.`);
          this._showStartMenu();
        },
      }));
      opts.push({ label: 'Back', action: () => this._showTradeRootMenu() });
      this.menu.show(`Sabotage  ($${cfg.cost} + ${cfg.oilCost} oil)`, opts);
    }

    // ── Market modal ──────────────────────────────────────────────────────
    _showMarketMenu() {
      const game = this.game;
      const p    = this.player;
      const M    = game.marketSys;
      if (!M) { this._showStartMenu(); return; }
      const opts = game.cfg.market.resources.map(r => ({
        label: `${r}  buy $${M.priceOf(r)}  sell $${M.sellPriceOf(r)}  (you: ${p.resources[r] || 0})`,
        action: () => this._showMarketResource(r),
      }));
      opts.push({ label: 'Done', action: () => this.enter(A.TURN_STAGE.END_TURN) });
      this.menu.show('Market', opts, `Cash $${p.money}`);
    }

    _showMarketResource(resource) {
      const game = this.game;
      const p    = this.player;
      const M    = game.marketSys;
      const opts = [
        { label: `Buy 1`, action: () => {
          const r = M.buy(p, resource, 1);
          game.log(r.ok ? `+1 ${resource} for $${r.totalCost}.` : `Buy refused: ${r.reason}.`);
          this._showMarketResource(resource);
        } },
        { label: `Buy 5`, action: () => {
          const r = M.buy(p, resource, 5);
          game.log(r.ok ? `+5 ${resource} for $${r.totalCost}.` : `Buy refused: ${r.reason}.`);
          this._showMarketResource(resource);
        } },
        { label: `Sell 1`, action: () => {
          const r = M.sell(p, resource, 1);
          game.log(r.ok ? `-1 ${resource} for $${r.totalProceeds}.` : `Sell refused: ${r.reason}.`);
          this._showMarketResource(resource);
        } },
        { label: `Sell 5`, action: () => {
          const r = M.sell(p, resource, 5);
          game.log(r.ok ? `-5 ${resource} for $${r.totalProceeds}.` : `Sell refused: ${r.reason}.`);
          this._showMarketResource(resource);
        } },
        { label: 'Back', action: () => this._showMarketMenu() },
      ];
      this.menu.show(`${resource}`, opts,
        `Buy $${M.priceOf(resource)}  Sell $${M.sellPriceOf(resource)}  Have ${p.resources[resource] || 0}`);
    }

    // ── Landing dispatch ──────────────────────────────────────────────────
    _handleLanding() {
      const cell = this.player.currentCell;
      // "Near-miss": if the landing cell is adjacent to a chance cell and
      // isn't itself a chance cell, fire a low-probability chance event.
      // Keeps the chance pool engaged on small maps where direct chance-cell
      // landings are rare.
      if (cell.type !== 'chance' && this.game.chanceSys) {
        const adj = [cell.up, cell.down, cell.left, cell.right].filter(Boolean);
        const nearChance = adj.some(n => n.type === 'chance');
        const cfg = this.game.cfg.chance || {};
        const nearMissProb = cfg.nearMissProb || 0;
        if (nearChance && Math.random() < nearMissProb) {
          // Near-miss: a chance event fires even though the player didn't
          // land on a chance cell. Log it explicitly so players understand
          // why the cell's normal landing effect was bypassed.
          this.game.log(`Near-miss chance — adjacent to a Chance cell (${Math.round(nearMissProb * 100)}% chance).`);
          this._handleChance();
          return;
        }
      }
      switch (cell.type) {
        case 'bank':
          this.player.addMoney(200);
          this.game.log(`${this.player.name} stops at the Bank. +$200.`);
          this.enter(A.TURN_STAGE.END_TURN);
          break;
        case 'chance':
          this._handleChance();
          break;
        case 'buildable':
          this._handleBuildable(cell);
          break;
        case 'power_plant':
          this._grantResource(cell, 'electricity', 3, 'Power Plant');
          break;
        case 'well':
          this._grantResource(cell, 'water', 3, 'Well');
          break;
        case 'mine': {
          // mine.subType ∈ { coal, iron, oil } — iron mines grant steel.
          // Read straight off the live Cell (BoardLoader copies subType from
          // map JSON onto the Cell at load time); the GF.mapData lookup the
          // earlier implementation used was fragile across save/load.
          const sub = cell.subType || 'coal';
          const resource = (sub === 'iron') ? 'steel' : sub;
          this._grantResource(cell, resource, 3, `${sub.charAt(0).toUpperCase()}${sub.slice(1)} Mine`);
          break;
        }
        case 'market':
          // Visiting a market cell shortcuts the player into the market UI.
          this.game.log(`${this.player.name} stops at the Market.`);
          this._showMarketMenu();
          this.stage = A.TURN_STAGE.LAND_PROMPT;
          break;
        case 'structure': {
          // Pre-placed neutral structure (map-defined). If the cell happens
          // to carry a real PlayerStructure (e.g. seeded by a scenario),
          // route through the buildable handler so the standard
          // owner/visitor flows kick in. Otherwise treat as a flavour cell
          // — log the structure type and end the turn safely.
          if (cell.structure) {
            this._handleBuildable(cell);
          } else {
            const label = cell.structureType
              ? this._typeLabel(cell.structureType)
              : 'fixed structure';
            this.game.log(`${this.player.name} stops at a neutral ${label}.`);
            this.enter(A.TURN_STAGE.END_TURN);
          }
          break;
        }
        default:
          this.enter(A.TURN_STAGE.END_TURN);
          break;
      }
    }

    _grantResource(cell, resource, qty, label) {
      const p = this.player;
      p.resources[resource] = (p.resources[resource] || 0) + qty;
      this.game.log(`${p.name} stops at the ${label} (+${qty} ${resource}).`);
      this.enter(A.TURN_STAGE.END_TURN);
    }

    // ── Buildable cells ───────────────────────────────────────────────────
    _handleBuildable(cell) {
      const p = this.player;
      const game = this.game;

      if (!cell.structure) {
        this._showBuildMenu(cell);
        return;
      }

      const s = cell.structure;
      this.stage = A.TURN_STAGE.LAND_PROMPT;

      if (s.ownerIndex === p.index) {
        const opts = game.structures.ownerOptionsFor(s, p,
          () => this.enter(A.TURN_STAGE.END_TURN));
        this.menu.show(`Your ${this._typeLabel(s.type)}`, opts);
      } else {
        // Apply the visit effect (rent / fee), then — provided the player is
        // still on the cell — offer the option to buy from its owner.
        const visitDoneCb = () => {};
        const followUp = game.structures.visitorEffect(s, p, visitDoneCb);
        const present = () => {
          if (p.currentCell !== s.cell) {
            this.enter(A.TURN_STAGE.END_TURN);
            return;
          }
          this._offerTakeoverOnLand(s);
        };
        if (followUp) {
          const wrapped = followUp.map(opt => ({
            label: opt.label,
            action: () => {
              if (opt.action) opt.action();
              present();
            },
          }));
          this.menu.show(`${this._typeLabel(s.type)} (owner: ${game.players[s.ownerIndex].name})`,
            wrapped);
        } else {
          present();
        }
      }
    }

    /** Offer the landing player the option to take over the structure they
     *  just landed on for 5× current value, or to sabotage it (subject to the
     *  usual cost / oil / police-shield / cooldown rules in TradeSystem). */
    _offerTakeoverOnLand(structure) {
      const game  = this.game;
      const p     = this.player;
      const owner = game.players[structure.ownerIndex];
      const cfgSab = game.cfg.sabotage;

      // Takeover row.
      const cost = Math.round(structure.currentValue * game.cfg.property.takeoverMultiplier);
      const can  = p.money >= cost;
      const takeoverLabel = can
        ? `Buy from ${owner.name}  ($${cost} = 5× value)`
        : `Buy from ${owner.name}  ($${cost})  — cannot afford`;

      // Sabotage row — only meaningful in competitive multiplayer; reuse
      // TradeSystem.canSabotage so we get the same affordability/oil/police
      // shield/cooldown checks as the menu-driven sabotage path.
      const sabCheck = (game.cfg.mode !== 'cooperative' && game.tradeSys)
        ? game.tradeSys.canSabotage(p, structure, game.turnCounter)
        : { ok: false, reason: 'unavailable' };
      const sabLabel = sabCheck.ok
        ? `Sabotage  ($${cfgSab.cost} + ${cfgSab.oilCost} oil, ${cfgSab.duration} turns)`
        : `Sabotage — ${sabCheck.reason}`;

      const opts = [
        {
          label: takeoverLabel,
          action: () => {
            if (!can) { this.enter(A.TURN_STAGE.END_TURN); return; }
            const r = game.tradeSys.takeover(p, structure, game.players, game.turnCounter);
            game.log(r.ok
              ? `${p.name} bought the ${this._typeLabel(structure.type)} from ${owner.name} for $${r.cost}.`
              : `Purchase refused: ${r.reason}.`);
            this.enter(A.TURN_STAGE.END_TURN);
          },
        },
        {
          label: sabLabel,
          _disabled: !sabCheck.ok,
          action: () => {
            if (!sabCheck.ok) { this.enter(A.TURN_STAGE.END_TURN); return; }
            const r = game.tradeSys.sabotage(p, structure, game.players, game.turnCounter);
            game.log(r.ok
              ? `${p.name} sabotaged ${owner.name}'s ${this._typeLabel(structure.type)} for ${cfgSab.duration} turns.`
              : `Sabotage refused: ${r.reason}.`);
            this.enter(A.TURN_STAGE.END_TURN);
          },
        },
        { label: 'Continue', action: () => this.enter(A.TURN_STAGE.END_TURN) },
      ];
      this.menu.show(
        `${this._typeLabel(structure.type)} owned by ${owner.name}`,
        opts,
        `Cell ${structure.cell.id}  ·  Value $${structure.currentValue}`
      );
    }

    _showBuildMenu(cell) {
      const p = this.player;
      const game = this.game;
      const cfg = game.cfg.structures;
      this.stage = A.TURN_STAGE.LAND_PROMPT;

      // Sort the catalog by cost ascending so the cheapest builds are at the
      // top. When the player can't afford the cheapest build, show *only* the
      // Skip option (the all-disabled-rows state was the dominant late-game
      // UX path on a small map and required 7 keypresses to clear).
      const sorted = cfg.catalog.slice().sort((a, b) => a.cost - b.cost);
      const cheapest = sorted[0] ? sorted[0].cost : 0;
      const canAffordAnything = sorted.some(e => p.money >= e.cost);

      const opts = [];
      if (canAffordAnything) {
        sorted.forEach(entry => {
          const can = p.money >= entry.cost;
          // Preview the visitor rent (or other earning mechanism) so the
          // buy decision isn't blind. Falls back to a sensible per-type
          // hint for structures that don't charge rent.
          const rent = game.structures.expectedVisitorRent(entry.type, entry.cost);
          let hint;
          if (rent > 0) {
            hint = `rent ~$${rent}/visit`;
          } else if (entry.type === 'toll_gate') {
            hint = `+$${cfg.tollIncrement}/pass-through`;
          } else if (entry.type === 'teleporter') {
            hint = `$${cfg.teleportFee}/visitor teleport`;
          } else if (entry.type === 'police_station') {
            hint = `+$${cfg.policeOwnerIncome}/turn, sabotage shield`;
          } else if (entry.type === 'vault') {
            hint = `+$${cfg.vaultOwnerIncome}/turn + 1% interest`;
          } else {
            hint = '';
          }
          const cost = `Build ${entry.label} ($${entry.cost})`;
          const tail = hint ? ` — ${hint}` : '';
          opts.push({
            label: can
              ? `${cost}${tail}`
              : `${cost}  — need $${entry.cost - p.money}`,
            _disabled: !can,
            action: () => {
              if (!can) { this._showBuildMenu(cell); return; }
              p.addMoney(-entry.cost);
              game.structures.build(cell, entry.type, p.index);
              game.log(`${p.name} built a ${entry.label} in ${cell.district}.`);
              if (game.districtSys) game.districtSys.recomputeMayor(cell.district);
              this.enter(A.TURN_STAGE.END_TURN);
            },
          });
        });
      }
      opts.push({ label: 'Skip', action: () => this.enter(A.TURN_STAGE.END_TURN) });

      const subtitle = canAffordAnything
        ? `Cash: $${p.money}  ·  Cheapest: $${cheapest}`
        : `Cash: $${p.money}  ·  Cheapest build: $${cheapest}  — can't afford anything yet`;
      this.menu.show(`Empty plot in ${cell.district}`, opts, subtitle);
    }

    _typeLabel(type) {
      const cfg = this.game.cfg.structures;
      const entry = cfg.catalog.find(c => c.type === type);
      return entry ? entry.label : type;
    }

    _handleChance() {
      const game = this.game;
      const p = this.player;
      let event;
      if (game.chanceSys) {
        event = game.chanceSys.draw(p, game.players);
      } else {
        const pool = (game.cfg.chance && game.cfg.chance.pool) || [];
        event = pool[Math.floor(Math.random() * pool.length)] || { label: 'Nothing', message: 'A quiet day.' };
      }
      game.log(`Chance — ${event.label}: ${event.message}`);
      this.stage = A.TURN_STAGE.LAND_PROMPT;
      this.menu.show(event.label, [
        { label: 'OK', action: () => this.enter(A.TURN_STAGE.END_TURN) },
      ], event.category ? `[${event.category}]` : '');
    }
  }

  A.TurnManager = TurnManager;

})(window.GF = window.GF || {});
