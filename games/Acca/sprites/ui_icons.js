// games/Acca/sprites/ui_icons.js — population-happiness faces, chance category
// cards, mayor crown. 32×32. Origin centered.

(function (GF) {
  'use strict';
  GF.sprites = GF.sprites || {};

  const SIZE = 32;
  const ORIGIN = SIZE / 2;

  function face(ctx, mood) {
    // background disk
    ctx.fillStyle = mood === 'happy'   ? '#7be07f'
                  : mood === 'neutral' ? '#cdd6e0'
                  : mood === 'sad'     ? '#ffb56b'
                                       : '#ff6b6b'; // angry
    ctx.beginPath();
    ctx.arc(16, 16, 13, 0, Math.PI * 2);
    ctx.fill();
    // eyes
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(11, 12, 3, 3);
    ctx.fillRect(18, 12, 3, 3);
    // mouth
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (mood === 'happy')   { ctx.arc(16, 18, 5, 0, Math.PI); }
    else if (mood === 'neutral') { ctx.moveTo(11, 22); ctx.lineTo(21, 22); }
    else if (mood === 'sad') { ctx.arc(16, 24, 5, Math.PI, 2 * Math.PI); }
    else { /* angry */ ctx.arc(16, 25, 4, Math.PI, 2 * Math.PI); }
    ctx.stroke();
    // angry eyebrows
    if (mood === 'angry') {
      ctx.beginPath();
      ctx.moveTo(9, 9); ctx.lineTo(14, 11);
      ctx.moveTo(23, 9); ctx.lineTo(18, 11);
      ctx.stroke();
    }
  }

  ['happy', 'neutral', 'sad', 'angry'].forEach(mood => {
    GF.sprites['pop_face_' + mood] = {
      frameWidth: SIZE, frameHeight: SIZE,
      originX: ORIGIN, originY: ORIGIN,
      animations: { idle: { fps: 1, loop: false, frames: [(ctx) => face(ctx, mood)] } },
    };
  });

  // Mayor crown
  GF.sprites.ui_crown = {
    frameWidth: SIZE, frameHeight: SIZE,
    originX: ORIGIN, originY: ORIGIN,
    animations: { idle: { fps: 1, loop: false, frames: [(ctx) => {
      ctx.fillStyle = '#ffd24a';
      ctx.beginPath();
      ctx.moveTo(6, 22); ctx.lineTo(8, 8); ctx.lineTo(13, 14); ctx.lineTo(16, 7);
      ctx.lineTo(19, 14); ctx.lineTo(24, 8); ctx.lineTo(26, 22);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#a26a3a';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(16, 12, 1.5, 0, Math.PI * 2); ctx.fill();
    }] } },
  };

  // Chance category cards
  const cardColor = {
    chance_card_economy   : { bg: '#5a3d8a', fg: '#e7c7ff', label: '$' },
    chance_card_population: { bg: '#3d6e4a', fg: '#d8ffe2', label: 'P' },
    chance_card_resource  : { bg: '#7a4e2a', fg: '#ffe7c0', label: 'R' },
    chance_card_weather   : { bg: '#1f3a5a', fg: '#9fc8ff', label: 'W' },
    chance_card_social    : { bg: '#7a2a4e', fg: '#ffb6c0', label: 'S' },
  };
  Object.keys(cardColor).forEach(name => {
    const p = cardColor[name];
    GF.sprites[name] = {
      frameWidth: SIZE, frameHeight: SIZE,
      originX: ORIGIN, originY: ORIGIN,
      animations: { idle: { fps: 1, loop: false, frames: [(ctx) => {
        ctx.fillStyle = p.bg;
        ctx.fillRect(2, 2, 28, 28);
        ctx.strokeStyle = p.fg;
        ctx.lineWidth = 2;
        ctx.strokeRect(3, 3, 26, 26);
        ctx.fillStyle = p.fg;
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.label, 16, 17);
      }] } },
    };
  });

})(window.GF = window.GF || {});
