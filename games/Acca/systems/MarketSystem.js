// games/Acca/systems/MarketSystem.js — Planning §6.4
// Spot market with supply/demand-driven price drift.

(function (GF) {
  'use strict';
  GF.Acca = GF.Acca || {};

  class MarketSystem {
    constructor(cfg, eventBus) {
      this.cfg     = cfg.market;
      this.events  = eventBus;
      this.basePrices = Object.assign({}, this.cfg.basePrices);
      this.prices     = Object.assign({}, this.cfg.basePrices);
      this.supplyMA   = {};
      this.demandMA   = {};
      this.cfg.resources.forEach(r => {
        this.supplyMA[r] = 0;
        this.demandMA[r] = 0;
      });
    }

    priceOf(resource) {
      return this.prices[resource] || 0;
    }

    sellPriceOf(resource) {
      return Math.max(1, Math.round(this.priceOf(resource) * this.cfg.sellSpread));
    }

    /** Buy `qty` of `resource`. Returns {ok, totalCost, reason?}. */
    buy(player, resource, qty) {
      if (qty <= 0) return { ok: false, reason: 'qty must be > 0' };
      const total = this.priceOf(resource) * qty;
      if (player.money < total) return { ok: false, reason: 'cannot afford' };
      player.money -= total;
      player.resources[resource] = (player.resources[resource] || 0) + qty;
      this._mix('demandMA', resource, qty);
      this.events.emit('market:bought', { player, resource, qty, total });
      return { ok: true, totalCost: total };
    }

    /** Sell `qty` of `resource`. Returns {ok, totalProceeds, reason?}. */
    sell(player, resource, qty) {
      if (qty <= 0) return { ok: false, reason: 'qty must be > 0' };
      const have = player.resources[resource] || 0;
      if (have < qty) return { ok: false, reason: 'insufficient' };
      const total = this.sellPriceOf(resource) * qty;
      player.resources[resource] = have - qty;
      player.money += total;
      this._mix('supplyMA', resource, qty);
      this.events.emit('market:sold', { player, resource, qty, total });
      return { ok: true, totalProceeds: total };
    }

    /** Drift prices toward supply/demand-driven targets. Call once per turn. */
    drift() {
      const c = this.cfg;
      this.cfg.resources.forEach(r => {
        const ratio  = (1 + this.demandMA[r]) / (1 + this.supplyMA[r]);
        const base   = this.basePrices[r];
        const target = Math.max(base * c.priceFloorMul,
                       Math.min(base * c.priceCeilMul, base * ratio));
        const old    = this.prices[r];
        const next   = Math.max(1, Math.round(old + (target - old) * c.driftRate));
        if (next !== old) {
          this.prices[r] = next;
          this.events.emit('market:priceChanged', {
            resource: r, oldPrice: old, newPrice: next,
            delta: next - old, ratio: (next - old) / Math.max(1, old),
          });
        }
        // decay MAs each drift so old transactions stop dominating
        this.supplyMA[r] *= 0.85;
        this.demandMA[r] *= 0.85;
      });
    }

    _mix(channel, resource, qty) {
      const a = this.cfg.movingAvgAlpha;
      const cur = this[channel][resource] || 0;
      this[channel][resource] = a * qty + (1 - a) * cur;
    }

    serialize() {
      return {
        prices: Object.assign({}, this.prices),
        supplyMA: Object.assign({}, this.supplyMA),
        demandMA: Object.assign({}, this.demandMA),
      };
    }

    deserialize(data) {
      if (!data) return;
      if (data.prices)   Object.assign(this.prices, data.prices);
      if (data.supplyMA) Object.assign(this.supplyMA, data.supplyMA);
      if (data.demandMA) Object.assign(this.demandMA, data.demandMA);
    }
  }

  GF.Acca.MarketSystem = MarketSystem;

})(window.GF = window.GF || {});
