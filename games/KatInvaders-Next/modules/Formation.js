// modules/Formation.js — drives the alien formation as a whole.
// Handles speed increase as aliens are eliminated.
(function (GF) {
  'use strict';
  GF.sceneModule('Formation', {
    scene: 'Main',
    order: 5,
    phases: ['play'],

    update(dt, scene) {
      var dt = scene.scaledDt || dt;
      var gameCfg = GF.GAME_CONFIG || {};
      var aliensCfg = gameCfg.aliens || {};
      var maxSpeed = aliensCfg.maxSpeed || 180;
      var speedInc = aliensCfg.speedIncrease || 4;

      var total = aliensCfg.rows || 5;
      total *= aliensCfg.cols || 10;
      var remaining = scene.world.count('alien');
      var eliminated = total - remaining;
      if (eliminated < 0) eliminated = 0;

      // Anchor to the level base speed (R2-1: never read back the previous
      // frame's value, or the speed compounds every frame).
      var level = scene.state.level || 1;
      var baseSpeed = (aliensCfg.initialSpeed || 30) +
        (level - 1) * ((gameCfg.levels || {}).alienSpeedBonus || 8);
      var newSpeed = baseSpeed + eliminated * speedInc;
      if (newSpeed > maxSpeed) newSpeed = maxSpeed;
      scene.world.data.speed = newSpeed;
    },
  });
})(window.GF);
