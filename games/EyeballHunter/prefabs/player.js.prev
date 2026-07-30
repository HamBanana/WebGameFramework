// prefabs/player.js — an entity archetype (tiny data + behavior list).
// Prefabs register globally with GF.prefab(name, spec); a world spawns them by
// name: world.spawn('player', x, y). behaviors are 'Name' or ['Name', cfg].
(function (GF) {
  'use strict';
  GF.prefab('player', {
    tags: ['player'], w: 24, h: 24, data: { color: '#ffd24a' },
    behaviors: [['TopdownMove', { speed: 180 }]],
    // sprite: 'hero',   // <- if you import_spritesheet a 'hero', it auto-animates
  });
})(window.GF);
