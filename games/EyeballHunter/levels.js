// games/EyeballHunter/levels.js
// Level definitions. Coordinates are world-space; the canvas is 960x540 and the
// ground surface sits at y=480. Ground segments are solid from the top; gaps
// between them are deadly pits.
(function (GF, window) {
  'use strict';

  const GROUND_Y = 480;
  const GROUND_H = 60;

  function ground(x, w) { return { x, y: GROUND_Y, w, h: GROUND_H }; }
  function plat(x, y, w) { return { x, y, w, h: 20 }; }
  function spike(x, w)  { return { x, y: GROUND_Y - 18, w, h: 18 }; }

  const LEVELS = [
    // ── Stage 1: The Creepy Courtyard (tutorial) ────────────────────────
    {
      name: 'Stage 1 — The Creepy Courtyard',
      width: 2400,
      parallax: '#16162e',
      playerStart: { x: 60, y: 400 },
      ground: [
        ground(0, 700),
        ground(780, 620),
        ground(1480, 920),
      ],
      platforms: [
        plat(240, 380, 130),
        plat(460, 300, 120),
        plat(700, 350, 140),
        plat(980, 380, 150),
        plat(1200, 300, 130),
        plat(1420, 360, 140),
        plat(1680, 300, 150),
        plat(1950, 250, 150),
      ],
      spikes: [ spike(900, 90), spike(1600, 110) ],
      enemies: [
        { type: 'spider', x: 420, y: 448, range: 120 },
        { type: 'spider', x: 900, y: 448, range: 160 },
        { type: 'spider', x: 1120, y: 348, range: 100 },
        { type: 'spider', x: 1620, y: 448, range: 180 },
        { type: 'spider', x: 2000, y: 448, range: 160 },
        { type: 'fly', x: 600, y: 320, range: 100 },
        { type: 'fly', x: 1400, y: 280, range: 120 },
      ],
      powerups: [
        { type: 'speed', x: 470, y: 270 },
      ],
      goal: { x: 2300, y: 410 },
      boss: null,
    },

    // ── Stage 2: The Gloomy Greenhouse (intermediate) ──────────────────
    {
      name: 'Stage 2 — The Gloomy Greenhouse',
      width: 3200,
      parallax: '#10211a',
      playerStart: { x: 60, y: 400 },
      ground: [
        ground(0, 560),
        ground(660, 520),
        ground(1280, 460),
        ground(1840, 700),
        ground(2640, 560),
      ],
      platforms: [
        plat(200, 380, 120),
        plat(430, 300, 110),
        plat(700, 360, 150),
        plat(960, 280, 120),
        plat(1180, 350, 130),
        plat(1420, 300, 140),
        plat(1640, 250, 120),
        plat(1900, 360, 160),
        plat(2160, 290, 140),
        plat(2420, 350, 150),
        plat(2700, 300, 160),
        plat(2980, 250, 150),
      ],
      spikes: [ spike(600, 60), spike(1220, 60), spike(1780, 60), spike(2580, 60), spike(2140, 120) ],
      enemies: [
        { type: 'spider', x: 350, y: 448, range: 130 },
        { type: 'spider', x: 800, y: 448, range: 150 },
        { type: 'spider', x: 1000, y: 258, range: 90 },
        { type: 'spider', x: 1350, y: 448, range: 140 },
        { type: 'spider', x: 1550, y: 328, range: 110 },
        { type: 'spider', x: 2050, y: 448, range: 160 },
        { type: 'spider', x: 2250, y: 338, range: 100 },
        { type: 'spider', x: 2800, y: 448, range: 170 },
        { type: 'spider', x: 3000, y: 228, range: 100 },
        { type: 'fly', x: 550, y: 300, range: 120 },
        { type: 'fly', x: 1200, y: 260, range: 100 },
        { type: 'fly', x: 1800, y: 320, range: 130 },
        { type: 'fly', x: 2500, y: 280, range: 110 },
      ],
      powerups: [
        { type: 'life', x: 1450, y: 270 },
      ],
      goal: { x: 3100, y: 410 },
      boss: null,
    },

    // ── Stage 3: The Optic Boss Lair (boss fight) ──────────────────────
    {
      name: 'Stage 3 — The Optic Boss Lair',
      width: 1800,
      parallax: '#241010',
      playerStart: { x: 80, y: 400 },
      ground: [ ground(0, 1800) ],
      platforms: [
        plat(300, 380, 160),
        plat(700, 300, 180),
        plat(1150, 380, 160),
        plat(500, 220, 160),
        plat(1000, 220, 160),
      ],
      spikes: [ spike(420, 120), spike(1050, 120) ],
      enemies: [
        { type: 'spider', x: 400, y: 448, range: 150 },
        { type: 'spider', x: 1300, y: 448, range: 150 },
      ],
      powerups: [
        { type: 'speed', x: 520, y: 190 },
        { type: 'shield', x: 1040, y: 190 },
      ],
      goal: null,               // no door — victory is defeating the boss
      boss: { x: 1450, y: 300, maxEyeballs: 8 },
    },
  ];

  GF.EH_LEVELS = LEVELS;
  GF.EH_GROUND_Y = GROUND_Y;
  window.EH_LEVELS = LEVELS;
  window.EH_GROUND_Y = GROUND_Y;
})(window.GF = window.GF || {}, window);
