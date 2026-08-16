// GameFramework/games/Acca/sprites/cells.js
// Board cell sprites — five types:
//   cell_normal    — plain landable square
//   cell_start     — starting square
//   cell_chance    — random event
//   cell_market    — buy resources
//   cell_property  — purchasable property
//
// Origin is the visual center of the cell, so the SpriteSystem can draw a
// cell tile centered on a grid coordinate.

(function (GF) {
  'use strict';

  GF.sprites = GF.sprites || {};

  const SIZE = 64;
  const ORIGIN = SIZE / 2;

  // Per-type palettes. base = floor color; trim = inset rim; accent = symbol.
  const CELL_THEMES = {
    cell_normal  : { base: '#3b4a59', trim: '#5d7185', accent: '#7d92a8', icon: null    },
    cell_start   : { base: '#1f6b3a', trim: '#2f9c54', accent: '#a6f4c5', icon: 'star'  },
    cell_chance  : { base: '#5a3d8a', trim: '#8455c4', accent: '#e7c7ff', icon: 'q'     },
    cell_market  : { base: '#8a5a1f', trim: '#c4862f', accent: '#ffe2a8', icon: 'cart'  },
    cell_property: { base: '#3a527a', trim: '#5b7ba8', accent: '#cfdcef', icon: 'house' },
  };

  // ── Drawing helpers ────────────────────────────────────────────────────────
  function drawTile(ctx, theme) {
    // Outer floor
    ctx.fillStyle = theme.base;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Inset rim (lighter top/left, darker bottom/right)
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, 0, SIZE, 2);
    ctx.fillRect(0, 0, 2, SIZE);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, SIZE - 2, SIZE, 2);
    ctx.fillRect(SIZE - 2, 0, 2, SIZE);

    // Trim border
    ctx.strokeStyle = theme.trim;
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 4, SIZE - 8, SIZE - 8);

    // Subtle dot pattern in corners
    ctx.fillStyle = theme.trim;
    [[8, 8], [SIZE - 9, 8], [8, SIZE - 9], [SIZE - 9, SIZE - 9]].forEach(([x, y]) => {
      ctx.fillRect(x, y, 2, 2);
    });
  }

  // ── Icon renderers (centered around ORIGIN) ────────────────────────────────
  function drawIcon(ctx, type, theme) {
    const cx = ORIGIN, cy = ORIGIN;
    ctx.save();
    ctx.fillStyle = theme.accent;
    ctx.strokeStyle = theme.accent;

    switch (type) {
      case 'star': drawStar(ctx, cx, cy, 11, 5, theme); break;
      case 'q'   : drawQuestionMark(ctx, cx, cy, theme); break;
      case 'cart': drawCart(ctx, cx, cy, theme); break;
      case 'house': drawHouse(ctx, cx, cy, theme); break;
    }

    ctx.restore();
  }

  function drawStar(ctx, cx, cy, outer, points, theme) {
    const inner = outer * 0.45;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = (i % 2 === 0) ? outer : inner;
      const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = theme.accent;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawQuestionMark(ctx, cx, cy, theme) {
    ctx.fillStyle = theme.accent;
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', cx, cy);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeText('?', cx, cy);
  }

  function drawCart(ctx, cx, cy, theme) {
    ctx.fillStyle = theme.accent;
    // Cart body
    ctx.fillRect(cx - 11, cy - 7, 22, 10);
    // Cart top rim
    ctx.fillRect(cx - 13, cy - 9, 26, 2);
    // Wheels
    ctx.beginPath();
    ctx.arc(cx - 7, cy + 6, 2.5, 0, Math.PI * 2);
    ctx.arc(cx + 7, cy + 6, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Handle
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + 11, cy - 7);
    ctx.lineTo(cx + 15, cy - 11);
    ctx.stroke();
  }

  function drawHouse(ctx, cx, cy, theme) {
    ctx.fillStyle = theme.accent;
    // Roof
    ctx.beginPath();
    ctx.moveTo(cx, cy - 11);
    ctx.lineTo(cx - 12, cy - 1);
    ctx.lineTo(cx + 12, cy - 1);
    ctx.closePath();
    ctx.fill();
    // Body
    ctx.fillRect(cx - 9, cy - 1, 18, 11);
    // Door
    ctx.fillStyle = theme.base;
    ctx.fillRect(cx - 2, cy + 3, 4, 7);
    // Window
    ctx.fillRect(cx - 7, cy + 2, 3, 3);
    ctx.fillRect(cx + 4, cy + 2, 3, 3);
  }

  // ── Build & register a single-frame "idle" sprite per cell type ────────────
  Object.keys(CELL_THEMES).forEach(name => {
    const theme = CELL_THEMES[name];
    const frame = (ctx) => {
      drawTile(ctx, theme);
      if (theme.icon) drawIcon(ctx, theme.icon, theme);
    };

    GF.sprites[name] = {
      frameWidth : SIZE,
      frameHeight: SIZE,
      originX    : ORIGIN,
      originY    : ORIGIN,
      animations : {
        idle: { fps: 1, loop: false, frames: [frame] },
      },
    };
  });

})(window.GF = window.GF || {});
