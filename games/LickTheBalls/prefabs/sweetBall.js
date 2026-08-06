// prefabs/sweetBall.js — entity archetype (data + behavior list).
(function (GF) {
  'use strict';
  GF.prefab('sweetBall', {"behaviors": ["BallFall"], "data": {"type": "sweet", "points": 10}, "tags": ["ball"], "w": 30, "h": 35});
})(window.GF);
