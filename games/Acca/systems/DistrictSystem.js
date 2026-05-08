// games/Acca2/systems/DistrictSystem.js — Planning §9.
// Tracks per-district state (mayor, tax rate, population, happiness, festival/grant
// cooldowns) and runs end-of-turn tax collection. PopulationSystem mutates
// population/happiness; this system owns ownership/mayor/tax mechanics.

(function (GF) {
  'use strict';
  GF.Acca = GF.Acca || {};

  class District {
    constructor(id, color, cfg) {
      this.id       = id;
      this.color    = color || '#666';
      this.cells    = [];
      this.mayorIndex = -1;
      this.population = 0;
      this.happiness  = 50;
      this.festivalUntilTurn = -1;
      this.grantCooldownUntil = -1;
      this.festivalCooldownUntil = -1;
      this.birthsThisTurn = 0;
      this.deathsThisTurn = 0;
      this.migratedIn  = 0;
      this.migratedOut = 0;
      this.specialty   = null;
      // taxRate is computed (see getter); _cfg is captured so the getter can
      // read tuning constants without a global lookup.
      this._cfg = cfg || null;
    }

    /** Tax rate is derived from the total currentValue of all owned structures
     *  in the district. Logistic curve: taxRateMin at $0 → asymptote at
     *  taxRateMax for high-value districts. The mayor never tunes the rate;
     *  growing it is a side-effect of investment/renovation/upgrades.
     *
     *  Bounded to [taxRateMin, taxRateMax] from cfg.district. */
    get taxRate() {
      const cfg = (this._cfg && this._cfg.district) || {};
      const lo = cfg.taxRateMin != null ? cfg.taxRateMin : 0.05;
      const hi = cfg.taxRateMax != null ? cfg.taxRateMax : 0.25;
      const anchor = cfg.taxRateAnchor || 1000;
      let totalValue = 0;
      for (const c of this.cells) {
        if (c.structure) totalValue += (c.structure.currentValue || 0);
      }
      const x = totalValue / anchor;
      return lo + (hi - lo) * (x / (x + 4));
    }
  }

  class DistrictSystem {
    constructor(cfg, eventBus) {
      this.cfg       = cfg;
      this.events    = eventBus;
      this.districts = new Map();
    }

    init(cells, districtsMeta) {
      this.districts.clear();
      const metaById = new Map();
      (districtsMeta || []).forEach(m => metaById.set(m.name, m));

      cells.forEach(c => {
        if (!c.district) return;
        if (!this.districts.has(c.district)) {
          const meta = metaById.get(c.district);
          // Pass cfg through so District.taxRate getter can read tuning.
          const d = new District(c.district, meta && meta.color, this.cfg);
          d.population = this.cfg.district.defaultPopulation;
          d.specialty  = (meta && meta.specialty) || null;
          this.districts.set(c.district, d);
        }
        this.districts.get(c.district).cells.push(c);
      });
    }

    forEach(cb) { this.districts.forEach(cb); }
    list() { return Array.from(this.districts.values()); }
    get(id) { return this.districts.get(id); }

    /** Mayor = player with strict majority of buildable cells in the district.
     *  Threshold = floor(buildable/2)+1, so the mayor seat is contested but
     *  reachable in normal 4-player play (vs the v1 "owns all cells" rule). */
    recomputeMayor(districtId) {
      const d = this.districts.get(districtId);
      if (!d) return;
      const buildable = d.cells.filter(c => c.type === 'buildable');
      if (buildable.length === 0) {
        if (d.mayorIndex !== -1) {
          const old = d.mayorIndex;
          d.mayorIndex = -1;
          this.events.emit('district:mayorChanged', { district: d, oldMayor: old, newMayor: -1 });
        }
        return;
      }
      const tally = new Map();
      buildable.forEach(c => {
        const s = c.structure;
        if (!s || s.ownerIndex < 0) return;
        tally.set(s.ownerIndex, (tally.get(s.ownerIndex) || 0) + 1);
      });
      let bestIdx = -1, bestCount = 0;
      tally.forEach((count, idx) => {
        if (count > bestCount) { bestIdx = idx; bestCount = count; }
      });
      const threshold = Math.floor(buildable.length / 2) + 1;
      const newMayor = (bestCount >= threshold) ? bestIdx : -1;
      if (newMayor !== d.mayorIndex) {
        const old = d.mayorIndex;
        d.mayorIndex = newMayor;
        this.events.emit('district:mayorChanged', { district: d, oldMayor: old, newMayor });
      }
    }

    recomputeAll() { this.districts.forEach((_, id) => this.recomputeMayor(id)); }

    collectTaxes(player) {
      let total = 0;
      const propBonus = (this.cfg && this.cfg.property && this.cfg.property.mayorBonus) || 0;
      this.districts.forEach(d => {
        if (d.mayorIndex !== player.index) return;
        const taxEarned = Math.round(d.population * d.taxRate * this.cfg.district.taxBase);
        const earned = taxEarned + propBonus;
        if (earned <= 0) return;
        player.addMoney(earned, `Taxes from ${d.id}`);
        total += earned;
        this.events.emit('district:taxesPaid', { district: d, mayor: player, amount: earned });
      });
      return total;
    }

    holdFestival(player, districtId, turn) {
      const d = this.districts.get(districtId);
      if (!d || d.mayorIndex !== player.index) return { ok: false, reason: 'not mayor' };
      if (turn < d.festivalCooldownUntil) return { ok: false, reason: 'cooldown' };
      const cost = this.cfg.district.festivalCost;
      if (player.money < cost) return { ok: false, reason: 'cannot afford' };
      player.addMoney(-cost, `Festival in ${d.id}`);
      d.festivalUntilTurn = turn + this.cfg.district.festivalDuration;
      d.festivalCooldownUntil = turn + this.cfg.district.festivalCooldown;
      d.happiness = Math.min(100, d.happiness + this.cfg.district.festivalHappiness);
      this.events.emit('district:festival', { district: d, mayor: player });
      return { ok: true, cost };
    }

    investmentGrant(player, districtId, turn) {
      const d = this.districts.get(districtId);
      if (!d || d.mayorIndex !== player.index) return { ok: false, reason: 'not mayor' };
      if (turn < d.grantCooldownUntil) return { ok: false, reason: 'cooldown' };
      const cost = this.cfg.district.grantCost;
      if (player.money < cost) return { ok: false, reason: 'cannot afford' };
      player.addMoney(-cost, `Investment grant in ${d.id}`);
      d.population += this.cfg.district.grantPopulation;
      d.grantCooldownUntil = turn + this.cfg.district.grantCooldown;
      this.events.emit('district:grant', { district: d, mayor: player });
      return { ok: true, cost };
    }

    serialize() {
      const out = {};
      this.districts.forEach((d, id) => {
        // taxRate is intentionally NOT serialized — it's a computed getter
        // derived from district structure values at load time. Persisting it
        // would just go stale.
        out[id] = {
          mayorIndex: d.mayorIndex,
          population: d.population,
          happiness: d.happiness,
          festivalUntilTurn: d.festivalUntilTurn,
          grantCooldownUntil: d.grantCooldownUntil,
          festivalCooldownUntil: d.festivalCooldownUntil,
        };
      });
      return out;
    }

    deserialize(data) {
      if (!data) return;
      Object.entries(data).forEach(([id, snap]) => {
        const d = this.districts.get(id);
        if (!d) return;
        // Skip taxRate even if present in old saves — it's a getter now.
        const { taxRate, ...rest } = snap;
        Object.assign(d, rest);
      });
    }
  }

  GF.Acca.DistrictSystem = DistrictSystem;
  GF.Acca.District       = District;

})(window.GF = window.GF || {});
