// prefabs/spicyBall.js — entity archetype (data + behavior list).
(function (GF) {
  'use strict';
  GF.prefab('spicyBall', {"behaviors": ["BallFall"], "data": {"type": "spicy", "points": -5}, "tags": ["ball"], "w": 30, "h": 30});
})(window.GF);
