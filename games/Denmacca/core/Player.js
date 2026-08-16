// games/Acca2/core/Player.js
// One competitor at the table. Owns cash, resources, owned structures, and
// a sprite animator. Pure data + tiny helpers — no game-rule logic lives
// here; that's in EconomyManager / TurnManager / DistrictSystem.

(function (GF) {
  'use strict';
  const A = GF.Acca = GF.Acca || {};

  class Player {
    constructor(index, def, startCell, startingMoney, spriteSystem, game) {
      this.index      = index;
      this.name       = def.name;
      this.color      = def.color;
      this.spriteName = def.sprite;
      this.animator   = spriteSystem.createAnimator(def.sprite, 'idle');
      // Phase 6 — CPU opponent flag. Set by AccaGame._initPlayers from the
      // pre-game menuPlayerTypes array; CpuDriver checks this each frame to
      // decide whether to take over input for this player's turn.
      this.isCPU      = !!def.isCPU;
      // Game reference is used by addMoney to log gain/loss reasons. Optional —
      // tests / fixtures that construct Players outside a running game can
      // omit it, in which case addMoney just won't log.
      this.game = game || null;

      this.money       = startingMoney;
      this.level       = 1;
      this.isBankrupt  = false;

      this.ownedStructures   = []; // array of PlayerStructure
      this.resources         = {}; // resourceName → quantity
      this.items             = {}; // itemId → quantity
      this.districtsMayoredOf = new Set(); // ids of districts this player is mayor of

      // Item-driven turn flags. Set when an item is activated at the start of
      // a turn; consumed by TurnManager during the ROLL stage and reset by
      // EconomyManager on end-of-turn (with `shield` carrying across).
      this.itemFlags = {
        extraDice    : 0,           // additional dice rolled this turn (sum)
        rollOverride : null,        // {min,max} clamp for the rolled value
        sabotageShield: 0,          // # of sabotage attempts blocked
        warpSteps    : 0,           // free chosen-direction steps to spend instead of rolling
      };

      this.currentCell = startCell;
      this.moveOffset  = { x: 0, y: 0 };
    }

    /** Structure footprint in a district (count of owned structures of any type). */
    structuresInDistrict(district) {
      return this.ownedStructures.filter(s => s.cell && s.cell.district === district).length;
    }

    /** Count of owned house structures (drives factory bonus). */
    get housesOwned() {
      return this.ownedStructures.filter(s => s.type === 'house').length;
    }

    /** Adjust ready cash. The cash balance is allowed to go below zero
     *  mid-turn (debt) — the end-of-turn pipeline (EconomyManager.resolveDebt)
     *  will force-sell to clear it before the turn rotates, and bankruptcy
     *  fires only when the player's net worth reaches zero.
     *
     *  When a `reason` is supplied, a log line of the form
     *  "Player +$X (reason)" / "Player -$X (reason)" is emitted via the
     *  game's event log so every cash delta has a traceable cause.
     */
    addMoney(amount, reason) {
      if (!amount) return;
      this.money += amount;
      if (this.game && reason) {
        const sign = amount > 0 ? '+' : '-';
        this.game.log(`${this.name} ${sign}$${Math.abs(amount)} (${reason}).`);
      }
    }
  }

  A.Player = Player;

})(window.GF = window.GF || {});
