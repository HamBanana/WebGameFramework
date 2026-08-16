// GameFramework/games/Acca/sprites/cells_extra.js
// Extended board cell sprites — additional landable square types used by maps
// beyond the five base cells in cells.js:
//
//   cell_power_plant — power plant resource cell
//   cell_well        — water well resource cell
//   cell_mine        — generic mine cell
//   cell_mine_coal   — coal mine cell
//   cell_mine_iron   — iron mine cell
//   cell_mine_oil    — oil rig cell (mine sub-type)
//   cell_forest      — forest resource cell (yields wood)
//   cell_farm        — farm resource cell (yields food)
//   cell_oil_rig     — oil rig resource cell (yields oil)
//
// Same 64×64 tile base as cells.js / structures.js; origin centered.

(function (GF) {
  'use strict';

  GF.sprites = GF.sprites || {};

  const SIZE = 64;
  const ORIGIN = SIZE / 2;

  const EXTRA_THEMES = {
    cell_power_plant: { base: '#5a4a1f', trim: '#b08c40', accent: '#ffe57a', glyph: 'power'  },
    cell_well       : { base: '#1f3a5a', trim: '#3a6db0', accent: '#9fd6ff', glyph: 'well'   },
    cell_mine       : { base: '#2a2a2a', trim: '#6a6a6a', accent: '#cfcfcf', glyph: 'mine'   },
    cell_mine_coal  : { base: '#1a1a1a', trim: '#5a5a5a', accent: '#b8b8b8', glyph: 'mine'   },
    cell_mine_iron  : { base: '#3a4a5a', trim: '#7a8aa0', accent: '#cfdde9', glyph: 'mine'   },
    cell_mine_oil   : { base: '#1a0a1f', trim: '#5a4ada', accent: '#b6a8ff', glyph: 'oil'    },
    cell_forest     : { base: '#1a3d20', trim: '#3a8a4a', accent: '#7ed87e', glyph: 'forest' },
    cell_farm       : { base: '#3a5018', trim: '#8ab030', accent: '#d8e870', glyph: 'farm'   },
    cell_oil_rig    : { base: '#0f0a20', trim: '#4a30a0', accent: '#c0a0ff', glyph: 'oil'    },
  };

  // ── Tile base (matches cells.js / structures.js look) ─────────────────────
  function drawTile(ctx, theme) {
    ctx.fillStyle = theme.base;
    ctx.fillRect(0, 0, SIZE, SIZE);

    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(0, 0, SIZE, 2);
    ctx.fillRect(0, 0, 2, SIZE);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, SIZE - 2, SIZE, 2);
    ctx.fillRect(SIZE - 2, 0, 2, SIZE);

    ctx.strokeStyle = theme.trim;
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 4, SIZE - 8, SIZE - 8);
  }

  // ── Glyphs (centered on ORIGIN) ─────────────────────────────────────────
  function glyph_power(ctx, theme) {
    const cx = ORIGIN, cy = ORIGIN;
    ctx.fillStyle = theme.accent;
    // Lightning bolt
    ctx.beginPath();
    ctx.moveTo(cx + 2, cy - 14);
    ctx.lineTo(cx - 8, cy + 2);
    ctx.lineTo(cx - 2, cy + 2);
    ctx.lineTo(cx - 5, cy + 14);
    ctx.lineTo(cx + 8, cy - 4);
    ctx.lineTo(cx + 2, cy - 4);
    ctx.lineTo(cx + 5, cy - 14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function glyph_well(ctx, theme) {
    const cx = ORIGIN, cy = ORIGIN;
    // Well shaft (stone ring)
    ctx.fillStyle = theme.accent;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Inner water (darker)
    ctx.fillStyle = theme.base;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wooden frame posts
    ctx.fillStyle = theme.accent;
    ctx.fillRect(cx - 11, cy - 12, 3, 16);
    ctx.fillRect(cx + 8, cy - 12, 3, 16);
    // Roof
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy - 10);
    ctx.lineTo(cx, cy - 16);
    ctx.lineTo(cx + 14, cy - 10);
    ctx.closePath();
    ctx.fill();
    // Bucket rope
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx, cy);
    ctx.stroke();
  }

  function glyph_mine(ctx, theme) {
    const cx = ORIGIN, cy = ORIGIN;
    ctx.fillStyle = theme.accent;
    // Mountain / mine entrance silhouette
    ctx.beginPath();
    ctx.moveTo(cx - 16, cy + 10);
    ctx.lineTo(cx - 4, cy - 10);
    ctx.lineTo(cx + 2, cy - 4);
    ctx.lineTo(cx + 8, cy - 12);
    ctx.lineTo(cx + 16, cy + 10);
    ctx.closePath();
    ctx.fill();
    // Mine entrance arch
    ctx.fillStyle = theme.base;
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy + 10);
    ctx.lineTo(cx - 5, cy + 2);
    ctx.quadraticCurveTo(cx, cy - 4, cx + 5, cy + 2);
    ctx.lineTo(cx + 5, cy + 10);
    ctx.closePath();
    ctx.fill();
    // Crossed pickaxes above
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 9, cy - 14);
    ctx.lineTo(cx + 9, cy - 6);
    ctx.moveTo(cx + 9, cy - 14);
    ctx.lineTo(cx - 9, cy - 6);
    ctx.stroke();
  }

  function glyph_oil(ctx, theme) {
    const cx = ORIGIN, cy = ORIGIN;
    ctx.fillStyle = theme.accent;
    // Derrick (triangle)
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy + 12);
    ctx.lineTo(cx, cy - 14);
    ctx.lineTo(cx + 12, cy + 12);
    ctx.closePath();
    ctx.fill();
    // Crossbars
    ctx.fillStyle = theme.base;
    ctx.fillRect(cx - 9, cy + 4, 18, 2);
    ctx.fillRect(cx - 7, cy - 2, 14, 2);
    ctx.fillRect(cx - 5, cy - 8, 10, 2);
    // Oil drop
    ctx.fillStyle = theme.accent;
    ctx.beginPath();
    ctx.arc(cx, cy + 14, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function glyph_forest(ctx, theme) {
    const cx = ORIGIN, cy = ORIGIN;
    ctx.fillStyle = theme.accent;
    // Three overlapping trees: back-left, back-right, front-center.
    function drawTree(tx, ty, w, h) {
      ctx.beginPath();
      ctx.moveTo(tx, ty - h);
      ctx.lineTo(tx - w, ty);
      ctx.lineTo(tx + w, ty);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(tx - 2, ty, 4, 5);
    }
    ctx.globalAlpha = 0.65;
    drawTree(cx - 8, cy + 4, 9, 14);
    drawTree(cx + 8, cy + 4, 9, 14);
    ctx.globalAlpha = 1;
    drawTree(cx, cy + 6, 11, 16);
    ctx.globalAlpha = 1;
  }

  function glyph_farm(ctx, theme) {
    const cx = ORIGIN, cy = ORIGIN;
    ctx.fillStyle = theme.accent;
    // Wheat stalks — five vertical stems with grain heads.
    const stalks = [-10, -5, 0, 5, 10];
    stalks.forEach(ox => {
      const x = cx + ox;
      // Stem
      ctx.fillRect(x - 1, cy - 2, 2, 14);
      // Grain head (tapered rectangle)
      ctx.beginPath();
      ctx.moveTo(x, cy - 14);
      ctx.lineTo(x - 3, cy - 6);
      ctx.lineTo(x + 3, cy - 6);
      ctx.closePath();
      ctx.fill();
    });
    // Ground line
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(cx - 14, cy + 12, 28, 2);
  }

  const GLYPH_FNS = {
    power : glyph_power,
    well  : glyph_well,
    mine  : glyph_mine,
    oil   : glyph_oil,
    forest: glyph_forest,
    farm  : glyph_farm,
  };

  // ── Build & register sprites ────────────────────────────────────────────
  Object.keys(EXTRA_THEMES).forEach(name => {
    const theme = EXTRA_THEMES[name];
    const draw = GLYPH_FNS[theme.glyph];
    const frame = (ctx) => {
      drawTile(ctx, theme);
      if (draw) draw(ctx, theme);
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
