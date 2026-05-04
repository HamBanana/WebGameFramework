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
      this.level       = 1;     // vault: 1..5
      this.storedMoney = 0;     // vault: cash deposited by owner (counted in net worth)
      this.idleUntilTurn = -1;  // resource-shortage idle marker (G8)
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

    /** Set the visible face directly (used to count down during movement). */
    setFace(value) {
      const v = Math.max(1, Math.min(6, value | 0));
      this.rolledValue = v;
      this.animator.play('face' + v, true);
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

    /** Adjust ready cash. The cash balance is allowed to go below zero
     *  mid-turn (debt) — the end-of-turn pipeline (AccaGame._resolveDebt)
     *  will force-sell to clear it before the turn rotates, and bankruptcy
     *  fires only when the player's net worth reaches zero. (Playtest #12.)
     */
    addMoney(amount) {
      this.money += amount;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  MovementController — drives stepping during MOVE stage.
  //
  //  Movement uses the cardinal slots (up/down/left/right) that the loader
  //  pre-resolves on every Cell from neighbour angles: each connected
  //  neighbour is bucketed into the direction whose axis it sits closest to,
  //  and the most-cardinal candidate in each bucket wins the slot. The
  //  player then steps to those slots with ↑/↓/←/→ — no road selection,
  //  no pixel-exact alignment requirement, no Enter-to-confirm step.
  //
  //  This means real-world maps (e.g. Denmark) where city links aren't on
  //  a strict 64-pixel grid are still navigable with arrow keys alone.
  //  The trade-off: if a cell has multiple neighbours that resolve into
  //  the same cardinal bucket, only the most-aligned one is reachable.
  // ──────────────────────────────────────────────────────────────────────────
  class MovementController {
    constructor(input, controls, eventBus, game) {
      this.input    = input;
      this.controls = controls;
      this.events   = eventBus;
      this.game     = game;
      this.active   = false;
      this.player   = null;
      this.movesLeft = 0;
      // Adjacent neighbours by cardinal direction (or null).
      this.adjacent = { up: null, down: null, left: null, right: null };
      // Non-adjacent road choices.
      this.roads    = [];
      this.roadIdx  = 0;
    }

    begin(player, moves) {
      this.player    = player;
      this.movesLeft = moves;
      this.active    = true;
      if (this.game && this.game.die) this.game.die.setFace(this.movesLeft);
      this._refreshCandidates();
    }

    /** Pull the current cell's pre-resolved cardinal slots (up/down/left/
     *  right) into the active direction map. The slots are computed once at
     *  map load via greedy angle-fit assignment (see _initBoard), so MOVE
     *  just reads them here. */
    _refreshCandidates() {
      const cur = this.player && this.player.currentCell;
      this.adjacent = { up: null, down: null, left: null, right: null };
      this.roads    = [];
      this.roadIdx  = 0;
      if (!cur) return;
      this.adjacent.up    = cur.up    || null;
      this.adjacent.down  = cur.down  || null;
      this.adjacent.left  = cur.left  || null;
      this.adjacent.right = cur.right || null;
      // Dead-end (no cardinal slots filled) — forfeit movement and log it
      // so the player knows what happened (S23).
      const anyAdj = !!(this.adjacent.up || this.adjacent.down ||
                        this.adjacent.left || this.adjacent.right);
      if (!anyAdj) {
        if (this.game && this.game.log && this.player) {
          this.game.log(`${this.player.name} reached a dead end with ${this.movesLeft} move${this.movesLeft === 1 ? '' : 's'} remaining.`);
        }
        this.active = false;
        this.events.emit('move:complete', { player: this.player });
      }
    }

    /** The road currently highlighted (renderer hook). Returns null when
     *  there are no non-adjacent roads or when MOVE is not active. */
    selectedRoad() {
      if (!this.active || this.roads.length === 0) return null;
      return this.roads[this.roadIdx] || null;
    }

    update() {
      if (!this.active || !this.player) return;
      // Hand input over to the menu while it's visible (e.g. landing on a
      // property → buy/continue prompt).
      if (this.game && this.game.menu && this.game.menu.visible) return;

      // Cardinal stepping — pressing an arrow key with a slot filled in that
      // direction steps immediately. Road selection is no longer used; every
      // reachable neighbour lives in one of the four cardinal slots.
      if (this._pressed('up')    && this.adjacent.up)    { this.stepTo(this.adjacent.up);    return; }
      if (this._pressed('down')  && this.adjacent.down)  { this.stepTo(this.adjacent.down);  return; }
      if (this._pressed('left')  && this.adjacent.left)  { this.stepTo(this.adjacent.left);  return; }
      if (this._pressed('right') && this.adjacent.right) { this.stepTo(this.adjacent.right); return; }
    }

    /** Public so a future hook (e.g. teleporter) can drive movement. */
    stepTo(target) {
      const p = this.player;
      this.events.emit('cell:leave', { player: p, cell: p.currentCell });
      p.currentCell = target;
      this.movesLeft--;
      if (this.game && this.game.die) {
        if (this.movesLeft > 0) this.game.die.setFace(this.movesLeft);
      }
      const final = this.movesLeft <= 0;
      this.events.emit('cell:enter', { player: p, cell: target, final });

      if (final) {
        this.active = false;
        this.adjacent = { up: null, down: null, left: null, right: null };
        this.roads    = [];
        this.events.emit('move:complete', { player: p });
      } else {
        this._refreshCandidates();
      }
    }

    _pressed(action) {
      const codes = this.controls[action];
      if (!codes) return false;
      return codes.some(code => this.input.wasPressed(code));
    }

    cancel() {
      this.active = false;
      this.player = null;
      this.movesLeft = 0;
      this.adjacent = { up: null, down: null, left: null, right: null };
      this.roads    = [];
      this.roadIdx  = 0;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Menu — arrow-key list overlay rendered on the canvas (screen-space)
  // ──────────────────────────────────────────────────────────────────────────
  class Menu {
    constructor(input, controls) {
      this.input          = input;
      this.controls       = controls;
      this.options        = [];
      this.index          = 0;
      this.title          = '';
      this.subtitle       = '';
      this.visible        = false;
      this.onIndexChange  = null;
      this.onCancel       = null;
    }

    /**
     * @param {string} title
     * @param {Array<{label, action, meta?}>} options
     * @param {string} [subtitle]
     * @param {{ onIndexChange?: function, onCancel?: function }} [opts]
     */
    show(title, options, subtitle, opts) {
      this.title    = title;
      this.subtitle = subtitle || '';
      this.options  = options;
      this.index    = 0;
      this.visible  = true;
      this.onIndexChange = (opts && opts.onIndexChange) || null;
      // If no explicit onCancel was provided, default to a "Back" option's action
      // so Escape walks the menu stack the same way the user would. Pass
      // `onCancel: null` (an explicit own-property) to disable Escape entirely
      // (used for mandatory choices like road selection).
      if (opts && Object.prototype.hasOwnProperty.call(opts, 'onCancel')) {
        this.onCancel = opts.onCancel || null;
        this._cancelDisabled = opts.onCancel === null;
      } else {
        const back = options.find(o => o && o.label === 'Back');
        this.onCancel = (back && back.action) || null;
        // If we couldn't find a Back action and the caller didn't supply one,
        // treat Escape as a no-op rather than dismissing the menu into thin
        // air (e.g. the turn-start menu has no "back" since it's the root).
        this._cancelDisabled = !this.onCancel;
      }
      // Fire a synthetic onIndexChange for the initial item so consumers (e.g.
      // the property spotlight) can react immediately when the menu opens.
      if (this.onIndexChange && this.options[0]) {
        this.onIndexChange(this.options[0], 0);
      }
    }

    hide() {
      this.visible = false;
      this.options = [];
      this.subtitle = '';
      this.onIndexChange = null;
      this.onCancel = null;
    }

    update() {
      if (!this.visible || this.options.length === 0) return;

      let moved = false;
      if (this._pressed('up'))   { this.index = (this.index - 1 + this.options.length) % this.options.length; moved = true; }
      if (this._pressed('down')) { this.index = (this.index + 1) % this.options.length; moved = true; }
      if (moved && this.onIndexChange) {
        this.onIndexChange(this.options[this.index], this.index);
      }

      if (this._pressed('cancel')) {
        if (this._cancelDisabled) return; // mandatory choice — ignore Escape
        const cb = this.onCancel;
        this.hide();
        if (cb) cb();
        return;
      }

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
          const levels = cfg.vaultLevels || [];
          const lvl    = structure.level || 1;
          const cur    = levels.find(l => l.level === lvl) || { capacity: 5000 };
          const next   = levels.find(l => l.level === lvl + 1);
          const cap    = cur.capacity;
          const stored = structure.storedMoney || 0;
          const room   = Math.max(0, cap - stored);

          // Deposit choices — small/medium/all that fit the available room.
          const depositSteps = [];
          if (player.money > 0 && room > 0) {
            const candidates = [100, 500, 1000];
            candidates.forEach(amt => {
              const eff = Math.min(amt, player.money, room);
              if (eff > 0 && !depositSteps.includes(eff)) depositSteps.push(eff);
            });
            const allIn = Math.min(player.money, room);
            if (allIn > 0 && !depositSteps.includes(allIn)) depositSteps.push(allIn);
          }
          depositSteps.forEach(amt => {
            opts.push({ label: `Deposit $${amt}  (vault $${stored}/$${cap})`, action: () => {
              player.addMoney(-amt);
              structure.storedMoney = (structure.storedMoney || 0) + amt;
              game.log(`${player.name} deposited $${amt} in their Vault (now $${structure.storedMoney}/$${cap}).`);
              onDone();
            } });
          });

          // Withdraw choices.
          if (stored > 0) {
            [100, 500, 1000].forEach(amt => {
              if (amt > stored) return;
              opts.push({ label: `Withdraw $${amt}`, action: () => {
                structure.storedMoney = stored - amt;
                player.addMoney(amt);
                game.log(`${player.name} withdrew $${amt} from their Vault.`);
                onDone();
              } });
            });
            opts.push({ label: `Withdraw all $${stored}`, action: () => {
              structure.storedMoney = 0;
              player.addMoney(stored);
              game.log(`${player.name} withdrew $${stored} from their Vault.`);
              onDone();
            } });
          }

          // Upgrade.
          if (next) {
            const cost = next.upgradeCost;
            if (player.money >= cost) {
              opts.push({ label: `Upgrade to L${next.level}  ($${cost} → cap $${next.capacity})`, action: () => {
                player.addMoney(-cost);
                structure.level = next.level;
                structure.currentValue += cost;
                game.log(`${player.name} upgraded their Vault to L${next.level} (capacity $${next.capacity}).`);
                onDone();
              } });
            } else {
              opts.push({ label: `Upgrade to L${next.level}  ($${cost})  — cannot afford`, action: onDone, _disabled: true });
            }
          } else {
            opts.push({ label: `Vault is at max level (L${lvl}, cap $${cap})`, action: onDone });
          }
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
          // Vaults are private storage — visitors don't pay rent (P2 rework).
          game.log(`${player.name} walks past ${owner.name}'s Vault.`);
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
      // Vault upkeep was removed in the P2 rework — vaults are now passive
      // money stores with no per-turn cost.
      // Resource upkeep (food/electricity/oil) is handled in
      // AccaGame._runResourceUpkeep, which fires before this hook.
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
          // Passive income / production fires at the START of the turn so
          // newly-built structures don't pay out on the same turn they were built.
          this.game._runStartOfTurn(this.player);
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
          this.game.log(`Move ${this.game.lastRoll} step(s) — use the arrow keys.`);
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
      // Save/Load are always shown for symmetry; Load is greyed out when no
      // saved slot exists. (Playtest #19.)
      opts.push({ label: 'Save game', action: () => {
        if (GF.Acca && GF.Acca.Save) {
          if (GF.Acca.Save.save(game)) game.log('Game saved.');
          else game.log('Save failed.');
        }
        this._showStartMenu();
      } });
      const hasSave = !!(GF.Acca && GF.Acca.Save && GF.Acca.Save.exists());
      opts.push({
        label: hasSave ? 'Load game' : 'Load game  — no save slot',
        _disabled: !hasSave,
        action: () => {
          if (!hasSave) { this._showStartMenu(); return; }
          if (GF.Acca.Save.load(game)) {
            game.log('Game loaded.');
            // The save tracks currentPlayerIndex — re-enter the turn for the
            // player whose turn it was at the time of save.
            this.player = game.currentPlayer;
            this._showStartMenu();
          } else {
            game.log('Load failed.');
            this._showStartMenu();
          }
        },
      });
      // S20 — Full game log panel, paginated.
      opts.push({ label: 'Game log', action: () => this._showGameLog(0) });
      opts.push({ label: 'Pass turn', action: () => this.enter(TURN_STAGE.END_TURN) });
      this.menu.show(`${p.name}'s turn  ($${p.money})`, opts);
    }

    /** S20 — paginated game-log viewer. Shows 14 entries per page in reverse
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
      opts.push({ label: 'Back', action: () => this._showStartMenu() });
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
      const back = () => { game._clearSpotlight(); this._showManageMenu(); };
      const opts = p.ownedStructures.map((s) => ({
        label: `${s.cell.district} · ${this._typeLabel(s.type)} · $${s.currentValue}` +
               ` · cell ${s.cell.id}` +
               (s.sabotagedUntilTurn > game.turnCounter ? ' (sabotaged)' : ''),
        meta: { cell: s.cell, structure: s },
        action: back,
      }));
      if (opts.length === 0) opts.push({ label: '(no structures)', action: back });
      opts.push({ label: 'Back', action: back });
      this.menu.show('Your structures', opts, 'Highlight a property to focus the camera on it.', {
        onIndexChange: (opt) => {
          if (opt && opt.meta && opt.meta.cell) {
            game._spotlightOnCell(opt.meta.cell);
          } else {
            game._clearSpotlight();
          }
        },
        onCancel: back,
      });
    }

    // ── Trade / Hostile actions root ──────────────────────────────────────
    // Hostile takeover of a property is only available by *landing* on it
    // (handled via _offerTakeoverOnLand below) — it is no longer reachable
    // from this menu.
    _showTradeRootMenu() {
      const opts = [
        { label: 'Trade with player',     action: () => this._showTradeTargetMenu() },
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
      // Chance "near-miss": if the landing cell is adjacent to a chance cell
      // and isn't itself a chance cell, fire a low-probability chance event.
      // Keeps the chance pool engaged on small maps where direct chance-cell
      // landings are rare. (2026-05-04 iter 13.)
      if (cell.type !== 'chance' && this.game.chanceSys) {
        const adj = [cell.up, cell.down, cell.left, cell.right].filter(Boolean);
        const nearChance = adj.some(n => n.type === 'chance');
        const cfg = this.game.cfg.chance || {};
        const nearMissProb = cfg.nearMissProb || 0;
        if (nearChance && Math.random() < nearMissProb) {
          this._handleChance();
          return;
        }
      }
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
        case 'power_plant':
          this._grantResource(cell, 'electricity', 3, 'Power Plant');
          break;
        case 'well':
          this._grantResource(cell, 'water', 3, 'Well');
          break;
        case 'mine': {
          // mine.subType ∈ { coal, iron, oil } — iron mines grant steel.
          const meta = (GF.mapData && GF.mapData.cells || []).find(c => c.id === cell.id) || {};
          const sub = meta.subType || 'coal';
          const resource = (sub === 'iron') ? 'steel' : sub;
          this._grantResource(cell, resource, 3, `${sub.charAt(0).toUpperCase()}${sub.slice(1)} Mine`);
          break;
        }
        case 'market':
          // Visiting a market cell shortcuts the player into the market UI.
          this.game.log(`${this.player.name} stops at the Market.`);
          this._showMarketMenu();
          this.stage = TURN_STAGE.LAND_PROMPT;
          break;
        default:
          this.enter(TURN_STAGE.END_TURN);
          break;
      }
    }

    /** Grant a fixed amount of a resource to the active player and log it. */
    _grantResource(cell, resource, qty, label) {
      const p = this.player;
      p.resources[resource] = (p.resources[resource] || 0) + qty;
      this.game.log(`${p.name} stops at the ${label} (+${qty} ${resource}).`);
      this.enter(TURN_STAGE.END_TURN);
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
        // Apply the visit effect (rent / fee), then — provided the player is
        // still on the cell — offer the option to buy the property from its
        // owner. Hostile takeover is only available here, by landing on the
        // cell.
        const visitDoneCb = () => {};
        const followUp = game.structures.visitorEffect(s, p, visitDoneCb);
        const present = () => {
          // If a follow-up effect (teleporter) moved the player off the cell,
          // skip the takeover offer for this structure.
          if (p.currentCell !== s.cell) {
            this.enter(TURN_STAGE.END_TURN);
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
     *  just landed on for 5× current value (Acca playtest fix #2). */
    _offerTakeoverOnLand(structure) {
      const game = this.game;
      const p    = this.player;
      const owner = game.players[structure.ownerIndex];
      const cost  = Math.round(structure.currentValue * game.cfg.property.takeoverMultiplier);
      const opts = [];
      const can  = p.money >= cost;
      const label = can
        ? `Buy from ${owner.name}  ($${cost} = 5× value)`
        : `Buy from ${owner.name}  ($${cost})  — cannot afford`;
      opts.push({
        label,
        action: () => {
          if (!can) { this.enter(TURN_STAGE.END_TURN); return; }
          const r = game.tradeSys.takeover(p, structure, game.players, game.turnCounter);
          game.log(r.ok
            ? `${p.name} bought the ${this._typeLabel(structure.type)} from ${owner.name} for $${r.cost}.`
            : `Purchase refused: ${r.reason}.`);
          this.enter(TURN_STAGE.END_TURN);
        },
      });
      opts.push({ label: 'Continue', action: () => this.enter(TURN_STAGE.END_TURN) });
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
      this.stage = TURN_STAGE.LAND_PROMPT;

      // Sort the catalog by cost ascending so the cheapest builds are at the
      // top (S21). When the player can't afford the cheapest build, show
      // *only* the Skip option with a clear "you can't afford anything"
      // subtitle (iter 15 of the autonomous playtest — the all-disabled-rows
      // state was the dominant late-game UX path on a small map and required
      // 7 keypresses to clear). When the player can afford at least the
      // cheapest, show every catalog entry — affordable ones tappable, the
      // rest greyed out — so the player still sees the upgrade horizon.
      const sorted = cfg.catalog.slice().sort((a, b) => a.cost - b.cost);
      const cheapest = sorted[0] ? sorted[0].cost : 0;
      const canAffordAnything = sorted.some(e => p.money >= e.cost);

      const opts = [];
      if (canAffordAnything) {
        sorted.forEach(entry => {
          const can = p.money >= entry.cost;
          opts.push({
            label: can
              ? `Build ${entry.label} ($${entry.cost})`
              : `Build ${entry.label} ($${entry.cost})  — need $${entry.cost - p.money}`,
            _disabled: !can,
            action: () => {
              if (!can) { this._showBuildMenu(cell); return; }
              p.addMoney(-entry.cost);
              game.structures.build(cell, entry.type, p.index);
              game.log(`${p.name} built a ${entry.label} in ${cell.district}.`);
              game.checkMayor(p, cell.district);
              this.enter(TURN_STAGE.END_TURN);
            },
          });
        });
      }
      opts.push({ label: 'Skip', action: () => this.enter(TURN_STAGE.END_TURN) });

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
      this.movement   = new MovementController(engine.input, ctl, engine.events, this);
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

      // Spotlight target — when set, the camera focuses on this cell and the
      // renderer dims everything else with a vignette / spotlight effect.
      // Used by the "Your structures" portfolio menu.
      this._spotlightCell = null;

      // ── DOM HUD references ────────────────────────────────────────────
      this.dom = {
        container   : document.getElementById('gameContainer'),
        tbTurn      : document.getElementById('tb-turn'),
        tbName      : document.getElementById('tb-name'),
        tbBankruptBadge : document.getElementById('tb-bankrupt-badge'),
        tbMoney     : document.getElementById('tb-money'),
        tbNetWorth  : document.getElementById('tb-networth'),
        tbResources : document.getElementById('tb-resources'),
        notifications: document.getElementById('notifications'),
        playerList  : document.getElementById('playerList'),
        districtList: document.getElementById('districtList'),
      };
      this._lastDomState    = null;
      this._lastDistrictSig = null;

      // Money-change animation tracker. Per-player previous cash + previous
      // resource counts so _renderHUD can flash + spawn floating "+$X" / "-$X"
      // indicators whenever a player's cash moves. Reset in _beginGame so a
      // fresh game doesn't fire deltas on the initial deal.
      this._moneyAnim = null;
      this._lastResPlayerSig = null;

      engine.onUpdate((dt) => this._update(dt));
      engine.onRender((ctx) => this._render(ctx));
    }

    start() { this.engine.start(); }

    // ── Logging ───────────────────────────────────────────────────────────
    log(message) {
      this.eventLog.push(message);
      // Cap raised from 30 to 500 (S20) so the in-game "Game log" panel can
      // surface a useful history. Notifications panel still slices the last
      // 12, so the visible HUD doesn't change.
      const CAP = 500;
      if (this.eventLog.length > CAP) {
        this.eventLog.splice(0, this.eventLog.length - CAP);
      }
    }

    get currentPlayer() { return this.players[this.currentPlayerIndex]; }

    /** Net worth = cash + structure currentValues + vault stored money +
     *  resources at market price. Vault stored money is owner-only; ready
     *  cash may be negative mid-turn (see Player.addMoney) and that's fine
     *  for the net-worth calc — debt is netted against everything else. */
    netWorth(p) {
      let nw = p.money;
      p.ownedStructures.forEach(s => {
        nw += s.currentValue;
        if (s.type === 'vault') nw += (s.storedMoney || 0);
      });
      // Resources count toward net worth at the *liquidation* (sell-spread)
      // value, not the buy-side base price. Reasoning, from the 2026-05-04
      // 10-iteration playtest: with passiveYield = 1 elec + 1 food per turn
      // plus 3-of-resource grants on power_plant/mine/well visits, a player
      // who never builds can passively reach the $5000 NW target purely from
      // resource hoarding (iteration 10 demonstrated all four players hitting
      // $4,830–$5,000 NW with zero structures owned). Valuing at sell-spread
      // closes that exploit while still letting deliberate stockpiling
      // contribute to NW.
      const prices = this.cfg.market.basePrices;
      const spread = (this.cfg.market && this.cfg.market.sellSpread) || 1;
      Object.entries(p.resources).forEach(([res, qty]) => {
        nw += (prices[res] || 0) * spread * qty;
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

        switch (c.type) {
          case 'bank':
            sprite = 'cell_start';
            gameType = 'bank';
            break;

          case 'chance':
            sprite = 'cell_chance';
            gameType = 'chance';
            break;

          case 'market':
            sprite = 'cell_market';
            gameType = 'market';
            break;

          case 'property':
            sprite = 'cell_property';
            gameType = 'buildable';
            break;

          case 'power_plant':
            sprite = 'cell_power_plant';
            gameType = 'power_plant';
            break;

          case 'well':
            sprite = 'cell_well';
            gameType = 'well';
            break;

          case 'mine': {
            // Pick a sub-typed sprite when possible (cell_mine_coal, _iron, _oil)
            // and fall back to the generic cell_mine.
            const sub = c.subType;
            const subSprite = sub ? `cell_mine_${sub}` : null;
            sprite = (subSprite && GF.sprites && GF.sprites[subSprite])
              ? subSprite
              : 'cell_mine';
            gameType = 'mine';
            break;
          }

          case 'structure': {
            // Cell predefined with a structure (e.g. shop). Use the matching
            // structure sprite (cell_shop, cell_factory, etc.); fall back to
            // cell_property if the type is unknown.
            const st = c.structureType;
            const stSprite = st ? `cell_${st}` : null;
            sprite = (stSprite && GF.sprites && GF.sprites[stSprite])
              ? stSprite
              : 'cell_property';
            gameType = 'structure';
            break;
          }

          case 'empty':
          default:
            // Empty plot: a districted empty cell is a buildable property,
            // an undistricted one is a plain landable square.
            if (c.district !== null && c.district !== undefined) {
              sprite = 'cell_property';
              gameType = 'buildable';
            } else {
              sprite = 'cell_normal';
              gameType = 'empty';
            }
            break;
        }

        const cell = new Cell(c.id, c.x, c.y, gameType, c.district, sprite);
        cell.animator = this.sprites.createAnimator(sprite, 'idle');
        this.cells.push(cell);
        cellById.set(c.id, cell);
      });

      // Preserve connections (with resolved Cell refs) for road rendering.
      this._connections = [];
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

        this._connections.push({
          from: fromCell,
          to: toCell,
          direction: conn.direction,
        });
      });

      // Cardinal slot assignment from neighbor angles. Algorithm (S22 expand):
      //   1. For every neighbor, compute its angular deviation from each of
      //      the four cardinal axes (up/down/left/right). Sort the four
      //      directions per neighbor, best fit first.
      //   2. Sort neighbors by their best-fit deviation (most-cardinal first).
      //   3. Greedily assign each neighbor to its first available slot.
      //
      // The previous logic bucketed by dominant axis and only the single
      // most-cardinal candidate in each bucket won a slot — which left
      // multi-neighbor junctions appearing as dead-ends in the playtest.
      // The new pass guarantees that *every* neighbor gets a slot as long
      // as any of the four cardinal buckets is still free, so a 5-way
      // junction is reachable with arrow keys.
      const cardinalAngles = { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 };
      const angularDev = (a, b) => Math.abs(((a - b + Math.PI) % (2 * Math.PI)) - Math.PI);
      this.cells.forEach(cell => {
        cell.up = cell.down = cell.left = cell.right = null;
        if (!cell._neighbors || cell._neighbors.length === 0) return;
        const ranked = cell._neighbors.map(neighbor => {
          const dx = neighbor.x - cell.x;
          const dy = neighbor.y - cell.y;
          const angle = Math.atan2(dy, dx);
          const fits = Object.keys(cardinalAngles).map(dir => ({
            dir,
            dev: angularDev(angle, cardinalAngles[dir]),
          })).sort((a, b) => a.dev - b.dev);
          return { neighbor, fits, bestDev: fits[0].dev };
        }).sort((a, b) => a.bestDev - b.bestDev);

        ranked.forEach(r => {
          for (const f of r.fits) {
            if (cell[f.dir] === null) {
              cell[f.dir] = r.neighbor;
              break;
            }
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
      // Pick the spawn cell: map's spawnCellId wins; fall back to first bank cell.
      // (See playtest #15 — all players share the same spawn so the early game
      //  isn't a single-region land grab.)
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
      // Combined default: net-worth target OR last player standing — whichever
      // fires first. This replaces the cash-only win that 500-turn playtest
      // showed to be effectively unreachable.
      const live = this.players.filter(p => !p.isBankrupt);
      const lastStanding = (live.length === 1) ? live[0] : null;

      // Turn-cap: if a cap is configured and we've hit it, declare the
      // highest-net-worth player the winner rather than letting the game idle.
      const cap = w.turnCap || 0;
      if (cap > 0 && this.turnCounter >= cap && live.length > 0) {
        const sorted = live.slice().sort((a, b) => this.netWorth(b) - this.netWorth(a));
        this.log(`Turn cap (${cap}) reached — ${sorted[0].name} wins by net worth!`);
        return sorted[0];
      }

      switch (w.type) {
        case 'MoneyOnHand':
          return this.players.find(p => p.money >= w.target) || lastStanding;
        case 'NetWorth':
        case 'TotalValue':
          return this.players.find(p => this.netWorth(p) >= w.target) || lastStanding;
        case 'Level':
          return this.players.find(p => p.level >= w.target) || lastStanding;
        case 'LastManStanding':
          return lastStanding;
        case 'NetWorthOrLastStanding':
        default: {
          const target = w.target || 50000;
          // To win by net worth, the player must have engaged with the game's
          // structure-and-property loop at least once (own ≥ 1 structure
          // including auctions and chance-event grants). Closes the
          // never-build exploit identified in 2026-05-04 iteration 10, where
          // a passive player walking onto resource cells could clear the NW
          // target purely from inventory hoarding. Last-Standing path is
          // unaffected — bankruptcy still ends the game normally.
          const byWealth = this.players.find(p =>
            !p.isBankrupt &&
            this.netWorth(p) >= target &&
            (p.ownedStructures && p.ownedStructures.length > 0)
          );
          return byWealth || lastStanding;
        }
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
      // Spotlight wins over follow-the-player so the portfolio menu can focus
      // the camera on the highlighted property.
      if (this._spotlightCell) {
        const px = this._toPixel(this._spotlightCell);
        cam.targetCx = px.x;
        cam.targetCy = px.y;
        // Zoom in tighter on the spotlit cell.
        const W = this.cfg.engine.width, H = this.cfg.engine.height;
        const cells = Math.max(4, this.cfg.camera.zoomedInCellsAcross - 4);
        const minDim = Math.min(W, H);
        cam.targetScale = minDim / (cells * this._cellSize);
      } else if (this.gameState === GAME_STATE.PLAYING &&
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

    /** Spotlight a cell — focus the camera on it and dim the rest of the board. */
    _spotlightOnCell(cell) {
      this._spotlightCell = cell;
      // When the spotlight is engaged, re-zoom on the spotlit cell. The actual
      // scale is computed in _updateCamera each frame.
      if (cell) {
        const px = this._toPixel(cell);
        this._camera.targetCx = px.x;
        this._camera.targetCy = px.y;
      }
    }

    _clearSpotlight() {
      this._spotlightCell = null;
      // Snap-target the active player again so the camera lerps back.
      if (this.turn && this.turn.player) {
        this._zoomInOnPlayer(this.turn.player);
      }
    }

    // ── Turn flow ─────────────────────────────────────────────────────────
    _beginBetweenTurns() {
      this._zoomOutToBoard();
      this._betweenTurnsTimer = this.cfg.camera.betweenTurnsHold;
    }

    /** Start-of-turn pipeline — passive income & production fire BEFORE the
     *  active player rolls, so a structure built last turn pays out this turn
     *  (and a freshly-built one does not double-dip on the build turn). */
    _runStartOfTurn(player) {
      // 1. Per-structure passive production (shop income, factory output,
      //    house population). Mayor tax collection is also a passive income
      //    stream so it lives here too.
      this._runProduction(player);

      // 2. Mayor tax collection (only for the active player).
      if (this.districtSys) this.districtSys.collectTaxes(player);

      // 3. Catch-up bonus — if the active player is the last-place player
      //    AND is significantly behind the leader (default: < 50% of leader
      //    NW), grant a small cash bonus. Keeps games competitive when
      //    early luck or a bad chance event leaves a player too far back to
      //    recover. (iter 16-20 of the autonomous playtest — adds comeback
      //    fun without warping the leader's strategy.)
      this._runCatchUpBonus(player);

      // 4. Contextual prompts (G7) — surface non-obvious affordances at the
      //    top of the turn so casual players actually notice the trade,
      //    market, and mayor menus.
      this._runContextualPrompts(player);
    }

    _runCatchUpBonus(player) {
      const cfg = this.cfg.catchUp || {};
      if (!cfg.enabled) return;
      const live = this.players.filter(p => !p.isBankrupt);
      if (live.length < 2) return;
      const sorted = live.slice().sort((a, b) => this.netWorth(b) - this.netWorth(a));
      const leader = sorted[0];
      const last = sorted[sorted.length - 1];
      if (player !== last) return;
      if (player === leader) return;
      const leaderNW = this.netWorth(leader);
      const myNW = this.netWorth(player);
      const ratio = leaderNW > 0 ? myNW / leaderNW : 1;
      const threshold = cfg.threshold || 0.5;
      if (ratio >= threshold) return;
      const bonus = cfg.amount || 100;
      player.addMoney(bonus);
      this.log(`${player.name} receives a $${bonus} catch-up bonus (last place, ${Math.round(ratio * 100)}% of leader).`);
    }

    /** G7 — emit log/notification lines that nudge the player toward
     *  underused mechanics. Stays advisory: no pop-ups, no blocking menus. */
    _runContextualPrompts(player) {
      const M = this.marketSys;
      const cfg = this.cfg.market || {};
      // Resource hint: any resource above 20 → suggest visiting the market.
      const hot = (cfg.resources || []).filter(r => (player.resources[r] || 0) >= 20);
      if (hot.length > 0 && M) {
        const r = hot[0];
        const have = player.resources[r] || 0;
        const sellPrice = M.sellPriceOf ? M.sellPriceOf(r) : (cfg.basePrices && cfg.basePrices[r]) || 0;
        this.log(`Tip: you have ${have} ${r} — Market would buy at $${sellPrice} each.`);
      }
      // Cash hint: cheapest build unaffordable → suggest skipping or selling.
      const cheapest = (this.cfg.structures.catalog || []).reduce(
        (m, e) => Math.min(m, e.cost), Infinity);
      if (player.money >= 0 && player.money < cheapest && player.ownedStructures.length === 0) {
        this.log(`Tip: cheapest build is $${cheapest}; you have $${player.money}.`);
      }
      // Mayor hint: mayor of a populous district → flag the Manage menu.
      if (player.districtsMayoredOf && player.districtsMayoredOf.size > 0 && this.districtSys) {
        let totalPop = 0;
        player.districtsMayoredOf.forEach(id => {
          const d = this.districtSys.get(id);
          if (d) totalPop += d.population;
        });
        if (totalPop >= 60) {
          this.log(`Tip: as Mayor you can hold festivals or set tax rates from Manage.`);
        }
      }
      // Trade hint — opponents holding ≥ 5 of a resource you have 0 of.
      if (this.players.length > 1) {
        const opps = this.players.filter(o => o !== player && !o.isBankrupt);
        for (const o of opps) {
          for (const r of (cfg.resources || [])) {
            if ((player.resources[r] || 0) === 0 && (o.resources[r] || 0) >= 5) {
              this.log(`Tip: ${o.name} has ${o.resources[r]} ${r} — try Trade / Hostile actions.`);
              return;
            }
          }
        }
      }
    }

    /** End-of-turn pipeline (Planning §4.3 + §6 + §8 + §9). Passive income has
     *  already been awarded at the start of the turn, so end-of-turn only
     *  handles upkeep, world ticks, and bookkeeping. */
    _runEndOfTurn(player) {
      this.turnCounter = (this.turnCounter || 0) + 1;
      this.log(`${player.name} ends their turn.`);

      // 1. Resource upkeep (G8) — houses eat food, buildings draw electricity,
      //    factories burn oil. Shortages idle the structure for the next turn
      //    and ding the district's happiness.
      this._runResourceUpkeep(player);

      // 1b. Structure upkeep (legacy hook — no longer charges vault upkeep).
      this.structures.endOfTurnFor(player);

      // 1c. Force-resolve debt: cash can go below zero mid-turn (e.g. from
      //     resource upkeep), but it has to be back above zero before the
      //     turn rotates. We auto-sell resources (at market sell price) and
      //     then structures (at half currentValue) cheapest-first until the
      //     debt clears or the player runs out of things to sell. (Playtest #12.)
      this._resolveDebt(player);

      // 1d. Bankruptcy check — only fires when *net worth* hits zero
      //     (everything sold, debt still outstanding). The flag now triggers
      //     turn-rotation skipping in _advanceToNextPlayer. (Playtest #12.)
      const nw = this.netWorth(player);
      if (nw <= 0 && !player.isBankrupt) {
        player.isBankrupt = true;
        this.log(`${player.name} is bankrupt — net worth $${nw}.`);
      } else if (nw > 0 && player.isBankrupt) {
        // Recovery (rare but possible if sabotage decay restored value).
        player.isBankrupt = false;
        this.log(`${player.name} is no longer bankrupt.`);
      }

      // 2. Population/happiness/migration tick (every district, once per turn).
      if (this.populationSys) this.populationSys.tick(this.turnCounter, this.players);

      // 3. Market drift.
      if (this.marketSys) this.marketSys.drift();

      // 4. Trade per-turn counters (takeover limit reset).
      if (this.tradeSys) this.tradeSys.resetTurnCounters(player);

      // 5. Sabotage decay — clear sabotage flags whose duration expired.
      this.cells.forEach(c => {
        if (c.structure && c.structure.sabotagedUntilTurn > 0
            && c.structure.sabotagedUntilTurn <= this.turnCounter) {
          c.structure.sabotagedUntilTurn = -1;
        }
      });

      // 6. Cooperative threat track.
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

      // 7. Recompute mayor flags after possible bankruptcies / sabotage.
      if (this.districtSys) this.districtSys.recomputeAll();
    }

    /** Per-turn structure production for the active player.
     *  Now invoked at TURN_START rather than at end-of-turn. */
    _runProduction(player) {
      const cfg = this.cfg.structures;

      // Basic resource stipend: sustains one shop + one house without requiring
      // resource-cell visits every turn. Set in cfg.market.passiveYield.
      const yield1 = this.cfg.market.passiveYield || 0;
      if (yield1 > 0) {
        player.resources.electricity = (player.resources.electricity || 0) + yield1;
        player.resources.food        = (player.resources.food        || 0) + yield1;
      }

      player.ownedStructures.forEach(s => {
        if (s.sabotagedUntilTurn > this.turnCounter) return; // idle from sabotage
        if ((s.idleUntilTurn || -1) > this.turnCounter) return; // idle from upkeep shortage
        if (s.type === 'factory') {
          // Factory output is the DISTRICT'S specialty resource (B18) — that
          // way every district produces a different resource, and across the
          // five Danish regions all of electricity / food / oil / wood / water
          // can be accumulated through factories. Districts without a
          // specialty fall back to the configured factoryResource (food).
          const houseBonus = 1 + player.housesOwned * cfg.factoryHouseBonus;
          const qtyBase = Math.max(1, Math.round(cfg.factoryBaseRate * houseBonus));
          let qty = qtyBase;
          let resource = cfg.factoryResource;
          if (this.districtSys && s.cell.district) {
            const d = this.districtSys.get(s.cell.district);
            if (d && d.specialty) {
              resource = d.specialty;
              qty += this.cfg.market.specialtyBonus || 0;
            }
          }
          player.resources[resource] = (player.resources[resource] || 0) + qty;
        }
        if (s.type === 'house') {
          // Houses passively contribute residents to their district population
          // and earn a small per-turn rent from the resident family. Without
          // this rent, houses were strictly worse than shops and never got
          // built voluntarily (2026-05-04 iter 8 / iter 11 diversified runs).
          if (this.districtSys && s.cell.district) {
            const d = this.districtSys.get(s.cell.district);
            if (d) d.population += cfg.housePopContribution;
          }
          player.money += cfg.houseOwnerIncome || 18;
        }
        if (s.type === 'shop') {
          // Tiny passive owner income.
          player.money += 20;
        }
        if (s.type === 'toll_gate') {
          // Small per-turn maintenance income from the owner's own customers.
          player.money += cfg.tollOwnerIncome || 8;
        }
        if (s.type === 'teleporter') {
          player.money += cfg.teleporterOwnerIncome || 12;
        }
        if (s.type === 'police_station') {
          // Police generate ticket revenue and provide protection.
          player.money += cfg.policeOwnerIncome || 30;
        }
        if (s.type === 'vault') {
          // Vault interest on stored money (1% per turn) plus base bookkeeping
          // fee, so the structure earns even when not actively used.
          const stored = s.storedMoney || 0;
          const interestRate = cfg.vaultInterestRate || 0.01;
          const interest = Math.round(stored * interestRate);
          if (interest > 0) s.storedMoney = stored + interest;
          player.money += cfg.vaultOwnerIncome || 10;
        }
      });
    }

    /** End-of-turn resource upkeep — every owned structure consumes a resource
     *  (G8). Shortfalls force the player to BUY the missing units at market
     *  price (paid out of cash, allowed to push cash negative — debt is
     *  resolved by _resolveDebt afterwards) and idle the structure for one
     *  turn so it produces nothing on the next start-of-turn. */
    _runResourceUpkeep(player) {
      const cfg = this.cfg.structures;
      const upkeep = cfg.upkeep || {};
      const prices = this.cfg.market.basePrices || {};
      // Cost for each resource type the player is missing
      const need = { food: 0, electricity: 0, oil: 0 };
      const idle = [];

      // Houses eat food per resident (housePopContribution residents per house).
      const houses = player.ownedStructures.filter(s => s.type === 'house');
      const houseFoodPer = upkeep.houseFood || 0;
      if (houses.length > 0 && houseFoodPer > 0) {
        need.food += houses.length * houseFoodPer;
      }

      // Buildings draw electricity (per-type configurable).
      const buildingElec = (s) => {
        if (s.type === 'shop')           return upkeep.shopElectricity || 0;
        if (s.type === 'house')          return upkeep.houseElectricity || 0;
        if (s.type === 'police_station') return upkeep.policeElectricity || 0;
        if (s.type === 'toll_gate')      return upkeep.tollElectricity || 0;
        if (s.type === 'teleporter')     return upkeep.teleporterElectricity || 0;
        if (s.type === 'vault')          return upkeep.vaultElectricity || 0;
        return 0;
      };
      player.ownedStructures.forEach(s => { need.electricity += buildingElec(s); });

      // Factories burn oil.
      const factories = player.ownedStructures.filter(s => s.type === 'factory');
      const factoryOilPer = upkeep.factoryOil || 0;
      need.oil += factories.length * factoryOilPer;

      // Pay each resource — first from stockpile, then by buying at market price.
      const summary = [];
      Object.keys(need).forEach(res => {
        const required = need[res];
        if (required <= 0) return;
        const have = player.resources[res] || 0;
        const fromStock = Math.min(have, required);
        player.resources[res] = have - fromStock;
        const short = required - fromStock;
        if (short <= 0) {
          summary.push(`-${fromStock} ${res}`);
          return;
        }
        // Shortfall — idle one structure of the affected type (no forced market
        // buy; forcing cash-negative purchases killed the economy in playtests).
        // The structure produces nothing next turn; district happiness is dinged.
        summary.push(`-${fromStock} ${res} (${short} short — structure idled)`);
        this.log(`${player.name} short on ${res} (need ${required}, have ${have}); structure idled.`);
        // Find one structure of the affected type to idle (cosmetic — flips
        // production off for next turn) and apply happiness penalty.
        let idleType = null;
        if (res === 'food') idleType = 'house';
        else if (res === 'oil') idleType = 'factory';
        else if (res === 'electricity') idleType = 'shop';
        if (idleType) {
          const target = player.ownedStructures.find(s => s.type === idleType
            && (s.idleUntilTurn || -1) <= (this.turnCounter || 0));
          if (target) {
            target.idleUntilTurn = (this.turnCounter || 0) + 1;
            idle.push({ type: idleType, district: target.cell && target.cell.district });
          }
        }
      });

      // Apply happiness penalty for shortages.
      if (idle.length > 0 && this.districtSys) {
        const penalty = upkeep.shortagePenalty || 0;
        idle.forEach(({ district }) => {
          if (!district) return;
          const d = this.districtSys.get(district);
          if (d) d.happiness = Math.max(0, d.happiness - penalty);
        });
      }
      if (summary.length > 0) {
        this.log(`Upkeep for ${player.name}: ${summary.join(', ')}.`);
      }
    }

    /** Auto-sell to clear debt. Resources first (at market sell price), then
     *  structures (at half currentValue, returned to the bank). Vault stored
     *  money is automatically withdrawn first since it's the player's own
     *  cash sitting in storage. */
    _resolveDebt(player) {
      if (player.money >= 0) return;

      // 1. Withdraw any vault stored money first — it IS the player's cash.
      const vaults = player.ownedStructures.filter(s => s.type === 'vault' && (s.storedMoney || 0) > 0);
      vaults.forEach(v => {
        if (player.money >= 0) return;
        const amt = v.storedMoney;
        v.storedMoney = 0;
        player.money += amt;
        this.log(`${player.name}'s Vault auto-withdraws $${amt} to cover debt.`);
      });

      // 2. Sell resources at market sell price.
      if (player.money < 0 && this.marketSys) {
        const M = this.marketSys;
        const resList = (this.cfg.market.resources || []).slice()
          .sort((a, b) => (M.sellPriceOf(b) || 0) - (M.sellPriceOf(a) || 0));
        resList.forEach(res => {
          if (player.money >= 0) return;
          const have = player.resources[res] || 0;
          if (have <= 0) return;
          const r = M.sell(player, res, have);
          if (r && r.ok) {
            this.log(`${player.name} auto-sold ${have} ${res} for $${r.totalProceeds} to settle debt.`);
          }
        });
      }

      // 3. Sell structures at half currentValue (cheapest first to preserve
      //    high-value holdings as long as possible).
      if (player.money < 0) {
        const sellable = player.ownedStructures.slice().sort((a, b) => a.currentValue - b.currentValue);
        for (const s of sellable) {
          if (player.money >= 0) break;
          const refund = Math.round((s.currentValue || 0) * (this.cfg.property.bankBuybackRate || 0.5));
          // Vault stored money was already withdrawn above; if any leaked in
          // as part of currentValue, refund includes it. Detach the structure.
          const cell = s.cell;
          if (cell) {
            cell.structure = null;
            cell.sprite = 'cell_property';
            cell.animator = this.sprites.createAnimator('cell_property', 'idle');
          }
          const idx = player.ownedStructures.indexOf(s);
          if (idx >= 0) player.ownedStructures.splice(idx, 1);
          player.money += refund;
          this.log(`${player.name} auto-sold their ${s.type} in ${cell && cell.district || '(?)'} for $${refund} to settle debt.`);
          if (this.districtSys && cell && cell.district) this.districtSys.recomputeMayor(cell.district);
        }
      }
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
      // Reset money/resource animation trackers so the initial cash deal
      // doesn't get rendered as a +$X delta.
      this._moneyAnim = null;
      this._lastResPlayerSig = null;
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
          // Save / Load are reachable from the Start-of-turn menu — no
          // keyboard shortcut (it used to be F5, which collided with the
          // browser reload).
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
      // Screen-space spotlight overlay.
      this._drawSpotlight(ctx, W, H);
    }

    /** Dim the screen and punch a glowing hole over the spotlit cell. */
    _drawSpotlight(ctx, W, H) {
      const cell = this._spotlightCell;
      if (!cell) return;
      const cam = this._camera;
      const px = this._toPixel(cell);
      const sx = (px.x - cam.cx) * cam.scale + W / 2;
      const sy = (px.y - cam.cy) * cam.scale + H / 2;
      const inner = this._cellSize * cam.scale * 0.65;
      const outer = this._cellSize * cam.scale * 2.4;

      ctx.save();
      const grad = ctx.createRadialGradient(sx, sy, inner, sx, sy, outer);
      grad.addColorStop(0,    'rgba(0,0,0,0)');
      grad.addColorStop(0.55, 'rgba(0,0,0,0.55)');
      grad.addColorStop(1,    'rgba(0,0,0,0.78)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Pulsing halo around the spotlit cell.
      const pulse = 0.7 + 0.3 * Math.abs(Math.sin(performance.now() / 350));
      ctx.strokeStyle = `rgba(255,233,120,${0.55 * pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx, sy, inner * 1.05, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${0.25 * pulse})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx, sy, inner * 1.25, 0, Math.PI * 2);
      ctx.stroke();
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

      // Roads — draw the connections between cells underneath the cell sprites
      // so each cell square sits on top of its roads. Bidirectional pairs are
      // drawn once; forward-only connections are rendered with an arrowhead
      // halfway along to indicate one-way travel.
      this._drawRoads(ctx);

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

        // (Road-selection highlight removed: every reachable neighbour now
        // lives in a cardinal slot, so MOVE is driven purely by arrow keys
        // and there are no on-board road choices to indicate.)
      });

      // P1 — next-cell tooltip preview. While the active player is choosing
      // a direction, label each cardinal-adjacent cell with what kind of
      // cell it is so empty plots, banks, chance cells and structures are
      // distinguishable BEFORE landing on them.
      if (this.gameState === GAME_STATE.PLAYING && this.movement && this.movement.active) {
        const adj = this.movement.adjacent || {};
        ['up', 'down', 'left', 'right'].forEach(dir => {
          const target = adj[dir];
          if (!target) return;
          const px = this._toPixel(target);
          const label = this._describeCell(target);
          if (!label) return;
          this.ui.drawText(ctx, label, px.x, px.y - size / 2 - 6, {
            font: 'bold 10px monospace',
            color: '#ffffff',
            align: 'center',
            stroke: '#000',
            strokeWidth: 3,
          });
        });
      }
    }

    /** P1 — short human-readable description of a cell for the next-cell
     *  tooltip overlay during MOVE stage. */
    _describeCell(cell) {
      if (!cell) return '';
      const labelMap = {
        bank: 'Bank +$200',
        chance: 'Chance',
        market: 'Market',
        power_plant: 'Power Plant',
        well: 'Well',
        mine: 'Mine',
        empty: '',
      };
      if (cell.type === 'buildable') {
        if (cell.structure) {
          const s = cell.structure;
          const owner = (this.players && this.players[s.ownerIndex]) || null;
          const labelEntry = (this.cfg.structures.catalog || []).find(c => c.type === s.type);
          const label = labelEntry ? labelEntry.label : s.type;
          if (owner) {
            return `${label} (${owner.name})`;
          }
          return label;
        }
        return 'Empty plot';
      }
      return labelMap[cell.type] || '';
    }

    /** Draw road segments between connected cells. Roads are rendered before
     *  cells so the cell sprites sit on top, and so roads visibly bridge the
     *  empty space between non-adjacent cells. */
    _drawRoads(ctx) {
      if (!this._connections || this._connections.length === 0) return;
      const size = this._cellSize;

      // De-dupe bidirectional pairs (a-b same as b-a).
      const drawnPairs = new Set();
      const pairKey = (a, b) => (a.id < b.id) ? `${a.id}:${b.id}` : `${b.id}:${a.id}`;

      ctx.save();

      // Two-pass draw: outer dark stroke (asphalt edge), inner lighter stroke.
      const segments = [];
      this._connections.forEach(conn => {
        const a = this._toPixel(conn.from);
        const b = this._toPixel(conn.to);
        const isBoth = conn.direction === 'both';
        if (isBoth) {
          const k = pairKey(conn.from, conn.to);
          if (drawnPairs.has(k)) return;
          drawnPairs.add(k);
        }
        segments.push({ a, b, oneWay: !isBoth });
      });

      // Outer asphalt-edge pass
      ctx.strokeStyle = '#1a1f28';
      ctx.lineWidth   = Math.max(6, size * 0.18);
      ctx.lineCap     = 'round';
      ctx.beginPath();
      segments.forEach(s => {
        ctx.moveTo(s.a.x, s.a.y);
        ctx.lineTo(s.b.x, s.b.y);
      });
      ctx.stroke();

      // Inner road surface pass
      ctx.strokeStyle = '#5b6573';
      ctx.lineWidth   = Math.max(3, size * 0.10);
      ctx.lineCap     = 'round';
      ctx.beginPath();
      segments.forEach(s => {
        ctx.moveTo(s.a.x, s.a.y);
        ctx.lineTo(s.b.x, s.b.y);
      });
      ctx.stroke();

      // Center dashed lane markings — only on long-enough segments so cells
      // sitting close together don't get cluttered.
      ctx.strokeStyle = 'rgba(240, 220, 130, 0.55)';
      ctx.lineWidth   = Math.max(1, size * 0.025);
      ctx.setLineDash([Math.max(4, size * 0.10), Math.max(4, size * 0.10)]);
      ctx.beginPath();
      segments.forEach(s => {
        const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < size * 1.2) return;
        ctx.moveTo(s.a.x, s.a.y);
        ctx.lineTo(s.b.x, s.b.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // One-way arrow markers (mid-segment) for forward-only roads.
      ctx.fillStyle = 'rgba(255, 200, 90, 0.95)';
      segments.forEach(s => {
        if (!s.oneWay) return;
        const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 1) return;
        const ux = dx / len, uy = dy / len;
        const mx = (s.a.x + s.b.x) / 2;
        const my = (s.a.y + s.b.y) / 2;
        const h  = Math.max(7, size * 0.18);
        const w  = h * 0.7;
        // Triangle pointing along the direction A→B.
        const tipX = mx + ux * h * 0.5;
        const tipY = my + uy * h * 0.5;
        const baseX = mx - ux * h * 0.5;
        const baseY = my - uy * h * 0.5;
        const px = -uy, py = ux;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(baseX + px * w * 0.5, baseY + py * w * 0.5);
        ctx.lineTo(baseX - px * w * 0.5, baseY - py * w * 0.5);
        ctx.closePath();
        ctx.fill();
      });

      ctx.restore();
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
        const disabled = !!opt._disabled;
        if (i === this.menu.index) {
          ctx.fillStyle = disabled ? 'rgba(120,120,120,0.18)' : 'rgba(120,160,220,0.25)';
          ctx.fillRect(x + 8, oy - 4, w - 16, optH - 4);
        }
        const prefix = i === this.menu.index ? '> ' : '  ';
        const color = disabled
          ? (i === this.menu.index ? '#9aa0a8' : '#666c75')
          : (i === this.menu.index ? '#ffffff' : '#bcd0e8');
        UI.drawText(ctx, prefix + opt.label, x + 24, oy,
          { font: '13px monospace', color });
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

      // Turn counter — turnCounter is incremented at end-of-turn, so the
      // human-friendly "current turn" is +1.
      if (dom.tbTurn) {
        const turnStr = String((this.turnCounter || 0) + 1);
        if (dom.tbTurn.textContent !== turnStr) dom.tbTurn.textContent = turnStr;
      }

      // Top bar (current player). The "(bankrupt)" suffix used to truncate
      // the topbar money/networth — bankruptcy now renders as a separate
      // pill-shaped badge next to the name. (Playtest #5.)
      if (dom.tbName.textContent !== cur.name) dom.tbName.textContent = cur.name;
      dom.tbName.style.color = cur.color;
      if (dom.tbBankruptBadge) {
        dom.tbBankruptBadge.style.display = cur.isBankrupt ? 'inline-block' : 'none';
      }
      const moneyStr = '$' + cur.money;
      if (dom.tbMoney.textContent !== moneyStr) dom.tbMoney.textContent = moneyStr;
      const nwStr = '$' + nw;
      if (dom.tbNetWorth.textContent !== nwStr) dom.tbNetWorth.textContent = nwStr;

      // Resources pills — sig is keyed on currentPlayer.index so we can tell
      // a turn-rotation rebuild ("everything changed") apart from a real
      // resource gain/loss for the same player (where we want to .bump the
      // changed pills).
      const resCfg = this.cfg.market.resources;
      const sigParts = resCfg.map(r => (cur.resources[r] || 0));
      const sig = sigParts.join(',');
      const playerSig = cur.index + '|' + sig;
      if (this._lastResPlayerSig !== playerSig) {
        const lastSig = this._lastResPlayerSig || '';
        const samePlayer = lastSig.startsWith(cur.index + '|');
        const prevParts = samePlayer
          ? lastSig.slice(String(cur.index).length + 1).split(',')
          : null;
        this._lastResPlayerSig = playerSig;
        this._lastResSig = sig; // legacy field kept for safety
        dom.tbResources.innerHTML = '';
        resCfg.forEach((r, idx) => {
          const qty = cur.resources[r] || 0;
          const pill = document.createElement('span');
          pill.className = 'res-pill';
          if (prevParts && parseInt(prevParts[idx] || '0', 10) !== qty) {
            pill.classList.add('bump');
          }
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

      // Money-change animations — fired AFTER the player list rebuild so the
      // freshly-created rows can pick up the .flash-* class. Diffs cash per
      // player against the previous tick; non-zero deltas pulse the topbar
      // money cell (current player) plus the player-list row, and spawn a
      // floating "+$X" / "-$X" indicator near each.
      this._animateMoneyChanges();

      // Left sidebar: district info
      this._renderDistrictSidebar();
    }

    // ── Money change animations (DOM-driven) ──────────────────────────────
    // Track cash per player across renders. On a delta:
    //   • flash the topbar money value (current player)
    //   • flash the player-list row
    //   • spawn a floating "+$X" / "-$X" indicator that drifts up
    //   • spawn a coin sparkle burst on a gain
    // All animation targets are pure DOM elements; the canvas isn't touched.
    _animateMoneyChanges() {
      if (!this._moneyAnim) {
        this._moneyAnim = { lastMoney: this.players.map(p => p.money) };
        return;
      }
      const last = this._moneyAnim.lastMoney;
      // Defensive: rosters can change between games; resize the array.
      if (last.length !== this.players.length) {
        this._moneyAnim.lastMoney = this.players.map(p => p.money);
        return;
      }
      this.players.forEach((p, i) => {
        const prev = last[i];
        if (prev === undefined) {
          last[i] = p.money;
          return;
        }
        const delta = p.money - prev;
        if (delta !== 0) {
          this._fireMoneyAnim(p, i, delta);
        }
        last[i] = p.money;
      });
    }

    _fireMoneyAnim(player, index, delta) {
      const isCurrent = (index === this.currentPlayerIndex);
      const cls  = delta > 0 ? 'gain' : 'loss';
      const sign = delta > 0 ? '+' : '−'; // proper minus sign
      const txt  = `${sign}$${Math.abs(delta)}`;

      // Topbar money cell: only flashes for the current player (it shows that
      // player's cash) but the player-list row flashes for everyone, so a
      // landlord sees their toll income light up even while another player
      // has the turn.
      if (isCurrent && this.dom.tbMoney) {
        const el = this.dom.tbMoney;
        el.classList.remove('money-gain', 'money-loss');
        // Force reflow so the animation restarts cleanly on rapid back-to-back deltas.
        // eslint-disable-next-line no-unused-expressions
        void el.offsetWidth;
        el.classList.add(delta > 0 ? 'money-gain' : 'money-loss');

        const r = el.getBoundingClientRect();
        this._spawnFloatingDelta(txt, cls, r.left + r.width / 2, r.top - 2, true);

        if (delta > 0) {
          this._spawnCoinBurst(r.left + r.width / 2, r.top + r.height / 2);
        }
      }

      // Player-list row flash + secondary delta indicator. The row may not
      // exist yet on the very first frame (defensive null check).
      if (this.dom.playerList) {
        const row = this.dom.playerList.children[index];
        if (row) {
          row.classList.remove('flash-gain', 'flash-loss');
          // eslint-disable-next-line no-unused-expressions
          void row.offsetWidth;
          row.classList.add(delta > 0 ? 'flash-gain' : 'flash-loss');

          // Don't double-spawn a delta for the current player — the topbar
          // one is already prominent. Off-turn deltas get the row indicator.
          if (!isCurrent) {
            const rr = row.getBoundingClientRect();
            this._spawnFloatingDelta(txt, cls, rr.right - 28, rr.top + rr.height / 2, false);
          }
        }
      }
    }

    /** Spawn an absolute-positioned "+$X" / "-$X" element that floats up and
     *  fades out (animation handled by CSS). Auto-removed after ~1.6s. */
    _spawnFloatingDelta(text, cls, x, y, big) {
      const el = document.createElement('div');
      el.className = 'money-delta ' + cls + (big ? ' big' : '');
      el.textContent = text;
      el.style.left = x + 'px';
      el.style.top  = y + 'px';
      document.body.appendChild(el);
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1700);
    }

    /** Sparkle burst centered on (x, y) — used for cash gains. */
    _spawnCoinBurst(x, y) {
      const burst = document.createElement('div');
      burst.className = 'coin-burst';
      burst.style.left = x + 'px';
      burst.style.top  = y + 'px';
      const SPARKS = 8;
      for (let i = 0; i < SPARKS; i++) {
        const s = document.createElement('div');
        s.className = 'spark';
        const angle = (Math.PI * 2 * i) / SPARKS + (Math.random() - 0.5) * 0.4;
        const dist  = 26 + Math.random() * 22;
        s.style.setProperty('--dx', (Math.cos(angle) * dist).toFixed(1) + 'px');
        s.style.setProperty('--dy', (Math.sin(angle) * dist - 6).toFixed(1) + 'px');
        s.style.animationDelay = (Math.random() * 0.05).toFixed(3) + 's';
        burst.appendChild(s);
      }
      document.body.appendChild(burst);
      setTimeout(() => { if (burst.parentNode) burst.parentNode.removeChild(burst); }, 950);
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
