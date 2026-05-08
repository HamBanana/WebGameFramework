// games/Acca/systems/TradeSystem.js — Planning §11.
// Atomic trades, hostile takeovers, sabotage with cooldowns.
// UI: stays text-menu driven; the offer/swap/cooldown logic is system-level.

(function (GF) {
  'use strict';
  GF.Acca = GF.Acca || {};

  class TradeSystem {
    constructor(cfg, eventBus, districtSystem) {
      this.cfg       = cfg;
      this.events    = eventBus;
      this.districts = districtSystem;
      // per-player ephemeral counters: { takeoversThisTurn, sabotageCooldownUntil, takeoverShieldUntil }
      this.state = new Map();
    }

    _state(player) {
      if (!this.state.has(player.index)) {
        this.state.set(player.index, {
          takeoversThisTurn: 0,
          sabotageCooldownUntil: -1,
          takeoverShieldUntil: -1,
        });
      }
      return this.state.get(player.index);
    }

    resetTurnCounters(player) {
      const s = this._state(player);
      s.takeoversThisTurn = 0;
    }

    // ── Trade ─────────────────────────────────────────────────────────────
    /**
     * proposal: {
     *   give: { money, resources: {res:qty}, structures: [Structure] },
     *   receive: same shape
     * }
     * Validated → atomic swap. Returns { ok, reason? }.
     */
    executeTrade(playerA, playerB, proposal) {
      const give = proposal.give    || {};
      const get  = proposal.receive || {};
      // Validate
      if ((give.money || 0) > playerA.money) return { ok: false, reason: 'A short on cash' };
      if ((get.money  || 0) > playerB.money) return { ok: false, reason: 'B short on cash' };
      if (give.resources) {
        for (const r of Object.keys(give.resources)) {
          if ((playerA.resources[r] || 0) < give.resources[r])
            return { ok: false, reason: `A short on ${r}` };
        }
      }
      if (get.resources) {
        for (const r of Object.keys(get.resources)) {
          if ((playerB.resources[r] || 0) < get.resources[r])
            return { ok: false, reason: `B short on ${r}` };
        }
      }
      if (give.structures) {
        for (const s of give.structures) {
          if (s.ownerIndex !== playerA.index)
            return { ok: false, reason: 'A does not own a listed structure' };
          if (s.sabotagedUntilTurn && s.sabotagedUntilTurn > 0)
            return { ok: false, reason: 'sabotaged structure cannot be traded' };
        }
      }
      // Imbalance guard
      const valA = this._estimateValue(give);
      const valB = this._estimateValue(get);
      const imbalance = (valA + valB) > 0
        ? Math.max(valA, valB) / Math.max(1, Math.min(valA, valB))
        : 1;
      if (imbalance > this.cfg.trade.maxImbalanceRatio && !this.cfg.trade.allowImbalanced) {
        return { ok: false, reason: `imbalance ${imbalance.toFixed(1)}× exceeds limit` };
      }

      // Atomic swap
      this._transferMoney(playerA, playerB, give.money || 0);
      this._transferMoney(playerB, playerA, get.money  || 0);
      this._transferResources(playerA, playerB, give.resources || {});
      this._transferResources(playerB, playerA, get.resources  || {});
      (give.structures || []).forEach(s => this._transferStructure(s, playerA, playerB));
      (get.structures  || []).forEach(s => this._transferStructure(s, playerB, playerA));

      this.events.emit('trade:completed', { from: playerA, to: playerB, proposal });
      return { ok: true };
    }

    _estimateValue(side) {
      let v = side.money || 0;
      if (side.resources) {
        Object.entries(side.resources).forEach(([r, q]) => {
          v += (this.cfg.market.basePrices[r] || 0) * q;
        });
      }
      if (side.structures) {
        side.structures.forEach(s => { v += s.currentValue || 0; });
      }
      return v;
    }

    _transferMoney(from, to, amt) {
      if (amt <= 0) return;
      from.addMoney(-amt, `Trade payment to ${to.name}`);
      to.addMoney(amt,    `Trade payment from ${from.name}`);
    }
    _transferResources(from, to, bag) {
      Object.entries(bag).forEach(([r, q]) => {
        if (q <= 0) return;
        from.resources[r] = (from.resources[r] || 0) - q;
        to.resources[r]   = (to.resources[r]   || 0) + q;
      });
    }
    _transferStructure(s, from, to) {
      const idx = from.ownedStructures.indexOf(s);
      if (idx >= 0) from.ownedStructures.splice(idx, 1);
      to.ownedStructures.push(s);
      s.ownerIndex = to.index;
      this.events.emit('structure:transferred', { structure: s, from, to });
      if (s.cell && s.cell.district && this.districts) {
        this.districts.recomputeMayor(s.cell.district);
      }
    }

    // ── Hostile takeover ──────────────────────────────────────────────────
    canTakeover(attacker, structure, turn) {
      if (!structure || structure.ownerIndex === attacker.index) return { ok: false, reason: 'self-owned' };
      if (structure.ownerIndex < 0) return { ok: false, reason: 'not owned' };
      const s = this._state(attacker);
      if (s.takeoversThisTurn >= this.cfg.property.maxTakeoversPerTurn) {
        return { ok: false, reason: 'takeover limit this turn' };
      }
      // Sabotaged structures sell at a discounted multiplier so opportunistic
      // takeovers actually trigger.
      const sabotaged = (turn != null) && (structure.sabotagedUntilTurn > turn);
      const baseMul = this.cfg.property.takeoverMultiplier || 3;
      const sabMul  = (this.cfg.property.takeoverSabotageMultiplier != null)
        ? this.cfg.property.takeoverSabotageMultiplier
        : 1.5;
      const mul = sabotaged ? sabMul : baseMul;
      const cost = Math.round(structure.currentValue * mul);
      if (attacker.money < cost) return { ok: false, reason: `cannot afford ($${cost})` };
      return { ok: true, cost };
    }

    takeover(attacker, structure, players, turn) {
      const check = this.canTakeover(attacker, structure, turn);
      if (!check.ok) return check;
      const owner = players[structure.ownerIndex];
      attacker.addMoney(-check.cost, `Hostile takeover of ${owner.name}'s ${structure.type}`);
      owner.addMoney(check.cost,     `Forced sale of ${structure.type} to ${attacker.name}`);
      this._transferStructure(structure, owner, attacker);
      const s = this._state(attacker);
      s.takeoversThisTurn += 1;
      const ownerState = this._state(owner);
      ownerState.takeoverShieldUntil = turn + 3;
      this.events.emit('property:soldTo',
        { structure, from: owner, to: attacker, via: 'takeover', amount: check.cost });
      return { ok: true, cost: check.cost };
    }

    // ── Sabotage ──────────────────────────────────────────────────────────
    canSabotage(attacker, structure, turn) {
      if (!structure) return { ok: false, reason: 'no target' };
      if (structure.ownerIndex === attacker.index) return { ok: false, reason: 'cannot self-sabotage' };
      if (structure.ownerIndex < 0) return { ok: false, reason: 'unowned' };
      const s = this._state(attacker);
      if (turn < s.sabotageCooldownUntil) return { ok: false, reason: 'cooldown' };
      const cost = this.cfg.sabotage.cost;
      if (attacker.money < cost) return { ok: false, reason: `cannot afford ($${cost})` };
      if ((attacker.resources.oil || 0) < this.cfg.sabotage.oilCost) {
        return { ok: false, reason: 'needs 1 oil' };
      }
      // Police shield: if owner has police_station in same district, sabotage blocked
      if (structure.cell && structure.cell.district) {
        const owner = this._findOwner(structure.ownerIndex);
        if (owner) {
          const hasPolice = owner.ownedStructures.some(o =>
            o.type === 'police_station' && o.cell && o.cell.district === structure.cell.district);
          if (hasPolice) return { ok: false, reason: 'protected by police station' };
        }
      }
      return { ok: true, cost };
    }

    _findOwner(idx) {
      // hooks must inject; called via state map
      // Convenience: we only access ownedStructures, which is available via the structure
      return null; // shielded by player array in caller side
    }

    sabotage(attacker, structure, players, turn) {
      const check = this.canSabotage(attacker, structure, turn);
      // Override _findOwner via direct access here
      const owner = players[structure.ownerIndex];
      if (owner) {
        const hasPolice = owner.ownedStructures.some(o =>
          o.type === 'police_station' && o.cell && o.cell.district === structure.cell.district);
        if (hasPolice) return { ok: false, reason: 'protected by police station' };
      }
      if (!check.ok) return check;
      attacker.addMoney(-check.cost, `Sabotage of ${structure.type}`);
      attacker.resources.oil = (attacker.resources.oil || 0) - this.cfg.sabotage.oilCost;
      structure.sabotagedUntilTurn = turn + this.cfg.sabotage.duration;
      const s = this._state(attacker);
      s.sabotageCooldownUntil = turn + this.cfg.sabotage.cooldown;
      this.events.emit('business:sabotaged',
        { structure, attacker: this.cfg.sabotage.revealAttacker ? attacker : null });
      return { ok: true, cost: check.cost };
    }

    serialize() {
      const out = {};
      this.state.forEach((v, k) => { out[k] = v; });
      return out;
    }
    deserialize(data) {
      if (!data) return;
      this.state.clear();
      Object.entries(data).forEach(([k, v]) => this.state.set(parseInt(k, 10), v));
    }
  }

  GF.Acca.TradeSystem = TradeSystem;

})(window.GF = window.GF || {});
