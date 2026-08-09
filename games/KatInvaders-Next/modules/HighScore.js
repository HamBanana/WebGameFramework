// modules/HighScore.js — persist the best run and unlock achievements.
//
// layer sits above GameOver's 200 so the high-score line lands on top of the
// end screen instead of being painted over by it. Only that line is drawn
// here — GameOver owns the rest of the end screen.
(function (GF) {
  'use strict';

  var HIGH_SCORE_SLOT   = 'highscore';
  var ACHIEVEMENT_SLOT  = 'achievements';
  var SAVE_VERSION      = 1;

  GF.sceneModule('HighScore', {
    scene: 'Main',
    order: 150,
    layer: 210,
    phases: ['over'],

    init(scene) {
      // Boss.js only emits this once the boss is actually destroyed, so it is
      // the real signal for the boss_slayer achievement — reaching a boss level
      // is not the same as clearing it.
      scene.events.on('boss:dead', function () { scene.state.bossDefeated = true; });
    },

    onPhase(phase, prev, scene) {
      if (phase !== 'over') return;
      this._best = this.saveHighScore(scene);
      this.checkAchievements(scene);
    },

    saveHighScore(scene) {
      var save = GF.game && GF.game.save;
      if (!save) return 0;

      var record = save.read(HIGH_SCORE_SLOT);
      var best   = (record && record.data && record.data.highScore) || 0;
      var score  = scene.state.score || 0;

      if (score > best) {
        save.write(HIGH_SCORE_SLOT, {
          highScore: score,
          levelReached: scene.state.level,
          date: Date.now(),
        }, SAVE_VERSION);
        return score;
      }
      return best;
    },

    checkAchievements(scene) {
      var save = GF.game && GF.game.save;
      if (!save) return;

      var record   = save.read(ACHIEVEMENT_SLOT);
      var unlocked = (record && record.data && record.data.unlocked) || [];
      var list     = (GF.GAME_CONFIG && GF.GAME_CONFIG.achievements) || [];
      var state    = scene.state;
      var changed  = false;

      for (var i = 0; i < list.length; i++) {
        var id = list[i].id;
        if (unlocked.indexOf(id) >= 0) continue;

        var met = false;
        switch (id) {
          case 'first_blood':  met = (state.score || 0) > 0; break;
          case 'combo_master': met = (state.comboMultiplierMax || 1) >= 3; break;
          case 'boss_slayer':  met = !!state.bossDefeated; break;
          case 'survivor':     met = (state.level || 1) >= 10; break;
          case 'perfectionist':met = (state.score || 0) >= 5000; break;
          case 'high_score':   met = (state.score || 0) >= 100000; break;
        }

        if (met) {
          unlocked.push(id);
          changed = true;
          console.log('[HighScore] Achievement unlocked:', list[i].name);
        }
      }

      if (changed) save.write(ACHIEVEMENT_SLOT, { unlocked: unlocked }, SAVE_VERSION);
    },

    render(ctx, scene, engine) {
      var best = this._best || 0;
      if (!best) return;

      GF.UISystem.drawText(ctx, 'High Score: ' + best, engine.config.width / 2, engine.config.height * 0.68, {
        align: 'center', font: 'bold 18px monospace', color: '#ffcc00',
        shadow: true, glow: '#ffcc00', glowBlur: 8,
      });
    },
  });
})(window.GF = window.GF || {});
