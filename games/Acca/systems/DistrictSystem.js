// games/Acca/systems/DistrictSystem.js — Planning §9.
// Tracks per-district state (mayor, tax rate, population, happiness, festival/grant
// cooldowns) and runs end-of-turn tax collection. PopulationSystem mutates
// population/happiness; this system owns ownership/mayor/tax mechanics.
//
// Terminology:
//   District = a named group of squares on the board (cell.district === district id).
//   Region   = a higher-level grouping of districts (future feature).

(function (GF) {
  'use strict';
  GF.Acca = GF.Acca || {};

  class District {
    constructor(id, color) {
      this.id       = id;
      this.color    = color || '#666';
      this.cells    = [];
      this.mayorIndex = -1;
      this.taxRate    = 0;       // set by DistrictSystem from cfg
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

  class DistrictSystem {
    constructor(cfg, eventBus) {
      this.cfg       = cfg;
      this.events    = eventBus;
      this.districts = new Map();   // id → District
    }

    /** Build districts from cells; cell.district holds the district id string. */
    init(cells, districtsMeta) {
      this.districts.clear();
      const metaById = new Map();
      (districtsMeta || []).forEach(m => metaById.set(m.name, m));

      cells.forEach(c => {
        if (!c.district) return;
        if (!this.districts.has(c.district)) {
          const meta = metaById.get(c.district);
          const d = new District(c.district, meta && meta.color);
          d.taxRate    = this.cfg.district.defaultTaxRate;
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

    /** Recompute mayor for `districtId`.
     *  Mayor = the player with a STRICT MAJORITY of all buildable cells in the
     *  district (i.e. owns more than half). With four players this means owning
     *  ⌈buildable/2⌉ + (buildable even ? 1 : 0) cells; with two players it's just
     *  more than half. We require >50% (not plurality) so the mayor seat is a
     *  meaningful prize the player has to actually contest, but it is now
     *  reachable in normal 4-player play (vs the previous "owns all cells in
     *  the district" rule that the 500-turn playtest never satisfied).
     */
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
      // Tally owned cells by player index. Unowned cells don't get counted —
      // the threshold is against TOTAL buildable cells, so unowned cells make
      // the mayor seat harder to win (but not impossible).
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

    /** Recompute mayor for every district — call after bulk ownership changes. */
    recomputeAll() {
      this.districts.forEach((_, id) => this.recomputeMayor(id));
    }

    /** Collect taxes for the player whose turn just ended (Planning §9.2). */
    collectTaxes(player) {
      let total = 0;
      this.districts.forEach(d => {
        if (d.mayorIndex !== player.index) return;
        const earned = Math.round(d.population * d.taxRate * this.cfg.district.taxBase);
        if (earned <= 0) return;
        player.money += earned;
        total += earned;
        this.events.emit('district:taxesPaid', { district: d, mayor: player, amount: earned });
      });
      return total;
    }

    setTaxRate(player, districtId, rate) {
      const d = this.districts.get(districtId);
      if (!d || d.mayorIndex !== player.index) return false;
      d.taxRate = Math.max(0, Math.min(this.cfg.district.maxTaxRate, rate));
      this.events.emit('district:taxRateChanged', { district: d, mayor: player });
      return true;
    }

    holdFestival(player, districtId, turn) {
      const d = this.districts.get(districtId);
      if (!d || d.mayorIndex !== player.index) return { ok: false, reason: 'not mayor' };
      if (turn < d.festivalCooldownUntil) return { ok: false, reason: 'cooldown' };
      const cost = this.cfg.district.festivalCost;
      if (player.money < cost) return { ok: false, reason: 'cannot afford' };
      player.money -= cost;
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
      player.money -= cost;
      d.population += this.cfg.district.grantPopulation;
      d.grantCooldownUntil = turn + this.cfg.district.grantCooldown;
      this.events.emit('district:grant', { district: d, mayor: player });
      return { ok: true, cost };
    }

    serialize() {
      const out = {};
      this.districts.forEach((d, id) => {
        out[id] = {
          mayorIndex: d.mayorIndex,
          taxRate: d.taxRate,
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
        Object.assign(d, snap);
      });
    }
  }

  GF.Acca.DistrictSystem = DistrictSystem;
  GF.Acca.District       = District;

})(window.GF = window.GF || {});
