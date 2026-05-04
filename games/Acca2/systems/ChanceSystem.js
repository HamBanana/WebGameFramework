// games/Acca/systems/ChanceSystem.js — Planning §10.
// Weighted draw with recently-drawn guard + every effect handler.

(function (GF) {
  'use strict';
  GF.Acca = GF.Acca || {};

  class ChanceSystem {
    constructor(cfg, eventBus, hooks) {
      this.cfg     = cfg.chance;
      this.fullCfg = cfg;
      this.events  = eventBus;
      this.hooks   = hooks || {};   // { districtSystem, players, getCurrentPlayer, getLeader, getLowestCash, sabotageProperty, modifyDie }
      this.recentlyDrawn = [];
      this.dieOverride   = null;    // { min, max, forIndex }
    }

    /** Draw an event for a player, apply it, return the event. */
    draw(player, players) {
      const candidates = this.cfg.pool.filter(e =>
        !this.recentlyDrawn.includes(e.id));
      const pool = candidates.length > 0 ? candidates : this.cfg.pool;

      const totalWeight = pool.reduce((s, e) => s + (e.weight || 1), 0);
      let pick = Math.random() * totalWeight;
      let event = pool[0];
      for (const e of pool) {
        pick -= (e.weight || 1);
        if (pick <= 0) { event = e; break; }
      }

      this._apply(event, player, players);
      this.recentlyDrawn.push(event.id);
      if (this.recentlyDrawn.length > this.cfg.repeatGuard) this.recentlyDrawn.shift();
      this.events.emit('chance:drawn', { event, player });
      return event;
    }

    /** If the active player has a die-override, return {min,max} else null. */
    consumeDieOverride(playerIndex) {
      if (!this.dieOverride) return null;
      if (this.dieOverride.forIndex !== playerIndex) return null;
      const o = this.dieOverride;
      this.dieOverride = null;
      return { min: o.min, max: o.max };
    }

    _apply(event, player, players) {
      switch (event.effect) {
        case 'money':
          this._scopeApply(event.scope, player, players, p => { p.money += event.value; });
          break;

        case 'money_pct':
          this._scopeApply(event.scope, player, players, p => {
            const delta = Math.round(p.money * event.value);
            p.money += delta;
          });
          break;

        case 'resource': {
          const v = event.value || {};
          const apply = (p) => {
            let r = v.resource;
            if (r === 'random') {
              const list = this.fullCfg.market.resources;
              r = list[Math.floor(Math.random() * list.length)];
            }
            p.resources[r] = Math.max(0, (p.resources[r] || 0) + (v.qty || 0));
          };
          this._scopeApply(event.scope, player, players, apply);
          break;
        }

        case 'happiness': {
          const apply = (region) => {
            region.happiness = Math.max(0, Math.min(100, region.happiness + event.value));
          };
          this._regionScopeApply(event.scope, player, apply);
          break;
        }

        case 'migration_in': {
          const regionSys = this.hooks.districtSystem;
          if (!regionSys) break;
          let target = null;
          if (event.scope === 'self') {
            // lowest-population region the player mayors
            regionSys.list().forEach(r => {
              if (r.mayorIndex !== player.index) return;
              if (!target || r.population < target.population) target = r;
            });
          }
          if (!target) {
            // fallback: lowest-pop overall
            regionSys.list().forEach(r => {
              if (!target || r.population < target.population) target = r;
            });
          }
          if (target) {
            target.population += event.value;
            this.events.emit('population:migrated',
              { from: null, to: target, amount: event.value });
          }
          break;
        }

        case 'sabotage': {
          if (!this.hooks.sabotageProperty) break;
          let victim = null;
          if (event.scope === 'leader' && this.hooks.getLeader) {
            victim = this.hooks.getLeader();
          } else {
            // random other player
            const others = players.filter(p => p !== player && !p.isBankrupt);
            victim = others[Math.floor(Math.random() * others.length)] || null;
          }
          if (victim && victim.ownedStructures.length > 0) {
            const target = victim.ownedStructures[
              Math.floor(Math.random() * victim.ownedStructures.length)];
            this.hooks.sabotageProperty(target, event.duration || 3);
          }
          break;
        }

        case 'free_property': {
          // Grant ownership of a random unowned buildable cell to the player
          if (!this.hooks.grantFreeStructure) break;
          this.hooks.grantFreeStructure(player);
          break;
        }

        case 'modify_die': {
          const v = event.value || { min: 1, max: 6 };
          const target = (event.scope === 'self' ? player : null);
          if (target) this.dieOverride = { min: v.min, max: v.max, forIndex: target.index };
          break;
        }
      }
    }

    _scopeApply(scope, active, players, fn) {
      switch (scope) {
        case 'self':   fn(active); break;
        case 'all':    players.forEach(p => fn(p)); break;
        case 'mayor':  // applies to active if they mayor something (treat like self for player effects)
          fn(active); break;
        case 'leader': {
          const leader = this.hooks.getLeader && this.hooks.getLeader();
          if (leader) fn(leader);
          break;
        }
        case 'lowest': {
          const lowest = this.hooks.getLowestCash && this.hooks.getLowestCash();
          if (lowest) fn(lowest);
          break;
        }
        default: fn(active);
      }
    }

    _regionScopeApply(scope, active, fn) {
      const regionSys = this.hooks.districtSystem;
      if (!regionSys) return;
      switch (scope) {
        case 'mayor':
          regionSys.list().forEach(r => { if (r.mayorIndex === active.index) fn(r); });
          break;
        case 'all':
          regionSys.list().forEach(r => fn(r));
          break;
        default:
          regionSys.list().forEach(r => { if (r.mayorIndex === active.index) fn(r); });
      }
    }

    serialize() { return { recentlyDrawn: this.recentlyDrawn.slice(), dieOverride: this.dieOverride }; }
    deserialize(data) {
      if (!data) return;
      if (Array.isArray(data.recentlyDrawn)) this.recentlyDrawn = data.recentlyDrawn.slice();
      this.dieOverride = data.dieOverride || null;
    }
  }

  GF.Acca.ChanceSystem = ChanceSystem;

})(window.GF = window.GF || {});
