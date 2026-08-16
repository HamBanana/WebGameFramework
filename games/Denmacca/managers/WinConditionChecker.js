// games/Acca2/managers/WinConditionChecker.js
// Decides when (and how) the game ends. Owns the leader / lowest-cash
// helpers used by chance-event scopes, plus a small "grant random
// structure" hook that ChanceSystem calls on free-property events.

(function (GF) {
  'use strict';
  const A = GF.Acca = GF.Acca || {};

  class WinConditionChecker {
    constructor(game) {
      this.game = game;
    }

    /** Return the winning player, or null if the game continues. */
    check() {
      const game = this.game;
      const w = game.cfg.win;
      const live = game.players.filter(p => !p.isBankrupt);
      const lastStanding = (live.length === 1) ? live[0] : null;

      // Turn-cap fallback: if a cap is configured and reached, declare the
      // highest-net-worth player the winner rather than letting the game idle.
      const cap = w.turnCap || 0;
      if (cap > 0 && game.turnCounter >= cap && live.length > 0) {
        const sorted = live.slice().sort((a, b) => game.netWorth(b) - game.netWorth(a));
        game.log(`Turn cap (${cap}) reached — ${sorted[0].name} wins by net worth!`);
        game.endReason = 'turncap';
        return sorted[0];
      }

      const setReason = (winner, byTarget) => {
        if (winner) game.endReason = byTarget ? 'networth' : 'laststanding';
        return winner;
      };

      switch (w.type) {
        case 'MoneyOnHand': {
          const byT = game.players.find(p => p.money >= w.target);
          return setReason(byT || lastStanding, !!byT);
        }
        case 'NetWorth':
        case 'TotalValue': {
          const byT = game.players.find(p => game.netWorth(p) >= w.target);
          return setReason(byT || lastStanding, !!byT);
        }
        case 'Level': {
          const byT = game.players.find(p => p.level >= w.target);
          return setReason(byT || lastStanding, !!byT);
        }
        case 'LastManStanding':
          return setReason(lastStanding, false);
        case 'NetWorthOrLastStanding':
        default: {
          const target = w.target || 50000;
          // To win by net worth, the player must have engaged with the
          // structure-and-property loop at least once (own ≥ 1 structure).
          // Closes a never-build exploit identified in playtest where a
          // passive player walking onto resource cells could clear the NW
          // target purely from inventory hoarding.
          const byWealth = game.players.find(p =>
            !p.isBankrupt &&
            game.netWorth(p) >= target &&
            (p.ownedStructures && p.ownedStructures.length > 0)
          );
          return setReason(byWealth || lastStanding, !!byWealth);
        }
      }
    }

    leader() {
      let best = null;
      this.game.players.forEach(p => {
        if (p.isBankrupt) return;
        const v = this.game.netWorth(p);
        if (!best || v > best._v) { best = p; best._v = v; }
      });
      return best;
    }

    lowestCash() {
      let lowest = null;
      this.game.players.forEach(p => {
        if (p.isBankrupt) return;
        if (!lowest || p.money < lowest.money) lowest = p;
      });
      return lowest;
    }

    /** Pick a random empty buildable cell + a random structure type and
     *  build it for the player. Used by ChanceSystem free-property events. */
    grantRandomStructure(player) {
      const game = this.game;
      const empty = game.cells.filter(c => c.type === 'buildable' && !c.structure);
      if (empty.length === 0) return;
      const cell = empty[Math.floor(Math.random() * empty.length)];
      const cat = game.cfg.structures.catalog;
      const entry = cat[Math.floor(Math.random() * cat.length)];
      game.structures.build(cell, entry.type, player.index);
      if (game.districtSys) game.districtSys.recomputeMayor(cell.district);
      game.log(`${player.name} won a free ${entry.label} in ${cell.district}!`);
    }
  }

  A.WinConditionChecker = WinConditionChecker;

})(window.GF = window.GF || {});
