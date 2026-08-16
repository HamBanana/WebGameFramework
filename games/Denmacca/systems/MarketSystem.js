// games/Acca/systems/MarketSystem.js — Planning §6.4
// Stocks-and-flows market.
//
// Each resource has a global supply pool (`stock[r]`). Buys deplete it, sells
// replenish it. Factories optionally dump surplus to the pool, resource cells
// (mine/well/power_plant) top it up on landing, and population/factory upkeep
// drains it. Price is derived from stock vs a per-resource basis: high stock
// pulls the price down toward `priceFloorMul × basePrice`, empty stock pushes
// it up toward `priceCeilMul × basePrice`.
//
// There is no buy/sell spread — `priceOf === sellPriceOf`. The "never-build
// exploit" from v1 (where hoarding resources off-market valued you at the
// inflated buy price) is closed instead by stock-driven pricing: a player
// holding more resources off-market keeps the global stock low, raising the
// price for everyone (including the next time the hoarder sells).

(function (GF) {
  'use strict';
  GF.Acca = GF.Acca || {};

  class MarketSystem {
    constructor(cfg, eventBus) {
      this.cfg     = cfg.market;
      this.events  = eventBus;
      this.basePrices = Object.assign({}, this.cfg.basePrices);
      this.stock  = {};
      this.basis  = {};
      const startingStock = this.cfg.startingStock || {};
      const stockBasis    = this.cfg.stockBasis    || {};
      const defaultBasis  = (this.cfg.defaultStockBasis != null) ? this.cfg.defaultStockBasis : 10;
      this.cfg.resources.forEach(r => {
        this.stock[r] = (startingStock[r] != null) ? startingStock[r] : defaultBasis;
        this.basis[r] = (stockBasis[r] != null)    ? stockBasis[r]    : defaultBasis;
      });
    }

    /** Single price for buying or selling — no spread (Planning §F). */
    priceOf(resource) {
      const base  = this.basePrices[resource] || 0;
      if (base === 0) return 0;
      const stock = this.stock[resource] || 0;
      const basis = this.basis[resource] || 1;
      const c = this.cfg;
      const scale = Math.max(c.priceFloorMul,
                    Math.min(c.priceCeilMul, basis / Math.max(1, stock)));
      return Math.max(1, Math.round(base * scale));
    }

    sellPriceOf(resource) { return this.priceOf(resource); }

    /** Buy `qty` of `resource`. Returns {ok, totalCost, reason?}. */
    buy(player, resource, qty) {
      if (qty <= 0) return { ok: false, reason: 'qty must be > 0' };
      const have = this.stock[resource] || 0;
      if (have < qty) return { ok: false, reason: `pool depleted (only ${have} ${resource})` };
      const total = this.priceOf(resource) * qty;
      if (player.money < total) return { ok: false, reason: 'cannot afford' };
      const oldPrice = this.priceOf(resource);
      this.stock[resource] = have - qty;
      player.addMoney(-total, `Bought ${qty} ${resource} at Market`);
      player.resources[resource] = (player.resources[resource] || 0) + qty;
      this.events.emit('market:bought', { player, resource, qty, total });
      this._maybeEmitPriceChange(resource, oldPrice);
      return { ok: true, totalCost: total };
    }

    /** Sell `qty` of `resource`. Returns {ok, totalProceeds, reason?}. */
    sell(player, resource, qty) {
      if (qty <= 0) return { ok: false, reason: 'qty must be > 0' };
      const have = player.resources[resource] || 0;
      if (have < qty) return { ok: false, reason: 'insufficient' };
      const oldPrice = this.priceOf(resource);
      const total = this.priceOf(resource) * qty;
      player.resources[resource] = have - qty;
      this.stock[resource] = (this.stock[resource] || 0) + qty;
      player.addMoney(total, `Sold ${qty} ${resource} at Market`);
      this.events.emit('market:sold', { player, resource, qty, total });
      this._maybeEmitPriceChange(resource, oldPrice);
      return { ok: true, totalProceeds: total };
    }

    /** Adjust the global pool from non-trade flows (factory dump, resource-cell
     *  yield, population consumption, chance event). Positive `qty` adds,
     *  negative removes; the pool floors at zero. */
    addStock(resource, qty, source) {
      if (!qty) return;
      const oldPrice = this.priceOf(resource);
      const next = Math.max(0, (this.stock[resource] || 0) + qty);
      this.stock[resource] = next;
      this.events.emit('market:stockChanged', { resource, qty, source, total: next });
      this._maybeEmitPriceChange(resource, oldPrice);
    }

    /** Stock-driven prices update on every flow, so per-turn drift is a no-op
     *  — kept as a hook for callers that already invoke it. */
    drift() {}

    _maybeEmitPriceChange(resource, oldPrice) {
      const newPrice = this.priceOf(resource);
      if (newPrice !== oldPrice) {
        this.events.emit('market:priceChanged', {
          resource, oldPrice, newPrice,
          delta: newPrice - oldPrice,
          ratio: (newPrice - oldPrice) / Math.max(1, oldPrice),
        });
      }
    }

    serialize() {
      return {
        prices: Object.fromEntries(this.cfg.resources.map(r => [r, this.priceOf(r)])),
        stock:  Object.assign({}, this.stock),
      };
    }

    deserialize(data) {
      if (!data) return;
      if (data.stock) Object.assign(this.stock, data.stock);
      // `prices` in old saves is informational; the runtime always derives
      // price from stock, so we just ignore it.
    }
  }

  GF.Acca.MarketSystem = MarketSystem;

})(window.GF = window.GF || {});
