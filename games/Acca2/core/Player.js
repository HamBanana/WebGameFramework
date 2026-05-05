// games/Acca2/core/Player.js
// One competitor at the table. Owns cash, resources, owned structures, and
// a sprite animator. Pure data + tiny helpers — no game-rule logic lives
// here; that's in EconomyManager / TurnManager / DistrictSystem.

(function (GF) {
  'use strict';
  const A = GF.Acca = GF.Acca || {};

  class Player {
    constructor(index, def, startCell, startingMoney, spriteSystem) {
      this.index      = index;
      this.name       = def.name;
      this.color      = def.color;
      this.spriteName = def.sprite;
      this.animator   = spriteSystem.createAnimator(def.sprite, 'idle');

      this.money       = startingMoney;
      this.level       = 1;
      this.isBankrupt  = false;

      this.ownedStructures   = []; // array of PlayerStructure
      this.resources         = {}; // resourceName → quantity
      this.districtsMayoredOf = new Set(); // ids of districts this player is mayor of

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
     */
    addMoney(amount) {
      this.money += amount;
    }
  }

  A.Player = Player;

})(window.GF = window.GF || {});
