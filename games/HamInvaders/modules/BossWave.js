// modules/BossWave.js — clearing the last wave summons the mothership.
//
// modules/Waves.js already decides when the run is beaten: it sets
// state.won = true and drops the scene into the 'over' phase. This listens for
// exactly that moment and swaps the game-over screen for the boss fight, so
// Waves needed no edit — and raising GAME_CONFIG.scenes.Main.levels still works,
// because the escalation keys off "the last wave was cleared", not off a count.
//
// Losing is untouched: Combat sets won = false before the same phase change, so
// dying still ends the run normally.
(function (GF) {
  'use strict';

  GF.sceneModule('BossWave', {
    scene: 'Main',

    // onPhase fires for every module the instant setPhase() runs — during
    // Waves.update, before anything has rendered. Replacing here means the
    // 'YOU WIN' screen never gets a frame, so the hand-off has no flicker.
    onPhase(phase, prev, scene, engine) {
      if (phase !== 'over' || !scene.state.won) return;

      // Only escalate a WAVE scene. The boss level borrows Main's module stack
      // ("modules": { "from": "Main" }), so this module attaches there too —
      // without this guard, beating the boss would summon another boss forever.
      // The boss level excludes Waves, which makes that the honest test.
      if (!scene.has('Waves')) return;

      // Carry the run forward: the boss is the finale of THIS run, not a fresh
      // start. The level file's own state.score is overridden by what is passed
      // here (see DataScene's constructor), and modules/Boss.js applies the
      // lives to whichever player the level placed.
      const player = scene.world.first('player');

      scene.replace('Boss', {
        state: {
          score: scene.state.score,
          carryLives: player ? player.data.lives : null,
          fromWaves: true,
        },
      });
    },
  });

})(window.GF);
