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
      this._runEndgameEscalation(player);
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

      // Pre-tally how many shops the player owns *per district* so the
      // per-shop diminishing-returns multiplier can be applied consistently
      // (the second shop in a district yields 1/(1+0.5)=66%, third yields 50%,
      // etc.). This breaks the "shops everywhere" attractor identified in the
      // playtest while keeping shops viable.
      const shopsByDistrict = {};
      player.ownedStructures.forEach(s => {
        if (s.type === 'shop' && s.cell && s.cell.district) {
          shopsByDistrict[s.cell.district] = (shopsByDistrict[s.cell.district] || 0) + 1;
        }
      });
      const districtShopIdx = {};

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
          // Factory output also dumps a configurable share into the global
          // market pool, so producing a resource at scale presses its price
          // down (per Planning §F market redesign — replenishment via
          // factories closes the never-build exploit). Default = full share.
          const factoryShare = (game.cfg.market && game.cfg.market.factoryDumpShare != null)
            ? game.cfg.market.factoryDumpShare
            : 1.0;
          const dump = Math.max(0, Math.round(qty * factoryShare));
          if (dump > 0 && game.marketSys && game.marketSys.addStock) {
            game.marketSys.addStock(resource, dump, 'factory');
          }
          // Bug F2 — factory output also replenishes finite resource cells of
          // the SAME resource type so the depletion loop closes. The split
          // is configurable; the default (0.5 of qty) goes back to map cells,
          // re-enabling that resource's spawn points after they've been
          // mined out. Distributed evenly across the most-depleted cells of
          // the matching type so popular spots get topped up first.
          this._replenishResourceCells(resource, qty);
          // Flat owner cash from the factory (config: structures.factoryOwnerIncome).
          // Wired here so the rebalanced cost ($500) has a real per-turn payback.
          const flat = cfg.factoryOwnerIncome || 0;
          if (flat > 0) {
            player.addMoney(flat, `Factory income in ${s.cell && s.cell.district || '—'}`);
          }
        }
        if (s.type === 'house') {
          // Houses passively contribute residents to their district population.
          if (game.districtSys && s.cell.district) {
            const d = game.districtSys.get(s.cell.district);
            if (d) d.population += cfg.housePopContribution;
          }
          // Mayor of this house's district auto-collects the per-house tax
          // (formerly a manual menu action on landing). Transferring directly
          // matches the rule that menus must never be used to collect money.
          if (s.cell && s.cell.district
              && player.districtsMayoredOf
              && player.districtsMayoredOf.has(s.cell.district)) {
            const houseTax = cfg.houseTaxIfMayor || 0;
            if (houseTax > 0) {
              player.addMoney(houseTax, `Mayor tax from House in ${s.cell.district}`);
            }
          }
          // Per-turn flat residence income — kept separate from rent (which is
          // visit-driven) so houses pay back even on cells nobody walks to.
          const flat = cfg.houseOwnerIncome || 0;
          if (flat > 0) {
            player.addMoney(flat, `House income in ${s.cell && s.cell.district || '—'}`);
          }
        }
        if (s.type === 'shop') {
          // Shop passive income scales with the shop's invested value and the
          // district's population: income = currentValue * valueRate * (1 + pop / popScale)
          const valueRate = cfg.shopPassiveValueRate || 0.05;
          const popScale  = cfg.shopPassivePopScale  || 100;
          let   distPop   = 0;
          let   distId    = '—';
          if (game.districtSys && s.cell && s.cell.district) {
            const d = game.districtSys.get(s.cell.district);
            if (d) distPop = d.population;
            distId = s.cell.district;
          }
          // Per-district diminishing-returns: 1st shop pays full, 2nd pays
          // 1/(1+k), 3rd pays 1/(1+2k), … where k =
          // structures.shopSameDistrictDimishing (default 0.5).
          const k = (cfg.shopSameDistrictDimishing != null) ? cfg.shopSameDistrictDimishing : 0.5;
          const idx = (districtShopIdx[distId] || 0);
          districtShopIdx[distId] = idx + 1;
          const dimMul = 1 / (1 + k * idx);
          const shopIncome = Math.max(1, Math.round(
            s.currentValue * valueRate * (1 + distPop / popScale) * dimMul));
          const dimNote = idx > 0 ? `, ${Math.round(dimMul * 100)}%` : '';
          player.addMoney(shopIncome,
            `Shop income in ${distId} (val ${s.currentValue}, pop ${distPop}${dimNote})`);
        }
        if (s.type === 'vault') {
          // Interest on stored money plus a small flat ownership stipend
          // (vaultOwnerIncome) so building a vault has a real per-turn return
          // even before you've stored anything.
          const stored = s.storedMoney || 0;
          const interestRate = cfg.vaultInterestRate || 0.01;
          const interest = Math.round(stored * interestRate);
          if (interest > 0) s.storedMoney = stored + interest;
          const flat = cfg.vaultOwnerIncome || 0;
          if (flat > 0) {
            player.addMoney(flat, `Vault stipend in ${s.cell && s.cell.district || '—'}`);
          }
        }
        if (s.type === 'toll_gate') {
          // Bug C1 — toll gates earn ONLY from pass-throughs (see
          // StructureManager.passThroughEffect). The previous per-turn flat
          // `tollOwnerIncome` retainer was removed so that tolls require traffic.
        }
        if (s.type === 'teleporter') {
          // Per-turn idle income for owned teleporters (visitor fees still go
          // through visitorEffect on landing).
          const flat = cfg.teleporterOwnerIncome || 0;
          if (flat > 0) {
            player.addMoney(flat, `Teleporter income in ${s.cell && s.cell.district || '—'}`);
          }
        }
        if (s.type === 'police_station') {
          // Per-turn protection fee — also provides the sabotage shield to
          // structures in the same district.
          const flat = cfg.policeOwnerIncome || 0;
          if (flat > 0) {
            player.addMoney(flat, `Police Station income in ${s.cell && s.cell.district || '—'}`);
          }
        }
      });
    }

    /** Bug F2 — top up finite resource cells when a factory produces.
     *  `factoryReplenishToCells` (config) is the share of factory output
     *  that goes back into map cells; the rest stays as the player's stock
     *  + market pool dump. Distribution is greedy by most-depleted: each
     *  unit lands in the cell currently furthest below its max, so popular
     *  cells refill first. */
    _replenishResourceCells(resource, qty) {
      const game = this.game;
      const mcfg = game.cfg.market || {};
      const share = (mcfg.factoryReplenishToCells != null) ? mcfg.factoryReplenishToCells : 0.5;
      let toDistribute = Math.max(0, Math.round(qty * share));
      if (toDistribute <= 0) return;

      // Identify which game-types correspond to each resource so a steel
      // factory back-fills iron mines, a food factory back-fills farms, etc.
      const TYPES_FOR_RESOURCE = {
        steel:       (cell) => cell.type === 'mine' && cell.subType === 'iron',
        coal:        (cell) => cell.type === 'mine' && cell.subType === 'coal',
        oil:         (cell) => (cell.type === 'mine' && cell.subType === 'oil') || cell.type === 'oil_rig',
        electricity: (cell) => cell.type === 'power_plant',
        water:       (cell) => cell.type === 'well',
        food:        (cell) => cell.type === 'farm',
        wood:        (cell) => cell.type === 'forest',
      };
      const matcher = TYPES_FOR_RESOURCE[resource];
      if (!matcher) return;

      const candidates = (game.cells || []).filter(c =>
        matcher(c) && typeof c.resourceSupply === 'number');
      if (candidates.length === 0) return;

      // Sort most-depleted first (largest gap to max).
      candidates.sort((a, b) => {
        const aGap = (a.resourceSupplyMax || 0) - a.resourceSupply;
        const bGap = (b.resourceSupplyMax || 0) - b.resourceSupply;
        return bGap - aGap;
      });
      // Distribute one unit at a time around the queue so multiple cells get
      // topped up rather than one cell soaking the whole batch.
      let safety = toDistribute * 4;
      while (toDistribute > 0 && safety-- > 0) {
        let placedThisSweep = false;
        for (const c of candidates) {
          if (toDistribute <= 0) break;
          const max = c.resourceSupplyMax || c.resourceSupply || 0;
          if (c.resourceSupply >= max) continue;
          c.resourceSupply += 1;
          toDistribute -= 1;
          placedThisSweep = true;
        }
        if (!placedThisSweep) break;  // every candidate at max
      }
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
      player.addMoney(bonus, `Catch-up bonus (${Math.round(ratio * 100)}% of leader)`);
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
      const need = { food: 0, water: 0, electricity: 0, oil: 0, coal: 0 };
      const idle = [];

      // Houses eat food and drink water per residence (population upkeep).
      const houses = player.ownedStructures.filter(s => s.type === 'house');
      const houseFoodPer  = upkeep.houseFood  || 0;
      const houseWaterPer = upkeep.houseWater || 0;
      if (houses.length > 0) {
        if (houseFoodPer  > 0) need.food  += houses.length * houseFoodPer;
        if (houseWaterPer > 0) need.water += houses.length * houseWaterPer;
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

      // Factories burn oil and coal.
      const factories = player.ownedStructures.filter(s => s.type === 'factory');
      const factoryOilPer  = upkeep.factoryOil  || 0;
      const factoryCoalPer = upkeep.factoryCoal || 0;
      need.oil  += factories.length * factoryOilPer;
      need.coal += factories.length * factoryCoalPer;

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
        else if (res === 'water')       idleType = 'house';
        else if (res === 'oil')         idleType = 'factory';
        else if (res === 'coal')        idleType = 'factory';
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

      // Phase 1.1 — flat cash upkeep per structure. Bleeds players who over-build
      // without income, giving every build decision real weight.
      const flatPer = upkeep.flatCashPerStructure || 0;
      if (flatPer > 0 && player.ownedStructures.length > 0) {
        const cost = player.ownedStructures.length * flatPer;
        player.addMoney(-cost,
          `Structure maintenance (${player.ownedStructures.length} × $${flatPer})`);
      }

      // Phase 1.2 — no-build penalty. Players who haven't built anything past
      // a grace period bleed cash so passive cash-hoarding becomes unviable.
      const noBuildPen   = upkeep.noBuildPenalty || 0;
      const noBuildAfter = upkeep.noBuildPenaltyAfterTurn || 0;
      if (noBuildPen > 0
          && player.ownedStructures.length === 0
          && (game.turnCounter || 0) >= noBuildAfter) {
        player.addMoney(-noBuildPen, `Idle citizen tax (no structures owned)`);
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
        player.addMoney(amt, `Vault auto-withdrawal to cover debt`);
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

      // 3. Sell ONE structure per turn at half currentValue (cheapest first).
      // Capped to a single sale to make the bankruptcy loop bite — if a player
      // still has structures and is still in debt next turn, they'll lose
      // another. Prevents the "auto-rescue out of every disaster in one frame"
      // pathology surfaced in playtesting.
      if (player.money < 0) {
        const sellable = player.ownedStructures.slice().sort((a, b) => a.currentValue - b.currentValue);
        const s = sellable[0];
        if (s) {
          const refund = Math.round((s.currentValue || 0) * (game.cfg.property.bankBuybackRate || 0.5));
          const cell = s.cell;
          if (cell) {
            cell.structure = null;
            cell.sprite    = 'cell_property';
            cell.animator  = game.sprites.createAnimator('cell_property', 'idle');
          }
          const idx = player.ownedStructures.indexOf(s);
          if (idx >= 0) player.ownedStructures.splice(idx, 1);
          player.addMoney(refund, `Auto-sold ${s.type} in ${cell && cell.district || '(?)'} to settle debt`);
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
        if (game.engine && game.engine.events) {
          game.engine.events.emit('player:bankrupted', { player, netWorth: nw });
        }
      } else if (nw > 0 && player.isBankrupt) {
        // Recovery (rare but possible if sabotage decay restored value).
        player.isBankrupt = false;
        game.log(`${player.name} is no longer bankrupt.`);
      }
    }

    /** Phase 5.1 — endgame escalation. After a configurable turn threshold,
     *  apply a cumulative inflation pressure on structure values so net worth
     *  rises faster and a winner is forced. Prevents the 224-turn slog
     *  observed in the playtest baseline (game 9). Compounding +0.5%/turn
     *  past the threshold means a 100-turn overrun roughly +60% on values. */
    _runEndgameEscalation(player) {
      const game = this.game;
      const cfg  = game.cfg.win || {};
      const threshold = cfg.escalationAfterTurn || 150;
      const ratePerTurn = cfg.escalationValueRatePerTurn || 0.005;
      const currentTurn = game.turnCounter || 0;
      if (currentTurn < threshold) return;
      // Apply once per (player) end-of-turn — each structure compounds slightly.
      player.ownedStructures.forEach(s => {
        if (typeof s.currentValue === 'number') {
          s.currentValue = Math.round(s.currentValue * (1 + ratePerTurn));
        }
      });
      // One-shot announcement when the threshold is first crossed.
      if (currentTurn === threshold && player === game.players[0]) {
        game.log(`Boom! Land values are surging — endgame escalation begins (turn ${threshold}).`,
          { noCoalesce: true });
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
