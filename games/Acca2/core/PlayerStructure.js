// games/Acca2/core/PlayerStructure.js
// A player-owned structure built on a buildable cell (Planning §5.9).
// Carries per-type state inline (toll accrual, vault level/storage,
// resource-shortage idle marker) so the systems can read uniform fields.

(function (GF) {
  'use strict';
  const A = GF.Acca = GF.Acca || {};

  class PlayerStructure {
    constructor(type, ownerIndex, baseValue, animator) {
      this.type        = type;
      this.ownerIndex  = ownerIndex;
      this.baseValue   = baseValue;
      this.currentValue = baseValue;
      this.cell        = null;
      this.animator    = animator;
      // Per-type state:
      this.tollAccrued    = 0;     // toll_gate
      this.level          = 1;     // vault: 1..5
      this.storedMoney    = 0;     // vault: cash deposited by owner (counted in net worth)
      this.idleUntilTurn  = -1;    // resource-shortage idle marker
      this.sabotagedUntilTurn = -1;
    }
  }

  A.PlayerStructure = PlayerStructure;

})(window.GF = window.GF || {});
