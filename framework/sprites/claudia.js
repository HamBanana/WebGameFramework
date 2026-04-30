// GameFramework/framework/sprites/claudia.js
// Framework-level character sprite: "claudia"
//
// Female counterpart to the "claude" sprite. Same frame layout / animation
// set so games can swap between the two without changing any animation
// names. Distinguishing visual features: long hair past the shoulders,
// pink hair-bow, A-line skirt instead of trousers.
//
// This file owns the asset path for the Claudia spritesheet so that games
// only have to reference the sprite by NAME — no asset paths leak into
// game code or GAME_CONFIG.js.
//
// Animations available on the "claudia" sprite:
//   idle      — 8 frames, looping
//   walk_s    — 8 frames, looping (south / facing camera)
//   walk_n    — 8 frames, looping (north / facing away)
//   walk_e    — 8 frames, looping (east  / facing right)
//   walk_w    — 8 frames, looping (west  / facing left)
//   walk_se   — 8 frames, looping
//   walk_sw   — 8 frames, looping
//   walk_ne   — 8 frames, looping
//   walk_nw   — 8 frames, looping
//   scared    — 8 frames, looping
//   excited   — 8 frames, looping
//
// Each frame is 32 × 48 px. Origin is feet-center (16, 48) so positions
// passed to the animator's draw(ctx, x, y) place the character's feet at (x, y).

(function (GF) {
  'use strict';

  GF.sprites = GF.sprites || {};

  // ── Asset path (private to framework) ──────────────────────────────────────
  // Resolved relative to the host HTML page. By convention games live at
  // games/<name>/index.html, so the spritesheet at /Sprites/Claudia/ is two
  // directories up.
  const SPRITESHEET_PATH = '../../Sprites/Claudia/spritesheet.png';

  const FRAME_W   = 32;
  const FRAME_H   = 48;
  const ORIGIN_X  = 16;   // feet-center horizontally
  const ORIGIN_Y  = 48;   // feet-center vertically (bottom of frame)

  // Each row of the spritesheet maps to one animation, in this order:
  const ANIMATION_ROWS = [
    'idle',     // y =   0
    'walk_s',   // y =  48
    'walk_n',   // y =  96
    'walk_e',   // y = 144
    'walk_w',   // y = 192
    'walk_se',  // y = 240
    'walk_sw',  // y = 288
    'walk_ne',  // y = 336
    'walk_nw',  // y = 384
    'scared',   // y = 432
    'excited',  // y = 480
  ];
  const FRAMES_PER_ANIM = 8;

  // ── Image loading ──────────────────────────────────────────────────────────
  const image = new Image();
  image.src = SPRITESHEET_PATH;
  let loaded = false;
  image.addEventListener('load',  () => { loaded = true;  });
  image.addEventListener('error', () => {
    console.warn(`[claudia sprite] failed to load spritesheet at ${SPRITESHEET_PATH}`);
  });

  // ── Build a draw function for one cell of the spritesheet ──────────────────
  function makeFrameDrawer(sx, sy) {
    return function (ctx) {
      // If the image hasn't loaded yet, draw a discreet placeholder block so
      // sprite consumers still have something to render.
      if (!loaded) {
        ctx.fillStyle = '#644';
        ctx.fillRect(2, 2, FRAME_W - 4, FRAME_H - 4);
        return;
      }
      // Pixel-perfect blit. Imaging smoothing is left to the caller.
      ctx.drawImage(image, sx, sy, FRAME_W, FRAME_H, 0, 0, FRAME_W, FRAME_H);
    };
  }

  function makeAnimationFrames(rowIndex) {
    const sy = rowIndex * FRAME_H;
    const frames = [];
    for (let i = 0; i < FRAMES_PER_ANIM; i++) {
      frames.push(makeFrameDrawer(i * FRAME_W, sy));
    }
    return frames;
  }

  // ── Default tempo (frames per second) per animation tag ────────────────────
  const DEFAULT_FPS = {
    idle    :  6,
    walk_s  : 12,
    walk_n  : 12,
    walk_e  : 12,
    walk_w  : 12,
    walk_se : 12,
    walk_sw : 12,
    walk_ne : 12,
    walk_nw : 12,
    scared  :  8,
    excited :  9,
  };

  const animations = {};
  ANIMATION_ROWS.forEach((name, idx) => {
    animations[name] = {
      fps   : DEFAULT_FPS[name] || 10,
      loop  : true,
      frames: makeAnimationFrames(idx),
    };
  });

  // ── Register under the public name "claudia" ──────────────────────────────
  GF.sprites['claudia'] = {
    frameWidth : FRAME_W,
    frameHeight: FRAME_H,
    originX    : ORIGIN_X,
    originY    : ORIGIN_Y,
    animations : animations,
  };

})(window.GF = window.GF || {});
