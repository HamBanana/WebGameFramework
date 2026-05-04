// games/Acca2/managers/StructureManager.js
// Owns structure construction and the on-land/pass-through effects for every
// structure type. The TurnManager funnels landing events here and acts on the
// returned menu options (or applies the immediate effect directly).

(function (GF) {
  'use strict';
  const A = GF.Acca = GF.Acca || {};

  class StructureManager {
    constructor(game) {
      this.game = game;
    }

    /** Build a structure on a cell for an owner. Returns the new structure. */
    build(cell, type, ownerIndex) {
      const cfg   = this.game.cfg.structures;
      const entry = cfg.catalog.find(c => c.type === type);
      if (!entry) return null;

      const spriteName = cfg.sprites[type];
      const animator   = this.game.sprites.createAnimator(spriteName, 'idle');
      const s = new A.PlayerStructure(type, ownerIndex, entry.cost, animator);
      s.cell = cell;
      cell.structure = s;
      cell.sprite    = spriteName;
      cell.animator  = animator;
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
          const cap  = this._shopMaxCapital(structure, player);
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
          this._appendVaultOptions(structure, player, onDone, opts);
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
      const game  = this.game;
      const cfg   = game.cfg.structures;
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
        case 'vault':
          // Vaults are private storage — visitors don't pay rent.
          game.log(`${player.name} walks past ${owner.name}'s Vault.`);
          onDone();
          return null;
        case 'toll_gate':
          // Already paid on pass-through (cell:enter); landing is a no-op extra fee.
          game.log(`${player.name} stops at the Toll Gate.`);
          onDone();
          return null;
        case 'police_station':
          game.log(`${player.name} passes the Police Station.`);
          onDone();
          return null;
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
      const game  = this.game;
      const owner = game.players[s.ownerIndex];
      const due   = s.tollAccrued;
      if (due > 0) {
        this._payRent(player, owner, due, 'pass a Toll Gate');
      } else {
        game.log(`${player.name} passes the Toll Gate (free this time).`);
      }
      s.tollAccrued += game.cfg.structures.tollIncrement;
    }

    /** Legacy hook — vault upkeep was removed in the P2 rework. Resource
     *  upkeep (food/electricity/oil) is handled by EconomyManager. */
    endOfTurnFor(/* player */) {}

    // ── Internals ─────────────────────────────────────────────────────────
    _appendVaultOptions(structure, player, onDone, opts) {
      const game   = this.game;
      const cfg    = game.cfg.structures;
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
        [100, 500, 1000].forEach(amt => {
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

  A.StructureManager = StructureManager;

})(window.GF = window.GF || {});
