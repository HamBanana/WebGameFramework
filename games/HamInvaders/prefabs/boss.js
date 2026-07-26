// prefabs/boss.js — the mothership and its shield drones.
//
// These are the pieces a boss level is built from in tools/editor.html. Every
// tunable lives in `data`, so the editor's inspector can retune a fight
// (tougher boss, faster drones) without touching a line of code.
(function (GF) {
  'use strict';

  GF.prefab('boss', {
    tags: ['boss'], w: 160, h: 54, sprite: 'bossCore',
    // hp/maxHp are read by BossMove and BossGun to escalate, and by
    // modules/Boss.js to draw the health bar and decide the kill.
    // Tuned against a full playthrough: the mothership sweeps fast enough that
    // a fair share of shots miss, so raw HP overstates the fight's length.
    data: { hp: 40, maxHp: 40, score: 1000, color: '#7d3c98' },
    behaviors: [
      ['BossMove', { speed: 70, margin: 20, rage: 2.2, sway: 10, swaySpeed: 1.1 }],
      ['BossGun', { interval: 1.6, minInterval: 0.55, shots: 3, rageShots: 2,
                    spread: 26, speed: 210, fan: 18 }],
      ['Shielded', { by: 'bossDrone', color: '#5dade2' }],
    ],
  });

  // Escorts. Tagged 'bossDrone' so Shielded can count them, and ALSO 'invader'
  // so the existing Combat rules (shot kills it, reaching the player's row ends
  // the run) apply with no new code.
  GF.prefab('bossDrone', {
    tags: ['bossDrone', 'invader'], w: 28, h: 25, sprite: 'bossDrone',
    data: { tier: 0, row: 0, color: '#2e86c1' },
    behaviors: [
      ['Bob', { amp: 5, speed: 3 }],
      ['FireOnChance', { prefab: 'invaderShot', chance: 0.08, interval: 1,
                         cooldown: 2, speed: 190 }],
    ],
  });

})(window.GF);
