// prefabs/player.js — entity archetype (data + behavior list).
(function (GF) {
  'use strict';
  GF.prefab('player', {"behaviors": ["PlayerMove"], "data": {"color": "#3a1a6a"}, "h": 24, "tags": ["player"], "w": 24});
})(window.GF);
