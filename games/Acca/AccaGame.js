// GameFramework/games/Acca/AccaGame.js
// Main game logic for Acca.
// Implements the Planning bible (games/Acca/Planning/) plus 20_Changes:
//   - HTML topbar + left district sidebar + right sidebar (DOM-driven), canvas only renders the map.
//   - Camera zooms in on the active player (~6 cells around them in each dir);
//     zooms out between turns to show the whole map.
//   - Empty district squares are buildable: landing on one offers the full
//     player-structure catalog (Planning §5.10).
//   - Per-structure landing/pass-through handlers (shop, toll, teleporter,
//     house, factory, police_station, vault).
//
// Terminology used throughout this file:
//   district = named group of squares (cell.district holds the district id)
//   region   = higher-level grouping of districts (future feature, not yet used)

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
    TURN_START   : 'turnStart',
    ROLL         : 'roll',
    MOVE         : 'move',
    CONFIRM_LAND : 'confirmLand',
    LANDING      : 'landing',
    LAND_PROMPT  : 'landPrompt',
    BETWEEN      : 'between',     // zoomed-out hold between turns
    END_TURN     : 'endTurn',
  };

  // ──────────────────────────────────────────────────────────────────────────
  //  Cell
  // ──────────────────────────────────────────────────────────────────────────
  class Cell {
    constructor(id, x, y, type, district, sprite) {
      this.id        = id;
      this.x         = x;
      this.y         = y;
      this.type      = type;     // 'bank' | 'buildable' | 'chance' | 'empty'
      this.district  = district;
      this.sprite    = sprite;

      this.up    = null;
      this.down  = null;
      this.left  = null;
      this.right = null;

      this._neighbors = [];

      // Structure (only meaningful for type === 'buildable')
      this.structure = null;     // PlayerStructure | null

      this.animator = null;
    }

    neighbors() { return this._neighbors; }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  PlayerStructure (Planning §5.9)
  // ──────────────────────────────────────────────────────────────────────────
  class PlayerStructure {
    constructor(type, ownerIndex, baseValue, animator) {
      this.type        = type;
      this.ownerIndex  = ownerIndex;
      this.baseValue   = baseValue;
      this.currentValue = baseValue;
      this.cell        = null;
      this.animator    = animator;
      // Per-type state:
      this.tollAccrued = 0;     // toll_gate
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  DieController
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

    draw(ctx, x, y) { this.animator.draw(ctx, x, y); }
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

      this.money       = startingMoney;
      this.level       = 1;
      this.isBankrupt  = false;

      this.ownedStructures  = []; // array of PlayerStructure
      this.resources        = {}; // resourceName → quantity
      this.districtsMayoredOf = new Set(); // ids of districts this player is mayor of
      this.company          = null; // Planning §7 — null until founded

      this.currentCell = startCell;
      this.moveOffset  = { x: 0, y: 0 };
    }

    /** structure footprint in a district (count of owned structures of any type). */
    structuresInDistrict(district) {
      return this.ownedStructures.filter(s => s.cell && s.cell.district === district).length;
    }

    /** count of owned house structures (drives factory bonus). */
    get housesOwned() {
      return this.ownedStructures.filter(s => s.type === 'house').length;
    }

    addMoney(amount) {
      this.money += amount;
      if (this.money < 0) {
        this.isBankrupt = true;
        this.money = 0;
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  MovementController — per-step arrow input during MOVE stage
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

    update() {
      if (!this.active || !this.player) return;
      const cur = this.player.currentCell;
      if (!cur) return;

      let target = null;
      if      (this._pressed('up')    && cur.up)    target = cur.up;
      else if (this._pressed('down')  && cur.down)  target = cur.down;
      else if (this._pressed('left')  && cur.left)  target = cur.left;
      else if (this._pressed('right') && cur.right) target = cur.right;

      if (target) this._stepTo(target);
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
      const final = this.movesLeft <= 0;
      this.events.emit('cell:enter', { player: p, cell: target, final });

      if (final) {
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
  //  Menu — arrow-key list overlay rendered on the canvas (screen-space)
  // ──────────────────────────────────────────────────────────────────────────
  class Menu {
    constructor(input, controls) {
      this.input    = input;
      this.controls = controls;
      this.options  = [];
      this.index    = 0;
      this.title    = '';
      this.subtitle = '';
      this.visible  = false;
    }

    show(title, options, subtitle) {
      this.title    = title;
      this.subtitle = subtitle || '';
      this.options  = options;
      this.index    = 0;
      this.visible  = true;
    }

    hide() {
      this.visible = false;
      this.options = [];
      this.subtitle = '';
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
  //  StructureManager — creates structures, runs landing/pass effects
  // ──────────────────────────────────────────────────────────────────────────
  class StructureManager {
    constructor(game) {
      this.game = game;
    }

    /** Build a structure on a cell for an owner. Returns the new structure. */
    build(cell, type, ownerIndex) {
      const cfg = this.game.cfg.structures;
      const entry = cfg.catalog.find(c => c.type === type);
      if (!entry) return null;

      const spriteName = cfg.sprites[type];
      const animator = this.game.sprites.createAnimator(spriteName, 'idle');
      const s = new PlayerStructure(type, ownerIndex, entry.cost, animator);
      s.cell = cell;
      cell.structure = s;
      cell.sprite = spriteName;
      cell.animator = animator;
      this.game.players[ownerIndex].ownedStructures.push(s);
      this.game.engine.events.emit('property:bought', { structure: s, ownerIndex });
      if (this.game.districtSys) this.game.districtSys.recomputeMayor(cell.district);
      return s;
    }

    /** Owner-on-land action menu options for this structure. */
    ownerOptionsFor(structure, player, onDone) {
      const game = this.game;
      const cfg = game.cfg.structures;
      const opts = [];

      switch (structure.type) {
        case 'shop': {
          const cap = this._shopMaxCapital(structure, player);
          const step = cfg.shopInvestStep;
          const room = cap - structure.currentValue;
          if (room >= step && player.money >= step) {
            opts.push({ label: `Invest $${step}  (val→$${structure.currentValue + step}/${cap})`,
              action: () => {
                player.addMoney(-step);
                structure.currentValue += step;
                game.log(`${player.name} invested $${step} in their Shop.`);
                onDone();
              } });
          }
          opts.push({ label: `Cap: $${cap}  Current: $${structure.currentValue}`, action: onDone });
          break;
        }
        case 'house': {
          if (player.districtsMayoredOf.has(structure.cell.district)) {
            const tax = cfg.houseTaxIfMayor;
            opts.push({ label: `Collect taxes (+$${tax})`, action: () => {
              player.addMoney(tax);
              game.log(`${player.name} collected $${tax} in taxes from their House.`);
              onDone();
            } });
          } else {
            opts.push({ label: `Need mayor of ${structure.cell.district} to tax`, action: onDone });
          }
          break;
        }
        case 'factory': {
          const out = this._factoryOutput(player);
          const res = cfg.factoryResource;
          opts.push({ label: `Collect ${out} ${res}`, action: () => {
            player.resources[res] = (player.resources[res] || 0) + out;
            game.log(`${player.name} collected ${out} ${res} from their Factory.`);
            onDone();
          } });
          break;
        }
        case 'teleporter': {
          const others = player.ownedStructures.filter(s =>
            s.type === 'teleporter' && s !== structure);
          if (others.length === 0) {
            opts.push({ label: '(no other teleporter to use)', action: onDone });
          } else {
            others.forEach(t => {
              opts.push({ label: `Teleport to ${t.cell.district || 'cell ' + t.cell.id}`,
                action: () => {
                  game.movePlayerTo(player, t.cell);
                  game.log(`${player.name} teleported.`);
                  onDone();
                } });
            });
          }
          break;
        }
        case 'vault': {
          const interest = Math.round(player.money * cfg.vaultInterestRate);
          opts.push({ label: `Collect interest (+$${interest})`, action: () => {
            player.addMoney(interest);
            game.log(`${player.name} earned $${interest} interest from their Vault.`);
            onDone();
          } });
          break;
        }
        case 'toll_gate':
        case 'police_station':
          opts.push({ label: '(passive — owner takes no action)', action: onDone });
          break;
      }
      opts.push({ label: 'Continue', action: onDone });
      return opts;
    }

    /**
     * Visitor-on-land effect for a non-owned structure.
     * Returns a follow-up menu (array of opts) or null if effect was applied
     * directly and the turn should advance.
     */
    visitorEffect(structure, player, onDone) {
      const game = this.game;
      const cfg = game.cfg.structures;
      const owner = game.players[structure.ownerIndex];

      switch (structure.type) {
        case 'shop': {
          const fee = Math.max(1, Math.round(structure.currentValue * cfg.shopVisitRate));
          this._payRent(player, owner, fee, 'visit a Shop');
          onDone();
          return null;
        }
        case 'house': {
          const fee = Math.max(1, Math.round(structure.baseValue * cfg.houseRentRate));
          this._payRent(player, owner, fee, 'rent a House room');
          onDone();
          return null;
        }
        case 'factory': {
          const fee = Math.max(1, Math.round(structure.baseValue * cfg.houseRentRate));
          this._payRent(player, owner, fee, 'tour a Factory');
          onDone();
          return null;
        }
        case 'vault': {
          const fee = Math.max(1, Math.round(structure.baseValue * cfg.houseRentRate));
          this._payRent(player, owner, fee, 'inspect a Vault');
          onDone();
          return null;
        }
        case 'toll_gate': {
          // Already paid on pass-through (cell:enter); landing is a no-op extra fee.
          game.log(`${player.name} stops at the Toll Gate.`);
          onDone();
          return null;
        }
        case 'police_station': {
          game.log(`${player.name} passes the Police Station.`);
          onDone();
          return null;
        }
        case 'teleporter': {
          const targets = owner.ownedStructures.filter(s =>
            s.type === 'teleporter' && s !== structure);
          const opts = [];
          if (targets.length > 0 && player.money >= cfg.teleportFee) {
            targets.forEach(t => {
              opts.push({ label: `Teleport to ${t.cell.district || 'cell ' + t.cell.id} ($${cfg.teleportFee})`,
                action: () => {
                  player.addMoney(-cfg.teleportFee);
                  owner.addMoney(cfg.teleportFee);
                  game.movePlayerTo(player, t.cell);
                  game.log(`${player.name} paid $${cfg.teleportFee} to teleport.`);
                  onDone();
                } });
            });
          }
          opts.push({ label: 'Pass', action: onDone });
          return opts;
        }
      }
      onDone();
      return null;
    }

    /** Toll-gate pass-through effect — fires on every step into the cell. */
    passThroughEffect(cell, player) {
      if (!cell.structure || cell.structure.type !== 'toll_gate') return;
      const s = cell.structure;
      if (s.ownerIndex === player.index || s.ownerIndex < 0) return;
      const game = this.game;
      const owner = game.players[s.ownerIndex];
      const due = s.tollAccrued;
      if (due > 0) {
        this._payRent(player, owner, due, 'pass a Toll Gate');
      } else {
        game.log(`${player.name} passes the Toll Gate (free this time).`);
      }
      s.tollAccrued += game.cfg.structures.tollIncrement;
    }

    /** End-of-turn upkeep & passive effects for the active player. */
    endOfTurnFor(player) {
      const cfg = this.game.cfg.structures;
      player.ownedStructures.forEach(s => {
        if (s.type === 'vault') {
          player.addMoney(-cfg.vaultUpkeep);
          this.game.log(`Vault upkeep: -$${cfg.vaultUpkeep}.`);
        }
      });
    }

    _shopMaxCapital(structure, player) {
      const cfg = this.game.cfg.structures;
      const sameDistrict = player.structuresInDistrict(structure.cell.district);
      return cfg.shopBaseCap + sameDistrict * cfg.shopCapPerStructure;
    }

    _factoryOutput(player) {
      const cfg = this.game.cfg.structures;
      const base = cfg.factoryBaseRate;
      const bonus = 1 + player.housesOwned * cfg.factoryHouseBonus;
      return Math.max(1, Math.round(base * bonus));
    }

    _payRent(payer, owner, amount, reason) {
      payer.addMoney(-amount);
      owner.addMoney(amount);
      this.game.log(`${payer.name} pays $${amount} to ${owner.name} (${reason}).`);
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

      this.events.on('move:complete', () => {
        if (this.stage === TURN_STAGE.MOVE) this.enter(TURN_STAGE.LANDING);
      });

      this.events.on('cell:enter', ({ player, cell, final }) => {
        // Pass-through effects (toll gate)
        if (!final) this.game.structures.passThroughEffect(cell, player);
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
          this.game._zoomInOnPlayer(this.player);
          this.game.log(`— ${this.player.name}'s turn —`);
          this._showStartMenu();
          break;

        case TURN_STAGE.ROLL: {
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
            this.enter(TURN_STAGE.MOVE);
          });
          break;
        }

        case TURN_STAGE.MOVE:
          this.movement.begin(this.player, this.game.lastRoll);
          this.game.log(`Move ${this.game.lastRoll} step(s) — use arrow keys.`);
          break;

        case TURN_STAGE.LANDING:
          this._handleLanding();
          break;

        case TURN_STAGE.LAND_PROMPT:
          // Menu was shown by the handler; wait for its action.
          break;

        case TURN_STAGE.END_TURN:
          this.game._runEndOfTurn(this.player);
          this.game._beginBetweenTurns();
          this.stage = TURN_STAGE.BETWEEN;
          break;

        case TURN_STAGE.BETWEEN:
          // Held by AccaGame._betweenTurnsTimer; nothing to do here.
          break;
      }
    }

    _showStartMenu() {
      const p = this.player;
      const game = this.game;
      const opts = [
        { label: 'Roll', action: () => this.enter(TURN_STAGE.ROLL) },
        { label: 'Manage', action: () => this._showManageMenu() },
      ];
      if (game.cfg.mode !== 'cooperative' && game.players.length > 1) {
        opts.push({ label: 'Trade / Hostile actions', action: () => this._showTradeRootMenu() });
      }
      opts.push({ label: 'Market', action: () => this._showMarketMenu() });
      opts.push({ label: 'Save game', action: () => {
        if (GF.Acca && GF.Acca.Save) {
          GF.Acca.Save.save(game);
          game.log('Game saved.');
        }
        this._showStartMenu();
      } });
      opts.push({ label: 'Pass turn', action: () => this.enter(TURN_STAGE.END_TURN) });
      this.menu.show(`${p.name}'s turn  ($${p.money})`, opts);
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
      if (game.cfg.industries) {
        opts.push({ label: p.company ? `Company: ${p.company.name} (${p.company.industry})`
                                       : 'Create company',
          action: () => this._showCompanyMenu() });
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

    // ── Company submenu (Planning §7) ─────────────────────────────────────
    _showCompanyMenu() {
      const p = this.player;
      const game = this.game;
      const cfg = game.cfg.industries;
      if (!p.company) {
        const cost = cfg.newCompanyCost;
        const opts = cfg.types.map(t => ({
          label: `Found "${p.name} ${t.toUpperCase()}" — ${t}  ($${cost})`,
          action: () => {
            if (p.money < cost) { game.log('Cannot afford.'); this._showManageMenu(); return; }
            p.money -= cost;
            p.company = { id: 'co_' + p.index, name: `${p.name} ${t.toUpperCase()}`, industry: t };
            game.log(`${p.name} founded ${p.company.name}.`);
            this._showManageMenu();
          },
        }));
        opts.push({ label: 'Back', action: () => this._showManageMenu() });
        this.menu.show(`Found a company  ($${cost})`, opts);
        return;
      }
      // Existing company — specialize / rename
      const opts = cfg.types.map(t => ({
        label: `Specialize: ${t}${t === p.company.industry ? '   ← current' : ''}  ($${cfg.changeCost})`,
        action: () => {
          if (t === p.company.industry) { this._showManageMenu(); return; }
          if (p.money < cfg.changeCost) { game.log('Cannot afford.'); this._showManageMenu(); return; }
          p.money -= cfg.changeCost;
          p.company.industry = t;
          game.log(`${p.company.name} now specializes in ${t}.`);
          this._showManageMenu();
        },
      }));
      opts.push({ label: 'Back', action: () => this._showManageMenu() });
      this.menu.show(`${p.company.name}`, opts, `Industry: ${p.company.industry}`);
    }

    _showPortfolioMenu() {
      const p = this.player;
      const game = this.game;
      const opts = p.ownedStructures.map(s => ({
        label: `${s.cell.district} · ${this._typeLabel(s.type)} · $${s.currentValue}` +
               (s.sabotagedUntilTurn > game.turnCounter ? ' (sabotaged)' : ''),
        action: () => this._showStartMenu(),
      }));
      if (opts.length === 0) opts.push({ label: '(no structures)', action: () => this._showManageMenu() });
      opts.push({ label: 'Back', action: () => this._showManageMenu() });
      this.menu.show('Your structures', opts);
    }

    // ── Trade / Hostile actions root ──────────────────────────────────────
    _showTradeRootMenu() {
      const opts = [
        { label: 'Trade with player',     action: () => this._showTradeTargetMenu() },
        { label: 'Hostile takeover',      action: () => this._showTakeoverTargetMenu() },
        { label: 'Sabotage a structure',  action: () => this._showSabotageTargetMenu() },
        { label: 'Back',                  action: () => this._showStartMenu() },
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
      const p = this.player;
      const game = this.game;
      // Quick preset: offer cash, request resource (or vice versa). Two proposals
      // surfaced as preset options to keep the UI manageable in a menu list.
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

    _showTakeoverTargetMenu() {
      const others = this._otherPlayers();
      const candidates = [];
      others.forEach(p => p.ownedStructures.forEach(s => candidates.push({ p, s })));
      if (candidates.length === 0) {
        this.menu.show('Hostile takeover', [{ label: '(no targets)', action: () => this._showTradeRootMenu() }]);
        return;
      }
      const game = this.game;
      const opts = candidates.map(({ p, s }) => {
        const cost = Math.round(s.currentValue * game.cfg.property.takeoverMultiplier);
        return {
          label: `${s.cell.district}/${this._typeLabel(s.type)} · ${p.name} · $${cost}`,
          action: () => {
            const r = game.tradeSys.takeover(this.player, s, game.players, game.turnCounter);
            game.log(r.ok ? `${this.player.name} took over ${this._typeLabel(s.type)} from ${p.name} for $${r.cost}.`
                          : `Takeover refused: ${r.reason}.`);
            this._showStartMenu();
          },
        };
      });
      opts.push({ label: 'Back', action: () => this._showTradeRootMenu() });
      this.menu.show('Hostile takeover', opts);
    }

    _showSabotageTargetMenu() {
      const game = this.game;
      const cfg = game.cfg.sabotage;
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

    // ── Market modal (Planning §6) ────────────────────────────────────────
    _showMarketMenu() {
      const game = this.game;
      const p = this.player;
      const M = game.marketSys;
      if (!M) { this._showStartMenu(); return; }
      const opts = game.cfg.market.resources.map(r => ({
        label: `${r}  buy $${M.priceOf(r)}  sell $${M.sellPriceOf(r)}  (you: ${p.resources[r] || 0})`,
        action: () => this._showMarketResource(r),
      }));
      opts.push({ label: 'Back', action: () => this._showStartMenu() });
      this.menu.show('Market', opts, `Cash $${p.money}`);
    }

    _showMarketResource(resource) {
      const game = this.game;
      const p = this.player;
      const M = game.marketSys;
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

    _handleLanding() {
      const cell = this.player.currentCell;
      switch (cell.type) {
        case 'bank':
          this.player.addMoney(200);
          this.game.log(`${this.player.name} stops at the Bank. +$200.`);
          this.enter(TURN_STAGE.END_TURN);
          break;
        case 'chance':
          this._handleChance();
          break;
        case 'buildable':
          this._handleBuildable(cell);
          break;
        default:
          this.enter(TURN_STAGE.END_TURN);
          break;
      }
    }

    // ── Buildable cells (was: property) ──────────────────────────────────
    _handleBuildable(cell) {
      const p = this.player;
      const game = this.game;

      if (!cell.structure) {
        this._showBuildMenu(cell);
        return;
      }

      const s = cell.structure;
      this.stage = TURN_STAGE.LAND_PROMPT;

      if (s.ownerIndex === p.index) {
        const opts = game.structures.ownerOptionsFor(s, p,
          () => this.enter(TURN_STAGE.END_TURN));
        this.menu.show(`Your ${this._typeLabel(s.type)}`, opts);
      } else {
        const onDone = () => this.enter(TURN_STAGE.END_TURN);
        const followUp = game.structures.visitorEffect(s, p, onDone);
        if (followUp) {
          this.menu.show(`${this._typeLabel(s.type)} (owner: ${game.players[s.ownerIndex].name})`,
            followUp);
        }
      }
    }

    _showBuildMenu(cell) {
      const p = this.player;
      const game = this.game;
      const cfg = game.cfg.structures;
      this.stage = TURN_STAGE.LAND_PROMPT;

      const opts = cfg.catalog
        .filter(entry => p.money >= entry.cost)
        .map(entry => ({
          label: `Build ${entry.label} ($${entry.cost})`,
          action: () => {
            p.addMoney(-entry.cost);
            game.structures.build(cell, entry.type, p.index);
            game.log(`${p.name} built a ${entry.label} in ${cell.district}.`);
            game.checkMayor(p, cell.district);
            this.enter(TURN_STAGE.END_TURN);
          },
        }));
      opts.push({ label: 'Skip', action: () => this.enter(TURN_STAGE.END_TURN) });

      this.menu.show(`Empty plot in ${cell.district}`, opts,
        `Cash: $${p.money}`);
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
      this.stage = TURN_STAGE.LAND_PROMPT;
      this.menu.show(event.label, [
        { label: 'OK', action: () => this.enter(TURN_STAGE.END_TURN) },
      ], event.category ? `[${event.category}]` : '');
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  AccaGame — top-level controller
  // ──────────────────────────────────────────────────────────────────────────
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

      this.gameState = GAME_STATE.MENU;
      this.players   = [];
      this.currentPlayerIndex = 0;
      this.cells     = [];
      this.eventLog  = [];
      this.lastRoll  = 0;
      this.winner    = null;

      this.die        = new DieController(sprites);
      this.menu       = new Menu(engine.input, ctl);
      this.movement   = new MovementController(engine.input, ctl, engine.events);
      this.structures = new StructureManager(this);

      // ── Planning §6–§11 systems ──
      const A = (GF.Acca || {});
      this.marketSys     = A.MarketSystem     ? new A.MarketSystem(cfg, engine.events) : null;
      this.districtSys   = A.DistrictSystem   ? new A.DistrictSystem(cfg, engine.events) : null;
      this.populationSys = (A.PopulationSystem && this.districtSys)
        ? new A.PopulationSystem(cfg, engine.events, this.districtSys) : null;
      this.tradeSys      = A.TradeSystem      ? new A.TradeSystem(cfg, engine.events, this.districtSys) : null;
      this.chanceSys     = A.ChanceSystem     ? new A.ChanceSystem(cfg, engine.events, {
        districtSystem: this.districtSys,
        getLeader: () => this._getLeader(),
        getLowestCash: () => this._getLowestCash(),
        sabotageProperty: (s, dur) => {
          s.sabotagedUntilTurn = (this.turnCounter || 0) + dur;
        },
        grantFreeStructure: (player) => this._grantRandomStructure(player),
      }) : null;
      this.turn       = new TurnManager(this);

      // Cooperative threat track (Planning §15.3.2)
      this.cooperativeThreat = 0;
      this.turnCounter = 0;

      // District / mayor event listeners
      engine.events.on('district:mayorChanged', ({ district, oldMayor, newMayor }) => {
        const players = this.players;
        if (oldMayor >= 0 && players[oldMayor]) {
          players[oldMayor].districtsMayoredOf.delete(district.id);
          this.log(`${players[oldMayor].name} lost mayorship of ${district.id}.`);
        }
        if (newMayor >= 0 && players[newMayor]) {
          players[newMayor].districtsMayoredOf.add(district.id);
          this.log(`${players[newMayor].name} is now Mayor of ${district.id}!`);
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

      this.menuPlayerCount = cfg.numberOfPlayers;

      // ── Camera state (zoom + pan) ─────────────────────────────────────
      this._camera = {
        scale: 1, cx: 0, cy: 0,
        targetScale: 1, targetCx: 0, targetCy: 0,
        boardCenter: { x: 0, y: 0 },
        zoomedOutScale: 1,
      };

      this._betweenTurnsTimer = 0;

      // ── DOM HUD references ────────────────────────────────────────────
      this.dom = {
        container   : document.getElementById('gameContainer'),
        tbName      : document.getElementById('tb-name'),
        tbMoney     : document.getElementById('tb-money'),
        tbNetWorth  : document.getElementById('tb-networth'),
        tbResources : document.getElementById('tb-resources'),
        notifications: document.getElementById('notifications'),
        playerList  : document.getElementById('playerList'),
        districtList: document.getElementById('districtList'),
      };
      this._lastDomState    = null;
      this._lastDistrictSig = null;

      engine.onUpdate((dt) => this._update(dt));
      engine.onRender((ctx) => this._render(ctx));
    }

    start() { this.engine.start(); }

    // ── Logging ───────────────────────────────────────────────────────────
    log(message) {
      this.eventLog.push(message);
      if (this.eventLog.length > 30) this.eventLog.shift();
    }

    get currentPlayer() { return this.players[this.currentPlayerIndex]; }

    /** Net worth = cash + structure currentValues + resources at market price. */
    netWorth(p) {
      let nw = p.money;
      p.ownedStructures.forEach(s => { nw += s.currentValue; });
      const prices = this.cfg.market.basePrices;
      Object.entries(p.resources).forEach(([res, qty]) => {
        nw += (prices[res] || 0) * qty;
      });
      return Math.round(nw);
    }

    // ── Setup ─────────────────────────────────────────────────────────────
    _initBoard() {
      const { cellSize, originX, originY } = this.cfg.board;
      const { cells, connections } = GF.mapData;

      this.cells = [];

      const cellById = new Map();
      cells.forEach(c => {
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
            gameType = 'buildable';
          } else {
            sprite = 'cell_normal';
            gameType = 'empty';
          }
        }

        const cell = new Cell(c.id, c.x, c.y, gameType, c.district, sprite);
        cell.animator = this.sprites.createAnimator(sprite, 'idle');
        this.cells.push(cell);
        cellById.set(c.id, cell);
      });

      connections.forEach(conn => {
        const fromCell = cellById.get(conn.from);
        const toCell   = cellById.get(conn.to);
        if (!fromCell || !toCell) return;

        if (conn.direction === 'both') {
          if (!fromCell._neighbors.includes(toCell)) fromCell._neighbors.push(toCell);
          if (!toCell._neighbors.includes(fromCell)) toCell._neighbors.push(fromCell);
        } else if (conn.direction === 'forward') {
          if (!fromCell._neighbors.includes(toCell)) fromCell._neighbors.push(toCell);
        }
      });

      // Cardinal slot assignment from neighbor angles
      this.cells.forEach(cell => {
        const candidates = { up: [], down: [], left: [], right: [] };
        cell._neighbors.forEach(neighbor => {
          const dx = neighbor.x - cell.x;
          const dy = neighbor.y - cell.y;
          const angle = Math.atan2(dy, dx);
          let direction;
          if (Math.abs(dy) > Math.abs(dx)) direction = dy > 0 ? 'down' : 'up';
          else                              direction = dx > 0 ? 'right' : 'left';
          candidates[direction].push({ neighbor, angle });
        });

        const cardinalAngles = { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 };

        Object.entries(candidates).forEach(([dir, cands]) => {
          if (cands.length > 0) {
            const cardinal = cardinalAngles[dir];
            let best = cands[0];
            let bestDev = Math.abs(((cands[0].angle - cardinal + Math.PI) % (2 * Math.PI)) - Math.PI);
            for (let i = 1; i < cands.length; i++) {
              const dev = Math.abs(((cands[i].angle - cardinal + Math.PI) % (2 * Math.PI)) - Math.PI);
              if (dev < bestDev) { best = cands[i]; bestDev = dev; }
            }
            cell[dir] = best.neighbor;
          }
        });
      });

      this._toPixel = (cell) => ({ x: originX + cell.x, y: originY + cell.y });
      this._cellSize = cellSize;

      this._computeBoardBounds();
    }

    _computeBoardBounds() {
      if (this.cells.length === 0) return;
      const size = this._cellSize;
      let minX = this.cells[0].x, maxX = this.cells[0].x;
      let minY = this.cells[0].y, maxY = this.cells[0].y;
      this.cells.forEach(c => {
        if (c.x < minX) minX = c.x;
        if (c.x > maxX) maxX = c.x;
        if (c.y < minY) minY = c.y;
        if (c.y > maxY) maxY = c.y;
      });
      const ox = this.cfg.board.originX;
      const oy = this.cfg.board.originY;
      this._boardBounds = {
        minX: ox + minX - size / 2, maxX: ox + maxX + size / 2,
        minY: oy + minY - size / 2, maxY: oy + maxY + size / 2,
      };
      const W = this.cfg.engine.width, H = this.cfg.engine.height;
      const pad = this.cfg.camera.zoomOutPadding;
      const bw = this._boardBounds.maxX - this._boardBounds.minX + pad * 2;
      const bh = this._boardBounds.maxY - this._boardBounds.minY + pad * 2;
      this._camera.zoomedOutScale = Math.min(W / bw, H / bh);
      this._camera.boardCenter = {
        x: (this._boardBounds.minX + this._boardBounds.maxX) / 2,
        y: (this._boardBounds.minY + this._boardBounds.maxY) / 2,
      };
    }

    _initPlayers() {
      this.players = [];
      const startCell = this.cells.find(c => c.type === 'bank') || this.cells[0];
      const count = Math.min(this.menuPlayerCount, this.cfg.players.length);
      const startRes = this.cfg.startingResources || {};
      for (let i = 0; i < count; i++) {
        const def = this.cfg.players[i];
        const p = new Player(i, def, startCell, this.cfg.startingMoney, this.sprites);
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

    movePlayerTo(player, cell) {
      this.engine.events.emit('cell:leave', { player, cell: player.currentCell });
      player.currentCell = cell;
      this.engine.events.emit('cell:enter', { player, cell, final: true });
    }

    // ── Mayor / win condition ─────────────────────────────────────────────
    checkMayor(player, districtId) {
      if (this.districtSys) this.districtSys.recomputeMayor(districtId);
    }

    _getLeader() {
      let best = null;
      this.players.forEach(p => {
        if (p.isBankrupt) return;
        const v = this.netWorth(p);
        if (!best || v > best._v) { best = p; best._v = v; }
      });
      return best;
    }
    _getLowestCash() {
      let lowest = null;
      this.players.forEach(p => {
        if (p.isBankrupt) return;
        if (!lowest || p.money < lowest.money) lowest = p;
      });
      return lowest;
    }
    _grantRandomStructure(player) {
      const empty = this.cells.filter(c => c.type === 'buildable' && !c.structure);
      if (empty.length === 0) return;
      const cell = empty[Math.floor(Math.random() * empty.length)];
      const cat = this.cfg.structures.catalog;
      const entry = cat[Math.floor(Math.random() * cat.length)];
      this.structures.build(cell, entry.type, player.index);
      if (this.districtSys) this.districtSys.recomputeMayor(cell.district);
      this.log(`${player.name} won a free ${entry.label} in ${cell.district}!`);
    }

    _checkWinCondition() {
      const w = this.cfg.win;
      switch (w.type) {
        case 'MoneyOnHand':
          return this.players.find(p => p.money >= w.target) || null;
        case 'TotalValue':
          return this.players.find(p => this.netWorth(p) >= w.target) || null;
        case 'Level':
          return this.players.find(p => p.level >= w.target) || null;
        case 'LastManStanding': {
          const live = this.players.filter(p => !p.isBankrupt);
          return live.length === 1 ? live[0] : null;
        }
        default: return null;
      }
    }

    // ── Camera ────────────────────────────────────────────────────────────
    _zoomInOnPlayer(player) {
      const W = this.cfg.engine.width, H = this.cfg.engine.height;
      const cells = this.cfg.camera.zoomedInCellsAcross;
      const minDim = Math.min(W, H);
      const scale = minDim / (cells * this._cellSize);
      const px = this._toPixel(player.currentCell);
      this._camera.targetScale = scale;
      this._camera.targetCx    = px.x;
      this._camera.targetCy    = px.y;
    }

    _zoomOutToBoard() {
      this._camera.targetScale = this._camera.zoomedOutScale;
      this._camera.targetCx    = this._camera.boardCenter.x;
      this._camera.targetCy    = this._camera.boardCenter.y;
    }

    _snapCamera() {
      this._camera.scale = this._camera.targetScale;
      this._camera.cx    = this._camera.targetCx;
      this._camera.cy    = this._camera.targetCy;
    }

    _updateCamera(dt) {
      const cam = this._camera;
      // During the active player's turn, follow them while zoomed in.
      if (this.gameState === GAME_STATE.PLAYING &&
          this.turn.stage !== TURN_STAGE.BETWEEN &&
          this.turn.player) {
        const px = this._toPixel(this.turn.player.currentCell);
        cam.targetCx = px.x;
        cam.targetCy = px.y;
      }
      const alpha = Math.min(1, this.cfg.camera.lerp * (dt * 60));
      cam.scale += (cam.targetScale - cam.scale) * alpha;
      cam.cx    += (cam.targetCx    - cam.cx)    * alpha;
      cam.cy    += (cam.targetCy    - cam.cy)    * alpha;
    }

    // ── Turn flow ─────────────────────────────────────────────────────────
    _beginBetweenTurns() {
      this._zoomOutToBoard();
      this._betweenTurnsTimer = this.cfg.camera.betweenTurnsHold;
    }

    /** End-of-turn pipeline (Planning §4.3 + §6 + §8 + §9). */
    _runEndOfTurn(player) {
      this.turnCounter = (this.turnCounter || 0) + 1;
      this.log(`${player.name} ends their turn.`);

      // 1. Structure upkeep + per-structure passive (vault upkeep, etc.)
      this.structures.endOfTurnFor(player);

      // 2. Production: structure-driven resources & population contributions.
      this._runProduction(player);

      // 3. Mayor tax collection (only for the player whose turn just ended).
      if (this.districtSys) this.districtSys.collectTaxes(player);

      // 4. Population/happiness/migration tick (every district, once per turn).
      if (this.populationSys) this.populationSys.tick(this.turnCounter, this.players);

      // 5. Market drift.
      if (this.marketSys) this.marketSys.drift();

      // 6. Trade per-turn counters (takeover limit reset).
      if (this.tradeSys) this.tradeSys.resetTurnCounters(player);

      // 7. Sabotage decay — clear sabotage flags whose duration expired.
      this.cells.forEach(c => {
        if (c.structure && c.structure.sabotagedUntilTurn > 0
            && c.structure.sabotagedUntilTurn <= this.turnCounter) {
          c.structure.sabotagedUntilTurn = -1;
        }
      });

      // 8. Cooperative threat track.
      if (this.cfg.mode === 'cooperative') {
        const co = this.cfg.cooperative;
        this.cooperativeThreat += co.threatPerTurn;
        if (this.districtSys) {
          this.districtSys.list().forEach(d => {
            if (d.happiness < 20) this.cooperativeThreat += co.threatPerLowHappiness;
          });
        }
        if (this.cooperativeThreat >= co.threatLimit) {
          this.gameState = GAME_STATE.GAME_OVER;
          this.winner = null; // cooperative loss
          this.log('Cooperative loss — threat reached limit.');
        }
      }

      // 9. Recompute mayor flags after possible bankruptcies / sabotage.
      if (this.districtSys) this.districtSys.recomputeAll();
    }

    /** Per-turn structure production for the player whose turn ended. */
    _runProduction(player) {
      const cfg = this.cfg.structures;
      const industryBonus = this._industryBonus(player);
      player.ownedStructures.forEach(s => {
        if (s.sabotagedUntilTurn > this.turnCounter) return; // idle
        if (s.type === 'factory') {
          const houseBonus = 1 + player.housesOwned * cfg.factoryHouseBonus;
          let qty = Math.max(1, Math.round(cfg.factoryBaseRate * houseBonus * industryBonus.production));
          // District specialty bonus
          if (this.districtSys && s.cell.district) {
            const d = this.districtSys.get(s.cell.district);
            if (d && d.specialty === cfg.factoryResource) qty += this.cfg.market.specialtyBonus;
          }
          player.resources[cfg.factoryResource] =
            (player.resources[cfg.factoryResource] || 0) + qty;
        }
        if (s.type === 'house') {
          // Houses passively contribute residents to their district population
          if (this.districtSys && s.cell.district) {
            const d = this.districtSys.get(s.cell.district);
            if (d) d.population += cfg.housePopContribution;
          }
        }
        if (s.type === 'shop') {
          // Tiny passive owner income (modeled via industry incomeMul)
          const inc = Math.round(20 * industryBonus.income);
          player.money += inc;
        }
      });
    }

    _industryBonus(player) {
      const def = { income: 1, production: 1 };
      if (!player.company) return def;
      const ind = this.cfg.industries;
      const b = ind && ind.bonus[player.company.industry];
      if (!b) return def;
      return {
        income: b.incomeMul || 1,
        production: b.productionMul || 1,
      };
    }

    _advanceToNextPlayer() {
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

      // Build per-district state once we know cells.
      if (this.districtSys) {
        const districtsMeta = (GF.mapData && GF.mapData.districts) || [];
        this.districtSys.init(this.cells, districtsMeta);
        // Bias initial population by district size.
        this.districtSys.list().forEach(d => {
          d.population = Math.round((this.cfg.district.defaultPopulation || 30) * Math.max(1, d.cells.length / 3));
        });
      }

      this.turnCounter = 0;
      this.cooperativeThreat = 0;
      this.eventLog = [];
      this._lastDistrictSig = null;
      this.log('Game started.');
      this.gameState = GAME_STATE.PLAYING;

      // Snap to zoomed-out view first, then turn start zooms in.
      this._zoomOutToBoard();
      this._snapCamera();
      this.turn.startTurn(this.currentPlayer);
    }

    // ── Update ────────────────────────────────────────────────────────────
    _update(dt) {
      this.cells.forEach(c => c.animator && c.animator.update(dt));
      this.players.forEach(p => p.animator.update(dt));
      this.die.update(dt);
      this.menu.update();
      this._updateCamera(dt);

      switch (this.gameState) {
        case GAME_STATE.MENU:
          this._updateMenu();
          break;

        case GAME_STATE.PLAYING:
          // Quick save / load (Planning §16, §18 Phase 8)
          if (this.engine.input.wasPressed('quickSave') && GF.Acca && GF.Acca.Save) {
            GF.Acca.Save.save(this);
            this.log('Quick-saved.');
          }
          if (this.engine.input.wasPressed('quickLoad') && GF.Acca && GF.Acca.Save) {
            if (GF.Acca.Save.load(this)) this.log('Quick-loaded.');
            else this.log('Nothing to load.');
          }
          if (this.turn.stage === TURN_STAGE.BETWEEN) {
            this._betweenTurnsTimer -= dt;
            if (this._betweenTurnsTimer <= 0) {
              this._advanceToNextPlayer();
            }
          } else {
            this.movement.update(dt);
          }
          this._renderHUD();
          break;

        case GAME_STATE.GAME_OVER:
          if (this.engine.input.wasPressed('confirm')) {
            this.gameState = GAME_STATE.MENU;
            this.menuPlayerCount = this.cfg.numberOfPlayers;
            this._lastResSig = null;
            this._lastLogSig = null;
            this._lastPlSig = null;
            this._lastDistrictSig = null;
          }
          break;
      }
    }

    _updateMenu() {
      const inp = this.engine.input;
      if (inp.wasPressed('left'))  this.menuPlayerCount = Math.max(2, this.menuPlayerCount - 1);
      if (inp.wasPressed('right')) this.menuPlayerCount = Math.min(this.cfg.players.length, this.menuPlayerCount + 1);
      if (inp.wasPressed('confirm')) this._beginGame();
    }

    // ── Render ────────────────────────────────────────────────────────────
    _render(ctx) {
      const W = this.cfg.engine.width;
      const H = this.cfg.engine.height;

      this._drawBackground(ctx, W, H);

      switch (this.gameState) {
        case GAME_STATE.MENU:
          this._drawMenu(ctx, W, H);
          break;
        case GAME_STATE.PLAYING:
          this._drawWorld(ctx, W, H);
          this._drawDie(ctx, W, H);
          this._drawMenuOverlay(ctx, W, H);
          break;
        case GAME_STATE.GAME_OVER:
          this._drawWorld(ctx, W, H);
          this._drawGameOver(ctx, W, H);
          break;
      }
    }

    _drawWorld(ctx, W, H) {
      const cam = this._camera;
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(cam.scale, cam.scale);
      ctx.translate(-cam.cx, -cam.cy);
      this._drawBoard(ctx);
      this._drawTokens(ctx);
      ctx.restore();
    }

    _drawBackground(ctx, W, H) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1a2330');
      g.addColorStop(1, '#0a0d12');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

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
      const size = this._cellSize;
      // Board frame
      const b = this._boardBounds;
      if (b) {
        this.ui.drawPanel(ctx, b.minX - 8, b.minY - 8, (b.maxX - b.minX) + 16, (b.maxY - b.minY) + 16, {
          bgColor: 'rgba(0,0,0,0.55)',
          borderColor: '#2a4060',
          borderWidth: 2,
          radius: 6,
        });
      }

      // District tinting — semi-transparent colour wash behind each district's cells
      if (this.districtSys) {
        this.districtSys.list().forEach(d => {
          if (!d.cells || d.cells.length === 0) return;
          let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
          d.cells.forEach(c => {
            const px = this._toPixel(c);
            if (px.x < minX) minX = px.x;
            if (px.x > maxX) maxX = px.x;
            if (px.y < minY) minY = px.y;
            if (px.y > maxY) maxY = px.y;
          });
          ctx.save();
          ctx.fillStyle = d.color;
          ctx.globalAlpha = 0.10;
          ctx.fillRect(minX - size / 2 - 4, minY - size / 2 - 4,
                       (maxX - minX) + size + 8, (maxY - minY) + size + 8);
          ctx.restore();
        });
      }

      this.cells.forEach(cell => {
        const { x, y } = this._toPixel(cell);
        cell.animator.draw(ctx, x, y);

        // Owner ring on owned structures
        if (cell.structure && cell.structure.ownerIndex >= 0) {
          const owner = this.players[cell.structure.ownerIndex];
          ctx.strokeStyle = owner.color;
          ctx.lineWidth   = 3;
          ctx.strokeRect(x - size / 2 + 4, y - size / 2 + 4, size - 8, size - 8);
        }

        // Toll-gate accrued indicator
        if (cell.structure && cell.structure.type === 'toll_gate' && cell.structure.tollAccrued > 0) {
          this.ui.drawText(ctx, `$${cell.structure.tollAccrued}`, x, y + size / 2 - 4, {
            font: 'bold 10px monospace', color: '#ffe7c0', align: 'center', shadow: true,
          });
        }

        // Highlight movable cells during MOVE
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

    _drawDie(ctx, W, H) {
      const stage = this.turn.stage;
      const visibleStages = [TURN_STAGE.ROLL, TURN_STAGE.MOVE];
      if (!visibleStages.includes(stage)) return;
      const dieX = W - 60;
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
      const optH = 24;
      const w    = 320;
      const h    = 56 + (this.menu.subtitle ? 16 : 0) + opts.length * optH + 24;
      const x    = (W / 2) - w / 2;
      const y    = (H / 2) - h / 2;

      UI.drawPanel(ctx, x, y, w, h, {
        bgColor: 'rgba(10,15,25,0.94)',
        borderColor: '#7796c4', borderWidth: 2, radius: 8,
      });

      UI.drawText(ctx, this.menu.title, x + w / 2, y + 12,
        { font: 'bold 16px monospace', color: '#ffffff', align: 'center', shadow: true });

      let curY = y + 36;
      if (this.menu.subtitle) {
        UI.drawText(ctx, this.menu.subtitle, x + w / 2, curY,
          { font: '11px monospace', color: '#9fc8ff', align: 'center' });
        curY += 16;
      }

      opts.forEach((opt, i) => {
        const oy = curY + 8 + i * optH;
        if (i === this.menu.index) {
          ctx.fillStyle = 'rgba(120,160,220,0.25)';
          ctx.fillRect(x + 8, oy - 4, w - 16, optH - 4);
        }
        const prefix = i === this.menu.index ? '> ' : '  ';
        UI.drawText(ctx, prefix + opt.label, x + 24, oy,
          { font: '13px monospace',
            color: i === this.menu.index ? '#ffffff' : '#bcd0e8' });
      });

      UI.drawText(ctx, '↑↓ select   Enter confirm', x + w / 2, y + h - 18,
        { font: '11px monospace', color: '#7793b8', align: 'center' });
    }

    _drawMenu(ctx, W, H) {
      const UI = this.ui;
      UI.drawText(ctx, 'A C C A', W / 2, H * 0.18,
        { font: 'bold 56px monospace', color: '#ffffff',
          align: 'center', shadow: true,
          glow: '#5a8ed1', glowBlur: 22,
          stroke: '#2a4060', strokeWidth: 3 });
      UI.drawText(ctx, 'a board game of property & power', W / 2, H * 0.18 + 50,
        { font: '13px monospace', color: '#9fc8ff', align: 'center' });

      const cy = H * 0.5;
      UI.drawPanel(ctx, W / 2 - 200, cy - 50, 400, 100, {
        bgColor: 'rgba(0,0,0,0.55)',
        borderColor: '#2a4060', borderWidth: 2, radius: 6,
      });
      UI.drawText(ctx, 'PLAYERS', W / 2, cy - 36,
        { font: 'bold 12px monospace', color: '#9fc8ff', align: 'center' });
      UI.drawText(ctx, `<  ${this.menuPlayerCount}  >`, W / 2, cy - 8,
        { font: 'bold 32px monospace', color: '#ffffff', align: 'center', shadow: true });
      UI.drawText(ctx, '← → adjust', W / 2, cy + 30,
        { font: '11px monospace', color: '#7793b8', align: 'center' });

      const tokenY = H * 0.72;
      const spacing = 56;
      const startX = W / 2 - ((this.menuPlayerCount - 1) * spacing) / 2;
      for (let i = 0; i < this.menuPlayerCount; i++) {
        const def = this.cfg.players[i];
        ctx.save();
        ctx.translate(startX + i * spacing, tokenY);
        ctx.scale(1.1, 1.1);
        this.sprites.drawFrame(ctx, def.sprite, 'idle',
          Math.floor(performance.now() / 250) % 4, 0, 0, false);
        ctx.restore();
      }

      const blink = Math.floor(performance.now() / 500) % 2;
      if (blink) {
        UI.drawText(ctx, 'PRESS ENTER TO START', W / 2, H - 50,
          { font: 'bold 16px monospace', color: '#ffffff',
            align: 'center', glow: '#aac8ff', glowBlur: 8 });
      }
      UI.drawText(ctx, 'Arrow keys to move on the board · Enter to confirm',
        W / 2, H - 22,
        { font: '10px monospace', color: '#5e7898', align: 'center' });
    }

    _drawGameOver(ctx, W, H) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      const winner = this.winner;
      this.ui.drawText(ctx, `${winner.name.toUpperCase()} WINS!`, W / 2, H / 2 - 40,
        { font: 'bold 40px monospace', color: winner.color,
          align: 'center', glow: winner.color, glowBlur: 20,
          stroke: '#000000', strokeWidth: 3, shadow: true });
      this.ui.drawText(ctx, `Cash: $${winner.money}    Net Worth: $${this.netWorth(winner)}`,
        W / 2, H / 2 + 16,
        { font: '14px monospace', color: '#cdd6e0', align: 'center' });
      const blink = Math.floor(performance.now() / 600) % 2;
      if (blink) {
        this.ui.drawText(ctx, 'Press Enter to return to menu', W / 2, H - 50,
          { font: 'bold 14px monospace', color: '#ffffff', align: 'center', shadow: true });
      }
    }

    // ── DOM HUD (top bar + sidebars) ──────────────────────────────────────
    _renderHUD() {
      const cur = this.currentPlayer;
      if (!cur) return;
      const dom = this.dom;
      const nw = this.netWorth(cur);

      // Top bar (current player)
      const nameStr = cur.name + (cur.isBankrupt ? ' (bankrupt)' : '');
      if (dom.tbName.textContent !== nameStr) dom.tbName.textContent = nameStr;
      dom.tbName.style.color = cur.color;
      const moneyStr = '$' + cur.money;
      if (dom.tbMoney.textContent !== moneyStr) dom.tbMoney.textContent = moneyStr;
      const nwStr = '$' + nw;
      if (dom.tbNetWorth.textContent !== nwStr) dom.tbNetWorth.textContent = nwStr;

      // Resources pills
      const resCfg = this.cfg.market.resources;
      const sigParts = resCfg.map(r => (cur.resources[r] || 0));
      const sig = sigParts.join(',');
      if (this._lastResSig !== sig) {
        this._lastResSig = sig;
        dom.tbResources.innerHTML = '';
        resCfg.forEach((r) => {
          const qty = cur.resources[r] || 0;
          const pill = document.createElement('span');
          pill.className = 'res-pill';
          pill.innerHTML = `<span class="res-name">${r.slice(0, 3)}</span><span class="res-val">${qty}</span>`;
          dom.tbResources.appendChild(pill);
        });
      }

      // Notifications
      const logSig = this.eventLog.length + ':' + (this.eventLog[this.eventLog.length - 1] || '');
      if (this._lastLogSig !== logSig) {
        this._lastLogSig = logSig;
        dom.notifications.innerHTML = '';
        const recent = this.eventLog.slice(-12);
        recent.forEach((msg, idx) => {
          const div = document.createElement('div');
          div.className = 'notif' + (idx === recent.length - 1 ? ' latest' : '');
          div.textContent = msg;
          dom.notifications.appendChild(div);
        });
        dom.notifications.scrollTop = dom.notifications.scrollHeight;
      }

      // Player list
      const plSig = this.players.map(p =>
        `${p.index}:${p.money}:${this.netWorth(p)}:${p.isBankrupt ? 1 : 0}:${p.index === this.currentPlayerIndex ? 1 : 0}`
      ).join('|');
      if (this._lastPlSig !== plSig) {
        this._lastPlSig = plSig;
        dom.playerList.innerHTML = '';
        this.players.forEach((p, i) => {
          const row = document.createElement('div');
          row.className = 'pl-row' +
            (i === this.currentPlayerIndex ? ' active' : '') +
            (p.isBankrupt ? ' bankrupt' : '');
          row.innerHTML =
            `<div class="pl-color" style="background:${p.color}"></div>` +
            `<div class="pl-info">` +
              `<div class="pl-name" style="color:${p.color}">${p.name}</div>` +
              `<div class="pl-stat">Net: $${this.netWorth(p)}</div>` +
              `<div class="pl-stat">Cash: $${p.money} · Structures: ${p.ownedStructures.length}</div>` +
            `</div>`;
          dom.playerList.appendChild(row);
        });
      }

      // Left sidebar: district info
      this._renderDistrictSidebar();
    }

    /** Populate the left sidebar with per-district stats. */
    _renderDistrictSidebar() {
      const list = this.dom.districtList;
      if (!list) return;

      if (!this.districtSys) {
        list.innerHTML = '';
        return;
      }

      const districts = this.districtSys.list().sort((a, b) => a.id.localeCompare(b.id));
      const sig = districts.map(d =>
        `${d.id}:${d.population}:${Math.round(d.happiness)}:${d.mayorIndex}:${Math.round(d.taxRate * 100)}`
      ).join('|');
      if (this._lastDistrictSig === sig) return;
      this._lastDistrictSig = sig;

      list.innerHTML = '';
      districts.forEach(d => {
        const mayor = d.mayorIndex >= 0 ? this.players[d.mayorIndex] : null;
        const moodLabel = d.happiness >= 70 ? 'happy'
                        : d.happiness >= 40 ? 'ok'
                        : d.happiness >= 20 ? 'sad'
                        : 'angry';
        const owned = d.cells.filter(c => c.structure).length;
        const total = d.cells.filter(c => c.type === 'buildable').length;

        const row = document.createElement('div');
        row.className = 'dist-row';
        row.innerHTML =
          `<div class="dist-header">` +
            `<span class="dist-name" style="border-left-color:${d.color}">${d.id}</span>` +
            (d.specialty ? `<span class="dist-tag">${d.specialty}</span>` : '') +
          `</div>` +
          `<div class="dist-body">` +
            `<div class="dist-line">Pop <strong>${d.population}</strong>&ensp;Hap <span class="dist-mood dist-mood-${moodLabel}">${Math.round(d.happiness)}</span></div>` +
            `<div class="dist-line">Tax <strong>${Math.round(d.taxRate * 100)}%</strong>&ensp;Bldg ${owned}/${total}</div>` +
            `<div class="dist-line dist-mayor-line">${mayor
              ? `<span class="dist-mayor-dot" style="background:${mayor.color}"></span><span style="color:${mayor.color}">${mayor.name}</span>`
              : '<span class="dim">No mayor</span>'}</div>` +
          `</div>`;
        list.appendChild(row);
      });
    }
  }

  // -- Bootstrap --
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

})(window.GF = window.GF || {});
