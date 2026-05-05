// games/Acca2/managers/EconomyManager.js
// All cash/resource flows that fire automatically per turn:
//   • Start-of-turn: per-structure passive production (shop income, factory
//     output, house population/rent), mayor tax collection, catch-up bonus,
//     contextual "tip" prompts.
//   • End-of-turn: resource upkeep (food/electricity/oil), debt resolution
//     (auto-sell vault → resources → structures), bankruptcy check,
//     world ticks (population, market drift, sabotage decay, mayor recompute,
//     cooperative threat).

(function (GF) {
  'use strict';
  const A = GF.Acca = GF.Acca || {};

  class EconomyManager {
    constructor(game) {
      this.game = game;
    }

    // ── Start-of-turn pipeline ───────────────────────────────────────────
    runStartOfTurn(player) {
      this._runProduction(player);
      if (this.game.districtSys) this.game.districtSys.collectTaxes(player);
      this._runCatchUpBonus(player);
      this._runContextualPrompts(player);
    }

    // ── End-of-turn pipeline ─────────────────────────────────────────────
    runEndOfTurn(player) {
      const game = this.game;
      game.turnCounter = (game.turnCounter || 0) + 1;
      game.log(`${player.name} ends their turn.`);

      this._runResourceUpkeep(player);
      game.structures.endOfTurnFor(player);
      this._resolveDebt(player);
      this._checkBankruptcy(player);

      if (game.populationSys) game.populationSys.tick(game.turnCounter, game.players);
      if (game.marketSys)     game.marketSys.drift();
      if (game.tradeSys)      game.tradeSys.resetTurnCounters(player);

      // Sabotage decay — clear sabotage flags whose duration expired.
      game.cells.forEach(c => {
        if (c.structure && c.structure.sabotagedUntilTurn > 0
            && c.structure.sabotagedUntilTurn <= game.turnCounter) {
          c.structure.sabotagedUntilTurn = -1;
        }
      });

      this._tickCoopThreat();

      if (game.districtSys) game.districtSys.recomputeAll();
    }

    // ── Production ───────────────────────────────────────────────────────
    /** Per-turn structure production for the active player.
     *  Invoked at TURN_START so a structure built last turn pays out this turn
     *  (and a freshly-built one does not double-dip on the build turn). */
    _runProduction(player) {
      const game = this.game;
      const cfg  = game.cfg.structures;

      // Basic resource stipend: sustains one shop + one house without requiring
      // resource-cell visits every turn. Set in cfg.market.passiveYield.
      const yield1 = game.cfg.market.passiveYield || 0;
      if (yield1 > 0) {
        player.resources.electricity = (player.resources.electricity || 0) + yield1;
        player.resources.food        = (player.resources.food        || 0) + yield1;
      }

      player.ownedStructures.forEach(s => {
        if (s.sabotagedUntilTurn > game.turnCounter) return;
        if ((s.idleUntilTurn || -1) > game.turnCounter) return;

        if (s.type === 'factory') {
          // Factory output is the DISTRICT'S specialty resource (every district
          // produces a different resource); districts without a specialty fall
          // back to the configured factoryResource (food).
          const houseBonus = 1 + player.housesOwned * cfg.factoryHouseBonus;
          const qtyBase = Math.max(1, Math.round(cfg.factoryBaseRate * houseBonus));
          let qty = qtyBase;
          let resource = cfg.factoryResource;
          if (game.districtSys && s.cell.district) {
            const d = game.districtSys.get(s.cell.district);
            if (d && d.specialty) {
              resource = d.specialty;
              qty += game.cfg.market.specialtyBonus || 0;
            }
          }
          player.resources[resource] = (player.resources[resource] || 0) + qty;
        }
        if (s.type === 'house') {
          // Houses passively contribute residents to their district population
          // and earn a small per-turn rent from the resident family.
          if (game.districtSys && s.cell.district) {
            const d = game.districtSys.get(s.cell.district);
            if (d) d.population += cfg.housePopContribution;
          }
          player.money += cfg.houseOwnerIncome || 18;
        }
        if (s.type === 'shop')          player.money += 20;
        if (s.type === 'toll_gate')     player.money += cfg.tollOwnerIncome       || 8;
        if (s.type === 'teleporter')    player.money += cfg.teleporterOwnerIncome || 12;
        if (s.type === 'police_station')player.money += cfg.policeOwnerIncome     || 30;
        if (s.type === 'vault') {
          // 1% interest on stored money plus base bookkeeping fee.
          const stored = s.storedMoney || 0;
          const interestRate = cfg.vaultInterestRate || 0.01;
          const interest = Math.round(stored * interestRate);
          if (interest > 0) s.storedMoney = stored + interest;
          player.money += cfg.vaultOwnerIncome || 10;
        }
      });
    }

    _runCatchUpBonus(player) {
      const game = this.game;
      const cfg  = game.cfg.catchUp || {};
      if (!cfg.enabled) return;
      const live = game.players.filter(p => !p.isBankrupt);
      if (live.length < 2) return;
      const sorted = live.slice().sort((a, b) => game.netWorth(b) - game.netWorth(a));
      const leader = sorted[0];
      const last   = sorted[sorted.length - 1];
      if (player !== last)   return;
      if (player === leader) return;
      const leaderNW  = game.netWorth(leader);
      const myNW      = game.netWorth(player);
      const ratio     = leaderNW > 0 ? myNW / leaderNW : 1;
      const threshold = cfg.threshold || 0.5;
      if (ratio >= threshold) return;
      const bonus = cfg.amount || 100;
      player.addMoney(bonus);
      game.log(`${player.name} receives a $${bonus} catch-up bonus (last place, ${Math.round(ratio * 100)}% of leader).`);
    }

    /** Surface non-obvious affordances at the top of the turn so casual
     *  players actually notice the trade, market, and mayor menus. */
    _runContextualPrompts(player) {
      const game = this.game;
      const M    = game.marketSys;
      const cfg  = game.cfg.market || {};
      // Resource hint: any resource above 20 → suggest visiting the market.
      const hot = (cfg.resources || []).filter(r => (player.resources[r] || 0) >= 20);
      if (hot.length > 0 && M) {
        const r = hot[0];
        const have = player.resources[r] || 0;
        const sellPrice = M.sellPriceOf ? M.sellPriceOf(r) : (cfg.basePrices && cfg.basePrices[r]) || 0;
        game.log(`Tip: you have ${have} ${r} — Market would buy at $${sellPrice} each.`);
      }
      // Cash hint: cheapest build unaffordable → suggest skipping or selling.
      const cheapest = (game.cfg.structures.catalog || []).reduce(
        (m, e) => Math.min(m, e.cost), Infinity);
      if (player.money >= 0 && player.money < cheapest && player.ownedStructures.length === 0) {
        game.log(`Tip: cheapest build is $${cheapest}; you have $${player.money}.`);
      }
      // Mayor hint: mayor of a populous district → flag the Manage menu.
      if (player.districtsMayoredOf && player.districtsMayoredOf.size > 0 && game.districtSys) {
        let totalPop = 0;
        player.districtsMayoredOf.forEach(id => {
          const d = game.districtSys.get(id);
          if (d) totalPop += d.population;
        });
        if (totalPop >= 60) {
          game.log(`Tip: as Mayor you can hold festivals or set tax rates from Manage.`);
        }
      }
      // Trade hint — opponents holding ≥ 5 of a resource you have 0 of.
      if (game.players.length > 1) {
        const opps = game.players.filter(o => o !== player && !o.isBankrupt);
        for (const o of opps) {
          for (const r of (cfg.resources || [])) {
            if ((player.resources[r] || 0) === 0 && (o.resources[r] || 0) >= 5) {
              game.log(`Tip: ${o.name} has ${o.resources[r]} ${r} — try Trade / Hostile actions.`);
              return;
            }
          }
        }
      }
    }

    // ── Upkeep ───────────────────────────────────────────────────────────
    /** Every owned structure consumes a resource. Shortfalls idle one
     *  structure of the affected type for one turn (no production next
     *  start-of-turn) and ding the district's happiness. */
    _runResourceUpkeep(player) {
      const game   = this.game;
      const cfg    = game.cfg.structures;
      const upkeep = cfg.upkeep || {};
      const need = { food: 0, electricity: 0, oil: 0 };
      const idle = [];

      // Houses eat food per residence.
      const houses = player.ownedStructures.filter(s => s.type === 'house');
      const houseFoodPer = upkeep.houseFood || 0;
      if (houses.length > 0 && houseFoodPer > 0) {
        need.food += houses.length * houseFoodPer;
      }

      // Buildings draw electricity (per-type configurable).
      const buildingElec = (s) => {
        if (s.type === 'shop')           return upkeep.shopElectricity        || 0;
        if (s.type === 'house')          return upkeep.houseElectricity       || 0;
        if (s.type === 'police_station') return upkeep.policeElectricity      || 0;
        if (s.type === 'toll_gate')      return upkeep.tollElectricity        || 0;
        if (s.type === 'teleporter')     return upkeep.teleporterElectricity  || 0;
        if (s.type === 'vault')          return upkeep.vaultElectricity       || 0;
        return 0;
      };
      player.ownedStructures.forEach(s => { need.electricity += buildingElec(s); });

      // Factories burn oil.
      const factories = player.ownedStructures.filter(s => s.type === 'factory');
      const factoryOilPer = upkeep.factoryOil || 0;
      need.oil += factories.length * factoryOilPer;

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
        // Shortfall — idle one structure of the affected type. (No forced
        // market buy; forcing cash-negative purchases killed the economy.)
        summary.push(`-${fromStock} ${res} (${short} short — structure idled)`);
        game.log(`${player.name} short on ${res} (need ${required}, have ${have}); structure idled.`);
        let idleType = null;
        if (res === 'food')             idleType = 'house';
        else if (res === 'oil')         idleType = 'factory';
        else if (res === 'electricity') idleType = 'shop';
        if (idleType) {
          const target = player.ownedStructures.find(s => s.type === idleType
            && (s.idleUntilTurn || -1) <= (game.turnCounter || 0));
          if (target) {
            target.idleUntilTurn = (game.turnCounter || 0) + 1;
            idle.push({ type: idleType, district: target.cell && target.cell.district });
          }
        }
      });

      if (idle.length > 0 && game.districtSys) {
        const penalty = upkeep.shortagePenalty || 0;
        idle.forEach(({ district }) => {
          if (!district) return;
          const d = game.districtSys.get(district);
          if (d) d.happiness = Math.max(0, d.happiness - penalty);
        });
      }
      if (summary.length > 0) {
        game.log(`Upkeep for ${player.name}: ${summary.join(', ')}.`);
      }
    }

    // ── Debt resolution ──────────────────────────────────────────────────
    /** Auto-sell to clear debt. Vault stored money first, then resources at
     *  market sell price, then structures at half currentValue (cheapest
     *  first to preserve high-value holdings as long as possible). */
    _resolveDebt(player) {
      const game = this.game;
      if (player.money >= 0) return;

      // 1. Withdraw any vault stored money first — it IS the player's cash.
      const vaults = player.ownedStructures.filter(s => s.type === 'vault' && (s.storedMoney || 0) > 0);
      vaults.forEach(v => {
        if (player.money >= 0) return;
        const amt = v.storedMoney;
        v.storedMoney = 0;
        player.money += amt;
        game.log(`${player.name}'s Vault auto-withdraws $${amt} to cover debt.`);
      });

      // 2. Sell resources at market sell price.
      if (player.money < 0 && game.marketSys) {
        const M = game.marketSys;
        const resList = (game.cfg.market.resources || []).slice()
          .sort((a, b) => (M.sellPriceOf(b) || 0) - (M.sellPriceOf(a) || 0));
        resList.forEach(res => {
          if (player.money >= 0) return;
          const have = player.resources[res] || 0;
          if (have <= 0) return;
          const r = M.sell(player, res, have);
          if (r && r.ok) {
            game.log(`${player.name} auto-sold ${have} ${res} for $${r.totalProceeds} to settle debt.`);
          }
        });
      }

      // 3. Sell structures at half currentValue (cheapest first).
      if (player.money < 0) {
        const sellable = player.ownedStructures.slice().sort((a, b) => a.currentValue - b.currentValue);
        for (const s of sellable) {
          if (player.money >= 0) break;
          const refund = Math.round((s.currentValue || 0) * (game.cfg.property.bankBuybackRate || 0.5));
          const cell = s.cell;
          if (cell) {
            cell.structure = null;
            cell.sprite    = 'cell_property';
            cell.animator  = game.sprites.createAnimator('cell_property', 'idle');
          }
          const idx = player.ownedStructures.indexOf(s);
          if (idx >= 0) player.ownedStructures.splice(idx, 1);
          player.money += refund;
          game.log(`${player.name} auto-sold their ${s.type} in ${cell && cell.district || '(?)'} for $${refund} to settle debt.`);
          if (game.districtSys && cell && cell.district) game.districtSys.recomputeMayor(cell.district);
        }
      }
    }

    _checkBankruptcy(player) {
      const game = this.game;
      const nw = game.netWorth(player);
      if (nw <= 0 && !player.isBankrupt) {
        player.isBankrupt = true;
        game.log(`${player.name} is bankrupt — net worth $${nw}.`);
      } else if (nw > 0 && player.isBankrupt) {
        // Recovery (rare but possible if sabotage decay restored value).
        player.isBankrupt = false;
        game.log(`${player.name} is no longer bankrupt.`);
      }
    }

    _tickCoopThreat() {
      const game = this.game;
      if (game.cfg.mode !== 'cooperative') return;
      const co = game.cfg.cooperative;
      game.cooperativeThreat += co.threatPerTurn;
      if (game.districtSys) {
        game.districtSys.list().forEach(d => {
          if (d.happiness < 20) game.cooperativeThreat += co.threatPerLowHappiness;
        });
      }
      if (game.cooperativeThreat >= co.threatLimit) {
        game.gameState = A.GAME_STATE.GAME_OVER;
        game.winner = null; // cooperative loss
        game.log('Cooperative loss — threat reached limit.');
      }
    }
  }

  A.EconomyManager = EconomyManager;

})(window.GF = window.GF || {});
