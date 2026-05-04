// games/Acca2/core/Constants.js
// Top-level enums shared across the Acca2 modules. Kept tiny on purpose so any
// file can require it cheaply.

(function (GF) {
  'use strict';
  const A = GF.Acca = GF.Acca || {};

  A.GAME_STATE = {
    MENU      : 'menu',
    SETUP     : 'setup',
    PLAYING   : 'playing',
    GAME_OVER : 'game_over',
  };

  A.TURN_STAGE = {
    TURN_START   : 'turnStart',
    ROLL         : 'roll',
    MOVE         : 'move',
    CONFIRM_LAND : 'confirmLand',
    LANDING      : 'landing',
    LAND_PROMPT  : 'landPrompt',
    BETWEEN      : 'between',     // zoomed-out hold between turns
    END_TURN     : 'endTurn',
  };

})(window.GF = window.GF || {});
