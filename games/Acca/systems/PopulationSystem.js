// games/Acca2/systems/PopulationSystem.js — Planning §8.
// Per-turn: happiness drift toward target → births/deaths → migration → employment.

(function (GF) {
  'use strict';
  GF.Acca = GF.Acca || {};

  class PopulationSystem {
    constructor(cfg, eventBus, districtSystem) {
      this.cfg       = cfg;
      this.events    = eventBus;
      this.districts = districtSystem;
    }

    tick(turn, players) {
      const list = this.districts.list();
      list.forEach(r => this._stepHappiness(r, turn, players));
      list.forEach(r => this._stepGrowth(r));
      this._stepMigration(list, players);
    }

    _stepHappiness(r, turn, players) {
      const c = this.cfg.population;
      const taxOver = Math.max(0, r.taxRate - c.taxComfortRate);
      const taxFactor = -Math.round(taxOver * 100);

      const jobs = this._jobsInRegion(r);
      const empRatio = r.population > 0 ? jobs / r.population : 0;
      let empFactor;
      if (empRatio >= 0.7) empFactor = 5;
      else if (empRatio >= 0.4) empFactor = 2;
      else if (empRatio <= 0.2) empFactor = -3;
      else empFactor = 0;

      const services = r.cells.reduce((sum, cell) =>
        sum + ((cell.structure && (cell.structure.type === 'shop' || cell.structure.type === 'vault')) ? 1 : 0), 0);

      const idle = r.cells.reduce((sum, cell) => {
        const s = cell.structure;
        if (!s || s.ownerIndex < 0) return sum;
        const owner = players[s.ownerIndex];
        return sum + (owner && owner.isBankrupt ? 1 : 0);
      }, 0);
      const idleFactor = -idle * c.happiness.idleBusinessPenalty;

      let foodShortage = 0, waterShortage = 0;
      if (r.mayorIndex >= 0 && players[r.mayorIndex]) {
        const mayor = players[r.mayorIndex];
        const foodNeeded  = r.population * c.foodPerCapita;
        const waterNeeded = r.population * c.waterPerCapita;
        if ((mayor.resources.food || 0)  < foodNeeded)  foodShortage = -10;
        if ((mayor.resources.water || 0) < waterNeeded) waterShortage = -10;
      }

      const festivalActive = (r.festivalUntilTurn >= turn) ? 5 : 0;

      const target = Math.max(0, Math.min(100,
        50 + taxFactor + empFactor + services + idleFactor +
        foodShortage + waterShortage + festivalActive));
      const old = r.happiness;
      r.happiness = old + (target - old) * c.happinessLerp;
      if (Math.abs(r.happiness - old) >= 1) {
        this.events.emit('population:happinessChanged', {
          district: r, oldH: old, newH: r.happiness, target,
        });
      }
    }

    _stepGrowth(r) {
      const c = this.cfg.population;
      const dCfg = this.cfg.district || {};
      const happy01 = r.happiness / 100;
      const cap = Math.max(r.cells.length * 50, 100);
      const pressureFactor = Math.max(0, 1 - r.population / cap);
      const growthMul = dCfg.happinessGrowthMultiplier || 1;
      const births = Math.round(r.population * c.birthRate * happy01 * growthMul * pressureFactor);
      const deaths = Math.round(r.population * c.deathRate * (1 - happy01));
      const delta  = births - deaths;
      r.birthsThisTurn = births;
      r.deathsThisTurn = deaths;
      r.population = Math.max(0, r.population + delta);
    }

    _stepMigration(regions, players) {
      const c = this.cfg.population;
      regions.forEach(r => { r.migratedIn = 0; r.migratedOut = 0; });

      const sources = regions.filter(r => r.happiness < c.migrationFloor && r.population > 0);
      const dests   = regions.filter(r => r.happiness >= c.migrationFloor);
      if (sources.length === 0 || dests.length === 0) return;

      const totalDestHappiness = dests.reduce((s, r) => s + r.happiness, 0);

      sources.forEach(src => {
        const movers = Math.floor(src.population * c.migrationRate);
        if (movers <= 0) return;
        let allowed = movers;

        let remaining = allowed;
        dests.forEach(dst => {
          const share = Math.round(allowed * (dst.happiness / totalDestHappiness));
          let move = Math.min(share, remaining);
          if (dst.mayorIndex >= 0 && players[dst.mayorIndex]) {
            const mayor = players[dst.mayorIndex];
            const oilNeed = Math.ceil(move / c.oilPerMigrationUnit);
            const have = mayor.resources.oil || 0;
            if (have < oilNeed) {
              const ratio = have / Math.max(1, oilNeed);
              move = Math.floor(move * ratio);
              mayor.resources.oil = 0;
            } else {
              mayor.resources.oil = have - oilNeed;
            }
          }
          if (move > 0) {
            src.population = Math.max(0, src.population - move);
            dst.population += move;
            src.migratedOut += move;
            dst.migratedIn  += move;
            remaining -= move;
            this.events.emit('population:migrated',
              { from: src, to: dst, amount: move });
          }
        });
      });
    }

    _jobsInRegion(r) {
      const sCfg = this.cfg.structures;
      let jobs = 0;
      r.cells.forEach(cell => {
        const s = cell.structure;
        if (!s) return;
        if (s.type === 'shop')    jobs += sCfg.shopJobs;
        if (s.type === 'factory') jobs += sCfg.factoryJobs;
      });
      return jobs;
    }
  }

  GF.Acca.PopulationSystem = PopulationSystem;

})(window.GF = window.GF || {});
