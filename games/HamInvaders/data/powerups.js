// data/powerups.js — the powerup table: what each one looks like and does.
// Pure data + a one-line effect. Adding a powerup is an entry here plus (if it
// needs a new firing pattern) a line in data/weapons.js — no module changes.
(function (G) {
  'use strict';

  G.powerupTypes = {
    doubleShot: { color: '#ff6b6b', icon: '⚡', hud: '⚡ 2x', duration: 10 },
    extraLife:  { color: '#2ecc71', icon: '❤️', duration: 0,
                  effect: (p) => { p.data.lives = Math.min((p.data.lives || 0) + 1, 5); } },
    megaLaser:  { color: '#ffeb3b', icon: '🔫', hud: '🔫', duration: 10 },
    rapidFire:  { color: '#3498db', icon: '⚡', hud: '⚡', duration: 10 },
    shield:     { color: '#9b59b6', icon: '🛡️', hud: '🛡️', duration: 10 },
    // Instant, like extraLife: consumed on pickup, so no duration and no HUD
    // badge. The effect only raises a flag — modules/Combat.js owns the actual
    // detonation, because that is where the entity world is reachable.
    smartBomb:  { color: '#e74c3c', icon: '💣', duration: 0,
                  effect: (p) => { p.data.bombPending = (p.data.bombPending || 0) + 1; } },
    invincible: { color: '#ff69b4', icon: '✨', hud: '✨', duration: 8 },
    tripleShot: { color: '#00bfff', icon: '🔫', hud: '🔫', duration: 10 },
  };

  // Extra shots each powerup adds, relative to the muzzle. Drives modules/Combat
  // so the shooting code never grows an if-branch per powerup.
  G.weaponPatterns = {
    doubleShot: [{ dx: -10 }, { dx: 10 }],
    tripleShot: [{ dx: -15 }, { dx: 15 }],
    megaLaser:  [{ dx: -15, kind: 'megaLaser' }, { dx: 15, kind: 'megaLaser' }],
    rapidFire:  [{ dy: -10, kind: 'rapidFire' }, { dy: 10, kind: 'rapidFire' }],
  };

})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} });
