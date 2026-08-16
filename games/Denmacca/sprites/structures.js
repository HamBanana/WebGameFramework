// GameFramework/games/Acca/sprites/structures.js
// Sprites for player structures (see Planning §5.10):
//   cell_shop, cell_toll_gate, cell_teleporter,
//   cell_house, cell_factory, cell_police_station, cell_vault
// Each uses the same 64×64 tile base as cells.js, then overlays a glyph.
// Origin is centered on the tile.

(function (GF) {
  'use strict';

  GF.sprites = GF.sprites || {};

  const SIZE = 64;
  const ORIGIN = SIZE / 2;

  const STRUCT_THEMES = {
    cell_shop          : { base: '#3d6e4a', trim: '#5fa078', accent: '#d8ffe2', glyph: 'shop'      },
    cell_toll_gate     : { base: '#7a4e2a', trim: '#b07a40', accent: '#ffe7c0', glyph: 'toll'      },
    cell_teleporter    : { base: '#3a3070', trim: '#6a55c4', accent: '#cdb6ff', glyph: 'teleporter'},
    cell_house         : { base: '#5a4c2a', trim: '#9a8240', accent: '#ffe7a8', glyph: 'house'     },
    cell_factory       : { base: '#4a4a4a', trim: '#7a7a7a', accent: '#dadada', glyph: 'factory'   },
    cell_police_station: { base: '#1f3d6e', trim: '#3a6db0', accent: '#cfe1ff', glyph: 'police'    },
    cell_vault         : { base: '#6e5a1f', trim: '#b08c40', accent: '#ffe7a8', glyph: 'vault'     },
  };

  // ── Tile base (matches cells.js look) ──────────────────────────────────
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

  // ── Glyph renderers (centered on ORIGIN) ────────────────────────────────
  function glyph_shop(ctx, theme) {
    const cx = ORIGIN, cy = ORIGIN;
    ctx.fillStyle = theme.accent;
    // Awning
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy - 6);
    ctx.lineTo(cx + 14, cy - 6);
    ctx.lineTo(cx + 12, cy - 2);
    ctx.lineTo(cx - 12, cy - 2);
    ctx.closePath();
    ctx.fill();
    // Body
    ctx.fillRect(cx - 11, cy - 2, 22, 12);
    // Door
    ctx.fillStyle = theme.base;
    ctx.fillRect(cx - 3, cy + 2, 6, 8);
    // $ sign
    ctx.fillStyle = theme.accent;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', cx, cy - 11);
  }

  function glyph_toll(ctx, theme) {
    const cx = ORIGIN, cy = ORIGIN;
    ctx.fillStyle = theme.accent;
    // Two posts
    ctx.fillRect(cx - 14, cy - 8, 4, 18);
    ctx.fillRect(cx + 10, cy - 8, 4, 18);
    // Crossbar
    ctx.fillRect(cx - 14, cy - 10, 28, 4);
    // Stripes on crossbar
    ctx.fillStyle = theme.base;
    ctx.fillRect(cx - 8, cy - 10, 4, 4);
    ctx.fillRect(cx, cy - 10, 4, 4);
    ctx.fillRect(cx + 8, cy - 10, 4, 4);
    // Sign
    ctx.fillStyle = theme.accent;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TOLL', cx, cy + 5);
  }

  function glyph_teleporter(ctx, theme) {
    const cx = ORIGIN, cy = ORIGIN;
    // Concentric rings
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    for (let r = 14; r >= 4; r -= 4) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Center dot
    ctx.fillStyle = theme.accent;
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function glyph_house(ctx, theme) {
    const cx = ORIGIN, cy = ORIGIN;
    ctx.fillStyle = theme.accent;
    // Roof
    ctx.beginPath();
    ctx.moveTo(cx, cy - 13);
    ctx.lineTo(cx - 14, cy - 1);
    ctx.lineTo(cx + 14, cy - 1);
    ctx.closePath();
    ctx.fill();
    // Body
    ctx.fillRect(cx - 11, cy - 1, 22, 13);
    // Door
    ctx.fillStyle = theme.base;
    ctx.fillRect(cx - 3, cy + 4, 6, 8);
    // Windows
    ctx.fillRect(cx - 8, cy + 2, 3, 3);
    ctx.fillRect(cx + 5, cy + 2, 3, 3);
  }

  function glyph_factory(ctx, theme) {
    const cx = ORIGIN, cy = ORIGIN;
    ctx.fillStyle = theme.accent;
    // Body
    ctx.fillRect(cx - 14, cy - 2, 28, 14);
    // Saw-tooth roof
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const sx = cx - 14 + i * 7;
      ctx.moveTo(sx, cy - 2);
      ctx.lineTo(sx + 3, cy - 8);
      ctx.lineTo(sx + 7, cy - 2);
    }
    ctx.fill();
    // Smokestack
    ctx.fillRect(cx + 8, cy - 14, 4, 8);
    // Smoke puff
    ctx.beginPath();
    ctx.arc(cx + 10, cy - 16, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function glyph_police(ctx, theme) {
    const cx = ORIGIN, cy = ORIGIN;
    // Shield
    ctx.fillStyle = theme.accent;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 14);
    ctx.lineTo(cx + 12, cy - 9);
    ctx.lineTo(cx + 12, cy + 2);
    ctx.quadraticCurveTo(cx + 12, cy + 12, cx, cy + 14);
    ctx.quadraticCurveTo(cx - 12, cy + 12, cx - 12, cy + 2);
    ctx.lineTo(cx - 12, cy - 9);
    ctx.closePath();
    ctx.fill();
    // Star
    ctx.fillStyle = theme.base;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', cx, cy);
  }

  function glyph_vault(ctx, theme) {
    const cx = ORIGIN, cy = ORIGIN;
    ctx.fillStyle = theme.accent;
    // Vault box
    ctx.fillRect(cx - 13, cy - 11, 26, 22);
    // Door panel
    ctx.fillStyle = theme.base;
    ctx.fillRect(cx - 9, cy - 7, 18, 14);
    // Combination dial
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = theme.accent;
    ctx.beginPath();
    ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // Tick marks
    ctx.fillRect(cx - 1, cy - 8, 2, 2);
    ctx.fillRect(cx + 5, cy - 1, 2, 2);
    ctx.fillRect(cx - 1, cy + 6, 2, 2);
    ctx.fillRect(cx - 7, cy - 1, 2, 2);
  }

  const GLYPH_FNS = {
    shop: glyph_shop,
    toll: glyph_toll,
    teleporter: glyph_teleporter,
    house: glyph_house,
    factory: glyph_factory,
    police: glyph_police,
    vault: glyph_vault,
  };

  // ── Build & register sprites ──────────────────────────────────────────
  Object.keys(STRUCT_THEMES).forEach(name => {
    const theme = STRUCT_THEMES[name];
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
