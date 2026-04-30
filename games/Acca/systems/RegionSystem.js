// games/Acca/systems/RegionSystem.js — Planning §9.
// Tracks per-region state (mayor, tax rate, population, happiness, festival/grant
// cooldowns) and runs end-of-turn tax collection. PopulationSystem mutates
// population/happiness; this system owns ownership/mayor/tax mechanics.

(function (GF) {
  'use strict';
  GF.Acca = GF.Acca || {};

  class Region {
    constructor(id, color) {
      this.id       = id;
      this.color    = color || '#666';
      this.cells    = [];
      this.mayorIndex = -1;
      this.taxRate    = 0;       // set by RegionSystem from cfg
      this.population = 0;
      this.happiness  = 50;
      this.festivalUntilTurn = -1;
      this.grantCooldownUntil = -1;
      this.festivalCooldownUntil = -1;
      // For PopulationSystem HUD
      this.birthsThisTurn = 0;
      this.deathsThisTurn = 0;
      this.migratedIn  = 0;
      this.migratedOut = 0;
      this.specialty   = null;   // resource id or null
    }
  }

  class RegionSystem {
    constructor(cfg, eventBus) {
      this.cfg      = cfg;
      this.events   = eventBus;
      this.regions  = new Map();   // id → Region
    }

    /** Build regions from cells; districts are the region IDs. */
    init(cells, districtsMeta) {
      this.regions.clear();
      const metaById = new Map();
      (districtsMeta || []).forEach(m => metaById.set(m.name, m));

      cells.forEach(c => {
        if (!c.district) return;
        if (!this.regions.has(c.district)) {
          const meta = metaById.get(c.district);
          const r = new Region(c.district, meta && meta.color);
          r.taxRate    = this.cfg.region.defaultTaxRate;
          r.population = this.cfg.region.defaultPopulation;
          r.specialty  = meta && meta.specialty || null;
          this.regions.set(c.district, r);
        }
        this.regions.get(c.district).cells.push(c);
      });
    }

    forEach(cb) { this.regions.forEach(cb); }
    list() { return Array.from(this.regions.values()); }
    get(id) { return this.regions.get(id); }

    /** Recompute mayor for `regionId` based on structure ownership. */
    recomputeMayor(regionId) {
      const r = this.regions.get(regionId);
      if (!r) return;
      const buildable = r.cells.filter(c => c.type === 'buildable');
      if (buildable.length === 0) {
        if (r.mayorIndex !== -1) {
          const old = r.mayorIndex;
          r.mayorIndex = -1;
          this.events.emit('region:mayorChanged', { region: r, oldMayor: old, newMayor: -1 });
        }
        return;
      }
      const owners = new Set();
      let allOwned = true;
      for (const c of buildable) {
        if (!c.structure || c.structure.ownerIndex < 0) { allOwned = false; break; }
        owners.add(c.structure.ownerIndex);
      }
      const newMayor = (allOwned && owners.size === 1) ? owners.values().next().value : -1;
      if (newMayor !== r.mayorIndex) {
        const old = r.mayorIndex;
        r.mayorIndex = newMayor;
        this.events.emit('region:mayorChanged', { region: r, oldMayor: old, newMayor });
      }
    }

    /** Recompute mayor for every region — call after bulk ownership changes. */
    recomputeAll() {
      this.regions.forEach((_, id) => this.recomputeMayor(id));
    }

    /** Collect taxes for the player whose turn just ended (Planning §9.2). */
    collectTaxes(player) {
      let total = 0;
      this.regions.forEach(r => {
        if (r.mayorIndex !== player.index) return;
        const earned = Math.round(r.population * r.taxRate * this.cfg.region.taxBase);
        if (earned <= 0) return;
        player.money += earned;
        total += earned;
        this.events.emit('region:taxesPaid', { region: r, mayor: player, amount: earned });
      });
      return total;
    }

    setTaxRate(player, regionId, rate) {
      const r = this.regions.get(regionId);
      if (!r || r.mayorIndex !== player.index) return false;
      r.taxRate = Math.max(0, Math.min(this.cfg.region.maxTaxRate, rate));
      this.events.emit('region:taxRateChanged', { region: r, mayor: player });
      return true;
    }

    holdFestival(player, regionId, turn) {
      const r = this.regions.get(regionId);
      if (!r || r.mayorIndex !== player.index) return { ok: false, reason: 'not mayor' };
      if (turn < r.festivalCooldownUntil) return { ok: false, reason: 'cooldown' };
      const cost = this.cfg.region.festivalCost;
      if (player.money < cost) return { ok: false, reason: 'cannot afford' };
      player.money -= cost;
      r.festivalUntilTurn = turn + this.cfg.region.festivalDuration;
      r.festivalCooldownUntil = turn + this.cfg.region.festivalCooldown;
      r.happiness = Math.min(100, r.happiness + this.cfg.region.festivalHappiness);
      this.events.emit('region:festival', { region: r, mayor: player });
      return { ok: true, cost };
    }

    investmentGrant(player, regionId, turn) {
      const r = this.regions.get(regionId);
      if (!r || r.mayorIndex !== player.index) return { ok: false, reason: 'not mayor' };
      if (turn < r.grantCooldownUntil) return { ok: false, reason: 'cooldown' };
      const cost = this.cfg.region.grantCost;
      if (player.money < cost) return { ok: false, reason: 'cannot afford' };
      player.money -= cost;
      r.population += this.cfg.region.grantPopulation;
      r.grantCooldownUntil = turn + this.cfg.region.grantCooldown;
      this.events.emit('region:grant', { region: r, mayor: player });
      return { ok: true, cost };
    }

    serialize() {
      const out = {};
      this.regions.forEach((r, id) => {
        out[id] = {
          mayorIndex: r.mayorIndex,
          taxRate: r.taxRate,
          population: r.population,
          happiness: r.happiness,
          festivalUntilTurn: r.festivalUntilTurn,
          grantCooldownUntil: r.grantCooldownUntil,
          festivalCooldownUntil: r.festivalCooldownUntil,
        };
      });
      return out;
    }

    deserialize(data) {
      if (!data) return;
      Object.entries(data).forEach(([id, snap]) => {
        const r = this.regions.get(id);
        if (!r) return;
        Object.assign(r, snap);
      });
    }
  }

  GF.Acca.RegionSystem = RegionSystem;
  GF.Acca.Region       = Region;

})(window.GF = window.GF || {});
