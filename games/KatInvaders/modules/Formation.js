// modules/Formation.js — drives the alien formation as a whole.
// Handles speed increase as aliens are eliminated.
(function (GF) {
  'use strict';
  GF.sceneModule('Formation', {
    scene: 'Main',
    order: 5,
    phases: ['play'],

    update(dt, scene) {
      var gameCfg = GF.GAME_CONFIG || {};
      var aliensCfg = gameCfg.aliens || {};
      var maxSpeed = aliensCfg.maxSpeed || 180;
      var speedInc = aliensCfg.speedIncrease || 4;

      var total = aliensCfg.rows || 5;
      total *= aliensCfg.cols || 10;
      var remaining = scene.world.count('alien');
      var eliminated = total - remaining;

      var baseSpeed = scene.world.data.speed || 30;
      var newSpeed = baseSpeed + eliminated * speedInc;
      if (newSpeed > maxSpeed) newSpeed = maxSpeed;
      scene.world.data.speed = newSpeed;
    },
  });
})(window.GF);
